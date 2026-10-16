/**
 * GXQ Network V3.0.0 — Enterprise Multi-Environment Command Center
 * Master Contract Compliant: Cyber-Futuristic Enterprise Glass
 * Featuring Real-Time WebSockets, RBAC Admin Enclave, and Cypress E2E Suite
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ENVIRONMENTS, GXQEnvironment, DEFAULT_ENVIRONMENT } from './config/environments';
import { SmartWalletUser, SmartWalletRegistry, UserRole } from './services/smartWallet';
import { marketProvider, MarketSnapshot } from './services/marketProvider';
import { SCORE_DATABASE, AI_INSIGHTS, ScoreDetails } from './services/aiIntelligence';
import { explorerApi } from './services/explorerApi';
import { alertService } from './services/alertService';
import { telemetry } from './services/telemetry';
import { wsService } from './services/websocketService';

import { Header } from './components/layout/Header';
import { Shell, NavigationTab } from './components/layout/Shell';
import { ScoreBreakdownModal } from './components/common/ScoreBreakdownModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { errorMonitoring } from './services/errorMonitoring';

import { CommandCenter } from './components/modules/CommandCenter';
import { MarketsModule } from './components/modules/MarketsModule';
import { SwapModule } from './components/modules/SwapModule';
import { StakeModule } from './components/modules/StakeModule';
import { LaunchpadModule } from './components/modules/LaunchpadModule';
import { ExplorerModule } from './components/modules/ExplorerModule';
import { PortfolioModule } from './components/modules/PortfolioModule';
import { AIIntelligenceModule } from './components/modules/AIIntelligenceModule';
import { MultichainBridgeModule } from './components/modules/MultichainBridgeModule';
import { ArchitectureDiagramModule } from './components/modules/ArchitectureDiagramModule';
import { EnterpriseEditionModule } from './components/modules/EnterpriseEditionModule';
import { WhitepaperModule } from './components/modules/WhitepaperModule';
import { BrandIdentityModule } from './components/modules/BrandIdentityModule';
import { CypressRunnerModule } from './components/modules/CypressRunnerModule';
import { SecurityCenterModule } from './components/modules/SecurityCenterModule';
import { AdminModule } from './components/modules/AdminModule';
import { UserGuideModule } from './components/modules/UserGuideModule';
import { TokenProfileModule } from './components/modules/TokenProfileModule';
import { AdminGuard } from './components/common/AdminGuard';
import { OnboardingFlow } from './components/common/OnboardingFlow';
import { Bell, Sparkles, X } from 'lucide-react';

/**
 * Custom hook to trigger a background refresh of market data every 30 seconds,
 * ensuring the Command Center remains current without requiring user intervention.
 */
export function useMarketDataBackgroundRefresh(
  onRefresh: (snapshots: MarketSnapshot[]) => void,
  intervalMs: number = 30000
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date());
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        setIsRefreshing(true);
        const freshSnapshots = await marketProvider.refresh();
        if (freshSnapshots && freshSnapshots.length > 0) {
          onRefresh(freshSnapshots);
          setLastRefreshedAt(new Date());
          setRefreshCount((prev) => prev + 1);
          telemetry.log({
            eventType: 'market_subscription',
            severity: 'INFO',
            payload: {
              action: 'background_market_refresh_30s',
              tickerCount: freshSnapshots.length,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (err) {
        errorMonitoring.captureException(err, {
          category: 'NETWORK_RPC_ERROR',
          severity: 'WARNING',
          tags: { hook: 'useMarketDataBackgroundRefresh' }
        });
      } finally {
        setIsRefreshing(false);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [onRefresh, intervalMs]);

  return { isRefreshing, lastRefreshedAt, refreshCount };
}

export default function App() {
  const [currentEnv, setCurrentEnv] = useState<GXQEnvironment>(() => {
    try {
      const saved = localStorage.getItem('gxq_active_env');
      if (saved && ENVIRONMENTS[saved as GXQEnvironment]) return saved as GXQEnvironment;
    } catch {
      // ignore
    }
    return DEFAULT_ENVIRONMENT;
  });

  // Default to Super Admin user gxqstudio@gmail.com
  const [currentUser, setCurrentUser] = useState<SmartWalletUser | null>(() => {
    const users = SmartWalletRegistry.getUsers();
    return users.find(u => u.email === 'gxqstudio@gmail.com') || users[0] || null;
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [activeTokenProfile, setActiveTokenProfile] = useState<string | null>(null);
  const [preselectedSwapToken, setPreselectedSwapToken] = useState<string>('GXQ');
  const [markets, setMarkets] = useState<MarketSnapshot[]>([]);
  const [activeScoreModal, setActiveScoreModal] = useState<ScoreDetails | null>(null);
  const [flashType, setFlashType] = useState<string | null>(null);
  const [liveNotification, setLiveNotification] = useState<{ title: string; message: string } | null>(null);
  const [systemVersion, setSystemVersion] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Background refresh every 30 seconds for Command Center without user intervention
  const handleMarketRefresh = useCallback((freshSnapshots: MarketSnapshot[]) => {
    setMarkets(freshSnapshots);
  }, []);

  useMarketDataBackgroundRefresh(handleMarketRefresh, 30000);

  // Initialize Market Provider & WebSocket Streaming Subsystem
  useEffect(() => {
    marketProvider.connect();
    wsService.connect();

    const unsubMarket = marketProvider.subscribe((snapshots) => {
      setMarkets(snapshots);
      snapshots.forEach(snap => {
        const triggered = alertService.checkAlerts(snap.symbol, snap.price);
        triggered.forEach(alert => {
            setLiveNotification({
                title: 'Price Alert Triggered!',
                message: `${alert.tokenSymbol} reached $${alert.targetPrice}`,
            });
            triggerFlash('ORANGE_FLASH');
        });
      });
    });

    // Subscribe to WebSocket volatility alerts (triggers AI heuristic notification)
    const unsubVolatility = wsService.subscribe('volatility', (data: any) => {
      setLiveNotification({
        title: 'AI Heuristic Volatility Alert (WebSocket Stream)',
        message: data.message || `Volatility threshold crossed on ${data.symbol}: ${data.deltaPercent}%`,
      });
      triggerFlash('AI_INSIGHT_FLASH');
    });

    telemetry.log({
      eventType: 'page_view',
      network: currentEnv,
      payload: { route: activeTab, environment: currentEnv }
    });

    return () => {
      unsubMarket();
      unsubVolatility();
      marketProvider.disconnect();
      wsService.disconnect();
    };
  }, []);

  const handleSelectEnv = (env: GXQEnvironment) => {
    setCurrentEnv(env);
    errorMonitoring.setEnvironment(env);
    errorMonitoring.addBreadcrumb({
      category: 'navigation',
      message: `Active environment switched to ${env} (Chain ID: ${ENVIRONMENTS[env].chainId})`,
      level: 'info',
      data: { env, chainId: ENVIRONMENTS[env].chainId }
    });
    try {
      localStorage.setItem('gxq_active_env', env);
    } catch {
      // ignore
    }
    telemetry.log({
      eventType: 'contract_interaction',
      network: env,
      payload: { action: 'switch_environment', newEnvironment: env, chainId: ENVIRONMENTS[env].chainId }
    });
    triggerFlash('BLUE_FLASH');
  };

  const triggerFlash = (type: string) => {
    setFlashType(type);
    setTimeout(() => setFlashType(null), 600);
  };

  const handleLoginGoogle = async (targetEmail: string = 'gxqstudio@gmail.com') => {
    const user = await SmartWalletRegistry.authenticateWithGoogle(targetEmail, 'GXQ Studio Lead Architect', currentEnv);
    setCurrentUser(user);
    triggerFlash('SUCCESS_FLASH');
    telemetry.log({
      eventType: 'wallet_connect',
      network: currentEnv,
      actorAddress: user.smartWalletAddress,
      payload: { provider: user.provider, email: user.email, role: user.role }
    });
  };

  const handleSwitchUser = async (email: string) => {
    const users = SmartWalletRegistry.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = await SmartWalletRegistry.authenticateWithGoogle(email, email.split('@')[0], currentEnv);
    }
    setCurrentUser(user);
    triggerFlash('ORANGE_FLASH');
  };

  const handleDisconnect = () => {
    if (currentUser) {
      telemetry.log({
        eventType: 'wallet_disconnect',
        network: currentEnv,
        actorAddress: currentUser.smartWalletAddress,
        payload: { email: currentUser.email }
      });
    }
    setCurrentUser(null);
    triggerFlash('ORANGE_FLASH');
  };

  const handleClaimFaucet = async () => {
    if (!currentUser) {
      await handleLoginGoogle('gxqstudio@gmail.com');
    }
    const envConfig = ENVIRONMENTS[currentEnv];
    if (!envConfig.featureFlags.isFaucetEnabled) return;

    const correlationId = telemetry.generateCorrelationId();
    await explorerApi.recordTransaction({
      hash: `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')}`,
      blockNumber: 142985,
      timestamp: new Date().toISOString(),
      from: '0x0000000000000000000000000000000000000000',
      to: currentUser?.smartWalletAddress || '0x9a8B84B48107954e7d235cE6e5D3866E7943F5B8',
      value: '250.00',
      asset: 'GXQ',
      status: 'SUCCESS',
      method: 'faucetClaim',
      gasUsed: 21000,
      gasFee: '0.000021',
      correlationId,
    });

    telemetry.log({
      eventType: 'transaction_result',
      severity: 'INFO',
      network: currentEnv,
      actorAddress: currentUser?.smartWalletAddress,
      correlationId,
      payload: { method: 'faucetClaim', amount: 250, asset: 'GXQ' }
    });

    triggerFlash('SUCCESS_FLASH');
    alert(`250 ${envConfig.currency.symbol} claimed successfully to your Smart Wallet on ${envConfig.name}!`);
  };

  const envConfig = ENVIRONMENTS[currentEnv];
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'AUDITOR' || currentUser?.role === 'OPERATOR';

  let flashBorder = '';
  if (flashType === 'BLUE_FLASH') flashBorder = 'animate-flash-blue';
  if (flashType === 'ORANGE_FLASH') flashBorder = 'animate-flash-orange';
  if (flashType === 'SUCCESS_FLASH') flashBorder = 'animate-flash-green';
  if (flashType === 'RED_FLASH') flashBorder = 'animate-flash-red';
  if (flashType === 'AI_INSIGHT_FLASH') flashBorder = 'animate-flash-blue';

  return (
    <div className={`min-h-screen bg-[#030507] cyber-grid cyber-radial-glow relative transition-colors ${flashBorder}`}>
      
      {/* Real-time WebSocket Volatility Alert Toast */}
      {liveNotification && (
        <div className="fixed top-16 right-4 z-50 max-w-sm p-4 rounded-2xl bg-[#070B12]/95 border border-[#00A8FF]/40 shadow-2xl backdrop-blur-xl animate-fadeIn">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00A8FF]">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{liveNotification.title}</span>
            </div>
            <button
              onClick={() => setLiveNotification(null)}
              className="text-gray-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-gray-300 mt-1.5 leading-relaxed font-mono">
            {liveNotification.message}
          </p>
        </div>
      )}

      {/* Header */}
      <Header
        currentEnv={currentEnv}
        currentUser={currentUser}
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab as NavigationTab)}
        onOpenMenuSlider={() => setMobileMenuOpen(true)}
        triggerFlash={triggerFlash}
        onSelectEnv={handleSelectEnv}
      />

      {/* Main Persistent Layout Shell with Menu Slider */}
      <Shell
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
          errorMonitoring.addBreadcrumb({
            category: 'navigation',
            message: `User navigated to tab: ${tab}`,
            level: 'info'
          });
        }}
        isAdmin={isAdmin}
        currentEnv={currentEnv}
        onSelectEnv={handleSelectEnv}
        currentUser={currentUser}
        onLoginGoogle={handleLoginGoogle}
        onDisconnectWallet={handleDisconnect}
        onClaimFaucet={handleClaimFaucet}
        onNavigateToAdmin={() => {
          setActiveTab('admin');
          setMobileMenuOpen(false);
        }}
        triggerFlash={triggerFlash}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      >
        <ErrorBoundary componentName={`Module_${activeTab}`} fallbackTitle={`${activeTab.toUpperCase()} Module Isolated`}>
        {activeTab === 'overview' && (
            <CommandCenter
              envConfig={envConfig}
              user={currentUser}
              markets={markets}
              topInsight={AI_INSIGHTS[0]}
              portfolioScore={SCORE_DATABASE.portfolioHealth}
              onOpenScoreBreakdown={setActiveScoreModal}
              onNavigate={(t) => setActiveTab(t)}
              onClaimFaucet={handleClaimFaucet}
              triggerFlash={triggerFlash}
            />
        )}

        {activeTab === 'markets' && (
          <MarketsModule
            markets={markets}
            onNavigateToSwap={() => setActiveTab('swap')}
          />
        )}

        {activeTokenProfile ? (
          <TokenProfileModule
            tokenSymbol={activeTokenProfile}
          />
        ) : (
          <>
            {activeTab === 'overview' && (
              <CommandCenter
                envConfig={envConfig}
                user={currentUser}
                markets={markets}
                onClaimFaucet={handleClaimFaucet}
                triggerFlash={triggerFlash}
                topInsight={AI_INSIGHTS[0]}
                portfolioScore={SCORE_DATABASE.portfolioHealth}
                onOpenScoreBreakdown={setActiveScoreModal}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'swap' && (
              <SwapModule
                envConfig={envConfig}
                user={currentUser}
                onRequireLogin={() => handleLoginGoogle('gxqstudio@gmail.com')}
                triggerFlash={triggerFlash}
                onTxCompleted={() => {}}
                initialFromToken={preselectedSwapToken}
                initialToToken={preselectedSwapToken === 'USDC' ? 'GXQ' : 'USDC'}
              />
            )}
            {activeTab === 'stake' && (
              <StakeModule
                envConfig={envConfig}
                user={currentUser}
                onRequireLogin={() => handleLoginGoogle('gxqstudio@gmail.com')}
                triggerFlash={triggerFlash}
              />
            )}
            {activeTab === 'launchpad' && (
              <LaunchpadModule
                envConfig={envConfig}
                user={currentUser}
                onRequireLogin={() => handleLoginGoogle('gxqstudio@gmail.com')}
                triggerFlash={triggerFlash}
                onTxCompleted={() => {}}
                onNavigateToSwap={(tokenSymbol) => {
                  setPreselectedSwapToken(tokenSymbol);
                  setActiveTab('swap');
                }}
              />
            )}
            {activeTab === 'bridge' && (
              <MultichainBridgeModule
                currentUser={currentUser}
                triggerFlash={triggerFlash}
                onRequireLogin={() => handleLoginGoogle('gxqstudio@gmail.com')}
              />
            )}
            {activeTab === 'explorer' && (
              <ExplorerModule
                envConfig={envConfig}
                triggerFlash={triggerFlash}
              />
            )}
            {activeTab === 'architecture' && <ArchitectureDiagramModule />}
            {activeTab === 'enterprise' && (
              <EnterpriseEditionModule
                currentUser={currentUser}
                triggerFlash={triggerFlash}
              />
            )}
            {activeTab === 'whitepaper' && <WhitepaperModule />}
            {activeTab === 'brand' && <BrandIdentityModule />}
            {activeTab === 'portfolio' && (
              <PortfolioModule
                envConfig={envConfig}
                user={currentUser}
                portfolioScore={SCORE_DATABASE.portfolioHealth}
                onOpenScoreBreakdown={setActiveScoreModal}
                onRequireLogin={() => handleLoginGoogle('gxqstudio@gmail.com')}
              />
            )}
            {activeTab === 'ai' && (
              <AIIntelligenceModule
                onOpenScoreBreakdown={setActiveScoreModal}
                triggerFlash={triggerFlash}
              />
            )}
            {activeTab === 'cypress' && (
              <CypressRunnerModule
                envConfig={envConfig}
                triggerFlash={triggerFlash}
              />
            )}
            {activeTab === 'security' && (
              <SecurityCenterModule
                currentUser={currentUser}
              />
            )}
            {activeTab === 'admin' && (
              <AdminGuard user={currentUser}>
                <AdminModule
                  currentUser={currentUser}
                  triggerFlash={triggerFlash}
                  onRefreshSystem={() => {
                    setSystemVersion((v) => v + 1);
                    triggerFlash('BLUE_FLASH');
                  }}
                  onSwitchUser={handleSwitchUser}
                  onExitAdmin={() => setActiveTab('overview')}
                  currentEnv={currentEnv}
                />
              </AdminGuard>
            )}
            {activeTab === 'guide' && <UserGuideModule />}
          </>
        )}

        {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
        </ErrorBoundary>
      </Shell>

      {/* Verifiable Score Factor Breakdown Modal */}
      <ScoreBreakdownModal
        score={activeScoreModal}
        onClose={() => setActiveScoreModal(null)}
      />
    </div>
  );
}
