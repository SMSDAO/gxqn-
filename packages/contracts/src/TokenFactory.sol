// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GXQToken.sol";

/**
 * @title TokenFactory
 * @dev Launchpad engine for community & enterprise tokens on GXQ Network
 */
contract TokenFactory {
    struct TokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        uint256 initialSupply;
        address creator;
        uint256 createdAt;
    }

    address public owner;
    bool public isLaunchpadPaused;
    uint256 public creationFee = 100 * 1e18; // 100 GXQ fee

    TokenInfo[] public deployedTokens;
    mapping(address => address[]) public tokensByCreator;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 initialSupply,
        address indexed creator
    );
    event LaunchpadPaused(bool paused);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) external returns (address) {
        require(!isLaunchpadPaused, "Launchpad is paused by administrator");
        require(bytes(name).length > 0, "Empty name");
        require(bytes(symbol).length > 0, "Empty symbol");
        require(initialSupply > 0, "Zero initial supply");

        GXQToken newToken = new GXQToken(initialSupply);
        // Transfer initial supply to creator
        newToken.transfer(msg.sender, initialSupply);
        newToken.transferOwnership(msg.sender);

        TokenInfo memory info = TokenInfo({
            tokenAddress: address(newToken),
            name: name,
            symbol: symbol,
            initialSupply: initialSupply,
            creator: msg.sender,
            createdAt: block.timestamp
        });

        deployedTokens.push(info);
        tokensByCreator[msg.sender].push(address(newToken));

        emit TokenCreated(address(newToken), name, symbol, initialSupply, msg.sender);
        return address(newToken);
    }

    function setLaunchpadPaused(bool _paused) external onlyOwner {
        isLaunchpadPaused = _paused;
        emit LaunchpadPaused(_paused);
    }

    function getAllTokens() external view returns (TokenInfo[] memory) {
        return deployedTokens;
    }

    function totalTokensCount() external view returns (uint256) {
        return deployedTokens.length;
    }
}
