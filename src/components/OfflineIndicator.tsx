import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload, HardDrive, AlertTriangle } from 'lucide-react';
import { subscribeOfflineQueueCount, flushOfflineSyncQueue, forceRefreshAllFromHostinger } from '../lib/cloudSync';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when network reconnects
      handleManualSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncSuccessMsg(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to offline queue changes
    const unsubQueue = subscribeOfflineQueueCount((count) => {
      setPendingCount(count);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubQueue();
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const result = await flushOfflineSyncQueue();
      await forceRefreshAllFromHostinger();
      if (result.syncedCount > 0) {
        setSyncSuccessMsg(`✅ ${result.syncedCount} records synced to Hostinger MySQL!`);
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.warn('Sync attempt finished with errors:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // If online, no pending queue items, and no temporary message, keep UI completely clean
  if (isOnline && pendingCount === 0 && !syncSuccessMsg) {
    return null;
  }

  return (
    <aside aria-label="Offline Sync Status" className="fixed bottom-4 left-4 z-50 max-w-md animate-in slide-in-from-bottom-2 duration-300">
      <div
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl shadow-xl backdrop-blur-md border text-xs font-medium transition-all ${
          !isOnline
            ? 'bg-amber-950/90 border-amber-600/70 text-amber-100 shadow-amber-950/30'
            : pendingCount > 0
            ? 'bg-sky-950/90 border-sky-600/70 text-sky-100 shadow-sky-950/30'
            : 'bg-emerald-950/90 border-emerald-600/70 text-emerald-100 shadow-emerald-950/30'
        }`}
      >
        {!isOnline ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-200">Offline Mode (IndexedDB Active)</p>
              <p className="text-[11px] text-amber-300/80">
                {pendingCount > 0
                  ? `${pendingCount} entries local storage में सुरक्षित हैं`
                  : 'बिना इंटरनेट काम चालू है, डेटा local save होगा'}
              </p>
            </div>
          </div>
        ) : pendingCount > 0 ? (
          <div className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-sky-400 shrink-0 animate-bounce" />
            <div>
              <p className="font-bold text-sky-200">Internet Available</p>
              <p className="text-[11px] text-sky-300/80">
                {pendingCount} offline records Hostinger MySQL में sync होने तैयार हैं
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="font-bold text-emerald-200">{syncSuccessMsg || 'Data Synced to Hostinger MySQL'}</p>
          </div>
        )}

        {isOnline && pendingCount > 0 && (
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        )}

        {!isOnline && (
          <div className="ml-auto flex items-center gap-1 text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-mono">
            <HardDrive className="w-3 h-3" />
            <span>Local DB</span>
          </div>
        )}
      </div>
    </aside>
  );
};
