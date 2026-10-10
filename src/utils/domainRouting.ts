import { AppView } from '../types';

export interface DomainRouteResolution {
  view: AppView;
  targetLab?: string;
  isPlatformSubdomain?: boolean;
  isExplicitMainPlatform?: boolean;
}

const VALID_VIEWS: AppView[] = [
  'vendor_dashboard',
  'branch_manager_dashboard',
  'reception_dashboard',
  'technician_dashboard',
  'pathologist_dashboard',
  'admin_dashboard',
  'vendor_website',
  'website',
  'patient_portal',
  'lab_app',
];

const RESERVED_PATH_SEGMENTS = [
  'admin',
  'api',
  'login',
  'technician',
  'reception',
  'pathologist',
  'branch',
  'reports',
  'report',
  'portal',
  'patient_portal',
  'lab_app',
  'app',
  'assets',
  'uploads',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'sw.js',
  'manifest.json',
  'website',
  'pricing',
  'demo',
];

function findMatchingLabId(
  rawTarget: string,
  vendorLabsList?: Array<{ id: string; domainPreview?: string; phone?: string; slug?: string; name?: string; status?: string }>
): string {
  if (!rawTarget) return '';
  const cleanTarget = rawTarget.toLowerCase().trim().replace(/^https?:\/\//, '');
  if (!vendorLabsList || vendorLabsList.length === 0) {
    return cleanTarget;
  }

  const targetDigits = cleanTarget.replace(/\D/g, '');
  const target10 = targetDigits.length >= 10 ? targetDigits.slice(-10) : '';

  const match = vendorLabsList.find((l) => {
    const idLower = (l.id || '').toLowerCase();
    const targetLower = cleanTarget.toLowerCase();
    if (idLower === targetLower) return true;
    if (idLower === `lab-${targetLower}` || idLower.replace(/^lab-/, '') === targetLower.replace(/^lab-/, '')) return true;
    if (l.domainPreview && l.domainPreview.toLowerCase().includes(targetLower)) return true;
    if (l.domainPreview && l.domainPreview.toLowerCase().split('.')[0] === targetLower) return true;

    // Check exact 10-digit phone match (handles +91, spaces, hyphens)
    if (target10) {
      const phoneDigits = (l.phone || '').replace(/\D/g, '');
      const phone10 = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : '';
      if (phone10 === target10) return true;
    }

    if (l.slug && l.slug.toLowerCase() === targetLower) return true;
    if (l.name && l.name.toLowerCase().replace(/[^a-z0-9]/g, '') === targetLower.replace(/[^a-z0-9]/g, '')) return true;
    return false;
  });

  return match ? match.id : cleanTarget;
}

/**
 * Resolves the active application view and lab tenant based on domain, subdomains, URL paths, and query parameters.
 * 
 * Rules:
 * 1. indianlalaji.com/shop/VENDOR_ID or /lab/VENDOR_ID -> Vendor Lab Website ('vendor_website') for that vendor
 * 2. indianlalaji.com / www.indianlalaji.com -> Main Platform Website ('website')
 * 3. <vendor>.indianlalaji.com -> Vendor Lab Website ('vendor_website') for that vendor
 * 4. indianlalaji.com/?lab=<vendor> or ?shop=<vendor> or ?vendor=<vendor> -> Vendor Lab Website ('vendor_website')
 * 5. app.indianlalaji.com -> Lab Management Software ('lab_app')
 * 6. report.indianlalaji.com -> Patient Report Portal ('patient_portal')
 * 7. admin.indianlalaji.com -> Super Admin Dashboard ('admin_dashboard')
 * 8. Custom domains (e.g. citycarelabs.com) -> Vendor Lab Website ('vendor_website')
 * 9. Any explicit ?view= parameter takes priority for navigation
 */
export function resolveAppRoute(
  hostname: string,
  search: string,
  vendorLabsList?: Array<{ id: string; domainPreview?: string; phone?: string; slug?: string; name?: string; status?: string }>,
  pathname?: string,
  hash?: string
): DomainRouteResolution {
  const cleanHost = (hostname || '').toLowerCase().trim().replace(/^https?:\/\//, '').split(':')[0];
  const params = new URLSearchParams(search);
  const viewParam = params.get('view') as AppView | null;
  const labParam =
    params.get('lab') ||
    params.get('subdomain') ||
    params.get('vendor') ||
    params.get('id') ||
    params.get('labId') ||
    params.get('slug') ||
    params.get('tenant');
  const shopParam = params.get('shop');
  const effectivePath = pathname !== undefined ? pathname : (typeof window !== 'undefined' ? window.location.pathname : '');
  const effectiveHash = hash !== undefined ? hash : (typeof window !== 'undefined' ? window.location.hash : '');

  // 0. Primary Vendor Shop / Lab URL Pattern: /shop/:id, /lab/:id, /labs/:id, /vendor/:id, /v/:id
  const pathPrefixMatch = effectivePath.match(/^\/(?:shop|lab|labs|vendor|v)\/([^/?#]+)/i);
  if (pathPrefixMatch && pathPrefixMatch[1]) {
    const rawTarget = decodeURIComponent(pathPrefixMatch[1]).trim();
    const resolvedVendorId = findMatchingLabId(rawTarget, vendorLabsList);

    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: resolvedVendorId || rawTarget,
    };
  }

  // 0b. Hash-based routing common in mobile browsers / WhatsApp / shared links: #/shop/:id, #/lab/:id
  if (effectiveHash) {
    const cleanHash = effectiveHash.replace(/^#\/?/, '/');
    const hashPathMatch = cleanHash.match(/^\/?(?:shop|lab|labs|vendor|v)\/([^/?#]+)/i);
    if (hashPathMatch && hashPathMatch[1]) {
      const rawTarget = decodeURIComponent(hashPathMatch[1]).trim();
      const resolvedVendorId = findMatchingLabId(rawTarget, vendorLabsList);
      return {
        view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
        targetLab: resolvedVendorId || rawTarget,
      };
    }

    const hashQIdx = effectiveHash.indexOf('?');
    if (hashQIdx !== -1) {
      const hashParams = new URLSearchParams(effectiveHash.slice(hashQIdx));
      const hashTarget =
        hashParams.get('lab') ||
        hashParams.get('shop') ||
        hashParams.get('vendor') ||
        hashParams.get('id') ||
        hashParams.get('labId') ||
        hashParams.get('slug');
      if (hashTarget) {
        const rawTarget = decodeURIComponent(hashTarget).trim();
        const resolvedVendorId = findMatchingLabId(rawTarget, vendorLabsList);
        return {
          view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
          targetLab: resolvedVendorId || rawTarget,
        };
      }
    }
  }

  // 0c. Direct query parameters: ?shop=VENDOR_ID or ?lab=VENDOR_ID or ?vendor=VENDOR_ID or ?id=VENDOR_ID
  if (shopParam || labParam) {
    const rawTarget = decodeURIComponent((shopParam || labParam)!).trim();
    const resolvedVendorId = findMatchingLabId(rawTarget, vendorLabsList);

    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: resolvedVendorId || rawTarget,
    };
  }

  // 0d. Direct single slug path: e.g. /apex or /citycare or /lab-1 or /mylabalok (if not reserved)
  const singleSlugMatch = effectivePath.match(/^\/([a-zA-Z0-9_\-]+)\/?$/);
  if (singleSlugMatch && singleSlugMatch[1]) {
    const rawSlug = singleSlugMatch[1].toLowerCase().trim();
    if (!RESERVED_PATH_SEGMENTS.includes(rawSlug)) {
      const matchedId = findMatchingLabId(rawSlug, vendorLabsList);
      return {
        view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
        targetLab: matchedId || rawSlug,
      };
    }
  }

  // 0c. Standalone PWA detection: If user opens installed app from mobile home screen at root /
  if (typeof window !== 'undefined' && (effectivePath === '/' || effectivePath === '')) {
    try {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone && !viewParam && !labParam && !shopParam) {
        const installedSlug =
          localStorage.getItem('cms_installed_vendor_app_slug') ||
          localStorage.getItem('cms_installed_vendor_app_id');
        if (installedSlug) {
          return {
            view: 'vendor_website',
            targetLab: installedSlug,
          };
        }
      }
    } catch {}
  }

  // 1. Check for platform root domain (indianalala.com, indianlalaji.com, or www.*)
  const isMainRootDomain =
    cleanHost === 'indianalala.com' ||
    cleanHost === 'www.indianalala.com' ||
    cleanHost === 'indianlalaji.com' ||
    cleanHost === 'www.indianlalaji.com';

  // 2. Check for subdomains on indianalala.com or indianlalaji.com
  let hostSubdomain: string | null = null;
  const isMatchedBaseDomain = cleanHost.endsWith('indianalala.com') || cleanHost.endsWith('indianlalaji.com');
  if (isMatchedBaseDomain && !isMainRootDomain) {
    const withoutSuffix = cleanHost.replace(/\.?(indianalala|indianlalaji)\.com$/, '');
    const parts = withoutSuffix.split('.');
    const sub = parts[parts.length - 1];
    if (sub && sub !== 'www') {
      hostSubdomain = sub;
    }
  }

  // 3. Platform reserved subdomains
  if (hostSubdomain === 'app') {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'lab_app',
      isPlatformSubdomain: true,
    };
  }
  if (hostSubdomain === 'report' || hostSubdomain === 'reports') {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'patient_portal',
      targetLab: labParam || undefined,
      isPlatformSubdomain: true,
    };
  }
  if (hostSubdomain === 'admin') {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'admin_dashboard',
      isPlatformSubdomain: true,
    };
  }
  if (hostSubdomain === 'reception') {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'reception_dashboard',
      isPlatformSubdomain: true,
    };
  }

  // 4. Vendor Subdomain on indianlalaji.com (e.g. apexdiagnostics.indianlalaji.com)
  // Each vendor has their own dedicated subdomain URL
  if (hostSubdomain) {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: hostSubdomain,
    };
  }

  // 5. Vendor direct link fallback parameter (?lab=<subdomain> or ?subdomain=<slug>)
  if (labParam) {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: labParam,
    };
  }

  // 6. Custom Domain Mapping check (e.g. Hostinger custom domains, citycarelabs.com or apexpathology.in)
  if (
    !isMainRootDomain &&
    cleanHost !== 'localhost' &&
    cleanHost !== '127.0.0.1' &&
    !cleanHost.includes('.run.app') &&
    !cleanHost.includes('.aistudio-preview.com')
  ) {
    if (vendorLabsList && vendorLabsList.length > 0) {
      const matchedLab = vendorLabsList.find((l) => {
        const dp = (l.domainPreview || '').toLowerCase().trim();
        return dp === cleanHost || dp.replace(/^www\./, '') === cleanHost.replace(/^www\./, '');
      });
      if (matchedLab) {
        return {
          view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
          targetLab: matchedLab.id,
        };
      }

      // If hosted on a custom domain (e.g. on Hostinger) and no specific domain mapping was set,
      // default directly to the active laboratory portal so the user's lab website opens automatically!
      const activeLab = vendorLabsList.find((l) => (l.status || '').toLowerCase() === 'active') || vendorLabsList[0];
      if (activeLab) {
        return {
          view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
          targetLab: labParam || activeLab.id,
        };
      }
    }

    // Default for custom domains on Hostinger before lab list finishes loading
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: labParam || 'lab-apex',
    };
  }

  // 7. Explicit ?view= parameter in URL
  if (viewParam && VALID_VIEWS.includes(viewParam)) {
    return { view: viewParam };
  }

  // 8. Main Root Domain (indianlalaji.com) without ?lab or ?view:
  // ALWAYS opens the main company website ('website'). NEVER opens vendor_website!
  if (isMainRootDomain) {
    return {
      view: 'website',
      isExplicitMainPlatform: true,
    };
  }

  // 9. Default fallback (Preview / Localhost without query params)
  // Default is 'website' (The official INDIANLALAJI.COM Portal Homepage)
  return {
    view: 'website',
  };
}
