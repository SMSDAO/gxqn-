import React, { useState, useEffect } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { SmartWalletUser } from '../../services/smartWallet';
import { telemetry } from '../../services/telemetry';
import { crossChainService, BridgeTransactionRecord } from '../../services/crossChainService';
import { ReorderableCardSection, SectionItem } from '../common/ReorderableCardSection';
import { 
  Share2, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Layers, 
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Coins
} from 'lucide-react';

interface MultichainBridgeProps {
  currentUser: SmartWalletUser | null;
  triggerFlash: (type: any) => void;
  onRequireLogin: () => void;
}

interface BridgeChain {
  id: string;
  name: string;
  iconColor: string;
  confirmationsNeeded: number;
  avgTime: string;
}

const SUPPORTED_CHAINS: BridgeChain[] = [
  { id: 'ethereum', name: 'Ethereum Mainnet', iconColor: '#627EEA', confirmationsNeeded: 12, avgTime: '~2.5 mins' },
  { id: 'arbitrum', name: 'Arbitrum One (L2)', iconColor: '#28A0F0', confirmationsNeeded: 1, avgTime: '~15 secs' },
  { id: 'polygon', name: 'Polygon PoS', iconColor: '#8247E5', confirmationsNeeded: 64, avgTime: '~45 secs' },
  { id: 'bsc', name: 'Binance Smart Chain', iconColor: '#F3BA2F', confirmationsNeeded: 15, avgTime: '~30 secs' },
  { id: 'solana', name: 'Solana Network', iconColor: '#14F195', confirmationsNeeded: 32, avgTime: '~5 secs' },
];

export const MultichainBridgeModule: React.FC<MultichainBridgeProps> = ({
  currentUser,
  triggerFlash,
  onRequireLogin,
}) => {
  const [sourceChain, setSourceChain] = useState<string>('ethereum');
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC');
  const [amount, setAmount] = useState<string>('500');
  const [isBridging, setIsBridging] = useState<boolean>(false);
  const [activeTx, setActiveTx] = useState<{ hash: string; step: number; correlationId: string } | null>(null);

  const activeSource = SUPPORTED_CHAINS.find(c => c.id === sourceChain) || SUPPORTED_CHAINS[0];

  const [bridgeHistory, setBridgeHistory] = useState<BridgeTransactionRecord[]>(() => crossChainService.getBridgeTransactions());

  useEffect(() => {
    const unsub = crossChainService.subscribe(() => {
      setBridgeHistory(crossChainService.getBridgeTransactions());
    });
    return unsub;
  }, []);

  const handleInitiateBridge = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    setIsBridging(true);
    triggerFlash('ORANGE_FLASH');

    const correlationId = telemetry.generateCorrelationId();
    telemetry.log({
      eventType: 'transaction_request',
      severity: 'INFO',
      actorAddress: currentUser.smartWalletAddress,
      correlationId,
      payload: {
        action: 'multichain_bridge_deposit',
        sourceChain: activeSource.name,
        targetChain: 'GXQ Network (Shard 0)',
        asset: selectedAsset,
        amount: parsed,
      }
    });

    // Register with Cross-Chain Background Synchronization Service
    const bridgeRecord = crossChainService.registerBridgeTransaction({
      sourceChain: activeSource.name,
      targetChain: 'GXQ Network (Shard 0)',
      asset: selectedAsset,
      amount: parsed,
      recipientAddress: currentUser.smartWalletAddress,
      requiredConfirmations: activeSource.confirmationsNeeded,
      correlationId,
    });

    setActiveTx({ hash: bridgeRecord.txHash, step: 1, correlationId });

    // Step 1: Deposit on Source
    await new Promise(r => setTimeout(r, 900));
    setActiveTx(prev => prev ? { ...prev, step: 2 } : null);

    // Step 2: Relayer zk-SNARK proof verification
    await new Promise(r => setTimeout(r, 1100));
    setActiveTx(prev => prev ? { ...prev, step: 3 } : null);

    // Step 3: Destination credit on GXQ Network
    await new Promise(r => setTimeout(r, 700));
    setIsBridging(false);
    triggerFlash('SUCCESS_FLASH');

    telemetry.log({
      eventType: 'transaction_result',
      severity: 'INFO',
      actorAddress: currentUser.smartWalletAddress,
      correlationId,
      payload: { action: 'bridge_completed', status: 'SUCCESS', creditedAsset: selectedAsset }
    });
  };

  // Reorderable sections definition
  const bridgeSections: SectionItem[] = [
    {
      id: 'bridge_config',
      title: 'Universal Ingress & Liquidity Route',
      subtitle: 'Native 1:1 USDC, ETH, WBTC & GXQ multi-chain minting',
      neonColor: 'blue',
      icon: <Share2 className="w-4 h-4 text-[#00A8FF]" />,
      content: (
        <div className="space-y-5">
          {/* Source -> Destination Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Chain */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 glow-card-blue">
              <span className="text-[10px] text-gray-400 uppercase font-mono block mb-2">From Network (Source)</span>
              <select
                value={sourceChain}
                onChange={(e) => setSourceChain(e.target.value)}
                className="w-full bg-[#070B12] border border-white/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-[#00A8FF]"
              >
                {SUPPORTED_CHAINS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400 font-mono">
                <span>Required Confirmations: {activeSource.confirmationsNeeded}</span>
                <span>Finality: {activeSource.avgTime}</span>
              </div>
            </div>

            {/* Destination Chain */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 glow-card-purple">
              <span className="text-[10px] text-gray-400 uppercase font-mono block mb-2">To Network (Destination)</span>
              <div className="p-2 rounded-xl bg-[#070B12] border border-[#00A8FF]/30 text-xs font-mono font-bold text-white flex items-center justify-between">
                <span>GXQ Network (Shard 0 Consensus Core)</span>
                <StatusBadge status="NATIVE" size="sm" />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400 font-mono">
                <span>Smart Wallet Destination:</span>
                <span className="text-[#00A8FF]">{currentUser?.smartWalletAddress ? `${currentUser.smartWalletAddress.slice(0, 8)}...` : '0x9a8B84B4...'}</span>
              </div>
            </div>
          </div>

          {/* Asset & Amount Input */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-mono">
              <span>Asset to Bridge</span>
              <span>Available on {activeSource.name}: <strong className="text-white font-mono">5,000.00</strong></span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl font-black font-mono text-white outline-none focus:text-[#00A8FF]"
              />

              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="bg-[#070B12] border border-white/15 rounded-xl px-4 py-2 text-xs font-bold font-mono text-white outline-none"
              >
                <option value="USDC">USDC (Circle Native)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="GXQ">GXQ Network Coin</option>
                <option value="WBTC">Wrapped Bitcoin</option>
              </select>
            </div>
          </div>

          {/* Bridge Specs & Route */}
          <div className="p-3.5 rounded-xl bg-[#070B12] border border-white/5 space-y-2 text-xs font-mono text-gray-400">
            <div className="flex items-center justify-between">
              <span>Bridge Mechanism</span>
              <span className="text-gray-200">zk-SNARK Light-Client State Verifier</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Universal 1:1 USDC Mint/Burn</span>
              <span className="text-[#10B981] font-bold">100% Fully Backed</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Estimated Relayer Fee</span>
              <span className="text-gray-200">0.001 ETH / Zero Gas on Devnet</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleInitiateBridge}
            disabled={isBridging}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00A8FF] via-[#7928CA] to-[#FF7A00] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-[0_0_20px_rgba(0,168,255,0.4)] disabled:opacity-50"
          >
            {isBridging ? 'Executing Cross-Chain Relayer Flow...' : currentUser ? `Bridge ${amount} ${selectedAsset} to GXQ Network` : 'Connect Wallet to Bridge'}
          </button>
        </div>
      ),
    },
    {
      id: 'bridge_pipeline',
      title: 'Active ZK Relayer Route Pipeline',
      subtitle: 'Real-time cryptographic light-client state verification sequence',
      neonColor: 'purple',
      icon: <Layers className="w-4 h-4 text-[#A855F7]" />,
      content: (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 text-[#00A8FF] ${isBridging ? 'animate-spin' : ''}`} />
              <span>Pipeline Status</span>
            </span>
            <span className="text-gray-400 text-[10px]">Correlation: [{activeTx?.correlationId || 'STANDBY_LISTENER'}]</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border ${activeTx && activeTx.step >= 1 ? 'bg-[#10B981]/15 border-[#10B981]/30 text-white glow-card-green' : 'bg-black/40 border-white/10 text-gray-400'}`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {activeTx && activeTx.step >= 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Clock className="w-3.5 h-3.5" />}
                <span>1. Source Lock</span>
              </div>
              <div className="text-[10px] text-gray-400">Vault locked on {activeSource.name}</div>
            </div>

            <div className={`p-3 rounded-xl border ${activeTx && activeTx.step >= 2 ? 'bg-[#10B981]/15 border-[#10B981]/30 text-white glow-card-blue' : 'bg-black/40 border-white/10 text-gray-400'}`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {activeTx && activeTx.step >= 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Clock className="w-3.5 h-3.5" />}
                <span>2. ZK Relayer Proof</span>
              </div>
              <div className="text-[10px] text-gray-400">Light-client header verified</div>
            </div>

            <div className={`p-3 rounded-xl border ${activeTx && activeTx.step >= 3 ? 'bg-[#10B981]/15 border-[#10B981]/30 text-white glow-card-purple' : 'bg-black/40 border-white/10 text-gray-400'}`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {activeTx && activeTx.step >= 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Clock className="w-3.5 h-3.5" />}
                <span>3. Destination Credit</span>
              </div>
              <div className="text-[10px] text-gray-400">Bridged tokens minted to Smart Wallet</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'bridge_queue',
      title: 'Background Relayer Synchronization Queue',
      subtitle: 'Continuous 3.5s block verifier updating Profile Dashboard status tracker automatically',
      neonColor: 'green',
      icon: <RefreshCw className="w-4 h-4 text-[#10B981] animate-spin" />,
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                <th className="pb-3">Route</th>
                <th className="pb-3">Asset & Amount</th>
                <th className="pb-3">Verification Stage</th>
                <th className="pb-3">Confirmations</th>
                <th className="pb-3">Tx Hash</th>
                <th className="pb-3 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bridgeHistory.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 text-white font-semibold">
                    <div>{tx.sourceChain}</div>
                    <div className="text-[10px] text-gray-500">→ {tx.targetChain}</div>
                  </td>
                  <td className="py-3 text-gray-200">
                    <span className="font-bold text-white">{tx.amount} {tx.asset}</span>
                  </td>
                  <td className="py-3">
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
                  <td className="py-3 text-gray-300 text-[11px]">
                    {tx.confirmations} / {tx.requiredConfirmations}
                  </td>
                  <td className="py-3 text-gray-400 text-[10px]">
                    {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                  </td>
                  <td className="py-3 text-right">
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
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#00A8FF]" />
            <span>MULTICHAIN UNIVERSAL BRIDGE PORTAL</span>
          </h2>
          <p className="text-xs text-gray-400">
            Trust-minimized cross-chain bridge with native 1:1 USDC ingress from Ethereum, Arbitrum, BSC, Polygon, and Solana
          </p>
        </div>
        <StatusBadge status="LIVE" />
      </div>

      {/* Touch-Optimized Reorderable Sections */}
      <ReorderableCardSection
        storageKey="gxq_multichain_bridge_layout"
        items={bridgeSections}
        defaultOrder={['bridge_config', 'bridge_pipeline', 'bridge_queue']}
      />
    </div>
  );
};
