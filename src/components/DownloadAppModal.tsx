import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Apple,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  ExternalLink,
  PlusCircle,
  Sparkles,
  FileText,
  Clock,
  BookmarkPlus,
  ArrowRight,
} from 'lucide-react';

export interface HomeScreenShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  labName: string;
  labId?: string;
  websiteDirectUrl?: string;
  /** Backward compatible prop */
  downloadAppUrl?: string;
}

export const HomeScreenShortcutModal: React.FC<HomeScreenShortcutModalProps> = ({
  isOpen,
  onClose,
  labName,
  labId = 'lab',
  websiteDirectUrl,
  downloadAppUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccessToast, setInstallSuccessToast] = useState<string | null>(null);

  const effectiveUrl = websiteDirectUrl || downloadAppUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // Listen for beforeinstallprompt event for Android / Chromium PWA 1-click install
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if already installed in standalone mode
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Update dynamic PWA manifest so when user installs PWA from this modal, it directly launches this vendor shop
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const vendorTargetUrl = effectiveUrl || `/shop/${labId}`;
    try {
      const dynamicManifest = {
        id: `/shop/${labId}`,
        name: `${labName} Diagnostic App`,
        short_name: (labName || 'Lab App').slice(0, 24),
        description: `Official Diagnostic & Pathology Mobile App for ${labName}`,
        start_url: vendorTargetUrl,
        scope: '/',
        display: 'standalone',
        theme_color: '#123B6D',
        background_color: '#F8FAFC',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      };

      const blob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/manifest+json' });
      const manifestUrl = URL.createObjectURL(blob);
      let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'manifest';
        document.head.appendChild(link);
      }
      link.href = manifestUrl;

      localStorage.setItem('cms_installed_vendor_app_slug', labId);
      localStorage.setItem('cms_installed_vendor_app_id', labId);

      return () => {
        URL.revokeObjectURL(manifestUrl);
      };
    } catch (e) {
      console.warn('Dynamic manifest setup warning:', e);
    }
  }, [labId, labName, effectiveUrl]);

  if (!isOpen) return null;

  // Handle 1-Click Android PWA Install / Home Screen Shortcut
  const handleAddToHomeScreen = async () => {
    try {
      localStorage.setItem('cms_installed_vendor_app_slug', labId);
      localStorage.setItem('cms_installed_vendor_app_id', labId);
    } catch {}

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setInstallSuccessToast('✅ App successfully added to your device!');
          setTimeout(() => setInstallSuccessToast(null), 4000);
        }
        setDeferredPrompt(null);
        return;
      } catch {}
    }

    // If native prompt is not available, show clear helpful guidance toast
    if (activeTab === 'android') {
      setInstallSuccessToast('👉 ऊपर दायें कोने में (⋮) मेनू पर क्लिक करें और "Add to Home screen" चुनें');
    } else {
      setInstallSuccessToast('👉 नीचे Share (⎋) बटन पर टैप करें और "Add to Home Screen" चुनें');
    }
    setTimeout(() => setInstallSuccessToast(null), 5000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(effectiveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Open ${labName} Lab Portal directly on your mobile:\n${effectiveUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-screen-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#123B6D] via-[#0d2e57] to-[#0B2545] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close Home Screen Shortcut Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center shadow-inner shrink-0">
              <BookmarkPlus className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30 mb-1">
                <Sparkles className="w-3 h-3" />
                <span>1-Tap Quick Access</span>
              </div>
              <h2 id="home-screen-modal-title" className="text-lg sm:text-xl font-black text-white leading-tight">
                Add to Home Screen (होम स्क्रीन शॉर्टकट)
              </h2>
              <p className="text-xs text-slate-300">
                {labName} • बिना ऐप डाउनलोड किए सीधे अपने मोबाइल स्क्रीन पर जोड़ें
              </p>
            </div>
          </div>

          {/* OS Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-white/10 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-[#123B6D] shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Android (Google Chrome)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-[#123B6D] shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Apple className="w-4 h-4 text-slate-800" />
              <span>iPhone / iPad (Safari)</span>
            </button>
          </div>
        </div>

        {/* Success / Info Toast */}
        {installSuccessToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-xs animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{installSuccessToast}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[68vh] space-y-5 text-slate-700 text-xs">
          {/* Main 1-Click Action Card */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 border border-emerald-200 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <PlusCircle className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {activeTab === 'android' ? 'Android Home Screen Shortcut' : 'iPhone / iPad Home Screen Shortcut'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    सीधे फ़ोन की स्क्रीन से 1-क्लिक में रिपोर्ट्स, टेस्ट व बुकिंग्स एक्सेस करें
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200 shrink-0">
                Zero Storage
              </span>
            </div>

            <button
              type="button"
              id="btn-add-app"
              onClick={handleAddToHomeScreen}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <PlusCircle className="w-4 h-4 text-emerald-200" />
              <span>
                {isInstalled
                  ? 'App Already Installed'
                  : 'Add App'}
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-200 ml-1" />
            </button>
          </div>

          {/* Section: How to Add Step-by-Step Instructions */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-900 text-xs sm:text-sm flex items-center justify-between">
              <span>
                {activeTab === 'android'
                  ? 'Android पर शॉर्टकट कैसे जोड़ें (Step-by-Step Guide)'
                  : 'iPhone / iPad पर शॉर्टकट कैसे जोड़ें (Step-by-Step Guide)'}
              </span>
            </h3>

            {activeTab === 'android' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Chrome ब्राउज़र</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    वेबसाइट को अपने फ़ोन के <strong>Google Chrome</strong> ब्राउज़र में खोलें।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">मेनू (⋮) टैप करें</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    ऊपर दायें कोने में 3 डॉट्स <strong>(⋮)</strong> मेनू पर क्लिक करें।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Add to Home screen</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    <strong>"Add to Home screen"</strong> (या "Install app") पर टैप करें। शॉर्टकट तुरंत होम स्क्रीन पर आ जाएगा।
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#123B6D] text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Safari ब्राउज़र</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    वेबसाइट को अपने iPhone या iPad में <strong>Apple Safari</strong> में खोलें।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#123B6D] text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Share (⎋) बटन</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    नीचे मेनू बार में मौजूद <strong>Share icon (⎋)</strong> पर टैप करें।
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#123B6D] text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Add to Home Screen</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    सूची में <strong>"Add to Home Screen" (➕)</strong> चुनकर <strong>"Add"</strong> दबाएँ।
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Why Home Screen Shortcut? */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-extrabold text-slate-900 text-xs mb-2.5">
              होम स्क्रीन शॉर्टकट के मुख्य फ़ायदे (Key Benefits):
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <FileText className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">Instant Reports</div>
                <div className="text-[10px] text-slate-500">1-टैप में PDF डाउनलोड</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">Live Status</div>
                <div className="text-[10px] text-slate-500">सैंपल व टेस्ट ट्रैकिंग</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">No App Store</div>
                <div className="text-[10px] text-slate-500">फ़ोन स्टोरेज की बचत</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <ExternalLink className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">100% Direct</div>
                <div className="text-[10px] text-slate-500">हमेशा ताज़ा डेटा</div>
              </div>
            </div>
          </div>

          {/* Direct Link Share & Copy */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-slate-600 truncate select-all">
              {effectiveUrl}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Share on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px]">100% Direct &amp; Safe • Official Laboratory Shortcut</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Backward-compatible alias so existing imports don't break
export const DownloadAppModal = HomeScreenShortcutModal;
