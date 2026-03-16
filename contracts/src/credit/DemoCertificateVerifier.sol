// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ITrack2Verifier} from "../interfaces/ITrack2Verifier.sol";

contract DemoCertificateVerifier is ITrack2Verifier {
    error ExpiredCertificate();
    error InvalidProofEncoding();
    error InvalidSignature();
    error InvalidTier();

    event DemoCertificateUsed(address indexed user, bytes32 indexed datasetId, uint256 score);

    bytes32 private constant SECP256K1N_HALF =
        0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    function verifyAndScore(
        address user,
        bytes calldata proof,
        bytes calldata publicInputs,
        bytes calldata context
    ) external returns (bool valid, uint256 score) {
        if (proof.length != 65 || publicInputs.length == 0 || context.length == 0) revert InvalidProofEncoding();

        (uint8 tier, uint64 deadline) = abi.decode(publicInputs, (uint8, uint64));
        bytes32 datasetId = abi.decode(context, (bytes32));

        if (deadline < block.timestamp) revert ExpiredCertificate();

        bytes32 certificateHash = buildCertificateHash(user, tier, deadline, datasetId);
        address recovered = _recoverSigner(certificateHash, proof);
        if (recovered != user) revert InvalidSignature();

        score = _scoreForTier(tier);
        valid = true;

        emit DemoCertificateUsed(user, datasetId, score);
    }

    function buildCertificateHash(address user, uint8 tier, uint64 deadline, bytes32 datasetId)
        public
        view
        returns (bytes32)
    {
        if (tier == 0 || tier > 3) revert InvalidTier();

        return keccak256(
            abi.encodePacked(
                "PolkaZK Credit Demo Certificate",
                block.chainid,
                address(this),
                user,
                tier,
                deadline,
                datasetId
            )
        );
    }

    function _recoverSigner(bytes32 certificateHash, bytes calldata signature) internal pure returns (address signer) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (uint256(s) > uint256(SECP256K1N_HALF)) revert InvalidSignature();
        if (v < 27) v += 27;
        if (v != 27 && v != 28) revert InvalidSignature();

        signer = ecrecover(_toEthSignedMessageHash(certificateHash), v, r, s);
        if (signer == address(0)) revert InvalidSignature();
    }

    function _scoreForTier(uint8 tier) internal pure returns (uint256) {
        if (tier == 1) return 300;
        if (tier == 2) return 500;
        if (tier == 3) return 700;
        revert InvalidTier();
    }

    function _toEthSignedMessageHash(bytes32 messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    }
}
