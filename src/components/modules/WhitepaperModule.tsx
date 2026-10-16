import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { 
  BookOpen, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  ShieldCheck, 
  Coins, 
  Share2, 
  Server, 
  Calculator, 
  Cpu, 
  Pickaxe, 
  ArrowLeftRight, 
  Rocket, 
  Lock 
} from 'lucide-react';

export const WhitepaperModule: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('abstract');
  
  // Interactive Tokenomics Calculator State
  const [calcGxqAmount, setCalcGxqAmount] = useState<number>(1000);
  const [ethPegPrice, setEthPegPrice] = useState<number>(3495.20);
  const [stakingDays, setStakingDays] = useState<number>(90);

  // Staking yield math based on tier
  const multiplier = stakingDays >= 180 ? 2.0 : stakingDays >= 90 ? 1.5 : stakingDays >= 30 ? 1.2 : 1.0;
  const baseApr = 14.8;
  const calculatedApr = (baseApr * multiplier).toFixed(2);
  const estimatedRewardGxq = ((calcGxqAmount * (Number(calculatedApr) / 100) * (stakingDays / 365))).toFixed(2);
  const totalUsdValue = (calcGxqAmount * ethPegPrice).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(`GXQ Network V3.0.0 Technical Whitepaper\nCanonical Specification: /docs/WHITEPAPER.md\nTotal Supply: 100,000,000 GXQ\nPeg: 1 GXQ = 1 ETH Liquidity Coupling ($${ethPegPrice.toLocaleString()})\nConsensus: BFT-QPoS + Dynamic State Sharding`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = [
    { id: 'abstract', label: '1. Abstract & Problem Statement', icon: BookOpen },
    { id: 'consensus', label: '2. Quantum Core & Mining Consensus', icon: Pickaxe },
    { id: 'tokenomics', label: '3. Tokenomics & ETH Peg Ratio', icon: Coins },
    { id: 'bridge', label: '4. Multichain Bridge & USDC Ingress', icon: Share2 },
    { id: 'dex_launchpad', label: '5. AMM DEX & Token Launchpad', icon: Rocket },
    { id: 'contracts', label: '6. Smart Contracts & Post-Quantum Security', icon: Cpu },
    { id: 'enterprise', label: '7. Exclusive Enterprise Edition & SLAs', icon: Lock },
    { id: 'api_cache', label: '8. API SDK & PostgreSQL/Redis Cache', icon: Server },
    { id: 'roadmap', label: '9. 2026-2028 Technical Roadmap', icon: Layers },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#00A8FF]" />
            <span>GXQ NETWORK V3.0.0 COMPREHENSIVE TECHNICAL WHITEPAPER</span>
          </h2>
          <p className="text-xs text-gray-400">
            Post-Quantum Lattice Cryptography, Dynamic State Sharding, ETH Peg Tokenomics, Universal USDC Bridge, and Enterprise Subnets
          </p>
        </div>

        <button
          onClick={handleCopyMarkdown}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Citation Copied!' : 'Export /docs/WHITEPAPER.md'}</span>
        </button>
      </div>

      {/* Navigation & Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Table of Contents Column */}
        <div className="space-y-1.5 font-mono text-xs">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider px-2 block mb-1">
            Whitepaper Index
          </span>
          {sections.map((item) => {
            const Icon = item.icon;
            const isSelected = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#00A8FF]/20 border border-[#00A8FF] text-[#00A8FF] font-bold shadow-[0_0_12px_rgba(0,168,255,0.25)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane Column */}
        <div className="md:col-span-3 space-y-6">
          <GlassCard level={2} className="p-6">
            
            {/* SECTION 1: ABSTRACT */}
            {activeSection === 'abstract' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    1. Abstract & Executive Problem Statement
                  </h3>
                  <StatusBadge status="SECTION 1" size="sm" />
                </div>
                
                <p className="text-xs text-gray-300 leading-relaxed">
                  Distributed ledger architectures currently face four critical structural barriers: quantum vulnerability of legacy elliptic curve algorithms (ECDSA), cross-chain liquidity fragmentation, unpredictably volatile execution costs, and a lack of deterministic institutional account abstraction.
                </p>

                <p className="text-xs text-gray-300 leading-relaxed">
                  GXQ Network V3.0.0 resolves these challenges by uniting post-quantum lattice cryptography (Dilithium-3 & SPHINCS+), dynamic state sharding with Cross-Shard Messaging (CSM), an automated ERC-4337 smart wallet subsystem, universal 1:1 backed USDC bridging, and an automated token launchpad directly wired into decentralized AMM liquidity pools.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-gray-500 block uppercase">Peak Throughput</span>
                    <span className="text-[#00A8FF] font-bold text-sm block mt-0.5">10,000+ TPS</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-gray-500 block uppercase">Deterministic Finality</span>
                    <span className="text-[#10B981] font-bold text-sm block mt-0.5">3.2 Seconds</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-gray-500 block uppercase">Post-Quantum Lattice</span>
                    <span className="text-[#A855F7] font-bold text-sm block mt-0.5">NIST Level 5</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-gray-500 block uppercase">Total Genesis Supply</span>
                    <span className="text-[#FF7A00] font-bold text-sm block mt-0.5">100M GXQ</span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: CONSENSUS & MINING NODES */}
            {activeSection === 'consensus' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    2. Quantum Blockchain Core & Hybrid Mining Mechanism
                  </h3>
                  <StatusBadge status="SECTION 2" size="sm" />
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  GXQ utilizes a dual-engine consensus architecture: <strong>BFT Quantum Proof-of-Stake (BFT-QPoS)</strong> for instant block production and validator finality, coupled with <strong>Quantum Proof-of-Execution (QPoW)</strong> for decentralized entropy generation and zero-knowledge batch aggregation.
                </p>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs space-y-2">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Pickaxe className="w-3.5 h-3.5 text-[#FFD400]" />
                    <span>Mining Node Architecture & Sequencer Committees:</span>
                  </div>
                  <div className="text-gray-300">• 1,024 rotating validator seats selected via verifiable quantum random beacons (QRNG).</div>
                  <div className="text-gray-300">• Slashing condition: 100% principal burn for equivocation or cross-shard invalid receipt generation.</div>
                  <div className="text-gray-300">• Shard 0 (Beacon Shard) anchors cross-shard Merkle-Patricia trees in $O(\log n)$ verification complexity.</div>
                </div>
              </div>
            )}

            {/* SECTION 3: TOKENOMICS & ETH PEG */}
            {activeSection === 'tokenomics' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    3. Tokenomics of $GXQ & Liquidity Pegging to Ethereum
                  </h3>
                  <StatusBadge status="100M FIXED SUPPLY" size="sm" />
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  The native $GXQ token possesses a fixed total supply of <strong>100,000,000 GXQ</strong>. Its valuation model is dynamically pegged to the price of Ethereum (ETH) via algorithmic liquidity depth in SimpleSwap AMM reserve pools, providing computational density and institutional purchasing power.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-gray-400 block uppercase">Fixed Total Supply</span>
                    <span className="text-white font-bold mt-1 block">100,000,000 GXQ</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-gray-400 block uppercase">ETH Peg Reference</span>
                    <span className="text-[#00A8FF] font-bold mt-1 block">1 GXQ = 1 ETH ($3,495.20)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-gray-400 block uppercase">Staking Yield Tier</span>
                    <span className="text-[#10B981] font-bold mt-1 block">14.8% — 29.6% APR</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-gray-400 block uppercase">Launchpad Burn</span>
                    <span className="text-[#FF7A00] font-bold mt-1 block">100 GXQ / Launch</span>
                  </div>
                </div>

                {/* Interactive Tokenomics & Peg Calculator */}
                <div className="p-5 rounded-2xl bg-[#00A8FF]/10 border border-[#00A8FF]/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-[#00A8FF]" />
                      <span>Interactive Peg & Staking Yield Simulator</span>
                    </h4>
                    <span className="text-[10px] font-mono text-[#00A8FF]">Dynamic AMM Curve</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                    <div>
                      <label className="text-[11px] text-gray-300 block mb-1">GXQ Position</label>
                      <input
                        type="number"
                        value={calcGxqAmount}
                        onChange={(e) => setCalcGxqAmount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/20 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-300 block mb-1">Lock Duration</label>
                      <select
                        value={stakingDays}
                        onChange={(e) => setStakingDays(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/20 text-white font-bold"
                      >
                        <option value={0}>Flexible (14.8% APR)</option>
                        <option value={30}>30 Days (17.76% APR)</option>
                        <option value={90}>90 Days (22.20% APR)</option>
                        <option value={180}>180 Days (29.60% APR)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-300 block mb-1">Total Valuation (Pegged)</label>
                      <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/20 text-[#10B981] font-bold">
                        ${totalUsdValue} USD
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs flex items-center justify-between">
                    <span className="text-gray-300">
                      Calculated APR: <strong className="text-[#10B981]">{calculatedApr}%</strong>
                    </span>
                    <span className="text-white">
                      Estimated Staking Reward: <strong className="text-[#00A8FF]">+{estimatedRewardGxq} GXQ</strong>
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-mono text-xs space-y-2">
                  <div className="text-white font-bold">Genesis Distribution Allocation:</div>
                  <div className="text-gray-300">• 40% (40,000,000 GXQ) — Community Staking & Sequencer Rewards (10-year release curve)</div>
                  <div className="text-gray-300">• 25% (25,000,000 GXQ) — Protocol Liquidity & Universal Bridge Reserves</div>
                  <div className="text-gray-300">• 15% (15,000,000 GXQ) — Ecosystem Grants & Token Launchpad Developer Subsidies</div>
                  <div className="text-gray-300">• 10% (10,000,000 GXQ) — Core Cryptographic Engineering & Security Enclave Reserve</div>
                  <div className="text-gray-300">• 10% (10,000,000 GXQ) — Genesis Governance Multisig (Super Admin Enclave)</div>
                </div>
              </div>
            )}

            {/* SECTION 4: MULTICHAIN & USDC */}
            {activeSection === 'bridge' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    4. Universal Multichain Bridge & Any-Chain USDC Ingress
                  </h3>
                  <StatusBadge status="SECTION 4" size="sm" />
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  The GXQ Multichain Bridge eliminates centralized custodians by deploying trust-minimized light-client verifier smart contracts and zero-knowledge state proofs.
                </p>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Users can bridge native Circle USD Coin (USDC) seamlessly from <strong>Ethereum, Binance Smart Chain, Polygon, Arbitrum, and Solana</strong> directly into the GXQ Network. Bridged USDC is 1:1 backed and interoperable across all execution shards, SimpleSwap AMM pools, and launchpad contracts.
                </p>
              </div>
            )}

            {/* SECTION 5: DEX & LAUNCHPAD */}
            {activeSection === 'dex_launchpad' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    5. Decentralized SimpleSwap AMM & Fair Launchpad
                  </h3>
                  <StatusBadge status="SECTION 5" size="sm" />
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  The Token Launchpad empowers users and enterprise projects to generate custom ERC20 utility tokens on Shard 2. Every token requires a compulsory logo upload, registered creator authentication, and social linking (Twitter/X and Farcaster).
                </p>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Once verified, the automated decision engine indexes the new token directly into the DEX Swap Token List with small ticker badges, establishing instant liquidity pools against native GXQ and bridged USDC.
                </p>
              </div>
            )}

            {/* SECTION 6: SMART CONTRACT FRAMEWORK */}
            {activeSection === 'contracts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    6. Smart Contract Framework & Bytecode Auditing
                  </h3>
                  <StatusBadge status="SECTION 6" size="sm" />
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  GXQ Network delivers seamless EVM compatibility supporting Solidity 0.8.20+ with post-quantum calldata extensions. Developers can write standard contracts (using Hardhat or Foundry) and compile them directly into quantum-resistant bytecode.
                </p>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs space-y-1.5">
                  <div className="text-white font-bold">Standard Contract Framework:</div>
                  <div className="text-[#00A8FF]">packages/contracts/src/GXQToken.sol</div>
                  <div className="text-[#00A8FF]">packages/contracts/src/TokenFactory.sol</div>
                  <div className="text-[#00A8FF]">packages/contracts/src/SimpleSwap.sol</div>
                  <div className="text-[#00A8FF]">packages/contracts/src/GXQStaking.sol</div>
                  <div className="text-[#00A8FF]">packages/contracts/src/AccountRegistry.sol</div>
                </div>
              </div>
            )}

            {/* SECTION 7: ENTERPRISE EDITION */}
            {activeSection === 'enterprise' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    7. Exclusive Enterprise Edition & Institutional SLAs
                  </h3>
                  <StatusBadge status="ENTERPRISE EXCLUSIVE" size="sm" />
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Designed for sovereign corporations, financial institutions, and government infrastructure. Provides dedicated private execution subnets, hardware security module (HSM) key distribution, zero-knowledge compliance filters, and 99.999% uptime Service Level Agreements (SLAs).
                </p>
              </div>
            )}

            {/* SECTION 8: API SDK & CACHING */}
            {activeSection === 'api_cache' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    8. Developer API SDK & In-Memory Redis Caching
                  </h3>
                  <StatusBadge status="SECTION 8" size="sm" />
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  To achieve sub-millisecond query performance on explorer requests and high-frequency trading data, GXQ deploys an in-memory Redis 7 cache layer in front of the PostgreSQL 16 relational ledger repository.
                </p>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-mono text-xs space-y-2">
                  <div className="text-white font-bold">Cache Invalidation Policy:</div>
                  <div className="text-gray-300">• Read-Through Cache on `/stats`, `/block/:id`, and `/user/wallet` with 60s TTL.</div>
                  <div className="text-gray-300">• Automatic Write-Invalidation triggered immediately upon new block finalized events.</div>
                  <div className="text-gray-300">• 98.4% measured cache hit ratio with zero stale data delivery guarantee.</div>
                </div>
              </div>
            )}

            {/* SECTION 9: ROADMAP */}
            {activeSection === 'roadmap' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    9. 2026–2028 Technical Roadmap
                  </h3>
                  <StatusBadge status="ROADMAP" size="sm" />
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-[#00A8FF] font-bold">Q4 2026: Multi-Environment Hardening & DEX Launchpad</div>
                    <p className="text-gray-300">Deployment across Local, Devnet, and Public Testnet. Auto-indexing of launchpad tokens and universal USDC bridge ingress.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-[#10B981] font-bold">Q1–Q2 2027: Formal Audits & Mainnet Genesis Ceremony</div>
                    <p className="text-gray-300">Third-party mathematical verification of post-quantum lattice primitives and decentralized validator committee rollout.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-[#A855F7] font-bold">Q3–Q4 2027: Enterprise Subnets & Sovereign Rollups</div>
                    <p className="text-gray-300">Hardware Security Module integration, private compliance shards, and institutional treasury deployment.</p>
                  </div>
                </div>
              </div>
            )}

          </GlassCard>
        </div>

      </div>

    </div>
  );
};
