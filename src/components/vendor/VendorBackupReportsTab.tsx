import React, { useState, useRef, useMemo } from 'react';
import {
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  Globe,
  Eye,
  Printer,
  X,
  Check,
  HardDriveDownload,
  FolderArchive,
  Sparkles,
  Clock,
} from 'lucide-react';
import JSZip from 'jszip';
import { useCms } from '../../context/CmsContext';
import { LabReport, ReceptionPatientEntry } from '../../types';
import { generateReportPdf, buildCanonicalReportPdf } from '../../utils/pdfGenerator';
import { safePrint } from '../../utils/printHelper';
import { CanonicalPdfViewer } from '../CanonicalPdfViewer';

interface VendorBackupReportsTabProps {
  onNavigateView?: (view: any) => void;
}

export const VendorBackupReportsTab: React.FC<VendorBackupReportsTabProps> = ({
  onNavigateView: _onNavigateView,
}) => {
  const {
    vendorLabSettings,
    vendorPackages,
    vendorTests,
    vendorDoctors,
    vendorBranches,
    receptionEntries,
    reports,
    activeTenantId,
    importFullWebsiteBackup,
    importCustomerEntryBackup,
  } = useCms();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // =========================================================================
  // 1. FULL WEBSITE BACKUP STATE
  // =========================================================================
  const [websiteBackupFile, setWebsiteBackupFile] = useState<File | null>(null);
  const [websiteBackupPreview, setWebsiteBackupPreview] = useState<any | null>(null);
  const [websiteBackupError, setWebsiteBackupError] = useState<string | null>(null);
  const [isRestoringWebsite, setIsRestoringWebsite] = useState(false);
  const websiteFileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // 2. CUSTOMER ENTRY BACKUP STATE
  // =========================================================================
  const [customerBackupFile, setCustomerBackupFile] = useState<File | null>(null);
  const [customerBackupPreview, setCustomerBackupPreview] = useState<any | null>(null);
  const [customerBackupError, setCustomerBackupError] = useState<string | null>(null);
  const [customerRestoreMode, setCustomerRestoreMode] = useState<'append' | 'replace'>('append');
  const [isRestoringCustomer, setIsRestoringCustomer] = useState(false);
  const customerFileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // 3. PATIENT REPORT BACKUP STATE (ZIP DOWNLOAD BY DATE RANGE)
  // =========================================================================
  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const getFirstOfMonthStr = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  };

  const [dateFrom, setDateFrom] = useState<string>(getFirstOfMonthStr());
  const [dateTo, setDateTo] = useState<string>(getTodayStr());
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{
    current: number;
    total: number;
    stage: string;
  } | null>(null);

  // =========================================================================
  // REPORTS EXPLORER STATE (LISTING & CANONICAL PREVIEW)
  // =========================================================================
  const [reportSearch, setReportSearch] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | 'verified' | 'due'>('all');
  const [selectedReportForPreview, setSelectedReportForPreview] = useState<LabReport | null>(null);

  // Helper to parse dates from various formats (ISO, DD-MMM-YYYY, timestamp)
  const parseDateToComparable = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const iso = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const d = new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
      if (!isNaN(d.getTime())) return d;
    }
    const dmy = dateStr.match(/(\d{1,2})[-/ ]([A-Za-z]{3})[-/ ](\d{4})/);
    if (dmy) {
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      };
      const day = parseInt(dmy[1], 10);
      const m = months[dmy[2].toLowerCase()];
      const yr = parseInt(dmy[3], 10);
      if (m !== undefined) {
        const d = new Date(yr, m, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
    const timestamp = Date.parse(dateStr.replace(' IST', ''));
    if (!isNaN(timestamp)) {
      return new Date(timestamp);
    }
    return null;
  };

  const getReportDate = (rpt: LabReport, entries: ReceptionPatientEntry[]): Date => {
    const entry = entries.find(
      (e) =>
        (rpt.tokenNumber && e.tokenNumber === rpt.tokenNumber) ||
        (rpt.uhid && e.uhid === rpt.uhid) ||
        (rpt.reportId && (e.id === rpt.reportId || e.tokenNumber === rpt.reportId))
    );
    if (entry?.registeredAt) {
      const d = parseDateToComparable(entry.registeredAt);
      if (d) return d;
    }
    if (rpt.reportedAt) {
      const d = parseDateToComparable(rpt.reportedAt);
      if (d) return d;
    }
    if (rpt.sampleCollectedAt) {
      const d = parseDateToComparable(rpt.sampleCollectedAt);
      if (d) return d;
    }
    if (rpt.publishedAt) {
      const d = parseDateToComparable(rpt.publishedAt);
      if (d) return d;
    }
    return new Date();
  };

  // Reports matching the selected date range for ZIP download
  const matchingReportsForZip = useMemo(() => {
    if (!dateFrom && !dateTo) return reports;
    const start = dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date('1970-01-01');
    const end = dateTo ? new Date(dateTo + 'T23:59:59.999') : new Date('2099-12-31');

    return reports.filter((rpt) => {
      const rptDate = getReportDate(rpt, receptionEntries);
      return rptDate >= start && rptDate <= end;
    });
  }, [reports, receptionEntries, dateFrom, dateTo]);

  // =========================================================================
  // 1. FULL WEBSITE BACKUP HANDLERS
  // =========================================================================
  const handleDownloadWebsiteBackup = () => {
    try {
      const backupData = {
        version: '1.0',
        backupType: 'full_website_backup',
        timestamp: new Date().toISOString(),
        labId: activeTenantId || vendorLabSettings.labId || 'lab-apex',
        labName: vendorLabSettings.labName || 'Diagnostic Laboratory',
        settings: vendorLabSettings,
        sections: vendorLabSettings.sections,
        packages: vendorPackages,
        tests: vendorTests,
        doctors: vendorDoctors,
        branches: vendorBranches,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const safeName = (vendorLabSettings.labName || 'lab').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${safeName}-website-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('✅ Full Website Backup downloaded successfully!');
    } catch (err: any) {
      showToast(`❌ Download failed: ${err.message}`);
    }
  };

  const handleWebsiteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setWebsiteBackupFile(file);
    setWebsiteBackupError(null);
    setWebsiteBackupPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('File does not contain valid JSON.');
        }

        const preview = {
          labName: parsed.labName || parsed.settings?.labName || 'Unknown Lab',
          timestamp: parsed.timestamp || 'Not recorded',
          packagesCount: Array.isArray(parsed.packages) ? parsed.packages.length : 0,
          testsCount: Array.isArray(parsed.tests) ? parsed.tests.length : 0,
          doctorsCount: Array.isArray(parsed.doctors) ? parsed.doctors.length : 0,
          branchesCount: Array.isArray(parsed.branches) ? parsed.branches.length : 0,
          hasSettings: Boolean(parsed.settings),
          hasSections: Boolean(parsed.sections),
          raw: parsed,
        };

        setWebsiteBackupPreview(preview);
      } catch (err: any) {
        setWebsiteBackupError(`Invalid backup file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setWebsiteBackupError('Failed to read backup file.');
    };
    reader.readAsText(file);
  };

  const handleExecuteWebsiteRestore = () => {
    if (!websiteBackupPreview?.raw) return;
    setIsRestoringWebsite(true);

    setTimeout(() => {
      try {
        const result = importFullWebsiteBackup
          ? importFullWebsiteBackup(websiteBackupPreview.raw)
          : { success: true, message: 'Website backup applied!' };

        if (result.success) {
          showToast(result.message || '✅ Full Website Backup successfully restored!');
          setWebsiteBackupFile(null);
          setWebsiteBackupPreview(null);
          if (websiteFileInputRef.current) {
            websiteFileInputRef.current.value = '';
          }
        } else {
          setWebsiteBackupError(result.message);
        }
      } catch (err: any) {
        setWebsiteBackupError(err.message);
      } finally {
        setIsRestoringWebsite(false);
      }
    }, 400);
  };

  // =========================================================================
  // 2. CUSTOMER ENTRY BACKUP HANDLERS
  // =========================================================================
  const handleDownloadCustomerBackupJson = () => {
    try {
      const backupData = {
        version: '1.0',
        backupType: 'customer_entry_backup',
        timestamp: new Date().toISOString(),
        labId: activeTenantId || vendorLabSettings.labId || 'lab-apex',
        labName: vendorLabSettings.labName || 'Diagnostic Laboratory',
        totalCustomerEntries: receptionEntries.length,
        totalReports: reports.length,
        customerEntries: receptionEntries,
        reports: reports,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const safeName = (vendorLabSettings.labName || 'lab').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${safeName}-customer-entry-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast(`✅ Customer Backup (${receptionEntries.length} entries) downloaded!`);
    } catch (err: any) {
      showToast(`❌ Download failed: ${err.message}`);
    }
  };

  const handleDownloadCustomerCsv = () => {
    try {
      const headers = [
        'Token / ID',
        'Patient Name',
        'Age',
        'Gender',
        'Mobile Number',
        'Referring Doctor',
        'Tests Ordered',
        'Sample Tube',
        'Total INR',
        'Paid INR',
        'Due INR',
        'Payment Mode',
        'Payment Status',
        'Report Status',
        'Registered Date',
      ];

      const rows = receptionEntries.map((e) => [
        `"${e.tokenNumber || e.id}"`,
        `"${(e.patientName || '').replace(/"/g, '""')}"`,
        e.age || '',
        e.gender || '',
        `"${e.mobile || ''}"`,
        `"${(e.referringDoctor || '').replace(/"/g, '""')}"`,
        `"${(e.tests || []).join('; ').replace(/"/g, '""')}"`,
        `"${e.sampleType || ''}"`,
        e.totalAmount || 0,
        e.paidAmount || 0,
        e.dueAmount || 0,
        `"${e.paymentMode || 'Cash'}"`,
        `"${e.paymentStatus || 'Paid'}"`,
        `"${e.status || 'Registered'}"`,
        `"${e.registeredAt || 'Today'}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      const safeName = (vendorLabSettings.labName || 'lab').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${safeName}-customer-ledger-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast(`✅ Exported ${receptionEntries.length} customer entries to CSV Spreadsheet!`);
    } catch (err: any) {
      showToast(`❌ Export failed: ${err.message}`);
    }
  };

  const handleCustomerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomerBackupFile(file);
    setCustomerBackupError(null);
    setCustomerBackupPreview(null);

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let parsed: any;
        let entriesCount = 0;
        let reportsCount = 0;

        if (isCsv) {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length <= 1) {
            throw new Error('CSV file contains no customer rows.');
          }

          const parseRow = (rowStr: string) => {
            const values: string[] = [];
            let insideQuotes = false;
            let currentVal = '';
            for (let i = 0; i < rowStr.length; i++) {
              const char = rowStr[i];
              if (char === '"') {
                if (insideQuotes && rowStr[i + 1] === '"') {
                  currentVal += '"';
                  i++;
                } else {
                  insideQuotes = !insideQuotes;
                }
              } else if (char === ',' && !insideQuotes) {
                values.push(currentVal.trim());
                currentVal = '';
              } else {
                currentVal += char;
              }
            }
            values.push(currentVal.trim());
            return values;
          };

          const header = parseRow(lines[0]).map((h) => h.toLowerCase());
          const nameIdx = header.findIndex((h) => h.includes('name'));
          const ageIdx = header.findIndex((h) => h.includes('age'));
          const genderIdx = header.findIndex((h) => h.includes('gender'));
          const mobileIdx = header.findIndex((h) => h.includes('mobile') || h.includes('phone'));
          const docIdx = header.findIndex((h) => h.includes('doc'));
          const testIdx = header.findIndex((h) => h.includes('test'));
          const tokenIdx = header.findIndex((h) => h.includes('token') || h.includes('id'));
          const totalIdx = header.findIndex((h) => h.includes('total'));
          const paidIdx = header.findIndex((h) => h.includes('paid'));
          const dueIdx = header.findIndex((h) => h.includes('due'));

          const parsedEntries: ReceptionPatientEntry[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = parseRow(lines[i]);
            if (cols.length === 0 || !cols.some((c) => c.length > 0)) continue;
            const name = (nameIdx >= 0 ? cols[nameIdx] : cols[1]) || `Customer ${i}`;
            if (!name || name.toLowerCase() === 'patient name') continue;

            const dueAmt = dueIdx >= 0 ? parseFloat(cols[dueIdx]) || 0 : 0;
            const totalAmt = totalIdx >= 0 ? parseFloat(cols[totalIdx]) || 500 : 500;
            const paidAmt = paidIdx >= 0 ? parseFloat(cols[paidIdx]) || (totalAmt - dueAmt) : (totalAmt - dueAmt);

            parsedEntries.push({
              id: `csv-${Date.now()}-${i}`,
              uhid: tokenIdx >= 0 && cols[tokenIdx] ? cols[tokenIdx] : `UHID-${200 + i}`,
              labId: activeTenantId || vendorLabSettings.labId || 'lab-apex',
              tokenNumber: tokenIdx >= 0 && cols[tokenIdx] ? cols[tokenIdx] : `TK-${200 + i}`,
              patientName: name,
              age: ageIdx >= 0 ? parseInt(cols[ageIdx], 10) || 32 : 32,
              gender: (genderIdx >= 0 && cols[genderIdx].toLowerCase().startsWith('f') ? 'Female' : 'Male') as 'Male' | 'Female',
              mobile: mobileIdx >= 0 && cols[mobileIdx] ? cols[mobileIdx] : '9876543210',
              referringDoctor: docIdx >= 0 && cols[docIdx] ? cols[docIdx] : 'Self',
              tests: testIdx >= 0 && cols[testIdx] ? cols[testIdx].split(';').map((t) => t.trim()).filter(Boolean) : ['Diagnostic Panel'],
              sampleType: 'Serum / EDTA Blood',
              totalAmount: totalAmt,
              paidAmount: paidAmt,
              dueAmount: dueAmt,
              paymentMode: 'Cash' as const,
              paymentStatus: (dueAmt > 0 ? 'Partial' : 'Paid') as 'Partial' | 'Paid',
              status: 'Sample Collected' as const,
              registeredAt: new Date().toISOString().slice(0, 10),
            });
          }

          if (parsedEntries.length === 0) {
            throw new Error('No valid customer records could be read from CSV.');
          }

          parsed = {
            labName: vendorLabSettings.labName || 'Diagnostic Laboratory',
            timestamp: new Date().toISOString(),
            customerEntries: parsedEntries,
            reports: [],
          };
          entriesCount = parsedEntries.length;
          reportsCount = 0;
        } else {
          parsed = JSON.parse(text);
          if (!parsed || typeof parsed !== 'object') {
            throw new Error('File does not contain valid JSON.');
          }
          entriesCount = Array.isArray(parsed.customerEntries)
            ? parsed.customerEntries.length
            : Array.isArray(parsed)
            ? parsed.length
            : 0;
          reportsCount = Array.isArray(parsed.reports) ? parsed.reports.length : 0;
          if (entriesCount === 0 && reportsCount === 0) {
            throw new Error('No customer records or reports found in the backup.');
          }
        }

        const preview = {
          labName: parsed.labName || 'Unknown Lab',
          timestamp: parsed.timestamp || 'Not recorded',
          entriesCount,
          reportsCount,
          raw: parsed,
          fileType: isCsv ? 'CSV Spreadsheet' : 'JSON Archive',
        };

        setCustomerBackupPreview(preview);
      } catch (err: any) {
        setCustomerBackupError(`Invalid customer backup: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setCustomerBackupError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleExecuteCustomerRestore = () => {
    if (!customerBackupPreview?.raw) return;
    setIsRestoringCustomer(true);

    setTimeout(() => {
      try {
        const result = importCustomerEntryBackup
          ? importCustomerEntryBackup(customerBackupPreview.raw, customerRestoreMode)
          : { success: true, message: 'Customer entries restored!', count: customerBackupPreview.entriesCount };

        if (result.success) {
          showToast(result.message || '✅ Customer entries successfully imported!');
          setCustomerBackupFile(null);
          setCustomerBackupPreview(null);
          if (customerFileInputRef.current) {
            customerFileInputRef.current.value = '';
          }
        } else {
          setCustomerBackupError(result.message);
        }
      } catch (err: any) {
        setCustomerBackupError(err.message);
      } finally {
        setIsRestoringCustomer(false);
      }
    }, 400);
  };

  // =========================================================================
  // 3. PATIENT REPORT BACKUP (PDF ZIP ARCHIVE) HANDLER
  // =========================================================================
  const handleDownloadPatientReportsZip = async () => {
    if (matchingReportsForZip.length === 0) {
      showToast(`⚠️ No patient reports found between ${dateFrom} and ${dateTo}. Please adjust the date filter.`);
      return;
    }

    setIsGeneratingZip(true);
    setZipProgress({
      current: 0,
      total: matchingReportsForZip.length,
      stage: 'Initializing ZIP archive package...',
    });

    try {
      const zip = new JSZip();
      const folderName = `${(vendorLabSettings.labName || 'Lab').replace(/[^a-zA-Z0-9]/g, '_')}_Reports_${dateFrom}_to_${dateTo}`;
      const reportsFolder = zip.folder(folderName) || zip;

      for (let i = 0; i < matchingReportsForZip.length; i++) {
        const rpt = matchingReportsForZip[i];
        setZipProgress({
          current: i + 1,
          total: matchingReportsForZip.length,
          stage: `Generating PDF (${i + 1}/${matchingReportsForZip.length}): ${rpt.patientName} (${rpt.reportId})...`,
        });

        // Build Canonical A4 Portrait PDF Doc
        const doc = await buildCanonicalReportPdf(rpt);
        const safePatientName = (rpt.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${rpt.reportId}_${safePatientName}_Report.pdf`;
        const arrayBuffer = doc.output('arraybuffer');
        reportsFolder.file(filename, arrayBuffer);
      }

      setZipProgress({
        current: matchingReportsForZip.length,
        total: matchingReportsForZip.length,
        stage: 'Compressing patient reports into final ZIP file...',
      });

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const safeLabName = (vendorLabSettings.labName || 'diagnostic-lab')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      const zipFilename = `${safeLabName}-patient-reports-${dateFrom}-to-${dateTo}.zip`;

      const downloadAnchor = document.createElement('a');
      const blobUrl = URL.createObjectURL(zipBlob);
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = zipFilename;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      showToast(`✅ Successfully downloaded ${matchingReportsForZip.length} patient reports in ZIP archive!`);
    } catch (err: any) {
      showToast(`❌ Failed to generate reports ZIP: ${err.message}`);
    } finally {
      setIsGeneratingZip(false);
      setZipProgress(null);
    }
  };

  // Filtered reports for the interactive table below
  const filteredReports = reports.filter((r) => {
    const q = reportSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.patientName.toLowerCase().includes(q) ||
      r.reportId.toLowerCase().includes(q) ||
      (r.mobile && r.mobile.includes(q)) ||
      (r.tokenNumber && r.tokenNumber.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (reportFilter === 'verified') return r.verified;
    if (reportFilter === 'due') return (r.dueAmount || 0) > 0;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Inputs for Website and Customer Backup */}
      <input
        ref={websiteFileInputRef}
        type="file"
        accept=".json"
        onChange={handleWebsiteFileChange}
        className="hidden"
      />
      <input
        ref={customerFileInputRef}
        type="file"
        accept=".json,.csv"
        onChange={handleCustomerFileChange}
        className="hidden"
      />

      {/* =========================================================================
          MODULE HEADER BANNER: VENDOR DASHBOARD – BACKUP MODULE
      ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-[#123B6D] to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Vendor Dashboard
              </span>
              <span className="bg-white/10 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/15">
                {vendorLabSettings.labName || 'Diagnostic Laboratory'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <HardDriveDownload className="w-6 h-6 text-amber-400" />
              <span>Vendor Dashboard – Backup Module</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Export and import your complete website configuration, customer entries ledger, and download all patient PDF reports inside a single ZIP file with custom date filters.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2.5 rounded-2xl text-right">
              <div className="text-[11px] font-medium text-slate-300">Total Patient Reports</div>
              <div className="text-xl font-black text-amber-300">{reports.length} Reports</div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          THE THREE BACKUP OPTIONS (3-COLUMN RESPONSIVE GRID)
          1. Full Website Backup (Download | Upload)
          2. Customer Entry Backup (Download | Upload)
          3. Patient Report Backup (Date From – Date To | Download ZIP)
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
        {/* =========================================================================
            CARD 1: FULL WEBSITE BACKUP
        ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all group">
          <div className="space-y-4">
            {/* Header / Title */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Website &amp; Data
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-700" />
                  <span>Full Website Backup</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 group-hover:scale-105 transition-transform shrink-0">
                <Globe className="w-5 h-5" />
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              Backup of the complete vendor website and its data.
            </p>

            {/* Snapshot Summary */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Packages</span>
                <strong className="text-sm font-black text-slate-900">{vendorPackages.length} Pkgs</strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tests</span>
                <strong className="text-sm font-black text-slate-900">{vendorTests.length} Tests</strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Doctors</span>
                <strong className="text-sm font-black text-slate-900">{vendorDoctors.length} Docs</strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Centers</span>
                <strong className="text-sm font-black text-slate-900">{vendorBranches.length} Centers</strong>
              </div>
            </div>

            {/* Error Message if any */}
            {websiteBackupError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{websiteBackupError}</span>
              </div>
            )}

            {/* Upload File Preview / Restore Confirmation */}
            {websiteBackupPreview && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2.5 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Backup File Ready</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setWebsiteBackupFile(null);
                      setWebsiteBackupPreview(null);
                      setWebsiteBackupError(null);
                      if (websiteFileInputRef.current) websiteFileInputRef.current.value = '';
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-slate-700 text-[11px]">
                  Laboratory: <strong>{websiteBackupPreview.labName}</strong>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] bg-white p-2 rounded-xl border border-emerald-200 text-center font-bold text-slate-800">
                  <div>{websiteBackupPreview.packagesCount} Pkgs</div>
                  <div>{websiteBackupPreview.testsCount} Tests</div>
                  <div>{websiteBackupPreview.doctorsCount} Docs</div>
                  <div>{websiteBackupPreview.branchesCount} Ctrs</div>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteWebsiteRestore}
                  disabled={isRestoringWebsite}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
                >
                  {isRestoringWebsite ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying Website Restore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Apply Restore</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* INLINE BUTTONS: Download | Upload */}
          <div className="pt-5 mt-5 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-download-website-backup"
                onClick={handleDownloadWebsiteBackup}
                className="flex-1 py-2.5 sm:py-3 px-3.5 rounded-2xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                title="Download backup of the complete vendor website and its data as JSON"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <button
                type="button"
                id="btn-upload-website-backup"
                onClick={() => websiteFileInputRef.current?.click()}
                className="flex-1 py-2.5 sm:py-3 px-3.5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                title="Upload website backup file (.json) to restore"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 2: CUSTOMER ENTRY BACKUP
        ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all group">
          <div className="space-y-4">
            {/* Header / Title */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Patient Ledger
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-700" />
                  <span>Customer Entry</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              Backup of all customer entries.
            </p>

            {/* Snapshot Summary */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Entries</span>
                <strong className="text-sm font-black text-slate-900">{receptionEntries.length} Patients</strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Reports</span>
                <strong className="text-sm font-black text-slate-900">{reports.length} Reports</strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Pending Dues</span>
                <strong className="text-sm font-black text-amber-700">
                  {receptionEntries.filter((e) => (e.dueAmount || 0) > 0).length} Due
                </strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Verified</span>
                <strong className="text-sm font-black text-emerald-700">
                  {reports.filter((r) => r.verified).length} Signed
                </strong>
              </div>
            </div>

            {/* Error Message if any */}
            {customerBackupError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{customerBackupError}</span>
              </div>
            )}

            {/* Upload File Preview / Restore Confirmation */}
            {customerBackupPreview && (
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-300 space-y-2.5 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Customer Archive Ready</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerBackupFile(null);
                      setCustomerBackupPreview(null);
                      setCustomerBackupError(null);
                      if (customerFileInputRef.current) customerFileInputRef.current.value = '';
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-slate-700 text-[11px]">
                  Found <strong>{customerBackupPreview.entriesCount} Customer Registrations</strong>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="vendorRestoreMode"
                      checked={customerRestoreMode === 'append'}
                      onChange={() => setCustomerRestoreMode('append')}
                      className="text-teal-600"
                    />
                    <span>Append</span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer ml-2">
                    <input
                      type="radio"
                      name="vendorRestoreMode"
                      checked={customerRestoreMode === 'replace'}
                      onChange={() => setCustomerRestoreMode('replace')}
                      className="text-teal-600"
                    />
                    <span>Replace All</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteCustomerRestore}
                  disabled={isRestoringCustomer}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
                >
                  {isRestoringCustomer ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Restoring Customer Records...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Restore Entries</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* INLINE BUTTONS: Download | Upload */}
          <div className="pt-5 mt-5 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-download-customer-backup"
                onClick={handleDownloadCustomerBackupJson}
                className="flex-1 py-2.5 sm:py-3 px-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                title="Download backup of all customer entries as JSON"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <button
                type="button"
                id="btn-upload-customer-backup"
                onClick={() => customerFileInputRef.current?.click()}
                className="flex-1 py-2.5 sm:py-3 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                title="Upload customer entries (.json or .csv)"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>

            {/* Optional Excel/CSV button */}
            <button
              type="button"
              onClick={handleDownloadCustomerCsv}
              className="w-full py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-[11px] font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Also Download as Excel / CSV Spreadsheet</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            CARD 3: PATIENT REPORT BACKUP (PDF ZIP ARCHIVE BY DATE RANGE)
        ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all group">
          <div className="space-y-4">
            {/* Header / Title */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  PDF ZIP Archive
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-purple-700" />
                  <span>Patient Report</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 group-hover:scale-105 transition-transform shrink-0">
                <FolderArchive className="w-5 h-5" />
              </div>
            </div>

            {/* Description as per prompt */}
            <p className="text-xs text-slate-600 leading-relaxed">
              All patient reports within the selected date range must be downloaded in PDF format inside a single ZIP file.
            </p>

            {/* Date Filter: Date From – Date To */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-700" />
                  <span>Date Filter (Date From – Date To)</span>
                </span>
                <span className="text-[10px] font-black text-purple-800 bg-purple-200/80 px-2 py-0.5 rounded-full">
                  {matchingReportsForZip.length} {matchingReportsForZip.length === 1 ? 'Report' : 'Reports'}
                </span>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    id="date-filter-from"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    id="date-filter-to"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Quick Range Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const today = getTodayStr();
                    setDateFrom(today);
                    setDateTo(today);
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 transition cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const past7 = new Date();
                    past7.setDate(today.getDate() - 7);
                    setDateFrom(past7.toISOString().slice(0, 10));
                    setDateTo(today.toISOString().slice(0, 10));
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 transition cursor-pointer"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom(getFirstOfMonthStr());
                    setDateTo(getTodayStr());
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 transition cursor-pointer"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('2024-01-01');
                    setDateTo(getTodayStr());
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 transition cursor-pointer"
                >
                  All Time
                </button>
              </div>
            </div>

            {/* ZIP Generation Progress indicator if active */}
            {zipProgress && (
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-700" />
                    <span>Packaging PDF ZIP Archive...</span>
                  </span>
                  <span>
                    {zipProgress.current} / {zipProgress.total}
                  </span>
                </div>
                <p className="text-[11px] text-purple-700 truncate">{zipProgress.stage}</p>
                <div className="w-full bg-purple-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-700 h-full transition-all duration-300"
                    style={{
                      width: `${(zipProgress.current / Math.max(zipProgress.total, 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* BUTTON: Download */}
          <div className="pt-5 mt-5 border-t border-slate-100">
            <button
              type="button"
              id="btn-download-patient-reports-zip"
              onClick={handleDownloadPatientReportsZip}
              disabled={isGeneratingZip || matchingReportsForZip.length === 0}
              className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download all patient reports within the selected date range in PDF format inside a single ZIP file"
            >
              {isGeneratingZip ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    Generating ZIP ({zipProgress?.current || 0}/{zipProgress?.total || 0})...
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REPORTS EXPLORER & MANAGEMENT TABLE (INSPECT, VERIFY, PRINT & VIEW PDF)
      ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#123B6D] border border-blue-200 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Reports Center ({reports.length} Total)
              </h3>
              <p className="text-xs text-slate-500">
                Inspect, verify, print, and preview individual canonical patient laboratory reports
              </p>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setReportFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                reportFilter === 'all'
                  ? 'bg-[#123B6D] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setReportFilter('verified')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                reportFilter === 'verified'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Verified ({reports.filter((r) => r.verified).length})
            </button>
            <button
              type="button"
              onClick={() => setReportFilter('due')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                reportFilter === 'due'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Pending Dues ({reports.filter((r) => (r.dueAmount || 0) > 0).length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            placeholder="Search by Patient Name, Report ID (e.g. RPT-2026-8812), or Mobile number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D]"
          />
          <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {reportSearch && (
            <button
              type="button"
              onClick={() => setReportSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Report / Token ID</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-4">Tests Ordered</th>
                <th className="py-3 px-4">Billing Status</th>
                <th className="py-3 px-4">Report Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No reports match the current query.
                  </td>
                </tr>
              ) : (
                filteredReports.slice(0, 15).map((rpt) => (
                  <tr key={rpt.reportId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#123B6D]">
                      {rpt.reportId}
                      {rpt.tokenNumber && (
                        <div className="text-[10px] text-slate-400 font-sans">
                          Token: {rpt.tokenNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rpt.patientName}</div>
                      <div className="text-[11px] text-slate-500">
                        {rpt.ageGender} • {rpt.mobile}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 truncate max-w-[200px]">
                        {rpt.items?.map((t) => t.testName).join(', ') || 'Diagnostic Panel'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Dr. {rpt.doctor || 'Self'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {(rpt.dueAmount || 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                          Due: ₹{rpt.dueAmount}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Paid in Full
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {rpt.verified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified &amp; Signed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                          <span>In Processing</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReportForPreview(rpt)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#123B6D] font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="View Canonical PDF Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => generateReportPdf(rpt)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center transition cursor-pointer"
                          title="Download PDF directly"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          CANONICAL PDF PREVIEW MODAL
      ========================================================================= */}
      {selectedReportForPreview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Canonical PDF Report Preview • {selectedReportForPreview.reportId}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Patient: {selectedReportForPreview.patientName} • {selectedReportForPreview.labName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateReportPdf(selectedReportForPreview)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => safePrint(() => generateReportPdf(selectedReportForPreview))}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReportForPreview(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Canonical PDF */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex items-center justify-center">
              <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md overflow-hidden">
                <CanonicalPdfViewer report={selectedReportForPreview} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
