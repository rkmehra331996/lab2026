import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Save,
  X,
  Clock,
  Sparkles,
  Tag,
  DollarSign,
  Droplet,
  Eye,
  EyeOff,
  IndianRupee,
  Check,
  AlertTriangle,
  TrendingDown,
  Layers,
  LayoutGrid,
  List,
  Info,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Activity,
  Package,
  Power,
  RotateCcw,
  SlidersHorizontal,
  Home,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Building,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { TestItem, TestParameterItem } from '../../types';
import {
  LAB_TEST_CATEGORIES,
  LabTestCategory,
  CATEGORY_METADATA,
  DEFAULT_CATEGORY_META,
  CategoryMeta,
  STANDARD_SAMPLE_TYPES,
  STANDARD_TEST_METHODS,
  REPORT_TIME_PRESETS,
  MASTER_CLINICAL_TESTS,
  isCategoryMatch,
} from '../../data/masterClinicalTests';
import { VendorPackagesTab } from './VendorPackagesTab';

export type TestManagementSubTab = 'list' | 'add' | 'categories' | 'packages';

interface VendorTestsTabProps {
  initialSubTab?: TestManagementSubTab | 'list' | 'add';
  activeSubTab?: TestManagementSubTab | 'list' | 'add';
  onSubTabChange?: (tab: TestManagementSubTab) => void;
  onPreviewWebsite?: () => void;
}

export const VendorTestsTab: React.FC<VendorTestsTabProps> = ({
  initialSubTab = 'list',
  activeSubTab: externalSubTab,
  onSubTabChange,
  onPreviewWebsite,
}) => {
  const { vendorTests, addVendorTest, updateVendorTest, deleteVendorTest, vendorLabSettings, updateVendorLabSettings } = useCms();

  const isPricesShownOnWebsite = vendorLabSettings?.showPricesOnWebsite !== false;
  const handleToggleWebsitePrices = () => {
    const nextVal = !isPricesShownOnWebsite;
    updateVendorLabSettings({ showPricesOnWebsite: nextVal });
    showToast(nextVal ? '✅ Website setting updated: Test prices are now VISIBLE on public website.' : '🔒 Website setting updated: Test prices are now HIDDEN from public website (kept visible in Reception/LIMS).');
  };

  // Active sub-tab state (All Tests, Add Test, Test Categories, Test Packages)
  const [internalSubTab, setInternalSubTab] = useState<TestManagementSubTab>(
    (initialSubTab as TestManagementSubTab) || 'list'
  );
  const currentSubTab: TestManagementSubTab = (externalSubTab as TestManagementSubTab) || internalSubTab;

  const handleSubTabChange = (tab: TestManagementSubTab) => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  // Search & Filter state for All Tests view
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Popular' | 'HomeCollection' | 'Fasting'>('All');
  const [sampleTypeFilter, setSampleTypeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name_asc' | 'price_asc' | 'price_desc' | 'tat' | 'category'>('category');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Modal States
  const [viewingTest, setViewingTest] = useState<TestItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [deletingTest, setDeletingTest] = useState<TestItem | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // -------------------------------------------------------------
  // DYNAMIC FORM STATE FOR ADD TEST
  // -------------------------------------------------------------
  const initialFormState = (): Omit<TestItem, 'id'> => ({
    name: '',
    code: `TST-${(vendorTests.length + 101).toString()}`,
    category: 'Biochemistry',
    subcategory: 'Metabolic & Routine',
    sampleType: 'Serum (Gel / Clot Activator - Red/Yellow Vial)',
    unit: 'mg/dL',
    normalRange: 'Normal biological reference range',
    priceINR: 350,
    mrpINR: 600,
    vendorPriceINR: 120,
    discountPriceINR: 350,
    turnaroundTime: '4 Hours',
    reportTime: '3-4 Hours (Same Day Fast)',
    tatHours: 4,
    description: 'Standard diagnostic test for routine preventive and clinical evaluation.',
    testMethod: 'Spectrophotometry / Photometric Analyzer',
    fastingRequired: false,
    fastingHours: '',
    instructions: 'No special fasting preparation needed. Stay well hydrated.',
    preparationInstructions: 'No dietary restrictions. Drink plenty of water.',
    homeCollection: true,
    homeCollectionAvailable: true,
    isPopular: false,
    status: 'Active',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
    parameters: [
      { name: 'Standard Parameter', unit: 'mg/dL', normalRange: 'Normal', method: 'Standard Assay' },
    ],
  });

  const [testForm, setTestForm] = useState<Omit<TestItem, 'id'>>(initialFormState());

  // Helper to add / remove parameters in Add/Edit forms
  const handleAddParam = (isEdit: boolean = false) => {
    if (isEdit && editingTest) {
      const currentParams = (editingTest.parameters as TestParameterItem[]) || [];
      const newParam: TestParameterItem = {
        name: `Parameter ${currentParams.length + 1}`,
        unit: 'mg/dL',
        normalRange: 'Normal range',
        method: editingTest.testMethod || 'Automated',
      };
      setEditingTest({
        ...editingTest,
        parameters: [...currentParams, newParam],
      });
    } else {
      const currentParams = (testForm.parameters as TestParameterItem[]) || [];
      const newParam: TestParameterItem = {
        name: `Parameter ${currentParams.length + 1}`,
        unit: 'mg/dL',
        normalRange: 'Normal range',
        method: testForm.testMethod || 'Automated',
      };
      setTestForm({
        ...testForm,
        parameters: [...currentParams, newParam],
      });
    }
  };

  const handleRemoveParam = (index: number, isEdit: boolean = false) => {
    if (isEdit && editingTest) {
      const currentParams = (editingTest.parameters as TestParameterItem[]) || [];
      setEditingTest({
        ...editingTest,
        parameters: currentParams.filter((_, i) => i !== index),
      });
    } else {
      const currentParams = (testForm.parameters as TestParameterItem[]) || [];
      setTestForm({
        ...testForm,
        parameters: currentParams.filter((_, i) => i !== index),
      });
    }
  };

  const handleUpdateParamField = (
    index: number,
    field: keyof TestParameterItem,
    value: string,
    isEdit: boolean = false
  ) => {
    if (isEdit && editingTest) {
      const currentParams = [...((editingTest.parameters as TestParameterItem[]) || [])];
      if (currentParams[index]) {
        currentParams[index] = { ...currentParams[index], [field]: value };
        setEditingTest({ ...editingTest, parameters: currentParams });
      }
    } else {
      const currentParams = [...((testForm.parameters as TestParameterItem[]) || [])];
      if (currentParams[index]) {
        currentParams[index] = { ...currentParams[index], [field]: value };
        setTestForm({ ...testForm, parameters: currentParams });
      }
    }
  };

  // 1-Click Fast Presets loader from master clinical tests
  const handleApplyPreset = (presetTest: TestItem) => {
    setTestForm({
      name: presetTest.name,
      code: presetTest.code,
      category: presetTest.category,
      subcategory: presetTest.subcategory || CATEGORY_METADATA[presetTest.category as LabTestCategory]?.subcategories[0] || '',
      sampleType: presetTest.sampleType,
      unit: presetTest.unit,
      normalRange: presetTest.normalRange,
      priceINR: presetTest.priceINR,
      mrpINR: presetTest.mrpINR || presetTest.priceINR * 1.5,
      vendorPriceINR: presetTest.vendorPriceINR || Math.round(presetTest.priceINR * 0.35),
      discountPriceINR: presetTest.priceINR,
      turnaroundTime: presetTest.turnaroundTime || '4 Hours',
      reportTime: presetTest.reportTime || '3-4 Hours (Same Day Fast)',
      tatHours: presetTest.tatHours || 4,
      description: presetTest.description || '',
      testMethod: presetTest.testMethod || 'Automated Clinical Assay',
      fastingRequired: !!presetTest.fastingRequired,
      fastingHours: presetTest.fastingRequired ? '10-12 Hours' : '',
      instructions: presetTest.instructions || '',
      preparationInstructions: presetTest.preparationInstructions || presetTest.instructions || '',
      homeCollection: presetTest.homeCollection !== false,
      homeCollectionAvailable: presetTest.homeCollection !== false,
      isPopular: !!presetTest.isPopular,
      status: 'Active',
      isActive: true,
      image: presetTest.image || 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
      parameters: presetTest.parameters || [
        { name: presetTest.name, unit: presetTest.unit, normalRange: presetTest.normalRange },
      ],
    });
    showToast(`Loaded preset template for "${presetTest.name}"!`);
  };

  // -------------------------------------------------------------
  // FILTERING, SORTING & PAGINATION FOR ALL TESTS
  // -------------------------------------------------------------
  const filteredAndSortedTests = useMemo(() => {
    let result = vendorTests.filter((test) => {
      // 1. Text search
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        test.name.toLowerCase().includes(q) ||
        test.code.toLowerCase().includes(q) ||
        test.category.toLowerCase().includes(q) ||
        (test.subcategory && test.subcategory.toLowerCase().includes(q)) ||
        (test.sampleType && test.sampleType.toLowerCase().includes(q)) ||
        (test.testMethod && test.testMethod.toLowerCase().includes(q)) ||
        (Array.isArray(test.parameters) &&
          test.parameters.some((p) => {
            if (typeof p === 'string') return p.toLowerCase().includes(q);
            return p.name.toLowerCase().includes(q);
          }));

      // 2. Category filter
      const matchCategory =
        selectedCategory === 'All' || isCategoryMatch(test.category, selectedCategory);

      // 3. Status filter
      let matchStatus = true;
      if (statusFilter === 'Active') {
        matchStatus = test.status === 'Active' || test.isActive !== false;
      } else if (statusFilter === 'Inactive') {
        matchStatus = test.status === 'Inactive' || test.isActive === false;
      } else if (statusFilter === 'Popular') {
        matchStatus = !!test.isPopular;
      } else if (statusFilter === 'HomeCollection') {
        matchStatus = test.homeCollection !== false && test.homeCollectionAvailable !== false;
      } else if (statusFilter === 'Fasting') {
        matchStatus = !!test.fastingRequired;
      }

      // 4. Sample type filter
      const matchSampleType =
        sampleTypeFilter === 'All' ||
        (test.sampleType && test.sampleType.toLowerCase().includes(sampleTypeFilter.toLowerCase()));

      return matchSearch && matchCategory && matchStatus && matchSampleType;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'price_asc') {
        return a.priceINR - b.priceINR;
      }
      if (sortBy === 'price_desc') {
        return b.priceINR - a.priceINR;
      }
      if (sortBy === 'tat') {
        return (a.tatHours || 4) - (b.tatHours || 4);
      }
      if (sortBy === 'category') {
        const catCompare = a.category.localeCompare(b.category);
        if (catCompare !== 0) return catCompare;
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [vendorTests, searchTerm, selectedCategory, statusFilter, sampleTypeFilter, sortBy]);

  // Paginated tests slice
  const totalTestsCount = filteredAndSortedTests.length;
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalTestsCount / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedTests = useMemo(() => {
    if (pageSize === 0) return filteredAndSortedTests;
    const startIndex = (effectivePage - 1) * pageSize;
    return filteredAndSortedTests.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedTests, effectivePage, pageSize]);

  // Category counts map
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: vendorTests.length };
    LAB_TEST_CATEGORIES.forEach((cat) => {
      counts[cat] = vendorTests.filter((t) => isCategoryMatch(t.category, cat)).length;
    });
    return counts;
  }, [vendorTests]);

  // Status counts map
  const statusCounts = useMemo(() => {
    return {
      all: vendorTests.length,
      active: vendorTests.filter((t) => t.status === 'Active' || t.isActive !== false).length,
      inactive: vendorTests.filter((t) => t.status === 'Inactive' || t.isActive === false).length,
      popular: vendorTests.filter((t) => t.isPopular).length,
      homeCollection: vendorTests.filter((t) => t.homeCollection !== false && t.homeCollectionAvailable !== false).length,
      fasting: vendorTests.filter((t) => t.fastingRequired).length,
    };
  }, [vendorTests]);

  // -------------------------------------------------------------
  // ACTION HANDLERS (Add, Edit, Delete, Activate, Deactivate)
  // -------------------------------------------------------------
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.name.trim()) {
      alert('Please enter a valid Test Name');
      return;
    }
    if (!testForm.code.trim()) {
      alert('Please enter a valid Test Code');
      return;
    }

    const payload: Omit<TestItem, 'id'> = {
      ...testForm,
      name: testForm.name.trim(),
      code: testForm.code.trim().toUpperCase(),
      priceINR: Number(testForm.discountPriceINR || testForm.priceINR || 0),
      discountPriceINR: Number(testForm.discountPriceINR || testForm.priceINR || 0),
      mrpINR: Number(testForm.mrpINR || testForm.priceINR || 0),
      vendorPriceINR: Number(testForm.vendorPriceINR || 0),
      status: testForm.status || 'Active',
      isActive: testForm.status === 'Active',
    };

    addVendorTest(payload);
    showToast(`✅ Test "${payload.name}" added successfully to your laboratory catalog!`);

    // Reset form
    setTestForm(initialFormState());
    handleSubTabChange('list');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;

    const updatedData: Partial<TestItem> = {
      ...editingTest,
      name: editingTest.name.trim(),
      code: editingTest.code.trim().toUpperCase(),
      priceINR: Number(editingTest.discountPriceINR || editingTest.priceINR || 0),
      discountPriceINR: Number(editingTest.discountPriceINR || editingTest.priceINR || 0),
      mrpINR: Number(editingTest.mrpINR || editingTest.priceINR || 0),
      vendorPriceINR: Number(editingTest.vendorPriceINR || 0),
      status: editingTest.status || 'Active',
      isActive: editingTest.status === 'Active',
    };

    updateVendorTest(editingTest.id, updatedData);
    showToast(`✅ Test "${updatedData.name}" updated successfully!`);
    setIsEditModalOpen(false);
    setEditingTest(null);
  };

  const handleToggleStatus = (test: TestItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyActive = test.status === 'Active' || test.isActive !== false;
    const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    updateVendorTest(test.id, {
      status: newStatus,
      isActive: !isCurrentlyActive,
    });
    showToast(
      isCurrentlyActive
        ? `⏸️ Test "${test.name}" deactivated (hidden from public website booking).`
        : `✅ Test "${test.name}" activated (live on website & booking portal)!`
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingTest) return;
    deleteVendorTest(deletingTest.id);
    showToast(`🗑️ Test "${deletingTest.name}" removed from catalog.`);
    setDeletingTest(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-3 border border-indigo-400/40 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP HEADER & MODULE NAVIGATION TABS                      */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#1a4a82] to-[#0F284E] text-white p-5 rounded-2xl shadow-sm border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-xl bg-amber-400/20 text-amber-300">
                <FlaskConical className="w-5 h-5 text-amber-300" />
              </span>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Lab Test Management
              </h1>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 shadow-2xs font-mono">
                {vendorTests.length} Total Tests
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-slate-200 border border-white/20">
                13 Clinical Specialties
              </span>
            </div>
            <p className="text-xs text-slate-200 max-w-3xl leading-relaxed">
              Complete test directory for <strong>{vendorLabSettings?.labName || 'Your Laboratory'}</strong>. All clinical tests with full parameters, normal reference ranges, specimen tubes, and pricing are permanently available across your dashboard, reception counter, technician desk, and online booking portal.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Website Price Setting Toggle */}
            <button
              type="button"
              id="btn-vendor-tests-toggle-price-visibility"
              onClick={handleToggleWebsitePrices}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
                isPricesShownOnWebsite
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                  : 'bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border-amber-400/50'
              }`}
              title={isPricesShownOnWebsite ? 'Click to hide prices on public website' : 'Click to show prices on public website'}
            >
              {isPricesShownOnWebsite ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Website Prices: <strong className="text-white">ON</strong></span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-300" />
                  <span>Website Prices: <strong className="text-amber-200">OFF (Hidden)</strong></span>
                </>
              )}
            </button>

            {onPreviewWebsite && (
              <button
                type="button"
                onClick={onPreviewWebsite}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-2xs"
                title="Preview live test booking catalog on your website"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Preview Website</span>
              </button>
            )}
          </div>
        </div>

        {/* Unified Subtabs Bar (All Tests, Add Test, Test Categories, Test Packages) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 border-t border-white/10">
          {/* Tab 1: All Tests */}
          <button
            type="button"
            onClick={() => handleSubTabChange('list')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs ${
              currentSubTab === 'list'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>All Tests ({vendorTests.length})</span>
          </button>

          {/* Tab 2: Add Test */}
          <button
            type="button"
            onClick={() => handleSubTabChange('add')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs ${
              currentSubTab === 'add'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add New Test</span>
          </button>

          {/* Tab 3: Test Categories */}
          <button
            type="button"
            onClick={() => handleSubTabChange('categories')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs ${
              currentSubTab === 'categories'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Test Categories (13 Specialties)</span>
          </button>

          {/* Tab 4: Test Packages */}
          <button
            type="button"
            onClick={() => handleSubTabChange('packages')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs ${
              currentSubTab === 'packages'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Test Packages</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUBTAB 1: ALL TESTS (LIST, SEARCH, FILTER & ACTIONS)      */}
      {/* ======================================================== */}
      {currentSubTab === 'list' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Catalog</span>
                <span className="text-xl font-black text-slate-900">{statusCounts.all} Tests</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base">
                🧪
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Active &amp; Bookable</span>
                <span className="text-xl font-black text-emerald-700">{statusCounts.active} Live</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base">
                ✓
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">Home Collection</span>
                <span className="text-xl font-black text-teal-700">{statusCounts.homeCollection} Tests</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-base">
                🏡
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Fasting Tests</span>
                <span className="text-xl font-black text-amber-700">{statusCounts.fasting} Tests</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-base">
                ⏱️
              </div>
            </div>
          </div>

          {/* Search, Category Filter & Control Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search test by name, test code (e.g. HEM-CBC), parameter, method or sample..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#123B6D]/30 focus:border-[#123B6D] focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status Filter Dropdown & View Mode */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Status ({statusCounts.all})</option>
                  <option value="Active">Active Only ({statusCounts.active})</option>
                  <option value="Inactive">Inactive ({statusCounts.inactive})</option>
                  <option value="Popular">⭐ Popular Tests ({statusCounts.popular})</option>
                  <option value="HomeCollection">🏡 Home Collection ({statusCounts.homeCollection})</option>
                  <option value="Fasting">⏱️ Fasting Required ({statusCounts.fasting})</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="category">Sort: Category-wise</option>
                  <option value="name_asc">Sort: Name (A-Z)</option>
                  <option value="price_asc">Sort: Price (Low to High)</option>
                  <option value="price_desc">Sort: Price (High to Low)</option>
                  <option value="tat">Sort: Report TAT (Fastest)</option>
                </select>

                {/* View Mode Toggle: Grid vs Table */}
                <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      viewMode === 'table' ? 'bg-white shadow-2xs text-[#123B6D]' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      viewMode === 'grid' ? 'bg-white shadow-2xs text-[#123B6D]' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Grid Cards View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubTabChange('add')}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Test</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills (13 Specialties) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'All'
                    ? 'bg-[#123B6D] text-white shadow-xs font-black'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All ({categoryCounts['All'] || vendorTests.length})
              </button>

              {LAB_TEST_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                const meta = CATEGORY_METADATA[cat];
                const count = categoryCounts[cat] || 0;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs font-black'
                        : `${meta.bgLight} ${meta.borderColor} text-slate-800 hover:brightness-95`
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary & Pagination Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div>
              Showing{' '}
              <strong className="text-slate-900 font-mono">
                {totalTestsCount === 0 ? 0 : (effectivePage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900 font-mono">
                {Math.min(effectivePage * pageSize, totalTestsCount)}
              </strong>{' '}
              of <strong className="text-slate-900 font-mono">{totalTestsCount}</strong> Tests
              {selectedCategory !== 'All' && <span> in <strong>{selectedCategory}</strong></span>}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="p-1 rounded-lg border border-slate-200 bg-white font-bold text-xs"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={0}>All</option>
              </select>
            </div>
          </div>

          {/* Empty State */}
          {filteredAndSortedTests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-slate-900">No Tests Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No tests matched your search query or filters. Clear your filters or click below to add a new test.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setStatusFilter('All');
                    setSampleTypeFilter('All');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Reset All Filters
                </button>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('add')}
                  className="px-4 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition"
                >
                  + Add New Test
                </button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            /* ======================================================== */
            /* TABLE VIEW                                               */
            /* ======================================================== */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                      <th className="py-3 px-4">Test Details &amp; Code</th>
                      <th className="py-3 px-3">Category &amp; Method</th>
                      <th className="py-3 px-3">Sample Specimen</th>
                      <th className="py-3 px-3">Pricing (₹ MRP / Vendor / Sale)</th>
                      <th className="py-3 px-3">Report TAT</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paginatedTests.map((test) => {
                      const isActive = test.status === 'Active' || test.isActive !== false;
                      const catMeta = CATEGORY_METADATA[test.category as LabTestCategory];
                      const paramsCount = Array.isArray(test.parameters) ? test.parameters.length : 1;
                      const mrp = test.mrpINR || test.priceINR * 1.5;
                      const vendorCost = test.vendorPriceINR || Math.round(test.priceINR * 0.35);
                      const discountPrice = test.discountPriceINR || test.priceINR;
                      const marginPct = mrp > 0 ? Math.round(((discountPrice - vendorCost) / discountPrice) * 100) : 0;

                      return (
                        <tr
                          key={test.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => setViewingTest(test)}
                        >
                          {/* Test Name & Code */}
                          <td className="py-3 px-4 min-w-[220px]">
                            <div className="flex items-start gap-2.5">
                              <span className="text-lg shrink-0 mt-0.5">{catMeta?.icon || '🧪'}</span>
                              <div className="min-w-0">
                                <div className="font-black text-slate-900 group-hover:text-[#123B6D] transition flex items-center gap-1.5 flex-wrap">
                                  <span>{test.name}</span>
                                  {test.isPopular && (
                                    <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-black">
                                      ⭐ POPULAR
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    {test.code}
                                  </span>
                                  <span>•</span>
                                  <span>{paramsCount} Parameter{paramsCount !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category & Method */}
                          <td className="py-3 px-3 min-w-[150px]">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block border ${
                                catMeta ? `${catMeta.bgLight} ${catMeta.borderColor} ${catMeta.color}` : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {test.category}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[160px]" title={test.testMethod || 'Standard Automated Method'}>
                              {test.testMethod || 'Automated Method'}
                            </p>
                          </td>

                          {/* Sample Specimen */}
                          <td className="py-3 px-3 min-w-[140px]">
                            <div className="flex items-center gap-1 text-[11px] text-slate-800 font-semibold truncate max-w-[160px]" title={test.sampleType}>
                              <Droplet className="w-3 h-3 text-rose-500 shrink-0" />
                              <span className="truncate">{test.sampleType}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {test.fastingRequired ? (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  ⏱️ Fasting
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-slate-500">
                                  Non-Fasting
                                </span>
                              )}
                              {test.homeCollection !== false && (
                                <span className="text-[9px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                                  🏡 Home
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Pricing */}
                          <td className="py-3 px-3 min-w-[150px] font-mono">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-black text-slate-900">₹{discountPrice}</span>
                              {mrp > discountPrice && (
                                <span className="text-[10px] text-slate-400 line-through">₹{mrp}</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Cost: ₹{vendorCost} {marginPct > 0 && <span className="text-emerald-700 font-bold">({marginPct}% margin)</span>}
                            </div>
                          </td>

                          {/* TAT */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-slate-700">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-semibold">{test.turnaroundTime || `${test.tatHours || 4} Hours`}</span>
                            </div>
                          </td>

                          {/* Status & 1-Click Activate/Deactivate */}
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleToggleStatus(test, e)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer border flex items-center gap-1 mx-auto ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              }`}
                              title={isActive ? 'Click to Deactivate Test' : 'Click to Activate Test'}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
                              <span>{isActive ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setViewingTest(test)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-[#123B6D] transition cursor-pointer shadow-2xs"
                                title="View Full Test Details & Parameters"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Test */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTest({ ...test });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-blue-200 bg-blue-50/70 text-blue-800 hover:bg-blue-100 transition cursor-pointer shadow-2xs"
                                title="Edit Test Details & Pricing"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Activate / Deactivate Toggle */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleStatus(test, e)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer shadow-2xs ${
                                  isActive
                                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                }`}
                                title={isActive ? 'Deactivate Test' : 'Activate Test'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Test */}
                              <button
                                type="button"
                                onClick={() => setDeletingTest(test)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 transition cursor-pointer shadow-2xs"
                                title="Delete Test"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* GRID VIEW                                                */
            /* ======================================================== */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTests.map((test) => {
                const isActive = test.status === 'Active' || test.isActive !== false;
                const catMeta = CATEGORY_METADATA[test.category as LabTestCategory];
                const paramsCount = Array.isArray(test.parameters) ? test.parameters.length : 1;
                const mrp = test.mrpINR || test.priceINR * 1.5;
                const discountPrice = test.discountPriceINR || test.priceINR;
                const vendorCost = test.vendorPriceINR || Math.round(test.priceINR * 0.35);

                return (
                  <div
                    key={test.id}
                    className={`bg-white rounded-2xl border transition-all p-4 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                      isActive ? 'border-slate-200 hover:border-[#123B6D]/40' : 'border-slate-200 bg-slate-50/50 opacity-80'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header Strip */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl shrink-0">{catMeta?.icon || '🧪'}</span>
                          <div>
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block border ${
                                catMeta ? `${catMeta.bgLight} ${catMeta.borderColor} ${catMeta.color}` : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {test.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {test.code}
                            </span>
                          </div>
                        </div>

                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(test, e)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition cursor-pointer border flex items-center gap-1 ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                          {test.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {test.description || 'Standard diagnostic test for clinical pathology assessment.'}
                        </p>
                      </div>

                      {/* Badges Strip: Sample, Fasting, TAT, Parameters */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold truncate max-w-[150px]">
                          🧪 {test.sampleType}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold">
                          {paramsCount} Params
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{test.turnaroundTime || '4 Hrs'}</span>
                        </span>
                      </div>

                      {/* Pricing Box */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">Selling Price</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-slate-900">₹{discountPrice}</span>
                            {mrp > discountPrice && (
                              <span className="text-[10px] text-slate-400 line-through">₹{mrp}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-sans">Lab Cost</span>
                          <span className="text-xs font-bold text-slate-700">₹{vendorCost}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingTest(test)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTest({ ...test });
                            setIsEditModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-blue-700" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingTest(test)}
                          className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                          title="Delete test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pageSize > 0 && totalPages > 1 && (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-500">
                Page <strong className="text-slate-900">{effectivePage}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={effectivePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {/* Page number buttons */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && effectivePage > 3) {
                    pageNum = effectivePage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition cursor-pointer ${
                        effectivePage === pageNum
                          ? 'bg-[#123B6D] text-white shadow-xs'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={effectivePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 2: ADD NEW TEST FORM                               */}
      {/* ======================================================== */}
      {currentSubTab === 'add' && (
        <div className="space-y-6">
          {/* Quick Presets Strip */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>1-Click Popular Clinical Presets (भारतीय पैथोलॉजी मानक टेस्ट)</span>
              </span>
              <span className="text-[10px] text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full font-bold">
                Auto-fill details &amp; parameters
              </span>
            </div>
            <p className="text-[11px] text-amber-900/80">
              Click any standard preset below to instantly populate Test Name, Code, Category, Sample Type, Parameters, and Normal Ranges:
            </p>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
              {MASTER_CLINICAL_TESTS.slice(0, 8).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-slate-800 hover:bg-amber-100/70 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer active:scale-95"
                >
                  <span>{CATEGORY_METADATA[preset.category as LabTestCategory]?.icon || '🧪'}</span>
                  <span>{preset.name.split('(')[0].trim()}</span>
                  <span className="text-[10px] text-amber-800 font-mono">₹{preset.priceINR}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Add Test Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    Create &amp; Provision New Lab Test
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fill all test parameters, pricing, and sample collection rules. Test becomes instantly active for online bookings and counter reception.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Live Directory
              </span>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-6">
              {/* SECTION A: BASIC IDENTIFIERS */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span>1. Test Identification &amp; Category</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Test Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Test Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Complete Blood Count (CBC) with Automated ESR"
                      value={testForm.name}
                      onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:border-[#123B6D] focus:outline-none"
                    />
                  </div>

                  {/* Test Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span>Test Code <span className="text-rose-500">*</span></span>
                      <button
                        type="button"
                        onClick={() =>
                          setTestForm({
                            ...testForm,
                            code: `TST-${Date.now().toString().slice(-4)}`,
                          })
                        }
                        className="text-[10px] text-blue-600 hover:underline font-mono"
                      >
                        Auto-Gen
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HEM-CBC-01"
                      value={testForm.code}
                      onChange={(e) => setTestForm({ ...testForm, code: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-xs text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none uppercase"
                    />
                  </div>

                  {/* Category Dropdown (All 13 Specialties) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Category (Specialty) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={testForm.category}
                      onChange={(e) => {
                        const newCat = e.target.value as LabTestCategory;
                        const meta = CATEGORY_METADATA[newCat];
                        setTestForm({
                          ...testForm,
                          category: newCat,
                          subcategory: meta?.subcategories[0] || '',
                          sampleType: meta?.defaultSampleType || testForm.sampleType,
                          testMethod: meta?.defaultMethod || testForm.testMethod,
                        });
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none cursor-pointer"
                    >
                      {LAB_TEST_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_METADATA[cat]?.icon} {cat} ({CATEGORY_METADATA[cat]?.hindiName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Complete Hemogram"
                      value={testForm.subcategory || ''}
                      onChange={(e) => setTestForm({ ...testForm, subcategory: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                    {CATEGORY_METADATA[testForm.category as LabTestCategory]?.subcategories && (
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {CATEGORY_METADATA[testForm.category as LabTestCategory].subcategories.slice(0, 3).map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setTestForm({ ...testForm, subcategory: sub })}
                            className="text-[9px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            + {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Status (Live Availability)
                    </label>
                    <select
                      value={testForm.status || 'Active'}
                      onChange={(e) =>
                        setTestForm({
                          ...testForm,
                          status: e.target.value as any,
                          isActive: e.target.value === 'Active',
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none cursor-pointer"
                    >
                      <option value="Active">🟢 Active (Visible on Website &amp; Portal)</option>
                      <option value="Inactive">⚪ Inactive (Hidden / Temporarily Paused)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Clinical Description &amp; Indications
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe clinical utility, health indications, and diagnostic value of this test..."
                    value={testForm.description || ''}
                    onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>

                {/* Test Image */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Test Image (Photo URL / Banner)</span>
                    <span className="text-[10px] text-slate-400">Displays on booking card &amp; public catalog</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {testForm.image ? (
                      <img
                        src={testForm.image}
                        alt="Test Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100 shadow-2xs"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0 text-[10px] font-bold bg-slate-50">
                        No Img
                      </div>
                    )}
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or paste image URL"
                      value={testForm.image || ''}
                      onChange={(e) => setTestForm({ ...testForm, image: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: CLINICAL METHOD, SPECIMEN & REPORTING TIME */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span>2. Specimen, Method &amp; Turnaround Time</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sample Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Sample Type (Vial Specimen) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="sampleTypesList"
                      required
                      placeholder="e.g. Whole Blood (EDTA - Purple Vial)"
                      value={testForm.sampleType}
                      onChange={(e) => setTestForm({ ...testForm, sampleType: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                    <datalist id="sampleTypesList">
                      {STANDARD_SAMPLE_TYPES.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>

                  {/* Test Method */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Test Method (Technology / Analyzer)
                    </label>
                    <input
                      type="text"
                      list="testMethodsList"
                      placeholder="e.g. Automated Flow Cytometry / Electrical Impedance"
                      value={testForm.testMethod || ''}
                      onChange={(e) => setTestForm({ ...testForm, testMethod: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    />
                    <datalist id="testMethodsList">
                      {STANDARD_TEST_METHODS.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>

                  {/* Report Time / TAT */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Report Time (TAT)
                    </label>
                    <select
                      value={testForm.reportTime || '3-4 Hours (Same Day Fast)'}
                      onChange={(e) =>
                        setTestForm({
                          ...testForm,
                          reportTime: e.target.value,
                          turnaroundTime: e.target.value.split('(')[0].trim(),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none cursor-pointer"
                    >
                      {REPORT_TIME_PRESETS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fasting & Home Collection Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  {/* Fasting toggle */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="formFasting"
                      checked={testForm.fastingRequired}
                      onChange={(e) =>
                        setTestForm({
                          ...testForm,
                          fastingRequired: e.target.checked,
                          fastingHours: e.target.checked ? '10-12 Hours' : '',
                        })
                      }
                      className="w-4 h-4 text-[#123B6D] rounded border-slate-300 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="formFasting" className="font-bold text-xs text-slate-900 cursor-pointer">
                        Fasting Required for this test
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Patient must observe overnight or 8-12 hours fasting before sample collection.
                      </p>
                      {testForm.fastingRequired && (
                        <input
                          type="text"
                          placeholder="e.g. 10 to 12 Hours overnight fasting"
                          value={testForm.fastingHours || ''}
                          onChange={(e) => setTestForm({ ...testForm, fastingHours: e.target.value })}
                          className="mt-1.5 p-1.5 rounded-lg border border-slate-300 text-xs font-medium w-full bg-white"
                        />
                      )}
                    </div>
                  </div>

                  {/* Home collection toggle */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="formHomeColl"
                      checked={testForm.homeCollection !== false}
                      onChange={(e) =>
                        setTestForm({
                          ...testForm,
                          homeCollection: e.target.checked,
                          homeCollectionAvailable: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#123B6D] rounded border-slate-300 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="formHomeColl" className="font-bold text-xs text-slate-900 cursor-pointer">
                        Home Collection Available
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Phlebotomists can collect this sample at the patient's residence.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preparation Instructions */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Patient Preparation Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Avoid fatty meals night prior. Drink plain water. Stop biotin supplements 24 hours prior..."
                    value={testForm.preparationInstructions || testForm.instructions || ''}
                    onChange={(e) =>
                      setTestForm({
                        ...testForm,
                        preparationInstructions: e.target.value,
                        instructions: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION C: PRICING (MRP, VENDOR COST, DISCOUNT PRICE) */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <span>3. Pricing &amp; Commercial Margins (₹ INR)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* MRP */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      MRP (Maximum Retail Price ₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="600"
                        value={testForm.mrpINR}
                        onChange={(e) => setTestForm({ ...testForm, mrpINR: Number(e.target.value) })}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Crossed-out anchor price on portal</span>
                  </div>

                  {/* Vendor Price (Cost Price) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Vendor Price (Internal Lab Cost ₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="120"
                        value={testForm.vendorPriceINR}
                        onChange={(e) => setTestForm({ ...testForm, vendorPriceINR: Number(e.target.value) })}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Reagent / technical execution cost</span>
                  </div>

                  {/* Discount Price / Selling Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Discount Price (Final Selling Price ₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-600">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="350"
                        value={testForm.discountPriceINR || testForm.priceINR}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTestForm({ ...testForm, discountPriceINR: val, priceINR: val });
                        }}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-emerald-300 text-xs font-mono font-black text-emerald-700 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
                      Actual billed amount to patients
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION D: DYNAMIC TEST PARAMETERS TABLE */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      4. Test Parameters (जाँच के मानक व रेंज)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Define individual measured analytes, units, and biological reference ranges that print on verified reports.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddParam(false)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-indigo-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Parameter</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-600">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Parameter Name</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">Normal Reference Range</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {((testForm.parameters as TestParameterItem[]) || []).map((param, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-400 font-mono font-bold text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={param.name}
                              onChange={(e) => handleUpdateParamField(idx, 'name', e.target.value, false)}
                              placeholder="e.g. Hemoglobin"
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={param.unit || ''}
                              onChange={(e) => handleUpdateParamField(idx, 'unit', e.target.value, false)}
                              placeholder="g/dL"
                              className="w-24 p-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 font-mono bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={param.normalRange || ''}
                              onChange={(e) => handleUpdateParamField(idx, 'normalRange', e.target.value, false)}
                              placeholder="13.0 – 17.0"
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={param.method || ''}
                              onChange={(e) => handleUpdateParamField(idx, 'method', e.target.value, false)}
                              placeholder="Automated"
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveParam(idx, false)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete parameter row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Submission Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSubTabChange('list')}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-black shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save &amp; Publish Test</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 3: TEST CATEGORIES (13 CLINICAL SPECIALTIES)       */}
      {/* ======================================================== */}
      {currentSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>13 Medical Laboratory Specialties &amp; Departments</span>
            </h2>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Every department category is pre-configured with clinical diagnostic workflows, NABL compliant subcategories, standard sample tubes, and automated analyzers. Click any category to view and manage its tests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAB_TEST_CATEGORIES.map((cat) => {
              const meta: CategoryMeta = CATEGORY_METADATA[cat] || DEFAULT_CATEGORY_META;
              const testsInCat = vendorTests.filter((t) => isCategoryMatch(t.category, cat));
              const activeCount = testsInCat.filter((t) => t.status === 'Active' || t.isActive !== false).length;
              const prices = testsInCat.map((t) => t.discountPriceINR || t.priceINR);
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
              const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

              return (
                <div
                  key={cat}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-2xs border ${meta.bgLight} ${meta.borderColor}`}
                        >
                          {meta.icon}
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-slate-900 group-hover:text-[#123B6D] transition">
                            {cat}
                          </h3>
                          <span className="text-[11px] font-bold text-slate-500 font-sans">
                            {meta.hindiName}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {testsInCat.length} Tests
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {meta.description}
                    </p>

                    <div className="space-y-1.5 pt-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Active Bookable:</span>
                        <span className="font-bold text-emerald-700">{activeCount} Tests</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Price Range:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {prices.length > 0 ? `₹${minPrice} – ₹${maxPrice}` : 'N/A'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1">
                        <span className="font-bold text-slate-700">Subcategories: </span>
                        <span>{meta.subcategories.slice(0, 3).join(', ')}...</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        handleSubTabChange('list');
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-[#123B6D] hover:text-white text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>View Tests ({testsInCat.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTestForm({
                          ...initialFormState(),
                          category: cat,
                          subcategory: meta.subcategories[0] || '',
                          sampleType: meta.defaultSampleType,
                          testMethod: meta.defaultMethod,
                        });
                        handleSubTabChange('add');
                      }}
                      className="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title={`Add new test in ${cat}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 4: TEST PACKAGES EMBEDDED                          */}
      {/* ======================================================== */}
      {currentSubTab === 'packages' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-amber-950">
                Bundle individual clinical tests into comprehensive full-body preventive health checkups and seasonal packages.
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
              Package Engine
            </span>
          </div>

          <VendorPackagesTab onPreviewWebsite={onPreviewWebsite} />
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: VIEW TEST DETAILS & PARAMETERS MODAL             */}
      {/* ======================================================== */}
      {viewingTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-[#123B6D] text-white flex items-start justify-between gap-3 sticky top-0 z-10">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">
                  {CATEGORY_METADATA[viewingTest.category as LabTestCategory]?.icon || '🧪'}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
                      {viewingTest.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                      {viewingTest.category}
                    </span>
                    {viewingTest.status === 'Active' ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                        Active ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-500 text-white">
                        Inactive ⏸️
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
                    {viewingTest.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingTest(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Commercial Pricing Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center font-mono">
                <div>
                  <span className="text-[10px] font-sans text-slate-400 uppercase block">MRP Price</span>
                  <span className="text-sm font-bold text-slate-500 line-through">
                    ₹{viewingTest.mrpINR || viewingTest.priceINR * 1.5}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-sans text-emerald-700 font-bold uppercase block">Selling Price</span>
                  <span className="text-lg font-black text-emerald-700">
                    ₹{viewingTest.discountPriceINR || viewingTest.priceINR}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-sans text-slate-400 uppercase block">Lab Cost</span>
                  <span className="text-sm font-bold text-slate-700">
                    ₹{viewingTest.vendorPriceINR || Math.round(viewingTest.priceINR * 0.35)}
                  </span>
                </div>
              </div>

              {/* Clinical Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Sample Specimen</span>
                  <span className="font-bold text-slate-800">{viewingTest.sampleType}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Report TAT</span>
                  <span className="font-bold text-slate-800">{viewingTest.turnaroundTime || `${viewingTest.tatHours || 4} Hours`}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Fasting Rule</span>
                  <span className="font-bold text-slate-800">
                    {viewingTest.fastingRequired ? '⏱️ Fasting Required' : '✓ Non-Fasting'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Test Method</span>
                  <span className="font-medium text-slate-800">{viewingTest.testMethod || 'Automated Method'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Home Collection</span>
                  <span className="font-bold text-slate-800">
                    {viewingTest.homeCollection !== false ? '🏡 Available' : '❌ Lab Visit Only'}
                  </span>
                </div>
              </div>

              {/* Description & Preparation */}
              {viewingTest.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {viewingTest.description}
                  </p>
                </div>
              )}

              {viewingTest.instructions && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Patient Instructions</span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                    {viewingTest.instructions}
                  </p>
                </div>
              )}

              {/* Parameters Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Test Analyte Parameters ({Array.isArray(viewingTest.parameters) ? viewingTest.parameters.length : 1})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Prints on Final Report</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-600">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Parameter</th>
                        <th className="py-2 px-3">Unit</th>
                        <th className="py-2 px-3">Normal Reference Interval</th>
                        <th className="py-2 px-3">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.isArray(viewingTest.parameters) && viewingTest.parameters.length > 0 ? (
                        viewingTest.parameters.map((p, idx) => {
                          const paramObj: TestParameterItem =
                            typeof p === 'string'
                              ? { name: p, unit: viewingTest.unit, normalRange: viewingTest.normalRange }
                              : p;
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{paramObj.name}</td>
                              <td className="py-2 px-3 font-mono text-slate-600">{paramObj.unit || '-'}</td>
                              <td className="py-2 px-3 font-mono text-slate-800">{paramObj.normalRange || '-'}</td>
                              <td className="py-2 px-3 text-slate-500 text-[11px]">{paramObj.method || viewingTest.testMethod || '-'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="py-2 px-3 text-slate-400 font-mono">1</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{viewingTest.name}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{viewingTest.unit}</td>
                          <td className="py-2 px-3 font-mono text-slate-800">{viewingTest.normalRange}</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">{viewingTest.testMethod || '-'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => handleToggleStatus(viewingTest, e)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  viewingTest.status === 'Active'
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                {viewingTest.status === 'Active' ? '⏸️ Deactivate Test' : '🟢 Activate Test'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = { ...viewingTest };
                    setViewingTest(null);
                    setEditingTest(toEdit);
                    setIsEditModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit This Test</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT TEST DETAILS MODAL                          */}
      {/* ======================================================== */}
      {isEditModalOpen && editingTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-[#123B6D] text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 text-white flex items-center justify-center font-black">
                  <Edit2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Edit Lab Test</h3>
                  <p className="text-xs text-slate-300">
                    Modifying {editingTest.name} ({editingTest.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTest(null);
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    value={editingTest.name}
                    onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Test Code *</label>
                  <input
                    type="text"
                    required
                    value={editingTest.code}
                    onChange={(e) => setEditingTest({ ...editingTest, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Category *</label>
                  <select
                    value={editingTest.category}
                    onChange={(e) => setEditingTest({ ...editingTest, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    {LAB_TEST_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={editingTest.subcategory || ''}
                    onChange={(e) => setEditingTest({ ...editingTest, subcategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Status</label>
                  <select
                    value={editingTest.status || 'Active'}
                    onChange={(e) =>
                      setEditingTest({
                        ...editingTest,
                        status: e.target.value as any,
                        isActive: e.target.value === 'Active',
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="Active">Active (Live)</option>
                    <option value="Inactive">Inactive (Paused)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Sample Type</label>
                  <input
                    type="text"
                    value={editingTest.sampleType}
                    onChange={(e) => setEditingTest({ ...editingTest, sampleType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Test Method</label>
                  <input
                    type="text"
                    value={editingTest.testMethod || ''}
                    onChange={(e) => setEditingTest({ ...editingTest, testMethod: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Report TAT</label>
                  <input
                    type="text"
                    value={editingTest.turnaroundTime || ''}
                    onChange={(e) => setEditingTest({ ...editingTest, turnaroundTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    value={editingTest.mrpINR}
                    onChange={(e) => setEditingTest({ ...editingTest, mrpINR: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Selling / Discount Price (₹) *</label>
                  <input
                    type="number"
                    value={editingTest.discountPriceINR || editingTest.priceINR}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingTest({ ...editingTest, discountPriceINR: val, priceINR: val });
                    }}
                    className="w-full p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/40 font-mono font-black text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Lab Cost (₹)</label>
                  <input
                    type="number"
                    value={editingTest.vendorPriceINR}
                    onChange={(e) => setEditingTest({ ...editingTest, vendorPriceINR: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Description, Preparation Instructions & Image */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Clinical Description &amp; Indications</label>
                  <textarea
                    rows={2}
                    value={editingTest.description || ''}
                    onChange={(e) => setEditingTest({ ...editingTest, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    placeholder="Clinical purpose and health indications..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Patient Preparation Instructions</label>
                  <textarea
                    rows={2}
                    value={editingTest.preparationInstructions || editingTest.instructions || ''}
                    onChange={(e) =>
                      setEditingTest({
                        ...editingTest,
                        preparationInstructions: e.target.value,
                        instructions: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    placeholder="e.g. Fasting guidelines, medication notices..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Test Image (Photo URL / Banner)</label>
                  <div className="flex items-center gap-3">
                    {editingTest.image ? (
                      <img
                        src={editingTest.image}
                        alt="Test Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100 shadow-2xs"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0 text-[10px] font-bold bg-slate-50">
                        No Img
                      </div>
                    )}
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or paste image URL"
                      value={editingTest.image || ''}
                      onChange={(e) => setEditingTest({ ...editingTest, image: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingTest.fastingRequired}
                    onChange={(e) => setEditingTest({ ...editingTest, fastingRequired: e.target.checked })}
                    className="w-4 h-4 text-[#123B6D] rounded"
                  />
                  <span>Fasting Required</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingTest.homeCollection !== false}
                    onChange={(e) =>
                      setEditingTest({
                        ...editingTest,
                        homeCollection: e.target.checked,
                        homeCollectionAvailable: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#123B6D] rounded"
                  />
                  <span>Home Collection Available</span>
                </label>
              </div>

              {/* Parameters List in Edit Modal */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 uppercase text-[11px]">
                    Parameters ({((editingTest.parameters as TestParameterItem[]) || []).length})
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddParam(true)}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    + Add Parameter
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {((editingTest.parameters as TestParameterItem[]) || []).map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-mono w-4">{idx + 1}</span>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleUpdateParamField(idx, 'name', e.target.value, true)}
                        placeholder="Name"
                        className="flex-1 p-1 rounded border border-slate-200 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={p.unit || ''}
                        onChange={(e) => handleUpdateParamField(idx, 'unit', e.target.value, true)}
                        placeholder="Unit"
                        className="w-20 p-1 rounded border border-slate-200 text-xs font-mono"
                      />
                      <input
                        type="text"
                        value={p.normalRange || ''}
                        onChange={(e) => handleUpdateParamField(idx, 'normalRange', e.target.value, true)}
                        placeholder="Range"
                        className="w-28 p-1 rounded border border-slate-200 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveParam(idx, true)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTest(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Update Test</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION MODAL                        */}
      {/* ======================================================== */}
      {deletingTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Confirm Test Deletion</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to remove <strong>{deletingTest.name}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
              This test will be removed from your laboratory directory ({deletingTest.code}). Any past completed patient reports containing this test will remain safely preserved in your archive.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTest(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Test</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
