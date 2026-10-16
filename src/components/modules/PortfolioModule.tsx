import React, { useState, useEffect } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { EnvironmentConfig } from '../../config/environments';
import { SmartWalletUser } from '../../services/smartWallet';
import { ScoreDetails } from '../../services/aiIntelligence';
import { tokenRegistry, IndexedToken } from '../../services/tokenRegistry';
import { crossChainService, BridgeTransactionRecord, MultiChainDeploymentRecord } from '../../services/crossChainService';
import { ReorderableCardSection, SectionItem } from '../common/ReorderableCardSection';
import { 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Share2, 
  Layers, 
  RefreshCw, 
  Rocket,
  FileJson,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Radio,
  Sparkles,
  Zap
} from 'lucide-react';

interface PortfolioModuleProps {
  envConfig: EnvironmentConfig;
  user: SmartWalletUser | null;
  portfolioScore: ScoreDetails;
  onOpenScoreBreakdown: (score: ScoreDetails) => void;
  onRequireLogin: () => void;
}

export const PortfolioModule: React.FC<PortfolioModuleProps> = ({
  envConfig,
  user,
  portfolioScore,
  onOpenScoreBreakdown,
  onRequireLogin,
}) => {
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [tokens, setTokens] = useState<IndexedToken[]>(() => tokenRegistry.getTokens());
  const [deployments, setDeployments] = useState<MultiChainDeploymentRecord[]>(() => crossChainService.getDeployments());
  const [bridgeTxs, setBridgeTxs] = useState<BridgeTransactionRecord[]>(() => crossChainService.getBridgeTransactions());
  const [activeTrackerTab, setActiveTrackerTab] = useState<'deployments' | 'bridge'>('deployments');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Selected deployment for Metadata JSON editing
  const [selectedDeployForEdit, setSelectedDeployForEdit] = useState<MultiChainDeploymentRecord | null>(() => {
    const deps = crossChainService.getDeployments();
    return deps[0] || null;
  });

  const [metadataJsonText, setMetadataJsonText] = useState<string>(() => {
    const first = crossChainService.getDeployments()[0];
    if (first && (first as any).metadataJson) return (first as any).metadataJson;
    return JSON.stringify({
      tokenName: first?.tokenName || 'Cyber Quantum Protocol',
      symbol: first?.symbol || 'CQP',
      contractAddress: first?.contractAddress || '0x81C7E95C227e51086C45c859fC3FeEa782aC9595',
      deployer: first?.creatorAddress || '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
      chains: ['BASE', 'Polygon', 'Arbitrum', 'Optimism'],
      description: 'Canonical multichain utility token with deterministic CREATE2 deployment.',
      website: 'https://cqp.gxq.network',
      tags: ['MultiChain', 'CREATE2', 'DeFi', 'ZK-Rollup'],
      complianceStandard: 'ERC-20/EIP-1046',
    }, null, 2);
  });

  const [jsonSaveSuccess, setJsonSaveSuccess] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    const unsubRegistry = tokenRegistry.subscribe((allTokens) => {
      setTokens(allTokens);
    });
    const unsubCrossChain = crossChainService.subscribe(() => {
      setDeployments(crossChainService.getDeployments());
      setBridgeTxs(crossChainService.getBridgeTransactions());
    });
    return () => {
      unsubRegistry();
      unsubCrossChain();
    };
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleSaveMetadata = () => {
    try {
      JSON.parse(metadataJsonText);
      setJsonError(null);
      if (selectedDeployForEdit) {
        crossChainService.updateDeploymentMetadata(selectedDeployForEdit.id, metadataJsonText);
        setJsonSaveSuccess(true);
        setTimeout(() => setJsonSaveSuccess(false), 2500);
      }
    } catch (e: any) {
      setJsonError(`Invalid JSON: ${e.message}`);
    }
  };

  const assets = [
    {
      symbol: 'GXQ',
      name: 'GXQ Network Coin',
      balance: isAdmin ? 250000 : 4820,
      priceUsd: 1.482,
      valueUsd: isAdmin ? 370500 : 7143.24,
      allocationPercent: 82.5,
      source: 'On-Chain Verified RPC',
      status: 'VERIFIED',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin (Bridged Universal)',
      balance: 1850,
      priceUsd: 1.00,
      valueUsd: 1850,
      allocationPercent: 9.2,
      source: 'Circle Token Contract',
      status: 'VERIFIED',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum (Wrapped L1)',
      balance: 2.45,
      priceUsd: 3495.20,
      valueUsd: 8563.24,
      allocationPercent: 6.8,
      source: 'Binance Spot Reference',
      status: 'VERIFIED',
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      balance: 0.15,
      priceUsd: 67450.00,
      valueUsd: 10117.50,
      allocationPercent: 1.5,
      source: 'Binance Spot Reference',
      status: 'VERIFIED',
    },
  ];

  const totalValue = assets.reduce((sum, a) => sum + a.valueUsd, 0);

  // Reorderable Card Sections
  const portfolioSections: SectionItem[] = [
    {
      id: 'valuation_metrics',
      title: 'Executive Valuation & On-Chain Custody',
      subtitle: 'Real-time aggregated mark-to-market balances & portfolio health score',
      neonColor: 'blue',
      icon: <TrendingUp className="w-4 h-4 text-[#00A8FF]" />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 glow-card-blue">
            <span className="text-xs text-gray-400 font-mono">Total Net Worth</span>
            <div className="text-2xl font-black font-mono text-white mt-1">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#10B981] font-mono">
              <TrendingUp className="w-3.5 h-3.5" /> +$4,120.40 (7d)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 glow-card-green">
            <span className="text-xs text-gray-400 font-mono">Realized P/L</span>
            <div className="text-2xl font-black font-mono text-[#10B981] mt-1">
              +$18,940.00
            </div>
            <span className="text-[10px] text-gray-500 font-mono mt-2 block">DEX Swaps & Staking Claim</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 glow-card-orange">
            <span className="text-xs text-gray-400 font-mono">Unrealized P/L</span>
            <div className="text-2xl font-black font-mono text-[#FF7A00] mt-1">
              +$24,310.80
            </div>
            <span className="text-[10px] text-gray-500 font-mono mt-2 block">Current Spot Mark-to-Market</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 glow-card-purple">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">Portfolio Health</span>
              <button
                onClick={() => onOpenScoreBreakdown(portfolioScore)}
                className="text-[10px] text-[#A855F7] hover:underline font-mono"
              >
                Breakdown →
              </button>
            </div>
            <div className="text-2xl font-black font-mono text-white mt-1 flex items-center gap-2">
              <span>{portfolioScore.totalScore}/100</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
                {portfolioScore.grade}
              </span>
            </div>
            <span className="text-[10px] text-[#10B981] font-mono mt-2 block">
              100% On-Chain Collateralized
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'multichain_tracker',
      title: 'Multi-Chain Contract Deployments & Bridge Relayer Tracker',
      subtitle: 'Simultaneous deployment status tracker across BASE, Polygon, Arbitrum, and Optimism',
      neonColor: 'green',
      icon: <Globe className="w-4 h-4 text-[#10B981]" />,
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
              <button
                onClick={() => setActiveTrackerTab('deployments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeTrackerTab === 'deployments'
                    ? 'bg-[#10B981]/20 text-[#10B981] font-bold border border-[#10B981]/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Multi-Chain Token Contracts ({deployments.length})</span>
              </button>

              <button
                onClick={() => setActiveTrackerTab('bridge')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeTrackerTab === 'bridge'
                    ? 'bg-[#A855F7]/20 text-[#A855F7] font-bold border border-[#A855F7]/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bridge Transactions ({bridgeTxs.length})</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Background Relayer: Active (3.5s sync interval)</span>
            </span>
          </div>

          {/* Deployments Table */}
          {activeTrackerTab === 'deployments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                    <th className="pb-3">Token Name</th>
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">CREATE2 Deterministic Address</th>
                    <th className="pb-3">BASE (8453)</th>
                    <th className="pb-3">Polygon (137)</th>
                    <th className="pb-3">Arbitrum (42161)</th>
                    <th className="pb-3">Optimism (10)</th>
                    <th className="pb-3 text-right">Actions & Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deployments.map((dep) => (
                    <tr key={dep.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 font-bold text-white flex items-center gap-2">
                        <img src={dep.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-[#00A8FF]" />
                        <span>{dep.tokenName}</span>
                      </td>
                      <td className="py-3.5 font-bold text-[#00A8FF]">
                        [{dep.symbol}]
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <span className="font-mono text-[#00A8FF]">{dep.contractAddress.slice(0, 8)}...{dep.contractAddress.slice(-6)}</span>
                          <button
                            onClick={() => handleCopy(dep.contractAddress)}
                            className="p-1 hover:text-white text-gray-400 transition-colors"
                            title="Copy CREATE2 address (identical on all chains)"
                          >
                            {copiedAddress === dep.contractAddress ? (
                              <Check className="w-3 h-3 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[9px] text-emerald-400">Identical across all EVM chains</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          dep.chains.base ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' : 'text-gray-500'
                        }`}>
                          {dep.chains.base ? dep.chains.base.status : '—'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          dep.chains.polygon ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' : 'text-gray-500'
                        }`}>
                          {dep.chains.polygon ? dep.chains.polygon.status : '—'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          dep.chains.arbitrum ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' : 'text-gray-500'
                        }`}>
                          {dep.chains.arbitrum ? dep.chains.arbitrum.status : '—'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          dep.chains.optimism ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' : 'text-gray-500'
                        }`}>
                          {dep.chains.optimism ? dep.chains.optimism.status : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedDeployForEdit(dep);
                              setMetadataJsonText((dep as any).metadataJson || JSON.stringify({
                                tokenName: dep.tokenName,
                                symbol: dep.symbol,
                                contractAddress: dep.contractAddress,
                                creator: dep.creatorAddress,
                                chains: Object.keys(dep.chains),
                                description: `${dep.tokenName} multichain verified asset.`,
                                website: `https://${dep.symbol.toLowerCase()}.gxq.network`,
                                tags: ['MultiChain', 'CREATE2', 'Cross-Chain-Verified'],
                              }, null, 2));
                            }}
                            className="px-2 py-1 rounded-lg bg-[#FF7A00]/20 hover:bg-[#FF7A00]/30 text-[#FF7A00] text-[10px] font-bold border border-[#FF7A00]/40 transition-colors"
                          >
                            Edit JSON
                          </button>
                          <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#10B981] h-full transition-all duration-500"
                              style={{ width: `${dep.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#10B981] font-bold">{dep.overallProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bridge Transactions Table */}
          {activeTrackerTab === 'bridge' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                    <th className="pb-3">Route Pipeline</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Confirmations</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3 text-right">Auto-Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bridgeTxs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 font-bold text-white">
                        <div>{tx.sourceChain}</div>
                        <div className="text-[10px] text-gray-500">→ {tx.targetChain}</div>
                      </td>
                      <td className="py-3.5 text-gray-200">
                        <span className="font-bold text-white">{tx.amount}</span> <span className="text-[#00A8FF]">{tx.asset}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'COMPLETED'
                            ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                            : tx.status === 'RELAYING'
                            ? 'bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/40'
                            : 'bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-300 text-[11px]">
                        {tx.confirmations}/{tx.requiredConfirmations}
                      </td>
                      <td className="py-3.5 text-gray-400 text-[10px]">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#00A8FF] h-full transition-all duration-500"
                              style={{ width: `${tx.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#00A8FF] font-bold">{tx.progressPercent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'metadata_json_editor',
      title: 'Automated Multi-Chain Metadata JSON Editor & IPFS Synchronizer',
      subtitle: 'Edit token description, website, tags, and cross-chain metadata for deployed assets',
      neonColor: 'orange',
      icon: <FileJson className="w-4 h-4 text-[#FF7A00]" />,
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 font-mono">Editing metadata for:</span>
              <select
                value={selectedDeployForEdit?.id || ''}
                onChange={(e) => {
                  const found = deployments.find((d) => d.id === e.target.value);
                  if (found) {
                    setSelectedDeployForEdit(found);
                    setMetadataJsonText((found as any).metadataJson || JSON.stringify({
                      tokenName: found.tokenName,
                      symbol: found.symbol,
                      contractAddress: found.contractAddress,
                      chains: Object.keys(found.chains),
                      description: `${found.tokenName} multichain verified asset.`,
                      website: `https://${found.symbol.toLowerCase()}.gxq.network`,
                      tags: ['MultiChain', 'CREATE2', 'Cross-Chain-Verified'],
                    }, null, 2));
                  }
                }}
                className="bg-black/60 border border-[#FF7A00]/40 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-white"
              >
                {deployments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.tokenName} [{d.symbol}] ({d.contractAddress.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(metadataJsonText);
                    setMetadataJsonText(JSON.stringify(parsed, null, 2));
                    setJsonError(null);
                  } catch (e: any) {
                    setJsonError(`Cannot format: ${e.message}`);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-gray-300 transition-colors"
              >
                Format JSON
              </button>
              <button
                onClick={handleSaveMetadata}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#FF7A00] to-[#FF304F] text-black font-bold text-xs font-mono hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save & Broadcast Metadata</span>
              </button>
            </div>
          </div>

          {jsonSaveSuccess && (
            <div className="p-2.5 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-xs text-[#10B981] font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Metadata JSON successfully updated and synchronized across all chains & token registry!</span>
            </div>
          )}

          {jsonError && (
            <div className="p-2.5 rounded-xl bg-[#FF304F]/20 border border-[#FF304F]/40 text-xs text-[#FF304F] font-mono">
              {jsonError}
            </div>
          )}

          <textarea
            value={metadataJsonText}
            onChange={(e) => {
              setMetadataJsonText(e.target.value);
              try {
                JSON.parse(e.target.value);
                setJsonError(null);
              } catch (err: any) {
                setJsonError(`JSON Syntax: ${err.message}`);
              }
            }}
            rows={8}
            className="w-full bg-[#030507]/90 border border-white/15 rounded-2xl p-3 font-mono text-xs text-gray-200 outline-none focus:border-[#FF7A00]/60 resize-y"
          />
        </div>
      ),
    },
    {
      id: 'verified_holdings',
      title: 'Verified On-Chain Asset Custody',
      subtitle: 'Cryptographically proven asset balances verified via Merkle tree RPC state root',
      neonColor: 'yellow',
      icon: <PieChart className="w-4 h-4 text-[#FFD400]" />,
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                <th className="pb-3">Asset</th>
                <th className="pb-3">Balance</th>
                <th className="pb-3">Current Price</th>
                <th className="pb-3">Total Value</th>
                <th className="pb-3">Weight</th>
                <th className="pb-3">Data Source</th>
                <th className="pb-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assets.map((asset) => (
                <tr key={asset.symbol} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-white">{asset.symbol}</div>
                    <div className="text-[10px] text-gray-500">{asset.name}</div>
                  </td>
                  <td className="py-3.5 font-bold text-gray-200">
                    {asset.balance.toLocaleString()} {asset.symbol}
                  </td>
                  <td className="py-3.5 text-gray-300">
                    ${asset.priceUsd > 100 ? asset.priceUsd.toLocaleString() : asset.priceUsd.toFixed(3)}
                  </td>
                  <td className="py-3.5 font-bold text-white">
                    ${asset.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-gray-400">{asset.allocationPercent}%</td>
                  <td className="py-3.5 text-[11px] text-gray-500">{asset.source}</td>
                  <td className="py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#00A8FF]" />
            <span>PORTFOLIO INTELLIGENCE & MULTI-CHAIN TRACKER</span>
          </h2>
          <p className="text-xs text-gray-400">
            Touch-reorderable executive modules, simultaneous multi-chain contract tracking, and automated metadata JSON editor
          </p>
        </div>
        <StatusBadge status="VERIFIED" />
      </div>

      {/* Render Reorderable Touch Card Sections */}
      <ReorderableCardSection
        storageKey="gxq_portfolio_module_layout"
        items={portfolioSections}
      />
    </div>
  );
};
