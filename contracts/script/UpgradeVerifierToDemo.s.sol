// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {DemoCertificateVerifier} from "../src/credit/DemoCertificateVerifier.sol";
import {GovernanceVerifierAdapter} from "../src/credit/GovernanceVerifierAdapter.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256);
    function envAddress(string calldata name) external view returns (address);
    function addr(uint256 privateKey) external view returns (address);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

address constant VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));

contract UpgradeVerifierToDemo {
    Vm internal constant vm = Vm(VM_ADDRESS);

    error InvalidOwner(address owner, address deployer);

    function run() external returns (address demoVerifier) {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        address owner = vm.envAddress("OWNER_ADDRESS");
        if (owner != deployer) revert InvalidOwner(owner, deployer);

        GovernanceVerifierAdapter adapter = GovernanceVerifierAdapter(vm.envAddress("ADAPTER_ADDRESS"));

        vm.startBroadcast(privateKey);
        DemoCertificateVerifier verifier = new DemoCertificateVerifier();
        adapter.setVerifier(address(verifier));
        vm.stopBroadcast();

        return address(verifier);
    }
}
