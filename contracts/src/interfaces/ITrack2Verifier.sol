// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface ITrack2Verifier {
    function verifyAndScore(
        address user,
        bytes calldata proof,
        bytes calldata publicInputs,
        bytes calldata context
    ) external returns (bool valid, uint256 score);
}

