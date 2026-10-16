import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { BookOpen, Terminal, CheckCircle2, AlertTriangle, Layers, ExternalLink, ShieldCheck } from 'lucide-react';

export const UserGuideModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'local' | 'testnet' | 'devnet' | 'mainnet' | 'missing'>('local');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#00A8FF]" />
            <span>GXQ NETWORK V3.0.0 ENGINEERING SPECIFICATIONS</span>
          </h2>
          <p className="text-xs text-gray-400">Multi-Environment Deployment Pipeline, Monorepo Architecture, and Mainnet Gap Analysis</p>
        </div>
        <StatusBadge status="PRODUCTION READY" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-white/10">
        {[
          { id: 'local', label: '1. Local Development' },
          { id: 'devnet', label: '2. Deploy to Devnet' },
          { id: 'testnet', label: '3. Deploy to Testnet' },
          { id: 'mainnet', label: '4. Preparing for Mainnet' },
          { id: 'missing', label: '5. What is Missing for Mainnet?' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-[#00A8FF]/20 border border-[#00A8FF] text-[#00A8FF] shadow-[0_0_12px_rgba(0,168,255,0.2)]'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panes */}
      {activeTab === 'local' && (
        <GlassCard level={2} className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00A8FF]" />
            <span>Local Development Quickstart</span>
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            The local environment leverages Docker Compose (PostgreSQL + Redis) and a local Hardhat node (Chain ID: 31337).
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># 1. Install all dependencies across monorepo</span>
              <div className="text-[#00A8FF] mt-1">pnpm install</div>
            </div>

            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># 2. Boot PostgreSQL (port 5432) and Redis (port 6379)</span>
              <div className="text-[#00A8FF] mt-1">docker compose -f infrastructure/docker-compose.yml up -d</div>
            </div>

            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># 3. Spin up Hardhat local blockchain node</span>
              <div className="text-[#00A8FF] mt-1">pnpm --filter @gxq/contracts node</div>
            </div>

            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># 4. Deploy all smart contracts to local network</span>
              <div className="text-[#00A8FF] mt-1">npx tsx scripts/deploy-all.ts --target=local</div>
            </div>

            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># 5. Launch full-stack developer server on port 3000</span>
              <div className="text-[#00A8FF] mt-1">pnpm dev</div>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'devnet' && (
        <GlassCard level={2} className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00A8FF]" />
            <span>Deploying to GXQ Devnet (Chain ID: 9002)</span>
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            GXQ Devnet is the high-velocity developer testbed rollup with rapid block finality (3.2s) and open faucet capabilities.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># 1. Set environment to Devnet</span>
              <div className="text-[#00A8FF] mt-1">cp .env.devnet .env</div>
            </div>

            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># 2. Deploy contracts and generate deployments/devnet.json</span>
              <div className="text-[#00A8FF] mt-1">npx tsx scripts/deploy-all.ts --target=devnet</div>
            </div>

            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># 3. Synchronize Explorer & Indexer database</span>
              <div className="text-[#00A8FF] mt-1">pnpm --filter @gxq/explorer-api migrate</div>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'testnet' && (
        <GlassCard level={2} className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#A855F7]" />
            <span>Deploying to GXQ Public Testnet (Chain ID: 9001)</span>
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            Public testnet mirrors production state with multi-validator consensus, decentralized sequencers, and Biconomy/ZeroDev Account Abstraction sponsorship.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># 1. Export testnet deployer key and point to testnet configuration</span>
              <div className="text-[#00A8FF] mt-1">export TESTNET_DEPLOYER_PRIVATE_KEY="0x..."</div>
              <div className="text-[#00A8FF]">npx tsx scripts/deploy-all.ts --target=testnet</div>
            </div>
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># 2. Verify bytecode on GXQScan</span>
              <div className="text-[#00A8FF] mt-1">npx hardhat verify --network testnet 0x71C67E7d25e0bCd9426f0f423A7a14E52445E814 100000000000000000000000000</div>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'mainnet' && (
        <GlassCard level={2} className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF7A00]" />
            <span>Preparing for Mainnet (Chain ID: 9000)</span>
          </h3>
          <div className="p-3.5 rounded-xl bg-[#FF7A00]/15 border border-[#FF7A00]/40 text-xs text-gray-200">
            <strong className="text-[#FF7A00]">SECURITY POLICY NOTICE:</strong> Mainnet deployment requires strict multi-sig hardware authorization, a verified audit certificate hash, and 48-hour timelock execution. Faucets are permanently disabled.
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-gray-300">
              <span className="text-gray-500"># Mainnet deploy invocation requires explicit audit confirmation flag:</span>
              <div className="text-[#FF7A00] mt-1">CONFIRM_MAINNET_AUDITED=true npx tsx scripts/deploy-all.ts --target=mainnet</div>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'missing' && (
        <GlassCard level={3} glow="orange" className="p-6 space-y-4 border-[#FF7A00]/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#FF7A00]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Honest Senior Engineer Assessment: What is Still Missing for Real Mainnet?
            </h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            While the codebase is now cleanly architected, multi-environment ready, and hardened with client-side & server-side access controls, launching real Mainnet with user funds requires closing the following mission-critical gaps:
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FF304F]/20 text-[#FF304F] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
              <div>
                <div className="font-bold text-white">Certified Third-Party Smart Contract Audits</div>
                <div className="text-gray-400 mt-1 leading-relaxed">
                  GXQToken, TokenFactory, SimpleSwap, and GXQStaking must be audited by at least two independent tier-1 security firms (e.g., OpenZeppelin, Trail of Bits, CertiK) to verify re-entrancy protection, integer overflow edge cases, and fee-on-transfer accounting.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FF304F]/20 text-[#FF304F] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
              <div>
                <div className="font-bold text-white">Multi-Signature Governance Timelock</div>
                <div className="text-gray-400 mt-1 leading-relaxed">
                  Single-owner keys (including gxqstudio@gmail.com) must be transitioned to a Safe (Gnosis Safe) multisig contract (e.g., 4-of-7 quorum) combined with a 48-hour timelock controller before contract ownership can be considered mainnet safe.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FF304F]/20 text-[#FF304F] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
              <div>
                <div className="font-bold text-white">Production High-Availability RPC & Indexer Clusters</div>
                <div className="text-gray-400 mt-1 leading-relaxed">
                  Replace local Docker Compose with managed AWS/GCP Kubernetes clusters running redundant PostgreSQL replicas with read-write splitting, Redis Sentinel / Cluster, and multiple geo-distributed archive RPC nodes with Cloudflare DDoS mitigation.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FF304F]/20 text-[#FF304F] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
              <div>
                <div className="font-bold text-white">L1 Canonical Bridge & Fraud/Validity Proof Sequencer</div>
                <div className="text-gray-400 mt-1 leading-relaxed">
                  Deploy real L1 state rollup contracts on Ethereum Mainnet with active fraud-proof dispute periods (Optimistic) or zero-knowledge STARK/SNARK verifier contracts (ZK-Rollup) before bridging real assets.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#FF304F]/20 text-[#FF304F] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">5</span>
              <div>
                <div className="font-bold text-white">Production Paymaster Gas Sponsorship Vault</div>
                <div className="text-gray-400 mt-1 leading-relaxed">
                  Real ERC-4337 Account Abstraction on mainnet requires funded Paymaster smart contracts with dynamic rate limiting and fraud scoring to prevent draining of sponsored gas reserves.
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

    </div>
  );
};
