import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  IndianRupee,
  LogOut,
  Globe,
  Activity,
  Receipt,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView, ReceptionPatientEntry } from '../types';
import { ReceptionEntryDashboard } from './ReceptionEntryDashboard';
import { LabSoftwareApp } from './LabSoftwareApp';
import { DashboardFooter } from './DashboardFooter';
import { CollectRemainingPaymentModal } from './CollectRemainingPaymentModal';
import { SyncNowButton } from './SyncNowButton';

interface ExpertMemberDashboardProps {
  onNavigateView: (view: AppView) => void;
  onOpenReportPortal?: (reportId?: string, mobile?: string) => void;
}

export type ExpertDashboardTab =
  | 'reception'
  | 'technician'
  | 'financials';

export const ExpertMemberDashboard: React.FC<ExpertMemberDashboardProps> = ({
  onNavigateView,
  onOpenReportPortal,
}) => {
  const {
    logout,
    vendorLabSettings,
    receptionEntries,
    updateReceptionEntry,
  } = useCms();

  const [activeTab, setActiveTab] = useState<ExpertDashboardTab>('reception');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [collectingPaymentEntry, setCollectingPaymentEntry] = useState<ReceptionPatientEntry | null>(null);
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);

  const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology';
  const labNabl = vendorLabSettings?.nablAccreditationNo || 'MC-4821';

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
  const totalDuePending = receptionEntries.reduce((acc, e) => acc + (e.dueAmount || 0), 0);
  const patientsWithDueCount = receptionEntries.filter((e) => (e.dueAmount || 0) > 0).length;

  const waitingSamplesCount = receptionEntries.filter((e) => e.status === 'Waiting').length;
  const inLabCount = receptionEntries.filter(
    (e) =>
      !(e.status === 'Report Ready' || e.technicianStatus === 'Report Generated') &&
      (e.sentToTechnician || e.status === 'In Lab' || e.status === 'Sample Collected' || e.technicianStatus === 'Sent to Lab' || e.technicianStatus === 'Accepted')
  ).length;



  // Handlers
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
        {/* TAB 1: RECEPTION DEPARTMENT (FULL DEDICATED VIEW)        */}
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
              onBackToWebsite={() => setActiveTab('reception')}
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
