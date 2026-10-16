# GXQ Network V3.0.0 — Production-Ready Multi-Environment Web3 Ecosystem

[![Architecture: Monorepo](https://img.shields.io/badge/Architecture-Monorepo%20(Turbo%20%2B%20pnpm)-blue.svg)]()
[![Contracts: Solidity](https://img.shields.io/badge/Solidity-0.8.20-brightgreen.svg)]()
[![Status: Multi--Environment%20Ready](https://img.shields.io/badge/Status-Multi--Environment%20Ready-success.svg)]()
[![Admin: Hardened](https://img.shields.io/badge/Admin-gxqstudio%40gmail.com-orange.svg)]()

Production-grade, enterprise-ready multi-environment blockchain suite and command center for **GXQ Network V3.0.0**, featuring Account Abstraction (ERC-4337), AMM DEX (`SimpleSwap`), Token Launchpad (`TokenFactory`), Validator Staking Vault (`GXQStaking`), and Real-Time Explorer Indexer.

---

## 1. Monorepo Structure

```text
gxq-network-v3/
├── apps/
│   ├── web/                     # Cyber-Futuristic Enterprise Glass Web & Mobile Application
│   └── mobile/                  # React Native mobile client
├── packages/
│   ├── config/                  # Central multi-environment definitions (Local, Devnet, Testnet, Mainnet)
│   ├── contracts/               # Hardhat contracts (GXQToken, TokenFactory, SimpleSwap, GXQStaking)
│   ├── explorer-api/            # Lightweight backend API & indexer (Postgres SQL schema + Redis cache)
│   └── sdk/                     # Official TypeScript SDK for client dApps
├── deployments/                 # Network deployment artifacts and contract addresses
│   ├── local.json               # Hardhat (31337)
│   ├── devnet.json              # Rollup L2 (9002)
│   ├── testnet.json             # Public Testnet (9001)
│   └── mainnet.json             # Mainnet Genesis (9000 - Locked until audit)
├── infrastructure/              # Docker Compose (PostgreSQL 16 + Redis 7 + Hardhat)
├── scripts/                     # Unified deployment runner (deploy-all.ts)
└── docs/                        # Deployment runbooks and security contracts
```

---

## 2. Multi-Environment Matrix

| Environment | Chain ID | RPC URL | Contract Status | Faucet | Feature Flags |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Local** | `31337` | `http://127.0.0.1:8545` | Deployed | 1,000 GXQ/day | All Active + Debug |
| **Devnet** | `9002` | `https://devnet-rpc.gxq.network` | Deployed & Synced | 250 GXQ/day | All Active |
| **Testnet** | `9001` | `https://testnet-rpc.gxq.network` | Deployed & Synced | 100 GXQ/day | All Active + MultiSig |
| **Mainnet** | `9000` | `https://rpc.gxq.network` | *Pending Certified Audit* | **Disabled** | Locked (Safe Policy) |

---

## 3. Quickstart Instructions

### A. Local Development
1. **Install dependencies**:
   ```bash
   pnpm install
   ```
2. **Start Infrastructure (PostgreSQL + Redis)**:
   ```bash
   docker compose -f infrastructure/docker-compose.yml up -d
   ```
3. **Start Local Hardhat Node**:
   ```bash
   pnpm --filter @gxq/contracts node
   ```
4. **Deploy Contracts to Local Network**:
   ```bash
   npx tsx scripts/deploy-all.ts --target=local
   ```
5. **Start Dev Server**:
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000` in your browser.

---

### B. Deploying to Devnet
GXQ Devnet is our low-latency L2 test rollup for integration testing:
1. Ensure `.env.devnet` is present with valid RPC endpoints.
2. Run deployment:
   ```bash
   npx tsx scripts/deploy-all.ts --target=devnet
   ```
3. Addresses are automatically saved to `deployments/devnet.json` and consumed by the frontend and API.

---

### C. Deploying to Testnet
GXQ Public Testnet is connected to multi-validator nodes and real test faucets:
1. Set `TESTNET_DEPLOYER_PRIVATE_KEY` in your environment.
2. Deploy contracts:
   ```bash
   npx tsx scripts/deploy-all.ts --target=testnet
   ```
3. Verify on block explorer:
   ```bash
   npx hardhat verify --network testnet <DEPLOYED_ADDRESS>
   ```

---

### D. Preparing for Mainnet
Mainnet deployment is subject to strict governance rules:
1. **Prerequisite**: Independent security audit completed and signed off.
2. Multisig hardware wallet (Safe) configured with 48h timelock.
3. Deploy with mandatory audit confirmation flag:
   ```bash
   CONFIRM_MAINNET_AUDITED=true npx tsx scripts/deploy-all.ts --target=mainnet
   ```

---

## 4. What is Still Missing for Real Mainnet (Honest Senior Engineer Assessment)

Before accepting real monetary value on GXQ Network Mainnet, the following production gaps must be closed:

1. **Certified Smart Contract Security Audits**
   - The Solidity contracts (`GXQToken`, `TokenFactory`, `SimpleSwap`, `GXQStaking`) require full formal verification and reports from at least two reputable audit firms (e.g., OpenZeppelin, Trail of Bits, Halborn).
2. **Multi-Signature Governance Timelock**
   - Contract ownership currently resides with the deployer / admin address (`gxqstudio@gmail.com`). For mainnet, ownership must be transferred to a 4-of-7 Gnosis Safe multisig with a minimum 48-hour timelock controller to prevent single-key compromise.
3. **Canonical L1 Deposit/Withdrawal Rollup Bridge**
   - A battle-tested bridge contract on Ethereum L1 with fraud-proof dispute windows (or zero-knowledge SNARK verifiers) is necessary before bridging real native ETH or ERC-20 assets.
4. **Production Infrastructure Clustering**
   - Local Docker Compose services must be replaced with high-availability cloud infrastructure (AWS/GCP Kubernetes with PostgreSQL read-replicas, Redis Sentinel clusters, and auto-scaling RPC nodes behind Cloudflare Magic Transit).
5. **Funded Paymaster Gas Sponsorship Vault**
   - Account Abstraction (ERC-4337) on mainnet requires a dedicated, on-chain funded Paymaster contract with automated fraud protection and Sybil resistance to safely subsidize user gas fees.

---

## 5. Security & Access Control Policy
- **Admin Isolation**: Admin features and system emergency flags (`/admin/*`) are strictly enforced both client-side and server-side to `gxqstudio@gmail.com`.
- **Zero-Knowledge Telemetry**: The structured telemetry subsystem automatically redacts private keys, seeds, and bearer tokens before persistence.
- **Unambiguous State**: If RPC or market data is unavailable, the UI clearly displays `OFFLINE` or `STALE` instead of fabricating simulated balances.
