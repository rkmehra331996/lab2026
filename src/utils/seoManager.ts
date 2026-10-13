import { SeoSettings, DEFAULT_SEO_SETTINGS, SeoPost } from '../types';

function setMetaTag(selectorAttr: string, selectorValue: string, content: string, isProperty = false) {
  if (typeof document === 'undefined') return;
  const attrName = isProperty ? 'property' : 'name';
  let tag = document.querySelector(`meta[${attrName}="${selectorValue}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, selectorValue);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setLinkTag(rel: string, href: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

/**
 * Dynamically applies SEO Settings to the browser Document Head & Body.
 */
export function applySeoSettingsToDOM(settings: SeoSettings): void {
  if (typeof document === 'undefined') return;

  const effective = { ...DEFAULT_SEO_SETTINGS, ...settings };

  // 1. Page Title
  if (effective.seoTitle) {
    document.title = effective.seoTitle;
  }

  // 2. Favicon
  if (effective.faviconUrl) {
    setLinkTag('icon', effective.faviconUrl);
    setLinkTag('shortcut icon', effective.faviconUrl);
    setLinkTag('apple-touch-icon', effective.faviconUrl);
  }

  // 3. Meta Description & Keywords
  if (effective.metaDescription) {
    setMetaTag('name', 'description', effective.metaDescription);
  }
  if (effective.metaKeywords) {
    setMetaTag('name', 'keywords', effective.metaKeywords);
  }

  // 4. Google Site Verification
  if (effective.googleSiteVerification) {
    setMetaTag('name', 'google-site-verification', effective.googleSiteVerification);
  }

  // 5. Canonical URL
  if (effective.canonicalUrl) {
    setLinkTag('canonical', effective.canonicalUrl);
  }

  // 6. OpenGraph (OG) Tags
  setMetaTag('property', 'og:type', 'website', true);
  if (effective.seoTitle) {
    setMetaTag('property', 'og:title', effective.seoTitle, true);
  }
  if (effective.metaDescription) {
    setMetaTag('property', 'og:description', effective.metaDescription, true);
  }
  if (effective.ogImageUrl) {
    setMetaTag('property', 'og:image', effective.ogImageUrl, true);
  }
  if (effective.canonicalUrl) {
    setMetaTag('property', 'og:url', effective.canonicalUrl, true);
  }
  setMetaTag('property', 'og:site_name', 'IndianLalaji Pathology OS', true);

  // 7. Twitter Card Tags
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  if (effective.seoTitle) {
    setMetaTag('name', 'twitter:title', effective.seoTitle);
  }
  if (effective.metaDescription) {
    setMetaTag('name', 'twitter:description', effective.metaDescription);
  }
  if (effective.ogImageUrl) {
    setMetaTag('name', 'twitter:image', effective.ogImageUrl);
  }

  // 8. Schema / JSON-LD Structured Data
  let jsonLdScript = document.getElementById('seo-json-ld-script') as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'seo-json-ld-script';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }
  try {
    // Validate if it is valid JSON
    if (effective.schemaJsonLd && effective.schemaJsonLd.trim()) {
      JSON.parse(effective.schemaJsonLd);
      jsonLdScript.textContent = effective.schemaJsonLd;
    }
  } catch {
    // If invalid JSON, skip or fallback
  }

  // 9. Google Analytics Tracking Code Injection
  if (effective.googleAnalyticsId && effective.googleAnalyticsId.trim()) {
    const gaId = effective.googleAnalyticsId.trim();
    let gaScript = document.getElementById('seo-ga-script') as HTMLScriptElement | null;
    const currentGaId = gaScript?.getAttribute('data-ga-id');
    if (!gaScript || currentGaId !== gaId) {
      if (gaScript) gaScript.remove();
      const oldInit = document.getElementById('seo-ga-init-script');
      if (oldInit) oldInit.remove();

      gaScript = document.createElement('script');
      gaScript.id = 'seo-ga-script';
      gaScript.setAttribute('data-ga-id', gaId);
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(gaScript);

      const gaInitScript = document.createElement('script');
      gaInitScript.id = 'seo-ga-init-script';
      gaInitScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(gaInitScript);
    }
  }

  // Helper to safely inject HTML and execute embedded <script> tags
  const injectHtmlWithScripts = (container: HTMLElement, rawHtml: string) => {
    container.innerHTML = rawHtml;
    const scripts = Array.from(container.querySelectorAll('script'));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  };

  // 10. Custom Header Code Container
  let headerContainer = document.getElementById('seo-custom-header-container');
  if (!headerContainer) {
    headerContainer = document.createElement('div');
    headerContainer.id = 'seo-custom-header-container';
    headerContainer.style.display = 'none';
    document.head.appendChild(headerContainer);
  }
  if (effective.customHeaderCode && effective.customHeaderCode.trim()) {
    injectHtmlWithScripts(headerContainer, effective.customHeaderCode);
  } else {
    headerContainer.innerHTML = '';
  }

  // 11. Custom Footer Code Container
  let footerContainer = document.getElementById('seo-custom-footer-container');
  if (!footerContainer) {
    footerContainer = document.createElement('div');
    footerContainer.id = 'seo-custom-footer-container';
    footerContainer.style.display = 'none';
    document.body.appendChild(footerContainer);
  }
  if (effective.customFooterCode && effective.customFooterCode.trim()) {
    injectHtmlWithScripts(footerContainer, effective.customFooterCode);
  } else {
    footerContainer.innerHTML = '';
  }
}

/**
 * Dynamically applies specific Blog Post SEO metadata to browser document and social tags
 */
export function applyPostSeoToDOM(post: SeoPost): void {
  if (typeof document === 'undefined') return;

  const title = post.seoTitle || post.title || 'Diagnostic Healthcare Blog';
  const description = post.metaDescription || post.excerpt || '';
  const canonical = post.canonicalUrl || `${window.location.origin}/blog/${post.slug || post.id}`;
  const image = post.openGraph?.ogImage || post.featuredImage || `${window.location.origin}/icon.svg`;

  document.title = `${title} | IndianLalaJi`;
  setMetaTag('name', 'description', description);
  setLinkTag('canonical', canonical);

  // OpenGraph
  setMetaTag('property', 'og:type', 'article', true);
  setMetaTag('property', 'og:title', post.openGraph?.ogTitle || title, true);
  setMetaTag('property', 'og:description', post.openGraph?.ogDescription || description, true);
  setMetaTag('property', 'og:image', image, true);
  setMetaTag('property', 'og:url', canonical, true);

  // Twitter
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', post.openGraph?.ogTitle || title);
  setMetaTag('name', 'twitter:description', post.openGraph?.ogDescription || description);
  setMetaTag('name', 'twitter:image', image);

  // Article / BlogPosting Schema
  let postSchemaScript = document.getElementById('seo-post-json-ld') as HTMLScriptElement | null;
  if (!postSchemaScript) {
    postSchemaScript = document.createElement('script');
    postSchemaScript.id = 'seo-post-json-ld';
    postSchemaScript.type = 'application/ld+json';
    document.head.appendChild(postSchemaScript);
  }

  if (post.schemaMarkup && post.schemaMarkup.trim()) {
    postSchemaScript.textContent = post.schemaMarkup;
  } else {
    const fallbackSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || description,
      image: [image],
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt || post.publishedAt || post.createdAt,
      author: {
        '@type': 'Person',
        name: post.author || 'IndianLalaJi Editorial Desk',
      },
      publisher: {
        '@type': 'Organization',
        name: 'INDIANLALAJI.COM',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/icon.svg`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonical,
      },
    };
    postSchemaScript.textContent = JSON.stringify(fallbackSchema, null, 2);
  }
}

