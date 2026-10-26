import React, { createContext, useContext, useState, useEffect } from 'react';
import { networkMonitor } from '../sync/networkMonitor';
import { syncEngine } from '../sync/syncEngine';
import { syncQueue } from '../storage/syncQueue';

const SyncContext = createContext({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
});

export function SyncProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    syncEngine.init();

    const updatePending = async () => {
      try {
        const count = await syncQueue.size();
        setPendingCount(count);
      } catch (e) {
        // Safe fallback
      }
    };

    updatePending();

    const unsubNetwork = networkMonitor.addListener((online) => {
      setIsOnline(online);
      updatePending();
    });

    const unsubSync = syncEngine.addSyncListener((event) => {
      setIsSyncing(event.status === 'syncing');
      updatePending();
    });

    return () => {
      if (unsubNetwork) unsubNetwork();
      if (unsubSync) unsubSync();
    };
  }, []);

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing, pendingCount }}>
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = () => useContext(SyncContext);
