/**
 * INDIANLALAJI.COM - High-Performance IndexedDB Storage & Offline Queue Engine
 * 
 * Provides:
 * 1. Persistent, large-capacity local storage for all Lab collections (Reception, Reports, Tests, Settings, etc.)
 * 2. Unsynced changes Queue (Offline Sync Queue) that survives tab closure & computer restarts
 * 3. Fast asynchronous Promise-based API with automatic schema initialization
 * 4. Fallback resilience for non-IndexedDB environments
 */

const DB_NAME = 'IndianLalaji_Lab_DB';
const DB_VERSION = 1;

export const IDB_STORES = {
  COLLECTIONS: 'collections',
  OFFLINE_QUEUE: 'offline_queue',
  APP_META: 'app_meta',
} as const;

export interface IdbQueueItem {
  id: string; // e.g. 'reception_entries_rec_123_1720000000'
  collection: string;
  docId: string;
  action: 'save' | 'delete';
  data?: any;
  timestamp: number;
  syncStatus: 'pending_sync' | 'syncing' | 'failed' | 'synced';
  retryCount?: number;
  lastError?: string;
}

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase | null> | null = null;

/**
 * Initializes and returns the IndexedDB instance
 */
export function getIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store 1: Collections (Key: collectionName, Value: data array or map)
        if (!db.objectStoreNames.contains(IDB_STORES.COLLECTIONS)) {
          db.createObjectStore(IDB_STORES.COLLECTIONS);
        }

        // Store 2: Offline Queue for unsynced records
        if (!db.objectStoreNames.contains(IDB_STORES.OFFLINE_QUEUE)) {
          const queueStore = db.createObjectStore(IDB_STORES.OFFLINE_QUEUE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('collection', 'collection', { unique: false });
          queueStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // Store 3: Application Metadata & Timestamps
        if (!db.objectStoreNames.contains(IDB_STORES.APP_META)) {
          db.createObjectStore(IDB_STORES.APP_META);
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        
        // Handle unexpected closures
        dbInstance.onversionchange = () => {
          dbInstance?.close();
          dbInstance = null;
          dbInitPromise = null;
        };

        resolve(dbInstance);
      };

      request.onerror = (err) => {
        console.warn('[IndexedDB Init Error - Falling back to in-memory/localStorage]:', err);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('[IndexedDB Blocked by another tab]');
        resolve(null);
      };
    } catch (e) {
      console.warn('[IndexedDB Catch Error]:', e);
      resolve(null);
    }
  });

  return dbInitPromise;
}

// -----------------------------------------------------------------------------
// Collection Operations
// -----------------------------------------------------------------------------

/**
 * Saves a full collection into IndexedDB
 */
export async function idbSaveCollection(collectionName: string, data: any): Promise<boolean> {
  const db = await getIndexedDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORES.COLLECTIONS, 'readwrite');
      const store = tx.objectStore(IDB_STORES.COLLECTIONS);
      const req = store.put(data, collectionName);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Retrieves a collection from IndexedDB
 */
export async function idbGetCollection<T = any>(collectionName: string): Promise<T | null> {
  const db = await getIndexedDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORES.COLLECTIONS, 'readonly');
      const store = tx.objectStore(IDB_STORES.COLLECTIONS);
      const req = store.get(collectionName);

      req.onsuccess = () => {
        resolve(req.result !== undefined ? (req.result as T) : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Retrieves all stored collections from IndexedDB at once
 */
export async function idbGetAllCollections(): Promise<Record<string, any>> {
  const db = await getIndexedDb();
  if (!db) return {};

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORES.COLLECTIONS, 'readonly');
      const store = tx.objectStore(IDB_STORES.COLLECTIONS);
      const result: Record<string, any> = {};

      // In modern browsers, openKeyCursor / openCursor
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          result[String(cursor.key)] = cursor.value;
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      req.onerror = () => resolve({});
    } catch {
      resolve({});
    }
  });
}

// -----------------------------------------------------------------------------
// Offline Queue Operations
// -----------------------------------------------------------------------------

/**
 * Adds or updates an item in the offline sync queue
 */
export async function idbEnqueueOfflineItem(item: IdbQueueItem): Promise<boolean> {
  const db = await getIndexedDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORES.OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(IDB_STORES.OFFLINE_QUEUE);
      const req = store.put(item);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Retrieves all pending items in the offline queue (ordered by timestamp)
 */
export async function idbGetOfflineQueue(): Promise<IdbQueueItem[]> {
  const db = await getIndexedDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORES.OFFLINE_QUEUE, 'readonly');
      const store = tx.objectStore(IDB_STORES.OFFLINE_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result as IdbQueueItem[]) || [];
        // Sort chronologically (oldest actions first)
        list.sort((a, b) => a.timestamp - b.timestamp);
        resolve(list);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Removes an item from the offline queue by its unique queue id
 */
export async function idbRemoveOfflineItem(id: string): Promise<boolean> {
  const db = await getIndexedDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORES.OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(IDB_STORES.OFFLINE_QUEUE);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Removes an item from the offline queue by collection and docId
 */
export async function idbRemoveOfflineItemByDoc(collection: string, docId: string): Promise<boolean> {
  const queue = await idbGetOfflineQueue();
  const matches = queue.filter(q => q.collection === collection && q.docId === docId);
  for (const m of matches) {
    await idbRemoveOfflineItem(m.id);
  }
  return true;
}

/**
 * Clears the entire offline queue
 */
export async function idbClearOfflineQueue(): Promise<boolean> {
  const db = await getIndexedDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORES.OFFLINE_QUEUE, 'readwrite');
      const store = tx.objectStore(IDB_STORES.OFFLINE_QUEUE);
      const req = store.clear();

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

// -----------------------------------------------------------------------------
// App Metadata Operations
// -----------------------------------------------------------------------------

export async function idbSetMeta(key: string, value: any): Promise<boolean> {
  const db = await getIndexedDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORES.APP_META, 'readwrite');
      const store = tx.objectStore(IDB_STORES.APP_META);
      const req = store.put(value, key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function idbGetMeta<T = any>(key: string): Promise<T | null> {
  const db = await getIndexedDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORES.APP_META, 'readonly');
      const store = tx.objectStore(IDB_STORES.APP_META);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result !== undefined ? (req.result as T) : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
