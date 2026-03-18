# Verification

## Principles
- Use the narrowest valid check first.
- Read actual command output before proceeding.
- Do not declare success from code inspection alone.

## Contracts
- Build: `forge build`
- Tests: `forge test --offline`
- Formatting: `forge fmt --check`
- Deployment dry run: `forge script contracts/script/DeployPolkaZKCredit.s.sol:DeployPolkaZKCredit --offline`
- Live deployment target: `--chain polkadot-testnet` on Foundry nightly, or explicit RPC `https://services.polkadothub-rpc.com/testnet`

## Frontend
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Tests: `pnpm test`
- Build: `pnpm build`

## End-to-end smoke flow
1. Connect wallet
2. Submit deterministic proof package or fixture-backed mock proof
3. Verifier adapter succeeds through the intended native capability path
4. Score contract mints or updates SBT
5. Lending demo reads score and returns updated quote
6. UI displays the before-and-after result

## Native capability proof points
- Verify at least one native Polkadot capability is exercised in a real code path.
- Prefer contract or integration tests that show System precompile, ERC20 precompile, or a Rust/PolkaVM verifier boundary being invoked.
- Do not treat deployment to Polkadot Hub alone as sufficient proof of the native architecture angle.
- Do not assume ERC20 metadata functions exist on the native asset precompile path.

## Failure handling
- Capture exact failing command
- Capture exact error output
- Identify smallest root cause
- Apply minimal safe fix
- Rerun the same verification
