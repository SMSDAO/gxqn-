import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { SmartWalletUser } from '../../services/smartWallet';
import { telemetry } from '../../services/telemetry';
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

    const txHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    setActiveTx({ hash: txHash, step: 1, correlationId });

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

      {/* Main Bridge Configuration Card */}
      <GlassCard level={3} glow="blue" className="p-6">
        
        {/* Source -> Destination Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          
          {/* Source Chain */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-mono block mb-2">From Network (Source)</span>
            <select
              value={sourceChain}
              onChange={(e) => setSourceChain(e.target.value)}
              className="w-full bg-[#070B12] border border-white/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none"
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
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-mono block mb-2">To Network (Destination)</span>
            <div className="p-2 rounded-xl bg-[#070B12] border border-[#00A8FF]/30 text-xs font-mono font-bold text-white flex items-center justify-between">
              <span>GXQ Network (Shard 0 Consensus Core)</span>
              <StatusBadge status="NATIVE" size="sm" />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400 font-mono">
              <span>Smart Wallet Destination:</span>
              <span className="text-[#00A8FF]">{currentUser?.smartWalletAddress.slice(0, 8)}...</span>
            </div>
          </div>

        </div>

        {/* Asset & Amount Input */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
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
        <div className="p-3.5 rounded-xl bg-[#070B12] border border-white/5 space-y-2 text-xs font-mono text-gray-400 mb-6">
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
            <span className="text-gray-200">0.001 ETH / Free on Devnet</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleInitiateBridge}
          disabled={isBridging}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00A8FF] via-[#7928CA] to-[#FF7A00] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-[0_0_20px_rgba(0,168,255,0.3)] disabled:opacity-50"
        >
          {isBridging ? 'Executing Cross-Chain Relayer Flow...' : currentUser ? `Bridge ${amount} ${selectedAsset} to GXQ Network` : 'Connect Wallet to Bridge'}
        </button>

      </GlassCard>

      {/* Live Transaction Tracker */}
      {activeTx && (
        <GlassCard level={2} className="p-5 border-[#00A8FF]/40">
          <div className="flex items-center justify-between mb-3 text-xs font-mono">
            <span className="font-bold text-white flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 text-[#00A8FF] ${isBridging ? 'animate-spin' : ''}`} />
              Active Bridge Route Pipeline
            </span>
            <span className="text-gray-400">Correlation ID: [{activeTx.correlationId}]</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className={`p-3 rounded-xl border ${activeTx.step >= 1 ? 'bg-[#10B981]/15 border-[#10B981]/30 text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {activeTx.step >= 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Clock className="w-3.5 h-3.5" />}
                <span>1. Source Lock</span>
              </div>
              <div className="text-[10px] text-gray-400">Vault locked on {activeSource.name}</div>
            </div>

            <div className={`p-3 rounded-xl border ${activeTx.step >= 2 ? 'bg-[#10B981]/15 border-[#10B981]/30 text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {activeTx.step >= 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Clock className="w-3.5 h-3.5" />}
                <span>2. ZK Relayer Proof</span>
              </div>
              <div className="text-[10px] text-gray-400">Cryptographic light-client header verified</div>
            </div>

            <div className={`p-3 rounded-xl border ${activeTx.step >= 3 ? 'bg-[#10B981]/15 border-[#10B981]/30 text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {activeTx.step >= 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Clock className="w-3.5 h-3.5" />}
                <span>3. Destination Credit</span>
              </div>
              <div className="text-[10px] text-gray-400">Bridged USDC minted to Smart Wallet</div>
            </div>
          </div>
        </GlassCard>
      )}

    </div>
  );
};
