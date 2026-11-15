// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KavyaToken (KAV)
 * @notice ERC-20 token for KaySwap with parameterized Max Supply and Initial Supply configured at deployment.
 */
contract KavyaToken is ERC20, ERC20Burnable, Ownable {
    uint256 public immutable MAX_SUPPLY;
    
    // Faucet tracking for testnet usage (1,000 KAV per claim per 24 hours)
    uint256 public constant FAUCET_AMOUNT = 1_000 * 10**18;
    mapping(address => uint256) public lastFaucetClaim;

    event FaucetClaimed(address indexed user, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);

    /**
     * @param initialOwner Address of the token owner
     * @param _maxSupply Maximum total token supply cap
     * @param _initialSupply Amount of initial supply to mint upon deployment (e.g. 50% of max supply)
     */
    constructor(
        address initialOwner,
        uint256 _maxSupply,
        uint256 _initialSupply
    ) ERC20("Kavya", "KAV") Ownable(initialOwner) {
        require(_maxSupply > 0, "KavyaToken: Max supply must be > 0");
        require(_initialSupply <= _maxSupply, "KavyaToken: Initial supply exceeds max supply");
        
        MAX_SUPPLY = _maxSupply;
        _mint(initialOwner, _initialSupply);
        emit TokensMinted(initialOwner, _initialSupply);
    }

    /**
     * @notice Mint remaining supply up to MAX_SUPPLY limit. Only contract owner can invoke.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "KavyaToken: Exceeds max supply limit");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Testnet Faucet to allow any Sepolia user to request 1,000 KAV for testing swaps & liquidity
     */
    function claimFaucet() external {
        require(block.timestamp >= lastFaucetClaim[msg.sender] + 1 days, "KavyaToken: Faucet claim available once every 24 hours");
        require(totalSupply() + FAUCET_AMOUNT <= MAX_SUPPLY, "KavyaToken: Faucet claim exceeds max supply limit");
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }
}

