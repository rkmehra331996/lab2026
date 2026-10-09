import React, { useState, useEffect } from 'react';
import {
  Settings,
  Image as ImageIcon,
  Type,
  FileText,
  CreditCard,
  QrCode,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  Save,
  Sparkles,
  ExternalLink,
  Copy,
  Download,
  ShieldCheck,
  Zap,
  Globe,
  RefreshCw,
  Search,
  Check,
  ArrowRight,
  Eye,
  Phone,
  PhoneCall,
  AlertTriangle,
  Send,
  Lock,
  Building2,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { VendorLabSettings } from '../../types';
import { optimizeImageFile } from '../../utils/imageOptimizer';

export type SiteSettingsSubSection =
  | 'logo'
  | 'name'
  | 'description'
  | 'feature'
  | 'payment_qr'
  | 'payment_settings'
  | 'plan'
  | 'social'
  | 'all';

export interface VendorSiteSettingsTabProps {
  activeSubTab?: SiteSettingsSubSection;
  onSubTabChange?: (tab: SiteSettingsSubSection) => void;
  initialSection?: SiteSettingsSubSection;
  onNavigateView?: (view: any) => void;
}

// Preset high quality medical lab icons / logos for quick selection
const SAMPLE_LAB_LOGOS = [
  {
    name: 'Clinical Cross & DNA',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Microscope & Science',
    url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Automated Diagnostic',
    url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=400&q=80',
  },
];

// Preset high quality feature images
const SAMPLE_FEATURE_IMAGES = [
  {
    name: 'Modern Pathology Automation Lab',
    url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Clinical Biochemistry & Diagnostics',
    url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Phlebotomy & Patient Healthcare',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
  },
];

export const VendorSiteSettingsTab: React.FC<VendorSiteSettingsTabProps> = ({
  activeSubTab,
  onSubTabChange,
  initialSection = 'logo',
  onNavigateView,
}) => {
  const {
    vendorLabSettings,
    updateVendorLabSettings,
    pricingPlans,
    activeTenantId,
    vendorLabsList,
    submitPlanRenewalRequest,
    planRequests,
    expireVendorPlan,
    renewOrExtendVendorPlan,
  } = useCms();

  const [selectedRenewPlan, setSelectedRenewPlan] = useState<'1 Month' | '3 Months' | '1 Year'>('3 Months');
  const [renewNotes, setRenewNotes] = useState('');
  const [renewSubmittedToast, setRenewSubmittedToast] = useState<string | null>(null);

  const [internalSection, setInternalSection] = useState<SiteSettingsSubSection>(
    activeSubTab || initialSection || 'logo'
  );

  const activeSection = activeSubTab || internalSection;

  useEffect(() => {
    if (activeSubTab) {
      setInternalSection(activeSubTab);
    }
  }, [activeSubTab]);

  const handleSelectSection = (section: SiteSettingsSubSection) => {
    setInternalSection(section);
    if (onSubTabChange) {
      onSubTabChange(section);
    }
  };

  // Form State
  const [formData, setFormData] = useState<Partial<VendorLabSettings>>({
    logoUrl: vendorLabSettings.logoUrl || '',
    labName: vendorLabSettings.labName || '',
    tagline: vendorLabSettings.tagline || '',
    siteDescription:
      vendorLabSettings.siteDescription ||
      vendorLabSettings.description ||
      'Advanced Pathology, Biochemistry & Diagnostic Testing Centre. 100% NABL Accredited & Certified. Instant digital WhatsApp PDF reports & doorstep sample collection.',
    description:
      vendorLabSettings.description ||
      'Advanced Pathology, Biochemistry & Diagnostic Testing Centre. 100% NABL Accredited & Certified. Instant digital WhatsApp PDF reports & doorstep sample collection.',
    featureImageUrl:
      vendorLabSettings.featureImageUrl ||
      vendorLabSettings.ogImageUrl ||
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
    ogImageUrl:
      vendorLabSettings.ogImageUrl ||
      vendorLabSettings.featureImageUrl ||
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
    qrCode1Url: vendorLabSettings.qrCode1Url || '',
    upiId1: vendorLabSettings.upiId1 || 'apexlab@icici',
    merchantName: vendorLabSettings.merchantName || 'Apex Diagnostic Lab Pvt Ltd',
    qrCode2Url: vendorLabSettings.qrCode2Url || '',
    upiId2: vendorLabSettings.upiId2 || 'apexdiag@oksbi',
    // Payment Method Settings (Mutual Exclusion: Manual UPI vs PhonePe)
    activeOnlinePaymentMethod: vendorLabSettings.activeOnlinePaymentMethod || 'manual_upi',
    isPayOnSpotEnabled: vendorLabSettings.isPayOnSpotEnabled !== false,
    isCustomDomainActive: Boolean(
      vendorLabSettings.isCustomDomainActive ||
      (vendorLabSettings.websiteDomain && !vendorLabSettings.websiteDomain.includes('indianlalaji.com'))
    ),
    phonepeMerchantId: vendorLabSettings.phonepeMerchantId || 'M22PGTESTMID01',
    phonepeSaltKey: vendorLabSettings.phonepeSaltKey || 'd248b813-0975-47e2-8877-6d6f254e0b52',
    phonepeSaltIndex: vendorLabSettings.phonepeSaltIndex || '1',
    phonepeEnvironment: vendorLabSettings.phonepeEnvironment || 'SANDBOX',
    phonepeAutoVerify: vendorLabSettings.phonepeAutoVerify !== false,
    purchasedPlan: vendorLabSettings.purchasedPlan || '1 Month',
    planDurationDays: vendorLabSettings.planDurationDays || 30,
    remainingVisibilityDays: vendorLabSettings.remainingVisibilityDays ?? 24,
    planPurchasedAt: vendorLabSettings.planPurchasedAt || '2026-02-15',
    planExpiresAt: vendorLabSettings.planExpiresAt || '2026-03-17',
    socialMedia: vendorLabSettings.socialMedia || {
      enabled: true,
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      linkedin: '',
      whatsapp: '',
    },
  });

  const [toastMessage, setToastMessage] = useState('Site settings saved successfully!');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedMid, setCopiedMid] = useState(false);
  const [showPhonepeSecret, setShowPhonepeSecret] = useState(false);
  const [isCustomLogoUrlOpen, setIsCustomLogoUrlOpen] = useState(false);
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState('');
  const [isCustomFeatureUrlOpen, setIsCustomFeatureUrlOpen] = useState(false);
  const [customFeatureUrlInput, setCustomFeatureUrlInput] = useState('');

  // Keep synced if vendorLabSettings changes externally (only when lab ID changes or on initial load)
  const currentLoadedLabIdRef = React.useRef(vendorLabSettings.labId || '');
  useEffect(() => {
    if (vendorLabSettings.labId && vendorLabSettings.labId !== currentLoadedLabIdRef.current) {
      currentLoadedLabIdRef.current = vendorLabSettings.labId;
      setFormData({
        logoUrl: vendorLabSettings.logoUrl || '',
        labName: vendorLabSettings.labName || '',
        tagline: vendorLabSettings.tagline || '',
        siteDescription:
          vendorLabSettings.siteDescription ||
          vendorLabSettings.description ||
          '',
        description: vendorLabSettings.description || '',
        featureImageUrl:
          vendorLabSettings.featureImageUrl ||
          vendorLabSettings.ogImageUrl ||
          '',
        ogImageUrl:
          vendorLabSettings.ogImageUrl ||
          vendorLabSettings.featureImageUrl ||
          '',
        qrCode1Url: vendorLabSettings.qrCode1Url || '',
        upiId1: vendorLabSettings.upiId1 || 'apexlab@icici',
        merchantName: vendorLabSettings.merchantName || 'Apex Diagnostic Lab Pvt Ltd',
        qrCode2Url: vendorLabSettings.qrCode2Url || '',
        upiId2: vendorLabSettings.upiId2 || 'apexdiag@oksbi',
        activeOnlinePaymentMethod: vendorLabSettings.activeOnlinePaymentMethod || 'manual_upi',
        isPayOnSpotEnabled: vendorLabSettings.isPayOnSpotEnabled !== false,
        isCustomDomainActive: Boolean(
          vendorLabSettings.isCustomDomainActive ||
          (vendorLabSettings.websiteDomain && !vendorLabSettings.websiteDomain.includes('indianlalaji.com'))
        ),
        phonepeMerchantId: vendorLabSettings.phonepeMerchantId || 'M22PGTESTMID01',
        phonepeSaltKey: vendorLabSettings.phonepeSaltKey || 'd248b813-0975-47e2-8877-6d6f254e0b52',
        phonepeSaltIndex: vendorLabSettings.phonepeSaltIndex || '1',
        phonepeEnvironment: vendorLabSettings.phonepeEnvironment || 'SANDBOX',
        phonepeAutoVerify: vendorLabSettings.phonepeAutoVerify !== false,
        purchasedPlan: vendorLabSettings.purchasedPlan || '1 Month',
        planDurationDays: vendorLabSettings.planDurationDays || 30,
        remainingVisibilityDays: vendorLabSettings.remainingVisibilityDays ?? 24,
        planPurchasedAt: vendorLabSettings.planPurchasedAt || '2026-02-15',
        planExpiresAt: vendorLabSettings.planExpiresAt || '2026-03-17',
        socialMedia: vendorLabSettings.socialMedia || {
          enabled: true,
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: '',
          linkedin: '',
          whatsapp: '',
        },
      });
    }
  }, [vendorLabSettings.labId]);

  // Also keep formData images synced if cloud resolves them
  useEffect(() => {
    if (vendorLabSettings.logoUrl && !formData.logoUrl) {
      setFormData((prev) => ({ ...prev, logoUrl: vendorLabSettings.logoUrl || '' }));
    }
    if (vendorLabSettings.featureImageUrl && !formData.featureImageUrl) {
      setFormData((prev) => ({
        ...prev,
        featureImageUrl: vendorLabSettings.featureImageUrl || '',
        ogImageUrl: vendorLabSettings.ogImageUrl || vendorLabSettings.featureImageUrl || '',
      }));
    }
  }, [vendorLabSettings.logoUrl, vendorLabSettings.featureImageUrl]);

  // Handle Local Logo Upload with instant optimization & auto-save
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
        if (optimized) {
          setFormData((prev) => ({ ...prev, logoUrl: optimized }));
          updateVendorLabSettings({ logoUrl: optimized });
          setToastMessage('Laboratory logo uploaded and saved successfully!');
          setIsSavedToast(true);
          setTimeout(() => setIsSavedToast(false), 3000);
        }
      } catch (err) {
        console.error('Error optimizing logo image:', err);
      }
    }
    if (e.target) e.target.value = '';
  };

  // Handle Feature Image Upload with instant optimization & auto-save
  const handleFeatureImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImageFile(file, { maxWidth: 1200, maxHeight: 800, quality: 0.82 });
        if (optimized) {
          setFormData((prev) => ({
            ...prev,
            featureImageUrl: optimized,
            ogImageUrl: optimized,
          }));
          updateVendorLabSettings({
            featureImageUrl: optimized,
            ogImageUrl: optimized,
          });
          setToastMessage('Feature banner image uploaded and saved successfully!');
          setIsSavedToast(true);
          setTimeout(() => setIsSavedToast(false), 3000);
        }
      } catch (err) {
        console.error('Error optimizing feature banner:', err);
      }
    }
    if (e.target) e.target.value = '';
  };

  // Handle Payment QR Upload with instant optimization & auto-save
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>, qrSlot: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
        if (optimized) {
          if (qrSlot === 1) {
            setFormData((prev) => ({ ...prev, qrCode1Url: optimized }));
            updateVendorLabSettings({ qrCode1Url: optimized });
          } else {
            setFormData((prev) => ({ ...prev, qrCode2Url: optimized }));
            updateVendorLabSettings({ qrCode2Url: optimized });
          }
          setToastMessage(`Payment QR Code ${qrSlot} uploaded and saved successfully!`);
          setIsSavedToast(true);
          setTimeout(() => setIsSavedToast(false), 3000);
        }
      } catch (err) {
        console.error('Error optimizing QR image:', err);
      }
    }
    if (e.target) e.target.value = '';
  };

  // Delete Confirmation state for removing logo and feature image
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleRemoveLogo = () => {
    setDeleteConfirm({
      isOpen: true,
      message: 'Are you sure you want to delete this? The laboratory logo will be removed from your website, database, and server storage.',
      onConfirm: () => {
        setFormData((prev) => ({ ...prev, logoUrl: '' }));
        updateVendorLabSettings({ logoUrl: '' });
        setDeleteConfirm(null);
        setToastMessage('Logo deleted from server & database!');
        setIsSavedToast(true);
        setTimeout(() => setIsSavedToast(false), 3000);
      },
    });
  };

  const handleRemoveFeatureImage = () => {
    setDeleteConfirm({
      isOpen: true,
      message: 'Are you sure you want to delete this? The feature banner image will be removed from database and server storage.',
      onConfirm: () => {
        setFormData((prev) => ({ ...prev, featureImageUrl: '', ogImageUrl: '' }));
        updateVendorLabSettings({ featureImageUrl: '', ogImageUrl: '' });
        setDeleteConfirm(null);
        setToastMessage('Feature banner deleted from server & database!');
        setIsSavedToast(true);
        setTimeout(() => setIsSavedToast(false), 3000);
      },
    });
  };

  // Save Settings
  const handleSave = (customMsg?: string) => {
    const { socialMedia: _omitted, ...cleanFormData } = (formData || {}) as any;
    updateVendorLabSettings({
      ...cleanFormData,
      name: formData.labName,
      description: formData.siteDescription || formData.description,
      ogImageUrl: formData.featureImageUrl || formData.ogImageUrl,
    });
    setToastMessage(customMsg || 'Site settings updated successfully!');
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  // Calculate or Switch Purchased Plan
  const handleSelectPlan = (planType: '1 Month' | '3 Months' | '1 Year') => {
    let duration = 30;
    let remaining = 24;
    let expires = new Date();

    if (planType === '1 Month') {
      duration = 30;
      remaining = 24;
      expires.setDate(expires.getDate() + remaining);
    } else if (planType === '3 Months') {
      duration = 90;
      remaining = 78;
      expires.setDate(expires.getDate() + remaining);
    } else if (planType === '1 Year') {
      duration = 365;
      remaining = 312;
      expires.setDate(expires.getDate() + remaining);
    }

    const updated = {
      purchasedPlan: planType,
      planDurationDays: duration,
      remainingVisibilityDays: remaining,
      planPurchasedAt: new Date().toISOString().split('T')[0],
      planExpiresAt: expires.toISOString().split('T')[0],
    };

    setFormData((prev) => ({ ...prev, ...updated }));
    updateVendorLabSettings(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  // Add / Extend Remaining Days
  const handleAddDays = (extraDays: number) => {
    const newRemaining = (formData.remainingVisibilityDays || 0) + extraDays;
    const expires = new Date();
    expires.setDate(expires.getDate() + newRemaining);

    const updated = {
      remainingVisibilityDays: newRemaining,
      planExpiresAt: expires.toISOString().split('T')[0],
    };

    setFormData((prev) => ({ ...prev, ...updated }));
    updateVendorLabSettings(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  // Current Lab & Expiry Status
  const currentLabId = activeTenantId || vendorLabSettings.labId || 'lab-apex';
  const currentLabItem = vendorLabsList.find((l) => l.id === currentLabId);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  let isExpiredByDate = false;
  if (formData.planExpiresAt) {
    const parts = formData.planExpiresAt.split('-');
    if (parts.length === 3) {
      const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      expDate.setHours(23, 59, 59, 999);
      if (expDate.getTime() < todayDate.getTime()) {
        isExpiredByDate = true;
      }
    }
  }

  const remainingDays = isExpiredByDate
    ? 0
    : Math.max(0, formData.remainingVisibilityDays ?? 0);
  const isPlanExpired =
    remainingDays <= 0 ||
    isExpiredByDate ||
    (currentLabItem?.status === 'Draft' && Boolean(currentLabItem?.planStatusReason?.includes('Expired')));

  const planStatus: 'Active' | 'Expired' = isPlanExpired ? 'Expired' : 'Active';

  // Active Plan details lookup
  const currentPlan = formData.purchasedPlan || '1 Month';
  const totalDays =
    formData.planDurationDays ||
    (currentPlan === '1 Year' ? 365 : currentPlan === '3 Months' ? 90 : 30);
  const percentageRemaining = Math.min(100, Math.max(0, Math.round((remainingDays / totalDays) * 100)));

  // Pricing info lookup
  const planPriceMap: Record<string, { price: number; cycle: string; badge: string; popular?: boolean }> = {
    '1 Month': { price: 1499, cycle: 'Per Month', badge: 'Flexible Starter' },
    '3 Months': { price: 3999, cycle: 'Per 3 Months', badge: 'Quarterly Choice', popular: true },
    '1 Year': { price: 11999, cycle: 'Per Year', badge: 'Annual Value Pack' },
  };

  const planInfo = planPriceMap[currentPlan] || planPriceMap['1 Month'];

  // Handle Submit Renewal Request to Admin -> Plan Requests
  const handleSubmitPlanRenewal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const planDuration = selectedRenewPlan === '1 Year' ? 365 : selectedRenewPlan === '3 Months' ? 90 : 30;
    const planPrice = selectedRenewPlan === '1 Year' ? 11999 : selectedRenewPlan === '3 Months' ? 3999 : 1499;

    submitPlanRenewalRequest({
      labId: currentLabId,
      labName: formData.labName || vendorLabSettings.labName || 'Apex Diagnostic Center',
      phone: vendorLabSettings.phone || vendorLabSettings.helplinePhone || '7087033009',
      currentPlan: formData.purchasedPlan || '1 Month',
      currentExpiryDate: formData.planExpiresAt || '2026-10-15',
      requestedPlan: selectedRenewPlan,
      requestedDurationDays: planDuration,
      amountINR: planPrice,
      paymentMode: 'UPI Gateway / Scan & Pay',
      notes: renewNotes ? renewNotes.trim() : `Renewal request for ${selectedRenewPlan}. Remaining days to be preserved.`,
    });

    setRenewSubmittedToast(`✅ Plan request for "${selectedRenewPlan}" submitted to Admin! Our Super Admin team will verify and activate your plan. For immediate activation, contact 70870 33009.`);
    setTimeout(() => setRenewSubmittedToast(null), 8000);
  };

  const [testDynamicAmount, setTestDynamicAmount] = useState<number>(500);

  // Generated QR placeholder with dynamic amount injection
  const effectiveQrCode1 =
    formData.qrCode1Url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
      `upi://pay?pa=${formData.upiId1 || 'apexlab@icici'}&pn=${formData.merchantName || formData.labName || 'Apex Diagnostic Lab'}&am=${testDynamicAmount}&cu=INR&tn=Lab Test Bill`
    )}`;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {isSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Pills & Quick Action Buttons */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {/* 1. Logo */}
          <button
            type="button"
            onClick={() => handleSelectSection('logo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
              activeSection === 'logo'
                ? 'bg-[#123B6D] text-white shadow-2xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className={`w-3.5 h-3.5 ${activeSection === 'logo' ? 'text-amber-400' : 'text-indigo-500'}`} />
            <span>1. Logo</span>
          </button>

          {/* 2. Site Name */}
          <button
            type="button"
            onClick={() => handleSelectSection('name')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
              activeSection === 'name'
                ? 'bg-[#123B6D] text-white shadow-2xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Type className={`w-3.5 h-3.5 ${activeSection === 'name' ? 'text-amber-400' : 'text-blue-500'}`} />
            <span>2. Site Name</span>
          </button>

          {/* 3. Site Description */}
          <button
            type="button"
            onClick={() => handleSelectSection('description')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
              activeSection === 'description'
                ? 'bg-[#123B6D] text-white shadow-2xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${activeSection === 'description' ? 'text-amber-400' : 'text-emerald-500'}`} />
            <span>3. Site Description</span>
          </button>

          {/* 4. Feature Image */}
          <button
            type="button"
            onClick={() => handleSelectSection('feature')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
              activeSection === 'feature'
                ? 'bg-[#123B6D] text-white shadow-2xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeSection === 'feature' ? 'text-amber-400' : 'text-amber-500'}`} />
            <span>4. Feature Image</span>
          </button>

          {/* 5. Payment Settings */}
          <button
            type="button"
            onClick={() => handleSelectSection('payment_settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
              activeSection === 'payment_qr' || activeSection === 'payment_settings'
                ? 'bg-[#123B6D] text-white shadow-2xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className={`w-3.5 h-3.5 ${activeSection === 'payment_qr' || activeSection === 'payment_settings' ? 'text-amber-400' : 'text-purple-600'}`} />
            <span>5. Payment Settings</span>
            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
              activeSection === 'payment_qr' || activeSection === 'payment_settings'
                ? 'bg-amber-400 text-slate-950'
                : formData.activeOnlinePaymentMethod === 'phonepe' && formData.isCustomDomainActive
                ? 'bg-purple-100 text-purple-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {formData.activeOnlinePaymentMethod === 'phonepe' && formData.isCustomDomainActive ? 'PhonePe' : 'Manual UPI'}
            </span>
          </button>

          {/* 6. Plan & Pricing */}
          <button
            type="button"
            onClick={() => handleSelectSection('plan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
              activeSection === 'plan'
                ? 'bg-[#123B6D] text-white shadow-2xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${activeSection === 'plan' ? 'text-amber-400 fill-amber-400' : 'text-amber-600 fill-amber-500'}`} />
            <span>6. Plan &amp; Pricing</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isPlanExpired
                ? 'bg-rose-600 text-white font-black animate-pulse'
                : activeSection === 'plan'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-amber-100 text-amber-900 font-extrabold'
            }`}>
              {isPlanExpired ? 'Expired' : `${remainingDays}d left`}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {onNavigateView && (
            <button
              type="button"
              onClick={() => onNavigateView('vendor_website')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>Preview Website</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. LOGO SECTION */}
      {/* ======================================================== */}
      {activeSection === 'logo' && (
        <div id="section-logo" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <ImageIcon className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">1. Official Diagnostic Lab Logo</h2>
                <p className="text-xs text-slate-500">
                  Visible in website top navigation, patient invoices, lab report letterheads, and mobile view.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Site Setting
              </span>
              <button
                type="button"
                onClick={() => handleSave('Official laboratory logo saved successfully!')}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Logo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Logo Live Preview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-3">
              <span className="text-[11px] font-bold text-slate-500 block">Live Logo Preview</span>
              <div className="w-28 h-28 mx-auto rounded-2xl bg-white border border-slate-200 shadow-2xs p-2 flex items-center justify-center overflow-hidden">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Lab Logo Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                    <span className="text-[10px] font-bold">No Logo Uploaded</span>
                  </div>
                )}
              </div>

              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Recommended: Square or horizontal PNG/SVG with transparent background (400×400px).
              </p>
            </div>

            {/* Logo Upload & URL Options */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Upload Logo File from Device
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#123B6D] hover:bg-slate-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-600 font-bold">
                      <span className="text-[#123B6D]">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG, WebP (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Direct URL Input */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Or Paste Image URL</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomLogoUrlOpen(!isCustomLogoUrlOpen)}
                    className="text-[11px] font-bold text-[#123B6D] hover:underline cursor-pointer"
                  >
                    {isCustomLogoUrlOpen ? 'Hide URL Box' : 'Enter URL Manually'}
                  </button>
                </div>
                {isCustomLogoUrlOpen && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={customLogoUrlInput}
                      onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customLogoUrlInput) {
                          setFormData((prev) => ({ ...prev, logoUrl: customLogoUrlInput }));
                          setCustomLogoUrlInput('');
                        }
                      }}
                      className="px-3 py-2 bg-[#123B6D] text-white rounded-xl text-xs font-bold hover:bg-[#0e2c52] cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Sample Logos */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Or select a sample diagnostic insignia:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {SAMPLE_LAB_LOGOS.map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: sample.url }))}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-[#123B6D] hover:bg-slate-50 flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <img
                        src={sample.url}
                        alt={sample.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded object-cover"
                      />
                      <span>{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-slate-500">
              Logo appears on website navigation, invoice receipts, and printable WhatsApp PDF reports.
            </span>
            <button
              type="button"
              onClick={() => handleSave('Official laboratory logo saved successfully!')}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Logo</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SITE NAME SECTION */}
      {/* ======================================================== */}
      {activeSection === 'name' && (
        <div id="section-name" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Type className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">2. Official Site Name &amp; Lab Title</h2>
                <p className="text-xs text-slate-500">
                  Sets the primary brand identity across the browser title bar, SEO cards, header banner, and patient communications.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Site Setting
              </span>
              <button
                type="button"
                onClick={() => handleSave('Site Name & Tagline saved successfully!')}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Site Name</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Site Name / Diagnostic Centre Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.labName}
                onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                placeholder="e.g. Apex Diagnostic & Clinical Pathology Laboratory"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-xs text-[#123B6D] focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                This appears as the main heading across your website and in the header brand badge.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Site Subtitle / Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Advanced Pathology, Biochemistry & Diagnostic Testing Centre"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Short 1-liner displayed below your laboratory name.
              </p>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
              Browser Title Bar &amp; Header Preview
            </span>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
              <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-xs font-black text-[#123B6D]">
                  {formData.labName || 'Your Diagnostic Lab Name'}
                </span>
                <span className="text-xs text-slate-400 mx-1.5">•</span>
                <span className="text-xs text-slate-600 font-medium">
                  {formData.tagline || '100% NABL Accredited Pathology'}
                </span>
                <span className="text-[10px] text-slate-400 ml-2">| INDIANLALAJI.COM</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-slate-500">
              Site name and subtitle are updated in real-time on your lab domain and Google search preview.
            </span>
            <button
              type="button"
              onClick={() => handleSave('Site Name & Tagline saved successfully!')}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Site Name</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SITE DESCRIPTION SECTION */}
      {/* ======================================================== */}
      {activeSection === 'description' && (
        <div id="section-description" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">3. Site Description &amp; Meta Summary</h2>
                <p className="text-xs text-slate-500">
                  Used by Google search engines, social media sharing previews, and the website's introductory hero summary.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Site Setting
              </span>
              <button
                type="button"
                onClick={() => handleSave('Site Description & Meta summary saved successfully!')}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Description</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Site Description Content <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {(formData.siteDescription || '').length} characters (Optimal: 140–280)
              </span>
            </div>
            <textarea
              rows={4}
              value={formData.siteDescription || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  siteDescription: e.target.value,
                  description: e.target.value,
                })
              }
              placeholder="Write a clear, reassuring summary of your pathology laboratory, sample collection capabilities, turnaround times, and NABL accreditation..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Google Search Snippet Preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Google Search Result Snippet Preview
            </span>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="text-[11px] text-emerald-800 flex items-center gap-1 font-mono">
                <span>https://{(vendorLabSettings.domainPreview || `indianlalaji.com/shop/${currentLabId}`).replace(/^https?:\/\//, '')}</span>
                <span>›</span>
                <span>home</span>
              </div>
              <h3 className="text-sm font-bold text-blue-800 hover:underline cursor-pointer">
                {formData.labName || 'Apex Diagnostic & Clinical Pathology Laboratory'}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {formData.siteDescription ||
                  'Advanced Pathology, Biochemistry & Diagnostic Testing Centre. 100% NABL Accredited & Certified. Instant digital WhatsApp PDF reports & doorstep sample collection.'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-slate-500">
              Clear laboratory descriptions improve patient trust and local pathology search rankings.
            </span>
            <button
              type="button"
              onClick={() => handleSave('Site Description & Meta summary saved successfully!')}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Description</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. FEATURE IMAGE SECTION */}
      {/* ======================================================== */}
      {activeSection === 'feature' && (
        <div id="section-feature" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">4. Feature Image (Hero &amp; Social Card)</h2>
                <p className="text-xs text-slate-500">
                  Primary banner image displayed on WhatsApp link shares, Twitter/Facebook open graph cards, and website hero spotlight.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Site Setting
              </span>
              <button
                type="button"
                onClick={() => handleSave('Feature Banner image saved successfully!')}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Feature Banner</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Feature Image Live Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block">
                Social Share &amp; Feature Preview (16:9 / 1200×630)
              </span>
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900 group">
                {formData.featureImageUrl ? (
                  <img
                    src={formData.featureImageUrl}
                    alt="Feature Image Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-10 h-10 opacity-40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                  <div className="text-white">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                      FEATURE IMAGE
                    </span>
                    <h4 className="text-xs font-black mt-1 line-clamp-1">
                      {formData.labName || 'Apex Diagnostic Laboratory'}
                    </h4>
                  </div>
                </div>
              </div>

              {formData.featureImageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveFeatureImage}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Feature Image</span>
                </button>
              )}
            </div>

            {/* Feature Image Upload & Select Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Upload Feature Image File
                </label>
                <label className="flex flex-col items-center justify-center w-full h-28 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#123B6D] hover:bg-slate-50">
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-600 font-bold">
                      <span className="text-[#123B6D]">Click to upload</span> or drag banner
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">High-res 1200×630px recommended</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFeatureImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Direct URL Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Or Image URL</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomFeatureUrlOpen(!isCustomFeatureUrlOpen)}
                    className="text-[11px] font-bold text-[#123B6D] hover:underline cursor-pointer"
                  >
                    {isCustomFeatureUrlOpen ? 'Hide URL' : 'Enter Image URL'}
                  </button>
                </div>
                {isCustomFeatureUrlOpen && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={customFeatureUrlInput}
                      onChange={(e) => setCustomFeatureUrlInput(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customFeatureUrlInput) {
                          setFormData((prev) => ({
                            ...prev,
                            featureImageUrl: customFeatureUrlInput,
                            ogImageUrl: customFeatureUrlInput,
                          }));
                          setCustomFeatureUrlInput('');
                        }
                      }}
                      className="px-3 py-2 bg-[#123B6D] text-white rounded-xl text-xs font-bold hover:bg-[#0e2c52] cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Sample Images */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Select a clinical photography preset:
                </span>
                <div className="space-y-1.5">
                  {SAMPLE_FEATURE_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          featureImageUrl: sample.url,
                          ogImageUrl: sample.url,
                        }))
                      }
                      className="w-full p-2 rounded-xl border border-slate-200 hover:border-[#123B6D] hover:bg-slate-50 flex items-center gap-2.5 text-xs text-left font-bold text-slate-800 transition cursor-pointer"
                    >
                      <img
                        src={sample.url}
                        alt={sample.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-8 rounded-lg object-cover"
                      />
                      <span className="truncate">{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-slate-500">
              High resolution feature graphics provide a professional impression when sending website links to patients.
            </span>
            <button
              type="button"
              onClick={() => handleSave('Feature Banner image saved successfully!')}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Feature Banner</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PAYMENT SETTINGS SECTION                              */}
      {/* ======================================================== */}
      {(activeSection === 'payment_qr' || activeSection === 'payment_settings') && (
        <div id="section-payment-settings" className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                  <CreditCard className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900">
                      5. Payment Settings (पेमेंट सेटिंग्स)
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                      Payment Methods
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure Online Payment Systems (Manual UPI vs PhonePe) and Pay on Spot counter billing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave('Payment Settings & Gateway configuration saved successfully!')}
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Payment Settings</span>
                </button>
              </div>
            </div>

            {/* DOMAIN CONTEXT & PAYMENT LOGIC BANNER */}
            <div className="p-4 rounded-2xl border bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#123B6D]" />
                  <span className="text-xs font-bold text-slate-800">
                    Current Domain Mode:
                  </span>
                  {formData.isCustomDomainActive ? (
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Vendor Custom Domain Active</span>
                    </span>
                  ) : (
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-blue-700" />
                      <span>Default IndianLalaji.com Shop URL</span>
                    </span>
                  )}
                </div>

                {/* Domain Switch Simulator Toggle */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 px-2">Domain Status:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newActive = !formData.isCustomDomainActive;
                      setFormData((prev) => {
                        const nextOnline = (!newActive) ? 'manual_upi' : prev.activeOnlinePaymentMethod;
                        return {
                          ...prev,
                          isCustomDomainActive: newActive,
                          activeOnlinePaymentMethod: nextOnline,
                        };
                      });
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      formData.isCustomDomainActive
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{formData.isCustomDomainActive ? 'Custom Domain' : 'Default Shop URL'}</span>
                    <span className="text-[10px] opacity-75">(Click to Toggle)</span>
                  </button>
                </div>
              </div>

              {/* Explanatory Box for the active mode */}
              {!formData.isCustomDomainActive ? (
                <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 space-y-1.5">
                  <div className="font-black text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Default IndianLalaji.com Shop Directory (indianlalaji.com/shop/{vendorLabSettings.labId || 'SHOP_ID'})</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-amber-900 space-y-0.5 leading-relaxed">
                    <li>
                      <strong>केवल Manual UPI available होगा।</strong>
                    </li>
                    <li>
                      Customer QR scan/download करके payment करेगा।
                    </li>
                    <li>
                      Customer UTR + screenshot submit करेगा और Vendor manually payment verify करेगा।
                    </li>
                    <li>
                      <em>PhonePe Payment Gateway इस URL पर lock रहता है। PhonePe Gateway केवल Vendor Custom Domain पर activate होता है।</em>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="bg-indigo-50/90 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-950 space-y-1.5">
                  <div className="font-black text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>Vendor Custom Domain ({vendorLabSettings.websiteDomain || 'yourlabdomain.com'}) Active</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-indigo-900 space-y-0.5 leading-relaxed">
                    <li>
                      <strong>Manual UPI</strong> और <strong>PhonePe Payment Gateway</strong> दोनों options available हैं।
                    </li>
                    <li>
                      <strong>नियम:</strong> एक समय में केवल एक ही Online Payment Method ON हो सकता है।
                    </li>
                    <li>
                      अगर Vendor Manual UPI ON करता है → PhonePe automatically OFF।
                    </li>
                    <li>
                      अगर Vendor PhonePe ON करता है → Manual UPI automatically OFF।
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* ONLINE PAYMENT METHOD SELECTOR (MUTUAL EXCLUSION)       */}
            {/* ======================================================== */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>Online Payment Method (केवल 1 Online Method ON रहेगा)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Choose which online payment system is active on your public website.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Active System: <strong className="text-[#123B6D]">
                    {formData.activeOnlinePaymentMethod === 'phonepe' && formData.isCustomDomainActive
                      ? 'PhonePe Gateway'
                      : 'Manual UPI'}
                  </strong>
                </div>
              </div>

              {/* TWO MUTUALLY EXCLUSIVE ONLINE METHOD CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* METHOD 1: MANUAL UPI */}
                <div
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      activeOnlinePaymentMethod: 'manual_upi',
                    }));
                  }}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                    formData.activeOnlinePaymentMethod === 'manual_upi' || !formData.isCustomDomainActive
                      ? 'bg-emerald-50/70 border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${
                          formData.activeOnlinePaymentMethod === 'manual_upi' || !formData.isCustomDomainActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                            <span>Manual UPI (QR Scan &amp; Pay)</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Counter Standee / Dynamic UPI QR Code
                          </span>
                        </div>
                      </div>

                      {/* Status Toggle Switch / Indicator */}
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                        formData.activeOnlinePaymentMethod === 'manual_upi' || !formData.isCustomDomainActive
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {formData.activeOnlinePaymentMethod === 'manual_upi' || !formData.isCustomDomainActive ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 space-y-1">
                      <div className="font-bold text-slate-900">Customer Website Flow:</div>
                      <div className="font-mono text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-800">
                        Pay Online → UPI QR → UTR + Screenshot submit
                      </div>
                      <div className="text-[10px] text-slate-500 pt-0.5">
                        ✓ Vendor manually payment verify करेगा in Dashboard / Billing
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      {formData.activeOnlinePaymentMethod === 'manual_upi' || !formData.isCustomDomainActive
                        ? '✅ Active Online Method'
                        : 'Click to Turn ON (PhonePe will turn OFF)'}
                    </span>
                    <input
                      type="radio"
                      name="onlinePaymentRadio"
                      checked={formData.activeOnlinePaymentMethod === 'manual_upi' || !formData.isCustomDomainActive}
                      onChange={() => {
                        setFormData((prev) => ({
                          ...prev,
                          activeOnlinePaymentMethod: 'manual_upi',
                        }));
                      }}
                      className="accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* METHOD 2: PHONEPE PAYMENT GATEWAY */}
                <div
                  onClick={() => {
                    if (!formData.isCustomDomainActive) {
                      setToastMessage('⚠️ PhonePe Payment Gateway requires an Active Custom Domain. Activate Custom Domain first!');
                      setIsSavedToast(true);
                      setTimeout(() => setIsSavedToast(false), 3500);
                      return;
                    }
                    setFormData((prev) => ({
                      ...prev,
                      activeOnlinePaymentMethod: 'phonepe',
                    }));
                  }}
                  className={`p-4 rounded-2xl border-2 transition relative flex flex-col justify-between ${
                    !formData.isCustomDomainActive
                      ? 'bg-slate-100/80 border-slate-200 opacity-70 cursor-not-allowed'
                      : formData.activeOnlinePaymentMethod === 'phonepe'
                      ? 'bg-purple-50/70 border-purple-600 shadow-xs ring-2 ring-purple-500/20 cursor-pointer'
                      : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${
                          formData.activeOnlinePaymentMethod === 'phonepe' && formData.isCustomDomainActive
                            ? 'bg-purple-700 text-white'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                            <span>PhonePe Payment Gateway</span>
                            {!formData.isCustomDomainActive && (
                              <span className="p-0.5 rounded bg-slate-300 text-slate-700">
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Instant Auto-Verification • UPI, Cards, NetBanking
                          </span>
                        </div>
                      </div>

                      {/* Status Toggle Switch / Indicator */}
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                        !formData.isCustomDomainActive
                          ? 'bg-slate-300 text-slate-600'
                          : formData.activeOnlinePaymentMethod === 'phonepe'
                          ? 'bg-purple-700 text-white shadow-2xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {!formData.isCustomDomainActive ? 'LOCKED' : formData.activeOnlinePaymentMethod === 'phonepe' ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 space-y-1">
                      <div className="font-bold text-slate-900">Customer Website Flow:</div>
                      <div className="font-mono text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200 text-purple-900">
                        Pay Online → PhonePe → Automatic Payment Verification
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold pt-0.5">
                        ⚡ 100% Instant Automatic Verification (No manual UTR checking needed)
                      </div>
                    </div>

                    {!formData.isCustomDomainActive && (
                      <p className="text-[10px] text-rose-600 font-bold mt-2">
                        🔒 Requires Vendor Custom Domain. Activate Custom Domain above to enable.
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      {!formData.isCustomDomainActive
                        ? 'Custom Domain required'
                        : formData.activeOnlinePaymentMethod === 'phonepe'
                        ? '✅ Active Online Method'
                        : 'Click to Turn ON (Manual UPI will turn OFF)'}
                    </span>
                    <input
                      type="radio"
                      name="onlinePaymentRadio"
                      disabled={!formData.isCustomDomainActive}
                      checked={formData.activeOnlinePaymentMethod === 'phonepe' && Boolean(formData.isCustomDomainActive)}
                      onChange={() => {
                        if (formData.isCustomDomainActive) {
                          setFormData((prev) => ({
                            ...prev,
                            activeOnlinePaymentMethod: 'phonepe',
                          }));
                        }
                      }}
                      className="accent-purple-600 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SEPARATE OPTION: PAY ON SPOT (LAB COUNTER / CASH)         */}
            {/* ======================================================== */}
            <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900">
                        Pay on Spot (लैब काउंटर / सैंपल पिकअप पर भुगतान)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                        अलग ऑप्शन
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Pay on Spot अलग option रहेगा और दोनों cases (Default URL और Custom Domain) में available रह सकता है।
                      मरीज लैब काउंटर पर या होम सैंपल कलेक्शन के समय Cash / Card से भुगतान कर सकता है।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPayOnSpotEnabled !== false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isPayOnSpotEnabled: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className={`text-xs font-black uppercase ${formData.isPayOnSpotEnabled !== false ? 'text-blue-900' : 'text-slate-400'}`}>
                    {formData.isPayOnSpotEnabled !== false ? 'Enabled (ON)' : 'Disabled (OFF)'}
                  </span>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* CONFIGURATION SECTION FOR THE ACTIVE ONLINE METHOD       */}
            {/* ======================================================== */}

            {/* PANEL A: MANUAL UPI CONFIGURATION */}
            {(formData.activeOnlinePaymentMethod === 'manual_upi' || !formData.isCustomDomainActive) && (
              <div className="border border-emerald-200 bg-emerald-50/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <h4 className="font-black text-sm text-emerald-950">
                      Manual UPI QR Configuration (मैनुअल UPI क्रेडेंशियल्स)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Active on Website
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {/* Live Scan Card Preview */}
                  <div className="bg-gradient-to-b from-[#123B6D] to-[#0A2547] text-white p-5 rounded-2xl shadow-md text-center space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                      <span>Official UPI QR</span>
                      <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">Instant Scan</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl max-w-[200px] mx-auto shadow-inner">
                      <img
                        src={effectiveQrCode1}
                        alt="UPI Payment QR"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-contain mx-auto"
                      />
                    </div>

                    <div className="bg-white/10 rounded-xl p-2 border border-white/20 text-center space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold px-1">
                        <span>Dynamic Test Amount:</span>
                        <span className="text-white font-black text-xs font-mono">₹{testDynamicAmount}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 pt-0.5">
                        {[250, 500, 1000, 2500].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setTestDynamicAmount(amt)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              testDynamicAmount === amt
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-300 pt-0.5">
                        ⚡ Pre-fills ₹{testDynamicAmount} when scanned with GPay/PhonePe
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black truncate">
                        {formData.merchantName || formData.labName || 'Apex Diagnostic Lab Pvt Ltd'}
                      </h4>
                      <div className="bg-white/10 rounded-lg p-1.5 text-[11px] font-mono flex items-center justify-between gap-1">
                        <span className="truncate">{formData.upiId1 || 'apexlab@icici'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.upiId1) {
                              navigator.clipboard.writeText(formData.upiId1);
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }
                          }}
                          className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-white/80" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment QR Inputs */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Primary UPI ID (VPA) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.upiId1 || ''}
                          onChange={(e) => setFormData({ ...formData, upiId1: e.target.value })}
                          placeholder="e.g. apexlab@icici or 9876543210@paytm"
                          className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Direct bank linked Virtual Payment Address.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Merchant / Beneficiary Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.merchantName || ''}
                          onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                          placeholder="e.g. Apex Diagnostic Lab Pvt Ltd"
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Name verified by banking app upon scanning.
                        </p>
                      </div>
                    </div>

                    {/* Upload QR Image */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Upload Standee / Bank QR Code Image
                      </label>
                      <label className="flex flex-col items-center justify-center w-full h-24 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#123B6D] hover:bg-slate-50">
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="w-5 h-5 text-slate-400 mb-1" />
                          <p className="text-xs text-slate-600 font-bold">
                            <span className="text-[#123B6D]">Upload QR Code PNG / JPG</span>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Upload your official PhonePe, Google Pay, or Paytm merchant QR image
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQrUpload(e, 1)}
                          className="hidden"
                        />
                      </label>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* PANEL B: PHONEPE PAYMENT GATEWAY CONFIGURATION */}
            {formData.activeOnlinePaymentMethod === 'phonepe' && formData.isCustomDomainActive && (
              <div className="border-2 border-purple-300 bg-purple-50/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-purple-200 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-purple-700 text-white">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-purple-950">
                        PhonePe Payment Gateway Settings (फोनपे गेटवे क्रेडेंशियल्स)
                      </h4>
                      <p className="text-[11px] text-purple-800">
                        Direct merchant API integration for 100% Automatic Payment Verification.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          phonepeMerchantId: 'M22PGTESTMID01',
                          phonepeSaltKey: 'd248b813-0975-47e2-8877-6d6f254e0b52',
                          phonepeSaltIndex: '1',
                          phonepeEnvironment: 'SANDBOX',
                          phonepeAutoVerify: true,
                        }));
                        setToastMessage('✅ PhonePe Test Sandbox Credentials loaded!');
                        setIsSavedToast(true);
                        setTimeout(() => setIsSavedToast(false), 3000);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-purple-300 bg-white hover:bg-purple-100 text-purple-900 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Fill Test Sandbox Keys</span>
                    </button>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-200 text-purple-900">
                      Auto-Verify: Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PhonePe Merchant ID (MID) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.phonepeMerchantId || ''}
                        onChange={(e) => setFormData({ ...formData, phonepeMerchantId: e.target.value.trim() })}
                        placeholder="e.g. M22PGTESTMID01 or YOUR_PROD_MID"
                        className="w-full p-2.5 pr-8 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.phonepeMerchantId) {
                            navigator.clipboard.writeText(formData.phonepeMerchantId);
                            setCopiedMid(true);
                            setTimeout(() => setCopiedMid(false), 2000);
                          }
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-purple-700"
                        title="Copy Merchant ID"
                      >
                        {copiedMid ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Provided in PhonePe Merchant Dashboard</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Salt Key / Production Secret <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPhonepeSecret ? 'text' : 'password'}
                        required
                        value={formData.phonepeSaltKey || ''}
                        onChange={(e) => setFormData({ ...formData, phonepeSaltKey: e.target.value.trim() })}
                        placeholder="e.g. d248b813-0975-47e2-8877-..."
                        className="w-full p-2.5 pr-8 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPhonepeSecret(!showPhonepeSecret)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-purple-700"
                        title={showPhonepeSecret ? 'Hide key' : 'Show key'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Used for cryptographic signature verification</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Salt Key Index <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phonepeSaltIndex || '1'}
                        onChange={(e) => setFormData({ ...formData, phonepeSaltIndex: e.target.value.trim() })}
                        placeholder="1"
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-center font-bold"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Default is 1</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Environment <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.phonepeEnvironment || 'SANDBOX'}
                        onChange={(e) => setFormData({ ...formData, phonepeEnvironment: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-bold"
                      >
                        <option value="SANDBOX">UAT Sandbox (Testing)</option>
                        <option value="PRODUCTION">Production (Live)</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Live payments</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-100/70 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] leading-relaxed">
                    <p className="font-bold">Automatic Payment Verification Guarantee:</p>
                    <p className="text-purple-800">
                      When patients pay via PhonePe on your website, PhonePe sends instant webhook authorization.
                      The appointment token is marked <strong>"Paid &amp; Verified"</strong> automatically without requiring the patient to enter a UTR or the lab to check receipts!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* LIVE CUSTOMER CHECKOUT PREVIEW SIMULATOR                 */}
            {/* ======================================================== */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                  <span>Customer Website Checkout Preview (ग्राहक को क्या दिखेगा)</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  URL: {formData.isCustomDomainActive ? (vendorLabSettings.websiteDomain || 'yourlab.com') : `indianlalaji.com/shop/${vendorLabSettings.labId || 'apex'}`}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">Select Payment Option on Booking Checkout:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Pay at Spot (if enabled) */}
                  {formData.isPayOnSpotEnabled !== false ? (
                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-black text-xs text-slate-900">Pay at Spot</div>
                          <div className="text-[10px] text-slate-500">Pay Cash/Card at counter or pickup</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Counter
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs italic flex items-center justify-center">
                      Pay on Spot Disabled by Lab
                    </div>
                  )}

                  {/* Option 2: Active Online Method */}
                  {formData.activeOnlinePaymentMethod === 'phonepe' && formData.isCustomDomainActive ? (
                    <div className="p-3 rounded-xl border-2 border-purple-500 bg-purple-50/80 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-purple-700" />
                        <div>
                          <div className="font-black text-xs text-purple-950 flex items-center gap-1">
                            <span>Pay Online via PhonePe</span>
                            <span className="text-[9px] bg-purple-200 text-purple-900 px-1 rounded font-bold">Gateway</span>
                          </div>
                          <div className="text-[10px] text-purple-700">UPI, Cards, NetBanking • Auto-Verified</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-600 text-white shadow-2xs">
                        ⚡ Instant
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/80 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-emerald-700" />
                        <div>
                          <div className="font-black text-xs text-emerald-950 flex items-center gap-1">
                            <span>Pay via QR (Manual UPI)</span>
                            <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1 rounded font-bold">Manual</span>
                          </div>
                          <div className="text-[10px] text-emerald-700">Scan QR → Enter UTR &amp; Screenshot</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-600 text-white shadow-2xs">
                        QR Scan
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-slate-500">
                Single online payment system active rule ensures zero confusion for patients during checkout.
              </span>
              <button
                type="button"
                onClick={() => handleSave('Payment Settings & Gateway configuration saved successfully!')}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Payment Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. PLAN & PRICING: SHOW ONLY CURRENTLY PURCHASED PLAN */}
      {/* (WITH REMAINING VISIBILITY DAYS) */}
      {/* ======================================================== */}
      {activeSection === 'plan' && (
        <div id="section-plan" className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
                <Zap className="w-5 h-5 fill-amber-500 text-amber-700" />
              </span>
              <div>
                <h2 className="text-base font-black text-[#123B6D]">
                  Plan &amp; Pricing: Laboratory Package &amp; Subscriptions
                </h2>
                <p className="text-xs text-slate-600">
                  Inspect your active laboratory subscription package or apply for package renewal.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                isPlanExpired
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isPlanExpired ? 'bg-rose-600' : 'bg-emerald-500 animate-pulse'}`}></span>
                <span>Status: {planStatus}</span>
              </span>
            </div>
          </div>

          {/* Toast Notification for Renewal Request Submission */}
          {renewSubmittedToast && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs font-bold flex items-start gap-2.5 shadow-sm animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-black text-emerald-900">Request Sent to Admin!</p>
                <p className="text-xs text-emerald-800 leading-relaxed">{renewSubmittedToast}</p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* CARD 1: CURRENT PACKAGE */}
          {/* ======================================================== */}
          <div id="card-current-package" className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-7 shadow-sm space-y-6 relative overflow-hidden">
            {/* Top Stripe */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              isPlanExpired
                ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600'
                : 'bg-gradient-to-r from-emerald-500 via-[#123B6D] to-teal-500'
            }`} />

            {/* Card Header & Title */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Card 1 • Active Subscription
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                  <ShieldCheck className={`w-6 h-6 ${isPlanExpired ? 'text-rose-600' : 'text-emerald-600'}`} />
                  <span>Current Package</span>
                </h3>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full border shadow-2xs flex items-center gap-2 ${
                  isPlanExpired
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isPlanExpired ? 'bg-rose-600' : 'bg-emerald-500 animate-pulse'}`}></span>
                  <span>Status: {planStatus}</span>
                </span>
              </div>
            </div>

            {/* Key Attributes Grid (Current Plan, Start Date, Expiry Date, Remaining Days, Status) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Current Plan</span>
                <strong className="text-base sm:text-lg font-black text-[#123B6D] block">{currentPlan}</strong>
                <span className="text-[11px] text-slate-500 font-semibold">₹{planInfo.price.toLocaleString('en-IN')} / {planInfo.cycle}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Start Date</span>
                <strong className="text-sm sm:text-base font-black text-slate-800 font-mono block">
                  {formData.planPurchasedAt || '15 Feb 2026'}
                </strong>
                <span className="text-[11px] text-slate-500 font-semibold">Plan Activation</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Expiry Date</span>
                <strong className={`text-sm sm:text-base font-black font-mono block ${isPlanExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                  {formData.planExpiresAt || '17 Mar 2026'}
                </strong>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {isPlanExpired ? 'Expired' : 'Renewal Due'}
                </span>
              </div>

              <div className={`p-3 rounded-xl border shadow-2xs ${
                isPlanExpired
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-emerald-50 border-emerald-300'
              }`}>
                <span className="text-[10px] font-bold uppercase block mb-0.5 text-slate-500">Remaining Days</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl sm:text-3xl font-black font-mono ${isPlanExpired ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {remainingDays}
                  </span>
                  <span className={`text-xs font-bold ${isPlanExpired ? 'text-rose-900' : 'text-emerald-900'}`}>
                    Days Left
                  </span>
                </div>
                <span className={`text-[10px] font-bold block ${isPlanExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isPlanExpired ? '⚠️ Subscription Expired' : `${percentageRemaining}% of Period Left`}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar (if active) */}
            {!isPlanExpired && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Subscription Validity Progress</span>
                  <span className="font-mono text-emerald-700">{remainingDays} of {totalDays} Days Left</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                    style={{ width: `${percentageRemaining}%` }}
                  />
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* PLAN EXPIRE ALERT BOX (WHEN PLAN EXPIRED) */}
            {/* ======================================================== */}
            {isPlanExpired && (
              <div className="bg-gradient-to-br from-rose-50 via-amber-50/70 to-rose-50 border-2 border-rose-400 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm animate-in fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                        Plan Expired
                      </span>
                      <span className="text-xs font-black text-rose-900 bg-rose-200/80 px-2.5 py-0.5 rounded-full">
                        Reason: Expired — Contact 70870 33009
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-rose-950">
                      Website Offline: Public Patients Cannot Access Your Portal
                    </h4>
                  </div>
                </div>

                {/* 3 Explicit Points from prompt */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white/90 p-3 rounded-xl border border-rose-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Website Visibility</span>
                    <strong className="text-sm font-black text-rose-700 block mt-0.5">
                      Website Public Nahi Rahegi
                    </strong>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Public access and online bookings are locked until renewed.
                    </p>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-rose-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Portal Status</span>
                    <strong className="text-sm font-black text-amber-800 block mt-0.5">
                      Dashboard: Draft
                    </strong>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Lab portal has been moved to Draft mode due to expired validity.
                    </p>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-rose-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Renewal Helpline</span>
                    <strong className="text-sm font-black text-[#123B6D] block mt-0.5">
                      Contact 70870 33009
                    </strong>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Contact support or submit a renewal request below for instant reactivation.
                    </p>
                  </div>
                </div>

                {/* "Apply for Plan" Button & Helpline Links */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    id="btn-apply-for-plan"
                    onClick={() => {
                      const renewCard = document.getElementById('card-renew-package');
                      if (renewCard) {
                        renewCard.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                  >
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Apply for Plan (Renew Now)</span>
                  </button>

                  <a
                    href="tel:7087033009"
                    className="w-full sm:w-auto px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call 70870 33009</span>
                  </a>

                  <a
                    href="https://wa.me/917087033009?text=Hello%2C%20I%20want%20to%20renew%20my%20lab%20package%20subscription%20for%20Apex%20Diagnostics."
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-3 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>💬 WhatsApp 70870 33009</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* CARD 2: RENEW PACKAGE (renew Package) */}
          {/* ======================================================== */}
          <div id="card-renew-package" className="bg-white rounded-3xl border-2 border-amber-300 p-6 sm:p-7 shadow-sm space-y-6 relative overflow-hidden">
            {/* Top Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#123B6D] to-emerald-500" />

            {/* Header & Subtitle */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-black">
                  Card 2 • Package Radio Button &gt; Apply &gt; Submit
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-amber-500 fill-amber-400" />
                  <span>Renew Package</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select package radio button &gt; click Apply &gt; submits renewal request to <strong>Admin → Plan Requests</strong>.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-right">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Helpline</span>
                <span className="text-xs font-mono font-black text-slate-900">70870 33009</span>
              </div>
            </div>

            {/* CRUCIAL GUARANTEE NOTICE */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 text-xs text-blue-950 flex items-start gap-3 shadow-2xs">
              <span className="p-1.5 rounded-xl bg-[#123B6D] text-white shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </span>
              <div>
                <strong className="block font-black text-sm text-[#123B6D]">
                  Strict Guarantee: No Days Wasted!
                </strong>
                <p className="text-xs text-blue-900 leading-relaxed mt-0.5">
                  <strong>Current plan ke remaining days waste nahi honge, New plan current expiry date ke baad start hoga.</strong> If currently expired, new plan starts today and website goes live immediately.
                </p>
              </div>
            </div>

            {/* Radio Button Package Cards */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 block">
                Select Package (Radio Option):
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. 1 Month Plan */}
                <label
                  onClick={() => setSelectedRenewPlan('1 Month')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                    selectedRenewPlan === '1 Month'
                      ? 'bg-amber-50/70 border-[#123B6D] ring-2 ring-[#123B6D]/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Flexible Starter
                      </span>
                      <input
                        type="radio"
                        name="renewPackageRadio"
                        value="1 Month"
                        checked={selectedRenewPlan === '1 Month'}
                        onChange={() => setSelectedRenewPlan('1 Month')}
                        className="w-4 h-4 text-[#123B6D] focus:ring-[#123B6D]"
                      />
                    </div>
                    <h4 className="text-base font-black text-slate-900">1 Month Plan</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#123B6D]">₹1,499</span>
                      <span className="text-xs text-slate-500 font-bold">/ 30 Days</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Standard monthly package with full diagnostic tests catalog and online patient portal access.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-600">
                    +30 Days Added to Expiry
                  </div>
                </label>

                {/* 2. 3 Months Plan (Most Popular) */}
                <label
                  onClick={() => setSelectedRenewPlan('3 Months')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                    selectedRenewPlan === '3 Months'
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                        ★ MOST POPULAR
                      </span>
                      <input
                        type="radio"
                        name="renewPackageRadio"
                        value="3 Months"
                        checked={selectedRenewPlan === '3 Months'}
                        onChange={() => setSelectedRenewPlan('3 Months')}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      />
                    </div>
                    <h4 className="text-base font-black text-slate-900">3 Months Plan</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#123B6D]">₹3,999</span>
                      <span className="text-xs text-slate-500 font-bold">/ 90 Days</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      90 days uninterrupted laboratory operations, priority verification, and digital WhatsApp delivery.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-amber-700">
                    +90 Days Added to Expiry (Save ₹500)
                  </div>
                </label>

                {/* 3. 1 Year Plan (Best Value) */}
                <label
                  onClick={() => setSelectedRenewPlan('1 Year')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                    selectedRenewPlan === '1 Year'
                      ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600/30 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black">
                        BEST VALUE (365D)
                      </span>
                      <input
                        type="radio"
                        name="renewPackageRadio"
                        value="1 Year"
                        checked={selectedRenewPlan === '1 Year'}
                        onChange={() => setSelectedRenewPlan('1 Year')}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <h4 className="text-base font-black text-slate-900">1 Year Plan</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-emerald-700">₹11,999</span>
                      <span className="text-xs text-slate-500 font-bold">/ 365 Days</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Annual package with dedicated directory shop routing, priority support, and 0% commission payment QR.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-emerald-700">
                    +365 Days Added to Expiry (Save ₹5,989)
                  </div>
                </label>
              </div>
            </div>

            {/* Optional Notes / Transaction Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Transaction Reference / Remarks (Optional):
              </label>
              <input
                type="text"
                value={renewNotes}
                onChange={(e) => setRenewNotes(e.target.value)}
                placeholder="e.g. UPI Ref / Transaction UTR / Call 70870 33009 for quick confirmation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none"
              />
            </div>

            {/* Action Button: Apply > Submit Button to Admin -> Plan Requests */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  Package Selected: {selectedRenewPlan} (₹{planPriceMap[selectedRenewPlan].price.toLocaleString('en-IN')})
                </span>
                <p className="text-[11px] text-slate-500">
                  Submits instant request to <strong>Admin → Plan Requests</strong>. Remaining days will be added automatically.
                </p>
              </div>

              <button
                type="button"
                id="btn-submit-plan-request"
                onClick={handleSubmitPlanRenewal}
                className="w-full sm:w-auto px-6 py-3 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 shrink-0"
              >
                <Send className="w-4 h-4 text-amber-400" />
                <span>Apply &gt; Submit to Admin</span>
              </button>
            </div>

            {/* Pending Requests Tracker */}
            {planRequests.filter((r) => r.status === 'Pending').length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-1.5 animate-in fade-in">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700 animate-spin" />
                  <span>Pending Renewal Requests for this Lab:</span>
                </span>
                {planRequests.filter((r) => r.status === 'Pending').map((req) => (
                  <div key={req.id} className="text-[11px] text-amber-900 pl-5">
                    • Requested <strong>{req.requestedPlan}</strong> (₹{req.amountINR}) on {new Date(req.createdAt).toLocaleDateString('en-IN')}. Status: <strong>Pending Super Admin Approval</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Are you sure you want to delete this?</h3>
                <p className="text-[11px] text-slate-500 font-medium">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {deleteConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={deleteConfirm.onConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
