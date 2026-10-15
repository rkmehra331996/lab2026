import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Users,
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Search,
  Printer,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Building,
  Building2,
  MapPin,
  FileText,
  FileCheck,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  QrCode,
  Send,
  Eye,
  LogOut,
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
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView, ReceptionPatientEntry, LabReport } from '../types';
import { ReceptionEntryDashboard, getDisplayTokenNumber, getWebsiteBookingMeta } from './ReceptionEntryDashboard';
import { LabSoftwareApp } from './LabSoftwareApp';
import { DashboardFooter } from './DashboardFooter';
import { ReportDetailModal } from './ReportDetailModal';
import { CollectRemainingPaymentModal } from './CollectRemainingPaymentModal';
import { DayEndCashClosingModal } from './reception/DayEndCashClosingModal';
import { SyncNowButton } from './SyncNowButton';
import { buildReceiptInvoicePdf } from '../utils/pdfGenerator';

interface ExpertMemberDashboardProps {
  onNavigateView: (view: AppView) => void;
  onOpenReportPortal?: (reportId?: string, mobile?: string) => void;
}

export type ExpertDashboardTab =
  | 'dual_hub'
  | 'reception'
  | 'technician'
  | 'tat_handover';

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
    vendorTests,
    activeBranchId,
    setActiveBranchId,
    selectedVendorLabId,
  } = useCms();

  const [activeTab, setActiveTab] = useState<ExpertDashboardTab>('dual_hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState<'All' | 'Waiting' | 'In Lab' | 'Report Ready' | 'Due'>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [selectedReportForView, setSelectedReportForView] = useState<LabReport | null>(null);
  const [collectingPaymentEntry, setCollectingPaymentEntry] = useState<ReceptionPatientEntry | null>(null);
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);

  const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology Laboratory';
  const labNabl = vendorLabSettings?.nablAccreditationNo || 'MC-4821';
  const labPhone = vendorLabSettings?.phone || '7087033009';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // RECEPTION DEPARTMENT METRICS
  // -------------------------------------------------------------
  const totalPatientsToday = receptionEntries.length;
  const totalNetBilled = receptionEntries.reduce(
    (acc, e) => acc + Math.max(0, e.totalAmount - (e.discountINR || 0)),
    0
  );
  const totalCashCollected = receptionEntries.reduce(
    (acc, e) => acc + (e.paymentMode === 'Cash' ? e.paidAmount : 0),
    0
  );
  const totalUpiCollected = receptionEntries.reduce(
    (acc, e) => acc + (e.paymentMode === 'UPI' ? e.paidAmount : 0),
    0
  );
  const totalTotalCollection = receptionEntries.reduce((acc, e) => acc + e.paidAmount, 0);
  const totalDuePending = receptionEntries.reduce((acc, e) => acc + e.dueAmount, 0);
  const patientsWithDueCount = receptionEntries.filter((e) => e.dueAmount > 0).length;
  const waitingSamplesCount = receptionEntries.filter((e) => e.status === 'Waiting').length;
  const inLabCount = receptionEntries.filter(
    (e) => e.status === 'In Lab' || e.status === 'Sample Collected' || e.technicianStatus === 'Accepted'
  ).length;
  const reportsReadyCount = receptionEntries.filter(
    (e) => e.status === 'Report Ready' || e.technicianStatus === 'Report Generated' || Boolean(e.reportId)
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
  // FILTERED QUEUES
  // -------------------------------------------------------------
  const filteredReceptionEntries = useMemo(() => {
    return receptionEntries.filter((entry) => {
      // 1. Pipeline filter
      if (pipelineFilter === 'Waiting' && entry.status !== 'Waiting') return false;
      if (
        pipelineFilter === 'In Lab' &&
        !(entry.status === 'In Lab' || entry.status === 'Sample Collected' || entry.technicianStatus === 'Accepted')
      )
        return false;
      if (
        pipelineFilter === 'Report Ready' &&
        !(entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated' || Boolean(entry.reportId))
      )
        return false;
      if (pipelineFilter === 'Due' && entry.dueAmount <= 0) return false;

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
    showToast(`🚀 Token ${entry.tokenNumber} (${entry.patientName}) dispatched to Technician Department!`);
  };

  const handleShareReceiptWhatsApp = async (entry: ReceptionPatientEntry) => {
    try {
      showToast('📄 Generating receipt PDF...');
      const { doc, filename, file } = await buildReceiptInvoicePdf(entry, labName);
      const netAmount = (entry.totalAmount || 0) - (entry.discountINR || 0);
      const shareText =
        `🧾 *${labName}* - Token & Invoice Receipt\n` +
        `--------------------------------\n` +
        `🎟️ Token: *${entry.tokenNumber}*\n` +
        `🆔 UHID: ${entry.uhid}\n` +
        `👤 Patient: *${entry.patientName}* (${entry.age}Y/${entry.gender})\n` +
        `📱 Mobile: +91 ${entry.mobile}\n` +
        `🩺 Doctor: ${entry.referringDoctor}\n` +
        `🧪 Tests: ${entry.tests.join(', ')}\n` +
        `💵 Net Bill: ₹${netAmount} | Paid: ₹${entry.paidAmount}${entry.dueAmount > 0 ? ` | Due: ₹${entry.dueAmount}` : ' (Full Paid)'}\n` +
        `Status: ${entry.status}\n\n` +
        `Thank you for choosing ${labName}!`;

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Receipt ${entry.tokenNumber} - ${labName}`,
            text: shareText,
          });
          showToast(`✅ Receipt shared via WhatsApp!`);
          return;
        } catch {}
      }
      doc.save(filename);
      const cleanMobile = entry.mobile.replace(/\D/g, '');
      const url = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank');
      showToast(`✅ Receipt PDF downloaded & WhatsApp opened!`);
    } catch {
      showToast('⚠️ Failed to generate receipt PDF.');
    }
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
    showToast(`✅ Payment ₹${collectedAmount} collected for Token ${entry.tokenNumber}!`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
      {/* Top Header Bar for Expert Supervisor */}
      <header className="bg-gradient-to-r from-[#0F284E] via-[#123B6D] to-[#1E293B] text-white sticky top-0 z-30 shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Lab Branding & Dual Department Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md border border-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  Expert Member Dashboard
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-2xs font-mono">
                  Dual Department Management
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-slate-200 border border-white/20">
                  {labNabl}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold truncate max-w-[200px] sm:max-w-[320px]">{labName}</span>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span className="text-emerald-300 text-[11px] hidden sm:inline">
                  Reception (Front Desk) + Technician (Analyzers)
                </span>
              </p>
            </div>
          </div>

          {/* Right: Quick Controls, Workstation Switch & Logout */}
          <div className="flex items-center gap-2 flex-wrap">
            <SyncNowButton />

            {/* Fast Cash Closing Tally */}
            <button
              type="button"
              onClick={() => setIsCashClosingOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/15 cursor-pointer shadow-2xs"
              title="Open Daily Cash Closing & Drawer Reconciliation Tally"
            >
              <Receipt className="w-3.5 h-3.5 text-teal-300" />
              <span className="hidden sm:inline">Cash Drawer</span>
            </button>

            {/* Return to Lab Owner */}
            <button
              type="button"
              onClick={() => onNavigateView('vendor_dashboard')}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1 shadow-sm cursor-pointer"
              title="Open Lab Owner / Management Portal"
            >
              <span>👑 Lab Owner</span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
                logout();
                onNavigateView('vendor_website');
              }}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1 border border-rose-400/40 cursor-pointer shadow-2xs"
              title="Sign out of Expert account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* 3. Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-white/10 pt-1 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('dual_hub')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'dual_hub'
                ? 'border-amber-400 bg-white/15 text-white shadow-xs'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Dual Dept Command Center</span>
            <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
              LIVE
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reception')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'reception'
                ? 'border-teal-400 bg-white/15 text-white shadow-xs'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-4 h-4 text-teal-400" />
            <span>Reception Department (Billing &amp; Tokens)</span>
            <span className="text-[10px] bg-teal-500/40 text-teal-200 px-1.5 py-0.2 rounded-full font-bold">
              {totalPatientsToday}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('technician')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'technician'
                ? 'border-purple-400 bg-white/15 text-white shadow-xs'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-purple-400" />
            <span>Technician Department (Testing &amp; Analyzers)</span>
            <span className="text-[10px] bg-purple-500/40 text-purple-200 px-1.5 py-0.2 rounded-full font-bold">
              {activeReportsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tat_handover')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'tat_handover'
                ? 'border-emerald-400 bg-white/15 text-white shadow-xs'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>TAT &amp; Department Handover Audit</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4. Main Body Content Based on Active Tab */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: DUAL DEPARTMENT COMMAND CENTER & LIVE MONITOR      */}
        {/* ======================================================== */}
        {activeTab === 'dual_hub' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Department Workflow Funnel Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-[#123B6D] to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-black text-sm sm:text-base flex items-center gap-2 text-white">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Department Handover &amp; Processing Pipeline (विभाग हैंडओवर पाइपलाइन)</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Trace patient flow in real time from Front Desk Reception Registration through Laboratory Testing to Verification.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('reception')}
                    className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Walk-in Bill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('technician')}
                    className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-amber-300" />
                    <span>Open Workstation</span>
                  </button>
                </div>
              </div>

              {/* 4 Pipeline Stages */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {/* Stage 1 */}
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-teal-300 font-bold">
                    <span>1. Reception Billing</span>
                    <span>TK Queue</span>
                  </div>
                  <div className="text-xl font-black font-mono text-white">{totalPatientsToday} Registered</div>
                  <div className="text-[10px] text-slate-300">Token issued, UHID &amp; INR billed</div>
                </div>

                {/* Stage 2 */}
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-blue-300 font-bold">
                    <span>2. Sample Collection</span>
                    <span>Phlebotomy</span>
                  </div>
                  <div className="text-xl font-black font-mono text-white">{waitingSamplesCount} Waiting</div>
                  <div className="text-[10px] text-slate-300">Specimen tubes &amp; barcode tagging</div>
                </div>

                {/* Stage 3 */}
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-purple-300 font-bold">
                    <span>3. Lab Testing</span>
                    <span>Analyzers</span>
                  </div>
                  <div className="text-xl font-black font-mono text-white">{inLabCount} Testing</div>
                  <div className="text-[10px] text-slate-300">CBC, Biochemistry, Urine findings</div>
                </div>

                {/* Stage 4 */}
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold">
                    <span>4. Doctor Review</span>
                    <span>Ready</span>
                  </div>
                  <div className="text-xl font-black font-mono text-white">{reportsReadyCount} Ready</div>
                  <div className="text-[10px] text-slate-300">Handover for Sign-off &amp; WhatsApp</div>
                </div>
              </div>
            </div>

            {/* Search and Pipeline Filter Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Patient, Mobile, Token, Test, UHID..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Pipeline Quick Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-400 mr-1 hidden md:inline">Filter:</span>
                {(['All', 'Waiting', 'In Lab', 'Report Ready', 'Due'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setPipelineFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      pipelineFilter === filter
                        ? 'bg-[#123B6D] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{filter}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Side-by-Side Dual Monitor Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN (6 Cols): RECEPTION QUEUE */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-900 flex items-center justify-center font-bold">
                      <Receipt className="w-4 h-4 text-teal-700" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        Reception Department Queue (रिसेप्शन काउंटर)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Live tokens, patient intake &amp; billing status ({filteredReceptionEntries.length})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reception')}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Reception</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Reception Entries List */}
                {filteredReceptionEntries.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">No reception entries match this filter</div>
                    <p className="text-[11px] text-slate-400">
                      Walk-in patients registered at the reception counter will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {filteredReceptionEntries.map((entry) => {
                      const isReady = Boolean(
                        entry.status === 'Report Ready' ||
                        entry.technicianStatus === 'Report Generated' ||
                        entry.reportId
                      );
                      const isSentToLab = Boolean(
                        entry.sentToTechnician ||
                        entry.technicianStatus === 'Sent to Lab' ||
                        entry.technicianStatus === 'Accepted' ||
                        entry.status === 'In Lab'
                      );

                      return (
                        <div
                          key={entry.id}
                          className="p-3.5 rounded-xl border border-slate-200/90 hover:border-teal-300 hover:shadow-xs transition bg-slate-50/50 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 font-mono font-black text-xs">
                                  {getDisplayTokenNumber(entry.tokenNumber, entry.id)}
                                </span>
                                <h5 className="font-black text-xs sm:text-sm text-slate-900">
                                  {entry.patientName}
                                </h5>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({entry.age}Y • {entry.gender})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span className="font-mono">{entry.mobile}</span>
                                <span>•</span>
                                <span className="truncate max-w-[140px]">{entry.referringDoctor}</span>
                              </div>
                            </div>

                            {/* Status tag */}
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                isReady
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : isSentToLab
                                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {isReady ? 'Report Ready' : isSentToLab ? 'In Lab' : 'Waiting Phlebotomy'}
                            </span>
                          </div>

                          {/* Tests Tag */}
                          <div className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                            <span className="font-medium truncate max-w-[240px]">
                              🧪 {(entry.tests || []).join(', ')}
                            </span>
                            <span className="font-bold font-mono text-slate-900 text-xs shrink-0">
                              ₹{Math.max(0, entry.totalAmount - (entry.discountINR || 0))}
                            </span>
                          </div>

                          {/* Financial & Actions Bar */}
                          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  entry.dueAmount > 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {entry.dueAmount > 0 ? `Due: ₹${entry.dueAmount}` : 'Paid (Nil Due)'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Mode: {entry.paymentMode || 'Cash'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Send to Lab button if waiting */}
                              {!isSentToLab && !isReady && (
                                <button
                                  type="button"
                                  onClick={() => handleSendToTech(entry)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Handover specimen to Technician department"
                                >
                                  <span>Send to Tech</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {/* Due Collection button */}
                              {entry.dueAmount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCollectPayment(entry)}
                                  className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition cursor-pointer"
                                  title="Collect remaining balance payment"
                                >
                                  Collect ₹{entry.dueAmount}
                                </button>
                              )}

                              {/* Share Receipt on WhatsApp */}
                              <button
                                type="button"
                                onClick={() => handleShareReceiptWhatsApp(entry)}
                                className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-700 transition"
                                title="Send Receipt PDF to WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN (6 Cols): TECHNICIAN WORKLIST */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                      <FlaskConical className="w-4 h-4 text-purple-700" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        Technician Department Testing Worklist (लैब टेस्टिंग)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Specimen processing, analyzer values &amp; abnormal flags ({filteredLabReports.length})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('technician')}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Testing Bench</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Technician Reports List */}
                {filteredLabReports.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">No lab reports found</div>
                    <p className="text-[11px] text-slate-400">
                      Dispatched specimens from reception will populate the testing bench here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {filteredLabReports.map((report) => {
                      const hasAbnormal = (report.items || []).some(
                        (it) => it.isAbnormal || it.flag === 'H' || it.flag === 'L'
                      );

                      return (
                        <div
                          key={report.reportId || report.id}
                          className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                            hasAbnormal
                              ? 'border-amber-300 bg-amber-50/30'
                              : 'border-slate-200/90 bg-slate-50/50 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-mono font-black text-xs">
                                  {report.barcode || report.reportId || report.id}
                                </span>
                                <h5 className="font-black text-xs sm:text-sm text-slate-900">
                                  {report.patientName}
                                </h5>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({report.ageGender || `${report.patientAge || ''}Y • ${report.patientGender || ''}`})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>Ref Dr: {report.doctor || report.referringDoctor || 'Self Walk-in'}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-600">
                                  {report.reportedAt ? new Date(report.reportedAt).toLocaleDateString('en-IN') : (report.reportDate || 'Today')}
                                </span>
                              </div>
                            </div>

                            {/* Status Pill */}
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                report.status === 'Completed' || report.status === 'Signed' || report.status === 'Verified'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : report.status === 'In Progress'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                  : 'bg-blue-100 text-blue-900 border border-blue-300'
                              }`}
                            >
                              {report.status || 'Testing'}
                            </span>
                          </div>

                          {/* Tests & Parameters summary */}
                          <div className="bg-white p-2 rounded-lg border border-slate-100 text-[11px] space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>🔬 {report.testName || (report.items?.[0]?.testName) || 'Comprehensive Pathology'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {(report.items || []).length} Parameters
                              </span>
                            </div>
                            {hasAbnormal && (
                              <div className="text-[10px] text-rose-700 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Abnormal biological reference interval flags detected</span>
                              </div>
                            )}
                          </div>

                          {/* Action row */}
                          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <span>Specimen:</span>
                              <span className="font-bold text-slate-700">EDTA / Serum Tube</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Open Detail Review */}
                              <button
                                type="button"
                                onClick={() => setSelectedReportForView(report)}
                                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 text-[11px] font-bold border border-purple-200 transition flex items-center gap-1 cursor-pointer"
                                title="Review test findings and abnormal flags"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect Values</span>
                              </button>

                              {/* Open In Report Portal */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenReportPortal) {
                                    onOpenReportPortal(report.reportId || report.id || '', report.mobile || report.patientMobile || '');
                                  } else {
                                    onNavigateView('patient_portal');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#123B6D] hover:bg-[#0e2c52] text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Preview patient PDF report"
                              >
                                <FileCheck className="w-3 h-3 text-amber-300" />
                                <span>PDF Report</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: RECEPTION DEPARTMENT (FULL EMBEDDED DASHBOARD)    */}
        {/* ======================================================== */}
        {activeTab === 'reception' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-teal-950">
                    Reception Department Workspace (रिसेप्शन एवं बिलिंग काउंटर)
                  </h3>
                  <p className="text-xs text-teal-800">
                    Register new walk-in patients, generate tokens, collect Cash &amp; UPI payments, and print thermal slips.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('dual_hub')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-teal-900 border border-teal-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dual Command Hub</span>
              </button>
            </div>

            {/* Embedded Reception Entry Dashboard */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <ReceptionEntryDashboard
                onNavigateView={onNavigateView}
                onOpenReportPortal={onOpenReportPortal}
                isEmbedded={true}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TECHNICIAN DEPARTMENT (FULL EMBEDDED WORKSTATION) */}
        {/* ======================================================== */}
        {activeTab === 'technician' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-purple-950">
                    Technician Department Workstation (लैब टेस्टिंग एवं एनालाइजर डेस्क)
                  </h3>
                  <p className="text-xs text-purple-800">
                    Accession patient specimens, enter test parameter findings, review abnormal flags, and draft clinical reports.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('dual_hub')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-purple-900 border border-purple-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dual Command Hub</span>
              </button>
            </div>

            {/* Embedded Lab Software App for Technician */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <LabSoftwareApp
                onBackToWebsite={() => setActiveTab('dual_hub')}
                onViewReport={(rId, mob) => {
                  if (onOpenReportPortal) onOpenReportPortal(rId, mob);
                }}
                isEmbedded={true}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: TAT & DEPARTMENT HANDOVER AUDIT                   */}
        {/* ======================================================== */}
        {activeTab === 'tat_handover' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <span>Turnaround Time (TAT) &amp; Inter-Department Handover Log</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Continuous operational monitoring: track every patient handover from Front Desk to Phlebotomy, Analyzers, and Pathologist Sign-off.
                  </p>
                </div>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full">
                  NABL Standard: &lt; 45 Mins for Routine Blood
                </span>
              </div>

              {/* Handover Stages Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Token &amp; UHID</th>
                      <th className="py-3 px-3">Patient Name</th>
                      <th className="py-3 px-3">Tests Ordered</th>
                      <th className="py-3 px-3">Reception Intake</th>
                      <th className="py-3 px-3">Sample Handover</th>
                      <th className="py-3 px-3">Tech Analysis</th>
                      <th className="py-3 px-3">Total TAT</th>
                      <th className="py-3 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receptionEntries.map((e, idx) => {
                      const isReady = Boolean(
                        e.status === 'Report Ready' ||
                        e.technicianStatus === 'Report Generated' ||
                        e.reportId
                      );
                      const isSent = Boolean(
                        e.sentToTechnician ||
                        e.technicianStatus === 'Sent to Lab' ||
                        e.technicianStatus === 'Accepted' ||
                        e.status === 'In Lab'
                      );

                      return (
                        <tr key={e.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {getDisplayTokenNumber(e.tokenNumber, e.id)}
                            <div className="text-[10px] text-slate-400 font-normal">{e.uhid}</div>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {e.patientName}
                            <div className="text-[10px] text-slate-400 font-normal">{e.mobile}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {(e.tests || []).slice(0, 2).join(', ')}
                            {(e.tests || []).length > 2 && ` +${(e.tests || []).length - 2} more`}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {e.registeredAt || '09:00 AM'}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {isSent ? e.sentToLabAt || '09:08 AM' : 'Pending'}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {isReady ? 'Completed' : isSent ? 'Under Testing' : 'Waiting Phlebotomy'}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">
                            {isReady ? (
                              <span className="text-emerald-700">22 mins</span>
                            ) : isSent ? (
                              <span className="text-purple-700">In process...</span>
                            ) : (
                              <span className="text-amber-700">Waiting</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isReady
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : isSent
                                  ? 'bg-purple-100 text-purple-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {isReady ? 'Ready' : isSent ? 'Testing' : 'Intake'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 5. Modals */}
      {/* Report Detail Modal */}
      {selectedReportForView && (
        <ReportDetailModal
          report={selectedReportForView}
          isOpen={Boolean(selectedReportForView)}
          onClose={() => setSelectedReportForView(null)}
        />
      )}

      {/* Collect Remaining Payment Modal */}
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

      {/* Day-End Cash Closing Modal */}
      {isCashClosingOpen && (
        <DayEndCashClosingModal
          isOpen={isCashClosingOpen}
          onClose={() => setIsCashClosingOpen(false)}
          receptionEntries={receptionEntries}
        />
      )}

      {/* 6. Dashboard Footer */}
      <DashboardFooter currentRoleTitle="Expert Member" onNavigateView={onNavigateView} />
    </div>
  );
};
