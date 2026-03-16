// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ICreditScore} from "../interfaces/ICreditScore.sol";

contract CreditScoreSBT is ICreditScore {
    string public constant NAME = "PolkaZK Credit Score";
    string public constant SYMBOL = "PZKC";

    error AlreadyInitialized();
    error NotOwner();
    error NotMinter();
    error ZeroAddress();
    error Soulbound();
    error TokenDoesNotExist();

    event MinterUpdated(address indexed previousMinter, address indexed newMinter);
    event ScoreUpdated(address indexed user, uint256 indexed tokenId, uint256 previousScore, uint256 newScore);

    address public owner;
    address public minter;

    mapping(address => uint256) private _scores;
    mapping(address => bool) private _hasToken;

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    modifier onlyMinter() {
        _onlyMinter();
        _;
    }

    function name() external pure returns (string memory) {
        return NAME;
    }

    function symbol() external pure returns (string memory) {
        return SYMBOL;
    }

    function setMinter(address newMinter) external onlyOwner {
        if (newMinter == address(0)) revert ZeroAddress();
        emit MinterUpdated(minter, newMinter);
        minter = newMinter;
    }

    function mintOrUpdate(address user, uint256 newScore) external onlyMinter returns (uint256 tokenId) {
        if (user == address(0)) revert ZeroAddress();

        tokenId = tokenIdFor(user);
        uint256 previousScore = _scores[user];

        _scores[user] = newScore;
        _hasToken[user] = true;

        emit ScoreUpdated(user, tokenId, previousScore, newScore);
    }

    function getScore(address user) external view returns (uint256) {
        return _scores[user];
    }

    function hasToken(address user) external view returns (bool) {
        return _hasToken[user];
    }

    function balanceOf(address user) external view returns (uint256) {
        return _hasToken[user] ? 1 : 0;
    }

    function ownerOf(uint256 tokenId) external pure returns (address) {
        // forge-lint: disable-next-line(unsafe-typecast)
        address tokenOwner = address(uint160(tokenId));
        if (tokenOwner == address(0)) revert TokenDoesNotExist();
        return tokenOwner;
    }

    function transferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert Soulbound();
    }

    function approve(address, uint256) external pure {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) external pure {
        revert Soulbound();
    }

    function tokenIdFor(address user) public pure returns (uint256) {
        return uint256(uint160(user));
    }

    function _onlyOwner() internal view {
        if (msg.sender != owner) revert NotOwner();
    }

    function _onlyMinter() internal view {
        if (msg.sender != minter) revert NotMinter();
    }
}
