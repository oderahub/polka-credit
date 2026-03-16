// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ICreditScore} from "../interfaces/ICreditScore.sol";
import {IERC20Like} from "../interfaces/IERC20Like.sol";

contract LendingDemo {
    struct Quote {
        uint256 score;
        uint256 aprBps;
        uint256 maxBorrowAmount;
        uint256 nativeAssetBalance;
        uint256 nativeAssetTotalSupply;
    }

    ICreditScore public immutable CREDIT_SCORE;
    address public immutable QUOTE_ASSET;
    uint256 public immutable BASE_APR_BPS;
    uint256 public immutable MAX_BORROW_BASE;

    constructor(ICreditScore creditScoreAddress, address quoteAssetAddress, uint256 baseApr, uint256 baseBorrowAmount) {
        CREDIT_SCORE = creditScoreAddress;
        QUOTE_ASSET = quoteAssetAddress;
        BASE_APR_BPS = baseApr;
        MAX_BORROW_BASE = baseBorrowAmount;
    }

    function quoteFor(address user) external view returns (Quote memory quote) {
        uint256 score = CREDIT_SCORE.getScore(user);
        uint256 apr = _aprForScore(score);
        uint256 borrowCap = _maxBorrowForScore(score);
        uint256 assetBalance = IERC20Like(QUOTE_ASSET).balanceOf(user);
        uint256 assetSupply = IERC20Like(QUOTE_ASSET).totalSupply();

        quote = Quote({
            score: score,
            aprBps: apr,
            maxBorrowAmount: borrowCap,
            nativeAssetBalance: assetBalance,
            nativeAssetTotalSupply: assetSupply
        });
    }

    function _aprForScore(uint256 score) internal view returns (uint256) {
        if (score >= 600) return 800;
        if (score >= 300) return 1000;
        return BASE_APR_BPS;
    }

    function _maxBorrowForScore(uint256 score) internal view returns (uint256) {
        if (score >= 600) return MAX_BORROW_BASE * 150 / 100;
        if (score >= 300) return MAX_BORROW_BASE * 120 / 100;
        return MAX_BORROW_BASE;
    }
}
