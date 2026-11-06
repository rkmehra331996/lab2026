/**
 * Utility to generate and download real Desktop Shortcut files (.url for Windows, .webloc for macOS).
 * When saved to Desktop or clicked, this opens the exact laboratory website directly in the user's browser.
 */

export interface DesktopShortcutResult {
  filename: string;
  format: 'url' | 'webloc';
  success: boolean;
}

export function downloadDesktopShortcut(
  targetUrl: string,
  labName: string = 'Diagnostic Lab'
): DesktopShortcutResult {
  if (typeof window === 'undefined') {
    return { filename: '', format: 'url', success: false };
  }

  // Ensure absolute URL
  let fullUrl = targetUrl;
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    fullUrl = `${window.location.origin}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
  }

  const isMac = /macintosh|mac os x/i.test(navigator.userAgent);
  const sanitizedName = (labName || 'Laboratory')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40);

  if (isMac) {
    const filename = `${sanitizedName}_Desktop_Shortcut.webloc`;
    const weblocContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>URL</key>
\t<string>${fullUrl}</string>
</dict>
</plist>`;
    const blob = new Blob([weblocContent], { type: 'application/octet-stream' });
    triggerDownload(blob, filename);
    return { filename, format: 'webloc', success: true };
  }

  // Windows & Universal Standard Internet Shortcut (.url)
  const filename = `${sanitizedName}_Desktop_Shortcut.url`;
  const urlFileContent = `[InternetShortcut]\r\nURL=${fullUrl}\r\nIconIndex=0\r\n[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,11\r\n`;
  const blob = new Blob([urlFileContent], { type: 'application/internet-shortcut;charset=utf-8' });
  triggerDownload(blob, filename);
  return { filename, format: 'url', success: true };
}

function triggerDownload(blob: Blob, filename: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}
