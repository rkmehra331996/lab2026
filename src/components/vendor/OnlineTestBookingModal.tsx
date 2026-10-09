import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Search,
  Calendar,
  Clock,
  QrCode,
  Copy,
  MapPin,
  Building2,
  Home,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Phone,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Share2,
  Sparkles,
  Printer,
  Smartphone,
  Download,
  Upload,
  CreditCard,
  Lock,
} from 'lucide-react';
import { TestItem, VendorPackage, ReceptionPatientEntry } from '../../types';
import { useCms } from '../../context/CmsContext';
import { WebsiteTokenReceiptCard } from './WebsiteTokenReceiptCard';

interface OnlineTestBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelection?: string;
  initialTests?: { name: string; price: number; type: 'test' | 'package' }[];
  onOpenReportPortal?: (reportId?: string, mobile?: string) => void;
  onBookingSuccess?: () => void;
}

export const OnlineTestBookingModal: React.FC<OnlineTestBookingModalProps> = ({
  isOpen,
  onClose,
  initialSelection = '',
  initialTests,
  onOpenReportPortal,
  onBookingSuccess,
}) => {
  const {
    vendorLabSettings,
    vendorTests,
    vendorPackages,
    addReceptionEntry,
    addHomeCollectionBooking,
    activeTenantId,
    activeBranchId,
  } = useCms();

  // Current Step: 1 = Test Selection & Details, 2 = Payment Selection (QR / Pay at Branch), 3 = Booking Confirmed
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State - Tests
  const [selectedTests, setSelectedTests] = useState<{ name: string; price: number; type: 'test' | 'package' }[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [isAddingTest, setIsAddingTest] = useState(false);

  // Form State - Patient Demographics
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('32');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobile, setMobile] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('Self / Direct Walk-in');

  // Visit Type: 'Walk-in' (Lab Visit) | 'Home Collection' (Phlebotomist Visit)
  const [visitType, setVisitType] = useState<'Walk-in' | 'Home Collection'>('Walk-in');
  const [homeAddress, setHomeAddress] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('Today (Within 2 Hours)');

  // Form State - Payment (Step 2)
  const [paymentOption, setPaymentOption] = useState<'online' | 'pay_at_branch'>('online');
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PhonePe Gateway Simulation State
  const [isPhonePeModalOpen, setIsPhonePeModalOpen] = useState(false);
  const [phonePeProcessing, setPhonePeProcessing] = useState(false);
  const [phonePeMethod, setPhonePeMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Form State - Confirmed Result (Step 3)
  const [confirmedEntry, setConfirmedEntry] = useState<ReceptionPatientEntry | null>(null);

  const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Laboratory';
  const merchantName = vendorLabSettings?.merchantName || labName;
  const upiId = vendorLabSettings?.upiId1 || 'apexlab@icici';
  const labPhone = vendorLabSettings?.phone || '7087033009';

  // Domain & Payment Method Resolution
  // 1. Default IndianLalaji.com Shop URL -> ONLY Manual UPI available
  // 2. Vendor Custom Domain -> Vendor's choice (Manual UPI OR PhonePe Gateway)
  const isCustomDomain = Boolean(
    vendorLabSettings?.isCustomDomainActive ||
    (typeof window !== 'undefined' &&
      !window.location.hostname.includes('indianlalaji.com') &&
      !window.location.hostname.includes('indianalala.com') &&
      !window.location.hostname.includes('run.app') &&
      !window.location.hostname.includes('localhost') &&
      Boolean(vendorLabSettings?.websiteDomain))
  );

  const activeOnlineMethod: 'manual_upi' | 'phonepe' = isCustomDomain
    ? (vendorLabSettings?.activeOnlinePaymentMethod || 'manual_upi')
    : 'manual_upi';

  const isPayOnSpotAllowed = vendorLabSettings?.isPayOnSpotEnabled !== false;

  // Initialize selected test or package when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(1);
    setIsSubmitting(false);
    setConfirmedEntry(null);
    setUpiRefNumber('');
    setScreenshotPreview('');
    setIsPhonePeModalOpen(false);
    setPhonePeProcessing(false);

    if (initialTests && initialTests.length > 0) {
      setSelectedTests(initialTests);
      return;
    }

    if (initialSelection) {
      // Check if it matches a package
      const matchedPkg = vendorPackages.find(
        (p) =>
          initialSelection.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(initialSelection.toLowerCase())
      );
      if (matchedPkg) {
        setSelectedTests([{ name: matchedPkg.name, price: matchedPkg.priceINR, type: 'package' }]);
        return;
      }

      // Check if it matches a test
      const matchedTest = vendorTests.find(
        (t) =>
          initialSelection.toLowerCase().includes(t.name.toLowerCase()) ||
          t.name.toLowerCase().includes(initialSelection.toLowerCase())
      );
      if (matchedTest) {
        setSelectedTests([{ name: matchedTest.name, price: matchedTest.priceINR, type: 'test' }]);
        return;
      }

      // Fallback: extract price if format like "CBC (₹350)"
      const priceMatch = initialSelection.match(/₹\s*(\d+)/);
      const cleanName = initialSelection.replace(/\s*\([^)]*\)/g, '').trim();
      setSelectedTests([
        {
          name: cleanName || initialSelection,
          price: priceMatch ? Number(priceMatch[1]) : 350,
          type: 'test',
        },
      ]);
    } else {
      // Default to CBC if nothing was passed
      const defaultTest = vendorTests[0] || { name: 'Complete Blood Count (CBC)', priceINR: 350 };
      setSelectedTests([{ name: defaultTest.name, price: defaultTest.priceINR, type: 'test' }]);
    }
  }, [isOpen, initialSelection]);

  if (!isOpen) return null;

  // Pricing calculations
  const totalAmount = selectedTests.reduce((sum, item) => sum + item.price, 0);

  // Search filtered tests and packages
  const filteredCatalogTests = vendorTests.filter(
    (t) =>
      !selectedTests.some((st) => st.name === t.name) &&
      (t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.code.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(testSearch.toLowerCase()))
  );

  const filteredCatalogPackages = vendorPackages.filter(
    (p) =>
      !selectedTests.some((st) => st.name === p.name) &&
      p.name.toLowerCase().includes(testSearch.toLowerCase())
  );

  const handleAddTest = (name: string, price: number, type: 'test' | 'package') => {
    setSelectedTests((prev) => [...prev, { name, price, type }]);
    setTestSearch('');
    setIsAddingTest(false);
  };

  const handleRemoveTest = (name: string) => {
    if (selectedTests.length === 1) return; // keep at least 1 test
    setSelectedTests((prev) => prev.filter((t) => t.name !== name));
  };

  // Step 1 Validation
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter the patient name.');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (selectedTests.length === 0) {
      alert('Please select at least one test.');
      return;
    }
    if (visitType === 'Home Collection' && !homeAddress.trim()) {
      alert('Please enter the address for home sample collection.');
      return;
    }

    setCurrentStep(2);
  };

  // Handle Screenshot Upload for Manual UPI
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPaymentError('File size too large. Maximum 5MB allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotPreview(event.target?.result as string);
      setPaymentError('');
    };
    reader.readAsDataURL(file);
  };

  // Central Booking Dispatcher
  const executeBooking = (bookingData: {
    gateway: 'Manual UPI' | 'PhonePe' | 'Pay on Spot';
    autoVerified: boolean;
    verificationStatus: 'Pending Verification' | 'Verified' | 'Pay on Spot / Unpaid';
    paymentStatus: 'Full Payment' | 'Pending' | 'Due';
    paidAmount: number;
    dueAmount: number;
    paymentMode: 'UPI' | 'PhonePe' | 'Cash';
    utr?: string;
    screenshot?: string;
    txnId?: string;
  }) => {
    setIsSubmitting(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const isCartBooking = Boolean(initialTests && initialTests.length > 1) || selectedTests.length > 1;
    const isPackageBooking = selectedTests.some(
      (t) =>
        t.type === 'package' ||
        (t as any).isPackage ||
        t.name.toLowerCase().includes('package') ||
        t.name.toLowerCase().includes('profile') ||
        t.name.toLowerCase().includes('checkup')
    );
    const bookingChannelSource = isCartBooking
      ? 'Website Cart Booking'
      : isPackageBooking
      ? 'Website Package Booking'
      : 'Website Online Booking';

    const cleanTokenNum = String(Math.floor(100 + Math.random() * 899));
    const randomToken = cleanTokenNum;
    const randomUhid = `UHID-W-${Date.now().toString().slice(-6)}`;

    // 1. Create Reception Entry for Front-Desk Queue
    const newReceptionEntry = addReceptionEntry({
      uhid: randomUhid,
      tokenNumber: randomToken,
      tokenNo: randomToken,
      patientName: patientName.trim(),
      age: Number(age) || 30,
      gender,
      mobile: mobile.replace(/\D/g, ''),
      referringDoctor: referringDoctor.trim() || 'Self / Direct Walk-in',
      tests: selectedTests.map((t) => t.name),
      sampleType: selectedTests.some((t) => t.name.toLowerCase().includes('urine'))
        ? 'Urine + Whole Blood'
        : 'EDTA Blood / Serum',
      totalAmount,
      discountINR: 0,
      paidAmount: bookingData.paidAmount,
      dueAmount: bookingData.dueAmount,
      paymentMode: bookingData.paymentMode,
      paymentStatus: bookingData.paymentStatus,
      status: 'Waiting',
      registeredAt: `Today, ${timeStr}`,
      bookingSource: bookingChannelSource,
      visitType,
      address: visitType === 'Home Collection' ? homeAddress.trim() : undefined,
      preferredTimeSlot: preferredSlot,
      upiTransactionRef: bookingData.utr,
      paymentScreenshot: bookingData.screenshot,
      paymentGateway: bookingData.gateway,
      paymentGatewayTxnId: bookingData.txnId,
      autoVerified: bookingData.autoVerified,
      paymentVerificationStatus: bookingData.verificationStatus,
      notes: `🌐 Online Website Booking • Gateway: ${bookingData.gateway} • Status: ${
        bookingData.autoVerified ? '⚡ Auto-Verified (PhonePe)' : bookingData.utr ? `Pending Verification (UTR: ${bookingData.utr})` : 'Pay at Spot'
      } • ${visitType === 'Home Collection' ? `Address: ${homeAddress}` : 'Walk-in'} • Slot: ${preferredSlot}`,
      labId: activeTenantId !== 'all' ? activeTenantId : 'lab-apex',
      branchId: activeBranchId !== 'all' ? activeBranchId : 'branch-1',
    });

    // 2. If Home Collection, also save in home collection records
    if (visitType === 'Home Collection') {
      addHomeCollectionBooking({
        patientName: patientName.trim(),
        mobile: mobile.replace(/\D/g, ''),
        address: homeAddress.trim(),
        timeSlot: preferredSlot,
        packageOrTest: selectedTests.map((t) => t.name).join(', '),
        amountINR: totalAmount,
        paymentMode: bookingData.gateway === 'PhonePe' ? 'PhonePe Online' : bookingData.gateway === 'Manual UPI' ? 'UPI Online' : 'Pay at Visit',
      });
    }

    setConfirmedEntry(newReceptionEntry);
    setIsSubmitting(false);
    setCurrentStep(3);
    if (onBookingSuccess) {
      onBookingSuccess();
    }
  };

  // Step 2 Final Submission
  const handleConfirmBooking = () => {
    setPaymentError('');

    if (paymentOption === 'pay_at_branch') {
      executeBooking({
        gateway: 'Pay on Spot',
        autoVerified: false,
        verificationStatus: 'Pay on Spot / Unpaid',
        paymentStatus: 'Due',
        paidAmount: 0,
        dueAmount: totalAmount,
        paymentMode: 'Cash',
      });
      return;
    }

    // Online Payment Option
    if (activeOnlineMethod === 'phonepe') {
      // Launch PhonePe Gateway Modal
      setIsPhonePeModalOpen(true);
      return;
    }

    // Manual UPI
    if (!upiRefNumber.trim()) {
      setPaymentError('Please enter 12-digit UPI UTR / Transaction Reference Number to confirm your payment.');
      return;
    }

    if (upiRefNumber.trim().length < 8) {
      setPaymentError('Please enter a valid 12-digit UPI UTR number from your payment app screen.');
      return;
    }

    executeBooking({
      gateway: 'Manual UPI',
      autoVerified: false,
      verificationStatus: 'Pending Verification',
      paymentStatus: 'Pending',
      paidAmount: totalAmount,
      dueAmount: 0,
      paymentMode: 'UPI',
      utr: upiRefNumber.trim(),
      screenshot: screenshotPreview || undefined,
    });
  };

  // Handle PhonePe Gateway Simulation Success
  const handlePhonePeSuccess = () => {
    setPhonePeProcessing(true);
    setTimeout(() => {
      setPhonePeProcessing(false);
      setIsPhonePeModalOpen(false);
      const generatedTxnId = `PP_${Date.now().toString().slice(-8)}`;
      executeBooking({
        gateway: 'PhonePe',
        autoVerified: true,
        verificationStatus: 'Verified',
        paymentStatus: 'Full Payment',
        paidAmount: totalAmount,
        dueAmount: 0,
        paymentMode: 'PhonePe',
        txnId: generatedTxnId,
      });
    }, 1200);
  };

  const dynamicUpiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Test Booking - ${patientName || 'Patient'}`)}`;
  const qrCodeUrl =
    vendorLabSettings?.qrCode1Url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(dynamicUpiUri)}`;

  // When booking is submitted, display the exact Reception Dashboard Token & Invoice Modal
  if (currentStep === 3 && confirmedEntry) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
        <WebsiteTokenReceiptCard
          receipt={{
            tokenNumber: confirmedEntry.tokenNumber || 'TK-101',
            uhid: confirmedEntry.uhid || 'UHID-1001',
            patientName: confirmedEntry.patientName,
            age: confirmedEntry.age,
            gender: confirmedEntry.gender,
            mobile: confirmedEntry.mobile,
            referringDoctor: confirmedEntry.referringDoctor,
            tests: selectedTests.map((t) => ({ name: t.name, price: t.price })),
            totalAmount: confirmedEntry.totalAmount,
            discountINR: confirmedEntry.discountINR || 0,
            paidAmount: confirmedEntry.paidAmount,
            dueAmount: confirmedEntry.dueAmount,
            paymentMode: confirmedEntry.paymentMode,
            paymentStatus: confirmedEntry.paymentStatus,
            registeredAt: confirmedEntry.registeredAt,
            visitType: confirmedEntry.visitType,
            address: confirmedEntry.address,
            timeSlot: confirmedEntry.preferredTimeSlot,
            upiTransactionRef: confirmedEntry.upiTransactionRef,
            labName: labName,
            labPhone: labPhone,
            notes: confirmedEntry.notes,
          }}
          onClose={onClose}
          onBookAnother={() => {
            setCurrentStep(1);
            setConfirmedEntry(null);
            setUpiRefNumber('');
            setPaymentError('');
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#123B6D] via-[#103460] to-[#0F766E] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/15 text-[11px] font-bold text-amber-300 mb-1">
              <span>🌐 Online Test Booking</span>
              <span className="text-white/60">•</span>
              <span>Direct to Reception Desk</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <span>{labName}</span>
            </h2>
            <p className="text-[11px] text-slate-200">
              Book test online & get immediate Token Number for lab reception
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close Booking Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Step Progress Stepper Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs font-bold">
          <div
            className={`flex items-center gap-2 ${
              currentStep === 1 ? 'text-[#123B6D]' : 'text-emerald-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep === 1
                  ? 'bg-[#123B6D] text-white shadow-xs'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </div>
            <span>1. Tests & Patient Info</span>
          </div>

          <div className="w-8 sm:w-16 h-0.5 bg-slate-200" />

          <div
            className={`flex items-center gap-2 ${
              currentStep === 2 ? 'text-[#123B6D]' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep === 2
                  ? 'bg-[#123B6D] text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </div>
            <span>2. Payment (Pay at Spot / Pay via QR)</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* STEP 1: Test Selection & Patient Details */}
          {currentStep === 1 && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              {/* Selected Tests List Box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>🔬 Selected Tests / Packages</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      ({selectedTests.length})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingTest(!isAddingTest)}
                    className="text-[11px] font-bold text-[#123B6D] hover:underline flex items-center gap-1"
                  >
                    <span>+ Add More Tests</span>
                  </button>
                </div>

                {/* Chips of selected tests */}
                <div className="space-y-1.5">
                  {selectedTests.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            t.type === 'package'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-teal-100 text-teal-900'
                          }`}
                        >
                          {t.type === 'package' ? 'PACKAGE' : 'TEST'}
                        </span>
                        <span className="font-bold text-slate-800">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-[#123B6D]">₹{t.price}</span>
                        {selectedTests.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(t.name)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Remove test"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add More Tests Catalog Dropdown Drawer */}
                {isAddingTest && (
                  <div className="bg-white p-3 rounded-lg border border-teal-300 shadow-xs space-y-2 mt-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={testSearch}
                        onChange={(e) => setTestSearch(e.target.value)}
                        placeholder="Search tests (e.g. Thyroid, Lipid, Sugar, KFT, LFT)..."
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100">
                      {/* Packages */}
                      {filteredCatalogPackages.slice(0, 3).map((pkg) => (
                        <div
                          key={pkg.id}
                          className="pt-1 flex items-center justify-between text-xs hover:bg-slate-50 p-1.5 rounded cursor-pointer"
                          onClick={() => handleAddTest(pkg.name, pkg.priceINR, 'package')}
                        >
                          <div>
                            <span className="font-bold text-amber-900">{pkg.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({pkg.testsCount} tests)
                            </span>
                          </div>
                          <span className="font-black text-[#123B6D] bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                            + ₹{pkg.priceINR}
                          </span>
                        </div>
                      ))}

                      {/* Tests */}
                      {filteredCatalogTests.slice(0, 6).map((test) => (
                        <div
                          key={test.id}
                          className="pt-1 flex items-center justify-between text-xs hover:bg-slate-50 p-1.5 rounded cursor-pointer"
                          onClick={() => handleAddTest(test.name, test.priceINR, 'test')}
                        >
                          <div>
                            <span className="font-bold text-slate-800">{test.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({test.category})</span>
                          </div>
                          <span className="font-black text-[#123B6D] bg-teal-50 px-2 py-0.5 rounded text-[11px]">
                            + ₹{test.priceINR}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtotal Banner */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-[#123B6D]">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              {/* Patient Personal Details */}
              <div className="space-y-3">
                <div className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#123B6D]" />
                  <span>Patient Details</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Patient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Verma"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Age <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="115"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['Male', 'Female', 'Other'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 text-[11px] font-bold rounded-lg border transition ${
                            gender === g
                              ? 'bg-[#123B6D] text-white border-[#123B6D]'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      10-Digit Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">+91</span>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full pl-11 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-medium"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Test reports and receipt token will be sent to this WhatsApp number
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Referring Doctor
                    </label>
                    <input
                      type="text"
                      value={referringDoctor}
                      onChange={(e) => setReferringDoctor(e.target.value)}
                      placeholder="Self / Direct Walk-in or Dr. Name"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Visit Type: Walk-in vs Home Collection */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Visit Option
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitType('Walk-in')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      visitType === 'Walk-in'
                        ? 'border-[#123B6D] bg-blue-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg ${
                        visitType === 'Walk-in' ? 'bg-[#123B6D] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 text-xs">Lab Walk-in</div>
                      <div className="text-[10px] text-slate-500">Visit lab reception directly</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisitType('Home Collection')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      visitType === 'Home Collection'
                        ? 'border-[#0F766E] bg-teal-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg ${
                        visitType === 'Home Collection'
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 text-xs">Home Pickup</div>
                      <div className="text-[10px] text-slate-500">Phlebotomist visits home</div>
                    </div>
                  </button>
                </div>

                {/* If Home Collection selected, require Address */}
                {visitType === 'Home Collection' && (
                  <div className="space-y-2 pt-2 bg-teal-50/40 p-3 rounded-xl border border-teal-200">
                    <div>
                      <label className="block text-[11px] font-bold text-teal-900 mb-1">
                        Full Address for Home Sample Collection <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={homeAddress}
                        onChange={(e) => setHomeAddress(e.target.value)}
                        placeholder="House No, Street, Landmark, Area / City"
                        className="w-full px-3 py-2 rounded-lg border border-teal-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-teal-900 mb-1">
                        Preferred Time Slot
                      </label>
                      <select
                        value={preferredSlot}
                        onChange={(e) => setPreferredSlot(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-teal-300 text-xs bg-white focus:outline-none"
                      >
                        <option>Morning: 6:30 AM – 8:30 AM (Fasting Preferred)</option>
                        <option>Morning: 8:30 AM – 10:30 AM</option>
                        <option>Forenoon: 10:30 AM – 1:00 PM</option>
                        <option>Evening: 4:30 PM – 7:00 PM</option>
                        <option>Today Urgent: Within 2 Hours</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button to Step 2 */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-3 rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment Collection (QR Code + UPI ID OR Pay at Branch) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Patient & Tests Quick Summary Header */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-[#172033] text-xs">
                    {patientName} ({age}Y • {gender})
                  </div>
                  <div className="text-[11px] text-slate-500">
                    +91 {mobile} • {selectedTests.length} Test(s) • {visitType}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total Bill</div>
                  <div className="text-base font-black text-[#123B6D]">₹{totalAmount}</div>
                </div>
              </div>

              {/* Choice of Payment: Pay at Spot vs Active Online Payment Method */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Payment Option:
                </label>
                <div className={`grid ${isPayOnSpotAllowed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  {/* Option 1: Pay at Spot (Independent Option) */}
                  {isPayOnSpotAllowed && (
                    <button
                      type="button"
                      onClick={() => setPaymentOption('pay_at_branch')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentOption === 'pay_at_branch'
                          ? 'border-[#123B6D] bg-blue-50/70 ring-2 ring-[#123B6D]/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#123B6D]" />
                          <span>Pay at Spot</span>
                        </span>
                        {paymentOption === 'pay_at_branch' && (
                          <Check className="w-4 h-4 text-[#123B6D]" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Pay with Cash, Card, or UPI upon visit / counter
                      </span>
                    </button>
                  )}

                  {/* Option 2: Active Online Payment Method (Only 1 Online Method is Active) */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('online')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      paymentOption === 'online'
                        ? activeOnlineMethod === 'phonepe'
                          ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-600/20 shadow-xs'
                          : 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        {activeOnlineMethod === 'phonepe' ? (
                          <>
                            <CreditCard className="w-4 h-4 text-purple-700" />
                            <span>Pay via PhonePe</span>
                          </>
                        ) : (
                          <>
                            <QrCode className="w-4 h-4 text-emerald-600" />
                            <span>Pay via QR (UPI)</span>
                          </>
                        )}
                      </span>
                      {paymentOption === 'online' && (
                        <Check className={`w-4 h-4 ${activeOnlineMethod === 'phonepe' ? 'text-purple-700' : 'text-emerald-600'}`} />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {activeOnlineMethod === 'phonepe'
                        ? 'PhonePe Gateway • Instant Automatic Verification'
                        : 'Scan QR / UPI App • UTR & Screenshot submit'}
                    </span>
                  </button>
                </div>
              </div>

              {/* PAYMENT DETAILS: ONLINE METHOD A - PHONEPE GATEWAY */}
              {paymentOption === 'online' && activeOnlineMethod === 'phonepe' && (
                <div className="bg-purple-50/60 border-2 border-purple-300 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                  <div className="flex items-center justify-between w-full pb-2 border-b border-purple-200 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-black text-xs">
                        पे
                      </div>
                      <div>
                        <div className="font-black text-xs text-slate-900">PhonePe Payment Gateway</div>
                        <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>100% Automatic Instant Payment Verification</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-purple-900">₹{totalAmount}</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-purple-200 w-full text-left space-y-2 text-slate-700">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950">
                      <Sparkles className="w-4 h-4 text-purple-700" />
                      <span>Direct Gateway Flow:</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Click below to open <strong>PhonePe Payment Gateway</strong>. Pay seamlessly using PhonePe UPI, any Debit/Credit Card, or NetBanking. Once completed, your payment is <strong>automatically verified in real time</strong> with no manual UTR entry needed.
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[10px] font-semibold text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">PhonePe UPI</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Visa / Mastercard / RuPay</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Net Banking</span>
                    </div>
                  </div>

                  {/* Pay with PhonePe Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsPhonePeModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98"
                  >
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>Pay ₹{totalAmount} via PhonePe Gateway</span>
                  </button>
                </div>
              )}

              {/* PAYMENT DETAILS: ONLINE METHOD B - MANUAL UPI (Default Shop URL or Custom Domain + Manual UPI) */}
              {paymentOption === 'online' && activeOnlineMethod === 'manual_upi' && (
                <div className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                  <div className="flex items-center justify-between w-full pb-2 border-b border-slate-200 text-left">
                    <div>
                      <div className="font-black text-xs text-slate-800">{merchantName}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">
                        Official Verified Lab UPI QR (Manual Verification)
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-800">₹{totalAmount}</span>
                    </div>
                  </div>

                  {/* QR Image */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <img
                      src={qrCodeUrl}
                      alt="UPI Payment QR Code"
                      className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                    />
                  </div>

                  {/* Mobile Direct Pay Button & Download QR Button */}
                  <div className="flex items-center gap-2 w-full">
                    <a
                      href={dynamicUpiUri}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                      title="Open UPI App directly (GPay/PhonePe/Paytm)"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Pay via UPI App</span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = qrCodeUrl;
                        link.download = `UPI-QR-${merchantName.replace(/\s+/g, '-')}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      title="Download QR code to phone gallery"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download QR</span>
                    </button>
                  </div>

                  {/* 1-Click Copy UPI Bar */}
                  <div className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="text-left min-w-0">
                      <div className="text-[10px] font-bold text-slate-400">LAB UPI ID:</div>
                      <div className="font-mono font-bold text-slate-800 text-xs truncate">
                        {upiId}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(upiId);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2500);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center gap-1 transition shrink-0 cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy UPI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 12-Digit UTR Input (Required) */}
                  <div className="w-full text-left pt-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      12-Digit UPI Reference / UTR Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={upiRefNumber}
                      onChange={(e) => {
                        setUpiRefNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                        if (paymentError) setPaymentError('');
                      }}
                      placeholder="e.g. 523412345678 (From Payment App Screen)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono font-bold text-slate-900"
                    />
                  </div>

                  {/* Attach Screenshot Input */}
                  <div className="w-full text-left">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Payment Screenshot / Slip
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{screenshotPreview ? 'Change Slip' : 'Upload Slip / Photo'}</span>
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />

                    {screenshotPreview ? (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot Proof"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-300"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-emerald-950 block truncate">
                            Payment Screenshot Attached
                          </span>
                          <span className="text-[10px] text-emerald-700">Ready for vendor verification</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setScreenshotPreview('')}
                          className="text-rose-500 hover:text-rose-700 p-1 font-bold text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-2.5 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-xl text-center text-xs text-slate-500 font-semibold cursor-pointer transition flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>Click to attach payment screenshot proof</span>
                      </button>
                    )}

                    <p className="text-[10px] text-slate-500 mt-1">
                      ✓ UTR + Screenshot submit hone ke baad Vendor manually payment verify karega.
                    </p>
                  </div>
                </div>
              )}

              {/* PAYMENT DETAILS: OPTION PAY AT SPOT */}
              {paymentOption === 'pay_at_branch' && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 text-[#123B6D] shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#123B6D] text-sm">
                        Pay ₹{totalAmount} at Lab Reception Counter / Spot
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        No advance online payment required. You can pay via Cash, Card, or UPI directly at the laboratory counter or during sample pickup upon arrival.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Your booking is immediately registered at the reception desk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Instant priority queue token generated — no waiting in line</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Collect your printed receipt at the counter</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message Display if any */}
              {paymentError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Bottom Buttons: Back & Final Confirm */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                    paymentOption === 'online'
                      ? activeOnlineMethod === 'phonepe'
                        ? 'bg-purple-700 hover:bg-purple-800 text-white'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-[#123B6D] hover:bg-[#0c284b] text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <span>Registering Booking...</span>
                  ) : paymentOption === 'online' ? (
                    activeOnlineMethod === 'phonepe' ? (
                      <>
                        <CreditCard className="w-4 h-4 text-amber-300" />
                        <span>Pay ₹{totalAmount} via PhonePe (Auto-Verify)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        <span>Confirm Booking & Generate Token (Paid ₹{totalAmount} via QR)</span>
                      </>
                    )
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 text-amber-300" />
                      <span>Confirm Booking & Generate Token (Pay ₹{totalAmount} at Spot)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PHONEPE PAYMENT GATEWAY MODAL SIMULATION */}
        {isPhonePeModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => !phonePeProcessing && setIsPhonePeModalOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-purple-200 text-slate-800 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* PhonePe Header */}
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    पे
                  </div>
                  <div>
                    <div className="font-black text-xs text-purple-950">PhonePe Payment Gateway</div>
                    <div className="text-[10px] text-slate-400 font-mono">Verified Merchant</div>
                  </div>
                </div>
                {!phonePeProcessing && (
                  <button
                    type="button"
                    onClick={() => setIsPhonePeModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Amount Box */}
              <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">
                  Amount to Pay
                </span>
                <span className="text-2xl font-black text-purple-950 font-mono">
                  ₹{totalAmount}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Order for: {patientName} ({selectedTests.length} Tests)
                </span>
              </div>

              {/* Choose Payment Mode in PhonePe */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Select Payment Option:
                </span>

                {/* Option 1: PhonePe UPI */}
                <button
                  type="button"
                  onClick={() => setPhonePeMethod('upi')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    phonePeMethod === 'upi'
                      ? 'border-purple-600 bg-purple-50/80 shadow-2xs font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-700" />
                    <div>
                      <div className="text-xs text-slate-800">PhonePe UPI / App</div>
                      <div className="text-[10px] text-slate-400">Instant approval from PhonePe App</div>
                    </div>
                  </div>
                  {phonePeMethod === 'upi' && <Check className="w-4 h-4 text-purple-700" />}
                </button>

                {/* Option 2: Debit/Credit Card */}
                <button
                  type="button"
                  onClick={() => setPhonePeMethod('card')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    phonePeMethod === 'card'
                      ? 'border-purple-600 bg-purple-50/80 shadow-2xs font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-700" />
                    <div>
                      <div className="text-xs text-slate-800">Debit / Credit Card</div>
                      <div className="text-[10px] text-slate-400">Visa, Mastercard, RuPay</div>
                    </div>
                  </div>
                  {phonePeMethod === 'card' && <Check className="w-4 h-4 text-purple-700" />}
                </button>

                {/* Option 3: NetBanking */}
                <button
                  type="button"
                  onClick={() => setPhonePeMethod('netbanking')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    phonePeMethod === 'netbanking'
                      ? 'border-purple-600 bg-purple-50/80 shadow-2xs font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-700" />
                    <div>
                      <div className="text-xs text-slate-800">Net Banking</div>
                      <div className="text-[10px] text-slate-400">All Indian Banks Supported</div>
                    </div>
                  </div>
                  {phonePeMethod === 'netbanking' && <Check className="w-4 h-4 text-purple-700" />}
                </button>
              </div>

              {/* Complete Payment Button */}
              <button
                type="button"
                disabled={phonePeProcessing}
                onClick={handlePhonePeSuccess}
                className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {phonePeProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying with PhonePe...</span>
                  </span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Authorize & Pay ₹{totalAmount}</span>
                  </>
                )}
              </button>

              <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>256-bit SSL Encrypted • PhonePe PG Direct</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
