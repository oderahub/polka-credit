# System Map

## Modules
- `contracts/credit` — score token, verifier adapter, and reputation validation boundary
- `contracts/lending` — demo lending logic that reads score and exposes score-aware quotes
- `apps/web` — dashboard, wallet flow, proof submission, score display, and quote UI
- `packages/shared` — shared interfaces and types
- `docs` — architecture, spec, PRD, and verification contract

## Polkadot-native components
- `System precompile` — native signature or account utility path for cross-VM validation
- `ERC20 precompile` — native asset-compatible path for lending demo integration
- `Rust/PolkaVM verifier` — optional backend behind a stable verifier interface

## Deployment interpretation
- current contract deployment flow uses standard Solidity tooling and therefore targets `EVM/REVM`
- native Polkadot alignment comes from precompile usage and native asset integration
- moving part of the stack to `PVM/PolkaVM` remains a future extension, not a hidden assumption

## Critical flows
1. User connects wallet
2. Frontend loads or generates a deterministic proof package
3. Verifier adapter validates the proof through a native capability path
4. Score contract mints or updates the SBT
5. Lending demo reads score and returns a score-aware quote

## Shared contracts to define first
- `ICreditScore` — read score across contracts
- `IProofVerifier` or `ITrack2Verifier` — stable verification boundary
- shared frontend types for proof payloads, score tiers, and quote responses
