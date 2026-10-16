// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GXQToken.sol";

/**
 * @title SimpleSwap
 * @dev Automated Market Maker (AMM) with Constant Product formula (x * y = k)
 * Designed for GXQ Network V3.0.0 DEX with fee accrual and LP tokens
 */
contract SimpleSwap {
    address public gxqToken;
    address public pairedToken;
    address public feeCollector;

    uint256 public reserveGXQ;
    uint256 public reservePaired;
    uint256 public totalLiquidity;
    uint256 public feeBps = 30; // 0.30% fee

    mapping(address => uint256) public liquidity;

    event Mint(address indexed sender, uint256 amountGXQ, uint256 amountPaired);
    event Burn(address indexed sender, uint256 amountGXQ, uint256 amountPaired, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amountIn,
        uint256 amountOut,
        address tokenIn,
        address tokenOut
    );

    constructor(address _gxqToken, address _pairedToken, address _feeCollector) {
        gxqToken = _gxqToken;
        pairedToken = _pairedToken;
        feeCollector = _feeCollector;
    }

    function addLiquidity(uint256 amountGXQ, uint256 amountPaired) external returns (uint256 liquidityMinted) {
        require(amountGXQ > 0 && amountPaired > 0, "Invalid amounts");

        GXQToken(gxqToken).transferFrom(msg.sender, address(this), amountGXQ);
        GXQToken(pairedToken).transferFrom(msg.sender, address(this), amountPaired);

        if (totalLiquidity == 0) {
            liquidityMinted = sqrt(amountGXQ * amountPaired);
        } else {
            uint256 liq0 = (amountGXQ * totalLiquidity) / reserveGXQ;
            uint256 liq1 = (amountPaired * totalLiquidity) / reservePaired;
            liquidityMinted = liq0 < liq1 ? liq0 : liq1;
        }

        require(liquidityMinted > 0, "Insufficient liquidity minted");
        liquidity[msg.sender] += liquidityMinted;
        totalLiquidity += liquidityMinted;

        reserveGXQ += amountGXQ;
        reservePaired += amountPaired;

        emit Mint(msg.sender, amountGXQ, amountPaired);
    }

    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut) {
        require(tokenIn == gxqToken || tokenIn == pairedToken, "Unsupported token");
        require(amountIn > 0, "Zero input amount");

        bool isGXQIn = (tokenIn == gxqToken);
        uint256 reserveIn = isGXQIn ? reserveGXQ : reservePaired;
        uint256 reserveOut = isGXQIn ? reservePaired : reserveGXQ;

        GXQToken(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Deduct 0.3% fee
        uint256 amountInWithFee = amountIn * (10000 - feeBps);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        amountOut = numerator / denominator;

        require(amountOut >= minAmountOut, "Slippage limit exceeded");

        if (isGXQIn) {
            reserveGXQ += amountIn;
            reservePaired -= amountOut;
            GXQToken(pairedToken).transfer(msg.sender, amountOut);
        } else {
            reservePaired += amountIn;
            reserveGXQ -= amountOut;
            GXQToken(gxqToken).transfer(msg.sender, amountOut);
        }

        emit Swap(msg.sender, amountIn, amountOut, tokenIn, isGXQIn ? pairedToken : gxqToken);
    }

    function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256) {
        bool isGXQIn = (tokenIn == gxqToken);
        uint256 reserveIn = isGXQIn ? reserveGXQ : reservePaired;
        uint256 reserveOut = isGXQIn ? reservePaired : reserveGXQ;
        if (reserveIn == 0 || reserveOut == 0) return 0;

        uint256 amountInWithFee = amountIn * (10000 - feeBps);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        return numerator / denominator;
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
