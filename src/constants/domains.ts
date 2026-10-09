/**
 * Central Domain Configuration for INDIANLALAJI.COM Healthcare Platform
 * "Har Lab Ka Apna URL" - Every Diagnostic Lab has its own dedicated website shop URL:
 * Format: indianlalaji.com/shop/VENDOR_ID
 */

export const SUPER_ADMIN_DOMAIN = 'indianlalaji.com';
export const SUPER_ADMIN_NAME = 'INDIANLALAJI.COM';
export const SUPER_ADMIN_EMAIL = 'admin@indianlalaji.com';
export const SUPPORT_PHONE = '7087033009';
export const SUPPORT_PHONE_FORMATTED = '+91 7087033009';

/**
 * Returns clean vendor slug/ID for a lab (e.g. 'lab-baburamlab-6535', 'lab-apex')
 */
export function getTenantSubdomain(subdomainOrDomain?: string): string {
  if (!subdomainOrDomain) return 'lab-apex';
  const clean = subdomainOrDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

  // 1. If it's already a shop URL path: /shop/lab-baburamlab-6535 -> lab-baburamlab-6535
  if (clean.includes('/shop/')) {
    return clean.split('/shop/')[1].split('/')[0].split('?')[0].split('#')[0];
  }
  if (clean.includes('/lab/')) {
    return clean.split('/lab/')[1].split('/')[0].split('?')[0].split('#')[0];
  }

  // 2. If it's already a full lab ID (e.g. 'lab-baburamlab-6535' or 'lab-apex'), preserve it completely
  if (clean.startsWith('lab-') && !clean.includes('.')) {
    return clean;
  }

  // 3. If it's a subdomain on indianlalaji.com or indianalala.com (e.g. baburamlab.indianlalaji.com)
  if (clean.endsWith('indianlalaji.com') || clean.endsWith('indianalala.com')) {
    const withoutSuffix = clean.replace(/\.?(indianlalaji|indianalala)\.com$/, '');
    const parts = withoutSuffix.split('.');
    const sub = parts[parts.length - 1];
    if (sub && sub !== 'www' && sub !== 'app' && sub !== 'report' && sub !== 'admin') {
      // Look up full lab ID from directory in localStorage if available
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('cms_vendor_labs_directory');
          if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list)) {
              const matched = list.find((l: any) =>
                (l.id && l.id.toLowerCase() === sub) ||
                (l.id && l.id.toLowerCase() === `lab-${sub}`) ||
                (l.domainPreview && l.domainPreview.toLowerCase().includes(sub)) ||
                (l.slug && l.slug.toLowerCase() === sub) ||
                (l.id && l.id.toLowerCase().includes(sub))
              );
              if (matched && matched.id) return matched.id;
            }
          }
        }
      } catch {}
      return sub.startsWith('lab-') ? sub : `lab-${sub}`;
    }
  }

  // 4. Fallback dot splitting
  if (clean.includes('.')) {
    const part = clean.split('.')[0];
    if (part !== 'indianlalaji' && part !== 'www') {
      return part.startsWith('lab-') ? part : `lab-${part}`;
    }
  }

  return clean.startsWith('lab-') ? clean : `lab-${clean}`;
}

/**
 * Returns canonical vendor shop URL on indianlalaji.com:
 * https://indianlalaji.com/shop/VENDOR_ID
 * e.g. https://indianlalaji.com/shop/lab-baburamlab-6535
 */
export function getVendorShopUrl(vendorIdOrSlug?: string): string {
  const cleanId = getTenantSubdomain(vendorIdOrSlug);
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${cleanId}`;
}

/**
 * Returns relative pathname for vendor shop:
 * /shop/VENDOR_ID
 */
export function getTenantShopPath(vendorIdOrSlug?: string): string {
  const cleanId = getTenantSubdomain(vendorIdOrSlug);
  return `/shop/${cleanId}`;
}

/**
 * Returns the 100% working live direct link for any browser/environment:
 * e.g. https://<domain>/shop/VENDOR_ID or https://indianlalaji.com/shop/VENDOR_ID
 */
export function getTenantDirectUrl(subdomainOrDomain?: string): string {
  const cleanId = getTenantSubdomain(subdomainOrDomain);
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/shop/${cleanId}`;
  }
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${cleanId}`;
}

/**
 * Returns formatted canonical website/shop URL for a vendor
 * e.g., https://indianlalaji.com/shop/lab-baburamlab-6535 or custom domain if configured
 */
export function getTenantWebsiteUrl(subdomainOrDomain?: string): string {
  if (!subdomainOrDomain) return `https://${SUPER_ADMIN_DOMAIN}/shop/lab-apex`;
  const clean = subdomainOrDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  // Custom domains without indianlalaji.com or indianalala.com
  if (clean.includes('.') && !clean.includes('indianlalaji.com') && !clean.includes('indianalala.com')) {
    return `https://${clean}`;
  }
  const cleanId = getTenantSubdomain(subdomainOrDomain);
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${cleanId}`;
}

/**
 * Generates an active, interactive preview link that works directly in the user's browser/preview
 * as well as direct link on indianlalaji.com: indianlalaji.com/shop/VENDOR_ID
 */
export function getTenantBrowserUrl(subdomainOrDomain: string, targetView: string = 'vendor_website'): string {
  const cleanId = getTenantSubdomain(subdomainOrDomain);
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    if (targetView === 'vendor_website') {
      return `${origin}/shop/${cleanId}`;
    }
    return `${origin}/?lab=${cleanId}&view=${targetView}`;
  }
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${cleanId}`;
}

export function getSuperAdminDashboardUrl(): string {
  return `https://${SUPER_ADMIN_DOMAIN}/admin`;
}

/**
 * Normalizes any vendor URL or slug to canonical directory format:
 * e.g. 'https://baburamlab.indianlalaji.com' -> 'https://indianlalaji.com/shop/baburamlab'
 * e.g. 'baburamlab' -> 'https://indianlalaji.com/shop/baburamlab'
 * e.g. 'lab-1020304050' -> 'https://indianlalaji.com/shop/lab-1020304050'
 * External custom domains (e.g. apexdiag.in) are preserved as https://apexdiag.in
 */
export function normalizeToDirectoryUrl(urlOrSlugOrId?: string): string {
  if (!urlOrSlugOrId) return `https://${SUPER_ADMIN_DOMAIN}/shop/lab-apex`;
  let str = urlOrSlugOrId.trim();
  str = str.replace(/^https?:\/\//i, '').replace(/\/$/, '');

  // 1. Independent external custom domain check (e.g. apexdiag.in, baburamlab.com)
  // Must have dot and NOT contain indianlalaji.com or indianalala.com or localhost
  if (
    str.includes('.') &&
    !str.includes('indianlalaji.com') &&
    !str.includes('indianalala.com') &&
    !str.includes('localhost') &&
    !str.includes('/shop/')
  ) {
    return `https://${str.toLowerCase()}`;
  }

  // 2. Extract clean lab slug/id from directory path or subdomain
  if (str.includes('/shop/')) {
    str = str.split('/shop/')[1].split('/')[0].split('?')[0].split('#')[0];
  } else if (str.includes('/lab/')) {
    str = str.split('/lab/')[1].split('/')[0].split('?')[0].split('#')[0];
  } else if (str.toLowerCase().endsWith('.indianlalaji.com') || str.toLowerCase().endsWith('.indianalala.com')) {
    // e.g. baburamlab.indianlalaji.com -> baburamlab
    str = str.replace(/\.?(indianlalaji|indianalala)\.com$/i, '');
    const parts = str.split('.');
    str = parts[parts.length - 1];
  } else if (str.toLowerCase().includes('indianlalaji.com') || str.toLowerCase().includes('indianalala.com')) {
    str = str.replace(/^.*?indianlalaji\.com\/?/i, '').replace(/^.*?indianalala\.com\/?/i, '');
    if (str.toLowerCase().startsWith('shop/')) str = str.slice(5);
  }

  // Sanitize slug
  const cleanSlug = str.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'lab-apex';
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${cleanSlug}`;
}

