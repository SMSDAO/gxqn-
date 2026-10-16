import { useEffect } from 'react';

export const useLocalStorageSync = (syncHandlers: Record<string, (newValue: any) => void>) => {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && syncHandlers[e.key]) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : null;
          syncHandlers[e.key](newValue);
        } catch (error) {
          console.error(`Error syncing local storage for ${e.key}:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncHandlers]);
};
