import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Search,
  Image as ImageIcon,
  Code,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  Share2,
  Eye,
  ShieldCheck,
  Check,
  Layers,
  Upload,
  Info,
  Smartphone,
  Laptop,
  Trash2,
  Loader2,
  UploadCloud,
  RefreshCw,
  Link2,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { SeoSettings, DEFAULT_SEO_SETTINGS } from '../../types';
import { optimizeImageFile } from '../../utils/imageOptimizer';

interface SeoSettingsTabProps {
  showToast?: (message: string) => void;
}

export const SeoSettingsTab: React.FC<SeoSettingsTabProps> = ({ showToast }) => {
  const { seoSettings, updateSeoSettings, resetSeoSettings } = useCms();

  // Local working copy of SEO settings for draft editing
  const [formData, setFormData] = useState<SeoSettings>(seoSettings || DEFAULT_SEO_SETTINGS);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'metadata' | 'social' | 'analytics' | 'crawler' | 'custom_code'>('all');
  const [previewMode, setPreviewMode] = useState<'google' | 'social' | 'browser'>('google');
  const [googleDevice, setGoogleDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // File upload state & refs for Favicon and Featured / OG Image
  const faviconFileInputRef = useRef<HTMLInputElement>(null);
  const ogImageFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isUploadingOgImage, setIsUploadingOgImage] = useState(false);
  const [faviconMode, setFaviconMode] = useState<'upload' | 'presets' | 'url'>('upload');
  const [ogImageMode, setOgImageMode] = useState<'upload' | 'presets' | 'url'>('upload');

  // Helper to persist image to backend /api/upload or return base64 dataUrl fallback
  const uploadToServerOrFallback = async (dataUrl: string, prefix: string): Promise<string> => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, prefix }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) return json.url;
      }
    } catch (err) {
      console.warn('Upload fallback to dataUrl:', err);
    }
    return dataUrl;
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFavicon(true);
    try {
      let optimized = '';
      if (file.type === 'image/svg+xml') {
        optimized = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        optimized = await optimizeImageFile(file, {
          maxWidth: 128,
          maxHeight: 128,
          quality: 0.9,
          format: 'image/png',
        });
      }

      if (optimized) {
        const finalUrl = await uploadToServerOrFallback(optimized, 'favicon');
        handleFieldChange('faviconUrl', finalUrl);
        triggerToast('✅ Favicon uploaded successfully! Click Save to apply.');
      }
    } catch (err: any) {
      console.error('Error uploading favicon:', err);
      triggerToast('❌ Failed to upload favicon image.');
    } finally {
      setIsUploadingFavicon(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingOgImage(true);
    try {
      const optimized = await optimizeImageFile(file, {
        maxWidth: 1200,
        maxHeight: 630,
        quality: 0.85,
        format: 'image/jpeg',
      });

      if (optimized) {
        const finalUrl = await uploadToServerOrFallback(optimized, 'og_banner');
        handleFieldChange('ogImageUrl', finalUrl);
        triggerToast('✅ Featured / OG image uploaded successfully! Click Save to apply.');
      }
    } catch (err: any) {
      console.error('Error uploading featured image:', err);
      triggerToast('❌ Failed to upload featured image.');
    } finally {
      setIsUploadingOgImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Sync formData when seoSettings updates from context
  useEffect(() => {
    if (seoSettings) {
      setFormData(seoSettings);
    }
  }, [seoSettings]);

  const triggerToast = (msg: string) => {
    if (showToast) {
      showToast(msg);
    }
  };

  const handleFieldChange = (field: keyof SeoSettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsSaved(false);

    if (field === 'schemaJsonLd') {
      try {
        if (value.trim()) {
          JSON.parse(value);
          setSchemaError(null);
        }
      } catch (err: any) {
        setSchemaError(err?.message || 'Invalid JSON syntax');
      }
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (schemaError) {
      triggerToast('⚠️ Please fix the JSON syntax error in Schema / JSON-LD before saving');
      return;
    }

    // Clean Google site verification if pasted as full meta tag
    let cleanVerification = formData.googleSiteVerification.trim();
    if (cleanVerification.includes('content="')) {
      const match = cleanVerification.match(/content=["']([^"']+)["']/);
      if (match && match[1]) {
        cleanVerification = match[1];
      }
    }

    const payload: SeoSettings = {
      ...formData,
      googleSiteVerification: cleanVerification,
    };

    updateSeoSettings(payload);
    setIsSaved(true);
    triggerToast('✅ SEO Settings saved & applied to live website!');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all SEO Settings to standard recommended defaults?')) {
      resetSeoSettings();
      setFormData(DEFAULT_SEO_SETTINGS);
      setSchemaError(null);
      triggerToast('🔄 SEO Settings reset to optimal defaults');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    triggerToast(`📋 Copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Preset Favicon options
  const faviconPresets = [
    { label: 'SVG Icon (Default)', url: '/icon.svg' },
    { label: 'PWA Touch 192px', url: '/pwa-192x192.png' },
    { label: 'Medical Cross Blue', url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=128&q=80' },
    { label: 'Microscope Lens', url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=128&q=80' },
  ];

  // Preset OG Image options
  const ogImagePresets = [
    {
      label: 'Diagnostics Laboratory (Default 1200x630)',
      url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
    },
    {
      label: 'Digital Healthcare & Pathology Banner',
      url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    },
    {
      label: 'NABL Certified Clinical Testing',
      url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  // Keyword tags list
  const currentKeywordsList = formData.metaKeywords
    ? formData.metaKeywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [];

  const addKeywordTag = (tag: string) => {
    if (currentKeywordsList.includes(tag)) return;
    const updated = [...currentKeywordsList, tag].join(', ');
    handleFieldChange('metaKeywords', updated);
  };

  const removeKeywordTag = (tagToRemove: string) => {
    const updated = currentKeywordsList.filter((k) => k !== tagToRemove).join(', ');
    handleFieldChange('metaKeywords', updated);
  };

  const popularKeywordSuggestions = [
    'pathology lab software',
    'diagnostic lab billing',
    'nabl software india',
    'whatsapp lab report',
    'patient report portal',
    'blood test management',
    'cbc test report online',
  ];

  // Schema Templates
  const applySchemaTemplate = (type: 'web_app' | 'medical_business' | 'diagnostic_lab') => {
    let schemaObj = {};
    if (type === 'web_app') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'IndianLalaji Pathology Lab OS',
        url: formData.canonicalUrl || 'https://indianlalaji.com',
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Web, Windows, Android, macOS',
        description: formData.metaDescription || 'Complete diagnostic lab operating system with instant patient report portal.',
        offers: {
          '@type': 'Offer',
          price: '4999',
          priceCurrency: 'INR',
        },
      };
    } else if (type === 'medical_business') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'MedicalBusiness',
        name: 'IndianLalaji Pathology Diagnostic Network',
        url: formData.canonicalUrl || 'https://indianlalaji.com',
        description: formData.metaDescription,
        telephone: '+91 7087033009',
        priceRange: '₹₹',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'IN',
        },
      };
    } else {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'DiagnosticLab',
        name: 'IndianLalaji Pathology & Clinical Laboratory',
        url: formData.canonicalUrl || 'https://indianlalaji.com',
        description: formData.metaDescription,
        hasCertification: 'NABL ISO 15189',
        areaServed: 'India',
      };
    }
    const formatted = JSON.stringify(schemaObj, null, 2);
    handleFieldChange('schemaJsonLd', formatted);
    setSchemaError(null);
    triggerToast(`Applied ${type} Schema template!`);
  };

  // Robots.txt Templates
  const applyRobotsTemplate = (mode: 'standard' | 'open' | 'strict') => {
    if (mode === 'standard') {
      handleFieldChange(
        'robotsTxt',
        `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /technician\nDisallow: /reception\n\nSitemap: ${(formData.canonicalUrl || 'https://indianlalaji.com').replace(/\/$/, '')}/sitemap.xml`
      );
    } else if (mode === 'open') {
      handleFieldChange(
        'robotsTxt',
        `User-agent: *\nAllow: /\n\nSitemap: ${(formData.canonicalUrl || 'https://indianlalaji.com').replace(/\/$/, '')}/sitemap.xml`
      );
    } else {
      handleFieldChange('robotsTxt', `User-agent: *\nDisallow: /`);
    }
    triggerToast(`Applied ${mode} Robots.txt preset!`);
  };

  // Length calculation indicators
  const titleLen = formData.seoTitle.length;
  const isTitleOptimal = titleLen >= 30 && titleLen <= 60;
  const descLen = formData.metaDescription.length;
  const isDescOptimal = descLen >= 120 && descLen <= 160;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner / Actions Bar */}
      <div className="bg-gradient-to-r from-[#0d2a4d] via-[#123B6D] to-[#0a1f3a] rounded-2xl p-5 text-white shadow-sm border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Globe className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Super Admin → SEO & Meta Tags Manager</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Live Engine
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Configure full search engine optimization, Google search rich snippets, social sharing cards (OpenGraph & Twitter), crawling rules, site verification, and custom tracking codes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/15"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-98"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-800" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Settings Saved!' : 'Save SEO Settings'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All 12 SEO Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('metadata')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'metadata'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-500" />
            <span>Core Meta & Title</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('social')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'social'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
            <span>Favicon & OG Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'analytics'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Google Verification & Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('crawler')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'crawler'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>Robots.txt & Schema JSON-LD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('custom_code')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'custom_code'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-rose-500" />
            <span>Custom Header & Footer Code</span>
          </button>
        </div>

        {/* Live Preview Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setPreviewMode('google')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
              previewMode === 'google'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3 h-3 text-blue-600" />
            <span>Google Snippet</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('social')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
              previewMode === 'social'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3 h-3 text-purple-600" />
            <span>Social Share Card</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('browser')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
              previewMode === 'browser'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3 h-3 text-emerald-600" />
            <span>Browser Tab</span>
          </button>
        </div>
      </div>

      {/* LIVE PREVIEW BOX */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#123B6D]" />
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              {previewMode === 'google' && 'Live Google Search Engine Snippet Preview'}
              {previewMode === 'social' && 'Social Share Card Preview (WhatsApp, Facebook, Twitter, LinkedIn)'}
              {previewMode === 'browser' && 'Browser Tab Mockup Preview (Favicon & Tab Title)'}
            </h3>
          </div>

          {previewMode === 'google' && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setGoogleDevice('desktop')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 font-bold ${
                  googleDevice === 'desktop' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Laptop className="w-3 h-3" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setGoogleDevice('mobile')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 font-bold ${
                  googleDevice === 'mobile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Smartphone className="w-3 h-3" /> Mobile
              </button>
            </div>
          )}
        </div>

        {/* 1. Google Search Card */}
        {previewMode === 'google' && (
          <div
            className={`p-4 rounded-xl border border-slate-200 bg-white transition-all ${
              googleDevice === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                <img
                  src={formData.faviconUrl || '/icon.svg'}
                  alt="favicon"
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                  }}
                />
              </div>
              <div className="overflow-hidden">
                <div className="text-[12px] font-medium text-slate-900 truncate">
                  {formData.canonicalUrl ? new URL(formData.canonicalUrl, 'https://indianlalaji.com').hostname : 'indianlalaji.com'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {formData.canonicalUrl || 'https://indianlalaji.com'}
                </div>
              </div>
            </div>

            <h4 className="text-[16px] text-[#1a0dab] hover:underline font-normal cursor-pointer leading-snug line-clamp-1">
              {formData.seoTitle || 'Title Placeholder'}
            </h4>

            <p className="text-[13px] text-[#4d5156] mt-1 leading-relaxed line-clamp-2">
              {formData.metaDescription || 'Meta description will be displayed here as search results excerpt.'}
            </p>
          </div>
        )}

        {/* 2. Social Card */}
        {previewMode === 'social' && (
          <div className="max-w-md mx-auto rounded-xl border border-slate-300 overflow-hidden bg-white shadow-sm">
            <div className="aspect-[1.91/1] w-full bg-slate-100 overflow-hidden relative border-b border-slate-200">
              <img
                src={formData.ogImageUrl || 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80'}
                alt="Social Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80';
                }}
              />
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-bold">
                1200 × 630 OG Image
              </span>
            </div>
            <div className="p-3 bg-slate-50">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {formData.canonicalUrl ? new URL(formData.canonicalUrl, 'https://indianlalaji.com').hostname : 'indianlalaji.com'}
              </div>
              <div className="font-bold text-xs text-slate-900 line-clamp-1 mt-0.5">
                {formData.seoTitle}
              </div>
              <div className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                {formData.metaDescription}
              </div>
            </div>
          </div>
        )}

        {/* 3. Browser Tab Preview */}
        {previewMode === 'browser' && (
          <div className="rounded-xl border border-slate-300 bg-slate-200/80 p-2 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>

              {/* Active Tab */}
              <div className="bg-white rounded-t-lg px-3 py-1.5 flex items-center gap-2 shadow-2xs border-t border-x border-slate-300 max-w-xs">
                <img
                  src={formData.faviconUrl || '/icon.svg'}
                  alt="Favicon"
                  className="w-4 h-4 object-contain shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                  }}
                />
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {formData.seoTitle || 'Website Title'}
                </span>
                <span className="text-slate-400 text-xs ml-auto">✕</span>
              </div>
            </div>
            <div className="bg-white rounded-b-lg p-2.5 border-t border-slate-200 flex items-center gap-2">
              <div className="bg-slate-100 rounded-md px-2.5 py-1 text-[11px] font-mono text-slate-700 w-full truncate border border-slate-200">
                🔒 {formData.canonicalUrl || 'https://indianlalaji.com'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FORM SECTIONS */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: CORE METADATA & TITLE */}
        {(activeSubTab === 'all' || activeSubTab === 'metadata') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Core SEO Title, Meta Description & Canonical URL
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Primary information shown on Google, Bing, Yahoo search result pages.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {/* 1. SEO Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span>SEO Title</span>
                    <span className="text-rose-500">*</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      (Search engine page title)
                    </span>
                  </label>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      isTitleOptimal
                        ? 'text-emerald-700'
                        : titleLen > 60
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {titleLen}/60 chars {isTitleOptimal && '✓ Optimal'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.seoTitle}
                  onChange={(e) => handleFieldChange('seoTitle', e.target.value)}
                  placeholder="e.g. INDIANLALAJI.COM - Pathology Laboratory & Diagnostic Operating System"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Optimal length: 30 to 60 characters. Appears as the primary clickable headline in search engines.
                </p>
              </div>

              {/* 2. Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span>Meta Description</span>
                    <span className="text-rose-500">*</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      (Website & search snippet description)
                    </span>
                  </label>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      isDescOptimal
                        ? 'text-emerald-700'
                        : descLen > 160
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {descLen}/160 chars {isDescOptimal && '✓ Optimal'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={formData.metaDescription}
                  onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
                  placeholder="Brief summary of your pathology software platform, features, and target audience..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-normal focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Recommended length: 120 to 160 characters. Should include target keywords and a clear call to action.
                </p>
              </div>

              {/* 3. Canonical URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span>Canonical URL</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      (Preferred primary page URL)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('canonicalUrl', window.location.origin)}
                    className="text-[10px] text-[#123B6D] hover:underline font-bold cursor-pointer"
                  >
                    Use Current Origin ({typeof window !== 'undefined' ? window.location.origin : ''})
                  </button>
                </div>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={formData.canonicalUrl}
                    onChange={(e) => handleFieldChange('canonicalUrl', e.target.value)}
                    placeholder="https://indianlalaji.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Prevents duplicate content penalties by telling search engines which URL is authoritative.
                </p>
              </div>

              {/* 4. Meta Keywords */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Meta Keywords (Optional)
                </label>
                <input
                  type="text"
                  value={formData.metaKeywords}
                  onChange={(e) => handleFieldChange('metaKeywords', e.target.value)}
                  placeholder="e.g. pathology lab software, diagnostic lab billing, nabl software india"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-normal focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none"
                />

                {/* Tag Pills */}
                {currentKeywordsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {currentKeywordsList.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-semibold"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeKeywordTag(tag)}
                          className="hover:text-rose-600 cursor-pointer ml-0.5"
                          title="Remove keyword"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600">
                  <span className="font-bold text-slate-500">Suggested:</span>
                  {popularKeywordSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addKeywordTag(sug)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: FAVICON & OG IMAGE */}
        {(activeSubTab === 'all' || activeSubTab === 'social') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Favicon & Featured Image / OpenGraph (OG) Image
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Visual branding for browser tabs and rich social sharing links.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. FAVICON (BROWSER TAB ICON) */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#123B6D] flex items-center justify-center font-bold">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span>Website Favicon</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Browser tab & bookmark icon
                      </span>
                    </div>
                  </div>

                  {/* Current Active Icon Badge */}
                  <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500">Active:</span>
                    <div className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 p-0.5 flex items-center justify-center">
                      <img
                        src={formData.faviconUrl || '/icon.svg'}
                        alt="Active Favicon"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-mode selector (Upload | Presets | URL) */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setFaviconMode('upload')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      faviconMode === 'upload'
                        ? 'bg-[#123B6D] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaviconMode('presets')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      faviconMode === 'presets'
                        ? 'bg-[#123B6D] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Presets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaviconMode('url')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      faviconMode === 'url'
                        ? 'bg-[#123B6D] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    <span>Custom URL</span>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={faviconFileInputRef}
                  type="file"
                  accept=".ico,.png,.svg,.jpg,.jpeg,.webp,image/x-icon,image/png,image/svg+xml,image/jpeg,image/webp"
                  onChange={handleFaviconUpload}
                  className="hidden"
                />

                {/* MODE 1: UPLOAD FILE */}
                {faviconMode === 'upload' && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-blue-200 hover:border-[#123B6D] bg-white rounded-2xl p-4 transition text-center space-y-3">
                      <div className="flex justify-center items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center p-2 shadow-2xs">
                          <img
                            src={formData.faviconUrl || '/icon.svg'}
                            alt="Favicon preview"
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                            }}
                          />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-black text-slate-800">
                            Custom Favicon Icon
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Format: .ico, .svg, .png, .jpg
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isUploadingFavicon}
                          onClick={() => faviconFileInputRef.current?.click()}
                          className="px-4 py-2 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isUploadingFavicon ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                              <span>Optimizing & Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 text-amber-300" />
                              <span>Select & Upload Favicon</span>
                            </>
                          )}
                        </button>

                        {formData.faviconUrl && formData.faviconUrl !== '/icon.svg' && (
                          <button
                            type="button"
                            onClick={() => {
                              handleFieldChange('faviconUrl', '/icon.svg');
                              triggerToast('Reverted to default /icon.svg');
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                            title="Reset to default icon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      💡 <strong>Pro Tip:</strong> Upload a 64×64 or 128×128 square PNG or vector SVG icon. Automatically converted to a lightweight data/server asset.
                    </p>
                  </div>
                )}

                {/* MODE 2: PRESET ICONS */}
                {faviconMode === 'presets' && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 block">Select a Recommended Icon:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {faviconPresets.map((pre, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            handleFieldChange('faviconUrl', pre.url);
                            triggerToast(`Applied "${pre.label}" favicon!`);
                          }}
                          className={`p-2 rounded-xl border text-left text-[11px] font-semibold flex items-center gap-2.5 cursor-pointer transition ${
                            formData.faviconUrl === pre.url
                              ? 'bg-blue-50 border-[#123B6D] text-[#123B6D] font-bold shadow-2xs'
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-1 shrink-0">
                            <img src={pre.url} alt="" className="w-4 h-4 object-contain" />
                          </div>
                          <span className="truncate">{pre.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* MODE 3: CUSTOM URL */}
                {faviconMode === 'url' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 block">Direct Favicon URL:</label>
                    <input
                      type="text"
                      required
                      value={formData.faviconUrl}
                      onChange={(e) => handleFieldChange('faviconUrl', e.target.value)}
                      placeholder="/icon.svg or https://example.com/favicon.png"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none bg-white"
                    />
                    <p className="text-[10px] text-slate-500">
                      Can be a root path (e.g. <code className="bg-slate-200 px-1 py-0.5 rounded">/icon.svg</code>) or full CDN URL.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. FEATURED IMAGE / OG IMAGE (SOCIAL MEDIA SHARING IMAGE) */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span>Featured Image / OG Image</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Social media preview banner (WhatsApp, Twitter, FB)
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full font-bold">
                    1200×630 (1.91:1)
                  </span>
                </div>

                {/* Sub-mode selector (Upload | Presets | URL) */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setOgImageMode('upload')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      ogImageMode === 'upload'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOgImageMode('presets')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      ogImageMode === 'presets'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Presets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOgImageMode('url')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      ogImageMode === 'url'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    <span>Custom URL</span>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={ogImageFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  onChange={handleOgImageUpload}
                  className="hidden"
                />

                {/* MODE 1: UPLOAD PHOTO */}
                {ogImageMode === 'upload' && (
                  <div className="space-y-3">
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative group aspect-[1.91/1]">
                      <img
                        src={formData.ogImageUrl}
                        alt="OG Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-3 sm:p-4 text-white">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                              Social Card Preview
                            </span>
                            <span className="text-xs font-bold line-clamp-1">
                              {formData.seoTitle || 'Website Title'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isUploadingOgImage}
                              onClick={() => ogImageFileInputRef.current?.click()}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                            >
                              {isUploadingOgImage ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                                  <span>Optimizing...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Upload New Photo</span>
                                </>
                              )}
                            </button>

                            {formData.ogImageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleFieldChange('ogImageUrl', ogImagePresets[0].url);
                                  triggerToast('Reverted to default stock banner');
                                }}
                                className="p-1.5 bg-black/50 hover:bg-rose-600 text-white rounded-xl transition cursor-pointer"
                                title="Reset to default banner"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      💡 <strong>Pro Tip:</strong> Select any photo from your device. It is automatically compressed to 1200×630 WebP/JPEG under 100KB so WhatsApp and Twitter load previews instantly.
                    </p>
                  </div>
                )}

                {/* MODE 2: PRESET BANNERS */}
                {ogImageMode === 'presets' && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 block">Select a High-Res Diagnostic Banner:</span>
                    <div className="space-y-1.5">
                      {ogImagePresets.map((pre, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            handleFieldChange('ogImageUrl', pre.url);
                            triggerToast(`Applied "${pre.label}" banner!`);
                          }}
                          className={`w-full p-2 rounded-xl border text-left text-[11px] font-semibold flex items-center justify-between cursor-pointer transition ${
                            formData.ogImageUrl === pre.url
                              ? 'bg-purple-50 border-purple-600 text-purple-900 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-10 h-6 rounded bg-slate-200 overflow-hidden shrink-0">
                              <img src={pre.url} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="truncate">{pre.label}</span>
                          </div>
                          {formData.ogImageUrl === pre.url && <Check className="w-3.5 h-3.5 text-purple-700 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* MODE 3: CUSTOM URL */}
                {ogImageMode === 'url' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 block">Direct Image URL:</label>
                    <input
                      type="url"
                      required
                      value={formData.ogImageUrl}
                      onChange={(e) => handleFieldChange('ogImageUrl', e.target.value)}
                      placeholder="https://images.unsplash.com/... or https://yourcdn.com/og.jpg"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none bg-white"
                    />
                    <div className="h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={formData.ogImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: GOOGLE SITE VERIFICATION & ANALYTICS */}
        {(activeSubTab === 'all' || activeSubTab === 'analytics') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Google Site Verification & Google Analytics
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify website ownership in Google Search Console and track patient portal traffic.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Google Site Verification */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  Google Site Verification Code
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.googleSiteVerification}
                    onChange={(e) => handleFieldChange('googleSiteVerification', e.target.value)}
                    placeholder="e.g. 7q8z9aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Enter your Google Search Console HTML tag content string or paste the entire meta tag code. Automatically generates: <br />
                  <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">
                    &lt;meta name="google-site-verification" content="..." /&gt;
                  </code>
                </p>
              </div>

              {/* 2. Google Analytics ID */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    Google Analytics ID (GA4)
                  </label>
                  {formData.googleAnalyticsId && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      GA4 Active
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.googleAnalyticsId}
                    onChange={(e) => handleFieldChange('googleAnalyticsId', e.target.value)}
                    placeholder="e.g. G-XXXXXXXXXX or UA-XXXXXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Enter your Measurement ID from Google Analytics 4. The tracking script is injected automatically without slowing down page load speed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: ROBOTS.TXT & SCHEMA JSON-LD */}
        {(activeSubTab === 'all' || activeSubTab === 'crawler') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Robots.txt Crawling Settings & Schema / JSON-LD Structured Data
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Control web crawler permissions and provide rich structured data for Google Knowledge Panels.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Robots.txt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span>Robots.txt</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      (Search engine crawling settings)
                    </span>
                  </label>
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#123B6D] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>View Live /robots.txt</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500">Templates:</span>
                  <button
                    type="button"
                    onClick={() => applyRobotsTemplate('standard')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                  >
                    Standard (Block Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRobotsTemplate('open')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                  >
                    Allow All
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRobotsTemplate('strict')}
                    className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold cursor-pointer"
                  >
                    Disallow All
                  </button>
                </div>

                <textarea
                  rows={9}
                  value={formData.robotsTxt}
                  onChange={(e) => handleFieldChange('robotsTxt', e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-[11px] leading-relaxed bg-slate-900 text-emerald-400 focus:ring-2 focus:ring-[#123B6D]/20 focus:outline-none"
                  placeholder="User-agent: *&#10;Allow: /"
                />
                <p className="text-[10px] text-slate-500">
                  Directly served via the server at <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/robots.txt</code>.
                </p>
              </div>

              {/* 2. Schema / JSON-LD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span>Schema / JSON-LD</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      (Structured SEO data)
                    </span>
                  </label>
                  {schemaError ? (
                    <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Syntax Error
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid JSON
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applySchemaTemplate('web_app')}
                    className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-[#123B6D] text-[10px] font-bold cursor-pointer"
                  >
                    WebApplication
                  </button>
                  <button
                    type="button"
                    onClick={() => applySchemaTemplate('medical_business')}
                    className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold cursor-pointer"
                  >
                    MedicalBusiness
                  </button>
                  <button
                    type="button"
                    onClick={() => applySchemaTemplate('diagnostic_lab')}
                    className="px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-800 text-[10px] font-bold cursor-pointer"
                  >
                    DiagnosticLab
                  </button>
                </div>

                <textarea
                  rows={9}
                  value={formData.schemaJsonLd}
                  onChange={(e) => handleFieldChange('schemaJsonLd', e.target.value)}
                  className={`w-full p-3 rounded-xl border font-mono text-[11px] leading-relaxed bg-slate-900 focus:ring-2 focus:outline-none ${
                    schemaError
                      ? 'border-rose-400 text-rose-300 focus:ring-rose-400/20'
                      : 'border-slate-300 text-amber-300 focus:ring-[#123B6D]/20'
                  }`}
                  placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "WebApplication"\n}`}
                />

                {schemaError && (
                  <p className="text-[10px] font-semibold text-rose-600">{schemaError}</p>
                )}
                <p className="text-[10px] text-slate-500">
                  Embeds Schema.org structured data inside <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">&lt;script type="application/ld+json"&gt;</code> in head.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: CUSTOM HEADER & FOOTER CODE */}
        {(activeSubTab === 'all' || activeSubTab === 'custom_code') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Custom Header Code & Custom Footer Code
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Inject third-party scripts, verification tags, chat widgets, or conversion tracking.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Custom Header Code */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  Custom Header Code (&lt;head&gt; scripts/code)
                </label>
                <textarea
                  rows={6}
                  value={formData.customHeaderCode}
                  onChange={(e) => handleFieldChange('customHeaderCode', e.target.value)}
                  placeholder="<!-- Custom Head Scripts, Meta tags, or CSS -->&#10;<script>/* analytics / pixel */</script>"
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-[11px] leading-relaxed bg-slate-900 text-sky-300 focus:ring-2 focus:ring-[#123B6D]/20 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  Injected into the document <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">&lt;head&gt;</code> section. Useful for Meta Pixel, Bing Webmaster, or custom CSS.
                </p>
              </div>

              {/* 2. Custom Footer Code */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  Custom Footer Code (Footer scripts/code)
                </label>
                <textarea
                  rows={6}
                  value={formData.customFooterCode}
                  onChange={(e) => handleFieldChange('customFooterCode', e.target.value)}
                  placeholder="<!-- Custom Footer Scripts, Chatbots, or Tracking Beacons -->&#10;<script>/* chat widget */</script>"
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-[11px] leading-relaxed bg-slate-900 text-emerald-300 focus:ring-2 focus:ring-[#123B6D]/20 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  Injected right before the closing <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">&lt;/body&gt;</code> tag. Ideal for live chat support scripts or deferred analytics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SAVE ACTIONS */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Changes take effect immediately on your website and are synced to search engines.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Reset Defaults
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-98"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-amber-300" />}
              <span>{isSaved ? 'SEO Settings Saved!' : 'Save All SEO Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
