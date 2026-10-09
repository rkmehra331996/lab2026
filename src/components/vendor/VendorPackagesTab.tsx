import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  CheckCircle2,
  Save,
  X,
  Sparkles,
  Tag,
  DollarSign,
  Layers,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { VendorPackage } from '../../types';

interface VendorPackagesTabProps {
  initialSubTab?: 'list' | 'add';
  activeSubTab?: 'list' | 'add';
  onSubTabChange?: (tab: 'list' | 'add') => void;
  onPreviewWebsite?: () => void;
}

export const VendorPackagesTab: React.FC<VendorPackagesTabProps> = ({
  initialSubTab = 'list',
  activeSubTab: externalSubTab,
  onSubTabChange,
  onPreviewWebsite,
}) => {
  const {
    vendorPackages,
    addVendorPackage,
    updateVendorPackage,
    deleteVendorPackage,
    vendorTests,
  } = useCms();

  // Internal tab state if not controlled externally
  const [internalSubTab, setInternalSubTab] = useState<'list' | 'add'>(initialSubTab);
  const currentSubTab = externalSubTab || internalSubTab;

  const handleSubTabChange = (tab: 'list' | 'add') => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  // Search & Filter state for List view
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'popular' | 'under999' | 'above999'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Edit / Delete Modal State
  const [editingPackage, setEditingPackage] = useState<VendorPackage | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<VendorPackage | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTestsCount, setFormTestsCount] = useState<number>(30);
  const [formPriceINR, setFormPriceINR] = useState<number>(799);
  const [formMrpINR, setFormMrpINR] = useState<number>(1999);
  const [formIsPopular, setFormIsPopular] = useState<boolean>(false);
  const [formFeaturesText, setFormFeaturesText] = useState(
    'Complete Blood Count (CBC + ESR)\nLiver Function Profile (LFT 11 tests)\nKidney Function Test (KFT 5 tests)\nFasting Blood Glucose (Sugar)\nLipid / Cholesterol Profile (Lipids 7 tests)\nUrine Routine & Microscopic Exam'
  );
  const [selectedCatalogTests, setSelectedCatalogTests] = useState<string[]>([]);
  const [showCatalogSelector, setShowCatalogSelector] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Pre-set templates for instant package creation
  const PRESET_TEMPLATES = [
    {
      title: 'Full Body Comprehensive Checkup',
      testsCount: 65,
      mrp: 3500,
      price: 1299,
      isPopular: true,
      desc: 'Complete metabolic, organ and vital screening for head-to-toe preventive wellness.',
      features: [
        'Complete Blood Count (CBC with 24 params)',
        'Liver Function Test (LFT 12 parameters)',
        'Kidney Function Test (KFT / RFT with GFR)',
        'Complete Lipid / Cholesterol Profile',
        'Fasting Blood Sugar & HbA1c Glycated Hemoglobin',
        'Thyroid Profile Total (T3, T4, TSH)',
        'Urine Routine & Microscopic Examination',
        'Serum Calcium & Electrolytes',
      ],
    },
    {
      title: 'Basic Wellness Profile',
      testsCount: 28,
      mrp: 1800,
      price: 699,
      isPopular: false,
      desc: 'Essential routine health checkup for annual preventive screening and wellness review.',
      features: [
        'Complete Blood Count (CBC with ESR)',
        'Fasting Blood Glucose (FBS)',
        'Lipid Profile (Total Cholesterol & Triglycerides)',
        'Liver Enzymes (SGOT, SGPT)',
        'Serum Creatinine & Blood Urea',
        'Urine Routine Examination',
      ],
    },
    {
      title: 'Diabetes & Heart Care Package',
      testsCount: 42,
      mrp: 2800,
      price: 999,
      isPopular: true,
      desc: 'Specialized cardiac and diabetic monitoring package with glycemic control analysis.',
      features: [
        'HbA1c Glycated Hemoglobin & Average Blood Glucose',
        'Fasting & Post Prandial Blood Sugar',
        'Comprehensive Lipid Profile (Cholesterol, HDL, LDL, VLDL)',
        'High Sensitivity CRP (hs-CRP Cardiac Risk)',
        'Kidney Function Test with Microalbuminuria',
        'ECG Correlation & Electrolytes Panel',
      ],
    },
    {
      title: "Women's Wellness & Hormonal Profile",
      testsCount: 52,
      mrp: 3200,
      price: 1199,
      isPopular: false,
      desc: 'Designed for women health, anemia screening, thyroid balance and bone metabolism.',
      features: [
        'Complete Blood Count with Anemia Profile (Iron, Ferritin)',
        'Thyroid Profile Total (TSH, T3, T4)',
        'Vitamin D3 (25-OH) & Vitamin B12',
        'Serum Calcium & Alkaline Phosphatase',
        'Liver & Kidney Function Tests',
        'Urine Culture & Complete Routine',
      ],
    },
    {
      title: 'Senior Citizen Health Package (60+)',
      testsCount: 72,
      mrp: 4500,
      price: 1599,
      isPopular: true,
      desc: 'Holistic geriatrics screening including cardiac, renal, liver, bone and joint health.',
      features: [
        'Complete Hemogram & ESR inflammatory marker',
        'Complete Lipid, Cardiac & Vascular risk factors',
        'Renal / Kidney Profile with eGFR & Creatinine Clearance',
        'Liver Function & Bilirubin Fractionation',
        'Vitamin D3 & Vitamin B12 Serum Levels',
        'Serum Uric Acid (Gout & Joint Screening)',
        'Electrolytes: Sodium, Potassium, Chloride',
      ],
    },
  ];

  // Apply a preset template to form
  const applyPresetTemplate = (preset: typeof PRESET_TEMPLATES[0]) => {
    setFormName(preset.title);
    setFormDescription(preset.desc);
    setFormTestsCount(preset.testsCount);
    setFormMrpINR(preset.mrp);
    setFormPriceINR(preset.price);
    setFormIsPopular(preset.isPopular);
    setFormFeaturesText(preset.features.join('\n'));
    showToast(`Loaded preset template: "${preset.title}"`);
  };

  // Filtered packages for list view
  const filteredPackages = useMemo(() => {
    return vendorPackages.filter((pkg) => {
      const pkgFeatures = Array.isArray(pkg.features) ? pkg.features : [];
      const matchesSearch =
        (pkg.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pkg.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkgFeatures.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesFilter = true;
      if (filterType === 'popular') matchesFilter = !!pkg.isPopular;
      if (filterType === 'under999') matchesFilter = (pkg.priceINR || 0) < 1000;
      if (filterType === 'above999') matchesFilter = (pkg.priceINR || 0) >= 1000;

      return matchesSearch && matchesFilter;
    });
  }, [vendorPackages, searchTerm, filterType]);

  // Open Edit Mode / Modal
  const handleOpenEdit = (pkg: VendorPackage) => {
    const pkgFeatures = Array.isArray(pkg.features) ? pkg.features : [];
    setEditingPackage(pkg);
    setFormName(pkg.name);
    setFormDescription(pkg.description || '');
    setFormTestsCount(pkg.testsCount || pkgFeatures.length || 0);
    setFormPriceINR(pkg.priceINR);
    setFormMrpINR(pkg.mrpINR);
    setFormIsPopular(!!pkg.isPopular);
    setFormFeaturesText(pkgFeatures.join('\n'));
    setIsEditModalOpen(true);
  };

  // Open Full Add View / Reset form
  const handleOpenAddForm = () => {
    setEditingPackage(null);
    setFormName('');
    setFormDescription('');
    setFormTestsCount(35);
    setFormPriceINR(899);
    setFormMrpINR(2200);
    setFormIsPopular(false);
    setFormFeaturesText(
      'Complete Blood Count (CBC + ESR)\nLiver Function Tests (LFT)\nKidney Screening (Creatinine & Urea)\nFasting Blood Glucose (Sugar)\nLipid / Cholesterol Screening'
    );
    setSelectedCatalogTests([]);
    handleSubTabChange('add');
  };

  // Handle Form Submit (Add or Edit)
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Please enter a package name');
      return;
    }

    const parsedFeatures = formFeaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const price = Math.max(0, Number(formPriceINR) || 0);
    const mrp = Math.max(price, Number(formMrpINR) || price);

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || 'Comprehensive diagnostic checkup package.',
      priceINR: price,
      mrpINR: mrp,
      testsCount: Number(formTestsCount) || parsedFeatures.length || 1,
      isPopular: Boolean(formIsPopular),
      features: parsedFeatures.length > 0 ? parsedFeatures : ['General Pathology Evaluation'],
    };

    if (editingPackage) {
      updateVendorPackage(editingPackage.id, payload);
      showToast(`Package "${payload.name}" updated successfully!`);
      setIsEditModalOpen(false);
      setEditingPackage(null);
    } else {
      addVendorPackage(payload);
      showToast(`New Test Package "${payload.name}" added successfully!`);
      handleSubTabChange('list');
    }
  };

  // Delete Handlers
  const handleRequestDelete = (pkg: VendorPackage) => {
    setPackageToDelete(pkg);
  };

  const handleConfirmDelete = () => {
    if (packageToDelete) {
      deleteVendorPackage(packageToDelete.id);
      showToast(`Package "${packageToDelete.name}" deleted successfully.`);
      setPackageToDelete(null);
    }
  };

  // Include Tests from Catalog into features text
  const handleToggleCatalogTest = (testName: string) => {
    let nextSelected: string[];
    if (selectedCatalogTests.includes(testName)) {
      nextSelected = selectedCatalogTests.filter((t) => t !== testName);
    } else {
      nextSelected = [...selectedCatalogTests, testName];
    }
    setSelectedCatalogTests(nextSelected);

    // Merge into features text
    const currentLines = formFeaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (selectedCatalogTests.includes(testName)) {
      // Remove
      const filtered = currentLines.filter((l) => !l.includes(testName));
      setFormFeaturesText(filtered.join('\n'));
    } else {
      // Add
      if (!currentLines.includes(testName)) {
        currentLines.push(testName);
        setFormFeaturesText(currentLines.join('\n'));
      }
    }
  };

  // Auto calculate discount
  const discountPercent = useMemo(() => {
    if (!formMrpINR || formMrpINR <= formPriceINR) return 0;
    return Math.round(((formMrpINR - formPriceINR) / formMrpINR) * 100);
  }, [formMrpINR, formPriceINR]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#123B6D] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-amber-400 animate-bounce text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION & SUB-NAV TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-black uppercase tracking-wider">
                Section 2
              </span>
              <h2 className="text-lg font-black text-[#123B6D] flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <span>Test Package Management</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add new health checkup packages or manage existing catalog packages (Edit / Delete).
            </p>
          </div>

          {onPreviewWebsite && (
            <button
              onClick={onPreviewWebsite}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Preview Live Packages</span>
            </button>
          )}
        </div>

        {/* 2 Sub-Sections Navigation (as requested in user brief: 1. Add, 2. List > Edit/Delete) */}
        <div className="flex items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => handleSubTabChange('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              currentSubTab === 'list'
                ? 'bg-[#123B6D] text-white shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <List className="w-4 h-4" />
            <span>2. Package List</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                currentSubTab === 'list' ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
              }`}
            >
              {vendorPackages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddForm}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              currentSubTab === 'add'
                ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>1. Add Package</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ADD PACKAGE VIEW (SUB-TAB: 'add') */}
      {/* ========================================================================= */}
      {currentSubTab === 'add' && (
        <div className="space-y-6">
          {/* Quick Preset Templates Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-amber-950">
                  Quick Start: Use Diagnostic Package Presets
                </span>
              </div>
              <span className="text-[11px] text-amber-700 font-semibold">
                Click any preset to auto-fill details
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPresetTemplate(tmpl)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-slate-800 text-xs font-bold hover:bg-amber-100 hover:border-amber-400 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <span>{tmpl.title}</span>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md font-extrabold">
                    ₹{tmpl.price} ({tmpl.testsCount} Tests)
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form and Real-time Live Patient Website Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#123B6D]">
                      Create New Health Checkup Package
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configure package details, parameter count, pricing, and included tests.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSavePackage} className="space-y-4">
                {/* Package Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Package Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Master Health Checkup (Full Body Profile)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Short Description / Catchphrase
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Comprehensive preventive health checkup designed for vital organ screening..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:outline-none resize-none"
                  />
                </div>

                {/* Pricing & Test Count Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Parameters / Tests Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formTestsCount}
                      onChange={(e) => setFormTestsCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      MRP / Original Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formMrpINR}
                      onChange={(e) => setFormMrpINR(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#123B6D] mb-1">
                      Discounted Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formPriceINR}
                      onChange={(e) => setFormPriceINR(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-black text-[#123B6D] border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Discount Badge & Popular Switch */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Calculated Savings:</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {discountPercent}% OFF
                    </span>
                    <span className="text-[11px] text-slate-500">
                      (Save ₹{Math.max(0, formMrpINR - formPriceINR)})
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsPopular}
                      onChange={(e) => setFormIsPopular(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      Mark as "Best Value / Most Popular"
                    </span>
                  </label>
                </div>

                {/* Included Tests / Parameters List */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Included Tests / Diagnostic Highlights (One per line)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCatalogSelector(!showCatalogSelector)}
                      className="text-[11px] text-[#123B6D] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>
                        {showCatalogSelector ? 'Hide Catalog Tests' : '+ Pick from Tests Catalog'}
                      </span>
                    </button>
                  </div>

                  {showCatalogSelector && (
                    <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-500 mb-2">
                        Select tests from your lab's active catalog to auto-include:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {vendorTests.map((t) => {
                          const isIncluded = formFeaturesText.toLowerCase().includes(t.name.toLowerCase());
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleToggleCatalogTest(t.name)}
                              className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center justify-between border cursor-pointer ${
                                isIncluded
                                  ? 'bg-blue-100/70 border-blue-300 text-blue-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span className="truncate">{t.name}</span>
                              {isIncluded && <Check className="w-3.5 h-3.5 text-blue-700 shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={6}
                    value={formFeaturesText}
                    onChange={(e) => setFormFeaturesText(e.target.value)}
                    placeholder="Complete Blood Count (CBC)&#10;Liver Function Tests&#10;Kidney Screening&#10;Fasting Blood Sugar&#10;Lipid Profile"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Each line becomes a bullet point with a green checkmark on your patient website card.
                  </p>
                </div>

                {/* Form Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleSubTabChange('list')}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel & Return to List
                  </button>

                  <button
                    type="submit"
                    className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-400" />
                    <span>Create & Publish Package</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Patient Website Preview Column (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Live Website Card Preview</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Real-time Preview
                </span>
              </div>

              {/* The Patient-facing card */}
              <div
                className={`bg-white rounded-2xl border-2 ${
                  formIsPopular
                    ? 'border-amber-400 shadow-md ring-4 ring-amber-400/10'
                    : 'border-slate-200 shadow-sm'
                } p-5 flex flex-col justify-between transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#123B6D] border border-blue-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#123B6D]" />
                      <span>{formTestsCount || 1} Parameters Included</span>
                    </span>

                    {formIsPopular && (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow-2xs animate-pulse">
                        <Award className="w-3 h-3 text-slate-950" />
                        <span>Best Value</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-base text-slate-900 leading-snug">
                    {formName || 'Your Package Name Here'}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                    {formDescription || 'Short description of what health checks are covered in this package.'}
                  </p>

                  {/* Pricing Box */}
                  <div className="py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-[#123B6D]">₹{formPriceINR || 0}</span>
                      {formMrpINR > formPriceINR && (
                        <span className="text-xs text-slate-400 line-through ml-2">₹{formMrpINR}</span>
                      )}
                    </div>
                    {discountPercent > 0 && (
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Included Tests List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Included Diagnostic Tests:
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {(formFeaturesText.split('\n').filter((s) => s.trim().length > 0).length > 0
                        ? formFeaturesText.split('\n').filter((s) => s.trim().length > 0)
                        : ['General Pathology Evaluation', 'Blood Sample Collection']
                      ).map((feat, i) => (
                        <div key={i} className="text-xs text-slate-700 flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5 font-black" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Patient Sample Button */}
                <div className="pt-4 mt-5 border-t border-slate-100">
                  <div className="w-full bg-[#123B6D] text-white py-2 rounded-xl text-xs font-bold text-center opacity-85 select-none flex items-center justify-center gap-1.5">
                    <span>Book Package & Home Collection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Sample preview of patient website card
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PACKAGE LIST VIEW (SUB-TAB: 'list') > with Edit and Delete */}
      {/* ========================================================================= */}
      {currentSubTab === 'list' && (
        <div className="space-y-4">
          {/* Search, Filter Bar and Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search packages by name or test..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Packages ({vendorPackages.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('popular')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterType === 'popular'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ★ Best Value ({vendorPackages.filter((p) => p.isPopular).length})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('under999')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterType === 'under999'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Under ₹999
              </button>
            </div>

            {/* View Mode & Add Package Button */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-[#123B6D] shadow-xs' : 'text-slate-500'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-[#123B6D] shadow-xs' : 'text-slate-500'
                  }`}
                  title="Detailed Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenAddForm}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Add Package</span>
              </button>
            </div>
          </div>

          {/* Empty State */}
          {filteredPackages.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Health Packages Found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {searchTerm
                  ? `No packages matched "${searchTerm}". Try a different keyword.`
                  : 'Start adding health checkup packages to showcase on your lab website.'}
              </p>
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="bg-[#123B6D] text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Your First Package</span>
              </button>
            </div>
          )}

          {/* GRID VIEW */}
          {viewMode === 'grid' && filteredPackages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredPackages.map((pkg) => {
                const discount =
                  pkg.mrpINR > pkg.priceINR
                    ? Math.round(((pkg.mrpINR - pkg.priceINR) / pkg.mrpINR) * 100)
                    : 0;

                return (
                  <div
                    key={pkg.id}
                    className={`bg-white rounded-2xl border-2 transition hover:shadow-md flex flex-col justify-between ${
                      pkg.isPopular
                        ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-2xs'
                        : 'border-slate-200 shadow-2xs'
                    } p-5`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-[#123B6D]">
                          {pkg.testsCount} Parameters
                        </span>
                        {pkg.isPopular && (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>Best Value</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <h3 className="font-black text-sm text-slate-900 line-clamp-1">{pkg.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-3 line-clamp-2">{pkg.description}</p>

                      {/* Pricing Tag */}
                      <div className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 mb-3.5 flex items-baseline justify-between">
                        <div>
                          <span className="text-xl font-black text-[#123B6D]">₹{pkg.priceINR}</span>
                          {pkg.mrpINR > pkg.priceINR && (
                            <span className="text-xs text-slate-400 line-through ml-2">₹{pkg.mrpINR}</span>
                          )}
                        </div>
                        {discount > 0 && (
                          <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {discount}% OFF
                          </span>
                        )}
                      </div>

                      {/* Key Included Tests */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Included Tests:
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {(Array.isArray(pkg.features) ? pkg.features : []).map((feat, i) => (
                            <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer: Edit & Delete buttons */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* 2. Edit Action */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(pkg)}
                          className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-700" />
                          <span>Edit</span>
                        </button>

                        {/* 2. Delete Action */}
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(pkg)}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                          <span>Delete</span>
                        </button>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">ID: {pkg.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && filteredPackages.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
                    <tr>
                      <th className="py-3 px-4">Package Name & Info</th>
                      <th className="py-3 px-4">Parameters</th>
                      <th className="py-3 px-4">Price / MRP</th>
                      <th className="py-3 px-4">Badge</th>
                      <th className="py-3 px-4">Included Tests Highlights</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPackages.map((pkg) => {
                      const discount =
                        pkg.mrpINR > pkg.priceINR
                          ? Math.round(((pkg.mrpINR - pkg.priceINR) / pkg.mrpINR) * 100)
                          : 0;

                      return (
                        <tr key={pkg.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900 block">{pkg.name}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {pkg.description}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#123B6D] font-bold border border-blue-200 text-[11px]">
                              {pkg.testsCount} tests
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-black text-sm text-[#123B6D]">₹{pkg.priceINR}</span>
                            {pkg.mrpINR > pkg.priceINR && (
                              <span className="text-[10px] text-slate-400 line-through ml-1.5">
                                ₹{pkg.mrpINR}
                              </span>
                            )}
                            {discount > 0 && (
                              <span className="block text-[10px] font-bold text-emerald-700">
                                {discount}% OFF
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {pkg.isPopular ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 w-fit">
                                <Award className="w-3 h-3" />
                                <span>Best Value</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Standard</span>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <span className="text-[11px] text-slate-600 line-clamp-2">
                              {(Array.isArray(pkg.features) ? pkg.features : []).slice(0, 3).join(', ')}
                              {(Array.isArray(pkg.features) ? pkg.features.length : 0) > 3 &&
                                ` +${(pkg.features?.length || 0) - 3} more`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(pkg)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-blue-700 font-bold transition cursor-pointer"
                                title="Edit Package"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestDelete(pkg)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-700 font-bold transition cursor-pointer"
                                title="Delete Package"
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PACKAGE MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-sm text-[#123B6D]">
                  Edit Test Package: {editingPackage?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tests Count</label>
                  <input
                    type="number"
                    min={1}
                    value={formTestsCount}
                    onChange={(e) => setFormTestsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formMrpINR}
                    onChange={(e) => setFormMrpINR(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#123B6D] mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formPriceINR}
                    onChange={(e) => setFormPriceINR(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-[#123B6D] focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-xs font-bold text-amber-900">
                  Discount: {discountPercent}% OFF
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span className="text-xs font-black text-amber-950">Best Value Ribbon</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Included Diagnostic Tests (One per line)
                </label>
                <textarea
                  rows={5}
                  value={formFeaturesText}
                  onChange={(e) => setFormFeaturesText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Update Package</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL (Safe for iframe - No window.confirm) */}
      {/* ========================================================================= */}
      {packageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 text-center">
              Are you sure you want to delete this?
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 mb-5">
              Are you sure you want to delete this? Health package: <strong className="text-slate-900">"{packageToDelete.name}"</strong>. It will be removed from your lab website and patient booking catalog.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPackageToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
