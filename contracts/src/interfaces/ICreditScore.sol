// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface ICreditScore {
    function getScore(address user) external view returns (uint256);
}

