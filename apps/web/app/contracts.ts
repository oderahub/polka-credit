import { parseAbi } from "viem";

export const creditScoreAbi = parseAbi([
  "function getScore(address user) view returns (uint256)",
  "function hasToken(address user) view returns (bool)",
]);

export const lendingDemoAbi = [
  {
    type: "function",
    name: "quoteFor",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "score", type: "uint256" },
          { name: "aprBps", type: "uint256" },
          { name: "maxBorrowAmount", type: "uint256" },
          { name: "nativeAssetBalance", type: "uint256" },
          { name: "nativeAssetTotalSupply", type: "uint256" },
        ],
      },
    ],
  },
] as const;

export const governanceVerifierAdapterAbi = parseAbi([
  "function verifier() view returns (address)",
  "function submitProof((address claimant, bytes proof, bytes publicInputs, bytes context) submission) returns (uint256 score)",
]);

export const systemPrecompileAbi = parseAbi([
  "function toAccountId(address input) view returns (bytes accountId)",
]);
