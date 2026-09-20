// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title KaySwapAMM
 * @notice Automated Market Maker (AMM) for Kavya (KAV) / ETH pair using Constant Product Formula (x * y = k)
 * @dev Implements LP tokens (KAY-LP), liquidity management, and slippage-protected swaps.
 */
contract KaySwapAMM is ERC20, ReentrancyGuard {
    IERC20 public immutable kavToken;

    uint256 public reserveKAV;
    uint256 public reserveETH;

    event LiquidityAdded(address indexed provider, uint256 amountKAV, uint256 amountETH, uint256 lpMinted);
    event LiquidityRemoved(address indexed provider, uint256 amountKAV, uint256 amountETH, uint256 lpBurned);
    event SwapExecuted(
        address indexed sender,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOut,
        address indexed recipient
    );

    constructor(address _kavToken) ERC20("KaySwap LP Token", "KAY-LP") {
        require(_kavToken != address(0), "KaySwap: Invalid token address");
        kavToken = IERC20(_kavToken);
    }

    /**
     * @notice Get current reserves of KAV and ETH in pool
     */
    function getReserves() external view returns (uint256 _reserveKAV, uint256 _reserveETH) {
        return (reserveKAV, reserveETH);
    }

    /**
     * @notice Calculate swap output amount given input amount and current reserves with 0.3% fee
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "KaySwap: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "KaySwap: INSUFFICIENT_LIQUIDITY");
        
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @notice Add liquidity (KAV + ETH) to the pool.
     * @param amountKAVDesired Amount of KAV token caller wishes to provide.
     */
    function addLiquidity(uint256 amountKAVDesired) external payable nonReentrant returns (uint256 liquidity) {
        require(amountKAVDesired > 0, "KaySwap: KAV amount must be > 0");
        require(msg.value > 0, "KaySwap: ETH amount must be > 0");

        uint256 amountKAV;
        uint256 amountETH;

        uint256 _totalSupply = totalSupply();

        if (_totalSupply == 0) {
            amountKAV = amountKAVDesired;
            amountETH = msg.value;
            liquidity = Math.sqrt(amountKAV * amountETH);
            require(liquidity > 0, "KaySwap: INSUFFICIENT_LIQUIDITY_MINTED");
        } else {
            uint256 ethOptimal = (amountKAVDesired * reserveETH) / reserveKAV;
            if (ethOptimal <= msg.value) {
                amountKAV = amountKAVDesired;
                amountETH = ethOptimal;
            } else {
                uint256 kavOptimal = (msg.value * reserveKAV) / reserveETH;
                require(kavOptimal <= amountKAVDesired, "KaySwap: Invalid ratio calculation");
                amountKAV = kavOptimal;
                amountETH = msg.value;
            }

            liquidity = Math.min(
                (amountKAV * _totalSupply) / reserveKAV,
                (amountETH * _totalSupply) / reserveETH
            );
        }

        require(liquidity > 0, "KaySwap: Insufficient liquidity minted");

        // Transfer KAV tokens from caller
        require(kavToken.transferFrom(msg.sender, address(this), amountKAV), "KaySwap: KAV transfer failed");

        // Refund excess ETH if provided
        if (msg.value > amountETH) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - amountETH}("");
            require(refundSuccess, "KaySwap: ETH refund failed");
        }

        _mint(msg.sender, liquidity);

        reserveKAV += amountKAV;
        reserveETH += amountETH;

        emit LiquidityAdded(msg.sender, amountKAV, amountETH, liquidity);
    }

    /**
     * @notice Remove liquidity by burning LP tokens to redeem proportional KAV and ETH reserves.
     * @param liquidity Amount of LP tokens to burn.
     */
    function removeLiquidity(uint256 liquidity) external nonReentrant returns (uint256 amountKAV, uint256 amountETH) {
        require(liquidity > 0, "KaySwap: Liquidity amount must be > 0");
        require(balanceOf(msg.sender) >= liquidity, "KaySwap: Insufficient LP balance");

        uint256 _totalSupply = totalSupply();
        amountKAV = (liquidity * reserveKAV) / _totalSupply;
        amountETH = (liquidity * reserveETH) / _totalSupply;

        require(amountKAV > 0 && amountETH > 0, "KaySwap: Insufficient reserves returned");

        _burn(msg.sender, liquidity);

        reserveKAV -= amountKAV;
        reserveETH -= amountETH;

        require(kavToken.transfer(msg.sender, amountKAV), "KaySwap: KAV transfer failed");
        
        (bool ethSuccess, ) = payable(msg.sender).call{value: amountETH}("");
        require(ethSuccess, "KaySwap: ETH transfer failed");

        emit LiquidityRemoved(msg.sender, amountKAV, amountETH, liquidity);
    }

    /**
     * @notice Swap KAV tokens for ETH
     * @param amountKAVIn Amount of KAV to input
     * @param minETHOut Minimum ETH required out (Slippage check)
     */
    function swapKAVForETH(uint256 amountKAVIn, uint256 minETHOut) external nonReentrant returns (uint256 amountETHOut) {
        require(amountKAVIn > 0, "KaySwap: KAV input must be > 0");
        require(reserveKAV > 0 && reserveETH > 0, "KaySwap: Pool has no liquidity");

        amountETHOut = getAmountOut(amountKAVIn, reserveKAV, reserveETH);
        require(amountETHOut >= minETHOut, "KaySwap: Slippage tolerance exceeded");
        require(address(this).balance >= amountETHOut, "KaySwap: Insufficient contract ETH balance");

        require(kavToken.transferFrom(msg.sender, address(this), amountKAVIn), "KaySwap: KAV transfer failed");

        reserveKAV += amountKAVIn;
        reserveETH -= amountETHOut;

        (bool ethSuccess, ) = payable(msg.sender).call{value: amountETHOut}("");
        require(ethSuccess, "KaySwap: ETH transfer failed");

        emit SwapExecuted(msg.sender, address(kavToken), amountKAVIn, address(0), amountETHOut, msg.sender);
    }

    /**
     * @notice Swap ETH for KAV tokens
     * @param minKAVOut Minimum KAV required out (Slippage check)
     */
    function swapETHForKAV(uint256 minKAVOut) external payable nonReentrant returns (uint256 amountKAVOut) {
        require(msg.value > 0, "KaySwap: ETH input must be > 0");
        require(reserveKAV > 0 && reserveETH > 0, "KaySwap: Pool has no liquidity");

        amountKAVOut = getAmountOut(msg.value, reserveETH, reserveKAV);
        require(amountKAVOut >= minKAVOut, "KaySwap: Slippage tolerance exceeded");
        require(kavToken.balanceOf(address(this)) >= amountKAVOut, "KaySwap: Insufficient pool KAV balance");

        reserveETH += msg.value;
        reserveKAV -= amountKAVOut;

        require(kavToken.transfer(msg.sender, amountKAVOut), "KaySwap: KAV transfer failed");

        emit SwapExecuted(msg.sender, address(0), msg.value, address(kavToken), amountKAVOut, msg.sender);
    }

    // Fallback function to accept ETH
    receive() external payable {}
}
