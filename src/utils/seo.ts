/**
 * Dynamic SEO and Open Graph (OG) Metadata Manager
 * Dynamically updates document.title, og:title, og:description, og:image, og:url, og:type,
 * twitter tags, and canonical URLs for multi-tenant shops/laboratories.
 */

export interface TenantSeoParams {
  title: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
}

/**
 * Generates a high-resolution SVG Data URI as a fallback social preview (OG) image
 * whenever the tenant has not uploaded a custom social sharing banner.
 */
export function generateDefaultOgImage(labName: string, labShopId?: string, nabl?: string): string {
  const safeName = (labName || 'Diagnostic Laboratory').replace(/[<>&"]/g, '');
  const safeId = (labShopId || 'LSP-7087').replace(/[<>&"]/g, '');
  const safeNabl = (nabl || 'MC-4821').replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0B1F3B" />
        <stop offset="50%" stop-color="#123B6D" />
        <stop offset="100%" stop-color="#0F766E" />
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#FBBF24" />
      </linearGradient>
    </defs>
    <!-- Background Canvas -->
    <rect width="1200" height="630" fill="url(#bg)" />

    <!-- Subtle Accent Circles -->
    <circle cx="1100" cy="100" r="280" fill="#ffffff" opacity="0.03" />
    <circle cx="100" cy="550" r="200" fill="#ffffff" opacity="0.03" />

    <!-- Top Badge Strip -->
    <rect x="80" y="80" width="340" height="44" rx="22" fill="#ffffff" opacity="0.12" />
    <circle cx="105" cy="102" r="10" fill="#10B981" />
    <text x="125" y="108" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#A7F3D0">
      VERIFIED DIAGNOSTIC LAB
    </text>

    <!-- Lab Shop ID Badge -->
    <rect x="440" y="80" width="220" height="44" rx="22" fill="#F59E0B" opacity="0.2" />
    <text x="460" y="108" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#FDE68A">
      ID: ${safeId}
    </text>

    <!-- Main Laboratory / Shop Name -->
    <text x="80" y="230" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" letter-spacing="-1">
      ${safeName.length > 36 ? safeName.slice(0, 34) + '…' : safeName}
    </text>

    <!-- Subtitle / Tagline -->
    <text x="80" y="295" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#CBD5E1">
      Pathology, Biochemistry &amp; Diagnostic Testing • NABL Accredited (${safeNabl})
    </text>

    <!-- Divider -->
    <rect x="80" y="345" width="1040" height="2" fill="#ffffff" opacity="0.15" />

    <!-- Feature Pillars -->
    <!-- Pillar 1 -->
    <rect x="80" y="380" width="320" height="150" rx="16" fill="#ffffff" opacity="0.07" />
    <text x="110" y="425" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28">🧪</text>
    <text x="155" y="425" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF">
      100% NABL Tested
    </text>
    <text x="110" y="465" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#94A3B8">
      Automated Biochemistry &amp; Hematology
    </text>

    <!-- Pillar 2 -->
    <rect x="440" y="380" width="320" height="150" rx="16" fill="#ffffff" opacity="0.07" />
    <text x="470" y="425" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28">📱</text>
    <text x="515" y="425" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF">
      WhatsApp Reports
    </text>
    <text x="470" y="465" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#94A3B8">
      Instant digital PDF without login
    </text>

    <!-- Pillar 3 -->
    <rect x="800" y="380" width="320" height="150" rx="16" fill="#ffffff" opacity="0.07" />
    <text x="830" y="425" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28">🏠</text>
    <text x="875" y="425" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF">
      Home Collection
    </text>
    <text x="830" y="465" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#94A3B8">
      Phlebotomist booking online &amp; offline
    </text>

    <!-- Footer Branding -->
    <text x="80" y="585" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#64748B">
      POWERED BY LABNAME.COM • DIGITAL LAB NETWORK
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Helper to update or create a <meta> tag in document.head
 */
function setMetaTag(attributeName: string, attributeValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attributeName, attributeValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Helper to update or create a <link> tag in document.head
 */
function setLinkTag(rel: string, href: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Dynamically updates document title and Open Graph tags for a shop / tenant
 */
export function updateDocumentMetadata({
  title,
  description,
  ogImage,
  ogUrl,
  ogType = 'website',
}: TenantSeoParams) {
  if (typeof document === 'undefined') return;

  // 1. Document Title
  if (title) {
    document.title = title;
  }

  // 2. og:title & twitter:title
  if (title) {
    setMetaTag('property', 'og:title', title);
    setMetaTag('name', 'twitter:title', title);
  }

  // 3. og:description & meta description & twitter:description
  if (description) {
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:description', description);
    setMetaTag('name', 'twitter:description', description);
  }

  // 4. og:type
  if (ogType) {
    setMetaTag('property', 'og:type', ogType);
  }

  // 5. og:url & canonical & twitter:url
  if (ogUrl) {
    setMetaTag('property', 'og:url', ogUrl);
    setMetaTag('name', 'twitter:url', ogUrl);
    setLinkTag('canonical', ogUrl);
  }

  // 6. og:image & twitter:image
  if (ogImage) {
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('name', 'twitter:image', ogImage);
    setMetaTag('property', 'og:image:alt', title || 'Shop Logo');
    setMetaTag('name', 'twitter:card', 'summary_large_image');
  }
}
