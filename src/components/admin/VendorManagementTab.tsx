import React, { useState, useMemo, useRef } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  Trash2,
  Edit2,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  IndianRupee,
  Receipt,
  FileCheck,
  ChevronDown,
  X,
  Sparkles,
  ArrowRight,
  Filter,
  Globe,
  FileText,
  Copy,
  Check,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Package,
  Upload,
  Download,
  HardDriveDownload,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { VendorLabDirectoryItem, VendorStatus, AppView } from '../../types';
import { getTenantDirectUrl, getTenantSubdomain } from '../../constants/domains';

interface VendorManagementTabProps {
  onNavigateView: (view: AppView) => void;
  showToast: (msg: string) => void;
  viewMode?: 'pending' | 'clients' | 'drafts' | 'all';
}

export const VendorManagementTab: React.FC<VendorManagementTabProps> = ({
  onNavigateView,
  showToast,
  viewMode = 'all',
}) => {
  const {
    vendorLabsList,
    addVendorLab,
    updateVendorLab,
    updateVendorLabCredentials,
    deleteVendorLab,
    setVendorStatus,
    selectVendorLab,
    superAdminTenantScope,
    setSuperAdminTenantScope,
    importAllWebsitesBackup,
    importSingleCustomerWebsiteBackup,
    refreshCloudData,
  } = useCms();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | VendorStatus>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorLabDirectoryItem | null>(null);
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState<VendorLabDirectoryItem | null>(null);
  const [draftVisitVendor, setDraftVisitVendor] = useState<VendorLabDirectoryItem | null>(null);
  const [copiedLabId, setCopiedLabId] = useState<string | null>(null);

  // Change Password Modal State
  const [passwordVendor, setPasswordVendor] = useState<VendorLabDirectoryItem | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    pin: '123456',
    showPassword: false,
  });

  // Direct Website Draft Backup Upload State & Handler
  const draftBackupFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDraftBackup, setIsUploadingDraftBackup] = useState(false);

  const handleDraftBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDraftBackup(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Selected file does not contain a valid JSON backup object.');
        }

        const isMaster = Boolean(
          (Array.isArray(parsed.websites) && parsed.websites.length > 0) ||
          parsed.settingsMap
        );

        if (isMaster) {
          const res = importAllWebsitesBackup(parsed);
          if (!res.success) {
            throw new Error(res.message || 'Failed to restore master backup.');
          }
          showToast(`✅ Master backup uploaded! ${res.count || 'All'} website(s) saved to Website Draft. Pehle Draft me save ho gaya hai, ab yahan se manually Publish karein.`);
        } else {
          const phoneFromFile = (
            parsed.customerNumber ||
            parsed.customerPhone ||
            parsed.labDetails?.phone ||
            parsed.phone ||
            parsed.settings?.phone ||
            ''
          ).trim();
          const targetPhoneOrId = phoneFromFile || '9876543210';
          const res = importSingleCustomerWebsiteBackup(parsed, targetPhoneOrId);
          if (!res.success) {
            throw new Error(res.message || 'Failed to restore website backup.');
          }
          const activeLabName = res.customerName || parsed.labName || parsed.labDetails?.name || 'Customer Lab';
          showToast(`✅ Backup for "${activeLabName}" loaded into Website Draft! Pehle Draft me save ho gaya hai, ab Publish karein.`);
        }

        if (draftBackupFileInputRef.current) {
          draftBackupFileInputRef.current.value = '';
        }

        refreshCloudData().catch(() => {});
      } catch (err: any) {
        showToast(`❌ Backup upload error: ${err.message || 'Invalid backup file'}`);
      } finally {
        setIsUploadingDraftBackup(false);
      }
    };
    reader.onerror = () => {
      showToast('❌ Failed to read backup file.');
      setIsUploadingDraftBackup(false);
    };
    reader.readAsText(file);
  };

  // Form state for add / edit
  const initialFormState: Omit<VendorLabDirectoryItem, 'id'> = {
    name: '',
    tagline: 'Precision Diagnostics & Pathology Services',
    ownerName: '',
    phone: '',
    email: '',
    password: 'owner123',
    pin: '123456',
    city: '',
    state: 'Punjab',
    address: '',
    nablCode: '',
    badge: 'Draft - Pending Admin Approval',
    rating: 4.9,
    activePackages: 12,
    turnaroundTime: '6-8 Hours',
    emergency: true,
    color: '#123B6D',
    status: 'Draft',
    isWebsiteApproved: false,
    subscriptionPlan: 'Professional Lab Plan',
    subscriptionAmount: 1999,
    paymentMode: 'UPI / QR Code',
    paymentReference: '',
    paymentNotes: '',
    joinedDate: new Date().toISOString().split('T')[0],
    domainPreview: '',
    establishedYear: 2018,
    reviewsCount: 140,
    features: ['WhatsApp Reports', 'Home Collection', 'NABL Format', 'Thermal Barcode'],
  };

  const [formState, setFormState] = useState<Omit<VendorLabDirectoryItem, 'id'>>(initialFormState);
  const [editShowPassword, setEditShowPassword] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const total = vendorLabsList.length;
    const draft = vendorLabsList.filter((v) => v.status === 'Draft').length;
    const active = vendorLabsList.filter((v) => v.status === 'Active').length;
    const pending = vendorLabsList.filter((v) => v.status === 'Pending').length;
    const processingPayment = vendorLabsList.filter(
      (v) => v.status === 'Processing due to payment confirmation'
    ).length;
    const suspended = vendorLabsList.filter((v) => v.status === 'Suspended').length;
    return { total, draft, active, pending, processingPayment, suspended };
  }, [vendorLabsList]);

  // Unique cities for filter
  const cities = useMemo(() => {
    const set = new Set<string>();
    vendorLabsList.forEach((v) => {
      if (v.city) set.add(v.city);
    });
    return Array.from(set).sort();
  }, [vendorLabsList]);

  // Filtered list
  const filteredVendors = useMemo(() => {
    return vendorLabsList.filter((v) => {
      if (viewMode === 'pending') {
        // Pending Labs: Sirf wahi labs jo Active nahi hain (Pending, Draft, Processing due to payment confirmation)
        if (v.status === 'Active') return false;
      } else if (viewMode === 'clients') {
        // Our Clients: Sirf Active users / Published labs hi dikhao (Strictly Active only)
        if (v.status !== 'Active') return false;
      } else if (viewMode === 'drafts') {
        // Website Draft Tab: Strictly Draft / Unpublished labs only
        if (v.status !== 'Draft' && v.isWebsiteApproved) return false;
      } else if (statusFilter !== 'All' && v.status !== statusFilter) {
        return false;
      }

      const matchesCity = selectedCity === 'All' ? true : v.city === selectedCity;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        (v.ownerName && v.ownerName.toLowerCase().includes(q)) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.city && v.city.toLowerCase().includes(q)) ||
        (v.nablCode && v.nablCode.toLowerCase().includes(q)) ||
        (v.paymentReference && v.paymentReference.toLowerCase().includes(q));

      return matchesCity && matchesSearch;
    });
  }, [vendorLabsList, statusFilter, selectedCity, searchQuery, viewMode]);

  // Handlers
  const handleOpenAddModal = () => {
    setFormState({
      ...initialFormState,
      status: 'Draft',
      isWebsiteApproved: false,
      badge: 'Draft - Pending Admin Approval',
      joinedDate: new Date().toISOString().split('T')[0],
      password: 'owner123',
      pin: '123456',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (vendor: VendorLabDirectoryItem) => {
    setEditingVendor(vendor);
    setFormState({
      name: vendor.name,
      tagline: vendor.tagline || 'Precision Diagnostics & Pathology Services',
      ownerName: vendor.ownerName || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      password: vendor.password || 'owner123',
      pin: vendor.pin || '123456',
      city: vendor.city || '',
      state: vendor.state || 'Punjab',
      address: vendor.address || '',
      nablCode: vendor.nablCode || '',
      badge: vendor.badge || (vendor.status === 'Draft' ? 'Draft - Pending Admin Approval' : 'Verified Lab'),
      rating: vendor.rating || 4.8,
      activePackages: vendor.activePackages || 10,
      turnaroundTime: vendor.turnaroundTime || '6-8 Hours',
      emergency: vendor.emergency ?? true,
      color: vendor.color || '#123B6D',
      status: vendor.status || 'Draft',
      isWebsiteApproved: vendor.isWebsiteApproved ?? (vendor.status === 'Active'),
      subscriptionPlan: vendor.subscriptionPlan || 'Professional Lab Plan',
      subscriptionAmount: vendor.subscriptionAmount || 1999,
      paymentMode: vendor.paymentMode || 'UPI / QR Code',
      paymentReference: vendor.paymentReference || '',
      paymentNotes: vendor.paymentNotes || '',
      joinedDate: vendor.joinedDate || new Date().toISOString().split('T')[0],
      domainPreview: vendor.domainPreview || '',
      establishedYear: vendor.establishedYear || 2018,
      reviewsCount: vendor.reviewsCount || 100,
      features: vendor.features || ['WhatsApp Reports', 'Home Collection'],
    });
  };

  const handleOpenPasswordModal = (vendor: VendorLabDirectoryItem) => {
    setPasswordVendor(vendor);
    setPasswordForm({
      password: vendor.password || 'owner123',
      pin: vendor.pin || '123456',
      showPassword: false,
    });
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordVendor) return;
    if (!passwordForm.password.trim()) {
      showToast('Please enter a valid password (कम से कम 4 अक्षर)');
      return;
    }
    const cleanPass = passwordForm.password.trim();
    const cleanPin = passwordForm.pin.trim() || '123456';

    updateVendorLab(passwordVendor.id, {
      password: cleanPass,
      pin: cleanPin,
    });
    updateVendorLabCredentials(passwordVendor.id, cleanPass, cleanPin);

    showToast(`Password successfully changed for ${passwordVendor.name}! New password: "${cleanPass}"`);
    setPasswordVendor(null);
  };

  const handleSubmitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      showToast('Please enter the laboratory name');
      return;
    }

    const isApproved = formState.status === 'Active';
    const autoSlug = formState.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'newlab';
    const cleanId = (formState.domainPreview || '')
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^indianlalaji\.com\/shop\//, '')
      .replace(/\.indianlalaji\.com$/, '')
      .replace(/[^a-z0-9-]/g, '') || (editingVendor ? editingVendor.id : `lab-${autoSlug}`);
    const normalizedLabId = cleanId.startsWith('lab-') ? cleanId : `lab-${cleanId}`;
    const finalDirectoryUrl = `indianlalaji.com/shop/${normalizedLabId}`;

    if (editingVendor) {
      updateVendorLab(editingVendor.id, {
        ...formState,
        domainPreview: finalDirectoryUrl,
        websiteUrl: `https://${finalDirectoryUrl}`,
        isWebsiteApproved: isApproved,
        password: formState.password,
        pin: formState.pin,
      });
      if (formState.password) {
        updateVendorLabCredentials(editingVendor.id, formState.password, formState.pin);
      }
      showToast(`Updated laboratory: ${formState.name} (https://${finalDirectoryUrl})`);
      setEditingVendor(null);
    } else {
      // When a new website is created, it ALWAYS starts in DRAFT mode
      // Admin approval is strictly required before the website can be visited/live
      addVendorLab({
        ...formState,
        domainPreview: finalDirectoryUrl,
        websiteUrl: `https://${finalDirectoryUrl}`,
        status: 'Draft',
        isWebsiteApproved: false,
        badge: 'Draft - Pending Admin Approval',
      });
      showToast(
        `Created lab "${formState.name}" in DRAFT mode. Directory URL: https://${finalDirectoryUrl}`
      );
      setIsAddModalOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmVendor) {
      deleteVendorLab(deleteConfirmVendor.id);
      showToast(`Deleted laboratory "${deleteConfirmVendor.name}"`);
      setDeleteConfirmVendor(null);
    }
  };

  const handleOpenLabWebsite = (vendor: VendorLabDirectoryItem | string) => {
    const labItem = typeof vendor === 'string' ? vendorLabsList.find((l) => l.id === vendor) : vendor;
    const labId = typeof vendor === 'string' ? vendor : vendor.id;
    selectVendorLab(labId);
    try {
      const slug = labItem?.slug || labId.replace(/^lab-/, '');
      window.history.pushState({}, '', `/shop/${slug}`);
    } catch {}
    onNavigateView('vendor_website');
  };

  const handleOpenVendorReportPage = (vendor: VendorLabDirectoryItem | string) => {
    const labId = typeof vendor === 'string' ? vendor : vendor.id;
    selectVendorLab(labId);
    onNavigateView('patient_portal');
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {viewMode === 'drafts'
                ? 'Website Draft Tab — Review & Publish Websites (वेबसाइट ड्राफ्ट)'
                : viewMode === 'pending'
                ? 'Labs Section — Pending Labs (अप्रूवल पेंडिंग लैब्स)'
                : viewMode === 'clients'
                ? 'Our Clients — Published / Live Labs List (पब्लिश्ड / लाइव क्लाइंट्स)'
                : 'Partner Laboratories & Vendor Management'}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            {viewMode === 'drafts'
              ? 'Backup upload ya nayi registration se aayi sabhi websites pehle yahan Draft mode mein aati hain. Unka branding & catalog review karein aur "Publish" button daba kar manually live karein.'
              : viewMode === 'pending'
              ? 'Search Lab • Lab Status: Pending • Lab Actions: Approval, Live / Visit, Edit, Make Draft, Change Password, Delete (हटाएं)'
              : viewMode === 'clients'
              ? 'Search Client Labs • Lab Status: Published / Live • Actions: Live / Visit, Edit, Make Draft, Change Password, Delete (हटाएं)'
              : 'Control onboarding, approvals, payment confirmation status, and live websites of all diagnostic laboratories hosted on your portal.'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          id="btn-add-new-vendor"
          className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Add New Lab Vendor</span>
        </button>
      </div>

      {/* Hidden file input for direct Website Draft backup upload */}
      <input
        type="file"
        ref={draftBackupFileInputRef}
        onChange={handleDraftBackupFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Website Draft Mode Banner */}
      {viewMode === 'drafts' ? (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-400 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-xs">
              <FileText className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2 flex-wrap">
                <span>Website Draft Queue ({stats.draft} Website(s) in Draft Mode)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 uppercase font-black tracking-wider">
                  Draft Mode • Pehle Review Phir Publish
                </span>
              </h4>
              <p className="text-xs text-amber-900/80 mt-0.5">
                Backup upload ya registration se aayi sabhi websites pehle yahan Draft mein rehti hain. Yahan se <strong>Publish (पब्लिश करें)</strong> button daba kar manually live karein.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto flex-wrap">
            <button
              type="button"
              id="btn-upload-draft-backup"
              onClick={() => {
                if (draftBackupFileInputRef.current) {
                  draftBackupFileInputRef.current.value = '';
                  draftBackupFileInputRef.current.click();
                }
              }}
              disabled={isUploadingDraftBackup}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
              title="Upload website backup directly into Website Draft"
            >
              <Upload className="w-4 h-4 text-slate-950" />
              <span>{isUploadingDraftBackup ? 'Loading...' : 'Upload Backup to Draft (बैकअप लोड करें)'}</span>
            </button>

            {stats.draft > 1 && (
              <button
                type="button"
                id="btn-publish-all-drafts"
                onClick={() => {
                  vendorLabsList
                    .filter((v) => v.status === 'Draft' || !v.isWebsiteApproved)
                    .forEach((v) => setVendorStatus(v.id, 'Active'));
                  showToast(`All ${stats.draft} draft websites published live!`);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Publish All Drafts ({stats.draft})</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        viewMode !== 'clients' && stats.draft > 0 && (
          <div className="bg-amber-50 border-2 border-amber-400 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                  <span>{stats.draft} New Laboratory Website(s) in Draft Mode</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 uppercase font-black tracking-wider">
                    Pending Admin Approval
                  </span>
                </h4>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  New laboratories start in Draft mode so their website remains unpublished until you approve it. Review their setup and click <strong>Approve & Publish Live</strong> to make the website public to patients.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStatusFilter('Draft')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <span>Review {stats.draft} Draft Lab(s)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      )}

      {/* Payment Confirmation Alert Banner (if any lab is in payment confirmation status) */}
      {viewMode !== 'clients' && stats.processingPayment > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>{stats.processingPayment} Lab(s) Awaiting Payment Confirmation</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 uppercase font-black tracking-wider">
                  Action Required
                </span>
              </h4>
              <p className="text-xs text-amber-900/80 mt-0.5">
                New laboratories have submitted onboarding requests with payment references. Review their bank/UPI reference and click <strong>Confirm & Activate</strong> to grant them full access.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter('Processing due to payment confirmation')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span>Review {stats.processingPayment} Lab(s)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      {(!viewMode || viewMode === 'all') && (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => setStatusFilter('All')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'All'
              ? 'bg-white border-[#123B6D] ring-2 ring-[#123B6D]/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Labs</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-500 font-medium">onboarded</span>
          </div>
        </div>

        {/* Draft Mode (Pending Approval) */}
        <div
          onClick={() => setStatusFilter('Draft')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'Draft'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Draft Mode</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{stats.draft}</span>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-200 px-1.5 py-0.2 rounded-full">
              need approval
            </span>
          </div>
        </div>

        {/* Active */}
        <div
          onClick={() => setStatusFilter('Active')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'Active'
              ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Active & Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{stats.active}</span>
            <span className="text-[11px] text-emerald-600 font-medium">operational</span>
          </div>
        </div>

        {/* Processing due to payment confirmation */}
        <div
          onClick={() => setStatusFilter('Processing due to payment confirmation')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'Processing due to payment confirmation'
              ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Payment Due Conf.</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{stats.processingPayment}</span>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-200 px-1.5 py-0.2 rounded-full">
              verify UTR
            </span>
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('Pending')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'Pending'
              ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between text-sky-700 text-xs font-semibold">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-800">{stats.pending}</span>
            <span className="text-[11px] text-sky-600 font-medium">in queue</span>
          </div>
        </div>

        {/* Suspended */}
        <div
          onClick={() => setStatusFilter('Suspended')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            statusFilter === 'Suspended'
              ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>Suspended</span>
            <Ban className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{stats.suspended}</span>
            <span className="text-[11px] text-rose-600 font-medium">disabled</span>
          </div>
        </div>
      </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Lab */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              viewMode === 'pending'
                ? 'Search Lab by Name, Owner, Phone, City, NABL...'
                : viewMode === 'clients'
                ? 'Search Client Lab by Name, Owner, Phone, City...'
                : 'Search lab name, owner, phone, city...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:border-transparent bg-slate-50 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Status Pill for Pending / Live modes */}
        {viewMode === 'pending' && (
          <div className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Lab Status: <strong>Pending Approval ({filteredVendors.length})</strong></span>
          </div>
        )}

        {viewMode === 'clients' && (
          <div className="text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lab Status: <strong>Published / Live ({filteredVendors.length})</strong></span>
          </div>
        )}

        {/* Status Filters (for 'all' viewMode) */}
        {viewMode === 'all' && (
          <div className="flex items-center gap-1 flex-wrap w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(['All', 'Draft', 'Active', 'Processing due to payment confirmation', 'Pending', 'Suspended'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[#123B6D] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {status === 'Processing due to payment confirmation'
                    ? 'Payment Confirmation'
                    : status === 'Draft'
                    ? `Draft (${stats.draft})`
                    : status}
                </button>
              )
            )}
          </div>
        )}

        {/* City Filter */}
        {cities.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none font-semibold text-slate-700"
            >
              <option value="All">All Cities ({vendorLabsList.length})</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Vendor Cards List */}
      <div>
        {filteredVendors.length === 0 ? (
          viewMode === 'drafts' ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-amber-300 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-700">
                <FileText className="w-8 h-8 text-amber-700" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">Website Draft Queue is Empty</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Backup upload ya registration se aayi sabhi websites pehle yahan Draft queue mein aati hain. Yahan se aap review karke <strong>Publish (पब्लिश करें)</strong> kar sakte hain. Naya backup upload karne ke liye niche click karein:
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (draftBackupFileInputRef.current) {
                      draftBackupFileInputRef.current.value = '';
                      draftBackupFileInputRef.current.click();
                    }
                  }}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                >
                  <Upload className="w-4 h-4 text-slate-950" />
                  <span>Upload Backup to Draft (बैकअप लोड करें)</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-4 py-2.5 bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>Create New Lab in Draft</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No laboratories match your criteria</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try adjusting your search keywords or resetting the status filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setSelectedCity('All');
                }}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
            {filteredVendors.map((vendor) => {
              const isApproved = vendor.status === 'Active';

              return (
                <div
                  key={vendor.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  {/* Header: Lab Name */}
                  <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-2xs shrink-0"
                        style={{ backgroundColor: vendor.color || '#123B6D' }}
                      >
                        {vendor.name.charAt(0)}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 truncate" title={vendor.name}>
                        {vendor.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                        viewMode === 'drafts' || !isApproved
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {viewMode === 'drafts' ? 'Draft (Unpublished)' : isApproved ? 'Approved' : 'Hold'}
                    </span>
                  </div>

                  {/* Body: Phone number, Package name */}
                  <div className="p-5 space-y-3 flex-1 bg-white">
                    <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Phone number:
                      </span>
                      <span className="font-extrabold text-slate-900 font-mono text-xs">
                        {vendor.phone || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        Package name:
                      </span>
                      <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg text-xs">
                        {vendor.subscriptionPlan || '1 Month'}
                      </span>
                    </div>
                  </div>

                  {/* Footer: Action Buttons */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    {viewMode === 'drafts' ? (
                      <div className="flex items-center justify-between gap-2 w-full">
                        {/* Publish Live Button */}
                        <button
                          type="button"
                          id={`btn-publish-draft-${vendor.id}`}
                          onClick={() => {
                            setVendorStatus(vendor.id, 'Active');
                            showToast(`✅ "${vendor.name}" website is now Published & Live! Moved to Our Clients.`);
                          }}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                          title="Approve & Publish Website Live"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                          <span>Publish (पब्लिश करें)</span>
                        </button>

                        {/* Preview Draft Website */}
                        <button
                          type="button"
                          onClick={() => handleOpenLabWebsite(vendor.id)}
                          className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          title="Preview Draft Website"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span className="hidden sm:inline">Preview</span>
                        </button>

                        {/* Edit (password only) */}
                        <button
                          type="button"
                          onClick={() => handleOpenPasswordModal(vendor)}
                          className="w-8 h-8 rounded-xl bg-purple-100/80 hover:bg-purple-200 text-purple-800 border border-purple-300 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title="Edit Password"
                        >
                          <KeyRound className="w-4 h-4 text-purple-700" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmVendor(vendor)}
                          className="w-8 h-8 rounded-xl bg-rose-100/80 hover:bg-rose-200 text-rose-700 border border-rose-200 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          {/* Approval or Hold button based on tab / status */}
                          {viewMode === 'clients' || (viewMode === 'all' && isApproved) ? (
                            /* Hold Button in Our client tab */
                            <button
                              type="button"
                              onClick={() => {
                                setVendorStatus(vendor.id, 'Draft');
                                showToast(`"${vendor.name}" ko Hold (Draft) par daal diya gaya.`);
                              }}
                              className="w-8 h-8 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                              title="Hold (होल्ड)"
                              aria-label="Hold"
                            >
                              <Clock className="w-4 h-4 text-amber-800" />
                            </button>
                          ) : (
                            /* Approval Button in Labs tab */
                            <button
                              type="button"
                              onClick={() => {
                                setVendorStatus(vendor.id, 'Active');
                                showToast(`Approved & Live: "${vendor.name}"!`);
                              }}
                              className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                              title="Approval (अप्रूवल)"
                              aria-label="Approval"
                            >
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </button>
                          )}

                          {/* Edit (password only) */}
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(vendor)}
                            className="w-8 h-8 rounded-xl bg-purple-100/80 hover:bg-purple-200 text-purple-800 border border-purple-300 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                            title="Edit (password only)"
                            aria-label="Edit (password only)"
                          >
                            <KeyRound className="w-4 h-4 text-purple-700" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmVendor(vendor)}
                            className="w-8 h-8 rounded-xl bg-rose-100/80 hover:bg-rose-200 text-rose-700 border border-rose-200 transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                            title="Delete (हटाएं)"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>

                        {/* Visit website */}
                        <button
                          type="button"
                          onClick={() => handleOpenLabWebsite(vendor.id)}
                          className="w-8 h-8 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white transition flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                          title="Visit website"
                          aria-label="Visit website"
                        >
                          <Globe className="w-4 h-4 text-amber-300" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Vendor Modal */}
      {(isAddModalOpen || editingVendor) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#123B6D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingVendor ? `Edit Laboratory: ${editingVendor.name}` : 'Add New Laboratory Vendor'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Configure vendor profile, NABL accreditation, and payment verification details
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingVendor(null);
                }}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lab Name */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Laboratory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const autoSlug = newName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
                      setFormState({
                        ...formState,
                        name: newName,
                        domainPreview:
                          !editingVendor && (!formState.domainPreview || formState.domainPreview.includes('.indianlalaji.com'))
                            ? (autoSlug ? `indianlalaji.com/shop/lab-${autoSlug}` : '')
                            : formState.domainPreview,
                      });
                    }}
                    placeholder="e.g. Apex Diagnostics & Imaging Center"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Dedicated Website Directory (Har Lab Ka Apna URL - Directory Format) */}
                <div className="sm:col-span-2 bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-black text-indigo-950 text-xs flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Dedicated Website Directory (Har Lab Ka Apna URL)</span>
                    </label>
                    <span className="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Directory / Path (No Subdomain)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-indigo-300">
                    <span className="text-xs text-indigo-900 font-mono font-bold shrink-0">https://indianlalaji.com/shop/</span>
                    <input
                      type="text"
                      value={
                        (formState.domainPreview || '')
                          .replace(/^https?:\/\//, '')
                          .replace(/^indianlalaji\.com\/shop\//, '')
                          .replace(/\.indianlalaji\.com$/, '')
                      }
                      onChange={(e) => {
                        const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setFormState({
                          ...formState,
                          domainPreview: clean ? `indianlalaji.com/shop/${clean}` : '',
                        });
                      }}
                      placeholder="e.g. lab-apex"
                      className="flex-1 px-2 py-1 bg-transparent text-xs font-mono font-bold text-indigo-950 focus:outline-none"
                    />
                  </div>
                  <div className="text-[11px] text-indigo-900 mt-2 space-y-1">
                    <p className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold">Live Vendor Directory URL:</span>
                      <strong className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-950">
                        https://indianlalaji.com/shop/{
                          (formState.domainPreview || '')
                            .replace(/^https?:\/\//, '')
                            .replace(/^indianlalaji\.com\/shop\//, '')
                            .replace(/\.indianlalaji\.com$/, '') ||
                          editingVendor?.id ||
                          'lab-id'
                        }
                      </strong>
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Rule: Har vendor ka dedicated website URL <strong>indianlalaji.com/shop/...</strong> directory format mein hota hai (subdomain nahi).
                    </p>
                  </div>
                </div>

                {/* Owner / Incharge Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lab Incharge / Owner Name
                  </label>
                  <input
                    type="text"
                    value={formState.ownerName || ''}
                    onChange={(e) => setFormState({ ...formState, ownerName: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Sharma (MD Path)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Helpline / WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formState.email || ''}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="e.g. contact@apexlab.in"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* NABL Code */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NABL / ICMR Accreditation No.
                  </label>
                  <input
                    type="text"
                    value={formState.nablCode}
                    onChange={(e) => setFormState({ ...formState, nablCode: e.target.value })}
                    placeholder="e.g. NABL-MC-2024-998"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Owner Login Password & Access PIN (Super Admin Control) */}
                <div className="sm:col-span-2 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-purple-50 p-4 rounded-2xl border border-purple-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-extrabold text-xs text-purple-950">
                        Owner Login Password & Access Credentials (पासवर्ड व क्रेडेंशियल्स)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-700 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Super Admin Privileged
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-900/90 mb-3 leading-relaxed">
                    Super Admin can directly set or reset this laboratory owner's login password and 6-digit security PIN here.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-purple-950 mb-1">
                        Lab Owner Password (लॉगिन पासवर्ड) *
                      </label>
                      <div className="relative">
                        <input
                          type={editShowPassword ? 'text' : 'password'}
                          required
                          value={formState.password || ''}
                          onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                          placeholder="e.g. owner123"
                          className="w-full pl-3 pr-10 py-2 bg-white border border-purple-300 rounded-xl font-mono text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setEditShowPassword(!editShowPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800 p-1"
                          title={editShowPassword ? 'Hide password' : 'Show password'}
                        >
                          {editShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-purple-700 font-semibold">Presets:</span>
                        {['owner123', 'Apex@2026#', 'LabOwner@123', 'Admin@2026'].map((p) => (
                          <button
                            type="button"
                            key={p}
                            onClick={() => setFormState({ ...formState, password: p })}
                            className="text-[10px] font-bold bg-white text-purple-700 px-1.5 py-0.5 rounded-md border border-purple-200 hover:bg-purple-100 transition shadow-2xs"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-purple-950 mb-1">
                        Security PIN (सुरक्षा पिन - 6 Digits)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={formState.pin || ''}
                        onChange={(e) => setFormState({ ...formState, pin: e.target.value.replace(/\D/g, '') })}
                        placeholder="e.g. 123456"
                        className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl font-mono text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 tracking-wider shadow-2xs"
                      />
                      <span className="text-[10px] text-purple-700 mt-1 block">
                        Default PIN is 123456 (used for quick authorization)
                      </span>
                    </div>
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.city}
                    onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                    placeholder="e.g. Ludhiana"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formState.state}
                    onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                    placeholder="e.g. Punjab"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Physical Address
                  </label>
                  <input
                    type="text"
                    value={formState.address}
                    onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                    placeholder="e.g. SCO 42, Ground Floor, Mall Road Market"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Status Selection (Crucial requirement) */}
                <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-extrabold text-slate-900 text-xs">
                    Current Vendor Status *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formState.status === 'Draft' ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="vendorStatus"
                        value="Draft"
                        checked={formState.status === 'Draft'}
                        onChange={() => setFormState({ ...formState, status: 'Draft' })}
                        className="text-amber-600"
                      />
                      <span>⏳ Draft (Website Hidden - Pending Admin Approval)</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formState.status === 'Active' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="vendorStatus"
                        value="Active"
                        checked={formState.status === 'Active'}
                        onChange={() => setFormState({ ...formState, status: 'Active' })}
                        className="text-emerald-600"
                      />
                      <span>✅ Active (Approved & Website LIVE)</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formState.status === 'Processing due to payment confirmation' ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="vendorStatus"
                        value="Processing due to payment confirmation"
                        checked={formState.status === 'Processing due to payment confirmation'}
                        onChange={() => setFormState({ ...formState, status: 'Processing due to payment confirmation' })}
                        className="text-amber-600"
                      />
                      <span>💳 Processing due to payment confirmation</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formState.status === 'Pending' ? 'bg-sky-50 border-sky-500 text-sky-900 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="vendorStatus"
                        value="Pending"
                        checked={formState.status === 'Pending'}
                        onChange={() => setFormState({ ...formState, status: 'Pending' })}
                        className="text-sky-600"
                      />
                      <span>⏳ Pending (Admin Review)</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formState.status === 'Suspended' ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="vendorStatus"
                        value="Suspended"
                        checked={formState.status === 'Suspended'}
                        onChange={() => setFormState({ ...formState, status: 'Suspended' })}
                        className="text-rose-600"
                      />
                      <span>⛔ Suspended (Temporarily Deactivated)</span>
                    </label>
                  </div>
                </div>

                {/* Subscription & Payment Section */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={formState.subscriptionPlan || 'Professional Lab Plan'}
                    onChange={(e) => setFormState({ ...formState, subscriptionPlan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  >
                    <option value="Starter Lab Plan">Starter Lab Plan (₹999/mo)</option>
                    <option value="Professional Lab Plan">Professional Lab Plan (₹1,999/mo)</option>
                    <option value="Diagnostic Network Plan">Diagnostic Network Plan (₹2,999/mo)</option>
                    <option value="Enterprise Diagnostics">Enterprise Diagnostics (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monthly Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={formState.subscriptionAmount || 1999}
                    onChange={(e) => setFormState({ ...formState, subscriptionAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formState.paymentMode || 'UPI / QR Code'}
                    onChange={(e) => setFormState({ ...formState, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  >
                    <option value="UPI / QR Code">UPI / QR Code</option>
                    <option value="NEFT / RTGS Bank Transfer">NEFT / RTGS Bank Transfer</option>
                    <option value="Cheque / Draft">Cheque / Draft</option>
                    <option value="Cash at Corporate Desk">Cash at Corporate Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Payment Reference / UTR Number
                  </label>
                  <input
                    type="text"
                    value={formState.paymentReference || ''}
                    onChange={(e) => setFormState({ ...formState, paymentReference: e.target.value })}
                    placeholder="e.g. UPI-928172648102"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Payment Notes */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Payment Verification Notes
                  </label>
                  <input
                    type="text"
                    value={formState.paymentNotes || ''}
                    onChange={(e) => setFormState({ ...formState, paymentNotes: e.target.value })}
                    placeholder="e.g. Advance paid via GPay. Awaiting 1st month clearance."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Emergency toggle */}
                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="emergency-checkbox"
                    checked={formState.emergency}
                    onChange={(e) => setFormState({ ...formState, emergency: e.target.checked })}
                    className="rounded text-[#123B6D] focus:ring-[#123B6D] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="emergency-checkbox" className="font-semibold text-slate-800 cursor-pointer">
                    Enable 24x7 Round-the-Clock Sample Processing badge for this lab
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingVendor(null);
                  }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>{editingVendor ? 'Save Changes' : 'Add Laboratory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-purple-200 overflow-hidden space-y-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/30 border border-purple-300/40 text-amber-300 flex items-center justify-center font-black">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Edit (password only)</h3>
                  <p className="text-[11px] text-purple-200">
                    लैब का लॉगिन पासवर्ड बदलें (Edit password only)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPasswordVendor(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePassword} className="p-6 space-y-4 text-xs">
              {/* Lab Summary Card */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-1">
                <div className="font-extrabold text-purple-950 text-sm">{passwordVendor.name}</div>
                <div className="text-[11px] text-purple-800 flex items-center gap-2 flex-wrap">
                  <span>Phone: <strong>{passwordVendor.phone}</strong></span>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  New Password (नया पासवर्ड) *
                </label>
                <div className="relative">
                  <input
                    type={passwordForm.showPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-purple-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPasswordForm({ ...passwordForm, showPassword: !passwordForm.showPassword })
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800 p-1"
                    title={passwordForm.showPassword ? 'Hide password' : 'Show password'}
                  >
                    {passwordForm.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Quick Presets & Generator */}
                <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-semibold">Quick Presets:</span>
                    {['owner123', 'Apex@2026#', 'Lab@998', 'Admin@123'].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setPasswordForm({ ...passwordForm, password: preset })}
                        className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 hover:bg-purple-100 transition shadow-2xs"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const randPass = `Lab#${Math.floor(1000 + Math.random() * 9000)}!`;
                      setPasswordForm({ ...passwordForm, password: randPass, showPassword: true });
                    }}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-0.5"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Generate Random</span>
                  </button>
                </div>
              </div>

              {/* Security PIN */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Security PIN (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={passwordForm.pin}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      pin: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  placeholder="e.g. 123456"
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 tracking-wider shadow-2xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Used as fallback verification PIN for owner staff logins.
                </span>
              </div>

              {/* Notice */}
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  The vendor can immediately log in on their dedicated website or login portal using this new password with their phone number (<strong>{passwordVendor.phone}</strong>).
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPasswordVendor(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>Update Password (पासवर्ड सेव करें)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                Are you sure you want to delete this?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 py-2.5 px-3 rounded-xl border border-slate-200 font-medium break-words">
                Laboratory: <strong>{deleteConfirmVendor.name}</strong> ({deleteConfirmVendor.domainPreview || deleteConfirmVendor.id})
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmVendor(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 transition cursor-pointer text-center"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Website Visit / Preview Warning Modal */}
      {draftVisitVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-amber-300 space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border-2 border-amber-300 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ⚠️ Website In Draft Mode • Pending Admin Approval
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Website is currently in Draft Mode
              </h3>
              <p className="text-xs text-amber-800 font-bold mt-1">
                This website will not be live or accessible for visit until the Admin publishes it.
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                This laboratory website was created and is currently in <strong>Draft Status</strong>. Public visit, patient bookings, and diagnostic catalog are locked until Super Admin reviews and approves it.
              </p>

              {/* Contact Box */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 mt-3 text-xs font-bold text-amber-950 flex items-center justify-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-700" />
                <span>Contact with 7087033009</span>
              </div>

              <div className="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Laboratory:</span>
                  <span className="font-bold text-slate-800">{draftVisitVendor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">City / State:</span>
                  <span className="text-slate-700">{draftVisitVendor.city}, {draftVisitVendor.state || 'India'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-amber-700 font-bold">{draftVisitVendor.status} (Unpublished)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = draftVisitVendor;
                  setVendorStatus(target.id, 'Active');
                  setDraftVisitVendor(null);
                  showToast(`Approved & Published LIVE: ${target.name}! Moved to Our Clients.`);
                  selectVendorLab(target.id);
                  onNavigateView('vendor_website');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Approve & Publish Live Now</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = draftVisitVendor;
                  setDraftVisitVendor(null);
                  selectVendorLab(target.id);
                  onNavigateView('vendor_website');
                }}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>View Draft Notice Screen</span>
              </button>

              <button
                type="button"
                onClick={() => setDraftVisitVendor(null)}
                className="py-1 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
