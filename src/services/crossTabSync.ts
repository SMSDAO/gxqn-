/**
 * GXQ Network V3.0.0 — Cross-Tab Synchronization Subsystem
 * Persists and synchronizes user preferences (theme, active env, display settings, module layouts, alerts)
 * across multiple browser tabs using the Storage API and BroadcastChannel.
 */

export interface UserPreferences {
  activeEnv: string;
  theme: 'cyber-dark' | 'neon-matrix' | 'quantum-abyss';
  neonIntensity: 'medium' | 'high' | 'ultra';
  flashLinesEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  compactView: boolean;
  favoriteTabs: string[];
  navOrder?: string[];
  lastSyncedAt: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  activeEnv: 'testnet',
  theme: 'cyber-dark',
  neonIntensity: 'ultra',
  flashLinesEnabled: true,
  soundEnabled: false,
  hapticEnabled: true,
  compactView: false,
  favoriteTabs: ['overview', 'swap', 'launchpad', 'portfolio', 'security'],
  lastSyncedAt: Date.now(),
};

const SYNC_STORAGE_KEY = 'gxq_user_preferences_v3';
const BROADCAST_CHANNEL_NAME = 'gxq_network_tab_sync_v3';

type SyncListener = (prefs: UserPreferences, sourceTabId: string) => void;

class CrossTabSyncService {
  private tabId: string;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncListener> = new Set();
  private currentPrefs: UserPreferences = DEFAULT_PREFERENCES;

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.init();
  }

  private init() {
    // 1. Load initial preferences from localStorage
    try {
      const stored = localStorage.getItem(SYNC_STORAGE_KEY);
      if (stored) {
        this.currentPrefs = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } else {
        localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
      }
    } catch {
      this.currentPrefs = DEFAULT_PREFERENCES;
    }

    // 2. Setup BroadcastChannel if supported
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'SYNC_PREFS' && event.data.sourceTabId !== this.tabId) {
            this.handleRemoteUpdate(event.data.preferences, event.data.sourceTabId);
          }
        };
      } catch {
        this.channel = null;
      }
    }

    // 3. Setup window storage event fallback (always works across tabs in standard browsers)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === SYNC_STORAGE_KEY && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            this.handleRemoteUpdate(parsed, 'external_storage');
          } catch {
            // ignore
          }
        }
      });
    }
  }

  private handleRemoteUpdate(newPrefs: UserPreferences, sourceTabId: string) {
    this.currentPrefs = { ...this.currentPrefs, ...newPrefs };
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentPrefs, sourceTabId);
      } catch (err) {
        console.error('Error executing cross-tab sync listener:', err);
      }
    });
  }

  public getPreferences(): UserPreferences {
    return { ...this.currentPrefs };
  }

  public updatePreferences(partial: Partial<UserPreferences>) {
    const updated: UserPreferences = {
      ...this.currentPrefs,
      ...partial,
      lastSyncedAt: Date.now(),
    };
    this.currentPrefs = updated;

    // Save to localStorage
    try {
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }

    // Broadcast to other tabs
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'SYNC_PREFS',
          sourceTabId: this.tabId,
          preferences: updated,
        });
      } catch {
        // ignore
      }
    }

    // Notify local listeners as well
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentPrefs, this.tabId);
      } catch (err) {
        console.error('Local sync listener error:', err);
      }
    });
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getTabId(): string {
    return this.tabId;
  }
}

export const crossTabSync = new CrossTabSyncService();
