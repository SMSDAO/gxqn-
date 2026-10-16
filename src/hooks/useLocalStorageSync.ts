import { useEffect } from 'react';

export const useLocalStorageSync = (syncHandlers: Record<string, (newValue: any) => void>) => {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && syncHandlers[e.key]) {
        try {
          let newValue = null;
          if (e.newValue) {
            try {
              newValue = JSON.parse(e.newValue);
            } catch {
              newValue = e.newValue;
            }
          }
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
