// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title KaySwapAMM
 * @notice Automated Market Maker (AMM) for Kavya (KAV) / ETH pair using Constant Product Formula (x * y = k)
 * @dev Implements LP tokens (KAY-LP), liquidity management, concentrated range positions, LP fee collection, and slippage-protected swaps.
 */
contract KaySwapAMM is ERC20, ReentrancyGuard {
    IERC20 public immutable kavToken;

    uint256 public reserveKAV;
    uint256 public reserveETH;

    // Cumulative pool statistics
    uint256 public cumulativeFeeKAV;
    uint256 public cumulativeFeeETH;
    uint256 public totalVolumeKAV;
    uint256 public totalVolumeETH;

    // Fee claiming per LP token holder
    mapping(address => uint256) public lpFeeKAVWithdrawn;
    mapping(address => uint256) public lpFeeETHWithdrawn;

    // Range Liquidity Position NFT structure
    struct Position {
        uint256 id;
        address owner;
        uint256 amountKAV;
        uint256 amountETH;
        uint256 minPrice; // ETH per KAV scaled by 1e18
        uint256 maxPrice; // ETH per KAV scaled by 1e18
        uint256 feeTier;  // 500 = 0.05%, 3000 = 0.30%, 10000 = 1.00%
        uint256 unclaimedKAV;
        uint256 unclaimedETH;
        uint256 createdAt;
        bool isActive;
    }

    uint256 public nextPositionId = 1;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public userPositionIds;

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
    event FeesCollected(address indexed provider, uint256 amountKAV, uint256 amountETH);
    event PositionCreated(uint256 indexed positionId, address indexed owner, uint256 amountKAV, uint256 amountETH, uint256 minPrice, uint256 maxPrice, uint256 feeTier);
    event PositionClosed(uint256 indexed positionId, address indexed owner, uint256 returnedKAV, uint256 returnedETH);

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
     * @notice Get total volume and fee statistics
     */
    function getPoolStats() external view returns (
        uint256 _cumulativeFeeKAV,
        uint256 _cumulativeFeeETH,
        uint256 _totalVolumeKAV,
        uint256 _totalVolumeETH
    ) {
        return (cumulativeFeeKAV, cumulativeFeeETH, totalVolumeKAV, totalVolumeETH);
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

        require(kavToken.transferFrom(msg.sender, address(this), amountKAV), "KaySwap: KAV transfer failed");

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
     * @notice Create concentrated price range liquidity position
     */
    function addRangePosition(
        uint256 minPrice,
        uint256 maxPrice,
        uint256 feeTier,
        uint256 amountKAVDesired
    ) external payable nonReentrant returns (uint256 positionId) {
        require(amountKAVDesired > 0, "KaySwap: KAV amount must be > 0");
        require(msg.value > 0, "KaySwap: ETH amount must be > 0");
        require(maxPrice > minPrice, "KaySwap: Invalid price range bounds");
        require(feeTier == 500 || feeTier == 3000 || feeTier == 10000, "KaySwap: Invalid fee tier");

        require(kavToken.transferFrom(msg.sender, address(this), amountKAVDesired), "KaySwap: KAV transfer failed");

        positionId = nextPositionId++;
        positions[positionId] = Position({
            id: positionId,
            owner: msg.sender,
            amountKAV: amountKAVDesired,
            amountETH: msg.value,
            minPrice: minPrice,
            maxPrice: maxPrice,
            feeTier: feeTier,
            unclaimedKAV: 0,
            unclaimedETH: 0,
            createdAt: block.timestamp,
            isActive: true
        });

        userPositionIds[msg.sender].push(positionId);

        reserveKAV += amountKAVDesired;
        reserveETH += msg.value;

        emit PositionCreated(positionId, msg.sender, amountKAVDesired, msg.value, minPrice, maxPrice, feeTier);
    }

    /**
     * @notice Calculate pending fees for LP token holder
     */
    function getPendingFees(address user) public view returns (uint256 pendingKAV, uint256 pendingETH) {
        uint256 lpBal = balanceOf(user);
        uint256 totalLp = totalSupply();
        if (totalLp == 0 || lpBal == 0) return (0, 0);

        uint256 entitledKAV = (cumulativeFeeKAV * lpBal) / totalLp;
        uint256 entitledETH = (cumulativeFeeETH * lpBal) / totalLp;

        pendingKAV = entitledKAV > lpFeeKAVWithdrawn[user] ? entitledKAV - lpFeeKAVWithdrawn[user] : 0;
        pendingETH = entitledETH > lpFeeETHWithdrawn[user] ? entitledETH - lpFeeETHWithdrawn[user] : 0;
    }

    /**
     * @notice Collect accumulated swap fee earnings
     */
    function collectFees() external nonReentrant returns (uint256 claimedKAV, uint256 claimedETH) {
        (claimedKAV, claimedETH) = getPendingFees(msg.sender);
        require(claimedKAV > 0 || claimedETH > 0, "KaySwap: No fees available to collect");

        lpFeeKAVWithdrawn[msg.sender] += claimedKAV;
        lpFeeETHWithdrawn[msg.sender] += claimedETH;

        if (claimedKAV > 0) {
            require(kavToken.transfer(msg.sender, claimedKAV), "KaySwap: Fee KAV transfer failed");
        }
        if (claimedETH > 0) {
            (bool ethSuccess, ) = payable(msg.sender).call{value: claimedETH}("");
            require(ethSuccess, "KaySwap: Fee ETH transfer failed");
        }

        emit FeesCollected(msg.sender, claimedKAV, claimedETH);
    }

    /**
     * @notice Collect accrued fees for a specific range position
     */
    function collectPositionFees(uint256 positionId) external nonReentrant {
        Position storage pos = positions[positionId];
        require(pos.owner == msg.sender, "KaySwap: Not position owner");
        require(pos.isActive, "KaySwap: Position inactive");

        uint256 claimKAV = pos.unclaimedKAV;
        uint256 claimETH = pos.unclaimedETH;

        pos.unclaimedKAV = 0;
        pos.unclaimedETH = 0;

        if (claimKAV > 0) {
            require(kavToken.transfer(msg.sender, claimKAV), "KaySwap: Position KAV fee transfer failed");
        }
        if (claimETH > 0) {
            (bool ethSuccess, ) = payable(msg.sender).call{value: claimETH}("");
            require(ethSuccess, "KaySwap: Position ETH fee transfer failed");
        }

        emit FeesCollected(msg.sender, claimKAV, claimETH);
    }

    /**
     * @notice Close range liquidity position and redeem funds
     */
    function removePosition(uint256 positionId) external nonReentrant returns (uint256 amountKAV, uint256 amountETH) {
        Position storage pos = positions[positionId];
        require(pos.owner == msg.sender, "KaySwap: Not position owner");
        require(pos.isActive, "KaySwap: Position inactive");

        amountKAV = pos.amountKAV + pos.unclaimedKAV;
        amountETH = pos.amountETH + pos.unclaimedETH;
        pos.isActive = false;

        if (reserveKAV >= pos.amountKAV) reserveKAV -= pos.amountKAV;
        if (reserveETH >= pos.amountETH) reserveETH -= pos.amountETH;

        require(kavToken.transfer(msg.sender, amountKAV), "KaySwap: KAV return failed");
        (bool ethSuccess, ) = payable(msg.sender).call{value: amountETH}("");
        require(ethSuccess, "KaySwap: ETH return failed");

        emit PositionClosed(positionId, msg.sender, amountKAV, amountETH);
    }

    /**
     * @notice Fetch all positions created by a user
     */
    function getUserPositions(address user) external view returns (Position[] memory) {
        uint256[] memory ids = userPositionIds[user];
        Position[] memory result = new Position[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = positions[ids[i]];
        }
        return result;
    }

    /**
     * @notice Remove liquidity by burning LP tokens to redeem proportional KAV and ETH reserves.
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
     */
    function swapKAVForETH(uint256 amountKAVIn, uint256 minETHOut) external nonReentrant returns (uint256 amountETHOut) {
        require(amountKAVIn > 0, "KaySwap: KAV input must be > 0");
        require(reserveKAV > 0 && reserveETH > 0, "KaySwap: Pool has no liquidity");

        amountETHOut = getAmountOut(amountKAVIn, reserveKAV, reserveETH);
        require(amountETHOut >= minETHOut, "KaySwap: Slippage tolerance exceeded");
        require(address(this).balance >= amountETHOut, "KaySwap: Insufficient contract ETH balance");

        require(kavToken.transferFrom(msg.sender, address(this), amountKAVIn), "KaySwap: KAV transfer failed");

        uint256 feeKAV = (amountKAVIn * 3) / 1000;
        cumulativeFeeKAV += feeKAV;
        totalVolumeKAV += amountKAVIn;

        reserveKAV += amountKAVIn;
        reserveETH -= amountETHOut;

        // Distribute fee share to existing active positions proportionally
        uint256[] memory posIds = userPositionIds[msg.sender];
        if (posIds.length > 0) {
            uint256 shareFee = feeKAV / posIds.length;
            for (uint256 i = 0; i < posIds.length; i++) {
                if (positions[posIds[i]].isActive) {
                    positions[posIds[i]].unclaimedKAV += shareFee;
                }
            }
        }

        (bool ethSuccess, ) = payable(msg.sender).call{value: amountETHOut}("");
        require(ethSuccess, "KaySwap: ETH transfer failed");

        emit SwapExecuted(msg.sender, address(kavToken), amountKAVIn, address(0), amountETHOut, msg.sender);
    }

    /**
     * @notice Swap ETH for KAV tokens
     */
    function swapETHForKAV(uint256 minKAVOut) external payable nonReentrant returns (uint256 amountKAVOut) {
        require(msg.value > 0, "KaySwap: ETH input must be > 0");
        require(reserveKAV > 0 && reserveETH > 0, "KaySwap: Pool has no liquidity");

        amountKAVOut = getAmountOut(msg.value, reserveETH, reserveKAV);
        require(amountKAVOut >= minKAVOut, "KaySwap: Slippage tolerance exceeded");
        require(kavToken.balanceOf(address(this)) >= amountKAVOut, "KaySwap: Insufficient pool KAV balance");

        uint256 feeETH = (msg.value * 3) / 1000;
        cumulativeFeeETH += feeETH;
        totalVolumeETH += msg.value;

        reserveETH += msg.value;
        reserveKAV -= amountKAVOut;

        uint256[] memory posIds = userPositionIds[msg.sender];
        if (posIds.length > 0) {
            uint256 shareFee = feeETH / posIds.length;
            for (uint256 i = 0; i < posIds.length; i++) {
                if (positions[posIds[i]].isActive) {
                    positions[posIds[i]].unclaimedETH += shareFee;
                }
            }
        }

        require(kavToken.transfer(msg.sender, amountKAVOut), "KaySwap: KAV transfer failed");

        emit SwapExecuted(msg.sender, address(0), msg.value, address(kavToken), amountKAVOut, msg.sender);
    }

    receive() external payable {}
}
