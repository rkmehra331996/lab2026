import React, { useState, useMemo } from 'react';
import {
  Users,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Search,
  Printer,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Building2,
  FileText,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  QrCode,
  Eye,
  LogOut,
  Globe,
  Calendar,
  Layers,
  Activity,
  Sliders,
  Receipt,
  RotateCcw,
  Plus,
  Zap,
  Phone,
  AlertTriangle,
  BadgeCheck,
  LayoutDashboard,
  Wallet,
  Clock,
  Sparkles,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView, ReceptionPatientEntry, LabReport, TestItem } from '../types';
import { ReceptionEntryDashboard, getDisplayTokenNumber, getWebsiteBookingMeta } from './ReceptionEntryDashboard';
import { LabSoftwareApp } from './LabSoftwareApp';
import { TechnicianDepartmentDashboard } from './technician/TechnicianDepartmentDashboard';
import { DashboardFooter } from './DashboardFooter';
import { ReportDetailModal } from './ReportDetailModal';
import { CollectRemainingPaymentModal } from './CollectRemainingPaymentModal';
import { SyncNowButton } from './SyncNowButton';
import { buildReceiptInvoicePdf } from '../utils/pdfGenerator';
import { buildPatientReportUrl } from '../utils/domainRouting';
import { WebsiteTokenReceiptCard } from './vendor/WebsiteTokenReceiptCard';

interface ExpertMemberDashboardProps {
  onNavigateView: (view: AppView) => void;
  onOpenReportPortal?: (reportId?: string, mobile?: string) => void;
}

export type ExpertDashboardTab =
  | 'overview'
  | 'reception'
  | 'technician'
  | 'financials';

export const ExpertMemberDashboard: React.FC<ExpertMemberDashboardProps> = ({
  onNavigateView,
  onOpenReportPortal,
}) => {
  const {
    currentUser,
    logout,
    vendorLabSettings,
    receptionEntries,
    reports,
    allReports,
    updateReceptionStatus,
    updateReceptionEntry,
    sendEntryToTechnician,
    acceptEntryByTechnician,
    addReceptionEntry,
    vendorTests,
    activeBranchId,
    setActiveBranchId,
    selectedVendorLabId,
  } = useCms();

  const [activeTab, setActiveTab] = useState<ExpertDashboardTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState<'All' | 'Waiting' | 'In Lab' | 'Report Ready' | 'Due'>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [selectedReportForView, setSelectedReportForView] = useState<LabReport | null>(null);
  const [collectingPaymentEntry, setCollectingPaymentEntry] = useState<ReceptionPatientEntry | null>(null);
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);
  const [selectedReceiptForSlip, setSelectedReceiptForSlip] = useState<ReceptionPatientEntry | null>(null);
  const [isFastRegisterOpen, setIsFastRegisterOpen] = useState(false);

  // Fast registration mini-form state
  const [fastPatientName, setFastPatientName] = useState('');
  const [fastMobile, setFastMobile] = useState('');
  const [fastAge, setFastAge] = useState('32');
  const [fastGender, setFastGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [fastDoctor, setFastDoctor] = useState('Self / Direct');
  const [fastSelectedTest, setFastSelectedTest] = useState('Complete Blood Count (CBC)');
  const [fastPaymentMode, setFastPaymentMode] = useState<'Cash' | 'UPI'>('UPI');
  const [fastPaidAmount, setFastPaidAmount] = useState('350');

  const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology';
  const labNabl = vendorLabSettings?.nablAccreditationNo || 'MC-4821';
  const labPhone = vendorLabSettings?.phone || '7087033009';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // RECEPTION & FINANCIAL METRICS
  // -------------------------------------------------------------
  const totalPatientsToday = receptionEntries.length;
  const totalNetBilled = receptionEntries.reduce(
    (acc, e) => acc + Math.max(0, e.totalAmount - (e.discountINR || 0)),
    0
  );
  const totalCashCollected = receptionEntries.reduce(
    (acc, e) => acc + (e.paymentMode === 'Cash' ? (e.paidAmount || 0) : 0),
    0
  );
  const totalUpiCollected = receptionEntries.reduce(
    (acc, e) => acc + (e.paymentMode === 'UPI' ? (e.paidAmount || 0) : 0),
    0
  );
  const totalTotalCollection = receptionEntries.reduce((acc, e) => acc + (e.paidAmount || 0), 0);
  const totalDuePending = receptionEntries.reduce((acc, e) => acc + (e.dueAmount || 0), 0);
  const patientsWithDueCount = receptionEntries.filter((e) => (e.dueAmount || 0) > 0).length;

  const waitingSamplesCount = receptionEntries.filter((e) => e.status === 'Waiting').length;
  const inLabCount = receptionEntries.filter(
    (e) =>
      !(e.status === 'Report Ready' || e.technicianStatus === 'Report Generated') &&
      (e.sentToTechnician || e.status === 'In Lab' || e.status === 'Sample Collected' || e.technicianStatus === 'Sent to Lab' || e.technicianStatus === 'Accepted')
  ).length;
  const reportsReadyCount = receptionEntries.filter(
    (e) => e.status === 'Report Ready' || e.technicianStatus === 'Report Generated'
  ).length;

  // -------------------------------------------------------------
  // TECHNICIAN DEPARTMENT METRICS
  // -------------------------------------------------------------
  const activeReportsCount = reports.filter((r) => !r.isCancelled).length;
  const abnormalAlertsCount = reports.reduce((acc, r) => {
    const abn = (r.items || []).filter((it) => it.isAbnormal || it.flag === 'H' || it.flag === 'L').length;
    return acc + (abn > 0 ? 1 : 0);
  }, 0);

  // -------------------------------------------------------------
  // FILTERED QUEUES FOR COMMAND CENTER
  // -------------------------------------------------------------
  const filteredReceptionEntries = useMemo(() => {
    return receptionEntries.filter((entry) => {
      // 1. Pipeline filter
      if (pipelineFilter === 'Waiting' && entry.status !== 'Waiting') return false;
      if (
        pipelineFilter === 'In Lab' &&
        !(entry.sentToTechnician || entry.status === 'In Lab' || entry.status === 'Sample Collected' || entry.technicianStatus === 'Sent to Lab' || entry.technicianStatus === 'Accepted')
      )
        return false;
      if (
        pipelineFilter === 'Report Ready' &&
        !(entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated')
      )
        return false;
      if (pipelineFilter === 'Due' && (entry.dueAmount || 0) <= 0) return false;

      // 2. Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = (entry.patientName || '').toLowerCase().includes(q);
      const matchMobile = (entry.mobile || '').includes(q);
      const matchToken = (entry.tokenNumber || '').toLowerCase().includes(q);
      const matchUhid = (entry.uhid || '').toLowerCase().includes(q);
      const matchDoctor = (entry.referringDoctor || '').toLowerCase().includes(q);
      const matchTests = (entry.tests || []).some((t) => t.toLowerCase().includes(q));
      return matchName || matchMobile || matchToken || matchUhid || matchDoctor || matchTests;
    });
  }, [receptionEntries, pipelineFilter, searchQuery]);

  const filteredLabReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.isCancelled) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = (report.patientName || '').toLowerCase().includes(q);
      const matchMobile = (report.mobile || report.patientMobile || '').includes(q);
      const matchId = (report.reportId || report.id || '').toLowerCase().includes(q);
      const matchBarcode = (report.barcode || '').toLowerCase().includes(q);
      const matchDoctor = (report.doctor || report.referringDoctor || '').toLowerCase().includes(q);
      const matchItems = (report.items || []).some((i) => (i.testName || '').toLowerCase().includes(q));
      return matchName || matchMobile || matchId || matchBarcode || matchDoctor || matchItems;
    });
  }, [reports, searchQuery]);

  // Handlers
  const handleSendToTech = (entry: ReceptionPatientEntry) => {
    sendEntryToTechnician(entry.id);
    showToast(`Dispatched ${entry.tokenNumber} (${entry.patientName}) to Lab Technician`);
  };

  const handleOpenCollectPayment = (entry: ReceptionPatientEntry) => {
    setCollectingPaymentEntry(entry);
    setIsCollectPaymentOpen(true);
  };

  const handleCollectPaymentSubmit = (
    entryId: string,
    collectedAmount: number,
    mode: 'Cash' | 'UPI' | 'Card'
  ) => {
    const entry = receptionEntries.find((e) => e.id === entryId);
    if (!entry) return;

    const netPayable = Math.max(0, entry.totalAmount - (entry.discountINR || 0));
    const newPaidAmount = Math.min(netPayable, entry.paidAmount + collectedAmount);
    const newDueAmount = Math.max(0, netPayable - newPaidAmount);
    const newPaymentStatus: ReceptionPatientEntry['paymentStatus'] =
      newDueAmount === 0 ? 'Full Payment' : 'Advance';

    updateReceptionEntry(entryId, {
      ...entry,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      paymentStatus: newPaymentStatus,
      paymentMode: mode,
    });

    setIsCollectPaymentOpen(false);
    setCollectingPaymentEntry(null);
    showToast(`Payment of ₹${collectedAmount} collected for ${entry.tokenNumber}`);
  };

  const handleFastRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastPatientName.trim() || !fastMobile.trim()) {
      showToast('Please enter patient name and mobile number');
      return;
    }

    const testMatch = vendorTests.find((t) => t.name === fastSelectedTest);
    const gross = testMatch?.priceINR || 350;
    const paid = Number(fastPaidAmount) || 0;
    const due = Math.max(0, gross - paid);
    const nextTokenNum = `TK-${100 + receptionEntries.length + 1}`;
    const nextUHID = `LAB-2026-${9040 + receptionEntries.length + 1}`;

    const newEntry: Omit<ReceptionPatientEntry, 'id'> = {
      uhid: nextUHID,
      tokenNumber: nextTokenNum,
      patientName: fastPatientName.trim(),
      age: fastAge || '30',
      gender: fastGender,
      mobile: fastMobile.trim(),
      referringDoctor: fastDoctor.trim() || 'Self / Direct',
      tests: [fastSelectedTest],
      sampleType: 'Serum Clot / EDTA',
      totalAmount: gross,
      discountINR: 0,
      paidAmount: paid,
      dueAmount: due,
      paymentMode: fastPaymentMode,
      paymentStatus: due === 0 ? 'Full Payment' : paid === 0 ? 'Due' : 'Advance',
      status: 'Waiting',
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      entryDate: new Date().toISOString().split('T')[0],
    };

    const saved = addReceptionEntry(newEntry);
    setIsFastRegisterOpen(false);
    setFastPatientName('');
    setFastMobile('');
    showToast(`Token ${saved.tokenNumber} registered for ${saved.patientName}`);
    setSelectedReceiptForSlip(saved);
  };

  const handleShareWhatsApp = (entry: ReceptionPatientEntry) => {
    const labTitle = vendorLabSettings?.labName || 'Apex Diagnostics';
    const reportUrl = buildPatientReportUrl(entry.labId || selectedVendorLabId, entry.tokenNumber);
    const clean10 = (entry.mobile || '').replace(/\D/g, '').slice(-10);
    const text = encodeURIComponent(
      `Hello ${entry.patientName}, your test registration (${entry.tokenNumber}) at ${labTitle} is confirmed. Net: ₹${entry.totalAmount} | Paid: ₹${entry.paidAmount}${entry.dueAmount ? ` | Due: ₹${entry.dueAmount}` : ''}. Track report: ${reportUrl}`
    );
    window.open(`https://wa.me/91${clean10}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-slate-200">
      {/* 1. COMPACT TOP HEADER */}
      <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 flex items-center justify-between gap-3">
          {/* Left: Branding & Role Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs sm:text-sm text-white tracking-tight truncate">
                  {labName}
                </span>
                <span className="text-[11px] text-slate-400 hidden md:inline">·</span>
                <span className="text-[11px] text-slate-300 font-medium hidden md:inline truncate">
                  Expert Vendor Console
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>NABL {labNabl}</span>
                <span>·</span>
                <span>Dual Department (Front Desk + Lab Tech)</span>
              </div>
            </div>
          </div>

          {/* Right: Actions & Navigation Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <SyncNowButton />

            <button
              type="button"
              onClick={() => onNavigateView('vendor_website')}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition flex items-center gap-1.5 cursor-pointer"
              title="Visit Lab Website"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Website</span>
            </button>

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            <button
              type="button"
              onClick={() => {
                logout();
                onNavigateView('vendor_website');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 rounded-md transition flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* 2. COMPACT SEGMENTED NAVIGATION TABS */}
        <div className="border-t border-slate-800 bg-slate-900/90 px-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-white shadow-2xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
              <span>Command Center</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {totalPatientsToday}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reception')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'reception'
                  ? 'bg-slate-800 text-white shadow-2xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-sky-400" />
              <span>Reception Desk</span>
              {waitingSamplesCount > 0 && (
                <span className="text-[10px] text-amber-300 font-mono">
                  ({waitingSamplesCount} wait)
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('technician')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'technician'
                  ? 'bg-slate-800 text-white shadow-2xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span>Technician Workstation</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {inLabCount} in lab
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('financials')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'financials'
                  ? 'bg-slate-800 text-white shadow-2xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily Cash &amp; Dues</span>
              {totalDuePending > 0 && (
                <span className="text-[10px] text-rose-300 font-mono">
                  ₹{totalDuePending} due
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* ======================================================== */}
        {/* TAB 1: COMMAND CENTER (COMPACT UNIFIED DUAL-DEPT VIEW)    */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* A. Compact KPI Metric Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Card 1: Today's Tokens */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                  <span className="font-medium">Total Check-Ins</span>
                  <span className="text-slate-400">Tokens</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900 font-mono">
                    {totalPatientsToday}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {waitingSamplesCount} waiting · {inLabCount} in lab
                  </span>
                </div>
              </div>

              {/* Card 2: Today's Revenue */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                  <span className="font-medium">Collected Revenue</span>
                  <span className="text-emerald-600 font-mono text-[10px]">Today</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-emerald-700 font-mono">
                    ₹{totalTotalCollection.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ₹{totalCashCollected} cash · ₹{totalUpiCollected} UPI
                  </span>
                </div>
              </div>

              {/* Card 3: Pending Dues */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                  <span className="font-medium">Outstanding Balance</span>
                  <span className="text-amber-600 font-mono text-[10px]">Pending</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-bold font-mono ${totalDuePending > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                    ₹{totalDuePending.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {patientsWithDueCount} {patientsWithDueCount === 1 ? 'patient' : 'patients'} with due
                  </span>
                </div>
              </div>

              {/* Card 4: Lab Testing Worklist */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                  <span className="font-medium">Specimen Queue</span>
                  <span className="text-indigo-600 font-mono text-[10px]">Analyzers</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-indigo-700 font-mono">
                    {inLabCount}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {reportsReadyCount} ready · {abnormalAlertsCount} flags
                  </span>
                </div>
              </div>
            </div>

            {/* B. Search & Pipeline Filter Bar */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search token, patient name, mobile, test..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Pipeline Filters */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
                {(['All', 'Waiting', 'In Lab', 'Report Ready', 'Due'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setPipelineFilter(filter)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                      pipelineFilter === filter
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'All' && 'All'}
                    {filter === 'Waiting' && `Waiting (${waitingSamplesCount})`}
                    {filter === 'In Lab' && `In Lab (${inLabCount})`}
                    {filter === 'Report Ready' && `Ready (${reportsReadyCount})`}
                    {filter === 'Due' && `Due (${patientsWithDueCount})`}
                  </button>
                ))}
              </div>

              {/* Fast Registration Trigger */}
              <button
                type="button"
                onClick={() => setIsFastRegisterOpen(true)}
                className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0d645e] text-white text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Fast Registration</span>
              </button>
            </div>

            {/* C. Dual Department Live Operations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              {/* Left Column (7 cols): Front Desk Patient Live Queue */}
              <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-teal-700" />
                    <span className="text-xs font-semibold text-slate-900">
                      Front Desk &amp; Patient Queue
                    </span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {filteredReceptionEntries.length} Records
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('reception')}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Full Desk</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
                  {filteredReceptionEntries.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No patients match current filter or search query.
                    </div>
                  ) : (
                    filteredReceptionEntries.map((entry) => {
                      const net = Math.max(0, (entry.totalAmount || 0) - (entry.discountINR || 0));
                      const isPaid = (entry.dueAmount || 0) <= 0;
                      const isWaiting = entry.status === 'Waiting';
                      const isInLab = !isWaiting && (entry.status === 'In Lab' || entry.status === 'Sample Collected' || entry.sentToTechnician);
                      const isReady = entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated';

                      return (
                        <div key={entry.id} className="p-3 hover:bg-slate-50/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                          {/* Patient Meta */}
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {entry.tokenNumber || 'TK-101'}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {entry.patientName}
                              </span>
                              <span className="text-[11px] text-slate-400">·</span>
                              <span className="text-[11px] text-slate-500">
                                {entry.age}Y/{entry.gender}
                              </span>
                              <span className="text-[11px] text-slate-400">·</span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {entry.mobile}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                              <span className="truncate max-w-[240px]">
                                {(entry.tests || []).join(', ')}
                              </span>
                              <span>·</span>
                              <span className="font-mono text-slate-700">₹{net}</span>
                              <span>·</span>
                              {isPaid ? (
                                <span className="text-emerald-700 font-medium">Paid</span>
                              ) : (
                                <span className="text-amber-700 font-medium">Due: ₹{entry.dueAmount}</span>
                              )}
                              <span>·</span>
                              <span className="text-slate-400">{entry.registeredAt || 'Today'}</span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {/* Handover to Lab Technician */}
                            {isWaiting && (
                              <button
                                type="button"
                                onClick={() => handleSendToTech(entry)}
                                className="px-2 py-1 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-white rounded transition flex items-center gap-1 cursor-pointer"
                                title="Send sample to testing workstation"
                              >
                                <FlaskConical className="w-3 h-3 text-teal-300" />
                                <span>To Lab</span>
                              </button>
                            )}

                            {/* Collect Remaining Due */}
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handleOpenCollectPayment(entry)}
                                className="px-2 py-1 text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded transition cursor-pointer"
                                title={`Collect pending due ₹${entry.dueAmount}`}
                              >
                                <span>Pay Due</span>
                              </button>
                            )}

                            {/* Print / Slip */}
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptForSlip(entry)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Registration Slip"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Share */}
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(entry)}
                              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition cursor-pointer"
                              title="Share slip on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column (5 cols): Laboratory Technician Worklist */}
              <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5 text-indigo-700" />
                    <span className="text-xs font-semibold text-slate-900">
                      Testing Worklist &amp; Analyzers
                    </span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {filteredLabReports.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('technician')}
                    className="text-[11px] text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Console</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
                  {filteredLabReports.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No laboratory reports found.
                    </div>
                  ) : (
                    filteredLabReports.map((report) => {
                      const abnormalParams = (report.items || []).filter(
                        (i) => i.isAbnormal || i.flag === 'H' || i.flag === 'L'
                      ).length;

                      return (
                        <div key={report.reportId} className="p-3 hover:bg-slate-50/70 transition flex items-center justify-between gap-2.5 text-xs">
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-slate-800 text-[11px]">
                                {report.reportId}
                              </span>
                              <span className="font-semibold text-slate-900 truncate max-w-[130px]">
                                {report.patientName}
                              </span>
                              <span className="text-[11px] text-slate-400">·</span>
                              <span className="text-[11px] text-slate-500">
                                {report.ageGender || `${report.patientAge || '30'}Y`}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                              <span className="truncate max-w-[170px]">
                                {report.testName || (report.items?.[0]?.testName || 'Diagnostic Profile')}
                              </span>
                              {abnormalParams > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-rose-600 font-medium">
                                    {abnormalParams} abnormal
                                  </span>
                                </>
                              )}
                              <span>·</span>
                              <span className="text-slate-400 font-mono">
                                {report.tokenNumber || report.uhid}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedReportForView(report)}
                              className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition flex items-center gap-1 cursor-pointer"
                              title="View diagnostic report"
                            >
                              <Eye className="w-3 h-3 text-slate-600" />
                              <span>View</span>
                            </button>

                            {onOpenReportPortal && (
                              <button
                                type="button"
                                onClick={() => onOpenReportPortal(report.reportId, report.mobile)}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                title="Open in Patient Portal"
                              >
                                <Globe className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: RECEPTION DEPARTMENT (FULL DEDICATED VIEW)        */}
        {/* ======================================================== */}
        {activeTab === 'reception' && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <ReceptionEntryDashboard
              onNavigateView={onNavigateView}
              onOpenReportPortal={onOpenReportPortal}
              isEmbedded={true}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TECHNICIAN DEPARTMENT (WORKSTATION CONSOLE)       */}
        {/* ======================================================== */}
        {activeTab === 'technician' && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <LabSoftwareApp
              onBackToWebsite={() => setActiveTab('overview')}
              onViewReport={(rId, mob) => {
                if (onOpenReportPortal) onOpenReportPortal(rId, mob);
              }}
              isEmbedded={true}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DAILY CASH & FINANCIAL RECONCILIATION             */}
        {/* ======================================================== */}
        {activeTab === 'financials' && (
          <div className="space-y-4">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Gross Billed</span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  ₹{totalNetBilled.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Across {totalPatientsToday} patient registrations
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Cash in Register</span>
                <span className="text-xl font-bold text-emerald-700 font-mono">
                  ₹{totalCashCollected.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Physical currency drawer
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Digital UPI / QR</span>
                <span className="text-xl font-bold text-sky-700 font-mono">
                  ₹{totalUpiCollected.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Direct bank credit verified
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Pending Patient Dues</span>
                <span className="text-xl font-bold text-amber-700 font-mono">
                  ₹{totalDuePending.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {patientsWithDueCount} pending settlements
                </span>
              </div>
            </div>

            {/* Dues Settlement Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-semibold text-slate-900">
                  Pending Dues Settlement Queue
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Total Outstanding: ₹{totalDuePending}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Token</th>
                      <th className="py-2 px-3 font-semibold">Patient Name</th>
                      <th className="py-2 px-3 font-semibold">Mobile</th>
                      <th className="py-2 px-3 font-semibold">Total Bill</th>
                      <th className="py-2 px-3 font-semibold">Paid</th>
                      <th className="py-2 px-3 font-semibold text-amber-800">Remaining Due</th>
                      <th className="py-2 px-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receptionEntries
                      .filter((e) => (e.dueAmount || 0) > 0)
                      .map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {entry.tokenNumber}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {entry.patientName}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500">
                            {entry.mobile}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            ₹{entry.totalAmount}
                          </td>
                          <td className="py-2 px-3 font-mono text-emerald-700">
                            ₹{entry.paidAmount}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-amber-700">
                            ₹{entry.dueAmount}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenCollectPayment(entry)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded transition cursor-pointer"
                            >
                              Collect Due
                            </button>
                          </td>
                        </tr>
                      ))}
                    {receptionEntries.filter((e) => (e.dueAmount || 0) > 0).length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          All patient accounts are settled in full (₹0 due balance).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. FAST REGISTRATION MODAL */}
      {isFastRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-4 space-y-3.5 text-xs animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Fast Patient Check-In</h3>
                <p className="text-[11px] text-slate-500">Instant registration token and live queue assignment</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFastRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFastRegister} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Patient Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fastPatientName}
                  onChange={(e) => setFastPatientName(e.target.value)}
                  placeholder="e.g. Gurpreet Singh"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={fastAge}
                    onChange={(e) => setFastAge(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-center text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={fastGender}
                    onChange={(e) => setFastGender(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={fastMobile}
                    onChange={(e) => setFastMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10 Digits"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Select Test</label>
                <select
                  value={fastSelectedTest}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFastSelectedTest(val);
                    const match = vendorTests.find((t) => t.name === val);
                    if (match?.priceINR) setFastPaidAmount(String(match.priceINR));
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs truncate"
                >
                  {vendorTests.map((t) => (
                    <option key={t.id || t.name} value={t.name}>
                      {t.name} (₹{t.priceINR})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={fastPaymentMode}
                    onChange={(e) => setFastPaymentMode(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                  >
                    <option value="UPI">UPI / QR</option>
                    <option value="Cash">Cash Counter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Paid Now (₹)</label>
                  <input
                    type="number"
                    value={fastPaidAmount}
                    onChange={(e) => setFastPaidAmount(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFastRegisterOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold cursor-pointer"
                >
                  Register &amp; Print Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. SLIP PREVIEW MODAL */}
      {selectedReceiptForSlip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative max-w-md w-full animate-scale-in">
            <WebsiteTokenReceiptCard
              receipt={{
                tokenNumber: selectedReceiptForSlip.tokenNumber,
                uhid: selectedReceiptForSlip.uhid,
                patientName: selectedReceiptForSlip.patientName,
                age: selectedReceiptForSlip.age,
                gender: selectedReceiptForSlip.gender,
                mobile: selectedReceiptForSlip.mobile,
                referringDoctor: selectedReceiptForSlip.referringDoctor,
                tests: selectedReceiptForSlip.tests,
                totalAmount: selectedReceiptForSlip.totalAmount,
                discountINR: selectedReceiptForSlip.discountINR,
                paidAmount: selectedReceiptForSlip.paidAmount,
                dueAmount: selectedReceiptForSlip.dueAmount,
                paymentMode: selectedReceiptForSlip.paymentMode,
                paymentStatus: selectedReceiptForSlip.paymentStatus,
                registeredAt: selectedReceiptForSlip.registeredAt,
                labId: selectedReceiptForSlip.labId || selectedVendorLabId,
                labName: labName,
                labPhone: labPhone,
              }}
              onClose={() => setSelectedReceiptForSlip(null)}
            />
          </div>
        </div>
      )}

      {/* 6. REPORT DETAIL MODAL */}
      {selectedReportForView && (
        <ReportDetailModal
          report={selectedReportForView}
          isOpen={Boolean(selectedReportForView)}
          onClose={() => setSelectedReportForView(null)}
        />
      )}

      {/* 7. COLLECT PAYMENT MODAL */}
      {isCollectPaymentOpen && collectingPaymentEntry && (
        <CollectRemainingPaymentModal
          isOpen={isCollectPaymentOpen}
          entry={collectingPaymentEntry}
          onClose={() => {
            setIsCollectPaymentOpen(false);
            setCollectingPaymentEntry(null);
          }}
          onCollectPayment={handleCollectPaymentSubmit}
        />
      )}

      {/* 8. COMPACT FOOTER */}
      <DashboardFooter currentRoleTitle="Expert Member" onNavigateView={onNavigateView} />
    </div>
  );
};
