import React, { useState } from 'react';
import {
  MapPin,
  IndianRupee,
  Users,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  Search,
  Thermometer,
  Box,
  UserCheck,
  BadgeCheck,
  Phone,
  Receipt,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView } from '../types';
import { RoleContextBanner } from './RoleContextBanner';
import { DashboardFooter } from './DashboardFooter';

interface BranchManagerDashboardProps {
  onNavigateView: (view: AppView) => void;
  onOpenReportPortal?: (reportId?: string, mobile?: string) => void;
}

interface SampleDispatchBatch {
  id: string;
  batchNumber: string;
  dispatchTime: string;
  sampleCount: number;
  temperatureCelsius: number;
  courierName: string;
  courierPhone: string;
  courierVehicle: string;
  hubDestination: string;
  status: 'In Transit' | 'Received at Central Hub';
  receivedAt?: string;
  specimenTypes: string[];
}

const INITIAL_BATCHES: SampleDispatchBatch[] = [
  {
    id: 'batch-01',
    batchNumber: 'DSP-MT-0830',
    dispatchTime: 'Today, 08:30 AM',
    sampleCount: 14,
    temperatureCelsius: 4.2,
    courierName: 'Harpreet Singh (Sample Runner)',
    courierPhone: '+91 98140 12345',
    courierVehicle: 'PB-10-BX-9021 (Cooler Box)',
    hubDestination: 'Apex Central Hub (Sector 18-C)',
    status: 'Received at Central Hub',
    receivedAt: 'Today, 09:12 AM',
    specimenTypes: ['EDTA Blood (8)', 'Fluoride Plasma (3)', 'Serum Gel (3)'],
  },
  {
    id: 'batch-02',
    batchNumber: 'DSP-MT-1145',
    dispatchTime: 'Today, 11:45 AM',
    sampleCount: 19,
    temperatureCelsius: 3.8,
    courierName: 'Gurdeep Singh (Sample Runner)',
    courierPhone: '+91 98765 88990',
    courierVehicle: 'PB-10-DZ-4112 (Cooler Box)',
    hubDestination: 'Apex Central Hub (Sector 18-C)',
    status: 'In Transit',
    specimenTypes: ['EDTA Blood (11)', 'Serum Gel (5)', 'Urine Sterile (3)'],
  },
];

export const BranchManagerDashboard: React.FC<BranchManagerDashboardProps> = ({
  onNavigateView,
  onOpenReportPortal,
}) => {
  const { currentUser, receptionEntries, vendorBranches, activeBranchId } = useCms();
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'worklist' | 'logistics' | 'staff'>(
    'reconciliation'
  );

  // Determine current branch
  const effectiveBranchId =
    currentUser?.role === 'branch_manager'
      ? currentUser.branchId || 'branch-2'
      : activeBranchId === 'all'
      ? 'branch-2'
      : activeBranchId;

  const currentBranch =
    vendorBranches.find((b) => b.id === effectiveBranchId) || {
      id: 'branch-2',
      name: 'Model Town Collection Centre',
      badge: 'Collection Desk',
      address: 'Shop 14, Main Market, Opp. Metro Pillar 42, Ludhiana',
      phone: '+91 7087033009',
      timings: 'Mon–Sun: 7:00 AM – 9:00 PM',
    };

  // Branch-specific reception entries
  const branchEntries = receptionEntries.filter((entry) => {
    if (!entry.branchId) return true; // fallback
    return entry.branchId === effectiveBranchId;
  });

  // Calculate metrics
  const totalPatients = branchEntries.length || 18;
  const cashCollected = branchEntries
    .filter((e) => e.paymentMode === 'Cash')
    .reduce((sum, e) => sum + (e.paidAmount || 0), 0) + 4200;
  const upiCollected = branchEntries
    .filter((e) => e.paymentMode === 'UPI')
    .reduce((sum, e) => sum + (e.paidAmount || 0), 0) + 9800;
  const cardCollected = branchEntries
    .filter((e) => e.paymentMode === 'Card')
    .reduce((sum, e) => sum + (e.paidAmount || 0), 0) + 2400;
  const totalCounterCollection = cashCollected + upiCollected + cardCollected;
  const pendingDueTotal = branchEntries.reduce((sum, e) => sum + (e.dueAmount || 0), 0) + 1650;

  // Logistics & Sample Dispatch state
  const [batches, setBatches] = useState<SampleDispatchBatch[]>(INITIAL_BATCHES);
  const [isNewDispatchModalOpen, setIsNewDispatchModalOpen] = useState(false);
  const [newRunnerName, setNewRunnerName] = useState('Harpreet Singh');
  const [newRunnerPhone, setNewRunnerPhone] = useState('+91 98140 12345');
  const [newSampleCount, setNewSampleCount] = useState('8');
  const [newTemp, setNewTemp] = useState('4.0');
  const [newSpecimenNotes, setNewSpecimenNotes] = useState('EDTA Blood (5), Serum (3)');

  // Reconciliation state
  const [openingFloat] = useState(2000);
  const [closingNotes, setClosingNotes] = useState('');
  const [isReconciled, setIsReconciled] = useState(false);
  const [reconciledAt, setReconciledAt] = useState('');

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch: SampleDispatchBatch = {
      id: `batch-${Date.now()}`,
      batchNumber: `DSP-MT-${new Date().getHours()}${new Date().getMinutes()}`,
      dispatchTime: 'Just Now',
      sampleCount: Number(newSampleCount) || 5,
      temperatureCelsius: Number(newTemp) || 4.0,
      courierName: newRunnerName,
      courierPhone: newRunnerPhone,
      courierVehicle: 'Cold-Chain Insulated Box',
      hubDestination: 'Apex Central Hub (Sector 18-C)',
      status: 'In Transit',
      specimenTypes: [newSpecimenNotes],
    };
    setBatches((prev) => [newBatch, ...prev]);
    setIsNewDispatchModalOpen(false);
  };

  const handleReconcileDay = () => {
    setIsReconciled(true);
    setReconciledAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
      <RoleContextBanner currentView="branch_manager_dashboard" onNavigateView={onNavigateView} />

      {/* Branch Header Strip */}
      <div className="bg-[#123B6D] text-white py-6 px-4 sm:px-8 border-b border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>{currentBranch.name}</span>
              </span>
              <span className="text-xs bg-white/15 text-slate-200 px-2 py-0.5 rounded-md font-mono font-semibold">
                Branch Code: {currentBranch.id}
              </span>
              <span className="text-xs bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                {currentBranch.badge || 'Collection Center'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Branch Operations & Daily Cash Reconciliation
            </h1>
            <p className="text-xs sm:text-sm text-slate-200">
              {currentBranch.address} • Phone: {currentBranch.phone} • Timings: {currentBranch.timings}
            </p>
          </div>

          {/* Back Button & Quick Action to open Reception Desk for this branch */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateView('vendor_website')}
              className="bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs border border-white/20"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateView('reception_dashboard')}
              className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              <span>Open Branch Reception Counter</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Today's Branch Footfall */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Branch Footfall</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalPatients}</div>
            <p className="text-[11px] text-slate-500 font-medium">Patients registered at this desk today</p>
          </div>

          {/* Card 2: Today's Collection */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <span>Branch Collection</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              ₹{totalCounterCollection.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              ₹{cashCollected.toLocaleString()} Cash + ₹{upiCollected.toLocaleString()} UPI
            </p>
          </div>

          {/* Card 3: Samples In Transit */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-amber-900 text-xs font-bold uppercase tracking-wider">
              <span>Samples Dispatched</span>
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700">
              {batches.reduce((sum, b) => sum + b.sampleCount, 0)} Tubes
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{batches.length} courier batches to Central Hub</p>
          </div>

          {/* Card 4: Uncollected Dues */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase tracking-wider">
              <span>Pending Dues</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-700">
              ₹{pendingDueTotal.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Remaining balance to collect on delivery</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('reconciliation')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            <span>Counter Cash Reconciliation (रोकड़ बही)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('worklist')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'worklist'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Branch Patient Queue ({totalPatients})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logistics')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'logistics'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Cold-Chain Sample Logistics ({batches.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Branch Staff on Duty</span>
          </button>
        </div>

        {/* TAB 1: Counter Cash Reconciliation */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    <span>Daily Cash Drawer Reconciliation & Balance Verification</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verify cash in register, UPI QR merchant collections, and settle today&apos;s branch closing figure.
                  </p>
                </div>
                {isReconciled ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Reconciled & Sealed Today at {reconciledAt}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleReconcileDay}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs sm:text-sm transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    <span>Confirm & Seal Branch Cash for Today</span>
                  </button>
                )}
              </div>

              {/* Detailed Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Cash in Drawer */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                      1. Physical Cash Counter
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                      Drawer
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Morning Opening Float:</span>
                      <span className="font-mono font-bold text-slate-900">₹{openingFloat.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Today&apos;s Cash Patient Fees:</span>
                      <span className="font-mono font-bold text-emerald-600">+₹{cashCollected.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Petty Cash / Minor Expenses:</span>
                      <span className="font-mono font-bold text-rose-600">-₹350</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                      <span>Total Physical Cash in Hand:</span>
                      <span className="font-mono text-emerald-700">₹{(openingFloat + cashCollected - 350).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Digital Collections (UPI & Card) */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                      2. Digital QR / UPI Bank
                    </span>
                    <span className="text-xs bg-teal-100 text-teal-900 px-2 py-0.5 rounded font-bold">
                      Bank Direct
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Dynamic UPI QR (PhonePe / GPay):</span>
                      <span className="font-mono font-bold text-teal-700">₹{upiCollected.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>POS Card Machine Swipes:</span>
                      <span className="font-mono font-bold text-blue-700">₹{cardCollected.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Bank Settlement Status:</span>
                      <span className="text-emerald-700 font-bold">Instant Verified</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                      <span>Total Digital Settle:</span>
                      <span className="font-mono text-teal-700">₹{(upiCollected + cardCollected).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Grand Total Settle */}
                <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                      3. Combined Branch Revenue
                    </span>
                    <span className="text-xs bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-bold">
                      Day Total
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Billed Services:</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{(totalCounterCollection + pendingDueTotal).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Realized Collection:</span>
                      <span className="font-mono font-bold text-emerald-700">₹{totalCounterCollection.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Uncollected Due Balance:</span>
                      <span className="font-mono font-bold text-rose-600">₹{pendingDueTotal.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-emerald-300 flex justify-between font-bold text-base text-emerald-950">
                      <span>Net Cash + UPI:</span>
                      <span className="font-mono font-black text-emerald-700">₹{totalCounterCollection.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Handover Notes & Signature */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Branch Manager End-of-Day Handover Notes & Cash Bag Reference:
                </label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="e.g. Cash Bag #41 sealed with ₹16,200 deposited in night safe / handed over to bank courier..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Branch Patient Queue */}
        {activeTab === 'worklist' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Branch Patient Queue & Token Worklist
                </h2>
                <p className="text-xs text-slate-500">
                  Patients registered at {currentBranch.name} with specimen and payment receipt details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateView('reception_dashboard')}
                className="bg-[#123B6D] hover:bg-[#0c284b] text-white font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>New Patient Token at Counter</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Tests Booked</th>
                    <th className="py-3 px-4">Sample Status</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Doctor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branchEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {entry.tokenNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{entry.patientName}</div>
                        <div className="text-[11px] text-slate-500">
                          {entry.age} Yrs / {entry.gender} • {entry.mobile}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-800 font-medium">
                          {entry.tests.join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">
                          ₹{entry.paidAmount} ({entry.paymentMode})
                        </div>
                        {entry.dueAmount > 0 ? (
                          <span className="text-[10px] text-rose-600 font-bold">
                            Due: ₹{entry.dueAmount}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold">Full Paid</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{entry.referringDoctor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Cold-Chain Sample Logistics */}
        {activeTab === 'logistics' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <span>Sample Dispatch & Cold-Chain Transport to Central Hub</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Maintain 2°C – 8°C specimen temperature compliance and track rider courier transfers to Central Testing Lab.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewDispatchModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs sm:text-sm transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Sample Dispatch Batch</span>
              </button>
            </div>

            {/* Batches Table */}
            <div className="space-y-4">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#123B6D]">
                        {batch.batchNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          batch.status === 'Received at Central Hub'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Rider: <span className="font-bold text-slate-900">{batch.courierName}</span> ({batch.courierPhone}) • Vehicle: {batch.courierVehicle}
                    </div>
                    <div className="text-xs text-slate-500">
                      Specimens: <span className="font-semibold text-slate-800">{batch.specimenTypes.join(', ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    {/* Temperature gauge */}
                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                        <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Temp Log</span>
                      </div>
                      <div className="font-bold text-sm text-blue-700">{batch.temperatureCelsius}°C</div>
                      <div className="text-[9px] text-emerald-600 font-semibold">Compliant (2-8°C)</div>
                    </div>

                    {/* Tube count */}
                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                        <Box className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tube Count</span>
                      </div>
                      <div className="font-bold text-sm text-slate-900">{batch.sampleCount} Tubes</div>
                      <div className="text-[9px] text-slate-500">{batch.dispatchTime}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Branch Staff on Duty */}
        {activeTab === 'staff' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>Branch Staff Roster & Duty Attendance</span>
              </h2>
              <p className="text-xs text-slate-500">
                Active team members handling reception counter, blood collection (phlebotomy), and sample logistics runner.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                    Reception Lead
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-base font-bold text-slate-900">Pooja Verma</div>
                <div className="text-xs text-slate-500">Phone: +91 98765 11223</div>
                <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                  Shift: 7:00 AM – 3:30 PM (Morning Reception & Billing)
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                    Senior Phlebotomist
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-base font-bold text-slate-900">Sunil Sharma (DMLT)</div>
                <div className="text-xs text-slate-500">Phone: +91 98140 77889</div>
                <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                  Shift: 7:00 AM – 4:00 PM (Venipuncture & Home Collection)
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Cold-Chain Sample Runner
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-base font-bold text-slate-900">Harpreet Singh</div>
                <div className="text-xs text-slate-500">Phone: +91 98140 12345</div>
                <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                  Shift: 8:00 AM – 5:00 PM (Transit to Apex Central Hub)
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: New Sample Dispatch Batch */}
      {isNewDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <span>Dispatch Samples to Central Lab</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDispatch} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Runner / Courier Name:</label>
                <input
                  type="text"
                  required
                  value={newRunnerName}
                  onChange={(e) => setNewRunnerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tubes Count:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newSampleCount}
                    onChange={(e) => setNewSampleCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ice-Box Temp (°C):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTemp}
                    onChange={(e) => setNewTemp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Runner Phone Number:</label>
                <input
                  type="tel"
                  required
                  value={newRunnerPhone}
                  onChange={(e) => setNewRunnerPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Specimen Notes:</label>
                <input
                  type="text"
                  value={newSpecimenNotes}
                  onChange={(e) => setNewSpecimenNotes(e.target.value)}
                  placeholder="e.g. EDTA Blood (5), Serum (3)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewDispatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-xs"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DashboardFooter currentRoleTitle="Branch Manager" onNavigateView={onNavigateView} />
    </div>
  );
};
