import React, { useState, useRef, useEffect } from 'react';
import { ENVIRONMENTS, GXQEnvironment } from '../../config/environments';
import { updateWagmiEnvironment, getActiveViemChain } from '../../config/wagmiConfig';
import { StatusBadge } from './StatusBadge';
import { 
  Globe, 
  ChevronDown, 
  Check, 
  Cpu, 
  ExternalLink, 
  Radio, 
  ShieldCheck, 
  Zap, 
  Server,
  Layers
} from 'lucide-react';

export interface NetworkEnvironmentSwitcherProps {
  currentEnv: GXQEnvironment;
  onSelectEnv: (env: GXQEnvironment) => void;
  triggerFlash?: (type: any) => void;
  variant?: 'dropdown' | 'segmented' | 'card';
  className?: string;
  showDetails?: boolean;
}

export const NetworkEnvironmentSwitcher: React.FC<NetworkEnvironmentSwitcherProps> = ({
  currentEnv,
  onSelectEnv,
  triggerFlash,
  variant = 'dropdown',
  className = '',
  showDetails = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeConfig = ENVIRONMENTS[currentEnv];
  const activeChain = getActiveViemChain(currentEnv);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSwitch = (envKey: GXQEnvironment) => {
    if (envKey === currentEnv) {
      setIsOpen(false);
      return;
    }

    // 1. Update application state
    onSelectEnv(envKey);

    // 2. Update Wagmi / Viem chain configuration
    updateWagmiEnvironment(envKey);

    // 3. Close dropdown & trigger flash interaction
    setIsOpen(false);
    if (triggerFlash) {
      triggerFlash('BLUE_FLASH');
    }
  };

  const getEnvColor = (env: GXQEnvironment) => {
    switch (env) {
      case 'mainnet':
        return 'text-[#FF7A00] border-[#FF7A00]/40 bg-[#FF7A00]/10';
      case 'testnet':
        return 'text-[#A855F7] border-[#A855F7]/40 bg-[#A855F7]/10';
      case 'devnet':
        return 'text-[#00A8FF] border-[#00A8FF]/40 bg-[#00A8FF]/10';
      case 'local':
        return 'text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10';
      default:
        return 'text-white border-white/20 bg-white/10';
    }
  };

  // VARIANT 1: SEGMENTED PILLS
  if (variant === 'segmented') {
    return (
      <div className={`p-1.5 rounded-2xl bg-[#070B12] border border-white/10 flex items-center gap-1.5 font-mono text-xs ${className}`}>
        {(['local', 'devnet', 'testnet', 'mainnet'] as GXQEnvironment[]).map((envKey) => {
          const env = ENVIRONMENTS[envKey];
          const isSelected = envKey === currentEnv;
          return (
            <button
              key={envKey}
              onClick={() => handleSwitch(envKey)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-[#00A8FF] to-[#008CFF] text-black shadow-[0_0_15px_rgba(0,168,255,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black animate-pulse' : 'bg-gray-500'}`} />
              <span className="uppercase">{envKey}</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">#{env.chainId}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // VARIANT 2: CARD OVERVIEW
  if (variant === 'card') {
    return (
      <div className={`p-4 rounded-2xl bg-[#070B12] border border-white/10 font-mono text-xs ${className}`}>
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00A8FF]" />
            <span className="text-white font-bold uppercase">Network Environment</span>
          </div>
          <StatusBadge status={currentEnv.toUpperCase()} size="sm" />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {(['local', 'devnet', 'testnet', 'mainnet'] as GXQEnvironment[]).map((envKey) => {
            const env = ENVIRONMENTS[envKey];
            const isSelected = envKey === currentEnv;
            return (
              <button
                key={envKey}
                onClick={() => handleSwitch(envKey)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#00A8FF] bg-[#00A8FF]/15 text-white shadow-[0_0_12px_rgba(0,168,255,0.25)]'
                    : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-xs">{env.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#00A8FF]" />}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Chain ID: {env.chainId}</div>
                <div className="text-[9px] text-[#00A8FF] truncate mt-1">{env.currency.symbol} (Native)</div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-white/5 text-[10px] text-gray-500 flex items-center justify-between">
          <span>Active RPC: {activeConfig.rpcUrl}</span>
          <span className="text-emerald-400">Viem/Wagmi Synced</span>
        </div>
      </div>
    );
  }

  // VARIANT 3 (DEFAULT): COMPACT INTERACTIVE DROPDOWN
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#070B12] border border-white/10 hover:border-[#00A8FF]/40 text-xs font-mono transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-[#00A8FF]"
        aria-label="Select Network Environment"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          <Globe className="w-3.5 h-3.5 text-[#00A8FF] group-hover:rotate-45 transition-transform shrink-0" />
          <div className="text-left truncate">
            <div className="text-white font-medium truncate flex items-center gap-1.5">
              <span>{activeConfig.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
              <span>Chain ID: {activeConfig.chainId}</span>
              <span className="text-gray-600">•</span>
              <span className="text-emerald-400">viem: {activeChain.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getEnvColor(currentEnv)}`}>
            {currentEnv}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 p-2 rounded-2xl bg-[#070B12]/98 border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-50 animate-fadeIn backdrop-blur-2xl font-mono text-xs">
          <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-white/10 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-[#00A8FF]" />
              <span>Select GXQ Environment</span>
            </span>
            <span className="text-[9px] text-[#00A8FF]">BFT-PoS V3.0</span>
          </div>

          <div className="space-y-1">
            {(Object.keys(ENVIRONMENTS) as GXQEnvironment[]).map((envKey) => {
              const item = ENVIRONMENTS[envKey];
              const isSelected = envKey === currentEnv;
              const chain = getActiveViemChain(envKey);

              return (
                <button
                  key={envKey}
                  onClick={() => handleSwitch(envKey)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                    isSelected 
                      ? 'bg-[#00A8FF]/15 border border-[#00A8FF]/40 text-white shadow-[0_0_12px_rgba(0,168,255,0.2)]' 
                      : 'hover:bg-white/5 text-gray-300 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span className="truncate">{item.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#00A8FF] shrink-0" />}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                      <span>Chain ID: {item.chainId}</span>
                      <span>•</span>
                      <span className="text-gray-400 truncate">{item.currency.name}</span>
                    </div>
                    <div className="text-[9px] text-gray-500 truncate mt-0.5">
                      RPC: {item.rpcUrl}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getEnvColor(envKey)}`}>
                      {envKey}
                    </span>
                    <div className="text-[9px] text-gray-400 mt-1">
                      {item.featureFlags.isFaucetEnabled ? 'Faucet ON' : 'Faucet OFF'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {showDetails && (
            <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-gray-400 px-2 space-y-1">
              <div className="flex justify-between">
                <span>Viem Public Client:</span>
                <span className="text-emerald-400">Ready</span>
              </div>
              <div className="flex justify-between">
                <span>Account Abstraction:</span>
                <span className="text-[#00A8FF]">ERC-4337 Active</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
