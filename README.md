# KaySwap | Decentralized Exchange & Liquidity Protocol on Ethereum Sepolia

<p align="center">
  <img src="./frontend/src/KaySwap.png" alt="KaySwap Logo" width="140" />
</p>

<p align="center">
  <strong>High-Performance Automated Market Maker (AMM) • Concentrated Liquidity • Dynamic ERC-721 LP Certificates • PostgreSQL Feedback Engine</strong>
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Features-Complete-brightgreen" alt="Features" /></a>
  <a href="#-deployed-smart-contracts-sepolia"><img src="https://img.shields.io/badge/Network-Ethereum%20Sepolia-blue" alt="Sepolia Network" /></a>
  <a href="#-storage--zero-localstorage-guarantee"><img src="https://img.shields.io/badge/Storage-PostgreSQL%20Only-blueviolet" alt="Storage PostgreSQL Only" /></a>
  <a href="#-license"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" /></a>
</p>

---

## 🌟 Overview

**KaySwap** is a production-grade Web3 Decentralized Exchange (DEX) and Automated Market Maker (AMM) protocol built for swapping **Kavya Token (KAV)** with **ETH** on the Ethereum **Sepolia Testnet**.

Engineered with modern DeFi standards, KaySwap delivers constant-product liquidity dynamics ($x \cdot y = k$), concentrated liquidity positions, dynamic on-chain **ERC-721 Liquidity Provider NFT Certificates**, real-time blockchain indexing through **Alchemy API**, Sign-In With Ethereum (SIWE) session authentication, and a dedicated **PostgreSQL database** for community reviews and user feedback—with a strict **Zero LocalStorage** architecture.

---

## 📌 Deployed Smart Contracts (Sepolia)

All protocol smart contracts are deployed and verified on the **Ethereum Sepolia Testnet** (Chain ID: `11155111`):

| Contract Name | Symbol | Address | Sepolia Etherscan |
| :--- | :---: | :---: | :--- |
| **KavyaToken** (ERC-20) | `KAV` | `0x89C74d54EF808F31e2420070f2c18D1b30a13781` | [View on Etherscan](https://sepolia.etherscan.io/address/0x89C74d54EF808F31e2420070f2c18D1b30a13781) |
| **KaySwapAMM** (Core AMM) | `KAY-LP` | `0xBFe195290F79Ac9E8aD1b61C6923b37c2a478488` | [View on Etherscan](https://sepolia.etherscan.io/address/0xBFe195290F79Ac9E8aD1b61C6923b37c2a478488) |
| **KaySwapLPNFT** (ERC-721 Certificate) | `KAY-CERT` | `0xA0Ead7c83FB9192dc6efC179b181A0019B1AC236` | [View on Etherscan](https://sepolia.etherscan.io/address/0xA0Ead7c83FB9192dc6efC179b181A0019B1AC236) |

---

## ✨ Core Features

### 1. 🔄 Automated Market Maker & Token Swapping
- **Constant-Product Formula**: Implements Uniswap v2 style invariant $x \cdot y = k$ with automated slippage protection and spot-to-execution price impact derivation.
- **Two-Step Unified Transaction Flow**: Approve and Swap transactions execute with clear progress feedback inside a single modal dialog.
- **Interactive Price Graphs**: Real-time AMM exchange rate visualization derived from live on-chain reserves.

### 2. 💧 Dual-Mode Liquidity Provision
- **Full-Range Pools**: Deposit KAV and ETH into constant-product pools to earn trading fees on every swap.
- **Range / Concentrated Positions**: Custom price ranges (min price, max price) across selectable fee tiers (`0.05%`, `0.30%`, `1.00%`).
- **Dynamic Fee Collection**: Real-time accumulation and withdrawal of LP trading fee rewards.

### 3. 🎨 Dynamic ERC-721 LP NFT Certificates
- **On-Chain Vector Art**: Every liquidity contribution issues an immutable ERC-721 NFT certificate featuring dynamically rendered on-chain SVG artwork in 16:9 format with brand palette:
  - Base: `#C9B5E0` (Lavender)
  - Primary: `#167D8D` (Deep Teal)
  - Secondary: `#FF5B42` (Coral)
- **Dynamic Metadata (`tokenURI`)**: Fully on-chain Base64-encoded metadata including pool pair, contribution amount, token ID, and Ethereum Sepolia verification hash.
- **Direct Wallet Addition**: Built-in "Add to Wallet" button communicates directly via `wallet_watchAsset` (ERC-721) to display the collectible certificate inside MetaMask and Web3 wallets without manual clipboard copying.

### 4. 🗄️ PostgreSQL Database Engine (No Local Storage)
- **Zero LocalStorage Guarantee**: Zero sensitive data, transactions, or reviews are persisted in browser `localStorage`, `sessionStorage`, or `indexedDB`.
- **Dedicated PostgreSQL Storage**: All user reviews, experience ratings, and categories are saved directly into a relational PostgreSQL database (`kayswap_feedbacks` table).
- **Post-First-Swap Prompting**: Automatically prompts first-time swappers with a user-friendly review dialog after their first swap confirmation on Sepolia.

### 5. ⛓️ Blockchain-Native Event Indexing (Alchemy API)
- **Zero Mock Transactions**: All transaction histories, pool events (`SwapExecuted`, `LiquidityAdded`, `PositionCreated`), and wallet balances are fetched directly from the Ethereum Sepolia blockchain via Alchemy API and verified RPC endpoints.
- **Fallback RPC Redundancy**: Seamless multi-endpoint fallback ensures 100% uptime even during RPC rate limits.

### 6. 🔐 Sign-In With Ethereum (SIWE - EIP-4361)
- Cryptographic wallet signature authentication for decentralized identity.
- In-memory session management with 15-minute auto-expiry for maximum security.

### 7. 🚰 On-Chain Testnet Faucet
- Integrated 24-hour rate-limited faucet allows any connected Sepolia wallet to claim `1,000 KAV` test tokens directly from the smart contract.

---

## 📊 Tokenomics & Supply Parameters

| Parameter | Value | Details |
| :--- | :--- | :--- |
| **Token Name** | Kavya Token | Standard ERC-20 with faucet extension |
| **Token Symbol** | `KAV` | 18 Decimals |
| **Maximum Supply Cap** | `1,000,000 KAV` | Hard cap enforced at smart contract level |
| **Initial Minted Supply** | `500,000 KAV` | Minted at contract deployment |
| **Faucet Claim Amount** | `1,000 KAV` | Rate limited to 1 claim per wallet every 24 hours |
| **Owner Reserve** | `500,000 KAV` | Reserved for initial liquidity pools |

---

## ⚡ Tech Stack & Architecture

```mermaid
graph TD
    User([User Browser]) <--> Frontend[React 18 + Vite + TypeScript]
    Frontend <--> RainbowKit[RainbowKit / Wagmi / Ethers.js v6]
    RainbowKit <--> Blockchain[Ethereum Sepolia Testnet]
    Blockchain --> KavyaToken[KavyaToken ERC-20]
    Blockchain --> KaySwapAMM[KaySwapAMM Pool]
    Blockchain --> KaySwapLPNFT[KaySwapLPNFT ERC-721]
    Frontend <--> Alchemy[Alchemy Sepolia RPC & Logs API]
    Frontend <--> BackendAPI[Vite Dev Server / Express API]
    BackendAPI <--> PostgreSQL[(PostgreSQL Database: kayswap)]
```

- **Smart Contracts**: Solidity `0.8.34`, Hardhat Ignition, OpenZeppelin Contracts v5, `viaIR` optimizer.
- **Frontend**: React 18, TypeScript, Vite 6, RainbowKit, Wagmi, Ethers.js v6, Lucide Icons.
- **Backend & Database**: Node.js, Express, `pg` (node-postgres), PostgreSQL 14+.

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js** `v18.0.0` or higher (Node `v20+` or `v22+` recommended).
2. **PostgreSQL** installed and running on `127.0.0.1:5432`.
3. **Web3 Wallet** (MetaMask, Rainbow, or Rabby) connected to Ethereum Sepolia.

---

### 1. Database Setup (PostgreSQL)

Open your terminal or `psql` and initialize the database:

```bash
psql -U postgres
```

Inside the PostgreSQL terminal:
```sql
CREATE DATABASE kayswap;
\c kayswap
\i database/init.sql
```

Configure your PostgreSQL credentials in `frontend/.env` (and root `.env`):
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/kayswap
PGUSER=postgres
PGPASSWORD=YOUR_PASSWORD
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=kayswap
PORT=3001
```

Verify the database connection:
```bash
npm --prefix frontend run sync-db
```

---

### 2. Frontend Application Setup

Navigate to the `frontend` folder and install dependencies:

```bash
cd frontend
npm install
```

#### Run Local Development Server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Build for Production:
```bash
npm run build
```

#### Run Production Server:
```bash
npm run server
```

---

### 3. Smart Contracts Development

Navigate to the `smartcontracts` folder:

```bash
cd smartcontracts
npm install
```

#### Compile Contracts:
```bash
npx hardhat build
```

#### Run Unit Tests:
```bash
npx hardhat test
```

#### Deploy to Sepolia:
```bash
npx hardhat ignition deploy ./ignition/modules/KaySwapModule.ts --network sepolia
```

---

## 🔍 Verifying Reviews in PostgreSQL

To inspect user feedback directly in your terminal:

```bash
psql -U postgres -d kayswap
```

Execute the query:
```sql
SELECT id, address, rating, category, comment, swap_tx_hash, is_first_swap, created_at
FROM kayswap_feedbacks
ORDER BY timestamp DESC;
```

---

## 🔒 Security & Best Practices

- **Reentrancy Protection**: Core AMM deposit, swap, and withdraw functions inherit OpenZeppelin's `ReentrancyGuard`.
- **Strict Access Control**: Minting and fee parameters are protected with `Ownable`.
- **EIP-712 / EIP-4361 Authentication**: SIWE signatures protect administrative and user actions against replay attacks.
- **Sanitized SQL Queries**: All database mutations execute parameterized queries via `pg` to eliminate SQL injection vulnerabilities.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
