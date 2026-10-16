import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { EnvironmentConfig } from '../../config/environments';
import { SmartWalletUser } from '../../services/smartWallet';
import { telemetry } from '../../services/telemetry';
import { explorerApi, StakeTransactionRecord } from '../../services/explorerApi';
import { 
  Coins, 
  ShieldCheck, 
  Clock, 
  Award, 
  ArrowUpRight, 
  CheckCircle2, 
  History,
  Copy,
  Check,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { ReorderableCardSection, SectionItem } from '../common/ReorderableCardSection';

interface StakeModuleProps {
  envConfig: EnvironmentConfig;
  user: SmartWalletUser | null;
  onRequireLogin: () => void;
  triggerFlash: (type: any) => void;
  onNavigateToExplorer?: (txHash?: string) => void;
}

interface StakeItem {
  id: string;
  amount: number;
  tierName: string;
  aprPercent: number;
  startDate: string;
  lockDays: number;
  claimableReward: number;
}

export const StakeModule: React.FC<StakeModuleProps> = ({
  envConfig,
  user,
  onRequireLogin,
  triggerFlash,
  onNavigateToExplorer,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vaults' | 'history'>('vaults');
  const [stakeAmount, setStakeAmount] = useState<string>('500');
  const [selectedDuration, setSelectedDuration] = useState<number>(90);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active positions state
  const [stakes, setStakes] = useState<StakeItem[]>([
    {
      id: 'stk_01',
      amount: user?.role === 'SUPER_ADMIN' ? 50000 : 2500,
      tierName: '90-Day Strategic Vault',
      aprPercent: 22.2,
      startDate: '2026-09-01T12:00:00Z',
      lockDays: 90,
      claimableReward: user?.role === 'SUPER_ADMIN' ? 1342.80 : 68.40,
    },
    {
      id: 'stk_02',
      amount: user?.role === 'SUPER_ADMIN' ? 25000 : 1000,
      tierName: 'Flexible Validator Pool',
      aprPercent: 14.8,
      startDate: '2026-09-25T08:00:00Z',
      lockDays: 0,
      claimableReward: user?.role === 'SUPER_ADMIN' ? 204.10 : 12.20,
    }
  ]);

  // Stake History Data from explorerApi
  const [stakeHistory, setStakeHistory] = useState<StakeTransactionRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'STAKE' | 'CLAIM_REWARDS' | 'COMPOUND'>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const tiers = [
    { days: 0, label: 'Flexible', apr: 14.8, mult: '1.0x' },
    { days: 30, label: '30 Days', apr: 17.76, mult: '1.2x' },
    { days: 90, label: '90 Days', apr: 22.2, mult: '1.5x' },
    { days: 365, label: '365 Days', apr: 29.6, mult: '2.0x' },
  ];

  const totalStaked = stakes.reduce((acc, s) => acc + s.amount, 0);
  const totalRewards = stakes.reduce((acc, s) => acc + s.claimableReward, 0);

  // Fetch stake history from explorerApi
  const fetchStakeHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const records = await explorerApi.getStakingHistory(user?.smartWalletAddress);
      setStakeHistory(records);
    } catch {
      // Fallback
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStakeHistory();
  }, [user?.smartWalletAddress]);

  // Micro-accumulation ticker for real feel
  useEffect(() => {
    const timer = setInterval(() => {
      setStakes(prev => prev.map(s => ({
        ...s,
        claimableReward: s.claimableReward + (s.amount * (s.aprPercent / 100) / (365 * 86400) * 2)
      })));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleStake = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }

    const amt = parseFloat(stakeAmount) || 0;
    if (amt <= 0) return;

    setIsSubmitting(true);
    triggerFlash('ORANGE_FLASH');

    const tier = tiers.find(t => t.days === selectedDuration) || tiers[0];
    const correlationId = telemetry.generateCorrelationId();
    const newTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const blockHeight = explorerApi.getCurrentBlockHeight ? explorerApi.getCurrentBlockHeight() : 142982;

    telemetry.log({
      eventType: 'transaction_request',
      severity: 'INFO',
      network: envConfig.id,
      actorAddress: user.smartWalletAddress,
      correlationId,
      payload: {
        method: 'GXQStaking.stake',
        amount: amt,
        lockDays: tier.days,
        contract: envConfig.contracts.stakingVault,
      }
    });

    await new Promise(r => setTimeout(r, 1200));

    // Record into explorerApi on-chain transactions
    await explorerApi.recordStakingTransaction({
      hash: newTxHash,
      blockNumber: blockHeight,
      timestamp: new Date().toISOString(),
      from: user.smartWalletAddress,
      to: envConfig.contracts.stakingVault,
      amount: amt.toFixed(2),
      asset: 'GXQ',
      action: 'STAKE',
      vaultTier: `${tier.label} Vault`,
      aprPercent: tier.apr,
      lockPeriodDays: tier.days,
      rewardEarnedGxq: '0.00',
      status: 'SUCCESS',
      gasFee: '0.000085',
      correlationId,
    });

    const newStake: StakeItem = {
      id: `stk_${Date.now()}`,
      amount: amt,
      tierName: `${tier.label} Tier`,
      aprPercent: tier.apr,
      startDate: new Date().toISOString(),
      lockDays: tier.days,
      claimableReward: 0,
    };

    setStakes([newStake, ...stakes]);
    setIsSubmitting(false);
    setSuccessMsg(`Successfully staked ${amt} GXQ in the ${tier.label} vault! Transaction recorded on-chain.`);
    triggerFlash('SUCCESS_FLASH');
    
    // Refresh history
    await fetchStakeHistory();
  };

  const handleClaimReward = async (id: string) => {
    if (!user) return;
    const targetStake = stakes.find(s => s.id === id);
    const rewardAmt = targetStake ? targetStake.claimableReward : 0;
    if (rewardAmt <= 0) return;

    const correlationId = telemetry.generateCorrelationId();
    const newTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const blockHeight = explorerApi.getCurrentBlockHeight ? explorerApi.getCurrentBlockHeight() : 142982;

    telemetry.log({
      eventType: 'transaction_request',
      severity: 'INFO',
      network: envConfig.id,
      actorAddress: user.smartWalletAddress,
      correlationId,
      payload: { method: 'GXQStaking.claimReward', stakeId: id, amount: rewardAmt }
    });

    // Record into explorerApi on-chain transactions
    await explorerApi.recordStakingTransaction({
      hash: newTxHash,
      blockNumber: blockHeight,
      timestamp: new Date().toISOString(),
      from: user.smartWalletAddress,
      to: envConfig.contracts.stakingVault,
      amount: rewardAmt.toFixed(2),
      asset: 'GXQ',
      action: 'CLAIM_REWARDS',
      vaultTier: targetStake?.tierName || 'Validator Pool',
      aprPercent: targetStake?.aprPercent || 14.8,
      lockPeriodDays: targetStake?.lockDays || 0,
      rewardEarnedGxq: rewardAmt.toFixed(2),
      status: 'SUCCESS',
      gasFee: '0.000062',
      correlationId,
    });

    setStakes(prev => prev.map(s => s.id === id ? { ...s, claimableReward: 0 } : s));
    triggerFlash('SUCCESS_FLASH');
    setSuccessMsg(`Rewards (${rewardAmt.toFixed(4)} GXQ) successfully transferred to your Smart Wallet!`);

    // Refresh history
    await fetchStakeHistory();
  };

  // Filtered Stake History Records
  const filteredHistory = useMemo(() => {
    return stakeHistory.filter((rec) => {
      const matchType = historyFilter === 'ALL' || rec.action === historyFilter;
      const matchSearch = historySearch === '' || 
        rec.hash.toLowerCase().includes(historySearch.toLowerCase()) ||
        rec.vaultTier.toLowerCase().includes(historySearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [stakeHistory, historyFilter, historySearch]);

  // Aggregate Staking History Metrics
  const historyMetrics = useMemo(() => {
    let totalLifetimeStaked = 0;
    let totalRewardsClaimed = 0;
    let count = stakeHistory.length;

    stakeHistory.forEach(rec => {
      const val = parseFloat(rec.amount) || 0;
      if (rec.action === 'STAKE') totalLifetimeStaked += val;
      if (rec.action === 'CLAIM_REWARDS' || rec.action === 'COMPOUND') totalRewardsClaimed += parseFloat(rec.rewardEarnedGxq) || val;
    });

    return {
      totalLifetimeStaked,
      totalRewardsClaimed,
      count,
    };
  }, [stakeHistory]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header with Navigation Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#00A8FF]" />
            <span>GXQ VALIDATOR &amp; STAKING VAULT</span>
          </h2>
          <p className="text-xs text-gray-400">
            Lock GXQ to secure the sequencer, earn up to 29.60% APR, and inspect verified on-chain stake history
          </p>
        </div>

        {/* View Switcher: Vaults vs Stake History Dashboard */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#070B12] border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('vaults')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              activeSubTab === 'vaults'
                ? 'bg-[#00A8FF] text-black shadow-[0_0_12px_rgba(0,168,255,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Staking Vaults</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              activeSubTab === 'history'
                ? 'bg-[#00A8FF] text-black shadow-[0_0_12px_rgba(0,168,255,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stake History</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubTab === 'history' ? 'bg-black/20 text-black' : 'bg-[#00A8FF]/20 text-[#00A8FF]'}`}>
              {stakeHistory.length}
            </span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: STAKING VAULTS & ACTIVE DEPOSITS */}
      {activeSubTab === 'vaults' && (
        <ReorderableCardSection
          storageKey="gxq_stake_vaults_layout"
          items={[
            {
              id: 'stake_form',
              title: 'Stake GXQ Tokens',
              subtitle: 'Vault TVL: 38.4M GXQ • Dynamic Lockup Yield Multiplier',
              neonColor: 'yellow',
              icon: <Coins className="w-4 h-4 text-[#FFD400]" />,
              content: (
                <div className="space-y-4">
                  {/* Tier Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {tiers.map((tier) => (
                      <button
                        key={tier.days}
                        onClick={() => setSelectedDuration(tier.days)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          selectedDuration === tier.days
                            ? 'bg-[#FFD400]/20 border-[#FFD400] shadow-[0_0_15px_rgba(255,212,0,0.2)]'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-semibold text-gray-300">{tier.label}</div>
                        <div className="text-lg font-black font-mono text-white mt-1">{tier.apr}% <span className="text-[10px] text-gray-400">APR</span></div>
                        <div className="text-[10px] font-mono text-[#FFD400] mt-0.5">{tier.mult} Multiplier</div>
                      </button>
                    ))}
                  </div>

                  {/* Amount Input */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-mono">
                      <span>Deposit Amount</span>
                      <span>Available: <span className="font-mono text-white font-bold">4,820.00 GXQ</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-transparent text-xl font-bold font-mono text-white outline-none"
                      />
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-[#00A8FF]/20 text-[#00A8FF]">GXQ</span>
                    </div>
                  </div>

                  {successMsg && (
                    <div className="p-3 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-xs text-[#10B981] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <button
                    onClick={handleStake}
                    disabled={isSubmitting || !envConfig.featureFlags.isStakingEnabled}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FFD400] via-[#FF7A00] to-[#FF304F] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-[0_0_20px_rgba(255,212,0,0.3)]"
                  >
                    {isSubmitting ? 'Staking & Locking Tokens on Sequencer...' : user ? 'Confirm Staking Position' : 'Connect Wallet to Stake'}
                  </button>
                </div>
              ),
            },
            {
              id: 'stake_positions',
              title: `Your Active Staking Positions (${stakes.length})`,
              subtitle: 'Live BFT sequencer yield accrual & instantaneous claim pipeline',
              neonColor: 'green',
              icon: <Award className="w-4 h-4 text-[#10B981]" />,
              content: (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-xs text-gray-400 font-mono">Position Vault Breakdown</span>
                    <button 
                      onClick={() => setActiveSubTab('history')} 
                      className="text-xs text-[#00A8FF] hover:underline font-mono flex items-center gap-1"
                    >
                      <span>View Full History</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {stakes.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#070B12] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.tierName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            {item.aprPercent}% APR
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-1">
                          Deposited: <span className="text-white font-semibold">{item.amount.toLocaleString()} GXQ</span> • Staked on {new Date(item.startDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400 uppercase font-mono">Unclaimed Reward</div>
                          <div className="text-xs font-bold font-mono text-[#10B981]">+{item.claimableReward.toFixed(4)} GXQ</div>
                        </div>

                        <button
                          onClick={() => handleClaimReward(item.id)}
                          disabled={item.claimableReward <= 0}
                          className="px-3 py-1.5 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] text-xs font-semibold hover:bg-[#10B981]/30 disabled:opacity-40 transition-colors"
                        >
                          Claim
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              id: 'stake_metrics',
              title: 'Global Staking Metrics & Accrued Yield',
              subtitle: 'Active Staked, Real-time block yield & Lifetime rewards on-chain verified',
              neonColor: 'blue',
              icon: <ShieldCheck className="w-4 h-4 text-[#00A8FF]" />,
              content: (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1 flex items-center justify-between">
                      <span>Your Active Staked</span>
                      <span className="text-[10px] text-[#00A8FF] font-mono">BFT Sequencer</span>
                    </div>
                    <div className="text-xl font-black font-mono text-white">
                      {totalStaked.toLocaleString()} <span className="text-xs text-[#00A8FF]">GXQ</span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">
                      ≈ ${(totalStaked * 1.482).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1 flex items-center justify-between">
                      <span>Accruing Rewards</span>
                      <span className="text-[10px] text-[#10B981] font-mono">Real-Time</span>
                    </div>
                    <div className="text-xl font-black font-mono text-[#10B981]">
                      +{totalRewards.toFixed(4)} <span className="text-xs">GXQ</span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">Accruing every block (3.2s)</div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1 flex items-center justify-between">
                      <span>Lifetime Claimed</span>
                      <span className="text-[10px] text-purple-400 font-mono">On-Chain</span>
                    </div>
                    <div className="text-xl font-black font-mono text-purple-400">
                      +{historyMetrics.totalRewardsClaimed.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs">GXQ</span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">{historyMetrics.count} transactions</div>
                  </div>
                </div>
              ),
            },
          ]}
          defaultOrder={['stake_form', 'stake_positions', 'stake_metrics']}
        />
      )}

      {/* SUB-VIEW 2: STAKE HISTORY DASHBOARD (Using explorerApi Data) */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          
          {/* Dashboard Summary Banner */}
          <GlassCard level={3} glow="blue" className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-[#00A8FF]" />
                  <span>ON-CHAIN STAKE HISTORY &amp; REWARD AUDIT</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Direct ledger transactions indexed via explorerApi for smart wallet: {user?.smartWalletAddress ? `${user.smartWalletAddress.slice(0, 8)}...${user.smartWalletAddress.slice(-6)}` : '0x9a8B...F5B8'}
                </p>
              </div>

              <button
                onClick={fetchStakeHistory}
                disabled={isLoadingHistory}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 self-start md:self-auto"
                title="Refresh Staking Ledger"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00A8FF] ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>Sync Ledger</span>
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-500 block text-[10px]">Lifetime Staked</span>
                <span className="text-white font-bold">{historyMetrics.totalLifetimeStaked.toLocaleString()} GXQ</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-500 block text-[10px]">Cumulative Rewards</span>
                <span className="text-[#10B981] font-bold">+{historyMetrics.totalRewardsClaimed.toLocaleString(undefined, { minimumFractionDigits: 2 })} GXQ</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-500 block text-[10px]">Total Staking Txns</span>
                <span className="text-[#00A8FF] font-bold">{historyMetrics.count} Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-500 block text-[10px]">Vault Security</span>
                <span className="text-emerald-400 font-bold">Audited &amp; Active</span>
              </div>
            </div>
          </GlassCard>

          {/* Staking Transactions Table Card */}
          <GlassCard level={2} className="p-4 sm:p-6">
            
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              
              {/* Action Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-[#070B12] p-1 rounded-xl border border-white/10 text-xs font-mono">
                {(['ALL', 'STAKE', 'CLAIM_REWARDS', 'COMPOUND'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setHistoryFilter(type)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      historyFilter === type
                        ? 'bg-[#00A8FF] text-black font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {type === 'ALL' ? 'All Actions' : type === 'STAKE' ? 'Staked' : type === 'CLAIM_REWARDS' ? 'Claimed' : 'Compounded'}
                  </button>
                ))}
              </div>

              {/* Search by Hash / Vault */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Filter by hash or vault..."
                  className="w-full bg-[#070B12] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 outline-none focus:border-[#00A8FF]/40"
                />
              </div>
            </div>

            {/* Transactions List */}
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center font-mono text-gray-400 text-xs">
                No staking transactions match your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                      <th className="pb-3">Action &amp; Vault</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Reward Earned</th>
                      <th className="pb-3">Block &amp; Hash</th>
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredHistory.map((rec) => {
                      const isStake = rec.action === 'STAKE';
                      const isClaim = rec.action === 'CLAIM_REWARDS';
                      const isCompound = rec.action === 'COMPOUND';
                      const actionBadgeColor = isStake
                        ? 'bg-[#00A8FF]/15 text-[#00A8FF] border-[#00A8FF]/30'
                        : isClaim
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                        : isCompound
                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

                      return (
                        <tr key={rec.hash} className="hover:bg-white/5 transition-colors">
                          
                          {/* Action & Vault */}
                          <td className="py-3.5 pr-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${actionBadgeColor} flex items-center gap-1`}>
                                {isStake ? <ArrowDownRight className="w-3 h-3" /> : isClaim ? <Award className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                <span>{rec.action.replace('_', ' ')}</span>
                              </span>
                              <span className="font-semibold text-white truncate max-w-[150px]" title={rec.vaultTier}>
                                {rec.vaultTier}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {rec.aprPercent}% APR • {rec.lockPeriodDays > 0 ? `${rec.lockPeriodDays}d Lock` : 'Flexible'}
                            </div>
                          </td>

                          {/* Staked Amount */}
                          <td className="py-3.5 font-bold text-gray-100">
                            {rec.amount} <span className="text-[10px] text-gray-400 font-normal">GXQ</span>
                          </td>

                          {/* Reward Earned */}
                          <td className="py-3.5">
                            {parseFloat(rec.rewardEarnedGxq) > 0 ? (
                              <span className="font-bold text-[#10B981]">
                                +{rec.rewardEarnedGxq} GXQ
                              </span>
                            ) : (
                              <span className="text-gray-500 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Block & Hash */}
                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5 text-gray-300">
                              <span className="text-[#00A8FF]">#{rec.blockNumber}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400 font-mono text-[11px]">
                                {rec.hash.slice(0, 8)}...{rec.hash.slice(-6)}
                              </span>
                              <button
                                onClick={() => handleCopyHash(rec.hash)}
                                className="p-1 hover:text-white text-gray-500 transition-colors"
                                title="Copy Transaction Hash"
                              >
                                {copiedHash === rec.hash ? (
                                  <Check className="w-3 h-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Fee: {rec.gasFee} GXQ
                            </div>
                          </td>

                          {/* Timestamp */}
                          <td className="py-3.5 text-gray-400 text-[11px]">
                            <div>{new Date(rec.timestamp).toLocaleDateString()}</div>
                            <div className="text-[10px] text-gray-500">{new Date(rec.timestamp).toLocaleTimeString()}</div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 text-right pr-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>{rec.status}</span>
                            </span>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

        </div>
      )}

    </div>
  );
};
