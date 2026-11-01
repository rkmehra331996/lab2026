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
 * Known default registered phones for existing seed labs
 */
export const DEFAULT_LAB_REGISTERED_PHONES: Record<string, string> = {
  'lab-apex': '7087033009',
  'apex': '7087033009',
  'lab-1020304050': '1020304050',
  '1020304050': '1020304050',
  'lab-6070809010': '6070809010',
  '6070809010': '6070809010',
  'lab-citycare': '9815012345',
  'citycare': '9815012345',
  'lab-metropath': '9417098765',
  'metropath': '9417098765',
  'lab-sanjivani': '9888123456',
  'sanjivani': '9888123456',
  'lab-pulse': '9876543210',
  'pulse': '9876543210',
  'lab-carepoint': '9911002233',
  'carepoint': '9911002233',
  'lab-lifeline-due': '9872011223',
  'lifeline': '9872011223',
  'lab-healtech-pending': '9779034567',
  'healtech': '9779034567',
};

/**
 * Extracts the 10-digit registered mobile number for a lab.
 * "url register mobile ke sath hi bnana chahiye"
 */
export function getRegisteredMobileForLab(subdomainOrDomain?: string): string {
  if (!subdomainOrDomain) return '7087033009';
  const clean = subdomainOrDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

  // 1. Direct path extraction /shop/9815012345 or /lab/9815012345
  let target = clean;
  if (target.includes('/shop/')) {
    target = target.split('/shop/')[1].split('/')[0].split('?')[0].split('#')[0];
  } else if (target.includes('/lab/')) {
    target = target.split('/lab/')[1].split('/')[0].split('?')[0].split('#')[0];
  }

  // 2. If target already contains 10 consecutive digits (e.g. 7087033009, +91 7087033009)
  const targetDigits = target.replace(/\D/g, '');
  if (targetDigits.length >= 10) {
    return targetDigits.slice(-10);
  }

  // 3. Check known default phone registry
  const lowerTarget = target.toLowerCase();
  if (DEFAULT_LAB_REGISTERED_PHONES[lowerTarget]) {
    return DEFAULT_LAB_REGISTERED_PHONES[lowerTarget];
  }
  const cleanKey = lowerTarget.replace(/^lab-/, '');
  if (DEFAULT_LAB_REGISTERED_PHONES[cleanKey]) {
    return DEFAULT_LAB_REGISTERED_PHONES[cleanKey];
  }

  // 4. Look up in localStorage directory (cms_vendor_labs_list, cms_vendor_labs_directory)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('cms_vendor_labs_list') || localStorage.getItem('cms_vendor_labs_directory');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const matched = list.find((l: any) => {
            const idLower = (l.id || '').toLowerCase();
            const slugLower = (l.slug || '').toLowerCase();
            const dp = (l.domainPreview || '').toLowerCase();
            return (
              idLower === lowerTarget ||
              idLower === `lab-${lowerTarget}` ||
              idLower.replace(/^lab-/, '') === lowerTarget.replace(/^lab-/, '') ||
              slugLower === lowerTarget ||
              dp.includes(lowerTarget) ||
              (l.name && l.name.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerTarget.replace(/[^a-z0-9]/g, ''))
            );
          });
          if (matched && matched.phone) {
            const pDigits = String(matched.phone).replace(/\D/g, '');
            if (pDigits.length >= 10) return pDigits.slice(-10);
            if (pDigits.length > 0) return pDigits;
          }
          if (matched && matched.slug) {
            const sDigits = String(matched.slug).replace(/\D/g, '');
            if (sDigits.length >= 10) return sDigits.slice(-10);
          }
        }
      }
    } catch {}
  }

  // 5. Fallback: if there are any digits, return them, else default to '7087033009'
  return targetDigits.length > 0 ? targetDigits : (lowerTarget.replace(/^lab-/, '') || '7087033009');
}

/**
 * Returns clean vendor slug/registered mobile for a lab URL
 * Format: indianlalaji.com/shop/<REGISTERED_MOBILE>
 */
export function getTenantSubdomain(subdomainOrDomain?: string): string {
  if (!subdomainOrDomain) return '7087033009';
  return getRegisteredMobileForLab(subdomainOrDomain);
}

/**
 * Returns canonical vendor shop URL on indianlalaji.com using registered mobile:
 * https://indianlalaji.com/shop/<REGISTERED_MOBILE>
 * e.g. https://indianlalaji.com/shop/7087033009
 */
export function getVendorShopUrl(vendorIdOrSlug?: string): string {
  const registeredMobile = getRegisteredMobileForLab(vendorIdOrSlug);
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${registeredMobile}`;
}

/**
 * Returns relative pathname for vendor shop using registered mobile:
 * /shop/<REGISTERED_MOBILE>
 */
export function getTenantShopPath(vendorIdOrSlug?: string): string {
  const registeredMobile = getRegisteredMobileForLab(vendorIdOrSlug);
  return `/shop/${registeredMobile}`;
}

/**
 * Returns the 100% working live direct link for any browser/environment:
 * e.g. https://<domain>/shop/<REGISTERED_MOBILE> or https://indianlalaji.com/shop/<REGISTERED_MOBILE>
 */
export function getTenantDirectUrl(subdomainOrDomain?: string): string {
  const registeredMobile = getRegisteredMobileForLab(subdomainOrDomain);
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/shop/${registeredMobile}`;
  }
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${registeredMobile}`;
}

/**
 * Returns formatted canonical website/shop URL for a vendor with registered mobile
 * e.g., https://indianlalaji.com/shop/7087033009 or custom domain if configured
 */
export function getTenantWebsiteUrl(subdomainOrDomain?: string): string {
  if (!subdomainOrDomain) return `https://${SUPER_ADMIN_DOMAIN}/shop/7087033009`;
  const clean = subdomainOrDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  // Custom domains without indianlalaji.com or indianalala.com
  if (clean.includes('.') && !clean.includes('indianlalaji.com') && !clean.includes('indianalala.com')) {
    return `https://${clean}`;
  }
  const registeredMobile = getRegisteredMobileForLab(subdomainOrDomain);
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${registeredMobile}`;
}

/**
 * Generates an active, interactive preview link using registered mobile:
 * /shop/<REGISTERED_MOBILE>
 */
export function getTenantBrowserUrl(subdomainOrDomain: string, targetView: string = 'vendor_website'): string {
  const registeredMobile = getRegisteredMobileForLab(subdomainOrDomain);
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    if (targetView === 'vendor_website') {
      return `${origin}/shop/${registeredMobile}`;
    }
    return `${origin}/?lab=${registeredMobile}&view=${targetView}`;
  }
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${registeredMobile}`;
}

export function getSuperAdminDashboardUrl(): string {
  return `https://${SUPER_ADMIN_DOMAIN}/admin`;
}

/**
 * Normalizes any vendor URL or slug to canonical directory format with registered mobile:
 * e.g. 'https://indianlalaji.com/shop/7087033009'
 */
export function normalizeToDirectoryUrl(urlOrSlugOrId?: string): string {
  if (!urlOrSlugOrId) return `https://${SUPER_ADMIN_DOMAIN}/shop/7087033009`;
  let str = urlOrSlugOrId.trim();
  str = str.replace(/^https?:\/\//i, '').replace(/\/$/, '');

  // 1. Independent external custom domain check (e.g. apexdiag.in, baburamlab.com)
  if (
    str.includes('.') &&
    !str.includes('indianlalaji.com') &&
    !str.includes('indianalala.com') &&
    !str.includes('localhost') &&
    !str.includes('/shop/')
  ) {
    return `https://${str.toLowerCase()}`;
  }

  const registeredMobile = getRegisteredMobileForLab(str);
  return `https://${SUPER_ADMIN_DOMAIN}/shop/${registeredMobile}`;
}

