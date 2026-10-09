import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Building2,
  FlaskConical,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Receipt,
  Phone,
  Hash,
  Crown,
  AlertCircle,
  Sparkles,
  MapPin,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
  MessageSquare,
  ExternalLink,
  Globe,
  Copy,
  Check,
  RotateCw,
  FileText,
  Clock,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView } from '../types';
import { getPermissionsForRole } from '../utils/rbac';

interface CmsAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView: (view: AppView) => void;
  isVendorContext?: boolean;
}

export type MainAuthRole = 'super_admin' | 'vendor_owner';
export type LabAuthRole = 'vendor' | 'reception' | 'technician';

export const INDIAN_STATES = [
  'Punjab',
  'Haryana',
  'Delhi NCR',
  'Uttar Pradesh',
  'Rajasthan',
  'Himachal Pradesh',
  'Chandigarh',
  'Jammu & Kashmir',
  'Uttarakhand',
  'Maharashtra',
  'Gujarat',
  'Madhya Pradesh',
  'Bihar',
  'West Bengal',
  'Karnataka',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Telangana',
  'Kerala',
  'Odisha',
  'Assam',
  'Jharkhand',
  'Chhattisgarh',
  'Goa',
  'Tripura',
  'Meghalaya',
  'Manipur',
  'Nagaland',
  'Puducherry',
];

export const REGISTRATION_PACKAGES = [
  {
    id: '1-month',
    name: '1 Month',
    priceINR: 1499,
    duration: '30 Days',
    badge: 'Starter & Flexible',
    badgeColor: 'bg-blue-100 text-[#123B6D] border-blue-200',
    description: 'Billed monthly • Complete software access',
  },
  {
    id: '3-months',
    name: '3 Months',
    priceINR: 3999,
    duration: '90 Days',
    badge: 'Most Popular',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: '₹1,333/month • Billed quarterly',
  },
  {
    id: '1-year',
    name: '1 Year',
    priceINR: 11999,
    duration: '365 Days',
    badge: 'Best Value',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    description: '₹999/month • Maximum annual savings',
  },
];

export const CmsAuthModal: React.FC<CmsAuthModalProps> = ({
  isOpen,
  onClose,
  onNavigateView,
  isVendorContext = false,
}) => {
  const {
    login,
    targetLoginRole,
    currentUser,
    logout,
    vendorLabsList,
    vendorLabSettings,
    selectedVendorLabId,
    vendorBranches,
    authModalTab,
    setAuthModalTab,
    registerNewLab,
    selectVendorLab,
    selectedRegistrationPackage,
    setSelectedRegistrationPackage,
  } = useCms();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Role selections
  // For Lab Website: Lab Admin, Receptionist, Technician
  const [labRole, setLabRole] = useState<LabAuthRole>('vendor');
  // For Main Website: SuperAdmin, Admin (labowner) — Default to lab owner for immediate vendor access
  const [mainRole, setMainRole] = useState<MainAuthRole>('vendor_owner');

  // Login form fields
  const [selectedLabId, setSelectedLabId] = useState<string>(() => selectedVendorLabId || 'lab-apex');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch-1');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // CREATE LABORATORY FORM STATES (Per exact user specifications):
  // Details:
  //   Lab Name*
  //   State*
  // Package Selection:
  //   1 Month | 3 Months | 1 Year (Auto-filled on package click)
  // Owner & Login:
  //   Mobile Number* — 10 digits
  //   Password* — 5 characters + 5 numbers
  //   6-Digit PIN*
  // Actions:
  //   [ Create Lab ]
  //   [ 📲 Share Credentials on WhatsApp ]
  // -------------------------------------------------------------
  const [createLabName, setCreateLabName] = useState('');
  const [createState, setCreateState] = useState('Punjab');
  const [createPackage, setCreatePackage] = useState<string>('3 Months');
  const [createMobile, setCreateMobile] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPin, setCreatePin] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createError, setCreateError] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Created Lab Success State
  const [createdLabData, setCreatedLabData] = useState<{
    labName: string;
    state: string;
    phone: string;
    password: string;
    pin: string;
    labId: string;
    domainUrl: string;
    subscriptionPlan?: string;
  } | null>(null);

  // Auto-fill Package Selection field when selectedRegistrationPackage changes or modal opens
  useEffect(() => {
    if (selectedRegistrationPackage) {
      const lower = selectedRegistrationPackage.toLowerCase();
      if (lower.includes('1 month') || lower.includes('starter') || lower.includes('monthly')) {
        setCreatePackage('1 Month');
      } else if (lower.includes('year') || lower.includes('annual') || lower.includes('12')) {
        setCreatePackage('1 Year');
      } else {
        setCreatePackage('3 Months');
      }
    }
  }, [selectedRegistrationPackage, isOpen]);

  // Vendor context strictly locks the modal to that laboratory's portal login
  // (No Superadmin login, No Create Laboratory option inside vendor's lab)
  const effectiveIsVendor = Boolean(isVendorContext);

  // Sync tab with context when modal opens or target role changes
  useEffect(() => {
    if (effectiveIsVendor) {
      setActiveTab('login');
    } else if (targetLoginRole === 'admin') {
      setActiveTab('login');
      setMainRole('super_admin');
    } else if (authModalTab) {
      setActiveTab(authModalTab);
    }
  }, [authModalTab, isOpen, effectiveIsVendor, targetLoginRole]);

  useEffect(() => {
    if (effectiveIsVendor) {
      if (targetLoginRole === 'reception') setLabRole('reception');
      else if (targetLoginRole === 'technician') setLabRole('technician');
      else setLabRole('vendor');

      setLoginError('');
      const defaultLab = selectedVendorLabId || (vendorLabsList && vendorLabsList.length > 0 ? vendorLabsList[0].id : 'lab-apex');
      setSelectedLabId(defaultLab);
      setSelectedBranchId('branch-1');
    } else {
      if (targetLoginRole === 'admin') setMainRole('super_admin');
      else if (targetLoginRole === 'vendor') setMainRole('vendor_owner');
      else setMainRole('super_admin');

      setLoginError('');
    }
  }, [targetLoginRole, effectiveIsVendor, isOpen, selectedVendorLabId, vendorLabsList]);

  if (!isOpen) return null;

  // Current Lab Item for vendor context
  const currentLabItem = vendorLabsList.find((l) => l.id === selectedLabId) || vendorLabsList[0];
  const activeLabDisplayName = currentLabItem?.name || vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology';

  // Password validation: 5 characters (letters) + 5 numbers
  const lettersCount = (createPassword.match(/[a-zA-Z]/g) || []).length;
  const numbersCount = (createPassword.match(/[0-9]/g) || []).length;
  const isPasswordValid = lettersCount === 5 && numbersCount === 5 && createPassword.length === 10;

  // Helper: Generate compliant password (5 letters + 5 numbers)
  const handleGeneratePassword = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const nums = '23456789';
    let lettersPart = '';
    for (let i = 0; i < 5; i++) {
      lettersPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    let numsPart = '';
    for (let i = 0; i < 5; i++) {
      numsPart += nums.charAt(Math.floor(Math.random() * nums.length));
    }
    setCreatePassword(`${lettersPart}${numsPart}`);
  };

  // Helper: Generate 6-Digit PIN
  const handleGeneratePin = () => {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    setCreatePin(pin);
  };

  // WhatsApp Share Credentials Helper
  const handleShareWhatsApp = (params?: {
    labName?: string;
    state?: string;
    phone?: string;
    password?: string;
    pin?: string;
    labId?: string;
    subscriptionPlan?: string;
  }) => {
    const lab = params?.labName || createLabName.trim();
    const st = params?.state || createState;
    const ph = (params?.phone || createMobile).replace(/\D/g, '').slice(-10);
    const pass = params?.password || createPassword.trim();
    const pCode = params?.pin || createPin.trim();
    const pkg = params?.subscriptionPlan || createPackage || '3 Months';

    if (!lab) {
      setCreateError('Please enter the Lab Name first to share credentials.');
      return;
    }
    if (!ph || ph.length < 10) {
      setCreateError('Please enter a valid 10-digit Mobile Number to share credentials.');
      return;
    }

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://indianlalaji.com';
    const cleanSlug = lab.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'newlab';
    const labUrl = `${currentOrigin}/shop/${cleanSlug}`;
    const mainLoginUrl = `${currentOrigin}?view=vendor_dashboard`;

    const message = `🏥 *LABORATORY CREDENTIALS*
━━━━━━━━━━━━━━━━━━━━━━
*Lab Name:* ${lab}
*State:* ${st}
*Selected Package:* ${pkg}
*Status:* ⏳ Draft (Pending Super Admin Approval)

🔐 *OWNER LOGIN DETAILS:*
• *Mobile Number / ID:* ${ph}
• *Password:* ${pass || '(Set in form)'}
• *6-Digit PIN:* ${pCode || '(Set in form)'}
• *Role:* Admin (labowner)

🌐 *DEDICATED LAB WEBSITE:*
${labUrl}
*(Note: Website pehle Draft mode me rahegi. Super Admin ke approval ke baad live publish hogi.)*

🚀 *ADMIN DASHBOARD LOGIN:*
${mainLoginUrl}

👥 *DEFAULT STAFF LOGINS:*
• Receptionist: reception.${cleanSlug} (Pass: ${pass ? pass + '1' : 'reception123'})
• Technician: tech.${cleanSlug} (Pass: ${pass ? pass + '2' : 'tech123'})

━━━━━━━━━━━━━━━━━━━━━━
_Powered by indianlalaji.com - India's Premier Pathology Lab Software_`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=91${ph}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Handle Lab Creation Submission
  const handleCreateLabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!createLabName.trim()) {
      setCreateError('Please enter the Laboratory Name.');
      return;
    }
    if (!createState.trim()) {
      setCreateError('Please select the State.');
      return;
    }

    const cleanPhone = createMobile.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setCreateError('Mobile Number must be exactly 10 digits.');
      return;
    }

    // Check duplicate phone
    const existing = vendorLabsList.find(
      (l) => (l.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone
    );
    if (existing) {
      setCreateError(
        `This mobile number (+91 ${cleanPhone}) is already registered with "${existing.name}". Ek number se ek hi lab register ho sakti hai.`
      );
      return;
    }

    if (!createPassword.trim()) {
      setCreateError('Please enter Password (5 characters + 5 numbers).');
      return;
    }

    if (lettersCount !== 5 || numbersCount !== 5 || createPassword.length !== 10) {
      setCreateError('Password must contain exactly 5 characters/letters + 5 numbers (e.g. LABAD12345). Click "⚡ Generate" for instant compliant password.');
      return;
    }

    if (!createPin.trim() || createPin.length !== 6 || !/^\d{6}$/.test(createPin)) {
      setCreateError('Please enter an exact 6-Digit numeric PIN (e.g. 123456).');
      return;
    }

    setIsSubmitting(true);

    try {
      const { lab } = registerNewLab({
        labName: createLabName.trim(),
        state: createState,
        phone: cleanPhone,
        password: createPassword.trim(),
        pin: createPin.trim(),
        ownerName: `${createLabName.trim()} Admin`,
        city: createState,
        subscriptionPlan: createPackage,
      });

      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://indianlalaji.com';
      const cleanSlug = lab.slug || lab.id.replace(/^lab-/, '') || createLabName.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'newlab';
      const domainUrl = `${currentOrigin}/shop/${cleanSlug}`;

      setCreatedLabData({
        labName: lab.name,
        state: lab.state || createState,
        phone: cleanPhone,
        password: createPassword.trim(),
        pin: createPin.trim(),
        labId: lab.id,
        domainUrl,
        subscriptionPlan: createPackage,
      });

      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      setCreateError(err?.message || 'Failed to create laboratory. Please verify inputs.');
    }
  };

  // Handle Lab Website Login (Lab Admin, Receptionist, Technician)
  const handleLabWebsiteLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!emailOrPhone.trim()) {
      setLoginError(
        labRole === 'vendor'
          ? 'Please enter registered 10-digit Mobile Number or Email.'
          : 'Please enter Staff ID, Username or Mobile.'
      );
      return;
    }
    if (!password.trim()) {
      setLoginError('Please enter account password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const cleanInput = emailOrPhone.trim().toLowerCase();
      const cleanDigits = cleanInput.replace(/\D/g, '');
      const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

      // Auto-detect Super Admin credentials entered in Lab login modal
      const isSuperAdminEmail =
        cleanInput === 'therkmehra331996@gmail.com' ||
        cleanInput === 'rkmehra331996@gmail.com' ||
        cleanInput === 'admin@indianlalaji.com' ||
        cleanInput === 'superadmin@indianlalaji.com' ||
        cleanInput === 'admin' ||
        cleanInput === 'superadmin' ||
        cleanInput === 'super_admin' ||
        cleanInput === 'super-admin' ||
        cleanInput === 'super admin' ||
        cleanInput === 'therkmehra331996' ||
        cleanInput === 'rkmehra331996' ||
        cleanInput === 'mehra' ||
        cleanInput.includes('rkmehra') ||
        cleanInput === 'admin@gmail.com' ||
        cleanInput === 'superadmin@gmail.com' ||
        cleanInput === 'root';

      if (isSuperAdminEmail) {
        const result = login(
          'admin',
          emailOrPhone.trim(),
          password.trim(),
          'all',
          selectedBranchId,
          pinCode.trim()
        );
        setIsSubmitting(false);
        if (result.success) {
          onClose();
          onNavigateView('admin_dashboard');
          return;
        } else {
          setLoginError(result.error || 'Super Admin authentication failed. Check password.');
          return;
        }
      }

      const targetRole = labRole; // 'vendor' | 'reception' | 'technician'

      // Auto-resolve laboratory if owner or staff credentials belong to a different registered lab
      const matchedLab = vendorLabsList.find((l) => {
        const lDigits = (l.phone || '').replace(/\D/g, '');
        const lLast10 = lDigits.length >= 10 ? lDigits.slice(-10) : lDigits;
        if (cleanDigits.length >= 7 && (lLast10 === last10 || lDigits.endsWith(cleanDigits) || cleanDigits.endsWith(lDigits))) {
          return true;
        }
        if (l.email && l.email.toLowerCase().trim() === cleanInput) return true;
        if (l.id.toLowerCase() === cleanInput || l.id.toLowerCase().replace('lab-', '') === cleanInput.replace('lab-', '')) return true;
        if (l.domainPreview && l.domainPreview.toLowerCase().split('.')[0] === cleanInput) return true;
        if (l.name.toLowerCase().includes(cleanInput) || cleanInput.includes(l.name.toLowerCase())) return true;
        return false;
      });
      const targetLab = matchedLab ? matchedLab.id : (selectedLabId || selectedVendorLabId || 'lab-apex');

      const result = login(
        targetRole,
        emailOrPhone.trim(),
        password.trim(),
        targetLab,
        selectedBranchId,
        pinCode.trim()
      );

      setIsSubmitting(false);

      if (result.success) {
        onClose();
        onNavigateView(result.targetView);
      } else {
        setLoginError(result.error || 'Authentication failed. Please check credentials.');
      }
    }, 150);
  };

  // Handle Main Website Login (SuperAdmin, Admin labowner)
  const handleMainWebsiteLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!emailOrPhone.trim()) {
      setLoginError(
        mainRole === 'super_admin'
          ? 'Please enter Super Admin Master Email ID.'
          : 'Please enter registered 10-digit Mobile Number or Email.'
      );
      return;
    }
    if (!password.trim()) {
      setLoginError('Please enter password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const cleanInput = emailOrPhone.trim().toLowerCase();
      const cleanDigits = cleanInput.replace(/\D/g, '');
      const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

      const isSuperAdminEmail =
        cleanInput === 'therkmehra331996@gmail.com' ||
        cleanInput === 'rkmehra331996@gmail.com' ||
        cleanInput === 'admin@indianlalaji.com' ||
        cleanInput === 'superadmin@indianlalaji.com' ||
        cleanInput === 'admin' ||
        cleanInput === 'superadmin' ||
        cleanInput === 'super_admin' ||
        cleanInput === 'super-admin' ||
        cleanInput === 'super admin' ||
        cleanInput === 'therkmehra331996' ||
        cleanInput === 'rkmehra331996' ||
        cleanInput === 'mehra' ||
        cleanInput.includes('rkmehra') ||
        cleanInput === 'admin@gmail.com' ||
        cleanInput === 'superadmin@gmail.com' ||
        cleanInput === 'root';

      // If user selected SuperAdmin role card, or entered Super Admin master identifier, strictly use 'admin'
      let targetRole: 'admin' | 'vendor' = mainRole === 'super_admin' ? 'admin' : 'vendor';
      if (mainRole === 'super_admin' || isSuperAdminEmail) {
        targetRole = 'admin';
      } else if (cleanDigits.length >= 7 || !cleanInput.includes('@')) {
        targetRole = 'vendor';
      }
      
      // Auto-resolve laboratory based on owner credentials
      const matchedLab = vendorLabsList.find((l) => {
        const lDigits = (l.phone || '').replace(/\D/g, '');
        const lLast10 = lDigits.length >= 10 ? lDigits.slice(-10) : lDigits;
        if (cleanDigits.length >= 7 && (lLast10 === last10 || lDigits.endsWith(cleanDigits) || cleanDigits.endsWith(lDigits))) {
          return true;
        }
        if (l.email && l.email.toLowerCase().trim() === cleanInput) return true;
        if (l.id.toLowerCase() === cleanInput || l.id.toLowerCase().replace('lab-', '') === cleanInput.replace('lab-', '')) return true;
        if (l.domainPreview && l.domainPreview.toLowerCase().split('.')[0] === cleanInput) return true;
        if (l.name.toLowerCase().includes(cleanInput) || cleanInput.includes(l.name.toLowerCase())) return true;
        return false;
      });

      const targetLab = targetRole === 'admin' ? 'all' : (matchedLab ? matchedLab.id : selectedLabId || selectedVendorLabId || 'lab-apex');

      const result = login(
        targetRole,
        emailOrPhone.trim(),
        password.trim(),
        targetLab,
        selectedBranchId,
        pinCode.trim()
      );

      setIsSubmitting(false);

      if (result.success) {
        onClose();
        onNavigateView(result.targetView);
      } else {
        setLoginError(result.error || 'Authentication failed. Please check credentials.');
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-[#123B6D] text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shrink-0">
              {effectiveIsVendor ? (
                <Building className="w-5 h-5 text-slate-950" />
              ) : activeTab === 'register' ? (
                <Building2 className="w-5 h-5 text-slate-950" />
              ) : (
                <Crown className="w-5 h-5 text-slate-950" />
              )}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight leading-tight text-white flex items-center gap-2">
                {effectiveIsVendor ? (
                  <>
                    <span>Lab Portal Login</span>
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      {activeLabDisplayName.slice(0, 20)}...
                    </span>
                  </>
                ) : activeTab === 'register' ? (
                  <>
                    <span>Create Laboratory</span>
                    <span className="text-[11px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                      New Registration
                    </span>
                  </>
                ) : (
                  <>
                    <span>INDIANLALAJI.COM</span>
                    <span className="text-[11px] bg-teal-500/40 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      Central Login
                    </span>
                  </>
                )}
              </h3>
              <p className="text-[11px] text-slate-300">
                {effectiveIsVendor
                  ? 'Role-based access: Lab Admin • Receptionist • Technician'
                  : activeTab === 'register'
                  ? 'Provision diagnostic laboratory, owner credentials & WhatsApp report sync'
                  : 'Main Platform: SuperAdmin (Full Access) & Admin Lab Owner (Assigned)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs (Only shown on Main Website or when switching to Super Admin) */}
        {!effectiveIsVendor && (
          <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setCreatedLabData(null);
                setLoginError('');
              }}
              className={`flex-1 py-3 px-4 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'border-[#123B6D] text-[#123B6D] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>Portal Login (लॉगिन)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setCreateError('');
              }}
              className={`flex-1 py-3 px-4 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'border-[#123B6D] text-[#123B6D] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Create Laboratory (नई लैब बनाएं)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">
                FREE
              </span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {/* ========================================================================= */}
          {/* SECTION 1: LAB WEBSITE LOGIN (isVendorContext === true)                     */}
          {/* Architecture:                                                              */}
          {/*   LAB WEBSITE                                                             */}
          {/*        │                                                                   */}
          {/*      Login                                                                */}
          {/*        │                                                                   */}
          {/*   ┌────┴────────────┐                                                     */}
          {/*   │                 │                                                     */}
          {/* Lab Admin       Receptionist                                                */}
          {/*   │                 │                                                     */}
          {/*   │             Technician                                                */}
          {/*   │                                                                       */}
          {/*   ▼                                                                       */}
          {/* Role-based Dashboard                                                       */}
          {/* ========================================================================= */}
          {effectiveIsVendor && (
            <div className="space-y-4">
              {/* Architecture Breadcrumb Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#123B6D] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#123B6D]" />
                    <span>LAB WEBSITE: {activeLabDisplayName}</span>
                  </span>
                  <span className="text-[10px] bg-[#123B6D] text-white px-2 py-0.5 rounded font-bold">
                    Role-Based Access
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <span>Lab Website</span>
                  <span>➔</span>
                  <span className="font-bold text-slate-800">Login</span>
                  <span>➔</span>
                  <span className="text-[#123B6D] font-bold">
                    {labRole === 'vendor'
                      ? 'Lab Admin'
                      : labRole === 'reception'
                      ? 'Receptionist'
                      : 'Technician'}
                  </span>
                  <span>➔</span>
                  <span className="text-emerald-700 font-black">
                    {labRole === 'vendor'
                      ? 'Lab Admin Dashboard'
                      : labRole === 'reception'
                      ? 'Reception Dashboard'
                      : 'Technician Dashboard'}
                  </span>
                </div>
              </div>

              {/* 3 Role Selection Cards: Lab Admin, Receptionist, Technician */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-2">
                  Select Your Assigned Laboratory Role:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Role 1: Lab Admin */}
                  <button
                    type="button"
                    onClick={() => {
                      setLabRole('vendor');
                      setLoginError('');
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      labRole === 'vendor'
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                        <Building className="w-4 h-4 text-amber-700" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                        Owner
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 mt-1">Lab Admin</div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      Full center control, pricing, staff & P&L
                    </div>
                  </button>

                  {/* Role 2: Receptionist */}
                  <button
                    type="button"
                    onClick={() => {
                      setLabRole('reception');
                      setLoginError('');
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      labRole === 'reception'
                        ? 'border-teal-500 bg-teal-50/70 shadow-xs ring-1 ring-teal-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-900 flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-teal-700" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-teal-200/80 text-teal-900">
                        Billing
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 mt-1">Receptionist</div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      Front desk counter, patient UHID & receipts
                    </div>
                  </button>

                  {/* Role 3: Technician */}
                  <button
                    type="button"
                    onClick={() => {
                      setLabRole('technician');
                      setLoginError('');
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      labRole === 'technician'
                        ? 'border-purple-500 bg-purple-50/70 shadow-xs ring-1 ring-purple-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center">
                        <FlaskConical className="w-4 h-4 text-purple-700" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-200/80 text-purple-900">
                        Testing
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 mt-1">Lab Technician</div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      Analyzer entry, specimens & test findings
                    </div>
                  </button>
                </div>
              </div>

              {/* Login Form for Selected Lab Role */}
              <form onSubmit={handleLabWebsiteLogin} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {labRole === 'vendor'
                      ? 'Lab Owner Mobile Number (10 Digits) or Email *'
                      : labRole === 'reception'
                      ? 'Receptionist Staff ID / Mobile / Username *'
                      : 'Technician Staff ID / Mobile / Username *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder={
                        labRole === 'vendor'
                          ? 'e.g. 7087033009 or owner email'
                          : labRole === 'reception'
                          ? 'e.g. reception.apex or staff mobile'
                          : 'e.g. tech.apex or staff mobile'
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 6-Digit PIN (Only for Lab Admin / Owner - Optional) */}
                {labRole === 'vendor' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#123B6D]" />
                        <span>6-Digit Security PIN (Default: 123456)</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Optional</span>
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6 numeric digits (default: 123456)"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-mono tracking-widest placeholder:text-slate-400"
                    />
                  </div>
                )}

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#123B6D] hover:bg-[#0e2c52] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>
                    {isSubmitting
                      ? 'Verifying Credentials...'
                      : `Sign In to ${
                          labRole === 'vendor'
                            ? 'Lab Admin'
                            : labRole === 'reception'
                            ? 'Reception'
                            : 'Technician'
                        } Dashboard`}
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: MAIN INDIAN LALAJI WEBSITE LOGIN                              */}
          {/* Architecture:                                                              */}
          {/*   Main indian lalaji website                                              */}
          {/*            │                                                               */}
          {/*         LOGIN                                                              */}
          {/*           │                                                               */}
          {/*      ┌────┴────┐                                                          */}
          {/*      │         │                                                          */}
          {/*   SuperAdmin  Admin(labowner)                                             */}
          {/*      │         │                                                          */}
          {/*      ▼         ▼                                                          */}
          {/*    Full      Assigned                                                     */}
          {/*    Access    Permissions                                                  */}
          {/* ========================================================================= */}
          {!effectiveIsVendor && activeTab === 'login' && (
            <div className="space-y-4">
              {/* Architecture Diagram Visualization */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#123B6D] flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>MAIN INDIAN LALAJI WEBSITE (indianlalaji.com)</span>
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-800 font-mono px-2 py-0.5 rounded font-bold">
                    LOGIN PORTAL
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono">
                  <span>Main Portal</span>
                  <span>➔</span>
                  <span className="font-bold text-slate-800">LOGIN</span>
                  <span>➔</span>
                  <span className="text-rose-700 font-bold">
                    {mainRole === 'super_admin' ? 'SuperAdmin (Full Access)' : 'Admin(labowner) (Assigned)'}
                  </span>
                </div>
              </div>

              {/* 2 Role Selection Cards: SuperAdmin vs Admin(labowner) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-2">
                  Select Administrative Role:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card 1: SuperAdmin (Full Access) */}
                  <button
                    type="button"
                    onClick={() => {
                      setMainRole('super_admin');
                      setLoginError('');
                      setEmailOrPhone('');
                      setPassword('');
                      setPinCode('');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 cursor-pointer ${
                      mainRole === 'super_admin'
                        ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-1 ring-rose-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-rose-700" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                        Full Access
                      </span>
                    </div>
                    <div>
                      <div className="font-black text-xs text-slate-900">SuperAdmin</div>
                      <div className="text-[10px] text-rose-700 font-bold">Master Platform Admin</div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Global access to all diagnostic laboratories, Hostinger MySQL DB, licensing & master directory.
                    </p>
                  </button>

                  {/* Card 2: Admin(labowner) (Assigned Permissions) */}
                  <button
                    type="button"
                    onClick={() => {
                      setMainRole('vendor_owner');
                      setLoginError('');
                      setEmailOrPhone('');
                      setPassword('');
                      setPinCode('');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 cursor-pointer ${
                      mainRole === 'vendor_owner'
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                        <Building className="w-4 h-4 text-amber-700" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                        Assigned Permissions
                      </span>
                    </div>
                    <div>
                      <div className="font-black text-xs text-slate-900">Admin (labowner)</div>
                      <div className="text-[10px] text-amber-700 font-bold">Laboratory Center Owner</div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Assigned access to your specific laboratory: test master, staff credentials, accounts & reports.
                    </p>
                  </button>
                </div>
              </div>

              {/* Login Form for SuperAdmin / Admin (labowner) */}
              <form onSubmit={handleMainWebsiteLogin} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {mainRole === 'super_admin'
                      ? 'Super Admin Master Email ID *'
                      : 'Registered Lab Owner Mobile Number (10 Digits) or Email *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder={
                        mainRole === 'super_admin'
                          ? 'Super admin email address'
                          : '10-digit mobile number or owner email'
                      }
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="off"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mainRole === 'super_admin' ? 'Enter Super Admin password' : 'Enter password'}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-[#123B6D]" />
                      <span>6-Digit Security PIN (Default: 123456)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Optional
                    </span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    autoComplete="off"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit security PIN (default: 123456)"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-mono tracking-widest placeholder:text-slate-400"
                  />
                </div>

                {mainRole === 'super_admin' && (
                  <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-[11px] text-slate-700 flex items-center justify-between">
                    <div className="truncate">
                      <span className="font-bold text-rose-900">Master Admin: </span>
                      <span className="font-mono text-slate-800">therkmehra331996@gmail.com</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailOrPhone('therkmehra331996@gmail.com');
                        setPassword('Asdfzxcv@336699');
                        setPinCode('331996');
                        setLoginError('');
                      }}
                      className="text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer shrink-0 ml-2"
                    >
                      Fill 1-Click
                    </button>
                  </div>
                )}

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#123B6D] hover:bg-[#0e2c52] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>
                    {isSubmitting
                      ? 'Verifying Credentials...'
                      : mainRole === 'super_admin'
                      ? 'Sign In as SuperAdmin (Full Access)'
                      : 'Sign In as Admin (labowner)'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: CREATE LABORATORY                                             */}
          {/* Exact User Specification:                                                 */}
          {/*                                                                           */}
          {/*   Create Laboratory                                                       */}
          {/*   Details                                                                 */}
          {/*   Lab Name*                                                               */}
          {/*   State*                                                                  */}
          {/*                                                                           */}
          {/*   Owner & Login                                                           */}
          {/*   Mobile Number* — 10 digits                                              */}
          {/*                                                                           */}
          {/*   Password* — 5 characters + 5 numbers                                    */}
          {/*                                                                           */}
          {/*   6-Digit PIN*                                                            */}
          {/*                                                                           */}
          {/*   Action                                                                  */}
          {/*   [ Create Lab ]                                                          */}
          {/*   [ 📲 Share Credentials on WhatsApp ]                                    */}
          {/* ========================================================================= */}
          {!effectiveIsVendor && activeTab === 'register' && (
            <div>
              {/* If newly created, show dedicated confirmation card */}
              {createdLabData ? (
                <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-emerald-950 text-base">
                          Laboratory Created Successfully! (लैब सफलतापूर्वक बन गई)
                        </h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-amber-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-950" />
                          <span>Status: Draft (ड्राफ्ट मोड)</span>
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 mt-1">
                        Your laboratory has been registered and placed in <strong>Draft Status (ड्राफ्ट मोड)</strong>. It will be officially published and live after Super Admin approval.
                      </p>
                    </div>
                  </div>

                  {/* Draft Workflow Notification Banner */}
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
                    <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-amber-900" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                        <span>Workflow: Pehle Draft → Uske Baad Admin Approval → Phir Website Publish</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        Nayi banayi gayi lab abhi <strong>Draft Mode</strong> me hai. Super Admin ke approve aur publish karne ke baad website live hogi aur patients ke liye booking open hogi.
                      </p>
                    </div>
                  </div>

                  {/* Summary Credentials Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                        Laboratory Summary & Credentials
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const text = `Lab: ${createdLabData.labName}\nStatus: Draft (Pending Admin Approval)\nState: ${createdLabData.state}\nMobile: ${createdLabData.phone}\nPassword: ${createdLabData.password}\nPIN: ${createdLabData.pin}\nWebsite: ${createdLabData.domainUrl}`;
                          navigator.clipboard?.writeText(text);
                          setCopiedSummary(true);
                          setTimeout(() => setCopiedSummary(false), 2000);
                        }}
                        className="text-[11px] text-[#123B6D] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Lab Name</span>
                        <strong className="text-[#123B6D] text-sm">{createdLabData.labName}</strong>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Lifecycle Status</span>
                        <strong className="text-amber-800 text-sm flex items-center gap-1 font-black">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Draft (Pending Admin Approval)</span>
                        </strong>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Mobile Number (Login ID)</span>
                        <strong className="text-slate-900 font-mono text-sm">+91 {createdLabData.phone}</strong>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Password (5 Chars + 5 Nums)</span>
                        <strong className="text-purple-700 font-mono text-sm">{createdLabData.password}</strong>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">6-Digit PIN</span>
                        <strong className="text-indigo-700 font-mono text-sm">{createdLabData.pin}</strong>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Assigned Role</span>
                        <strong className="text-emerald-700 text-sm">Admin (labowner)</strong>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Package Selection</span>
                        <strong className="text-[#123B6D] text-sm flex items-center gap-1.5">
                          <span>{createdLabData.subscriptionPlan || '3 Months'}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#123B6D] border border-blue-200">
                            100% Features Active
                          </span>
                        </strong>
                      </div>
                    </div>

                    {/* Dedicated Lab Website Link & Draft Notice */}
                    <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold text-amber-950 uppercase block">Dedicated Lab Website</span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                            Draft Mode
                          </span>
                        </div>
                        <span className="text-xs text-[#123B6D] font-bold truncate block">{createdLabData.domainUrl}</span>
                        <span className="text-[10px] text-amber-900/80 block mt-0.5">
                          Website draft locked. Admin approval ke baad live publish hoga.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          selectVendorLab(createdLabData.labId);
                          onNavigateView('vendor_website');
                        }}
                        className="px-3 py-1.5 bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
                        title="Preview Draft Website Notice Screen"
                      >
                        <Globe className="w-3.5 h-3.5 text-amber-300" />
                        <span>Preview Draft</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions for Created Lab */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Primary Action 1: Share on WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(createdLabData)}
                      className="w-full bg-[#25D366] hover:bg-[#20be5b] text-white py-3 px-4 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                    >
                      <MessageSquare className="w-4 h-4 fill-white" />
                      <span>📲 Share Credentials on WhatsApp</span>
                    </button>

                    {/* Primary Action 2: Login to Admin Dashboard */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        selectVendorLab(createdLabData.labId);
                        onNavigateView('vendor_dashboard');
                      }}
                      className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-3 px-4 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                    >
                      <span>🚀 Open Lab Admin Dashboard</span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedLabData(null);
                        setCreateLabName('');
                        setCreateMobile('');
                        setCreatePassword('');
                        setCreatePin('');
                        setCreatePackage(selectedRegistrationPackage || '3 Months');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold hover:underline cursor-pointer"
                    >
                      + Create Another Laboratory (दूसरी लैब बनाएं)
                    </button>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleCreateLabSubmit} className="space-y-4">
                  {/* Title Header */}
                  <div className="border-b border-slate-200 pb-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-[#123B6D]">Create Laboratory</h4>
                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-amber-700" />
                        <span>Saves to Draft Mode</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter laboratory information and owner credentials. Lab pehle <strong>Draft</strong> me jayegi, uske baad <strong>Admin Approval</strong> ke baad website publish hogi.
                    </p>
                  </div>

                  {/* GROUP 1: Details */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#123B6D]" />
                      <span>Details</span>
                    </div>

                    <div className="space-y-3">
                      {/* Lab Name* */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Lab Name <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={createLabName}
                          onChange={(e) => setCreateLabName(e.target.value)}
                          placeholder="e.g. Apex Diagnostic & Clinical Pathology Laboratory"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-semibold text-slate-900 placeholder:text-slate-400"
                        />
                      </div>

                      {/* State* */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          State <span className="text-rose-600">*</span>
                        </label>
                        <select
                          required
                          value={createState}
                          onChange={(e) => setCreateState(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-bold text-slate-800"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 2: Package Selection (3 package options: 1 Month, 3 Months, 1 Year) */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Package Selection <span className="text-rose-600">*</span></span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                        100% Features Included
                      </span>
                    </div>

                    {/* 3 Interactive Package Option Cards (Radio Button Tabs) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {REGISTRATION_PACKAGES.map((pkg) => {
                        const isSelected = createPackage === pkg.name;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => {
                              setCreatePackage(pkg.name);
                              setSelectedRegistrationPackage(pkg.name);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                              isSelected
                                ? 'border-[#123B6D] bg-white ring-2 ring-[#123B6D]/20 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            {pkg.badge && (
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md absolute top-2 right-2 border ${pkg.badgeColor}`}>
                                {pkg.badge}
                              </span>
                            )}
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#123B6D] bg-[#123B6D]' : 'border-slate-300'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="font-extrabold text-xs text-slate-900">{pkg.name}</span>
                            </div>
                            <div className="text-base font-black text-[#123B6D] mt-1">
                              ₹{pkg.priceINR.toLocaleString('en-IN')}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                              {pkg.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* GROUP 3: Owner & Login */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#123B6D]" />
                      <span>Owner & Login</span>
                    </div>

                    <div className="space-y-3">
                      {/* Mobile Number* — 10 digits */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>
                            Mobile Number <span className="text-rose-600">*</span> — 10 digits
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              createMobile.replace(/\D/g, '').length === 10
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {createMobile.replace(/\D/g, '').length}/10 Digits
                          </span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                            +91
                          </span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={createMobile}
                            onChange={(e) => setCreateMobile(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 10-digit mobile number"
                            className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-mono font-bold text-slate-900 placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      {/* Password* — 5 characters + 5 numbers */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <span>Password <span className="text-rose-600">*</span> — 5 characters + 5 numbers</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleGeneratePassword}
                            className="text-[10px] font-bold text-[#123B6D] hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                            title="Auto generate compliant password: 5 letters + 5 numbers"
                          >
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>⚡ Generate</span>
                          </button>
                        </div>

                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showCreatePassword ? 'text' : 'password'}
                            required
                            maxLength={10}
                            value={createPassword}
                            onChange={(e) => setCreatePassword(e.target.value)}
                            placeholder="e.g. LABAD12345"
                            className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-mono tracking-wider text-slate-900 placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCreatePassword(!showCreatePassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Live Validation Badges */}
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              lettersCount === 5
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {lettersCount === 5 ? '✓' : '•'} 5 Characters ({lettersCount}/5)
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              numbersCount === 5
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {numbersCount === 5 ? '✓' : '•'} 5 Numbers ({numbersCount}/5)
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              isPasswordValid
                                ? 'bg-emerald-200 text-emerald-900 font-extrabold'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            Total: 10 Chars
                          </span>
                        </div>
                      </div>

                      {/* 6-Digit PIN* */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <Hash className="w-3 h-3 text-[#123B6D]" />
                            <span>6-Digit PIN <span className="text-rose-600">*</span></span>
                          </label>
                          <button
                            type="button"
                            onClick={handleGeneratePin}
                            className="text-[10px] font-bold text-[#123B6D] hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                            title="Auto generate 6-digit PIN"
                          >
                            <RotateCw className="w-3 h-3 text-amber-500" />
                            <span>Auto PIN</span>
                          </button>
                        </div>

                        <input
                          type="password"
                          maxLength={6}
                          required
                          value={createPin}
                          onChange={(e) => setCreatePin(e.target.value.replace(/\D/g, ''))}
                          placeholder="6 numeric digits (e.g. 123456)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-mono tracking-widest text-slate-900 placeholder:text-slate-400"
                        />
                        <div className="text-[10px] text-slate-400 mt-1">
                          {createPin.length === 6 ? (
                            <span className="text-emerald-600 font-bold">✓ 6-Digit PIN ready</span>
                          ) : (
                            <span>Enter 6 digits for owner master authentication</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {createError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{createError}</span>
                    </div>
                  )}

                  {/* GROUP 3: Action Buttons */}
                  <div className="pt-1">
                    <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                      Action
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Action Button 1: [ Create Lab ] */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#123B6D] hover:bg-[#0e2c52] disabled:opacity-50 text-white py-3 px-4 rounded-xl text-xs font-black transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Building2 className="w-4 h-4 text-amber-300" />
                        <span>{isSubmitting ? 'Creating Lab in Draft...' : '[ Create Lab (Draft) ]'}</span>
                      </button>

                      {/* Action Button 2: [ 📲 Share Credentials on WhatsApp ] */}
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp()}
                        className="bg-[#25D366] hover:bg-[#20be5b] text-white py-3 px-4 rounded-xl text-xs font-black transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        title="Send formatted credentials directly to owner on WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4 fill-white" />
                        <span>[ 📲 Share Credentials on WhatsApp ]</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 text-center mt-2 font-medium">
                      Workflow: Create Lab ➔ Saves to Draft ➔ Admin Approval ➔ Live Publish
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
