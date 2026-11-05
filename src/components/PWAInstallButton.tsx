import React, { useState } from 'react';
import { Download, Smartphone, X, Laptop, Sparkles } from 'lucide-react';
import { usePWAInstall, triggerNativePwaInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner' | 'card' | 'minimal';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // If already running inside an installed PWA instance, do not show install button
  if (isInstalled) {
    return null;
  }

  // If browser doesn't support beforeinstallprompt and is not iOS, keep UI clean
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    const res = await triggerNativePwaInstall();
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] sm:w-auto px-4 py-3 bg-[#123B6D] text-white rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
        <button
          type="button"
          onClick={() => setToastMessage(null)}
          className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (variant === 'minimal') {
    return (
      <>
        {isInstallable && (
          <button
            type="button"
            onClick={handleInstallClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 ${className}`}
            title="Install IndianLalaji Lab Software on this PC / Mobile"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}

        {isIOS && (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white shadow-xs transition active:scale-95 ${className}`}
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>Install on iOS</span>
          </button>
        )}

        {showIOSGuide && <IOSGuideModal onClose={() => setShowIOSGuide(false)} />}
        {renderToast()}
      </>
    );
  }

  if (variant === 'banner') {
    return (
      <>
        <div className={`flex items-center justify-between gap-3 px-3 py-2 bg-gradient-to-r from-emerald-900 to-teal-900 border border-emerald-600/50 rounded-lg text-white shadow-md ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-md">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Install Offline PC App (PWA)</p>
              <p className="text-[11px] text-emerald-200/80">बिना इंटरनेट के भी रिसेप्शन और रिपोर्ट्स तुरंत खोलें</p>
            </div>
          </div>

          {isInstallable && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-md shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Now</span>
            </button>
          )}

          {isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs rounded-md shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>How to Install</span>
            </button>
          )}
        </div>

        {showIOSGuide && <IOSGuideModal onClose={() => setShowIOSGuide(false)} />}
        {renderToast()}
      </>
    );
  }

  // Default navbar variant
  return (
    <>
      {isInstallable && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition active:scale-95 cursor-pointer ${className}`}
          title="Install IndianLalaji Desktop / Mobile App (Works Offline)"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install Offline App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {isIOS && (
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 transition active:scale-95 cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install iOS</span>
        </button>
      )}

      {showIOSGuide && <IOSGuideModal onClose={() => setShowIOSGuide(false)} />}
      {renderToast()}
    </>
  );
};

const IOSGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Offline PWA Installation</p>
        </div>
      </div>

      <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300 mb-5">
        <li className="flex items-start gap-2.5">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200">1</span>
          <span>Safari ब्राउज़र के नीचे स्थित <strong>Share</strong> (शेयर) बटन पर टैप करें।</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200">2</span>
          <span>नीचे स्क्रॉल करके <strong>Add to Home Screen</strong> (होम स्क्रीन पर जोड़ें) चुनें।</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200">3</span>
          <span>ऊपर दाएं कोने में <strong>Add</strong> पर क्लिक करें। ऐप होम स्क्रीन पर आ जाएगी!</span>
        </li>
      </ol>

      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
      >
        ठीक है (Got It)
      </button>
    </div>
  </div>
);
