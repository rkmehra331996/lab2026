/**
 * INDIANLALAJI.COM - Centralized Laboratory Credentials & Authentication Vault
 * Prevents password loss across sessions, cloud synchronizations, and database updates.
 */

export interface VaultCredential {
  labId: string;
  labName?: string;
  phone: string;
  password: string;
  pin: string;
  email?: string;
  slug?: string;
  ownerName?: string;
  updatedAt?: string;
}

const VAULT_STORAGE_KEY = 'cms_lab_credentials_vault_v2';

// Known hardcoded baseline credentials for demo and registered laboratories
const BASELINE_CREDENTIALS: VaultCredential[] = [
  {
    labId: 'lab-apex',
    labName: 'Apex Diagnostic & Clinical Pathology Laboratory',
    phone: '7087033009',
    password: 'owner123',
    pin: '123456',
    email: 'contact@apexlab.in',
    slug: 'apex',
    ownerName: 'Dr. Rajesh Sharma (Lab Owner)',
  },
  {
    labId: 'lab-citycare',
    labName: 'CityCare Advanced Diagnostics & Scan Centre',
    phone: '9815012345',
    password: 'owner123',
    pin: '123456',
    email: 'support@citycarediagnostics.com',
    slug: 'citycare',
    ownerName: 'Dr. S. K. Narang',
  },
  {
    labId: 'lab-metropath',
    labName: 'MetroPath Scans & Molecular Pathology Hub',
    phone: '9417098765',
    password: 'owner123',
    pin: '123456',
    email: 'info@metropathlabs.in',
    slug: 'metropath',
    ownerName: 'Dr. Arunava Ghosh',
  },
  {
    labId: 'lab-arunlab-7859',
    labName: 'arun lab',
    phone: '1010101010',
    password: 'rahul12345',
    pin: '123456',
    email: '1010101010@indianlalaji.com',
    slug: 'arunlab',
    ownerName: 'arun lab Admin',
  },
  {
    labId: 'lab-jalalab-0523',
    labName: 'jala lab',
    phone: '2020202020',
    password: 'admin12345',
    pin: '123456',
    email: '2020202020@indianlalaji.com',
    slug: 'jalalab',
    ownerName: 'jala lab Admin',
  },
  {
    labId: 'lab-kumarlab-2960',
    labName: 'kumar lab',
    phone: '8285318000',
    password: 'abcde73555',
    pin: '331996',
    email: '7355590075@indianlalaji.com',
    slug: 'kumarlab',
    ownerName: 'kumar lab Admin',
  },
  {
    labId: 'lab-mathlab-7471',
    labName: 'math lab',
    phone: '9080706050',
    password: '12345asdfg',
    pin: '123456',
    email: '9080706050@indianlalaji.com',
    slug: 'mathlab',
    ownerName: 'math lab Admin',
  },
  {
    labId: 'lab-lifeline-due',
    labName: 'LifeLine PathCare Diagnostic Centre',
    phone: '9872011223',
    password: 'owner123',
    pin: '123456',
    email: 'lifeline@indianlalaji.com',
    slug: 'lifeline',
    ownerName: 'LifeLine Admin',
  },
  {
    labId: 'lab-pulse',
    labName: 'Pulse Diagnostics & MRI Centre',
    phone: '9876543210',
    password: 'owner123',
    pin: '123456',
    email: 'pulse@indianlalaji.com',
    slug: 'pulse',
    ownerName: 'Pulse Admin',
  },
  {
    labId: 'lab-carepoint',
    labName: 'CarePoint Clinical Laboratory',
    phone: '9911002233',
    password: 'owner123',
    pin: '123456',
    email: 'carepoint@indianlalaji.com',
    slug: 'carepoint',
    ownerName: 'CarePoint Admin',
  },
  {
    labId: 'lab-sanjivani',
    labName: 'Sanjivani Pathology & Preventive Health Lab',
    phone: '9888123456',
    password: 'owner123',
    pin: '123456',
    email: 'sanjivani@indianlalaji.com',
    slug: 'sanjivani',
    ownerName: 'Sanjivani Admin',
  },
  {
    labId: 'lab-healtech-pending',
    labName: 'HealTech Molecular & Allergy Diagnostic Lab',
    phone: '9779034567',
    password: 'owner123',
    pin: '123456',
    email: 'healtech@indianlalaji.com',
    slug: 'healtech',
    ownerName: 'HealTech Admin',
  },
];

// In-Memory map
const vaultMemoryMap = new Map<string, VaultCredential>();

// Helper to sanitize digits
const cleanDigits = (v?: string) => (v || '').replace(/\D/g, '');
const cleanStr = (v?: string) => (v || '').trim().toLowerCase();

/**
 * Initializes and loads vault from localStorage + baselines
 */
export function initializeCredentialVault(): void {
  // 1. Load baselines
  for (const cred of BASELINE_CREDENTIALS) {
    storeInVault(cred, false);
  }

  // 2. Load stored items from localStorage
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VAULT_STORAGE_KEY);
      if (saved) {
        const parsed: VaultCredential[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            storeInVault(item, false);
          }
        }
      }
    }
  } catch {}
}

/**
 * Persists a credential entry across all search indexes
 */
export function storeInVault(cred: VaultCredential, persist: boolean = true): void {
  if (!cred.labId) return;

  const entry: VaultCredential = {
    ...cred,
    updatedAt: cred.updatedAt || new Date().toISOString(),
  };

  // Index by labId
  vaultMemoryMap.set(cleanStr(cred.labId), entry);
  vaultMemoryMap.set(cleanStr(cred.labId).replace('lab-', ''), entry);

  // Index by phone digits
  const phoneDigits = cleanDigits(cred.phone);
  if (phoneDigits.length >= 7) {
    vaultMemoryMap.set(phoneDigits, entry);
    if (phoneDigits.length >= 10) {
      vaultMemoryMap.set(phoneDigits.slice(-10), entry);
    }
  }

  // Index by email
  if (cred.email) {
    vaultMemoryMap.set(cleanStr(cred.email), entry);
  }

  // Index by slug
  if (cred.slug) {
    vaultMemoryMap.set(cleanStr(cred.slug), entry);
  }

  // Index by labName
  if (cred.labName) {
    vaultMemoryMap.set(cleanStr(cred.labName), entry);
  }

  if (persist && typeof window !== 'undefined') {
    try {
      const allUnique = Array.from(new Set(Array.from(vaultMemoryMap.values())));
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(allUnique));
    } catch {}
  }
}

/**
 * Finds credentials from any identifier (phone, email, labId, slug, labName)
 */
export function findCredentialInVault(identifier: string): VaultCredential | undefined {
  if (!identifier) return undefined;

  const clean = cleanStr(identifier);
  const digits = cleanDigits(identifier);
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;

  // 1. Direct match by clean string (email, id, slug, name)
  if (vaultMemoryMap.has(clean)) {
    return vaultMemoryMap.get(clean);
  }

  // 2. Match without 'lab-' prefix
  if (vaultMemoryMap.has(`lab-${clean}`)) {
    return vaultMemoryMap.get(`lab-${clean}`);
  }
  if (vaultMemoryMap.has(clean.replace(/^lab-/, ''))) {
    return vaultMemoryMap.get(clean.replace(/^lab-/, ''));
  }

  // 3. Match by phone digits
  if (digits.length >= 7) {
    if (vaultMemoryMap.has(digits)) return vaultMemoryMap.get(digits);
    if (vaultMemoryMap.has(last10)) return vaultMemoryMap.get(last10);

    for (const cred of vaultMemoryMap.values()) {
      const cDigits = cleanDigits(cred.phone);
      if (cDigits.length >= 7 && (cDigits.endsWith(last10) || last10.endsWith(cDigits.slice(-10)))) {
        return cred;
      }
    }
  }

  // 4. Fuzzy match across all items
  for (const cred of vaultMemoryMap.values()) {
    if (cred.email && cleanStr(cred.email) === clean) return cred;
    if (cred.slug && cleanStr(cred.slug) === clean) return cred;
    if (cred.labName && (cleanStr(cred.labName).includes(clean) || clean.includes(cleanStr(cred.labName)))) {
      return cred;
    }
  }

  return undefined;
}

// Auto-initialize immediately
initializeCredentialVault();
