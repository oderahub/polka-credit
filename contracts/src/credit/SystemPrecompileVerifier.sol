// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ITrack2Verifier} from "../interfaces/ITrack2Verifier.sol";
import {ISystem, SYSTEM_ADDR} from "../interfaces/ISystem.sol";

contract SystemPrecompileVerifier is ITrack2Verifier {
    error InvalidProofEncoding();
    error InvalidTier();
    error InvalidAddressBinding();
    error InvalidSignature();

    event NativeVerificationUsed(address indexed user, bytes32 indexed accountHash, uint256 score);

    ISystem public immutable SYSTEM;

    constructor(address systemAddress) {
        SYSTEM = ISystem(systemAddress == address(0) ? SYSTEM_ADDR : systemAddress);
    }

    function verifyAndScore(
        address user,
        bytes calldata proof,
        bytes calldata publicInputs,
        bytes calldata context
    ) external returns (bool valid, uint256 score) {
        if (proof.length == 0 || publicInputs.length == 0 || context.length == 0) revert InvalidProofEncoding();

        (uint8[64] memory signature, bytes32 publicKey) = _decodeProof(proof);
        (uint8 tier, bytes32 expectedAccountHash) = _decodePublicInputs(publicInputs);

        bytes32 accountHash = _accountHashFor(user);
        if (accountHash != expectedAccountHash) revert InvalidAddressBinding();

        bool signatureValid = SYSTEM.sr25519Verify(signature, context, publicKey);
        if (!signatureValid) revert InvalidSignature();

        score = _scoreForTier(tier);
        valid = true;

        emit NativeVerificationUsed(user, accountHash, score);
    }

    function _scoreForTier(uint8 tier) internal pure returns (uint256) {
        if (tier == 1) return 300;
        if (tier == 2) return 500;
        if (tier == 3) return 700;
        revert InvalidTier();
    }

    function _decodeProof(bytes calldata proof) internal pure returns (uint8[64] memory signature, bytes32 publicKey) {
        return abi.decode(proof, (uint8[64], bytes32));
    }

    function _decodePublicInputs(bytes calldata publicInputs) internal pure returns (uint8 tier, bytes32 expectedHash) {
        return abi.decode(publicInputs, (uint8, bytes32));
    }

    function _accountHashFor(address user) internal view returns (bytes32) {
        return SYSTEM.hashBlake256(SYSTEM.toAccountId(user));
    }
}
