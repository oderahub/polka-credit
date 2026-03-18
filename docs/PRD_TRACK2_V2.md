# Polka Credit
## Product Requirements Document

Version: 2.1  
Status: Hackathon MVP, Track 1 primary / Track 2 secondary  
Project: Polkadot Solidity Hackathon 2026

## 1. Executive Summary

Polka Credit is a privacy-preserving on-chain credit system for DeFi on Polkadot Hub.

The MVP combines Solidity smart contracts, governance-derived reputation proofs, a soulbound on-chain credit credential, stablecoin-style lending quotes, and a native Polkadot integration angle through precompiles and asset plumbing.

The current implementation uses standard Solidity tooling and therefore deploys the main contracts to the EVM/REVM environment on Polkadot Hub. The strongest submission fit is Track 1. The Track 2 angle comes from native asset support, System precompile usage, and the verifier boundary, not from claiming that the current deployment is already a PolkaVM contract stack.

Users prove that they satisfy a governance-linked reputation threshold without exposing their full activity history. The protocol verifies that claim, issues a soulbound credit score token, and allows a lending demo to offer better terms based on the score.

The hackathon goal is not to build a production credit market. The goal is to prove that Polkadot Hub can support a privacy-aware reputation layer for DeFi using Solidity-first contracts with meaningful native-chain integrations.

## 2. Track Fit

### Track 1 first

Polka Credit fits Track 1 directly because it is a Solidity-based DeFi application on Polkadot Hub with a clear user-facing financial outcome: better APR and borrow capacity from verified reputation.

### Track 2 second

Track 2 remains a real secondary angle because native capability usage is part of the product architecture rather than a decorative claim.

The current MVP is built around:

- Solidity contracts for score issuance and lending logic
- Polkadot Hub System precompile usage for native verification and account utilities
- Polkadot native asset support through the ERC20 precompile
- A narrow verifier boundary that can be implemented first as a deterministic adapter and extended to Rust on PolkaVM

The relevant Track 2 categories are:

- `Applications using Polkadot native Assets`
- `Accessing Polkadot native functionality - build with precompiles`

`PVM-experiments` remains an extension path rather than a blocking requirement for the MVP.

## 3. Problem Statement

DeFi lending is usually overcollateralized because lenders cannot distinguish between reliable and unreliable borrowers without invasive disclosure.

Current problems:

| Problem | Impact |
| --- | --- |
| Wallets are pseudonymous | No portable credit history |
| Reputation data is public and fragmented | Privacy is lost if users try to prove quality |
| Protocols cannot differentiate user quality | Borrowing terms stay blunt and inefficient |
| Native Polkadot governance participation is not easily consumable in DeFi UX | Valuable on-chain behavior is underused |

This leads to inefficient credit markets where all users are treated similarly even when their on-chain behavior differs materially.

## 4. Product Vision

Create a privacy-preserving reputation layer for DeFi on Polkadot where users can prove positive behavior without exposing raw activity history.

The long-term vision is a cross-chain reputation and credit system that can compose with DeFi, governance, and ecosystem identity primitives across Polkadot.

The hackathon MVP focuses on governance-linked reputation and a lending demo that visibly improves loan terms for users with qualifying score tiers.

## 5. Product Goals

### Primary Goal

Demonstrate that privacy-aware on-chain credit scoring can improve lending terms on Polkadot Hub.

### Secondary Goals

- Showcase meaningful native Polkadot smart contract capabilities in a Track 1-first product
- Demonstrate Solidity contracts integrated with Polkadot-native verification utilities
- Deliver a clean, explainable end-to-end demo on testnet or a deterministic local Polkadot-compatible environment

## 6. Target Users

### Primary User

A Polkadot DeFi participant who:

- participates in governance or other positive on-chain actions
- wants better borrowing conditions
- does not want to reveal their full governance history

### Secondary User

A protocol builder on Polkadot who wants to plug credit-aware risk signals into a lending or borrowing product.

## 7. User Story

### Core User Flow

1. User connects wallet on the dashboard.
2. User generates or loads a private reputation certificate package.
3. User submits the certificate to Polka Credit.
4. The verifier adapter validates the claim using Polkadot-native functionality.
5. The credit score SBT is minted or updated.
6. The user opens the lending demo.
7. The lending demo reads the score and returns better loan terms.

### Demo Narrative

1. Show a wallet with no score receiving a worse loan quote.
2. Submit a valid private reputation certificate.
3. Show score issuance on-chain.
4. Refresh the quote and show a lower rate or better borrow capacity.
5. Highlight the native Polkadot feature involved in the verification or asset path.

## 8. MVP Scope

### Included in MVP

#### Governance-Linked Reputation Proof

Users prove they satisfy a reputation threshold related to governance participation or a governance-derived snapshot.

The MVP may use a deterministic committed dataset or mock snapshot if direct runtime access is not stable enough for the hackathon timeline.

The verified statement should support threshold-style claims such as:

- participation count >= threshold
- conviction-weighted participation >= threshold
- reputation tier is included in a committed dataset

#### Polkadot-Native Verification

The verification path must visibly use native Polkadot functionality.

The preferred order is:

1. System precompile-backed verification and account utilities
2. Native asset integration through the ERC20 precompile
3. Rust verifier on PolkaVM as a stretch or phase-two implementation

Existing precompiles are sufficient for the native Polkadot angle. The MVP does not require a custom runtime precompile.

#### Credit Score SBT

A soulbound NFT represents the user's credit score.

Properties:

- non-transferable
- one token per wallet
- score updates deterministically
- score is readable by external contracts

#### Lending Demo

A simple lending quote module reads the user's score and adjusts borrowing terms.

Example tiers:

| Credit Score | Borrow APR |
| --- | --- |
| 0-299 | 12% |
| 300-599 | 10% |
| 600-1000 | 8% |

#### Dashboard UI

The web app must support:

- wallet connection
- certificate submission
- score display
- loan quote simulation
- clear before-and-after state

### Out of Scope

- production lending markets
- liquidations
- permissionless proof markets
- advanced cross-chain reputation aggregation
- full private identity layer
- complex governance runtime integrations that are not stable enough to demo
- XCM-heavy orchestration unless it becomes a late-stage bonus

## 9. Core Features

### Feature 1: Reputation Certificate Input

Users submit a private reputation certificate package that claims they satisfy a governance-linked threshold.

The certificate package may contain:

- proof bytes
- public inputs
- score tier or threshold class
- signature or account linkage payload

The system should avoid exposing unnecessary underlying activity data.

### Feature 2: Polkadot-Native Verification Adapter

The verifier adapter is the core native-integration differentiator.

Responsibilities:

- receive certificate payloads
- validate native signatures or account linkage where required
- call a deterministic verifier path
- return a boolean verification result and score tier

This module should be designed so that its interface stays stable even if the backend implementation changes from a simplified adapter to a Rust/PolkaVM verifier.

### Feature 3: Credit Score SBT

The SBT represents a user's credit tier.

Properties:

- score range: 0-1000
- address-bound
- non-transferable
- readable by external contracts

The SBT should reject transfers at the contract level and remain simple enough for judges to audit.

### Feature 4: Native Asset-Aware Lending Demo

The lending demo must read the score and compute improved borrowing terms.

Where feasible, the demo should use the Polkadot native asset path through the ERC20 precompile so the demo is visibly tied to Hub-native asset infrastructure rather than only a mock ERC20.

### Feature 5: Submission-Grade Dashboard

The dashboard must make the architecture legible for judges:

- before score state
- certificate submission state
- success and failure handling
- minted score state
- improved lending quote state
- visible labeling of the native Polkadot capability being used

## 10. Functional Requirements

### Wallet Connection

Users must connect a wallet compatible with Polkadot Hub and the chosen frontend stack.

### Certificate Generation or Loading

Users must be able to generate, load, or select a deterministic private reputation certificate package from the frontend.

Inputs may include:

- user address
- threshold class
- proof bytes
- public inputs
- signature payload

### Certificate Submission

Users submit the certificate package through an on-chain transaction.

### Verification

The protocol validates the submission through a verifier adapter.

If valid:

- the user's score is updated
- the user's SBT is minted or refreshed

If invalid:

- the transaction reverts or returns an explicit failure path

### Score Retrieval

Other contracts must be able to query the score.

Required interface:

```solidity
interface ICreditScore {
    function getScore(address user) external view returns (uint256);
}
```

### Lending Quote Logic

The lending module must read the score and compute borrowing terms deterministically.

Example:

```solidity
rate = baseRate - discount(score);
```

### Native Capability Usage

At least one of the following must be exercised in the final demo:

- System precompile verification or account conversion
- ERC20 precompile interaction with a native asset
- cross-VM call into a Rust-based PolkaVM verifier

The preferred MVP uses the first two, with the third as a stretch goal.

## 11. Non-Functional Requirements

### Security

- SBT must be non-transferable
- invalid proofs must be rejected
- privileged score issuance paths must be access-controlled
- contracts should rely on OpenZeppelin primitives where practical

### Privacy

- the system should reveal only the minimum data required to prove eligibility
- raw governance activity history should not be required for lending quotes
- the demo must avoid claiming stronger privacy than the implementation actually provides

### Determinism

- verifier outcomes must be deterministic
- score updates must be deterministic
- rate calculations must be deterministic
- UI state must reflect contract state rather than hidden frontend logic

### Testability

- contracts must have isolated tests
- verifier paths must have deterministic fixtures
- score issuance and lending quote logic must be testable independently

### Demo Reliability

- the end-to-end flow must work on Polkadot Hub testnet or a credible local Polkadot-compatible setup
- the submission should not depend on fragile manual steps that judges cannot reproduce

## 12. Architecture Overview

### Modules

- `contracts/credit`
- `contracts/lending`
- `apps/web`
- `packages/shared`

### Smart Contracts

#### `CreditScoreSBT.sol`

Responsibilities:

- issue and update credit score tokens
- enforce soulbound behavior
- expose `getScore(address)`

#### `GovernanceVerifierAdapter.sol`

Responsibilities:

- receive proof payloads
- validate native verification inputs
- call the selected verifier backend
- compute or map score tiers
- update the score token

#### `LendingDemo.sol`

Responsibilities:

- read credit score
- calculate APR and borrow amount
- expose quote functions for frontend display

#### Optional `RustVerifier` or `PVMVerifier`

Responsibilities:

- verify proof payloads in a Rust or PolkaVM environment
- return a narrow success or failure response to the Solidity adapter

This component is valuable for native differentiation, but the MVP must not collapse if it is incomplete.

### Deployment mode clarification

- Standard Foundry or Hardhat Solidity compilation deploys to `EVM/REVM`
- `PolkaVM/PVM` deployment requires a PVM-specific compilation path such as `resolc` or Remix Revive
- The current MVP should not describe its deployed contracts as `PVM contracts` unless that compilation path is actually used

## 13. Shared Interfaces

### `ICreditScore`

```solidity
interface ICreditScore {
    function getScore(address user) external view returns (uint256);
}
```

### `IProofVerifier`

```solidity
interface IProofVerifier {
    function verifyProof(bytes calldata proof, bytes calldata publicInputs)
        external
        returns (bool);
}
```

### Recommended Extended Verifier Interface

```solidity
interface ITrack2Verifier {
    function verifyAndScore(
        address user,
        bytes calldata proof,
        bytes calldata publicInputs,
        bytes calldata context
    ) external returns (bool valid, uint256 score);
}
```

This keeps the adapter boundary stable while allowing multiple verification backends.

## 14. Data Model

### Credit Score

`uint256 score`

Example score mapping:

- threshold tier 1 -> 300
- threshold tier 2 -> 500
- threshold tier 3 -> 700

### Credit Score Token

`tokenId = uint160(address)`

This ensures one score token per wallet and avoids separate token indexing complexity.

### Reputation Payload

Recommended fields:

- claimant address
- threshold class
- proof bytes
- public inputs
- signature or linkage payload
- snapshot root or dataset identifier

## 15. Frontend Requirements

### Framework

- Next.js
- wagmi
- viem
- Scaffold-DOT where it improves speed and chain integration

### Dashboard Features

- wallet connect
- certificate selection or generation
- certificate submission
- credit score display
- loan quote simulation
- transaction state feedback

### Screens

#### Dashboard

Shows:

- current score
- current tier
- borrowing quote
- native feature badges or labels

#### Proof Screen

Allows user to:

- load or generate a private reputation certificate package
- review threshold class
- submit certificate
- inspect validation result

## 16. Success Metrics

The project is successful if:

- a certificate package can be submitted successfully
- the score token is minted or updated
- the lending quote changes based on score
- at least one native Polkadot capability is used in a real, visible way
- the demo runs reliably on testnet or a deterministic local setup

## 17. Demo Flow

### Judge-Facing Demo Script

1. Connect wallet.
2. Show baseline quote with no score.
3. Submit private reputation certificate.
4. Show verifier success.
5. Show score token minted or updated.
6. Refresh lending quote.
7. Show reduced APR or improved borrow amount.
8. Point to the specific Polkadot-native feature used in the flow.

## 18. Risks

### Governance Data Availability

Direct runtime-aligned governance access may not be stable enough for the MVP timeline.

Mitigation:

- use a committed dataset or snapshot
- keep proof statements threshold-based
- document the future path to stronger integration

### PolkaVM Integration Risk

Cross-VM or Rust verification may be slower to complete than expected.

Mitigation:

- keep the Solidity adapter interface stable
- make native precompile usage sufficient for the secondary native-angle case
- treat Rust verifier as a stretch goal

### ZK Complexity

Proof systems can overrun the schedule.

Mitigation:

- keep circuits simple or mock the backend deterministically
- prioritize end-to-end demonstrability

### Time Risk

The project can lose quality if too many native features are attempted.

Mitigation:

- finish one reliable end-to-end flow first
- add PVM and extra integrations only after core completion

## 19. Future Roadmap

Post-hackathon expansions:

- repayment reputation
- cross-chain reputation using XCM
- stronger private address-linking models
- richer governance-derived scoring
- decentralized attestation and credential markets
- full Rust-based verification backend on PolkaVM

## 20. Competitive Advantage

Polka Credit demonstrates:

- privacy-aware reputation for DeFi
- composable on-chain credit scoring
- a product architecture aligned with Polkadot-native smart contract capabilities
- a clearer path to dual-VM design than standard EVM-only lending demos

This gives the project a stronger native Polkadot narrative than a generic lending or SBT application.

## 21. Final Summary

Polka Credit is a privacy-aware credit layer for DeFi on Polkadot Hub, with Track 1 as the primary fit and native Polkadot functionality as the secondary differentiator.

It combines:

- score-bearing soulbound credentials
- governance-linked private reputation certificates
- native verification and asset plumbing
- dynamic lending terms

The MVP proves that Polkadot-native smart contract features can support a practical credit primitive with a clean user-facing DeFi story.
