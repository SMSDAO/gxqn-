# GXQ Network V3.0.0 — Multi-Environment Deployment & Operations Manual

This document provides exact, reproducible operational runbooks for deploying and operating the GXQ Network across all four supported execution environments:
1. **Local (Hardhat Node - 31337)**
2. **Devnet (Rollup L2 - 9002)**
3. **Testnet (Public Testnet - 9001)**
4. **Mainnet (Enterprise Production Genesis - 9000)**

---

## 1. Environment Matrix

| Parameter | Local (Hardhat) | Devnet (L2) | Testnet (Public) | Mainnet (Genesis) |
| :--- | :--- | :--- | :--- | :--- |
| **Chain ID** | `31337` | `9002` | `9001` | `9000` |
| **Currency** | GXQ | dGXQ | tGXQ | GXQ |
| **RPC URL** | `http://127.0.0.1:8545` | `https://devnet-rpc.gxq.network` | `https://testnet-rpc.gxq.network` | `https://rpc.gxq.network` |
| **Explorer** | `http://localhost:3000/explorer` | `https://devnet.gxqscan.io` | `https://testnet.gxqscan.io` | `https://gxqscan.io` |
| **AA Provider** | Deterministic / Local | ZeroDev Kernel | Biconomy Nexus | Modular ZeroDev (Safe guarded) |
| **Faucet** | Enabled (1,000 GXQ/day) | Enabled (250 GXQ/day) | Enabled (100 GXQ/day) | **Strictly Disabled** |
| **Status** | Active | Active | Active | **Pending Certified Audit** |

---

## 2. Automated Smart Contract Verification

Contract bytecode is automatically verified across block explorers (Blockscout on Devnet/Local and Etherscan/GXQScan on Testnet/Mainnet):

```bash
# Automated verification script
npx hardhat run packages/contracts/scripts/verify.ts --network testnet
```

Required verification environment variables:
- `ETHERSCAN_API_KEY`: For public explorer verification
- `BLOCKSCOUT_API_KEY`: For Devnet / Rollup explorer verification

---

## 3. Automated Security Auditing & Static Analysis Pipeline

The CI pipeline integrates automated static analyzers prior to deployment:
1. **Slither (Crytic)**: Runs vulnerability detection on all contracts (`GXQToken`, `TokenFactory`, `SimpleSwap`, `GXQStaking`) for reentrancy, uninitialized state, and arbitrary senders.
2. **Mythril**: Symbolic execution checks for integer boundary over/underflow and transaction order dependence.
3. **Formal Third-Party Audit Requirement**:
   - Before any contract can be deployed to Mainnet (Chain ID 9000), a cryptographic hash of the compiled bytecode must match the certified audit certificate signed off by two independent audit firms.
   - Any mainnet deploy command executed without `CONFIRM_MAINNET_AUDITED=true` will intentionally abort with an exit code of 1.

---

## 4. End-to-End Testing Suite (Cypress)

Cypress tests run headless in the CI pipeline or interactively via the in-app Cypress Test Suite:
```bash
# Headless run against Devnet
npx cypress run --config-file cypress.config.ts --env targetEnv=devnet

# Headless run against Local Node
npx cypress run --config-file cypress.config.ts --env targetEnv=local

# Headless run against Testnet
npx cypress run --config-file cypress.config.ts --env targetEnv=testnet
```

Test coverage includes:
- `01_auth_and_smart_wallet.cy.ts`: Deterministic account abstraction derivation, Google login, and persistent mapping.
- `02_dex_and_contracts.cy.ts`: SimpleSwap AMM math, slippage thresholds, LP fee calculations, and staking positions.
- `03_admin_rbac.cy.ts`: Super Admin isolation (`gxqstudio@gmail.com`), Auditor read-only access, Operator rights, and circuit breakers.
- `04_websocket_and_explorer.cy.ts`: Real-time WebSocket streaming of blocks, mempool transactions, and volatility threshold triggers.

---

## 5. Role-Based Access Control (RBAC) Architecture

| Permission | Super Admin (`gxqstudio@gmail.com`) | Auditor | Operator | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| Toggle Circuit Breakers (Pause DEX / Launchpad) | **Yes** | No | No | No |
| Reassign User Roles | **Yes** | No | No | No |
| Provision Smart Wallets | **Yes** | No | **Yes** | No |
| View System Health & Redis Metrics | **Yes** | **Yes** | **Yes** | **Yes** |
| View Security & Governance Audit Logs | **Yes** | **Yes** | No | No |
| View User & Account Abstraction Directory | **Yes** | **Yes** | **Yes** | **Yes** |
