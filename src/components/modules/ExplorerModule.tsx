import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { EnvironmentConfig } from '../../config/environments';
import { explorerApi, ExplorerBlock, ExplorerTransaction, NetworkStats, AddressProfile } from '../../services/explorerApi';
import { tokenRegistry, IndexedToken } from '../../services/tokenRegistry';
import { 
  telemetryTracing, 
  TraceRecord, 
  TelemetrySpan, 
  ServiceName, 
  TracingBackendConfig 
} from '../../services/telemetryTracing';
import { 
  logger, 
  StructuredLogEntry, 
  LogLevel, 
  Environment as LogEnv, 
  LogContext 
} from '../../services/logger';
import { 
  Search, 
  Box, 
  ArrowRightLeft, 
  CheckCircle2, 
  User, 
  Copy, 
  Check, 
  Clock, 
  Flame, 
  ExternalLink,
  ChevronRight,
  Database,
  Coins,
  Cpu,
  Pickaxe,
  TrendingUp,
  ShieldCheck,
  Activity,
  Terminal,
  Network,
  AlertTriangle,
  Layers,
  Radio,
  RefreshCw,
  Sliders,
  Server,
  HardDrive,
  Zap,
  Bug,
  Eye,
  Filter,
  Play,
  RotateCcw
} from 'lucide-react';

interface ExplorerModuleProps {
  envConfig: EnvironmentConfig;
  triggerFlash: (type: any) => void;
}

export const ExplorerModule: React.FC<ExplorerModuleProps> = ({
  envConfig,
  triggerFlash,
}) => {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [blocks, setBlocks] = useState<ExplorerBlock[]>([]);
  const [transactions, setTransactions] = useState<ExplorerTransaction[]>([]);
  const [tokens, setTokens] = useState<IndexedToken[]>(() => tokenRegistry.getTokens());
  const [activeTab, setActiveTab] = useState<
    'BLOCKS_TXS' | 'TOKEN_TRANSFERS' | 'BASE_L2_ROLLUP' | 'GAS_SIMULATOR' | 'CONTRACT_VERIFY' | 'DISTRIBUTED_TRACING' | 'STRUCTURED_LOGS'
  >('BLOCKS_TXS');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    type: 'BLOCK' | 'TRANSACTION' | 'ADDRESS';
    data: any;
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // OpenTelemetry Distributed Tracing State
  const [traces, setTraces] = useState<TraceRecord[]>(() => telemetryTracing.getTraces());
  const [selectedTrace, setSelectedTrace] = useState<TraceRecord | null>(() => traces[0] || null);
  const [selectedSpan, setSelectedSpan] = useState<TelemetrySpan | null>(null);
  const [tracingBackendConfig, setTracingBackendConfig] = useState<TracingBackendConfig>(() => telemetryTracing.getConfig());
  const [traceFilterService, setTraceFilterService] = useState<string>('all');
  const [traceFilterStatus, setTraceFilterStatus] = useState<string>('all');
  const [isSimulatingTrace, setIsSimulatingTrace] = useState(false);

  // Winston Structured Logging State
  const [logs, setLogs] = useState<StructuredLogEntry[]>(() => logger.getLogs());
  const [logEnvFilter, setLogEnvFilter] = useState<LogEnv>((envConfig.id as LogEnv) || 'devnet');
  const [logLevelFilter, setLogLevelFilter] = useState<LogLevel | 'all'>('all');
  const [logServiceFilter, setLogServiceFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [logOutputMode, setLogOutputMode] = useState<'dev_console' | 'prod_json'>('dev_console');
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Sync with explorer API
  useEffect(() => {
    const fetchData = async () => {
      const s = await explorerApi.getStats(envConfig.id);
      const b = await explorerApi.getBlocks(10);
      const t = await explorerApi.getTransactions(10);
      setStats(s);
      setBlocks(b);
      setTransactions(t);
    };

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [envConfig.id]);

  useEffect(() => {
    const unsub = tokenRegistry.subscribe((all) => setTokens(all));
    return unsub;
  }, []);

  // Subscribe to OpenTelemetry traces updates
  useEffect(() => {
    const unsub = telemetryTracing.subscribe((newTrace) => {
      setTraces(telemetryTracing.getTraces());
      if (!selectedTrace) {
        setSelectedTrace(newTrace);
      }
    });
    return unsub;
  }, [selectedTrace]);

  // Subscribe to Winston structured logs updates
  useEffect(() => {
    const unsub = logger.subscribe(() => {
      setLogs(logger.getLogs({
        environment: logEnvFilter,
        level: logLevelFilter,
        service: logServiceFilter,
        search: logSearchQuery,
      }));
    });
    return unsub;
  }, [logEnvFilter, logLevelFilter, logServiceFilter, logSearchQuery]);

  // Update filtered logs on state changes
  useEffect(() => {
    setLogs(logger.getLogs({
      environment: logEnvFilter,
      level: logLevelFilter,
      service: logServiceFilter,
      search: logSearchQuery,
    }));
  }, [logEnvFilter, logLevelFilter, logServiceFilter, logSearchQuery]);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScrollLogs && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScrollLogs]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    triggerFlash('BLUE_FLASH');

    // 1. Check if block number or block hash
    if (!isNaN(Number(q))) {
      const block = await explorerApi.getBlockById(Number(q));
      if (block) {
        setSearchResult({ type: 'BLOCK', data: block });
        return;
      }
    }

    // 2. Check if transaction hash
    if (q.length === 66 && q.startsWith('0x')) {
      const tx = await explorerApi.getTransactionByHash(q);
      if (tx) {
        setSearchResult({ type: 'TRANSACTION', data: tx });
        return;
      }
    }

    // 3. Address profile lookup
    if (q.startsWith('0x')) {
      const profile = await explorerApi.getAddressProfile(q);
      setSearchResult({ type: 'ADDRESS', data: profile });
      return;
    }

    // 4. Token symbol search
    const foundToken = tokens.find(t => t.symbol.toUpperCase() === q.toUpperCase() || t.name.toLowerCase().includes(q.toLowerCase()));
    if (foundToken) {
      setSearchResult({ type: 'ADDRESS', data: foundToken });
      return;
    }

    alert('No matching block, transaction, token, or address found on current network.');
  };

  // Trigger OpenTelemetry synthetic traced request
  const handleSimulateTrace = async (scenario: 'normal' | 'cache_miss' | 'slow_db' | 'error') => {
    setIsSimulatingTrace(true);
    triggerFlash('BLUE_FLASH');

    try {
      const simulatedTrace = await telemetryTracing.executeTracedRequest({
        endpoint: scenario === 'error' ? '/block/corrupted_id' : scenario === 'slow_db' ? '/tx/0x8f3c7e92.../deep_audit' : '/stats',
        method: scenario === 'slow_db' ? 'POST' : 'GET',
        simulateCacheMiss: scenario === 'cache_miss' || scenario === 'slow_db' || scenario === 'error',
        simulateSlowDb: scenario === 'slow_db',
        simulateError: scenario === 'error',
        userAddress: '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
        transactionHash: scenario === 'slow_db' ? '0x8f3c7e92b1a45d0f81c7e95c227e51086c45c859fc3feea782ac9595a8b7c6d5' : undefined,
      });

      setSelectedTrace(simulatedTrace);
      setSelectedSpan(simulatedTrace.spans[0]);
      setTraces(telemetryTracing.getTraces());
    } finally {
      setIsSimulatingTrace(false);
    }
  };

  // Emit a synthetic Winston log entry
  const handleEmitSyntheticLog = (level: LogLevel) => {
    triggerFlash('SUCCESS_FLASH');
    const msgs: Record<LogLevel, string> = {
      debug: 'L1 Cache hot-key probed for memory locality: validator_set_snapshot',
      info: 'Account Abstraction UserOp batch submitted to Mempool Relayer on Shard 0',
      warn: 'Elevated latency detected on Redis L2 pipeline (roundtrip 4.8ms > 2.0ms threshold)',
      error: 'Sequencer BFT consensus round aborted: quorum consensus timeout on slot 142984',
      fatal: 'PostgreSQL storage partition out of disk capacity on /var/lib/postgresql/data',
    };

    logger.setEnvironment(logEnvFilter);
    logger[level === 'fatal' ? 'fatal' : level](msgs[level], {
      service: level === 'error' ? 'sequencer-rpc' : level === 'warn' ? 'redis-cache' : level === 'debug' ? 'redis-cache' : 'api-gateway',
      userId: 'usr_architect_gxq',
      userAddress: '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
      transactionHash: '0x8f3c7e92b1a45d0f81c7e95c227e51086c45c859fc3feea782ac9595a8b7c6d5',
      blockNumber: stats?.blockHeight || 142982,
      traceId: selectedTrace?.traceId || telemetryTracing.generateTraceId(),
      spanId: telemetryTracing.generateSpanId(),
      durationMs: level === 'warn' ? 4.8 : 1.2,
    });
  };

  const latencyMetrics = telemetryTracing.getServiceLatencyMetrics();

  // Filter traces
  const filteredTraces = traces.filter(t => {
    if (traceFilterService !== 'all' && t.service !== traceFilterService && !t.spans.some(s => s.service === traceFilterService)) {
      return false;
    }
    if (traceFilterStatus !== 'all' && t.statusCode !== traceFilterStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <span>GXQ QUANTUM BLOCK EXPLORER</span>
            <StatusBadge status={envConfig.id.toUpperCase()} size="sm" />
          </h2>
          <p className="text-xs text-gray-400">Search on-chain blocks, transactions, tokens, smart contracts, OpenTelemetry traces, and structured logs</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by Address / Tx Hash / Block / Token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 font-mono outline-none focus:border-[#00A8FF]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        </form>
      </div>

      {/* Network Stats Bar with ETH Peg & Total Supply */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <GlassCard level={2} className="p-3.5 glow-card-blue">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Total Supply</span>
          <div className="text-base font-black font-mono text-white mt-1">100,000,000</div>
          <span className="text-[10px] font-mono text-gray-500">GXQ Genesis Cap</span>
        </GlassCard>

        <GlassCard level={2} className="p-3.5 glow-card-purple">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">ETH Pegged Price</span>
          <div className="text-base font-black font-mono text-[#00A8FF] mt-1">$3,495.20</div>
          <span className="text-[10px] font-mono text-[#10B981]">1.00 ETH Ratio</span>
        </GlassCard>

        <GlassCard level={2} className="p-3.5 glow-card-green">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Current Height</span>
          <div className="text-base font-black font-mono text-white mt-1">
            #{stats ? stats.blockHeight.toLocaleString() : '142,982'}
          </div>
          <span className="text-[10px] font-mono text-gray-500">3.2s Finality</span>
        </GlassCard>

        <GlassCard level={2} className="p-3.5 glow-card-orange">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Throughput</span>
          <div className="text-base font-black font-mono text-[#10B981] mt-1">
            {stats ? stats.tps : '4,850'} <span className="text-xs">tps</span>
          </div>
          <span className="text-[10px] font-mono text-gray-500">Peak 10,000+</span>
        </GlassCard>

        <GlassCard level={2} className="p-3.5 glow-card-yellow">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Mining Difficulty</span>
          <div className="text-base font-black font-mono text-[#FFD400] mt-1">42.8 TH/q</div>
          <span className="text-[10px] font-mono text-gray-500">1,024 Nodes</span>
        </GlassCard>

        <GlassCard level={2} className="p-3.5 glow-card-red">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Gas Price</span>
          <div className="text-base font-black font-mono text-white mt-1">
            {stats ? stats.gasPriceGwei : '0.0012'} <span className="text-xs">Gwei</span>
          </div>
          <span className="text-[10px] font-mono text-[#10B981]">Sub-Cent Tx</span>
        </GlassCard>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('BLOCKS_TXS')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'BLOCKS_TXS'
              ? 'bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/40 shadow-[0_0_12px_rgba(0,168,255,0.2)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Blocks & Transactions
        </button>

        <button
          onClick={() => setActiveTab('TOKEN_TRANSFERS')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'TOKEN_TRANSFERS'
              ? 'bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/40 shadow-[0_0_12px_rgba(0,168,255,0.2)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Token Transfers Visualizer ({tokens.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('BASE_L2_ROLLUP')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'BASE_L2_ROLLUP'
              ? 'bg-[#0052FF]/25 text-[#0052FF] border border-[#0052FF]/50 shadow-[0_0_15px_rgba(0,82,255,0.3)] glow-card-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#0052FF]" />
          <span>Base L2 Rollup & Batches</span>
        </button>

        <button
          onClick={() => setActiveTab('GAS_SIMULATOR')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'GAS_SIMULATOR'
              ? 'bg-[#FF7A00]/25 text-[#FF7A00] border border-[#FF7A00]/50 shadow-[0_0_15px_rgba(255,122,0,0.3)] glow-card-orange'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#FF7A00]" />
          <span>Gas Tracker & Tx Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('CONTRACT_VERIFY')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'CONTRACT_VERIFY'
              ? 'bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] glow-card-green'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Contract Verification & ABI</span>
        </button>

        <button
          onClick={() => setActiveTab('DISTRIBUTED_TRACING')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'DISTRIBUTED_TRACING'
              ? 'bg-[#A855F7]/25 text-[#A855F7] border border-[#A855F7]/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] glow-card-purple'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 animate-pulse text-[#A855F7]" />
          <span>OpenTelemetry Traces (Jaeger / Zipkin)</span>
        </button>

        <button
          onClick={() => setActiveTab('STRUCTURED_LOGS')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'STRUCTURED_LOGS'
              ? 'bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] glow-card-green'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Structured Logs (Winston)</span>
        </button>
      </div>

      {/* Search Result Inspector Display */}
      {searchResult && (
        <GlassCard level={3} glow="blue" className="p-6 border-[#00A8FF]/40 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#00A8FF]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Inspector Result: {searchResult.type}
              </h3>
            </div>
            <button
              onClick={() => setSearchResult(null)}
              className="text-xs text-gray-400 hover:text-white underline font-mono"
            >
              Close Inspector
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-[#00A8FF] overflow-x-auto max-h-72">
            {JSON.stringify(searchResult.data, null, 2)}
          </pre>
        </GlassCard>
      )}

      {/* VIEW: BASE L2 ROLLUP & BATCHES */}
      {activeTab === 'BASE_L2_ROLLUP' && (
        <div className="space-y-6 animate-fadeIn">
          <GlassCard level={3} glow="blue" className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-base font-black text-white font-mono flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0052FF]" />
                  <span>BASE L2 ROLLUP BATCH COMMITMENTS & L1 SETTLEMENT</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0052FF]/20 text-[#0052FF] border border-[#0052FF]/40 font-bold">
                    OPTIMISTIC L2
                  </span>
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Tracking L2 transaction batch root submissions, L1 data gas costs, and cross-chain bridge finality on Ethereum L1
                </p>
              </div>
              <StatusBadge status="SEQUENCER ACTIVE" size="md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 font-mono text-xs">
              <GlassCard level={2} className="p-4 glow-card-blue">
                <span className="text-[10px] text-gray-400 uppercase">Latest L2 Batch Index</span>
                <div className="text-xl font-black text-white mt-1">#48,921</div>
                <span className="text-[10px] text-emerald-400 mt-1 block">Root Hash: 0x9f3c...8b21</span>
              </GlassCard>
              <GlassCard level={2} className="p-4 glow-card-purple">
                <span className="text-[10px] text-gray-400 uppercase">L1 Data Submission Cost</span>
                <div className="text-xl font-black text-white mt-1">0.00042 ETH</div>
                <span className="text-[10px] text-gray-400 mt-1 block">Saved 91.4% vs L1 Mainnet</span>
              </GlassCard>
              <GlassCard level={2} className="p-4 glow-card-green">
                <span className="text-[10px] text-gray-400 uppercase">Sequencer Health</span>
                <div className="text-xl font-black text-[#10B981] mt-1">99.99% Uptime</div>
                <span className="text-[10px] text-gray-400 mt-1 block">BFT Consensus Slot #142985</span>
              </GlassCard>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">Recent Batch Root Commitments to Ethereum L1</h4>
              {[
                { batch: 48921, txCount: 142, l1Hash: '0x8f3c7e92b1a45d0f81c7e95c...859fc', gasCost: '0.00042 ETH', time: '12s ago' },
                { batch: 48920, txCount: 188, l1Hash: '0x14e52445e814dcd13b4e...eb09b', gasCost: '0.00058 ETH', time: '44s ago' },
                { batch: 48919, txCount: 96, l1Hash: '0x5fbdb2315678afecb367...8367e', gasCost: '0.00031 ETH', time: '76s ago' },
              ].map((b) => (
                <div key={b.batch} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Batch #{b.batch}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#0052FF]/20 text-[#0052FF]">
                        {b.txCount} Transactions
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      L1 Root Tx: <span className="text-[#0052FF]">{b.l1Hash}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold block">{b.gasCost}</span>
                    <span className="text-[10px] text-gray-500">{b.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: GAS TRACKER & TX SIMULATOR */}
      {activeTab === 'GAS_SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn font-mono text-xs">
          {/* Gas Tracker Card */}
          <GlassCard level={3} glow="orange" className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FF7A00]" />
                <span>Base Gas & EIP-1559 Fee Tracker</span>
              </h3>
              <StatusBadge status="SUB-CENT GAS" size="sm" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
                <span className="text-[10px] text-gray-400 uppercase block">Fast (Instant)</span>
                <div className="text-lg font-black text-[#FF7A00] mt-1">0.0015 Gwei</div>
                <span className="text-[10px] text-gray-500">~1.2s confirmation</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
                <span className="text-[10px] text-gray-400 uppercase block">Standard</span>
                <div className="text-lg font-black text-white mt-1">0.0012 Gwei</div>
                <span className="text-[10px] text-gray-500">~3.2s confirmation</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
                <span className="text-[10px] text-gray-400 uppercase block">Slow / Economy</span>
                <div className="text-lg font-black text-emerald-400 mt-1">0.0009 Gwei</div>
                <span className="text-[10px] text-gray-500">~12.0s confirmation</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Base Fee:</span>
                <span className="text-white font-bold">0.0010 Gwei</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Priority Fee (Tip):</span>
                <span className="text-white font-bold">0.0002 Gwei</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average Gas Used per Block:</span>
                <span className="text-white font-bold">2,482,190 (8.2%)</span>
              </div>
            </div>
          </GlassCard>

          {/* Transaction Simulator Card */}
          <GlassCard level={3} glow="blue" className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00A8FF]" />
                <span>EVM Transaction Simulator & Debugger</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00A8FF]/20 text-[#00A8FF]">DRY-RUN</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">Target Contract / Recipient</label>
                <input
                  type="text"
                  defaultValue="0xB045952d7eB221aA24f8d298Ce35DeA91f63D851"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">Calldata / Method Signature</label>
                <input
                  type="text"
                  defaultValue="swapExactTokensForTokens(uint256,uint256,address[],address,uint256)"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-emerald-400 font-mono outline-none"
                />
              </div>

              <button
                onClick={() => {
                  triggerFlash('SUCCESS_FLASH');
                  alert('Simulation successful! Estimated Gas: 142,850. Status: SUCCESS. Zero revert vectors detected.');
                }}
                className="w-full py-2.5 rounded-xl bg-[#00A8FF] hover:bg-[#00A8FF]/80 text-black font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,168,255,0.4)]"
              >
                Run EVM Dry-Run Simulation
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW: CONTRACT VERIFICATION & ABI */}
      {activeTab === 'CONTRACT_VERIFY' && (
        <div className="space-y-6 animate-fadeIn font-mono text-xs">
          <GlassCard level={3} glow="green" className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase">Smart Contract Source Code Verification</h3>
                  <p className="text-xs text-gray-400">Solidity v0.8.24 + EVM Paris bytecode verification status</p>
                </div>
              </div>
              <StatusBadge status="AUTOMATIC VERIFIED" size="md" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-gray-500 uppercase block">Compiler Version</span>
                <span className="text-white font-bold mt-1 block">v0.8.24+commit.e11b</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-gray-500 uppercase block">Optimization</span>
                <span className="text-emerald-400 font-bold mt-1 block">Enabled (200 runs)</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-gray-500 uppercase block">License</span>
                <span className="text-white font-bold mt-1 block">MIT / Apache-2.0</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-gray-500 uppercase block">Audit Risk Score</span>
                <span className="text-emerald-400 font-bold mt-1 block">0 / 100 (Safe)</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[11px]">Verified Source Code (GXQCoreRouter.sol)</span>
              <pre className="p-4 rounded-xl bg-black/70 border border-white/10 text-emerald-400 overflow-x-auto max-h-80 text-xs">
{`// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GXQCoreRouter is Ownable {
    string public constant VERSION = "2.4.0-enterprise";
    mapping(address => uint256) public liquidityBalances;

    event LiquidityAdded(address indexed provider, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function addLiquidity(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        liquidityBalances[msg.sender] += amount;
        emit LiquidityAdded(msg.sender, amount);
    }
}`}
              </pre>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW 1: BLOCKS & TRANSACTIONS */}
      {activeTab === 'BLOCKS_TXS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blocks Column */}
          <GlassCard level={2} className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#00A8FF]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Verified Blocks</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Avg 3.2s Blocktime</span>
            </div>

            <div className="space-y-3">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  onClick={() => setSearchResult({ type: 'BLOCK', data: block })}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#00A8FF]/40 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">#{block.id}</span>
                      <span className="text-[10px] font-mono text-gray-400">{block.txCount} txs</span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 mt-1 truncate max-w-[200px] sm:max-w-xs">
                      Validator: {block.validator}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400 block">
                      {Math.round((Date.now() - new Date(block.timestamp).getTime()) / 1000)}s ago
                    </span>
                    <span className="text-[10px] font-mono text-[#00A8FF] flex items-center justify-end gap-1">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Transactions Column */}
          <GlassCard level={2} className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#FF7A00]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Latest Transactions</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Mempool Stream</span>
            </div>

            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.hash}
                  onClick={() => setSearchResult({ type: 'TRANSACTION', data: tx })}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#FF7A00]/40 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#00A8FF]">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                        {tx.method}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 mt-1">
                      From: {tx.from.slice(0, 6)}... → To: {tx.to.slice(0, 6)}...
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white block">
                      {tx.value} {tx.asset}
                    </span>
                    <StatusBadge status={tx.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW 2: TOKEN TRANSFERS VISUALIZER */}
      {activeTab === 'TOKEN_TRANSFERS' && (
        <GlassCard level={2} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">All Indexed Tokens & Contract Profiles</h3>
              <p className="text-xs text-gray-400">Tokens generated via Launchpad are indexed with live safety audit scores and small tickers</p>
            </div>
            <StatusBadge status="AUTOMATIC VERIFIED" size="sm" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-[11px]">
                  <th className="pb-3 font-semibold">ASSET</th>
                  <th className="pb-3 font-semibold">TICKER</th>
                  <th className="pb-3 font-semibold">CONTRACT ADDRESS</th>
                  <th className="pb-3 font-semibold">PEG / PRICE</th>
                  <th className="pb-3 font-semibold">SUPPLY</th>
                  <th className="pb-3 font-semibold">SAFETY STATUS</th>
                  <th className="pb-3 font-semibold text-right">INSPECT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tokens.map((token) => (
                  <tr key={token.address} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={token.logoUrl} 
                          alt={token.symbol} 
                          className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/20 bg-black" 
                        />
                        <div>
                          <div className="font-bold text-white">{token.name}</div>
                          <div className="text-[10px] text-gray-500">{token.isLaunchpadCreated ? 'Launchpad Token' : 'Core Ecosystem Asset'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#00A8FF]/15 text-[#00A8FF] border border-[#00A8FF]/30">
                        [{token.symbol}]
                      </span>
                    </td>

                    <td className="py-3 pr-3 text-gray-300">
                      <span className="hover:text-[#00A8FF] cursor-pointer" onClick={() => handleCopy(token.address)}>
                        {token.address.slice(0, 10)}...{token.address.slice(-6)}
                      </span>
                    </td>

                    <td className="py-3 pr-3 text-white font-bold">
                      ${token.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 pr-3 text-gray-300">
                      {token.initialSupply}
                    </td>

                    <td className="py-3 pr-3">
                      {token.verificationStatus === 'AUTOMATIC_VERIFIED_SAFE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Safe ({token.auditRiskScore}/100)</span>
                        </span>
                      )}
                      {token.verificationStatus === 'COMMUNITY_UNVERIFIED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFD400]/15 text-[#FFD400] border border-[#FFD400]/30">
                          <span>Unverified</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSearchResult({ type: 'ADDRESS', data: token })}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] transition-all font-bold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* VIEW 3: OPENTELEMETRY DISTRIBUTED TRACING (JAEGER / ZIPKIN) */}
      {activeTab === 'DISTRIBUTED_TRACING' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top Control Header & Tracing Backend Configuration */}
          <GlassCard level={3} glow="purple" className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-base font-black text-white font-mono flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#A855F7] animate-pulse" />
                  <span>OPENTELEMETRY DISTRIBUTED TRACING & INTER-SERVICE TELEMETRY</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/40 font-bold">
                    W3C TRACE CONTEXT
                  </span>
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Instrumenting Backend API Gateway, PostgreSQL DB (5432), Redis Cache (6379), and Sequencer RPC (8545) with OpenTelemetry
                </p>
              </div>

              {/* Backend Selector & Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-xs font-mono">
                  <span className="text-gray-400 px-2 text-[10px]">Backend:</span>
                  <button
                    onClick={() => telemetryTracing.updateConfig({ backend: 'jaeger' })}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      tracingBackendConfig.backend === 'jaeger'
                        ? 'bg-[#A855F7] text-black shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Jaeger (:16686)
                  </button>
                  <button
                    onClick={() => telemetryTracing.updateConfig({ backend: 'zipkin' })}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      tracingBackendConfig.backend === 'zipkin'
                        ? 'bg-[#FF7A00] text-black shadow-[0_0_10px_rgba(255,122,0,0.4)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Zipkin (:9411)
                  </button>
                  <button
                    onClick={() => telemetryTracing.updateConfig({ backend: 'both' })}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      tracingBackendConfig.backend === 'both'
                        ? 'bg-[#00A8FF] text-black shadow-[0_0_10px_rgba(0,168,255,0.4)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Dual OTLP
                  </button>
                </div>

                <a
                  href="http://localhost:16686"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                  title="Open Jaeger Tracing UI"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span>Jaeger UI</span>
                </a>
              </div>
            </div>

            {/* Service Dependency Topology & Latency Map */}
            <div className="mb-6">
              <div className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-[#00A8FF]" />
                  <span>Inter-Service Communication & Latency Bottleneck Analyzer</span>
                </span>
                <span className="text-[10px] text-gray-500 font-normal">Identifies slowest service hops</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                {/* 1. API Gateway */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 glow-card-blue relative overflow-hidden">
                  <div className="h-[2px] w-full flash-line-blue mb-2 rounded-t-xl" />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-[#00A8FF]" />
                      <span>API Gateway</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00A8FF]/20 text-[#00A8FF]">
                      Port 3000
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">HTTP Ingress & Routing</div>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-gray-500 text-[10px]">p50: <strong className="text-white">{latencyMetrics['gxq-api-gateway'].p50}ms</strong></span>
                    <span className="text-gray-500 text-[10px]">p95: <strong className="text-emerald-400">{latencyMetrics['gxq-api-gateway'].p95}ms</strong></span>
                    <span className="text-gray-500 text-[10px]">p99: <strong className="text-[#FF7A00]">{latencyMetrics['gxq-api-gateway'].p99}ms</strong></span>
                  </div>
                </div>

                {/* 2. Redis Cache */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 glow-card-green relative overflow-hidden">
                  <div className="h-[2px] w-full flash-line-green mb-2 rounded-t-xl" />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Redis L2 Cache</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#10B981]/20 text-[#10B981]">
                      Port 6379
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">Multi-Tier In-Memory Store</div>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-gray-500 text-[10px]">p50: <strong className="text-emerald-400">{latencyMetrics['redis-cache'].p50}ms</strong></span>
                    <span className="text-gray-500 text-[10px]">p95: <strong className="text-emerald-400">{latencyMetrics['redis-cache'].p95}ms</strong></span>
                    <span className="text-gray-500 text-[10px]">p99: <strong className="text-emerald-400">{latencyMetrics['redis-cache'].p99}ms</strong></span>
                  </div>
                </div>

                {/* 3. PostgreSQL Database */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 glow-card-purple relative overflow-hidden">
                  <div className="h-[2px] w-full flash-line-purple mb-2 rounded-t-xl" />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#A855F7]" />
                      <span>PostgreSQL DB</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#A855F7]/20 text-[#A855F7]">
                      Port 5432
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">Canonical Ledger State</div>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-gray-500 text-[10px]">p50: <strong className="text-white">{latencyMetrics['postgres-db'].p50}ms</strong></span>
                    <span className="text-gray-500 text-[10px]">p95: <strong className="text-[#FF7A00]">{latencyMetrics['postgres-db'].p95}ms</strong></span>
                    <span className="text-gray-500 text-[10px]">p99: <strong className="text-[#FF304F]">{latencyMetrics['postgres-db'].p99}ms</strong></span>
                  </div>
                </div>

                {/* 4. Sequencer RPC Node */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 glow-card-orange relative overflow-hidden">
                  <div className="h-[2px] w-full flash-line-orange mb-2 rounded-t-xl" />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#FF7A00]" />
                      <span>Sequencer RPC</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FF7A00]/20 text-[#FF7A00]">
                      Port 8545
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">BFT-PoS Consensus Node</div>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-gray-500 text-[10px]">p50: <strong className="text-white">{latencyMetrics['sequencer-rpc'].p50}ms</strong></span>
                    <span className="text-gray-500 text-[10px]">p95: <strong className="text-[#FF7A00]">{latencyMetrics['sequencer-rpc'].p95}ms</strong></span>
                    <span className="text-gray-500 text-[10px]">p99: <strong className="text-[#FF304F]">{latencyMetrics['sequencer-rpc'].p99}ms</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trace Dispatcher & Synthetic Latency Testing Toolbar */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-[#00A8FF]" />
                  <span>Simulate Inter-Service Traced Request:</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSimulateTrace('normal')}
                  disabled={isSimulatingTrace}
                  className="px-3 py-1.5 rounded-xl bg-[#00A8FF]/20 hover:bg-[#00A8FF]/30 text-[#00A8FF] border border-[#00A8FF]/40 font-bold transition-all disabled:opacity-50"
                >
                  Fast Cache Hit (0.4ms)
                </button>
                <button
                  onClick={() => handleSimulateTrace('cache_miss')}
                  disabled={isSimulatingTrace}
                  className="px-3 py-1.5 rounded-xl bg-[#FF7A00]/20 hover:bg-[#FF7A00]/30 text-[#FF7A00] border border-[#FF7A00]/40 font-bold transition-all disabled:opacity-50"
                >
                  Cache Miss → DB Query
                </button>
                <button
                  onClick={() => handleSimulateTrace('slow_db')}
                  disabled={isSimulatingTrace}
                  className="px-3 py-1.5 rounded-xl bg-[#FFD400]/20 hover:bg-[#FFD400]/30 text-[#FFD400] border border-[#FFD400]/40 font-bold transition-all disabled:opacity-50"
                >
                  Slow DB Lock (&gt;60ms)
                </button>
                <button
                  onClick={() => handleSimulateTrace('error')}
                  disabled={isSimulatingTrace}
                  className="px-3 py-1.5 rounded-xl bg-[#FF304F]/20 hover:bg-[#FF304F]/30 text-[#FF304F] border border-[#FF304F]/40 font-bold transition-all disabled:opacity-50"
                >
                  Simulate Error Span (500)
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Traces Table & Detailed Span Waterfall Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Traces List (5 cols) */}
            <div className="lg:col-span-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#A855F7]" />
                  <span className="font-bold text-white uppercase">Captured Traces ({filteredTraces.length})</span>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={traceFilterStatus}
                    onChange={(e) => setTraceFilterStatus(e.target.value)}
                    className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-gray-300 outline-none"
                  >
                    <option value="all">Status: All</option>
                    <option value="OK">OK Only</option>
                    <option value="ERROR">Errors Only</option>
                  </select>
                </div>
              </div>

              <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredTraces.map((tr) => {
                  const isSelected = selectedTrace?.traceId === tr.traceId;
                  const isErr = tr.statusCode === 'ERROR';
                  return (
                    <div
                      key={tr.traceId}
                      onClick={() => {
                        setSelectedTrace(tr);
                        setSelectedSpan(tr.spans[0]);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#A855F7]/15 border-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.3)] glow-card-purple'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isErr ? 'bg-[#FF304F]' : 'bg-[#10B981]'}`} />
                          <span>{tr.rootSpanName}</span>
                        </span>
                        <span className={`text-[11px] font-bold ${tr.durationMs > 50 ? 'text-[#FF7A00]' : 'text-emerald-400'}`}>
                          {tr.durationMs.toFixed(1)}ms
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span>Trace: {tr.traceId.slice(0, 10)}...</span>
                        <span>{tr.spansCount} Spans</span>
                      </div>

                      {tr.bottleneckService && (
                        <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                          <span className="text-gray-500">Latency Bottleneck:</span>
                          <span className="text-[#FF7A00] font-bold">
                            {tr.bottleneckService} ({tr.bottleneckDurationMs?.toFixed(1)}ms)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: OpenTelemetry Waterfall / Flamegraph (7 cols) */}
            <div className="lg:col-span-7">
              {selectedTrace ? (
                <GlassCard level={2} className="p-5 font-mono text-xs space-y-4">
                  {/* Trace Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{selectedTrace.rootSpanName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedTrace.statusCode === 'OK'
                            ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                            : 'bg-[#FF304F]/20 text-[#FF304F] border border-[#FF304F]/40'
                        }`}>
                          {selectedTrace.statusCode}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
                        <span>Trace ID: <strong className="text-[#00A8FF]">{selectedTrace.traceId}</strong></span>
                        <button
                          onClick={() => handleCopy(selectedTrace.traceId)}
                          className="hover:text-white"
                          title="Copy Trace ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Total Latency</span>
                      <span className="text-base font-black text-white">{selectedTrace.durationMs.toFixed(1)}ms</span>
                    </div>
                  </div>

                  {/* Waterfall Timeline Spans */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-wider mb-2 pb-1 border-b border-white/5">
                      <span>Service / Span Hierarchy</span>
                      <span>Timeline Waterfall (% duration)</span>
                    </div>

                    <div className="space-y-2">
                      {selectedTrace.spans.map((span) => {
                        const isRoot = !span.parentSpanId;
                        const isSelected = selectedSpan?.spanId === span.spanId;
                        const percentOfTotal = Math.max(Math.min((span.durationMs / selectedTrace.durationMs) * 100, 100), 4);
                        const offsetPercent = Math.max(Math.min(((span.startTimeMs - selectedTrace.spans[0].startTimeMs) / selectedTrace.durationMs) * 100, 95), 0);

                        return (
                          <div
                            key={span.spanId}
                            onClick={() => setSelectedSpan(span)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#00A8FF]/15 border-[#00A8FF]/60 shadow-[0_0_12px_rgba(0,168,255,0.25)]'
                                : 'bg-black/40 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 truncate pr-2">
                                {!isRoot && <span className="text-gray-600 text-xs pl-2">↳</span>}
                                <span className="font-bold text-white truncate text-[11px]">{span.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                                  span.service === 'gxq-api-gateway'
                                    ? 'bg-[#00A8FF]/20 text-[#00A8FF]'
                                    : span.service === 'redis-cache'
                                    ? 'bg-[#10B981]/20 text-[#10B981]'
                                    : span.service === 'postgres-db'
                                    ? 'bg-[#A855F7]/20 text-[#A855F7]'
                                    : 'bg-[#FF7A00]/20 text-[#FF7A00]'
                                }`}>
                                  {span.service}
                                </span>
                              </div>

                              <div className="text-right shrink-0">
                                <span className={`text-[10px] font-bold ${span.statusCode === 'ERROR' ? 'text-[#FF304F]' : 'text-gray-200'}`}>
                                  {span.durationMs.toFixed(1)}ms
                                </span>
                              </div>
                            </div>

                            {/* Horizontal Gantt Waterfall Bar */}
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  span.statusCode === 'ERROR'
                                    ? 'bg-[#FF304F]'
                                    : span.service === 'redis-cache'
                                    ? 'bg-[#10B981]'
                                    : span.service === 'postgres-db'
                                    ? 'bg-[#A855F7]'
                                    : span.service === 'sequencer-rpc'
                                    ? 'bg-[#FF7A00]'
                                    : 'bg-[#00A8FF]'
                                }`}
                                style={{
                                  marginLeft: `${offsetPercent}%`,
                                  width: `${percentOfTotal}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Span Metadata & Attributes Drawer */}
                  {selectedSpan && (
                    <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-[#00A8FF]" />
                          <span>OpenTelemetry Span Attributes: {selectedSpan.name}</span>
                        </span>
                        <span className="text-[10px] text-gray-500">Span ID: {selectedSpan.spanId}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-gray-500">Span Kind:</span>{' '}
                          <span className="text-gray-200 font-bold">{selectedSpan.kind}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>{' '}
                          <span className={selectedSpan.statusCode === 'ERROR' ? 'text-[#FF304F] font-bold' : 'text-emerald-400 font-bold'}>
                            {selectedSpan.statusCode} {selectedSpan.statusMessage ? `(${selectedSpan.statusMessage})` : ''}
                          </span>
                        </div>
                        {selectedSpan.parentSpanId && (
                          <div>
                            <span className="text-gray-500">Parent Span:</span>{' '}
                            <span className="text-[#00A8FF]">{selectedSpan.parentSpanId}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">W3C Header:</span>{' '}
                          <span className="text-gray-300 truncate">00-{selectedSpan.traceId}-{selectedSpan.spanId}-01</span>
                        </div>
                      </div>

                      {/* Custom Span Attributes JSON */}
                      <pre className="p-2.5 rounded-lg bg-black/80 border border-white/5 text-[10px] text-emerald-400 overflow-x-auto max-h-36">
                        {JSON.stringify(selectedSpan.attributes, null, 2)}
                      </pre>
                    </div>
                  )}

                </GlassCard>
              ) : (
                <div className="p-12 text-center text-gray-500 font-mono text-xs border border-dashed border-white/10 rounded-2xl">
                  Select a trace on the left to inspect its OpenTelemetry distributed span hierarchy and latency waterfall.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* VIEW 4: WINSTON STRUCTURED LOGGING CONSOLE */}
      {activeTab === 'STRUCTURED_LOGS' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header & Configuration Bar */}
          <GlassCard level={3} glow="green" className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-base font-black text-white font-mono flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#10B981] animate-pulse" />
                  <span>STRUCTURED LOGGING SUBSYSTEM (WINSTON)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-bold">
                    ACTIVE
                  </span>
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Categorized by environment, formatted with ISO timestamps, severity levels, and rich context (User ID, Tx Hash, Trace ID)
                </p>
              </div>

              {/* Environment Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-gray-400">Environment:</span>
                {(['local', 'devnet', 'testnet', 'mainnet'] as LogEnv[]).map((env) => (
                  <button
                    key={env}
                    onClick={() => {
                      setLogEnvFilter(env);
                      logger.setEnvironment(env);
                      triggerFlash('BLUE_FLASH');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                      logEnvFilter === env
                        ? 'bg-[#10B981] text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            {/* Configured Output Formats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Development Output</span>
                  <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#00A8FF]" />
                    <span>Console Transport (Colorized & Simple)</span>
                  </span>
                </div>
                <button
                  onClick={() => setLogOutputMode('dev_console')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    logOutputMode === 'dev_console' ? 'bg-[#00A8FF] text-black' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Active View
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Production Output</span>
                  <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span>Structured JSON File: logs/{logEnvFilter}.log</span>
                  </span>
                </div>
                <button
                  onClick={() => setLogOutputMode('prod_json')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    logOutputMode === 'prod_json' ? 'bg-[#10B981] text-black' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Raw JSON
                </button>
              </div>
            </div>

            {/* Test Log Emission Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 font-mono text-xs">
              <span className="text-gray-400">Dispatch Synthetic Winston Log:</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleEmitSyntheticLog('debug')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                >
                  + Debug
                </button>
                <button
                  onClick={() => handleEmitSyntheticLog('info')}
                  className="px-2.5 py-1 rounded-lg bg-[#00A8FF]/15 text-[#00A8FF] border border-[#00A8FF]/30 hover:bg-[#00A8FF]/25"
                >
                  + Info
                </button>
                <button
                  onClick={() => handleEmitSyntheticLog('warn')}
                  className="px-2.5 py-1 rounded-lg bg-[#FF7A00]/15 text-[#FF7A00] border border-[#FF7A00]/30 hover:bg-[#FF7A00]/25"
                >
                  + Warn
                </button>
                <button
                  onClick={() => handleEmitSyntheticLog('error')}
                  className="px-2.5 py-1 rounded-lg bg-[#FF304F]/15 text-[#FF304F] border border-[#FF304F]/30 hover:bg-[#FF304F]/25"
                >
                  + Error
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Filter Bar & Search */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-500 text-[10px] uppercase">Severity:</span>
              {(['all', 'debug', 'info', 'warn', 'error'] as Array<LogLevel | 'all'>).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold transition-all ${
                    logLevelFilter === lvl
                      ? 'bg-white/20 text-white border border-white/40'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {lvl}
                </button>
              ))}

              <span className="text-gray-500 text-[10px] uppercase ml-2">Service:</span>
              <select
                value={logServiceFilter}
                onChange={(e) => setLogServiceFilter(e.target.value)}
                className="bg-[#070B12] border border-white/15 rounded-lg px-2 py-1 text-[11px] text-gray-300 outline-none"
              >
                <option value="all">All Services</option>
                <option value="api-gateway">API Gateway</option>
                <option value="postgres-db">PostgreSQL</option>
                <option value="redis-cache">Redis Cache</option>
                <option value="sequencer-rpc">Sequencer RPC</option>
                <option value="bridge-relayer">Bridge Relayer</option>
              </select>
            </div>

            {/* Context Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search Context (Tx, User, Trace ID)..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-[#10B981]"
              />
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Live Terminal Log Stream Container */}
          <GlassCard level={2} className="p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 text-[11px]">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
                <span className="font-bold text-white uppercase">Live Structured Stream ({logs.length} entries)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoScrollLogs(!autoScrollLogs)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    autoScrollLogs ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40' : 'text-gray-500'
                  }`}
                >
                  Auto-Scroll: {autoScrollLogs ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => logger.clear()}
                  className="text-gray-500 hover:text-white text-[10px]"
                >
                  Clear Buffer
                </button>
              </div>
            </div>

            {/* Terminal View */}
            <div
              ref={logsContainerRef}
              className="max-h-[500px] overflow-y-auto space-y-2 pr-1 custom-scrollbar"
            >
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No structured log entries matched the current filters. Dispatch synthetic logs above or trigger an action.
                </div>
              ) : (
                logs.map((entry) => {
                  const levelColor = 
                    entry.level === 'error' || entry.level === 'fatal'
                      ? 'text-[#FF304F] bg-[#FF304F]/15 border-[#FF304F]/30'
                      : entry.level === 'warn'
                      ? 'text-[#FF7A00] bg-[#FF7A00]/15 border-[#FF7A00]/30'
                      : entry.level === 'info'
                      ? 'text-[#00A8FF] bg-[#00A8FF]/15 border-[#00A8FF]/30'
                      : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';

                  if (logOutputMode === 'prod_json') {
                    return (
                      <div key={entry.id} className="p-3 rounded-xl bg-black/70 border border-white/10 text-[11px] text-gray-300 overflow-x-auto">
                        <pre className="text-emerald-400">{JSON.stringify(entry, null, 2)}</pre>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-black/50 border border-white/5 hover:border-white/15 transition-all text-xs"
                    >
                      {/* Top Line */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${levelColor}`}>
                            {entry.level}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-white/5 text-gray-300 text-[10px]">
                            [{entry.service}]
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">
                            env:{entry.environment}
                          </span>
                        </div>

                        {entry.context.durationMs !== undefined && (
                          <span className="text-[10px] text-[#00A8FF] font-bold">
                            {entry.context.durationMs}ms
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      <div className="text-white font-medium pl-1">
                        {entry.message}
                      </div>

                      {/* Context Badges (User, Tx, Trace) */}
                      {Object.keys(entry.context).length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[10px]">
                          {entry.context.traceId && (
                            <button
                              onClick={() => {
                                const found = telemetryTracing.getTraceById(entry.context.traceId!);
                                if (found) {
                                  setSelectedTrace(found);
                                  setSelectedSpan(found.spans[0]);
                                  setActiveTab('DISTRIBUTED_TRACING');
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30 hover:bg-[#A855F7]/25 flex items-center gap-1 font-bold"
                              title="Click to view OpenTelemetry trace waterfall"
                            >
                              <Activity className="w-2.5 h-2.5" />
                              <span>Trace: {entry.context.traceId.slice(0, 8)}...</span>
                            </button>
                          )}

                          {entry.context.transactionHash && (
                            <span className="px-2 py-0.5 rounded bg-[#FF7A00]/15 text-[#FF7A00] border border-[#FF7A00]/30 truncate max-w-xs">
                              Tx: {entry.context.transactionHash.slice(0, 10)}...
                            </span>
                          )}

                          {entry.context.userAddress && (
                            <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/15 truncate max-w-xs">
                              User: {entry.context.userAddress.slice(0, 8)}...
                            </span>
                          )}

                          {entry.context.blockNumber && (
                            <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300">
                              Block: #{entry.context.blockNumber}
                            </span>
                          )}

                          {entry.context.statusCode && (
                            <span className={`px-2 py-0.5 rounded ${entry.context.statusCode >= 400 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              HTTP {entry.context.statusCode}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>

        </div>
      )}

    </div>
  );
};
