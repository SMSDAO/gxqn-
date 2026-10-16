/**
 * GXQ Network V3.0.0 — Real-Time WebSocket Streaming Subsystem
 * Channels:
 * - 'blocks': Live stream of mined blocks on current chain
 * - 'transactions': Live stream of confirmed transactions
 * - 'portfolio': Real-time balance and PnL updates
 * - 'volatility': Price volatility events that trigger AI heuristic alerts
 */

import { explorerApi, ExplorerBlock, ExplorerTransaction } from './explorerApi.ts';

export type WSChannel = 'blocks' | 'transactions' | 'portfolio' | 'volatility';

export interface WSMessage {
  channel: WSChannel;
  event: string;
  data: any;
  timestamp: string;
}

class GXQWebSocketClient {
  private listeners = new Map<WSChannel, ((data: any) => void)[]>();
  private isConnected = false;
  private heartbeatInterval: any = null;
  private mockTickerInterval: any = null;

  connect() {
    if (this.isConnected) return;
    this.isConnected = true;

    // Connect to explorerApi block producer
    explorerApi.subscribeBlocks((block: ExplorerBlock) => {
      this.dispatch('blocks', {
        event: 'NEW_BLOCK',
        block,
      });

      // Also trigger portfolio micro-yield simulation every 2 blocks
      if (block.id % 2 === 0) {
        this.dispatch('portfolio', {
          event: 'YIELD_ACCRUED',
          rewardGxq: 0.0032,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Connect to explorerApi transaction producer
    explorerApi.subscribeTransactions((tx: ExplorerTransaction) => {
      this.dispatch('transactions', {
        event: 'NEW_TRANSACTION',
        transaction: tx,
      });
    });

    // Synthetic volatility scanner for AI heuristic alerts
    this.mockTickerInterval = setInterval(() => {
      const volatilityJitter = (Math.random() - 0.5) * 1.8;
      if (Math.abs(volatilityJitter) > 0.8) {
        this.dispatch('volatility', {
          event: 'VOLATILITY_THRESHOLD_CROSSED',
          symbol: 'GXQ/USD',
          deltaPercent: Number(volatilityJitter.toFixed(2)),
          timestamp: new Date().toISOString(),
          message: `GXQ price momentum surged ${volatilityJitter > 0 ? '+' : ''}${volatilityJitter.toFixed(2)}% in 30s. AI Heuristic alert triggered.`,
        });
      }
    }, 12000);
  }

  disconnect() {
    this.isConnected = false;
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.mockTickerInterval) clearInterval(this.mockTickerInterval);
  }

  subscribe(channel: WSChannel, callback: (data: any) => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel)!.push(callback);

    return () => {
      const list = this.listeners.get(channel) || [];
      this.listeners.set(channel, list.filter(cb => cb !== callback));
    };
  }

  private dispatch(channel: WSChannel, payload: any) {
    const list = this.listeners.get(channel) || [];
    list.forEach(cb => cb(payload));
  }

  getStatus() {
    return {
      connected: this.isConnected,
      activeSubscriptions: Array.from(this.listeners.keys()),
    };
  }
}

export const wsService = new GXQWebSocketClient();
