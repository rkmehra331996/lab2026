/**
 * Hostinger MySQL & REST Database Integration
 * Enables direct data persistence on Hostinger Web Hosting / cPanel MySQL databases.
 */

export interface HostingerDbConfig {
  host?: string;
  user?: string;
  database?: string;
  port?: number;
  apiUrl?: string;
}

// Configured Hostinger REST API Base URL
const HOSTINGER_API_BASE = (import.meta as any).env?.VITE_HOSTINGER_API_URL || '/api/hostinger';

/**
 * Checks connection to Hostinger Database API
 */
export async function testHostingerConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${HOSTINGER_API_BASE}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, message: `Hostinger Server responded with HTTP ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, message: data.message || 'Hostinger Database Connected!' };
  } catch (err: any) {
    return {
      ok: false,
      message: err.message || 'Unable to connect to Hostinger Database endpoint',
    };
  }
}

/**
 * Syncs an entity to Hostinger Database
 */
export async function syncToHostinger(table: string, data: any): Promise<boolean> {
  try {
    const res = await fetch(`${HOSTINGER_API_BASE}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Deletes an entity from Hostinger Database
 */
export async function deleteFromHostinger(table: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(`${HOSTINGER_API_BASE}/${table}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetches records from Hostinger Database table
 */
export async function fetchFromHostinger<T = any>(table: string, labId?: string): Promise<T[]> {
  try {
    const url = new URL(`${window.location.origin}${HOSTINGER_API_BASE}/${table}`);
    if (labId) url.searchParams.set('labId', labId);
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
