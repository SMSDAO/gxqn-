import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Cpu, 
  Layers, 
  Database, 
  Server, 
  Radio, 
  ArrowLeftRight, 
  Rocket, 
  ShieldCheck, 
  ShieldAlert, 
  Compass, 
  Share2, 
  Key, 
  Zap, 
  CheckCircle2, 
  Info,
  ExternalLink,
  ChevronRight,
  Code2,
  HardDriveDownload,
  Pickaxe
} from 'lucide-react';

interface NodeDetail {
  id: string;
  name: string;
  category: 'CONSENSUS' | 'MINING' | 'APPLICATION' | 'BRIDGE' | 'DATA' | 'CONTROL';
  description: string;
  specs: { [key: string]: string };
  connections: string[];
}

export const ArchitectureDiagramModule: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('beacon_shard');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [animationActive, setAnimationActive] = useState<boolean>(true);

  const nodes: NodeDetail[] = [
    {
      id: 'beacon_shard',
      name: 'Beacon Shard (Shard 0) — Quantum Consensus Core',
      category: 'CONSENSUS',
      description: 'The primary coordination beacon governing BFT-QPoS consensus, rotating validator committees, post-quantum SPHINCS+ & Dilithium signature aggregation, and cross-shard Merkle receipt trees.',
      specs: {
        'Consensus': 'BFT Quantum-Resistant PoS (BFT-QPoS)',
        'Signature Lattice': 'SPHINCS+ / Dilithium-3 + ECDSA Hybrid',
        'Deterministic Finality': '3.2 seconds single-slot',
        'State Aggregation': 'Merkle-Patricia Cross-Shard Receipts',
        'Entropy Source': 'QRNG (Quantum Random Number Generator)',
      },
      connections: ['mining_nodes', 'shard_1_dex', 'shard_2_launchpad', 'relayer_network', 'db_cache'],
    },
    {
      id: 'mining_nodes',
      name: 'Quantum Mining & Validator Nodes (Hybrid PoS-QPoW)',
      category: 'MINING',
      description: 'Decentralized network of validator sequencers and hybrid quantum-proof miners providing cryptographic entropy, transaction batch ordering, and zero-knowledge validity proof generation.',
      specs: {
        'Node Count': '1,024 Active Distributed Validators',
        'Mining Mechanism': 'Quantum-Entropy Proof of Execution (QPoW)',
        'Hardware Support': 'FPGA / ASIC / Secure Enclave HSM',
        'Minimum Bond': '32,000 GXQ staked',
        'Slashing Penalty': '100% principal burn on double-sign',
      },
      connections: ['beacon_shard', 'smart_contract_engine'],
    },
    {
      id: 'shard_1_dex',
      name: 'Execution Shard 1 (SimpleSwap AMM & Staking Vault)',
      category: 'APPLICATION',
      description: 'High-speed dedicated execution shard hosting SimpleSwap automated market maker liquidity pools (GXQ, bridged USDC, community launchpad tokens) and dynamic yield staking tiers.',
      specs: {
        'Smart Contracts': 'SimpleSwap.sol, GXQStaking.sol',
        'Throughput': '4,500+ TPS dedicated capacity',
        'AMM Invariant': 'Constant Product formula (x * y = k)',
        'LP Fee': '30 basis points (0.30%) with automated burn',
        'State Access': 'Parallel sub-mempool with zero cross-chatter',
      },
      connections: ['beacon_shard', 'explorer_indexer', 'db_cache', 'shard_2_launchpad'],
    },
    {
      id: 'shard_2_launchpad',
      name: 'Execution Shard 2 (Token Launchpad & Indexer Gateway)',
      category: 'APPLICATION',
      description: 'Specialized execution shard hosting the TokenFactory contract. Enforces mandatory logo upload, Twitter (X) & Farcaster verification, and automatically indexes all approved tokens into Shard 1 DEX.',
      specs: {
        'Smart Contracts': 'TokenFactory.sol, GXQToken.sol',
        'Creation Fee': '100 GXQ (100% burned upon deployment)',
        'Verification Engine': 'Autonomous Social Graph & Bytecode Auditing',
        'DEX Auto-Indexing': 'Sub-second RPC broadcast to SimpleSwap pool list',
        'Governance Circuit': 'Isolated Emergency Pause flag control',
      },
      connections: ['beacon_shard', 'shard_1_dex', 'relayer_network'],
    },
    {
      id: 'smart_contract_engine',
      name: 'Smart Contract Deployment & Bytecode Audit System',
      category: 'APPLICATION',
      description: 'Compiler pipeline supporting Solidity (0.8.20+) and quantum-resistant instruction set architecture. Features automated static bytecode analysis, formal verification, and gas estimation.',
      specs: {
        'EVM Compatibility': 'Full opcode equivalence with Cancun/Prague',
        'Formal Verification': 'SMT solver-based invariant checker',
        'Deployment Cost': '~0.000428 GXQ per contract',
        'Quantum Bytecode Tag': 'Post-Quantum Calldata Wrapping',
      },
      connections: ['beacon_shard', 'mining_nodes', 'api_sdk'],
    },
    {
      id: 'relayer_network',
      name: 'Multichain Bridge & Universal USDC Ingress',
      category: 'BRIDGE',
      description: 'Trust-minimized relayer network enabling universal cross-chain bridging of native USDC, ETH, and WBTC from Ethereum, Arbitrum, BSC, Polygon, and Solana with zk-SNARK state inclusion proofs.',
      specs: {
        'Supported Blockchains': 'Ethereum, Arbitrum, Polygon, BSC, Solana',
        'USDC Protocol': '1:1 Lock/Unlock & ZK Light-Client Proofs',
        'Finality Latency': '12 confirmations (~2.5 minutes L1 to GXQ)',
        'Cross-Shard Routing': 'CSM (Cross-Shard Messaging) receipt trees',
        'Reserve Collateral': 'Institutional custody + on-chain solvency proof',
      },
      connections: ['beacon_shard', 'shard_1_dex', 'shard_2_launchpad', 'explorer_indexer'],
    },
    {
      id: 'api_sdk',
      name: 'Developer API & TypeScript SDK Layer',
      category: 'DATA',
      description: 'Comprehensive developer gateway offering unified RPC endpoints, ethers.js/viem wallet wrappers, transaction submission, contract deployment helpers, and automated cache synchronization.',
      specs: {
        'NPM Package': '@gxq/sdk (TypeScript / Node / Browser)',
        'RPC Protocols': 'JSON-RPC 2.0 over HTTPS & WebSockets',
        'Gas Optimization': 'Automatic EIP-1559 base/priority fee estimation',
        'Authentication': 'Client-side Bearer JWT & API Key access',
      },
      connections: ['db_cache', 'explorer_indexer', 'smart_contract_engine'],
    },
    {
      id: 'db_cache',
      name: 'PostgreSQL 16 Persistence & Redis 7 Cache Cluster',
      category: 'DATA',
      description: 'High-availability data architecture combining PostgreSQL 16 as the canonical source-of-truth with Redis 7 in-memory cache for sub-millisecond explorer queries and zero-lag telemetry.',
      specs: {
        'Database Engine': 'PostgreSQL 16 (Connection Pool 24/50)',
        'Cache Engine': 'Redis 7 with AOF persistence',
        'Cache Hit Ratio': '98.4% average across /stats and /block',
        'TTL Policy': '60s block cache with write auto-invalidation',
      },
      connections: ['explorer_indexer', 'admin_dashboard', 'api_sdk'],
    },
    {
      id: 'explorer_indexer',
      name: 'User-Facing Block Explorer & Real-Time WebSockets',
      category: 'DATA',
      description: 'Real-time blockchain explorer, block & transaction inspector, address balance profiler, and WebSocket event broadcaster for live portfolio balances and AI volatility triggers.',
      specs: {
        'Core Endpoints': '/stats, /block/:id, /tx/:hash, /address/:address, /user/wallet',
        'WebSocket Streams': 'Channels: blocks, transactions, portfolio, volatility',
        'Broadcast Latency': '< 35ms push delay to connected web/mobile clients',
        'Search Indexing': 'Height, Tx Hash, Address, Token Name, Symbol',
      },
      connections: ['db_cache', 'admin_dashboard', 'relayer_network'],
    },
    {
      id: 'admin_dashboard',
      name: 'Control Plane Admin Dashboard Enclave',
      category: 'CONTROL',
      description: 'Hardened governance and control plane isolated strictly to Super Admin gxqstudio@gmail.com. Provides remote pause/unpause toggles, user management, and real-time infrastructure monitors.',
      specs: {
        'Access Control': 'RBAC (Super Admin: gxqstudio@gmail.com, Auditor, Support)',
        'Emergency Controls': 'Launchpad Circuit Breaker, DEX Emergency Pause',
        'Health Monitoring': 'PostgreSQL status, Redis latency, RPC health check',
        'Telemetry Scrubber': 'Zero-leak scrubbing of private keys and session tokens',
      },
      connections: ['beacon_shard', 'db_cache', 'shard_2_launchpad'],
    },
  ];

  const activeNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];
  const filteredNodes = filterCategory === 'ALL' ? nodes : nodes.filter(n => n.category === filterCategory);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#00A8FF]" />
            <span>GXQ NETWORK COMPLETE ARCHITECTURE MATRIX</span>
          </h2>
          <p className="text-xs text-gray-400">
            Quantum blockchain core, mining nodes, state sharding, universal USDC bridge, API SDK, and PostgreSQL/Redis cache
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
          {['ALL', 'CONSENSUS', 'MINING', 'APPLICATION', 'BRIDGE', 'DATA', 'CONTROL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                filterCategory === cat ? 'bg-[#00A8FF] text-black shadow-[0_0_10px_rgba(0,168,255,0.4)]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Architectural Canvas */}
      <GlassCard level={3} glow="blue" className="p-6 relative overflow-hidden">
        
        {/* Top Status Bar */}
        <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-400 mb-6 pb-3 border-b border-white/10">
          <span className="uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00A8FF]" />
            <span>Interactive Node Topology (Click any component to inspect)</span>
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAnimationActive(!animationActive)}
              className="text-[11px] text-[#00A8FF] hover:underline"
            >
              {animationActive ? 'Pause Signals' : 'Resume Signals'}
            </button>
            <span className="text-[#10B981] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full bg-[#10B981] ${animationActive ? 'animate-ping' : ''}`} />
              Live Mesh Active
            </span>
          </div>
        </div>

        {/* 1. TOP TIER: CONTROL PLANE & USER ACCESS */}
        <div className="space-y-2 mb-6">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
            Layer 1: Governance, User Access & Data Services
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* Control Plane Admin */}
            <div
              onClick={() => setSelectedNodeId('admin_dashboard')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedNodeId === 'admin_dashboard'
                  ? 'bg-[#FF7A00]/20 border-[#FF7A00] shadow-[0_0_20px_rgba(255,122,0,0.4)]'
                  : 'bg-[#070B12] border-white/10 hover:border-[#FF7A00]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FF7A00]" /> Control Plane
                </span>
                <StatusBadge status="ADMIN" size="sm" />
              </div>
              <p className="text-[10px] text-gray-400">Circuit breakers & RBAC (gxqstudio@gmail.com)</p>
            </div>

            {/* Block Explorer */}
            <div
              onClick={() => setSelectedNodeId('explorer_indexer')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedNodeId === 'explorer_indexer'
                  ? 'bg-[#00A8FF]/20 border-[#00A8FF] shadow-[0_0_20px_rgba(0,168,255,0.4)]'
                  : 'bg-[#070B12] border-white/10 hover:border-[#00A8FF]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white font-mono flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#00A8FF]" /> Explorer & WS
                </span>
                <StatusBadge status="STREAMING" size="sm" />
              </div>
              <p className="text-[10px] text-gray-400">Live blocks, transactions & volatility</p>
            </div>

            {/* API SDK Layer */}
            <div
              onClick={() => setSelectedNodeId('api_sdk')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedNodeId === 'api_sdk'
                  ? 'bg-[#A855F7]/20 border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                  : 'bg-[#070B12] border-white/10 hover:border-[#A855F7]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white font-mono flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[#A855F7]" /> API & SDK
                </span>
                <StatusBadge status="@gxq/sdk" size="sm" />
              </div>
              <p className="text-[10px] text-gray-400">TypeScript client & JSON-RPC gateway</p>
            </div>

            {/* DB & Redis Cache */}
            <div
              onClick={() => setSelectedNodeId('db_cache')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedNodeId === 'db_cache'
                  ? 'bg-[#10B981]/20 border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'bg-[#070B12] border-white/10 hover:border-[#10B981]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white font-mono flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#10B981]" /> DB & Redis Cache
                </span>
                <StatusBadge status="98.4% HIT" size="sm" />
              </div>
              <p className="text-[10px] text-gray-400">Postgres 16 + Redis 7 caching</p>
            </div>
          </div>
        </div>

        {/* 2. CENTER TIER: QUANTUM BEACON CORE & MINING NODES */}
        <div className="space-y-2 mb-6">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
            Layer 2: Quantum Consensus Core & Mining Infrastructure
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Mining & Validator Nodes */}
            <div
              onClick={() => setSelectedNodeId('mining_nodes')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedNodeId === 'mining_nodes'
                  ? 'bg-[#FFD400]/20 border-[#FFD400] shadow-[0_0_20px_rgba(255,212,0,0.4)]'
                  : 'bg-[#070B12] border-white/10 hover:border-[#FFD400]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white font-mono flex items-center gap-1.5">
                  <Pickaxe className="w-3.5 h-3.5 text-[#FFD400]" /> Mining Nodes
                </span>
                <StatusBadge status="1,024 NODES" size="sm" />
              </div>
              <p className="text-[11px] text-gray-400">Hybrid PoS-QPoW quantum entropy miners & sequencer committees</p>
            </div>

            {/* Central Beacon Shard */}
            <div
              onClick={() => setSelectedNodeId('beacon_shard')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer md:col-span-2 relative ${
                selectedNodeId === 'beacon_shard'
                  ? 'bg-gradient-to-r from-[#00A8FF]/25 via-[#7928CA]/30 to-[#FF7A00]/25 border-[#00A8FF] shadow-[0_0_25px_rgba(0,168,255,0.5)]'
                  : 'bg-gradient-to-r from-[#00A8FF]/10 via-[#7928CA]/15 to-[#FF7A00]/10 border-[#00A8FF]/40 hover:border-[#00A8FF]'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-black text-white font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#00A8FF] animate-bounce" /> 
                  BEACON SHARD (SHARD 0) — BFT-QPOS CONSENSUS
                </span>
                <StatusBadge status="CONSENSUS CORE" size="sm" />
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Aggregates state roots via Merkle-Patricia receipts, coordinates post-quantum Dilithium signatures, and enforces cross-shard atomicity.
              </p>
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mt-2 pt-2 border-t border-white/10">
                <span>⇄ Cross-Shard Messaging (CSM)</span>
                <span>⇄ SPHINCS+ Validator Quorum</span>
                <span>⇄ Single-Slot Finality (3.2s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM TIER: APPLICATION SHARDS, LAUNCHPAD & MULTICHAIN BRIDGE */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
            Layer 3: Parallel Execution Shards, DEX AMM, Launchpad & Multichain Ingress
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* Shard 1 DEX */}
            <div
              onClick={() => setSelectedNodeId('shard_1_dex')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedNodeId === 'shard_1_dex'
                  ? 'bg-[#00A8FF]/20 border-[#00A8FF] shadow-[0_0_20px_rgba(0,168,255,0.4)]'
                  : 'bg-[#070B12] border-white/10 hover:border-[#00A8FF]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white font-mono flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#00A8FF]" /> Shard 1: DEX AMM
                </span>
                <StatusBadge status="4,500 TPS" size="sm" />
              </div>
              <p className="text-[10px] text-gray-400">SimpleSwap constant product pools & staking vault</p>
            </div>

            {/* Shard 2 Launchpad */}
            <div
              onClick={() => setSelectedNodeId('shard_2_launchpad')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedNodeId === 'shard_2_launchpad'
                  ? 'bg-[#FF7A00]/20 border-[#FF7A00] shadow-[0_0_20px_rgba(255,122,0,0.4)]'
                  : 'bg-[#070B12] border-white/10 hover:border-[#FF7A00]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white font-mono flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-[#FF7A00]" /> Shard 2: Launchpad
                </span>
                <StatusBadge status="AUTO-INDEXED" size="sm" />
              </div>
              <p className="text-[10px] text-gray-400">TokenFactory with logo upload & auto DEX listing</p>
            </div>

            {/* Smart Contract Engine */}
            <div
              onClick={() => setSelectedNodeId('smart_contract_engine')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedNodeId === 'smart_contract_engine'
                  ? 'bg-[#10B981]/20 border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'bg-[#070B12] border-white/10 hover:border-[#10B981]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white font-mono flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#10B981]" /> Contract Deployer
                </span>
                <StatusBadge status="SMT AUDITED" size="sm" />
              </div>
              <p className="text-[10px] text-gray-400">Solidity 0.8.20+ with quantum bytecode verification</p>
            </div>

            {/* Multichain USDC Bridge */}
            <div
              onClick={() => setSelectedNodeId('relayer_network')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedNodeId === 'relayer_network'
                  ? 'bg-[#A855F7]/20 border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                  : 'bg-[#070B12] border-white/10 hover:border-[#A855F7]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white font-mono flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#A855F7]" /> USDC Universal Bridge
                </span>
                <StatusBadge status="5 CHAINS" size="sm" />
              </div>
              <p className="text-[10px] text-gray-400">Ethereum, BSC, Polygon, Solana, Arbitrum</p>
            </div>

          </div>
        </div>
      </GlassCard>

      {/* Selected Node Technical Inspector */}
      {activeNode && (
        <GlassCard level={2} className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#00A8FF]/20 border border-[#00A8FF]/40 flex items-center justify-center text-[#00A8FF]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">{activeNode.name}</h3>
                <span className="text-[11px] font-mono text-[#00A8FF]">Subsystem Category: {activeNode.category}</span>
              </div>
            </div>
            <StatusBadge status={activeNode.category} size="sm" />
          </div>

          <p className="text-xs text-gray-300 leading-relaxed mb-4">
            {activeNode.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs mb-4">
            {Object.entries(activeNode.specs).map(([label, val]) => (
              <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-500 block uppercase font-bold">{label}</span>
                <span className="text-gray-200 font-bold mt-1 block leading-snug">{val}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-gray-400">
            <div>
              Connected Architecture Nodes: <strong className="text-white">{activeNode.connections.join('  •  ')}</strong>
            </div>
            <span className="text-[#10B981] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Decentralized & Cryptographically Verified</span>
            </span>
          </div>
        </GlassCard>
      )}

    </div>
  );
};
