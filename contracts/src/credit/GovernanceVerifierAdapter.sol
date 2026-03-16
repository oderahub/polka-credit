// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CreditScoreSBT} from "./CreditScoreSBT.sol";
import {ITrack2Verifier} from "../interfaces/ITrack2Verifier.sol";

contract GovernanceVerifierAdapter {
    error NotOwner();
    error InvalidVerifier();
    error InvalidProof();

    struct ProofSubmission {
        address claimant;
        bytes proof;
        bytes publicInputs;
        bytes context;
    }

    event VerifierUpdated(address indexed previousVerifier, address indexed newVerifier);
    event ProofAccepted(address indexed claimant, uint256 score);

    address public owner;
    CreditScoreSBT public immutable SCORE_TOKEN;
    ITrack2Verifier public verifier;

    constructor(address initialOwner, address verifierAddress, CreditScoreSBT scoreTokenAddress) {
        if (initialOwner == address(0) || verifierAddress == address(0) || address(scoreTokenAddress) == address(0)) {
            revert InvalidVerifier();
        }

        owner = initialOwner;
        verifier = ITrack2Verifier(verifierAddress);
        SCORE_TOKEN = scoreTokenAddress;
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function setVerifier(address newVerifier) external onlyOwner {
        if (newVerifier == address(0)) revert InvalidVerifier();
        emit VerifierUpdated(address(verifier), newVerifier);
        verifier = ITrack2Verifier(newVerifier);
    }

    function submitProof(ProofSubmission calldata submission) external returns (uint256 score) {
        if (submission.claimant != msg.sender) revert InvalidProof();

        (bool valid, uint256 computedScore) =
            verifier.verifyAndScore(submission.claimant, submission.proof, submission.publicInputs, submission.context);

        if (!valid) revert InvalidProof();

        SCORE_TOKEN.mintOrUpdate(submission.claimant, computedScore);
        emit ProofAccepted(submission.claimant, computedScore);
        return computedScore;
    }

    function _onlyOwner() internal view {
        if (msg.sender != owner) revert NotOwner();
    }
}
