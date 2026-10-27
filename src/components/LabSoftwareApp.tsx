import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  FlaskConical,
  Clock,
  CheckCheck,
  IndianRupee,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Search,
  Printer,
  MessageSquare,
  ShieldCheck,
  Check,
  ArrowLeft,
  Filter,
  QrCode,
  Building,
  UserCheck,
  Download,
  Share2,
  FileText,
  FileCheck,
  Eye,
  Zap,
  Sparkles,
  Edit2,
  Trash2,
  Globe,
  Lock,
  LogOut,
  Calendar,
  X,
  Receipt,
  RotateCcw,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Patient, TestItem, LabReport, ReportItem, ReceptionPatientEntry, AppView } from '../types';
import { CreateReportModal } from './CreateReportModal';
import { ReportDetailModal } from './ReportDetailModal';
import { SyncNowButton } from './SyncNowButton';
import { useCms } from '../context/CmsContext';
import { TEST_TEMPLATES, checkIsAbnormal } from '../data/testTemplates';
import { DashboardFooter } from './DashboardFooter';
import { ErrorBoundary } from './ErrorBoundary';
import { generateThermalReceiptPdf, buildReceiptInvoicePdf } from '../utils/pdfGenerator';
import { isReportAccessibleToTenant } from '../utils/tenantSecurity';
import { buildPatientReportUrl } from '../utils/domainRouting';
import { buildReceiptSlipImage, downloadReceiptImage } from '../utils/receiptImageGenerator';
import { WebsiteTokenReceiptCard } from './vendor/WebsiteTokenReceiptCard';

interface LabSoftwareAppProps {
  onBackToWebsite: () => void;
  onViewReport: (reportId: string, mobile: string) => void;
  onNavigateView?: (view: AppView) => void;
  isEmbedded?: boolean;
}

export const LabSoftwareApp: React.FC<LabSoftwareAppProps> = ({
  onBackToWebsite,
  onViewReport,
  onNavigateView,
  isEmbedded = false,
}) => {
  const {
    vendorLabSettings,
    addLabReport,
    updateLabReport,
    deleteLabReport,
    getReportById,
    reports,
    receptionEntries,
    addReceptionEntry,
    sendEntryToTechnician,
    acceptEntryByTechnician,
    completeTechnicianReport,
    deleteReceptionEntry,
    updateReceptionEntry,
    vendorTests,
    logout,
    activeBranchId,
    setActiveBranchId,
    activeTenantId,
    selectedVendorLabId,
    allReports,
    allReceptionEntries,
  } = useCms();
  const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology Laboratory';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'results'>('dashboard');
  const [selectedBranch, setSelectedBranch] = useState('br-a');
  const [currentUser, setCurrentUser] = useState('Dr. Rohit Sharma (MD Pathologist)');

  // 3. Patient Tabs: 'all' | 'waiting' | 'in_testing' | 'report_done' | 'report_ready'
  type PatientTab = 'all' | 'waiting' | 'in_testing' | 'report_done' | 'report_ready';
  const [patientTab, setPatientTab] = useState<PatientTab>('all');

  // 4. Search & Filters (Independent)
  // Search by Token Number or Phone Number
  const [searchTokenOrPhone, setSearchTokenOrPhone] = useState('');
  // Date Filter & Custom Date
  const [dateFilter, setDateFilter] = useState<'All Dates' | 'Today' | 'Yesterday' | 'Custom Date'>('All Dates');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  // Payment Mode Filter
  const [paymentModeFilter, setPaymentModeFilter] = useState<'All' | 'UPI' | 'Cash' | 'Card'>('All');
  // View Mode: Grid (3 in a row, next test in second row) or Table
  const [worklistViewMode, setWorklistViewMode] = useState<'grid' | 'table'>('grid');

  // Toast notification for user actions (e.g. Send to Reception Desk, Start Testing)
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Receipt Modal State for Technician
  const [selectedReceipt, setSelectedReceipt] = useState<ReceptionPatientEntry | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Cancellation / Return to Reception Modal State
  const [cancellingPatient, setCancellingPatient] = useState<Patient | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');

  // Independent Date Calculations
  const todayDateStr = new Date().toISOString().split('T')[0];
  const yesterdayDateObj = new Date();
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  const yesterdayDateStr = yesterdayDateObj.toISOString().split('T')[0];

  const getPatientDate = (p: Patient): string => {
    if (p.entryDate) return p.entryDate;
    if (p.id === 'rcp-103' || p.id === 'rcp-104') return yesterdayDateStr;
    if (p.id?.startsWith('rcp-')) {
      const ts = Number(p.id.replace('rcp-', ''));
      if (!isNaN(ts) && ts > 1600000000000) {
        return new Date(ts).toISOString().split('T')[0];
      }
    }
    return todayDateStr;
  };

  // Transferred reception entries: All entries from active vendor's reception desk
  const transferredReceptionEntries = useMemo(() => {
    return receptionEntries;
  }, [receptionEntries]);

  // Tenant-isolated patients derived directly from active vendor's transferred reception queue
  const patients = useMemo<Patient[]>(() => {
    const baseList: Patient[] = transferredReceptionEntries.map((r) => {
      const rawTests = r.tests;
      const testList: string[] = Array.isArray(rawTests)
        ? rawTests
        : typeof rawTests === 'string'
        ? (rawTests as string).split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const rawTokenVal = String(r.tokenNumber || r.tokenNo || '').trim();
      const tokenNumber = rawTokenVal
        ? (/^TK[-_\s]?/i.test(rawTokenVal) ? `TK-${rawTokenVal.replace(/^TK[-_\s]?/i, '')}` : `TK-${rawTokenVal}`)
        : r.id?.startsWith('rcp-') && r.id.replace('rcp-', '').length > 6
        ? `TK-${r.id.replace('rcp-', '').slice(-3)}`
        : (r.id ? `TK-${r.id}` : '');
      const isReturned = Boolean(r.returnedByTechnician);

      const cleanRptId = String(r.reportId || '').trim().toLowerCase();
      const cleanUhid = String(r.uhid || '').trim().toLowerCase();
      const cleanMobile = String(r.mobile || '').replace(/\D/g, '').slice(-10);
      const cleanName = String(r.patientName || '').trim().toLowerCase();

      const existingReport = reports.find((rp) => {
        if (cleanRptId && rp.reportId && String(rp.reportId).trim().toLowerCase() === cleanRptId) return true;
        if (cleanUhid && rp.uhid && String(rp.uhid).trim().toLowerCase() === cleanUhid) return true;
        if (cleanMobile && cleanMobile.length >= 7 && rp.mobile && String(rp.mobile).replace(/\D/g, '').slice(-10) === cleanMobile) return true;
        if (cleanName && rp.patientName && String(rp.patientName).trim().toLowerCase() === cleanName) return true;
        return false;
      }) || null;

      const isDraft = Boolean(existingReport?.isDraft);
      const isReportDone =
        !isDraft &&
        (r.status === 'Report Ready' ||
          r.technicianStatus === 'Report Generated' ||
          Boolean(r.reportId) ||
          Boolean(existingReport && !existingReport.isDraft) ||
          (Boolean(r.reportId) && Boolean(existingReport?.verified)));
      const isInTesting = !isReportDone && !isReturned && (r.technicianStatus === 'Accepted' || r.status === 'In Lab' || isDraft);
      const isWaiting = !isReportDone && !isInTesting && !isReturned;
      const workflowStatus = isReturned ? 'Returned' : isReportDone ? 'Report Ready' : isInTesting ? 'In Testing' : 'Waiting';

      return {
        id: r.id,
        uhid: r.uhid || `UHID-${r.id}`,
        tokenNumber,
        tokenNo: tokenNumber,
        name: r.patientName || 'Unknown Patient',
        age: Number(r.age) || 30,
        gender: r.gender || 'Male',
        mobile: r.mobile || '',
        city: vendorLabSettings?.address ? vendorLabSettings.address.split(',').pop()?.trim() || 'City' : 'City',
        referringDoctor: r.referringDoctor || 'Self / Walk-in',
        registeredAt: r.registeredAt || 'Today',
        entryDate: r.entryDate || (r.registeredAt && r.registeredAt.includes('-') ? r.registeredAt : undefined),
        reportId: r.reportId || existingReport?.reportId || '',
        status: workflowStatus as any,
        isDraft,
        tests: testList,
        totalBill: r.totalAmount || 0,
        paidAmount: r.paidAmount || 0,
        dueAmount: r.dueAmount || 0,
        paymentMode: (r.paymentMode as any) || 'UPI',
        labId: r.labId,
        branchId: r.branchId,
        branchName: r.branchName,
        sentToReceptionDesk: Boolean(r.sentToReceptionDesk),
        sentToReceptionAt: r.sentToReceptionAt,
        technicianStatus: r.technicianStatus,
        returnedByTechnician: r.returnedByTechnician,
        returnReason: r.returnReason,
        returnedAt: r.returnedAt,
        notes: r.notes,
      };
    });

    // Also include any standalone completed reports in reports not already in reception queue
    const mappedReportIds = new Set(baseList.map((e) => String(e.reportId || '').toLowerCase()).filter(Boolean));
    const mappedUhids = new Set(baseList.map((e) => String(e.uhid || '').toLowerCase()).filter(Boolean));

    const standaloneReportPatients: Patient[] = reports
      .filter(
        (rp) =>
          !rp.isDraft &&
          !mappedReportIds.has(String(rp.reportId || '').toLowerCase()) &&
          (!rp.uhid || !mappedUhids.has(String(rp.uhid).toLowerCase()))
      )
      .map((rp) => ({
        id: `rpt-pat-${rp.reportId}`,
        uhid: rp.uhid || `UHID-${rp.reportId}`,
        tokenNumber: rp.tokenNumber || 'TK-RPT',
        tokenNo: rp.tokenNumber || 'TK-RPT',
        name: rp.patientName || 'Report Patient',
        age: Number(rp.ageGender?.match(/\d+/)?.[1] || 35),
        gender: (rp.ageGender?.toLowerCase().includes('female') ? 'Female' : 'Male') as any,
        mobile: rp.mobile || '',
        city: vendorLabSettings?.address ? vendorLabSettings.address.split(',').pop()?.trim() || 'City' : 'City',
        referringDoctor: rp.doctor || 'Dr. Self / Direct Consultation',
        registeredAt: rp.reportedAt || 'Today',
        reportId: rp.reportId,
        status: 'Report Ready' as any,
        isDraft: false,
        tests: rp.items?.map((it) => it.testName).filter((v, i, a) => a.indexOf(v) === i) || ['Diagnostic Test'],
        totalBill: 350,
        paidAmount: 350,
        dueAmount: 0,
        paymentMode: 'Cash',
        sentToReceptionDesk: true,
        sentToReceptionAt: rp.reportedAt,
        technicianStatus: 'Report Generated',
      }));

    return [...baseList, ...standaloneReportPatients];
  }, [transferredReceptionEntries, vendorLabSettings?.address, reports]);

  // Tab counts
  const countAll = patients.length;
  const countWaiting = patients.filter((p) => p.status === 'Waiting').length;
  const countInTesting = patients.filter((p) => p.status === 'In Testing').length;
  const countReportReady = patients.filter(
    (p) => p.status === 'Report Ready' || p.status === 'Report Done' || Boolean(p.reportId && !p.isDraft)
  ).length;
  const countReportDone = countReportReady;


  // Report Generator & Detail Modals
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false);
  const [selectedPatientForReport, setSelectedPatientForReport] = useState<Patient | null>(null);
  const [selectedReportToEdit, setSelectedReportToEdit] = useState<LabReport | null>(null);
  const [previewReport, setPreviewReport] = useState<LabReport | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Workstation Tab (Tab 4: Results) State
  const [workstationPatientId, setWorkstationPatientId] = useState<string>('');

  useEffect(() => {
    if (patients.length > 0) {
      if (!workstationPatientId || !patients.some((p) => p.id === workstationPatientId)) {
        setWorkstationPatientId(patients[0].id);
      }
    } else {
      setWorkstationPatientId('');
    }
  }, [patients, workstationPatientId]);
  const [workstationParams, setWorkstationParams] = useState<
    { id: string; testName: string; parameter: string; result: string; unit: string; referenceRange: string; isAbnormal: boolean }[]
  >([]);
  const [workstationImpression, setWorkstationImpression] = useState(
    'Parameters are within biological reference intervals for age and gender.'
  );
  const [workstationSuccessNotice, setWorkstationSuccessNotice] = useState(false);

  // Offline Simulation State
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Patient Form State
  const [showRegModal, setShowRegModal] = useState(false);
  const [isTechnicianEntryBlockedModalOpen, setIsTechnicianEntryBlockedModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('42');
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPatientMobile, setNewPatientMobile] = useState('');
  const [newPatientDoctor, setNewPatientDoctor] = useState('Dr. S. K. Gupta (MD Med)');
  const [selectedTests, setSelectedTests] = useState<string[]>(['Complete Blood Count (CBC) with ESR']);
  const [paidNow, setPaidNow] = useState('350');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card'>('UPI');

  // In-app Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Search in table
  const [searchFilter, setSearchFilter] = useState('');

  // Handle Offline Simulation Toggle
  const toggleOffline = () => {
    if (!isOffline) {
      setIsOffline(true);
    } else {
      setIsSyncing(true);
      setTimeout(() => {
        setIsOffline(false);
        setOfflineQueue(0);
        setIsSyncing(false);
      }, 1200);
    }
  };

  const handleOpenAddPatient = () => {
    setIsTechnicianEntryBlockedModalOpen(true);
  };

  const handleOpenEditPatient = (p: Patient) => {
    setEditingPatient(p);
    setNewPatientName(p.name);
    setNewPatientAge(String(p.age));
    setNewPatientGender(p.gender as any);
    setNewPatientMobile(p.mobile);
    setNewPatientDoctor(p.referringDoctor);
    setSelectedTests(p.tests && p.tests.length > 0 ? [...p.tests] : ['Complete Blood Count (CBC) with ESR']);
    setPaidNow(String(p.paidAmount ?? 0));
    setPaymentMode((p.paymentMode as any) || 'UPI');
    setShowRegModal(true);
  };

  const handleDeletePatient = (p: Patient) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Are you sure you want to delete this?',
      message: `Patient "${p.name}" (${p.uhid || p.tokenNumber || p.id}) will be permanently removed from today's worklist and queue.`,
      confirmText: 'Yes',
      onConfirm: () => {
        deleteReceptionEntry(p.id);
        if (p.reportId) {
          deleteLabReport(p.reportId);
        }
        if (workstationPatientId === p.id) {
          const remaining = patients.filter((item) => item.id !== p.id);
          if (remaining.length > 0) setWorkstationPatientId(remaining[0].id);
        }
        setDeleteConfirm(null);
        setToastNotice(`Patient "${p.name}" deleted successfully.`);
        setTimeout(() => setToastNotice(null), 3000);
      },
    });
  };


  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientMobile.trim()) return;

    const total = selectedTests.reduce((acc, testName) => {
      const found = vendorTests.find((t) => t.name === testName);
      return acc + (found?.priceINR || 300);
    }, 0);

    const paid = Number(paidNow) || 0;
    const due = Math.max(0, (total || 350) - paid);

    if (editingPatient) {
      // Update existing patient in reception entries
      updateReceptionEntry(editingPatient.id, {
        patientName: newPatientName.trim(),
        age: Number(newPatientAge) || editingPatient.age,
        gender: newPatientGender,
        mobile: newPatientMobile.trim(),
        referringDoctor: newPatientDoctor,
        tests: selectedTests.length > 0 ? selectedTests : editingPatient.tests,
        totalAmount: total > 0 ? total : editingPatient.totalBill,
        paidAmount: paid,
        dueAmount: due,
        paymentMode: paymentMode,
      });
    } else {
      // Create new patient is strictly blocked for technicians
      setShowRegModal(false);
      setIsTechnicianEntryBlockedModalOpen(true);
      return;
    }

    // Reset Form
    setNewPatientName('');
    setNewPatientMobile('');
    setEditingPatient(null);
    setShowRegModal(false);
  };

  const handleWhatsAppSend = (patient: Patient) => {
    const labTitle = vendorLabSettings?.labName || 'Apex Diagnostics';
    const reportUrl = `${window.location.origin}?report=${patient.reportId}`;
    const text = encodeURIComponent(
      `Namaste ${patient.name} Ji, your test report (${patient.reportId}) from ${labTitle} is ready. View & download without login: ${reportUrl}`
    );
    window.open(`https://wa.me/91${patient.mobile}?text=${text}`, '_blank');
  };

  // Workstation parameter loader when workstationPatientId changes
  useEffect(() => {
    const pat = patients.find((p) => p.id === workstationPatientId) || patients[0];
    if (!pat) return;

    // Build initial parameters based on patient tests
    const initialParams: {
      id: string;
      testName: string;
      parameter: string;
      result: string;
      unit: string;
      referenceRange: string;
      isAbnormal: boolean;
    }[] = [];

    const matchedTemplates: string[] = [];
    const patTests = Array.isArray(pat.tests)
      ? pat.tests
      : typeof pat.tests === 'string'
      ? (pat.tests as string).split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    patTests.forEach((t) => {
      const lower = String(t).toLowerCase();
      if (lower.includes('cbc') || lower.includes('blood count')) matchedTemplates.push('cbc');
      if (lower.includes('diabet') || lower.includes('sugar') || lower.includes('hba1c')) matchedTemplates.push('diabetes');
      if (lower.includes('lipid') || lower.includes('cholesterol')) matchedTemplates.push('lipid');
      if (lower.includes('lft') || lower.includes('liver')) matchedTemplates.push('lft');
      if (lower.includes('kft') || lower.includes('kidney')) matchedTemplates.push('kft');
      if (lower.includes('thyroid')) matchedTemplates.push('thyroid');
      if (lower.includes('urine')) matchedTemplates.push('urine_rm');
    });

    const activeTemplates = matchedTemplates.length > 0 ? Array.from(new Set(matchedTemplates)) : ['cbc'];

    activeTemplates.forEach((tid) => {
      const tmpl = TEST_TEMPLATES.find((t) => t.id === tid);
      if (tmpl) {
        tmpl.parameters.slice(0, 8).forEach((p, idx) => {
          initialParams.push({
            id: `${tid}-${idx}`,
            testName: tmpl.name,
            parameter: p.name,
            result: p.defaultNormalValue,
            unit: p.unit,
            referenceRange: p.referenceRange,
            isAbnormal: false,
          });
        });
      }
    });

    setWorkstationParams(initialParams);
  }, [workstationPatientId, patients]);

  const handleOpenCreateReportModal = (patient?: Patient, report?: LabReport) => {
    setSelectedPatientForReport(patient || null);
    if (report) {
      setSelectedReportToEdit(report);
    } else if (patient && patient.reportId) {
      const existing = getReportById(patient.reportId) || reports.find(r => r.reportId === patient.reportId);
      setSelectedReportToEdit(existing || null);
    } else {
      setSelectedReportToEdit(null);
    }
    setIsCreateReportModalOpen(true);
  };

  const handleEditReport = (report: LabReport) => {
    const pat = patients.find(
      (p) => p.reportId === report.reportId || p.uhid === report.uhid || p.mobile === report.mobile
    );
    setIsPreviewModalOpen(false);
    setSelectedPatientForReport(pat || null);
    setSelectedReportToEdit(report);
    setIsCreateReportModalOpen(true);
  };

  const handleSendToReceptionDesk = (patient: Patient) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update reception entry
    updateReceptionEntry(patient.id, {
      sentToReceptionDesk: true,
      sentToReceptionAt: `Today, ${timeStr}`,
      isReportPublished: false,
    });

    // Update lab report if exists
    if (patient.reportId) {
      updateLabReport(patient.reportId, {
        sentToReceptionDesk: true,
        sentToReceptionAt: `Today, ${timeStr}`,
      });
    }

    setToastNotice(`Report for ${patient.name} (${patient.tokenNumber || patient.uhid}) sent to Reception Desk. Ready report can be edited anytime if any mistake is found.`);
    setTimeout(() => setToastNotice(null), 4500);
  };

  const handleStartTesting = (patient: Patient) => {
    updateReceptionEntry(patient.id, {
      technicianStatus: 'Accepted',
      status: 'In Lab',
    });
    setToastNotice(`Specimen accepted for ${patient.name} (${patient.tokenNumber || patient.uhid}). Moved to "In Test" tab.`);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleOpenCancelModal = (patient: Patient) => {
    setCancellingPatient(patient);
    setCancelReason('');
    setCancelReasonError('');
  };

  const handleConfirmCancel = () => {
    if (!cancellingPatient) return;
    if (!cancelReason.trim()) {
      setCancelReasonError('Technician reason is required for returning/cancelling the entry.');
      return;
    }
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const reasonText = cancelReason.trim();

    updateReceptionEntry(cancellingPatient.id, {
      status: 'Waiting',
      sentToTechnician: false,
      technicianStatus: 'Returned',
      returnedByTechnician: true,
      returnReason: reasonText,
      returnedAt: `Today, ${timeStr}`,
      notes: cancellingPatient.notes
        ? `${cancellingPatient.notes} • [Technician Return: ${reasonText}]`
        : `[Technician Return: ${reasonText}]`,
    });

    setToastNotice(
      `Entry for ${cancellingPatient.name} (${cancellingPatient.tokenNumber || cancellingPatient.uhid}) returned to Reception Desk. Reception received notification: “Technician has returned the entry.”`
    );
    setTimeout(() => setToastNotice(null), 5000);

    setCancellingPatient(null);
    setCancelReason('');
    setCancelReasonError('');
  };

  const handleViewReceipt = (p: Patient) => {
    const rec = receptionEntries.find((r) => r.id === p.id || r.uhid === p.uhid);
    const entryForReceipt: ReceptionPatientEntry = rec || {
      id: p.id,
      uhid: p.uhid,
      tokenNumber: p.tokenNumber || p.tokenNo || p.uhid || '',
      patientName: p.name,
      age: p.age,
      gender: p.gender,
      mobile: p.mobile,
      referringDoctor: p.referringDoctor,
      tests: p.tests,
      totalAmount: p.totalBill,
      paidAmount: p.paidAmount,
      dueAmount: p.dueAmount,
      paymentMode: p.paymentMode,
      registeredAt: p.registeredAt,
      entryDate: p.entryDate,
      sampleType: 'Blood / Specimen',
      status: 'Waiting',
      paymentStatus: p.dueAmount === 0 ? 'Paid' : 'Due',
    };
    setSelectedReceipt(entryForReceipt);
    setIsReceiptModalOpen(true);
  };

  const handleShareReceipt = async (entry: ReceptionPatientEntry) => {
    try {
      const labId = entry.labId || (activeTenantId !== 'all' ? activeTenantId : selectedVendorLabId);
      const testNamesStr = entry.tests.join(', ');
      const reportUrl = buildPatientReportUrl(labId, entry.tokenNumber);
      const cleanMobile = entry.mobile.replace(/\D/g, '');
      const clean10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

      const total = entry.totalAmount || 0;
      const discount = entry.discountINR || 0;
      const net = total - discount;
      const paid = entry.paidAmount || 0;
      const due = entry.dueAmount ?? Math.max(0, net - paid);

      const shareText = [
        `🏥 *Registration Confirmed!*`,
        ``,
        `Dear *${entry.patientName}*, your lab test registration is confirmed. ✅`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `🎫 *Token No.:* *${entry.tokenNumber}*`,
        `📋 *UHID:* ${entry.uhid}`,
        `👤 *Patient:* ${entry.patientName} (${entry.age} Yrs / ${entry.gender})`,
        entry.referringDoctor ? `👨‍⚕️ *Doctor:* ${entry.referringDoctor}` : '',
        `🧪 *Tests:* ${testNamesStr}`,
        `💰 *Bill Summary:* Gross ₹${total}${discount > 0 ? `, Concession -₹${discount}` : ''} | *Net ₹${net}*`,
        `💵 *Paid:* ₹${paid} (${entry.paymentMode || 'Cash'})`,
        due > 0 ? `⚠️ *Balance Due:* ₹${due} (Pay on Spot)` : `✅ *Payment Status:* Paid in Full`,
        entry.visitType === 'Home Collection' && entry.address ? `🏠 *Home Pickup:* ${entry.address}${entry.preferredTimeSlot ? ` (${entry.preferredTimeSlot})` : ''}` : '',
        `📅 *Date:* ${entry.registeredAt || new Date().toLocaleDateString('en-IN')}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `🔗 *View Report:* ${reportUrl}`,
        ``,
        `🖼️ *Receipt Slip:* Attached / Downloaded with this WhatsApp message.`,
        `📍 *${labName}*${vendorLabSettings?.phone ? ` • Ph: ${vendorLabSettings.phone}` : ''}`,
      ].filter(Boolean).join('\n');

      const { file, blob, dataUrl, filename } = await buildReceiptSlipImage({
        tokenNumber: entry.tokenNumber,
        uhid: entry.uhid,
        patientName: entry.patientName,
        age: entry.age,
        gender: entry.gender,
        mobile: entry.mobile,
        referringDoctor: entry.referringDoctor,
        tests: entry.tests,
        totalAmount: entry.totalAmount,
        paidAmount: entry.paidAmount,
        dueAmount: entry.dueAmount,
        paymentMode: entry.paymentMode,
        paymentStatus: entry.paymentStatus,
        registeredAt: entry.registeredAt,
        visitType: entry.visitType,
        address: entry.address,
        timeSlot: entry.preferredTimeSlot,
        labId: labId,
        labName: labName,
        labPhone: vendorLabSettings?.phone || '7087033009',
        showPrices: true,
      }, labName);

      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== 'undefined' ? navigator.userAgent : ''
      );

      if (isMobileDevice && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Registration Slip ${entry.tokenNumber}`,
            text: shareText,
          });
          setToastNotice(`Receipt Slip with text shared via WhatsApp for ${entry.patientName}!`);
          setTimeout(() => setToastNotice(null), 3000);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
        }
      }

      downloadReceiptImage(dataUrl, filename);

      try {
        if (navigator.clipboard && (window as any).ClipboardItem && blob) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob }),
          ]);
        }
      } catch {
        try {
          await navigator.clipboard.writeText(shareText);
        } catch {}
      }

      const encoded = encodeURIComponent(shareText);
      const url = isMobileDevice
        ? (clean10 ? `https://wa.me/91${clean10}?text=${encoded}` : `https://wa.me/?text=${encoded}`)
        : (clean10 ? `https://web.whatsapp.com/send?phone=91${clean10}&text=${encoded}` : `https://web.whatsapp.com/send?text=${encoded}`);

      window.open(url, '_blank', 'noopener,noreferrer');
      setToastNotice(`WhatsApp Web opened with Slip Text & Report Link for ${entry.patientName}!`);
      setTimeout(() => setToastNotice(null), 3500);
    } catch (err) {
      console.error(err);
      setToastNotice('Failed to share receipt. Please try again.');
      setTimeout(() => setToastNotice(null), 3000);
    }
  };

  const handlePrintReceipt = (entry: ReceptionPatientEntry) => {
    try {
      generateThermalReceiptPdf(entry, labName);
      setToastNotice('Preparing thermal receipt for print/download...');
      setTimeout(() => setToastNotice(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReport = (report: LabReport) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Are you sure you want to delete this?',
      message: `Diagnostic Report ${report.reportId} for patient "${report.patientName}" will be permanently deleted. This action cannot be undone.`,
      confirmText: 'Yes',
      onConfirm: () => {
        deleteLabReport(report.reportId);
        const rec = receptionEntries.find((r) => r.reportId === report.reportId);
        if (rec) {
          updateReceptionEntry(rec.id, { reportId: undefined, status: 'In Lab', technicianStatus: 'Accepted' });
        }
        if (previewReport?.reportId === report.reportId) {
          setIsPreviewModalOpen(false);
          setPreviewReport(null);
        }
        setDeleteConfirm(null);
        setToastNotice(`Report ${report.reportId} deleted successfully.`);
        setTimeout(() => setToastNotice(null), 3000);
      },
    });
  };

  const handleReportCreated = (report: LabReport, patientId?: string, isDraft?: boolean) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isDraft) {
      const draftReport: LabReport = {
        ...report,
        isDraft: true,
        verified: false,
        sentToReceptionDesk: false,
      };

      const existing = getReportById(draftReport.reportId) || reports.find((r) => r.reportId === draftReport.reportId);
      if (existing) {
        updateLabReport(draftReport.reportId, draftReport);
      } else {
        addLabReport(draftReport);
      }

      // Sync with reception entry - keep in testing / draft
      const rec = receptionEntries.find(
        (r) =>
          r.id === patientId ||
          r.uhid === report.uhid ||
          r.reportId === report.reportId ||
          (r.mobile && report.mobile && r.mobile.replace(/\D/g, '').slice(-10) === report.mobile.replace(/\D/g, '').slice(-10))
      );
      if (rec) {
        updateReceptionEntry(rec.id, {
          reportId: draftReport.reportId,
          status: 'In Lab',
          technicianStatus: 'Accepted',
        });
      }

      setToastNotice(`Report saved as draft for ${report.patientName}. The report remains editable in In Testing.`);
      setTimeout(() => setToastNotice(null), 4000);
      return;
    }

    // Complete report
    const stampedReport: LabReport = {
      ...report,
      isDraft: false,
      verified: true,
      sentToReceptionDesk: true,
      sentToReceptionAt: `Today, ${timeStr}`,
    };

    const existing =
      getReportById(stampedReport.reportId) ||
      reports.find((r) => r.reportId && r.reportId.toLowerCase() === stampedReport.reportId.toLowerCase());
    if (existing) {
      updateLabReport(stampedReport.reportId, stampedReport);
    } else {
      addLabReport(stampedReport);
    }

    // Sync with reception entry if applicable and complete report
    const cleanRptId = String(report.reportId || '').trim().toLowerCase();
    const cleanRptUhid = String(report.uhid || '').trim().toLowerCase();
    const cleanRptMobile = String(report.mobile || '').replace(/\D/g, '').slice(-10);
    const cleanRptName = String(report.patientName || '').trim().toLowerCase();

    const rec = receptionEntries.find(
      (r) =>
        (patientId && r.id === patientId) ||
        (cleanRptId && r.reportId && String(r.reportId).trim().toLowerCase() === cleanRptId) ||
        (cleanRptUhid && r.uhid && String(r.uhid).trim().toLowerCase() === cleanRptUhid) ||
        (cleanRptMobile && cleanRptMobile.length >= 7 && r.mobile && String(r.mobile).replace(/\D/g, '').slice(-10) === cleanRptMobile) ||
        (cleanRptName && r.patientName && String(r.patientName).trim().toLowerCase() === cleanRptName)
    );

    if (rec) {
      completeTechnicianReport(rec.id, report.reportId);
      updateReceptionEntry(rec.id, {
        reportId: report.reportId,
        status: 'Report Ready',
        technicianStatus: 'Report Generated',
        sentToReceptionDesk: true,
        sentToReceptionAt: `Today, ${timeStr}`,
      });
    } else {
      // Direct report generated by technician without prior reception entry: register in queue
      try {
        addReceptionEntry({
          uhid: report.uhid || `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          patientName: report.patientName,
          age: Number(report.ageGender?.match(/\d+/)?.[1] || 30),
          gender: (report.ageGender?.toLowerCase().includes('female') ? 'Female' : 'Male') as any,
          mobile: report.mobile || '',
          referringDoctor: report.doctor || 'Dr. Self / Direct Consultation',
          tests: report.items?.map((it) => it.testName).filter((v, i, a) => a.indexOf(v) === i) || ['Diagnostic Test'],
          sampleType: report.sampleType || 'EDTA Blood',
          totalAmount: 350,
          discountINR: 0,
          paidAmount: 350,
          dueAmount: 0,
          paymentMode: 'Cash',
          paymentStatus: 'Full Payment',
          status: 'Report Ready',
          technicianStatus: 'Report Generated',
          sentToTechnician: true,
          reportId: report.reportId,
          sentToReceptionDesk: true,
          sentToReceptionAt: `Today, ${timeStr}`,
          isReportPublished: false,
          registeredAt: `Today, ${timeStr}`,
        });
      } catch (err) {
        console.warn('[Sync Notice] Could not create fallback reception entry:', err);
      }
    }

    // Move to Report Ready tab and clear search and filters so patient is immediately visible
    setActiveTab('dashboard');
    setPatientTab('report_ready');
    setSearchTokenOrPhone('');
    setDateFilter('All Dates');
    setPaymentModeFilter('All');

    setToastNotice(`Report completed and moved to Report Ready tab for ${report.patientName}!`);
    setTimeout(() => setToastNotice(null), 4500);

    setPreviewReport(stampedReport);
  };


  const handleOpenReportPreview = (reportId: string, mobile: string) => {
    const found = getReportById(reportId) || reports.find((r) => r.reportId === reportId);
    if (found) {
      setPreviewReport(found);
      setIsPreviewModalOpen(true);
    } else {
      onViewReport(reportId, mobile);
    }
  };

  const handleSignWorkstationReport = () => {
    const pat = patients.find((p) => p.id === workstationPatientId) || patients[0];
    if (!pat) return;

    const items: ReportItem[] = workstationParams.map((wp) => ({
      testName: wp.testName,
      parameter: wp.parameter,
      result: wp.result,
      unit: wp.unit,
      referenceRange: wp.referenceRange,
      isAbnormal: wp.isAbnormal,
    }));

    const rpt: LabReport = {
      reportId: pat.reportId || `RPT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      uhid: pat.uhid,
      patientName: pat.name,
      ageGender: `${pat.age} Yrs / ${pat.gender}`,
      mobile: pat.mobile,
      doctor: pat.referringDoctor,
      sampleCollectedAt: 'Today, 08:30 AM',
      reportedAt: 'Today, ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      labName: vendorLabSettings?.labName || vendorLabSettings?.name || labName || 'Apex Diagnostic & Clinical Pathology Laboratory',
      labAddress: vendorLabSettings?.address || 'Medical Complex, India',
      labPhone: vendorLabSettings?.phone || '+91 7087033009',
      labEmail: vendorLabSettings?.email || 'care@' + (vendorLabSettings?.domainPreview || 'apexdiagnostics.indianlalaji.com').split('/')[0],
      labDomain: vendorLabSettings?.domainPreview || vendorLabSettings?.websiteDomain || vendorLabSettings?.websiteUrl || 'apexdiagnostics.indianlalaji.com',
      labTimings: vendorLabSettings?.openingHours || vendorLabSettings?.emergencyHours || '07:00 AM - 09:00 PM',
      nablAccreditationNo: vendorLabSettings?.nablAccreditationNo || 'NABL Accredited',
      pathologist: 'Dr. Rohit Sharma, MD (Pathology)',
      pathologistDegrees: 'Consultant Pathologist • Reg No: PMC-48192',
      barcode: '||||| | |||| ||| |||||| ||||| |||',
      verified: true,
      verificationHash: `SHA256: ${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      items,
      clinicalImpression: workstationImpression,
      clinicNote: workstationImpression,
      labId: pat.labId || vendorLabSettings?.labId || (activeTenantId !== 'all' ? activeTenantId : 'lab'),
    };

    addLabReport(rpt);
    handleReportCreated(rpt, pat.id, false);
    setActiveTab('dashboard');
    setPatientTab('report_ready');
    setWorkstationSuccessNotice(true);
    setTimeout(() => setWorkstationSuccessNotice(false), 3000);
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // 1. Patient Tabs: 'all' | 'waiting' | 'in_testing' | 'report_done' | 'report_ready'
      if (patientTab === 'waiting' && p.status !== 'Waiting') return false;
      if (patientTab === 'in_testing' && p.status !== 'In Testing') return false;
      if (
        (patientTab === 'report_done' || patientTab === 'report_ready') &&
        !(p.status === 'Report Ready' || p.status === 'Report Done' || Boolean(p.reportId && !p.isDraft))
      ) {
        return false;
      }

      // 2. Search by Token Number or Phone Number (Independent)
      if (searchTokenOrPhone.trim()) {
        const q = searchTokenOrPhone.trim().toLowerCase();
        // Strict Tenant Isolation: Only patients belonging to this lab can be viewed
        if (!isReportAccessibleToTenant(q, activeTenantId || selectedVendorLabId, allReports, allReceptionEntries)) {
          return false;
        }
        const qDigits = searchTokenOrPhone.replace(/\D/g, '');
        const matchToken =
          (p.tokenNumber && p.tokenNumber.toLowerCase().includes(q)) ||
          (p.tokenNo && p.tokenNo.toLowerCase().includes(q)) ||
          (p.uhid && p.uhid.toLowerCase().includes(q));
        const matchPhone =
          (p.mobile && p.mobile.includes(q)) ||
          (qDigits.length > 0 && p.mobile && p.mobile.replace(/\D/g, '').includes(qDigits));

        if (!matchToken && !matchPhone) {
          return false;
        }
      }

      // 3. Date Filter (Independent)
      if (dateFilter !== 'All Dates') {
        const itemDate = getPatientDate(p);
        if (dateFilter === 'Today' && itemDate !== todayDateStr) {
          return false;
        }
        if (dateFilter === 'Yesterday' && itemDate !== yesterdayDateStr) {
          return false;
        }
        if (dateFilter === 'Custom Date' && itemDate !== customDate) {
          return false;
        }
      }

      // 4. Payment Mode Filter (Independent)
      if (paymentModeFilter !== 'All') {
        if (p.paymentMode?.toUpperCase() !== paymentModeFilter.toUpperCase()) {
          return false;
        }
      }

      return true;
    });
  }, [patients, patientTab, searchTokenOrPhone, dateFilter, customDate, paymentModeFilter]);

  const labLogoUrl = vendorLabSettings?.logoUrl || '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
      {/* Top Application Bar: Vendor Company Logo + Dashboard Name + Vendor Home Website + Log Out Button */}
      <header className="bg-[#123B6D] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Back Button + Vendor Company Logo + Active Dashboard Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              id="lab-app-btn-back"
              onClick={onBackToWebsite}
              className="bg-white/15 hover:bg-white/25 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-white/20 cursor-pointer shrink-0"
              title="Back to Laboratory Website"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>Back</span>
            </button>

            {labLogoUrl ? (
              <img
                src={labLogoUrl}
                alt={labName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-contain bg-white border border-white/20 p-0.5 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center font-black text-sm shadow-sm border border-white/20 shrink-0">
                <span className="text-amber-300">{labName.charAt(0) || 'A'}</span>
                <span>{labName.split(' ')[1]?.charAt(0) || 'L'}</span>
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight truncate">
                {labName}
              </span>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <span>🔬</span>
                  <span>Technician Dashboard</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Side Header Actions: Sync Now + Logout Option */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Hostinger MySQL Sync Button */}
            <SyncNowButton variant="blue" />

            {!isEmbedded && (
              <button
                type="button"
                id="tech-header-logout-btn"
                onClick={() => {
                  logout();
                  if (onBackToWebsite) onBackToWebsite();
                }}
                className="bg-white/15 hover:bg-rose-600 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border border-white/20 hover:border-rose-400 cursor-pointer shrink-0"
                title="Logout from Technician Console"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-300" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Technician Secondary Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="tech-nav-workstation"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#123B6D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Testing Workstation ({countAll})</span>
            </button>
          </div>

          {/* Quick link to Reception Desk */}
          {onNavigateView && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateView('reception_dashboard')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Open Reception Desk & Billing Counter"
              >
                <span>🖥️</span>
                <span>Go to Reception Desk</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Offline Alert Banner if simulated offline */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-900 text-xs px-4 py-2 font-bold flex items-center justify-between border-b border-amber-600">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <WifiOff className="w-4 h-4" />
            <span>
              OFFLINE MODE ACTIVE: All registrations, results and payments are saving locally to browser storage. Pending sync items: <strong>{offlineQueue}</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">


            {/* 3. Patient Tabs: All Patients | Waiting | In Testing | Report Done */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
              <button
                type="button"
                id="tech-tab-all"
                onClick={() => setPatientTab('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
                  patientTab === 'all'
                    ? 'bg-[#123B6D] text-white shadow-sm font-extrabold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All Patients</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    patientTab === 'all' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {countAll}
                </span>
              </button>

              <button
                type="button"
                id="tech-tab-waiting"
                onClick={() => setPatientTab('waiting')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
                  patientTab === 'waiting'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Waiting</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    patientTab === 'waiting' ? 'bg-slate-950 text-amber-300' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {countWaiting}
                </span>
              </button>

              <button
                type="button"
                id="tech-tab-in-testing"
                onClick={() => setPatientTab('in_testing')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
                  patientTab === 'in_testing'
                    ? 'bg-[#0F766E] text-white shadow-sm font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span>In Test</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    patientTab === 'in_testing' ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-900'
                  }`}
                >
                  {countInTesting}
                </span>
              </button>

              <button
                type="button"
                id="tech-tab-report-ready"
                data-testid="tech-tab-report-done"
                onClick={() => setPatientTab('report_ready')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
                  patientTab === 'report_ready' || patientTab === 'report_done'
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <CheckCheck className="w-4 h-4" />
                <span>Report Ready</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    patientTab === 'report_ready' || patientTab === 'report_done'
                      ? 'bg-white/25 text-white'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {countReportReady}
                </span>
              </button>
            </div>

            {/* Toast Notification Banner */}
            {toastNotice && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{toastNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToastNotice(null)}
                  className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 4. Search & View Mode */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search by Token Number or Phone Number */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  id="tech-search-token-phone"
                  value={searchTokenOrPhone}
                  onChange={(e) => setSearchTokenOrPhone(e.target.value)}
                  placeholder="Search by Token Number or Phone Number..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 focus:border-[#123B6D] transition"
                />
                {searchTokenOrPhone && (
                  <button
                    type="button"
                    onClick={() => setSearchTokenOrPhone('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode Switcher: Grid (3 in row) vs Table */}
              <div className="flex items-center self-end sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setWorklistViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    worklistViewMode === 'grid'
                      ? 'bg-[#123B6D] text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid Cards View (3 in row, next test in second row)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setWorklistViewMode('table')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    worklistViewMode === 'table'
                      ? 'bg-[#123B6D] text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live Queue Worklist: Grid Cards (3 in a row, next test in second row) or Table */}
            {worklistViewMode === 'grid' ? (
              filteredPatients.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Search className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">No patient test records found</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No records match your active search, tab, or filter criteria. Try adjusting or clearing your filters.
                  </p>
                  {(searchTokenOrPhone || dateFilter !== 'All Dates' || paymentModeFilter !== 'All' || patientTab !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTokenOrPhone('');
                        setDateFilter('All Dates');
                        setPaymentModeFilter('All');
                        setPatientTab('all');
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 bg-[#123B6D] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <span>Reset All Filters</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5">
                  {filteredPatients.map((p) => {
                    const isReportDone =
                      p.status === 'Report Ready' || p.status === 'Report Done' || Boolean(p.reportId && !p.isDraft);
                    const isInTesting = p.status === 'In Testing';
                    const isWaiting = p.status === 'Waiting';

                    return (
                      <div
                        key={p.id}
                        className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md hover:border-[#123B6D] flex flex-col justify-between space-y-4 ${
                          isReportDone
                            ? 'border-emerald-200 bg-emerald-50/10'
                            : isInTesting
                            ? 'border-teal-200 bg-teal-50/10'
                            : 'border-amber-200 bg-amber-50/10'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Token & Status Header */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 bg-[#123B6D]/10 text-[#123B6D] font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-[#123B6D]/20">
                              <span>{p.tokenNumber || p.tokenNo || p.uhid}</span>
                              <span className="text-slate-400 font-normal">|</span>
                              <span className="text-[11px] text-slate-600 font-mono font-bold">{p.uhid}</span>
                            </div>

                            <div>
                              {isReportDone ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <CheckCheck className="w-3 h-3 text-emerald-700" />
                                  <span>Report Ready</span>
                                </span>
                              ) : isInTesting ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#123B6D] border border-blue-300">
                                  <FlaskConical className="w-3 h-3 text-[#123B6D]" />
                                  <span>In Testing</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Waiting</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Patient Name & Details */}
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="font-extrabold text-slate-900 text-base leading-snug">{p.name}</h3>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{p.registeredAt}</span>
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>{p.age} Y / {p.gender}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-700 font-bold">+91 {p.mobile}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1 truncate">
                              <span className="text-slate-400 font-medium">Dr:</span> <strong className="text-slate-700">{p.referringDoctor || 'Self / Direct'}</strong>
                            </div>
                          </div>

                          {/* Prescribed Tests Box */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <span>Prescribed Tests</span>
                              <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded text-[9px] font-black">
                                {Array.isArray(p.tests) ? p.tests.length : 1} Test{(Array.isArray(p.tests) ? p.tests.length : 1) === 1 ? '' : 's'}
                              </span>
                            </div>
                            <div className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">
                              {Array.isArray(p.tests) ? p.tests.join(', ') : p.tests}
                            </div>
                            {p.reportId && (
                              <div className="text-[10px] font-mono text-slate-500 pt-0.5 flex items-center gap-1">
                                <span>Report ID:</span>
                                <strong className="text-[#123B6D]">{p.reportId}</strong>
                              </div>
                            )}
                          </div>

                          {/* Bill & Payment */}
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Total:</span>
                              <span className="font-black text-slate-900 text-sm">₹{p.totalBill}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 ml-1">
                                {p.paymentMode}
                              </span>
                            </div>
                            <div>
                              {p.dueAmount > 0 ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                  Due: ₹{p.dueAmount}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Paid
                                </span>
                              )}
                            </div>
                          </div>

                          {p.sentToReceptionDesk && (
                            <div className="text-[10px] font-bold text-teal-800 flex items-center gap-1 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg">
                              <Check className="w-3 h-3 text-teal-600" />
                              <span>Report Sent to Reception Desk</span>
                            </div>
                          )}
                        </div>

                        {/* Technician Actions */}
                        <div className="pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Common: View Receipt */}
                            <button
                              type="button"
                              onClick={() => handleViewReceipt(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer border border-slate-200"
                              title="View registration and billing receipt"
                            >
                              <Receipt className="w-3.5 h-3.5 text-slate-600" />
                              <span>Receipt</span>
                            </button>

                            {/* 1. Waiting Tab actions */}
                            {isWaiting && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartTesting(p)}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                  title="Accept specimen and move to In Testing"
                                >
                                  <FlaskConical className="w-3.5 h-3.5 text-teal-200" />
                                  <span>Start Testing</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenCancelModal(p)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition cursor-pointer active:scale-95"
                                  title="Cancel and return entry to Reception Desk with reason"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                </button>
                              </>
                            )}

                            {/* 2. In Testing Tab actions */}
                            {isInTesting && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCreateReportModal(p)}
                                  className={`flex-1 px-3 py-1.5 rounded-lg ${
                                    p.isDraft
                                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                      : 'bg-[#123B6D] hover:bg-[#0e2c52] text-white'
                                  } text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95`}
                                  title={p.isDraft ? 'Continue editing draft report' : 'Enter test results and complete diagnostic report'}
                                >
                                  <FileText className="w-3.5 h-3.5 text-amber-300" />
                                  <span>{p.isDraft ? 'Make Report (Draft)' : 'Make Report'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenCancelModal(p)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition cursor-pointer active:scale-95"
                                  title="Cancel test and return entry to Reception Desk with reason"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                </button>
                              </>
                            )}

                            {/* 3. Report Done Tab actions */}
                            {isReportDone && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReportPreview(p.reportId, p.mobile)}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                  title="View verified diagnostic report"
                                >
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                  <span>View Report</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenReportPreview(p.reportId, p.mobile)}
                                  className="p-1.5 text-slate-600 hover:text-[#123B6D] hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-200"
                                  title="Print Report PDF"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleWhatsAppSend(p)}
                                  className="p-1.5 text-[#0F766E] hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer border border-teal-200"
                                  title="Send Report via WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Delete Option */}
                            <button
                              type="button"
                              onClick={() => handleDeletePatient(p)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                              title="Delete Patient Record"
                              aria-label="Delete Patient"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Live Queue Table */
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-4 font-bold">Token & UHID</th>
                        <th className="py-2.5 px-4 font-bold">Patient Details</th>
                        <th className="py-2.5 px-4 font-bold">Doctor Reference</th>
                        <th className="py-2.5 px-4 font-bold">Tests</th>
                        <th className="py-2.5 px-4 font-bold">Bill & Payment</th>
                        <th className="py-2.5 px-4 font-bold">Status</th>
                        <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                              <Search className="w-8 h-8 text-slate-300" />
                              <p className="font-bold text-slate-700">No patients found</p>
                              <p className="text-xs text-slate-500">
                                No records match your active search, tab, or filter criteria. Try adjusting or clearing your filters.
                              </p>
                              {(searchTokenOrPhone || dateFilter !== 'All Dates' || paymentModeFilter !== 'All' || patientTab !== 'all') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchTokenOrPhone('');
                                    setDateFilter('All Dates');
                                    setPaymentModeFilter('All');
                                    setPatientTab('all');
                                  }}
                                  className="mt-2 text-xs font-bold text-[#123B6D] hover:underline cursor-pointer"
                                >
                                  Reset all filters & show all patients
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((p) => {
                          const isReportDone =
                            p.status === 'Report Ready' || p.status === 'Report Done' || Boolean(p.reportId && !p.isDraft);
                          const isInTesting = p.status === 'In Testing';
                          const isWaiting = p.status === 'Waiting';

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/70 transition">
                              {/* Token & UHID */}
                              <td className="py-3 px-4">
                                <div className="inline-block bg-[#123B6D]/10 text-[#123B6D] font-mono font-black text-xs px-2 py-0.5 rounded-md border border-[#123B6D]/20">
                                  {p.tokenNumber || p.tokenNo || p.uhid}
                                </div>
                                <div className="font-mono text-[11px] text-slate-600 mt-1">{p.uhid}</div>
                                <div className="text-[10px] text-slate-400">{p.registeredAt}</div>
                              </td>

                              {/* Patient Details */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{p.name}</div>
                                <div className="text-[11px] text-slate-500">
                                  {p.age} Y / {p.gender}
                                </div>
                                <div className="text-[11px] font-mono font-medium text-slate-700 mt-0.5">
                                  +91 {p.mobile}
                                </div>
                              </td>

                              {/* Doctor Reference */}
                              <td className="py-3 px-4 text-slate-700">
                                <div className="font-medium text-xs text-slate-800">{p.referringDoctor}</div>
                                {p.reportId ? (
                                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                    Report: <span className="font-semibold text-[#123B6D]">{p.reportId}</span>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-400 mt-0.5">No report yet</div>
                                )}
                              </td>

                              {/* Tests */}
                              <td className="py-3 px-4">
                                <div className="max-w-xs truncate font-medium text-slate-800 text-xs">
                                  {Array.isArray(p.tests) ? p.tests.join(', ') : p.tests}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {Array.isArray(p.tests) ? p.tests.length : 1} test{(Array.isArray(p.tests) ? p.tests.length : 1) === 1 ? '' : 's'}
                                </div>
                              </td>

                              {/* Bill & Payment */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">₹{p.totalBill}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    {p.paymentMode}
                                  </span>
                                  {p.dueAmount > 0 ? (
                                    <span className="text-[10px] text-rose-600 font-bold">
                                      Due: ₹{p.dueAmount}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-600 font-bold">
                                      Paid
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4">
                                {isReportDone ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                      <CheckCheck className="w-3 h-3 text-emerald-700" />
                                      <span>Report Ready</span>
                                    </span>
                                    {p.sentToReceptionDesk ? (
                                      <div className="text-[10px] font-bold text-teal-700 flex items-center gap-1 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                                        <Check className="w-3 h-3 text-teal-600" />
                                        <span>Sent to Reception</span>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] font-medium text-amber-700">
                                        At Lab (Ready to send)
                                      </div>
                                    )}
                                  </div>
                                ) : isInTesting ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#123B6D] border border-blue-200">
                                    <FlaskConical className="w-3 h-3 text-[#123B6D]" />
                                    <span>In Testing</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-700" />
                                    <span>Waiting</span>
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* Common to all tabs: View Receipt */}
                                  <button
                                    type="button"
                                    onClick={() => handleViewReceipt(p)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer border border-slate-300"
                                    title="View registration and billing receipt"
                                  >
                                    <Receipt className="w-3.5 h-3.5 text-slate-600" />
                                    <span>View Receipt</span>
                                  </button>

                                  {/* 1. All Patients Tab: View Receipt ONLY */}
                                  {patientTab === 'all' && null}

                                  {/* 2. Waiting Tab: View Receipt, Start Testing, Cancel */}
                                  {patientTab === 'waiting' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleStartTesting(p)}
                                        className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                        title="Accept specimen and move to In Testing"
                                      >
                                        <FlaskConical className="w-3.5 h-3.5 text-teal-200" />
                                        <span>Start Testing</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenCancelModal(p)}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                        title="Cancel and return entry to Reception Desk with reason"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Cancel</span>
                                      </button>
                                    </>
                                  )}

                                  {/* 3. In Test Tab: View Receipt, Make Report, Cancel */}
                                  {patientTab === 'in_testing' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenCreateReportModal(p)}
                                        className={`px-2.5 py-1.5 rounded-lg ${
                                          p.isDraft
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                            : 'bg-[#123B6D] hover:bg-[#0e2c52] text-white'
                                        } text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95`}
                                        title={p.isDraft ? 'Continue editing draft report' : 'Enter test results and complete diagnostic report'}
                                      >
                                        <FileText className="w-3.5 h-3.5 text-amber-300" />
                                        <span>{p.isDraft ? 'Make Report (Draft)' : 'Make Report'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenCancelModal(p)}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                        title="Cancel test and return entry to Reception Desk with reason"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Cancel</span>
                                      </button>
                                    </>
                                  )}

                                  {/* 4. Report Ready / Done Tab: View Receipt, View Report */}
                                  {(patientTab === 'report_ready' || patientTab === 'report_done') && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReportPreview(p.reportId, p.mobile)}
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                        title="View verified diagnostic report"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-white" />
                                        <span>View Report</span>
                                      </button>

                                      {/* Edit Report Button: Correct any mistake in ready report */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenCreateReportModal(p)}
                                        className="px-2 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                        title="Edit Report: Correct any mistake in ready report (Patient details, Doctor, Parameters, Observed Values, Flags, Impressions)"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 text-slate-950" />
                                        <span>Edit</span>
                                      </button>

                                      {/* Quick Thermal / PDF print */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReportPreview(p.reportId, p.mobile)}
                                        className="p-1.5 text-slate-600 hover:text-[#123B6D] hover:bg-slate-100 rounded-lg cursor-pointer"
                                        title="Print Report PDF"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                      </button>

                                      {/* WhatsApp Report Share */}
                                      <button
                                        type="button"
                                        onClick={() => handleWhatsAppSend(p)}
                                        className="p-1.5 text-[#0F766E] hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                        title="Send Report via WhatsApp"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}

                                  {/* Delete Option */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePatient(p)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer border border-rose-200 transition"
                                    title="Delete Patient Record"
                                    aria-label="Delete Patient"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PATIENTS QUEUE & REGISTRATION */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#172033]">Patient Registration & Master Queue</h2>
                <p className="text-xs text-slate-500">Fast 10-digit mobile lookup, Indian name formats, and direct test report generation</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
                  {patients.length} Registered Patients
                </span>
              </div>
            </div>

            {/* Patient Cards with Make Report CTA */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {patients.map((p) => {
                  const isReady =
                    p.status === 'Report Ready' || p.status === 'Report Done' || Boolean(p.reportId && !p.isDraft);

                  return (
                    <div key={p.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 transition flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold text-[#123B6D]">{p.uhid}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              isReady
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {isReady ? 'Report Ready' : p.status}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-slate-900 mt-1">{p.name}</div>
                        <div className="text-xs text-slate-500">+91 {p.mobile} • {p.age} Y / {p.gender}</div>
                        <div className="text-[11px] text-slate-600 mt-1 truncate">
                          <strong>Doctor:</strong> {p.referringDoctor}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          <strong>Tests:</strong> {p.tests.join(', ')}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between gap-1.5">
                        <div className="text-xs font-bold text-slate-800">
                          ₹{p.totalBill} <span className="text-[10px] font-normal text-slate-500">({p.paymentMode})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenCreateReportModal(p)}
                            className="px-2.5 py-1 rounded bg-[#123B6D] hover:bg-[#0e2c52] text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Generate or edit report for this patient"
                          >
                            <FlaskConical className="w-3 h-3 text-amber-300 fill-amber-300" />
                            <span>{isReady ? 'Edit Report' : 'Make Report'}</span>
                          </button>
                        <button
                          onClick={() => handleOpenReportPreview(p.reportId, p.mobile)}
                          className="p-1 text-slate-600 hover:text-[#123B6D] rounded border border-slate-200 bg-white"
                          title="Print/Preview"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditPatient(p)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-slate-200 bg-white"
                          title="Edit Patient"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePatient(p)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-slate-200 bg-white"
                          title="Delete Patient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>

              <div className="text-xs text-slate-500 text-center py-1">
                Showing all {patients.length} active registered patients in this session.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESULTS ENTRY, REPORT GENERATION & SIGN-OFF */}
        {activeTab === 'results' && (() => {
          const currentPat = patients.find(p => p.id === workstationPatientId) || patients[0];
          const abnormalCount = workstationParams.filter(p => p.isAbnormal).length;

          return (
            <div className="space-y-4">
              {/* Header with Title and Primary Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer mr-1 border border-slate-200"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Dashboard</span>
                    </button>
                    <h2 className="text-base font-extrabold text-[#172033]">
                      Report Maker & Pathologist Verification Desk
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                      Verified Pathologist
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dr. Rohit Sharma, MD (Pathology) • Enter observations, flag abnormal parameters, and issue NABL digitally signed reports
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleOpenCreateReportModal(currentPat)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FlaskConical className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>+ Full Report Creator</span>
                  </button>
                  <button
                    onClick={() => handleOpenReportPreview(currentPat?.reportId || 'RPT-2026-8812', currentPat?.mobile || '9876543210')}
                    className="bg-[#0F766E] hover:bg-teal-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Preview NABL Report</span>
                  </button>
                </div>
              </div>

              {/* Patient Selector Worklist */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      Select Patient:
                    </label>
                    <select
                      value={workstationPatientId}
                      onChange={(e) => setWorkstationPatientId(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-[#123B6D] focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 w-full max-w-md cursor-pointer"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.age}Y/{p.gender}) — UHID: {p.uhid} [{p.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Status:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        currentPat?.status === 'Report Ready'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {currentPat?.status || 'Pending'}
                    </span>
                    {currentPat?.status === 'Report Ready' && (
                      <button
                        onClick={() => handleWhatsAppSend(currentPat)}
                        className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 text-[11px] font-bold"
                        title="Send report link on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Patient Details Pill Strip */}
                {currentPat && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">PATIENT NAME</span>
                      <span className="font-bold text-slate-900">{currentPat.name}</span> ({currentPat.age}Y/{currentPat.gender})
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">UHID & REPORT ID</span>
                      <span className="font-mono font-bold text-[#123B6D]">{currentPat.uhid}</span>
                      <div className="text-[10px] text-slate-500 font-mono">{currentPat.reportId}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">REFERRING DOCTOR</span>
                      <span className="font-medium text-slate-800">{currentPat.referringDoctor}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block">TESTS PRESCRIBED</span>
                      <span className="font-medium text-slate-800 truncate block">{currentPat.tests.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Success Notification Banner when signed */}
              {workstationSuccessNotice && (
                <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 bg-white text-emerald-700 rounded-full p-0.5" />
                    <div>
                      <div className="font-bold text-sm">Report Successfully Generated & Digitally Signed!</div>
                      <div className="text-xs text-emerald-100">
                        NABL ISO 15189 SHA-256 verification seal applied. Patient report is ready for download & WhatsApp dispatch.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReportPreview(currentPat?.reportId || '', currentPat?.mobile || '')}
                      className="px-3 py-1.5 rounded-lg bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition shadow-xs"
                    >
                      View & Print
                    </button>
                    {currentPat && (
                      <button
                        onClick={() => handleWhatsAppSend(currentPat)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Interactive Observed Values Entry Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Parameter Result Entry Sheet
                    </h3>
                    <span className="text-xs text-slate-500">
                      ({workstationParams.length} parameters)
                    </span>
                    {abnormalCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                        ⚠️ {abnormalCount} Abnormal Flag{abnormalCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        ✓ All Values Normal
                      </span>
                    )}
                  </div>

                  {/* Fast Tools */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        // Auto-fill normal values
                        setWorkstationParams(prev =>
                          prev.map(p => {
                            const range = p.referenceRange;
                            let val = p.result;
                            if (range.includes('–') || range.includes('-')) {
                              const parts = range.split(/[–-]/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                              if (parts.length >= 2) {
                                val = ((parts[0] + parts[1]) / 2).toFixed(1);
                              }
                            } else if (range.toLowerCase().includes('negative')) {
                              val = 'Negative';
                            } else if (range.includes('<')) {
                              const num = parseFloat(range.replace('<', '').trim());
                              if (!isNaN(num)) val = (num * 0.8).toFixed(1);
                            }
                            return { ...p, result: val, isAbnormal: false };
                          })
                        );
                      }}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Pre-populate all parameters with middle healthy normal values"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Auto-Fill Normal Values</span>
                    </button>
                    <button
                      onClick={() => {
                        const newId = `custom-${Date.now()}`;
                        setWorkstationParams(prev => [
                          ...prev,
                          {
                            id: newId,
                            testName: 'General Clinical Biochemistry',
                            parameter: 'Serum Electrolytes / Additional Parameter',
                            result: '138.0',
                            unit: 'mmol/L',
                            referenceRange: '135.0–145.0',
                            isAbnormal: false,
                          },
                        ]);
                      }}
                      className="px-2.5 py-1 rounded bg-[#123B6D] hover:bg-[#0e2c52] text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Parameter</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-2.5 px-3">Test Section</th>
                        <th className="py-2.5 px-3">Parameter Name</th>
                        <th className="py-2.5 px-3 w-44">Observed Result (Enter Value)</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">Biological Reference Interval</th>
                        <th className="py-2.5 px-3 text-center">Status Flag</th>
                        <th className="py-2.5 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {workstationParams.map((p, idx) => {
                        return (
                          <tr
                            key={p.id}
                            className={`transition ${
                              p.isAbnormal ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-semibold text-slate-600 text-[11px]">
                              {p.testName}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {p.parameter}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={p.result}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const isAbn = checkIsAbnormal(p.parameter, val, p.referenceRange);
                                    setWorkstationParams(prev =>
                                      prev.map(item =>
                                        item.id === p.id ? { ...item, result: val, isAbnormal: isAbn } : item
                                      )
                                    );
                                  }}
                                  className={`w-full px-2.5 py-1 rounded font-bold font-mono text-xs border transition ${
                                    p.isAbnormal
                                      ? 'border-rose-300 bg-rose-50 text-rose-800 focus:ring-2 focus:ring-rose-400'
                                      : 'border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30'
                                  }`}
                                  placeholder="Type result..."
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                              {p.unit}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                              {p.referenceRange}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {p.isAbnormal ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                  <span>⚠️</span>
                                  <span>ABNORMAL</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span>✓</span>
                                  <span>NORMAL</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <button
                                onClick={() => {
                                  setWorkstationParams(prev => prev.filter(item => item.id !== p.id));
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 text-[11px]"
                                title="Remove parameter"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Clinic Note (Technician Manual Note) */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-[#123B6D] flex items-center gap-1.5">
                        <span>Clinic Note (Technician Manual Note):</span>
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Technician manually writes Clinic Note here. This will be printed in the dedicated CLINIC NOTE section above the footer.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                      <span className="text-slate-500 font-bold">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setWorkstationImpression('Please correlate clinically with patient symptoms. In case of unexpected discordance, repeat testing is advised.')
                        }
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 font-semibold text-[10px] cursor-pointer"
                      >
                        Clinical Correlation
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setWorkstationImpression('Sample tested in duplicate and findings verified. Routine clinical review advised.')
                        }
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 font-semibold text-[10px] cursor-pointer"
                      >
                        Duplicate Verified
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setWorkstationImpression('Parameters are within standard biological reference intervals for age and gender.')
                        }
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 font-semibold text-[10px] cursor-pointer"
                      >
                        All Normal
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={workstationImpression}
                    onChange={(e) => setWorkstationImpression(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    placeholder="Technician manually writes Clinic Note here (e.g. Please correlate clinically with patient symptoms, sample tested in duplicate, etc.)..."
                  />
                </div>

                {/* Sign-off & Issue Footer Bar */}
                <div className="p-4 bg-[#0e2c52] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold">Authorized Signatory: Dr. Rohit Sharma, MD (Pathology)</div>
                      <div className="text-[10px] text-slate-300">
                        NABL ISO 15189:2022 Verified • SHA-256 Tamper-Proof Cryptographic Hash will be generated
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleSignWorkstationReport}
                      className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-5 py-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-black/30 active:scale-95 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 fill-slate-950 text-slate-950" />
                      <span>Apply Digital Signature & Issue Report</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Master Archive of Generated Reports in this session */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Recent Verified Reports Archive ({reports.length} Reports)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Accessible via Zero-Login Patient Portal & WhatsApp
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-2 px-3">Report ID</th>
                        <th className="py-2 px-3">Patient Name</th>
                        <th className="py-2 px-3">Age / Gender</th>
                        <th className="py-2 px-3">Mobile</th>
                        <th className="py-2 px-3">Reported At</th>
                        <th className="py-2 px-3">Flags</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.map((rpt) => {
                        const abn = rpt.items.filter(i => i.isAbnormal).length;
                        return (
                          <tr key={rpt.reportId} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#123B6D]">
                              {rpt.reportId}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {rpt.patientName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {rpt.ageGender}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              +91 {rpt.mobile}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {rpt.reportedAt}
                            </td>
                            <td className="py-2.5 px-3">
                              {abn > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  {abn} Abnormal
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Normal
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleEditReport(rpt)}
                                  className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Edit report parameters & observations"
                                >
                                  <Edit2 className="w-3 h-3 text-amber-700" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteReport(rpt)}
                                  className="p-1 rounded text-rose-600 hover:bg-rose-50 hover:border-rose-400 border border-rose-200 transition cursor-pointer shadow-2xs"
                                  title="Delete this report"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenReportPreview(rpt.reportId, rpt.mobile)}
                                  className="px-2.5 py-1 rounded bg-[#123B6D] hover:bg-[#0e2c52] text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Print / View</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const text = encodeURIComponent(
                                      `Hello ${rpt.patientName}, your authenticated test report (${rpt.reportId}) from ${rpt.labName} is ready. View & download without login: ${window.location.origin}?report=${rpt.reportId}`
                                    );
                                    window.open(`https://wa.me/91${rpt.mobile}?text=${text}`, '_blank');
                                  }}
                                  className="p-1 rounded text-emerald-700 hover:bg-emerald-50 border border-emerald-200 cursor-pointer"
                                  title="Send WhatsApp Link"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

</main>

      {/* NEW PATIENT REGISTRATION MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRegModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>

            <h3 className="text-base font-extrabold text-[#172033] mb-1">
              {editingPatient ? 'Edit Patient Information' : 'New Patient Registration & Intake'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {editingPatient
                ? `Update demographics, referring doctor, tests or billing for ${editingPatient.uhid}`
                : 'Creates instant UHID, barcode specimen label, and billing receipt.'}
            </p>

            <form onSubmit={handleRegisterPatient} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Patient Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Harpreet Singh"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Age</label>
                  <input
                    type="number"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Gender</label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Mobile No.</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={newPatientMobile}
                    onChange={(e) => setNewPatientMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10 Digits"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Referring Doctor</label>
                <input
                  type="text"
                  value={newPatientDoctor}
                  onChange={(e) => setNewPatientDoctor(e.target.value)}
                  placeholder="e.g. Dr. S. K. Gupta"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Select Tests to Schedule</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {vendorTests.slice(0, 8).map((t) => {
                    const isSelected = selectedTests.includes(t.name);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTests(selectedTests.filter(name => name !== t.name));
                          } else {
                            setSelectedTests([...selectedTests, t.name]);
                          }
                        }}
                        className={`text-left p-1.5 rounded border text-[11px] transition ${
                          isSelected
                            ? 'bg-[#123B6D] text-white border-[#0e2c52] font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate">{t.name}</div>
                        <div className={isSelected ? 'text-amber-300' : 'text-[#123B6D]'}>
                          ₹{t.priceINR}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Advance Amount Received</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-500 font-semibold">₹</span>
                    <input
                      type="number"
                      value={paidNow}
                      onChange={(e) => setPaidNow(e.target.value)}
                      className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option>UPI</option>
                    <option>Cash</option>
                    <option>Card</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegModal(false);
                    setEditingPatient(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{editingPatient ? 'Update Patient Record' : 'Save & Print Barcode'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Full Interactive Report Creator & Editor */}
      <ErrorBoundary fallbackTitle="Report Generator Error" fallbackMessage="Report editor load karte waqt problem aayi. Please dobara koshish karein.">
        <CreateReportModal
          isOpen={isCreateReportModalOpen}
          onClose={() => {
            setIsCreateReportModalOpen(false);
            setSelectedReportToEdit(null);
          }}
          patients={patients}
          existingReport={selectedReportToEdit || undefined}
          allowNewPatientEntry={false}
          onReportCreated={(createdReport, patientId, isDraft) => {
            handleReportCreated(createdReport, patientId || selectedPatientForReport?.id, isDraft);
          }}
          preselectedPatient={selectedPatientForReport || undefined}
          onOpenReportPreview={(rptId, mob) => {
            handleOpenReportPreview(rptId, mob);
          }}
        />
      </ErrorBoundary>

      {/* MODAL: NABL Report Detail & Print/WhatsApp Preview */}
      {previewReport && (
        <ReportDetailModal
          report={previewReport}
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          onEditReport={handleEditReport}
          onDeleteReport={handleDeleteReport}
          onOpenPatientPortal={(rptId, mob) => onViewReport(rptId, mob)}
        />
      )}

      {/* VIEW RECEIPT MODAL */}
      {isReceiptModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <WebsiteTokenReceiptCard
            receipt={{
              tokenNumber: selectedReceipt.tokenNumber || selectedReceipt.tokenNo || selectedReceipt.uhid || 'TK-101',
              uhid: selectedReceipt.uhid || `UHID-${selectedReceipt.id}`,
              patientName: selectedReceipt.patientName,
              age: selectedReceipt.age,
              gender: selectedReceipt.gender,
              mobile: selectedReceipt.mobile,
              referringDoctor: selectedReceipt.referringDoctor,
              tests: Array.isArray(selectedReceipt.tests) ? selectedReceipt.tests : [selectedReceipt.tests],
              totalAmount: selectedReceipt.totalAmount || 0,
              discountINR: selectedReceipt.discountINR || 0,
              paidAmount: selectedReceipt.paidAmount || 0,
              dueAmount: selectedReceipt.dueAmount || 0,
              paymentMode: selectedReceipt.paymentMode || 'Cash',
              paymentStatus: selectedReceipt.paymentStatus,
              registeredAt: selectedReceipt.registeredAt || 'Today',
              visitType: selectedReceipt.visitType,
              address: selectedReceipt.address,
              timeSlot: selectedReceipt.preferredTimeSlot,
              upiTransactionRef: selectedReceipt.upiTransactionRef,
              labId: selectedReceipt.labId || (activeTenantId !== 'all' ? activeTenantId : selectedVendorLabId),
              labName: labName,
              labPhone: vendorLabSettings?.phone || '+91 7087033009',
              labAddress: vendorLabSettings?.address || 'Medical Complex, India',
              bookingSource: selectedReceipt.bookingSource || 'Central Lab Workstation',
              notes: selectedReceipt.notes,
            }}
            onClose={() => {
              setIsReceiptModalOpen(false);
              setSelectedReceipt(null);
            }}
          />
        </div>
      )}

      {/* TECHNICIAN CANCELLATION / RETURN TO RECEPTION MODAL */}
      {cancellingPatient && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Cancel & Return Entry to Reception Desk
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Entry will be returned to the Reception Desk with technician notification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCancellingPatient(null);
                  setCancelReason('');
                  setCancelReasonError('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Snapshot */}
            <div className="my-4 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-mono text-[11px] font-bold bg-[#123B6D]/10 text-[#123B6D] px-2 py-0.5 rounded border border-[#123B6D]/20 mr-2">
                  {cancellingPatient.tokenNumber || cancellingPatient.tokenNo || cancellingPatient.uhid || '-'}
                </span>
                <strong className="text-slate-900 text-sm">{cancellingPatient.name}</strong>
                <span className="text-slate-500 text-[11px] ml-1.5">
                  ({cancellingPatient.age} Y / {cancellingPatient.gender})
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Tests: <span className="font-semibold text-slate-800">{Array.isArray(cancellingPatient.tests) ? cancellingPatient.tests.join(', ') : cancellingPatient.tests}</span>
              </div>
            </div>

            {/* Important Workflow Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Reception Notification Trigger</p>
                <p className="text-amber-800 mt-0.5">
                  After cancellation, the entry will be returned to the Reception Desk. Reception will receive a notification: <strong className="text-amber-950 font-black">“Technician has returned the entry.”</strong> along with the cancellation reason below.
                </p>
              </div>
            </div>

            {/* Required Reason Textarea */}
            <div className="space-y-1.5 mb-4">
              <label className="block text-xs font-bold text-slate-800">
                Reason for Cancellation / Return <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (cancelReasonError) setCancelReasonError('');
                }}
                placeholder="Technician must enter a reason in this text area (e.g. Hemolyzed specimen, insufficient sample quantity, clotted EDTA blood, doctor revoked order)..."
                className={`w-full p-3 bg-slate-50 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 transition ${
                  cancelReasonError
                    ? 'border-rose-500 focus:ring-rose-500/30 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-rose-500/30 focus:border-rose-500'
                }`}
              />
              {cancelReasonError && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{cancelReasonError}</span>
                </p>
              )}

              {/* Preset quick buttons */}
              <div className="pt-1.5 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-slate-500">Quick suggestions:</span>
                {[
                  'Hemolyzed blood sample unsuitable for testing',
                  'Insufficient specimen volume (QNS)',
                  'Clotted EDTA blood specimen - CBC invalid',
                  'Patient requested cancellation / Revoked',
                  'Discrepancy in test order / tube labeling',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setCancelReason(preset);
                      setCancelReasonError('');
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer transition"
                  >
                    {preset.split(' - ')[0].slice(0, 26)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setCancellingPatient(null);
                  setCancelReason('');
                  setCancelReasonError('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Keep in Lab
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm & Return to Reception</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Are you sure you want to delete this?</h3>
                <p className="text-xs text-slate-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {deleteConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={deleteConfirm.onConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TECHNICIAN ENTRY BLOCKED WARNING MODAL */}
      {isTechnicianEntryBlockedModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-amber-300 p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-800">
              <span className="p-2.5 rounded-xl bg-amber-100">
                <Lock className="w-5 h-5 text-amber-900" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">Lab Technician Entry Restricted</h3>
                <span className="text-[11px] text-amber-800 font-extrabold uppercase tracking-wide">
                  Patient Registration = Reception Desk Only
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Lab technicians cannot register new patients or generate billing tokens. All patient registration, demographic capture (name, mobile, age, referring doctor), and billing must be conducted at the <strong>Reception Desk</strong>.
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Technicians enter test parameter observations and generate clinical pathology reports for patients that have already been registered by the Reception Counter.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsTechnicianEntryBlockedModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
