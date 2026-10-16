# GXQ Network V3.0.0 — API & TypeScript SDK Documentation

The `@gxq/sdk` provides a unified client abstraction for building decentralized applications, managing smart accounts, executing AMM swaps, staking, and querying the sharded blockchain indexer.

---

## 1. Installation

```bash
pnpm add @gxq/sdk ethers viem
```

---

## 2. Quickstart Initialization

```typescript
import { createGXQClient } from "@gxq/sdk";

// Initialize client for targeted environment: 'local' | 'devnet' | 'testnet' | 'mainnet'
const client = createGXQClient("devnet");

console.log("Active RPC:", client.getRpcUrl());
console.log("Chain ID:", client.getChainId());
console.log("Contracts:", client.getContracts());
```

---

## 3. Account Abstraction (ERC-4337) Integration

```typescript
import { SmartWalletRegistry, getSmartWalletAdapter } from "@gxq/sdk";

// Derive deterministic smart wallet linked to Google login
const user = await SmartWalletRegistry.authenticateWithGoogle(
  "user@example.com",
  "Jane Doe",
  "devnet"
);

console.log("Smart Wallet Address:", user.smartWalletAddress);
```

---

## 4. AMM Swap Execution (SimpleSwap)

```typescript
import { ethers } from "ethers";

// Quote 100 GXQ for USDC
const provider = new ethers.JsonRpcProvider(client.getRpcUrl());
const swapContract = new ethers.Contract(
  client.getContracts().simpleSwap,
  SimpleSwapABI,
  provider
);

const amountIn = ethers.parseEther("100");
const expectedOut = await swapContract.getAmountOut(amountIn, client.getContracts().gxqToken);
console.log("Expected Output:", ethers.formatUnits(expectedOut, 6), "USDC");
```

---

## 5. Universal USDC Bridge Protocol

```typescript
// Bridging 500 USDC from Ethereum to GXQ Shard 0
const bridgeDeposit = await bridgeContract.depositUSDC(
  user.smartWalletAddress,
  ethers.parseUnits("500", 6)
);
await bridgeDeposit.wait();
console.log("Relayer proof generated with correlation ID:", bridgeDeposit.hash);
```

---

## 6. Database Caching Strategy (PostgreSQL + Redis)

- **PostgreSQL**: Stores persistent block state, receipts, and smart wallet email-to-address mappings.
- **Redis 7 In-Memory Cache**:
  - `stats_{network}`: 5-second TTL cache for TPS, block height, and active validators.
  - `block_{id}` & `tx_{hash}`: 60-second TTL cache.
  - Automatic cache invalidation upon mempool transaction inclusion.
