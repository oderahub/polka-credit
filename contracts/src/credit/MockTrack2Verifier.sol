// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ITrack2Verifier} from "../interfaces/ITrack2Verifier.sol";

contract MockTrack2Verifier is ITrack2Verifier {
    error InvalidProof();

    event ProofChecked(address indexed user, bytes proof, bytes publicInputs, bytes context, uint256 score);

    function verifyAndScore(
        address user,
        bytes calldata proof,
        bytes calldata publicInputs,
        bytes calldata context
    ) external returns (bool valid, uint256 score) {
        if (proof.length == 0 || publicInputs.length == 0) revert InvalidProof();

        uint256 tier = uint8(publicInputs[0]);
        if (tier == 1) {
            score = 300;
        } else if (tier == 2) {
            score = 500;
        } else if (tier >= 3) {
            score = 700;
        } else {
            revert InvalidProof();
        }

        valid = true;
        emit ProofChecked(user, proof, publicInputs, context, score);
    }
}

