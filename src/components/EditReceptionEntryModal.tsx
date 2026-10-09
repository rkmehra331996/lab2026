import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  AlertCircle,
  Save,
  Lock,
  CreditCard,
  IndianRupee,
  Plus,
  Search,
  Trash2,
  FlaskConical,
} from 'lucide-react';
import { ReceptionPatientEntry, VendorDoctor } from '../types';

export interface TestOption {
  name: string;
  price: number;
  sample?: string;
  category?: string;
}

interface EditReceptionEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: ReceptionPatientEntry | null;
  onSave: (updatedEntry: ReceptionPatientEntry) => void;
  onSaveAndSendToLab?: (updatedEntry: ReceptionPatientEntry) => void;
  vendorDoctors?: Array<VendorDoctor | { id: string; name: string; specialty?: string; specialization?: string }>;
  availableTests?: TestOption[];
}

const DEFAULT_POPULAR_TESTS: TestOption[] = [
  { name: 'Complete Blood Count (CBC)', price: 350, sample: 'EDTA Whole Blood', category: 'Hematology' },
  { name: 'Fasting Blood Sugar (FBS)', price: 120, sample: 'Fluoride Plasma', category: 'Biochemistry' },
  { name: 'Post-Prandial Blood Sugar (PPBS)', price: 120, sample: 'Fluoride Plasma', category: 'Biochemistry' },
  { name: 'Random Blood Sugar (RBS)', price: 100, sample: 'Fluoride Plasma', category: 'Biochemistry' },
  { name: 'HbA1c (Glycosylated Hb)', price: 450, sample: 'EDTA Whole Blood', category: 'Biochemistry' },
  { name: 'Kidney Function Test (KFT)', price: 600, sample: 'Serum Clot', category: 'Biochemistry' },
  { name: 'Liver Function Test (LFT)', price: 650, sample: 'Serum Clot', category: 'Biochemistry' },
  { name: 'Lipid Profile', price: 550, sample: 'Serum Clot', category: 'Biochemistry' },
  { name: 'Thyroid Profile (Total - T3, T4, TSH)', price: 450, sample: 'Serum Clot', category: 'Endocrinology' },
  { name: 'Serum Creatinine', price: 180, sample: 'Serum Clot', category: 'Biochemistry' },
  { name: 'Blood Urea Nitrogen (BUN)', price: 180, sample: 'Serum Clot', category: 'Biochemistry' },
  { name: 'Serum Uric Acid', price: 200, sample: 'Serum Clot', category: 'Biochemistry' },
  { name: 'Serum Electrolytes (Na+, K+, Cl-)', price: 450, sample: 'Serum Clot', category: 'Biochemistry' },
  { name: 'Urine Routine & Microscopic', price: 150, sample: 'Sterile Urine', category: 'Clinical Pathology' },
  { name: 'Dengue Serology (NS1 + Platelets)', price: 800, sample: 'Serum + EDTA', category: 'Serology' },
  { name: 'Widal Slide Agglutination', price: 250, sample: 'Serum Clot', category: 'Serology' },
  { name: 'Vitamin D3 & B12 Combo', price: 1200, sample: 'Serum Clot', category: 'Vitamins' },
  { name: 'Vitamin D (25-OH)', price: 750, sample: 'Serum Clot', category: 'Vitamins' },
  { name: 'Vitamin B12 (Cyanocobalamin)', price: 650, sample: 'Serum Clot', category: 'Vitamins' },
  { name: 'C-Reactive Protein (CRP Quantitative)', price: 380, sample: 'Serum Clot', category: 'Serology' },
  { name: 'Full Body Health Checkup', price: 999, sample: 'EDTA + Serum + Urine', category: 'Popular Packages' },
  { name: 'ESR (Westergren Method)', price: 100, sample: 'EDTA Blood', category: 'Hematology' },
  { name: 'Blood Grouping & Rh Factor', price: 150, sample: 'EDTA Blood', category: 'Hematology' },
  { name: 'Stool Routine & Occult Blood', price: 200, sample: 'Stool Specimen', category: 'Clinical Pathology' },
];

export const EditReceptionEntryModal: React.FC<EditReceptionEntryModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSave,
  onSaveAndSendToLab,
  vendorDoctors = [],
  availableTests,
}) => {
  if (!isOpen || !entry) return null;

  // Determine if report is already generated / ready
  const isReportReady =
    entry.status === 'Report Ready' ||
    entry.technicianStatus === 'Report Generated' ||
    Boolean(entry.reportId);

  // Determine if entry has been sent to lab
  const isSentToLab = Boolean(
    entry.sentToTechnician ||
    entry.technicianStatus === 'Sent to Lab' ||
    entry.technicianStatus === 'Accepted' ||
    entry.status === 'In Lab'
  );

  const initialNetPayable = Math.max(0, (entry.totalAmount || 0) - (entry.discountINR || 0));
  const isEntryFullyPaid =
    (entry.dueAmount === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid') &&
    (entry.paidAmount || 0) >= initialNetPayable;

  // Demographics and tests are strictly locked once sent to lab or report is ready
  const isDemographicsLocked = isReportReady || isSentToLab;
  // Payment is strictly locked once full payment is completed
  const isPaymentLocked = isEntryFullyPaid;
  // Entire modal is locked from editing if both demographics AND payment are locked
  const isLockedForEdit = isDemographicsLocked && isPaymentLocked;

  const [patientName, setPatientName] = useState(entry.patientName);
  const [age, setAge] = useState(String(entry.age));
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(entry.gender);
  const [mobile, setMobile] = useState(entry.mobile);
  const [referringDoctor, setReferringDoctor] = useState(entry.referringDoctor);
  const [selectedTests, setSelectedTests] = useState<string[]>(entry.tests || []);
  const [sampleType, setSampleType] = useState(entry.sampleType);
  const [totalAmount, setTotalAmount] = useState<number>(entry.totalAmount);
  const [discountINR, setDiscountINR] = useState<number>(entry.discountINR || 0);
  const [paidAmount, setPaidAmount] = useState<number>(entry.paidAmount);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>(
    entry.paymentMode === 'Cash' ? 'Cash' : 'UPI'
  );
  const [paymentStatus, setPaymentStatus] = useState<ReceptionPatientEntry['paymentStatus']>(
    entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid'
      ? 'Full Payment'
      : entry.paymentStatus === 'Advance' || (entry.paidAmount > 0 && entry.dueAmount > 0)
      ? 'Advance'
      : 'Pending'
  );
  const [status, setStatus] = useState<ReceptionPatientEntry['status']>(entry.status);
  const [notes, setNotes] = useState(entry.notes || '');

  // Search & custom test state
  const [testSearch, setTestSearch] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTestName, setCustomTestName] = useState('');
  const [customTestPrice, setCustomTestPrice] = useState('');

  // Reset when entry changes
  useEffect(() => {
    if (entry) {
      setPatientName(entry.patientName);
      setAge(String(entry.age));
      setGender(entry.gender);
      setMobile(entry.mobile);
      setReferringDoctor(entry.referringDoctor);
      setSelectedTests(entry.tests || []);
      setSampleType(entry.sampleType);
      setTotalAmount(entry.totalAmount);
      setDiscountINR(entry.discountINR || 0);
      setPaidAmount(entry.paidAmount);
      setPaymentMode(entry.paymentMode === 'Cash' ? 'Cash' : 'UPI');
      setPaymentStatus(
        entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid'
          ? 'Full Payment'
          : entry.paymentStatus === 'Advance' || (entry.paidAmount > 0 && entry.dueAmount > 0)
          ? 'Advance'
          : 'Pending'
      );
      setStatus(entry.status);
      setNotes(entry.notes || '');
      setTestSearch('');
      setShowCustomInput(false);
      setCustomTestName('');
      setCustomTestPrice('');
    }
  }, [entry]);

  // Combined searchable test catalog
  const catalog = useMemo<TestOption[]>(() => {
    const map = new Map<string, TestOption>();
    DEFAULT_POPULAR_TESTS.forEach((t) => map.set(t.name.toLowerCase().trim(), t));
    if (availableTests && availableTests.length > 0) {
      availableTests.forEach((t) => map.set(t.name.toLowerCase().trim(), t));
    }
    // Also include any tests currently on the patient entry so they have recognized metadata
    (entry.tests || []).forEach((tName) => {
      const key = tName.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { name: tName, price: 300, category: 'Prescribed' });
      }
    });
    return Array.from(map.values());
  }, [availableTests, entry.tests]);

  // Lookup price of a test
  const getTestPrice = (testName: string): number => {
    const found = catalog.find((c) => c.name.toLowerCase().trim() === testName.toLowerCase().trim());
    return found ? found.price : 300;
  };

  // Filter catalog by search query
  const filteredCatalogTests = useMemo(() => {
    if (!testSearch.trim()) return [];
    const q = testSearch.toLowerCase().trim();
    return catalog.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.sample && t.sample.toLowerCase().includes(q))
    );
  }, [catalog, testSearch]);

  // Quick popular tests for fast toggle
  const popularTests = useMemo(() => {
    return DEFAULT_POPULAR_TESTS.slice(0, 10);
  }, []);

  // Recalculate financial due
  const netPayable = Math.max(0, totalAmount - (discountINR || 0));
  const dueAmount = Math.max(0, netPayable - (paidAmount || 0));

  // Quick payment status actions
  const handleSelectPaymentPreset = (type: 'Full Payment' | 'Advance' | 'Due') => {
    if (type === 'Full Payment') {
      setPaidAmount(netPayable);
      setPaymentStatus('Full Payment');
    } else if (type === 'Due') {
      setPaidAmount(0);
      setPaymentStatus('Due Payment');
    } else if (type === 'Advance') {
      const half = Math.round(netPayable / 2);
      setPaidAmount(half);
      setPaymentStatus('Advance');
    }
  };

  const handlePaidAmountChange = (val: number) => {
    const clamped = Math.max(0, Math.min(netPayable, val));
    setPaidAmount(clamped);
    if (clamped >= netPayable) {
      setPaymentStatus('Full Payment');
    } else if (clamped > 0) {
      setPaymentStatus('Advance');
    } else {
      setPaymentStatus('Due Payment');
    }
  };

  // Add test to list and increment total amount
  const handleAddTest = (test: TestOption) => {
    if (isLockedForEdit) return;
    if (selectedTests.some((t) => t.toLowerCase().trim() === test.name.toLowerCase().trim())) {
      return;
    }
    setSelectedTests((prev) => [...prev, test.name]);
    setTotalAmount((prev) => prev + (test.price || 0));
    if (test.sample && (!sampleType || sampleType.includes('EDTA'))) {
      setSampleType(test.sample);
    }
  };

  // Remove test from list and deduct from total amount
  const handleRemoveTest = (testName: string) => {
    if (isLockedForEdit) return;
    const price = getTestPrice(testName);
    setSelectedTests((prev) => prev.filter((t) => t !== testName));
    setTotalAmount((prev) => Math.max(0, prev - price));
  };

  // Add custom unlisted test
  const handleAddCustomTest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLockedForEdit) return;
    const name = customTestName.trim();
    if (!name) return;
    if (selectedTests.some((t) => t.toLowerCase().trim() === name.toLowerCase().trim())) {
      alert('This test is already selected');
      return;
    }
    const price = Math.max(0, Number(customTestPrice) || 0);
    setSelectedTests((prev) => [...prev, name]);
    setTotalAmount((prev) => prev + price);
    setCustomTestName('');
    setCustomTestPrice('');
    setShowCustomInput(false);
  };

  const handleToggleTest = (testName: string, testPrice: number, suggestedSample?: string) => {
    if (isLockedForEdit) return;
    if (selectedTests.includes(testName)) {
      handleRemoveTest(testName);
    } else {
      handleAddTest({ name: testName, price: testPrice, sample: suggestedSample });
    }
  };

  const handleSaveInternal = (sendToLab: boolean = false) => {
    if (isReportReady) {
      if (isEntryFullyPaid) {
        alert('Full payment is completed and report is issued. Payment cannot be edited again.');
        return;
      }

      // ONLY payment information is updated!
      const finalPaidAmount = Math.min(netPayable, paidAmount);
      const finalDueAmount = Math.max(0, netPayable - finalPaidAmount);
      const finalPaymentStatus: ReceptionPatientEntry['paymentStatus'] =
        finalDueAmount === 0 ? 'Full Payment' : finalPaidAmount > 0 ? 'Advance' : 'Pending';

      const updated: ReceptionPatientEntry = {
        ...entry,
        paidAmount: finalPaidAmount,
        dueAmount: finalDueAmount,
        paymentMode,
        paymentStatus: finalPaymentStatus,
        balancePaidAmount: (entry.balancePaidAmount || 0) + Math.max(0, finalPaidAmount - entry.paidAmount),
        balancePaymentMode: paymentMode,
        balancePaidAt: `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
        isReportPublished: finalDueAmount === 0 ? true : entry.isReportPublished,
        publishedAt: finalDueAmount === 0 ? `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : entry.publishedAt,
      };

      onSave(updated);
      onClose();
      return;
    }

    if (isLockedForEdit) {
      alert(
        isReportReady
          ? 'Report ready hone ke baad entry edit nahi ki ja sakti.'
          : '"Send to Lab" hone ke baad entry edit nahi ki ja sakti.'
      );
      return;
    }

    if (!patientName.trim()) {
      alert('Patient name is required');
      return;
    }

    if (selectedTests.length === 0) {
      alert('Please add or select at least one diagnostic test.');
      return;
    }

    // Determine final payment status
    let finalPaymentStatus: ReceptionPatientEntry['paymentStatus'] = 'Pending';
    if (dueAmount === 0 || paidAmount >= netPayable) {
      finalPaymentStatus = 'Full Payment';
    } else if (paidAmount > 0) {
      finalPaymentStatus = 'Advance';
    } else {
      finalPaymentStatus = 'Pending';
    }

    const updated: ReceptionPatientEntry = {
      ...entry,
      patientName: isReportReady ? entry.patientName : patientName.trim(),
      age: isReportReady ? entry.age : age.trim() || '30',
      gender: isReportReady ? entry.gender : gender,
      mobile: isReportReady ? entry.mobile : mobile.trim(),
      referringDoctor: isReportReady ? entry.referringDoctor : referringDoctor,
      tests: isReportReady ? entry.tests : selectedTests.length > 0 ? selectedTests : ['Complete Blood Count (CBC)'],
      sampleType: isReportReady ? entry.sampleType : sampleType,
      totalAmount: isReportReady ? entry.totalAmount : totalAmount,
      discountINR: isReportReady ? entry.discountINR : discountINR,
      paidAmount,
      dueAmount,
      paymentMode,
      paymentStatus: finalPaymentStatus,
      // If report is already ready, keep status and technicianStatus unchanged
      status: isReportReady ? entry.status : sendToLab ? 'In Lab' : status,
      sentToTechnician: isReportReady ? entry.sentToTechnician : sendToLab ? true : entry.sentToTechnician,
      technicianStatus: isReportReady
        ? entry.technicianStatus
        : sendToLab
        ? 'Sent to Lab'
        : entry.technicianStatus || (sendToLab ? 'Sent to Lab' : 'Not Sent'),
      sentToLabAt: isReportReady
        ? entry.sentToLabAt
        : sendToLab
        ? `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
        : entry.sentToLabAt,
      notes: notes.trim() || undefined,
    };

    if (sendToLab && onSaveAndSendToLab && !isReportReady) {
      onSaveAndSendToLab(updated);
    } else {
      onSave(updated);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#123B6D] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 text-white font-black px-2.5 py-1 rounded-lg text-xs">
              {entry.tokenNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {isReportReady
                    ? 'Patient Entry (Report Ready - Locked)'
                    : isSentToLab
                    ? 'Patient Entry (Sent to Lab - Locked)'
                    : 'Edit Patient Entry & Billing'}
                </h2>
                {isLockedForEdit && (
                  <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>LOCKED</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100">
                UHID: {entry.uhid} • Registered: {entry.registeredAt}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Banner if Report is Ready or Sent to Lab */}
        {isLockedForEdit && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 sm:px-6 flex items-start gap-2.5 text-amber-950 text-xs">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-black text-amber-900 flex items-center gap-1.5">
                <span>
                  {isReportReady
                    ? `Diagnostic Report Issued (${entry.reportId || 'Report Ready'})`
                    : 'Dispatched to Laboratory (Sent to Lab)'}
                </span>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-1.5 py-0.2 rounded">
                  Entry Locked
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                {isReportReady
                  ? 'Kyuki laboratory report ban chuki hai / report ready hai, isliye yeh entry edit nahi ki ja sakti.'
                  : 'Kyuki yeh entry lab technician ko dispatch ki ja chuki hai ("Send to Lab"), isliye ab ise edit nahi kiya ja sakta.'}
              </p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Patient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>
                  Patient Full Name <span className="text-rose-500">*</span>
                </span>
                {isLockedForEdit && (
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </label>
              <input
                type="text"
                disabled={isLockedForEdit}
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden ${
                  isLockedForEdit
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-900 border-slate-300'
                }`}
                placeholder="e.g. Ramesh Kumar Verma"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>
                  Age & Gender <span className="text-rose-500">*</span>
                </span>
                {isLockedForEdit && (
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  disabled={isLockedForEdit}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={`w-16 px-2.5 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-center ${
                    isLockedForEdit
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-slate-300'
                  }`}
                />
                <select
                  disabled={isLockedForEdit}
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className={`flex-1 px-2.5 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden ${
                    isLockedForEdit
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-slate-300'
                  }`}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>10-Digit Mobile Number (WhatsApp)</span>
                {isLockedForEdit && (
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">+91</span>
                <input
                  type="tel"
                  disabled={isLockedForEdit}
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className={`w-full pl-11 pr-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden ${
                    isLockedForEdit
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-slate-300'
                  }`}
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Referring Doctor</span>
                {isLockedForEdit && (
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </label>
              <select
                disabled={isLockedForEdit}
                value={referringDoctor}
                onChange={(e) => setReferringDoctor(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden ${
                  isLockedForEdit
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-900 border-slate-300'
                }`}
              >
                <option value="Self / Walk-in Patient">Self / Walk-in Patient</option>
                <option value="Dr. S. K. Gupta (MD Med)">Dr. S. K. Gupta (MD Med)</option>
                <option value="Dr. Anita Joshi, MD (Obs & Gynae)">Dr. Anita Joshi, MD (Obs & Gynae)</option>
                <option value="Dr. Hardeep Bawa, MS (Gen Surgery)">Dr. Hardeep Bawa, MS (Gen Surgery)</option>
                <option value="Dr. M. K. Aggarwal, MD (Chest & Allergy)">Dr. M. K. Aggarwal, MD</option>
                {vendorDoctors.map((doc) => {
                  const spec = doc.specialty || (doc as any).specialization || '';
                  return (
                    <option key={doc.id} value={spec ? `${doc.name} (${spec})` : doc.name}>
                      {doc.name} {spec ? `(${spec})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Test Management: Selected Tests, Add & Remove */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
                  <span>Prescribed Diagnostic Tests ({selectedTests.length})</span>
                  {isLockedForEdit && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isLockedForEdit
                    ? 'Entry locked: Tests cannot be modified after dispatch to lab or report completion.'
                    : 'Add or remove diagnostic tests below. Total bill updates automatically.'}
                </p>
              </div>

              {!isLockedForEdit && (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-white border border-teal-200 hover:border-teal-400 px-2.5 py-1 rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Custom Test</span>
                </button>
              )}
            </div>

            {/* Currently Selected Tests (with prominent Remove 'X' buttons) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">
                Selected Tests ({selectedTests.length}):
              </span>
              {selectedTests.length === 0 ? (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>No tests selected. Please add at least one test below to proceed.</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  {selectedTests.map((tName) => {
                    const price = getTestPrice(tName);
                    return (
                      <div
                        key={tName}
                        className="inline-flex items-center gap-1.5 bg-blue-50/80 border border-blue-200 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs group hover:bg-blue-100/60 transition"
                      >
                        <span className="max-w-[240px] truncate">{tName}</span>
                        <span className="text-[10px] font-extrabold text-[#123B6D] bg-white px-1.5 py-0.2 rounded border border-blue-200">
                          ₹{price}
                        </span>
                        {!isLockedForEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(tName)}
                            title={`Remove ${tName}`}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-100 p-0.5 rounded transition cursor-pointer ml-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Test Input if opened */}
            {showCustomInput && !isLockedForEdit && (
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg space-y-2">
                <span className="text-[11px] font-bold text-teal-900 block">
                  Add Custom / Other Diagnostic Test:
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customTestName}
                    onChange={(e) => setCustomTestName(e.target.value)}
                    placeholder="Test Name (e.g. Serum Ferritin, Blood Group)"
                    className="flex-1 px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <div className="flex items-center gap-2">
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        value={customTestPrice}
                        onChange={(e) => setCustomTestPrice(e.target.value)}
                        placeholder="Price"
                        className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomTest}
                      disabled={!customTestName.trim()}
                      className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="text-slate-500 hover:text-slate-700 px-2 py-1.5 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search Test Catalog to Add */}
            {!isLockedForEdit && (
              <div className="space-y-2 pt-1 border-t border-slate-200/70">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search lab test to add (e.g. CBC, KFT, LFT, Thyroid, Lipid, Urine, Sugar)..."
                    className="w-full pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden placeholder:text-slate-400"
                  />
                  {testSearch && (
                    <button
                      type="button"
                      onClick={() => setTestSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Search Results if user is typing */}
                {testSearch.trim() ? (
                  <div className="max-h-40 overflow-y-auto border border-teal-200 rounded-lg bg-white divide-y divide-slate-100 shadow-2xs">
                    {filteredCatalogTests.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        No tests found matching "{testSearch}".
                        <button
                          type="button"
                          onClick={() => {
                            setCustomTestName(testSearch);
                            setShowCustomInput(true);
                            setTestSearch('');
                          }}
                          className="text-teal-700 font-bold ml-1.5 hover:underline cursor-pointer"
                        >
                          + Add as custom test
                        </button>
                      </div>
                    ) : (
                      filteredCatalogTests.map((t) => {
                        const isAlreadySelected = selectedTests.some(
                          (st) => st.toLowerCase().trim() === t.name.toLowerCase().trim()
                        );
                        return (
                          <div
                            key={t.name}
                            className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-800 block truncate">{t.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {t.category || 'Diagnostic'} {t.sample ? `• ${t.sample}` : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-slate-700 text-xs">₹{t.price}</span>
                              {isAlreadySelected ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTest(t.name)}
                                  className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition cursor-pointer"
                                  title="Click to remove"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Added</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddTest(t)}
                                  className="bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  /* Popular Quick Pills */
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 mb-1.5 block">
                      Quick Popular Tests (Click to Add or Remove):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-lg">
                      {popularTests.map((t) => {
                        const isSelected = selectedTests.some(
                          (st) => st.toLowerCase().trim() === t.name.toLowerCase().trim()
                        );
                        return (
                          <button
                            type="button"
                            key={t.name}
                            onClick={() => (isSelected ? handleRemoveTest(t.name) : handleAddTest(t))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50/50'
                            }`}
                          >
                            <span>{t.name}</span>
                            <span
                              className={`text-[10px] ${
                                isSelected ? 'text-teal-200' : 'text-slate-400 font-bold'
                              }`}
                            >
                              ₹{t.price}
                            </span>
                            {isSelected ? (
                              <Check className="w-3 h-3 text-teal-200" />
                            ) : (
                              <Plus className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Billing & Payment Adjustment (ALWAYS ACTIVE & MANAGABLE) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-teal-700" />
                <span>Payment Management & Remaining Balance</span>
              </h4>
              {isReportReady && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Active Payment Settlement
                </span>
              )}
            </div>

            {/* Payment Status Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                Payment Status Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPaymentPreset('Full Payment')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                    paidAmount >= netPayable
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Full Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPaymentPreset('Advance')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                    paidAmount > 0 && paidAmount < netPayable
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <span>⚠️ Advance</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPaymentPreset('Due')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                    paidAmount === 0
                      ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                      : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  <span>❌ Due Payment</span>
                </button>
              </div>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Total Bill (₹)</label>
                <input
                  type="number"
                  disabled={isReportReady}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
                  className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden ${
                    isReportReady
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Discount (₹)</label>
                <input
                  type="number"
                  disabled={isReportReady}
                  value={discountINR}
                  onChange={(e) => setDiscountINR(Number(e.target.value) || 0)}
                  className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden ${
                    isReportReady
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Amount Paid (₹) <span className="text-emerald-700 font-extrabold">*</span>
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => handlePaidAmountChange(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-extrabold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Balance Due</label>
                <div
                  className={`px-2.5 py-1.5 border rounded-lg text-xs font-black text-center ${
                    dueAmount > 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  ₹{dueAmount}
                </div>
              </div>
            </div>

            {/* Quick Settle Due Button if dueAmount > 0 */}
            {dueAmount > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2 flex items-center justify-between gap-2">
                <div className="text-[11px] text-amber-900">
                  <span className="font-bold">Remaining Due: ₹{dueAmount}</span>
                  <span className="text-amber-700 ml-1">
                    (Advance ₹{paidAmount} of ₹{netPayable} paid)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectPaymentPreset('Full Payment')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Settle Full Due (Pay ₹{dueAmount})</span>
                </button>
              </div>
            )}

            {/* Payment Mode */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700">Payment Mode:</span>
              {(['UPI', 'Cash'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMode(m)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    paymentMode === m
                      ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {m === 'UPI' ? '📱 UPI' : '💵 Cash'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {isLockedForEdit ? 'Close' : 'Cancel'}
          </button>

          {isLockedForEdit ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-3.5 py-2 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                {isReportReady
                  ? 'Locked: Report ready hone ke baad edit nahi ho sakta'
                  : 'Locked: Lab bhejne ke baad edit nahi ho sakta'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleSaveInternal(false)}
              className="px-5 py-2 bg-[#123B6D] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
