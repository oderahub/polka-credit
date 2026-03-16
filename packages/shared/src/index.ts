import { encodeAbiParameters, keccak256, stringToHex } from "viem";

export type ScoreTier = 0 | 1 | 2 | 3;

export type ReputationProofPayload = {
  claimant: `0x${string}`;
  proof: `0x${string}`;
  publicInputs: `0x${string}`;
  context: `0x${string}`;
};

export type EligibilityResult = {
  eligible: boolean;
  address: `0x${string}`;
  tier: ScoreTier;
  participationCount: number;
  convictionBucket: "low" | "medium" | "high";
  datasetId: `0x${string}`;
  source: string;
  reason: string;
};

export type IssuedCertificate = ReputationProofPayload & {
  tier: ScoreTier;
  deadline: bigint;
  datasetId: `0x${string}`;
  source: string;
  issuedBy: `0x${string}`;
};

export type CreditQuote = {
  score: bigint;
  aprBps: bigint;
  maxBorrowAmount: bigint;
  nativeAssetBalance: bigint;
  nativeAssetTotalSupply: bigint;
};

export type NetworkConfig = {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockscoutUrl: string;
  routescanUrl: string;
};

export type VerificationStatus = "idle" | "submitting" | "success" | "error";

export type ReputationTierOption = {
  tier: ScoreTier;
  label: string;
  score: bigint;
  aprBps: bigint;
};

export const SCORE_LABELS: Record<ScoreTier, string> = {
  0: "Unscored",
  1: "Builder",
  2: "Contributor",
  3: "Governor",
};

export const SCORE_PRESETS: Record<ScoreTier, bigint> = {
  0: 0n,
  1: 300n,
  2: 500n,
  3: 700n,
};

export const APR_PRESETS_BPS: Record<ScoreTier, bigint> = {
  0: 1200n,
  1: 1000n,
  2: 1000n,
  3: 800n,
};

export const BORROW_CAP_PRESETS: Record<ScoreTier, bigint> = {
  0: 1000n,
  1: 1200n,
  2: 1200n,
  3: 1500n,
};

export const REPUTATION_OPTIONS: ReputationTierOption[] = [
  { tier: 1, label: "Builder threshold", score: 300n, aprBps: 1000n },
  { tier: 2, label: "Contributor threshold", score: 500n, aprBps: 1000n },
  { tier: 3, label: "Governor threshold", score: 700n, aprBps: 800n },
];

export const POLKADOT_HUB_TESTNET: NetworkConfig = {
  name: "Polkadot Hub Testnet",
  chainId: 420420417,
  rpcUrl: "https://services.polkadothub-rpc.com/testnet",
  blockscoutUrl: "https://blockscout-testnet.polkadot.io/",
  routescanUrl: "https://polkadot.testnet.routescan.io/",
};

const ERC20_PRECOMPILE_PREFIX = 0x1200000n;

export function erc20PrecompileAddressFromAssetId(assetId: bigint | number): `0x${string}` {
  const normalized = typeof assetId === "number" ? BigInt(assetId) : assetId;
  const hex = normalized.toString(16).padStart(8, "0");
  const prefix = ERC20_PRECOMPILE_PREFIX.toString(16).padStart(32, "0");
  return `0x${hex}${prefix}` as `0x${string}`;
}

export function makeCertificateDatasetId(tier: ScoreTier): `0x${string}` {
  return keccak256(stringToHex(`polkazk-demo-governance-snapshot:tier-${tier}`));
}

export function encodeCertificatePublicInputs(tier: ScoreTier, deadline: bigint): `0x${string}` {
  return encodeAbiParameters(
    [
      { type: "uint8" },
      { type: "uint64" },
    ],
    [tier, deadline]
  );
}

export function encodeCertificateContext(datasetId: `0x${string}`): `0x${string}` {
  return encodeAbiParameters([{ type: "bytes32" }], [datasetId]);
}

export function tierFromParticipationCount(participationCount: number): ScoreTier {
  if (participationCount >= 10) return 3;
  if (participationCount >= 5) return 2;
  if (participationCount >= 1) return 1;
  return 0;
}
