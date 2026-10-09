import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  Calendar,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  FileText,
  User,
  Building,
  RefreshCw,
  Search,
  MessageSquare,
  Edit2,
  Check,
  Plus,
  TrendingUp,
  CreditCard,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { ReceptionPatientEntry, VendorDoctor } from '../../types';
import { safePrint } from '../../utils/printHelper';

interface DoctorCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors?: VendorDoctor[];
  receptionEntries?: ReceptionPatientEntry[];
  selectedDoctorId?: string;
}

interface DoctorReferralRow {
  doctorId: string;
  name: string;
  clinicOrSpec: string;
  phone: string;
  commissionPct: number;
  patientsCount: number;
  grossBilled: number;
  netBilled: number;
  commissionEarned: number;
  commissionPaid: number;
  commissionPending: number;
  patients: ReceptionPatientEntry[];
}

interface PayoutRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  amount: number;
  mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  notes?: string;
}

export const DoctorCommissionModal: React.FC<DoctorCommissionModalProps> = ({
  isOpen,
  onClose,
  doctors: propDoctors,
  receptionEntries: propReceptionEntries,
  selectedDoctorId,
}) => {
  const { receptionEntries: contextReceptionEntries, vendorDoctors: contextVendorDoctors, vendorLabSettings } = useCms();
  const receptionEntries = propReceptionEntries || contextReceptionEntries;
  const vendorDoctors = propDoctors || contextVendorDoctors;

  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'All' | 'Today' | 'Month'>('All');
  const [selectedDoctorForPatients, setSelectedDoctorForPatients] = useState<DoctorReferralRow | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState<DoctorReferralRow | null>(null);

  // Custom commission percentage overrides per doctor (persisted in localStorage)
  const [customPctMap, setCustomPctMap] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('doctor_commission_pct_map');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Recorded Payouts (persisted in localStorage)
  const [payouts, setPayouts] = useState<PayoutRecord[]>(() => {
    try {
      const stored = localStorage.getItem('doctor_commission_payouts');
      return stored ? JSON.parse(stored) : [
        {
          id: 'pay-1',
          doctorId: 'doc-sk-gupta',
          doctorName: 'Dr. S. K. Gupta (MD Med)',
          date: '01-Sep-2026',
          amount: 500,
          mode: 'UPI',
          referenceNo: 'UPI-9821849281',
          notes: 'Advance referral payout for August',
        }
      ];
    } catch {
      return [];
    }
  });

  // Payout Form state
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutMode, setPayoutMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('UPI');
  const [payoutRef, setPayoutRef] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Editing inline commission %
  const [editingPctDoctorId, setEditingPctDoctorId] = useState<string | null>(null);
  const [tempPctInput, setTempPctInput] = useState<string>('15');

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Compile full list of doctors from vendorDoctors AND any unique referring doctors in reception entries
  const compiledDoctorList = useMemo(() => {
    const list: Array<{ id: string; name: string; clinic: string; phone: string; defaultPct: number }> = [];

    // Base doctors
    vendorDoctors.forEach((vd) => {
      list.push({
        id: vd.id,
        name: vd.name,
        clinic: vd.specialization || 'Consultant Physician',
        phone: '+91 98765 43210',
        defaultPct: vd.referralCommissionPct || 20,
      });
    });

    // Known doctors seen in reception
    const knownExtraDoctors = [
      { name: 'Dr. S. K. Gupta (MD Med)', clinic: 'Gupta Medical Clinic & Diabetes Centre', phone: '+91 98765 11223', defaultPct: 20 },
      { name: 'Dr. Anita Joshi, MD (Obs & Gynae)', clinic: 'Joshi Maternity & Women Care', phone: '+91 98150 22334', defaultPct: 15 },
      { name: 'Dr. Hardeep Bawa, MS (Gen Surgery)', clinic: 'Bawa Surgical Hospital', phone: '+91 98720 33445', defaultPct: 18 },
      { name: 'Dr. M. K. Aggarwal, MD', clinic: 'Aggarwal Health Clinic', phone: '+91 98881 44556', defaultPct: 15 },
      { name: 'Self / Direct Walk-in', clinic: 'Direct Walk-in Patient', phone: '—', defaultPct: 0 },
    ];

    knownExtraDoctors.forEach((ed) => {
      if (!list.some((d) => d.name.toLowerCase().includes(ed.name.toLowerCase().slice(0, 8)))) {
        list.push({
          id: `doc-${ed.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: ed.name,
          clinic: ed.clinic,
          phone: ed.phone,
          defaultPct: ed.defaultPct,
        });
      }
    });

    // Also scan receptionEntries for any new name
    receptionEntries.forEach((entry) => {
      const ref = entry.referringDoctor?.trim();
      if (ref && !list.some((d) => d.name.toLowerCase().includes(ref.toLowerCase().slice(0, 8)))) {
        const isSelf = ref.toLowerCase().includes('self') || ref.toLowerCase().includes('direct');
        list.push({
          id: `doc-${ref.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: ref,
          clinic: isSelf ? 'Walk-in / Direct' : 'Visiting Physician',
          phone: '—',
          defaultPct: isSelf ? 0 : 15,
        });
      }
    });

    return list;
  }, [vendorDoctors, receptionEntries]);

  // Aggregate Data per Doctor
  const doctorRows: DoctorReferralRow[] = useMemo(() => {
    return compiledDoctorList.map((doc) => {
      // Find matching patient entries
      const matchedPatients = receptionEntries.filter((e) => {
        if (!e.referringDoctor) return false;
        const entryRef = e.referringDoctor.toLowerCase();
        const docRef = doc.name.toLowerCase();
        return (
          entryRef.includes(docRef.slice(0, 10)) ||
          docRef.includes(entryRef.slice(0, 10))
        );
      });

      const patientsCount = matchedPatients.length;
      const grossBilled = matchedPatients.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const discounts = matchedPatients.reduce((sum, p) => sum + (p.discountINR || 0), 0);
      const netBilled = Math.max(0, grossBilled - discounts);

      // Current commission %
      const pct = customPctMap[doc.id] !== undefined ? customPctMap[doc.id] : doc.defaultPct;
      const commissionEarned = Math.round((netBilled * pct) / 100);

      // Payouts for this doctor
      const paid = payouts
        .filter((p) => p.doctorId === doc.id || p.doctorName.toLowerCase().includes(doc.name.toLowerCase().slice(0, 8)))
        .reduce((sum, p) => sum + p.amount, 0);

      const pending = Math.max(0, commissionEarned - paid);

      return {
        doctorId: doc.id,
        name: doc.name,
        clinicOrSpec: doc.clinic,
        phone: doc.phone,
        commissionPct: pct,
        patientsCount,
        grossBilled,
        netBilled,
        commissionEarned,
        commissionPaid: paid,
        commissionPending: pending,
        patients: matchedPatients,
      };
    });
  }, [compiledDoctorList, receptionEntries, customPctMap, payouts]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return doctorRows.filter((r) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.clinicOrSpec.toLowerCase().includes(q)
      );
    });
  }, [doctorRows, searchTerm]);

  // Overall totals
  const totalReferredPatients = doctorRows.reduce((acc, r) => acc + r.patientsCount, 0);
  const totalNetReferralBilling = doctorRows.reduce((acc, r) => acc + r.netBilled, 0);
  const totalCommissionEarned = doctorRows.reduce((acc, r) => acc + r.commissionEarned, 0);
  const totalCommissionPaid = doctorRows.reduce((acc, r) => acc + r.commissionPaid, 0);
  const totalCommissionPending = Math.max(0, totalCommissionEarned - totalCommissionPaid);

  // Save inline percentage change
  const handleSavePct = (doctorId: string) => {
    const val = parseFloat(tempPctInput);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      const updated = { ...customPctMap, [doctorId]: val };
      setCustomPctMap(updated);
      try {
        localStorage.setItem('doctor_commission_pct_map', JSON.stringify(updated));
      } catch {}
      showNotification(`Commission rate updated to ${val}%!`);
    }
    setEditingPctDoctorId(null);
  };

  // Submit Payout
  const handleRecordPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayoutModal) return;

    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payout amount.');
      return;
    }

    const newPayout: PayoutRecord = {
      id: `PAY-${Date.now()}`,
      doctorId: showPayoutModal.doctorId,
      doctorName: showPayoutModal.name,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: amt,
      mode: payoutMode,
      referenceNo: payoutRef.trim() || undefined,
      notes: payoutNotes.trim() || undefined,
    };

    const updated = [newPayout, ...payouts];
    setPayouts(updated);
    try {
      localStorage.setItem('doctor_commission_payouts', JSON.stringify(updated));
    } catch {}

    showNotification(`Recorded payout of ₹${amt} to ${showPayoutModal.name}!`);
    setShowPayoutModal(null);
    setPayoutAmount('');
    setPayoutRef('');
    setPayoutNotes('');
  };

  // WhatsApp Statement share
  const handleWhatsAppStatement = (row: DoctorReferralRow) => {
    const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Pathology Laboratory';
    const message = encodeURIComponent(
      `*${labName}* - Doctor Referral Summary\n` +
      `------------------------------------------\n` +
      `Respectful Doctor: *${row.name}*\n` +
      `Total Cases Referred: *${row.patientsCount} patients*\n` +
      `Total Net Business Generated: *₹${row.netBilled.toLocaleString('en-IN')}*\n` +
      `Agreed Commission Rate: *${row.commissionPct}%*\n` +
      `Total Commission Earned: *₹${row.commissionEarned.toLocaleString('en-IN')}*\n` +
      `Commission Disbursed: *₹${row.commissionPaid.toLocaleString('en-IN')}*\n` +
      `*Balance Payable:* *₹${row.commissionPending.toLocaleString('en-IN')}*\n\n` +
      `Detailed patient investigation reports are archived safely under your medical reference.\n` +
      `Thank you for your valued medical partnership!`
    );

    const cleanPhone = row.phone.replace(/\D/g, '');
    const url = cleanPhone && cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header Strip */}
        <div className="bg-[#123B6D] text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-xl border border-white/20">
              👨‍⚕️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">
                  Doctor Commission / Referral Business Summary
                </h2>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Referral Ledger
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                {vendorLabSettings?.labName || 'Apex Diagnostic & Pathology Laboratory'} • Doctor Payout & Business Audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-[#172033] space-y-6">
          {successToast && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Top 4 Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Referred Business */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Referral Business</div>
              <div className="text-2xl font-black text-[#123B6D] mt-1">
                ₹{totalNetReferralBilling.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                From {totalReferredPatients} patient visits
              </div>
            </div>

            {/* Total Commission Accrued */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Accrued Commission</div>
              <div className="text-2xl font-black text-amber-800 mt-1">
                ₹{totalCommissionEarned.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Based on agreed doc %
              </div>
            </div>

            {/* Commission Paid Out */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-emerald-700">Commission Paid</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                ₹{totalCommissionPaid.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {payouts.length} recorded payouts
              </div>
            </div>

            {/* Outstanding Pending Payout */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-rose-700">Pending Payable</div>
              <div className="text-2xl font-black text-rose-700 mt-1">
                ₹{totalCommissionPending.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                To be disbursed
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search doctor or clinic..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Showing <strong>{filteredRows.length}</strong> referring doctors</span>
            </div>
          </div>

          {/* Doctors Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Doctor & Clinic</th>
                    <th className="py-3 px-3 text-center">Cases</th>
                    <th className="py-3 px-3 text-right">Net Billed</th>
                    <th className="py-3 px-3 text-center">Commission %</th>
                    <th className="py-3 px-3 text-right">Commission Earned</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Pending Balance</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No referring doctors found matching "{searchTerm}"
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={row.doctorId} className="hover:bg-slate-50/80 transition">
                        {/* Doctor & Clinic */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 text-sm">{row.name}</div>
                          <div className="text-[11px] text-slate-500">{row.clinicOrSpec}</div>
                          {row.phone !== '—' && (
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{row.phone}</div>
                          )}
                        </td>

                        {/* Cases */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedDoctorForPatients(row)}
                            className="inline-flex items-center gap-1 font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded-full cursor-pointer transition"
                            title="Click to view all patients referred"
                          >
                            <span>{row.patientsCount}</span>
                            <span className="text-[10px]">pts</span>
                          </button>
                        </td>

                        {/* Net Billed */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{row.netBilled.toLocaleString('en-IN')}
                        </td>

                        {/* Commission % */}
                        <td className="py-3 px-3 text-center">
                          {editingPctDoctorId === row.doctorId ? (
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={tempPctInput}
                                onChange={(e) => setTempPctInput(e.target.value)}
                                className="w-12 px-1 py-0.5 text-center font-bold border border-teal-500 rounded bg-white text-xs"
                                autoFocus
                              />
                              <span className="text-[10px]">%</span>
                              <button
                                onClick={() => handleSavePct(row.doctorId)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPctDoctorId(row.doctorId);
                                setTempPctInput(String(row.commissionPct));
                              }}
                              className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-xs transition cursor-pointer"
                              title="Click to change commission %"
                            >
                              <span>{row.commissionPct}%</span>
                              <Edit2 className="w-2.5 h-2.5 text-slate-400" />
                            </button>
                          )}
                        </td>

                        {/* Commission Earned */}
                        <td className="py-3 px-3 text-right font-mono font-black text-amber-800">
                          ₹{row.commissionEarned.toLocaleString('en-IN')}
                        </td>

                        {/* Paid */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          ₹{row.commissionPaid.toLocaleString('en-IN')}
                        </td>

                        {/* Pending Balance */}
                        <td className="py-3 px-3 text-right font-mono font-black">
                          <span
                            className={
                              row.commissionPending > 0 ? 'text-rose-600' : 'text-slate-400 font-normal'
                            }
                          >
                            ₹{row.commissionPending.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Record Payout Button */}
                            {row.commissionPending > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPayoutModal(row);
                                  setPayoutAmount(String(row.commissionPending));
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                                title="Record commission payout"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Pay</span>
                              </button>
                            )}

                            {/* WhatsApp Button */}
                            <button
                              type="button"
                              onClick={() => handleWhatsAppStatement(row)}
                              className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-1 rounded-md transition cursor-pointer"
                              title="Send statement to Doctor on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* View Breakdown */}
                            <button
                              type="button"
                              onClick={() => setSelectedDoctorForPatients(row)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 rounded-md transition cursor-pointer"
                              title="View referred patients"
                            >
                              <FileText className="w-3.5 h-3.5" />
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
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Encrypted Referral Ledger • Automated Payout Balancing</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg cursor-pointer transition text-xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* Patient Breakdown Sub-Modal */}
      {selectedDoctorForPatients && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-amber-400">
                  Patient Referrals: {selectedDoctorForPatients.name}
                </h3>
                <p className="text-[11px] text-slate-300">
                  {selectedDoctorForPatients.patientsCount} patient(s) • Commission Rate: {selectedDoctorForPatients.commissionPct}%
                </p>
              </div>
              <button
                onClick={() => setSelectedDoctorForPatients(null)}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              {selectedDoctorForPatients.patients.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No patient records found under this doctor yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {selectedDoctorForPatients.patients.map((pt, idx) => {
                    const patientNet = Math.max(0, pt.totalAmount - (pt.discountINR || 0));
                    const docComm = Math.round((patientNet * selectedDoctorForPatients.commissionPct) / 100);
                    return (
                      <div key={idx} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {pt.patientName} <span className="text-slate-400 font-normal">({pt.age}Y/{pt.gender})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Token: <span className="font-mono font-bold text-teal-700">{pt.tokenNumber}</span> • UHID: {pt.uhid}
                          </div>
                          <div className="text-[10px] text-slate-600 mt-0.5">
                            Tests: {pt.tests.join(', ')}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[11px] text-slate-500">
                            Net Billed: <strong className="text-slate-900 font-mono">₹{patientNet}</strong>
                          </div>
                          <div className="text-xs font-black text-amber-800 font-mono mt-0.5">
                            Commission ({selectedDoctorForPatients.commissionPct}%): ₹{docComm}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDoctorForPatients(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Close List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payout Sub-Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayoutSubmit}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Record Referral Payout</h3>
                <p className="text-[11px] text-emerald-100">
                  {showPayoutModal.name} • Balance: ₹{showPayoutModal.commissionPending}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutModal(null)}
                className="p-1 text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Payout Amount (INR):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    required
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900"
                    placeholder="e.g. 1500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Payment Mode:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['UPI', 'Cash', 'Bank Transfer', 'Cheque'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayoutMode(mode)}
                      className={`py-1.5 px-3 rounded-lg border font-bold text-xs transition cursor-pointer ${
                        payoutMode === mode
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-400'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Reference / Transaction No (Optional):
                </label>
                <input
                  type="text"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="e.g. UPI-98421890 or Cheque #04821"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Notes / Receipt Remark:
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Paid in full for September cases"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPayoutModal(null)}
                className="px-3 py-1.5 text-slate-600 font-bold hover:text-slate-900 cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition cursor-pointer shadow-sm"
              >
                Confirm & Record Payout
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
