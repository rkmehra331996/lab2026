import React, { useState, useRef, useMemo } from 'react';
import {
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Database,
  ShieldCheck,
  Building2,
  Phone,
  User,
  Package,
  FlaskConical,
  Calendar,
  FileJson,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Check,
  Copy,
  Info,
  Clock,
  HardDriveDownload,
  HardDriveUpload,
  X,
  Eye,
  FileText,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { VendorLabDirectoryItem } from '../../types';

interface WebsiteBackupTabProps {
  showToast?: (msg: string) => void;
  onNavigateView?: (view: any) => void;
  onNavigateToDrafts?: () => void;
}

export const WebsiteBackupTab: React.FC<WebsiteBackupTabProps> = ({
  showToast: parentShowToast,
  onNavigateView,
  onNavigateToDrafts,
}) => {
  const {
    vendorLabsList,
    vendorLabSettingsMap,
    getLabSettings,
    allVendorPackages,
    allVendorTests,
    allVendorDoctors,
    allVendorBranches,
    companySettings,
    importAllWebsitesBackup,
    importSingleCustomerWebsiteBackup,
    refreshCloudData,
    isCloudConnected,
    selectVendorLab,
    setSelectedVendorLabId,
    setVendorStatus,
  } = useCms();

  const [localToast, setLocalToast] = useState<string | null>(null);
  const [justRestoredLab, setJustRestoredLab] = useState<{
    labId: string;
    labName: string;
    customerPhone: string;
  } | null>(null);
  const [justRestoredAllWebsites, setJustRestoredAllWebsites] = useState<{
    count: number;
    timestamp: string;
  } | null>(null);

  const showFeedback = (msg: string) => {
    if (parentShowToast) {
      parentShowToast(msg);
    }
    setLocalToast(msg);
    setTimeout(() => setLocalToast(null), 4000);
  };

  // ==========================================
  // CARD 1: ALL WEBSITE BACKUP STATE
  // ==========================================
  const allWebsitesFileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingAllUpload, setIsProcessingAllUpload] = useState(false);
  const [allWebsitesBackupPreview, setAllWebsitesBackupPreview] = useState<{
    totalWebsites: number;
    websiteNames: string[];
    packagesCount: number;
    testsCount: number;
    exportDate?: string;
    raw: any;
  } | null>(null);
  const [allWebsitesUploadError, setAllWebsitesUploadError] = useState<string | null>(null);
  const [lastAllBackupDownloadedAt, setLastAllBackupDownloadedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('last_all_websites_backup_time');
    } catch {
      return null;
    }
  });

  // Handle Download All Websites
  const handleDownloadAllWebsitesBackup = () => {
    try {
      const now = new Date();
      const exportTimestamp = now.toISOString();
      const dateStr = now.toISOString().slice(0, 10);

      const allWebsitesData = {
        version: '2.0',
        backupType: 'all_websites_backup',
        title: 'INDIANLALAJI.COM — Master All Websites Backup',
        exportedAt: exportTimestamp,
        totalWebsites: vendorLabsList.length,
        company: {
          name: companySettings.companyName || 'INDIANLALAJI.COM',
          supportPhone: companySettings.supportPhone,
          superAdminDomain: companySettings.superAdminDomain,
        },
        websites: vendorLabsList,
        settingsMap: vendorLabSettingsMap,
        packages: allVendorPackages,
        tests: allVendorTests,
        doctors: allVendorDoctors,
        branches: allVendorBranches,
        companySettings,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allWebsitesData, null, 2));
      const downloadAnchor = document.createElement('a');
      const filename = `all-websites-backup-${dateStr}-${Date.now().toString().slice(-4)}.json`;
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastAllBackupDownloadedAt(timeFormatted);
      try {
        localStorage.setItem('last_all_websites_backup_time', timeFormatted);
      } catch {}

      showFeedback(`All Website Backup downloaded! (${vendorLabsList.length} websites archived)`);
    } catch (err: any) {
      showFeedback(`Download error: ${err.message}`);
    }
  };

  // Trigger File Input for All Websites Upload
  const handleTriggerAllWebsitesUpload = () => {
    setAllWebsitesUploadError(null);
    if (allWebsitesFileInputRef.current) {
      allWebsitesFileInputRef.current.value = '';
      allWebsitesFileInputRef.current.click();
    }
  };

  // Parse All Websites Upload File - automatically imports into Website Draft & immediately redirects to Website Draft tab
  const handleAllWebsitesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAllWebsitesUploadError(null);
    setAllWebsitesBackupPreview(null);
    setIsProcessingAllUpload(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Selected file does not contain a valid JSON backup object.');
        }

        // SMART DETECTION: Master All-Websites Backup VS Single Lab/Customer Backup
        const isMaster = Boolean(
          (Array.isArray(parsed.websites) && parsed.websites.length > 0) ||
          parsed.settingsMap
        );

        if (isMaster) {
          const res = importAllWebsitesBackup(parsed);
          if (!res.success) {
            throw new Error(res.message || 'Failed to restore master backup.');
          }
          setJustRestoredAllWebsites({
            count: res.count || parsed.websites?.length || vendorLabsList.length,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          showFeedback(`✅ Master backup uploaded! ${res.count || 'All'} website(s) saved to Website Draft.`);
        } else {
          // Single customer/lab backup or vendor export
          const phoneFromFile = (
            parsed.customerNumber ||
            parsed.customerPhone ||
            parsed.labDetails?.phone ||
            parsed.phone ||
            parsed.settings?.phone ||
            ''
          ).trim();
          const targetPhoneOrId = phoneFromFile || customerNumberInput.trim() || '9876543210';
          const res = importSingleCustomerWebsiteBackup(parsed, targetPhoneOrId);
          if (!res.success) {
            throw new Error(res.message || 'Failed to restore website backup.');
          }
          const activeLabName = res.customerName || parsed.labName || parsed.labDetails?.name || 'Customer Lab';
          const activePhone = res.customerPhone || phoneFromFile || targetPhoneOrId;
          const activeLabId = res.labId || parsed.labId || 'lab-apex';
          setCustomerNumberInput(activePhone);
          selectVendorLab(activeLabId);
          setSelectedVendorLabId(activeLabId);
          setJustRestoredLab({
            labId: activeLabId,
            labName: activeLabName,
            customerPhone: activePhone,
          });
          showFeedback(`✅ Backup for "${activeLabName}" (${activePhone}) uploaded!`);
        }

        if (allWebsitesFileInputRef.current) {
          allWebsitesFileInputRef.current.value = '';
        }

        // Sync cloud in background without blocking UI
        refreshCloudData().catch(() => {});
      } catch (err: any) {
        setAllWebsitesUploadError(err.message || 'Failed to parse backup file');
      } finally {
        setIsProcessingAllUpload(false);
      }
    };
    reader.onerror = () => {
      setAllWebsitesUploadError('Failed to read the backup file.');
      setIsProcessingAllUpload(false);
    };
    reader.readAsText(file);
  };

  // Execute Restore of All Websites - places into Website Draft for manual publishing
  const handleConfirmRestoreAllWebsites = async () => {
    if (!allWebsitesBackupPreview?.raw) return;
    setIsProcessingAllUpload(true);

    try {
      const res = importAllWebsitesBackup(allWebsitesBackupPreview.raw);
      if (res.success) {
        setJustRestoredAllWebsites({
          count: res.count || allWebsitesBackupPreview.totalWebsites || 1,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        showFeedback(res.message || '✅ All websites backup uploaded successfully!');
        setAllWebsitesBackupPreview(null);
        if (allWebsitesFileInputRef.current) {
          allWebsitesFileInputRef.current.value = '';
        }
        refreshCloudData().catch(() => {});
      } else {
        setAllWebsitesUploadError(res.message);
      }
    } catch (err: any) {
      setAllWebsitesUploadError(err.message || 'Restore failed.');
    } finally {
      setIsProcessingAllUpload(false);
    }
  };

  // ==========================================
  // CARD 2: SINGLE WEBSITE BACKUP STATE
  // ==========================================
  const singleCustomerFileInputRef = useRef<HTMLInputElement>(null);
  const [customerNumberInput, setCustomerNumberInput] = useState('');
  const [isProcessingSingleUpload, setIsProcessingSingleUpload] = useState(false);
  const [singleUploadError, setSingleUploadError] = useState<string | null>(null);
  const [singleCustomerBackupPreview, setSingleCustomerBackupPreview] = useState<{
    customerName: string;
    customerNumber: string;
    labName: string;
    labId: string;
    city?: string;
    packagesCount: number;
    testsCount: number;
    raw: any;
  } | null>(null);

  // Search customer by number in vendorLabsList
  const matchedCustomer = useMemo<VendorLabDirectoryItem | null>(() => {
    const trimmed = customerNumberInput.trim();
    if (!trimmed) return null;

    const normalizedDigits = trimmed.replace(/\D/g, '');

    return (
      vendorLabsList.find((lab) => {
        const labDigits = (lab.phone || '').replace(/\D/g, '');
        // Exact phone match or trailing digits match (e.g. user typed 10 digits without country code)
        if (normalizedDigits && labDigits) {
          if (labDigits === normalizedDigits) return true;
          if (labDigits.endsWith(normalizedDigits) || normalizedDigits.endsWith(labDigits)) return true;
        }
        // Match raw phone string
        if (lab.phone && lab.phone.toLowerCase().includes(trimmed.toLowerCase())) return true;
        // Also match lab id or nablCode if entered
        if (lab.id.toLowerCase() === trimmed.toLowerCase()) return true;
        if (lab.nablCode && lab.nablCode.toLowerCase() === trimmed.toLowerCase()) return true;
        return false;
      }) || null
    );
  }, [customerNumberInput, vendorLabsList]);

  // Statistics for selected customer
  const customerStats = useMemo(() => {
    if (!matchedCustomer) return null;
    const settings = getLabSettings(matchedCustomer.id);
    const packages = allVendorPackages.filter((p) => p.labId === matchedCustomer.id);
    const tests = allVendorTests.filter((t) => t.labId === matchedCustomer.id);
    const doctors = allVendorDoctors.filter((d) => d.labId === matchedCustomer.id);
    const branches = allVendorBranches.filter((b) => b.labId === matchedCustomer.id);
    return {
      settings,
      packagesCount: packages.length,
      testsCount: tests.length,
      doctorsCount: doctors.length,
      branchesCount: branches.length,
      packages,
      tests,
      doctors,
      branches,
    };
  }, [matchedCustomer, getLabSettings, allVendorPackages, allVendorTests, allVendorDoctors, allVendorBranches]);

  // Handle Download Single Website Backup
  const handleDownloadSingleCustomerBackup = () => {
    if (!matchedCustomer) {
      setSingleUploadError('Please enter a Customer number (search) above first to download their website backup.');
      const el = document.getElementById('customer-number-input');
      if (el) el.focus();
      return;
    }
    setSingleUploadError(null);

    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const safeCustomerNum = (matchedCustomer.phone || customerNumberInput).replace(/\D/g, '') || 'customer';
      const safeLabSlug = (matchedCustomer.name || matchedCustomer.id).toLowerCase().replace(/[^a-z0-9]/g, '-');

      const customerBackupData = {
        version: '2.0',
        backupType: 'single_customer_website_backup',
        title: `Website Backup — ${matchedCustomer.name}`,
        exportedAt: now.toISOString(),
        customerNumber: matchedCustomer.phone,
        phone: matchedCustomer.phone,
        customerName: matchedCustomer.ownerName || matchedCustomer.name,
        labId: matchedCustomer.id,
        labName: matchedCustomer.name,
        labDetails: {
          ...matchedCustomer,
          status: 'Active',
          isWebsiteApproved: true,
        },
        settings: customerStats?.settings || getLabSettings(matchedCustomer.id),
        sections: customerStats?.settings?.sections,
        packages: customerStats?.packages || [],
        tests: customerStats?.tests || [],
        doctors: customerStats?.doctors || [],
        branches: customerStats?.branches || [],
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customerBackupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const filename = `customer-${safeCustomerNum}-${safeLabSlug}-backup-${dateStr}.json`;
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showFeedback(`Website backup for ${matchedCustomer.name} (${matchedCustomer.phone}) downloaded!`);
    } catch (err: any) {
      showFeedback(`Download error: ${err.message}`);
    }
  };

  // Trigger File Input for Single Customer Upload
  const handleTriggerSingleCustomerUpload = () => {
    setSingleUploadError(null);
    if (singleCustomerFileInputRef.current) {
      singleCustomerFileInputRef.current.value = '';
      singleCustomerFileInputRef.current.click();
    }
  };

  // Parse Single Customer Upload File & Automatically Restore Website
  const handleSingleCustomerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSingleUploadError(null);
    setSingleCustomerBackupPreview(null);
    setIsProcessingSingleUpload(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Selected file does not contain a valid JSON backup.');
        }

        // SMART DETECTION: Master All-Websites Backup VS Single Lab/Customer Backup
        const isMaster = Boolean(
          (Array.isArray(parsed.websites) && parsed.websites.length > 0) ||
          parsed.settingsMap
        );

        if (isMaster) {
          const res = importAllWebsitesBackup(parsed);
          if (!res.success) {
            throw new Error(res.message || 'Failed to restore master backup.');
          }
          showFeedback(`✅ Master backup loaded! ${res.count || 'All'} website(s) saved to Website Draft. Pehle Draft me save ho gaya hai, ab yahan se manually Publish karein.`);
        } else {
          const phoneFromFile = (
            parsed.customerNumber ||
            parsed.customerPhone ||
            parsed.labDetails?.phone ||
            parsed.phone ||
            customerNumberInput ||
            ''
          ).trim();

          const targetPhoneOrId = customerNumberInput.trim() || phoneFromFile || '9876543210';

          // Immediately execute restore and register customer in directory & settings as Draft
          const res = importSingleCustomerWebsiteBackup(parsed, targetPhoneOrId);
          if (!res.success) {
            throw new Error(res.message || 'Failed to apply backup to customer.');
          }

          const activeLabId =
            res.labId ||
            parsed.labId ||
            parsed.labDetails?.id ||
            (phoneFromFile ? `lab-${phoneFromFile.replace(/\D/g, '').slice(-6)}` : 'lab-apex');

          const activePhone = res.customerPhone || phoneFromFile || targetPhoneOrId;
          const activeLabName = res.customerName || parsed.labName || parsed.labDetails?.name || 'Customer Lab';

          // 1. Set search input so matchedCustomer immediately renders the customer card!
          if (activePhone) {
            setCustomerNumberInput(activePhone);
          }

          // 2. Select this lab across the app
          selectVendorLab(activeLabId);
          setSelectedVendorLabId(activeLabId);

          // 3. Set draft status banner
          setJustRestoredLab({
            labId: activeLabId,
            labName: activeLabName,
            customerPhone: activePhone,
          });

          showFeedback(`✅ Backup for "${activeLabName}" (${activePhone}) uploaded!`);
        }

        if (singleCustomerFileInputRef.current) {
          singleCustomerFileInputRef.current.value = '';
        }

        // Sync cloud in background without blocking UI
        refreshCloudData().catch(() => {});
      } catch (err: any) {
        setSingleUploadError(err.message || 'Failed to parse customer backup file');
      } finally {
        setIsProcessingSingleUpload(false);
        if (singleCustomerFileInputRef.current) {
          singleCustomerFileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setSingleUploadError('Failed to read the file.');
      setIsProcessingSingleUpload(false);
    };
    reader.readAsText(file);
  };

  // Quick select customer number helper
  const handleQuickSelectCustomer = (phone: string) => {
    setCustomerNumberInput(phone);
    setSingleUploadError(null);
  };

  return (
    <div className="space-y-6">
      {/* Hidden file inputs for inline buttons */}
      <input
        type="file"
        ref={allWebsitesFileInputRef}
        onChange={handleAllWebsitesFileChange}
        accept=".json"
        className="hidden"
      />
      <input
        type="file"
        ref={singleCustomerFileInputRef}
        onChange={handleSingleCustomerFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Floating local toast notification */}
      {localToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#123B6D] text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 border border-white/20 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{localToast}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#123B6D] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Super Admin HQ
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>Multi-Website Cloud Sync: {isCloudConnected ? 'Active' : 'Local Ready'}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <HardDriveDownload className="w-7 h-7 text-amber-400" />
              <span>Website Backup Module</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Export and import entire system website snapshots or manage isolated customer website backups by customer number. All exports maintain strict multi-tenant isolation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-2xl text-right">
              <div className="text-[11px] font-medium text-slate-300">Registered Websites</div>
              <div className="text-xl font-black text-amber-300">{vendorLabsList.length} Portals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Newly Uploaded Draft Lab Alert Banner */}
      {justRestoredLab && (
        <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 text-white rounded-3xl p-5 border-2 border-amber-400 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <FileJson className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Uploaded to Website Draft
                </span>
                <span className="text-xs text-amber-200 font-mono font-bold">
                  {justRestoredLab.customerPhone}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                "{justRestoredLab.labName}" Website is in Draft
              </h3>
              <p className="text-xs text-amber-100">
                Backup upload Draft me save ho chuka hai. Website Draft tab me jakar review karein ya direct Publish karein.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            {/* Direct Publish Button right here on banner */}
            <button
              type="button"
              id="btn-publish-direct-from-banner"
              onClick={() => {
                setVendorStatus(justRestoredLab.labId, 'Active');
                showFeedback(`✅ "${justRestoredLab.labName}" website is now Published & Live! Moved to Our Clients.`);
                setJustRestoredLab(null);
              }}
              className="flex-1 md:flex-initial py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Publish Live (पब्लिश करें)</span>
            </button>

            {onNavigateToDrafts && (
              <button
                type="button"
                id="btn-goto-website-drafts"
                onClick={onNavigateToDrafts}
                className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-950" />
                <span>Go to Draft Tab</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                selectVendorLab(justRestoredLab.labId);
                setSelectedVendorLabId(justRestoredLab.labId);
                if (onNavigateView) onNavigateView('vendor_website');
              }}
              className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setJustRestoredLab(null)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Newly Uploaded Master All Websites Banner */}
      {justRestoredAllWebsites && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 border-2 border-emerald-400 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full">
                  All Websites Restored
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  {justRestoredAllWebsites.timestamp}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                All Website Backup Loaded ({justRestoredAllWebsites.count} Websites Saved to Draft)
              </h3>
              <p className="text-xs text-blue-100">
                All websites have been restored into the Website Draft queue. You can review and publish each website individually.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            {onNavigateToDrafts && (
              <button
                type="button"
                onClick={onNavigateToDrafts}
                className="py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-950" />
                <span>Open Website Draft Queue</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setJustRestoredAllWebsites(null)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ======================================================== */}
        {/* CARD 1: ALL WEBSITE BACKUP                                */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between hover:border-slate-300 transition-all group">
          <div className="space-y-5">
            {/* Card Header & Title */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black bg-blue-100 text-[#123B6D] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Full System Snapshot
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {vendorLabsList.length} Total Websites
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#123B6D]" />
                  <span>All Website Backup</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#123B6D] group-hover:scale-105 transition-transform shrink-0">
                <Globe className="w-6 h-6" />
              </div>
            </div>

            {/* Description as specified in prompt */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Download or upload backups of all websites.
            </p>

            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
              <span className="font-bold shrink-0 bg-amber-400 text-slate-950 text-[10px] uppercase font-black px-2 py-0.5 rounded-full mt-0.5">
                Draft &amp; Publish Flow
              </span>
              <span className="text-[11px] leading-relaxed">
                Backup load karne par sabhi websites pehle <strong>Website Draft</strong> tab mein save hongi. Vahan se aap manually review aur <strong>Publish (पब्लिश करें)</strong> kar sakte hain.
              </span>
            </div>

            {/* Snapshot Details Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Scope of Master Backup Package</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Websites</span>
                  <strong className="text-slate-900 font-bold text-sm">{vendorLabsList.length} Labs</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Test Catalog</span>
                  <strong className="text-slate-900 font-bold text-sm">{allVendorTests.length} Tests</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Health Pkgs</span>
                  <strong className="text-slate-900 font-bold text-sm">{allVendorPackages.length} Pkgs</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Format: <strong>JSON (Strict Schema)</strong></span>
                {lastAllBackupDownloadedAt && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Last backup: Today at {lastAllBackupDownloadedAt}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Error Message if any */}
            {allWebsitesUploadError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Upload Notice:</strong>
                  <span>{allWebsitesUploadError}</span>
                </div>
              </div>
            )}

            {/* Upload Preview Dialog */}
            {allWebsitesBackupPreview && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Master Backup File Detected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllWebsitesBackupPreview(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>• Found <strong>{allWebsitesBackupPreview.totalWebsites} Websites</strong></div>
                  <div>• Found <strong>{allWebsitesBackupPreview.packagesCount} Packages</strong> and <strong>{allWebsitesBackupPreview.testsCount} Tests</strong></div>
                  {allWebsitesBackupPreview.websiteNames.length > 0 && (
                    <div className="text-[11px] text-slate-500 truncate">
                      Labs: {allWebsitesBackupPreview.websiteNames.join(', ')}...
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmRestoreAllWebsites}
                    disabled={isProcessingAllUpload}
                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessingAllUpload ? 'Restoring All Websites...' : 'Confirm & Restore All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllWebsitesBackupPreview(null)}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TWO INLINE BUTTONS: Download | Upload */}
          <div className="pt-6 mt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-download-all-websites"
                onClick={handleDownloadAllWebsitesBackup}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#123B6D] hover:bg-[#0e2f57] text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer group/btn"
                title="Download backups of all websites as JSON"
              >
                <Download className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                <span>Download</span>
              </button>

              <button
                type="button"
                id="btn-upload-all-websites"
                onClick={handleTriggerAllWebsitesUpload}
                disabled={isProcessingAllUpload}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer group/btn disabled:opacity-50"
                title="Upload backups of all websites"
              >
                <Upload className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                <span>{isProcessingAllUpload ? 'Uploading...' : 'Upload'}</span>
              </button>
            </div>
            <div className="text-[11px] text-center text-slate-500 mt-2.5">
              Two inline actions: Download or upload backups of all websites
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 2: SINGLE WEBSITE BACKUP                             */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between hover:border-slate-300 transition-all group">
          <div className="space-y-5">
            {/* Card Header & Title */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Single Lab website Backup
                  </span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Single Lap website Backup
                  </span>
                </div>
                {/* Title as specified in user prompt */}
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Search className="w-5.5 h-5.5 text-amber-600" />
                  <span>Customer number (search)</span>
                </h2>
                <div className="text-[11px] font-medium text-amber-800 mt-0.5">
                  Customer number (sraech) • Single Lap website Backup
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 group-hover:scale-105 transition-transform shrink-0">
                <Phone className="w-6 h-6 text-amber-700" />
              </div>
            </div>

            {/* Description as specified in prompt */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Download or upload backup for the selected customer's website only.
            </p>

            {/* Search Field: Enter Customer Number */}
            <div className="space-y-1.5">
              <label htmlFor="customer-number-input" className="block text-xs font-black text-slate-700 flex items-center justify-between">
                <span>Customer number (search)</span>
                <span className="text-[10px] font-normal text-slate-400">Search customer number</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="customer-number-input"
                  type="text"
                  value={customerNumberInput}
                  onChange={(e) => {
                    setCustomerNumberInput(e.target.value);
                    setSingleUploadError(null);
                  }}
                  placeholder="Customer number (search) e.g. 7087033009, 9876543210"
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:border-transparent transition bg-slate-50/50"
                />
                {customerNumberInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerNumberInput('');
                      setSingleUploadError(null);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Suggestions / Sample Customer Numbers */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                <span>Select from registered customers:</span>
                <span className="text-[10px] text-[#123B6D] font-bold">1-Click Match</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {vendorLabsList.slice(0, 5).map((lab) => {
                  const isSelected = matchedCustomer?.id === lab.id;
                  return (
                    <button
                      key={lab.id}
                      type="button"
                      onClick={() => handleQuickSelectCustomer(lab.phone || lab.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#123B6D] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Phone className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="font-mono">{lab.phone || lab.id}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[90px]">({lab.name.split(' ')[0]})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matched Customer Details Card */}
            {isProcessingSingleUpload ? (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 border-2 border-[#123B6D] border-t-transparent rounded-full animate-spin shrink-0"></div>
                <div>
                  <strong className="block font-bold">Uploading & Restoring Customer Website...</strong>
                  <span className="text-[11px] text-blue-700">Synchronizing settings, packages, tests, and activating portal.</span>
                </div>
              </div>
            ) : matchedCustomer ? (
              <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 space-y-2.5 animate-in fade-in-50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <strong className="text-xs sm:text-sm font-black text-emerald-950">
                      {matchedCustomer.name}
                    </strong>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase">
                    {matchedCustomer.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{matchedCustomer.ownerName || 'Dr. Consultant'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-bold text-slate-900 font-mono">{matchedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{customerStats?.testsCount || 0} Tests Configured</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{customerStats?.packagesCount || 0} Packages</span>
                  </div>
                </div>

                {matchedCustomer.city && (
                  <div className="text-[11px] text-slate-500 pt-0.5">
                    Location: <strong>{matchedCustomer.city}</strong> • Directory URL: <code>indianlalaji.com/shop/{matchedCustomer.id}</code>
                  </div>
                )}

                {/* Immediate Action Bar for this customer's website */}
                <div className="pt-2.5 mt-1 border-t border-emerald-200/80 flex items-center gap-2 flex-wrap">
                  {matchedCustomer.status === 'Draft' || !matchedCustomer.isWebsiteApproved ? (
                    <>
                      {/* Direct Publish button */}
                      <button
                        type="button"
                        id="btn-matched-publish-now"
                        onClick={() => {
                          setVendorStatus(matchedCustomer.id, 'Active');
                          showFeedback(`✅ "${matchedCustomer.name}" website is now Published & Live! Moved to Our Clients.`);
                        }}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
                        <span>Publish (पब्लिश करें)</span>
                      </button>

                      {onNavigateToDrafts && (
                        <button
                          type="button"
                          id="btn-matched-goto-drafts"
                          onClick={onNavigateToDrafts}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-950" />
                          <span>Go to Website Draft</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          selectVendorLab(matchedCustomer.id);
                          setSelectedVendorLabId(matchedCustomer.id);
                          if (onNavigateView) onNavigateView('vendor_website');
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Preview Draft</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          selectVendorLab(matchedCustomer.id);
                          setSelectedVendorLabId(matchedCustomer.id);
                          if (onNavigateView) onNavigateView('vendor_website');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer group/launch"
                      >
                        <ExternalLink className="w-3.5 h-3.5 group-hover/launch:scale-110 transition-transform" />
                        <span>🌐 View Live Website</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          selectVendorLab(matchedCustomer.id);
                          setSelectedVendorLabId(matchedCustomer.id);
                          if (onNavigateView) onNavigateView('reception_dashboard');
                        }}
                        className="py-2 px-3 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <span>🖥️ Reception Desk</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : customerNumberInput.trim() ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Phone className="w-4 h-4 text-amber-500" />
                    <span>Customer Number: {customerNumberInput}</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-[#123B6D] font-bold px-2 py-0.5 rounded-full">
                    Ready for Upload
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Customer is not yet registered in directory. Click the <strong>Upload</strong> button below to select a backup JSON file to restore and launch this website, or click any existing customer chip above.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-3.5 text-xs text-slate-500 text-center">
                Enter a customer phone number above to select the website for download or upload.
              </div>
            )}

            {/* Error Message for Single Upload */}
            {singleUploadError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Notice:</strong>
                  <span>{singleUploadError}</span>
                </div>
              </div>
            )}
          </div>

          {/* TWO INLINE BUTTONS: Download | Upload */}
          <div className="pt-6 mt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-download-single-customer"
                onClick={handleDownloadSingleCustomerBackup}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#123B6D] hover:bg-[#0e2f57] text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer group/btn"
                title={
                  matchedCustomer
                    ? `Download backup for ${matchedCustomer.name} (${matchedCustomer.phone})`
                    : 'Download Single Lab website Backup'
                }
              >
                <Download className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                <span>Download</span>
              </button>

              <button
                type="button"
                id="btn-upload-single-customer"
                onClick={handleTriggerSingleCustomerUpload}
                disabled={isProcessingSingleUpload}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer group/btn disabled:opacity-50"
                title="Upload Single Lab website Backup"
              >
                <Upload className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                <span>{isProcessingSingleUpload ? 'Uploading...' : 'Upload'}</span>
              </button>
            </div>
            <div className="text-[11px] text-center text-slate-500 mt-2.5">
              Two inline actions: Download or upload backup for the selected customer's website only
            </div>
          </div>
        </div>
      </div>

      {/* Security & Multi-Tenant Isolation Guarantee Strip */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-slate-900">
              IndianLalaji Enterprise Backup Integrity Assurance
            </div>
            <div className="text-[11px] text-slate-500">
              Customer website backups include CMS styling, test menus, packages, doctor panels, and contact details with full cryptographic tenant isolation.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateView && onNavigateView('website')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-600" />
            <span>Preview Websites</span>
          </button>
        </div>
      </div>
    </div>
  );
};
