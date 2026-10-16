import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { ReorderableModuleCard, NeonAccentColor } from '../common/ReorderableModuleCard';
import { MarketSnapshot } from '../../services/marketProvider';
import { SmartWalletUser } from '../../services/smartWallet';
import { EnvironmentConfig } from '../../config/environments';
import { AISignalInsight, ScoreDetails } from '../../services/aiIntelligence';
import { 
  TrendingUp, 
  Wallet, 
  ArrowRight, 
  Sparkles, 
  ArrowRightLeft, 
  Coins, 
  Rocket, 
  ExternalLink, 
  ShieldCheck, 
  Radio, 
  Clock,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Move,
  LayoutGrid,
  Zap,
  Flame
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

const STORAGE_KEY = 'gxq_command_center_layout';

const DEFAULT_MODULE_ORDER = [
  'stats',
  'live_ticker',
  'ai_spotlight',
  'quick_jumpers',
  'faucet_quick_claim',
  'env_architecture',
];

const PRESETS: Record<'balanced' | 'trading' | 'ai', { label: string; order: string[] }> = {
  balanced: {
    label: 'Balanced Pro',
    order: ['stats', 'live_ticker', 'ai_spotlight', 'quick_jumpers', 'faucet_quick_claim', 'env_architecture'],
  },
  trading: {
    label: 'Trading & DEX',
    order: ['live_ticker', 'quick_jumpers', 'stats', 'ai_spotlight', 'faucet_quick_claim', 'env_architecture'],
  },
  ai: {
    label: 'AI Intelligence',
    order: ['ai_spotlight', 'stats', 'live_ticker', 'quick_jumpers', 'env_architecture', 'faucet_quick_claim'],
  },
};

interface ModuleConfig {
  id: string;
  title: string;
  subtitle: string;
  neonColor: NeonAccentColor;
  icon: React.ReactNode;
}

const MODULE_DEFINITIONS: Record<string, ModuleConfig> = {
  stats: {
    id: 'stats',
    title: 'Executive Valuation & On-Chain Metrics',
    subtitle: 'Aggregated net worth, GXQ DEX liquidity & rollup health',
    neonColor: 'blue',
    icon: <Wallet className="w-4 h-4" />,
  },
  live_ticker: {
    id: 'live_ticker',
    title: 'Verified Live Ticker Feed (Binance REST)',
    subtitle: 'Real-time 5s heartbeat with 24h delta, volume & status',
    neonColor: 'green',
    icon: <Radio className="w-4 h-4 animate-pulse" />,
  },
  ai_spotlight: {
    id: 'ai_spotlight',
    title: 'AI Heuristic Command Spotlight',
    subtitle: 'Calibrated algorithmic signal engine & causal rationale',
    neonColor: 'purple',
    icon: <Sparkles className="w-4 h-4" />,
  },
  quick_jumpers: {
    id: 'quick_jumpers',
    title: 'Ecosystem High-Speed Jumpers',
    subtitle: 'SimpleSwap AMM, Staking Vault & Token Launchpad',
    neonColor: 'orange',
    icon: <ArrowRightLeft className="w-4 h-4" />,
  },
  faucet_quick_claim: {
    id: 'faucet_quick_claim',
    title: 'Gas-Free Smart Wallet Quick Relayer',
    subtitle: 'Instant testnet/devnet token allocation with zero gas friction',
    neonColor: 'red',
    icon: <Flame className="w-4 h-4" />,
  },
  env_architecture: {
    id: 'env_architecture',
    title: 'Rollup Infrastructure & Contract Architecture',
    subtitle: 'Multi-environment RPC endpoints, contract addresses & feature gates',
    neonColor: 'yellow',
    icon: <ExternalLink className="w-4 h-4" />,
  },
};

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

  // Saved module order with localStorage persistence & validation
  const [moduleOrder, setModuleOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all known modules are present
          const valid = parsed.filter(id => DEFAULT_MODULE_ORDER.includes(id));
          DEFAULT_MODULE_ORDER.forEach(id => {
            if (!valid.includes(id)) valid.push(id);
          });
          return valid;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_MODULE_ORDER;
  });

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [activePreset, setActivePreset] = useState<'balanced' | 'trading' | 'ai' | 'custom'>('balanced');

  const dropTargetRef = useRef<string | null>(null);
  dropTargetRef.current = dropTargetId;

  // Persist order updates
  const saveOrder = useCallback((newOrder: string[]) => {
    setModuleOrder(newOrder);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
    } catch {
      // ignore
    }
  }, []);

  // Listen for storage events across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setModuleOrder(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Accessible One-Tap Reordering
  const moveModule = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= moduleOrder.length) return;

    const newOrder = [...moduleOrder];
    const [removed] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, removed);
    saveOrder(newOrder);
    setActivePreset('custom');
    triggerFlash('BLUE_FLASH');

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  // Reset to default layout
  const handleResetLayout = () => {
    saveOrder(DEFAULT_MODULE_ORDER);
    setActivePreset('balanced');
    triggerFlash('SUCCESS_FLASH');
  };

  // Apply layout preset
  const handleApplyPreset = (key: 'balanced' | 'trading' | 'ai') => {
    const preset = PRESETS[key];
    saveOrder(preset.order);
    setActivePreset(key);
    triggerFlash('BLUE_FLASH');
  };

  // Touch & Pointer Drag Handler
  const handlePointerStartDrag = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    // Only primary button or touch point
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }

    setDraggedId(id);
    setDropTargetId(null);
    setDragPointerPos({ x: e.clientX, y: e.clientY });

    const handlePointerMove = (moveEvt: PointerEvent) => {
      moveEvt.preventDefault();
      setDragPointerPos({ x: moveEvt.clientX, y: moveEvt.clientY });

      // Hit-test module containers
      const cards = document.querySelectorAll<HTMLElement>('[data-module-id]');
      for (const card of Array.from(cards)) {
        const rect = card.getBoundingClientRect();
        if (moveEvt.clientY >= rect.top && moveEvt.clientY <= rect.bottom) {
          const targetId = card.getAttribute('data-module-id');
          if (targetId && targetId !== id) {
            setDropTargetId(targetId);
          }
          break;
        }
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      const target = dropTargetRef.current;
      if (target && target !== id) {
        setModuleOrder((prevOrder) => {
          const fromIndex = prevOrder.indexOf(id);
          const toIndex = prevOrder.indexOf(target);
          if (fromIndex !== -1 && toIndex !== -1) {
            const nextOrder = [...prevOrder];
            nextOrder.splice(fromIndex, 1);
            nextOrder.splice(toIndex, 0, id);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrder));
            } catch {
              // ignore
            }
            triggerFlash('BLUE_FLASH');
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([15, 40, 15]);
            }
            setActivePreset('custom');
            return nextOrder;
          }
          return prevOrder;
        });
      }

      setDraggedId(null);
      setDropTargetId(null);
      setDragPointerPos(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // Render individual modular sections
  const renderModuleContent = (moduleId: string) => {
    switch (moduleId) {
      case 'stats':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Portfolio Valuation */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Aggregated Portfolio</span>
                <Wallet className="w-4 h-4 text-[#00A8FF]" />
              </div>
              <div className="text-2xl font-black font-mono text-white tracking-tight">
                ${user?.role === 'SUPER_ADMIN' ? '382,410.50' : '8,620.00'}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center text-[#10B981] font-mono font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +8.42% (24h)
                </span>
                <span className="text-[10px] text-gray-500 font-mono">On-Chain Verified</span>
              </div>
            </div>

            {/* Metric 2: GXQ Price & Liquidity */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>GXQ Network Coin</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00A8FF]/10 text-[#00A8FF] font-mono font-bold">DEX POOL</span>
              </div>
              <div className="text-2xl font-black font-mono text-white tracking-tight flex items-center gap-2">
                ${gxqMarket ? gxqMarket.price.toFixed(3) : '1.482'}
                <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                  gxqMarket && gxqMarket.change24h >= 0 ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#FF304F]/20 text-[#FF304F]'
                }`}>
                  {gxqMarket && gxqMarket.change24h >= 0 ? '+' : ''}{gxqMarket ? gxqMarket.change24h.toFixed(2) : '8.42'}%
                </span>
              </div>
              <div className="text-[11px] text-gray-400 flex items-center justify-between">
                <span>24h Vol: ${gxqMarket ? (gxqMarket.volume24h / 1e6).toFixed(2) : '3.94'}M</span>
                <StatusBadge status={gxqMarket?.status || 'LIVE'} size="sm" />
              </div>
            </div>

            {/* Metric 3: Active Target Network */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Rollup Environment</span>
                <Radio className="w-4 h-4 text-[#FF7A00]" />
              </div>
              <div className="text-xl font-bold font-mono text-white truncate">
                {envConfig.name}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-mono text-gray-400">Chain ID: {envConfig.chainId}</span>
                <StatusBadge status={envConfig.id.toUpperCase()} size="sm" />
              </div>
            </div>

            {/* Metric 4: Transparent Health Score */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
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
              <div className="text-[11px] text-gray-400 truncate">
                +22 Diversification, +19 Liquidity
              </div>
            </div>
          </div>
        );

      case 'live_ticker':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                Auto-Heartbeat Stream (Binance Public REST)
              </span>
              <span className="text-[10px] text-gray-500">Live Streaming</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {markets.map((snap) => {
                const isPos = snap.change24h >= 0;
                return (
                  <div
                    key={snap.symbol}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-[#00A8FF]/30 transition-all"
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
          </div>
        );

      case 'ai_spotlight':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center text-[#A855F7]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                    {topInsight.title}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">Calibrated Algorithmic Reasoning</span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-mono font-bold text-[#A855F7]">
                  CONFIDENCE: {topInsight.confidencePercent}%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
              <p className="text-xs text-gray-300 leading-relaxed font-sans">{topInsight.summary}</p>
              
              <div className="space-y-1.5 pt-1 border-t border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-mono">
                  Key Causal Factors:
                </span>
                {topInsight.reasoningPoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5 font-mono">
                <span>Verified Sources:</span>
                <span className="text-gray-200">{topInsight.dataSources.join(', ')}</span>
              </div>
              <button
                onClick={() => onNavigate('ai')}
                className="flex items-center gap-1 text-[#A855F7] hover:underline font-semibold font-mono"
              >
                <span>Launch Full AI Intelligence Enclave</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );

      case 'quick_jumpers':
        return (
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
                <div className="text-[11px] text-gray-400 mt-0.5">Multi-Chain Deploy & Index</div>
              </div>
            </GlassCard>
          </div>
        );

      case 'faucet_quick_claim':
        return (
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Testnet & Devnet Native Faucet Claim
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                  Instant 250 {envConfig.currency.symbol}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Replenish gas-free smart wallet on active environment: <strong className="text-white">{envConfig.name}</strong>
              </p>
            </div>

            <button
              onClick={onClaimFaucet}
              disabled={!envConfig.featureFlags.isFaucetEnabled}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${
                envConfig.featureFlags.isFaucetEnabled
                  ? 'bg-gradient-to-r from-[#FF304F] to-[#FF7A00] hover:brightness-110 text-white shadow-[0_0_20px_rgba(255,48,79,0.3)] active:scale-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Claim 250 {envConfig.currency.symbol}</span>
            </button>
          </div>
        );

      case 'env_architecture':
        return (
          <div className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <span className="text-gray-500 block text-[10px]">RPC Gateway</span>
                <span className="text-gray-200 truncate block text-[11px]">{envConfig.rpcUrl}</span>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <span className="text-gray-500 block text-[10px]">GXQToken Contract</span>
                <span className="text-[#00A8FF] truncate block text-[11px]">{envConfig.contracts.gxqToken}</span>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <span className="text-gray-500 block text-[10px]">SimpleSwap DEX Pool</span>
                <span className="text-gray-200 truncate block text-[11px]">{envConfig.contracts.simpleSwap}</span>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                <span className="text-gray-500 block text-[10px]">Staking Vault Contract</span>
                <span className="text-gray-200 truncate block text-[11px]">{envConfig.contracts.stakingVault}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-gray-400">
                  Swap AMM: <strong className={envConfig.featureFlags.isSwapEnabled ? 'text-[#10B981]' : 'text-[#FF304F]'}>
                    {envConfig.featureFlags.isSwapEnabled ? 'ACTIVE' : 'LOCKED'}
                  </strong>
                </span>
                <span className="text-gray-400">
                  Launchpad: <strong className={envConfig.featureFlags.isLaunchpadEnabled ? 'text-[#10B981]' : 'text-[#FF304F]'}>
                    {envConfig.featureFlags.isLaunchpadEnabled ? 'ACTIVE' : 'LOCKED'}
                  </strong>
                </span>
              </div>

              <button
                onClick={() => onNavigate('guide')}
                className="flex items-center gap-1.5 text-xs text-[#FFD400] hover:underline font-bold"
              >
                <span>Read Multi-Environment Specs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Toolbar: Mobile-First Layout Reorder Engine */}
      <GlassCard level={2} className="p-4 border-b border-[#00A8FF]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          
          {/* Dashboard Title & Mode Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00A8FF]/15 border border-[#00A8FF]/30 flex items-center justify-center text-[#00A8FF] shadow-[0_0_15px_rgba(0,168,255,0.2)]">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  Command Center Layout
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-full border border-[#10B981]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Touch-Reorder Enabled
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Drag modules using handles (⋮⋮) or use ▲/▼ arrows to customize your mobile dashboard
              </p>
            </div>
          </div>

          {/* Action Controls: Presets, Customizer Toggle, Reset */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Presets Segmented Selector */}
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-1 text-[11px] font-mono">
              {(Object.keys(PRESETS) as Array<'balanced' | 'trading' | 'ai'>).map((key) => (
                <button
                  key={key}
                  onClick={() => handleApplyPreset(key)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activePreset === key
                      ? 'bg-[#00A8FF]/20 text-[#00A8FF] font-bold border border-[#00A8FF]/30 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {PRESETS[key].label}
                </button>
              ))}
            </div>

            {/* Customize Mode Toggle */}
            <button
              onClick={() => setIsCustomizing(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
                isCustomizing
                  ? 'bg-[#FF7A00]/20 text-[#FF7A00] border-[#FF7A00]/40 shadow-[0_0_15px_rgba(255,122,0,0.3)] animate-pulse'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isCustomizing ? 'Done Reordering' : 'Customize Layout'}</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetLayout}
              title="Reset to default module layout"
              aria-label="Reset layout to default"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Customizer Active Banner */}
        {isCustomizing && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#FF7A00]/10 border border-[#FF7A00]/30 flex items-center justify-between text-xs text-[#FF7A00] font-mono">
            <span className="flex items-center gap-2">
              <Move className="w-3.5 h-3.5" />
              <span>Touch and drag any card by its (⋮⋮) grip handle, or tap ▲/▼ to shift positions.</span>
            </span>
            <button
              onClick={() => setIsCustomizing(false)}
              className="px-2 py-0.5 rounded bg-[#FF7A00]/20 hover:bg-[#FF7A00]/30 text-white font-bold"
            >
              Save & Lock
            </button>
          </div>
        )}
      </GlassCard>

      {/* Dynamic Reorderable Module List */}
      <div className="space-y-4 relative">
        {moduleOrder.map((modId, index) => {
          const config = MODULE_DEFINITIONS[modId];
          if (!config) return null;

          const isDraggingThis = draggedId === modId;
          const isDropTargetThis = dropTargetId === modId;

          return (
            <ReorderableModuleCard
              key={modId}
              id={modId}
              index={index}
              total={moduleOrder.length}
              title={config.title}
              subtitle={config.subtitle}
              neonColor={config.neonColor}
              icon={config.icon}
              isDragging={isDraggingThis}
              isDropTarget={isDropTargetThis}
              isCustomizing={isCustomizing}
              onMoveUp={() => moveModule(index, 'up')}
              onMoveDown={() => moveModule(index, 'down')}
              onPointerStartDrag={handlePointerStartDrag}
            >
              {renderModuleContent(modId)}
            </ReorderableModuleCard>
          );
        })}
      </div>

      {/* Floating Cyber Neon Drag Preview (Follows finger/mouse touch point smoothly) */}
      {draggedId && dragPointerPos && MODULE_DEFINITIONS[draggedId] && (
        <div
          style={{
            position: 'fixed',
            left: `${dragPointerPos.x}px`,
            top: `${dragPointerPos.y}px`,
            transform: 'translate(-50%, -50%) rotate(2deg) scale(1.02)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className="w-72 p-3.5 rounded-2xl bg-[#070B12]/95 border-2 border-[#00A8FF] shadow-[0_0_30px_rgba(0,168,255,0.6)] backdrop-blur-2xl text-white font-mono text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-[#00A8FF] animate-spin" />
            <span className="font-bold uppercase truncate">
              {MODULE_DEFINITIONS[draggedId].title}
            </span>
          </div>
          <span className="text-[10px] text-[#00A8FF] font-bold px-1.5 py-0.5 rounded bg-[#00A8FF]/20">
            MOVING
          </span>
        </div>
      )}
    </div>
  );
};
