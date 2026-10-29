import { AppView } from '../types';

export interface DomainRouteResolution {
  view: AppView;
  targetLab?: string;
  isPlatformSubdomain?: boolean;
  isExplicitMainPlatform?: boolean;
  targetPost?: string;
  targetReport?: string;
}

/**
 * Builds the unique patient report URL for QR codes and instant verification:
 * Format: https://yourdomain.com/shopnumber/report/TK-102
 */
export function buildPatientReportUrl(
  shopIdentifier?: string,
  tokenOrReportId?: string,
  customOrigin?: string
): string {
  const origin =
    customOrigin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://indianlalaji.com');
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanToken = (tokenOrReportId || 'TK-101').trim();
  const cleanShop = (shopIdentifier || '').trim();
  if (cleanShop && cleanShop.toLowerCase() !== 'shop' && cleanShop.toLowerCase() !== 'report') {
    return `${cleanOrigin}/shop/${encodeURIComponent(cleanShop)}/report/${encodeURIComponent(cleanToken)}`;
  }
  return `${cleanOrigin}/report/${encodeURIComponent(cleanToken)}`;
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
  'seo_post',
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
  'verify',
  'check',
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
  'index',
  'index.html',
  'index.php',
  'default.php',
  'home',
  'main',
  'root',
  'shop',
  'shops',
  'lab',
  'labs',
  'vendor',
  'vendors',
  'contact',
  'about',
  'services',
  'features',
  'faq',
  'privacy',
  'terms',
  'blog',
  'post',
  'articles',
];

function findMatchingLabId(
  rawTarget: string,
  vendorLabsList?: Array<{ id: string; domainPreview?: string; phone?: string; slug?: string; name?: string; status?: string }>,
  strict: boolean = false
): string {
  if (!rawTarget) return '';
  const cleanTarget = rawTarget.toLowerCase().trim().replace(/^https?:\/\//, '');
  if (!vendorLabsList || vendorLabsList.length === 0) {
    return strict ? '' : cleanTarget;
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

  return match ? match.id : (strict ? '' : cleanTarget);
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
  const effectivePath = pathname !== undefined ? pathname : (typeof window !== 'undefined' ? window.location.pathname : '');
  const effectiveHash = hash !== undefined ? hash : (typeof window !== 'undefined' ? window.location.hash : '');

  // Detect if 'id' parameter or path looks like a medical report/token/UHID identifier rather than a vendor lab ID
  const rawIdParam = (params.get('id') || '').trim();
  const isVerifyOrReportPath = /^\/(?:verify|check|report|reports)(?:[/?#]|$)/i.test(effectivePath) ||
    /^\/(?:verify|check|report|reports)(?:[/?#]|$)/i.test(effectiveHash.replace(/^#\/?/, '/'));
  const isIdReportLike = Boolean(
    rawIdParam &&
    (/^(?:rpt|tk|rcp|uhid)[-_\s]?/i.test(rawIdParam) || isVerifyOrReportPath)
  );

  const labParam =
    params.get('lab') ||
    params.get('subdomain') ||
    params.get('vendor') ||
    (!isIdReportLike ? params.get('id') : null) ||
    params.get('labId') ||
    params.get('slug') ||
    params.get('tenant');
  const shopParam = params.get('shop');

  // 0a. Blog / SEO Post Routing: /blog/:slug, /post/:slug, /articles/:slug, or ?post=:slug
  const postParam = params.get('post') || params.get('blog') || params.get('article');
  if (postParam) {
    return {
      view: 'seo_post',
      targetPost: decodeURIComponent(postParam).trim(),
    };
  }

  const blogPathMatch = effectivePath.match(/^\/(?:blog|post|posts|articles|article|guide)\/([^/?#]+)/i);
  if (blogPathMatch && blogPathMatch[1]) {
    return {
      view: 'seo_post',
      targetPost: decodeURIComponent(blogPathMatch[1]).trim(),
    };
  }

  // 00a. Verification Route Pattern:
  // Examples:
  // - https://yourdomain.com/verify?id=RPT-101
  // - https://yourdomain.com/verify/RPT-101
  // - https://yourdomain.com/check/RPT-101
  const verifyPathMatch = effectivePath.match(/^\/(?:verify|check)(?:\/([a-zA-Z0-9_\-]+))?\/?$/i);
  if (verifyPathMatch) {
    const rawToken = (
      verifyPathMatch[1] ||
      params.get('id') ||
      params.get('report') ||
      params.get('reportId') ||
      params.get('token') ||
      params.get('tokenNumber') ||
      params.get('uhid') ||
      ''
    ).trim();
    const rawShop = shopParam || params.get('lab') || params.get('subdomain') || params.get('vendor') || params.get('tenant');
    const resolvedLab = rawShop ? findMatchingLabId(rawShop, vendorLabsList) : undefined;
    return {
      view: 'patient_portal',
      targetReport: rawToken ? decodeURIComponent(rawToken) : undefined,
      targetLab: resolvedLab,
    };
  }

  // 00b. Unique Patient Report URL Pattern:
  // Examples:
  // - https://yourdomain.com/shopnumber/report/TK-102
  // - https://yourdomain.com/shop/shopnumber/report/TK-102
  // - https://yourdomain.com/report/TK-102
  const reportWithShopMatch = effectivePath.match(
    /^\/(?:(?:shop|lab|labs|vendor|v)\/)?([a-zA-Z0-9_\-]+)\/(?:report|reports)\/([a-zA-Z0-9_\-]+)\/?$/i
  );
  if (reportWithShopMatch && reportWithShopMatch[1] && reportWithShopMatch[2]) {
    const rawShop = decodeURIComponent(reportWithShopMatch[1]).trim();
    const rawToken = decodeURIComponent(reportWithShopMatch[2]).trim();
    if (rawShop.toLowerCase() !== 'report' && rawShop.toLowerCase() !== 'reports') {
      const resolvedVendorId = findMatchingLabId(rawShop, vendorLabsList);
      return {
        view: 'patient_portal',
        targetLab: resolvedVendorId || rawShop,
        targetReport: rawToken,
      };
    }
  }

  const directReportMatch = effectivePath.match(/^\/(?:(?:shop|lab|labs|vendor|v)\/)?(?:report|reports)\/([a-zA-Z0-9_\-]+)\/?$/i);
  if (directReportMatch && directReportMatch[1]) {
    const rawToken = decodeURIComponent(directReportMatch[1]).trim();
    const rawShop = shopParam || (labParam && labParam !== rawToken ? labParam : undefined);
    const resolvedLab = rawShop ? findMatchingLabId(rawShop, vendorLabsList) : undefined;
    return {
      view: 'patient_portal',
      targetReport: rawToken,
      targetLab: resolvedLab,
    };
  }

  // 00c. Hash-based report or verify routing (e.g. #/verify?id=RPT-101, #/shopnumber/report/TK-102 or #/report/TK-102)
  if (effectiveHash) {
    const cleanHash = effectiveHash.replace(/^#\/?/, '/');
    const hashVerifyMatch = cleanHash.match(/^\/?(?:verify|check)(?:\/([a-zA-Z0-9_\-]+))?\/?/i);
    if (hashVerifyMatch) {
      const hashParams = cleanHash.includes('?') ? new URLSearchParams(cleanHash.slice(cleanHash.indexOf('?'))) : null;
      const rawToken = (
        hashVerifyMatch[1] ||
        hashParams?.get('id') ||
        hashParams?.get('report') ||
        hashParams?.get('reportId') ||
        hashParams?.get('token') ||
        params.get('id') ||
        params.get('report') ||
        ''
      ).trim();
      return {
        view: 'patient_portal',
        targetReport: rawToken ? decodeURIComponent(rawToken) : undefined,
      };
    }

    const hashReportWithShopMatch = cleanHash.match(
      /^\/?(?:(?:shop|lab|labs|vendor|v)\/)?([a-zA-Z0-9_\-]+)\/(?:report|reports)\/([a-zA-Z0-9_\-]+)\/?$/i
    );
    if (hashReportWithShopMatch && hashReportWithShopMatch[1] && hashReportWithShopMatch[2]) {
      const rawShop = decodeURIComponent(hashReportWithShopMatch[1]).trim();
      const rawToken = decodeURIComponent(hashReportWithShopMatch[2]).trim();
      if (rawShop.toLowerCase() !== 'report' && rawShop.toLowerCase() !== 'reports') {
        const resolvedVendorId = findMatchingLabId(rawShop, vendorLabsList);
        return {
          view: 'patient_portal',
          targetLab: resolvedVendorId || rawShop,
          targetReport: rawToken,
        };
      }
    }

    const hashDirectReportMatch = cleanHash.match(/^\/?(?:(?:shop|lab|labs|vendor|v)\/)?(?:report|reports)\/([a-zA-Z0-9_\-]+)\/?$/i);
    if (hashDirectReportMatch && hashDirectReportMatch[1]) {
      const rawToken = decodeURIComponent(hashDirectReportMatch[1]).trim();
      return {
        view: 'patient_portal',
        targetReport: rawToken,
      };
    }
  }

  // 00d. Direct query parameter report lookup: ?report=TK-102 or ?token=TK-102 or ?id=RPT-101
  const reportParam =
    params.get('report') ||
    params.get('reportId') ||
    params.get('token') ||
    params.get('tokenNumber') ||
    params.get('report_id') ||
    (isIdReportLike ? rawIdParam : null);

  if (reportParam) {
    const rawToken = decodeURIComponent(reportParam).trim();
    const rawShop = shopParam || (labParam && labParam !== rawToken ? labParam : undefined);
    return {
      view: 'patient_portal',
      targetReport: rawToken,
      targetLab: rawShop ? findMatchingLabId(rawShop, vendorLabsList) : undefined,
    };
  }

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
      const matchedId = findMatchingLabId(rawSlug, vendorLabsList, true);
      // ONLY route to vendor_website if an actual laboratory was explicitly matched in the directory
      if (matchedId) {
        return {
          view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
          targetLab: matchedId,
        };
      }
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
  const normalizedHost = cleanHost.replace(/^www\./, '');
  const isMainRootDomain =
    !cleanHost ||
    normalizedHost === 'indianlalaji.com' ||
    normalizedHost === 'indianalala.com' ||
    cleanHost.includes('localhost') ||
    cleanHost.includes('127.0.0.1') ||
    cleanHost.includes('.run.app') ||
    cleanHost.includes('.aistudio-preview.com');

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

  // 5. Vendor direct link parameter (?lab=<subdomain> or ?subdomain=<slug> or ?shop=<slug>)
  if (labParam || shopParam) {
    const target = (labParam || shopParam)!.trim();
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: target,
    };
  }

  // 6. Custom Domain Mapping check (e.g. citycarelabs.com or apexpathology.in configured by vendor)
  if (
    !isMainRootDomain &&
    vendorLabsList &&
    vendorLabsList.length > 0
  ) {
    const matchedLab = vendorLabsList.find((l) => {
      const dp = (l.domainPreview || '').toLowerCase().trim();
      const wd = ((l as any).websiteDomain || '').toLowerCase().trim();
      const cd = ((l as any).customDomain || '').toLowerCase().trim();
      const ch = cleanHost.replace(/^www\./, '');
      return (
        dp === cleanHost ||
        (dp.length > 0 && dp.replace(/^www\./, '') === ch) ||
        wd === cleanHost ||
        (wd.length > 0 && wd.replace(/^www\./, '') === ch) ||
        cd === cleanHost ||
        (cd.length > 0 && cd.replace(/^www\./, '') === ch)
      );
    });
    if (matchedLab) {
      return {
        view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
        targetLab: matchedLab.id,
      };
    }
  }

  // 6b. Customer Custom Domain (e.g. trustedweb.online) direct mapping
  const hostWithoutWww = cleanHost.replace(/^www\./, '');
  if (!isMainRootDomain && (hostWithoutWww === 'trustedweb.online' || hostWithoutWww.endsWith('.trustedweb.online'))) {
    return {
      view: (viewParam && VALID_VIEWS.includes(viewParam)) ? viewParam : 'vendor_website',
      targetLab: 'lab-apex',
    };
  }

  // 7. Explicit ?view= parameter in URL
  if (viewParam && VALID_VIEWS.includes(viewParam)) {
    return { view: viewParam };
  }

  // 8. Main Root Domain (indianlalaji.com / www.indianlalaji.com) and Default Fallback:
  // HIGHEST PRIORITY: ALWAYS opens the Main Company Homepage ('website').
  // NEVER defaults to vendor_website!
  return {
    view: 'website',
    isExplicitMainPlatform: true,
  };
}
