// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AttestedSnapshotVerifier} from "../src/credit/AttestedSnapshotVerifier.sol";
import {GovernanceVerifierAdapter} from "../src/credit/GovernanceVerifierAdapter.sol";
import {SYSTEM_ADDR} from "../src/interfaces/ISystem.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256);
    function envAddress(string calldata name) external view returns (address);
    function envOr(string calldata name, address defaultValue) external view returns (address);
    function addr(uint256 privateKey) external view returns (address);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

address constant VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));

contract UpgradeVerifierToAttestedSnapshot {
    Vm internal constant vm = Vm(VM_ADDRESS);

    error InvalidOwner(address owner, address deployer);

    function run() external returns (address snapshotVerifier) {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        address owner = vm.envAddress("OWNER_ADDRESS");
        if (owner != deployer) revert InvalidOwner(owner, deployer);

        address attester = vm.envAddress("ATTESTER_ADDRESS");
        address systemPrecompile = vm.envOr("SYSTEM_PRECOMPILE_ADDRESS", SYSTEM_ADDR);
        GovernanceVerifierAdapter adapter = GovernanceVerifierAdapter(vm.envAddress("ADAPTER_ADDRESS"));

        vm.startBroadcast(privateKey);
        AttestedSnapshotVerifier verifier = new AttestedSnapshotVerifier(attester, systemPrecompile);
        adapter.setVerifier(address(verifier));
        vm.stopBroadcast();

        return address(verifier);
    }
}
