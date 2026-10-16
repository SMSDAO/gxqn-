import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  ArrowLeftRight, 
  Coins, 
  Rocket, 
  Compass, 
  PieChart, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  BookOpen, 
  Terminal,
  Share2,
  Cpu,
  Building2,
  Palette,
  FileText,
  Menu, 
  X,
  Globe,
  Wallet,
  ChevronDown,
  Droplet,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Activity,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { ENVIRONMENTS, GXQEnvironment } from '../../config/environments';
import { SmartWalletUser } from '../../services/smartWallet';
import { StatusBadge } from '../common/StatusBadge';

export type NavigationTab = 
  | 'overview' 
  | 'markets' 
  | 'swap' 
  | 'stake' 
  | 'launchpad' 
  | 'bridge'
  | 'explorer' 
  | 'architecture'
  | 'enterprise'
  | 'whitepaper'
  | 'brand'
  | 'portfolio' 
  | 'ai' 
  | 'cypress'
  | 'security' 
  | 'admin' 
  | 'guide';

export interface ShellProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isAdmin: boolean;
  currentEnv: GXQEnvironment;
  onSelectEnv: (env: GXQEnvironment) => void;
  currentUser: SmartWalletUser | null;
  onLoginGoogle: (email?: string) => void;
  onDisconnectWallet: () => void;
  onClaimFaucet: () => void;
  onNavigateToAdmin: () => void;
  triggerFlash: (type: 'BLUE_FLASH' | 'ORANGE_FLASH' | 'SUCCESS_FLASH') => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: string;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

export const Shell: React.FC<ShellProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
  currentEnv,
  onSelectEnv,
  currentUser,
  onLoginGoogle,
  onDisconnectWallet,
  onClaimFaucet,
  onNavigateToAdmin,
  triggerFlash,
  mobileMenuOpen: controlledMobileMenuOpen,
  setMobileMenuOpen: controlledSetMobileMenuOpen,
  children,
}) => {
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
  const isMobileOpen = controlledMobileMenuOpen !== undefined ? controlledMobileMenuOpen : internalMobileMenuOpen;
  const setIsMobileOpen = controlledSetMobileMenuOpen || setInternalMobileMenuOpen;

  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const envConfig = ENVIRONMENTS[currentEnv];

  const copyAddress = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentUser?.smartWalletAddress) {
      navigator.clipboard.writeText(currentUser.smartWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navCategories: NavCategory[] = [
    {
      title: 'Core Protocol',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'markets', label: 'Live Markets', icon: TrendingUp },
        { id: 'swap', label: 'DEX Swap', icon: ArrowLeftRight },
        { id: 'stake', label: 'Staking Vault', icon: Coins },
        { id: 'launchpad', label: 'Token Launchpad', icon: Rocket, badge: 'NEW' },
        { id: 'bridge', label: 'Multichain Bridge', icon: Share2 },
        { id: 'explorer', label: 'Block Explorer', icon: Compass },
      ],
    },
    {
      title: 'Enterprise Architecture',
      items: [
        { id: 'architecture', label: 'Architecture Matrix', icon: Cpu },
        { id: 'enterprise', label: 'Enterprise Edition', icon: Building2 },
        { id: 'whitepaper', label: 'Technical Whitepaper', icon: FileText },
        { id: 'brand', label: 'Brand & Logo Guide', icon: Palette },
      ],
    },
    {
      title: 'Intelligence & Audits',
      items: [
        { id: 'portfolio', label: 'Portfolio Analytics', icon: PieChart },
        { id: 'ai', label: 'AI Intelligence', icon: Sparkles },
        { id: 'cypress', label: 'Cypress E2E Tests', icon: Terminal },
        { id: 'security', label: 'Security Center', icon: ShieldCheck },
      ],
    },
    {
      title: 'Governance & Docs',
      items: [
        ...(isAdmin
          ? [{ id: 'admin' as NavigationTab, label: 'Admin RBAC', icon: ShieldAlert, highlight: true, badge: 'SUPER' }]
          : []),
        { id: 'guide', label: 'User Guide & Docs', icon: BookOpen },
      ],
    },
  ];

  // Renders the Menu Slider's Top Control Hub (Wallet + Network + Faucet + Admin)
  const renderMenuSliderTopHeader = () => (
    <div className="space-y-3 pb-3 mb-3 border-b border-white/10 shrink-0">
      
      {/* 1. Brand Banner in Menu Slider */}
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={() => {
            onSelectTab('overview');
            setIsMobileOpen(false);
          }} 
          title="GXQ Network Overview"
        >
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#00A8FF] via-[#7928CA] to-[#FF7A00] p-0.5 shadow-[0_0_12px_rgba(0,168,255,0.4)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#070B12] rounded-[10px] flex items-center justify-center">
              <span className="font-mono font-black text-white text-xs tracking-tighter">GXQ</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-1 ring-[#070B12] animate-pulse" />
          </div>
          <div>
            <div className="font-mono font-bold text-xs tracking-tight text-white flex items-center gap-1.5">
              <span>GXQ NETWORK</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-[#00A8FF]/20 text-[#00A8FF] font-mono border border-[#00A8FF]/40">
                V3.0
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
              <span>Command Menu</span>
              <span className="text-gray-600">•</span>
              <span className="text-emerald-400">Online</span>
            </div>
          </div>
        </div>

        {/* Mobile close button if inside mobile drawer */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Connected Smart Wallet Card or Connect Wallet CTA */}
      {currentUser ? (
        <div className="p-3 rounded-2xl bg-gradient-to-b from-[#00A8FF]/10 via-[#070B12] to-[#070B12] border border-[#00A8FF]/30 shadow-[0_4px_20px_rgba(0,168,255,0.12)] relative overflow-hidden group">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#00A8FF]/15 rounded-full blur-xl pointer-events-none" />

          {/* User Profile Bar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00A8FF] to-[#7928CA] p-0.5 shadow-sm">
                  <div className="w-full h-full bg-[#070B12] rounded-[6px] flex items-center justify-center text-xs font-mono font-bold text-white">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-1 ring-[#070B12] animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate max-w-[130px]" title={currentUser.name}>
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-gray-400 font-mono truncate max-w-[130px]" title={currentUser.email}>
                  {currentUser.email}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isAdmin && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40">
                  ADMIN
                </span>
              )}
              <button
                onClick={onDisconnectWallet}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Disconnect Smart Wallet Session"
                aria-label="Disconnect Smart Wallet"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ERC-4337 Smart Account Address Pill */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono mb-2">
            <div className="flex items-center gap-1.5 text-gray-300 truncate">
              <span className="text-gray-500 text-[10px]">AA:</span>
              <span className="text-[#00A8FF] font-medium tracking-tight">
                {currentUser.smartWalletAddress.slice(0, 6)}...{currentUser.smartWalletAddress.slice(-4)}
              </span>
            </div>
            <button
              onClick={copyAddress}
              className="p-1 hover:text-white text-gray-400 transition-colors ml-1"
              title="Copy Smart Account Address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* AA Architecture & Account Type */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              {currentUser.provider.toUpperCase()} Modular
            </span>
            <span className="text-[#00A8FF]/80">ERC-4337 AA</span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-[#070B12] border border-white/10 relative overflow-hidden group">
          <div className="text-[11px] text-gray-400 mb-2 flex items-center justify-between">
            <span>Enterprise Wallet</span>
            <span className="text-[9px] text-[#00A8FF] font-mono">Zero Gas UX</span>
          </div>
          <button
            onClick={() => onLoginGoogle('gxqstudio@gmail.com')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#00A8FF] to-[#008CFF] text-black font-semibold text-xs hover:brightness-110 active:scale-98 transition-all shadow-[0_0_15px_rgba(0,168,255,0.35)]"
          >
            <Wallet className="w-4 h-4 text-black" />
            <span>Connect Smart Wallet</span>
          </button>
        </div>
      )}

      {/* 3. Network Environment Selector */}
      <div className="relative">
        <button
          onClick={() => setEnvDropdownOpen(!envDropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#070B12] border border-white/10 hover:border-[#00A8FF]/40 text-xs font-mono transition-all duration-200 group"
          aria-label="Select Network Environment"
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-[#00A8FF] group-hover:rotate-45 transition-transform shrink-0" />
            <div className="text-left truncate">
              <div className="text-white font-medium truncate flex items-center gap-1.5">
                <span>{envConfig.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-gray-500">Chain ID: {envConfig.chainId}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={envConfig.id.toUpperCase()} size="sm" />
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${envDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {envDropdownOpen && (
          <div className="absolute left-0 right-0 mt-2 p-2 rounded-2xl bg-[#070B12] border border-white/15 shadow-2xl z-50 animate-fadeIn backdrop-blur-2xl">
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Select Environment</span>
              <span className="text-[9px] text-[#00A8FF] font-mono">BFT-PoS</span>
            </div>
            <div className="space-y-1">
              {(Object.keys(ENVIRONMENTS) as GXQEnvironment[]).map((envKey) => {
                const item = ENVIRONMENTS[envKey];
                const isSelected = envKey === currentEnv;
                return (
                  <button
                    key={envKey}
                    onClick={() => {
                      onSelectEnv(envKey);
                      setEnvDropdownOpen(false);
                      triggerFlash('BLUE_FLASH');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-colors ${
                      isSelected 
                        ? 'bg-[#00A8FF]/15 border border-[#00A8FF]/30 text-white' 
                        : 'hover:bg-white/5 text-gray-300 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#00A8FF]" />}
                      </div>
                      <div className="text-[10px] text-gray-500">Chain ID: {item.chainId}</div>
                    </div>
                    <StatusBadge status={envKey.toUpperCase()} size="sm" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Actions: Faucet & Admin Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {envConfig.featureFlags.isFaucetEnabled ? (
          <button
            onClick={() => {
              onClaimFaucet();
              triggerFlash('SUCCESS_FLASH');
            }}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#00A8FF]/10 border border-[#00A8FF]/30 text-[#00A8FF] hover:bg-[#00A8FF]/20 text-xs font-mono font-medium transition-all group"
            title={`Claim test ${envConfig.currency.symbol}`}
          >
            <Droplet className="w-3.5 h-3.5 text-[#00A8FF] group-hover:scale-110 transition-transform" />
            <span className="truncate">Claim Faucet</span>
          </button>
        ) : (
          <div className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-gray-500 text-[11px] font-mono">
            <span>Mainnet Live</span>
          </div>
        )}

        {isAdmin ? (
          <button
            onClick={() => {
              onNavigateToAdmin();
              setIsMobileOpen(false);
            }}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all border ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-[#FF7A00] to-[#FF304F] text-black border-transparent shadow-[0_0_12px_rgba(255,122,0,0.35)]'
                : 'bg-[#FF7A00]/15 text-[#FF7A00] border-[#FF7A00]/30 hover:bg-[#FF7A00]/25'
            }`}
            title="Open Admin RBAC Panel"
          >
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            <span className="truncate">Admin Panel</span>
          </button>
        ) : (
          <div className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-gray-500 text-[11px] font-mono">
            <span>BFT-PoS 3k TPS</span>
          </div>
        )}
      </div>

    </div>
  );

  // Renders the Navigation Items List categorized
  const renderNavList = () => (
    <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
      {navCategories.map((cat, idx) => (
        <div key={idx} className="space-y-1">
          <div className="text-[10px] font-mono uppercase text-gray-500 font-semibold px-2 tracking-wider flex items-center justify-between">
            <span>{cat.title}</span>
            <span className="text-gray-600 text-[9px]">{cat.items.length}</span>
          </div>
          <div className="space-y-0.5">
            {cat.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-r from-[#FF7A00]/25 to-[#FF304F]/25 text-[#FFD400] border border-[#FF7A00]/50 shadow-[0_0_15px_rgba(255,122,0,0.25)]'
                        : 'bg-[#00A8FF]/15 text-[#00A8FF] border border-[#00A8FF]/30 shadow-[0_0_15px_rgba(0,168,255,0.15)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-current' : 'text-gray-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase border shrink-0 ${
                      item.highlight 
                        ? 'bg-[#FF7A00]/30 text-[#FF7A00] border-[#FF7A00]/50' 
                        : 'bg-[#00A8FF]/20 text-[#00A8FF] border-[#00A8FF]/40'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Renders the Menu Slider's Bottom Status card
  const renderMenuSliderFooter = () => (
    <div className="mt-auto pt-3 border-t border-white/10 shrink-0">
      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-400 font-mono">Consensus:</span>
          <span className="text-[#10B981] font-mono font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            BFT-PoS Active
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-400 font-mono">Multi-Tier Cache:</span>
          <span className="text-[#00A8FF] font-mono font-medium">L1 Hot &lt;0.2ms</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-400 font-mono">Bridge Protocol:</span>
          <span className="text-purple-400 font-mono font-medium">USDC ZK Verified</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#030507] text-[#F5F7FA]">
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Desktop Sidebar — The Menu Slider on Desktop */}
        <aside className="hidden lg:flex flex-col w-72 p-4 border-r border-white/10 shrink-0 h-[calc(100vh-65px)] sticky top-[65px] bg-[#030507]/60 backdrop-blur-xl">
          {renderMenuSliderTopHeader()}
          {renderNavList()}
          {renderMenuSliderFooter()}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 min-w-0 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Minimalist quick triggers) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070B12]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => onSelectTab('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] ${
            activeTab === 'overview' ? 'text-[#00A8FF] font-bold' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onSelectTab('swap')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] ${
            activeTab === 'swap' ? 'text-[#00A8FF] font-bold' : 'text-gray-400'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Swap</span>
        </button>

        <button
          onClick={() => onSelectTab('launchpad')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] ${
            activeTab === 'launchpad' ? 'text-[#00A8FF] font-bold' : 'text-gray-400'
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span>Launchpad</span>
        </button>

        <button
          onClick={() => onSelectTab('explorer')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] ${
            activeTab === 'explorer' ? 'text-[#00A8FF] font-bold' : 'text-gray-400'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Explorer</span>
        </button>

        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] text-gray-300 hover:text-white"
        >
          <Menu className="w-4 h-4 text-[#00A8FF]" />
          <span>Menu Slider</span>
        </button>
      </nav>

      {/* Mobile Slide-Over Menu Slider (Left Slide Drawer) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Slide-out Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] h-full bg-[#070B12]/98 border-r border-white/15 backdrop-blur-2xl flex flex-col p-4 shadow-2xl z-10 animate-slideInLeft overflow-hidden">
            {renderMenuSliderTopHeader()}
            {renderNavList()}
            {renderMenuSliderFooter()}
          </div>
        </div>
      )}
    </div>
  );
};
