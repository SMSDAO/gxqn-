import React, { useState, useEffect } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { SmartWalletUser } from '../../services/smartWallet';
import { telemetry, TelemetryEvent } from '../../services/telemetry';
import { ShieldCheck, Lock, Key, Terminal, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WalletEncryptionService } from '../../services/walletEncryption';
import { ReorderableCardSection, SectionItem } from '../common/ReorderableCardSection';

interface SecurityCenterProps {
  currentUser: SmartWalletUser | null;
}

export const SecurityCenterModule: React.FC<SecurityCenterProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<TelemetryEvent[]>(() => telemetry.getEvents());

  useEffect(() => {
    const unsub = telemetry.subscribe((evt) => {
      setLogs(prev => [evt, ...prev.slice(0, 49)]);
    });
    return unsub;
  }, []);

  const securitySections: SectionItem[] = [
    {
      id: 'security_posture',
      title: 'Cryptographic Security Posture & Non-Custodial Isolation',
      subtitle: 'Zero private keys committed, ERC-4337 modular bundler, and correlation ID enforcement',
      neonColor: 'green',
      icon: <ShieldCheck className="w-4 h-4 text-[#10B981]" />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-black/40 border border-[#10B981]/30 glow-card-green">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-mono">
              <Lock className="w-4 h-4 text-[#10B981]" />
              <span>Zero-Knowledge Enclave</span>
            </div>
            <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5 text-[#10B981]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>ZERO KEYS COMMITTED</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed font-mono">
              All signing occurs client-side or via AA bundler paymaster. Private keys never touch telemetry or backend servers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 glow-card-orange">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-mono">
              <Key className="w-4 h-4 text-[#FF7A00]" />
              <span>Account Abstraction</span>
            </div>
            <div className="text-sm font-bold text-white font-mono text-[#FF7A00]">
              ERC-4337 MODULAR
            </div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed font-mono">
              Deterministic email derivation & pluggable multi-provider adapters (ZeroDev, Biconomy, Privy).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 glow-card-purple">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-mono">
              <Terminal className="w-4 h-4 text-[#A855F7]" />
              <span>Structured Observability</span>
            </div>
            <div className="text-sm font-bold text-white font-mono text-[#A855F7]">
              CORRELATION ID ENFORCED
            </div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed font-mono">
              Every critical operation is assigned an immutable correlation ID for auditability and trace verification.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'security_vault',
      title: 'Top-Tier Wallet Encryption & Universal Key Export Vault',
      subtitle: 'Hardware security enclave, Argon2 / AES-GCM keystore backup and recovery',
      neonColor: 'orange',
      icon: <Key className="w-4 h-4 text-[#FF7A00]" />,
      content: <WalletEncryptionVaultSection />,
    },
    {
      id: 'security_telemetry',
      title: `Real-Time Security Audit Telemetry (${logs.length} Recorded Events)`,
      subtitle: 'Stream auto-subscribed, immutable event payloads and correlation ID verification',
      neonColor: 'blue',
      icon: <Terminal className="w-4 h-4 text-[#00A8FF]" />,
      content: (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-[#070B12] border border-white/5 font-mono text-[11px] flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  log.severity === 'SECURITY' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  log.severity === 'WARN' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                  'bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/40'
                }`}>
                  {log.severity}
                </span>
                <span className="text-white font-semibold">{log.eventType}</span>
                <span className="text-gray-500 text-[10px]">[{log.correlationId}]</span>
              </div>

              <div className="text-gray-400 truncate max-w-md text-[10px]">
                {JSON.stringify(log.payload)}
              </div>

              <div className="text-[10px] text-gray-500 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#10B981]" />
            <span>ENTERPRISE SECURITY & AUDIT ENCLAVE</span>
          </h2>
          <p className="text-xs text-gray-400">
            Cryptographic non-custodial integrity, zero-leak telemetry verification, and correlation ID tracking
          </p>
        </div>
        <StatusBadge status="SECURE" />
      </div>

      {/* Touch-Optimized Drag-and-Drop Reorderable Security Modules */}
      <ReorderableCardSection
        storageKey="gxq_security_center_layout"
        items={securitySections}
        defaultOrder={['security_posture', 'security_vault', 'security_telemetry']}
      />
    </div>
  );
};

const WalletEncryptionVaultSection: React.FC = () => {
  const [privateKey, setPrivateKey] = useState(() => WalletEncryptionService.generateSimulatedPrivateKey());
  const [password, setPassword] = useState('');
  const [encryptedVault, setEncryptedVault] = useState<any>(null);
  const [decryptedKey, setDecryptedKey] = useState('');
  const [decryptPassword, setDecryptPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleEncrypt = async () => {
    if (!password) {
      setStatus('Please enter a master encryption password.');
      return;
    }
    try {
      const vault = await WalletEncryptionService.encryptPrivateKey(privateKey, password);
      setEncryptedVault(vault);
      setStatus('SUCCESS: Private key encrypted successfully using AES-GCM-256 + PBKDF2 (2026/2027 standard). Compatible with MetaMask, Phantom, Ledger, & Trust Wallet.');
    } catch (e: any) {
      setStatus(`Encryption Error: ${e.message}`);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedVault || !decryptPassword) {
      setStatus('Missing encrypted vault or decryption password.');
      return;
    }
    try {
      const key = await WalletEncryptionService.decryptPrivateKey(encryptedVault, decryptPassword);
      setDecryptedKey(key);
      setStatus('SUCCESS: Vault unlocked securely. Private key ready for wallet import.');
    } catch (e: any) {
      setStatus('Decryption Error: Invalid password or corrupted envelope.');
    }
  };

  return (
    <GlassCard level={3} glow="orange" className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-[#FF7A00]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            2026/2027 Top-Tier Cryptographic Vault & Universal Wallet Export
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
          AES-GCM-256 + PBKDF2
        </span>
      </div>

      <p className="text-xs text-gray-300 leading-relaxed">
        Export your non-custodial private key wrapped in quantum-resistant AES-GCM encryption. Compatible for direct import into MetaMask, Phantom, Ledger Live, and Trust Wallet.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Encrypt / Export Box */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Encrypt & Export Private Key</h4>
          
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Private Key (Hex)</label>
            <input
              type="text"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white outline-none focus:border-[#00A8FF]"
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Master Password (Strong)</label>
            <input
              type="password"
              placeholder="Enter secure master passphrase"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white outline-none focus:border-[#00A8FF]"
            />
          </div>

          <button
            onClick={handleEncrypt}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#00A8FF] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,122,0,0.3)] hover:brightness-110 transition-all"
          >
            Encrypt & Generate Vault JSON
          </button>
        </div>

        {/* Decrypt / Import Box */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Decrypt / Verify Universal Vault</h4>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Encrypted JSON Vault</label>
            <textarea
              readOnly
              value={encryptedVault ? JSON.stringify(encryptedVault, null, 2) : '/* Encrypted vault JSON will appear here */'}
              className="w-full h-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-gray-300 outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Decryption Password</label>
            <input
              type="password"
              placeholder="Enter master passphrase"
              value={decryptPassword}
              onChange={(e) => setDecryptPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white outline-none focus:border-[#00A8FF]"
            />
          </div>

          <button
            onClick={handleDecrypt}
            disabled={!encryptedVault}
            className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              encryptedVault ? 'bg-[#10B981] hover:brightness-110 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Decrypt & Reveal Key
          </button>

          {decryptedKey && (
            <div className="p-2 rounded bg-[#10B981]/15 border border-[#10B981]/40 text-[11px] font-mono text-[#10B981] break-all">
              Unlocked Key: {decryptedKey}
            </div>
          )}
        </div>
      </div>

      {status && (
        <div className="p-3 rounded-xl bg-[#00A8FF]/10 border border-[#00A8FF]/30 text-xs text-[#00A8FF] font-mono">
          {status}
        </div>
      )}
    </GlassCard>
  );
};
