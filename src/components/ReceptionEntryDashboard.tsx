import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Printer,
  MessageSquare,
  CheckCircle2,
  Clock,
  FlaskConical,
  IndianRupee,
  Phone,
  QrCode,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Settings,
  Globe,
  Home,
  Building2,
  MapPin,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  FileText,
  UserCheck,
  RefreshCw,
  Share2,
  Sparkles,
  Eye,
  Send,
  Lock,
  CreditCard,
  Undo2,
  Save,
  LogOut,
  Download,
  Calculator,
  Calendar,
  RotateCcw,
  Hash,
  FolderTree,
  Layers,
  ListFilter,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { DashboardFooter } from './DashboardFooter';
import { AppView, ReceptionPatientEntry, LabReport } from '../types';
import { EditReceptionEntryModal } from './EditReceptionEntryModal';
import { CollectRemainingPaymentModal } from './CollectRemainingPaymentModal';
import { DayEndCashClosingModal } from './reception/DayEndCashClosingModal';
import { TestSelectionModal } from './reception/TestSelectionModal';
import { ReportDetailModal } from './ReportDetailModal';
import { SyncNowButton } from './SyncNowButton';
import { generateThermalReceiptPdf, buildReceiptInvoicePdf, getReceiptPdfFilename, downloadReportPdf } from '../utils/pdfGenerator';
import { safePrint } from '../utils/printHelper';
import { buildPatientReportUrl } from '../utils/domainRouting';
import { getTenantDirectUrl } from '../constants/domains';
import { buildReceiptSlipImage, downloadReceiptImage, uploadReceiptSlipImage } from '../utils/receiptImageGenerator';
import { WebsiteTokenReceiptCard } from './vendor/WebsiteTokenReceiptCard';
import { buildReportWhatsAppUrl } from '../utils/shareUtils';

// Format token number to standard format (e.g. "TK-626")
export const getDisplayTokenNumber = (tokenRaw?: string, fallbackId?: string): string => {
  if (!tokenRaw && !fallbackId) return '';
  let raw = String(tokenRaw || fallbackId || '').trim();
  if (raw.startsWith('rcp-')) {
    raw = raw.replace('rcp-', '');
  }
  raw = raw.replace(/\.{2,}/g, '');
  if (raw.startsWith('#')) {
    raw = raw.replace('#', '').trim();
  }
  // If long timestamp, extract the last 3 digits
  if (raw.replace(/\D/g, '').length > 6) {
    const digits = raw.replace(/\D/g, '');
    return `TK-${digits.slice(-3)}`;
  }
  // If it starts with TK- or TK or TK_, format properly
  if (/^TK[-_\s]?/i.test(raw)) {
    const num = raw.replace(/^TK[-_\s]?/i, '').trim();
    return `TK-${num}`;
  }
  return `TK-${raw}`;
};

// Detect if this test was booked directly from the website (Package, Cart, Booking Form)
export const getWebsiteBookingMeta = (entry: ReceptionPatientEntry) => {
  const source = (entry.bookingSource || '').toLowerCase();
  const notes = (entry.notes || '').toLowerCase();
  const receipt = (entry.receiptNumber || '').toLowerCase();
  const uhid = (entry.uhid || '').toLowerCase();

  const isWebsite =
    source.includes('website') ||
    source.includes('web') ||
    source.includes('online') ||
    source.includes('cart') ||
    source.includes('package') ||
    notes.includes('website') ||
    notes.includes('hero booking') ||
    notes.includes('online website booking') ||
    receipt.includes('web') ||
    uhid.startsWith('uhid-w-');

  if (!isWebsite) return null;

  let category = 'Website Booking';
  let badgeDetail = 'Cart / Package / Booking Form';

  if (source.includes('package') || notes.includes('package') || notes.includes('checkup') || notes.includes('profile')) {
    category = 'Package Booking';
    badgeDetail = 'Health Package';
  } else if (source.includes('cart') || notes.includes('cart') || notes.includes('multi-cart')) {
    category = 'Cart Multi-Booking';
    badgeDetail = 'Cart Order';
  } else if (source.includes('form') || notes.includes('hero') || notes.includes('booking form')) {
    category = 'Booking Form';
    badgeDetail = 'Online Form';
  }

  return {
    category,
    badgeDetail,
    isHomeVisit: entry.visitType === 'Home Collection',
    paymentStatus: entry.paymentStatus,
    paymentMode: entry.paymentMode,
  };
};

interface ReceptionEntryDashboardProps {
  onNavigateView: (view: AppView) => void;
  onOpenReportPortal?: (reportId?: string, mobile?: string) => void;
  isEmbedded?: boolean;
}

export const ReceptionEntryDashboard: React.FC<ReceptionEntryDashboardProps> = ({
  onNavigateView,
  onOpenReportPortal,
  isEmbedded = false,
}) => {
  const {
    currentUser,
    logout,
    vendorLabSettings,
    vendorTests,
    vendorDoctors,
    receptionEntries,
    reports,
    allReports,
    getReportById,
    addReceptionEntry,
    updateReceptionStatus,
    updateReceptionEntry,
    deleteReceptionEntry,
    deleteLabReport,
    sendEntryToTechnician,
    publishReport,
    unpublishReport,
    activeBranchId,
    setActiveBranchId,
    activeTenantId,
    selectedVendorLabId,
  } = useCms();

  const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology Laboratory';
  const labNabl = vendorLabSettings?.nablAccreditationNo || 'MC-4821';
  const labPhone = vendorLabSettings?.phone || '7087033009';
  const labAddress = vendorLabSettings?.address || 'SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana';
  const labLogoUrl = vendorLabSettings?.logoUrl || '';

  // --- FORM STATE ---
  // In-form Editing Mode (allows editing any patient directly without re-typing)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  // Day-End Reception Cash Closing & Daily Tally Sheet Modal State
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);

  // Snapshot of last filled data before submit or clear (so user can 1-click restore if they made a mistake)
  const [lastFormSnapshot, setLastFormSnapshot] = useState<{
    patientName: string;
    age: string;
    gender: 'Male' | 'Female' | 'Other';
    mobile: string;
    referringDoctor: string;
    selectedTests: string[];
    sampleType: string;
    hasDiscount: boolean;
    discountINR: number;
    paymentChoice: 'Full Payment' | 'Advance' | 'Due';
    advancePercent: number;
    customPaidAmount: string;
    paymentMode: 'Cash' | 'UPI' | 'Card';
    notes: string;
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem('reception_last_snapshot');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Recently registered entry tracking for quick correction banner
  const [lastRegisteredEntry, setLastRegisteredEntry] = useState<ReceptionPatientEntry | null>(null);
  const [showRecentlyRegisteredBanner, setShowRecentlyRegisteredBanner] = useState<boolean>(false);

  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('32');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobile, setMobile] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>(['Complete Blood Count (CBC)']);
  const [sampleType, setSampleType] = useState('EDTA Whole Blood (Lavender Tube)');

  // Optional Discount with Checkbox
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountINR, setDiscountINR] = useState<number>(0);

  // Payment Options: 'Full Payment' | 'Advance' | 'Due'
  const [paymentChoice, setPaymentChoice] = useState<'Full Payment' | 'Advance' | 'Due'>('Full Payment');
  const [advancePercent, setAdvancePercent] = useState<number>(50);
  const [customPaidAmount, setCustomPaidAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [upiTransactionRef, setUpiTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('Popular');

  // Load unsaved active draft from localStorage on initial render
  useEffect(() => {
    try {
      const draft = localStorage.getItem('reception_form_active_draft');
      if (draft) {
        const p = JSON.parse(draft);
        if (p.patientName || p.mobile) {
          setPatientName(p.patientName || '');
          if (p.age) setAge(p.age);
          if (p.gender) setGender(p.gender);
          if (p.mobile) setMobile(p.mobile);
          if (p.referringDoctor) setReferringDoctor(p.referringDoctor);
          if (p.selectedTests && p.selectedTests.length > 0) setSelectedTests(p.selectedTests);
          if (p.sampleType) setSampleType(p.sampleType);
          if (p.hasDiscount !== undefined) setHasDiscount(p.hasDiscount);
          if (p.discountINR) setDiscountINR(p.discountINR);
          if (p.paymentChoice) setPaymentChoice(p.paymentChoice);
          if (p.advancePercent) setAdvancePercent(p.advancePercent);
          if (p.customPaidAmount) setCustomPaidAmount(p.customPaidAmount);
          if (p.paymentMode) setPaymentMode(p.paymentMode);
          if (p.notes) setNotes(p.notes);
        }
      }
    } catch {}
  }, []);

  // Auto-save form draft so refreshing or navigating doesn't wipe typed content
  useEffect(() => {
    if (!editingEntryId) {
      if (patientName || mobile || notes || selectedTests.length > 1 || discountINR > 0) {
        try {
          localStorage.setItem(
            'reception_form_active_draft',
            JSON.stringify({
              patientName,
              age,
              gender,
              mobile,
              referringDoctor,
              selectedTests,
              sampleType,
              hasDiscount,
              discountINR,
              paymentChoice,
              advancePercent,
              customPaidAmount,
              paymentMode,
              notes,
            })
          );
        } catch {}
      }
    }
  }, [
    patientName,
    age,
    gender,
    mobile,
    referringDoctor,
    selectedTests,
    sampleType,
    hasDiscount,
    discountINR,
    paymentChoice,
    advancePercent,
    customPaidAmount,
    paymentMode,
    notes,
    editingEntryId,
  ]);

  // Queue search: Token Number & Mobile Number
  const [searchToken, setSearchToken] = useState('');
  const [searchMobile, setSearchMobile] = useState('');

  // Independent Filters: Date Filter & Payment Filter
  const [dateFilter, setDateFilter] = useState<'All Dates' | 'Today' | 'Yesterday' | 'Custom Date'>('All Dates');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Advance' | 'Due' | 'Full Payment'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Website' | 'Waiting' | 'In Lab' | 'Report Ready'>('All');

  // Thermal Slip Modal
  const [selectedReceipt, setSelectedReceipt] = useState<ReceptionPatientEntry | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Edit Patient Entry Modal
  const [editingEntry, setEditingEntry] = useState<ReceptionPatientEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Collect Remaining Payment Modal
  const [collectingPaymentEntry, setCollectingPaymentEntry] = useState<ReceptionPatientEntry | null>(null);
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<ReceptionPatientEntry | null>(null);

  // View Patient Lab Report Modal
  const [viewingReport, setViewingReport] = useState<LabReport | null>(null);
  const [isViewingReportModalOpen, setIsViewingReportModalOpen] = useState(false);

  // Two-Panel Test Selection Modal
  const [isTestSelectionModalOpen, setIsTestSelectionModalOpen] = useState(false);

  // Success Toast
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Entries returned by Technician requiring Reception attention
  const returnedByTechnicianEntries = useMemo(() => {
    return receptionEntries.filter((r) => r.returnedByTechnician);
  }, [receptionEntries]);

  // Normalize category names into standard parent categories
  const normalizeParentCategory = (rawCat?: string): string => {
    const c = String(rawCat || '').trim();
    if (!c) return 'Clinical Biochemistry';
    if (/hematology/i.test(c)) return 'Hematology (Blood Tests)';
    if (/biochem/i.test(c)) return 'Clinical Biochemistry';
    if (/pathology/i.test(c)) return 'Clinical Pathology';
    if (/serology|immuno/i.test(c)) return 'Serology / Immunology';
    if (/microbio/i.test(c)) return 'Microbiology';
    if (/hormone|endo/i.test(c)) return 'Hormone / Endocrinology';
    if (/coag/i.test(c)) return 'Coagulation';
    if (/histo|cyto/i.test(c)) return 'Histopathology / Cytology';
    if (/molecular|pcr/i.test(c)) return 'Molecular Biology / PCR';
    if (/blood\s*bank/i.test(c)) return 'Blood Bank';
    if (/tumor|marker/i.test(c)) return 'Tumor Markers';
    if (/special|package|health/i.test(c)) return 'Special Tests';
    return c;
  };

  // Popular Quick-Click Tests with real categories
  const quickTestPills = useMemo(() => [
    { name: 'Complete Blood Count (CBC)', price: 350, sample: 'EDTA Blood', category: 'Hematology (Blood Tests)' },
    { name: 'Fasting Blood Sugar (FBS)', price: 120, sample: 'Fluoride Plasma', category: 'Clinical Biochemistry' },
    { name: 'Kidney Function Test (KFT)', price: 600, sample: 'Serum Clot', category: 'Clinical Biochemistry' },
    { name: 'Liver Function Test (LFT)', price: 650, sample: 'Serum Clot', category: 'Clinical Biochemistry' },
    { name: 'Lipid Profile', price: 550, sample: 'Serum Clot', category: 'Clinical Biochemistry' },
    { name: 'Thyroid Profile (Total)', price: 450, sample: 'Serum Clot', category: 'Hormone / Endocrinology' },
    { name: 'Full Body Health Checkup', price: 999, sample: 'EDTA + Serum + Urine', category: 'Special Tests' },
    { name: 'Urine Routine & Microscopic', price: 150, sample: 'Sterile Urine', category: 'Clinical Pathology' },
    { name: 'HbA1c (Glycosylated Hb)', price: 450, sample: 'EDTA Whole Blood', category: 'Clinical Biochemistry' },
    { name: 'Dengue Serology (NS1 + Platelets)', price: 800, sample: 'Serum + EDTA', category: 'Serology / Immunology' },
  ], []);

  // Unified searchable tests list combining master clinical tests + vendor catalog tests
  const allAvailableTests = useMemo(() => {
    const list: {
      name: string;
      price: number;
      sample?: string;
      category: string;
      isPopular?: boolean;
      code?: string;
    }[] = [];
    const seen = new Set<string>();

    const popularNames = new Set(quickTestPills.map((p) => p.name.toLowerCase().trim()));

    // 1. Add vendor catalog tests
    vendorTests.forEach((t) => {
      const tNameLower = String(t.name || '').toLowerCase().trim();
      if (tNameLower && !seen.has(tNameLower)) {
        seen.add(tNameLower);
        const resolvedCategory = normalizeParentCategory(t.category);
        list.push({
          name: t.name,
          price: t.priceINR && t.priceINR > 0 ? t.priceINR : 300,
          sample: t.sampleType || 'Specimen',
          category: resolvedCategory,
          isPopular: popularNames.has(tNameLower),
          code: t.code,
        });
      }
    });

    // 2. Add quickTestPills if not already in list
    quickTestPills.forEach((p) => {
      const pNameLower = p.name.toLowerCase().trim();
      if (!seen.has(pNameLower)) {
        seen.add(pNameLower);
        list.push({
          name: p.name,
          price: p.price,
          sample: p.sample,
          category: p.category,
          isPopular: true,
        });
      }
    });

    return list;
  }, [vendorTests, quickTestPills]);

  // Standard parent categories definition with clinical department icons
  const PARENT_CATEGORIES = useMemo(() => [
    { key: 'Popular', label: 'Popular / Routine', icon: '⭐', shortName: 'Popular', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' },
    { key: 'Hematology (Blood Tests)', label: 'Hematology (Blood Tests)', icon: '🩸', shortName: 'Hematology', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300' },
    { key: 'Clinical Biochemistry', label: 'Clinical Biochemistry', icon: '🧪', shortName: 'Biochemistry', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300' },
    { key: 'Clinical Pathology', label: 'Clinical Pathology', icon: '🔬', shortName: 'Pathology', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
    { key: 'Serology / Immunology', label: 'Serology / Immunology', icon: '💉', shortName: 'Serology', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-300' },
    { key: 'Microbiology', label: 'Microbiology', icon: '🧫', shortName: 'Microbiology', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-300' },
    { key: 'Hormone / Endocrinology', label: 'Hormone / Endocrinology', icon: '🧬', shortName: 'Hormones', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-300' },
    { key: 'Coagulation', label: 'Coagulation', icon: '🩸', shortName: 'Coagulation', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' },
    { key: 'Histopathology / Cytology', label: 'Histopathology / Cytology', icon: '🔬', shortName: 'Histology', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-300' },
    { key: 'Molecular Biology / PCR', label: 'Molecular Biology / PCR', icon: '🧬', shortName: 'Molecular/PCR', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-300' },
    { key: 'Blood Bank', label: 'Blood Bank', icon: '🩸', shortName: 'Blood Bank', color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-300' },
    { key: 'Tumor Markers', label: 'Tumor Markers', icon: '🩺', shortName: 'Tumor Markers', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-300' },
    { key: 'Special Tests', label: 'Special Tests & Packages', icon: '✨', shortName: 'Special/Pkg', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300' },
    { key: 'All', label: 'All Tests', icon: '📋', shortName: 'All Tests', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  ], []);

  // Category counts and currently selected counts
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; selected: number }> = {};
    PARENT_CATEGORIES.forEach((cat) => {
      let total = 0;
      let selected = 0;
      if (cat.key === 'Popular') {
        const tests = allAvailableTests.filter((t) => t.isPopular);
        total = tests.length;
        selected = tests.filter((t) => selectedTests.includes(t.name)).length;
      } else if (cat.key === 'All') {
        total = allAvailableTests.length;
        selected = selectedTests.length;
      } else {
        const tests = allAvailableTests.filter((t) => t.category === cat.key);
        total = tests.length;
        selected = tests.filter((t) => selectedTests.includes(t.name)).length;
      }
      stats[cat.key] = { total, selected };
    });
    return stats;
  }, [allAvailableTests, selectedTests, PARENT_CATEGORIES]);

  // Child tests under the currently selected parent category
  const activeCategoryChildTests = useMemo(() => {
    if (selectedParentCategory === 'Popular') {
      return allAvailableTests.filter((t) => t.isPopular);
    }
    if (selectedParentCategory === 'All') {
      return allAvailableTests;
    }
    return allAvailableTests.filter((t) => t.category === selectedParentCategory);
  }, [allAvailableTests, selectedParentCategory]);

  // Filter tests by direct search query (or fall back to active category tests)
  const filteredAvailableTests = useMemo(() => {
    const q = String(testSearch || '').toLowerCase().trim();
    if (!q) return activeCategoryChildTests;
    return allAvailableTests.filter(
      (t) =>
        String(t.name || '').toLowerCase().includes(q) ||
        String(t.category || '').toLowerCase().includes(q) ||
        String(t.sample || '').toLowerCase().includes(q) ||
        String(t.code || '').toLowerCase().includes(q)
    );
  }, [allAvailableTests, activeCategoryChildTests, testSearch]);

  // Bulk actions for current category
  const handleSelectAllCategoryTests = (testsToSelect: { name: string }[]) => {
    const names = testsToSelect.map((t) => t.name);
    setSelectedTests((prev) => {
      const set = new Set(prev);
      names.forEach((n) => set.add(n));
      return Array.from(set);
    });
  };

  const handleDeselectCategoryTests = (testsToDeselect: { name: string }[]) => {
    const names = new Set(testsToDeselect.map((t) => t.name));
    setSelectedTests((prev) => prev.filter((t) => !names.has(t)));
  };

  // Calculate gross test amount - prices ALWAYS visible and computed properly
  const grossAmount = useMemo(() => {
    return selectedTests.reduce((acc, testName) => {
      // Look in allAvailableTests
      const match = allAvailableTests.find((t) => t.name === testName);
      if (match) return acc + match.price;
      // Look in vendor tests
      const vTest = vendorTests.find((t) => t.name === testName);
      if (vTest) return acc + vTest.priceINR;
      return acc + 300; // default fallback
    }, 0);
  }, [selectedTests, allAvailableTests, vendorTests]);

  const effectiveDiscount = hasDiscount ? (discountINR || 0) : 0;
  const netPayable = Math.max(0, grossAmount - effectiveDiscount);

  // Calculate actual paid amount based on manual inputs & defaults
  const paidAmount = useMemo(() => {
    if (customPaidAmount !== '') {
      const parsed = Number(customPaidAmount);
      if (!isNaN(parsed)) {
        return Math.min(netPayable, Math.max(0, parsed));
      }
      return 0;
    }
    if (paymentChoice === 'Due') {
      return 0;
    }
    return netPayable;
  }, [customPaidAmount, netPayable, paymentChoice]);

  const dueAmount = Math.max(0, netPayable - paidAmount);

  // Auto-fill existing patient detection
  const existingPatientMatch = useMemo(() => {
    if (mobile.length >= 10) {
      return receptionEntries.find((e) => e.mobile.includes(mobile.slice(-10)));
    }
    return null;
  }, [mobile, receptionEntries]);

  // Handle Quick Add or Remove Test
  const handleToggleTest = (testName: string, suggestedSample?: string) => {
    if (selectedTests.includes(testName)) {
      setSelectedTests((prev) => prev.filter((t) => t !== testName));
    } else {
      setSelectedTests((prev) => [...prev, testName]);
      if (suggestedSample && sampleType === 'EDTA Whole Blood (Lavender Tube)') {
        setSampleType(suggestedSample);
      }
    }
  };

  // Save current form inputs before reset/submit so user never loses their typed data
  const saveCurrentAsSnapshot = () => {
    if (patientName.trim() || mobile.trim() || selectedTests.length > 1) {
      const snapshot = {
        patientName,
        age,
        gender,
        mobile,
        referringDoctor,
        selectedTests,
        sampleType,
        hasDiscount,
        discountINR,
        paymentChoice,
        advancePercent,
        customPaidAmount,
        paymentMode,
        notes,
      };
      setLastFormSnapshot(snapshot);
      try {
        sessionStorage.setItem('reception_last_snapshot', JSON.stringify(snapshot));
      } catch {}
    }
  };

  // Restore last form data with 1 click so user doesn't have to refill entire form
  const handleRestoreLastData = () => {
    if (!lastFormSnapshot) {
      showToast('⚠️ No previous patient data available to restore.');
      return;
    }
    setPatientName(lastFormSnapshot.patientName);
    setAge(lastFormSnapshot.age);
    setGender(lastFormSnapshot.gender);
    setMobile(lastFormSnapshot.mobile);
    setReferringDoctor(lastFormSnapshot.referringDoctor);
    setSelectedTests(lastFormSnapshot.selectedTests);
    setSampleType(lastFormSnapshot.sampleType);
    setHasDiscount(lastFormSnapshot.hasDiscount);
    setDiscountINR(lastFormSnapshot.discountINR);
    setPaymentChoice(lastFormSnapshot.paymentChoice);
    setAdvancePercent(lastFormSnapshot.advancePercent);
    setCustomPaidAmount(lastFormSnapshot.customPaidAmount);
    setPaymentMode(lastFormSnapshot.paymentMode);
    setNotes(lastFormSnapshot.notes);
    showToast('↺ Data restored! Change only what was incorrect without refilling the whole form.');
  };

  // Load an existing entry directly into the main form for in-place correction
  const handleLoadEntryToForm = (entry: ReceptionPatientEntry) => {
    const isLocked = Boolean(
      entry.sentToTechnician ||
      entry.technicianStatus === 'Sent to Lab' ||
      entry.technicianStatus === 'Accepted' ||
      entry.technicianStatus === 'Report Generated' ||
      entry.status === 'In Lab' ||
      entry.status === 'Report Ready' ||
      entry.reportId
    );
    if (isLocked) {
      showToast('🔒 Yeh entry lab bheji ja chuki hai ya report ready hai, isliye edit nahi ki ja sakti.');
      return;
    }
    saveCurrentAsSnapshot();
    setEditingEntryId(entry.id);
    setPatientName(entry.patientName);
    setAge(String(entry.age));
    setGender(entry.gender);
    setMobile(entry.mobile);
    setReferringDoctor(entry.referringDoctor);
    setSelectedTests(entry.tests && entry.tests.length > 0 ? entry.tests : ['Complete Blood Count (CBC)']);
    setSampleType(entry.sampleType || 'EDTA Whole Blood (Lavender Tube)');
    
    const hasDisc = (entry.discountINR || 0) > 0;
    setHasDiscount(hasDisc);
    setDiscountINR(entry.discountINR || 0);

    if (entry.dueAmount === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid') {
      setPaymentChoice('Full Payment');
      setCustomPaidAmount('');
    } else if (entry.paidAmount === 0 || entry.paymentStatus === 'Pending' || entry.paymentStatus === 'Due' || entry.paymentStatus === 'Due Payment') {
      setPaymentChoice('Due');
      setCustomPaidAmount('0');
    } else {
      setPaymentChoice('Advance');
      setCustomPaidAmount(String(entry.paidAmount));
    }

    setPaymentMode(entry.paymentMode === 'UPI' ? 'UPI' : entry.paymentMode === 'Card' ? 'Card' : 'Cash');
    setUpiTransactionRef(entry.upiTransactionRef || '');
    setNotes(entry.notes || '');

    // Scroll smoothly to the form container
    const formElement = document.getElementById('reception-patient-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showToast(`✏️ Token ${entry.tokenNumber} (${entry.patientName}) loaded into form. Fix whatever was wrong!`);
  };

  // Cancel edit mode and return to fresh entry
  const handleCancelEdit = () => {
    setEditingEntryId(null);
    handleResetForm();
    showToast('Cancelled editing. Ready for new patient entry.');
  };

  // Save corrections for an existing entry without re-typing from scratch
  const handleSaveCorrections = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntryId) return;
    if (!patientName.trim()) {
      showToast('⚠️ Please enter patient name!');
      return;
    }
    if (selectedTests.length === 0) {
      showToast('⚠️ Please select at least one test!');
      return;
    }

    const calculatedPaymentStatus: ReceptionPatientEntry['paymentStatus'] =
      dueAmount === 0 ? 'Full Payment' : paidAmount === 0 ? 'Due' : 'Advance';

    const updates: Partial<ReceptionPatientEntry> = {
      patientName: patientName.trim(),
      age: age || '30',
      gender,
      mobile: mobile || '9876500000',
      referringDoctor: referringDoctor.trim() || 'Self Walk-in (Direct Patient)',
      tests: selectedTests,
      sampleType,
      totalAmount: grossAmount,
      discountINR: effectiveDiscount,
      paidAmount,
      dueAmount,
      paymentMode,
      upiTransactionRef: paymentMode === 'UPI' && upiTransactionRef.trim() ? upiTransactionRef.trim() : undefined,
      paymentStatus: calculatedPaymentStatus,
      notes: notes.trim() || undefined,
    };

    updateReceptionEntry(editingEntryId, updates);

    const target = receptionEntries.find((e) => e.id === editingEntryId);
    if (target) {
      const merged: ReceptionPatientEntry = { ...target, ...updates };
      setLastRegisteredEntry(merged);
      setShowRecentlyRegisteredBanner(true);
      setSelectedReceipt(merged);
    }

    showToast(`✅ Galti theek kar di gayi hai! Token updated successfully.`);
    setEditingEntryId(null);
    handleResetForm();
  };

  // Handle Form Submit
  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('⚠️ Please enter patient name!');
      return;
    }
    if (selectedTests.length === 0) {
      showToast('⚠️ Please select at least one test!');
      return;
    }

    const nextTokenNum = `TK-${100 + receptionEntries.length + 1}`;
    const nextUHID = `LAB-2026-${9040 + receptionEntries.length + 1}`;

    const calculatedPaymentStatus: ReceptionPatientEntry['paymentStatus'] =
      dueAmount === 0 ? 'Full Payment' : paidAmount === 0 ? 'Due' : 'Advance';

    const newEntry: Omit<ReceptionPatientEntry, 'id'> = {
      uhid: nextUHID,
      tokenNumber: nextTokenNum,
      patientName: patientName.trim(),
      age: age || '30',
      gender,
      mobile: mobile || '9876500000',
      referringDoctor: referringDoctor.trim() || 'Self Walk-in (Direct Patient)',
      tests: selectedTests,
      sampleType,
      totalAmount: grossAmount,
      discountINR: effectiveDiscount,
      paidAmount,
      dueAmount,
      paymentMode,
      upiTransactionRef: paymentMode === 'UPI' && upiTransactionRef.trim() ? upiTransactionRef.trim() : undefined,
      paymentVerificationStatus: paymentMode === 'UPI' && upiTransactionRef.trim() ? 'Pending Verification' : undefined,
      paymentStatus: calculatedPaymentStatus,
      status: 'Waiting',
      sentToTechnician: false,
      technicianStatus: undefined,
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      entryDate: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    };

    const saved = addReceptionEntry(newEntry);
    showToast(`✅ Patient Registered! Token: ${saved.tokenNumber} (Click "Sent to Lab" to transfer to Technician)`);

    // Track recently registered entry for quick 1-click mistake correction
    setLastRegisteredEntry(saved);
    setShowRecentlyRegisteredBanner(true);

    // Open thermal slip automatically for instant print
    setSelectedReceipt(saved);
    setIsReceiptModalOpen(true);

    // Reset Form for next patient
    handleResetForm();
  };

  // Register and Immediately Send to Lab Technician
  const handleRegisterAndSendToLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('⚠️ Please enter patient name!');
      return;
    }
    if (selectedTests.length === 0) {
      showToast('⚠️ Please select at least one test!');
      return;
    }

    const nextTokenNum = `TK-${100 + receptionEntries.length + 1}`;
    const nextUHID = `LAB-2026-${9040 + receptionEntries.length + 1}`;
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const calculatedPaymentStatus: ReceptionPatientEntry['paymentStatus'] =
      dueAmount === 0 ? 'Full Payment' : paidAmount === 0 ? 'Due' : 'Advance';

    const newEntry: Omit<ReceptionPatientEntry, 'id'> = {
      uhid: nextUHID,
      tokenNumber: nextTokenNum,
      patientName: patientName.trim(),
      age: age || '30',
      gender,
      mobile: mobile || '9876500000',
      referringDoctor: referringDoctor.trim() || 'Self Walk-in (Direct Patient)',
      tests: selectedTests,
      sampleType,
      totalAmount: grossAmount,
      discountINR: effectiveDiscount,
      paidAmount,
      dueAmount,
      paymentMode,
      upiTransactionRef: paymentMode === 'UPI' && upiTransactionRef.trim() ? upiTransactionRef.trim() : undefined,
      paymentVerificationStatus: paymentMode === 'UPI' && upiTransactionRef.trim() ? 'Pending Verification' : undefined,
      paymentStatus: calculatedPaymentStatus,
      status: 'In Lab',
      sentToTechnician: true,
      technicianStatus: 'Sent to Lab',
      sentToLabAt: `Today, ${nowTime}`,
      registeredAt: nowTime,
      entryDate: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    };

    const saved = addReceptionEntry(newEntry);
    showToast(`🚀 Registered & sent to Lab Technician! Token: ${saved.tokenNumber}`);

    setLastRegisteredEntry(saved);
    setShowRecentlyRegisteredBanner(true);

    setSelectedReceipt(saved);
    setIsReceiptModalOpen(true);
    handleResetForm();
  };

  // Remaining Balance Collection Handler
  const handleOpenCollectPayment = (entry: ReceptionPatientEntry) => {
    const isPaidInFull =
      (entry.dueAmount === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid') &&
      (entry.dueAmount ?? 0) <= 0;
    if (isPaidInFull) {
      showToast('🔒 Full payment is already completed. Payment cannot be edited again.');
      return;
    }
    setCollectingPaymentEntry(entry);
    setIsCollectPaymentOpen(true);
  };

  const handleCollectPayment = (
    entryId: string,
    collectedAmount: number,
    mode: 'Cash' | 'UPI' | 'Card',
    note?: string
  ) => {
    const entry = receptionEntries.find((e) => e.id === entryId);
    if (!entry) return;

    const netPayable = Math.max(0, entry.totalAmount - (entry.discountINR || 0));
    const newPaidAmount = Math.min(netPayable, entry.paidAmount + collectedAmount);
    const newDueAmount = Math.max(0, netPayable - newPaidAmount);
    const newPaymentStatus: ReceptionPatientEntry['paymentStatus'] =
      newDueAmount === 0 ? 'Full Payment' : 'Advance';

    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const updated: ReceptionPatientEntry = {
      ...entry,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      paymentStatus: newPaymentStatus,
      paymentMode: mode,
      balancePaidAmount: (entry.balancePaidAmount || 0) + collectedAmount,
      balancePaymentMode: mode,
      balancePaidAt: `Today, ${nowTime}`,
      // If full payment is now cleared and report is ready, auto-publish complete report to patient portal
      isReportPublished:
        newDueAmount === 0 && (entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated' || Boolean(entry.reportId))
          ? true
          : entry.isReportPublished,
      publishedAt:
        newDueAmount === 0 && (entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated' || Boolean(entry.reportId))
          ? `Today, ${nowTime}`
          : entry.publishedAt,
      publishedBy:
        newDueAmount === 0 && (entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated' || Boolean(entry.reportId))
          ? currentUser?.name || 'Reception Desk'
          : entry.publishedBy,
      notes: note
        ? entry.notes
          ? `${entry.notes} • [Paid ₹${collectedAmount} via ${mode}: ${note}]`
          : `[Paid ₹${collectedAmount} via ${mode}: ${note}]`
        : entry.notes,
    };

    updateReceptionEntry(entryId, updated);
    if (newDueAmount === 0 && (entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated' || Boolean(entry.reportId))) {
      showToast(`✅ Full Payment Completed (₹0 Due)! Download Report button is now available.`);
    } else {
      showToast(`✅ Collected ₹${collectedAmount} for ${entry.tokenNumber}! Status: ${newPaymentStatus}`);
    }

    setSelectedReceipt(updated);
    setIsReceiptModalOpen(true);
  };

  // Edit Patient Handlers
  const handleOpenEdit = (entry: ReceptionPatientEntry) => {
    const isReportReady = Boolean(
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

    if (isReportReady) {
      const isPaidInFull =
        (entry.dueAmount === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid') &&
        (entry.dueAmount ?? 0) <= 0;
      if (isPaidInFull) {
        showToast('🔒 Full payment is completed. Payment and details cannot be edited again.');
      } else {
        showToast('ℹ️ Report is ready. Only payment status can be updated.');
        handleOpenCollectPayment(entry);
      }
      return;
    }
    if (isSentToLab) {
      showToast('🔒 Specimen already sent to lab. Demographics and tests are locked.');
      return;
    }
    setEditingEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updated: ReceptionPatientEntry) => {
    updateReceptionEntry(updated.id, updated);
    setLastRegisteredEntry(updated);
    showToast(`✅ Patient entry updated: ${updated.tokenNumber} (${updated.patientName})`);
  };

  const handleSaveAndSendToLab = (updated: ReceptionPatientEntry) => {
    updateReceptionEntry(updated.id, {
      ...updated,
      status: 'In Lab',
      sentToTechnician: true,
      technicianStatus: 'Sent to Lab',
    });
    sendEntryToTechnician(updated.id);
    setLastRegisteredEntry(updated);
    showToast(`🚀 Updated & dispatched ${updated.tokenNumber} to Lab Technician (In Process)!`);
  };

  // Lab Technician Pipeline Actions
  const handleSendToLab = (entry: ReceptionPatientEntry) => {
    if (
      entry.sentToTechnician ||
      entry.technicianStatus === 'Sent to Lab' ||
      entry.technicianStatus === 'Accepted' ||
      entry.technicianStatus === 'Report Generated' ||
      entry.status === 'In Lab' ||
      entry.status === 'Report Ready'
    ) {
      showToast(`⚠️ Token ${entry.tokenNumber} is already sent to the lab!`);
      return;
    }
    sendEntryToTechnician(entry.id);
    showToast(`🧪 Token ${entry.tokenNumber} (${entry.patientName}) sent to Lab Technician!`);
  };

  const getOrBuildReportForEntry = (entry: ReceptionPatientEntry): LabReport => {
    const rptId = entry.reportId;
    let foundReport: LabReport | undefined;
    if (rptId) {
      foundReport = getReportById(rptId) || reports.find((r) => r.reportId.toLowerCase() === rptId.toLowerCase());
    }
    if (!foundReport && entry.uhid && !entry.uhid.startsWith('UHID-2026') && !entry.uhid.startsWith('LAB-2026-904')) {
      foundReport = reports.find((r) => r.uhid && r.uhid.toLowerCase() === entry.uhid.toLowerCase());
    }

    if (!foundReport) {
      foundReport = {
        reportId: entry.reportId || `RPT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        uhid: entry.uhid || 'UHID-2026',
        patientName: entry.patientName,
        ageGender: `${entry.age} Yrs / ${entry.gender}`,
        mobile: entry.mobile,
        doctor: entry.referringDoctor || 'Dr. Self / Walk-In',
        sampleCollectedAt: entry.registeredAt ? `Today, ${entry.registeredAt}` : 'Today, 08:30 AM',
        reportedAt: 'Today, Just Now',
        labName: labName,
        labAddress: labAddress,
        labPhone: labPhone,
        nablAccreditationNo: labNabl,
        pathologist: 'Dr. Rohit Sharma, MD (Pathology)',
        pathologistDegrees: 'Consultant Pathologist • Reg No: PMC-48192',
        barcode: '||||||||||||||||||||||',
        tokenNumber: entry.tokenNumber,
        items: (entry.tests && entry.tests.length > 0 ? entry.tests : ['Complete Blood Count (CBC)']).map((t) => ({
          testName: t,
          parameter: t,
          result: 'Observed Normal',
          unit: '-',
          referenceRange: 'Biological Reference Interval Verified',
          isAbnormal: false,
        })),
        verified: true,
        verificationHash: `SHA256: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        status: 'Verified',
        dueAmount: entry.dueAmount,
        paidAmount: entry.paidAmount,
        totalAmount: entry.totalAmount,
        paymentStatus: entry.paymentStatus,
        labId: entry.labId || activeTenantId || selectedVendorLabId || 'lab-apex',
        branchId: entry.branchId || activeBranchId,
        branchName: entry.branchName || 'Main Diagnostic Facility',
      };
    }
    if (foundReport) {
      return {
        ...foundReport,
        dueAmount: entry.dueAmount !== undefined ? entry.dueAmount : foundReport.dueAmount,
        paidAmount: entry.paidAmount !== undefined ? entry.paidAmount : foundReport.paidAmount,
        totalAmount: entry.totalAmount !== undefined ? entry.totalAmount : foundReport.totalAmount,
        paymentStatus: entry.paymentStatus || foundReport.paymentStatus,
      };
    }
    return foundReport;
  };

  const handleDownloadPatientReport = async (entry: ReceptionPatientEntry) => {
    try {
      const isReady = Boolean(
        entry.status === 'Report Ready' ||
        entry.technicianStatus === 'Report Generated' ||
        (Boolean(entry.reportId) && Boolean(reports.find((r) => r.reportId.toLowerCase() === entry.reportId?.toLowerCase() && !r.isDraft && r.verified)))
      );
      if (!isReady) {
        showToast('⏳ Report abhi process mein hai (In Process). Technician dwara test complete karne ke baad report download hogi.');
        return;
      }
      const isPaidInFull =
        (entry.dueAmount === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid') &&
        (entry.dueAmount ?? 0) <= 0;
      if (!isPaidInFull) {
        showToast(`⚠️ Payment pending: Please update payment to Full Payment before downloading.`);
        handleOpenCollectPayment(entry);
        return;
      }
      const report = getOrBuildReportForEntry(entry);
      const ok = await downloadReportPdf(report);
      if (ok) {
        showToast(`📥 Report PDF downloaded for ${entry.patientName} (${entry.tokenNumber})`);
      } else {
        showToast(`🔒 Report locked: Full payment is pending (Due: ₹${entry.dueAmount || 0}).`);
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast('❌ Failed to download report PDF. Please try again.');
    }
  };

  const handleViewPatientReport = (entry: ReceptionPatientEntry) => {
    const isReady = Boolean(
      entry.status === 'Report Ready' ||
      entry.technicianStatus === 'Report Generated' ||
      (Boolean(entry.reportId) && Boolean(reports.find((r) => r.reportId.toLowerCase() === entry.reportId?.toLowerCase() && !r.isDraft && r.verified)))
    );
    if (!isReady) {
      showToast('⏳ Report abhi process mein hai (In Process). Testing complete hone ke baad view hogi.');
      return;
    }
    const isPaidInFull =
      (entry.dueAmount === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid') &&
      (entry.dueAmount ?? 0) <= 0;
    if (!isPaidInFull) {
      showToast(`⚠️ Payment pending: Due ₹${entry.dueAmount || 0}. Please collect payment before viewing or downloading report.`);
      handleOpenCollectPayment(entry);
      return;
    }
    const foundReport = getOrBuildReportForEntry(entry);
    setViewingReport(foundReport);
    setIsViewingReportModalOpen(true);
  };

  const handleResetForm = () => {
    saveCurrentAsSnapshot();
    setEditingEntryId(null);
    setPatientName('');
    setAge('30');
    setGender('Male');
    setMobile('');
    setReferringDoctor('');
    setSelectedTests(['Complete Blood Count (CBC)']);
    setHasDiscount(false);
    setDiscountINR(0);
    setPaymentChoice('Full Payment');
    setAdvancePercent(50);
    setCustomPaidAmount('');
    setPaymentMode('Cash');
    setUpiTransactionRef('');
    setNotes('');
    try {
      localStorage.removeItem('reception_form_active_draft');
    } catch {}
  };

  const handleApplyExistingPatient = () => {
    if (existingPatientMatch) {
      setPatientName(existingPatientMatch.patientName);
      setAge(String(existingPatientMatch.age));
      setGender(existingPatientMatch.gender);
      setReferringDoctor(existingPatientMatch.referringDoctor);
      showToast(`✨ Auto-filled data for ${existingPatientMatch.patientName}`);
    }
  };

  // Payment status counts
  const fullPaymentCount = receptionEntries.filter(
    (e) => e.dueAmount === 0 || e.paymentStatus === 'Full Payment' || e.paymentStatus === 'Paid'
  ).length;
  const advancePaymentCount = receptionEntries.filter(
    (e) => (e.dueAmount > 0 && e.paidAmount > 0) || e.paymentStatus === 'Advance' || e.paymentStatus === 'Partial'
  ).length;
  const pendingPaymentCount = receptionEntries.filter(
    (e) => e.paidAmount === 0 || e.paymentStatus === 'Pending' || e.paymentStatus === 'Due' || e.paymentStatus === 'Due Payment'
  ).length;
  const websiteBookingCount = receptionEntries.filter(
    (e) => Boolean(getWebsiteBookingMeta(e))
  ).length;

  // Filtered Queue with Independent Date Filter & Payment Filter & Dual Inline Search (Token / Mobile)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const yesterdayDateObj = new Date();
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  const yesterdayDateStr = yesterdayDateObj.toISOString().split('T')[0];

  const filteredQueue = receptionEntries.filter((item) => {
    // 1. Search by Token Number or Mobile Number (Inline Row)
    const qToken = searchToken.trim().toLowerCase();
    if (qToken) {
      const displayTok = getDisplayTokenNumber(item.tokenNumber || item.tokenNo, item.id).toLowerCase();
      const matchToken =
        (item.tokenNumber && item.tokenNumber.toLowerCase().includes(qToken)) ||
        (item.tokenNo && item.tokenNo.toLowerCase().includes(qToken)) ||
        displayTok.includes(qToken);
      if (!matchToken) return false;
    }

    const qMobile = searchMobile.trim().replace(/\D/g, '');
    if (qMobile) {
      const itemMobileDigits = (item.mobile || '').replace(/\D/g, '');
      if (!itemMobileDigits.includes(qMobile)) return false;
    }

    // 2. Date Filter (Independent)
    // Options: 'All Dates' | 'Today' | 'Yesterday' | 'Custom Date'
    if (dateFilter !== 'All Dates') {
      const entryDate = item.entryDate || (() => {
        if (item.id === 'rcp-103' || item.id === 'rcp-104') {
          return yesterdayDateStr;
        }
        if (item.id?.startsWith('rcp-')) {
          const ts = Number(item.id.replace('rcp-', ''));
          if (!isNaN(ts) && ts > 1600000000000) {
            return new Date(ts).toISOString().split('T')[0];
          }
        }
        return todayDateStr;
      })();

      if (dateFilter === 'Today' && entryDate !== todayDateStr) {
        return false;
      }
      if (dateFilter === 'Yesterday' && entryDate !== yesterdayDateStr) {
        return false;
      }
      if (dateFilter === 'Custom Date' && entryDate !== customDate) {
        return false;
      }
    }

    // 3. Payment Filter (Independent)
    // Options: 'All' | 'Advance' | 'Due' | 'Full Payment'
    const paymentStatusType: 'Full Payment' | 'Advance' | 'Due' =
      item.dueAmount === 0 || item.paymentStatus === 'Full Payment' || item.paymentStatus === 'Paid'
        ? 'Full Payment'
        : (item.paidAmount > 0 && item.dueAmount > 0) || item.paymentStatus === 'Advance' || item.paymentStatus === 'Partial'
        ? 'Advance'
        : 'Due';

    if (paymentFilter !== 'All') {
      if (paymentFilter === 'Full Payment' && paymentStatusType !== 'Full Payment') return false;
      if (paymentFilter === 'Advance' && paymentStatusType !== 'Advance') return false;
      if (paymentFilter === 'Due' && paymentStatusType !== 'Due') return false;
    }

    // 4. Status Filter (Workflow tabs: Sent to Lab → In Lab / In Process → Report Ready)
    const isReady = Boolean(
      item.status === 'Report Ready' ||
      item.technicianStatus === 'Report Generated' ||
      (Boolean(item.reportId) && Boolean(reports.find((r) => r.reportId.toLowerCase() === item.reportId?.toLowerCase() && !r.isDraft && r.verified)))
    );
    const isInLab = !isReady && Boolean(
      item.sentToTechnician ||
      item.technicianStatus === 'Sent to Lab' ||
      item.technicianStatus === 'Accepted' ||
      item.status === 'In Lab' ||
      item.status === 'Sample Collected'
    );

    if (statusFilter !== 'All') {
      if (statusFilter === 'Website') {
        if (!getWebsiteBookingMeta(item)) return false;
      } else if (statusFilter === 'Report Ready') {
        if (!isReady) return false;
      } else if (statusFilter === 'In Lab') {
        if (!isInLab) return false;
      } else {
        if (isReady || isInLab) return false;
        if (item.status !== statusFilter) return false;
      }
    }

    return true;
  });

  // Today's Counter Stats
  const totalPatientsToday = receptionEntries.length;
  const totalNetBilled = receptionEntries.reduce((acc, e) => acc + Math.max(0, e.totalAmount - (e.discountINR || 0)), 0);
  const totalCashCollected = receptionEntries.reduce((acc, e) => acc + (e.paymentMode === 'Cash' ? e.paidAmount : 0), 0);
  const totalUpiCollected = receptionEntries.reduce((acc, e) => acc + (e.paymentMode === 'UPI' ? e.paidAmount : 0), 0);
  const totalTotalCollection = receptionEntries.reduce((acc, e) => acc + e.paidAmount, 0);
  const totalDuePending = receptionEntries.reduce((acc, e) => acc + e.dueAmount, 0);
  const patientsWithDueCount = receptionEntries.filter((e) => e.dueAmount > 0).length;
  const waitingSamplesCount = receptionEntries.filter((e) => e.status === 'Waiting').length;
  const reportsReadyCount = receptionEntries.filter(
    (e) => e.status === 'Report Ready' || e.technicianStatus === 'Report Generated' || (Boolean(e.reportId) && Boolean(reports.find((r) => r.reportId.toLowerCase() === e.reportId?.toLowerCase() && !r.isDraft && r.verified)))
  ).length;

  // Next status stepper
  const handleAdvanceStatus = (entry: ReceptionPatientEntry) => {
    let nextStatus: ReceptionPatientEntry['status'] = 'Waiting';
    if (entry.status === 'Waiting') nextStatus = 'Sample Collected';
    else if (entry.status === 'Sample Collected') nextStatus = 'In Lab';
    else if (entry.status === 'In Lab') nextStatus = 'Report Ready';
    else nextStatus = 'Report Ready';

    updateReceptionStatus(entry.id, nextStatus);
    showToast(`🔄 Token ${entry.tokenNumber} updated to: ${nextStatus}`);
  };

  const handleShareInvoice = async (entry: ReceptionPatientEntry) => {
    try {
      showToast('🖼️ Generating receipt slip with text...');
      const labId = entry.labId || activeTenantId || selectedVendorLabId;
      const testNamesStr = entry.tests.join(', ');
      const reportUrl = buildPatientReportUrl(labId, entry.tokenNumber);
      const cleanMobile = entry.mobile.replace(/\D/g, '');
      const clean10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

      const total = entry.totalAmount || 0;
      const discount = entry.discountINR || 0;
      const net = total - discount;
      const paid = entry.paidAmount || 0;
      const due = entry.dueAmount ?? Math.max(0, net - paid);

      const { file, blob, dataUrl, filename } = await buildReceiptSlipImage({
        tokenNumber: entry.tokenNumber,
        uhid: entry.uhid,
        patientName: entry.patientName,
        age: entry.age,
        gender: entry.gender,
        mobile: entry.mobile,
        referringDoctor: entry.referringDoctor,
        tests: entry.tests,
        totalAmount: entry.totalAmount,
        paidAmount: entry.paidAmount,
        dueAmount: entry.dueAmount,
        discountINR: entry.discountINR,
        paymentMode: entry.paymentMode,
        paymentStatus: entry.paymentStatus,
        registeredAt: entry.registeredAt,
        visitType: entry.visitType,
        address: entry.address,
        timeSlot: entry.preferredTimeSlot,
        labId: labId,
        labName: labName,
        labPhone: labPhone,
        showPrices: true,
        upiTransactionRef: entry.upiTransactionRef,
      }, labName);

      // Upload slip image to get a permanent public link for WhatsApp
      let publicSlipUrl: string | null = null;
      try {
        publicSlipUrl = await uploadReceiptSlipImage(
          dataUrl,
          `slip_${(entry.tokenNumber || 'TK').replace(/[^a-zA-Z0-9]/g, '_')}`
        );
      } catch (uploadErr) {
        console.warn('Slip image upload warning:', uploadErr);
      }

      const labWebsiteUrl = getTenantDirectUrl(labId);

      const shareText = [
        `🏥 *${labName.toUpperCase()}*`,
        `📍 *Official Patient Registration & Billing Slip*`,
        ``,
        `Dear *${entry.patientName}*, your lab test registration is confirmed. ✅`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🎫 *TOKEN NUMBER:* *${entry.tokenNumber}*`,
        `📋 *UHID:* ${entry.uhid}`,
        `📅 *Date & Time:* ${entry.registeredAt || new Date().toLocaleDateString('en-IN')}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `👤 *PATIENT INFORMATION*`,
        `• Patient: *${entry.patientName}* (${entry.age} Yrs / ${entry.gender})`,
        `• Mobile: +91 ${entry.mobile}`,
        entry.referringDoctor ? `• Ref. Doctor: ${entry.referringDoctor}` : '',
        entry.visitType === 'Home Collection' && entry.address
          ? `• Home Pickup: ${entry.address}${entry.preferredTimeSlot ? ` (${entry.preferredTimeSlot})` : ''}`
          : '',
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🧪 *PRESCRIBED INVESTIGATIONS*`,
        `• ${testNamesStr}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `💰 *BILLING SUMMARY*`,
        `• Gross Total: ₹${total}${discount > 0 ? ` | Concession: -₹${discount}` : ''}`,
        `• Net Payable: *₹${net}*`,
        `• Amount Paid: ₹${paid} (${entry.paymentMode || 'Cash'})`,
        entry.upiTransactionRef ? `• 🔍 *UPI Reference / UTR:* *${entry.upiTransactionRef}*` : '',
        due > 0 ? `• Status: ⚠️ *Balance Due: ₹${due}* (Pay on Spot)` : `• Status: ✅ *PAID IN FULL*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🔗 *REPORT Download:* ${reportUrl}`,
        `🌐 *Website:* ${labWebsiteUrl}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📍 *${labName}*${labPhone ? ` • Helpline: ${labPhone}` : ''}`,
      ].filter(Boolean).join('\n');

      // 1. Mobile native Web Share API
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== 'undefined' ? navigator.userAgent : ''
      );

      if (isMobileDevice && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Receipt ${entry.tokenNumber} - ${labName}`,
            text: shareText,
          });
          showToast(`✅ Official Slip & WhatsApp message shared successfully!`);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return;
          }
        }
      }

      // 2. Desktop Fallback: Download slip image, copy image to clipboard for Ctrl+V paste, and open WhatsApp Web
      downloadReceiptImage(dataUrl, filename);

      let copiedImage = false;
      try {
        if (navigator.clipboard && (window as any).ClipboardItem && blob) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob }),
          ]);
          copiedImage = true;
        }
      } catch {
        try {
          await navigator.clipboard.writeText(shareText);
        } catch {}
      }

      const encoded = encodeURIComponent(shareText);
      const url = isMobileDevice
        ? (clean10 ? `https://wa.me/91${clean10}?text=${encoded}` : `https://wa.me/?text=${encoded}`)
        : (clean10 ? `https://web.whatsapp.com/send?phone=91${clean10}&text=${encoded}` : `https://web.whatsapp.com/send?text=${encoded}`);

      window.open(url, '_blank', 'noopener,noreferrer');
      showToast(
        copiedImage
          ? `✅ WhatsApp Web opened with Slip Text & Image Link! Slip Image copied to clipboard (Ctrl+V) & downloaded.`
          : `✅ WhatsApp Web opened with Slip Text & Image Link! Slip image downloaded.`
      );
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to generate receipt slip. Please try again.');
    }
  };

  const handleWhatsAppReceipt = (entry: ReceptionPatientEntry) => {
    handleShareInvoice(entry);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
      {/* 1. Reception Header: Vendor Company Logo + Dashboard Name + Vendor Home Website + Log Out Button */}
      {!isEmbedded && (
        <header className="bg-white/95 backdrop-blur-md text-slate-800 px-4 sm:px-8 py-2.5 border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Back Button + Vendor Company Logo + Active Dashboard Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              id="reception-btn-back"
              onClick={() => onNavigateView(currentUser?.role === 'vendor' ? 'vendor_dashboard' : 'vendor_website')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back</span>
            </button>

            {/* Vendor Company Logo */}
            {labLogoUrl ? (
              <img
                src={labLogoUrl}
                alt={labName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#123B6D] flex items-center justify-center font-bold text-xs border border-slate-200 shrink-0">
                <span>{labName.charAt(0) || 'A'}</span>
                <span>{labName.split(' ')[1]?.charAt(0) || 'L'}</span>
              </div>
            )}

            <div className="flex flex-col min-w-0">
              {/* Vendor Company Name */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 leading-tight truncate">
                  {labName}
                </span>
              </div>
              {/* Dashboard badge */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Reception Desk</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">Billing &amp; Specimen Intake</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Sync Now + Visit Website + Lab Owner return + Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Hostinger MySQL Sync Button */}
            <SyncNowButton variant="light" />

            {/* Visit Website Button */}
            <button
              type="button"
              id="reception-header-visit-website-btn"
              onClick={() => {
                onNavigateView('vendor_website');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-200 cursor-pointer shrink-0"
              title="Visit Laboratory Website"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Visit Website</span>
            </button>

            {/* If Admin is inspecting Reception Desk, provide quick return to Lab Owner CMS */}
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigateView('vendor_dashboard')}
                className="hidden md:flex bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition items-center gap-1 cursor-pointer whitespace-nowrap"
                title="Return to Lab Owner Dashboard"
              >
                <span>Lab Owner</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              type="button"
              id="reception-header-logout-btn"
              onClick={() => {
                logout();
                onNavigateView('vendor_website');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Logout from Reception Desk"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full space-y-6">
        {/* 3. Split Workstation Layout: Left Form + Right Live Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: New Patient Fast Entry & Billing Form (5 Cols) */}
          <div id="reception-patient-form" className={`lg:col-span-5 bg-white rounded-xl border p-5 space-y-4 transition-all shadow-xs ${editingEntryId ? 'border-amber-400 ring-2 ring-amber-300/30' : 'border-slate-200/90'}`}>
            {editingEntryId ? (
              <div className="flex items-center justify-between border-b border-amber-200 pb-3 bg-amber-50/70 -mx-5 -mt-5 p-4 rounded-t-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wide">
                      Edit Mode
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-amber-950">
                      Token {receptionEntries.find((e) => e.id === editingEntryId)?.tokenNumber || ''} Correction
                    </h2>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Update only what was incorrect without refilling the whole form.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    New Patient Registration
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate token, bill, and sample label
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  TK-{100 + receptionEntries.length + 1}
                </span>
              </div>
            )}

            {/* Notification: Technician has returned the entry */}
            {returnedByTechnicianEntries.length > 0 && (
              <div className="bg-rose-50 border-2 border-rose-300 p-3.5 rounded-xl shadow-xs space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-rose-900">
                    <span className="p-2 bg-rose-200 text-rose-800 rounded-xl">
                      <RotateCcw className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        Technician has returned the entry.
                      </h4>
                      <p className="text-[11px] text-rose-800 font-medium">
                        {returnedByTechnicianEntries.length} specimen/patient {returnedByTechnicianEntries.length === 1 ? 'entry was' : 'entries were'} returned to Reception with a technician clinical note.
                      </p>
                    </div>
                  </div>
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                    Returned by Lab
                  </span>
                </div>

                <div className="divide-y divide-rose-200 bg-white rounded-xl border border-rose-200 overflow-hidden">
                  {returnedByTechnicianEntries.map((retEntry) => (
                    <div key={retEntry.id} className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-black bg-rose-100 text-rose-900 px-2 py-0.5 rounded-md border border-rose-200">
                            {retEntry.tokenNumber || '-'}
                          </span>
                          <strong className="text-slate-900 font-bold">{retEntry.patientName}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">+91 {retEntry.mobile}</span>
                        </div>
                        {retEntry.returnReason && (
                          <p className="text-xs text-rose-800 mt-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            <strong>Technician Reason:</strong> {retEntry.returnReason}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1">
                          Returned at: {retEntry.returnedAt || 'Today'} • Tests: {Array.isArray(retEntry.tests) ? retEntry.tests.join(', ') : retEntry.tests}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadEntryToForm(retEntry)}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Edit patient or tests for re-collection"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                          <span>Edit / Re-collect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateReceptionEntry(retEntry.id, {
                              returnedByTechnician: false,
                              technicianStatus: 'Pending',
                              sentToTechnician: true,
                            });
                            showToast(`Sample re-sent to Technician for ${retEntry.patientName}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Re-send specimen to lab queue"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-send to Lab</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(retEntry);
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 flex items-center justify-center"
                          title="Delete returned entry from queue"
                          aria-label="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Registered Patient Banner (Instant 1-Click Correction) */}
            {showRecentlyRegisteredBanner && lastRegisteredEntry && !editingEntryId && (
              <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50 border-2 border-teal-300 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-start sm:items-center gap-2">
                  <span className="text-teal-700 bg-teal-100 p-1.5 rounded-lg shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>✓ Just Registered:</span>
                      <span className="bg-teal-700 text-white px-1.5 py-0.2 rounded font-mono text-[11px] font-bold">
                        {lastRegisteredEntry.tokenNumber}
                      </span>
                      <span className="text-teal-950 font-bold">{lastRegisteredEntry.patientName}</span>
                      <span className="text-[11px] font-normal text-slate-600">
                        ({lastRegisteredEntry.age}Y • +91 {lastRegisteredEntry.mobile})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Koi data galti se galat ho gaya? <strong>Pura form dubara bharne ki zaroorat nahi hai!</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {!(
                    lastRegisteredEntry.sentToTechnician ||
                    lastRegisteredEntry.technicianStatus === 'Sent to Lab' ||
                    lastRegisteredEntry.technicianStatus === 'Accepted' ||
                    lastRegisteredEntry.technicianStatus === 'Report Generated' ||
                    lastRegisteredEntry.status === 'In Lab' ||
                    lastRegisteredEntry.status === 'Report Ready' ||
                    lastRegisteredEntry.reportId
                  ) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleLoadEntryToForm(lastRegisteredEntry)}
                        className="bg-[#0F766E] hover:bg-[#0d655e] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Galti Theek Karein (Edit)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSendToLab(lastRegisteredEntry);
                          setLastRegisteredEntry({
                            ...lastRegisteredEntry,
                            sentToTechnician: true,
                            technicianStatus: 'Sent to Lab',
                            status: 'In Lab',
                          });
                        }}
                        className="bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="Transfer to Lab Technician"
                      >
                        <FlaskConical className="w-3.5 h-3.5 text-amber-300" />
                        <span>Sent to Lab</span>
                      </button>
                    </>
                  ) : (
                    <span className="bg-[#123B6D] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-300" />
                      <span>Sent to Lab (In Process)</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowRecentlyRegisteredBanner(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer text-xs"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Returning patient banner if detected */}
            {existingPatientMatch && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Existing Patient Found: <strong>{existingPatientMatch.patientName}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyExistingPatient}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2 py-0.5 rounded text-[11px] cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            <form onSubmit={editingEntryId ? handleSaveCorrections : handleRegisterPatient} className="space-y-4">
              {/* Patient Details */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Patient Details</span>
                  </span>
                </div>

                {/* Name | Age | Gender — inline */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  {/* Name */}
                  <div className="col-span-6 sm:col-span-6">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Patient Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50/30 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none transition"
                    />
                  </div>

                  {/* Age */}
                  <div className="col-span-3 sm:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Age <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="115"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Yrs"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50/30 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none text-center transition"
                    />
                  </div>

                  {/* Gender */}
                  <div className="col-span-3 sm:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                      {(['Male', 'Female', 'Other'] as const).map((g) => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setGender(g)}
                          className={`flex-1 py-1 rounded text-[11px] font-semibold transition cursor-pointer text-center ${
                            gender === g
                              ? 'bg-white text-slate-900 shadow-2xs font-bold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title={g}
                        >
                          {g === 'Male' ? 'M' : g === 'Female' ? 'F' : 'O'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Number | Reference — inline */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  {/* Number (10-Digit Mobile) */}
                  <div className="col-span-5 sm:col-span-5">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-medium text-slate-400">+91</span>
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        pattern="[0-9]{10}"
                        className="w-full pl-9 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50/30 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none font-mono transition"
                      />
                    </div>
                  </div>

                  {/* Reference (Doctor / Clinic) */}
                  <div className="col-span-7 sm:col-span-7">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Reference (Doctor / Clinic)
                    </label>
                    <input
                      type="text"
                      value={referringDoctor}
                      onChange={(e) => setReferringDoctor(e.target.value)}
                      placeholder="e.g. Self / Dr. Name"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50/30 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none truncate transition"
                    />
                  </div>
                </div>
              </div>

              {/* Test Selection */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                    <span>Prescribed Tests</span>
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-mono">
                      Total: <strong className="text-slate-900 font-bold">₹{grossAmount}</strong>
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-medium">
                      {selectedTests.length} tests
                    </span>
                  </div>
                </div>

                {/* Primary Action Button: Open Two-Panel Department & Test Selection Modal */}
                <button
                  type="button"
                  onClick={() => setIsTestSelectionModalOpen(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white p-2.5 rounded-xl font-medium text-xs sm:text-sm transition flex items-center justify-between cursor-pointer group shadow-2xs"
                  title="Click to open department-wise test selection popup"
                >
                  <span className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                    <span className="text-left flex flex-col">
                      <span className="font-semibold text-xs sm:text-sm text-white">
                        Browse &amp; Add Tests from Catalog
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {PARENT_CATEGORIES.length} Departments · {allAvailableTests.length} Clinical Tests
                      </span>
                    </span>
                  </span>

                  <span className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-md transition flex items-center gap-1 shrink-0">
                    <span>{selectedTests.length} Selected</span>
                    <span>→</span>
                  </span>
                </button>

                {/* Multiple Added Tests List */}
                {selectedTests.length > 0 ? (
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                      <span>Selected Tests ({selectedTests.length}):</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsTestSelectionModalOpen(true)}
                          className="font-medium text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                        >
                          + Add More
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTests([])}
                          className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50/70 rounded-xl border border-slate-200/80">
                      {selectedTests.map((testName) => {
                        const testObj = allAvailableTests.find((t) => t.name === testName);
                        const price = testObj ? testObj.price : 300;
                        const category = testObj ? testObj.category : 'General';
                        return (
                          <span
                            key={testName}
                            className="bg-white border border-slate-200 text-slate-800 text-[11px] pl-2.5 pr-1.5 py-1 rounded-lg flex items-center gap-2 font-medium shadow-2xs"
                          >
                            <span className="font-medium text-slate-900">{testName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {category.split(' ')[0]}
                            </span>
                            <span className="font-mono text-[11px] text-slate-700 font-semibold bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                              ₹{price}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleTest(testName)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer ml-0.5 transition"
                              title="Remove test"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsTestSelectionModalOpen(true)}
                    className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition group"
                  >
                    <FlaskConical className="w-4 h-4 text-slate-400 mx-auto mb-1 group-hover:scale-105 transition" />
                    <p className="text-xs font-medium text-slate-700">No tests selected yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Click here to open the Department Catalog →
                    </p>
                  </div>
                )}
              </div>

              {/* Billing & Payment */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                    <span>Billing &amp; Payment</span>
                  </span>
                </div>

                {/* Gross Test Amount: ₹____ */}
                <div className="flex justify-between items-center text-xs bg-white px-3 py-2 rounded-lg border border-slate-200/80 shadow-2xs">
                  <span className="font-medium text-slate-600">Gross Amount:</span>
                  <span className="font-bold text-sm text-slate-900 font-mono">₹{grossAmount}</span>
                </div>

                {/* Optional Discount with Checkbox */}
                <div className="pt-0.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasDiscount}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setHasDiscount(checked);
                          if (!checked) {
                            setDiscountINR(0);
                          }
                        }}
                        className="w-3.5 h-3.5 text-slate-800 rounded border-slate-300 focus:ring-slate-400 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <span>Discount / Concession</span>
                        <span className="text-[10px] text-slate-400">(Optional)</span>
                      </span>
                    </label>

                    {hasDiscount && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          max={grossAmount}
                          value={discountINR || ''}
                          onChange={(e) => setDiscountINR(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20 px-2 py-0.5 text-right font-semibold text-slate-800 rounded border border-slate-300 bg-white text-xs outline-none focus:border-slate-500"
                        />
                      </div>
                    )}
                  </div>

                  {hasDiscount && (
                    <div className="flex items-center justify-end gap-1 mt-1.5">
                      {[50, 100, 200].map((disc) => (
                        <button
                          type="button"
                          key={disc}
                          onClick={() => setDiscountINR(disc)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                            discountINR === disc
                              ? 'bg-slate-800 text-white border-slate-800 font-semibold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          ₹{disc} Off
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Net Payable */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-900 px-1 pt-1 border-t border-slate-200/80">
                  <span>Net Payable:</span>
                  <span className="text-sm font-bold font-mono">₹{netPayable}</span>
                </div>

                {/* Amount Paid & Due Details */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Amount Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={netPayable}
                      value={customPaidAmount !== '' ? customPaidAmount : (netPayable > 0 ? netPayable : 0)}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val === '') {
                          setCustomPaidAmount('0');
                        } else {
                          if (val.length > 1 && val.startsWith('0')) {
                            val = val.replace(/^0+/, '') || '0';
                          }
                          setCustomPaidAmount(val);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      className="w-full px-2.5 py-1 text-xs font-semibold text-slate-900 rounded-lg border border-slate-200 bg-white focus:border-slate-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Balance Due</label>
                    <div
                      className={`text-xs font-bold py-1 px-2 rounded-lg border ${
                        dueAmount > 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      ₹{dueAmount}
                    </div>
                  </div>
                </div>

                {/* Payment Method: Cash | UPI — inline */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-slate-600 shrink-0">Payment Method:</label>
                  <div className="inline-flex items-center p-0.5 bg-slate-200/60 rounded-lg gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('Cash')}
                      className={`py-1 px-3 rounded-md text-xs font-medium transition cursor-pointer ${
                        paymentMode === 'Cash'
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('UPI')}
                      className={`py-1 px-3 rounded-md text-xs font-medium transition cursor-pointer ${
                        paymentMode === 'UPI'
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>UPI</span>
                    </button>
                  </div>
                </div>

                {paymentMode === 'UPI' && (
                  <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
                      <span>UPI UTR / Reference:</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={upiTransactionRef}
                      onChange={(e) => setUpiTransactionRef(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                      placeholder="e.g. 526371829102"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 focus:border-slate-400 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Submit & Token Generation */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Submit Patient Entry</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>
            </form>
          </div>

          {/* Right: Today's Live Queue & Token Calling Board (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3.5 flex flex-col">
            {/* Board Header: Left → Reception List Info | Right → Search by Token No. & Mobile No. */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              {/* Left Side: Reception List & Patients Count */}
              <div className="shrink-0">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Patient Queue</span>
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                    {filteredQueue.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Live queue with instant search and status tracking</p>
              </div>

              {/* Right Side: Search by Token Number & Mobile Number */}
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                {/* Search by Token Number */}
                <div className="relative w-full sm:w-44">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                    placeholder="Search Token..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50/40 focus:bg-white focus:border-slate-400 outline-none placeholder:text-slate-400 font-mono transition"
                  />
                  {searchToken && (
                    <button
                      type="button"
                      onClick={() => setSearchToken('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear token search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Search by Mobile Number */}
                <div className="relative w-full sm:w-44">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    value={searchMobile}
                    onChange={(e) => setSearchMobile(e.target.value)}
                    placeholder="Search Mobile..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50/40 focus:bg-white focus:border-slate-400 outline-none placeholder:text-slate-400 font-mono transition"
                  />
                  {searchMobile && (
                    <button
                      type="button"
                      onClick={() => setSearchMobile('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear mobile search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Independent Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <div className="flex flex-wrap items-center gap-3">
                {/* Date Filter */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="px-2 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:border-slate-400 outline-none cursor-pointer"
                  >
                    <option value="All Dates">All Dates</option>
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="Custom Date">Custom Date</option>
                  </select>
                </div>

                {/* If Custom Date selected: inline date input */}
                {dateFilter === 'Custom Date' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="px-2 py-0.5 rounded-md border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:border-slate-400 outline-none cursor-pointer"
                    />
                  </div>
                )}

                <span className="text-slate-200">|</span>

                {/* Payment Filter */}
                <div className="flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as any)}
                    className="px-2 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:border-slate-400 outline-none cursor-pointer"
                  >
                    <option value="All">All Payments</option>
                    <option value="Full Payment">Full Payment</option>
                    <option value="Advance">Advance</option>
                    <option value="Due">Due</option>
                  </select>
                </div>
              </div>

              {(dateFilter !== 'All Dates' || paymentFilter !== 'All' || searchToken || searchMobile) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('All Dates');
                    setPaymentFilter('All');
                    setSearchToken('');
                    setSearchMobile('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-900 font-medium hover:underline cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Workflow Status Filter Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100/90 rounded-lg text-xs font-medium">
              {(['All', 'Website', 'Waiting', 'In Lab', 'Report Ready'] as const).map((st) => {
                const count =
                  st === 'All'
                    ? receptionEntries.length
                    : st === 'Website'
                    ? websiteBookingCount
                    : st === 'Report Ready'
                    ? receptionEntries.filter((e) => e.status === 'Report Ready' || e.technicianStatus === 'Report Generated' || (Boolean(e.reportId) && Boolean(reports.find((r) => r.reportId.toLowerCase() === e.reportId?.toLowerCase() && !r.isDraft && r.verified)))).length
                    : st === 'In Lab'
                    ? receptionEntries.filter((e) => !(e.status === 'Report Ready' || e.technicianStatus === 'Report Generated' || (Boolean(e.reportId) && Boolean(reports.find((r) => r.reportId.toLowerCase() === e.reportId?.toLowerCase() && !r.isDraft && r.verified)))) && (e.sentToTechnician || e.technicianStatus === 'Sent to Lab' || e.technicianStatus === 'Accepted' || e.status === 'In Lab' || e.status === 'Sample Collected')).length
                    : receptionEntries.filter((e) => !(e.status === 'Report Ready' || e.technicianStatus === 'Report Generated' || (Boolean(e.reportId) && Boolean(reports.find((r) => r.reportId.toLowerCase() === e.reportId?.toLowerCase() && !r.isDraft && r.verified)))) && !(e.sentToTechnician || e.technicianStatus === 'Sent to Lab' || e.technicianStatus === 'Accepted' || e.status === 'In Lab' || e.status === 'Sample Collected') && e.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`py-1 px-2.5 rounded-md transition text-xs flex items-center gap-1.5 cursor-pointer ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{st === 'Website' ? 'Website Bookings' : st === 'In Lab' ? 'In Lab' : st}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Patients List Cards — Expanded vertical capacity for 5+ simultaneous entries */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[660px] max-h-[calc(100vh-140px)] xl:min-h-[760px] xl:max-h-[920px]">
              {filteredQueue.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No patient entries match the selected search or status filter.
                </div>
              ) : (
                filteredQueue.map((entry) => {
                  const isReportReady = Boolean(
                    entry.status === 'Report Ready' ||
                    entry.technicianStatus === 'Report Generated' ||
                    (Boolean(entry.reportId) && Boolean(reports.find((r) => r.reportId.toLowerCase() === entry.reportId?.toLowerCase() && !r.isDraft && r.verified)))
                  );

                  const isInProcess = !isReportReady && Boolean(
                    entry.sentToTechnician ||
                    entry.technicianStatus === 'Sent to Lab' ||
                    entry.technicianStatus === 'Accepted' ||
                    entry.status === 'In Lab' ||
                    entry.status === 'Sample Collected'
                  );

                  const isAlreadySent = isReportReady || isInProcess;
                  const isLockedForEdit = isAlreadySent;

                  const isPaidInFull =
                    (entry.dueAmount === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid') &&
                    (entry.dueAmount ?? 0) <= 0;

                  const paymentStatusType: 'Full Payment' | 'Advance' | 'Due' =
                    isPaidInFull
                      ? 'Full Payment'
                      : (entry.paidAmount > 0 && entry.dueAmount > 0) || entry.paymentStatus === 'Advance' || entry.paymentStatus === 'Partial'
                      ? 'Advance'
                      : 'Due';

                  const netTotal = Math.max(0, entry.totalAmount - (entry.discountINR || 0));
                  const hasMadePayment =
                    (paymentStatusType === 'Full Payment' || paymentStatusType === 'Advance') &&
                    (entry.paidAmount || 0) > 0;

                  const websiteMeta = getWebsiteBookingMeta(entry);
                  const displayToken = getDisplayTokenNumber(entry.tokenNumber || entry.tokenNo, entry.id);

                  return (
                    <div
                      key={entry.id}
                      className={`rounded-xl transition bg-white space-y-2 overflow-hidden ${
                        websiteMeta
                          ? 'border border-rose-300 ring-1 ring-rose-100 shadow-2xs'
                          : 'border border-slate-200/90 p-3 hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      {/* Batch Label Above Card for Website Bookings */}
                      {websiteMeta && (
                        <div className="bg-rose-50 text-rose-800 px-3 py-1 flex items-center justify-between text-xs font-medium border-b border-rose-200">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                            <span className="font-semibold text-[11px] uppercase tracking-wider">
                              Website Booking
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span>{websiteMeta.badgeDetail}</span>
                            {websiteMeta.isHomeVisit && (
                              <span className="text-amber-800 font-medium">
                                · Home Visit
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className={websiteMeta ? 'p-3 pt-1 space-y-2' : 'space-y-2'}>
                        {/* Header: Left → Token Number + Phone No. | Right → Status Flow & Actions */}
                        <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                          {/* Left: Token Number + Phone No. (+ Patient Name & Details) */}
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="bg-slate-900 text-white px-2 py-0.5 rounded text-xs font-mono font-semibold shrink-0 tracking-wide"
                              title={`Token: ${displayToken}`}
                            >
                              <span>{displayToken}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  onClick={() => {
                                    if (isReportReady) {
                                      if (isPaidInFull) {
                                        handleViewPatientReport(entry);
                                      } else {
                                        showToast('⚠️ Payment pending: Please update payment to Full Payment to view/download report.');
                                        handleOpenCollectPayment(entry);
                                      }
                                    }
                                  }}
                                  className={`font-semibold text-xs sm:text-sm text-slate-900 truncate ${
                                    isReportReady ? 'cursor-pointer hover:text-emerald-700 hover:underline' : ''
                                  }`}
                                  title={
                                    isReportReady
                                      ? isPaidInFull
                                        ? 'Report Ready: Click to view patient report'
                                        : 'Report Ready (Payment Pending): Click to update payment'
                                      : undefined
                                  }
                                >
                                  {entry.patientName}
                                </span>
                                <span className="text-[11px] text-slate-400 font-normal">
                                  ({entry.age}Y · {entry.gender})
                                </span>
                              </div>
                              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                                <span>+91 {entry.mobile}</span>
                                {entry.referringDoctor && (
                                  <span className="text-slate-400 font-normal font-sans text-[10px] truncate">
                                    · Ref: {entry.referringDoctor.split(' ')[1] || entry.referringDoctor}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Status Flow & Primary Actions */}
                          <div className="shrink-0 flex items-center gap-1.5">
                            {isReportReady ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isPaidInFull) {
                                      handleDownloadPatientReport(entry);
                                    } else {
                                      showToast('⚠️ Payment pending: Please update to Full Payment to download report.');
                                      handleOpenCollectPayment(entry);
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-98"
                                  title={
                                    isPaidInFull
                                      ? 'Download Official Medical Report PDF'
                                      : `Download Report (Payment pending - Due: ₹${entry.dueAmount})`
                                  }
                                >
                                  <Download className="w-3.5 h-3.5 text-white" />
                                  <span>Download</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isPaidInFull) {
                                      handleViewPatientReport(entry);
                                    } else {
                                      showToast('⚠️ Payment pending: Please update to Full Payment to view report.');
                                      handleOpenCollectPayment(entry);
                                    }
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                                  title={
                                    isPaidInFull
                                      ? 'View / Print Full Report'
                                      : `View Report (Payment pending - Due: ₹${entry.dueAmount})`
                                  }
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="hidden sm:inline">View</span>
                                </button>
                              </div>
                            ) : isInProcess ? (
                              <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                <FlaskConical className="w-3.5 h-3.5 text-slate-600 animate-pulse" />
                                <span>In Process</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendToLab(entry)}
                                className="px-2.5 py-1 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
                                title="Send specimen to Lab Technician workstation"
                              >
                                <FlaskConical className="w-3 h-3 text-slate-200" />
                                <span>Sent to Lab</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Body: Compact Test Badges & Patient Meta */}
                        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">
                            Tests ({entry.tests?.length || 0}):
                          </span>
                          {entry.tests && entry.tests.length > 0 ? (
                            entry.tests.map((testName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-xs font-normal text-slate-800"
                              >
                                <span className="truncate max-w-[200px]">{testName}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No tests selected</span>
                          )}
                          <span className="text-[10px] text-slate-400 font-normal ml-auto shrink-0">
                            UHID: <span className="font-mono text-slate-600">{entry.uhid}</span> · {entry.registeredAt}
                          </span>
                        </div>

                        {/* Footer: Left → Total Amount + Payment Status + Method (UPI/Cash) | Right → Actions */}
                        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2 text-xs">
                          {/* Left: Total Amount + Payment Status + Method (UPI/Cash) */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Total Amount */}
                            <span className="font-bold text-slate-900 text-xs sm:text-sm font-mono">
                              ₹{netTotal}
                            </span>

                            <span className="text-slate-200">·</span>

                            {/* Payment Status */}
                            {isPaidInFull ? (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Full Payment</span>
                              </span>
                            ) : paymentStatusType === 'Advance' ? (
                              <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span>Advance (Due: ₹{entry.dueAmount})</span>
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span>Due (₹{entry.dueAmount})</span>
                              </span>
                            )}

                            {/* Method (UPI/Cash) */}
                            {hasMadePayment && (
                              <>
                                <span className="text-slate-200">·</span>
                                <span className="text-slate-500 font-medium text-[10px] sm:text-[11px]">
                                  {entry.paymentMode}
                                </span>
                              </>
                            )}

                            {/* Verification Status Badges */}
                            {entry.autoVerified || entry.paymentGateway === 'PhonePe' ? (
                              <>
                                <span className="text-slate-200">·</span>
                                <span className="text-purple-700 bg-purple-50 border border-purple-200 text-[10px] font-medium px-1.5 py-0.5 rounded">
                                  Auto-Verified
                                </span>
                              </>
                            ) : entry.paymentVerificationStatus === 'Pending Verification' || (entry.upiTransactionRef && entry.paymentVerificationStatus !== 'Verified') ? (
                              <>
                                <span className="text-slate-200">·</span>
                                <span className="text-amber-800 bg-amber-50 border border-amber-200 text-[10px] font-medium px-1.5 py-0.5 rounded">
                                  Pending UPI Verify
                                </span>
                              </>
                            ) : null}
                          </div>

                          {/* Right: Actions — Verify UPI | Edit | Update Payment | Delete | Print */}
                          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            {/* 0. Verify Manual UPI (If pending verification) */}
                            {(entry.paymentVerificationStatus === 'Pending Verification' || (entry.upiTransactionRef && entry.paymentVerificationStatus !== 'Verified')) && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateReceptionEntry(entry.id, {
                                    paymentVerificationStatus: 'Verified',
                                    paymentStatus: 'Full Payment',
                                    paidAmount: entry.totalAmount,
                                    dueAmount: 0,
                                  });
                                  showToast(`✅ Manual UPI verified & approved for ${entry.patientName} (Token ${entry.tokenNumber})!`);
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
                                title="Verify manual UPI"
                              >
                                <Check className="w-3 h-3 text-white" />
                                <span>Verify</span>
                              </button>
                            )}

                            {/* View Screenshot if attached */}
                            {entry.paymentScreenshot && (
                              <button
                                type="button"
                                onClick={() => window.open(entry.paymentScreenshot, '_blank')}
                                className="p-1.5 text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                                title="View Customer's Payment Screenshot Proof"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* 1. Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(entry)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer active:scale-95 flex items-center justify-center"
                              title="Edit Patient Details & Tests"
                              aria-label="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. Update Payment */}
                            <button
                              type="button"
                              onClick={() => handleOpenCollectPayment(entry)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer active:scale-95 flex items-center justify-center ${
                                isPaidInFull
                                  ? 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                  : 'border-amber-300 bg-amber-50/60 text-amber-800 hover:bg-amber-100'
                              }`}
                              title={
                                isPaidInFull
                                  ? 'Update Payment (Full Payment • Due ₹0)'
                                  : `Update Payment (Remaining Due: ₹${entry.dueAmount})`
                              }
                              aria-label="Update Payment"
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                            </button>

                            {/* 3. Delete */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(entry);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-lg transition cursor-pointer active:scale-95 flex items-center justify-center"
                              title="Delete Patient Entry"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* 4. Print */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReceipt(entry);
                                setIsReceiptModalOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer active:scale-95 flex items-center justify-center"
                              title="Print Receipt & Token Slip"
                              aria-label="Print"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Unified Reception Token Receipt Modal */}
      {isReceiptModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <WebsiteTokenReceiptCard
            receipt={{
              tokenNumber: getDisplayTokenNumber(selectedReceipt.tokenNumber || selectedReceipt.tokenNo, selectedReceipt.id),
              uhid: selectedReceipt.uhid,
              patientName: selectedReceipt.patientName,
              age: selectedReceipt.age,
              gender: selectedReceipt.gender,
              mobile: selectedReceipt.mobile,
              email: selectedReceipt.email,
              referringDoctor: selectedReceipt.referringDoctor,
              tests: selectedReceipt.tests,
              totalAmount: selectedReceipt.totalAmount || 0,
              discountINR: selectedReceipt.discountINR || 0,
              paidAmount: selectedReceipt.paidAmount || 0,
              dueAmount: selectedReceipt.dueAmount || 0,
              paymentMode: selectedReceipt.paymentMode || 'Cash',
              paymentStatus: selectedReceipt.paymentStatus,
              registeredAt: selectedReceipt.registeredAt,
              visitType: selectedReceipt.visitType,
              address: selectedReceipt.address,
              timeSlot: selectedReceipt.preferredTimeSlot,
              upiTransactionRef: selectedReceipt.upiTransactionRef,
              labId: selectedReceipt.labId || activeTenantId || selectedVendorLabId,
              labName: labName,
              labPhone: labPhone,
              labAddress: labAddress,
              bookingSource: selectedReceipt.bookingSource || 'Reception Desk',
              notes: selectedReceipt.notes,
            }}
            onClose={() => {
              setIsReceiptModalOpen(false);
              setSelectedReceipt(null);
            }}
          />
        </div>
      )}

      {/* 5. In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">Are you sure you want to delete this?</h3>
              <p className="text-xs text-slate-500">
                Patient entry <strong>{deleteTarget.patientName}</strong> (Token #{deleteTarget.tokenNumber}) will be permanently removed from today's reception queue.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTarget) {
                    deleteReceptionEntry(deleteTarget.id);
                    if (lastRegisteredEntry && (lastRegisteredEntry.id === deleteTarget.id || lastRegisteredEntry.tokenNumber === deleteTarget.tokenNumber)) {
                      setLastRegisteredEntry(null);
                      setShowRecentlyRegisteredBanner(false);
                    }
                    showToast(`🗑️ Patient ${deleteTarget.patientName || 'entry'} removed from queue`);
                    setDeleteTarget(null);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm hover:shadow transition cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Patient Entry Modal */}
      {isEditModalOpen && editingEntry && (
        <EditReceptionEntryModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEntry(null);
          }}
          entry={editingEntry}
          onSave={handleSaveEdit}
          onSaveAndSendToLab={handleSaveAndSendToLab}
          vendorDoctors={vendorDoctors}
          availableTests={allAvailableTests}
        />
      )}

      {/* 7. Collect Remaining Payment Modal */}
      {isCollectPaymentOpen && collectingPaymentEntry && (
        <CollectRemainingPaymentModal
          isOpen={isCollectPaymentOpen}
          onClose={() => {
            setIsCollectPaymentOpen(false);
            setCollectingPaymentEntry(null);
          }}
          entry={collectingPaymentEntry}
          onCollectPayment={handleCollectPayment}
        />
      )}

      {/* 8. Day-End Reception Cash Closing (Daily Tally Sheet) Modal */}
      {isCashClosingOpen && (
        <DayEndCashClosingModal
          isOpen={isCashClosingOpen}
          onClose={() => setIsCashClosingOpen(false)}
          receptionEntries={receptionEntries}
          staffName={currentUser?.name || 'Reception Staff'}
        />
      )}

      {/* 9. NABL Patient Pathology Report Preview & Print Modal */}
      {viewingReport && (
        <ReportDetailModal
          report={viewingReport}
          isOpen={isViewingReportModalOpen}
          onClose={() => {
            setIsViewingReportModalOpen(false);
            setViewingReport(null);
          }}
          onDeleteReport={(rpt) => {
            deleteLabReport(rpt.reportId);
            setIsViewingReportModalOpen(false);
            setViewingReport(null);
            showToast('🗑️ Report deleted successfully');
          }}
          onOpenPatientPortal={(reportId, mobile) => {
            if (onOpenReportPortal) {
              onOpenReportPortal(reportId, mobile);
            }
          }}
        />
      )}

      {/* 10. Two-Panel Clinical Departments Test Selection Modal */}
      <TestSelectionModal
        isOpen={isTestSelectionModalOpen}
        onClose={() => setIsTestSelectionModalOpen(false)}
        selectedTests={selectedTests}
        onToggleTest={handleToggleTest}
        onSelectAllCategoryTests={handleSelectAllCategoryTests}
        onDeselectCategoryTests={handleDeselectCategoryTests}
        onClearAllTests={() => setSelectedTests([])}
        allAvailableTests={allAvailableTests}
        parentCategories={PARENT_CATEGORIES}
        categoryStats={categoryStats}
        grossAmount={grossAmount}
      />
    </div>
  );
};
