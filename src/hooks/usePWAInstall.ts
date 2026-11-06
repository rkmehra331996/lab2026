import { useEffect, useState } from 'react';
import { downloadDesktopShortcut } from '../utils/shortcutGenerator';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
    __pwaInstalled?: boolean;
  }
}

/**
 * Directly triggers the native browser PWA install prompt (Chromium Desktop & Android)
 * or immediately generates and downloads a native Windows/Mac Desktop Shortcut (.url / .webloc).
 */
export async function triggerNativePwaInstall(
  targetLabId?: string,
  targetLabName?: string,
  targetUrl?: string
): Promise<{ success: boolean; outcome: 'accepted' | 'dismissed' | 'already_installed' | 'unavailable'; message: string }> {
  if (typeof window === 'undefined') {
    return { success: false, outcome: 'unavailable', message: 'Window unavailable' };
  }

  if (targetLabId) {
    try {
      localStorage.setItem('cms_installed_vendor_app_slug', targetLabId);
      localStorage.setItem('cms_installed_vendor_app_id', targetLabId);
    } catch {}
  }

  // 1. Check if already running in installed standalone mode
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.__pwaInstalled === true;

  if (isStandalone) {
    return {
      success: true,
      outcome: 'already_installed',
      message: `✅ ${targetLabName || 'लैब'} का शॉर्टकट पहले से आपके डेस्कटॉप / डिवाइस पर मौजूद है!`,
    };
  }

  // 2. Check native beforeinstallprompt event (PWA direct prompt)
  const promptEvent = window.__pwaDeferredPrompt;

  if (promptEvent) {
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        window.__pwaDeferredPrompt = null;
        window.__pwaInstalled = true;
        return {
          success: true,
          outcome: 'accepted',
          message: `✅ ${targetLabName || 'लैब'} का डेस्कटॉप शॉर्टकट सफलतापूर्वक इंस्टॉल हो गया!`,
        };
      }
      return {
        success: false,
        outcome: 'dismissed',
        message: 'ℹ️ शॉर्टकट इंस्टॉलेशन रद्द किया गया।',
      };
    } catch (err) {
      console.warn('[Direct PWA Install Prompt Error]:', err);
    }
  }

  // 3. Fallback on Desktop / Mobile:
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isAndroid) {
    return {
      success: false,
      outcome: 'unavailable',
      message: '📲 Android: ऊपर 3 डॉट्स (⋮) पर टैप करके "Add to Home screen" चुनें।',
    };
  }

  // Generate and download real .url shortcut file for Desktop Windows/Mac
  try {
    const effectiveLink = targetUrl || window.location.href;
    const shortcutRes = downloadDesktopShortcut(effectiveLink, targetLabName || 'Diagnostic_Lab');
    return {
      success: true,
      outcome: 'accepted',
      message: `✅ ${shortcutRes.filename} डाउनलोड हो गई है! इस फ़ाइल को अपने Desktop पर रखें या डबल-क्लिक करके खोलें।`,
    };
  } catch (err) {
    console.warn('[Shortcut Download Error]:', err);
    return {
      success: false,
      outcome: 'unavailable',
      message: '💻 Desktop: ब्राउज़र एड्रेस बार में (⊕ या 💻) "Install" आइकॉन पर क्लिक करके डेस्कटॉप शॉर्टकट बनाएं।',
    };
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return typeof window !== 'undefined' ? (window.__pwaDeferredPrompt || null) : null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.__pwaInstalled === true
    );
  });
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed on desktop or mobile home screen)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        window.__pwaInstalled === true);
    setIsInstalled(isStandalone);

    // Detect iOS devices (Safari does not support beforeinstallprompt)
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    }

    // Pick up pre-captured prompt if available
    if (typeof window !== 'undefined' && window.__pwaDeferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptObj = e as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = promptObj;
      setDeferredPrompt(promptObj);
    };

    const handlePromptReady = () => {
      if (window.__pwaDeferredPrompt) {
        setDeferredPrompt(window.__pwaDeferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        window.__pwaDeferredPrompt = null;
        window.__pwaInstalled = true;
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  const install = async (targetLabId?: string, targetLabName?: string) => {
    const res = await triggerNativePwaInstall(targetLabId, targetLabName);
    if (res.outcome === 'accepted' || res.outcome === 'already_installed') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt || (typeof window !== 'undefined' && !!window.__pwaDeferredPrompt),
    isInstalled,
    isIOS,
    install,
    deferredPrompt,
  };
}
