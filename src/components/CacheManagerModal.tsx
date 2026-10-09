import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Database,
  Layers,
  Zap,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { StorageMetrics, CleanCacheResult, forceFreshReload } from '../utils/cacheManager';

interface CacheManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export const CacheManagerModal: React.FC<CacheManagerModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const { storageMetrics, refreshStorageMetrics, cleanStorageCache } = useCms();
  const [metrics, setMetrics] = useState<StorageMetrics | null>(storageMetrics);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cleanResult, setCleanResult] = useState<CleanCacheResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleRefresh();
      setCleanResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (storageMetrics) {
      setMetrics(storageMetrics);
    }
  }, [storageMetrics]);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const updated = await refreshStorageMetrics();
      setMetrics(updated);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleClean = async () => {
    setIsCleaning(true);
    try {
      const res = await cleanStorageCache();
      setCleanResult(res);
      const updated = await refreshStorageMetrics();
      setMetrics(updated);
      if (showToast) {
        showToast(`🧹 ${res.message}`);
      }
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#123B6D] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white leading-tight">
                SaaS Storage &amp; Cache Optimizer
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Fix high cache usage, reduce storage footprint &amp; optimize speed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Banner */}
          {cleanResult ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <p className="font-bold">{cleanResult.message}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Removed {cleanResult.staleKeysRemoved} duplicate cache keys &amp; cleared {cleanResult.cacheBucketsPurged} stale browser cache buckets. Current storage: {cleanResult.remainingFormatted}.
                </p>
              </div>
            </div>
          ) : metrics?.status === 'heavy' ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">Heavy cache detected</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Redundant or historical cached records are taking up browser storage. Click below to safely prune stale cache without losing data.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-800">
                <p className="font-bold text-slate-900">SaaS storage footprint is healthy</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Your cache is running lightweight. Background syncing automatically offloads heavy historical data to IndexedDB.
                </p>
              </div>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">LocalStorage</span>
              <span className="text-base font-black text-slate-900 block mt-0.5">
                {metrics?.localStorageFormatted || '...'}
              </span>
              <span className="text-[10px] text-slate-400">
                {metrics?.localStorageKeyCount || 0} active keys
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">IndexedDB</span>
              <span className="text-base font-black text-slate-900 block mt-0.5">
                {metrics?.indexedDbFormatted || '...'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Safe offline</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Service Cache</span>
              <span className="text-base font-black text-slate-900 block mt-0.5">
                {metrics?.cacheStorageFormatted || '0 KB'}
              </span>
              <span className="text-[10px] text-slate-400">PWA assets</span>
            </div>
          </div>

          {/* Category Breakdown Bar */}
          {metrics && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Storage Category Breakdown</span>
                <span className="text-slate-500 font-normal text-[11px]">
                  Total: {metrics.totalFormatted}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  style={{
                    width: `${Math.min(100, (metrics.breakdown.databaseKB / (metrics.localStorageBytes / 1024 || 1)) * 100)}%`,
                  }}
                  className="bg-[#123B6D]"
                  title="Database records"
                />
                <div
                  style={{
                    width: `${Math.min(100, (metrics.breakdown.settingsKB / (metrics.localStorageBytes / 1024 || 1)) * 100)}%`,
                  }}
                  className="bg-amber-400"
                  title="Settings & Branding"
                />
                <div
                  style={{
                    width: `${Math.min(100, (metrics.breakdown.credentialsKB / (metrics.localStorageBytes / 1024 || 1)) * 100)}%`,
                  }}
                  className="bg-emerald-500"
                  title="Credentials & Vault"
                />
                {metrics.breakdown.staleKB > 0 && (
                  <div
                    style={{
                      width: `${Math.min(100, (metrics.breakdown.staleKB / (metrics.localStorageBytes / 1024 || 1)) * 100)}%`,
                    }}
                    className="bg-rose-500 animate-pulse"
                    title="Stale / Redundant cache"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] pt-1 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#123B6D] shrink-0" />
                  <span>Lab Records: <strong>{metrics.breakdown.databaseKB} KB</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span>Lab Settings: <strong>{metrics.breakdown.settingsKB} KB</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Auth &amp; Vault: <strong>{metrics.breakdown.credentialsKB} KB</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${metrics.breakdown.staleKB > 0 ? 'bg-rose-500' : 'bg-slate-300'}`} />
                  <span>Stale Cache: <strong className={metrics.breakdown.staleKB > 0 ? 'text-rose-600' : 'text-slate-500'}>{metrics.breakdown.staleKB} KB</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Safety Notice & Hosting Explanation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Zero Data Loss:</strong> Cleaning only purges redundant duplicate caches and temporary blobs. Your login sessions, lab configurations, patient records, and passwords remain 100% intact.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px] space-y-1">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <span>🌐 Host karne pe purana view kiun aa rha tha?</span>
              </p>
              <p className="text-amber-800 leading-relaxed">
                Browser ka PWA Service Worker puraane <code className="bg-amber-150 px-1 rounded font-mono">index.html</code> aur JS chunks ko local cache se serve kar deta tha bina server check kiye. Ab workbox navigation cache bypass ho chuka hai aur Hostinger LiteSpeed no-cache headers activate hain.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>

            <button
              type="button"
              onClick={() => forceFreshReload()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition cursor-pointer"
              title="Unregisters old service worker, purges cache and forces fresh reload from server"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>🔄 Hard Reload (Bypass Host Cache)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleClean}
              disabled={isCleaning}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-black text-xs transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-300 ${isCleaning ? 'animate-bounce' : ''}`} />
              <span>{isCleaning ? 'Optimizing Cache...' : '🧹 Purge Stale Cache Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
