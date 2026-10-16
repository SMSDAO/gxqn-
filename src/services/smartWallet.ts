/**
 * GXQ Network V3.0.0 — Account Abstraction & Smart Wallet Subsystem
 * Featuring Role-Based Access Control (RBAC)
 * Roles: SUPER_ADMIN, AUDITOR, OPERATOR, VIEWER, USER
 */

export type AAProviderType = 'deterministic' | 'zerodev' | 'biconomy' | 'privy' | 'dynamic';
export type UserRole = 'SUPER_ADMIN' | 'AUDITOR' | 'OPERATOR' | 'VIEWER' | 'USER';

export interface RolePermissions {
  canToggleCircuitBreakers: boolean;
  canAssignRoles: boolean;
  canViewAuditLogs: boolean;
  canViewSystemHealth: boolean;
  canProvisionSmartWallets: boolean;
  canViewUsers: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  SUPER_ADMIN: {
    canToggleCircuitBreakers: true,
    canAssignRoles: true,
    canViewAuditLogs: true,
    canViewSystemHealth: true,
    canProvisionSmartWallets: true,
    canViewUsers: true,
  },
  AUDITOR: {
    canToggleCircuitBreakers: false,
    canAssignRoles: false,
    canViewAuditLogs: true,
    canViewSystemHealth: true,
    canProvisionSmartWallets: false,
    canViewUsers: true,
  },
  OPERATOR: {
    canToggleCircuitBreakers: false,
    canAssignRoles: false,
    canViewAuditLogs: false,
    canViewSystemHealth: true,
    canProvisionSmartWallets: true,
    canViewUsers: true,
  },
  VIEWER: {
    canToggleCircuitBreakers: false,
    canAssignRoles: false,
    canViewAuditLogs: false,
    canViewSystemHealth: true,
    canProvisionSmartWallets: false,
    canViewUsers: true,
  },
  USER: {
    canToggleCircuitBreakers: false,
    canAssignRoles: false,
    canViewAuditLogs: false,
    canViewSystemHealth: false,
    canProvisionSmartWallets: false,
    canViewUsers: false,
  },
};

export interface SmartWalletUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  smartWalletAddress: string;
  provider: AAProviderType;
  network: string;
  createdAt: string;
  lastLoginAt: string;
  role: UserRole;
  isHardwareGuarded?: boolean;
}

export interface ISmartWalletAdapter {
  providerName: AAProviderType;
  getOrCreateWallet(email: string, network: string): Promise<{ address: string; initCode?: string }>;
  signUserOp(userOpHash: string): Promise<string>;
  sendTransaction(tx: { to: string; value: string; data?: string }): Promise<string>;
}

// In-browser cryptographic deterministic derivation for local/dev fallback
export async function deriveDeterministicAddress(email: string, chainId: number = 31337): Promise<string> {
  const encoder = new TextEncoder();
  const salt = `gxq-v3-aa-salt-${chainId}`;
  const data = encoder.encode(`${email.trim().toLowerCase()}:${salt}`);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const addressBytes = hashArray.slice(12, 32);
  const hex = addressBytes.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hex}`;
}

export class DeterministicEmailAdapter implements ISmartWalletAdapter {
  providerName: AAProviderType = 'deterministic';

  async getOrCreateWallet(email: string, network: string): Promise<{ address: string }> {
    const chainId = network === 'mainnet' ? 9000 : network === 'testnet' ? 9001 : 9002;
    const address = await deriveDeterministicAddress(email, chainId);
    return { address };
  }

  async signUserOp(userOpHash: string): Promise<string> {
    return `0xsimulated_aa_signature_${userOpHash.slice(0, 10)}`;
  }

  async sendTransaction(): Promise<string> {
    const hash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;
    return hash;
  }
}

export class ZeroDevAdapter implements ISmartWalletAdapter {
  providerName: AAProviderType = 'zerodev';

  async getOrCreateWallet(email: string, network: string): Promise<{ address: string; initCode: string }> {
    const address = await deriveDeterministicAddress(`zd-${email}`, network === 'mainnet' ? 9000 : 9001);
    return {
      address,
      initCode: `0x5FbDB2315678afecb367f032d93F642f64180aa3_createAccount_${encodeURIComponent(email)}`
    };
  }

  async signUserOp(userOpHash: string): Promise<string> {
    return `0xzerodev_secp256r1_sig_${userOpHash.slice(0, 16)}`;
  }

  async sendTransaction(): Promise<string> {
    return `0xzd_${Date.now()}`;
  }
}

export class BiconomyAdapter implements ISmartWalletAdapter {
  providerName: AAProviderType = 'biconomy';

  async getOrCreateWallet(email: string, network: string): Promise<{ address: string }> {
    const address = await deriveDeterministicAddress(`bico-${email}`, network === 'mainnet' ? 9000 : 9001);
    return { address };
  }

  async signUserOp(userOpHash: string): Promise<string> {
    return `0xbiconomy_nexus_sig_${userOpHash.slice(0, 16)}`;
  }

  async sendTransaction(): Promise<string> {
    return `0xbico_${Date.now()}`;
  }
}

export function getSmartWalletAdapter(type: AAProviderType = 'deterministic'): ISmartWalletAdapter {
  switch (type) {
    case 'zerodev':
      return new ZeroDevAdapter();
    case 'biconomy':
      return new BiconomyAdapter();
    case 'deterministic':
    default:
      return new DeterministicEmailAdapter();
  }
}

const STORAGE_KEY = 'gxq_smart_wallets_v3';

export const SmartWalletRegistry = {
  getUsers(): SmartWalletUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return [
      {
        id: 'usr_admin_001',
        email: 'gxqstudio@gmail.com',
        name: 'GXQ Studio Lead Architect',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        smartWalletAddress: '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
        provider: 'deterministic',
        network: 'devnet',
        createdAt: '2026-10-01T00:00:00.000Z',
        lastLoginAt: new Date().toISOString(),
        role: 'SUPER_ADMIN',
        isHardwareGuarded: true,
      },
      {
        id: 'usr_auditor_002',
        email: 'auditor@certik.io',
        name: 'CertiK Lead Auditor',
        smartWalletAddress: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
        provider: 'zerodev',
        network: 'devnet',
        createdAt: '2026-10-06T10:00:00.000Z',
        lastLoginAt: '2026-10-15T02:30:00.000Z',
        role: 'AUDITOR',
      },
      {
        id: 'usr_op_003',
        email: 'ops@gxq.network',
        name: 'Sequencer Operations Lead',
        smartWalletAddress: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
        provider: 'biconomy',
        network: 'devnet',
        createdAt: '2026-10-08T12:00:00.000Z',
        lastLoginAt: '2026-10-15T04:15:00.000Z',
        role: 'OPERATOR',
      },
      {
        id: 'usr_view_004',
        email: 'analyst@ecosystem.fund',
        name: 'Ecosystem Portfolio Analyst',
        smartWalletAddress: '0x32A5c93F164F1A65dCd13b4E8f85f368C838A64b',
        provider: 'deterministic',
        network: 'testnet',
        createdAt: '2026-10-11T09:20:00.000Z',
        lastLoginAt: '2026-10-14T21:00:00.000Z',
        role: 'VIEWER',
      }
    ];
  },

  saveUsers(users: SmartWalletUser[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch {
      // storage quota or unavailable
    }
  },

  updateUserRole(email: string, newRole: UserRole, initiatorEmail: string): boolean {
    if (initiatorEmail.toLowerCase() !== 'gxqstudio@gmail.com') {
      throw new Error('Unauthorized: Only Super Admin gxqstudio@gmail.com can reassign roles.');
    }
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;

    // gxqstudio@gmail.com must always retain SUPER_ADMIN
    if (user.email.toLowerCase() === 'gxqstudio@gmail.com' && newRole !== 'SUPER_ADMIN') {
      throw new Error('Policy Violation: gxqstudio@gmail.com must retain Super Admin privileges.');
    }

    user.role = newRole;
    this.saveUsers(users);
    return true;
  },

  async authenticateWithGoogle(
    email: string, 
    name: string = '', 
    network: string = 'devnet',
    providerType: AAProviderType = 'deterministic',
    defaultRole: UserRole = 'USER'
  ): Promise<SmartWalletUser> {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      existing.lastLoginAt = new Date().toISOString();
      this.saveUsers(users);
      return existing;
    }

    const adapter = getSmartWalletAdapter(providerType);
    const { address } = await adapter.getOrCreateWallet(cleanEmail, network);

    const isSuperAdmin = cleanEmail === 'gxqstudio@gmail.com';
    const newUser: SmartWalletUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      smartWalletAddress: address,
      provider: providerType,
      network,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      role: isSuperAdmin ? 'SUPER_ADMIN' : defaultRole,
      isHardwareGuarded: isSuperAdmin,
    };

    users.unshift(newUser);
    this.saveUsers(users);
    return newUser;
  }
};
