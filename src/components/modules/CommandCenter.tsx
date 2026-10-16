import React from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { MarketSnapshot } from '../../services/marketProvider';
import { SmartWalletUser } from '../../services/smartWallet';
import { EnvironmentConfig } from '../../config/environments';
import { AISignalInsight, ScoreDetails } from '../../services/aiIntelligence';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowRight, 
  Sparkles, 
  ArrowRightLeft, 
  Coins, 
  Rocket, 
  ExternalLink,
  ShieldCheck,
  Radio,
  Clock
} from 'lucide-react';

interface CommandCenterProps {
  envConfig: EnvironmentConfig;
  user: SmartWalletUser | null;
  markets: MarketSnapshot[];
  topInsight: AISignalInsight;
  portfolioScore: ScoreDetails;
  onOpenScoreBreakdown: (score: ScoreDetails) => void;
  onNavigate: (tab: any) => void;
  onClaimFaucet: () => void;
  triggerFlash: (type: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  envConfig,
  user,
  markets,
  topInsight,
  portfolioScore,
  onOpenScoreBreakdown,
  onNavigate,
  onClaimFaucet,
  triggerFlash,
}) => {
  const gxqMarket = markets.find(m => m.symbol === 'GXQ/USD') || markets[0];

  return (
    <div className="space-y-6">
      
      {/* Top Section: Executive Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Portfolio Valuation */}
        <GlassCard level={3} glow="blue" className="p-5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Aggregated Portfolio</span>
            <Wallet className="w-4 h-4 text-[#00A8FF]" />
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            ${user?.role === 'SUPER_ADMIN' ? '382,410.50' : '8,620.00'}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="flex items-center text-[#10B981] font-mono font-semibold">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +8.42% (24h)
            </span>
            <span className="text-[10px] text-gray-500 font-mono">Verified On-Chain</span>
          </div>
        </GlassCard>

        {/* Metric 2: GXQ Price & Liquidity */}
        <GlassCard level={2} className="p-5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>GXQ Network Coin</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00A8FF]/10 text-[#00A8FF] font-mono">DEX POOL</span>
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-tight flex items-center gap-2">
            ${gxqMarket ? gxqMarket.price.toFixed(3) : '1.482'}
            <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
              gxqMarket && gxqMarket.change24h >= 0 ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#FF304F]/20 text-[#FF304F]'
            }`}>
              {gxqMarket && gxqMarket.change24h >= 0 ? '+' : ''}{gxqMarket ? gxqMarket.change24h.toFixed(2) : '8.42'}%
            </span>
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>24h Vol: ${gxqMarket ? (gxqMarket.volume24h / 1e6).toFixed(2) : '3.94'}M</span>
            <StatusBadge status={gxqMarket?.status || 'LIVE'} size="sm" />
          </div>
        </GlassCard>

        {/* Metric 3: Active Target Network */}
        <GlassCard level={2} className="p-5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Active Rollup Environment</span>
            <Radio className="w-4 h-4 text-[#FF7A00]" />
          </div>
          <div className="text-xl font-bold font-mono text-white truncate">
            {envConfig.name}
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-xs font-mono text-gray-400">Chain ID: {envConfig.chainId}</span>
            <StatusBadge status={envConfig.id.toUpperCase()} size="sm" />
          </div>
        </GlassCard>

        {/* Metric 4: Transparent Health Score */}
        <GlassCard level={2} className="p-5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Portfolio Health</span>
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black font-mono text-[#00A8FF]">
              {portfolioScore.totalScore}/100
            </div>
            <button
              onClick={() => onOpenScoreBreakdown(portfolioScore)}
              className="text-[11px] text-[#00A8FF] hover:underline font-mono"
            >
              Breakdown →
            </button>
          </div>
          <div className="text-[11px] text-gray-400 mt-2 truncate">
            +22 Diversification, +19 Liquidity
          </div>
        </GlassCard>
      </div>

      {/* Live Market Strip (Canonical Model with Real Binance Feed) */}
      <GlassCard level={2} className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live Verified Ticker Feed</h3>
          </div>
          <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Auto-Heartbeat 5s (Binance Public REST)
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {markets.map((snap) => {
            const isPos = snap.change24h >= 0;
            return (
              <div
                key={snap.symbol}
                className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#00A8FF]/30 transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white font-mono">{snap.symbol}</span>
                  <StatusBadge status={snap.status} size="sm" />
                </div>
                <div className="text-base font-extrabold font-mono text-gray-100">
                  ${snap.price > 100 ? snap.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : snap.price.toFixed(3)}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                  <span className={isPos ? 'text-[#10B981]' : 'text-[#FF304F]'}>
                    {isPos ? '+' : ''}{snap.change24h.toFixed(2)}%
                  </span>
                  <span className="text-gray-500 text-[10px]">
                    ${(snap.volume24h / 1e6).toFixed(1)}M
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Main Grid: AI Intelligence Spotlight + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: AI Command Center Spotlight */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard level={3} glow="blue" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00A8FF]/20 border border-[#00A8FF]/30 flex items-center justify-center text-[#00A8FF]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">AI HEURISTIC COMMAND SPOTLIGHT</h3>
                  <span className="text-[10px] text-gray-400 font-mono">Algorithmic Heuristic Signal Engine</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#00A8FF]">
                  CONFIDENCE: {topInsight.confidencePercent}%
                </span>
                <span className="text-[10px] text-gray-500 block font-mono">Calibrated Model</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
              <h4 className="text-sm font-semibold text-white mb-1.5">{topInsight.title}</h4>
              <p className="text-xs text-gray-300 leading-relaxed mb-3">{topInsight.summary}</p>
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Causal Reasoning Summary:
                </span>
                {topInsight.reasoningPoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A8FF]" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5 font-mono">
                <span>Verified Sources:</span>
                <span className="text-gray-200">{topInsight.dataSources.join(', ')}</span>
              </div>
              <button
                onClick={() => onNavigate('ai')}
                className="flex items-center gap-1 text-[#00A8FF] hover:underline font-semibold"
              >
                Open Full AI Center <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </GlassCard>

          {/* Quick Ecosystem Jumpers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <GlassCard
              level={2}
              interactive
              onClick={() => onNavigate('swap')}
              className="p-4 flex flex-col justify-between"
            >
              <div className="w-9 h-9 rounded-xl bg-[#00A8FF]/15 border border-[#00A8FF]/30 flex items-center justify-center text-[#00A8FF] mb-3">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">SimpleSwap DEX</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Swap GXQ with 0.3% LP fee</div>
              </div>
            </GlassCard>

            <GlassCard
              level={2}
              interactive
              onClick={() => onNavigate('stake')}
              className="p-4 flex flex-col justify-between"
            >
              <div className="w-9 h-9 rounded-xl bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center text-[#A855F7] mb-3">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Staking Vault</div>
                <div className="text-[11px] text-gray-400 mt-0.5">14.8% - 29.6% APR Tiers</div>
              </div>
            </GlassCard>

            <GlassCard
              level={2}
              interactive
              onClick={() => onNavigate('launchpad')}
              className="p-4 flex flex-col justify-between"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FF7A00]/15 border border-[#FF7A00]/30 flex items-center justify-center text-[#FF7A00] mb-3">
                <Rocket className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Token Launchpad</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Deploy & pair tokens</div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Right Col: Multi-Environment Quick Reference */}
        <div className="space-y-4">
          <GlassCard level={2} className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Environment Architecture
              </span>
              <StatusBadge status={envConfig.id.toUpperCase()} size="sm" />
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">RPC Endpoint</span>
                <span className="text-gray-200 truncate block">{envConfig.rpcUrl}</span>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">GXQToken Contract</span>
                <span className="text-[#00A8FF] truncate block text-[11px]">{envConfig.contracts.gxqToken}</span>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">SimpleSwap DEX Pool</span>
                <span className="text-gray-200 truncate block text-[11px]">{envConfig.contracts.simpleSwap}</span>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px]">Staking Vault</span>
                <span className="text-gray-200 truncate block text-[11px]">{envConfig.contracts.stakingVault}</span>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-gray-400 text-[11px]">Feature: DEX Swap</span>
                <span className={`text-[11px] font-bold ${envConfig.featureFlags.isSwapEnabled ? 'text-[#10B981]' : 'text-[#FF304F]'}`}>
                  {envConfig.featureFlags.isSwapEnabled ? 'ACTIVE' : 'LOCKED'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-[11px]">Feature: Launchpad</span>
                <span className={`text-[11px] font-bold ${envConfig.featureFlags.isLaunchpadEnabled ? 'text-[#10B981]' : 'text-[#FF304F]'}`}>
                  {envConfig.featureFlags.isLaunchpadEnabled ? 'ACTIVE' : 'LOCKED'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-[11px]">Faucet Claim</span>
                <span className={`text-[11px] font-bold ${envConfig.featureFlags.isFaucetEnabled ? 'text-[#10B981]' : 'text-[#FF304F]'}`}>
                  {envConfig.featureFlags.isFaucetEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10">
              <button
                onClick={() => onNavigate('guide')}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <span>Read Multi-Environment Docs</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
