# DoraHacks Submission

## Project Name
PolkaZK Credit

## One-liner
Privacy-aware on-chain credit scoring for DeFi on Polkadot Hub using governance-linked reputation certificates, soulbound credit scores, and Polkadot-native precompile paths.

## Elevator Pitch
PolkaZK Credit lets a user prove they have earned a strong governance reputation without exposing their full activity history. The user receives a soulbound on-chain credit score, and a lending demo uses that score to offer better borrowing terms. The current MVP runs on Polkadot Hub Testnet and is built to demonstrate Track 2 relevance through native asset support, System precompile usage, and a verifier architecture that can later move deeper into Rust or PolkaVM.

## Problem
DeFi lending is mostly reputation-blind. Users with strong on-chain behavior are treated the same as new or unknown wallets, while existing reputation signals are difficult to use safely and often require exposing too much raw history. That makes credit inefficient and privacy-invasive.

## Solution
PolkaZK Credit turns governance-linked reputation into a reusable DeFi credit primitive:

- the app checks a wallet against a deterministic governance snapshot
- an attester issues a certificate for the earned tier only
- the verifier validates that certificate on-chain
- the protocol mints or updates a soulbound credit score
- the lending demo reads the score and returns better APR and borrow capacity

The MVP keeps the proof flow reproducible for judges by using a deterministic fixture-backed dataset, while preserving a clean upgrade path toward live governance ingestion and stronger cryptographic proof systems.

## Why Polkadot / Track Fit
This project is positioned for Track 2 because the architecture uses Polkadot-native capabilities beyond ordinary EVM deployment:

- System precompile-aware verification paths
- cross-VM identity binding via `toAccountId(address)`
- native asset-compatible ERC20 precompile integration for lending quotes
- a verifier adapter designed for future Rust/PolkaVM backends

The Track 2 claim is grounded in native capability usage: System precompile calls on every certificate verification, native asset ERC20 precompile integration in the lending path, and a verifier adapter designed for Rust/PolkaVM upgrades.

## User Flow
1. The user connects a wallet on Polkadot Hub Testnet.
2. The dashboard checks whether that wallet qualifies in the governance snapshot.
3. The attester service issues a certificate for the user's earned tier.
4. The user submits the certificate on-chain.
5. The verifier adapter validates the certificate and updates the score.
6. The user receives a soulbound credit score token.
7. The lending demo recalculates the quote using the new score.
8. The user sees improved APR and borrow capacity.

## Core Architecture
- `apps/web`: dashboard, eligibility flow, certificate submission, score display, quote UI
- `contracts/src/credit/CreditScoreSBT.sol`: soulbound score token
- `contracts/src/credit/GovernanceVerifierAdapter.sol`: stable verification boundary
- `contracts/src/credit/AttestedSnapshotVerifier.sol`: live verifier path for the hackathon MVP
- `contracts/src/credit/SystemPrecompileVerifier.sol`: preserved native verification path
- `contracts/src/lending/LendingDemo.sol`: score-aware lending quote logic
- `packages/shared`: shared frontend types and helpers

## What Makes It Different
- privacy-preserving product direction: reveal the earned tier, not the full governance history
- composable on-chain score: the result is a reusable credential, not a one-off app badge
- visible DeFi outcome: better loan terms make the value proposition easy to understand
- every certificate verification calls `toAccountId(address)` on the System precompile, so the certificate is cross-VM bound to both the claimant's EVM address and native Substrate account identity
- honest Track 2 narrative: native features are used without overstating the current deployment model

## Live Deployment
- Network: `Polkadot Hub Testnet`
- Chain ID: `420420417`
- RPC: `https://services.polkadothub-rpc.com/testnet`
- Quote asset: `USDT`
- Asset ID: `1984`
- ERC20 precompile address: `0x000007C000000000000000000000000001200000`

Current deployed contracts:

- `CreditScoreSBT`: `0x86aadce8f673Ef9D332F1b027D71a0C8f22294B0`
- `GovernanceVerifierAdapter`: `0x9BBf0251BB9CD128c7dcE0474cF016D618D5749C`
- `AttestedSnapshotVerifier`: `0xe1052656aec5f8F5a722e2776AaFe37C708e0cF7`
- `SystemPrecompileVerifier`: `0x286A603ECC821696fc46625c56d809785B2132f3`
- `DemoCertificateVerifier`: `0x0fA17619c768416b8246aAC388DCd66a23695eb4`
- `LendingDemo`: `0x287974951879D77AdEcd8B115D2d16ef396B464c`

## Demo Script
1. Open the dashboard on Polkadot Hub Testnet.
2. Show a wallet with no score and the baseline quote.
3. Click `Check Eligibility`.
4. Show the earned reputation tier from the deterministic dataset.
5. Submit the certificate on-chain.
6. Show the newly minted or updated soulbound score.
7. Refresh the lending quote.
8. Show that APR decreases and borrow capacity increases.

## Current Limitations
- the checked-in governance snapshot is deterministic and fixture-backed, not live Polkassembly/Subsquare ingestion yet
- the current certificate path is attester-signed rather than a full zk proof
- the stronger native verifier path is preserved but not the default live verifier
- this is a lending demo, not a production money market
- the ERC20 precompile path does not expose metadata methods like `name()`, `symbol()`, or `decimals()`

## Roadmap
- live governance data ingestion
- stronger native `sr25519` certificate flow
- Rust/PolkaVM verifier backend
- zero-knowledge certificate generation
- richer governance-derived scoring
- cross-chain reputation via XCM
- repayment reputation and longer-term credit history

## Repository
- GitHub: `https://github.com/oderahub/polka-credit`

## Recommended Submission Fields

### Short Description
PolkaZK Credit is a privacy-aware credit layer for DeFi on Polkadot Hub. Users prove governance-linked reputation through a certificate flow, receive a soulbound credit score, and unlock better lending terms without exposing full history.

### Full Description
PolkaZK Credit demonstrates how Polkadot-native smart contract capabilities can support a practical on-chain credit primitive. The MVP uses a deterministic governance snapshot, an attester-signed certificate flow, a verifier adapter, and a soulbound credit score token to translate reputation into better DeFi lending terms. It is deployed on Polkadot Hub Testnet and uses System precompile-aware verification paths plus native asset-compatible ERC20 precompile integration. The current implementation is intentionally honest about its scope: it is a reproducible hackathon MVP, not a production credit market and not yet a full zk system. The architecture is designed to evolve toward live governance ingestion, stronger native verification, and a Rust/PolkaVM backend without changing the core adapter contract.

### Bounty / Track Fit Statement
PolkaZK Credit fits Track 2 because it does more than deploy Solidity contracts on Polkadot. It uses Polkadot-native capabilities as part of the product architecture: System precompile-based identity binding, native asset-compatible ERC20 precompile paths, and a verifier boundary designed for deeper native and PolkaVM evolution.
