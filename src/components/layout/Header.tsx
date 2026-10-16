import React from 'react';
import { GXQEnvironment } from '../../config/environments';
import { SmartWalletUser } from '../../services/smartWallet';
import { NetworkEnvironmentSwitcher } from '../common/NetworkEnvironmentSwitcher';
import { 
  Wallet, 
  Menu, 
  SlidersHorizontal,
  Activity,
  Zap,
  Cpu
} from 'lucide-react';

interface HeaderProps {
  currentEnv: GXQEnvironment;
  currentUser: SmartWalletUser | null;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenMenuSlider: () => void;
  onSelectEnv: (env: GXQEnvironment) => void;
  triggerFlash?: (type: 'BLUE_FLASH' | 'ORANGE_FLASH' | 'SUCCESS_FLASH') => void;
}

const TAB_TITLES: Record<string, string> = {
  overview: 'Command Center',
  markets: 'Live Market Ticker',
  swap: 'DEX Automated Market Maker',
  stake: 'Staking & Validator Vault',
  launchpad: 'Token Launchpad & Branding',
  bridge: 'Multichain Bridge Protocol',
  explorer: 'GXQ Block Explorer',
  architecture: 'Architecture Matrix',
  enterprise: 'Enterprise Edition',
  whitepaper: 'Technical Whitepaper',
  brand: 'Brand & Logo Guidelines',
  portfolio: 'Portfolio Management',
  ai: 'AI Intelligence Center',
  cypress: 'Cypress E2E Automation',
  security: 'Security Center & Audit Log',
  admin: 'Admin RBAC Enclave',
  guide: 'User Guide & Documentation',
};

export const Header: React.FC<HeaderProps> = ({
  currentEnv,
  currentUser,
  activeTab,
  onNavigate,
  onOpenMenuSlider,
  onSelectEnv,
  triggerFlash,
}) => {
  const activeTitle = TAB_TITLES[activeTab] || 'Command Center';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030507]/90 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Mobile Slider Toggle + Brand Logo + Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          
          {/* Mobile Menu Slider Hamburger Button */}
          <button
            onClick={onOpenMenuSlider}
            className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#00A8FF]/40 text-gray-300 hover:text-white transition-all flex items-center gap-1.5 shrink-0"
            aria-label="Open Navigation Menu Slider"
          >
            <Menu className="w-4 h-4 text-[#00A8FF]" />
            <span className="text-[11px] font-mono font-medium hidden xs:inline">Menu</span>
          </button>

          {/* Logo & Platform Identity */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0" 
            onClick={() => onNavigate('overview')} 
            title="GXQ Network Command Center"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#00A8FF] via-[#7928CA] to-[#FF7A00] p-0.5 shadow-[0_0_15px_rgba(0,168,255,0.4)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070B12] rounded-[10px] flex items-center justify-center">
                <span className="font-mono font-black text-white text-xs tracking-tighter">GXQ</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-[#030507] animate-pulse" />
            </div>

            <div className="hidden sm:block">
              <div className="font-mono font-extrabold text-xs tracking-tight text-white flex items-center gap-1.5">
                <span>GXQ NETWORK</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#00A8FF]/15 text-[#00A8FF] font-mono border border-[#00A8FF]/30">
                  ENTERPRISE
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono">BFT-PoS • 3,420 TPS</div>
            </div>
          </div>

          {/* Active Module Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-white/10 text-xs font-mono truncate">
            <span className="text-gray-500">/</span>
            <span className="text-gray-200 font-medium truncate">{activeTitle}</span>
          </div>
        </div>

        {/* Center / Right: Live Operational Status + Menu Slider Quick Indicators */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Live Telemetry Pill */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[10px] font-mono text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Block #4,192,842</span>
            <span className="text-gray-600">•</span>
            <span className="text-[#00A8FF]">L1 Cache &lt;0.2ms</span>
          </div>


          {/* Network Environment Switcher */}
          <NetworkEnvironmentSwitcher 
            currentEnv={currentEnv} 
            onSelectEnv={onSelectEnv} 
            triggerFlash={triggerFlash}
            variant="dropdown"
            className="hidden lg:flex"
          />

          {/* Wallet Session Quick Indicator / Open Menu Slider */}
          {currentUser ? (
            <button
              onClick={onOpenMenuSlider}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#070B12] border border-[#00A8FF]/30 hover:border-[#00A8FF] text-xs font-mono transition-all group shadow-[0_0_10px_rgba(0,168,255,0.15)]"
              title="Connected Smart Wallet — Click to view session details in Menu Slider"
            >
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
              <span className="text-white font-medium">
                {currentUser.smartWalletAddress.slice(0, 6)}...{currentUser.smartWalletAddress.slice(-4)}
              </span>
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#00A8FF] transition-colors hidden sm:block" />
            </button>
          ) : (
            <button
              onClick={onOpenMenuSlider}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00A8FF] to-[#008CFF] text-black font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(0,168,255,0.35)]"
              title="Open Menu Slider to connect wallet"
            >
              <Wallet className="w-3.5 h-3.5 text-black shrink-0" />
              <span className="hidden xs:inline">Menu / Connect</span>
              <span className="xs:hidden">Connect</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
