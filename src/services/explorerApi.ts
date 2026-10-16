import { ENVIRONMENTS, GXQEnvironment } from '../config/environments';
import { 
  NetworkStats, 
  ExplorerBlock, 
  ExplorerTransaction, 
  AddressProfile, 
  PaginatedTransactions,
  MOCK_VALIDATORS,
  explorerCache,
  advancedCache,
  CacheMetrics,
  EnvironmentCacheConfig,
  CacheEventType,
  CacheEventPayload,
} from '../../packages/explorer-api/src/index.ts';
import { SmartWalletRegistry } from './smartWallet.ts';
import { errorMonitoring } from './errorMonitoring.ts';

export type { 
  NetworkStats, 
  ExplorerBlock, 
  ExplorerTransaction, 
  AddressProfile, 
  PaginatedTransactions, 
  CacheMetrics,
  EnvironmentCacheConfig,
  CacheEventType,
  CacheEventPayload,
};

export interface StakeTransactionRecord {
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  amount: string;
  asset: string;
  action: 'STAKE' | 'CLAIM_REWARDS' | 'COMPOUND' | 'UNSTAKE';
  vaultTier: string;
  aprPercent: number;
  lockPeriodDays: number;
  rewardEarnedGxq: string;
  status: 'SUCCESS' | 'CONFIRMED' | 'PENDING';
  gasFee: string;
  confirmations: number;
  correlationId: string;
}

// Initial Blockchain State Simulation
let currentBlockHeight = 142980;
let totalTransactionsCount = 3849102;

const INITIAL_BLOCKS: ExplorerBlock[] = Array.from({ length: 10 }, (_, i) => {
  const height = currentBlockHeight - i;
  return {
    id: height,
    hash: `0x${(height * 987654321).toString(16).padEnd(64, 'a')}`,
    parentHash: `0x${((height - 1) * 987654321).toString(16).padEnd(64, 'b')}`,
    timestamp: new Date(Date.now() - i * 3200).toISOString(),
    validator: MOCK_VALIDATORS[i % MOCK_VALIDATORS.length],
    txCount: Math.floor(Math.random() * 24) + 1,
    gasUsed: Math.floor(Math.random() * 4500000) + 1200000,
    gasLimit: 30000000,
    baseFeeGwei: 1.15,
    sizeBytes: Math.floor(Math.random() * 18000) + 4000,
  };
});

const INITIAL_TXS: ExplorerTransaction[] = [
  {
    hash: '0x8f3c7e92b1a45d0f81c7e95c227e51086c45c859fc3feea782ac9595a8b7c6d5',
    blockNumber: currentBlockHeight,
    timestamp: new Date().toISOString(),
    from: '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
    to: '0xB045952d7eB221aA24f8d298Ce35DeA91f63D851',
    value: '500.00',
    asset: 'GXQ',
    status: 'SUCCESS',
    method: 'swapExactTokensForTokens',
    gasUsed: 142850,
    gasFee: '0.000142',
    confirmations: 12,
    correlationId: 'tx_corr_9012a',
  },
  {
    hash: '0x14e52445e814dcd13b4e8f85f368c838a64b99a82d0fec5248a3c86eb095b290',
    blockNumber: currentBlockHeight - 1,
    timestamp: new Date(Date.now() - 3200).toISOString(),
    from: '0x32A5c93F164F1A65dCd13b4E8f85f368C838A64b',
    to: '0x5C05Eb7943F5B8e7b3A73Ec5D8F0b2529A5CdE1B',
    value: '12500.00',
    asset: 'GXQ',
    status: 'SUCCESS',
    method: 'stake',
    gasUsed: 89400,
    gasFee: '0.000089',
    confirmations: 13,
    correlationId: 'tx_corr_9012b',
  },
  {
    hash: '0x5fbdb2315678afecb367f032d93f642f64180aa3e7f1725e7734ce288f8367e1',
    blockNumber: currentBlockHeight - 2,
    timestamp: new Date(Date.now() - 6400).toISOString(),
    from: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
    to: '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
    value: '250.00',
    asset: 'USDC',
    status: 'SUCCESS',
    method: 'transfer',
    gasUsed: 42000,
    gasFee: '0.000042',
    confirmations: 14,
    correlationId: 'tx_corr_9012c',
  },
];

const INITIAL_STAKE_HISTORY: StakeTransactionRecord[] = [
  {
    hash: '0x3a9f7c18d4e21b89fa6041ec9238e821b0451a92cd4891b248a3c86eb095b210',
    blockNumber: currentBlockHeight - 4,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    from: '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
    to: '0x5C05Eb7943F5B8e7b3A73Ec5D8F0b2529A5CdE1B',
    amount: '50000.00',
    asset: 'GXQ',
    action: 'STAKE',
    vaultTier: '90-Day Strategic Vault',
    aprPercent: 22.2,
    lockPeriodDays: 90,
    rewardEarnedGxq: '1342.80',
    status: 'SUCCESS',
    gasFee: '0.000124',
    confirmations: 2420,
    correlationId: 'stk_corr_01',
  },
  {
    hash: '0x8b12f654cd91834a78129e012fa619d8329b3104e7619283c401928374a91823',
    blockNumber: currentBlockHeight - 18,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    from: '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
    to: '0x5C05Eb7943F5B8e7b3A73Ec5D8F0b2529A5CdE1B',
    amount: '420.50',
    asset: 'GXQ',
    action: 'CLAIM_REWARDS',
    vaultTier: 'Flexible Validator Pool',
    aprPercent: 14.8,
    lockPeriodDays: 0,
    rewardEarnedGxq: '420.50',
    status: 'SUCCESS',
    gasFee: '0.000068',
    confirmations: 18240,
    correlationId: 'stk_corr_02',
  },
  {
    hash: '0x5c4819a2b381029c481029384719283471928374819283748192837481928374',
    blockNumber: currentBlockHeight - 45,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    from: '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
    to: '0x5C05Eb7943F5B8e7b3A73Ec5D8F0b2529A5CdE1B',
    amount: '25000.00',
    asset: 'GXQ',
    action: 'STAKE',
    vaultTier: 'Flexible Validator Pool',
    aprPercent: 14.8,
    lockPeriodDays: 0,
    rewardEarnedGxq: '204.10',
    status: 'SUCCESS',
    gasFee: '0.000095',
    confirmations: 38400,
    correlationId: 'stk_corr_03',
  },
  {
    hash: '0x14e52445e814dcd13b4e8f85f368c838a64b99a82d0fec5248a3c86eb095b290',
    blockNumber: currentBlockHeight - 92,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    from: '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
    to: '0x5C05Eb7943F5B8e7b3A73Ec5D8F0b2529A5CdE1B',
    amount: '12500.00',
    asset: 'GXQ',
    action: 'STAKE',
    vaultTier: '30-Day Validator Pool',
    aprPercent: 17.76,
    lockPeriodDays: 30,
    rewardEarnedGxq: '365.20',
    status: 'SUCCESS',
    gasFee: '0.000089',
    confirmations: 74210,
    correlationId: 'stk_corr_04',
  },
  {
    hash: '0x918374a61928374b10293847192837461928374819283748192837481928374a',
    blockNumber: currentBlockHeight - 150,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(),
    from: '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
    to: '0x5C05Eb7943F5B8e7b3A73Ec5D8F0b2529A5CdE1B',
    amount: '850.00',
    asset: 'GXQ',
    action: 'COMPOUND',
    vaultTier: '365-Day High-Yield Vault',
    aprPercent: 29.6,
    lockPeriodDays: 365,
    rewardEarnedGxq: '850.00',
    status: 'SUCCESS',
    gasFee: '0.000072',
    confirmations: 128400,
    correlationId: 'stk_corr_05',
  }
];

class ExplorerApiService {
  private blocks: ExplorerBlock[] = [...INITIAL_BLOCKS];
  private transactions: ExplorerTransaction[] = [...INITIAL_TXS];
  private stakeHistory: StakeTransactionRecord[] = [...INITIAL_STAKE_HISTORY];
  private isLaunchpadPaused: boolean = false;
  private isSwapPaused: boolean = false;
  private blockSubscribers: ((block: ExplorerBlock) => void)[] = [];
  private txSubscribers: ((tx: ExplorerTransaction) => void)[] = [];

  constructor() {
    // Background block producer simulation to keep state lively and stream WebSockets
    setInterval(() => {
      this.produceNextBlock();
    }, 4500);
  }

  private produceNextBlock() {
    currentBlockHeight += 1;
    totalTransactionsCount += Math.floor(Math.random() * 5) + 1;
    const newBlock: ExplorerBlock = {
      id: currentBlockHeight,
      hash: `0x${(currentBlockHeight * 123456789).toString(16).padEnd(64, 'c')}`,
      parentHash: this.blocks[0]?.hash || '0x00000',
      timestamp: new Date().toISOString(),
      validator: MOCK_VALIDATORS[Math.floor(Math.random() * MOCK_VALIDATORS.length)],
      txCount: Math.floor(Math.random() * 12) + 1,
      gasUsed: Math.floor(Math.random() * 3000000) + 500000,
      gasLimit: 30000000,
      baseFeeGwei: 1.12,
      sizeBytes: Math.floor(Math.random() * 15000) + 3000,
    };
    this.blocks.unshift(newBlock);
    if (this.blocks.length > 50) this.blocks.pop();

    // Event-Driven Cache Invalidation on New Block Indexed (via Event Bus)
    advancedCache.dispatchInvalidationEvent({
      type: 'BLOCK_INDEXED',
      blockNumber: currentBlockHeight,
      details: { txCount: newBlock.txCount },
    }).catch(() => {});

    // Broadcast to WebSocket block subscribers
    this.blockSubscribers.forEach(cb => cb(newBlock));
  }

  async getStats(env: GXQEnvironment): Promise<NetworkStats> {
    const cacheKey = `stats_${env}`;
    
    // Transparent Request Coalescing (Singleflight) + Probabilistic Early Expiration (XFetch) + SWR
    const result = await advancedCache.fetchOrSet<NetworkStats>(
      cacheKey,
      async () => {
        // Simulated microsecond ledger aggregation
        const stats: NetworkStats = {
          blockHeight: currentBlockHeight,
          totalTransactions: totalTransactionsCount,
          tps: env === 'local' ? 420.5 : env === 'devnet' ? 68.4 : env === 'testnet' ? 142.0 : 3420.0,
          activeValidators: env === 'local' ? 1 : env === 'mainnet' ? 100 : 24,
          avgBlockTime: 3.2,
          totalVolumeGxq: '42,918,240',
          gasPriceGwei: 1.15,
          networkUptimePercent: 99.98,
          syncStatus: 'SYNCHRONIZED',
        };
        return stats;
      },
      {
        environment: env,
        tags: ['stats', 'network', `env:${env}`],
        enableSWR: true,
      }
    );

    return result.data;
  }

  async getBlocks(limit: number = 10): Promise<ExplorerBlock[]> {
    return this.blocks.slice(0, limit);
  }

  async getBlockById(idOrHash: string | number, env: GXQEnvironment = 'devnet'): Promise<ExplorerBlock | null> {
    const cacheKey = `block_${idOrHash}`;
    
    const result = await advancedCache.fetchOrSet<ExplorerBlock | null>(
      cacheKey,
      async () => {
        let res: ExplorerBlock | null = null;
        if (typeof idOrHash === 'number' || !String(idOrHash).startsWith('0x')) {
          const num = Number(idOrHash);
          res = this.blocks.find(b => b.id === num) || null;
        } else {
          res = this.blocks.find(b => b.hash.toLowerCase() === String(idOrHash).toLowerCase()) || null;
        }
        return res;
      },
      {
        environment: env,
        tags: ['blocks', `block_${idOrHash}`, `env:${env}`],
        enableSWR: true,
      }
    );

    return result.data;
  }

  async getTransactions(limit: number = 10): Promise<ExplorerTransaction[]> {
    return this.transactions.slice(0, limit);
  }

  async getTransactionByHash(hash: string): Promise<ExplorerTransaction | null> {
    const cacheKey = `tx_${hash.toLowerCase()}`;
    const cached = await advancedCache.get<ExplorerTransaction>(cacheKey);
    if (cached) return cached.data;

    const tx = this.transactions.find(t => t.hash.toLowerCase() === hash.toLowerCase()) || null;
    if (tx) {
      await advancedCache.set(cacheKey, tx, { ttlSeconds: 60, tags: ['transactions', `tx_${tx.hash.toLowerCase()}`] });
    }
    return tx;
  }

  async recordTransaction(tx: Omit<ExplorerTransaction, 'confirmations'>): Promise<ExplorerTransaction> {
    const fullTx: ExplorerTransaction = {
      ...tx,
      confirmations: 1,
    };
    this.transactions.unshift(fullTx);
    if (this.transactions.length > 100) this.transactions.pop();
    totalTransactionsCount += 1;

    // Automated Invalidation on Transaction Indexing
    advancedCache.onTransactionIndexed(tx.from, tx.to, tx.hash).catch(() => {});

    // Broadcast via WebSocket
    this.txSubscribers.forEach(cb => cb(fullTx));
    return fullTx;
  }

  async getAddressProfile(address: string): Promise<AddressProfile> {
    const clean = address.toLowerCase();
    const isAdmin = clean === '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8'.toLowerCase();
    
    return {
      address,
      nativeBalance: isAdmin ? '48.95' : '12.50',
      gxqBalance: isAdmin ? '250000.00' : '4820.00',
      stakedGxqBalance: isAdmin ? '100000.00' : '1500.00',
      transactionCount: isAdmin ? 142 : 18,
      isContract: address.length === 42 && (address.startsWith('0x5C') || address.startsWith('0xB0')),
      isSmartWallet: true,
      associatedEmail: isAdmin ? 'gxqstudio@gmail.com' : undefined,
      tokens: [
        { symbol: 'GXQ', name: 'GXQ Network Coin', balance: isAdmin ? '250000.00' : '4820.00', decimals: 18, valueUsd: 1.48 },
        { symbol: 'USDC', name: 'USD Coin (Bridged)', balance: '1850.00', decimals: 6, valueUsd: 1.00 },
        { symbol: 'ETH', name: 'Ethereum', balance: '2.45', decimals: 18, valueUsd: 3495.20 },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.15', decimals: 8, valueUsd: 67450.00 },
      ]
    };
  }

  // Endpoints: /user/wallet and /user/wallet/:email
  async getUserWalletByEmail(email: string): Promise<{ email: string; smartWalletAddress: string; provider: string } | null> {
    const cacheKey = `wallet_email_${email.toLowerCase()}`;
    const cached = await explorerCache.get<any>(cacheKey);
    if (cached) return cached;

    const users = SmartWalletRegistry.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;

    const res = {
      email: user.email,
      smartWalletAddress: user.smartWalletAddress,
      provider: user.provider,
    };
    await explorerCache.set(cacheKey, res, 120);
    return res;
  }

  // Endpoint: /user/transactions/:walletAddress (Paginated)
  async getUserTransactions(walletAddress: string, page: number = 1, limit: number = 10): Promise<PaginatedTransactions> {
    const cacheKey = `txs_${walletAddress.toLowerCase()}_p${page}_l${limit}`;
    const cached = await explorerCache.get<PaginatedTransactions>(cacheKey);
    if (cached) return cached;

    const filtered = this.transactions.filter(
      t => t.from.toLowerCase() === walletAddress.toLowerCase() || t.to.toLowerCase() === walletAddress.toLowerCase()
    );

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const result: PaginatedTransactions = {
      walletAddress,
      page,
      limit,
      total: filtered.length,
      transactions: paginated,
    };

    await explorerCache.set(cacheKey, result, 10);
    return result;
  }

  // Staking Transactions History API
  async getStakingHistory(walletAddress?: string): Promise<StakeTransactionRecord[]> {
    const cacheKey = walletAddress 
      ? `stake_history_${walletAddress.toLowerCase()}` 
      : 'stake_history_all';
    
    const cached = await advancedCache.get<StakeTransactionRecord[]>(cacheKey);
    if (cached) return cached.data;

    let res = this.stakeHistory;
    if (walletAddress) {
      const target = walletAddress.toLowerCase();
      const matched = this.stakeHistory.filter(
        s => s.from.toLowerCase() === target || s.to.toLowerCase() === target
      );
      if (matched.length > 0) {
        res = matched;
      } else {
        // Adapt initial history to user address
        res = this.stakeHistory.map(item => ({ ...item, from: walletAddress }));
      }
    }

    await advancedCache.set(cacheKey, res, { 
      ttlSeconds: 30, 
      tags: ['staking', `stake_${walletAddress?.toLowerCase() || 'global'}`] 
    });
    return res;
  }

  async recordStakingTransaction(record: Omit<StakeTransactionRecord, 'confirmations'>): Promise<StakeTransactionRecord> {
    const fullRecord: StakeTransactionRecord = {
      ...record,
      confirmations: 1,
    };
    this.stakeHistory.unshift(fullRecord);
    if (this.stakeHistory.length > 100) this.stakeHistory.pop();

    // Also record into canonical explorer transactions
    await this.recordTransaction({
      hash: record.hash,
      blockNumber: record.blockNumber,
      timestamp: record.timestamp,
      from: record.from,
      to: record.to,
      value: record.amount,
      asset: record.asset,
      status: record.status === 'PENDING' ? 'PENDING' : 'SUCCESS',
      method: record.action === 'STAKE' ? 'stake' : record.action === 'CLAIM_REWARDS' ? 'claimReward' : record.action === 'COMPOUND' ? 'compound' : 'unstake',
      gasUsed: 92400,
      gasFee: record.gasFee,
      correlationId: record.correlationId,
    });

    // Invalidate staking cache
    await advancedCache.invalidateTag('staking');
    if (record.from) {
      await advancedCache.invalidateTag(`stake_${record.from.toLowerCase()}`);
    }

    return fullRecord;
  }

  // WebSocket Subscription Handlers
  subscribeBlocks(callback: (block: ExplorerBlock) => void): () => void {
    this.blockSubscribers.push(callback);
    return () => {
      this.blockSubscribers = this.blockSubscribers.filter(cb => cb !== callback);
    };
  }

  subscribeTransactions(callback: (tx: ExplorerTransaction) => void): () => void {
    this.txSubscribers.push(callback);
    return () => {
      this.txSubscribers = this.txSubscribers.filter(cb => cb !== callback);
    };
  }

  getCurrentBlockHeight(): number {
    return currentBlockHeight;
  }

  getSystemFlags() {
    return {
      isLaunchpadPaused: this.isLaunchpadPaused,
      isSwapPaused: this.isSwapPaused,
    };
  }

  setSystemFlag(flag: 'isLaunchpadPaused' | 'isSwapPaused', value: boolean) {
    if (flag === 'isLaunchpadPaused') this.isLaunchpadPaused = value;
    if (flag === 'isSwapPaused') this.isSwapPaused = value;
  }

  // Cache Diagnostics & Invalidation Operations
  getCacheMetrics(): CacheMetrics {
    return advancedCache.getMetrics();
  }

  async invalidateCachePattern(pattern: string): Promise<number> {
    return await advancedCache.invalidatePattern(pattern);
  }

  async invalidateCacheTag(tag: string): Promise<number> {
    return await advancedCache.invalidateTag(tag);
  }

  async purgeAllCache(): Promise<void> {
    await advancedCache.purgeAll();
  }

  /**
   * Explicitly index a simulated block and trigger automated cache invalidation
   */
  async indexNewBlockExplicitly(): Promise<{ newBlock: ExplorerBlock; invalidatedTags: string[] }> {
    this.produceNextBlock();
    const newBlock = this.blocks[0];
    await advancedCache.onBlockIndexed(newBlock.id, newBlock.txCount);
    return {
      newBlock,
      invalidatedTags: ['stats', 'blocks_summary', 'latest_blocks'],
    };
  }

  /**
   * Benchmark Endpoint Performance: Uncached vs Cached
   */
  async benchmarkEndpoint(endpoint: '/stats' | '/block/:id'): Promise<{
    endpoint: string;
    uncachedLatencyMs: number;
    cachedLatencyMs: number;
    speedupFactor: number;
    source: 'L1' | 'L2' | 'L3';
  }> {
    const key = endpoint === '/stats' ? 'stats_devnet' : `block_${currentBlockHeight}`;
    
    // Purge key first to measure cold fetch
    await advancedCache.invalidate(key);
    const coldStart = performance.now();
    if (endpoint === '/stats') {
      await this.getStats('devnet');
    } else {
      await this.getBlockById(currentBlockHeight);
    }
    const coldDuration = performance.now() - coldStart;

    // Second call: Guaranteed Cache Hit (L1/L2)
    const warmStart = performance.now();
    const cachedResult = await advancedCache.get<any>(key);
    const warmDuration = performance.now() - warmStart;

    const uncachedMs = Math.max(Number(coldDuration.toFixed(2)), 12.5);
    const cachedMs = Math.max(Number(warmDuration.toFixed(3)), 0.12);
    const speedup = Number((uncachedMs / cachedMs).toFixed(1));

    return {
      endpoint,
      uncachedLatencyMs: uncachedMs,
      cachedLatencyMs: cachedMs,
      speedupFactor: speedup,
      source: cachedResult?.source || 'L1',
    };
  }

  // Advanced Event-Driven Cache Invalidation
  async dispatchCacheEvent(event: CacheEventPayload): Promise<{ invalidatedTags: string[]; invalidatedCount: number }> {
    return await advancedCache.dispatchInvalidationEvent(event);
  }

  getEnvironmentCacheConfig(env: GXQEnvironment): EnvironmentCacheConfig {
    return advancedCache.getEnvironmentConfig(env);
  }

  updateEnvironmentCacheConfig(env: GXQEnvironment, update: Partial<EnvironmentCacheConfig>): void {
    advancedCache.updateEnvironmentConfig(env, update);
  }

  /**
   * Simulates a Cache Stampede with N concurrent requests
   * Demonstrates Singleflight request coalescing
   */
  async simulateCacheStampede(concurrency: number = 10, endpoint: '/stats' | '/block/:id' = '/stats'): Promise<{
    concurrency: number;
    coalescedRequests: number;
    dbQueriesExecuted: number;
    totalDurationMs: number;
    avgLatencyMs: number;
    latencySavedPercent: number;
  }> {
    const key = endpoint === '/stats' ? 'stampede_stats_devnet' : `stampede_block_${currentBlockHeight}`;
    await advancedCache.invalidate(key);

    const start = performance.now();
    let dbExecutions = 0;

    const tasks = Array.from({ length: concurrency }, async (_, i) => {
      return await advancedCache.fetchOrSet(
        key,
        async () => {
          dbExecutions++;
          await new Promise(r => setTimeout(r, 45)); // DB query latency
          return { simulatedData: true, blockHeight: currentBlockHeight, index: i };
        },
        { environment: 'devnet', ttlSeconds: 15 }
      );
    });

    await Promise.all(tasks);
    const totalDuration = performance.now() - start;
    const coalesced = Math.max(0, concurrency - dbExecutions);
    const savedPercent = concurrency > 1 ? Number(((coalesced / concurrency) * 100).toFixed(1)) : 0;

    return {
      concurrency,
      coalescedRequests: coalesced,
      dbQueriesExecuted: dbExecutions,
      totalDurationMs: Number(totalDuration.toFixed(2)),
      avgLatencyMs: Number((totalDuration / concurrency).toFixed(2)),
      latencySavedPercent: savedPercent,
    };
  }
}

export const explorerApi = new ExplorerApiService();
