import React, { useState, useEffect } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { EnvironmentConfig } from '../../config/environments';
import { explorerApi, ExplorerBlock, ExplorerTransaction, NetworkStats, AddressProfile } from '../../services/explorerApi';
import { tokenRegistry, IndexedToken } from '../../services/tokenRegistry';
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
  ShieldCheck
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
  const [activeTab, setActiveTab] = useState<'BLOCKS_TXS' | 'TOKEN_TRANSFERS'>('BLOCKS_TXS');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    type: 'BLOCK' | 'TRANSACTION' | 'ADDRESS';
    data: any;
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <span>GXQ QUANTUM BLOCK EXPLORER</span>
            <StatusBadge status={envConfig.id.toUpperCase()} size="sm" />
          </h2>
          <p className="text-xs text-gray-400">Search on-chain blocks, transactions, tokens, smart contracts, and account profiles</p>
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
        <GlassCard level={2} className="p-3.5">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Total Supply</span>
          <div className="text-base font-black font-mono text-white mt-1">100,000,000</div>
          <span className="text-[10px] font-mono text-gray-500">GXQ Genesis Cap</span>
        </GlassCard>

        <GlassCard level={2} className="p-3.5">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">ETH Pegged Price</span>
          <div className="text-base font-black font-mono text-[#00A8FF] mt-1">$3,495.20</div>
          <span className="text-[10px] font-mono text-[#10B981]">1.00 ETH Ratio</span>
        </GlassCard>

        <GlassCard level={2} className="p-3.5">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Current Height</span>
          <div className="text-base font-black font-mono text-white mt-1">
            #{stats ? stats.blockHeight.toLocaleString() : '142,982'}
          </div>
          <span className="text-[10px] font-mono text-gray-500">3.2s Finality</span>
        </GlassCard>

        <GlassCard level={2} className="p-3.5">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Throughput</span>
          <div className="text-base font-black font-mono text-[#10B981] mt-1">
            {stats ? stats.tps : '4,850'} <span className="text-xs">tps</span>
          </div>
          <span className="text-[10px] font-mono text-gray-500">Peak 10,000+</span>
        </GlassCard>

        <GlassCard level={2} className="p-3.5">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Mining Difficulty</span>
          <div className="text-base font-black font-mono text-[#FFD400] mt-1">42.8 TH/q</div>
          <span className="text-[10px] font-mono text-gray-500">1,024 Nodes</span>
        </GlassCard>

        <GlassCard level={2} className="p-3.5">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Gas Price</span>
          <div className="text-base font-black font-mono text-white mt-1">
            {stats ? stats.gasPriceGwei : '0.0012'} <span className="text-xs">Gwei</span>
          </div>
          <span className="text-[10px] font-mono text-[#10B981]">Sub-Cent Tx</span>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
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
      </div>

      {/* Search Result Inspector Display */}
      {searchResult && (
        <GlassCard level={3} glow="blue" className="p-6 border-[#00A8FF]/40 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#00A8FF]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
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

    </div>
  );
};
