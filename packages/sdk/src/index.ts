/**
 * @gxq/sdk
 * Official TypeScript SDK for GXQ Network V3.0.0
 * Unified interface for Smart Accounts, AMM Swaps, Staking, and Explorer
 */

import { ENVIRONMENTS, GXQEnvironment, EnvironmentConfig } from '../../config/src/index';

export class GXQClient {
  public config: EnvironmentConfig;
  public environment: GXQEnvironment;

  constructor(env: GXQEnvironment = 'devnet') {
    this.environment = env;
    this.config = ENVIRONMENTS[env];
  }

  setEnvironment(env: GXQEnvironment) {
    this.environment = env;
    this.config = ENVIRONMENTS[env];
  }

  getContracts() {
    return this.config.contracts;
  }

  getRpcUrl(): string {
    return this.config.rpcUrl;
  }

  getChainId(): number {
    return this.config.chainId;
  }

  isMainnetReady(): boolean {
    return this.environment !== 'mainnet' || this.config.contracts.gxqToken !== '0x0000000000000000000000000000000000000000';
  }
}

export const createGXQClient = (env: GXQEnvironment = 'devnet') => new GXQClient(env);
