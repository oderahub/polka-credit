"use client";

import { useEffect, useState } from "react";
import {
  type CreditQuote,
  erc20PrecompileAddressFromAssetId,
  type EligibilityResult,
  type IssuedCertificate,
  POLKADOT_HUB_TESTNET,
  type ReputationProofPayload,
  SCORE_LABELS,
  type ScoreTier,
  type VerificationStatus,
} from "@polkazk/shared";
import { createPublicClient, createWalletClient, custom, getAddress, http } from "viem";
import { creditScoreAbi, governanceVerifierAdapterAbi, lendingDemoAbi } from "./contracts";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
    };
  }
}

const fallbackWalletAddress = "0x1111111111111111111111111111111111111111" as const;
const scoreTokenAddress = getAddress(
  process.env.NEXT_PUBLIC_SCORE_TOKEN_ADDRESS ?? "0x86aadce8f673Ef9D332F1b027D71a0C8f22294B0",
);
const adapterAddress = getAddress(
  process.env.NEXT_PUBLIC_ADAPTER_ADDRESS ?? "0x9BBf0251BB9CD128c7dcE0474cF016D618D5749C",
);
const lendingDemoAddress = getAddress(
  process.env.NEXT_PUBLIC_LENDING_DEMO_ADDRESS ?? "0x287974951879D77AdEcd8B115D2d16ef396B464c",
);
const systemPrecompileAddress = getAddress(
  process.env.NEXT_PUBLIC_SYSTEM_PRECOMPILE_ADDRESS ?? "0x0000000000000000000000000000000000000900",
);
const nativeAssetId = BigInt(process.env.NEXT_PUBLIC_QUOTE_ASSET_ID ?? "1984");
const nativeAssetAddress = erc20PrecompileAddressFromAssetId(nativeAssetId);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? POLKADOT_HUB_TESTNET.rpcUrl;
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? POLKADOT_HUB_TESTNET.chainId);

const baseQuote: CreditQuote = {
  score: 0n,
  aprBps: 1200n,
  maxBorrowAmount: 1000n,
  nativeAssetBalance: 2500n,
  nativeAssetTotalSupply: 250000n,
};

type LiveQuoteStruct = {
  score: bigint;
  aprBps: bigint;
  maxBorrowAmount: bigint;
  nativeAssetBalance: bigint;
  nativeAssetTotalSupply: bigint;
};

function formatPercent(bps: bigint) {
  return `${Number(bps) / 100}%`;
}

function formatTokenAmount(amount: bigint) {
  return `${amount.toString()} UNIT`;
}

function buildPayload(claimant: `0x${string}` = fallbackWalletAddress): ReputationProofPayload {
  return {
    claimant,
    proof: "0x",
    publicInputs: "0x",
    context: "0x",
  };
}

function scoreTierFromScore(score: bigint): ScoreTier {
  if (score >= 700n) return 3;
  if (score >= 500n) return 2;
  if (score >= 300n) return 1;
  return 0;
}

export function DashboardClient() {
  const [walletAddress, setWalletAddress] = useState<string>(fallbackWalletAddress);
  const [walletConnected, setWalletConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scoreHasToken, setScoreHasToken] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("idle");
  const [proofPayload, setProofPayload] = useState<ReputationProofPayload>(buildPayload());
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [issuedCertificate, setIssuedCertificate] = useState<IssuedCertificate | null>(null);
  const [quote, setQuote] = useState<CreditQuote>(baseQuote);
  const [activityLog, setActivityLog] = useState<string[]>([
    "Live contracts are deployed on Polkadot Hub Testnet.",
    "Eligibility now comes from a deterministic governance snapshot, not user-selected tiers.",
  ]);

  const currentScoreTier = scoreTierFromScore(quote.score);
  const previousQuote = baseQuote;
  const publicClient = createPublicClient({
    transport: http(rpcUrl),
  });

  useEffect(() => {
    void refreshLiveState(walletAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      setActivityLog((current) => [
        "No injected wallet found. Install MetaMask or Talisman for live transactions.",
        ...current,
      ]);
      return;
    }

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      const account = getAddress(accounts[0]);
      setWalletAddress(account);
      setWalletConnected(true);
      setProofPayload(buildPayload(account as `0x${string}`));
      setEligibility(null);
      setIssuedCertificate(null);
      setActivityLog((current) => [
        `Connected wallet ${account} on chain ${chainId}.`,
        ...current,
      ]);
      await refreshLiveState(account);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown wallet error";
      setActivityLog((current) => [`Wallet connection failed: ${message}`, ...current]);
    }
  }

  async function refreshLiveState(address: string) {
    setIsRefreshing(true);
    try {
      const [score, hasToken, liveQuoteRaw] = await Promise.all([
        publicClient.readContract({
          address: scoreTokenAddress,
          abi: creditScoreAbi,
          functionName: "getScore",
          args: [address as `0x${string}`],
        }),
        publicClient.readContract({
          address: scoreTokenAddress,
          abi: creditScoreAbi,
          functionName: "hasToken",
          args: [address as `0x${string}`],
        }),
        publicClient.readContract({
          address: lendingDemoAddress,
          abi: lendingDemoAbi,
          functionName: "quoteFor",
          args: [address as `0x${string}`],
        }),
      ]);

      const liveQuote = liveQuoteRaw as LiveQuoteStruct;

      const nextQuote: CreditQuote = {
        score: liveQuote.score,
        aprBps: liveQuote.aprBps,
        maxBorrowAmount: liveQuote.maxBorrowAmount,
        nativeAssetBalance: liveQuote.nativeAssetBalance,
        nativeAssetTotalSupply: liveQuote.nativeAssetTotalSupply,
      };

      setQuote(nextQuote);
      setScoreHasToken(hasToken);
      setActivityLog((current) => [
        `Live quote refreshed for ${address}. Current score: ${score.toString()}.`,
        ...current,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown RPC error";
      setActivityLog((current) => [`Live refresh failed: ${message}`, ...current]);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleCheckEligibility() {
    if (!walletConnected) {
      setActivityLog((current) => ["Connect a wallet before checking eligibility.", ...current]);
      return;
    }

    setVerificationStatus("submitting");
    setActivityLog((current) => [
      `Checking governance snapshot eligibility for ${walletAddress}.`,
      ...current,
    ]);

    try {
      const response = await fetch(`/api/eligibility?address=${walletAddress}`, { cache: "no-store" });
      const nextEligibility = (await response.json()) as EligibilityResult;
      setEligibility(nextEligibility);
      setIssuedCertificate(null);
      setProofPayload(buildPayload(walletAddress as `0x${string}`));
      setVerificationStatus(nextEligibility.eligible ? "success" : "error");
      setActivityLog((current) => [
        nextEligibility.reason,
        nextEligibility.eligible
          ? `Snapshot issued tier ${nextEligibility.tier} for ${walletAddress}.`
          : `No eligible governance tier found for ${walletAddress}.`,
        ...current,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown eligibility error";
      setVerificationStatus("error");
      setActivityLog((current) => [`Eligibility lookup failed: ${message}`, ...current]);
    }
  }

  async function handleSubmitProof() {
    if (!eligibility?.eligible || eligibility.tier === 0) {
      setVerificationStatus("error");
      setActivityLog((current) => [
        "Check eligibility first. A certificate is only issued for an earned governance tier.",
        ...current,
      ]);
      return;
    }

    setVerificationStatus("submitting");
    setActivityLog((current) => [
      `Requesting tier ${eligibility.tier} snapshot certificate from the attester service.`,
      ...current,
    ]);

    if (!window.ethereum) {
      setVerificationStatus("error");
      setActivityLog((current) => [
        "No injected wallet found for live certificate submission.",
        ...current,
      ]);
      return;
    }

    try {
      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });

      const [account] = await walletClient.getAddresses();
      const claimant = getAddress(account);
      const currentVerifier = await publicClient.readContract({
        address: adapterAddress,
        abi: governanceVerifierAdapterAbi,
        functionName: "verifier",
      });
      const certificateResponse = await fetch("/api/certificate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: claimant,
          verifierAddress: currentVerifier,
          chainId,
        }),
      });
      const certificateBody = (await certificateResponse.json()) as IssuedCertificate | { error: string };
      if (!certificateResponse.ok || "error" in certificateBody) {
        throw new Error("error" in certificateBody ? certificateBody.error : "Certificate issuance failed.");
      }
      const livePayload = certificateBody;
      setIssuedCertificate(livePayload);
      setProofPayload(livePayload);

      const hash = await walletClient.writeContract({
        account: claimant,
        address: adapterAddress,
        abi: governanceVerifierAdapterAbi,
        functionName: "submitProof",
        args: [livePayload],
        chain: undefined,
      });

      setVerificationStatus("success");
      setActivityLog((current) => [
        `Certificate transaction submitted: ${hash}.`,
        `Snapshot attester issued tier ${livePayload.tier} and the verifier accepted it on-chain.`,
        ...current,
      ]);
      await refreshLiveState(claimant);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown submission error";
      setVerificationStatus("error");
      setActivityLog((current) => [
        `Live certificate submission failed: ${message}`,
        "The live demo path expects the adapter to point at the attested snapshot verifier and the web app to have an attester key configured.",
        ...current,
      ]);
    }
  }

  const statusTone =
    verificationStatus === "success"
      ? "#9ef0ae"
      : verificationStatus === "submitting"
        ? "#ffd36f"
        : verificationStatus === "error"
          ? "#ff8d8d"
          : "#9bb4cf";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px 72px",
        background:
          "radial-gradient(circle at top left, rgba(41, 128, 185, 0.25), transparent 26%), radial-gradient(circle at top right, rgba(255, 207, 102, 0.18), transparent 22%), #07111f",
        color: "#f4f7fb",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, letterSpacing: "0.18em", textTransform: "uppercase", color: "#91b6d8" }}>
              PolkaZK Credit
            </p>
            <h1 style={{ fontSize: "3.2rem", lineHeight: 1, margin: "14px 0 12px", maxWidth: 720 }}>
              Track 2 dashboard for private reputation certificates, soulbound score issuance, and asset-aware lending quotes.
            </h1>
            <p style={{ margin: 0, maxWidth: 720, color: "#c9d7e6", fontSize: "1.06rem" }}>
              This UI mirrors the contract flow already implemented: private reputation certificate
              submission into the verifier adapter, score issuance through the SBT, and quote refresh
              through the lending contract. The current deployment path targets Polkadot Hub EVM/REVM
              while using Track 2-native precompile and native asset patterns.
            </p>
          </div>
          <div
            style={{
              minWidth: 280,
              padding: 18,
              background: "rgba(8, 17, 30, 0.78)",
              border: "1px solid #1b3551",
              alignSelf: "flex-start",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "#8fb4d8", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Connected Wallet
            </div>
            <div style={{ marginTop: 10, fontFamily: "monospace", wordBreak: "break-all" }}>{walletAddress}</div>
            <div style={{ marginTop: 14, color: "#9bb4cf", fontSize: "0.95rem" }}>
              Status:
              <span style={{ color: statusTone, marginLeft: 8 }}>
                {walletConnected ? (verificationStatus === "idle" ? "Ready" : verificationStatus) : "Disconnected"}
              </span>
            </div>
            <button
              type="button"
              onClick={connectWallet}
              style={{
                marginTop: 14,
                padding: "10px 12px",
                border: "1px solid #355781",
                background: "#0d1b2e",
                color: "#e9f0f8",
                cursor: "pointer",
              }}
            >
              {walletConnected ? "Reconnect wallet" : "Connect wallet"}
            </button>
            <button
              type="button"
              onClick={() => void refreshLiveState(walletAddress)}
              style={{
                marginTop: 10,
                padding: "10px 12px",
                border: "1px solid #355781",
                background: "#0d1b2e",
                color: "#e9f0f8",
                cursor: "pointer",
              }}
            >
              {isRefreshing ? "Refreshing..." : "Refresh live state"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 22,
            gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, 0.9fr)",
            marginTop: 34,
          }}
        >
          <section style={{ display: "grid", gap: 22 }}>
            <article style={{ padding: 22, background: "rgba(10, 19, 32, 0.78)", border: "1px solid #18314e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0 }}>Eligibility And Certificate</h2>
                  <p style={{ margin: "10px 0 0", color: "#b7cadf" }}>
                    Check whether the connected wallet appears in the governance snapshot, then submit
                    the attester-issued certificate for the earned tier only.
                  </p>
                </div>
                <div
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #284d75",
                    color: "#97c0ec",
                    fontSize: "0.9rem",
                    alignSelf: "flex-start",
                  }}
                >
                  System precompile: {systemPrecompileAddress}
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  background: "rgba(8, 16, 28, 0.65)",
                  border: "1px solid #24415f",
                  color: "#c4d6e9",
                }}
              >
                <div style={{ color: "#98bedf", textTransform: "uppercase", fontSize: "0.85rem" }}>
                  Snapshot status
                </div>
                <div style={{ marginTop: 10 }}>
                  {eligibility
                    ? eligibility.eligible
                      ? `Eligible tier ${eligibility.tier} from ${eligibility.participationCount} governance events.`
                      : eligibility.reason
                    : "No snapshot lookup yet. Connect a wallet and check eligibility."}
                </div>
                {eligibility ? (
                  <div style={{ marginTop: 12, display: "grid", gap: 6, fontSize: "0.95rem" }}>
                    <div>Source: {eligibility.source}</div>
                    <div>Dataset: <span style={{ fontFamily: "monospace" }}>{eligibility.datasetId}</span></div>
                    <div>Conviction bucket: {eligibility.convictionBucket}</div>
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
                {issuedCertificate ? (
                  <div
                    style={{
                      padding: 14,
                      background: "rgba(7, 16, 29, 0.8)",
                      border: "1px solid #213d5d",
                      color: "#c5d7e8",
                    }}
                  >
                    <div style={{ color: "#8fb4d8", fontSize: "0.85rem", textTransform: "uppercase" }}>
                      Issued certificate
                    </div>
                    <div style={{ marginTop: 8 }}>Tier {issuedCertificate.tier}</div>
                    <div>Issued by <span style={{ fontFamily: "monospace" }}>{issuedCertificate.issuedBy}</span></div>
                    <div>Dataset <span style={{ fontFamily: "monospace" }}>{issuedCertificate.datasetId}</span></div>
                    <div>Source {issuedCertificate.source}</div>
                  </div>
                ) : null}
                <label>
                  <div style={{ marginBottom: 6, color: "#8fb4d8" }}>Certificate payload</div>
                  <textarea
                    readOnly
                    value={proofPayload.proof}
                    style={{
                      width: "100%",
                      minHeight: 76,
                      background: "#08101c",
                      color: "#e5eef9",
                      border: "1px solid #23415f",
                      padding: 12,
                      fontFamily: "monospace",
                    }}
                  />
                </label>
                <label>
                  <div style={{ marginBottom: 6, color: "#8fb4d8" }}>Public inputs</div>
                  <textarea
                    readOnly
                    value={proofPayload.publicInputs}
                    style={{
                      width: "100%",
                      minHeight: 76,
                      background: "#08101c",
                      color: "#e5eef9",
                      border: "1px solid #23415f",
                      padding: 12,
                      fontFamily: "monospace",
                    }}
                  />
                </label>
                <label>
                  <div style={{ marginBottom: 6, color: "#8fb4d8" }}>Context</div>
                  <input
                    readOnly
                    value={proofPayload.context}
                    style={{
                      width: "100%",
                      background: "#08101c",
                      color: "#e5eef9",
                      border: "1px solid #23415f",
                      padding: 12,
                      fontFamily: "monospace",
                    }}
                  />
                </label>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => void handleCheckEligibility()}
                  disabled={verificationStatus === "submitting" || !walletConnected}
                  style={{
                    padding: "14px 18px",
                    background:
                      verificationStatus === "submitting" || !walletConnected ? "#284259" : "#8cc0f7",
                    border: "none",
                    color: "#08111d",
                    fontWeight: 700,
                    cursor: verificationStatus === "submitting" ? "wait" : !walletConnected ? "not-allowed" : "pointer",
                  }}
                >
                  Check eligibility
                </button>
                <button
                  type="button"
                  onClick={handleSubmitProof}
                  disabled={verificationStatus === "submitting" || !walletConnected || !eligibility?.eligible}
                  style={{
                    padding: "14px 18px",
                    background:
                      verificationStatus === "submitting" || !walletConnected || !eligibility?.eligible
                        ? "#695826"
                        : "#e1b24a",
                    border: "none",
                    color: "#08111d",
                    fontWeight: 700,
                    cursor:
                      verificationStatus === "submitting" || !walletConnected || !eligibility?.eligible
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {verificationStatus === "submitting" ? "Submitting..." : "Submit certificate"}
                </button>
                <div style={{ alignSelf: "center", color: "#b7cadf" }}>
                  Claimant: <span style={{ fontFamily: "monospace" }}>{proofPayload.claimant}</span>
                </div>
              </div>
            </article>

            <article style={{ padding: 22, background: "rgba(10, 19, 32, 0.78)", border: "1px solid #18314e" }}>
              <h2 style={{ marginTop: 0 }}>Activity Feed</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {activityLog.map((entry) => (
                  <div key={entry} style={{ padding: 12, border: "1px solid #203b58", background: "rgba(7, 16, 29, 0.8)" }}>
                    {entry}
                  </div>
                ))}
              </div>
            </article>
          </section>

          <aside style={{ display: "grid", gap: 22 }}>
            <article style={{ padding: 22, background: "rgba(10, 19, 32, 0.78)", border: "1px solid #18314e" }}>
              <h2 style={{ marginTop: 0 }}>Score Token</h2>
              <div style={{ color: "#8fb4d8", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.12em" }}>
                Soulbound status
              </div>
              <div style={{ fontSize: "2.4rem", marginTop: 10 }}>{quote.score.toString()}</div>
              <div style={{ marginTop: 8, color: "#c1d4e8" }}>{SCORE_LABELS[currentScoreTier]}</div>
              <div style={{ marginTop: 16, color: "#9db7d0" }}>
                Token ID is derived from the connected address and transfers are disabled.
              </div>
              <div style={{ marginTop: 10, color: "#9db7d0" }}>
                Live token state: {scoreHasToken ? "score token minted" : "no score token yet"}
              </div>
            </article>

            <article style={{ padding: 22, background: "rgba(10, 19, 32, 0.78)", border: "1px solid #18314e" }}>
              <h2 style={{ marginTop: 0 }}>Lending Quote</h2>
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ padding: 14, background: "rgba(7, 16, 29, 0.8)", border: "1px solid #213d5d" }}>
                  <div style={{ color: "#8fb4d8", fontSize: "0.85rem", textTransform: "uppercase" }}>Before certificate</div>
                  <div style={{ marginTop: 8 }}>APR {formatPercent(previousQuote.aprBps)}</div>
                  <div>Borrow cap {formatTokenAmount(previousQuote.maxBorrowAmount)}</div>
                </div>
                <div style={{ padding: 14, background: "rgba(7, 16, 29, 0.8)", border: "1px solid #213d5d" }}>
                  <div style={{ color: "#8fb4d8", fontSize: "0.85rem", textTransform: "uppercase" }}>After certificate</div>
                  <div style={{ marginTop: 8 }}>APR {formatPercent(quote.aprBps)}</div>
                  <div>Borrow cap {formatTokenAmount(quote.maxBorrowAmount)}</div>
                </div>
                <div style={{ padding: 14, background: "rgba(7, 16, 29, 0.8)", border: "1px solid #213d5d" }}>
                  <div style={{ color: "#8fb4d8", fontSize: "0.85rem", textTransform: "uppercase" }}>Native asset path</div>
                  <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: "0.9rem", wordBreak: "break-all" }}>
                    {nativeAssetAddress}
                  </div>
                  <div style={{ marginTop: 10, color: "#9db7d0" }}>Asset ID {nativeAssetId.toString()} mapped to deterministic ERC20 precompile address.</div>
                  <div style={{ marginTop: 10 }}>User balance {formatTokenAmount(quote.nativeAssetBalance)}</div>
                  <div>Total supply {formatTokenAmount(quote.nativeAssetTotalSupply)}</div>
                  <div style={{ marginTop: 10, color: "#9db7d0" }}>
                    ERC20 metadata methods are not assumed here because the precompile does not expose
                    `name`, `symbol`, or `decimals`.
                  </div>
                </div>
              </div>
            </article>

            <article style={{ padding: 22, background: "rgba(10, 19, 32, 0.78)", border: "1px solid #18314e" }}>
              <h2 style={{ marginTop: 0 }}>Track 2 Proof Points</h2>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#c5d7e8" }}>
                <li>System precompile-shaped verification boundary</li>
                <li>ERC20 precompile-shaped native asset quote path</li>
                <li>Snapshot attester service prevents user-selected score tiers</li>
                <li>Soulbound score token driving quote deltas</li>
                <li>Stable adapter boundary for later Rust/PolkaVM verifier work</li>
                <li>Current deploy target is EVM/REVM, not claimed as PolkaVM</li>
              </ul>
              <div style={{ marginTop: 16, color: "#9db7d0", fontSize: "0.95rem" }}>
                Testnet: {POLKADOT_HUB_TESTNET.name} ({POLKADOT_HUB_TESTNET.chainId})
              </div>
              <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: "0.88rem", wordBreak: "break-all" }}>
                {POLKADOT_HUB_TESTNET.rpcUrl}
              </div>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
