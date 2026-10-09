import React, { useState } from 'react';
import { RefreshCw, Check, AlertCircle, WifiOff } from 'lucide-react';
import { useCms } from '../context/CmsContext';

interface SyncNowButtonProps {
  variant?: 'teal' | 'navy' | 'blue' | 'light' | 'dark';
  className?: string;
  showStatusBadge?: boolean;
}

export const SyncNowButton: React.FC<SyncNowButtonProps> = ({
  variant = 'navy',
  className = '',
  showStatusBadge = true,
}) => {
  const {
    cloudSyncStatus,
    pendingOfflineSyncCount,
    triggerManualSync,
    lastCloudSyncTime,
  } = useCms();

  const [isLocalSyncing, setIsLocalSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: true, message: '' });

  const handleSyncClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLocalSyncing) return;

    setIsLocalSyncing(true);
    try {
      const res = await triggerManualSync();
      setSyncFeedback({
        show: true,
        success: res.success,
        message: res.message,
      });
      setTimeout(() => {
        setSyncFeedback((prev) => ({ ...prev, show: false }));
      }, 4000);
    } finally {
      setIsLocalSyncing(false);
    }
  };

  const isSyncing = isLocalSyncing || cloudSyncStatus === 'syncing';
  const isOffline = cloudSyncStatus === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine);

  // Variant color definitions
  const variantStyles = {
    teal: 'bg-teal-800/80 hover:bg-teal-700 text-white border-teal-600/50 shadow-xs',
    navy: 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs',
    blue: 'bg-[#0e2c52] hover:bg-[#16437d] text-white border-blue-400/30 shadow-xs',
    light: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs',
    dark: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 shadow-xs',
  }[variant];

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleSyncClick}
        disabled={isSyncing}
        className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border active:scale-95 disabled:opacity-60 select-none ${variantStyles} ${className}`}
        title={`Hostinger MySQL Sync (${lastCloudSyncTime ? `Last: ${lastCloudSyncTime}` : 'Live'}). Click to synchronize offline changes.`}
      >
        <RefreshCw
          className={`w-3.5 h-3.5 text-amber-300 shrink-0 ${
            isSyncing ? 'animate-spin text-amber-400' : ''
          }`}
        />

        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>

        {/* Pending Offline Records Badge */}
        {pendingOfflineSyncCount > 0 && (
          <span
            className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full leading-none animate-pulse shrink-0"
            title={`${pendingOfflineSyncCount} changes waiting to sync to Hostinger MySQL`}
          >
            {pendingOfflineSyncCount}
          </span>
        )}

        {/* Offline indicator if browser is disconnected */}
        {isOffline && pendingOfflineSyncCount === 0 && (
          <span title="Offline Mode: Changes save locally" className="inline-flex">
            <WifiOff className="w-3 h-3 text-rose-300 shrink-0" />
          </span>
        )}
      </button>

      {/* Inline Feedback Popover / Toast */}
      {syncFeedback.show && (
        <div
          className={`absolute top-full mt-2 right-0 z-50 whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 border ${
            syncFeedback.success
              ? 'bg-emerald-900 text-emerald-100 border-emerald-500/50'
              : 'bg-rose-900 text-rose-100 border-rose-500/50'
          }`}
        >
          {syncFeedback.success ? (
            <Check className="w-3.5 h-3.5 text-emerald-300" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
          )}
          <span>{syncFeedback.message}</span>
        </div>
      )}
    </div>
  );
};
