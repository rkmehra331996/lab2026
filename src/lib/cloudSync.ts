/**
 * INDIANLALAJI.COM - Hostinger Server & Database Real-Time Synchronization Engine
 * Replaces Firebase Firestore with direct Hostinger Server / Database connection.
 * 
 * Supports:
 * 1. Automatic multi-device synchronization across Reception, Technician, Pathologist, Admin, & Website.
 * 2. Instant local optimistic updates (0ms delay) + background persistent saving to Hostinger.
 * 3. Server-side image uploads (logos, signatures, attachments) to Hostinger /uploads/ directory.
 * 4. Resilient offline queue with automatic reconnection sync.
 */

import { 
  ReceptionPatientEntry, 
  LabReport, 
  HomeCollectionBooking, 
  VendorLabSettings,
  TestItem,
  VendorPackage,
  VendorDoctor,
  VendorBranch,
  CompanySettings,
  PortalWebsiteSections,
  VendorLabDirectoryItem,
  PricingPlan,
  LabStaffAccount,
  ContactSubmission,
  DomainRequest,
  PlanRenewalRequest
} from '../types';
import { optimizeDataUrl } from '../utils/imageOptimizer';
import { storeInVault } from '../utils/credentialVault';
import {
  idbSaveCollection,
  idbGetCollection,
  idbGetAllCollections,
  idbEnqueueOfflineItem,
  idbGetOfflineQueue,
  idbRemoveOfflineItem,
  idbRemoveOfflineItemByDoc,
  idbClearOfflineQueue,
  IdbQueueItem,
} from './indexedDb';

// Collection identifiers on Hostinger server
export const COLLECTIONS = {
  RECEPTION_ENTRIES: 'reception_entries',
  LAB_REPORTS: 'lab_reports',
  BOOKINGS: 'vendor_bookings',
  STAFF: 'lab_staff',
  LAB_SETTINGS: 'lab_settings',
  TESTS: 'lab_tests',
  PACKAGES: 'lab_packages',
  DOCTORS: 'lab_doctors',
  BRANCHES: 'vendor_branches',
  COMPANY_SETTINGS: 'company_settings',
  PORTAL_SECTIONS: 'portal_sections',
  VENDOR_LABS: 'vendor_labs',
  PRICING_PLANS: 'pricing_plans',
  CONTACT_SUBMISSIONS: 'contact_submissions',
  DOMAIN_REQUESTS: 'domain_requests',
  PLAN_REQUESTS: 'plan_requests',
} as const;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface HostingerErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleHostingerError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: HostingerErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.warn('[Hostinger MySQL Sync Info]:', JSON.stringify(errInfo));
}

export function sanitizeForHostingerDb<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data, (_key, value) => {
      return value === undefined ? null : value;
    }));
  } catch {
    return data;
  }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Hostinger API Connection & Multi-Device Polling Engine
// -----------------------------------------------------------------------------

// Canonical alias mapping between frontend camelCase/legacy keys and Hostinger database collection names
const ALIAS_MAP: Record<string, string> = {
  receptionEntries: COLLECTIONS.RECEPTION_ENTRIES,
  reports: COLLECTIONS.LAB_REPORTS,
  bookings: COLLECTIONS.BOOKINGS,
  staff: COLLECTIONS.STAFF,
  labSettingsMap: COLLECTIONS.LAB_SETTINGS,
  tests: COLLECTIONS.TESTS,
  packages: COLLECTIONS.PACKAGES,
  doctors: COLLECTIONS.DOCTORS,
  branches: COLLECTIONS.BRANCHES,
  vendorLabs: COLLECTIONS.VENDOR_LABS,
  companySettings: COLLECTIONS.COMPANY_SETTINGS,
  portalSections: COLLECTIONS.PORTAL_SECTIONS,
  domainRequests: COLLECTIONS.DOMAIN_REQUESTS,
  contactSubmissions: COLLECTIONS.CONTACT_SUBMISSIONS,
  pricingPlans: COLLECTIONS.PRICING_PLANS,
  planRequests: COLLECTIONS.PLAN_REQUESTS,
};

function getPrimaryApiBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();

    // 1. If running on actual Hostinger domain (or any lab subdomain like apex.indianlalaji.com):
    if (host.endsWith('indianlalaji.com') || host.endsWith('indianalala.com')) {
      return window.location.origin;
    }

    // 2. Explicit environment variable
    const envUrl = (import.meta as any).env?.VITE_HOSTINGER_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      let clean = envUrl.trim();
      if (clean.includes('indianalala.com')) {
        clean = clean.replace('indianalala.com', 'indianlalaji.com');
      }
      return clean;
    }

    // 3. For preview environments (run.app, webcontainer, etc.) and localhost:
    // Always use window.location.origin first so the local server endpoints (/api/sync, /api/sync.php)
    // respond with zero latency and avoid cross-origin aborts/timeouts.
    return window.location.origin;
  }
  return 'https://indianlalaji.com';
}

function buildApiUrl(base: string, endpoint: string): string {
  let cleanBase = (base || '').trim();
  cleanBase = cleanBase.replace(/\/+$/, '');
  // Strip trailing /api/sync.php or /api/sync or /api so endpoint is never doubled
  cleanBase = cleanBase.replace(/\/api\/sync(?:\.php)?\/?$/, '');
  cleanBase = cleanBase.replace(/\/api\/?$/, '');

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const sep = cleanEndpoint.includes('?') ? '&' : '?';
  const cacheBuster = `_ts=${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return `${cleanBase}${cleanEndpoint}${sep}${cacheBuster}`;
}

async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs: number = 8000): Promise<any> {
  let controller: AbortController | null = null;
  let timeoutId: any = null;

  if (typeof AbortController !== 'undefined') {
    try {
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        try {
          if (controller && !controller.signal.aborted) {
            controller.abort();
          }
        } catch {
          // Swallow any abort exception safely
        }
      }, timeoutMs);
    } catch {
      // Ignore AbortController creation errors
    }
  }

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller?.signal,
      ...options,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) {
      return null;
    }
    return await res.json().catch(() => null);
  } catch (_err) {
    if (timeoutId) clearTimeout(timeoutId);
    return null;
  }
}

async function callHostingerApi(endpoint: string, options?: RequestInit): Promise<any> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return null;
    }

    const primaryBase = getPrimaryApiBase();
    const primaryUrl = buildApiUrl(primaryBase, endpoint);
    const result = await fetchWithTimeout(primaryUrl, options);
    if (result && (result.status === 'success' || result.success === true || result.status === 'online')) {
      return result;
    }

    // Automatic fallback: If local origin didn't succeed, attempt production Hostinger (or vice-versa)
    if (typeof window !== 'undefined') {
      const fallbackBase = primaryBase === window.location.origin ? 'https://indianlalaji.com' : window.location.origin;
      const fallbackUrl = buildApiUrl(fallbackBase, endpoint);
      const fallbackResult = await fetchWithTimeout(fallbackUrl, options);
      if (fallbackResult && (fallbackResult.status === 'success' || fallbackResult.success === true || fallbackResult.status === 'online')) {
        return fallbackResult;
      }
      return fallbackResult || result;
    }

    return result;
  } catch {
    return null;
  }
}

// Global subscribers registry for multi-device sync
type SubscriberCallback<T> = (data: T) => void;
const subscribersMap: Record<string, Set<SubscriberCallback<any>>> = {};

function notifySubscribers(collection: string, data: any) {
  const listeners = subscribersMap[collection];
  if (listeners && listeners.size > 0) {
    listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('[Sync Subscriber Error]:', err);
      }
    });
  }
}

function registerSubscriber<T>(collection: string, callback: SubscriberCallback<T>): () => void {
  if (!subscribersMap[collection]) {
    subscribersMap[collection] = new Set();
  }
  subscribersMap[collection].add(callback);

  // Return unsubscribe function
  return () => {
    subscribersMap[collection]?.delete(callback);
  };
}

// In-Memory cache of active collections for fast local access
const localCache: Record<string, any> = {};
let lastServerTimestamp = 0;
let isPollingActive = false;
let pollingTimer: any = null;
let isInitialSyncDone = false;

// Real-Time Cross-Tab / In-Browser Sync Channel
const SYNC_CHANNEL_NAME = 'indianlalaji_realtime_sync_v2';
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'SYNC_COLLECTION') {
        const { collection, data } = event.data;
        if (collection && data) {
          setCachedCollection(collection, data);
          notifySubscribers(collection, data);
        }
      }
    };
  }
} catch {}

// In-Memory cache of active collections for ultra-fast 0ms local access
// Heavy collections are persisted in IndexedDB, preventing localStorage 5MB quota blowouts
function getCachedCollection(collection: string): any {
  if (localCache[collection] !== undefined) {
    return localCache[collection];
  }
  return null;
}

function setCachedCollection(collection: string, data: any) {
  localCache[collection] = data;

  // Clean up any old duplicate hostinger_cache keys from localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`hostinger_cache_${collection}`);
    }
  } catch {}

  // Persist asynchronously to browser IndexedDB for high-capacity, non-blocking offline storage
  idbSaveCollection(collection, data).catch((err) => {
    console.warn('[IndexedDB Save Warning]:', err);
  });
}

// Background asynchronous initialization from IndexedDB on startup
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      const idbData = await idbGetAllCollections();
      for (const [colName, colVal] of Object.entries(idbData)) {
        if (colVal !== undefined && colVal !== null) {
          // If memory cache is empty, hydrate from IndexedDB
          if (localCache[colName] === undefined) {
            localCache[colName] = colVal;
            notifySubscribers(colName, colVal);
          }
        }
      }

      // Also hydrate unsynced items from IndexedDB
      const idbQueue = await idbGetOfflineQueue();
      if (idbQueue.length > 0) {
        const memQueue = getOfflineSyncQueue();
        const mergedMap = new Map<string, OfflineQueueItem>();
        for (const item of memQueue) mergedMap.set(`${item.collection}_${item.docId}`, item);
        for (const item of idbQueue) {
          mergedMap.set(`${item.collection}_${item.docId}`, {
            id: item.id,
            collection: item.collection,
            docId: item.docId,
            action: item.action,
            data: item.data,
            timestamp: item.timestamp,
          });
        }
        const mergedList = Array.from(mergedMap.values());
        saveOfflineSyncQueue(mergedList);
      }
    } catch (err) {
      console.warn('[IndexedDB Hydration Notice]:', err);
    }
  }, 100);
}

const ALL_CORE_COLLECTIONS = [
  COLLECTIONS.RECEPTION_ENTRIES,
  COLLECTIONS.LAB_REPORTS,
  COLLECTIONS.BOOKINGS,
  COLLECTIONS.LAB_SETTINGS,
  COLLECTIONS.TESTS,
  COLLECTIONS.PACKAGES,
  COLLECTIONS.DOCTORS,
  COLLECTIONS.BRANCHES,
  COLLECTIONS.STAFF,
  COLLECTIONS.COMPANY_SETTINGS,
  COLLECTIONS.PORTAL_SECTIONS,
  COLLECTIONS.VENDOR_LABS,
  COLLECTIONS.PRICING_PLANS,
  COLLECTIONS.DOMAIN_REQUESTS,
];

let isPollingInProgress = false;

/**
 * Normalizes collection data into the format expected by state and subscriptions
 */
export function normalizeCollectionData(collection: string, rawData: any): any {
  if (rawData === undefined || rawData === null) return rawData;

  // 1. LAB_SETTINGS: Must be a Map keyed by labId (e.g. { 'lab-kumarlab-2960': { ... } })
  if (collection === COLLECTIONS.LAB_SETTINGS) {
    const map: Record<string, VendorLabSettings> = {};
    const items = Array.isArray(rawData) ? rawData : (typeof rawData === 'object' && rawData !== null ? Object.values(rawData) : []);
    const apiBase = getPrimaryApiBase();

    for (const rawItem of items) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      let cleanItem: any = { ...rawItem };

      // Unpack settingsJson if provided as string
      if (typeof cleanItem.settingsJson === 'string' && cleanItem.settingsJson.trim()) {
        try {
          const extra = JSON.parse(cleanItem.settingsJson);
          if (extra && typeof extra === 'object') {
            // CRITICAL: extra contains rich arrays, heroBanners, photos - preserve non-empty over empty SQL defaults
            cleanItem = { ...cleanItem, ...extra };
            // Ensure non-empty images from either source are preserved
            if (!cleanItem.logoUrl && extra.logoUrl) cleanItem.logoUrl = extra.logoUrl;
            if (!cleanItem.featureImageUrl && extra.featureImageUrl) cleanItem.featureImageUrl = extra.featureImageUrl;
            if (!cleanItem.ogImageUrl && extra.ogImageUrl) cleanItem.ogImageUrl = extra.ogImageUrl;
            if (!cleanItem.founderPhotoUrl && extra.founderPhotoUrl) cleanItem.founderPhotoUrl = extra.founderPhotoUrl;
            if (!cleanItem.teamGroupPhotoUrl && extra.teamGroupPhotoUrl) cleanItem.teamGroupPhotoUrl = extra.teamGroupPhotoUrl;
            if (!cleanItem.qrCode1Url && extra.qrCode1Url) cleanItem.qrCode1Url = extra.qrCode1Url;
            if (!cleanItem.qrCode2Url && extra.qrCode2Url) cleanItem.qrCode2Url = extra.qrCode2Url;
            if ((!cleanItem.heroBanners || cleanItem.heroBanners.length === 0) && Array.isArray(extra.heroBanners)) {
              cleanItem.heroBanners = extra.heroBanners;
            }
          }
        } catch {}
      }

      // Unpack sections if provided as string
      if (typeof cleanItem.sections === 'string') {
        try {
          cleanItem.sections = JSON.parse(cleanItem.sections);
        } catch {}
      }

      // Unpack socialMedia if provided as string
      if (typeof cleanItem.socialMedia === 'string' && cleanItem.socialMedia.trim()) {
        try {
          cleanItem.socialMedia = JSON.parse(cleanItem.socialMedia);
        } catch {}
      }

      // Expand any relative /uploads/ URLs to absolute URLs so they never 404 in preview or cross-domains
      const ensureAbsoluteUrl = (url: any) => {
        if (typeof url === 'string' && url.startsWith('/uploads/')) {
          return `${apiBase}${url}`;
        }
        return url;
      };

      if (cleanItem.logoUrl) cleanItem.logoUrl = ensureAbsoluteUrl(cleanItem.logoUrl);
      if (cleanItem.featureImageUrl) cleanItem.featureImageUrl = ensureAbsoluteUrl(cleanItem.featureImageUrl);
      if (cleanItem.ogImageUrl) cleanItem.ogImageUrl = ensureAbsoluteUrl(cleanItem.ogImageUrl);
      if (cleanItem.founderPhotoUrl) cleanItem.founderPhotoUrl = ensureAbsoluteUrl(cleanItem.founderPhotoUrl);
      if (cleanItem.teamGroupPhotoUrl) cleanItem.teamGroupPhotoUrl = ensureAbsoluteUrl(cleanItem.teamGroupPhotoUrl);
      if (cleanItem.qrCode1Url) cleanItem.qrCode1Url = ensureAbsoluteUrl(cleanItem.qrCode1Url);
      if (cleanItem.qrCode2Url) cleanItem.qrCode2Url = ensureAbsoluteUrl(cleanItem.qrCode2Url);
      if (Array.isArray(cleanItem.heroBanners)) {
        cleanItem.heroBanners = cleanItem.heroBanners.map(ensureAbsoluteUrl);
      }
      if (Array.isArray(cleanItem.banners)) {
        cleanItem.banners = cleanItem.banners.map((b: any) => ({
          ...b,
          imageUrl: ensureAbsoluteUrl(b?.imageUrl)
        }));
      }

      const id = cleanItem.labId || cleanItem.id;
      if (id && id !== '0') {
        // Automatically save credentials to vault
        if (cleanItem.phone) {
          storeInVault({
            labId: id,
            labName: cleanItem.labName || cleanItem.name,
            phone: cleanItem.phone,
            password: cleanItem.ownerPassword || cleanItem.password || 'owner123',
            pin: cleanItem.ownerPin || cleanItem.pin || '123456',
            email: cleanItem.email,
            slug: cleanItem.domainPreview ? cleanItem.domainPreview.split('.')[0] : id.replace('lab-', ''),
            ownerName: cleanItem.ownerName,
          }, false);
        }
        map[id] = cleanItem as VendorLabSettings;
      }
    }
    return map;
  }

  // 2. COMPANY_SETTINGS: Must be single object
  if (collection === COLLECTIONS.COMPANY_SETTINGS) {
    if (Array.isArray(rawData)) return rawData[0] || null;
    return rawData;
  }

  // 3. PORTAL_SECTIONS: Must be single object
  if (collection === COLLECTIONS.PORTAL_SECTIONS) {
    if (Array.isArray(rawData)) return rawData[0] || null;
    return rawData;
  }

  // 4. RECEPTION_ENTRIES: Array with proper data types
  if (collection === COLLECTIONS.RECEPTION_ENTRIES && Array.isArray(rawData)) {
    return rawData.map((raw: any) => {
      let item = { ...raw };
      if (typeof item.data === 'string' && item.data.trim()) {
        try {
          const extra = JSON.parse(item.data);
          if (extra && typeof extra === 'object') item = { ...item, ...extra };
        } catch {}
      }
      let parsedTests = item.tests;
      if (!Array.isArray(parsedTests)) {
        if (Array.isArray(item.selectedTests)) parsedTests = item.selectedTests;
        else if (typeof item.selectedTests === 'string') {
          try { parsedTests = JSON.parse(item.selectedTests); } catch { parsedTests = []; }
        } else parsedTests = [];
      }
      return {
        ...item,
        id: item.id || item.uhid,
        patientName: item.patientName || item.name || 'Walk-In Patient',
        mobile: item.mobile || item.patientMobile || '',
        gender: item.gender || item.patientGender || 'Other',
        referringDoctor: item.referringDoctor || item.referredBy || 'Self Walk-In',
        tests: parsedTests,
        paymentMode: item.paymentMode || item.paymentMethod || 'Cash',
        totalAmount: Number(item.totalAmount) || 0,
        paidAmount: Number(item.paidAmount) || 0,
        dueAmount: Number(item.dueAmount) || 0,
        discountINR: Number(item.discountINR || item.discount) || 0,
        _syncStatus: 'synced',
        _syncedAt: item._syncedAt || new Date().toISOString(),
      };
    });
  }

  // 5. LAB_REPORTS: Array with parsed items
  if (collection === COLLECTIONS.LAB_REPORTS && Array.isArray(rawData)) {
    return rawData.map((raw: any) => {
      let item = { ...raw };
      if (typeof item.data === 'string' && item.data.trim()) {
        try {
          const extra = JSON.parse(item.data);
          if (extra && typeof extra === 'object') item = { ...item, ...extra };
        } catch {}
      }
      let parsedItems = item.items;
      if (typeof parsedItems === 'string') {
        try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
      }
      return {
        ...item,
        reportId: item.reportId || item.id,
        items: Array.isArray(parsedItems) ? parsedItems : [],
        verified: Boolean(item.verified),
        isDraft: Boolean(item.isDraft),
        isCancelled: Boolean(item.isCancelled || item.cancelled),
        _syncStatus: 'synced',
        _syncedAt: item._syncedAt || new Date().toISOString(),
      };
    });
  }

  // 6. VENDOR_LABS: Register in vault and normalize
  if (collection === COLLECTIONS.VENDOR_LABS && Array.isArray(rawData)) {
    return rawData.map((raw: any) => {
      const item = { ...raw };
      if (item.phone) {
        storeInVault({
          labId: item.id,
          labName: item.name,
          phone: item.phone,
          password: item.password || 'owner123',
          pin: item.pin || '123456',
          email: item.email,
          slug: item.domainPreview ? item.domainPreview.split('.')[0] : item.id.replace('lab-', ''),
          ownerName: item.ownerName,
        }, false);
      }
      return item;
    });
  }

  // 7. DOCTORS: Map signatureUrl to imageUrl if needed and expand relative uploads
  if (collection === COLLECTIONS.DOCTORS && Array.isArray(rawData)) {
    const apiBase = getPrimaryApiBase();
    return rawData.map((raw: any) => {
      let item = { ...raw };
      if (!item.imageUrl && item.signatureUrl) {
        item.imageUrl = item.signatureUrl;
      }
      if (item.imageUrl && item.imageUrl.startsWith('/uploads/')) {
        item.imageUrl = `${apiBase}${item.imageUrl}`;
      }
      return item;
    });
  }

  // 8. All other collections
  if (Array.isArray(rawData)) {
    return rawData;
  }

  return rawData;
}

/**
 * Checks Hostinger server for any updates made by other devices and synchronizes automatically
 */
export async function pollHostingerServerUpdates(force: boolean = false): Promise<void> {
  if (isPollingInProgress) return;
  isPollingInProgress = true;
  try {
    // 1. On initial load or explicit force refresh: fetch all collections in one fast unified request
    if (!isInitialSyncDone || force) {
      const fullRes = await callHostingerApi('/api/sync.php');
      if (fullRes && fullRes.status === 'success' && fullRes.data) {
        for (const [colName, colData] of Object.entries(fullRes.data)) {
          const normalized = normalizeCollectionData(colName, colData);
          if (normalized !== undefined && normalized !== null) {
            setCachedCollection(colName, normalized);
            notifySubscribers(colName, normalized);
          }
        }
        isInitialSyncDone = true;
        lastServerTimestamp = fullRes.serverTime || Date.now();
        return;
      }
    }

    // 2. Continuous lightweight heartbeat check (every 1.5s)
    const checkRes = await callHostingerApi(`/api/sync.php?action=check_updates&since=${lastServerTimestamp}`);
    if (checkRes && checkRes.status === 'success') {
      const serverTime = checkRes.serverTime || Date.now();
      if (checkRes.hasUpdates) {
        // Data has changed on Hostinger server (from another device): pull latest immediately
        const fullRes = await callHostingerApi('/api/sync.php');
        if (fullRes && fullRes.status === 'success' && fullRes.data) {
          for (const [colName, colData] of Object.entries(fullRes.data)) {
            const normalized = normalizeCollectionData(colName, colData);
            if (normalized !== undefined && normalized !== null) {
              setCachedCollection(colName, normalized);
              notifySubscribers(colName, normalized);
            }
          }
        }
      }
      lastServerTimestamp = serverTime;
    }
  } catch (err) {
    // Silent fail in background polling
  } finally {
    isPollingInProgress = false;
  }
}

/**
 * Force manual immediate refresh from Hostinger server across all collections
 */
export async function forceRefreshAllFromHostinger(): Promise<void> {
  await pollHostingerServerUpdates(true);
}

// -----------------------------------------------------------------------------
// Offline Mode & Local Database Synchronization Queue
// -----------------------------------------------------------------------------
export interface OfflineQueueItem {
  id: string;
  collection: string;
  docId: string;
  action: 'save' | 'delete';
  data?: any;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'hostinger_offline_sync_queue';
type QueueSubscriber = (count: number) => void;
const queueSubscribers = new Set<QueueSubscriber>();

export function getOfflineSyncQueue(): OfflineQueueItem[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineSyncQueue(queue: OfflineQueueItem[]) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    notifyQueueChange();
  } catch {}
}

export function addToOfflineSyncQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) {
  const queue = getOfflineSyncQueue();
  const existingIdx = queue.findIndex(
    (q) => q.collection === item.collection && q.docId === item.docId
  );
  const queueItemId = `${item.collection}_${item.docId}_${Date.now()}`;
  const queueItem: OfflineQueueItem = {
    ...item,
    id: queueItemId,
    timestamp: Date.now(),
  };
  if (existingIdx !== -1) {
    queue[existingIdx] = queueItem;
  } else {
    queue.push(queueItem);
  }
  saveOfflineSyncQueue(queue);

  // Also persist to IndexedDB store
  idbEnqueueOfflineItem({
    id: queueItemId,
    collection: item.collection,
    docId: item.docId,
    action: item.action,
    data: item.data,
    timestamp: Date.now(),
    syncStatus: 'pending_sync',
  }).catch(() => {});
}

export function removeFromOfflineSyncQueue(collection: string, docId: string) {
  const queue = getOfflineSyncQueue().filter(
    (q) => !(q.collection === collection && q.docId === docId)
  );
  saveOfflineSyncQueue(queue);
  idbRemoveOfflineItemByDoc(collection, docId).catch(() => {});
}

export function clearOfflineSyncQueue() {
  saveOfflineSyncQueue([]);
  idbClearOfflineQueue().catch(() => {});
}

export function getPendingOfflineCount(): number {
  return getOfflineSyncQueue().length;
}

export function subscribeOfflineQueueCount(cb: QueueSubscriber): () => void {
  queueSubscribers.add(cb);
  cb(getOfflineSyncQueue().length);
  return () => {
    queueSubscribers.delete(cb);
  };
}

function notifyQueueChange() {
  const count = getOfflineSyncQueue().length;
  queueSubscribers.forEach((cb) => {
    try {
      cb(count);
    } catch {}
  });
}

/**
 * Flushes all pending offline queued items directly to Hostinger MySQL database
 */
export async function flushOfflineSyncQueue(): Promise<{ syncedCount: number; errors: number }> {
  const queue = getOfflineSyncQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, errors: 0 };
  }

  let syncedCount = 0;
  let errors = 0;
  const remaining: OfflineQueueItem[] = [];

  for (const item of queue) {
    try {
      const res = await callHostingerApi('/api/sync.php', {
        method: 'POST',
        body: JSON.stringify({
          action: item.action,
          collection: item.collection,
          id: item.docId,
          data: item.data,
        }),
      });
      if (res && (res.status === 'success' || res.success)) {
        syncedCount++;
        // Remove from IndexedDB
        idbRemoveOfflineItem(item.id).catch(() => {});
        idbRemoveOfflineItemByDoc(item.collection, item.docId).catch(() => {});

        // Mark document in cache as synced
        if (item.action === 'save' && item.collection) {
          const colList = getCachedCollection(item.collection);
          if (Array.isArray(colList)) {
            const doc = colList.find((it: any) => (it.id || it.reportId || it.labId) === item.docId);
            if (doc) {
              doc._syncStatus = 'synced';
              doc._syncedAt = new Date().toISOString();
            }
          }
        }
      } else {
        remaining.push(item);
        errors++;
      }
    } catch {
      remaining.push(item);
      errors++;
    }
  }

  saveOfflineSyncQueue(remaining);
  return { syncedCount, errors };
}

// Auto-Sync Listeners: Reconnect automatically when network comes back
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineSyncQueue().then(() => {
      pollHostingerServerUpdates(true);
    });
  });

  // Background interval: every 20 seconds, if online and queue has items, retry sync
  setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine && getPendingOfflineCount() > 0) {
      flushOfflineSyncQueue();
    }
  }, 20000);
}

/**
 * Universal Bidirectional Sync: Flushes local offline mutations + pulls latest Hostinger MySQL data
 */
export async function syncAllWithHostinger(): Promise<{
  success: boolean;
  syncedOfflineCount: number;
  message: string;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const count = getOfflineSyncQueue().length;
    return {
      success: false,
      syncedOfflineCount: 0,
      message: `Offline Mode: No active internet connection. ${count} item(s) are stored safely in your local application database.`,
    };
  }

  // 1. Flush offline sync queue
  const { syncedCount } = await flushOfflineSyncQueue();

  // 2. Refresh full database from Hostinger server
  try {
    await pollHostingerServerUpdates(true);
  } catch {}

  const remaining = getOfflineSyncQueue().length;
  if (remaining === 0) {
    return {
      success: true,
      syncedOfflineCount: syncedCount,
      message:
        syncedCount > 0
          ? `Successfully synchronized ${syncedCount} offline record(s) with Hostinger MySQL database!`
          : `Hostinger MySQL database is completely synchronized and up-to-date!`,
    };
  } else {
    return {
      success: false,
      syncedOfflineCount: syncedCount,
      message: `Synchronized ${syncedCount} record(s), with ${remaining} pending. Will retry automatically.`,
    };
  }
}

// Start continuous multi-device sync background heartbeat (every 1.5 seconds)
function startMultiDeviceSyncHeartbeat() {
  if (isPollingActive || typeof window === 'undefined') return;
  isPollingActive = true;

  // Initial immediate fetch
  pollHostingerServerUpdates(true);

  // Poll every 1.5 seconds for changes across devices
  pollingTimer = setInterval(() => {
    pollHostingerServerUpdates();
  }, 1500);

  // Poll immediately when user tabs back into the browser or reconnects
  window.addEventListener('focus', () => {
    pollHostingerServerUpdates(true);
  });
  window.addEventListener('online', () => {
    // Automatically flush queue and pull updates on internet restoration!
    syncAllWithHostinger();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pollHostingerServerUpdates(true);
    }
  });
}

// Auto-start heartbeat in browser
if (typeof window !== 'undefined') {
  startMultiDeviceSyncHeartbeat();
}

/**
 * Validates connection to Hostinger server & MySQL Database
 */
export async function testHostingerConnection(): Promise<boolean> {
  try {
    const result = await callHostingerApi('/api/status.php');
    return !!(result && (result.status === 'online' || result.success));
  } catch {
    return false;
  }
}

/**
 * Universal Image Upload to Hostinger /uploads/ directory
 * Supports:
 * - Replacement of old image (deletes previous file on Hostinger server)
 * - Anti-cache busting versioning
 * - Direct MySQL reference recording
 */
export async function uploadImageToHostinger(
  dataUrl: string,
  prefix: string = 'img',
  oldUrl?: string,
  labId: string = 'all',
  imageType: string = 'other'
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }
  try {
    // 1. Optimize image before upload to keep uploads lightweight (20KB - 80KB)
    const optimized = await optimizeDataUrl(dataUrl, {
      maxWidth: 1400,
      maxHeight: 1400,
      quality: 0.84,
      format: 'image/jpeg',
    });
    const finalDataUrl = optimized || dataUrl;

    // 2. Upload to Hostinger server
    const result = await callHostingerApi('/api/upload.php', {
      method: 'POST',
      body: JSON.stringify({
        image: finalDataUrl,
        prefix,
        old_image: oldUrl,
        labId,
        imageType,
      }),
    });

    if (result && result.status === 'success' && (result.fullUrl || result.url)) {
      const apiBase = getPrimaryApiBase();
      let bestUrl = result.fullUrl;
      if (!bestUrl && result.url) {
        bestUrl = result.url.startsWith('http') ? result.url : `${apiBase}${result.url.startsWith('/') ? '' : '/'}${result.url}`;
      }
      return bestUrl || finalDataUrl;
    }
    return finalDataUrl;
  } catch (err) {
    return dataUrl;
  }
}

/**
 * Universal Image Deletion from Hostinger server and MySQL database
 */
export async function deleteImageFromHostinger(imageUrl?: string | null): Promise<boolean> {
  if (!imageUrl || (!imageUrl.includes('/uploads/') && !imageUrl.includes('indianlalaji.com/uploads'))) {
    return false;
  }
  try {
    const result = await callHostingerApi('/api/upload.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete_image',
        url: imageUrl,
      }),
    });
    return !!(result && result.status === 'success');
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Generic Mutation Helper
// -----------------------------------------------------------------------------
async function saveDocumentToHostinger(collection: string, id: string, itemData: any): Promise<void> {
  const sanitized = sanitizeForHostingerDb({ ...itemData, id, _updatedAt: new Date().toISOString() });
  
  // 1. Update local cache immediately for 0ms optimistic UI
  const isCurrentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  sanitized._syncStatus = isCurrentlyOnline ? 'syncing' : 'pending_sync';

  let currentList = getCachedCollection(collection);
  if (Array.isArray(currentList)) {
    const idx = currentList.findIndex((it: any) => (it.id || it.reportId || it.labId) === id);
    if (idx !== -1) {
      currentList[idx] = { ...currentList[idx], ...sanitized };
    } else {
      currentList.unshift(sanitized);
    }
    const updated = [...currentList];
    setCachedCollection(collection, updated);
    notifySubscribers(collection, updated);
    try {
      syncChannel?.postMessage({ type: 'SYNC_COLLECTION', collection, data: updated });
    } catch {}
  } else if (typeof currentList === 'object' && currentList !== null) {
    currentList[id] = sanitized;
    const updated = { ...currentList };
    setCachedCollection(collection, updated);
    notifySubscribers(collection, updated);
    try {
      syncChannel?.postMessage({ type: 'SYNC_COLLECTION', collection, data: updated });
    } catch {}
  }

  // 2. Persist to Hostinger server/database (or enqueue in local offline queue)
  let savedOnline = false;
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    const res = await callHostingerApi('/api/sync.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'save',
        collection,
        id,
        data: sanitized,
      }),
    });
    if (res && (res.status === 'success' || res.success)) {
      savedOnline = true;
      sanitized._syncStatus = 'synced';
      sanitized._syncedAt = new Date().toISOString();
      removeFromOfflineSyncQueue(collection, id);
      if (res.serverTime) {
        lastServerTimestamp = res.serverTime;
      }
    }
  }

  if (!savedOnline) {
    sanitized._syncStatus = 'pending_sync';
    addToOfflineSyncQueue({
      collection,
      docId: id,
      action: 'save',
      data: sanitized,
    });
  }
}

async function deleteDocumentFromHostinger(collection: string, id: string): Promise<void> {
  // 1. Update local cache immediately
  let currentList = getCachedCollection(collection);
  if (Array.isArray(currentList)) {
    const filtered = currentList.filter((it: any) => (it.id || it.reportId || it.labId) !== id);
    setCachedCollection(collection, filtered);
    notifySubscribers(collection, filtered);
    try {
      syncChannel?.postMessage({ type: 'SYNC_COLLECTION', collection, data: filtered });
    } catch {}
  } else if (typeof currentList === 'object' && currentList !== null) {
    delete currentList[id];
    const updated = { ...currentList };
    setCachedCollection(collection, updated);
    notifySubscribers(collection, updated);
    try {
      syncChannel?.postMessage({ type: 'SYNC_COLLECTION', collection, data: updated });
    } catch {}
  }

  // 2. Delete on Hostinger server (or enqueue in local offline queue)
  let deletedOnline = false;
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    const res = await callHostingerApi('/api/sync.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete',
        collection,
        id,
      }),
    });
    if (res && (res.status === 'success' || res.success)) {
      deletedOnline = true;
      removeFromOfflineSyncQueue(collection, id);
    }
  }

  if (!deletedOnline) {
    addToOfflineSyncQueue({
      collection,
      docId: id,
      action: 'delete',
    });
  }
}

// -----------------------------------------------------------------------------
// 1. Lab Settings (Theme, Brand, Logo, UPI, Contact, Centralized Images)
// -----------------------------------------------------------------------------
export async function syncLabSettingsToCloud(
  labId: string,
  settings: Partial<VendorLabSettings>
): Promise<void> {
  try {
    let settingsMap = getCachedCollection(COLLECTIONS.LAB_SETTINGS) || {};
    const prev = settingsMap[labId] || {};

    // 1. Logo Management (Replace & Clean)
    let cleanLogo = settings.logoUrl;
    if (cleanLogo && cleanLogo.startsWith('data:image')) {
      cleanLogo = await uploadImageToHostinger(cleanLogo, `logo_${labId}`, prev.logoUrl, labId, 'logo');
    } else if (cleanLogo === '' && prev.logoUrl) {
      await deleteImageFromHostinger(prev.logoUrl);
    }

    // 2. Founder DP / Photo Management (Replace & Clean)
    let cleanFounderPhoto = settings.founderPhotoUrl;
    if (cleanFounderPhoto && cleanFounderPhoto.startsWith('data:image')) {
      cleanFounderPhoto = await uploadImageToHostinger(cleanFounderPhoto, `dp_${labId}`, prev.founderPhotoUrl, labId, 'dp');
    } else if (cleanFounderPhoto === '' && prev.founderPhotoUrl) {
      await deleteImageFromHostinger(prev.founderPhotoUrl);
    }

    // 3. Team Photo Management
    let cleanTeamPhoto = settings.teamGroupPhotoUrl;
    if (cleanTeamPhoto && cleanTeamPhoto.startsWith('data:image')) {
      cleanTeamPhoto = await uploadImageToHostinger(cleanTeamPhoto, `team_${labId}`, prev.teamGroupPhotoUrl, labId, 'other');
    } else if (cleanTeamPhoto === '' && prev.teamGroupPhotoUrl) {
      await deleteImageFromHostinger(prev.teamGroupPhotoUrl);
    }

    // 4. Billing QR Code 1 Management
    let cleanQr1 = settings.qrCode1Url;
    if (cleanQr1 && cleanQr1.startsWith('data:image')) {
      cleanQr1 = await uploadImageToHostinger(cleanQr1, `qr1_${labId}`, prev.qrCode1Url, labId, 'qr');
    } else if (cleanQr1 === '' && prev.qrCode1Url) {
      await deleteImageFromHostinger(prev.qrCode1Url);
    }

    // 5. Billing QR Code 2 Management
    let cleanQr2 = settings.qrCode2Url;
    if (cleanQr2 && cleanQr2.startsWith('data:image')) {
      cleanQr2 = await uploadImageToHostinger(cleanQr2, `qr2_${labId}`, prev.qrCode2Url, labId, 'qr');
    } else if (cleanQr2 === '' && prev.qrCode2Url) {
      await deleteImageFromHostinger(prev.qrCode2Url);
    }

    // 6. Hero Banners Upload
    let cleanHeroBanners = settings.heroBanners;
    if (Array.isArray(cleanHeroBanners)) {
      cleanHeroBanners = await Promise.all(
        cleanHeroBanners.map(async (banner, idx) => {
          if (banner && banner.startsWith('data:image')) {
            return await uploadImageToHostinger(banner, `banner_${labId}_${idx}`, undefined, labId, 'banner');
          }
          return banner;
        })
      );
    }

    // 7. Banners Array Upload
    let cleanBanners = settings.banners;
    if (Array.isArray(cleanBanners)) {
      cleanBanners = await Promise.all(
        cleanBanners.map(async (banner, idx) => {
          if (banner?.imageUrl && banner.imageUrl.startsWith('data:image')) {
            const uploadedUrl = await uploadImageToHostinger(banner.imageUrl, `banner_${labId}_${idx}`, undefined, labId, 'banner');
            return { ...banner, imageUrl: uploadedUrl };
          }
          return banner;
        })
      );
    }

    // 8. Feature Image & OG Image Management
    let cleanFeatureImage = settings.featureImageUrl;
    if (cleanFeatureImage && cleanFeatureImage.startsWith('data:image')) {
      cleanFeatureImage = await uploadImageToHostinger(cleanFeatureImage, `feature_${labId}`, prev.featureImageUrl, labId, 'banner');
    } else if (cleanFeatureImage === '' && prev.featureImageUrl) {
      await deleteImageFromHostinger(prev.featureImageUrl);
    }

    const payload = {
      ...settings,
      labId,
      ...(cleanLogo !== undefined ? { logoUrl: cleanLogo } : {}),
      ...(cleanFounderPhoto !== undefined ? { founderPhotoUrl: cleanFounderPhoto } : {}),
      ...(cleanTeamPhoto !== undefined ? { teamGroupPhotoUrl: cleanTeamPhoto } : {}),
      ...(cleanQr1 !== undefined ? { qrCode1Url: cleanQr1 } : {}),
      ...(cleanQr2 !== undefined ? { qrCode2Url: cleanQr2 } : {}),
      ...(cleanHeroBanners !== undefined ? { heroBanners: cleanHeroBanners } : {}),
      ...(cleanBanners !== undefined ? { banners: cleanBanners } : {}),
      ...(cleanFeatureImage !== undefined ? { featureImageUrl: cleanFeatureImage, ogImageUrl: cleanFeatureImage } : {}),
      _updatedAt: new Date().toISOString(),
    };

    settingsMap[labId] = { ...(settingsMap[labId] || {}), ...payload };
    setCachedCollection(COLLECTIONS.LAB_SETTINGS, settingsMap);
    notifySubscribers(COLLECTIONS.LAB_SETTINGS, settingsMap);

    const saveRes = await callHostingerApi('/api/sync.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'save',
        collection: COLLECTIONS.LAB_SETTINGS,
        id: labId,
        data: payload,
      }),
    });
    if (saveRes && saveRes.serverTime) {
      lastServerTimestamp = saveRes.serverTime;
    } else {
      lastServerTimestamp = Date.now();
    }
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.LAB_SETTINGS}/${labId}`);
  }
}

export function subscribeToLabSettings(
  callback: (settingsMap: Record<string, VendorLabSettings>) => void,
  _onError?: (err?: any) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.LAB_SETTINGS);
  const normalized = normalizeCollectionData(COLLECTIONS.LAB_SETTINGS, cached);
  if (normalized && Object.keys(normalized).length > 0) {
    callback(normalized);
  }
  return registerSubscriber(COLLECTIONS.LAB_SETTINGS, (data) => {
    const cleanMap = normalizeCollectionData(COLLECTIONS.LAB_SETTINGS, data);
    if (cleanMap && Object.keys(cleanMap).length > 0) {
      callback(cleanMap);
    }
  });
}

export async function fetchAllLabSettingsFromCloud(): Promise<Record<string, VendorLabSettings>> {
  try {
    const res = await callHostingerApi(`/api/sync.php?action=get_collection&collection=${COLLECTIONS.LAB_SETTINGS}`);
    if (res && res.status === 'success' && res.data) {
      if (Array.isArray(res.data)) {
        const map: Record<string, VendorLabSettings> = {};
        for (const item of res.data) {
          const id = item.labId || item.id;
          if (id) map[id] = item;
        }
        return map;
      } else if (typeof res.data === 'object' && res.data !== null) {
        return res.data;
      }
    }
  } catch {}
  return getCachedCollection(COLLECTIONS.LAB_SETTINGS) || {};
}

// -----------------------------------------------------------------------------
// 2. Tests (Add, Edit, Delete, Update)
// -----------------------------------------------------------------------------
export async function syncTestToCloud(test: TestItem): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.TESTS, test.id, test);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.TESTS}/${test.id}`);
  }
}

export async function deleteTestFromCloud(testId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.TESTS, testId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.TESTS}/${testId}`);
  }
}

export function subscribeToTests(callback: (tests: TestItem[]) => void): () => void {
  const cached = getCachedCollection(COLLECTIONS.TESTS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.TESTS, callback);
}

// -----------------------------------------------------------------------------
// 3. Packages / Health Products (Add, Edit, Delete, Update)
// -----------------------------------------------------------------------------
export async function syncPackageToCloud(pkg: VendorPackage): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.PACKAGES, pkg.id, pkg);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.PACKAGES}/${pkg.id}`);
  }
}

export async function deletePackageFromCloud(pkgId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.PACKAGES, pkgId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.PACKAGES}/${pkgId}`);
  }
}

export function subscribeToPackages(callback: (packages: VendorPackage[]) => void): () => void {
  const cached = getCachedCollection(COLLECTIONS.PACKAGES);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.PACKAGES, callback);
}

// -----------------------------------------------------------------------------
// 4. Doctors & Pathologists (Signature Uploads, Edit, Delete)
// -----------------------------------------------------------------------------
export async function syncDoctorToCloud(docItem: VendorDoctor): Promise<void> {
  try {
    let cleanImage = docItem.imageUrl || (docItem as any).signatureUrl;
    if (cleanImage && cleanImage.startsWith('data:image')) {
      cleanImage = await uploadImageToHostinger(cleanImage, `doc_${docItem.id}`);
    }

    const payload = { ...docItem, imageUrl: cleanImage };
    await saveDocumentToHostinger(COLLECTIONS.DOCTORS, docItem.id, payload);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.DOCTORS}/${docItem.id}`);
  }
}

export async function deleteDoctorFromCloud(docId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.DOCTORS, docId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.DOCTORS}/${docId}`);
  }
}

export function subscribeToDoctors(
  callback: (doctors: VendorDoctor[]) => void,
  _onError?: (err?: any) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.DOCTORS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.DOCTORS, callback);
}

// -----------------------------------------------------------------------------
// 5. Branches & Counters (Device A, B, Reception Desks)
// -----------------------------------------------------------------------------
export async function syncBranchToCloud(branch: VendorBranch): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.BRANCHES, branch.id, branch);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.BRANCHES}/${branch.id}`);
  }
}

export async function deleteBranchFromCloud(branchId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.BRANCHES, branchId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.BRANCHES}/${branchId}`);
  }
}

export function subscribeToBranches(
  callback: (branches: VendorBranch[]) => void,
  _onError?: (err?: any) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.BRANCHES);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.BRANCHES, callback);
}

// -----------------------------------------------------------------------------
// 6. Reception Patient Entries (Queue, Tokens, Billing, Barcodes)
// -----------------------------------------------------------------------------
export async function syncReceptionEntryToCloud(entry: ReceptionPatientEntry): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.RECEPTION_ENTRIES, entry.id, entry);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.RECEPTION_ENTRIES}/${entry.id}`);
  }
}

export async function deleteReceptionEntryFromCloud(entryId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.RECEPTION_ENTRIES, entryId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.RECEPTION_ENTRIES}/${entryId}`);
  }
}

export function subscribeToReceptionEntries(
  callback: (entries: ReceptionPatientEntry[]) => void,
  _onError?: (err?: any) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.RECEPTION_ENTRIES);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.RECEPTION_ENTRIES, callback);
}

// -----------------------------------------------------------------------------
// 7. Lab Reports (Test Results, Digital Signatures, Approvals)
// -----------------------------------------------------------------------------
export async function syncLabReportToCloud(report: LabReport): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.LAB_REPORTS, report.reportId, report);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.LAB_REPORTS}/${report.reportId}`);
  }
}

export async function deleteLabReportFromCloud(reportId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.LAB_REPORTS, reportId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.LAB_REPORTS}/${reportId}`);
  }
}

export function subscribeToLabReports(
  callback: (reports: LabReport[]) => void,
  _onError?: (err?: any) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.LAB_REPORTS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.LAB_REPORTS, callback);
}

export async function fetchReportsFromServer(): Promise<LabReport[]> {
  try {
    const res = await callHostingerApi(`/api/sync.php?action=get_collection&collection=${COLLECTIONS.LAB_REPORTS}`);
    if (res && res.status === 'success' && Array.isArray(res.data)) {
      setCachedCollection(COLLECTIONS.LAB_REPORTS, res.data);
      return res.data;
    }
  } catch {}
  return getCachedCollection(COLLECTIONS.LAB_REPORTS) || [];
}

export async function fetchReceptionEntriesFromServer(): Promise<ReceptionPatientEntry[]> {
  try {
    const res = await callHostingerApi(`/api/sync.php?action=get_collection&collection=${COLLECTIONS.RECEPTION_ENTRIES}`);
    if (res && res.status === 'success' && Array.isArray(res.data)) {
      setCachedCollection(COLLECTIONS.RECEPTION_ENTRIES, res.data);
      return res.data;
    }
  } catch {}
  return getCachedCollection(COLLECTIONS.RECEPTION_ENTRIES) || [];
}

// -----------------------------------------------------------------------------
// 8. Home Collection Bookings
// -----------------------------------------------------------------------------
export async function syncBookingToCloud(booking: HomeCollectionBooking): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.BOOKINGS, booking.id, booking);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.BOOKINGS}/${booking.id}`);
  }
}

export async function deleteBookingFromCloud(bookingId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.BOOKINGS, bookingId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.BOOKINGS}/${bookingId}`);
  }
}

export function subscribeToBookings(
  callback: (bookings: HomeCollectionBooking[]) => void,
  _onError?: (err?: any) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.BOOKINGS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.BOOKINGS, callback);
}

// -----------------------------------------------------------------------------
// 9. Initial Seeding of Platform Data to Hostinger Server
// -----------------------------------------------------------------------------
export async function seedInitialHostingerData(
  initialEntries: ReceptionPatientEntry[],
  initialReports: LabReport[],
  initialSettingsMap: Record<string, VendorLabSettings>,
  initialTests: TestItem[],
  initialPackages: VendorPackage[],
  initialDoctors: VendorDoctor[],
  initialCompanySettings: CompanySettings,
  initialPortalSections: PortalWebsiteSections,
  initialLabs: VendorLabDirectoryItem[],
  initialPricingPlans: PricingPlan[],
  initialStaff: LabStaffAccount[],
  initialBranches: VendorBranch[]
): Promise<void> {
  try {
    const payload = {
      action: 'seed_all',
      collections: {
        [COLLECTIONS.RECEPTION_ENTRIES]: initialEntries,
        [COLLECTIONS.LAB_REPORTS]: initialReports,
        [COLLECTIONS.LAB_SETTINGS]: Object.values(initialSettingsMap || {}),
        [COLLECTIONS.TESTS]: initialTests,
        [COLLECTIONS.PACKAGES]: initialPackages,
        [COLLECTIONS.DOCTORS]: initialDoctors,
        [COLLECTIONS.COMPANY_SETTINGS]: [{ id: 'main', ...initialCompanySettings }],
        [COLLECTIONS.PORTAL_SECTIONS]: [{ id: 'main', ...initialPortalSections }],
        [COLLECTIONS.VENDOR_LABS]: initialLabs,
        [COLLECTIONS.PRICING_PLANS]: initialPricingPlans,
        [COLLECTIONS.STAFF]: initialStaff,
        [COLLECTIONS.BRANCHES]: initialBranches,
      },
    };

    await callHostingerApi('/api/sync.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, 'seed_data');
  }
}
export const seedInitialFirestoreData = seedInitialHostingerData;

// -----------------------------------------------------------------------------
// 10. Company Settings (indianlalaji.com Platform Settings)
// -----------------------------------------------------------------------------
export async function syncCompanySettingsToCloud(settings: CompanySettings): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.COMPANY_SETTINGS, 'main', settings);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.COMPANY_SETTINGS}/main`);
  }
}

export function subscribeToCompanySettings(
  callback: (settings: CompanySettings | null) => void,
  _onError?: (err?: any) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.COMPANY_SETTINGS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached[0]);
  } else if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
    callback(cached as CompanySettings);
  }
  return registerSubscriber(COLLECTIONS.COMPANY_SETTINGS, (data) => {
    if (Array.isArray(data) && data.length > 0) callback(data[0]);
    else if (data && typeof data === 'object' && Object.keys(data).length > 0) callback(data as CompanySettings);
  });
}

// -----------------------------------------------------------------------------
// 11. Portal Sections (Toggle Visibility of Sections)
// -----------------------------------------------------------------------------
export async function syncPortalSectionsToCloud(sections: PortalWebsiteSections): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.PORTAL_SECTIONS, 'main', sections);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.PORTAL_SECTIONS}/main`);
  }
}

export function subscribeToPortalSections(
  callback: (sections: PortalWebsiteSections | null) => void,
  _onError?: (err?: any) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.PORTAL_SECTIONS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached[0]);
  } else if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
    callback(cached as PortalWebsiteSections);
  }
  return registerSubscriber(COLLECTIONS.PORTAL_SECTIONS, (data) => {
    if (Array.isArray(data) && data.length > 0) callback(data[0]);
    else if (data && typeof data === 'object' && Object.keys(data).length > 0) callback(data as PortalWebsiteSections);
  });
}

// -----------------------------------------------------------------------------
// 12. Vendor Labs Directory (Har Lab Ka Apna URL)
// -----------------------------------------------------------------------------
export async function syncVendorLabToCloud(lab: VendorLabDirectoryItem): Promise<void> {
  try {
    let cachedLabs: VendorLabDirectoryItem[] = getCachedCollection(COLLECTIONS.VENDOR_LABS) || [];
    const prev = Array.isArray(cachedLabs) ? cachedLabs.find((l) => l.id === lab.id) : null;
    let cleanLogo = lab.logoUrl;
    if (cleanLogo && cleanLogo.startsWith('data:image')) {
      cleanLogo = await uploadImageToHostinger(cleanLogo, `lablogo_${lab.id}`, prev?.logoUrl, lab.id, 'logo');
    } else if (cleanLogo === '' && prev?.logoUrl) {
      await deleteImageFromHostinger(prev.logoUrl);
    }
    const payload = { ...lab, logoUrl: cleanLogo };
    await saveDocumentToHostinger(COLLECTIONS.VENDOR_LABS, lab.id, payload);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.VENDOR_LABS}/${lab.id}`);
  }
}

export async function deleteVendorLabFromCloud(labId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.VENDOR_LABS, labId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.VENDOR_LABS}/${labId}`);
  }
}

export function subscribeToVendorLabs(
  callback: (labs: VendorLabDirectoryItem[]) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.VENDOR_LABS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.VENDOR_LABS, callback);
}

// -----------------------------------------------------------------------------
// 13. Pricing Plans (1 Month, 3 Months, 1 Year SaaS Subscriptions)
// -----------------------------------------------------------------------------
export async function syncPricingPlanToCloud(plan: PricingPlan): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.PRICING_PLANS, plan.id, plan);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.PRICING_PLANS}/${plan.id}`);
  }
}

export async function deletePricingPlanFromCloud(planId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.PRICING_PLANS, planId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.PRICING_PLANS}/${planId}`);
  }
}

export function subscribeToPricingPlans(callback: (plans: PricingPlan[]) => void): () => void {
  const cached = getCachedCollection(COLLECTIONS.PRICING_PLANS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.PRICING_PLANS, callback);
}

// -----------------------------------------------------------------------------
// 14. Staff Accounts (Receptionists, Technicians, Pathologists, Admins)
// -----------------------------------------------------------------------------
export async function syncStaffAccountToCloud(staff: LabStaffAccount): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.STAFF, staff.id, staff);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.STAFF}/${staff.id}`);
  }
}

export async function deleteStaffAccountFromCloud(staffId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.STAFF, staffId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.STAFF}/${staffId}`);
  }
}

export function subscribeToStaffAccounts(
  callback: (staff: LabStaffAccount[]) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.STAFF);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.STAFF, callback);
}

// -----------------------------------------------------------------------------
// 15. Contact Submissions
// -----------------------------------------------------------------------------
export async function syncContactSubmissionToCloud(submission: ContactSubmission): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.CONTACT_SUBMISSIONS, submission.id, submission);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.CONTACT_SUBMISSIONS}/${submission.id}`);
  }
}

export async function deleteContactSubmissionFromCloud(submissionId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.CONTACT_SUBMISSIONS, submissionId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.CONTACT_SUBMISSIONS}/${submissionId}`);
  }
}

export function subscribeToContactSubmissions(
  callback: (submissions: ContactSubmission[]) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.CONTACT_SUBMISSIONS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.CONTACT_SUBMISSIONS, callback);
}

// -----------------------------------------------------------------------------
// 16. Domain Requests (Custom Domains & Subdomains)
// -----------------------------------------------------------------------------
export async function syncDomainRequestToCloud(req: DomainRequest): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.DOMAIN_REQUESTS, req.id, req);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.DOMAIN_REQUESTS}/${req.id}`);
  }
}

export async function deleteDomainRequestFromCloud(requestId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.DOMAIN_REQUESTS, requestId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.DOMAIN_REQUESTS}/${requestId}`);
  }
}

export function subscribeToDomainRequests(
  callback: (requests: DomainRequest[]) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.DOMAIN_REQUESTS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.DOMAIN_REQUESTS, callback);
}

// -----------------------------------------------------------------------------
// 17. Plan Renewal Requests (Hostinger MySQL & Super Admin Queue)
// -----------------------------------------------------------------------------
export async function syncPlanRequestToHostinger(req: PlanRenewalRequest): Promise<void> {
  try {
    await saveDocumentToHostinger(COLLECTIONS.PLAN_REQUESTS, req.id, req);
  } catch (err) {
    handleHostingerError(err, OperationType.WRITE, `${COLLECTIONS.PLAN_REQUESTS}/${req.id}`);
  }
}

export async function deletePlanRequestFromHostinger(requestId: string): Promise<void> {
  try {
    await deleteDocumentFromHostinger(COLLECTIONS.PLAN_REQUESTS, requestId);
  } catch (err) {
    handleHostingerError(err, OperationType.DELETE, `${COLLECTIONS.PLAN_REQUESTS}/${requestId}`);
  }
}

export function subscribeToPlanRequests(
  callback: (requests: PlanRenewalRequest[]) => void
): () => void {
  const cached = getCachedCollection(COLLECTIONS.PLAN_REQUESTS);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }
  return registerSubscriber(COLLECTIONS.PLAN_REQUESTS, callback);
}
