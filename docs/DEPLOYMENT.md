# Deployment

## Contract order

Deploy the contracts in this order:

1. `CreditScoreSBT`
2. `SystemPrecompileVerifier`
3. `GovernanceVerifierAdapter`
4. `CreditScoreSBT.setMinter(adapter)`
5. `LendingDemo`

This order matches the current constructor and access-control requirements:

- `CreditScoreSBT` needs an owner
- `GovernanceVerifierAdapter` needs the verifier and score token addresses
- `CreditScoreSBT` must grant the adapter mint permissions before proof submissions work
- `LendingDemo` needs the score token and quote asset addresses

## Attested snapshot verifier upgrade

If you already deployed the native verifier path and want the snapshot-attester flow, you do not need to redeploy the full stack.

Use the existing adapter and score token, then:

1. Deploy `AttestedSnapshotVerifier`
2. Call `GovernanceVerifierAdapter.setVerifier(newVerifier)`

This preserves the score token and lending deployment while switching the live certificate validation path to the attested snapshot verifier.

Example:

```bash
source .env

forge script contracts/script/UpgradeVerifierToAttestedSnapshot.s.sol:UpgradeVerifierToAttestedSnapshot \
  --chain 420420417 \
  --rpc-url https://services.polkadothub-rpc.com/testnet \
  --broadcast
```

This requires:

- `ADAPTER_ADDRESS`
- `ATTESTER_ADDRESS`

If you want the older MetaMask self-signed demo flow for debugging, the legacy script remains available:

```bash
source .env

forge script contracts/script/UpgradeVerifierToDemo.s.sol:UpgradeVerifierToDemo \
  --chain 420420417 \
  --rpc-url https://services.polkadothub-rpc.com/testnet \
  --broadcast
```

## Current deployment mode

The current deployment flow uses standard Foundry Solidity compilation and therefore deploys the contracts into the `EVM/REVM` environment on Polkadot Hub.

That deployment mode still matches the product correctly because the project is primarily an EVM app on Polkadot Hub while also using:

- existing Polkadot-native precompile interfaces
- native asset-compatible ERC20 paths

Do not describe the deployed contracts as `PVM/PolkaVM contracts` unless you switch to a PVM-specific compilation flow such as `resolc` or Remix Revive.

## Target network

Recommended hackathon target:

- Network: `Polkadot Hub Testnet`
- Chain ID: `420420417`
- ETH Proxy RPC: `https://services.polkadothub-rpc.com/testnet`
- Alternative RPC: `https://eth-rpc-testnet.polkadot.io/`
- Blockscout: `https://blockscout-testnet.polkadot.io/`
- Routescan: `https://polkadot.testnet.routescan.io/`

Mainnet is accepted by the organizers as well, but testnet is the safer default for the MVP.

## Required environment

Copy `.env.example` to `.env` and set:

- `PRIVATE_KEY`
- `OWNER_ADDRESS`
- `QUOTE_ASSET_ADDRESS`

Default demo asset:

- Asset: `USDT`
- Asset ID: `1984`
- ERC20 precompile address: `0x000007C000000000000000000000000001200000`

`OWNER_ADDRESS` must currently match the broadcaster derived from `PRIVATE_KEY`, because `CreditScoreSBT` does not yet support ownership transfer and the deployment flow must call `setMinter` immediately.

Optional values:

- `SYSTEM_PRECOMPILE_ADDRESS`
- `BASE_APR_BPS`
- `BASE_BORROW_AMOUNT`
- `WRITE_DEPLOYMENT_FILE`
- `RPC_URL`
- `CHAIN_ID`

## Run the deployment script

Dry run:

```bash
forge script contracts/script/DeployPolkaZKCredit.s.sol:DeployPolkaZKCredit --offline
```

Broadcast:

```bash
forge script contracts/script/DeployPolkaZKCredit.s.sol:DeployPolkaZKCredit \
  --chain 420420417 \
  --rpc-url "https://services.polkadothub-rpc.com/testnet" \
  --broadcast
```

If you are on Foundry nightly with native Polkadot support, you can also use:

```bash
forge script contracts/script/DeployPolkaZKCredit.s.sol:DeployPolkaZKCredit \
  --chain polkadot-testnet \
  --broadcast
```

Set `WRITE_DEPLOYMENT_FILE=1` only if you want the script to attempt writing `deployments/latest.json`. Leave it at `0` for dry runs or restricted environments.

## Frontend wiring

Copy `apps/web/.env.local.example` to `apps/web/.env.local` and fill in:

- `NEXT_PUBLIC_SCORE_TOKEN_ADDRESS`
- `NEXT_PUBLIC_VERIFIER_ADDRESS`
- `NEXT_PUBLIC_ADAPTER_ADDRESS`
- `NEXT_PUBLIC_LENDING_DEMO_ADDRESS`
- `NEXT_PUBLIC_QUOTE_ASSET_ADDRESS`
- `NEXT_PUBLIC_SYSTEM_PRECOMPILE_ADDRESS`

## Notes

- Foundry nightly is recommended for Polkadot Hub deployment and verification support.
- The current verifier contract is shaped around the Polkadot Hub System precompile at `0x0000000000000000000000000000000000000900`.
- The current lending contract expects a native-asset-compatible ERC20 interface address.
- For Polkadot Hub testnet, use the real quote asset precompile address you intend to demo against.
- ERC20 precompile metadata methods such as `name()`, `symbol()`, and `decimals()` are not available.
- Existing precompiles are enough for the native Polkadot angle; a custom runtime precompile is not required for the MVP.
