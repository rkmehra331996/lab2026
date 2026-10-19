import React, { useState, useMemo } from 'react';
import {
  Sparkles,
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
  | 'reception'
  | 'technician';

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

  const [activeTab, setActiveTab] = useState<ExpertDashboardTab>('reception');
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
        {/* TAB 1: RECEPTION DEPARTMENT (FULL EMBEDDED DASHBOARD)    */}
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
                onClick={() => setActiveTab('technician')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-teal-900 border border-teal-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                <span>Switch to Technician Workstation</span>
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
                onClick={() => setActiveTab('reception')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-purple-900 border border-purple-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-teal-600" />
                <span>Switch to Reception Billing</span>
              </button>
            </div>

            {/* Embedded Lab Software App for Technician */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <LabSoftwareApp
                onBackToWebsite={() => setActiveTab('reception')}
                onViewReport={(rId, mob) => {
                  if (onOpenReportPortal) onOpenReportPortal(rId, mob);
                }}
                isEmbedded={true}
              />
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
