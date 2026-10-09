/**
 * INDIANLALAJI.COM - SaaS Cache & Local Storage Optimization Engine
 * 
 * Solves:
 * 1. "saas me bohat cache le rha hai" - Eliminates multi-megabyte cache bloat.
 * 2. Prevents localStorage 5MB QuotaExceededError by eliminating duplicated collections.
 * 3. Removes redundant `hostinger_cache_*` duplicate keys from localStorage (collections are already safely in IndexedDB + Memory).
 * 4. Cleans up obsolete Browser CacheStorage and Service Worker dev caches.
 * 5. Provides one-click instant cache purging while safely preserving user login sessions and credentials.
 */

export interface StorageMetrics {
  localStorageBytes: number;
  localStorageFormatted: string;
  localStorageKeyCount: number;
  staleKeysCount: number;
  staleBytes: number;
  indexedDbBytes: number;
  indexedDbFormatted: string;
  cacheStorageBytes: number;
  cacheStorageFormatted: string;
  totalBytes: number;
  totalFormatted: string;
  status: 'optimal' | 'moderate' | 'heavy';
  breakdown: {
    databaseKB: number;
    settingsKB: number;
    credentialsKB: number;
    staleKB: number;
    otherKB: number;
  };
}

export interface CleanCacheResult {
  freedBytes: number;
  freedFormatted: string;
  remainingBytes: number;
  remainingFormatted: string;
  staleKeysRemoved: number;
  cacheBucketsPurged: number;
  success: boolean;
  message: string;
}

/**
 * Format raw bytes into human readable KB or MB
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculates real-time breakdown of browser storage (LocalStorage, IndexedDB, CacheStorage)
 */
export async function getStorageMetrics(): Promise<StorageMetrics> {
  let localStorageBytes = 0;
  let staleBytes = 0;
  let staleKeysCount = 0;
  let keyCount = 0;

  const breakdown = {
    databaseKB: 0,
    settingsKB: 0,
    credentialsKB: 0,
    staleKB: 0,
    otherKB: 0,
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      keyCount = localStorage.length;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || '';
        // 2 bytes per UTF-16 character in memory/storage
        const itemBytes = (key.length + val.length) * 2;
        localStorageBytes += itemBytes;

        const isStale =
          key.startsWith('hostinger_cache_') ||
          key.includes('_backup_preview') ||
          key.startsWith('temp_') ||
          key.startsWith('debug_');

        if (isStale) {
          staleBytes += itemBytes;
          staleKeysCount++;
          breakdown.staleKB += itemBytes / 1024;
        } else if (
          key.includes('report') ||
          key.includes('reception') ||
          key.includes('test') ||
          key.includes('package') ||
          key.includes('doctor') ||
          key.includes('branch')
        ) {
          breakdown.databaseKB += itemBytes / 1024;
        } else if (key.includes('setting') || key.includes('section') || key.includes('social') || key.includes('feature')) {
          breakdown.settingsKB += itemBytes / 1024;
        } else if (key.includes('user') || key.includes('credential') || key.includes('vault') || key.includes('token')) {
          breakdown.credentialsKB += itemBytes / 1024;
        } else {
          breakdown.otherKB += itemBytes / 1024;
        }
      }
    } catch (e) {
      console.warn('[CacheManager] Error calculating localStorage usage:', e);
    }
  }

  // Estimate browser storage (IndexedDB + CacheStorage) via StorageManager API
  let indexedDbBytes = 0;
  let cacheStorageBytes = 0;

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await caches.keys();
      for (const k of keys) {
        try {
          const cache = await caches.open(k);
          const reqs = await cache.keys();
          // Approximate ~15KB per cached request metadata / response
          cacheStorageBytes += reqs.length * 15 * 1024;
        } catch {}
      }
    }
  } catch {}

  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      // Subtract localStorage and cacheStorage estimate to estimate IndexedDB portion
      indexedDbBytes = Math.max(0, usage - localStorageBytes - cacheStorageBytes);
    }
  } catch {}

  const totalBytes = localStorageBytes + cacheStorageBytes;
  
  // Status evaluation:
  // Optimal: localStorage < 1MB, total < 3MB
  // Moderate: localStorage < 3MB, total < 6MB
  // Heavy: localStorage >= 3MB or total >= 6MB
  let status: 'optimal' | 'moderate' | 'heavy' = 'optimal';
  if (localStorageBytes > 3 * 1024 * 1024 || totalBytes > 6 * 1024 * 1024 || staleKeysCount > 5) {
    status = 'heavy';
  } else if (localStorageBytes > 1.2 * 1024 * 1024 || totalBytes > 3 * 1024 * 1024) {
    status = 'moderate';
  }

  return {
    localStorageBytes,
    localStorageFormatted: formatBytes(localStorageBytes),
    localStorageKeyCount: keyCount,
    staleKeysCount,
    staleBytes,
    indexedDbBytes,
    indexedDbFormatted: formatBytes(indexedDbBytes),
    cacheStorageBytes,
    cacheStorageFormatted: formatBytes(cacheStorageBytes),
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    status,
    breakdown: {
      databaseKB: Math.round(breakdown.databaseKB),
      settingsKB: Math.round(breakdown.settingsKB),
      credentialsKB: Math.round(breakdown.credentialsKB),
      staleKB: Math.round(breakdown.staleKB),
      otherKB: Math.round(breakdown.otherKB),
    },
  };
}

/**
 * Deep cleans stale and redundant cache:
 * 1. Purges all duplicate `hostinger_cache_*` keys from localStorage.
 * 2. Purges obsolete CacheStorage service worker caches.
 * 3. Compacts bloated arrays in localStorage while preserving active session & credentials.
 */
export async function cleanSaaSCache(): Promise<CleanCacheResult> {
  const initialMetrics = await getStorageMetrics();
  let staleKeysRemoved = 0;
  let cacheBucketsPurged = 0;

  // 1. Clean localStorage redundant & temporary keys
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Never delete active session, vault credentials, or selected lab
        if (
          key === 'cms_current_user' ||
          key === 'cms_selected_vendor_lab_id' ||
          key === 'cms_lab_credentials_vault_v2' ||
          key === 'hostinger_db_config'
        ) {
          continue;
        }

        // Remove redundant duplicate hostinger_cache keys (IndexedDB already stores these!)
        if (key.startsWith('hostinger_cache_')) {
          keysToRemove.push(key);
        }
        // Remove old backup preview blobs
        else if (key.includes('_backup_preview') || key.startsWith('temp_') || key.startsWith('debug_')) {
          keysToRemove.push(key);
        }
      }

      for (const k of keysToRemove) {
        localStorage.removeItem(k);
        staleKeysRemoved++;
      }

      // 2. Compact large collections in localStorage to latest 50 records
      const compactKeys = ['cms_lab_reports', 'cms_reception_entries', 'cms_vendor_bookings'];
      for (const ck of compactKeys) {
        try {
          const raw = localStorage.getItem(ck);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 50) {
              const trimmed = parsed.slice(-50);
              localStorage.setItem(ck, JSON.stringify(trimmed));
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn('[CacheManager] Error pruning localStorage:', e);
    }
  }

  // 3. Purge obsolete browser CacheStorage (workbox precaches / assets)
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        // Purge old workbox or dev caches
        if (
          name.includes('precache') ||
          name.includes('uploaded-assets') ||
          name.includes('workbox') ||
          name.includes('temp')
        ) {
          await caches.delete(name);
          cacheBucketsPurged++;
        }
      }
    }
  } catch (e) {
    console.warn('[CacheManager] Error purging caches:', e);
  }

  const finalMetrics = await getStorageMetrics();
  const freedBytes = Math.max(0, initialMetrics.totalBytes - finalMetrics.totalBytes);

  return {
    freedBytes,
    freedFormatted: formatBytes(freedBytes),
    remainingBytes: finalMetrics.totalBytes,
    remainingFormatted: finalMetrics.totalFormatted,
    staleKeysRemoved,
    cacheBucketsPurged,
    success: true,
    message: `Cache optimized! Freed ${formatBytes(freedBytes)} of memory & storage.`,
  };
}

export const APP_BUILD_VERSION = '2026.10.06.v2';

/**
 * Automatically purges orphaned cache keys on app startup.
 * Runs silently in the background once.
 */
let hasRunAutoPrune = false;
export function autoPruneOnAppInit(): void {
  if (hasRunAutoPrune || typeof window === 'undefined') return;
  hasRunAutoPrune = true;

  try {
    const savedVersion = window.localStorage ? localStorage.getItem('cms_app_build_version') : null;
    const isNewBuild = savedVersion !== APP_BUILD_VERSION;

    // Immediate sweep for duplicate hostinger_cache_* keys
    if (window.localStorage) {
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('hostinger_cache_') || key.includes('_backup_preview'))) {
          toDelete.push(key);
        }
      }
      if (toDelete.length > 0) {
        for (const k of toDelete) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem('cms_app_build_version', APP_BUILD_VERSION);
    }

    // Purge old precaches and HTML navigation caches so live deployments always show fresh view
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const n of names) {
          if (
            isNewBuild ||
            n.includes('dev-dist') ||
            n.includes('workbox-precache') ||
            n.includes('html-navigation')
          ) {
            caches.delete(n).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    // Trigger immediate service worker update check on live server
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.update().catch(() => {});
        }
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[CacheManager] Auto-prune warning:', err);
  }
}

/**
 * Force Hard Reload: Bypasses all browser caches, clears service worker and reloads fresh version from server
 */
export async function forceFreshReload(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Purge all Service Worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }

    // 2. Unregister active service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }

    // 3. Purge redundant local storage
    if (window.localStorage) {
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('hostinger_cache_') || key.includes('_backup_preview'))) {
          toDelete.push(key);
        }
      }
      for (const k of toDelete) {
        localStorage.removeItem(k);
      }
      localStorage.setItem('cms_app_build_version', APP_BUILD_VERSION);
    }
  } catch {}

  // 4. Force hard navigation to fresh server URL with cache-buster
  const base = window.location.pathname || '/';
  const sep = window.location.search ? '&' : '?';
  const existingSearch = window.location.search || '';
  const freshUrl = `${base}${existingSearch}${sep}_fresh=${Date.now()}`;
  window.location.replace(freshUrl);
}
