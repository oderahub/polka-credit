# Polka Credit

Polka Credit lets users prove governance reputation and unlock better DeFi lending terms on Polkadot Hub without exposing their full on-chain history.

Polka Credit is a Solidity-based DeFi credit primitive on Polkadot Hub. A user submits a governance-derived proof, receives a soulbound on-chain credit credential, and gets better lending terms through a live lending demo.

This repository is the Polkadot Solidity Hackathon 2026 MVP. The strongest fit is Track 1 (EVM Smart Contract / DeFi), with a real Track 2 angle through System precompile usage, native-asset precompile paths, and a verifier architecture that can evolve toward deeper native execution.

## What It Does

Polka Credit turns governance-linked reputation into a reusable DeFi credit primitive:

- a user connects a wallet on Polkadot Hub Testnet
- the app checks the wallet against a fixture-backed governance snapshot
- an attester service signs a certificate for the earned tier only
- the verifier adapter validates that certificate on-chain
- the protocol mints or updates a soulbound credit score token
- the lending demo reads that score and returns a better APR and borrow cap

The current live demo path is MetaMask-compatible and uses a fixture-backed governance snapshot so judges can reproduce the flow. The stronger native verifier path remains preserved in the codebase and can be upgraded later through the adapter.

## Architecture

```text
Off-chain Snapshot Script  ->  (address -> tier) map
        |
        v
Attester Service
        |
        v
Dashboard (apps/web)
        |
        v
GovernanceVerifierAdapter.sol
        |
        +--> AttestedSnapshotVerifier.sol    (live snapshot-attester flow)
        |      |
        |      +--> System Precompile `toAccountId(address)` cross-VM binding
        |
        +--> SystemPrecompileVerifier.sol    (native verifier path preserved)
        |      |
        |      +--> System Precompile (0x...0900)
        |
        +--> Optional RustVerifier (PolkaVM) (future stretch path)
        |
        v
CreditScoreSBT.sol
        |
        v
LendingDemo.sol
        |
        +--> ERC20 Native Asset Precompile path

Future source swap:
Fixture-backed governance snapshot -> live Polkassembly/Subsquare importer
```

## Demo Path

```text
Wallet
  |
  v
Dashboard
  |
  v
Attester Service
  |
  v
Certificate
  |
  v
GovernanceVerifierAdapter.sol
  |
  v
CreditScoreSBT.sol
  |
  v
LendingDemo.sol
```

## Cross-VM Identity Binding

```text
EVM Address
      |
      v
System Precompile
toAccountId(address)
      |
      v
Native Substrate Account
      |
      v
Certificate Verification
      |
      v
Score Minted
```

## Certificate Model

The user-facing term is `private reputation certificate`.

That certificate represents a claim like:

- "this wallet qualifies for tier 1"
- "this wallet qualifies for tier 2"
- "this wallet qualifies for tier 3"

The attester signs a certificate only after verifying the wallet against the governance snapshot dataset and binding the claim to the wallet's native account ID through the System precompile.

In the MVP, "private" means the system reveals only the earned tier rather than the user's full governance history. The current certificate is attester-signed rather than a full zero-knowledge proof.

The MVP supports these certificate-generation paths conceptually:

- `live MVP path now`: attester-signed certificate from a deterministic governance snapshot fixture
- `next step`: signed snapshot proof from a live governance importer
- `next step`: deterministic dataset membership proof
- `future path`: zk proof

The checked-in MVP uses a deterministic governance snapshot fixture so the flow stays reproducible for judges. The verifier boundary is designed so that fixture can later be replaced by live Polkassembly/Subsquare ingestion or a ZK backend without changing the adapter contract.

## Track Fit

### Primary fit: Track 1, EVM Smart Contract Track

Polka Credit fits Track 1 directly:

- the product is built with Solidity and EVM-compatible contracts
- it is deployed on `Polkadot Hub Testnet`
- it is a DeFi / stablecoin-enabled dapp
- the user-facing outcome is financial: improved APR and borrow capacity from verified reputation

### Secondary fit: Track 2, PVM Smart Contracts

The codebase also has a meaningful Track 2 angle. The current deployment is still on Polkadot Hub `EVM/REVM`, but it uses Polkadot-native capabilities in real parts of the architecture:

- `System` precompile-aware verification paths
- cross-VM certificate binding through `toAccountId(address)`
- native asset-aware lending path through the `ERC20` precompile model
- a stable verifier adapter that can later point to Rust / PolkaVM backends

## Why Polkadot

Polka Credit uses Polkadot Hub capabilities that are awkward or unavailable in a standard EVM-only design:

- native precompile access for runtime-oriented verification paths
- cross-VM certificate binding from EVM address to native account ID through `toAccountId(address)`
- native asset infrastructure exposed through ERC20-compatible precompiles
- a clean upgrade path to PolkaVM and Rust-based verifier backends
- future cross-chain reputation expansion through XCM

This lets the product combine Solidity UX with native-chain capabilities instead of staying trapped in an EVM-only lending model.

## Why This Matters

DeFi lending usually treats wallets as reputation-blind and pushes users toward high collateral requirements.

Polka Credit demonstrates a better model:

- users prove eligibility, not full history
- credit becomes composable on-chain
- lending terms improve deterministically from the score
- Polkadot-native capabilities remain part of the architecture

## Deterministic Score Mapping

The adapter and verifier path use a simple deterministic tier-to-score rule:

- `tier 1 -> score 300`
- `tier 2 -> score 500`
- `tier 3 -> score 700`

The lending demo then converts score into borrowing terms:

- `0-299 -> 12% APR`
- `300-599 -> 10% APR`
- `600-1000 -> 8% APR`

## Security Model

| Risk | Mitigation |
| --- | --- |
| Fake certificate | verifier checks the attester signature |
| Replay attack | claimant address binding and deadline in certificate inputs |
| Score transfer | soulbound score token, transfers revert |
| Unauthorized mint | adapter-only mint permission on the score token |
| Verifier migration risk | owner-controlled `setVerifier()` on the adapter |

## Contracts

### Core

- `contracts/src/credit/CreditScoreSBT.sol`
- `contracts/src/credit/GovernanceVerifierAdapter.sol`
- `contracts/src/lending/LendingDemo.sol`

### Verifiers

- `contracts/src/credit/AttestedSnapshotVerifier.sol`
- `contracts/src/credit/DemoCertificateVerifier.sol`
- `contracts/src/credit/SystemPrecompileVerifier.sol`

### Scripts

- `contracts/script/DeployPolkaZKCredit.s.sol`
- `contracts/script/UpgradeVerifierToAttestedSnapshot.s.sol`
- `contracts/script/UpgradeVerifierToDemo.s.sol`

## Live Deployment

Network:

- `Polkadot Hub Testnet`
- Chain ID: `420420417`
- RPC: `https://services.polkadothub-rpc.com/testnet`

Current deployed contracts:

- `CreditScoreSBT`: `0x86aadce8f673Ef9D332F1b027D71a0C8f22294B0`
- `GovernanceVerifierAdapter`: `0x9BBf0251BB9CD128c7dcE0474cF016D618D5749C`
- `AttestedSnapshotVerifier` (current live verifier): `0xe1052656aec5f8F5a722e2776AaFe37C708e0cF7`
- `SystemPrecompileVerifier`: `0x286A603ECC821696fc46625c56d809785B2132f3`
- `DemoCertificateVerifier` (legacy debug path): `0x0fA17619c768416b8246aAC388DCd66a23695eb4`
- `LendingDemo`: `0x287974951879D77AdEcd8B115D2d16ef396B464c`

Current code path:

- `AttestedSnapshotVerifier.sol` is the active live verifier for submission
- the existing adapter can be upgraded in-place with `setVerifier()`
- `DemoCertificateVerifier.sol` remains preserved as the earlier MetaMask-only step

Native asset demo path:

- Asset: `USDT`
- Asset ID: `1984`
- ERC20 precompile address: `0x000007C000000000000000000000000001200000`

## User Flow

1. Connect wallet on the dashboard.
2. Click `Check Eligibility`.
3. The app resolves the earned tier from the fixture-backed governance snapshot.
4. The attester service issues a certificate for that earned tier only.
5. Submit the certificate on-chain.
6. Receive or update the soulbound credit score.
7. Refresh the lending quote.
8. See lower APR and higher borrow capacity.

## Demo Flow For Judges

1. Open the dashboard on Polkadot Hub Testnet.
2. Show a wallet with no score and the baseline quote.
3. Connect MetaMask.
4. Click `Check Eligibility` and show the earned tier.
5. Submit the attester-issued certificate.
6. Show the score token being minted or updated.
7. Refresh the lending quote.
8. Show the improved APR and borrow cap.
9. Point out the native Polkadot angle:
   cross-VM certificate binding via the System precompile, native-asset-compatible lending path live, stable adapter for future PolkaVM verifier.

## Local Setup

### Prerequisites

- Node.js
- `pnpm`
- Foundry `nightly`

### Install

```bash
pnpm install
```

### Environment

```bash
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
```

Fill `.env` with:

- `PRIVATE_KEY`
- `OWNER_ADDRESS`
- `ATTESTER_ADDRESS`
- `ADAPTER_ADDRESS` if upgrading the live verifier

Fill `apps/web/.env.local` with:

- `ATTESTER_PRIVATE_KEY`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_SCORE_TOKEN_ADDRESS`
- `NEXT_PUBLIC_ADAPTER_ADDRESS`
- `NEXT_PUBLIC_LENDING_DEMO_ADDRESS`
- `NEXT_PUBLIC_QUOTE_ASSET_ADDRESS`
- `NEXT_PUBLIC_QUOTE_ASSET_ID`
- `NEXT_PUBLIC_QUOTE_ASSET_DECIMALS`
- `NEXT_PUBLIC_SYSTEM_PRECOMPILE_ADDRESS`
- optional: `ENABLE_DEMO_OVERRIDE=1` for a public demo deployment that should allow non-fixture wallets to complete the flow

### Run the web app

```bash
pnpm --filter web dev
```

## Deploy To Vercel

This repository is a monorepo. The deployable Next.js app is `apps/web`.

In Vercel:

1. Import the GitHub repository.
2. Set the **Root Directory** to `apps/web`.
3. Keep the framework preset as `Next.js`.
4. Use `pnpm` as the package manager.

Environment variables required in Vercel:

```bash
NEXT_PUBLIC_RPC_URL=https://services.polkadothub-rpc.com/testnet
NEXT_PUBLIC_CHAIN_ID=420420417
NEXT_PUBLIC_SCORE_TOKEN_ADDRESS=0x86aadce8f673Ef9D332F1b027D71a0C8f22294B0
NEXT_PUBLIC_ADAPTER_ADDRESS=0x9BBf0251BB9CD128c7dcE0474cF016D618D5749C
NEXT_PUBLIC_LENDING_DEMO_ADDRESS=0x287974951879D77AdEcd8B115D2d16ef396B464c
NEXT_PUBLIC_QUOTE_ASSET_ADDRESS=0x000007C000000000000000000000000001200000
NEXT_PUBLIC_QUOTE_ASSET_ID=1984
NEXT_PUBLIC_QUOTE_ASSET_DECIMALS=18
NEXT_PUBLIC_SYSTEM_PRECOMPILE_ADDRESS=0x0000000000000000000000000000000000000900
ATTESTER_PRIVATE_KEY=0xYOUR_ATTESTER_PRIVATE_KEY
```

Optional for demo-only deployments:

```bash
ENABLE_DEMO_OVERRIDE=1
```

Use `ENABLE_DEMO_OVERRIDE=1` only if you want any connected wallet on the deployed app to pass eligibility for judge/demo purposes. Leave it unset or `0` if you want the deployment to use only the fixture-backed snapshot addresses.

## Deployment

Deploy the full stack:

```bash
source .env

forge script contracts/script/DeployPolkaZKCredit.s.sol:DeployPolkaZKCredit \
  --chain 420420417 \
  --rpc-url https://services.polkadothub-rpc.com/testnet \
  --broadcast
```

Upgrade an existing adapter to the attested snapshot verifier:

```bash
source .env

forge script contracts/script/UpgradeVerifierToAttestedSnapshot.s.sol:UpgradeVerifierToAttestedSnapshot \
  --chain 420420417 \
  --rpc-url https://services.polkadothub-rpc.com/testnet \
  --broadcast
```

## Verification

Contracts:

```bash
forge test --offline
```

Frontend:

```bash
pnpm --filter web lint
pnpm --filter web build
```

## Repository Structure

```text
apps/web          Next.js dashboard
contracts/src     Solidity contracts
contracts/test    Foundry tests
contracts/script  Deployment and upgrade scripts
packages/shared   Shared frontend helpers and types
docs              PRD, spec, deployment, verification, architecture notes
```

## Current Limitations

- the checked-in governance snapshot is a deterministic fixture, not a live Polkassembly/Subsquare importer yet
- the stronger native verifier path is preserved but not the default live path
- this is a lending demo, not a production money market
- the ERC20 precompile path does not expose `name()`, `symbol()`, or `decimals()`

## Roadmap

Post-hackathon upgrades:

- stronger native `sr25519` certificate flow
- Rust/PolkaVM verifier backend
- zk certificate generation
- cross-chain reputation via XCM
- richer governance-derived scoring
- repayment reputation
