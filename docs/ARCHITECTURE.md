# GXQ Network V3.0.0 — System Architecture & Topology Specification

This document provides architectural diagrams, layer definitions, cross-shard protocols, and data pipeline descriptions for GXQ Network.

---

## 1. System Topology Overview

```text
               +-------------------------------------------------------+
               |              CLIENT & INTERFACE LAYER                 |
               |  - Cyber-Futuristic Web3 Command Center (Next/Vite)   |
               |  - Block Explorer & Address Inspector                 |
               |  - SimpleSwap AMM & Token Launchpad UI                |
               |  - Control Plane Administration Enclave               |
               +-------------------------------------------------------+
                                          |
                               (HTTPS / WSS JSON-RPC)
                                          v
+-------------------------------------------------------------------------------------+
|                             MIDDLEWARE & CACHE LAYER                                |
|  +-----------------------------+         +---------------------------------------+  |
|  |     Explorer API Backend    | <=====> |          Redis 7 In-Memory Cache      |  |
|  |  (/stats, /tx, /block, etc) |         |  - TTL Caching (60s)                  |  |
|  +-----------------------------+         |  - Real-time Mempool & Stats Buffer   |  |
|                 |                        +---------------------------------------+  |
|                 v                                                                   |
|  +-----------------------------+                                                    |
|  |   PostgreSQL 16 Database    |                                                    |
|  |  - Persistent Block State   |                                                    |
|  |  - Account Mapping Registry |                                                    |
|  +-----------------------------+                                                    |
+-------------------------------------------------------------------------------------+
                                          |
                              (EVM Bytecode / LibP2P)
                                          v
+-------------------------------------------------------------------------------------+
|                      CORE QUANTUM BLOCKCHAIN & CONSENSUS LAYER                      |
|                                                                                     |
|   +-----------------------------------------------------------------------------+   |
|   |                        BEACON SHARD (Shard 0)                               |   |
|   |   - BFT-PoS Consensus Coordinator                                           |   |
|   |   - Quantum SPHINCS+ Validator Registry                                     |   |
|   |   - Cross-Shard Merkle State Root Aggregator                                |   |
|   +-----------------------------------------------------------------------------+   |
|                   |                                             |                   |
|         (Cross-Shard Messages)                        (Cross-Shard Messages)        |
|                   v                                             v                   |
|   +-------------------------------+             +-------------------------------+   |
|   |     EXECUTION SHARD 1         |             |     EXECUTION SHARD 2         |   |
|   |   - SimpleSwap DEX Pools      |             |   - TokenFactory Launchpad    |   |
|   |   - GXQStaking Vault          |             |   - Community Token Contracts |   |
|   +-------------------------------+             +-------------------------------+   |
+-------------------------------------------------------------------------------------+
                                          ^
                                          |
                              (Cross-Chain Relayers / ZKPs)
                                          v
+-------------------------------------------------------------------------------------+
|                         MULTICHAIN BRIDGE & UNIVERSAL INGRESS                       |
|                                                                                     |
|   +-------------------+  +-------------------+  +----------------+  +-----------+   |
|   | Ethereum Mainnet  |  | Arbitrum One (L2) |  |   Polygon PoS  |  |  Solana   |   |
|   | - Native USDC/ETH |  | - Arbitrum Rollup |  | - Matic/USDC   |  | - SPL USDC|   |
|   +-------------------+  +-------------------+  +----------------+  +-----------+   |
+-------------------------------------------------------------------------------------+
```

---

## 2. Component Specifications

### 2.1 Quantum-Resistant Validator Nodes
- **Consensus**: BFT Quantum Proof-of-Stake (BFT-QPoS) with rotating committees.
- **Cryptographic Keys**: Hybrid scheme combining standard ECDSA (EVM tooling compatibility) with stateful hash-based SPHINCS+ post-quantum signatures for block consensus votes.
- **Block Period**: 3.2 seconds.
- **Finality**: Deterministic single-slot finality via 2/3 validator consensus quorum.

### 2.2 Multichain Universal USDC Bridge
- **Deposit**: User deposits native USDC on Ethereum Mainnet into the `GXQBridgeVault` contract.
- **Proof Generation**: Decentralized relayer network captures the block receipt and constructs a cryptographic light-client proof (or ZK state proof).
- **Mint/Credit**: Proof is submitted to GXQ Beacon Shard; upon cryptographic validation, equal bridged USDC is credited to the user's smart wallet on GXQ Network.
- **Withdrawal**: User burns bridged USDC on GXQ Network; relayers unlock native USDC from the vault on the destination chain.

### 2.3 Cross-Shard Communication Protocol (CSCP)
- Each shard maintains its own state root and receipt root.
- Inter-shard token transfers and contract calls are packaged into outbound receipt trees.
- Destination shards verify the receipt root against the Beacon Shard's global state header before executing incoming state changes, preventing double-spend across partitions.

### 2.4 Database Caching & Indexing Architecture
- **Source of Truth**: PostgreSQL 16 storing normalized blockchain events, account registry mappings, blocks, and transactions.
- **High-Speed Cache**: Redis 7 cluster deployed in memory.
- **Cache Strategy**: Read-through cache with 60-second TTL on `/stats` and `/block/:id`. Automatic write-invalidation upon receipt of new verified transactions.
