import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
  GripVertical,
  Star,
  SlidersHorizontal,
  ChevronUp,
  Pin,
  Key,
  Move
} from 'lucide-react';
import { crossTabSync } from '../../services/crossTabSync';
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
  category: string;
  color: 'blue' | 'purple' | 'orange' | 'green' | 'yellow' | 'red';
}

const RAW_NAV_ITEMS: NavItem[] = [
  // Core Protocol
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, category: 'Core Protocol', color: 'blue' },
  { id: 'markets', label: 'Live Markets', icon: TrendingUp, category: 'Core Protocol', color: 'green' },
  { id: 'swap', label: 'DEX Swap', icon: ArrowLeftRight, category: 'Core Protocol', color: 'orange' },
  { id: 'stake', label: 'Staking Vault', icon: Coins, category: 'Core Protocol', color: 'yellow' },
  { id: 'launchpad', label: 'Token Launchpad', icon: Rocket, badge: 'NEW', category: 'Core Protocol', color: 'purple' },
  { id: 'bridge', label: 'Multichain Bridge', icon: Share2, category: 'Core Protocol', color: 'blue' },
  { id: 'explorer', label: 'Block Explorer', icon: Compass, category: 'Core Protocol', color: 'green' },
  
  // Enterprise Architecture
  { id: 'architecture', label: 'Architecture Matrix', icon: Cpu, category: 'Enterprise Architecture', color: 'blue' },
  { id: 'enterprise', label: 'Enterprise Edition', icon: Building2, category: 'Enterprise Architecture', color: 'purple' },
  { id: 'whitepaper', label: 'Technical Whitepaper', icon: FileText, category: 'Enterprise Architecture', color: 'yellow' },
  { id: 'brand', label: 'Brand & Logo Guide', icon: Palette, category: 'Enterprise Architecture', color: 'orange' },
  
  // Intelligence & Audits
  { id: 'portfolio', label: 'Portfolio Analytics', icon: PieChart, category: 'Intelligence & Audits', color: 'green' },
  { id: 'ai', label: 'AI Intelligence', icon: Sparkles, category: 'Intelligence & Audits', color: 'purple' },
  { id: 'cypress', label: 'Cypress E2E Tests', icon: Terminal, category: 'Intelligence & Audits', color: 'blue' },
  { id: 'security', label: 'Security Center', icon: ShieldCheck, category: 'Intelligence & Audits', color: 'red' },
  
  // Governance & Docs
  { id: 'admin', label: 'Admin RBAC', icon: ShieldAlert, highlight: true, badge: 'SUPER', category: 'Governance & Docs', color: 'red' },
  { id: 'guide', label: 'User Guide & Docs', icon: BookOpen, category: 'Governance & Docs', color: 'blue' },
];

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
  const [isReorderingNav, setIsReorderingNav] = useState(false);

  // Cross-tab synced favorites
  const [favoriteTabs, setFavoriteTabs] = useState<NavigationTab[]>(() => {
    try {
      const prefs = crossTabSync.getPreferences();
      if (prefs.favoriteTabs && prefs.favoriteTabs.length > 0) {
        return prefs.favoriteTabs as NavigationTab[];
      }
      const stored = localStorage.getItem('gxq_shell_nav_favorites');
      if (stored) return JSON.parse(stored);
    } catch {}
    return ['overview', 'markets', 'swap', 'launchpad', 'portfolio', 'security'];
  });

  // Custom Nav Items Order with persistence
  const [orderedItemIds, setOrderedItemIds] = useState<NavigationTab[]>(() => {
    try {
      const stored = localStorage.getItem('gxq_shell_master_nav_order');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const allKnown = RAW_NAV_ITEMS.map(i => i.id);
          const valid = parsed.filter(id => allKnown.includes(id));
          allKnown.forEach(id => {
            if (!valid.includes(id)) valid.push(id);
          });
          return valid;
        }
      }
    } catch {}
    return RAW_NAV_ITEMS.map(i => i.id);
  });

  // Drag-and-drop state for menu tab navigation
  const [draggedTabId, setDraggedTabId] = useState<NavigationTab | null>(null);
  const [dropTargetTabId, setDropTargetTabId] = useState<NavigationTab | null>(null);
  const dropTargetTabRef = useRef<NavigationTab | null>(null);
  dropTargetTabRef.current = dropTargetTabId;

  // Listen to crossTabSync updates
  useEffect(() => {
    const unsub = crossTabSync.subscribe((prefs) => {
      if (prefs.favoriteTabs) {
        setFavoriteTabs(prefs.favoriteTabs as NavigationTab[]);
      }
      if (prefs.navOrder && prefs.navOrder.length > 0) {
        setOrderedItemIds(prefs.navOrder as NavigationTab[]);
      }
    });
    return unsub;
  }, []);

  const saveFavorites = (newFavs: NavigationTab[]) => {
    setFavoriteTabs(newFavs);
    try {
      localStorage.setItem('gxq_shell_nav_favorites', JSON.stringify(newFavs));
    } catch {}
    crossTabSync.updatePreferences({ favoriteTabs: newFavs });
  };

  const saveNavOrder = (newOrder: NavigationTab[]) => {
    setOrderedItemIds(newOrder);
    try {
      localStorage.setItem('gxq_shell_master_nav_order', JSON.stringify(newOrder));
    } catch {}
    crossTabSync.updatePreferences({ navOrder: newOrder });
  };

  const toggleFavorite = (tabId: NavigationTab, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favoriteTabs.includes(tabId) 
      ? favoriteTabs.filter(t => t !== tabId) 
      : [...favoriteTabs, tabId];
    saveFavorites(next);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  };

  const moveFavorite = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= favoriteTabs.length) return;
    const next = [...favoriteTabs];
    const [removed] = next.splice(index, 1);
    next.splice(targetIdx, 0, removed);
    saveFavorites(next);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
  };

  const moveMasterItem = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= orderedItemIds.length) return;
    const next = [...orderedItemIds];
    const [removed] = next.splice(index, 1);
    next.splice(targetIdx, 0, removed);
    saveNavOrder(next);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
  };

  // Touch & Pointer Drag for Navigation Tabs
  const handlePointerDownNav = (e: React.PointerEvent, id: NavigationTab) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    setDraggedTabId(id);
    setDropTargetTabId(null);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);

    const onPointerMove = (evt: PointerEvent) => {
      const el = document.elementFromPoint(evt.clientX, evt.clientY);
      const targetEl = el?.closest('[data-nav-id]') as HTMLElement | null;
      if (targetEl) {
        const targetId = targetEl.getAttribute('data-nav-id') as NavigationTab;
        if (targetId && targetId !== id) {
          setDropTargetTabId(targetId);
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      const target = dropTargetTabRef.current;
      if (target && target !== id) {
        setOrderedItemIds(prev => {
          const fromIdx = prev.indexOf(id);
          const toIdx = prev.indexOf(target);
          if (fromIdx !== -1 && toIdx !== -1) {
            const next = [...prev];
            next.splice(fromIdx, 1);
            next.splice(toIdx, 0, id);
            saveNavOrder(next);
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([15, 30, 15]);
            return next;
          }
          return prev;
        });
      }

      setDraggedTabId(null);
      setDropTargetTabId(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const envConfig = ENVIRONMENTS[currentEnv];

  const copyAddress = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentUser?.smartWalletAddress) {
      navigator.clipboard.writeText(currentUser.smartWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter items according to permissions
  const availableItems = RAW_NAV_ITEMS.filter(item => {
    if (item.id === 'admin' && !isAdmin) return false;
    return true;
  });

  // Sort available items by orderedItemIds
  const sortedNavItems = [...availableItems].sort((a, b) => {
    const idxA = orderedItemIds.indexOf(a.id);
    const idxB = orderedItemIds.indexOf(b.id);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  // Group into categories based on original items
  const categoriesMap: { [cat: string]: NavItem[] } = {};
  sortedNavItems.forEach(item => {
    if (!categoriesMap[item.category]) categoriesMap[item.category] = [];
    categoriesMap[item.category].push(item);
  });

  // Control Hub top header
  const renderMenuSliderTopHeader = () => (
    <div className="space-y-3 pb-3 mb-3 border-b border-white/10 shrink-0">
      
      {/* Brand Banner */}
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={() => {
            onSelectTab('overview');
            setIsMobileOpen(false);
          }} 
          title="GXQ Network Overview"
        >
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#00A8FF] via-[#7928CA] to-[#FF7A00] p-0.5 shadow-[0_0_15px_rgba(0,168,255,0.4)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#070B12] rounded-[10px] flex items-center justify-center">
              <span className="font-mono font-black text-white text-xs tracking-tighter">GXQ</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-1 ring-[#070B12] animate-pulse" />
          </div>
          <div>
            <div className="font-mono font-bold text-xs tracking-tight text-white flex items-center gap-1.5">
              <span>GXQ NETWORK</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-[#00A8FF]/20 text-[#00A8FF] font-mono border border-[#00A8FF]/40">
                V3.0 PRO
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
              <span>Command Hub</span>
              <span className="text-gray-600">•</span>
              <span className="text-emerald-400">Online</span>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Connected Smart Wallet Card */}
      {currentUser ? (
        <div className="p-3 rounded-2xl bg-gradient-to-b from-[#00A8FF]/10 via-[#070B12] to-[#070B12] border border-[#00A8FF]/30 shadow-[0_4px_20px_rgba(0,168,255,0.15)] relative overflow-hidden group glow-card-blue">
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

      {/* Network Environment Selector */}
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

      {/* Quick Actions: Faucet & Admin */}
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

  // Renders the Navigation Items List with Touch Drag-and-Drop and Up/Down controls
  const renderNavList = () => (
    <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
      
      {/* 1. Pinned Favorites Quick Launch */}
      {favoriteTabs.length > 0 && (
        <div className="p-2.5 rounded-2xl bg-black/40 border border-[#00A8FF]/30 space-y-2 glow-card-blue relative">
          <div className="h-[2px] w-full flash-line-blue rounded-t-xl mb-1" />
          
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span className="flex items-center gap-1 text-[#00A8FF] font-bold">
              <Star className="w-3 h-3 fill-[#00A8FF]" />
              <span>PINNED FAVORITES ({favoriteTabs.length})</span>
            </span>
            <button
              onClick={() => setIsReorderingNav(!isReorderingNav)}
              className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold flex items-center gap-1 transition-all ${
                isReorderingNav 
                  ? 'bg-[#00A8FF] text-black shadow-[0_0_8px_#00A8FF]' 
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
              title="Customize Navigation"
            >
              <SlidersHorizontal className="w-2.5 h-2.5" />
              <span>{isReorderingNav ? 'Done' : 'Reorder'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {favoriteTabs.map((favId, fIdx) => {
              const item = RAW_NAV_ITEMS.find(i => i.id === favId);
              if (!item) return null;
              const Icon = item.icon;
              const isActive = activeTab === favId;
              return (
                <div key={favId} className="flex items-center gap-0.5">
                  <button
                    onClick={() => {
                      onSelectTab(favId);
                      setIsMobileOpen(false);
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-[#00A8FF] text-black shadow-[0_0_12px_#00A8FF]'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>

                  {/* Reordering bump buttons for favorites when reorder mode active */}
                  {isReorderingNav && (
                    <div className="flex flex-col gap-0.5 ml-0.5">
                      <button
                        onClick={(e) => moveFavorite(fIdx, 'up', e)}
                        disabled={fIdx === 0}
                        className="p-0.5 rounded bg-white/10 hover:bg-[#00A8FF]/30 text-gray-300 hover:text-white disabled:opacity-20"
                        title="Move Left/Up"
                      >
                        <ChevronUp className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => moveFavorite(fIdx, 'down', e)}
                        disabled={fIdx === favoriteTabs.length - 1}
                        className="p-0.5 rounded bg-white/10 hover:bg-[#00A8FF]/30 text-gray-300 hover:text-white disabled:opacity-20"
                        title="Move Right/Down"
                      >
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Categorized Navigation Groups with Touch Drag-and-Drop */}
      {Object.entries(categoriesMap).map(([categoryTitle, items], catIdx) => (
        <div key={categoryTitle} className="space-y-1">
          <div className="text-[10px] font-mono uppercase text-gray-400 font-bold px-2 tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                catIdx === 0 ? 'bg-[#00A8FF]' : catIdx === 1 ? 'bg-[#A855F7]' : catIdx === 2 ? 'bg-[#10B981]' : 'bg-[#FF7A00]'
              }`} />
              <span>{categoryTitle}</span>
            </span>
            <span className="text-gray-600 text-[9px]">{items.length}</span>
          </div>

          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isFav = favoriteTabs.includes(item.id);
              const isDragged = draggedTabId === item.id;
              const isDropTarget = dropTargetTabId === item.id;
              const globalIdx = orderedItemIds.indexOf(item.id);

              return (
                <div
                  key={item.id}
                  data-nav-id={item.id}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all group relative ${
                    isDropTarget ? 'border-2 border-[#00A8FF] shadow-[0_0_15px_rgba(0,168,255,0.4)]' : ''
                  } ${
                    isDragged ? 'opacity-40 scale-98 bg-white/10' : ''
                  } ${
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-r from-[#FF7A00]/25 to-[#FF304F]/25 text-[#FFD400] border border-[#FF7A00]/50 shadow-[0_0_15px_rgba(255,122,0,0.25)] glow-card-orange'
                        : 'bg-[#00A8FF]/15 text-[#00A8FF] border border-[#00A8FF]/40 shadow-[0_0_15px_rgba(0,168,255,0.2)] glow-card-blue'
                      : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Left Grip Handle for Touch Drag-and-Drop */}
                  <div
                    onPointerDown={(e) => handlePointerDownNav(e, item.id)}
                    className="p-1 -ml-1 text-gray-500 hover:text-white cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
                    title="Touch & Drag to reorder menu tab"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  <button
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsMobileOpen(false);
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                    }}
                    className="flex items-center gap-2 truncate flex-1 text-left min-w-0"
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-current' : 'text-gray-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>

                  {/* Actions: Reorder Bump Buttons + Favorite Pin + Badge */}
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {isReorderingNav && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => moveMasterItem(globalIdx, 'up', e)}
                          disabled={globalIdx === 0}
                          className="p-1 rounded bg-white/5 hover:bg-[#00A8FF]/20 text-gray-400 hover:text-white disabled:opacity-20"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => moveMasterItem(globalIdx, 'down', e)}
                          disabled={globalIdx === orderedItemIds.length - 1}
                          className="p-1 rounded bg-white/5 hover:bg-[#00A8FF]/20 text-gray-400 hover:text-white disabled:opacity-20"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Favorite Pin Button */}
                    <button
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className={`p-1 rounded transition-colors ${
                        isFav ? 'text-[#00A8FF]' : 'text-gray-600 hover:text-gray-400 opacity-60 sm:opacity-0 group-hover:opacity-100'
                      }`}
                      title={isFav ? 'Unpin favorite' : 'Pin to favorites'}
                    >
                      <Star className={`w-3 h-3 ${isFav ? 'fill-[#00A8FF]' : ''}`} />
                    </button>

                    {item.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase border shrink-0 ${
                        item.highlight 
                          ? 'bg-[#FF7A00]/30 text-[#FF7A00] border-[#FF7A00]/50' 
                          : 'bg-[#00A8FF]/20 text-[#00A8FF] border-[#00A8FF]/40'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Bottom Status card
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
        <main className="flex-1 p-4 lg:p-8 min-w-0 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Cyber-futuristic with Glowing Halos & Flash Lines) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070B12]/95 backdrop-blur-2xl border-t border-white/15 px-2 py-1.5 flex items-center justify-around mobile-bottom-appbar shadow-[0_-5px_25px_rgba(0,168,255,0.15)]">
        {/* Top Glowing Flash Line */}
        <div className="absolute -top-[2px] left-0 right-0 h-[3px] flash-line-blue opacity-100" />

        <button
          onClick={() => {
            onSelectTab('overview');
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] transition-all ${
            activeTab === 'overview'
              ? 'text-[#00A8FF] font-bold bg-[#00A8FF]/20 shadow-[0_0_15px_rgba(0,168,255,0.5)] border border-[#00A8FF]/50 scale-105 glow-card-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            onSelectTab('markets');
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] transition-all ${
            activeTab === 'markets'
              ? 'text-[#10B981] font-bold bg-[#10B981]/20 shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-[#10B981]/50 scale-105 glow-card-green'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Markets</span>
        </button>

        <button
          onClick={() => {
            onSelectTab('swap');
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] transition-all ${
            activeTab === 'swap'
              ? 'text-[#FF7A00] font-bold bg-[#FF7A00]/20 shadow-[0_0_15px_rgba(255,122,0,0.5)] border border-[#FF7A00]/50 scale-105 glow-card-orange'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Swap</span>
        </button>

        <button
          onClick={() => {
            onSelectTab('launchpad');
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] transition-all ${
            activeTab === 'launchpad'
              ? 'text-[#A855F7] font-bold bg-[#A855F7]/20 shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-[#A855F7]/50 scale-105 glow-card-purple'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span>Launchpad</span>
        </button>

        <button
          onClick={() => {
            onSelectTab('portfolio');
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] transition-all ${
            activeTab === 'portfolio'
              ? 'text-[#FFD400] font-bold bg-[#FFD400]/20 shadow-[0_0_15px_rgba(255,212,0,0.5)] border border-[#FFD400]/50 scale-105 glow-card-yellow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Portfolio</span>
        </button>

        <button
          onClick={() => {
            setIsMobileOpen(true);
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
          }}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] text-gray-300 hover:text-white active:scale-95 transition-all"
        >
          <div className="relative">
            <Menu className="w-4 h-4 text-[#00A8FF]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF7A00] animate-ping" />
          </div>
          <span>Menu</span>
        </button>
      </nav>

      {/* Mobile Slide-Over Menu Slider (Professional Enterprise Execution Core Drawer) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fadeIn">
          {/* Backdrop with High Blur */}
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Slide-out Drawer Panel */}
          <div className="relative w-84 max-w-[88vw] h-full bg-[#070B12]/98 border-r border-[#00A8FF]/30 backdrop-blur-3xl flex flex-col p-5 shadow-[0_0_50px_rgba(0,168,255,0.25)] z-10 animate-slideInLeft overflow-hidden">
            {/* Top Glowing Flash Line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] flash-line-blue opacity-100 z-20" />
            
            {/* Mobile Pull Bar Indicator */}
            <div className="w-12 h-1 rounded-full bg-white/30 mx-auto mb-3 shrink-0" />
            
            {renderMenuSliderTopHeader()}
            {renderNavList()}
            {renderMenuSliderFooter()}
          </div>
        </div>
      )}
    </div>
  );
};
