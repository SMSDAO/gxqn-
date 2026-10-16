/**
 * GXQ Network V3.0.0 — Central Multi-Environment Configuration
 * Supports: Local (Hardhat), Devnet, Testnet, Mainnet
 * Features: Per-Environment Tiered Caching & Invalidation Architecture
 */

export type GXQEnvironment = 'local' | 'devnet' | 'testnet' | 'mainnet';

export interface ContractAddresses {
  gxqToken: string;
  tokenFactory: string;
  simpleSwap: string;
  stakingVault: string;
  accountRegistry: string;
}

/**
 * Per-Environment Advanced Caching Specification
 */
export interface EnvironmentCacheConfig {
  environment: GXQEnvironment;
  enabled: boolean;
  tiers: {
    l1Memory: {
      enabled: boolean;
      maxItems: number;
      defaultTtlSeconds: number;
    };
    l2Redis: {
      enabled: boolean;
      clusterMode: boolean;
      defaultTtlSeconds: number;
      compressionThresholdBytes: number;
    };
    l3Snapshot: {
      enabled: boolean;
      snapshotIntervalMinutes: number;
      staleGracePeriodSeconds: number;
    };
  };
  resourceTtls: {
    stats: number;
    blocks: number;
    transactions: number;
    addressProfiles: number;
    staking: number;
    markets: number;
  };
  invalidation: {
    enableEventBased: boolean;
    enableJitter: boolean;
    jitterPercent: number; // e.g. 15%
    enableSingleflight: boolean; // Request Coalescing (stampede mitigation)
    enableXFetchEarlyRefresh: boolean; // Probabilistic early expiration
    xFetchBeta: number; // e.g. 1.0 - 1.5
    staleWhileRevalidateSeconds: number; // SWR window
    adaptiveTtlOnHighTps: boolean; // Auto-shorten TTL during burst activity
  };
}

export interface EnvironmentConfig {
  id: GXQEnvironment;
  name: string;
  badge: string;
  chainId: number;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  fallbackRpcUrls: string[];
  blockExplorerUrl: string;
  indexerApiUrl: string;
  contracts: ContractAddresses;
  featureFlags: {
    isSwapEnabled: boolean;
    isLaunchpadEnabled: boolean;
    isStakingEnabled: boolean;
    isFaucetEnabled: boolean;
    isAccountAbstractionActive: boolean;
    requireMultiSigForAdmin: boolean;
    debugMode: boolean;
  };
  limits: {
    maxDailyFaucetClaim: number;
    maxSwapSlippagePercent: number;
    minStakeAmount: number;
  };
  cacheConfig: EnvironmentCacheConfig;
}

export const ENVIRONMENTS: Record<GXQEnvironment, EnvironmentConfig> = {
  local: {
    id: 'local',
    name: 'Local Hardhat Node',
    badge: 'LOCAL-31337',
    chainId: 31337,
    currency: {
      name: 'GXQ Local Coin',
      symbol: 'GXQ',
      decimals: 18,
    },
    rpcUrl: 'http://127.0.0.1:8545',
    fallbackRpcUrls: ['http://localhost:8545'],
    blockExplorerUrl: 'http://localhost:3000/explorer',
    indexerApiUrl: 'http://localhost:3001/api/v1',
    contracts: {
      gxqToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      tokenFactory: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      simpleSwap: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      stakingVault: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      accountRegistry: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    },
    featureFlags: {
      isSwapEnabled: true,
      isLaunchpadEnabled: true,
      isStakingEnabled: true,
      isFaucetEnabled: true,
      isAccountAbstractionActive: true,
      requireMultiSigForAdmin: false,
      debugMode: true,
    },
    limits: {
      maxDailyFaucetClaim: 1000,
      maxSwapSlippagePercent: 15,
      minStakeAmount: 10,
    },
    cacheConfig: {
      environment: 'local',
      enabled: true,
      tiers: {
        l1Memory: { enabled: true, maxItems: 1000, defaultTtlSeconds: 15 },
        l2Redis: { enabled: true, clusterMode: false, defaultTtlSeconds: 30, compressionThresholdBytes: 4096 },
        l3Snapshot: { enabled: false, snapshotIntervalMinutes: 60, staleGracePeriodSeconds: 10 },
      },
      resourceTtls: {
        stats: 5,
        blocks: 15,
        transactions: 15,
        addressProfiles: 10,
        staking: 10,
        markets: 5,
      },
      invalidation: {
        enableEventBased: true,
        enableJitter: false,
        jitterPercent: 0,
        enableSingleflight: true,
        enableXFetchEarlyRefresh: false,
        xFetchBeta: 1.0,
        staleWhileRevalidateSeconds: 5,
        adaptiveTtlOnHighTps: false,
      },
    },
  },
  devnet: {
    id: 'devnet',
    name: 'GXQ Devnet (Rollup L2)',
    badge: 'DEVNET-9002',
    chainId: 9002,
    currency: {
      name: 'GXQ Devnet Coin',
      symbol: 'dGXQ',
      decimals: 18,
    },
    rpcUrl: 'https://devnet-rpc.gxq.network',
    fallbackRpcUrls: ['https://devnet-backup.gxq.network'],
    blockExplorerUrl: 'https://devnet.gxqscan.io',
    indexerApiUrl: 'https://devnet-api.gxq.network/api/v1',
    contracts: {
      gxqToken: '0x32A5c93F164F1A65dCd13b4E8f85f368C838A64b',
      tokenFactory: '0x81C7E95C227e51086C45c859fC3FeEa782aC9595',
      simpleSwap: '0xB045952d7eB221aA24f8d298Ce35DeA91f63D851',
      stakingVault: '0x5C05Eb7943F5B8e7b3A73Ec5D8F0b2529A5CdE1B',
      accountRegistry: '0x1A2B3C4D5E6F7890123456789ABCDEF012345678',
    },
    featureFlags: {
      isSwapEnabled: true,
      isLaunchpadEnabled: true,
      isStakingEnabled: true,
      isFaucetEnabled: true,
      isAccountAbstractionActive: true,
      requireMultiSigForAdmin: false,
      debugMode: true,
    },
    limits: {
      maxDailyFaucetClaim: 250,
      maxSwapSlippagePercent: 10,
      minStakeAmount: 25,
    },
    cacheConfig: {
      environment: 'devnet',
      enabled: true,
      tiers: {
        l1Memory: { enabled: true, maxItems: 5000, defaultTtlSeconds: 30 },
        l2Redis: { enabled: true, clusterMode: false, defaultTtlSeconds: 120, compressionThresholdBytes: 2048 },
        l3Snapshot: { enabled: true, snapshotIntervalMinutes: 30, staleGracePeriodSeconds: 30 },
      },
      resourceTtls: {
        stats: 10,
        blocks: 45,
        transactions: 30,
        addressProfiles: 20,
        staking: 20,
        markets: 8,
      },
      invalidation: {
        enableEventBased: true,
        enableJitter: true,
        jitterPercent: 10,
        enableSingleflight: true,
        enableXFetchEarlyRefresh: true,
        xFetchBeta: 1.1,
        staleWhileRevalidateSeconds: 20,
        adaptiveTtlOnHighTps: true,
      },
    },
  },
  testnet: {
    id: 'testnet',
    name: 'GXQ Public Testnet',
    badge: 'TESTNET-9001',
    chainId: 9001,
    currency: {
      name: 'GXQ Testnet Coin',
      symbol: 'tGXQ',
      decimals: 18,
    },
    rpcUrl: 'https://testnet-rpc.gxq.network',
    fallbackRpcUrls: ['https://testnet-backup.gxq.network'],
    blockExplorerUrl: 'https://testnet.gxqscan.io',
    indexerApiUrl: 'https://testnet-api.gxq.network/api/v1',
    contracts: {
      gxqToken: '0x71C67E7d25e0bCd9426f0f423A7a14E52445E814',
      tokenFactory: '0x99A82D0FeC5248a3c86EB095b29094B184FE4e07',
      simpleSwap: '0x4386A2E4cf6eFA190FfE0eA4dC9fD3C23a48e895',
      stakingVault: '0x27D5f25262B51F9B93556f8f53Ac069477028471',
      accountRegistry: '0x9876543210FEDCBA9876543210FEDCBA98765432',
    },
    featureFlags: {
      isSwapEnabled: true,
      isLaunchpadEnabled: true,
      isStakingEnabled: true,
      isFaucetEnabled: true,
      isAccountAbstractionActive: true,
      requireMultiSigForAdmin: true,
      debugMode: false,
    },
    limits: {
      maxDailyFaucetClaim: 100,
      maxSwapSlippagePercent: 5,
      minStakeAmount: 50,
    },
    cacheConfig: {
      environment: 'testnet',
      enabled: true,
      tiers: {
        l1Memory: { enabled: true, maxItems: 15000, defaultTtlSeconds: 60 },
        l2Redis: { enabled: true, clusterMode: true, defaultTtlSeconds: 300, compressionThresholdBytes: 1024 },
        l3Snapshot: { enabled: true, snapshotIntervalMinutes: 15, staleGracePeriodSeconds: 60 },
      },
      resourceTtls: {
        stats: 15,
        blocks: 120,
        transactions: 60,
        addressProfiles: 30,
        staking: 30,
        markets: 10,
      },
      invalidation: {
        enableEventBased: true,
        enableJitter: true,
        jitterPercent: 15,
        enableSingleflight: true,
        enableXFetchEarlyRefresh: true,
        xFetchBeta: 1.2,
        staleWhileRevalidateSeconds: 45,
        adaptiveTtlOnHighTps: true,
      },
    },
  },
  mainnet: {
    id: 'mainnet',
    name: 'GXQ Network Mainnet',
    badge: 'MAINNET-9000',
    chainId: 9000,
    currency: {
      name: 'GXQ Enterprise Coin',
      symbol: 'GXQ',
      decimals: 18,
    },
    rpcUrl: 'https://rpc.gxq.network',
    fallbackRpcUrls: ['https://rpc-us.gxq.network', 'https://rpc-eu.gxq.network'],
    blockExplorerUrl: 'https://gxqscan.io',
    indexerApiUrl: 'https://api.gxq.network/api/v1',
    contracts: {
      gxqToken: '0x0000000000000000000000000000000000000000',
      tokenFactory: '0x0000000000000000000000000000000000000000',
      simpleSwap: '0x0000000000000000000000000000000000000000',
      stakingVault: '0x0000000000000000000000000000000000000000',
      accountRegistry: '0x0000000000000000000000000000000000000000',
    },
    featureFlags: {
      isSwapEnabled: false,
      isLaunchpadEnabled: false,
      isStakingEnabled: false,
      isFaucetEnabled: false,
      isAccountAbstractionActive: true,
      requireMultiSigForAdmin: true,
      debugMode: false,
    },
    limits: {
      maxDailyFaucetClaim: 0,
      maxSwapSlippagePercent: 2,
      minStakeAmount: 100,
    },
    cacheConfig: {
      environment: 'mainnet',
      enabled: true,
      tiers: {
        l1Memory: { enabled: true, maxItems: 50000, defaultTtlSeconds: 180 },
        l2Redis: { enabled: true, clusterMode: true, defaultTtlSeconds: 900, compressionThresholdBytes: 512 },
        l3Snapshot: { enabled: true, snapshotIntervalMinutes: 5, staleGracePeriodSeconds: 120 },
      },
      resourceTtls: {
        stats: 20,
        blocks: 600,
        transactions: 180,
        addressProfiles: 60,
        staking: 60,
        markets: 15,
      },
      invalidation: {
        enableEventBased: true,
        enableJitter: true,
        jitterPercent: 20,
        enableSingleflight: true,
        enableXFetchEarlyRefresh: true,
        xFetchBeta: 1.35,
        staleWhileRevalidateSeconds: 60,
        adaptiveTtlOnHighTps: true,
      },
    },
  },
};

export const DEFAULT_ENVIRONMENT: GXQEnvironment = 'devnet';

/**
 * Mutates feature flags directly in the central configuration
 */
export function setEnvironmentFeatureFlag(
  env: GXQEnvironment,
  flag: keyof EnvironmentConfig['featureFlags'],
  value: boolean
): boolean {
  if (!ENVIRONMENTS[env]) return false;
  ENVIRONMENTS[env].featureFlags[flag] = value;
  return true;
}

export function toggleCentralLaunchpad(env: GXQEnvironment): boolean {
  if (!ENVIRONMENTS[env]) return false;
  const current = ENVIRONMENTS[env].featureFlags.isLaunchpadEnabled;
  ENVIRONMENTS[env].featureFlags.isLaunchpadEnabled = !current;
  return !current;
}

/**
 * Live Runtime Update for Environment Cache Configuration
 */
export function setEnvironmentCacheConfig(
  env: GXQEnvironment,
  updatedConfig: Partial<EnvironmentCacheConfig>
): boolean {
  if (!ENVIRONMENTS[env]) return false;
  ENVIRONMENTS[env].cacheConfig = {
    ...ENVIRONMENTS[env].cacheConfig,
    ...updatedConfig,
    tiers: {
      ...ENVIRONMENTS[env].cacheConfig.tiers,
      ...(updatedConfig.tiers || {}),
    },
    resourceTtls: {
      ...ENVIRONMENTS[env].cacheConfig.resourceTtls,
      ...(updatedConfig.resourceTtls || {}),
    },
    invalidation: {
      ...ENVIRONMENTS[env].cacheConfig.invalidation,
      ...(updatedConfig.invalidation || {}),
    },
  };
  return true;
}
