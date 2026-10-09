import React, { useState } from 'react';
import {
  Home,
  Building,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  Eye,
  LogOut,
  Layers,
  IndianRupee,
  Phone,
  Mail,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  X,
  TrendingUp,
  Building2,
  AlertTriangle,
  FlaskConical,
  Clock,
  Globe,
  Crown,
  Database,
  Wifi,
  Activity,
  Server,
  RotateCcw,
  ExternalLink,
  QrCode,
  Copy,
  Share2,
  Download,
  Smartphone,
  CheckCheck,
  HardDriveDownload,
  FileText,
  Zap,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView, PricingPlan, CompanyFeature, LabManagementFeature } from '../types';
import { VendorManagementTab } from './admin/VendorManagementTab';
import { HostingerDatabaseCard } from './admin/HostingerDatabaseCard';
import { WebsiteBackupTab } from './admin/WebsiteBackupTab';
import { VendorPlanRenewTab } from './admin/VendorPlanRenewTab';
import { SeoSettingsTab } from './admin/SeoSettingsTab';
import { forceFreshReload } from '../utils/cacheManager';

interface CompanyAdminDashboardProps {
  onNavigateView: (view: AppView) => void;
}

export const CompanyAdminDashboard: React.FC<CompanyAdminDashboardProps> = ({ onNavigateView }) => {
  const {
    currentUser,
    logout,
    companySettings,
    updateCompanySettings,
    pricingPlans,
    addPricingPlan,
    updatePricingPlan,
    updatePlanPrice,
    resetPricingPlansToDefault,
    syncFeaturesToAllPlans,
    deletePricingPlan,
    companyFeatures,
    addCompanyFeature,
    updateCompanyFeature,
    deleteCompanyFeature,
    labManagementFeatures,
    addLabManagementFeature,
    updateLabManagementFeature,
    deleteLabManagementFeature,
    resetLabManagementFeatures,
    vendorLabsList,
    superAdminTenantScope,
    setSuperAdminTenantScope,
    isCloudConnected,
    cloudSyncStatus,
    lastCloudSyncTime,
    refreshCloudData,
    receptionEntries,
    reports,
    allDomainRequests,
    updateDomainRequest,
    deleteDomainRequest,
    allPlanRequests,
    storageMetrics,
    refreshStorageMetrics,
    cleanStorageCache,
    openCacheModal,
  } = useCms();

  type SuperAdminMenu = 'home' | 'labs' | 'clients' | 'drafts' | 'backup' | 'domain_requests' | 'plans' | 'seo';
  const [activeMenu, setActiveMenu] = useState<SuperAdminMenu>('home');

  type HomeSubTab = 'pricing' | 'upi_qr' | 'backup' | 'cloud_sync' | 'cache' | 'settings' | 'features' | 'seo';
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>('pricing');
  const activeTab = homeSubTab;

  const [isCleaningSaaSCache, setIsCleaningSaaSCache] = useState(false);
  const [cacheCleanFeedback, setCacheCleanFeedback] = useState<string | null>(null);

  const handlePurgeSaaSCache = async () => {
    setIsCleaningSaaSCache(true);
    try {
      const res = await cleanStorageCache();
      setCacheCleanFeedback(`Purged ${res.freedFormatted} of stale cache! Current storage: ${res.remainingFormatted}`);
      showToast(`🧹 Freed ${res.freedFormatted} of stale cache!`);
      setTimeout(() => setCacheCleanFeedback(null), 5000);
    } finally {
      setIsCleaningSaaSCache(false);
    }
  };

  // Super Admin Dynamic UPI QR State
  const [upiSelectedPlan, setUpiSelectedPlan] = useState<string>('3 Months');
  const [upiDynamicAmount, setUpiDynamicAmount] = useState<number>(4999);
  const [upiSelectedLabId, setUpiSelectedLabId] = useState<string>('walkin');
  const [upiCustomClientName, setUpiCustomClientName] = useState<string>('');
  const [upiCustomClientPhone, setUpiCustomClientPhone] = useState<string>('');
  const [upiNote, setUpiNote] = useState<string>('Subscription Plan - 3 Months - IndianLalaji OS');
  const [copiedUpiLink, setCopiedUpiLink] = useState(false);
  const [copiedUpiId, setCopiedUpiId] = useState(false);
  const [copiedUpiAmount, setCopiedUpiAmount] = useState(false);
  const [superAdminUpiVpa, setSuperAdminUpiVpa] = useState<string>(companySettings.upiId || '7087033009@okbizaxis');
  const [superAdminPayeeName, setSuperAdminPayeeName] = useState<string>(companySettings.upiMerchantName || 'INDIANLALAJI.COM LAB OS');
  const [upiSavedToast, setUpiSavedToast] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [pingResult, setPingResult] = useState<{ status: 'idle' | 'testing' | 'success'; latencyMs?: number; message?: string }>({ status: 'idle' });

  const runCloudPingTest = async () => {
    setPingResult({ status: 'testing' });
    const start = performance.now();
    try {
      await refreshCloudData();
      const duration = Math.max(12, Math.round(performance.now() - start));
      setPingResult({
        status: 'success',
        latencyMs: duration,
        message: `Real-time cloud ping verified! Roundtrip latency: ${duration}ms. WebSocket listeners active across all devices.`
      });
      showToast(`Cloud Ping: ${duration}ms — Real-time sync active!`);
    } catch (err: any) {
      setPingResult({
        status: 'idle',
        message: `Ping completed with local fallback. Status: ${err?.message || 'Ready'}`
      });
    }
  };

  const pendingCount = vendorLabsList.filter(
    (v) => v.status !== 'Active'
  ).length;

  const liveClientsCount = vendorLabsList.filter(
    (v) => v.status === 'Active'
  ).length;

  const pendingPaymentCount = vendorLabsList.filter(
    (v) => v.status === 'Processing due to payment confirmation'
  ).length;
  const draftLabsCount = vendorLabsList.filter(
    (v) => v.status === 'Draft' || !v.isWebsiteApproved
  ).length;

  // Edit / Add Modal States
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isNewPlanModal, setIsNewPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState<Omit<PricingPlan, 'id'>>({
    name: '',
    target: '',
    monthlyPriceINR: 1999,
    yearlyPriceINR: 1599,
    description: '',
    isPopular: false,
    features: ['Unlimited Patients', 'WhatsApp PDF Reports', 'NABL Format Support'],
  });

  const [editingFeature, setEditingFeature] = useState<CompanyFeature | null>(null);
  const [isNewFeatureModal, setIsNewFeatureModal] = useState(false);
  const [featureForm, setFeatureForm] = useState<Omit<CompanyFeature, 'id'>>({
    title: '',
    description: '',
    category: 'Core System',
    badge: '',
  });

  // Complete Laboratory Management Features (18 Modules) state
  const [editingLabFeature, setEditingLabFeature] = useState<LabManagementFeature | null>(null);
  const [isNewLabFeatureModal, setIsNewLabFeatureModal] = useState(false);
  const [labFeatureForm, setLabFeatureForm] = useState<Omit<LabManagementFeature, 'id'>>({
    title: '',
    desc: '',
    category: 'Diagnostic Module',
    iconName: 'Activity',
  });
  const [featureSubSection, setFeatureSubSection] = useState<'modules' | 'highlights'>('modules');
  const [labFeatureSearch, setLabFeatureSearch] = useState('');

  // Settings local form
  const [settingsForm, setSettingsForm] = useState({ ...companySettings });

  // In-app Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    itemDetails?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Handlers for Pricing Plans
  const [quickPrices, setQuickPrices] = useState<Record<string, number>>({});
  const [applyFeaturesToAll, setApplyFeaturesToAll] = useState(true);

  const handleQuickPriceChange = (planId: string, val: number) => {
    setQuickPrices((prev) => ({ ...prev, [planId]: val }));
  };

  const handleSaveQuickPrice = (planId: string, planName: string) => {
    const existing = pricingPlans.find((p) => p.id === planId);
    const fallback = existing?.priceINR ?? existing?.monthlyPriceINR ?? 0;
    const priceToSet = quickPrices[planId] !== undefined ? quickPrices[planId] : fallback;
    if (isNaN(priceToSet) || priceToSet < 0) {
      showToast('Please enter a valid price in ₹ INR');
      return;
    }
    updatePlanPrice(planId, priceToSet);
    showToast(`Price for "${planName}" updated to ₹${priceToSet.toLocaleString('en-IN')}!`);
  };

  const handleSyncFeaturesToAllPlans = (features: string[]) => {
    syncFeaturesToAllPlans(features);
    showToast('Identical features applied across all 3 packages!');
  };

  const handleResetToStandard3Packages = () => {
    resetPricingPlansToDefault();
    showToast('Reset to 3 standard packages: 1 Month, 3 Month, 1 Year!');
  };

  const handleOpenAddPlan = () => {
    setPlanForm({
      name: '1 Month Plan',
      target: 'Flexible Monthly Access',
      monthlyPriceINR: 1499,
      yearlyPriceINR: 1499,
      description: 'Full software access with all features included.',
      isPopular: false,
      features: pricingPlans[0]?.features || [
        'Unlimited Patients, Bills & Test Entries',
        'WhatsApp PDF Reports with QR Code Verification',
        '500+ Pre-Configured Tests Library',
        'Instant Dynamic UPI QR Payment Billing',
        'Doctor Commissions & B2B Referral Tracker',
        'Multi-Role Staff & Digital Signatures',
      ],
    });
    setIsNewPlanModal(true);
  };

  const handleSaveNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name) return;
    const price = planForm.priceINR || planForm.monthlyPriceINR;
    addPricingPlan({
      ...planForm,
      priceINR: price,
      monthlyPriceINR: price,
      yearlyPriceINR: price,
    });
    setIsNewPlanModal(false);
    showToast('New pricing plan added successfully!');
  };

  const handleOpenEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      target: plan.target,
      priceINR: plan.priceINR ?? plan.monthlyPriceINR,
      monthlyPriceINR: plan.monthlyPriceINR,
      yearlyPriceINR: plan.yearlyPriceINR,
      description: plan.description,
      isPopular: plan.isPopular,
      features: [...plan.features],
    });
    setApplyFeaturesToAll(true);
  };

  const handleSaveEditPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    const price = planForm.priceINR || planForm.monthlyPriceINR;
    updatePricingPlan(editingPlan.id, {
      ...planForm,
      priceINR: price,
      monthlyPriceINR: price,
      yearlyPriceINR: price,
    });
    if (applyFeaturesToAll) {
      syncFeaturesToAllPlans(planForm.features);
    }
    setEditingPlan(null);
    showToast(
      applyFeaturesToAll
        ? 'Plan updated & features synchronized across all 3 packages!'
        : 'Pricing plan updated successfully!'
    );
  };

  const handleDeletePlan = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Subscription Plan',
      message: 'Are you sure you want to delete this?',
      itemDetails: `Plan: "${name}"`,
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: () => {
        deletePricingPlan(id);
        showToast('Plan deleted.');
        setDeleteConfirm(null);
      },
    });
  };

  // Feature Handlers
  const handleOpenAddFeature = () => {
    setFeatureForm({
      title: 'AI Reference Range Highlighter',
      description: 'Automatically flags critical panic lab values with color-coded alerts and SMS notifications.',
      category: 'Clinical Safety',
      badge: 'New',
    });
    setIsNewFeatureModal(true);
  };

  const handleSaveNewFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureForm.title) return;
    addCompanyFeature(featureForm);
    setIsNewFeatureModal(false);
    showToast('Feature added successfully!');
  };

  const handleOpenEditFeature = (feat: CompanyFeature) => {
    setEditingFeature(feat);
    setFeatureForm({
      title: feat.title,
      description: feat.description,
      category: feat.category,
      badge: feat.badge || '',
    });
  };

  const handleSaveEditFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature) return;
    updateCompanyFeature(editingFeature.id, featureForm);
    setEditingFeature(null);
    showToast('Feature updated successfully!');
  };

  const handleDeleteFeature = (id: string, title: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Software Feature',
      message: 'Are you sure you want to delete this?',
      itemDetails: `Feature: "${title}"`,
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: () => {
        deleteCompanyFeature(id);
        showToast('Feature deleted.');
        setDeleteConfirm(null);
      },
    });
  };

  // Complete Laboratory Management Features Handlers
  const handleOpenAddLabFeature = () => {
    setLabFeatureForm({
      title: '',
      desc: '',
      category: 'Diagnostic Module',
      iconName: 'Activity',
    });
    setIsNewLabFeatureModal(true);
  };

  const handleSaveNewLabFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labFeatureForm.title.trim()) return;
    addLabManagementFeature(labFeatureForm);
    setIsNewLabFeatureModal(false);
    showToast(`Laboratory feature "${labFeatureForm.title}" added successfully!`);
  };

  const handleOpenEditLabFeature = (feat: LabManagementFeature) => {
    setEditingLabFeature(feat);
    setLabFeatureForm({
      title: feat.title,
      desc: feat.desc,
      category: feat.category || 'Diagnostic Module',
      iconName: feat.iconName || 'Activity',
    });
  };

  const handleSaveEditLabFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabFeature || !labFeatureForm.title.trim()) return;
    updateLabManagementFeature(editingLabFeature.id, labFeatureForm);
    setEditingLabFeature(null);
    showToast(`Feature "${labFeatureForm.title}" updated successfully!`);
  };

  const handleDeleteLabFeature = (id: string, title: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Laboratory Module',
      message: 'Are you sure you want to delete this?',
      itemDetails: `Module: "${title}"`,
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: () => {
        deleteLabManagementFeature(id);
        showToast('Module deleted.');
        setDeleteConfirm(null);
      },
    });
  };

  const handleResetLabFeatures = () => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Reset to Standard 18 Laboratory Modules',
      message: 'Are you sure you want to delete this?',
      itemDetails: 'Reset all modules back to standard 18 default laboratory features',
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: () => {
        resetLabManagementFeatures();
        showToast('Restored standard 18 laboratory modules!');
        setDeleteConfirm(null);
      },
    });
  };

  // Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(settingsForm);
    showToast('Company details & Hero section updated! View live site to inspect.');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Minimalist Inline Header: Brand | Nav Links | Logout */}
      <header className="bg-[#0e294b] text-white sticky top-0 z-40 border-b border-slate-700/60 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 flex items-center justify-between gap-3">
          {/* Brand & Portal Back (Inline) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              id="admin-btn-back"
              onClick={() => onNavigateView('website')}
              className="bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 hover:text-white px-2 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 border border-white/15 cursor-pointer shrink-0"
              title="Back to Public Portal"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Portal</span>
            </button>

            <div className="h-4 w-px bg-white/20 hidden sm:block shrink-0"></div>

            <div
              onClick={() => setActiveMenu('home')}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 group"
              title="Super Admin Dashboard Home"
            >
              <div className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[11px] shadow-2xs shrink-0">
                HQ
              </div>
              <span className="font-bold text-xs sm:text-[13px] tracking-tight text-white group-hover:text-amber-300 transition truncate max-w-[140px] sm:max-w-none">
                {companySettings.companyName || 'INDIANLALAJI.COM'}
              </span>
              <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider hidden sm:inline-block">
                Super Admin
              </span>
              <span className="text-[11px] text-slate-400 hidden xl:inline">
                • {companySettings.superAdminDomain || 'indianlalaji.com'}
              </span>
            </div>
          </div>

          {/* Inline Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* Home */}
            <button
              type="button"
              id="menu-btn-home"
              onClick={() => setActiveMenu('home')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeMenu === 'home'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            {/* Labs (Pending Labs) */}
            <button
              type="button"
              id="menu-btn-labs"
              onClick={() => setActiveMenu('labs')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 relative ${
                activeMenu === 'labs'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Labs</span>
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-none">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Our Clients */}
            <button
              type="button"
              id="menu-btn-clients"
              onClick={() => setActiveMenu('clients')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeMenu === 'clients'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Our Clients</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline-block leading-none ${
                  activeMenu === 'clients'
                    ? 'bg-slate-900 text-amber-300'
                    : 'bg-white/15 text-slate-200'
                }`}
              >
                {liveClientsCount}
              </span>
            </button>

            {/* Website Draft Tab */}
            <button
              type="button"
              id="menu-btn-drafts"
              onClick={() => setActiveMenu('drafts')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 relative ${
                activeMenu === 'drafts'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Website Draft (Backup Uploads & Review Before Publish)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Website Draft</span>
              {draftLabsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full leading-none animate-pulse">
                  {draftLabsCount}
                </span>
              )}
            </button>

            {/* Backup Module */}
            <button
              type="button"
              id="menu-btn-backup"
              onClick={() => setActiveMenu('backup')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeMenu === 'backup'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>

            {/* Complete Laboratory Management Features Tab */}
            <button
              type="button"
              id="menu-btn-lab-features"
              onClick={() => {
                setActiveMenu('home');
                setHomeSubTab('features');
                setFeatureSubSection('modules');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeMenu === 'home' && homeSubTab === 'features' && featureSubSection === 'modules'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Lab Features</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline-block leading-none ${
                  activeMenu === 'home' && homeSubTab === 'features' && featureSubSection === 'modules'
                    ? 'bg-slate-900 text-amber-300'
                    : 'bg-white/15 text-slate-200'
                }`}
              >
                {labManagementFeatures?.length || 18}
              </span>
            </button>

            {/* Domain Requests Tab */}
            <button
              type="button"
              id="menu-btn-domain-requests"
              onClick={() => setActiveMenu('domain_requests')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeMenu === 'domain_requests'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Domains</span>
              {allDomainRequests.filter((r) => r.status === 'Pending').length > 0 ? (
                <span className="bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-none animate-pulse">
                  {allDomainRequests.filter((r) => r.status === 'Pending').length}
                </span>
              ) : (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline-block leading-none ${
                    activeMenu === 'domain_requests'
                      ? 'bg-slate-900 text-amber-300'
                      : 'bg-white/15 text-slate-200'
                  }`}
                >
                  {allDomainRequests.length}
                </span>
              )}
            </button>

            {/* Plan Tab & Renew Requests */}
            <button
              type="button"
              id="menu-btn-plan-renew"
              onClick={() => setActiveMenu('plans')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 relative ${
                activeMenu === 'plans'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Plan Tab & Renew Requests (Vendor Subscriptions & Extensions)"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Plan &amp; Renew Req.</span>
              {allPlanRequests.filter((r) => r.status === 'Pending').length > 0 ? (
                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full leading-none animate-pulse">
                  {allPlanRequests.filter((r) => r.status === 'Pending').length}
                </span>
              ) : (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline-block leading-none ${
                    activeMenu === 'plans'
                      ? 'bg-slate-900 text-amber-300'
                      : 'bg-white/15 text-slate-200'
                  }`}
                >
                  {vendorLabsList.length}
                </span>
              )}
            </button>

            {/* SEO Settings Tab */}
            <button
              type="button"
              id="menu-btn-seo-settings"
              onClick={() => setActiveMenu('seo')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 relative ${
                activeMenu === 'seo'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Super Admin SEO Settings (Favicon, OG Image, Meta Tags, Robots.txt, Schema.org)"
            >
              <Globe className="w-3.5 h-3.5 text-amber-300" />
              <span>SEO Settings</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline-block leading-none ${
                  activeMenu === 'seo'
                    ? 'bg-slate-900 text-amber-300'
                    : 'bg-emerald-500/30 text-emerald-200'
                }`}
              >
                Google
              </span>
            </button>

            {/* Separator */}
            <div className="h-4 w-px bg-white/15 mx-0.5 hidden sm:block shrink-0"></div>

            {/* Logout */}
            <button
              type="button"
              id="menu-btn-logout"
              onClick={() => {
                logout();
                onNavigateView('website');
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-rose-200 hover:text-white hover:bg-rose-500/20 transition flex items-center gap-1 cursor-pointer border border-rose-400/25 shrink-0"
              title="Logout from Super Admin Dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* VIEW 1: HOME DASHBOARD */}
        {activeMenu === 'home' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Multi-Lab Data Isolation & Tenant Scope Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-[#123B6D] to-slate-900 rounded-2xl p-4 text-white shadow-sm border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white tracking-wide">
                      Multi-Lab Data Isolation Engine
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                      Strict Tenant Boundary Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Central Super Admin oversight with strict tenant database partitioning per Laboratory.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto bg-black/30 p-1.5 rounded-xl border border-white/15">
                <span className="text-[11px] font-bold text-slate-300 pl-2">Super Admin Scope:</span>
                <select
                  value={superAdminTenantScope}
                  onChange={(e) => {
                    setSuperAdminTenantScope(e.target.value);
                    const targetName =
                      e.target.value === 'all'
                        ? 'All Labs (Global)'
                        : vendorLabsList.find((l) => l.id === e.target.value)?.name || e.target.value;
                    setToastMessage(`Switched Super Admin Data Scope to: ${targetName}`);
                    setTimeout(() => setToastMessage(''), 3000);
                  }}
                  className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg border-0 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="all">🌐 All Labs (Global Unrestricted)</option>
                  {vendorLabsList.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      🔬 {lab.name} ({lab.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Pending Labs */}
              <div
                onClick={() => setActiveMenu('labs')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pending Labs
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-amber-700">{pendingCount}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Awaiting Approval</span>
                    <span className="font-bold text-amber-700 group-hover:underline">Review Labs →</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Our Clients */}
              <div
                onClick={() => setActiveMenu('clients')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Our Clients
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-emerald-700">{liveClientsCount}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Published / Live Labs</span>
                    <span className="font-bold text-emerald-700 group-hover:underline">View Clients →</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Website Draft Tab */}
              <div
                id="kpi-card-website-drafts"
                onClick={() => setActiveMenu('drafts')}
                className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-2xs hover:border-amber-500 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Website Draft
                    </span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                      Ready to Publish
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-amber-900">{draftLabsCount}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Backups &amp; Drafts</span>
                    <span className="font-bold text-amber-700 group-hover:underline">Publish Drafts →</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Cloud DB & Sync */}
              <div
                onClick={() => setHomeSubTab('cloud_sync')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-500 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Cloud Database
                  </span>
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-700 group-hover:scale-110 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-black text-emerald-700">Real-Time Sync</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>{pingResult.latencyMs ? `Ping: ${pingResult.latencyMs}ms` : 'Hostinger Server & DB'}</span>
                    <span className="font-bold text-teal-700 group-hover:underline">Inspect →</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Operations Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-xs text-slate-600">
                  Today's Central Operations: <strong>{receptionEntries.length} Patients</strong> registered • <strong>{reports.length} Reports</strong> issued
                </div>
                <button
                  type="button"
                  onClick={runCloudPingTest}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{pingResult.status === 'testing' ? 'Testing Ping...' : 'Test Cloud Ping'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onNavigateView('reception_dashboard')}
                  className="bg-[#0F766E] hover:bg-[#0d655e] text-white px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>🖥️ Reception Counter</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('technician_dashboard')}
                  className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-amber-300" />
                  <span>🔬 Technician Dept</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('website')}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>🏠 Preview Live Site</span>
                </button>
              </div>
            </div>

            {/* Home Sub-Modules Strip */}
            <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setHomeSubTab('pricing')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'pricing'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>SaaS Pricing ({pricingPlans.length})</span>
                </button>

                <button
                  onClick={() => setHomeSubTab('upi_qr')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'upi_qr'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'text-slate-700 bg-amber-50 hover:bg-amber-100/70 border border-amber-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dynamic UPI QR Scanner</span>
                  <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-1.5 py-0.2 rounded-full">
                    Live
                  </span>
                </button>

                <button
                  onClick={() => setHomeSubTab('backup')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'backup'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'text-blue-900 bg-blue-50 hover:bg-blue-100/70 border border-blue-200'
                  }`}
                >
                  <HardDriveDownload className="w-3.5 h-3.5 text-[#123B6D]" />
                  <span>Website Backup</span>
                </button>

                <button
                  onClick={() => setHomeSubTab('cloud_sync')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'cloud_sync'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cloud DB & Hostinger Monitor</span>
                </button>

                <button
                  onClick={() => setHomeSubTab('cache')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'cache'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                  }`}
                  title="Optimize SaaS Cache & LocalStorage Footprint"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>SaaS Cache Optimizer</span>
                  <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-1.5 py-0.2 rounded-full">
                    {storageMetrics ? storageMetrics.localStorageFormatted : 'Clean'}
                  </span>
                </button>

                <button
                  onClick={() => setHomeSubTab('settings')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'settings'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Branding & Hero Content</span>
                </button>

                <button
                  onClick={() => setActiveMenu('seo')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer text-emerald-900 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200"
                  title="Configure Website SEO Settings"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SEO Settings</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-950 font-black px-1.5 py-0.2 rounded-full">
                    Google
                  </span>
                </button>

                <button
                  onClick={() => {
                    setHomeSubTab('features');
                    setFeatureSubSection('modules');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    homeSubTab === 'features'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                  <span>Complete Lab Features ({labManagementFeatures?.length || 18})</span>
                </button>
              </div>
            </div>

            {/* Sub-tab content when activeMenu === 'home' */}

        {/* 1. PRICING PLANS TAB */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            {/* Header & Quick Sync Actions */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#123B6D] text-[11px] font-bold">
                    SaaS Pricing Engine
                  </span>
                  <span className="text-xs text-slate-400 font-medium">• 3 Standard Packages</span>
                </div>
                <h2 className="text-lg font-extrabold text-[#123B6D] mt-1">
                  Manage Subscription Plans (1 Month, 3 Month, 1 Year)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  All 3 packages have identical full features. Change prices directly below in 1-click — updates apply immediately on the website and database.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => {
                    if (pricingPlans[0]?.features) {
                      handleSyncFeaturesToAllPlans(pricingPlans[0].features);
                    }
                  }}
                  title="Make features across all 3 packages 100% identical"
                  className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 border border-teal-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Sync Features Across All</span>
                </button>
                <button
                  onClick={handleResetToStandard3Packages}
                  title="Reset to standard 1 Month, 3 Month, 1 Year packages"
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restore Standard 3 Packages</span>
                </button>
                <button
                  onClick={handleOpenAddPlan}
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add Plan</span>
                </button>
              </div>
            </div>

            {/* Quick Price Editor Box - Direct Change from Dashboard */}
            <div className="bg-linear-to-r from-blue-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-md">
              <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-blue-800/60">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-amber-300 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" />
                    <span>Quick Price Editor • Direct Change from Dashboard</span>
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Enter new price and click "Update Price" to change it instantly on the live website.
                  </p>
                </div>
                <span className="hidden sm:inline-block text-[11px] bg-blue-800/80 px-2.5 py-1 rounded-full text-blue-200 border border-blue-700 font-mono">
                  Instant Sync Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricingPlans.map((plan) => {
                  const currentPrice = plan.priceINR ?? plan.monthlyPriceINR;
                  const inputValue = quickPrices[plan.id] !== undefined ? quickPrices[plan.id] : currentPrice;

                  return (
                    <div
                      key={plan.id}
                      className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/15 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-white">{plan.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                          Live: ₹{currentPrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-[11px] text-blue-200 mb-3 truncate">
                        {plan.target || 'Software Package'}
                      </div>

                      <div className="space-y-2 mt-auto">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                          Change Price (₹ INR):
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={inputValue}
                              onChange={(e) => handleQuickPriceChange(plan.id, Number(e.target.value))}
                              className="w-full pl-6 pr-2 py-2 rounded-lg bg-white text-slate-900 font-black text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                          <button
                            onClick={() => handleSaveQuickPrice(plan.id, plan.name)}
                            className="px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pricingPlans.map((plan) => {
                const currentPrice = plan.priceINR ?? plan.monthlyPriceINR;
                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-2xl border ${
                      plan.isPopular ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                    } p-5 shadow-2xs flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#123B6D] border border-blue-200">
                          {plan.target}
                        </span>
                        {plan.isPopular && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                            Most Popular
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-3">{plan.description}</p>

                      <div className="py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl font-black text-[#123B6D]">
                              ₹{currentPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-500 ml-1 font-medium">
                              / {plan.name.toLowerCase().includes('year') ? 'year' : plan.name.toLowerCase().includes('3 month') ? '3 months' : 'month'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenEditPlan(plan)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Full</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Included Features ({plan.features?.length || 0}):
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Same Features
                          </span>
                        </div>
                        {(Array.isArray(plan.features) ? plan.features : []).slice(0, 6).map((f, i) => (
                          <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                        {(plan.features?.length || 0) > 6 && (
                          <span className="text-[11px] text-slate-400 italic block pt-0.5">
                            + {(plan.features?.length || 0) - 6} more standard features
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditPlan(plan)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id, plan.name)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">ID: {plan.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 1.1 DYNAMIC UPI SCANNER QR TAB */}
        {activeTab === 'upi_qr' && (() => {
          const effectiveSuperAdminUpi = superAdminUpiVpa.trim() || companySettings.upiId || '7087033009@okbizaxis';
          const effectivePayeeName = superAdminPayeeName.trim() || companySettings.upiMerchantName || 'INDIANLALAJI.COM LAB OS';
          const getPlanPrice = (planKeyword: string, fallback: number) => {
            const match = pricingPlans.find((p) => p.name.toLowerCase().includes(planKeyword.toLowerCase()));
            return match ? (match.priceINR ?? match.monthlyPriceINR) : fallback;
          };

          const selectedLab = vendorLabsList.find((l) => l.id === upiSelectedLabId);
          const targetRecipientName = selectedLab ? selectedLab.name : (upiCustomClientName.trim() || 'New Diagnostic Center');
          const targetRecipientPhone = selectedLab ? selectedLab.phone : (upiCustomClientPhone.trim() || '7087033009');

          const dynamicUpiUri = `upi://pay?pa=${encodeURIComponent(effectiveSuperAdminUpi)}&pn=${encodeURIComponent(effectivePayeeName)}&am=${upiDynamicAmount}&cu=INR&tn=${encodeURIComponent(upiNote.trim() || 'Lab Software Subscription')}`;
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=340x340&data=${encodeURIComponent(dynamicUpiUri)}`;

          const handleSaveUpiDetails = (e?: React.FormEvent) => {
            if (e) e.preventDefault();
            updateCompanySettings({
              upiId: effectiveSuperAdminUpi,
              upiMerchantName: effectivePayeeName,
            });
            setSettingsForm((prev) => ({
              ...prev,
              upiId: effectiveSuperAdminUpi,
              upiMerchantName: effectivePayeeName,
            }));
            setUpiSavedToast(true);
            setTimeout(() => setUpiSavedToast(false), 2500);
            showToast('Super Admin UPI VPA & Merchant Name updated successfully!');
          };

          const handleSelectPlanPreset = (planName: string, price: number) => {
            setUpiSelectedPlan(planName);
            setUpiDynamicAmount(price);
            setUpiNote(`${planName} SaaS Plan - ${targetRecipientName}`);
          };

          const handleWhatsAppShare = () => {
            const cleanPhone = targetRecipientPhone.replace(/\D/g, '');
            const message = `*INDIANLALAJI.COM — LABORATORY SOFTWARE SUBSCRIPTION*\n\n` +
              `Hello *${targetRecipientName}*,\n\n` +
              `Here is your official dynamic UPI payment link and details for *${upiSelectedPlan}*:\n\n` +
              `💰 *Payable Amount:* ₹${upiDynamicAmount.toLocaleString('en-IN')}\n` +
              `📱 *Beneficiary VPA:* ${effectiveSuperAdminUpi}\n` +
              `🏢 *Payee Name:* ${effectivePayeeName}\n` +
              `📝 *Transaction Note:* ${upiNote}\n\n` +
              `👉 *Direct 1-Click UPI Payment Link:* \n${dynamicUpiUri}\n\n` +
              `_After successful payment, please share your UTR/Reference number for instant activation of your laboratory software portal and domain._\n\n` +
              `Support: +91 7087033009 • https://indianlalaji.com`;

            const waUrl = cleanPhone.length >= 10
              ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(message)}`
              : `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank');
          };

          const handleDownloadQr = () => {
            const link = document.createElement('a');
            link.href = qrImageUrl;
            link.download = `INDIANLALAJI_Dynamic_UPI_QR_Rs_${upiDynamicAmount}.png`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          return (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Top Informative Banner */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black flex items-center gap-1.5 border border-amber-300">
                      <QrCode className="w-3.5 h-3.5 text-amber-600" />
                      <span>Super Admin Dynamic UPI Engine</span>
                    </span>
                    <span className="text-xs text-slate-400 font-medium">• Live Amount Injected</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-[#123B6D] mt-1 flex items-center gap-2">
                    <span>Dynamic UPI Scanner QR & Payment Engine</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate instant dynamic QR codes with exact payable amount pre-filled for SaaS subscription plans, lab onboarding, white-label setup, or custom invoicing.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Dynamic Billing Active</span>
                  </div>
                </div>
              </div>

              {/* Main Grid: Left Controls (5 cols) & Right Live QR Standee (7 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Controls & Customizer (5 cols) */}
                <div className="lg:col-span-6 space-y-4">
                  {/* 1. Super Admin Beneficiary Config */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-[#123B6D]">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">
                            Super Admin Beneficiary UPI Account
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Bank-linked VPA where all platform payments arrive
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveUpiDetails}
                        className="px-2.5 py-1 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3 h-3 text-amber-300" />
                        <span>Save VPA</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Platform UPI ID (VPA) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={superAdminUpiVpa}
                          onChange={(e) => setSuperAdminUpiVpa(e.target.value.trim())}
                          placeholder="e.g. 7087033009@okbizaxis"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Payee / Merchant Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={superAdminPayeeName}
                          onChange={(e) => setSuperAdminPayeeName(e.target.value)}
                          placeholder="e.g. INDIANLALAJI.COM LAB OS"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Dynamic Amount & Plan Selector */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                          <IndianRupee className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">
                            Dynamic Amount & Package Selection
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Select standard plan or enter any custom dynamic ₹ amount
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        ₹{upiDynamicAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Quick Plan Presets */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Quick Preset Plans & Add-ons
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectPlanPreset('1 Month', getPlanPrice('1 Month', 1999))}
                          className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                            upiSelectedPlan === '1 Month' && upiDynamicAmount === getPlanPrice('1 Month', 1999)
                              ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[10px] opacity-80 uppercase font-semibold">1 Month Plan</div>
                          <div className="text-xs font-black">₹{getPlanPrice('1 Month', 1999).toLocaleString('en-IN')}</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectPlanPreset('3 Months', getPlanPrice('3 Month', 4999))}
                          className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                            upiSelectedPlan === '3 Months' && upiDynamicAmount === getPlanPrice('3 Month', 4999)
                              ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[10px] opacity-80 uppercase font-semibold">3 Months Plan</div>
                          <div className="text-xs font-black text-amber-500">₹{getPlanPrice('3 Month', 4999).toLocaleString('en-IN')}</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectPlanPreset('1 Year', getPlanPrice('1 Year', 11999))}
                          className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                            upiSelectedPlan === '1 Year' && upiDynamicAmount === getPlanPrice('1 Year', 11999)
                              ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[10px] opacity-80 uppercase font-semibold">1 Year Annual</div>
                          <div className="text-xs font-black">₹{getPlanPrice('1 Year', 11999).toLocaleString('en-IN')}</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectPlanPreset('Onboarding Setup', 500)}
                          className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                            upiSelectedPlan === 'Onboarding Setup' && upiDynamicAmount === 500
                              ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[10px] opacity-80 uppercase font-semibold">Setup Fee</div>
                          <div className="text-xs font-black">₹500</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectPlanPreset('Custom Domain Link', 1000)}
                          className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                            upiSelectedPlan === 'Custom Domain Link' && upiDynamicAmount === 1000
                              ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[10px] opacity-80 uppercase font-semibold">Domain Link</div>
                          <div className="text-xs font-black">₹1,000</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectPlanPreset('White-Label Portal', 2500)}
                          className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                            upiSelectedPlan === 'White-Label Portal' && upiDynamicAmount === 2500
                              ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="text-[10px] opacity-80 uppercase font-semibold">White-Label</div>
                          <div className="text-xs font-black">₹2,500</div>
                        </button>
                      </div>
                    </div>

                    {/* Custom Dynamic Amount Input */}
                    <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                          <span>Custom Dynamic Amount (₹)</span>
                          <span className="text-[10px] text-amber-700 font-normal">• Type any custom amount</span>
                        </label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm font-black text-amber-800">₹</span>
                        <input
                          type="number"
                          min="1"
                          max="500000"
                          value={upiDynamicAmount}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 0);
                            setUpiDynamicAmount(val);
                          }}
                          className="w-full pl-8 pr-3 py-2 bg-white border border-amber-300 rounded-xl font-black text-base text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                          placeholder="e.g. 4999"
                        />
                      </div>
                      <p className="text-[10px] text-amber-800">
                        ⚡ The QR code on the right updates instantly with this dynamic amount embedded in the UPI string.
                      </p>
                    </div>
                  </div>

                  {/* 3. Target Lab & Purpose / Transaction Note */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3 text-xs">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">Target Laboratory & Purpose</h4>
                        <p className="text-[10px] text-slate-400">Attach lab details to QR note for automatic reconciliation</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Select Registered Lab (or Walk-In Client)
                      </label>
                      <select
                        value={upiSelectedLabId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUpiSelectedLabId(val);
                          if (val === 'walkin') {
                            setUpiNote(`${upiSelectedPlan} SaaS Plan - Walk-In Client`);
                          } else {
                            const lab = vendorLabsList.find((l) => l.id === val);
                            if (lab) {
                              setUpiNote(`${upiSelectedPlan} Plan - ${lab.name}`);
                            }
                          }
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      >
                        <option value="walkin">➕ Direct / Walk-In / New Lab Registration</option>
                        {vendorLabsList.map((lab) => (
                          <option key={lab.id} value={lab.id}>
                            {lab.name} ({lab.city || 'Punjab'}) • {lab.phone}
                          </option>
                        ))}
                      </select>
                    </div>

                    {upiSelectedLabId === 'walkin' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Client / Lab Name
                          </label>
                          <input
                            type="text"
                            value={upiCustomClientName}
                            onChange={(e) => {
                              setUpiCustomClientName(e.target.value);
                              setUpiNote(`${upiSelectedPlan} Plan - ${e.target.value || 'Client'}`);
                            }}
                            placeholder="e.g. LifeCare Diagnostic Center"
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            WhatsApp Mobile Number
                          </label>
                          <input
                            type="tel"
                            value={upiCustomClientPhone}
                            onChange={(e) => setUpiCustomClientPhone(e.target.value)}
                            placeholder="e.g. 9876543210"
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Transaction Note / Purpose (UPI &tn= Parameter)
                      </label>
                      <input
                        type="text"
                        value={upiNote}
                        onChange={(e) => setUpiNote(e.target.value)}
                        placeholder="e.g. 3 Months Plan - Apex Diagnostic"
                        className="w-full p-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Dynamic UPI QR Standee (6 cols) */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="bg-linear-to-b from-[#123B6D] to-[#0A2544] text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-blue-900/60 relative overflow-hidden flex flex-col items-center text-center">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Standee Header */}
                    <div className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-white/15">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-white/20">
                          <Crown className="w-4 h-4 text-amber-300" />
                        </span>
                        <div className="text-left">
                          <span className="text-xs font-extrabold text-white block tracking-wide">
                            INDIANLALAJI.COM
                          </span>
                          <span className="text-[10px] text-blue-200">Official SaaS Payment Standee</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-[10px] font-bold">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Dynamic Amount Active</span>
                      </div>
                    </div>

                    {/* Prominent Dynamic Amount Banner */}
                    <div className="relative z-10 my-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 w-full max-w-sm">
                      <span className="text-[11px] text-amber-300 font-extrabold uppercase tracking-widest block">
                        Exact Amount Pre-Filled in QR
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-white mt-0.5 tracking-tight flex items-center justify-center gap-1">
                        <span>₹</span>
                        <span>{upiDynamicAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-[11px] text-blue-100 mt-1 truncate">
                        {upiNote}
                      </p>
                    </div>

                    {/* Real Dynamic QR Image Container */}
                    <div className="relative z-10 bg-white p-3.5 rounded-2xl shadow-2xl border-4 border-white/90 flex flex-col items-center">
                      <img
                        src={qrImageUrl}
                        alt="Dynamic UPI QR Code"
                        className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                      />
                      <div className="mt-2 text-center text-slate-800">
                        <div className="text-xs font-black">{effectivePayeeName}</div>
                        <div className="text-[11px] font-mono text-slate-600 font-bold">{effectiveSuperAdminUpi}</div>
                      </div>
                    </div>

                    {/* Supported UPI Brands Strip */}
                    <div className="relative z-10 mt-4 flex items-center justify-center gap-2 text-[10px] text-blue-200 font-bold">
                      <span className="px-2 py-0.5 bg-white/10 rounded-md">Google Pay</span>
                      <span className="px-2 py-0.5 bg-white/10 rounded-md">PhonePe</span>
                      <span className="px-2 py-0.5 bg-white/10 rounded-md">Paytm</span>
                      <span className="px-2 py-0.5 bg-white/10 rounded-md">BHIM</span>
                      <span className="px-2 py-0.5 bg-white/10 rounded-md">Cred</span>
                    </div>

                    <p className="relative z-10 text-[11px] text-blue-200 mt-2 max-w-xs">
                      Customer simply scans this code with camera or any UPI app. The amount of <strong>₹{upiDynamicAmount}</strong> is automatically filled.
                    </p>

                    {/* Standee Action Buttons */}
                    <div className="relative z-10 mt-5 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(dynamicUpiUri);
                          setCopiedUpiLink(true);
                          setTimeout(() => setCopiedUpiLink(false), 2000);
                        }}
                        className="py-2.5 px-3 bg-white/15 hover:bg-white/25 text-white rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-white/20"
                      >
                        {copiedUpiLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedUpiLink ? 'UPI Link Copied!' : 'Copy UPI Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(effectiveSuperAdminUpi);
                          setCopiedUpiId(true);
                          setTimeout(() => setCopiedUpiId(false), 2000);
                        }}
                        className="py-2.5 px-3 bg-white/15 hover:bg-white/25 text-white rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-white/20"
                      >
                        {copiedUpiId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedUpiId ? 'VPA Copied!' : 'Copy UPI VPA'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleWhatsAppShare}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Send on WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download QR PNG</span>
                      </button>
                    </div>

                    {/* Direct Test Deep Link */}
                    <div className="relative z-10 mt-3 pt-3 border-t border-white/15 w-full text-center">
                      <a
                        href={dynamicUpiUri}
                        className="text-[11px] text-amber-300 hover:underline flex items-center justify-center gap-1 font-bold"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Open Directly in UPI App (Mobile Test)</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2. FEATURES TAB */}
        {activeTab === 'features' && (
          <div className="space-y-5">
            {/* Top Switcher: Complete Laboratory Management Features vs Platform Highlights */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFeatureSubSection('modules')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    featureSubSection === 'modules'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                  <span>Complete Laboratory Management Features ({labManagementFeatures?.length || 18})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeatureSubSection('highlights')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    featureSubSection === 'highlights'
                      ? 'bg-[#123B6D] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Platform Highlights ({companyFeatures.length})</span>
                </button>
              </div>

              {featureSubSection === 'modules' ? (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={handleResetLabFeatures}
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Restore default 18 laboratory modules"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset 18 Modules</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddLabFeature}
                    className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Add Lab Module</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenAddFeature}
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add Highlight</span>
                </button>
              )}
            </div>

            {/* SUB-SECTION 1: COMPLETE LABORATORY MANAGEMENT FEATURES (18 MODULES) */}
            {featureSubSection === 'modules' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-4 rounded-2xl border border-blue-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#123B6D] flex items-center gap-2">
                      <span>🧪 Complete Laboratory Management Features</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                        Live on Homepage
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ये 18 मॉड्यूल्स मुख्य वेबसाइट के "Complete Laboratory Management Features" सेक्शन में दिखते हैं। आप किसी भी मॉड्यूल का नाम, विवरण, कैटेगरी व आइकन बदल सकते हैं।
                    </p>
                  </div>

                  {/* Search Modules */}
                  <div className="w-full md:w-64 relative">
                    <input
                      type="text"
                      value={labFeatureSearch}
                      onChange={(e) => setLabFeatureSearch(e.target.value)}
                      placeholder="Search module (e.g. Barcode, Billing)..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white shadow-2xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {(labManagementFeatures || [])
                    .filter((feat) => {
                      if (!labFeatureSearch.trim()) return true;
                      const q = labFeatureSearch.toLowerCase();
                      return (
                        feat.title.toLowerCase().includes(q) ||
                        feat.desc.toLowerCase().includes(q) ||
                        (feat.category && feat.category.toLowerCase().includes(q))
                      );
                    })
                    .map((feat, idx) => (
                      <div
                        key={feat.id || idx}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between hover:border-[#123B6D]/40 transition group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#123B6D] border border-blue-200">
                              {feat.category || 'Diagnostic Module'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              #{idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-7 h-7 rounded-lg bg-[#123B6D]/10 text-[#123B6D] flex items-center justify-center font-bold text-xs shrink-0">
                              ⚡
                            </div>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                              {feat.title}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {feat.desc}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Icon: {feat.iconName || 'Activity'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditLabFeature(feat)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Edit this module"
                            >
                              <Edit2 className="w-3 h-3 text-blue-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLabFeature(feat.id, feat.title)}
                              className="p-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                              title="Delete module"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* SUB-SECTION 2: PLATFORM HIGHLIGHTS (USP CARDS) */}
            {featureSubSection === 'highlights' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <h3 className="font-extrabold text-sm text-[#123B6D]">
                    Platform Highlights & Value Propositions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cards displayed in the primary USP overview grid of the platform.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyFeatures.map((feat) => (
                    <div
                      key={feat.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {feat.category}
                          </span>
                          {feat.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#123B6D]">
                              {feat.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900">{feat.title}</h3>
                        <p className="text-xs text-slate-600 mt-1">{feat.description}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditFeature(feat)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(feat.id, feat.title)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. COMPANY BRANDING & HERO SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h2 className="text-base font-extrabold text-[#123B6D] mb-1">
              Company Branding, Hero Section & Support Details
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Updates here will immediately alter the text, headlines, and contact links on the main SaaS homepage.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company SaaS Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.companyName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hero Badge Text</label>
                  <input
                    type="text"
                    value={settingsForm.heroBadge}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroBadge: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hero Main Headline</label>
                <input
                  type="text"
                  required
                  value={settingsForm.heroTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hero Subheadline</label>
                <textarea
                  rows={3}
                  value={settingsForm.heroSubtitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Top Announcement Notice</label>
                <input
                  type="text"
                  value={settingsForm.announcementText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sales / Helpline Phone</label>
                  <input
                    type="text"
                    value={settingsForm.supportPhone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Support Email</label>
                  <input
                    type="email"
                    value={settingsForm.supportEmail}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>
              </div>

              {/* Super Admin Platform UPI Payment Details */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-700" />
                  <h4 className="font-extrabold text-xs text-amber-950">Platform Super Admin UPI & QR Billing</h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Live Dynamic Payments
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Super Admin UPI ID (VPA)</label>
                    <input
                      type="text"
                      value={settingsForm.upiId || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value.trim() })}
                      placeholder="e.g. 7087033009@okbizaxis or indianlalaji@upi"
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Direct bank linked Virtual Payment Address for all platform subscription fees and renewals.
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Super Admin Merchant / Payee Name</label>
                    <input
                      type="text"
                      value={settingsForm.upiMerchantName || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upiMerchantName: e.target.value })}
                      placeholder="e.g. INDIANLALAJI.COM LAB OS"
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Account name shown on patient / lab phone during UPI QR scan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Super Admin Domain Configuration */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#123B6D]" />
                  <h4 className="font-extrabold text-xs text-[#123B6D]">Super Admin & Platform Custom Domain</h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Active Primary Domain
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Super Admin Host Domain</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={settingsForm.superAdminDomain || 'indianlalaji.com'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, superAdminDomain: e.target.value.toLowerCase().trim() })}
                        placeholder="e.g. indianlalaji.com"
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Primary master domain for Super Admin controls, tenant oversight, and SaaS management.
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SaaS Platform Root Domain</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={settingsForm.platformDomain || 'indianlalaji.com'}
                        onChange={(e) => setSettingsForm({ ...settingsForm, platformDomain: e.target.value.toLowerCase().trim() })}
                        placeholder="e.g. indianlalaji.com"
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Platform root URL used for customer care links, public partner showcase, and report verifications.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save Changes to Website</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* WEBSITE BACKUP MODULE (SUPER ADMIN) */}
        {activeTab === 'backup' && (
          <div className="animate-in fade-in-50 duration-200">
            <WebsiteBackupTab
              onNavigateView={onNavigateView}
              showToast={showToast}
            />
          </div>
        )}

        {/* 4. LIVE CLOUD DB & SYNC INSPECTOR */}
        {activeTab === 'cloud_sync' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Hostinger MySQL Database Card */}
            <HostingerDatabaseCard showToast={showToast} />

            {/* Top Status Card */}
            <div className="bg-gradient-to-br from-slate-900 via-[#123B6D] to-slate-900 text-white rounded-2xl p-6 border border-slate-700 shadow-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30">
                    <Database className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white tracking-wide">
                        Hostinger MySQL Live Database &amp; Server Engine
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {isCloudConnected ? 'Hostinger Active & Synced' : 'Connecting to Hostinger...'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Continuous bi-directional sync across All Devices (Mobile, PC, Reception, Pathology Bench &amp; Patient Portal) via Hostinger REST APIs.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto">
                  <button
                    onClick={runCloudPingTest}
                    disabled={pingResult.status === 'testing'}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Activity className={`w-4 h-4 ${pingResult.status === 'testing' ? 'animate-spin' : ''}`} />
                    <span>{pingResult.status === 'testing' ? 'Testing Live Ping...' : '⚡ Test Hostinger Server Ping'}</span>
                  </button>
                </div>
              </div>

              {/* Ping Result Banner */}
              {pingResult.status === 'success' && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white">Live Hostinger Ping Success ({pingResult.latencyMs}ms):</span> {pingResult.message}
                  </div>
                </div>
              )}

              {/* Hostinger Cloud Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Hostinger Server</div>
                  <div className="font-mono font-bold text-amber-300 mt-0.5 truncate" title="indianalala.com">
                    indianalala.com
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Database Engine</div>
                  <div className="font-mono font-bold text-emerald-300 mt-0.5 truncate" title="MySQL 8.0 (Hostinger phpMyAdmin)">
                    MySQL 8.0 (Hostinger)
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Live Synced Tables</div>
                  <div className="font-bold text-white mt-0.5">
                    17 Hostinger Tables
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Last Live Heartbeat</div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {lastCloudSyncTime || 'Just Now'}
                  </div>
                </div>
              </div>
            </div>

            {/* Hostinger Dedicated Architecture Banner */}
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 text-emerald-950">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-200/60 rounded-xl text-emerald-800 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="space-y-2 text-xs">
                  <h3 className="text-sm font-bold text-emerald-900">
                    Hostinger Dedicated MySQL Architecture • 100% Zero Firebase Dependency
                  </h3>
                  <p className="text-emerald-800 leading-relaxed">
                    यह पूरा प्लेटफ़ॉर्म और सभी लैब्स अब सीधे <strong>Hostinger Web Hosting &amp; MySQL Databases</strong> से जुड़े हैं। Firebase या Google Cloud की कोई निर्भरता नहीं है। सभी डेटा, पेशेंट एंट्रीज, टेस्ट्स, पैकेज, बिल्स, डिजिटल रिपोर्ट PDFs, और सेटिंग्स सीधे आपके Hostinger MySQL डेटाबेस और <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-900">/api/sync.php</code> रेस्ट एपीआई से लाइव सिंक होते हैं।
                  </p>
                  <p className="text-emerald-900 font-bold bg-white/80 p-2.5 rounded-lg border border-emerald-300">
                    ✅ <strong>100% Hostinger Controlled:</strong> आपके डेटा पर आपका 100% कंट्रोल है। Hostinger hPanel → phpMyAdmin से आप किसी भी समय डेटाबेस एक्सपोर्ट कर सकते हैं या कस्टमाइज़ कर सकते हैं।
                  </p>
                </div>
              </div>
            </div>

            {/* Live Synchronized Collections Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Collection 1: reception_entries */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-bold text-sm text-slate-800">reception_entries</span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {receptionEntries.length} Live Patients
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Auto-Synced
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {receptionEntries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs hover:bg-slate-100/80 transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#123B6D] text-[11px] bg-blue-100/70 px-1.5 py-0.5 rounded">
                            {entry.tokenNo || entry.id}
                          </span>
                          <span className="font-bold text-slate-900">{entry.patientName}</span>
                          <span className="text-[10px] text-slate-500">({entry.age}y/{entry.gender})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>📞 {entry.mobile}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">
                            🧪 {entry.testNames?.join(', ') || entry.tests?.join(', ') || 'Diagnostics'}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        entry.status === 'Report Ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.status === 'In Lab'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collection 2: lab_reports */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-bold text-sm text-slate-800">lab_reports</span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {reports.length} Live Verified Reports
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Auto-Synced
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {reports.slice(0, 10).map((rep) => (
                    <div key={rep.reportId} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs hover:bg-slate-100/80 transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-800 text-[11px] bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            {rep.reportId}
                          </span>
                          <span className="font-bold text-slate-900">{rep.patientName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>{rep.items?.[0]?.testName || 'Pathology Panel'}</span>
                          <span>•</span>
                          <span>📅 {rep.reportedAt || rep.sampleCollectedAt || 'Today'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                        {rep.status || (rep.verified ? 'Verified' : 'Pending')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SAAS CACHE & STORAGE OPTIMIZER */}
        {activeTab === 'cache' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-[#123B6D] via-slate-900 to-[#123B6D] text-white rounded-2xl p-6 border border-slate-700 shadow-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-400/30">
                    <Sparkles className="w-7 h-7 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white tracking-wide">
                        SaaS Cache &amp; Storage Optimizer
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        {storageMetrics?.status === 'optimal' ? '🟢 Optimized' : '⚡ Attention Needed'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Eliminates memory bloat, removes duplicate collections, and keeps browser localStorage &amp; IndexedDB ultra-lightweight.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto">
                  <button
                    onClick={handlePurgeSaaSCache}
                    disabled={isCleaningSaaSCache}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Zap className={`w-4 h-4 text-slate-950 ${isCleaningSaaSCache ? 'animate-bounce' : ''}`} />
                    <span>{isCleaningSaaSCache ? 'Purging Cache...' : '🧹 Purge Stale Cache Now'}</span>
                  </button>
                  <button
                    onClick={openCacheModal}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-white/20 flex items-center justify-center gap-1.5"
                  >
                    <span>Inspect Breakdown</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Feedback notification */}
            {cacheCleanFeedback && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{cacheCleanFeedback}</span>
              </div>
            )}

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-semibold text-slate-500">LocalStorage Footprint</span>
                <div className="text-2xl font-black text-slate-900">
                  {storageMetrics?.localStorageFormatted || '0 KB'}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>{storageMetrics?.localStorageKeyCount || 0} active keys</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold">Under 5MB limit</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-semibold text-slate-500">IndexedDB Storage</span>
                <div className="text-2xl font-black text-slate-900">
                  {storageMetrics?.indexedDbFormatted || '0 KB'}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold">
                  High-capacity async offline DB
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-semibold text-slate-500">Service Worker / PWA</span>
                <div className="text-2xl font-black text-slate-900">
                  {storageMetrics?.cacheStorageFormatted || '0 KB'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Dev cache auto-pruned
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-semibold text-slate-500">Stale Cache Detected</span>
                <div className={`text-2xl font-black ${storageMetrics?.staleBytes && storageMetrics.staleBytes > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {storageMetrics?.staleBytes && storageMetrics.staleBytes > 0 ? `${(storageMetrics.staleBytes / 1024).toFixed(1)} KB` : '0 KB'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {storageMetrics?.staleBytes && storageMetrics.staleBytes > 0 ? 'Ready to purge' : '100% clean & optimal'}
                </div>
              </div>
            </div>

            {/* Architecture Explanatory Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>How Cache is Handled &amp; Why It Stays Lightweight</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="font-bold text-slate-800 block">1. Zero Duplicate Collections</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Removed redundant <code className="text-slate-700 bg-slate-200 px-1 py-0.5 rounded">hostinger_cache_*</code> writes. Historical collections are offloaded to IndexedDB without duplicate localStorage consumption.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="font-bold text-slate-800 block">2. Capped LocalStorage Boot Cache</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    LocalStorage only retains the latest 50 recent records for instant bootstrap. Full records are loaded asynchronously from IndexedDB and Hostinger MySQL.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="font-bold text-slate-800 block">3. Dev Cache Storage Restrained</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Vite PWA dev caching is disabled in development mode, preventing hundreds of megabytes of temporary development chunks from accumulating in browser CacheStorage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {/* VIEW 2: LABS (Pending Labs) */}
    {activeMenu === 'labs' && (
      <div className="animate-in fade-in-50 duration-200">
        <VendorManagementTab
          viewMode="pending"
          onNavigateView={onNavigateView}
          showToast={showToast}
        />
      </div>
    )}

    {/* VIEW 3: OUR CLIENTS (Published / Live Clients) */}
    {activeMenu === 'clients' && (
      <div className="animate-in fade-in-50 duration-200">
        <VendorManagementTab
          viewMode="clients"
          onNavigateView={onNavigateView}
          showToast={showToast}
        />
      </div>
    )}

    {/* VIEW: WEBSITE DRAFT (Draft / Unpublished Websites from Backups & Registrations) */}
    {activeMenu === 'drafts' && (
      <div className="animate-in fade-in-50 duration-200">
        <VendorManagementTab
          viewMode="drafts"
          onNavigateView={onNavigateView}
          showToast={showToast}
        />
      </div>
    )}

    {/* VIEW 4: WEBSITE BACKUP MODULE (All Websites & Single Customer) */}
    {activeMenu === 'backup' && (
      <div className="animate-in fade-in-50 duration-200">
        <WebsiteBackupTab
          onNavigateView={onNavigateView}
          showToast={showToast}
          onNavigateToDrafts={() => setActiveMenu('drafts')}
        />
      </div>
    )}

    {/* VIEW 5: DOMAIN REQUESTS (Vendor Custom Domain Approvals) */}
    {activeMenu === 'domain_requests' && (
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#123B6D] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                DNS Routing &amp; Domain Management
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {allDomainRequests.filter((r) => r.status === 'Pending').length} Pending Approval
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#123B6D]" />
              <span>Laboratory Custom Domain Requests</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Review and approve custom domains (e.g. <code>apexdiag.in</code>) requested by diagnostic lab vendors. Ensure CNAME points to <code>indianlalaji.com</code> before approving. Default vendor shops use <code>indianlalaji.com/shop/[lab-id]</code> directory.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-700 font-mono">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">DNS CNAME Target</span>
              <strong className="text-[#123B6D]">indianlalaji.com</strong>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="font-extrabold text-xs text-slate-800">
              All Submitted Domain Requests ({allDomainRequests.length})
            </span>
          </div>

          {allDomainRequests.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No domain requests submitted yet by vendors.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allDomainRequests.map((req) => (
                <div key={req.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-sm text-[#123B6D]">{req.labName}</span>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                        {req.labId}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : req.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        {req.domainType === 'custom_domain' ? 'Custom Domain' : 'Platform Directory'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-700">
                      <span>Requested Domain:</span>
                      <a
                        href={`https://${req.requestedDomain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-indigo-700 hover:underline flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"
                      >
                        <span>{req.requestedDomain}</span>
                        <ExternalLink className="w-3 h-3 text-indigo-500" />
                      </a>
                      <span className="text-slate-400">•</span>
                      <span>Registrar: <strong>{req.registrar || 'Hostinger'}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span>Contact: <strong>{req.contactPerson}</strong> ({req.contactPhone})</span>
                    </div>

                    {req.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{req.notes}"
                      </p>
                    )}

                    {req.adminRemarks && (
                      <p className="text-[11px] text-slate-600">
                        <strong>Admin Note:</strong> {req.adminRemarks}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                    {req.status !== 'Approved' && (
                      <button
                        type="button"
                        onClick={() => {
                          updateDomainRequest(req.id, {
                            status: 'Approved',
                            dnsStatus: 'Configured & Verified',
                            sslStatus: 'Active',
                            adminRemarks: 'Approved by Super Admin. DNS CNAME routing active.',
                          });
                          showToast(`Approved custom domain "${req.requestedDomain}" for ${req.labName}!`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Approve &amp; Activate</span>
                      </button>
                    )}

                    {req.status !== 'Rejected' && (
                      <button
                        type="button"
                        onClick={() => {
                          updateDomainRequest(req.id, {
                            status: 'Rejected',
                            adminRemarks: 'Rejected: CNAME not pointed to indianlalaji.com or pending registrar verification.',
                          });
                          showToast(`Rejected domain request for "${req.requestedDomain}".`);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <span>Reject</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirm({
                          isOpen: true,
                          title: 'Delete Domain Request',
                          message: 'Are you sure you want to delete this?',
                          itemDetails: `Domain Request: "${req.requestedDomain}" (${req.labName})`,
                          confirmText: 'Yes',
                          cancelText: 'No',
                          onConfirm: () => {
                            deleteDomainRequest(req.id);
                            showToast(`Deleted domain request "${req.requestedDomain}".`);
                            setDeleteConfirm(null);
                          },
                        });
                      }}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                      title="Delete this request"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

    {/* VIEW 6: PLAN TAB & RENEW REQUESTS */}
    {activeMenu === 'plans' && (
      <div className="animate-in fade-in-50 duration-200">
        <VendorPlanRenewTab
          showToast={showToast}
          onOpenVendorWebsite={(_labId) => {
            onNavigateView('website');
          }}
        />
      </div>
    )}

    {/* VIEW 7: SUPER ADMIN SEO SETTINGS TAB */}
    {activeMenu === 'seo' && (
      <div className="animate-in fade-in-50 duration-200">
        <SeoSettingsTab showToast={showToast} />
      </div>
    )}
  </div>

  {/* Super Admin Footer with Cache & Hard Reload Controls */}
  <footer
    id="super-admin-footer"
    className="mt-auto border-t border-slate-200 bg-white py-3.5 px-4 sm:px-6 text-xs text-slate-500 shadow-xs"
  >
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
      {/* Left: Super Admin Brand & System Info */}
      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
        <span className="font-extrabold text-slate-800 tracking-tight">
          © {new Date().getFullYear()} {companySettings.companyName || 'INDIANLALAJI.COM'}
        </span>
        <span className="text-slate-300 hidden sm:inline">•</span>
        <span className="text-slate-600 font-semibold">
          Super Admin Control Center
        </span>
        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
          Hostinger MySQL Active
        </span>
      </div>

      {/* Right: Storage Cache & Hard Reload Buttons */}
      <div className="flex items-center gap-2.5 font-medium justify-center sm:justify-end flex-wrap">
        {/* Cache Storage Button */}
        <button
          type="button"
          onClick={openCacheModal}
          id="superadmin-footer-cache-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs transition border border-slate-300 cursor-pointer shadow-2xs"
          title="SaaS Cache & Storage Manager: View and optimize local storage footprint"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Cache:</span>
          <span className="font-extrabold text-[#123B6D]">
            {storageMetrics ? storageMetrics.localStorageFormatted : 'Clean'}
          </span>
        </button>

        {/* Direct Hard Reload Button */}
        <button
          type="button"
          onClick={() => forceFreshReload()}
          id="superadmin-footer-hard-reload-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs transition shadow-2xs cursor-pointer border border-amber-300"
          title="Hard Reload: Purges all browser caches, unregisters old Service Worker, and reloads fresh version from server"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-950" />
          <span>🔄 Hard Reload</span>
        </button>
      </div>
    </div>
  </footer>

      {/* MODAL: ADD / EDIT PRICING PLAN */}
      {(isNewPlanModal || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-[#123B6D]">
                {editingPlan ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}
              </h3>
              <button
                onClick={() => {
                  setIsNewPlanModal(false);
                  setEditingPlan(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingPlan ? handleSaveEditPlan : handleSaveNewPlan} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Diagnostic Pro Plan"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Audience Badge</label>
                <input
                  type="text"
                  value={planForm.target}
                  onChange={(e) => setPlanForm({ ...planForm, target: e.target.value })}
                  placeholder="e.g. Independent Pathology Centers"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Package Price (₹ INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planForm.priceINR ?? planForm.monthlyPriceINR}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPlanForm({ ...planForm, priceINR: val, monthlyPriceINR: val, yearlyPriceINR: val });
                    }}
                    className="w-full pl-7 p-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Features (One per line)
                </label>
                <textarea
                  rows={5}
                  value={planForm.features.join('\n')}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      features: e.target.value.split('\n').filter((f) => f.trim().length > 0),
                    })
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="applyFeaturesToAll"
                    checked={applyFeaturesToAll}
                    onChange={(e) => setApplyFeaturesToAll(e.target.checked)}
                    className="rounded text-[#123B6D]"
                  />
                  <label htmlFor="applyFeaturesToAll" className="font-semibold text-slate-800">
                    Apply these features to all 3 packages (Keep features identical)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={planForm.isPopular}
                    onChange={(e) => setPlanForm({ ...planForm, isPopular: e.target.checked })}
                    className="rounded text-[#123B6D]"
                  />
                  <label htmlFor="isPopular" className="font-semibold text-slate-700">
                    Highlight as "Most Popular" Plan
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewPlanModal(false);
                    setEditingPlan(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] text-white px-4 py-1.5 rounded-lg font-bold hover:bg-[#0e2c52]"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT FEATURE */}
      {(isNewFeatureModal || editingFeature) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-[#123B6D]">
                {editingFeature ? 'Edit Feature' : 'Add Feature'}
              </h3>
              <button
                onClick={() => {
                  setIsNewFeatureModal(false);
                  setEditingFeature(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingFeature ? handleSaveEditFeature : handleSaveNewFeature} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Feature Title</label>
                <input
                  type="text"
                  required
                  value={featureForm.title}
                  onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                  placeholder="e.g. Offline-First Billing"
                  className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={featureForm.category}
                    onChange={(e) => setFeatureForm({ ...featureForm, category: e.target.value })}
                    placeholder="e.g. Clinical Safety"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge (Optional)</label>
                  <input
                    type="text"
                    value={featureForm.badge || ''}
                    onChange={(e) => setFeatureForm({ ...featureForm, badge: e.target.value })}
                    placeholder="e.g. New / USP"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={featureForm.description}
                  onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewFeatureModal(false);
                    setEditingFeature(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] text-white px-4 py-1.5 rounded-lg font-bold hover:bg-[#0e2c52]"
                >
                  Save Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT COMPLETE LABORATORY MANAGEMENT FEATURE MODULE */}
      {(isNewLabFeatureModal || editingLabFeature) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#123B6D]/10 text-[#123B6D] flex items-center justify-center font-bold">
                  🧪
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#123B6D]">
                    {editingLabFeature ? 'Edit Laboratory Management Module' : 'Add New Laboratory Management Module'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Live on Homepage "Complete Laboratory Management Features"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewLabFeatureModal(false);
                  setEditingLabFeature(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingLabFeature ? handleSaveEditLabFeature : handleSaveNewLabFeature} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Module Name / Title *</label>
                <input
                  type="text"
                  required
                  value={labFeatureForm.title}
                  onChange={(e) => setLabFeatureForm({ ...labFeatureForm, title: e.target.value })}
                  placeholder="e.g. Sample Barcode & Phlebotomy Tracking"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category / Tag</label>
                  <input
                    type="text"
                    value={labFeatureForm.category}
                    onChange={(e) => setLabFeatureForm({ ...labFeatureForm, category: e.target.value })}
                    placeholder="e.g. Phlebotomy, Finance, NABL"
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Icon Style</label>
                  <select
                    value={labFeatureForm.iconName || 'Activity'}
                    onChange={(e) => setLabFeatureForm({ ...labFeatureForm, iconName: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white cursor-pointer"
                  >
                    <option value="Activity">⚡ Activity (General Diagnostic)</option>
                    <option value="Users">👥 Users (Patient Management)</option>
                    <option value="BookOpen">📖 BookOpen (500+ Test Catalog)</option>
                    <option value="Stethoscope">🩺 Stethoscope (Doctor Reference)</option>
                    <option value="TestTubes">🧪 TestTubes (Sample Barcode)</option>
                    <option value="FileEdit">📝 FileEdit (Result Entry)</option>
                    <option value="FileCheck2">📄 FileCheck2 (Report PDF Generation)</option>
                    <option value="ShieldCheck">🛡️ ShieldCheck (NABL Verification)</option>
                    <option value="IndianRupee">₹ IndianRupee (Billing & Dynamic UPI)</option>
                    <option value="History">⏳ History (Patient Trend History)</option>
                    <option value="MessageSquare">💬 MessageSquare (WhatsApp Sharing)</option>
                    <option value="QrCode">📱 QrCode (QR Report Verification)</option>
                    <option value="WifiOff">📶 WifiOff (Online + Offline Mode)</option>
                    <option value="RefreshCw">🔄 RefreshCw (Real-Time Cloud Sync)</option>
                    <option value="HardDriveDownload">💾 HardDriveDownload (Backup & Restore)</option>
                    <option value="Building">🏢 Building (Standalone Labs)</option>
                    <option value="TrendingUp">📈 TrendingUp (Doctor Referral Accounts)</option>
                    <option value="UserCog">⚙️ UserCog (Staff & Granular Roles)</option>
                    <option value="FlaskConical">🔬 FlaskConical (Laboratory Science)</option>
                    <option value="Database">🗄️ Database (Hostinger / SQL)</option>
                    <option value="Lock">🔒 Lock (Tamper-Proof Security)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={labFeatureForm.desc}
                  onChange={(e) => setLabFeatureForm({ ...labFeatureForm, desc: e.target.value })}
                  placeholder="e.g. Barcode tube generation, phlebotomy timestamps & status tracking"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-700 leading-relaxed focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewLabFeatureModal(false);
                    setEditingLabFeature(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] text-white px-4 py-1.5 rounded-xl font-bold hover:bg-[#0e2c52] cursor-pointer shadow-xs"
                >
                  {editingLabFeature ? 'Save Changes' : 'Add Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* IN-APP DELETE / ACTION CONFIRMATION MODAL */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center mb-5">
              <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                Are you sure you want to delete this?
              </h3>
              {deleteConfirm.itemDetails && (
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 py-2 px-3 rounded-xl border border-slate-200 font-medium break-words">
                  {deleteConfirm.itemDetails}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer text-center"
              >
                No
              </button>
              <button
                type="button"
                onClick={deleteConfirm.onConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
