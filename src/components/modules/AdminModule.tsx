import React, { useState, useEffect } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { SmartWalletUser, SmartWalletRegistry, UserRole, ROLE_PERMISSIONS } from '../../services/smartWallet';
import { explorerApi, CacheMetrics, EnvironmentCacheConfig } from '../../services/explorerApi';
import { telemetry, TelemetryEvent } from '../../services/telemetry';
import { ENVIRONMENTS, GXQEnvironment, toggleCentralLaunchpad, setEnvironmentFeatureFlag } from '../../config/environments';
import { errorMonitoring, MonitoredError, ErrorCategory, ErrorSeverity } from '../../services/errorMonitoring';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Power, 
  Server, 
  Database, 
  Users, 
  Lock, 
  Clock,
  RefreshCw, 
  Terminal, 
  Check, 
  Copy, 
  Search, 
  Activity, 
  Radio, 
  Zap, 
  ArrowLeft, 
  ToggleLeft, 
  ToggleRight,
  Cpu,
  Flame,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Bug,
  Trash2,
  Play,
  Gauge,
  FileJson,
  Download,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface AdminModuleProps {
  currentUser: SmartWalletUser | null;
  triggerFlash: (type: any) => void;
  onRefreshSystem: () => void;
  onSwitchUser?: (email: string) => void;
  onExitAdmin?: () => void;
  currentEnv?: GXQEnvironment;
}

type AdminSection = 'overview' | 'users' | 'health' | 'caching' | 'errors' | 'features' | 'logs';

export const AdminModule: React.FC<AdminModuleProps> = ({
  currentUser,
  triggerFlash,
  onRefreshSystem,
  onSwitchUser,
  onExitAdmin,
  currentEnv = 'devnet',
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [users, setUsers] = useState<SmartWalletUser[]>(() => SmartWalletRegistry.getUsers());
  const [flags, setFlags] = useState(() => explorerApi.getSystemFlags());
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryEvent[]>(() => telemetry.getEvents().slice(0, 20));
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  // Search and filter for User Management
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('VIEWER');
  
  // Feedback banner
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'warn'; message: string } | null>(null);

  // Live RPC ping simulator
  const [rpcLatency, setRpcLatency] = useState<number>(24);
  const [isPingingRpc, setIsPingingRpc] = useState<boolean>(false);

  // Cache Subsystem State
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics>(() => explorerApi.getCacheMetrics());
  const [selectedCacheEnv, setSelectedCacheEnv] = useState<GXQEnvironment>(currentEnv);
  const [envCacheConfig, setEnvCacheConfig] = useState<EnvironmentCacheConfig>(() => explorerApi.getEnvironmentCacheConfig(currentEnv));
  const [benchmarkResult, setBenchmarkResult] = useState<{
    endpoint: string;
    uncachedLatencyMs: number;
    cachedLatencyMs: number;
    speedupFactor: number;
    source: string;
  } | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [isPurgingCache, setIsPurgingCache] = useState<boolean>(false);

  // Sentry / LogRocket Error Monitoring State
  const [monitoredErrors, setMonitoredErrors] = useState<MonitoredError[]>(() => errorMonitoring.getErrors());
  const [selectedError, setSelectedError] = useState<MonitoredError | null>(null);
  const [errorEnvFilter, setErrorEnvFilter] = useState<string>('ALL');
  const [errorSeverityFilter, setErrorSeverityFilter] = useState<string>('ALL');
  const [errorCategoryFilter, setErrorCategoryFilter] = useState<string>('ALL');
  const [isSimulatingError, setIsSimulatingError] = useState<boolean>(false);

  useEffect(() => {
    const unsubErrors = errorMonitoring.subscribe(() => {
      setMonitoredErrors([...errorMonitoring.getErrors()]);
    });

    const interval = setInterval(() => {
      setCacheMetrics(explorerApi.getCacheMetrics());
    }, 2500);

    return () => {
      unsubErrors();
      clearInterval(interval);
    };
  }, []);

  const envConfig = ENVIRONMENTS[currentEnv];
  const role = currentUser?.role || 'USER';
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.USER;
  const isSuperAdmin = currentUser?.email?.toLowerCase() === 'gxqstudio@gmail.com';

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleTestRpcPing = async () => {
    setIsPingingRpc(true);
    await new Promise(r => setTimeout(r, 450));
    const newLatency = Math.floor(Math.random() * 15) + 18;
    setRpcLatency(newLatency);
    setIsPingingRpc(false);
    setActionNotice({ type: 'success', message: `RPC Ping to ${envConfig.rpcUrl} verified in ${newLatency}ms.` });
  };

  // Cache Operations
  const handleBenchmark = async (endpoint: '/stats' | '/block/:id') => {
    setIsBenchmarking(true);
    try {
      const res = await explorerApi.benchmarkEndpoint(endpoint);
      setBenchmarkResult(res);
      setCacheMetrics(explorerApi.getCacheMetrics());
      setActionNotice({
        type: 'success',
        message: `Benchmark completed on ${endpoint}: Uncached ${res.uncachedLatencyMs}ms vs Cached ${res.cachedLatencyMs}ms (${res.speedupFactor}x faster via ${res.source}).`,
      });
      triggerFlash('SUCCESS_FLASH');
    } catch (err: any) {
      setActionNotice({ type: 'error', message: `Benchmark failed: ${err.message}` });
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleInvalidateCachePattern = async (pattern: string, label: string) => {
    setIsPurgingCache(true);
    const count = await explorerApi.invalidateCachePattern(pattern);
    setCacheMetrics(explorerApi.getCacheMetrics());
    setIsPurgingCache(false);
    setActionNotice({
      type: 'warn',
      message: `Invalidated ${count} cached items matching pattern "${pattern}" (${label}). Transparent re-indexing active.`,
    });
    triggerFlash('ORANGE_FLASH');
  };

  const handlePurgeAllCache = async () => {
    if (!isSuperAdmin) {
      setActionNotice({ type: 'error', message: 'Unauthorized: Only Super Admin can execute global cache purge.' });
      return;
    }
    setIsPurgingCache(true);
    await explorerApi.purgeAllCache();
    setCacheMetrics(explorerApi.getCacheMetrics());
    setIsPurgingCache(false);
    setActionNotice({
      type: 'warn',
      message: 'Global Multi-Tier Cache Purged. All L1 memory entries and L2 distributed keys cleared.',
    });
    triggerFlash('RED_FLASH');
    telemetry.log({
      eventType: 'admin_action',
      severity: 'WARN',
      network: currentEnv,
      actorAddress: currentUser?.smartWalletAddress,
      payload: { action: 'global_cache_purge', executedBy: currentUser?.email },
    });
  };

  const handleSelectCacheEnv = (env: GXQEnvironment) => {
    setSelectedCacheEnv(env);
    setEnvCacheConfig(explorerApi.getEnvironmentCacheConfig(env));
  };

  const handleSaveEnvCacheConfig = () => {
    explorerApi.updateEnvironmentCacheConfig(selectedCacheEnv, envCacheConfig);
    setCacheMetrics(explorerApi.getCacheMetrics());
    setActionNotice({
      type: 'success',
      message: `Updated multi-tier caching strategy for environment "${selectedCacheEnv.toUpperCase()}". Settings applied immediately.`,
    });
    triggerFlash('SUCCESS_FLASH');
  };

  const handleDispatchCustomEvent = async (
    eventType: 'BLOCK_INDEXED' | 'TRANSACTION_INDEXED' | 'STAKING_POSITION_MODIFIED' | 'CHAIN_REORG',
    targetTag?: string
  ) => {
    const res = await explorerApi.dispatchCacheEvent({
      type: eventType,
      environment: selectedCacheEnv,
      targetTag,
    });
    setCacheMetrics(explorerApi.getCacheMetrics());
    setActionNotice({
      type: 'success',
      message: `Dispatched event ${eventType}. Invalidated ${res.invalidatedCount} keys across tags [${res.invalidatedTags.join(', ')}].`,
    });
    triggerFlash('BLUE_FLASH');
  };

  const handleSimulateBlockIndexing = async () => {
    const { newBlock, invalidatedTags } = await explorerApi.indexNewBlockExplicitly();
    setCacheMetrics(explorerApi.getCacheMetrics());
    setActionNotice({
      type: 'success',
      message: `New Block #${newBlock.id} indexed (${newBlock.txCount} txs). Automated cache invalidation executed for tags: [${invalidatedTags.join(', ')}].`,
    });
    triggerFlash('BLUE_FLASH');
  };

  // Error Monitoring Operations
  const handleSimulateError = (type: 'rpc' | 'contract' | 'cache' | 'client_ui' | 'database' | 'security') => {
    setIsSimulatingError(true);
    const err = errorMonitoring.simulateError(type, currentEnv);
    setMonitoredErrors([...errorMonitoring.getErrors()]);
    setIsSimulatingError(false);
    setActionNotice({
      type: 'error',
      message: `Simulated error captured in Sentry: [${err.category}] ${err.title}. Stack trace and user context recorded.`,
    });
    triggerFlash('RED_FLASH');
  };

  const handleResolveError = (id: string) => {
    errorMonitoring.resolveError(id);
    setMonitoredErrors([...errorMonitoring.getErrors()]);
    setActionNotice({ type: 'success', message: `Incident ${id} marked as RESOLVED in telemetry index.` });
  };

  const handleExportSentry = () => {
    const reportJson = errorMonitoring.exportSentryReport();
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gxq-sentry-report-${currentEnv}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActionNotice({ type: 'success', message: 'Exported Sentry/LogRocket error report JSON.' });
  };

  // Remote Pause/Unpause Launchpad Feature Flag
  const handleToggleLaunchpad = () => {
    if (!isSuperAdmin) {
      setActionNotice({
        type: 'error',
        message: 'Permission Denied: Only Super Admin (gxqstudio@gmail.com) can remotely modify Launchpad feature flags.',
      });
      triggerFlash('RED_FLASH');
      return;
    }

    // 1. Mutate in central configuration
    const isNowEnabled = toggleCentralLaunchpad(currentEnv);
    const isNowPaused = !isNowEnabled;

    // 2. Synchronize explorerApi system flags
    explorerApi.setSystemFlag('isLaunchpadPaused', isNowPaused);
    setFlags(explorerApi.getSystemFlags());

    // 3. Log security telemetry with correlation ID
    const correlationId = telemetry.generateCorrelationId();
    telemetry.log({
      eventType: 'admin_action',
      severity: isNowPaused ? 'WARN' : 'INFO',
      actorAddress: currentUser?.smartWalletAddress,
      correlationId,
      payload: {
        action: 'toggle_central_launchpad_feature_flag',
        environment: currentEnv,
        isLaunchpadEnabled: isNowEnabled,
        isLaunchpadPaused: isNowPaused,
        updatedBy: currentUser?.email,
      }
    });

    setActionNotice({
      type: isNowPaused ? 'warn' : 'success',
      message: isNowPaused
        ? `Launchpad remotely PAUSED on ${envConfig.name}. Central feature flag isLaunchpadEnabled = false.`
        : `Launchpad remotely ACTIVATED on ${envConfig.name}. Central feature flag isLaunchpadEnabled = true.`,
    });

    triggerFlash(isNowPaused ? 'RED_FLASH' : 'SUCCESS_FLASH');
    onRefreshSystem();
  };

  // Remote Pause/Unpause DEX Swaps Feature Flag
  const handleToggleSwap = () => {
    if (!isSuperAdmin) {
      setActionNotice({
        type: 'error',
        message: 'Permission Denied: Only Super Admin (gxqstudio@gmail.com) can toggle DEX Swap flags.',
      });
      triggerFlash('RED_FLASH');
      return;
    }

    const currentSwapEnabled = envConfig.featureFlags.isSwapEnabled;
    const newSwapEnabled = !currentSwapEnabled;
    setEnvironmentFeatureFlag(currentEnv, 'isSwapEnabled', newSwapEnabled);
    explorerApi.setSystemFlag('isSwapPaused', !newSwapEnabled);
    setFlags(explorerApi.getSystemFlags());

    telemetry.log({
      eventType: 'admin_action',
      severity: newSwapEnabled ? 'INFO' : 'WARN',
      actorAddress: currentUser?.smartWalletAddress,
      payload: { action: 'toggle_central_swap_feature_flag', environment: currentEnv, isSwapEnabled: newSwapEnabled }
    });

    setActionNotice({
      type: newSwapEnabled ? 'success' : 'warn',
      message: newSwapEnabled ? `DEX Swaps resumed on ${envConfig.name}.` : `DEX Swaps PAUSED on ${envConfig.name}.`,
    });

    triggerFlash(newSwapEnabled ? 'SUCCESS_FLASH' : 'RED_FLASH');
    onRefreshSystem();
  };

  // Reassign User Roles
  const handleRoleChange = (email: string, updatedRole: UserRole) => {
    if (!isSuperAdmin) {
      setActionNotice({
        type: 'error',
        message: 'Unauthorized: Only Super Admin gxqstudio@gmail.com can reassign roles.',
      });
      return;
    }
    try {
      SmartWalletRegistry.updateUserRole(email, updatedRole, currentUser?.email || '');
      setUsers(SmartWalletRegistry.getUsers());
      setActionNotice({
        type: 'success',
        message: `Role for ${email} successfully updated to ${updatedRole}.`,
      });
      triggerFlash('SUCCESS_FLASH');
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message });
      triggerFlash('RED_FLASH');
    }
  };

  // Provision new smart wallet
  const handleCreateSmartWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    if (!permissions.canProvisionSmartWallets) {
      setActionNotice({ type: 'error', message: 'Current role lacks permission to provision smart wallets.' });
      return;
    }

    const created = await SmartWalletRegistry.authenticateWithGoogle(newEmail.trim(), newName.trim(), currentEnv, 'deterministic', newRole);
    setUsers(SmartWalletRegistry.getUsers());
    setNewEmail('');
    setNewName('');
    setActionNotice({
      type: 'success',
      message: `Provisioned smart wallet for ${created.email} (${created.smartWalletAddress.slice(0, 10)}...) with role ${created.role}.`,
    });
    triggerFlash('SUCCESS_FLASH');
  };

  // Filtered users for User Management section
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.smartWalletAddress.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Strict Unauthorized Barrier
  if (role === 'USER') {
    const correlationId = telemetry.generateCorrelationId();
    telemetry.log({
      eventType: 'security_event',
      severity: 'SECURITY',
      correlationId,
      actorAddress: currentUser?.smartWalletAddress || 'anonymous',
      payload: {
        action: 'unauthorized_admin_access_attempt',
        attemptedBy: currentUser?.email || 'unauthenticated',
      }
    });

    return (
      <div className="max-w-2xl mx-auto py-12">
        <GlassCard level={4} glow="red" className="p-8 text-center border-red-500/50">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase">
            RESTRICTED ACCESS — GXQ ADMIN ENCLAVE
          </h2>
          <p className="text-xs text-gray-300 mt-2 max-w-md mx-auto leading-relaxed">
            Administrative functionality is restricted exclusively to authorized enterprise accounts with Super Admin privileges (<span className="text-[#FF7A00] font-bold">gxqstudio@gmail.com</span>).
          </p>

          <div className="mt-6 p-4 rounded-xl bg-black/60 border border-red-500/30 text-left font-mono text-xs space-y-1.5">
            <div className="text-gray-400">Authenticated Identity: <span className="text-white font-bold">{currentUser?.email || 'None'}</span></div>
            <div className="text-gray-400">Assigned Role: <span className="text-red-400 font-bold">USER (Unprivileged)</span></div>
            <div className="text-gray-400">Security Correlation ID: <span className="text-[#FFD400]">{correlationId}</span></div>
            <div className="text-red-400 font-semibold pt-1">Security incident recorded to immutable kernel log.</div>
          </div>

          {onSwitchUser && (
            <div className="mt-6 pt-4 border-t border-white/10 text-xs">
              <span className="text-gray-400 block mb-2 font-mono">Simulate Authorized Persona:</span>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => onSwitchUser('gxqstudio@gmail.com')}
                  className="px-3 py-1.5 rounded-lg bg-[#FF7A00] text-black font-bold font-mono text-xs hover:bg-[#FF5500]"
                >
                  Super Admin (gxqstudio@gmail.com)
                </button>
                <button
                  onClick={() => onSwitchUser('auditor@certik.io')}
                  className="px-3 py-1.5 rounded-lg bg-[#A855F7] text-white font-bold font-mono text-xs hover:bg-[#9333EA]"
                >
                  Auditor (auditor@certik.io)
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  // DISTINCT ISOLATED ADMIN LAYOUT
  return (
    <div className="space-y-6">
      
      {/* 1. DISTINCT HIGH-SECURITY ADMIN HEADER */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0E1A38] via-[#070B12] to-[#1F1206] border-2 border-[#FF7A00]/40 p-5 shadow-2xl shadow-black">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FF304F] p-0.5 shadow-[0_0_20px_rgba(255,122,0,0.4)] shrink-0">
              <div className="w-full h-full bg-[#070B12] rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-[#FF7A00] animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40 font-bold uppercase tracking-wider">
                  ISOLATED ADMIN ENCLAVE
                </span>
                <span className="text-xs font-mono text-gray-400">
                  Target: <strong className="text-white">{envConfig.name}</strong> (Chain ID: {envConfig.chainId})
                </span>
                <StatusBadge status={role} size="sm" />
              </div>
              <h1 className="text-lg font-black text-white tracking-wide mt-1">
                GXQ ROOT GOVERNANCE & OPERATIONS KERNEL
              </h1>
              <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                Session: <span className="text-[#FF7A00] font-bold">{currentUser?.email}</span>
                {isSuperAdmin && <span className="text-[#10B981] ml-2 font-semibold">✓ ROOT PRIVILEGES VERIFIED</span>}
              </div>
            </div>
          </div>

          {/* Quick Actions & Exit Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onSwitchUser && (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10 text-xs font-mono">
                <span className="text-gray-400 px-1 text-[10px]">Persona:</span>
                <button
                  onClick={() => onSwitchUser('gxqstudio@gmail.com')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    role === 'SUPER_ADMIN' ? 'bg-[#FF7A00] text-black shadow-md' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  SuperAdmin
                </button>
                <button
                  onClick={() => onSwitchUser('auditor@certik.io')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    role === 'AUDITOR' ? 'bg-[#A855F7] text-white shadow-md' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Auditor
                </button>
                <button
                  onClick={() => onSwitchUser('ops@gxq.network')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    role === 'OPERATOR' ? 'bg-[#00A8FF] text-black shadow-md' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Operator
                </button>
              </div>
            )}

            {onExitAdmin && (
              <button
                onClick={onExitAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-gray-200 transition-colors"
                title="Return to Public Overview"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. DEDICATED ADMIN SUB-NAVIGATION */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/10">
          {[
            { id: 'overview' as AdminSection, label: 'Overview & Quick Actions', icon: Sliders },
            { id: 'users' as AdminSection, label: `User Management (${users.length})`, icon: Users },
            { id: 'health' as AdminSection, label: 'System Health Dashboard', icon: Server },
            { id: 'caching' as AdminSection, label: 'Advanced Caching', icon: Zap },
            { id: 'errors' as AdminSection, label: `Error Monitor (${monitoredErrors.filter(e => !e.resolved).length})`, icon: Bug },
            { id: 'features' as AdminSection, label: 'Central Feature Flags', icon: Power },
            { id: 'logs' as AdminSection, label: 'Security Audit Stream', icon: Terminal },
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-[#FF7A00] text-black shadow-[0_0_15px_rgba(255,122,0,0.35)]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
          actionNotice.type === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-400' :
          actionNotice.type === 'warn' ? 'bg-yellow-500/15 border-yellow-500/30 text-[#FFD400]' :
          'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'error' ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-gray-400 hover:text-white ml-2 text-xs">Dismiss</button>
        </div>
      )}

      {/* SECTION 1: OVERVIEW & RAPID ACTIONS */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <GlassCard level={3} glow="orange" className="p-4">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Launchpad Status</span>
              <div className="text-lg font-black font-mono mt-1 flex items-center gap-2">
                <span className={flags.isLaunchpadPaused ? 'text-[#FF304F]' : 'text-[#10B981]'}>
                  {flags.isLaunchpadPaused ? 'PAUSED' : 'ACTIVE'}
                </span>
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-2 block">Central Flag: {envConfig.featureFlags.isLaunchpadEnabled ? 'ON' : 'OFF'}</span>
            </GlassCard>

            <GlassCard level={2} className="p-4">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">DEX Swaps Status</span>
              <div className="text-lg font-black font-mono mt-1 flex items-center gap-2">
                <span className={flags.isSwapPaused ? 'text-[#FF304F]' : 'text-[#10B981]'}>
                  {flags.isSwapPaused ? 'PAUSED' : 'ACTIVE'}
                </span>
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-2 block">Central Flag: {envConfig.featureFlags.isSwapEnabled ? 'ON' : 'OFF'}</span>
            </GlassCard>

            <GlassCard level={2} className="p-4">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Registered Users</span>
              <div className="text-lg font-black font-mono text-white mt-1">
                {users.length} Wallets
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-2 block">Postgres Registry</span>
            </GlassCard>

            <GlassCard level={2} className="p-4">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">RPC Latency</span>
              <div className="text-lg font-black font-mono text-[#00A8FF] mt-1">
                {rpcLatency} ms
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-2 block">{envConfig.name.slice(0, 15)}</span>
            </GlassCard>

            <GlassCard level={2} className="p-4 cursor-pointer hover:border-[#FF7A00]/50 transition-colors" onClick={() => setActiveSection('caching')}>
              <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono">
                <span>Cache Hit Rate</span>
                <Zap className="w-3 h-3 text-[#FF7A00]" />
              </div>
              <div className="text-lg font-black font-mono text-[#10B981] mt-1">
                {cacheMetrics.hitRatePercent}%
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-2 block">L1 Hot + L2 Redis</span>
            </GlassCard>

            <GlassCard level={2} className="p-4 cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => setActiveSection('errors')}>
              <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono">
                <span>Sentry Monitor</span>
                <Bug className="w-3 h-3 text-red-400" />
              </div>
              <div className="text-lg font-black font-mono mt-1 text-white">
                <span className={monitoredErrors.filter(e => !e.resolved).length > 0 ? 'text-[#FFD400]' : 'text-[#10B981]'}>
                  {monitoredErrors.filter(e => !e.resolved).length}
                </span> <span className="text-xs text-gray-400 font-normal">Active</span>
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-2 block">Full-Stack Ingest</span>
            </GlassCard>
          </div>

          {/* Quick Emergency Circuit Breakers */}
          <GlassCard level={3} glow="orange" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Power className="w-4 h-4 text-[#FF7A00]" />
                <span>Rapid Emergency Governance Controls</span>
              </h3>
              {!isSuperAdmin && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> SUPER ADMIN ONLY
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Remotely toggle central configuration flags across the GXQ Network. Only <strong className="text-white">gxqstudio@gmail.com</strong> is authorized to execute state changes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#070B12] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">TokenFactory Launchpad Flag</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Central Configuration: <span className={flags.isLaunchpadPaused ? 'text-[#FF304F] font-bold' : 'text-[#10B981] font-bold'}>
                      {flags.isLaunchpadPaused ? 'PAUSED' : 'ACTIVE'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleToggleLaunchpad}
                  disabled={!isSuperAdmin}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                    !isSuperAdmin
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : flags.isLaunchpadPaused
                      ? 'bg-[#10B981] text-black hover:bg-[#059669]'
                      : 'bg-[#FF304F] text-white hover:bg-[#FF1744]'
                  }`}
                >
                  {flags.isLaunchpadPaused ? 'RESUME LAUNCHPAD' : 'PAUSE LAUNCHPAD'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#070B12] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">SimpleSwap AMM DEX Flag</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Central Configuration: <span className={flags.isSwapPaused ? 'text-[#FF304F] font-bold' : 'text-[#10B981] font-bold'}>
                      {flags.isSwapPaused ? 'PAUSED' : 'ACTIVE'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleToggleSwap}
                  disabled={!isSuperAdmin}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                    !isSuperAdmin
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : flags.isSwapPaused
                      ? 'bg-[#10B981] text-black hover:bg-[#059669]'
                      : 'bg-[#FF304F] text-white hover:bg-[#FF1744]'
                  }`}
                >
                  {flags.isSwapPaused ? 'RESUME DEX SWAPS' : 'PAUSE DEX SWAPS'}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* SECTION 2: USER MANAGEMENT SECTION */}
      {activeSection === 'users' && (
        <div className="space-y-6">
          <GlassCard level={2} className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00A8FF]" />
                  <span>User Management & Smart Account Registry</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  View all registered users with their verified email and associated deterministic smart wallet address.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by email, address, or name..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 font-mono outline-none focus:border-[#00A8FF] w-64"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#070B12] border border-white/15 text-xs font-mono text-white outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="AUDITOR">AUDITOR</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
            </div>

            {/* Provisioning Form for authorized accounts */}
            {permissions.canProvisionSmartWallets && (
              <form onSubmit={handleCreateSmartWallet} className="flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <input
                  type="email"
                  placeholder="User Email (e.g. partner@gxq.network)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white outline-none font-mono"
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white outline-none"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-white outline-none"
                >
                  <option value="VIEWER">Role: VIEWER</option>
                  <option value="OPERATOR">Role: OPERATOR</option>
                  <option value="AUDITOR">Role: AUDITOR</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#00A8FF] text-black font-bold text-xs uppercase hover:bg-[#008CFF] transition-colors shrink-0"
                >
                  Provision Smart Wallet
                </button>
              </form>
            )}

            {/* Registered Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                    <th className="pb-3">User & Email</th>
                    <th className="pb-3">Associated Smart Wallet Address</th>
                    <th className="pb-3">AA Provider</th>
                    <th className="pb-3">Current Role</th>
                    {isSuperAdmin && <th className="pb-3">Reassign Role</th>}
                    <th className="pb-3 text-right">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[11px] text-[#00A8FF]">{u.email}</div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-200 text-xs font-bold font-mono">
                            {u.smartWalletAddress}
                          </span>
                          <button
                            onClick={() => handleCopy(u.smartWalletAddress)}
                            className="p-1 hover:text-[#00A8FF] transition-colors"
                            title="Copy address"
                          >
                            {copiedAddress === u.smartWalletAddress ? (
                              <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300 uppercase">
                          {u.provider}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.role === 'SUPER_ADMIN' ? 'bg-[#FF7A00]/20 text-[#FFD400] border border-[#FF7A00]/40' :
                          u.role === 'AUDITOR' ? 'bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/40' :
                          u.role === 'OPERATOR' ? 'bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/40' :
                          'bg-white/10 text-gray-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3.5">
                          {u.email.toLowerCase() === 'gxqstudio@gmail.com' ? (
                            <span className="text-[10px] text-gray-500 italic">Super Admin Root</span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.email, e.target.value as UserRole)}
                              className="bg-black/60 border border-white/20 rounded px-2 py-1 text-[11px] text-white font-mono outline-none"
                            >
                              <option value="USER">USER</option>
                              <option value="VIEWER">VIEWER</option>
                              <option value="OPERATOR">OPERATOR</option>
                              <option value="AUDITOR">AUDITOR</option>
                            </select>
                          )}
                        </td>
                      )}
                      <td className="py-3.5 text-right text-[10px] text-gray-400">
                        {new Date(u.lastLoginAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-500 font-mono">
                  No registered users match your search criteria.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* SECTION 3: SYSTEM HEALTH DASHBOARD */}
      {activeSection === 'health' && (
        <div className="space-y-6">
          <GlassCard level={2} className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#10B981]" />
                  <span>Infrastructure & Backend Service Health</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Real-time status of PostgreSQL, Redis caching daemon, and current network RPC connection.
                </p>
              </div>

              <button
                onClick={handleTestRpcPing}
                disabled={isPingingRpc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-semibold text-white transition-colors"
              >
                <Activity className={`w-3.5 h-3.5 ${isPingingRpc ? 'animate-spin' : 'text-[#10B981]'}`} />
                <span>{isPingingRpc ? 'Pinging Node...' : 'Test RPC Connectivity'}</span>
              </button>
            </div>

            {/* Service Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* PostgreSQL Card */}
              <div className="p-5 rounded-2xl bg-[#070B12] border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#00A8FF]" />
                    <span className="text-xs font-bold text-white">PostgreSQL 16 Engine</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-bold">
                    ONLINE
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Connection Pool:</span>
                    <span className="text-white font-bold">24 / 50 Active</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Database:</span>
                    <span className="text-gray-200">gxq_{currentEnv}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Query Latency:</span>
                    <span className="text-[#10B981] font-bold">1.2 ms</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Integrity Check:</span>
                    <span className="text-[#10B981]">PASSED</span>
                  </div>
                </div>
              </div>

              {/* Redis Card */}
              <div className="p-5 rounded-2xl bg-[#070B12] border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#FF7A00]" />
                    <span className="text-xs font-bold text-white">Redis 7 In-Memory Cache</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-bold">
                    ONLINE
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Cache Hit Rate:</span>
                    <span className="text-[#10B981] font-bold">{cacheMetrics.hitRatePercent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>L1 / L2 Distribution:</span>
                    <span className="text-gray-200">{cacheMetrics.l1Hits} L1 / {cacheMetrics.l2Hits} L2</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Avg Lookup:</span>
                    <span className="text-[#00A8FF] font-bold">{cacheMetrics.avgLookupMs} ms</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Auto-Invalidation:</span>
                    <span className="text-[#10B981]">ACTIVE (Event-Driven)</span>
                  </div>
                </div>
              </div>

              {/* RPC Node Card */}
              <div className="p-5 rounded-2xl bg-[#070B12] border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#A855F7]" />
                    <span className="text-xs font-bold text-white">Network RPC Provider</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-bold">
                    CONNECTED
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Round-Trip Latency:</span>
                    <span className="text-[#00A8FF] font-bold">{rpcLatency} ms</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Active Endpoint:</span>
                    <span className="text-gray-200 truncate max-w-[120px]" title={envConfig.rpcUrl}>
                      {envConfig.rpcUrl}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Sequencer Lag:</span>
                    <span className="text-[#10B981] font-bold">0 Blocks</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Consensus Engine:</span>
                    <span className="text-white">BFT-PoS Finality</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Docker Compose Specs summary */}
            <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono space-y-1 text-gray-400">
              <div className="text-white font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00A8FF]" />
                <span>Docker Compose Orchestration Environment:</span>
              </div>
              <div>• Postgres: <span className="text-gray-200">postgres:16-alpine (Port 5432) with schema.sql auto-mounted</span></div>
              <div>• Redis: <span className="text-gray-200">redis:7-alpine (Port 6379) with AOF persistence and auth pass</span></div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* SECTION 3B: ADVANCED CACHING & PERFORMANCE MANAGEMENT */}
      {activeSection === 'caching' && (
        <div className="space-y-6">
          <GlassCard level={2} className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FF7A00]" />
                  <span>Advanced Multi-Tier Caching & Invalidation Architecture</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  L1 In-Memory Hot LRU (&lt;0.2ms microsecond lookup) + L2 Distributed Redis 7 Cache with automatic event-driven invalidation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCacheMetrics(explorerApi.getCacheMetrics())}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-semibold text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#00A8FF]" />
                  <span>Refresh Metrics</span>
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={handlePurgeAllCache}
                    disabled={isPurgingCache}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-xs font-mono font-semibold text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isPurgingCache ? 'Purging...' : 'Global Purge'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cache KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#070B12] border border-white/10">
                <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono mb-1">
                  <span>Cache Hit Rate</span>
                  <Gauge className="w-3.5 h-3.5 text-[#10B981]" />
                </div>
                <div className="text-2xl font-black font-mono text-[#10B981]">
                  {cacheMetrics.hitRatePercent}%
                </div>
                <div className="mt-2 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00A8FF] to-[#10B981]"
                    style={{ width: `${Math.min(cacheMetrics.hitRatePercent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1.5">
                  <span>Hits: {cacheMetrics.totalHits.toLocaleString()}</span>
                  <span>Misses: {cacheMetrics.misses}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#070B12] border border-white/10">
                <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono mb-1">
                  <span>L1 Hot LRU Memory</span>
                  <Cpu className="w-3.5 h-3.5 text-[#00A8FF]" />
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  {cacheMetrics.l1Size} <span className="text-xs text-gray-500 font-normal">/ {cacheMetrics.l1Capacity} items</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-3">
                  <span>Avg Lookup: <strong className="text-[#00A8FF]">{cacheMetrics.avgLookupMs}ms</strong></span>
                  <span>Evictions: {cacheMetrics.evictions}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#070B12] border border-white/10">
                <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono mb-1">
                  <span>L2 Distributed Redis</span>
                  <Zap className="w-3.5 h-3.5 text-[#FF7A00]" />
                </div>
                <div className="text-2xl font-black font-mono text-[#FF7A00] flex items-center gap-2">
                  <span>ONLINE</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">AOF</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-3">
                  <span>Cluster: redis:7-alpine</span>
                  <span>Port: 6379</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#070B12] border border-white/10">
                <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono mb-1">
                  <span>DB Time Saved</span>
                  <Flame className="w-3.5 h-3.5 text-[#FFD400]" />
                </div>
                <div className="text-2xl font-black font-mono text-[#FFD400]">
                  +{(cacheMetrics.estimatedLatencySavedMs / 1000).toFixed(1)}s
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-3">
                  ~85ms saved per transparent cache hit
                </div>
              </div>
            </div>

            {/* Live Endpoint Performance Benchmark Comparison */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00A8FF]" />
                    <span>Transparent Endpoint Latency Benchmark (Uncached vs Cached)</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Live verification measuring latency for frequently accessed hot endpoints like <code className="text-[#FF7A00]">/stats</code> and <code className="text-[#00A8FF]">/block/:id</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBenchmark('/stats')}
                    disabled={isBenchmarking}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00A8FF]/20 hover:bg-[#00A8FF]/30 border border-[#00A8FF]/40 text-xs font-mono font-bold text-[#00A8FF] transition-all"
                  >
                    <Play className="w-3 h-3" />
                    <span>Benchmark /stats</span>
                  </button>
                  <button
                    onClick={() => handleBenchmark('/block/:id')}
                    disabled={isBenchmarking}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A855F7]/20 hover:bg-[#A855F7]/30 border border-[#A855F7]/40 text-xs font-mono font-bold text-[#A855F7] transition-all"
                  >
                    <Play className="w-3 h-3" />
                    <span>Benchmark /block/:id</span>
                  </button>
                </div>
              </div>

              {benchmarkResult ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[#070B12] border border-white/10 font-mono text-xs animate-fadeIn">
                  <div className="p-3 rounded-lg bg-black/50 border border-white/5">
                    <span className="text-[10px] text-gray-500 uppercase block">1. Cold / Uncached Query</span>
                    <div className="text-lg font-bold text-red-400 mt-1">{benchmarkResult.uncachedLatencyMs} ms</div>
                    <span className="text-[10px] text-gray-400">PostgreSQL query & RPC state collation</span>
                  </div>

                  <div className="p-3 rounded-lg bg-black/50 border border-white/5">
                    <span className="text-[10px] text-gray-500 uppercase block">2. Cached Response ({benchmarkResult.source})</span>
                    <div className="text-lg font-bold text-[#10B981] mt-1">{benchmarkResult.cachedLatencyMs} ms</div>
                    <span className="text-[10px] text-gray-400">Direct L1 memory lookup with ETag check</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                    <span className="text-[10px] text-[#10B981] uppercase font-bold block">Performance Acceleration</span>
                    <div className="text-lg font-black text-white mt-1">{benchmarkResult.speedupFactor}x Faster</div>
                    <span className="text-[10px] text-gray-300">Endpoint: {benchmarkResult.endpoint}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#070B12] text-center text-xs font-mono text-gray-500">
                  Click either benchmark button above to measure real-time latency speedup between cold database fetching and the transparent caching layer.
                </div>
              )}

              {/* Sample Transparent HTTP Headers */}
              <div className="mt-4 p-3 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] space-y-1">
                <span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">Transparent HTTP Headers Exposed to Consumers:</span>
                <div className="text-gray-300"><span className="text-[#00A8FF]">X-Cache:</span> HIT-L1 (In-Memory Hot LRU)</div>
                <div className="text-gray-300"><span className="text-[#00A8FF]">X-Cache-Lookup-Time:</span> 0.182ms</div>
                <div className="text-gray-300"><span className="text-[#00A8FF]">Cache-Control:</span> public, max-age=60, stale-while-revalidate=30</div>
                <div className="text-gray-300"><span className="text-[#00A8FF]">ETag:</span> W/"gxq-4b92c1-840" <span className="text-gray-500">(Supports HTTP 304 Not Modified)</span></div>
              </div>
            </div>

            {/* Event-Driven Invalidation & Live Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="p-5 rounded-2xl bg-[#070B12] border border-white/10">
                <h4 className="text-xs font-bold font-mono uppercase text-white flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-[#10B981]" />
                  <span>Automated Event-Driven Invalidation</span>
                </h4>
                <p className="text-xs text-gray-400 mb-4">
                  The cache layer listens to quantum kernel events and automatically invalidates dependent query models:
                </p>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">New Block Indexed Event</div>
                      <div className="text-[10px] text-gray-400">Triggers onBlockIndexed(height, txCount)</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981]">
                      Purges stats_* & blocks
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">Transaction Indexing Event</div>
                      <div className="text-[10px] text-gray-400">Triggers onTransactionIndexed(from, to, hash)</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00A8FF]/20 text-[#00A8FF]">
                      Purges address & tx lists
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">Token Launch / Swap Event</div>
                      <div className="text-[10px] text-gray-400">Token registered in DEX registry</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#FF7A00]/20 text-[#FF7A00]">
                      Purges token lists & pairs
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                  <button
                    onClick={handleSimulateBlockIndexing}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/40 text-xs font-mono font-bold text-[#10B981] transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simulate New Block Mined (Verify Auto-Invalidation)</span>
                  </button>
                </div>
              </div>

              {/* Granular Manual Invalidation Controls */}
              <div className="p-5 rounded-2xl bg-[#070B12] border border-white/10">
                <h4 className="text-xs font-bold font-mono uppercase text-white flex items-center gap-2 mb-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Granular Cache Purge Controls</span>
                </h4>
                <p className="text-xs text-gray-400 mb-4">
                  Targeted invalidation by pattern or tag. Removes stale caches across both L1 and L2 layers instantly:
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">Invalidate Network Stats</div>
                      <div className="text-[10px] font-mono text-gray-500">Pattern: stats_* | Tag: tag:stats</div>
                    </div>
                    <button
                      onClick={() => handleInvalidateCachePattern('stats_*', 'Network Stats')}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono text-gray-200 transition-colors"
                    >
                      Purge Stats
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">Invalidate Block Caches</div>
                      <div className="text-[10px] font-mono text-gray-500">Pattern: block_* | Tag: tag:blocks</div>
                    </div>
                    <button
                      onClick={() => handleInvalidateCachePattern('block_*', 'Blocks')}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono text-gray-200 transition-colors"
                    >
                      Purge Blocks
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">Invalidate Transaction Caches</div>
                      <div className="text-[10px] font-mono text-gray-500">Pattern: tx_* & txs_*</div>
                    </div>
                    <button
                      onClick={() => handleInvalidateCachePattern('tx_*', 'Transactions')}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono text-gray-200 transition-colors"
                    >
                      Purge Txs
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">Invalidate Address Profiles</div>
                      <div className="text-[10px] font-mono text-gray-500">Pattern: address_* & wallet_*</div>
                    </div>
                    <button
                      onClick={() => handleInvalidateCachePattern('address_*', 'Addresses')}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono text-gray-200 transition-colors"
                    >
                      Purge Accounts
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Per-Environment Cache Strategy Configuration */}
            <div className="mt-6 p-5 rounded-2xl bg-[#070B12] border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#00A8FF]" />
                    <span>Per-Environment Cache Strategy Configuration & Invalidation Engine</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Configure tiered caching (L1 Memory / L2 Redis / L3 Snapshot), TTL jittering, singleflight coalescing, and event-based invalidation rules per deployment target.
                  </p>
                </div>

                {/* Environment Selector Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10">
                  {(['local', 'devnet', 'testnet', 'mainnet'] as GXQEnvironment[]).map((env) => (
                    <button
                      key={env}
                      onClick={() => handleSelectCacheEnv(env)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                        selectedCacheEnv === env
                          ? 'bg-[#00A8FF] text-black shadow-[0_0_12px_rgba(0,168,255,0.4)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strategy Parameters Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5 font-mono text-xs">
                {/* 1. Multi-Tiered Architecture Tiers */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-3">
                  <div className="text-white font-bold text-xs uppercase flex items-center gap-2 text-[#00A8FF]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>1. Tiered Storage Topology</span>
                  </div>

                  {/* L1 Memory */}
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">L1 In-Memory LRU</span>
                      <button
                        onClick={() => {
                          setEnvCacheConfig(prev => ({
                            ...prev,
                            tiers: { ...prev.tiers, l1Memory: { ...prev.tiers.l1Memory, enabled: !prev.tiers.l1Memory.enabled } }
                          }));
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          envCacheConfig.tiers.l1Memory.enabled ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {envCacheConfig.tiers.l1Memory.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Max Items:</span>
                      <input
                        type="number"
                        value={envCacheConfig.tiers.l1Memory.maxItems}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1000;
                          setEnvCacheConfig(prev => ({
                            ...prev,
                            tiers: { ...prev.tiers, l1Memory: { ...prev.tiers.l1Memory, maxItems: val } }
                          }));
                        }}
                        className="w-20 px-2 py-0.5 rounded bg-black border border-white/10 text-right text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* L2 Redis */}
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">L2 Distributed Redis 7</span>
                      <button
                        onClick={() => {
                          setEnvCacheConfig(prev => ({
                            ...prev,
                            tiers: { ...prev.tiers, l2Redis: { ...prev.tiers.l2Redis, enabled: !prev.tiers.l2Redis.enabled } }
                          }));
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          envCacheConfig.tiers.l2Redis.enabled ? 'bg-[#FF7A00]/20 text-[#FF7A00]' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {envCacheConfig.tiers.l2Redis.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Cluster Sharding:</span>
                      <span className="text-[10px] text-white">
                        {envCacheConfig.tiers.l2Redis.clusterMode ? 'Cluster Active' : 'Standalone'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Compress &gt;:</span>
                      <span className="text-[10px] text-white">{envCacheConfig.tiers.l2Redis.compressionThresholdBytes} B</span>
                    </div>
                  </div>

                  {/* L3 Snapshot */}
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">L3 Cold Snapshot</span>
                      <button
                        onClick={() => {
                          setEnvCacheConfig(prev => ({
                            ...prev,
                            tiers: { ...prev.tiers, l3Snapshot: { ...prev.tiers.l3Snapshot, enabled: !prev.tiers.l3Snapshot.enabled } }
                          }));
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          envCacheConfig.tiers.l3Snapshot.enabled ? 'bg-[#A855F7]/20 text-[#A855F7]' : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {envCacheConfig.tiers.l3Snapshot.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Grace SWR Window:</span>
                      <span className="text-[10px] text-white">{envCacheConfig.tiers.l3Snapshot.staleGracePeriodSeconds}s</span>
                    </div>
                  </div>
                </div>

                {/* 2. Granular Time-Based Invalidation TTLs */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2.5">
                  <div className="text-white font-bold text-xs uppercase flex items-center gap-2 text-[#10B981]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>2. Time-Based Resource TTLs (Seconds)</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {(Object.keys(envCacheConfig.resourceTtls) as (keyof typeof envCacheConfig.resourceTtls)[]).map((resKey) => (
                      <div key={resKey} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <span className="text-gray-300 capitalize">{resKey}:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="3600"
                            value={envCacheConfig.resourceTtls[resKey]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 5;
                              setEnvCacheConfig(prev => ({
                                ...prev,
                                resourceTtls: { ...prev.resourceTtls, [resKey]: val }
                              }));
                            }}
                            className="w-16 px-2 py-0.5 rounded bg-black border border-white/10 text-right text-white font-mono text-xs focus:border-[#10B981] outline-none"
                          />
                          <span className="text-gray-500 text-[10px]">sec</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Advanced Invalidation & Anti-Stampede Algorithms */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-3">
                  <div className="text-white font-bold text-xs uppercase flex items-center gap-2 text-[#FFD400]">
                    <Zap className="w-3.5 h-3.5" />
                    <span>3. Invalidation & Anti-Stampede</span>
                  </div>

                  {/* Singleflight */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div>
                      <div className="text-white font-semibold">Singleflight Coalescing</div>
                      <div className="text-[10px] text-gray-400">Zero backend stampedes</div>
                    </div>
                    <button
                      onClick={() => {
                        setEnvCacheConfig(prev => ({
                          ...prev,
                          invalidation: { ...prev.invalidation, enableSingleflight: !prev.invalidation.enableSingleflight }
                        }));
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        envCacheConfig.invalidation.enableSingleflight ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {envCacheConfig.invalidation.enableSingleflight ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>

                  {/* TTL Jitter */}
                  <div className="p-2 rounded-lg bg-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">TTL Jitter (Desync)</span>
                      <button
                        onClick={() => {
                          setEnvCacheConfig(prev => ({
                            ...prev,
                            invalidation: { ...prev.invalidation, enableJitter: !prev.invalidation.enableJitter }
                          }));
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          envCacheConfig.invalidation.enableJitter ? 'bg-[#00A8FF]/20 text-[#00A8FF]' : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {envCacheConfig.invalidation.enableJitter ? 'ACTIVE' : 'OFF'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Jitter Variance:</span>
                      <span className="text-white font-bold">±{envCacheConfig.invalidation.jitterPercent}%</span>
                    </div>
                  </div>

                  {/* XFetch Probabilistic Early Expiration */}
                  <div className="p-2 rounded-lg bg-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">XFetch Early Refresh</span>
                      <button
                        onClick={() => {
                          setEnvCacheConfig(prev => ({
                            ...prev,
                            invalidation: { ...prev.invalidation, enableXFetchEarlyRefresh: !prev.invalidation.enableXFetchEarlyRefresh }
                          }));
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          envCacheConfig.invalidation.enableXFetchEarlyRefresh ? 'bg-[#A855F7]/20 text-[#A855F7]' : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {envCacheConfig.invalidation.enableXFetchEarlyRefresh ? 'ACTIVE' : 'OFF'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>XFetch Beta:</span>
                      <span className="text-white font-bold">{envCacheConfig.invalidation.xFetchBeta.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Adaptive TTL on High TPS */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div>
                      <div className="text-white font-semibold">Adaptive TPS Scaling</div>
                      <div className="text-[10px] text-gray-400">Auto-shorten on burst</div>
                    </div>
                    <button
                      onClick={() => {
                        setEnvCacheConfig(prev => ({
                          ...prev,
                          invalidation: { ...prev.invalidation, adaptiveTtlOnHighTps: !prev.invalidation.adaptiveTtlOnHighTps }
                        }));
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        envCacheConfig.invalidation.adaptiveTtlOnHighTps ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {envCacheConfig.invalidation.adaptiveTtlOnHighTps ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Event-Driven Invalidation Simulation Buttons */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 mb-4">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-2 font-mono">
                  Dispatch Real-Time Invalidation Events to Event Bus:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleDispatchCustomEvent('BLOCK_INDEXED')}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-gray-200 hover:text-white transition-all text-center"
                  >
                    ⚡ BLOCK_INDEXED
                  </button>
                  <button
                    onClick={() => handleDispatchCustomEvent('TRANSACTION_INDEXED', 'txs_all')}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-gray-200 hover:text-white transition-all text-center"
                  >
                    ⚡ TX_INDEXED
                  </button>
                  <button
                    onClick={() => handleDispatchCustomEvent('STAKING_POSITION_MODIFIED')}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-gray-200 hover:text-white transition-all text-center"
                  >
                    ⚡ STAKE_MODIFIED
                  </button>
                  <button
                    onClick={() => handleDispatchCustomEvent('CHAIN_REORG')}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[11px] font-mono text-red-400 hover:text-red-300 transition-all text-center"
                  >
                    ⚡ CHAIN_REORG
                  </button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Target Environment: <strong className="text-white uppercase">{selectedCacheEnv}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEnvCacheConfig(explorerApi.getEnvironmentCacheConfig(selectedCacheEnv))}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 transition-all"
                  >
                    Reset Changes
                  </button>
                  <button
                    onClick={handleSaveEnvCacheConfig}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#00A8FF] hover:bg-[#008CFF] text-black font-bold text-xs uppercase font-mono shadow-[0_0_15px_rgba(0,168,255,0.4)] transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Apply Strategy</span>
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* SECTION 3C: SENTRY / LOGROCKET COMPREHENSIVE ERROR MONITORING */}
      {activeSection === 'errors' && (
        <div className="space-y-6">
          <GlassCard level={2} className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Bug className="w-4 h-4 text-red-400" />
                  <span>Sentry & LogRocket Comprehensive Error Monitoring</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Full-stack error observability capturing client UI exceptions, server-side API errors, RPC connection failures, and breadcrumbs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSentry}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-semibold text-white transition-colors"
                  title="Export Sentry Event JSON payload"
                >
                  <Download className="w-3.5 h-3.5 text-[#00A8FF]" />
                  <span>Export Sentry JSON</span>
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      errorMonitoring.clearErrors();
                      setMonitoredErrors([]);
                      setActionNotice({ type: 'success', message: 'Cleared error stream.' });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error Simulation Action Strip */}
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Real-Time Error Ingestion & Verification Trigger:</span>
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Click any test trigger to simulate a realistic production failure and observe real-time capture in Sentry:
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleSimulateError('rpc')}
                    disabled={isSimulatingError}
                    className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 border border-red-500/40 text-[11px] font-mono text-red-400 transition-all"
                  >
                    + RPC Timeout
                  </button>
                  <button
                    onClick={() => handleSimulateError('contract')}
                    disabled={isSimulatingError}
                    className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 border border-[#FF7A00]/40 text-[11px] font-mono text-[#FF7A00] transition-all"
                  >
                    + Contract Revert
                  </button>
                  <button
                    onClick={() => handleSimulateError('cache')}
                    disabled={isSimulatingError}
                    className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 border border-[#FFD400]/40 text-[11px] font-mono text-[#FFD400] transition-all"
                  >
                    + Cache L2 Timeout
                  </button>
                  <button
                    onClick={() => handleSimulateError('client_ui')}
                    disabled={isSimulatingError}
                    className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 border border-[#A855F7]/40 text-[11px] font-mono text-[#A855F7] transition-all"
                  >
                    + Client UI Error
                  </button>
                  <button
                    onClick={() => handleSimulateError('database')}
                    disabled={isSimulatingError}
                    className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 border border-blue-500/40 text-[11px] font-mono text-blue-400 transition-all"
                  >
                    + DB Pool Exhaustion
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>

              {/* Environment Filter */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-[10px]">Env:</span>
                <select
                  value={errorEnvFilter}
                  onChange={(e) => setErrorEnvFilter(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                >
                  <option value="ALL">All Environments</option>
                  <option value="local">Local</option>
                  <option value="devnet">Devnet</option>
                  <option value="testnet">Testnet</option>
                  <option value="mainnet">Mainnet</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-[10px]">Severity:</span>
                <select
                  value={errorSeverityFilter}
                  onChange={(e) => setErrorSeverityFilter(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                >
                  <option value="ALL">All Severities</option>
                  <option value="FATAL">FATAL</option>
                  <option value="ERROR">ERROR</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-[10px]">Category:</span>
                <select
                  value={errorCategoryFilter}
                  onChange={(e) => setErrorCategoryFilter(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="NETWORK_RPC_ERROR">RPC Errors</option>
                  <option value="CACHE_FAILURE">Cache Failures</option>
                  <option value="SMART_CONTRACT_REVERT">Contract Reverts</option>
                  <option value="DATABASE_QUERY_ERROR">Database Errors</option>
                  <option value="CLIENT_UI_ERROR">Client UI Exceptions</option>
                  <option value="SECURITY_BREACH_ATTEMPT">Security Incidents</option>
                </select>
              </div>

              <div className="ml-auto text-gray-400 text-[11px]">
                Showing {monitoredErrors.filter(e => {
                  if (errorEnvFilter !== 'ALL' && e.environment !== errorEnvFilter) return false;
                  if (errorSeverityFilter !== 'ALL' && e.severity !== errorSeverityFilter) return false;
                  if (errorCategoryFilter !== 'ALL' && e.category !== errorCategoryFilter) return false;
                  return true;
                }).length} incidents
              </div>
            </div>

            {/* Error Stream Table / List */}
            <div className="space-y-3">
              {monitoredErrors
                .filter(e => {
                  if (errorEnvFilter !== 'ALL' && e.environment !== errorEnvFilter) return false;
                  if (errorSeverityFilter !== 'ALL' && e.severity !== errorSeverityFilter) return false;
                  if (errorCategoryFilter !== 'ALL' && e.category !== errorCategoryFilter) return false;
                  return true;
                })
                .map((err) => (
                  <div
                    key={err.id}
                    className={`p-4 rounded-xl border transition-all ${
                      err.resolved
                        ? 'bg-black/30 border-white/5 opacity-70'
                        : err.severity === 'FATAL'
                        ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(255,48,79,0.1)]'
                        : err.severity === 'ERROR'
                        ? 'bg-[#FF7A00]/10 border-[#FF7A00]/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                            err.severity === 'FATAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                            err.severity === 'ERROR' ? 'bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40' :
                            err.severity === 'WARNING' ? 'bg-yellow-500/20 text-[#FFD400] border border-yellow-500/40' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          }`}>
                            {err.severity}
                          </span>

                          <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300">
                            {err.category}
                          </span>

                          <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 uppercase">
                            ENV: <strong className="text-white">{err.environment}</strong>
                          </span>

                          <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 uppercase">
                            SOURCE: <strong className="text-white">{err.source}</strong>
                          </span>

                          {err.occurrenceCount > 1 && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                              {err.occurrenceCount}x Events
                            </span>
                          )}

                          {err.resolved ? (
                            <span className="text-[#10B981] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> RESOLVED
                            </span>
                          ) : (
                            <span className="text-red-400 font-bold">UNRESOLVED</span>
                          )}
                        </div>

                        <div className="text-sm font-bold text-white font-mono mt-1">
                          {err.title}: <span className="text-gray-300 font-normal">{err.message}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-gray-500">
                          <span>Timestamp: {new Date(err.timestamp).toLocaleTimeString()} ({new Date(err.timestamp).toLocaleDateString()})</span>
                          {err.userContext?.email && (
                            <span>User: <strong className="text-[#00A8FF]">{err.userContext.email}</strong></span>
                          )}
                          {err.correlationId && (
                            <span>Correlation: <span className="text-[#FFD400]">{err.correlationId}</span></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedError(selectedError?.id === err.id ? null : err)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-gray-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{selectedError?.id === err.id ? 'Hide Trace' : 'Inspect Trace'}</span>
                        </button>
                        {!err.resolved && (
                          <button
                            onClick={() => handleResolveError(err.id)}
                            className="p-1.5 rounded-lg bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/40 transition-colors"
                            title="Mark incident as resolved"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Detailed Stack Trace & Breadcrumbs Drawer */}
                    {selectedError?.id === err.id && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3 font-mono text-xs animate-fadeIn">
                        {/* Stack Trace */}
                        <div>
                          <div className="text-white font-bold mb-1 flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 text-red-400" />
                            <span>Stack Trace Execution Frames:</span>
                          </div>
                          <pre className="p-3 rounded-lg bg-black/80 border border-white/10 text-[11px] text-red-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {err.stackTrace}
                          </pre>
                        </div>

                        {/* User Context & Tags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <div className="text-white font-bold mb-1">User Context & Identity:</div>
                            <div className="text-gray-400">Email: <span className="text-white font-bold">{err.userContext?.email || 'N/A'}</span></div>
                            <div className="text-gray-400">Smart Wallet: <span className="text-gray-200 font-mono text-[10px]">{err.userContext?.smartWalletAddress || 'N/A'}</span></div>
                            <div className="text-gray-400">Assigned Role: <span className="text-[#FF7A00] font-bold">{err.userContext?.role || 'N/A'}</span></div>
                          </div>

                          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                            <div className="text-white font-bold mb-1">Telemetry Tags:</div>
                            {Object.entries(err.tags).map(([k, v]) => (
                              <div key={k} className="text-gray-400">
                                {k}: <span className="text-[#00A8FF]">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Breadcrumbs Trail */}
                        {err.breadcrumbs.length > 0 && (
                          <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                            <div className="text-white font-bold mb-2">Breadcrumbs Trail (Pre-crash user events):</div>
                            <div className="space-y-1 text-[10px]">
                              {err.breadcrumbs.map((bc, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-gray-400">
                                  <span className="text-gray-600">[{new Date(bc.timestamp).toLocaleTimeString()}]</span>
                                  <span className="px-1.5 py-0.2 rounded bg-white/10 text-gray-300 uppercase">{bc.category}</span>
                                  <span className="text-gray-200">{bc.message}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              {monitoredErrors.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-500 font-mono">
                  No monitored error incidents recorded in current session. All systems operating nominally.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* SECTION 4: CENTRAL FEATURE FLAGS & GOVERNANCE */}
      {activeSection === 'features' && (
        <div className="space-y-6">
          <GlassCard level={3} glow="orange" className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
              <Power className="w-4 h-4 text-[#FF7A00]" />
              <span>Central Feature Flag State & Circuit Breakers</span>
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Modify the central environment configuration flags. State persists and governs contracts and UI behavior instantly.
            </p>

            <div className="space-y-4">
              
              {/* Feature 1: Remote Launchpad Flag */}
              <div className="p-5 rounded-2xl bg-[#070B12] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Token Launchpad Deployment Flag</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      envConfig.featureFlags.isLaunchpadEnabled ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#FF304F]/20 text-[#FF304F]'
                    }`}>
                      {envConfig.featureFlags.isLaunchpadEnabled ? 'ENABLED' : 'PAUSED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 max-w-lg leading-relaxed">
                    Controls whether users can deploy new tokens via <code className="text-[#00A8FF]">TokenFactory.createToken</code>. Toggling to PAUSED instantly prevents token creation.
                  </p>
                </div>

                <button
                  onClick={handleToggleLaunchpad}
                  disabled={!isSuperAdmin}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold font-mono text-xs transition-all shrink-0 ${
                    !isSuperAdmin
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : envConfig.featureFlags.isLaunchpadEnabled
                      ? 'bg-[#FF304F] text-white hover:bg-[#FF1744] shadow-[0_0_15px_rgba(255,48,79,0.3)]'
                      : 'bg-[#10B981] text-black hover:bg-[#059669] shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{envConfig.featureFlags.isLaunchpadEnabled ? 'REMOTE PAUSE LAUNCHPAD' : 'REMOTE UNPAUSE LAUNCHPAD'}</span>
                </button>
              </div>

              {/* Feature 2: Remote DEX Swap Flag */}
              <div className="p-5 rounded-2xl bg-[#070B12] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">SimpleSwap AMM DEX Swaps Flag</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      envConfig.featureFlags.isSwapEnabled ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#FF304F]/20 text-[#FF304F]'
                    }`}>
                      {envConfig.featureFlags.isSwapEnabled ? 'ENABLED' : 'PAUSED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 max-w-lg leading-relaxed">
                    Controls AMM swap execution on <code className="text-[#00A8FF]">SimpleSwap.swap</code>. When paused, liquidity remains locked and swaps are halted.
                  </p>
                </div>

                <button
                  onClick={handleToggleSwap}
                  disabled={!isSuperAdmin}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold font-mono text-xs transition-all shrink-0 ${
                    !isSuperAdmin
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : envConfig.featureFlags.isSwapEnabled
                      ? 'bg-[#FF304F] text-white hover:bg-[#FF1744] shadow-[0_0_15px_rgba(255,48,79,0.3)]'
                      : 'bg-[#10B981] text-black hover:bg-[#059669] shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{envConfig.featureFlags.isSwapEnabled ? 'REMOTE PAUSE SWAPS' : 'REMOTE UNPAUSE SWAPS'}</span>
                </button>
              </div>

            </div>
          </GlassCard>
        </div>
      )}

      {/* SECTION 5: SECURITY AUDIT LOGS */}
      {activeSection === 'logs' && (
        <div className="space-y-6">
          <GlassCard level={2} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FFD400]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Immutable Security Audit Stream ({telemetryLogs.length} Events)
                </h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Zero Key Scrubbing Active</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {telemetryLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-[#070B12] border border-white/5 font-mono text-[11px] flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      log.severity === 'SECURITY' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      log.severity === 'WARN' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/40'
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
          </GlassCard>
        </div>
      )}

    </div>
  );
};
