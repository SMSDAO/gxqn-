/**
 * GXQ Network V3.0.0 — Wagmi & Viem Multi-Chain Configuration
 * 
 * Provides official viem Chain definitions, PublicClients, and dynamic
 * environment state synchronization for:
 * - Local (Hardhat 31337)
 * - Devnet (GXQ-Dev 13371)
 * - Testnet (Galileo 13372)
 * - Mainnet (Quantum 13370)
 * 
 * Synchronized with src/config/environments.ts
 */

import { defineChain, createPublicClient, http, type Chain, type PublicClient } from 'viem';
import { ENVIRONMENTS, GXQEnvironment } from './environments';

export const gxqLocalChain: Chain = defineChain({
  id: 31337,
  name: 'GXQ Local Node',
  nativeCurrency: {
    decimals: 18,
    name: 'GXQ Local Coin',
    symbol: 'GXQ',
  },
  rpcUrls: {
    default: { http: [ENVIRONMENTS.local.rpcUrl] },
    public: { http: [ENVIRONMENTS.local.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'GXQ Local Explorer', url: ENVIRONMENTS.local.blockExplorerUrl },
  },
  testnet: true,
});

export const gxqDevnetChain: Chain = defineChain({
  id: 13371,
  name: 'GXQ Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'GXQ Network Coin',
    symbol: 'GXQ',
  },
  rpcUrls: {
    default: { http: [ENVIRONMENTS.devnet.rpcUrl] },
    public: { http: [ENVIRONMENTS.devnet.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'GXQ Devnet Explorer', url: ENVIRONMENTS.devnet.blockExplorerUrl },
  },
  testnet: true,
});

export const gxqTestnetChain: Chain = defineChain({
  id: 13372,
  name: 'GXQ Testnet Galileo',
  nativeCurrency: {
    decimals: 18,
    name: 'GXQ Network Coin',
    symbol: 'GXQ',
  },
  rpcUrls: {
    default: { http: [ENVIRONMENTS.testnet.rpcUrl] },
    public: { http: [ENVIRONMENTS.testnet.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'GXQ Testnet Explorer', url: ENVIRONMENTS.testnet.blockExplorerUrl },
  },
  testnet: true,
});

export const gxqMainnetChain: Chain = defineChain({
  id: 13370,
  name: 'GXQ Quantum Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'GXQ Network Coin',
    symbol: 'GXQ',
  },
  rpcUrls: {
    default: { http: [ENVIRONMENTS.mainnet.rpcUrl] },
    public: { http: [ENVIRONMENTS.mainnet.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'GXQ Mainnet Explorer', url: ENVIRONMENTS.mainnet.blockExplorerUrl },
  },
  testnet: false,
});

export const GXQ_VIEM_CHAINS: Record<GXQEnvironment, Chain> = {
  local: gxqLocalChain,
  devnet: gxqDevnetChain,
  testnet: gxqTestnetChain,
  mainnet: gxqMainnetChain,
};

/**
 * Wagmi / Viem State Manager
 */
class WagmiEnvironmentManager {
  private activeEnv: GXQEnvironment = 'devnet';
  private publicClients = new Map<GXQEnvironment, PublicClient>();
  private listeners: ((env: GXQEnvironment, chain: Chain) => void)[] = [];

  constructor() {
    // Pre-initialize public clients for all environments
    (Object.keys(GXQ_VIEM_CHAINS) as GXQEnvironment[]).forEach((env) => {
      const chain = GXQ_VIEM_CHAINS[env];
      const client = createPublicClient({
        chain,
        transport: http(chain.rpcUrls.default.http[0], {
          timeout: 8000,
          retryCount: 2,
        }),
      });
      this.publicClients.set(env, client as PublicClient);
    });
  }

  public getActiveEnvironment(): GXQEnvironment {
    return this.activeEnv;
  }

  public getActiveChain(): Chain {
    return GXQ_VIEM_CHAINS[this.activeEnv];
  }

  public getChainFor(env: GXQEnvironment): Chain {
    return GXQ_VIEM_CHAINS[env];
  }

  public getPublicClient(env?: GXQEnvironment): PublicClient {
    const targetEnv = env || this.activeEnv;
    return this.publicClients.get(targetEnv) || this.publicClients.get('devnet')!;
  }

  public updateEnvironment(newEnv: GXQEnvironment): Chain {
    if (this.activeEnv === newEnv) {
      return this.getActiveChain();
    }
    this.activeEnv = newEnv;
    const chain = this.getActiveChain();
    this.listeners.forEach((listener) => listener(newEnv, chain));
    return chain;
  }

  public subscribe(callback: (env: GXQEnvironment, chain: Chain) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }
}

export const wagmiEnvManager = new WagmiEnvironmentManager();
export const updateWagmiEnvironment = (env: GXQEnvironment) => wagmiEnvManager.updateEnvironment(env);
export const getActiveViemChain = (env?: GXQEnvironment) => (env ? GXQ_VIEM_CHAINS[env] : wagmiEnvManager.getActiveChain());
export const getViemPublicClient = (env?: GXQEnvironment) => wagmiEnvManager.getPublicClient(env);
