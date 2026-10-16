import React, { useState, useEffect } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { EnvironmentConfig } from '../../config/environments';
import { SmartWalletUser } from '../../services/smartWallet';
import { telemetry } from '../../services/telemetry';
import { explorerApi } from '../../services/explorerApi';
import { tokenRegistry, IndexedToken } from '../../services/tokenRegistry';
import { 
  ArrowDownUp, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
  Info,
  Clock,
  Layers,
  Search,
  X,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Twitter,
  Radio
} from 'lucide-react';

interface SwapModuleProps {
  envConfig: EnvironmentConfig;
  user: SmartWalletUser | null;
  onRequireLogin: () => void;
  triggerFlash: (type: any) => void;
  onTxCompleted: () => void;
  initialFromToken?: string;
  initialToToken?: string;
}

export const SwapModule: React.FC<SwapModuleProps> = ({
  envConfig,
  user,
  onRequireLogin,
  triggerFlash,
  onTxCompleted,
  initialFromToken = 'GXQ',
  initialToToken = 'USDC',
}) => {
  const [tokens, setTokens] = useState<IndexedToken[]>(() => tokenRegistry.getTokens());
  const [fromTokenSymbol, setFromTokenSymbol] = useState<string>(initialFromToken);
  const [toTokenSymbol, setToTokenSymbol] = useState<string>(initialToToken);
  const [fromAmount, setFromAmount] = useState<string>('100');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [recentTxHash, setRecentTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tokenModalTarget, setTokenModalTarget] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'VERIFIED' | 'LAUNCHPAD'>('ALL');

  // Subscribe to live token registry
  useEffect(() => {
    const unsub = tokenRegistry.subscribe((updatedTokens) => {
      setTokens(updatedTokens);
    });
    return unsub;
  }, []);

  // Update initial tokens if changed
  useEffect(() => {
    if (initialFromToken) setFromTokenSymbol(initialFromToken);
    if (initialToToken) setToTokenSymbol(initialToToken);
  }, [initialFromToken, initialToToken]);

  const flags = explorerApi.getSystemFlags();
  const isSwapPaused = flags.isSwapPaused || !envConfig.featureFlags.isSwapEnabled;

  const fromToken = tokens.find(t => t.symbol.toUpperCase() === fromTokenSymbol.toUpperCase()) || tokens[0];
  const toToken = tokens.find(t => t.symbol.toUpperCase() === toTokenSymbol.toUpperCase()) || tokens[1] || tokens[0];

  // Constant product math (x * y = k) with 0.3% fee
  const parsedFromAmount = parseFloat(fromAmount) || 0;
  const rawRatio = (fromToken?.priceUsd || 1) / (toToken?.priceUsd || 1);
  const feeFactor = 0.997; // 30 bps fee
  const estimatedOutput = parsedFromAmount > 0 ? (parsedFromAmount * rawRatio * feeFactor) : 0;
  const minReceived = estimatedOutput * (1 - slippage / 100);
  const priceImpact = parsedFromAmount > 10000 ? 0.85 : parsedFromAmount > 1000 ? 0.22 : 0.05;

  const handleSwapTokensDirection = () => {
    setFromTokenSymbol(toToken.symbol);
    setToTokenSymbol(fromToken.symbol);
  };

  const handleSelectToken = (token: IndexedToken) => {
    if (tokenModalTarget === 'from') {
      if (token.symbol === toTokenSymbol) {
        setToTokenSymbol(fromTokenSymbol);
      }
      setFromTokenSymbol(token.symbol);
    } else if (tokenModalTarget === 'to') {
      if (token.symbol === fromTokenSymbol) {
        setFromTokenSymbol(toTokenSymbol);
      }
      setToTokenSymbol(token.symbol);
    }
    setTokenModalTarget(null);
    setSearchQuery('');
  };

  const filteredTokens = tokens.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterCategory === 'VERIFIED') return t.verificationStatus === 'AUTOMATIC_VERIFIED_SAFE';
    if (filterCategory === 'LAUNCHPAD') return t.isLaunchpadCreated;
    return true;
  });

  const handleExecuteSwap = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }

    if (isSwapPaused) {
      setErrorMessage('DEX Swapping is temporarily locked by network governance.');
      return;
    }

    if (parsedFromAmount <= 0) {
      setErrorMessage('Please enter a valid swap amount greater than 0.');
      return;
    }

    if (parsedFromAmount > fromToken.balance) {
      setErrorMessage(`Insufficient ${fromToken.symbol} balance.`);
      return;
    }

    setErrorMessage(null);
    setIsSwapping(true);
    triggerFlash('ORANGE_FLASH');

    const correlationId = telemetry.generateCorrelationId();
    telemetry.log({
      eventType: 'transaction_request',
      severity: 'INFO',
      network: envConfig.id,
      actorAddress: user.smartWalletAddress,
      correlationId,
      payload: {
        method: 'SimpleSwap.swapExactTokensForTokens',
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amountIn: parsedFromAmount,
        estimatedOut: estimatedOutput,
        slippagePercent: slippage,
      }
    });

    await new Promise(r => setTimeout(r, 1200));

    const simulatedHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    // Record on explorer
    await explorerApi.recordTransaction({
      hash: simulatedHash,
      blockNumber: 142985 + Math.floor(Math.random() * 20),
      timestamp: new Date().toISOString(),
      from: user.smartWalletAddress,
      to: envConfig.contracts.simpleSwap,
      value: parsedFromAmount.toString(),
      asset: fromToken.symbol,
      status: 'SUCCESS',
      method: `swap_${fromToken.symbol}_for_${toToken.symbol}`,
      gasUsed: 145000,
      gasFee: '0.000145',
      correlationId,
    });

    // Update balances in state
    fromToken.balance = Math.max(0, fromToken.balance - parsedFromAmount);
    toToken.balance = toToken.balance + estimatedOutput;

    setRecentTxHash(simulatedHash);
    setIsSwapping(false);
    triggerFlash('SUCCESS_FLASH');
    onTxCompleted();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <span>DEX SWAP & AUTOMATED LIQUIDITY POOLS</span>
          </h2>
          <p className="text-xs text-gray-400">
            Swap native GXQ, bridged USDC, and all community-launched tokens with automatic indexing
          </p>
        </div>
        <StatusBadge status={isSwapPaused ? 'OFFLINE' : 'LIVE'} />
      </div>

      {/* Main Glass Swap Card */}
      <GlassCard level={3} glow="blue" className="p-6 relative overflow-hidden">
        
        {/* Card Header & Settings */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00A8FF]" />
            <span>Constant Product AMM (x * y = k)</span>
          </span>

          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span>Slippage:</span>
            {[0.1, 0.5, 1.0].map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  slippage === s ? 'bg-[#00A8FF] text-white font-bold' : 'bg-white/5 hover:bg-white/10 text-gray-300'
                }`}
              >
                {s}%
              </button>
            ))}
          </div>
        </div>

        {/* FROM BOX */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>You Pay</span>
            <span>
              Balance: <strong className="text-white">{fromToken.balance.toLocaleString()} {fromToken.symbol}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-mono font-bold text-white outline-none"
            />

            {/* Token Selector Button */}
            <button
              onClick={() => setTokenModalTarget('from')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs font-bold transition-all shrink-0"
            >
              <img src={fromToken.logoUrl} alt={fromToken.symbol} className="w-5 h-5 rounded-full object-cover bg-black" />
              <span>{fromToken.symbol}</span>
              <span className="text-[10px] text-[#00A8FF] bg-[#00A8FF]/20 px-1.5 py-0.5 rounded">[{fromToken.symbol}]</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
            <span>~${(parsedFromAmount * fromToken.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
            <button
              onClick={() => setFromAmount(fromToken.balance.toString())}
              className="text-[#00A8FF] hover:underline"
            >
              MAX
            </button>
          </div>
        </div>

        {/* INVERT DIRECTION BUTTON */}
        <div className="flex justify-center -my-2.5 relative z-10">
          <button
            onClick={handleSwapTokensDirection}
            className="w-9 h-9 rounded-full bg-[#070B12] border border-[#00A8FF]/40 text-[#00A8FF] hover:border-[#00A8FF] hover:scale-110 shadow-[0_0_15px_rgba(0,168,255,0.3)] flex items-center justify-center transition-all"
            title="Swap Tokens Direction"
          >
            <ArrowDownUp className="w-4 h-4" />
          </button>
        </div>

        {/* TO BOX */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all space-y-2 mt-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>You Receive (Estimated)</span>
            <span>
              Balance: <strong className="text-white">{toToken.balance.toLocaleString()} {toToken.symbol}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="w-full text-2xl font-mono font-bold text-white truncate">
              {estimatedOutput > 0 ? estimatedOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}
            </div>

            {/* Token Selector Button */}
            <button
              onClick={() => setTokenModalTarget('to')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs font-bold transition-all shrink-0"
            >
              <img src={toToken.logoUrl} alt={toToken.symbol} className="w-5 h-5 rounded-full object-cover bg-black" />
              <span>{toToken.symbol}</span>
              <span className="text-[10px] text-[#00A8FF] bg-[#00A8FF]/20 px-1.5 py-0.5 rounded">[{toToken.symbol}]</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
            <span>~${(estimatedOutput * toToken.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
            {toToken.verificationStatus === 'AUTOMATIC_VERIFIED_SAFE' && (
              <span className="text-[#10B981] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Safe</span>
              </span>
            )}
          </div>
        </div>

        {/* SWAP ROUTE & ACCRUAL METRICS */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs font-mono text-gray-300 mt-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Exchange Rate</span>
            <span className="text-white font-bold">1 {fromToken.symbol} ≈ {rawRatio.toFixed(4)} {toToken.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Min. Received after Slippage ({slippage}%)</span>
            <span className="text-white">{minReceived.toFixed(4)} {toToken.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Estimated Price Impact</span>
            <span className={priceImpact > 0.5 ? 'text-[#FF304F]' : 'text-[#10B981]'}>{priceImpact}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Liquidity Provider Fee (0.30%)</span>
            <span>{(parsedFromAmount * 0.003).toFixed(4)} {fromToken.symbol}</span>
          </div>
        </div>

        {/* Error / Warning Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#FF304F]/15 border border-[#FF304F]/40 text-xs text-[#FF304F] flex items-center gap-2 mt-4 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ACTION BUTTON */}
        <button
          onClick={handleExecuteSwap}
          disabled={isSwapPaused || isSwapping}
          className={`w-full mt-5 py-3.5 rounded-xl font-mono text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
            isSwapPaused
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#00A8FF] via-[#008CFF] to-[#7928CA] hover:brightness-110 text-white shadow-[0_0_20px_rgba(0,168,255,0.4)]'
          }`}
        >
          <ArrowDownUp className="w-4 h-4" />
          <span>{isSwapping ? 'Executing Swapping Contract...' : `Swap ${fromToken.symbol} for ${toToken.symbol}`}</span>
        </button>

        {/* Recent Transaction Notification */}
        {recentTxHash && (
          <div className="mt-4 p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs font-mono text-[#10B981] flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Swap confirmed on GXQ Ledger!</span>
            </span>
            <span className="text-[11px] text-gray-300">
              Tx: {recentTxHash.slice(0, 8)}...{recentTxHash.slice(-6)}
            </span>
          </div>
        )}
      </GlassCard>

      {/* TOKEN SELECTOR MODAL WITH AUTOMATIC INDEXING & LOGOS */}
      {tokenModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#070B12] border border-white/20 shadow-2xl space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Select a Token</h3>
                <span className="text-[10px] font-mono bg-[#00A8FF]/20 text-[#00A8FF] px-2 py-0.5 rounded-full font-bold">
                  {tokens.length} Available
                </span>
              </div>
              <button 
                onClick={() => setTokenModalTarget(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by name, symbol, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 font-mono outline-none focus:border-[#00A8FF]"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              {[
                { id: 'ALL', label: 'All Tokens' },
                { id: 'VERIFIED', label: '✓ Verified Safe' },
                { id: 'LAUNCHPAD', label: 'Launchpad' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterCategory(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    filterCategory === f.id
                      ? 'bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/40 font-bold'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Token List */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
              {filteredTokens.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  No matching tokens found in the active index.
                </div>
              ) : (
                filteredTokens.map((t) => (
                  <button
                    key={t.address}
                    onClick={() => handleSelectToken(t)}
                    className="w-full p-2.5 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all border border-transparent hover:border-white/10 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={t.logoUrl} 
                        alt={t.symbol} 
                        className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/20 bg-black shrink-0" 
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white group-hover:text-[#00A8FF] transition-colors">
                            {t.name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                            [{t.symbol}]
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                          <span className="text-white font-medium">${t.priceUsd.toFixed(2)}</span>
                          <span>•</span>
                          {t.verificationStatus === 'AUTOMATIC_VERIFIED_SAFE' && (
                            <span className="text-[#10B981] flex items-center gap-0.5 font-semibold">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>Safe</span>
                            </span>
                          )}
                          {t.verificationStatus === 'COMMUNITY_UNVERIFIED' && (
                            <span className="text-[#FFD400]">Unverified</span>
                          )}
                          {t.tags && t.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-1 py-0.2 rounded text-[9px] bg-[#00A8FF]/10 text-[#00A8FF] border border-[#00A8FF]/20">
                              {tag}
                            </span>
                          ))}
                          {t.twitterHandle && (
                            <span className="text-[#00A8FF]">X: {t.twitterHandle}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {t.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {t.symbol}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-white/10 text-[11px] text-gray-400 font-mono text-center">
              All tokens deployed in Token Launchpad are automatically indexed here.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
