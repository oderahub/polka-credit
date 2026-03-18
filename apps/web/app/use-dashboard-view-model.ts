"use client";

import type { CSSProperties } from "react";
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
import { createPublicClient, createWalletClient, custom, defineChain, formatUnits, getAddress, http } from "viem";
import { creditScoreAbi, governanceVerifierAdapterAbi, lendingDemoAbi } from "./contracts";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
      on?: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
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
const quoteAssetDecimals = Number(process.env.NEXT_PUBLIC_QUOTE_ASSET_DECIMALS ?? "18");
const polkadotHubTestnetChain = defineChain({
  id: chainId,
  name: POLKADOT_HUB_TESTNET.name,
  nativeCurrency: {
    name: "Polkadot",
    symbol: "DOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
  },
});

const baseQuote: CreditQuote = {
  score: 0n,
  aprBps: 1200n,
  maxBorrowAmount: 1_000n * 10n ** 18n,
  nativeAssetBalance: 2_500n * 10n ** 18n,
  nativeAssetTotalSupply: 250_000n * 10n ** 18n,
};

const proofPoints = [
  "System precompile-shaped verification boundary",
  "ERC20 precompile-shaped native asset quote path",
  "Snapshot attester service prevents user-selected tiers",
  "Soulbound score token changes lending terms live",
  "Adapter remains upgradeable for Rust or PolkaVM verifier work",
  "Current deployment target is EVM/REVM on Polkadot Hub Testnet",
];

type LiveQuoteStruct = {
  score: bigint;
  aprBps: bigint;
  maxBorrowAmount: bigint;
  nativeAssetBalance: bigint;
  nativeAssetTotalSupply: bigint;
};

type IssuedCertificateResponse = Omit<IssuedCertificate, "deadline"> & {
  deadline: string;
};

function formatPercent(bps: bigint) {
  return `${Number(bps) / 100}%`;
}

function formatTokenAmount(amount: bigint) {
  const normalized = Number(formatUnits(amount, quoteAssetDecimals));
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: normalized >= 100 ? 0 : 2,
  }).format(normalized);
  return `${formatted} UNIT`;
}

function formatAddress(value: string) {
  if (value.length <= 18) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
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

function getStatusLabel(walletConnected: boolean, verificationStatus: VerificationStatus) {
  if (!walletConnected) return "Disconnected";
  if (verificationStatus === "idle") return "Ready";
  if (verificationStatus === "submitting") return "Submitting";
  if (verificationStatus === "success") return "Verified";
  return "Attention";
}

function getStatusToneClass(walletConnected: boolean, verificationStatus: VerificationStatus) {
  if (!walletConnected) return "tone-slate";
  if (verificationStatus === "success") return "tone-mint";
  if (verificationStatus === "submitting") return "tone-amber";
  if (verificationStatus === "error") return "tone-coral";
  return "tone-cyan";
}

export function useDashboardViewModel() {
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
  const [errorMessage, setErrorMessage] = useState("");

  const publicClient = createPublicClient({
    transport: http(rpcUrl),
  });

  useEffect(() => {
    void refreshLiveState(walletAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    async function restoreWalletSession() {
      try {
        const accounts = (await window.ethereum?.request({
          method: "eth_accounts",
        })) as string[];

        if (!accounts?.length) return;

        const account = getAddress(accounts[0]);
        setWalletAddress(account);
        setWalletConnected(true);
        setProofPayload(buildPayload(account as `0x${string}`));
        setErrorMessage("");
        await refreshLiveState(account);
      } catch {
        // Silent restore attempt. Explicit connect handles user-facing errors.
      }
    }

    void restoreWalletSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      const message = "No injected wallet found. Install MetaMask or Talisman for live transactions.";
      setErrorMessage(message);
      setActivityLog((current) => [message, ...current]);
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
      setErrorMessage("");
      setActivityLog((current) => [`Connected wallet ${account} on chain ${chainId}.`, ...current]);
      await refreshLiveState(account);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown wallet error";
      setErrorMessage(message);
      setActivityLog((current) => [`Wallet connection failed: ${message}`, ...current]);
    }
  }

  async function refreshLiveState(address: string = walletAddress) {
    setIsRefreshing(true);
    setErrorMessage("");
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

      setQuote({
        score: liveQuote.score,
        aprBps: liveQuote.aprBps,
        maxBorrowAmount: liveQuote.maxBorrowAmount,
        nativeAssetBalance: liveQuote.nativeAssetBalance,
        nativeAssetTotalSupply: liveQuote.nativeAssetTotalSupply,
      });
      setScoreHasToken(hasToken);
      setActivityLog((current) => [
        `Live quote refreshed for ${address}. Current score: ${score.toString()}.`,
        ...current,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown RPC error";
      setErrorMessage(message);
      setActivityLog((current) => [`Live refresh failed: ${message}`, ...current]);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleCheckEligibility() {
    if (!walletConnected) {
      const message = "Connect a wallet before checking eligibility.";
      setErrorMessage(message);
      setActivityLog((current) => [message, ...current]);
      return;
    }

    setVerificationStatus("submitting");
    setErrorMessage("");
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
      if (!nextEligibility.eligible) {
        setErrorMessage(nextEligibility.reason);
      }
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
      setErrorMessage(message);
      setActivityLog((current) => [`Eligibility lookup failed: ${message}`, ...current]);
    }
  }

  async function handleSubmitProof() {
    if (!eligibility?.eligible || eligibility.tier === 0) {
      const message = "Check eligibility first. A certificate is only issued for an earned governance tier.";
      setVerificationStatus("error");
      setErrorMessage(message);
      setActivityLog((current) => [message, ...current]);
      return;
    }

    setVerificationStatus("submitting");
    setErrorMessage("");
    setActivityLog((current) => [
      `Requesting tier ${eligibility.tier} snapshot certificate from the attester service.`,
      ...current,
    ]);

    if (!window.ethereum) {
      const message = "No injected wallet found for live certificate submission.";
      setVerificationStatus("error");
      setErrorMessage(message);
      setActivityLog((current) => [message, ...current]);
      return;
    }

    try {
      const walletClient = createWalletClient({
        chain: polkadotHubTestnetChain,
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
      const certificateBody = (await certificateResponse.json()) as
        | IssuedCertificateResponse
        | { error: string };
      if (!certificateResponse.ok || "error" in certificateBody) {
        throw new Error("error" in certificateBody ? certificateBody.error : "Certificate issuance failed.");
      }
      const issuedCertificate: IssuedCertificate = {
        ...certificateBody,
        deadline: BigInt(certificateBody.deadline),
      };

      setIssuedCertificate(issuedCertificate);
      setProofPayload(issuedCertificate);

      const hash = await walletClient.writeContract({
        account: claimant,
        address: adapterAddress,
        abi: governanceVerifierAdapterAbi,
        functionName: "submitProof",
        args: [issuedCertificate],
        chain: polkadotHubTestnetChain,
      });

      setVerificationStatus("success");
      setActivityLog((current) => [
        `Certificate transaction submitted: ${hash}.`,
        `Snapshot attester issued tier ${issuedCertificate.tier} and the verifier accepted it on-chain.`,
        ...current,
      ]);
      await refreshLiveState(claimant);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown submission error";
      setVerificationStatus("error");
      setErrorMessage(message);
      setActivityLog((current) => [
        `Live certificate submission failed: ${message}`,
        "The live demo path expects the adapter to point at the attested snapshot verifier and the web app to have an attester key configured.",
        ...current,
      ]);
    }
  }

  const currentScoreTier = scoreTierFromScore(quote.score);
  const scoreProgress = Math.max(6, Math.min(100, Number((quote.score * 100n) / 700n)));
  const scoreProgressStyle = { "--score-progress": `${scoreProgress}%` } as CSSProperties;
  const statusLabel = getStatusLabel(walletConnected, verificationStatus);
  const statusToneClass = getStatusToneClass(walletConnected, verificationStatus);
  const submittedTransactionEntry = activityLog.find((entry) => entry.startsWith("Certificate transaction submitted:"));
  const transactionHashLabel = submittedTransactionEntry
    ? submittedTransactionEntry.replace("Certificate transaction submitted: ", "")
    : "";
  const flowCompleted = Boolean(transactionHashLabel) && (scoreHasToken || quote.score > 0n);
  const currentStatusMessage = errorMessage
    ? errorMessage
    : flowCompleted
      ? "Verifier accepted the proof. Your SBT-backed score and lending quote refreshed from chain."
      : issuedCertificate
        ? `Certificate proof issued for tier ${issuedCertificate.tier}. Submit it once so the verifier can mint the reusable on-chain credential.`
        : eligibility?.eligible
          ? eligibility.reason
          : walletConnected
            ? "Wallet connected. Run eligibility to continue."
            : "Connect a wallet to start the verification flow.";
  const certificateStatusMessage = flowCompleted
    ? "Proof verified. The wallet now holds the on-chain SBT credential."
    : issuedCertificate
      ? `Tier ${issuedCertificate.tier} certificate proof prepared for one-time submission`
      : "No certificate proof issued yet.";
  const screenState =
    isRefreshing || verificationStatus === "submitting"
      ? "loading"
      : errorMessage
        ? "error"
        : issuedCertificate || (eligibility?.eligible ?? false)
          ? "success"
          : !walletConnected && !eligibility && !issuedCertificate
            ? "empty"
            : "default";

  return {
    walletAddress,
    walletConnected,
    isRefreshing,
    scoreHasToken,
    verificationStatus,
    screenState,
    errorMessage,
    proofPayloadProof: proofPayload.proof,
    proofPayloadPublicInputs: proofPayload.publicInputs,
    proofPayloadContext: proofPayload.context,
    proofPayloadClaimant: proofPayload.claimant,
    eligibilitySummary: eligibility
      ? eligibility.eligible
        ? `Eligible tier ${eligibility.tier} from ${eligibility.participationCount} governance events.`
        : eligibility.reason
      : "No snapshot lookup yet. Connect a wallet and check eligibility.",
    eligibilitySource: eligibility ? `Source: ${eligibility.source}` : "Source: Governance snapshot fixture",
    eligibilityDatasetId: eligibility ? `Dataset: ${eligibility.datasetId}` : "Dataset: Awaiting lookup",
    eligibilityConvictionBucket: eligibility
      ? `Conviction: ${eligibility.convictionBucket}`
      : "Conviction: Awaiting lookup",
    issuedCertificateTierLabel: issuedCertificate
      ? `Tier ${issuedCertificate.tier} certificate proof prepared for one-time submission`
      : "",
    issuedCertificateIssuedBy: issuedCertificate ? `Issued by: ${issuedCertificate.issuedBy}` : "",
    issuedCertificateDatasetId: issuedCertificate ? `Dataset: ${issuedCertificate.datasetId}` : "",
    issuedCertificateSource: issuedCertificate ? `Source: ${issuedCertificate.source}` : "",
    quoteScoreLabel: SCORE_LABELS[currentScoreTier],
    quoteScoreValue: quote.score.toString(),
    quoteAprLabel: `APR ${formatPercent(quote.aprBps)}`,
    quoteBorrowCapLabel: `Borrow cap ${formatTokenAmount(quote.maxBorrowAmount)}`,
    beforeQuoteAprLabel: `APR ${formatPercent(baseQuote.aprBps)}`,
    beforeQuoteBorrowCapLabel: `Borrow cap ${formatTokenAmount(baseQuote.maxBorrowAmount)}`,
    currentStatusMessage,
    certificateStatusMessage,
    transactionHashLabel,
    flowCompleted,
    walletConnectionLabel: walletConnected
      ? `Connected · ${formatAddress(walletAddress)}`
      : "Awaiting wallet connection",
    certificateReadyLabel: issuedCertificate ? "Certificate ready ✓" : "",
    nativeAssetAddress,
    nativeAssetIdLabel: `Asset ID ${nativeAssetId.toString()}`,
    nativeAssetBalanceLabel: `User balance ${formatTokenAmount(quote.nativeAssetBalance)}`,
    nativeAssetTotalSupplyLabel: `Total supply ${formatTokenAmount(quote.nativeAssetTotalSupply)}`,
    statusLabel,
    statusToneClass,
    scoreProgressStyle,
    chainIdLabel: String(chainId),
    rpcUrlLabel: formatAddress(rpcUrl),
    systemPrecompileAddressLabel: `System precompile: ${formatAddress(systemPrecompileAddress)}`,
    scoreTokenAddressLabel: `Score token: ${formatAddress(scoreTokenAddress)}`,
    adapterAddressLabel: `Adapter: ${adapterAddress}`,
    lendingDemoAddressLabel: `Lending demo: ${lendingDemoAddress}`,
    activityLog,
    proofPoints,
    connectWallet,
    refreshLiveState,
    handleCheckEligibility,
    handleSubmitProof,
  };
}
