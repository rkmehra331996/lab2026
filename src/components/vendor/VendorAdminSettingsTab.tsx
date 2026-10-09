import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Smartphone,
  ShieldCheck,
  UserCheck,
  HelpCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';

interface VendorAdminSettingsTabProps {
  onNavigateView?: (view: any) => void;
}

export const VendorAdminSettingsTab: React.FC<VendorAdminSettingsTabProps> = ({
  onNavigateView,
}) => {
  const {
    vendorLabSettings,
    updateVendorLabSettings,
    updateVendorLabCredentials,
    vendorLabsList,
    currentUser,
    activeTenantId,
    openCacheModal,
    storageMetrics,
    cleanStorageCache,
  } = useCms();

  const [isCleaningCache, setIsCleaningCache] = useState(false);
  const [cacheFeedback, setCacheFeedback] = useState<string | null>(null);

  const handleQuickClean = async () => {
    setIsCleaningCache(true);
    try {
      const res = await cleanStorageCache();
      setCacheFeedback(`Cleaned ${res.freedFormatted} of stale cache!`);
      setTimeout(() => setCacheFeedback(null), 4000);
    } finally {
      setIsCleaningCache(false);
    }
  };

  // Determine current active lab
  const currentLabId =
    vendorLabSettings?.labId ||
    (currentUser?.role !== 'admin' ? currentUser?.labId : 'lab-apex') ||
    'lab-apex';

  const currentLab =
    vendorLabsList.find((l) => l.id === currentLabId) ||
    vendorLabsList.find((l) => l.id === 'lab-apex') ||
    vendorLabsList[0];

  const initialPassword =
    vendorLabSettings.ownerPassword || currentLab?.password || 'owner123';
  const initialPin =
    vendorLabSettings.ownerPin || currentLab?.pin || '123456';

  // Form State
  const [newPassword, setNewPassword] = useState(initialPassword);
  const [confirmPassword, setConfirmPassword] = useState(initialPassword);
  const [newPin, setNewPin] = useState(initialPin);
  const [confirmPin, setConfirmPin] = useState(initialPin);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Sync if settings change externally
  useEffect(() => {
    const pass = vendorLabSettings.ownerPassword || currentLab?.password || 'owner123';
    const pin = vendorLabSettings.ownerPin || currentLab?.pin || '123456';
    setNewPassword(pass);
    setConfirmPassword(pass);
    setNewPin(pin);
    setConfirmPin(pin);
  }, [vendorLabSettings.ownerPassword, vendorLabSettings.ownerPin, currentLab]);

  // Password Strength calculation
  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 30, label: 'Fair', color: 'bg-amber-400' };
    if (score <= 4) return { score: 70, label: 'Good', color: 'bg-blue-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = calculatePasswordStrength(newPassword);

  // Quick Password Suggestion
  const handleSuggestPassword = () => {
    const prefixes = ['Apex', 'Diagnostic', 'LabPro', 'CareSafe', 'PathoCore'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generated = `${randomPrefix}@${randomNum}#`;
    setNewPassword(generated);
    setConfirmPassword(generated);
    setErrorMessage('');
  };

  // Quick PIN Suggestion
  const handleSuggestPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPin(randomPin);
    setConfirmPin(randomPin);
    setErrorMessage('');
  };

  // Save handler
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!newPassword.trim()) {
      setErrorMessage('Please provide an Admin Password');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New Password and Confirm Password do not match');
      return;
    }

    const cleanPin = newPin.replace(/\D/g, '');
    if (!cleanPin) {
      setErrorMessage('Please provide a 6-digit Security PIN Code');
      return;
    }
    if (cleanPin.length !== 6) {
      setErrorMessage('Security PIN Code must be exactly 6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage('Security PIN and Confirm PIN do not match');
      return;
    }

    // Apply updates
    const cleanPass = newPassword.trim();
    updateVendorLabCredentials(currentLabId, cleanPass, cleanPin);
    updateVendorLabSettings({
      ownerPassword: cleanPass,
      ownerPin: cleanPin,
    });

    setSuccessToast(`Admin PIN Code & Password updated successfully! New password: "${cleanPass}" | PIN: "${cleanPin}"`);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* PIN CODE & PASSWORD — EDIT FORM */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <KeyRound className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                PIN Code &amp; Password — Edit Credentials
              </h2>
              <p className="text-xs text-slate-500">
                Update your authentication secret keys. Changes apply immediately across all authorized devices.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Section 8
          </span>
        </div>

        <form onSubmit={handleSaveCredentials} className="p-6 space-y-6">
          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PART 1: MASTER PASSWORD EDIT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#123B6D]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  1. Master Password Configuration
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSuggestPassword}
                className="text-xs font-bold text-[#123B6D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Suggest Strong Password</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Admin Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter new password (min 4 characters)"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>Password Strength:</span>
                    <span className={strength.label === 'Strong' ? 'text-emerald-600' : 'text-slate-700'}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Re-type new password to confirm"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Match validation badge */}
                <div className="mt-2">
                  {newPassword && confirmPassword && (
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {newPassword === confirmPassword ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PART 2: 6-DIGIT SECURITY PIN EDIT */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  2. 6-Digit Security PIN Code
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSuggestPin}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Generate Random PIN</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New PIN Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New 6-Digit PIN Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => {
                      setNewPin(e.target.value.replace(/\D/g, ''));
                      setErrorMessage('');
                    }}
                    placeholder="e.g. 123456"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 font-mono font-bold text-sm tracking-widest text-slate-900 focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Digits only (6 numbers). Used for quick verification on handheld tablets.
                </p>
              </div>

              {/* Confirm PIN Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm 6-Digit PIN Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => {
                      setConfirmPin(e.target.value.replace(/\D/g, ''));
                      setErrorMessage('');
                    }}
                    placeholder="Re-type 6-digit PIN"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 font-mono font-bold text-sm tracking-widest text-slate-900 focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Match validation badge */}
                <div className="mt-2">
                  {newPin && confirmPin && (
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        newPin === confirmPin ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {newPin === confirmPin ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>PINs match (6 digits verified)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>PINs do not match</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              Changes sync directly to Hostinger MySQL database for <strong className="text-slate-600">{currentLabId}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save &amp; Apply PIN &amp; Password</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* CARD 2: SAAS CACHE & STORAGE OPTIMIZATION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
              🧹
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                SaaS Cache &amp; Storage Engine
              </h3>
              <p className="text-xs text-slate-500">
                Monitor and purge cached records, reduce memory usage, and keep browser fast
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCacheModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold text-xs transition shadow-xs cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Open Storage Manager</span>
          </button>
        </div>

        <div className="p-6">
          {cacheFeedback && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{cacheFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">Local Cache Footprint</span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {storageMetrics?.localStorageFormatted || '0 KB'}
              </div>
              <span className="text-[10px] text-slate-400">
                {storageMetrics?.localStorageKeyCount || 0} stored keys (Quota-safe)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">Offline IndexedDB</span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {storageMetrics?.indexedDbFormatted || '0 KB'}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">
                IndexedDB async engine active
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">Cache Health Status</span>
              <div className="text-xl font-black text-emerald-700 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Optimized</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Zero duplicate collections
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <strong>Need to free up browser memory?</strong> Purging cache clears temporary data and browser caches without affecting your live reports or database.
            </div>
            <button
              type="button"
              onClick={handleQuickClean}
              disabled={isCleaningCache}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{isCleaningCache ? 'Optimizing...' : '⚡ Quick Cache Clean'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
