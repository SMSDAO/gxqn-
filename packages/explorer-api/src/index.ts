/**
 * GXQ Network V3.0.0 — Explorer API Service
 * Production Lightweight Backend Service
 * Endpoints:
 * - GET /stats
 * - GET /block/:id
 * - GET /tx/:hash
 * - GET /address/:address
 * - POST /user/wallet
 * - GET /user/wallet/:email
 * - GET /user/transactions/:walletAddress
 *
 * Utilizes PostgreSQL as primary persistence and Redis as in-memory cache.
 */

export interface NetworkStats {
  blockHeight: number;
  totalTransactions: number;
  tps: number;
  activeValidators: number;
  avgBlockTime: number;
  totalVolumeGxq: string;
  gasPriceGwei: number;
  networkUptimePercent: number;
  syncStatus: 'SYNCHRONIZED' | 'SYNCING' | 'REORGANIZING';
}

export interface ExplorerBlock {
  id: number;
  hash: string;
  parentHash: string;
  timestamp: string;
  validator: string;
  txCount: number;
  gasUsed: number;
  gasLimit: number;
  baseFeeGwei: number;
  sizeBytes: number;
}

export interface ExplorerTransaction {
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  asset: string;
  status: 'SUCCESS' | 'PENDING' | 'REVERTED';
  method: string;
  gasUsed: number;
  gasFee: string;
  confirmations: number;
  correlationId: string;
}

export interface AddressProfile {
  address: string;
  nativeBalance: string;
  gxqBalance: string;
  stakedGxqBalance: string;
  transactionCount: number;
  isContract: boolean;
  isSmartWallet: boolean;
  associatedEmail?: string;
  tokens: {
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    valueUsd: number;
  }[];
}

export interface PaginatedTransactions {
  walletAddress: string;
  page: number;
  limit: number;
  total: number;
  transactions: ExplorerTransaction[];
}

// Import Advanced Multi-Tier Cache Engine
import { 
  advancedCache, 
  AdvancedCacheManager, 
  CacheMetrics,
  EnvironmentCacheConfig,
  CacheEventType,
  CacheEventPayload,
  DEFAULT_CACHE_CONFIGS 
} from './cache/index.ts';

export { advancedCache, AdvancedCacheManager, DEFAULT_CACHE_CONFIGS };
export type { CacheMetrics, EnvironmentCacheConfig, CacheEventType, CacheEventPayload };

// Backward-compatibility wrapper for existing explorerCache consumers
export const explorerCache = {
  get: async <T>(key: string) => {
    const res = await advancedCache.get<T>(key);
    return res ? res.data : null;
  },
  set: async (key: string, value: any, ttlSeconds: number = 60, tags: string[] = []) => {
    await advancedCache.set(key, value, { ttlSeconds, tags });
  },
  invalidate: async (pattern: string) => {
    await advancedCache.invalidatePattern(pattern);
  },
  invalidateTag: async (tag: string) => {
    await advancedCache.invalidateTag(tag);
  },
  purgeAll: async () => {
    await advancedCache.purgeAll();
  },
  getMetrics: () => advancedCache.getMetrics(),
};

export const MOCK_VALIDATORS = [
  '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
  '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
  '0x617F2E2fD72FD9D5503197092aC168c91465E7f2',
  '0x17F6AD8Ef982297579C203069C1DbfFE4348c372',
  '0x5c69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
];
