import React, { useState } from 'react';
import {
  LayoutDashboard,
  ExternalLink,
  Users,
  FlaskConical,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  TrendingUp,
  CreditCard,
  QrCode,
  CalendarCheck,
  Send,
  Building2,
  RefreshCw,
  Sparkles,
  Phone,
  Search,
  Maximize2,
  ChevronRight,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { AppView } from '../../types';
import { ReceptionEntryDashboard } from '../ReceptionEntryDashboard';
import { TechnicianDepartmentDashboard } from '../technician/TechnicianDepartmentDashboard';

interface VendorDashboardsTabProps {
  initialSubTab?: 'reception' | 'technician' | 'overview';
  activeSubTab?: 'reception' | 'technician' | 'overview';
  onSubTabChange?: (tab: 'reception' | 'technician' | 'overview') => void;
  onNavigateView: (view: AppView) => void;
}

export const VendorDashboardsTab: React.FC<VendorDashboardsTabProps> = ({
  initialSubTab = 'reception',
  activeSubTab: externalSubTab,
  onSubTabChange,
  onNavigateView,
}) => {
  const {
    receptionEntries,
    reports,
    vendorBookings,
    vendorLabSettings,
    currentUser,
    vendorTests,
  } = useCms();

  const [internalSubTab, setInternalSubTab] = useState<'reception' | 'technician' | 'overview'>(initialSubTab);
  const currentSubTab = externalSubTab || internalSubTab;

  const handleSubTabChange = (tab: 'reception' | 'technician' | 'overview') => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology';

  // --- RECEPTION METRICS ---
  const totalTokensToday = receptionEntries.length;
  const waitingPatients = receptionEntries.filter((e) => e.status === 'Waiting').length;
  const inLabSamples = receptionEntries.filter((e) => e.status === 'In Lab' || e.status === 'Sample Collected').length;
  const readyReports = receptionEntries.filter((e) => e.status === 'Report Ready').length;

  const totalCollectedToday = receptionEntries.reduce((acc, e) => acc + (e.paidAmount || 0), 0);
  const totalDuePending = receptionEntries.reduce((acc, e) => acc + (e.dueAmount || 0), 0);
  const cashCollected = receptionEntries.reduce((acc, e) => acc + (e.paymentMode === 'Cash' ? (e.paidAmount || 0) : 0), 0);
  const upiCollected = receptionEntries.reduce((acc, e) => acc + (e.paymentMode === 'UPI' ? (e.paidAmount || 0) : 0), 0);

  // Transferred bookings from Form > Booking Submissions to Reception
  const transferredBookings = vendorBookings.filter((b) => b.transferredToReception);

  // --- TECHNICIAN METRICS ---
  const activeReportsCount = reports.filter((r) => !r.isCancelled).length;
  const cancelledReportsCount = reports.filter((r) => !!r.isCancelled).length;

  return (
    <div className="space-y-4">
      {/* 3. SUB-TAB VIEW: OVERVIEW / COMMAND CENTER */}
      {currentSubTab === 'overview' && (
        <div className="space-y-4">
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Reception Tokens</span>
                <span className="text-teal-600 text-base">🖥️</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalTokensToday}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-teal-700 font-bold">{waitingPatients} Waiting</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">{readyReports} Ready</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Counter Revenue</span>
                <span className="text-emerald-600 text-base">💰</span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                ₹{totalCollectedToday.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Cash: ₹{cashCollected.toLocaleString('en-IN')} • UPI: ₹{upiCollected.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Technician Lab Worklist</span>
                <span className="text-indigo-600 text-base">🔬</span>
              </div>
              <div className="text-2xl font-black text-indigo-700 font-mono">{inLabSamples}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Samples undergoing test analyzer evaluation
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Transferred Online Bookings</span>
                <span className="text-amber-600 text-base">📲</span>
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono">{transferredBookings.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Website form bookings synced to reception
              </div>
            </div>
          </div>

          {/* Quick Launch Cards for Both Desks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reception Desk Quick Card */}
            <div className="bg-gradient-to-br from-teal-50/80 to-white p-5 rounded-2xl border border-teal-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🖥️</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Reception Entry & Billing Desk</h3>
                      <p className="text-xs text-slate-500">Patient check-in, token generation, thermal slips</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-100 text-teal-800">
                    Active Desk
                  </span>
                </div>
                <div className="space-y-2 mt-3 pt-3 border-t border-teal-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Patient Token Queue:</span>
                    <strong className="text-slate-900">{totalTokensToday} Patients</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cash / UPI Split:</span>
                    <strong className="text-slate-900 font-mono">
                      ₹{cashCollected} / ₹{upiCollected}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Pending Dues to Settle:</span>
                    <strong className="text-amber-700 font-mono">
                      ₹{totalDuePending.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-teal-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubTabChange('reception')}
                  className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Open Reception Desk Tab</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('reception_dashboard')}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  title="Full Screen Desk"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                </button>
              </div>
            </div>

            {/* Technician Console Quick Card */}
            <div className="bg-gradient-to-br from-indigo-50/80 to-white p-5 rounded-2xl border border-indigo-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔬</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Technician Department Console</h3>
                      <p className="text-xs text-slate-500">Sample testing, normal ranges, reports & sign-off</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800">
                    Active Console
                  </span>
                </div>
                <div className="space-y-2 mt-3 pt-3 border-t border-indigo-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Active Tested Reports:</span>
                    <strong className="text-slate-900">{activeReportsCount} Reports</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>In-Lab Samples Waiting:</span>
                    <strong className="text-indigo-700">{inLabSamples} Samples</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cancelled Reports (With Audit Reason):</span>
                    <strong className="text-slate-600">{cancelledReportsCount}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubTabChange('technician')}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Open Technician Console Tab</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('technician_dashboard')}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  title="Full Screen Console"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB VIEW: RECEPTION DASHBOARD */}
      {currentSubTab === 'reception' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <ReceptionEntryDashboard
            onNavigateView={onNavigateView}
            isEmbedded={true}
          />
        </div>
      )}

      {/* 5. SUB-TAB VIEW: TECHNICIAN DASHBOARD */}
      {currentSubTab === 'technician' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <TechnicianDepartmentDashboard
            onNavigateView={onNavigateView}
            isEmbedded={true}
          />
        </div>
      )}
    </div>
  );
};
