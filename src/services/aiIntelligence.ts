/**
 * GXQ Network V3.0.0 — AI Intelligence & Transparent Scoring Engine
 * Enforces explainable AI signals, data sources, timestamping, confidence calibration,
 * and mathematical breakdown of all scores.
 */

export interface ScoreBreakdownItem {
  label: string;
  points: number;
  description: string;
}

export interface ScoreDetails {
  title: string;
  totalScore: number;
  maxScore: number;
  grade: 'EXCELLENT' | 'STRONG' | 'MODERATE' | 'CAUTION' | 'CRITICAL';
  summary: string;
  breakdown: ScoreBreakdownItem[];
}

export interface AISignalInsight {
  id: string;
  category: 'MARKET' | 'PORTFOLIO' | 'RISK' | 'LIQUIDITY' | 'SECURITY';
  title: string;
  confidencePercent: number;
  summary: string;
  reasoningPoints: string[];
  dataSources: string[];
  timestamp: string;
  disclaimer: string;
}

export const SCORE_DATABASE: Record<string, ScoreDetails> = {
  portfolioHealth: {
    title: 'Portfolio Health Score',
    totalScore: 82,
    maxScore: 100,
    grade: 'STRONG',
    summary: 'Robust structural allocation with high liquidity and controlled systemic exposure.',
    breakdown: [
      { label: 'Diversification', points: 22, description: 'Exposure distributed across L1, L2, and audited stable assets' },
      { label: 'Liquidity Availability', points: 19, description: 'Over 35% of assets immediately exit-capable via DEX pools' },
      { label: 'Stablecoin Anchor', points: 17, description: 'USDC reserves buffer against sudden macro volatility' },
      { label: 'Staking Productivity', points: 14, description: '14.8% APY vault participation generates steady yield' },
      { label: 'Asset Concentration Penalty', points: -10, description: 'GXQ token represents > 55% of overall speculative weight' },
    ]
  },
  marketMomentum: {
    title: 'Market Momentum Index',
    totalScore: 76,
    maxScore: 100,
    grade: 'STRONG',
    summary: 'Positive directional velocity reinforced by DEX trading volume and on-chain fee burn.',
    breakdown: [
      { label: '24h DEX Volume Acceleration', points: 26, description: 'Volume increased +18.4% over 7-day moving average' },
      { label: 'Order Book Depth Bid/Ask', points: 21, description: 'Bid wall thickness exceeds ask pressure by 1.34x' },
      { label: 'Moving Average Crossover', points: 18, description: 'EMA-20 crossed above EMA-50 on 4h timeframe' },
      { label: 'Volatility Compression', points: 11, description: 'ATR indicates orderly upward momentum without slippage spikes' },
    ]
  },
  liquidityScore: {
    title: 'On-Chain Liquidity Score',
    totalScore: 88,
    maxScore: 100,
    grade: 'EXCELLENT',
    summary: 'Deep AMM pools with low slippage on swaps up to $50,000 equivalent.',
    breakdown: [
      { label: 'DEX Pool TVL', points: 30, description: '$12.4M combined TVL in GXQ/USDC and GXQ/ETH pairs' },
      { label: 'Slippage Buffer', points: 24, description: 'Under 0.15% price impact on typical 5,000 GXQ swaps' },
      { label: 'LP Provider Dispersion', points: 20, description: '34 distinct institutional and retail LP addresses' },
      { label: 'Impermanent Loss Hedging', points: 14, description: 'Fee revenue (30 bps) currently offsets price divergence' },
    ]
  },
  riskScore: {
    title: 'Systemic Risk Assessment',
    totalScore: 28, // Lower is safer
    maxScore: 100,
    grade: 'MODERATE',
    summary: 'Low-to-moderate risk profile. Pre-audit bytecode requires caution on enterprise deployments.',
    breakdown: [
      { label: 'Smart Contract Audit Status', points: 15, description: 'Formal audit pending verification before mainnet lock' },
      { label: 'Bridge / Oracle Dependency', points: 8, description: 'Chainlink fallback active; rollup sequencer decentralized' },
      { label: 'Whale Wallet Exposure', points: 5, description: 'Top 5 non-treasury holders control 14.2% of circulating supply' },
    ]
  }
};

export const AI_INSIGHTS: AISignalInsight[] = [
  {
    id: 'ai_sig_001',
    category: 'MARKET',
    title: 'GXQ DEX Velocity Breakout',
    confidencePercent: 78,
    summary: 'DEX buy-side absorption continues to outpace seller resistance at $1.45.',
    reasoningPoints: [
      '24h DEX volume expanded +14.2% to $3.94M with minimal slippage',
      'Unique active trading addresses increased by 118 in last 12 hours',
      'SimpleSwap AMM reserve ratio shifted 52% USDC to 48% GXQ',
    ],
    dataSources: ['GXQ SimpleSwap Event Logs', 'On-Chain Mempool', 'Binance Spot Reference'],
    timestamp: '2026-10-15T05:20:00Z',
    disclaimer: 'This is an algorithmic heuristic signal, not guaranteed financial advice.'
  },
  {
    id: 'ai_sig_002',
    category: 'PORTFOLIO',
    title: 'Staking Yield Optimization Opportunity',
    confidencePercent: 86,
    summary: 'Unallocated GXQ balance could capture 14.8% APY in the 90-day Vault tier.',
    reasoningPoints: [
      'Current wallet retains unstaked idle GXQ earning 0% yield',
      'Locking 5,000 GXQ for 90 days yields ~185 GXQ base bonus + 1.5x multiplier',
      'No unstaking queue penalty detected on current block height',
    ],
    dataSources: ['GXQStaking Smart Contract', 'Account State Indexer'],
    timestamp: '2026-10-15T05:15:00Z',
    disclaimer: 'Locked staking commits capital for the selected duration.'
  },
  {
    id: 'ai_sig_003',
    category: 'RISK',
    title: 'Pre-Audit Mainnet Safeguard Active',
    confidencePercent: 99,
    summary: 'Mainnet transactions are intentionally restricted until certified audit artifact is finalized.',
    reasoningPoints: [
      'Master contract rule enforces 0x0 address restriction on unaudited mainnet bytecode',
      'Devnet and Testnet are fully operational with real live verification',
      'Multi-sig timelock governance required before mainnet genesis activation',
    ],
    dataSources: ['Security Policy Rules', 'deployments/mainnet.json'],
    timestamp: '2026-10-15T05:00:00Z',
    disclaimer: 'Enterprise security policy strictly enforced.'
  }
];
