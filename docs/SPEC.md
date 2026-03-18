# SPEC

## Product
Polka Credit

## One-liner
Privacy-aware DeFi credit on Polkadot Hub using governance-linked proofs, soulbound credit credentials, and native Polkadot integrations where they materially improve the product.

## Problem
DeFi lending treats all wallets similarly because reputation data is hard to consume safely, is often privacy-invasive, and is not easily translated into Polkadot-native DeFi credit signals.

## Primary user
A Polkadot user who wants better borrowing terms without exposing full governance or financial history.

## Desired outcome
A user submits a governance-linked reputation proof, receives a score-bearing SBT, and gets a better rate in a lending demo that visibly uses native Polkadot capabilities where they strengthen the flow.

## In scope
- governance-linked private reputation certificate path
- Polkadot-native verification adapter
- soulbound credit score token
- demo lending contract using score and native asset-aware plumbing
- dashboard showing score and loan quote
- stable verifier interface with a Rust/PolkaVM upgrade path

## Out of scope
- production-ready lending market
- multi-source credit aggregation
- off-chain income attestations
- full cross-chain reputation sync
- complex runtime integrations that are not stable enough to demo

## Constraints
- Native Polkadot capability must be visible in the final demo
- Solidity contracts remain the core user-facing path
- current Foundry deployment target is EVM/REVM unless a PVM-specific compiler path is introduced
- verifier boundary must support a Rust/PolkaVM backend without architecture drift
- no hidden architecture drift
- no new dependencies unless justified
- deterministic verification required
- do not overclaim privacy beyond the actual implementation

## Modules
- contracts/credit
- contracts/lending
- apps/web
- packages/shared
- docs

## Success metric
- end-to-end demo works on testnet or local dev flow
- score is minted/updated deterministically
- lending APR changes based on score
- at least one Polkadot-native capability is used in a real, visible way
- the submission clearly fits Track 1 first and does not falsely claim EVM deployments are already PVM deployments
- docs and verification output are clean
