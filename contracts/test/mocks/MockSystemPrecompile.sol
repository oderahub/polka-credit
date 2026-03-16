// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ISystem} from "../../src/interfaces/ISystem.sol";

contract MockSystemPrecompile is ISystem {
    bool public shouldVerify = true;

    function setShouldVerify(bool nextValue) external {
        shouldVerify = nextValue;
    }

    function hashBlake256(bytes memory input) external pure returns (bytes32 digest) {
        return keccak256(abi.encodePacked("mock-blake2-256", input));
    }

    function hashBlake128(bytes memory input) external pure returns (bytes32 digest) {
        return keccak256(abi.encodePacked("mock-blake2-128", input));
    }

    function toAccountId(address input) external pure returns (bytes memory accountId) {
        return abi.encodePacked(bytes12(0), input);
    }

    function callerIsOrigin() external pure returns (bool) {
        return true;
    }

    function callerIsRoot() external pure returns (bool) {
        return false;
    }

    function minimumBalance() external pure returns (uint256) {
        return 1;
    }

    function ownCodeHash() external pure returns (bytes32) {
        return keccak256("mock-code-hash");
    }

    function weightLeft() external pure returns (uint64 refTime, uint64 proofSize) {
        return (1_000_000, 64_000);
    }

    function terminate(address) external pure {
        revert("terminate not supported in mock");
    }

    function sr25519Verify(uint8[64] calldata signature, bytes calldata message, bytes32 publicKey)
        external
        view
        returns (bool)
    {
        return shouldVerify && signature[0] != 0 && message.length != 0 && publicKey != bytes32(0);
    }

    function ecdsaToEthAddress(uint8[33] calldata publicKey) external pure returns (bytes20) {
        bytes32 hash = keccak256(abi.encodePacked(publicKey));
        return bytes20(hash);
    }
}
