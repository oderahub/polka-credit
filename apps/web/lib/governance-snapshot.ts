import {
  type EligibilityResult,
  encodeCertificateContext,
  encodeCertificatePublicInputs,
  type IssuedCertificate,
  tierFromParticipationCount,
} from "@polkazk/shared";
import {
  createPublicClient,
  encodePacked,
  getAddress,
  http,
  isAddress,
  keccak256,
  type Address,
  type Hex,
  stringToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { systemPrecompileAbi } from "../app/contracts";

type SnapshotRecord = {
  address: Address;
  participationCount: number;
  convictionBucket: "low" | "medium" | "high";
  source: string;
};

const SNAPSHOT_SOURCE = "deterministic-governance-snapshot";
const SNAPSHOT_DATASET_ID = keccak256(stringToHex("polkazk-governance-snapshot-2026-03-13"));
const CERTIFICATE_PREFIX = "PolkaZK Credit Snapshot Certificate";
const LOCAL_DEV_OVERRIDE_SOURCE = "local-development-demo-override";

const SNAPSHOT_RECORDS: SnapshotRecord[] = [
  {
    address: getAddress("0x0bA50b9001b2ECcd3869CC73c07031dca1e11412"),
    participationCount: 12,
    convictionBucket: "high",
    source: "demo snapshot fixture aligned to future Polkassembly/Subsquare importer",
  },
  {
    address: getAddress("0x1111111111111111111111111111111111111111"),
    participationCount: 6,
    convictionBucket: "medium",
    source: "demo snapshot fixture aligned to future Polkassembly/Subsquare importer",
  },
];

export function resolveGovernanceEligibility(address: string): EligibilityResult {
  if (!isAddress(address)) {
    return {
      eligible: false,
      address: getAddress("0x0000000000000000000000000000000000000000"),
      tier: 0,
      participationCount: 0,
      convictionBucket: "low",
      datasetId: SNAPSHOT_DATASET_ID,
      source: SNAPSHOT_SOURCE,
      reason: "Invalid EVM address.",
    };
  }

  const normalized = getAddress(address);
  const record = SNAPSHOT_RECORDS.find((entry) => entry.address === normalized);
  const shouldApplyLocalOverride = process.env.NODE_ENV !== "production" && !record;
  const overrideParticipationCount = shouldApplyLocalOverride ? 12 : 0;
  const participationCount = record?.participationCount ?? 0;
  const effectiveParticipationCount = shouldApplyLocalOverride ? overrideParticipationCount : participationCount;
  const tier = tierFromParticipationCount(effectiveParticipationCount);

  return {
    eligible: tier > 0,
    address: normalized,
    tier,
    participationCount: effectiveParticipationCount,
    convictionBucket: record?.convictionBucket ?? "low",
    datasetId: SNAPSHOT_DATASET_ID,
    source: shouldApplyLocalOverride
      ? LOCAL_DEV_OVERRIDE_SOURCE
      : record?.source ?? SNAPSHOT_SOURCE,
    reason:
      tier > 0
        ? shouldApplyLocalOverride
          ? "Eligible through the local development demo override for full-flow testing."
          : `Eligible from governance snapshot with ${effectiveParticipationCount} participation events.`
        : "No qualifying governance participation was found in the current snapshot.",
  };
}

export async function issueSnapshotCertificate(
  address: string,
  verifierAddress: string,
  chainId: number
): Promise<IssuedCertificate> {
  const eligibility = resolveGovernanceEligibility(address);
  if (!eligibility.eligible || eligibility.tier === 0) {
    throw new Error("Address is not eligible for a snapshot certificate.");
  }
  if (!isAddress(verifierAddress)) {
    throw new Error("Invalid verifier address.");
  }

  const attesterKey = process.env.ATTESTER_PRIVATE_KEY as Hex | undefined;
  if (!attesterKey) {
    throw new Error("ATTESTER_PRIVATE_KEY is not configured.");
  }

  const attester = privateKeyToAccount(attesterKey);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const nativeAccountId = await resolveNativeAccountId(eligibility.address);
  const certificateHash = buildSnapshotCertificateHash(
    getAddress(verifierAddress),
    eligibility.address,
    nativeAccountId,
    eligibility.tier,
    deadline,
    eligibility.datasetId,
    BigInt(chainId)
  );
  const proof = await attester.signMessage({ message: { raw: certificateHash } });

  return {
    claimant: eligibility.address,
    proof,
    publicInputs: encodeCertificatePublicInputs(eligibility.tier, deadline),
    context: encodeCertificateContext(eligibility.datasetId),
    tier: eligibility.tier,
    deadline,
    datasetId: eligibility.datasetId,
    source: eligibility.source,
    issuedBy: attester.address,
  };
}

export function buildSnapshotCertificateHash(
  verifierAddress: Address,
  user: Address,
  nativeAccountId: Hex,
  tier: 1 | 2 | 3,
  deadline: bigint,
  datasetId: Hex,
  chainId: bigint
): Hex {
  return keccak256(
    encodePacked(
      ["string", "uint256", "address", "address", "bytes", "uint8", "uint64", "bytes32"],
      [CERTIFICATE_PREFIX, chainId, verifierAddress, user, nativeAccountId, tier, deadline, datasetId]
    )
  );
}

async function resolveNativeAccountId(address: Address): Promise<Hex> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "https://services.polkadothub-rpc.com/testnet";
  const systemPrecompileAddress = getAddress(
    process.env.NEXT_PUBLIC_SYSTEM_PRECOMPILE_ADDRESS ?? "0x0000000000000000000000000000000000000900"
  );

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  const accountId = await client.readContract({
    address: systemPrecompileAddress,
    abi: systemPrecompileAbi,
    functionName: "toAccountId",
    args: [address],
  });

  return accountId;
}
