/**
 * INDIANLALAJI.COM - HOSTINGER BACKEND API CLIENT
 * 
 * Provides centralized real-time sync across all devices (admin laptop, client mobile,
 * reception, technician) via Hostinger PHP/MySQL backend or Node.js/Express server.
 */

export interface HostingerSyncPayload {
  labSettingsMap?: Record<string, any>;
  tests?: any[];
  packages?: any[];
  doctors?: any[];
  branches?: any[];
  receptionEntries?: any[];
  reports?: any[];
  bookings?: any[];
  staff?: any[];
  vendorLabs?: any[];
  companySettings?: any;
  portalSections?: any;
  domainRequests?: any[];
  contactSubmissions?: any[];
  pricingPlans?: any[];
}

export interface HostingerServerStatus {
  online: boolean;
  mode: 'mysql' | 'json_file' | 'express_dev' | 'offline';
  message: string;
  timestamp?: string;
  version?: string;
}

// Resolve API base path automatically (works on Hostinger /api/sync.php and Dev /api/sync)
const getApiEndpoint = (): string => {
  // If running in browser, check if we're on a path or root
  return '/api/sync';
};

/**
 * Health check to verify Hostinger / Local Server connection
 */
export async function checkHostingerHealth(): Promise<HostingerServerStatus> {
  try {
    // Try standard /api/sync?action=ping first, then /api/sync.php?action=ping
    let res = await fetch('/api/sync?action=ping', { cache: 'no-store' }).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch('/api/sync.php?action=ping', { cache: 'no-store' }).catch(() => null);
    }

    if (res && res.ok) {
      const data = await res.json();
      return {
        online: true,
        mode: data.mode || 'json_file',
        message: data.message || 'Hostinger API Connected',
        timestamp: data.timestamp || new Date().toISOString(),
        version: data.version || '1.0.0',
      };
    }
  } catch (e) {
    console.warn('[Hostinger API Health Check Failed]:', e);
  }

  return {
    online: false,
    mode: 'offline',
    message: 'Backend server not responding. Using local browser cache.',
  };
}

/**
 * Fetch all sync data from Hostinger / Central Server
 */
export async function fetchHostingerSyncData(): Promise<HostingerSyncPayload | null> {
  try {
    let res = await fetch('/api/sync?action=get_all', { cache: 'no-store' }).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch('/api/sync.php?action=get_all', { cache: 'no-store' }).catch(() => null);
    }

    if (res && res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as HostingerSyncPayload;
      }
    }
  } catch (err) {
    console.warn('[Hostinger API Fetch Error]:', err);
  }
  return null;
}

/**
 * Save an update to Hostinger / Central Server
 */
export async function saveToHostingerServer(
  collectionKey: keyof HostingerSyncPayload,
  data: any,
  action: 'save' | 'delete' = 'save',
  id?: string
): Promise<boolean> {
  try {
    const payload = {
      action,
      collection: collectionKey,
      data,
      id,
      timestamp: new Date().toISOString(),
    };

    let res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch('/api/sync.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(() => null);
    }

    if (res && res.ok) {
      const result = await res.json();
      return !!result.success;
    }
  } catch (err) {
    console.warn('[Hostinger API Save Error]:', err);
  }
  return false;
}

/**
 * Broadcast Channel for instant same-browser cross-tab sync
 */
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('indianlalaji_hostinger_sync')
  : null;

export function notifyLocalTabsOfChange(collectionKey: string) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'DATA_UPDATED', collection: collectionKey, time: Date.now() });
    } catch {}
  }
}

export function listenToLocalTabChanges(callback: (collection: string) => void): () => void {
  if (!syncChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type === 'DATA_UPDATED') {
      callback(event.data.collection);
    }
  };
  syncChannel.addEventListener('message', handler);
  return () => syncChannel.removeEventListener('message', handler);
}
