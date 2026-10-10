import React, { useState, useRef, useMemo } from 'react';
import {
  CreditCard,
  QrCode,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Printer,
  Smartphone,
  Sparkles,
  Search,
  Receipt,
  FileText,
  X,
  Plus,
  IndianRupee,
  Calendar,
  Eye,
  Copy,
  Check,
  Building2,
  User,
  Phone,
  Clock,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  BadgePercent,
  Calculator,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { ReceptionPatientEntry, TestItem } from '../../types';
import { CollectRemainingPaymentModal } from '../CollectRemainingPaymentModal';
import { DayEndCashClosingModal } from '../reception/DayEndCashClosingModal';
import { DoctorCommissionModal } from './DoctorCommissionModal';
import { optimizeImageFile } from '../../utils/imageOptimizer';

// Built-in clean vector QR code data URIs for instant preview/testing
const PRESET_QR_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23123B6D"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="24" height="24" fill="%23123B6D"/><rect x="14" y="14" width="16" height="16" fill="white"/><rect x="18" y="18" width="8" height="8" fill="%23123B6D"/><rect x="66" y="10" width="24" height="24" fill="%23123B6D"/><rect x="70" y="14" width="16" height="16" fill="white"/><rect x="74" y="18" width="8" height="8" fill="%23123B6D"/><rect x="10" y="66" width="24" height="24" fill="%23123B6D"/><rect x="14" y="70" width="16" height="16" fill="white"/><rect x="18" y="74" width="8" height="8" fill="%23123B6D"/><rect x="40" y="12" width="8" height="12"/><rect x="52" y="18" width="8" height="6"/><rect x="40" y="38" width="18" height="6"/><rect x="66" y="42" width="8" height="8"/><rect x="78" y="48" width="12" height="6"/><rect x="40" y="52" width="8" height="18"/><rect x="52" y="64" width="8" height="8"/><rect x="66" y="66" width="8" height="12"/><rect x="76" y="66" width="14" height="6"/><rect x="72" y="78" width="18" height="12"/><rect x="44" y="78" width="14" height="8"/><circle cx="50" cy="50" r="5" fill="%23F59E0B"/></svg>`;

const PRESET_QR_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%230F766E"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="24" height="24" fill="%230F766E"/><rect x="14" y="14" width="16" height="16" fill="white"/><rect x="18" y="18" width="8" height="8" fill="%230F766E"/><rect x="66" y="10" width="24" height="24" fill="%230F766E"/><rect x="70" y="14" width="16" height="16" fill="white"/><rect x="74" y="18" width="8" height="8" fill="%230F766E"/><rect x="10" y="66" width="24" height="24" fill="%230F766E"/><rect x="14" y="70" width="16" height="16" fill="white"/><rect x="18" y="74" width="8" height="8" fill="%230F766E"/><rect x="38" y="16" width="10" height="8"/><rect x="52" y="12" width="6" height="16"/><rect x="38" y="32" width="20" height="6"/><rect x="64" y="38" width="12" height="6"/><rect x="80" y="44" width="8" height="8"/><rect x="38" y="48" width="12" height="12"/><rect x="54" y="54" width="8" height="16"/><rect x="68" y="60" width="6" height="15"/><rect x="80" y="60" width="8" height="12"/><rect x="68" y="80" width="22" height="8"/><rect x="40" y="74" width="16" height="12"/><circle cx="50" cy="50" r="5" fill="%230F766E"/></svg>`;

export const VendorBillingTab: React.FC = () => {
  const {
    vendorLabSettings,
    updateVendorLabSettings,
    receptionEntries,
    addReceptionEntry,
    updateReceptionEntry,
    deleteReceptionEntry,
    vendorTests,
    vendorDoctors,
  } = useCms();

  // QR Code 1 state
  const [qr1Url, setQr1Url] = useState<string>(vendorLabSettings.qrCode1Url || PRESET_QR_1);
  const [qr1Label, setQr1Label] = useState<string>(
    vendorLabSettings.qrCode1Label || 'Counter Billing QR (Google Pay / PhonePe / Paytm / BHIM)'
  );
  const [upiId1, setUpiId1] = useState<string>(vendorLabSettings.upiId1 || 'apexlab@icici');

  // QR Code 2 state
  const [qr2Url, setQr2Url] = useState<string>(vendorLabSettings.qrCode2Url || PRESET_QR_2);
  const [qr2Label, setQr2Label] = useState<string>(
    vendorLabSettings.qrCode2Label || 'Home Sample Collection QR (Phlebotomist Handheld)'
  );
  const [upiId2, setUpiId2] = useState<string>(vendorLabSettings.upiId2 || 'apexdiag@oksbi');

  const [merchantName, setMerchantName] = useState<string>(
    vendorLabSettings.merchantName || vendorLabSettings.labName || 'Apex Diagnostic & Pathology Lab'
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<string | null>(null);

  // Modals
  const [showStandeeModal, setShowStandeeModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [viewInvoiceEntry, setViewInvoiceEntry] = useState<ReceptionPatientEntry | null>(null);
  const [collectPaymentEntry, setCollectPaymentEntry] = useState<ReceptionPatientEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);
  const [isDoctorCommissionOpen, setIsDoctorCommissionOpen] = useState(false);

  // Hidden file inputs
  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);

  // Patient Invoices Search & Filter
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Partial' | 'Due'>('All');
  const [timeFilter, setTimeFilter] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');

  // New Bill Form State
  const [newBillForm, setNewBillForm] = useState({
    patientName: '',
    age: '32',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    mobile: '',
    referringDoctor: 'Self / Direct Walk-in',
    selectedTests: [] as string[],
    discountINR: 0,
    paidAmount: 0,
    paymentMode: 'Cash' as 'Cash' | 'UPI' | 'Card',
    notes: '',
  });

  const [testSearchInput, setTestSearchInput] = useState('');

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setToastMessage('');
    }, 3000);
  };

  // Copy UPI helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(text);
    setTimeout(() => setCopiedUpi(null), 2000);
  };

  // Vendor Manual UPI Payment Verification Helper
  const handleVerifyManualUpi = (entry: ReceptionPatientEntry) => {
    updateReceptionEntry(entry.id, {
      paymentVerificationStatus: 'Verified',
      paymentStatus: 'Full Payment',
      paidAmount: entry.totalAmount,
      dueAmount: 0,
      notes: `${entry.notes ? entry.notes + ' • ' : ''}Payment verified manually by Vendor on ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
    });
    showNotification(`✅ Manual UPI Payment Verified & Approved for ${entry.patientName} (UTR: ${entry.upiTransactionRef || 'Verified'})!`);
  };

  // Handle File Upload 1
  const handleFileUpload1 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
      if (optimized) {
        setQr1Url(optimized);
        updateVendorLabSettings({ qrCode1Url: optimized });
        showNotification('Counter QR Code updated and saved successfully!');
      }
    } catch (err) {
      console.error('Error optimizing QR Code 1:', err);
    }
    if (e.target) e.target.value = '';
  };

  // Handle File Upload 2
  const handleFileUpload2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
      if (optimized) {
        setQr2Url(optimized);
        updateVendorLabSettings({ qrCode2Url: optimized });
        showNotification('Home Collection QR Code updated and saved successfully!');
      }
    } catch (err) {
      console.error('Error optimizing QR Code 2:', err);
    }
    if (e.target) e.target.value = '';
  };

  // Save QR Code Configurations
  const handleSaveQrConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      qrCode1Url: qr1Url,
      qrCode1Label: qr1Label,
      upiId1: upiId1,
      qrCode2Url: qr2Url,
      qrCode2Label: qr2Label,
      upiId2: upiId2,
      merchantName: merchantName,
    });
    showNotification('Payment QR Codes & Merchant details saved successfully!');
  };

  // Calculate bill total for new bill
  const calculatedBillGross = useMemo(() => {
    return newBillForm.selectedTests.reduce((sum, testName) => {
      const found = vendorTests.find((t) => t.name === testName);
      return sum + (found?.priceINR || 500);
    }, 0);
  }, [newBillForm.selectedTests, vendorTests]);

  const calculatedBillNet = Math.max(0, calculatedBillGross - (newBillForm.discountINR || 0));

  // Quick toggle test in new bill form
  const toggleTestSelection = (testName: string) => {
    setNewBillForm((prev) => {
      const exists = prev.selectedTests.includes(testName);
      const updatedTests = exists
        ? prev.selectedTests.filter((t) => t !== testName)
        : [...prev.selectedTests, testName];

      const gross = updatedTests.reduce((s, name) => {
        const found = vendorTests.find((t) => t.name === name);
        return s + (found?.priceINR || 500);
      }, 0);
      const net = Math.max(0, gross - (prev.discountINR || 0));

      return {
        ...prev,
        selectedTests: updatedTests,
        paidAmount: net, // Default to full payment
      };
    });
  };

  // Create Bill Submission
  const handleCreateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillForm.patientName.trim()) {
      alert('Please enter patient name.');
      return;
    }
    if (newBillForm.selectedTests.length === 0) {
      alert('Please select at least one test to generate an invoice.');
      return;
    }

    const gross = calculatedBillGross;
    const discount = Number(newBillForm.discountINR) || 0;
    const net = Math.max(0, gross - discount);
    const paid = Number(newBillForm.paidAmount) || 0;
    const due = Math.max(0, net - paid);

    let paymentStatus: ReceptionPatientEntry['paymentStatus'] = 'Full Payment';
    if (due <= 0) {
      paymentStatus = 'Full Payment';
    } else if (paid > 0) {
      paymentStatus = 'Partial';
    } else {
      paymentStatus = 'Due Payment';
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const uhid = `LAB-2026-${randomNum}`;
    const tokenNo = `TK-${Math.floor(100 + Math.random() * 900)}`;

    const newEntry = addReceptionEntry({
      uhid,
      tokenNumber: tokenNo,
      tokenNo: tokenNo,
      patientName: newBillForm.patientName.trim(),
      age: newBillForm.age || '30',
      gender: newBillForm.gender,
      mobile: newBillForm.mobile.trim() || '9876543210',
      referringDoctor: newBillForm.referringDoctor || 'Self / Direct Walk-in',
      tests: newBillForm.selectedTests,
      sampleType: 'Blood / Serum',
      totalAmount: gross,
      discountINR: discount,
      paidAmount: paid,
      dueAmount: due,
      paymentMode: newBillForm.paymentMode,
      paymentStatus,
      status: 'Waiting',
      registeredAt: 'Just Now',
      notes: newBillForm.notes.trim() || undefined,
    });

    setShowAddBillModal(false);
    // Reset form
    setNewBillForm({
      patientName: '',
      age: '32',
      gender: 'Male',
      mobile: '',
      referringDoctor: 'Self / Direct Walk-in',
      selectedTests: [],
      discountINR: 0,
      paidAmount: 0,
      paymentMode: 'Cash',
      notes: '',
    });

    showNotification(`Invoice #${tokenNo} created! Net bill ₹${net} (Paid ₹${paid})`);
    // Open receipt modal automatically
    setViewInvoiceEntry(newEntry);
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return receptionEntries.filter((entry) => {
      const safeTests = entry.tests || (entry as any).testNames || [];
      const testNamesStr = Array.isArray(safeTests) ? safeTests.join(' ') : '';
      const query = invoiceSearch.toLowerCase().trim();

      const matchesSearch =
        !query ||
        (entry.patientName || '').toLowerCase().includes(query) ||
        (entry.uhid || '').toLowerCase().includes(query) ||
        (entry.mobile || '').includes(query) ||
        (entry.tokenNo || entry.tokenNumber || '').toLowerCase().includes(query) ||
        testNamesStr.toLowerCase().includes(query);

      const due = Number(entry.dueAmount) || 0;
      const paid = Number(entry.paidAmount) || 0;

      let matchesFilter = true;
      if (paymentFilter === 'Paid') {
        matchesFilter = entry.paymentStatus === 'Paid' || entry.paymentStatus === 'Full Payment' || due <= 0;
      } else if (paymentFilter === 'Partial') {
        matchesFilter =
          entry.paymentStatus === 'Partial' ||
          entry.paymentStatus === 'Advance' ||
          (due > 0 && paid > 0);
      } else if (paymentFilter === 'Due') {
        matchesFilter =
          entry.paymentStatus === 'Due' ||
          entry.paymentStatus === 'Due Payment' ||
          entry.paymentStatus === 'Pending' ||
          (due > 0 && paid === 0);
      }

      return matchesSearch && matchesFilter;
    });
  }, [receptionEntries, invoiceSearch, paymentFilter]);

  // Financial Earnings Calculations
  const totalBilled = receptionEntries.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);
  const totalCollected = receptionEntries.reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);
  const totalDue = receptionEntries.reduce((sum, e) => sum + (Number(e.dueAmount) || 0), 0);
  const totalBillsCount = receptionEntries.length;

  const cashCollected = receptionEntries
    .filter((e) => e.paymentMode === 'Cash')
    .reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);

  const upiCollected = receptionEntries
    .filter((e) => e.paymentMode === 'UPI')
    .reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);

  const cardCollected = receptionEntries
    .filter((e) => e.paymentMode === 'Card')
    .reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <IndianRupee className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#123B6D]">
                Billing & Earnings (राजस्व एवं बिलिंग)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time lab earnings, daily collections, outstanding patient balances, instant invoices, and UPI QR codes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Day-End Cash Closing */}
          <button
            type="button"
            id="billing-btn-cash-closing"
            onClick={() => setIsCashClosingOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Day-End Reception Cash Closing (Daily Tally Sheet)"
          >
            <Calculator className="w-4 h-4 text-amber-300" />
            <span>Daily Cash Closing</span>
          </button>

          {/* Doctor Commission & Referral Summary */}
          <button
            type="button"
            id="billing-btn-doctor-commission"
            onClick={() => setIsDoctorCommissionOpen(true)}
            className="bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Doctor Commission / Referral Business Summary"
          >
            <BadgePercent className="w-4 h-4 text-teal-200" />
            <span>Doctor Commissions</span>
          </button>

          <button
            onClick={() => setShowAddBillModal(true)}
            className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Create New Bill / Invoice</span>
          </button>

          <button
            onClick={() => setShowStandeeModal(true)}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Tabletop QR Standee</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage || 'Action completed successfully!'}</span>
          </div>
          <button
            onClick={() => setSaveSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Financial Earning Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Realized Earnings */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 rounded-2xl text-white shadow-md flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                Total Realized Earning
              </span>
              <span className="p-1 rounded-md bg-white/20 text-white">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-100 mt-1">
              Collected in Lab Cash & Bank Accounts
            </div>
          </div>
          <div className="text-[10px] font-bold text-emerald-200 pt-3 border-t border-white/20 mt-3 flex items-center justify-between">
            <span>Across {totalBillsCount} Invoices</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded">100% Realized</span>
          </div>
        </div>

        {/* Card 2: UPI / Online Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">UPI / QR Collections</span>
            <span className="p-1 rounded-md bg-blue-50 text-[#123B6D]">
              <Smartphone className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#123B6D] mt-2">
            ₹{upiCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">GPay, PhonePe, Paytm, BHIM</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Direct Bank Transfer</span>
          </div>
        </div>

        {/* Card 3: Cash Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Cash Collections</span>
            <span className="p-1 rounded-md bg-amber-50 text-amber-700">
              <Wallet className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-2">
            ₹{cashCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cash in hand at billing desk</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-2">Counter receipts</div>
        </div>

        {/* Card 4: Total Billed Gross */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Billed Gross</span>
            <span className="p-1 rounded-md bg-slate-100 text-slate-600">
              <FileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-2">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sum of all prescribed tests</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-2">
            Total Bills: {totalBillsCount}
          </div>
        </div>

        {/* Card 5: Pending Dues */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Pending Balances</span>
            <span className="p-1 rounded-md bg-rose-100 text-rose-700">
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-2">
            ₹{totalDue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-rose-500 mt-1">Due to collect before report</div>
          <div className="text-[10px] text-amber-700 font-bold mt-2">
            {receptionEntries.filter((e) => (Number(e.dueAmount) || 0) > 0).length} Patients with Dues
          </div>
        </div>
      </div>

      {/* 1. PATIENT INVOICES & BILLING LEDGER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#123B6D]" />
              <h3 className="text-sm font-black text-slate-800">
                Patient Invoices & Billing Ledger ({filteredInvoices.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live records of patient test charges, payments received, pending balances, and instant receipt generation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Chips */}
            {(['All', 'Paid', 'Partial', 'Due'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setPaymentFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  paymentFilter === status
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status}
              </button>
            ))}

            <button
              onClick={() => setShowAddBillModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bill</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              placeholder="Search by Patient Name, UHID, Token, Mobile, or Test..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
            />
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Token & UHID</th>
                <th className="px-4 py-3">Patient Details</th>
                <th className="px-4 py-3">Tests Prescribed</th>
                <th className="px-4 py-3">Total Bill</th>
                <th className="px-4 py-3">Paid Amount</th>
                <th className="px-4 py-3">Balance Due</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-xs">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700">No billing records found</p>
                      <p className="text-[11px] text-slate-400">
                        {invoiceSearch ? 'Try a different search keyword.' : 'Click "+ Create New Bill" to register your first billing entry.'}
                      </p>
                      <button
                        onClick={() => setShowAddBillModal(true)}
                        className="bg-[#123B6D] text-white px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Bill</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const testsList = inv.tests || (inv as any).testNames || [];
                  const due = Number(inv.dueAmount) || 0;
                  const paid = Number(inv.paidAmount) || 0;
                  const isFullyPaid = due === 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      {/* Token & UHID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-black text-[#123B6D]">
                          {inv.tokenNo || inv.tokenNumber || inv.id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.uhid}</div>
                      </td>

                      {/* Patient Details */}
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900">{inv.patientName}</div>
                        <div className="text-[11px] text-slate-500">
                          {inv.age} Y / {inv.gender} • {inv.mobile}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          Ref: {inv.referringDoctor || 'Self'}
                        </div>
                      </td>

                      {/* Tests Prescribed */}
                      <td className="px-4 py-3.5 text-slate-700 max-w-xs">
                        <div className="line-clamp-2" title={testsList.join(', ')}>
                          {testsList.length > 0 ? testsList.join(', ') : 'General Investigation'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {testsList.length} test{testsList.length !== 1 ? 's' : ''}
                        </div>
                      </td>

                      {/* Total Bill */}
                      <td className="px-4 py-3.5 font-black text-slate-900 whitespace-nowrap">
                        ₹{inv.totalAmount}
                        {inv.discountINR ? (
                          <div className="text-[10px] text-emerald-600 font-normal">
                            -₹{inv.discountINR} off
                          </div>
                        ) : null}
                      </td>

                      {/* Paid Amount */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-black text-emerald-700">₹{paid}</span>
                        <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                          {inv.paymentMode || 'Cash'}
                        </span>
                      </td>

                      {/* Balance Due */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {due > 0 ? (
                          <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            ₹{due}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>₹0</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          {/* Payment Verification Status Badge */}
                          {inv.autoVerified || inv.paymentGateway === 'PhonePe' ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
                              ⚡ Auto-Verified (PhonePe)
                            </span>
                          ) : inv.paymentVerificationStatus === 'Pending Verification' || (inv.upiTransactionRef && inv.paymentVerificationStatus !== 'Verified') ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                ⚠️ Pending Manual UPI Verify
                              </span>
                              {inv.upiTransactionRef && (
                                <div className="text-[9px] font-mono text-slate-500 font-bold">
                                  UTR: {inv.upiTransactionRef}
                                </div>
                              )}
                            </div>
                          ) : inv.paymentVerificationStatus === 'Verified' ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                              ✓ Verified
                            </span>
                          ) : inv.paymentVerificationStatus === 'Pay on Spot / Unpaid' ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                              Pay on Spot
                            </span>
                          ) : null}

                          {/* Payment Completion Status */}
                          <div>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isFullyPaid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : paid > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isFullyPaid ? 'Full Paid' : paid > 0 ? 'Partial' : 'Due / Unpaid'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Manual UPI Verify Action Button (If pending manual verification) */}
                          {(inv.paymentVerificationStatus === 'Pending Verification' || (inv.upiTransactionRef && inv.paymentVerificationStatus !== 'Verified')) && (
                            <button
                              onClick={() => handleVerifyManualUpi(inv)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Verify customer's manual UPI payment & approve booking"
                            >
                              <Check className="w-3 h-3 text-amber-300" />
                              <span>Verify UPI</span>
                            </button>
                          )}

                          {/* View Screenshot if attached */}
                          {inv.paymentScreenshot && (
                            <button
                              onClick={() => window.open(inv.paymentScreenshot, '_blank')}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition cursor-pointer"
                              title="View UPI Payment Screenshot Proof"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print Invoice */}
                          <button
                            onClick={() => setViewInvoiceEntry(inv)}
                            className="p-1.5 rounded-lg text-[#123B6D] hover:bg-blue-50 cursor-pointer transition"
                            title="View & Print Invoice Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Collect Remaining Payment */}
                          {due > 0 ? (
                            <button
                              onClick={() => setCollectPaymentEntry(inv)}
                              className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Collect balance payment"
                            >
                              <IndianRupee className="w-3 h-3" />
                              <span>Collect (₹{due})</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold px-2 py-1">
                              Settled
                            </span>
                          )}

                          {/* Delete Bill */}
                          <button
                            onClick={() => setDeleteConfirmId(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                            title="Delete billing entry"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* 2. PAYMENT QR CODES CONFIGURATION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#123B6D]" />
              <h3 className="text-sm font-black text-slate-800">
                Payment QR Codes & Digital Collection Settings
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload your lab's official UPI QR code screenshots (Google Pay, PhonePe, Paytm, BHIM) for billing counter & home visits.
            </p>
          </div>

          <button
            onClick={handleSaveQrConfig}
            className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Save Payment QRs</span>
          </button>
        </div>

        <form onSubmit={handleSaveQrConfig} className="p-5 sm:p-6 space-y-6">
          {/* Merchant Name */}
          <div className="max-w-md text-xs">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Registered Merchant / Laboratory Business Name
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
              placeholder="e.g. Apex Diagnostic & Pathology Lab"
            />
          </div>

          {/* 2 QR Codes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR CODE 1 */}
            <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#123B6D] text-white flex items-center justify-center font-black text-xs">
                    1
                  </span>
                  <span className="text-xs font-black text-[#123B6D]">Payment QR 1 (Primary - Billing Counter)</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Front Desk
                </span>
              </div>

              {/* QR Image Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="w-28 h-28 shrink-0 bg-white border border-slate-300 rounded-xl p-1.5 shadow-2xs flex items-center justify-center">
                  <img
                    src={qr1Url}
                    alt="Payment QR 1"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>

                <div className="space-y-2 text-xs flex-1 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef1.current?.click()}
                      className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload QR Image</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef1}
                      onChange={handleFileUpload1}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => setQr1Url(PRESET_QR_1)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Use Sample QR
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Upload any JPG, PNG, or SVG screenshot of your UPI QR code.
                  </p>
                </div>
              </div>

              {/* QR 1 Settings */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    QR 1 Label / Purpose
                  </label>
                  <input
                    type="text"
                    value={qr1Label}
                    onChange={(e) => setQr1Label(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                    placeholder="e.g. Counter Billing QR (Google Pay / PhonePe / Paytm)"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    UPI ID 1 (VPA)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={upiId1}
                      onChange={(e) => setUpiId1(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D] font-mono text-xs"
                      placeholder="e.g. apexlab@icici"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(upiId1)}
                      className="p-2 border border-slate-300 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer shrink-0"
                      title="Copy UPI ID"
                    >
                      {copiedUpi === upiId1 ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* QR CODE 2 */}
            <div className="p-5 rounded-2xl border border-teal-200 bg-teal-50/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-black text-xs">
                    2
                  </span>
                  <span className="text-xs font-black text-[#0F766E]">Payment QR 2 (Secondary - Home Visits)</span>
                </div>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  Phlebotomist Handheld
                </span>
              </div>

              {/* QR Image Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="w-28 h-28 shrink-0 bg-white border border-slate-300 rounded-xl p-1.5 shadow-2xs flex items-center justify-center">
                  <img
                    src={qr2Url}
                    alt="Payment QR 2"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>

                <div className="space-y-2 text-xs flex-1 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef2.current?.click()}
                      className="bg-[#0F766E] hover:bg-[#0d655e] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload QR Image</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef2}
                      onChange={handleFileUpload2}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => setQr2Url(PRESET_QR_2)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Use Sample QR
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Phlebotomist mobile QR for door-to-door collection payments.
                  </p>
                </div>
              </div>

              {/* QR 2 Settings */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    QR 2 Label / Purpose
                  </label>
                  <input
                    type="text"
                    value={qr2Label}
                    onChange={(e) => setQr2Label(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    placeholder="e.g. Home Sample Collection QR (Phlebotomist)"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    UPI ID 2 (VPA)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={upiId2}
                      onChange={(e) => setUpiId2(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F766E] font-mono text-xs"
                      placeholder="e.g. apexdiag@oksbi"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(upiId2)}
                      className="p-2 border border-slate-300 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer shrink-0"
                      title="Copy UPI ID"
                    >
                      {copiedUpi === upiId2 ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Save QR Codes</span>
            </button>
          </div>
        </form>
      </div>

      {/* CREATE NEW BILL / INVOICE MODAL */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-[#123B6D] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/20 text-white">
                  <Receipt className="w-5 h-5 text-amber-400" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Generate Patient Bill & Invoice (नया बिल बनाएं)
                  </h2>
                  <p className="text-xs text-blue-100">
                    Creates instant token, ledger entry, and printable thermal/A4 invoice receipt.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddBillModal(false)}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateBillSubmit} className="p-5 sm:p-6 space-y-5 text-xs">
              {/* Patient Demographics */}
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase text-[#123B6D] tracking-wider block">
                  1. Patient Demographics (मरीज़ का विवरण)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Patient Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newBillForm.patientName}
                      onChange={(e) => setNewBillForm({ ...newBillForm, patientName: e.target.value })}
                      placeholder="e.g. Ramesh Kumar Verma"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={newBillForm.mobile}
                      onChange={(e) => setNewBillForm({ ...newBillForm, mobile: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Age</label>
                      <input
                        type="text"
                        value={newBillForm.age}
                        onChange={(e) => setNewBillForm({ ...newBillForm, age: e.target.value })}
                        placeholder="35"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={newBillForm.gender}
                        onChange={(e) =>
                          setNewBillForm({ ...newBillForm, gender: e.target.value as any })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D] bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Referring Doctor
                    </label>
                    <input
                      type="text"
                      list="doctorsList"
                      value={newBillForm.referringDoctor}
                      onChange={(e) => setNewBillForm({ ...newBillForm, referringDoctor: e.target.value })}
                      placeholder="Self or Dr. Name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                    />
                    <datalist id="doctorsList">
                      <option value="Self / Direct Walk-in" />
                      {vendorDoctors.map((doc) => (
                        <option key={doc.id} value={`${doc.name} (${doc.specialty})`} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Select Tests */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#123B6D] tracking-wider">
                    2. Prescribed Diagnostic Tests (जाँच चुनें)
                  </span>
                  <span className="text-[11px] font-bold text-[#0F766E]">
                    {newBillForm.selectedTests.length} Selected
                  </span>
                </div>

                {/* Test Search */}
                <input
                  type="text"
                  value={testSearchInput}
                  onChange={(e) => setTestSearchInput(e.target.value)}
                  placeholder="Filter tests (e.g. CBC, Lipid, Thyroid, Sugar, LFT)..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800"
                />

                {/* Tests Checklist */}
                <div className="max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50/50">
                  {vendorTests
                    .filter((t) => {
                      const term = String(testSearchInput || '').trim().toLowerCase();
                      if (!term) return true;
                      const tn = String(t.name || '').toLowerCase();
                      const tc = String(t.category || '').toLowerCase();
                      return tn.includes(term) || tc.includes(term);
                    })
                    .map((test) => {
                      const isSelected = newBillForm.selectedTests.includes(test.name);
                      return (
                        <div
                          key={test.id}
                          onClick={() => toggleTestSelection(test.name)}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-50 border-[#123B6D] text-[#123B6D] font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="text-[11px]">{test.name}</span>
                          </div>
                          <span className="font-mono font-black text-slate-900 shrink-0">
                            ₹{test.priceINR}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Billing & Payment Calculation */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-[#123B6D] tracking-wider block">
                  3. Billing & Payment Collection (भुगतान संग्रह)
                </span>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Test Total:</span>
                    <span className="font-bold text-slate-900 font-mono">₹{calculatedBillGross}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Discount (छूट ₹):</span>
                    <input
                      type="number"
                      min={0}
                      value={newBillForm.discountINR}
                      onChange={(e) => {
                        const disc = Number(e.target.value) || 0;
                        const net = Math.max(0, calculatedBillGross - disc);
                        setNewBillForm({
                          ...newBillForm,
                          discountINR: disc,
                          paidAmount: net,
                        });
                      }}
                      className="w-24 px-2 py-1 border border-slate-300 rounded-lg text-right font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div className="flex justify-between text-base font-black text-[#123B6D] pt-1.5 border-t border-slate-200">
                    <span>Net Payable:</span>
                    <span className="font-mono">₹{calculatedBillNet}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={newBillForm.paymentMode}
                      onChange={(e) =>
                        setNewBillForm({ ...newBillForm, paymentMode: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-bold bg-white"
                    >
                      <option value="Cash">💵 Cash (Billing Counter)</option>
                      <option value="UPI">📱 UPI QR (GPay / PhonePe / Paytm)</option>
                      <option value="Card">💳 Credit / Debit Card (POS)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Paid Amount (₹)
                      </label>
                      <div className="space-x-1">
                        <button
                          type="button"
                          onClick={() => setNewBillForm({ ...newBillForm, paidAmount: calculatedBillNet })}
                          className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                        >
                          Full
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setNewBillForm({ ...newBillForm, paidAmount: 0 })}
                          className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                        >
                          Due (₹0)
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={calculatedBillNet}
                      value={newBillForm.paidAmount}
                      onChange={(e) =>
                        setNewBillForm({ ...newBillForm, paidAmount: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-mono font-black text-sm"
                    />
                  </div>
                </div>

                {/* Due preview */}
                {calculatedBillNet - (newBillForm.paidAmount || 0) > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                    <span>Remaining Balance Due:</span>
                    <strong className="font-mono font-black text-rose-600">
                      ₹{calculatedBillNet - (newBillForm.paidAmount || 0)}
                    </strong>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>Generate Bill & Print Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / PRINT INVOICE MODAL */}
      {viewInvoiceEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-300 shadow-2xl overflow-hidden my-6">
            <div className="bg-[#123B6D] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-black">Official Laboratory Invoice & Thermal Slip</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Bill</span>
                </button>
                <button
                  onClick={() => setViewInvoiceEntry(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-6 space-y-4 text-xs font-sans">
              {/* Lab Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-base font-black text-[#123B6D] tracking-tight">
                  {merchantName.toUpperCase()}
                </h2>
                <p className="text-[11px] text-slate-500 font-semibold">
                  NABL Accredited • ISO 15189:2022 Certified Medical Diagnostic Lab
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  SCO 42, Civil Hospital Road • Ph: +91 98765 43210 • GSTIN: 03AAAAA0000A1Z5
                </p>
                <div className="mt-2 py-0.5 px-3 bg-slate-100 rounded text-[10px] font-mono inline-block font-bold text-slate-700">
                  TAX INVOICE / CASH RECEIPT
                </div>
              </div>

              {/* Patient Demographics & Invoice Details */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                <div>
                  <div>
                    <span className="text-slate-400">Patient:</span>{' '}
                    <strong className="text-slate-900">{viewInvoiceEntry.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Age / Gender:</span>{' '}
                    <strong className="text-slate-700">
                      {viewInvoiceEntry.age} Yrs / {viewInvoiceEntry.gender}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Mobile:</span>{' '}
                    <span className="text-slate-700 font-mono">{viewInvoiceEntry.mobile}</span>
                  </div>
                </div>

                <div>
                  <div>
                    <span className="text-slate-400">Token No:</span>{' '}
                    <strong className="text-[#123B6D] font-mono">
                      {viewInvoiceEntry.tokenNo || viewInvoiceEntry.tokenNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">UHID:</span>{' '}
                    <span className="font-mono text-slate-700">{viewInvoiceEntry.uhid}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Doctor:</span>{' '}
                    <span className="text-slate-700">{viewInvoiceEntry.referringDoctor || 'Self'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Date/Time:</span>{' '}
                    <span className="text-slate-700">{viewInvoiceEntry.registeredAt || 'Today'}</span>
                  </div>
                </div>
              </div>

              {/* Itemized Tests Table */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                    <th className="py-1.5 text-left">#</th>
                    <th className="py-1.5 text-left">Investigation / Test Name</th>
                    <th className="py-1.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(viewInvoiceEntry.tests || (viewInvoiceEntry as any).testNames || []).map(
                    (testName: string, idx: number) => {
                      const matched = vendorTests.find((t) => t.name === testName);
                      const price = matched?.priceINR || 500;
                      return (
                        <tr key={idx} className="py-1.5">
                          <td className="py-1.5 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-1.5 font-semibold text-slate-800">{testName}</td>
                          <td className="py-1.5 text-right font-mono text-slate-900">₹{price}</td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>

              {/* Financial Calculation */}
              <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Total:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{viewInvoiceEntry.totalAmount}
                  </span>
                </div>
                {viewInvoiceEntry.discountINR ? (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount Allowed:</span>
                    <span className="font-mono">-₹{viewInvoiceEntry.discountINR}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Net Amount:</span>
                  <span className="font-mono">
                    ₹{Math.max(0, viewInvoiceEntry.totalAmount - (viewInvoiceEntry.discountINR || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Paid Amount ({viewInvoiceEntry.paymentMode || 'Cash'}):</span>
                  <span className="font-mono">₹{viewInvoiceEntry.paidAmount}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-black pt-1 border-t border-slate-100">
                  <span>Balance Due:</span>
                  <span className="font-mono">₹{viewInvoiceEntry.dueAmount}</span>
                </div>
              </div>

              {/* Pending QR code notice if due exists */}
              {viewInvoiceEntry.dueAmount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                    <img src={qr1Url} alt="UPI QR" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-900">
                      Scan UPI to Clear Balance (₹{viewInvoiceEntry.dueAmount})
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{upiId1}</div>
                    <div className="text-[10px] text-amber-800 mt-0.5 font-semibold">
                      Please clear dues prior to report delivery collection.
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Authorized Signatory / Lab Reception</span>
                <span>Computer Generated Cash Receipt</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STANDEE MODAL */}
      {showStandeeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden">
            <div className="bg-[#123B6D] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-black">Official Countertop Payment Standee</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Standee</span>
                </button>
                <button
                  onClick={() => setShowStandeeModal(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Standee Canvas */}
            <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white space-y-6">
              <div className="border-4 border-[#123B6D] rounded-2xl p-6 bg-white shadow-md">
                <div className="text-2xl font-black text-[#123B6D] tracking-tight">
                  {merchantName.toUpperCase()}
                </div>
                <div className="text-xs text-slate-500 font-bold mt-1">
                  NABL Accredited • Pathology & Diagnostic Services
                </div>

                <div className="my-6 py-2 bg-amber-400 text-slate-950 font-black text-sm tracking-wider uppercase rounded-lg shadow-xs">
                  Scan & Pay with Any UPI App
                </div>

                {/* 2 QRs on Standee */}
                <div className="grid grid-cols-2 gap-6 items-center max-w-lg mx-auto">
                  {/* QR 1 */}
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <div className="w-36 h-36 mx-auto bg-white p-2 rounded-lg border border-slate-300 shadow-xs flex items-center justify-center">
                      <img src={qr1Url} alt="QR 1" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-[11px] font-black text-[#123B6D] mt-2 truncate">
                      {qr1Label}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{upiId1}</div>
                  </div>

                  {/* QR 2 */}
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <div className="w-36 h-36 mx-auto bg-white p-2 rounded-lg border border-slate-300 shadow-xs flex items-center justify-center">
                      <img src={qr2Url} alt="QR 2" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-[11px] font-black text-[#0F766E] mt-2 truncate">
                      {qr2Label}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{upiId2}</div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-4">
                  <span>Google Pay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM UPI</span> • <span>All Indian Banks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLLECT REMAINING PAYMENT MODAL */}
      {collectPaymentEntry && (
        <CollectRemainingPaymentModal
          isOpen={!!collectPaymentEntry}
          onClose={() => setCollectPaymentEntry(null)}
          entry={collectPaymentEntry}
          onCollectPayment={(entryId, collectedAmount, mode, note) => {
            const current =
              receptionEntries.find((e) => e.id === entryId) || collectPaymentEntry;
            const newPaid = (current.paidAmount || 0) + collectedAmount;
            const newDue = Math.max(0, (current.dueAmount || 0) - collectedAmount);
            const newStatus = newDue <= 0 ? 'Full Payment' : 'Partial';

            updateReceptionEntry(entryId, {
              paidAmount: newPaid,
              dueAmount: newDue,
              paymentStatus: newStatus as any,
              balancePaidAmount: collectedAmount,
              balancePaymentMode: mode,
              balancePaidAt: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              notes: note
                ? `${current.notes ? current.notes + ' | ' : ''}Collected ₹${collectedAmount} via ${mode}: ${note}`
                : current.notes,
            });

            setCollectPaymentEntry(null);
            showNotification(`Collected ₹${collectedAmount} via ${mode} for ${current.patientName}! Balance remaining: ₹${newDue}`);
          }}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Are you sure you want to delete this?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this? This billing and patient ledger entry will be permanently removed.
              </p>
            </div>
            <div className="flex items-center gap-2 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                No
              </button>
              <button
                onClick={() => {
                  deleteReceptionEntry(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showNotification('Billing record deleted.');
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAY-END RECEPTION CASH CLOSING MODAL */}
      {isCashClosingOpen && (
        <DayEndCashClosingModal
          isOpen={isCashClosingOpen}
          onClose={() => setIsCashClosingOpen(false)}
          receptionEntries={receptionEntries}
          staffName="Lab Owner / Chief Cashier"
        />
      )}

      {/* DOCTOR COMMISSION / REFERRAL BUSINESS SUMMARY MODAL */}
      {isDoctorCommissionOpen && (
        <DoctorCommissionModal
          isOpen={isDoctorCommissionOpen}
          onClose={() => setIsDoctorCommissionOpen(false)}
          doctors={vendorDoctors}
          receptionEntries={receptionEntries}
        />
      )}
    </div>
  );
};
