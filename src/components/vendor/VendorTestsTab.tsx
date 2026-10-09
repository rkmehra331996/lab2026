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
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { TestItem } from '../../types';

interface VendorTestsTabProps {
  initialSubTab?: 'list' | 'add';
  activeSubTab?: 'list' | 'add';
  onSubTabChange?: (tab: 'list' | 'add') => void;
  onPreviewWebsite?: () => void;
}

export const VendorTestsTab: React.FC<VendorTestsTabProps> = ({
  initialSubTab = 'list',
  activeSubTab: externalSubTab,
  onSubTabChange,
  onPreviewWebsite,
}) => {
  const { vendorTests, addVendorTest, updateVendorTest, deleteVendorTest } = useCms();

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
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Popular'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [deletingTest, setDeletingTest] = useState<TestItem | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form State for Add / Edit
  const [testForm, setTestForm] = useState<Omit<TestItem, 'id'>>({
    name: '',
    code: `TST-${(vendorTests.length + 101).toString()}`,
    category: 'Biochemistry',
    sampleType: 'Serum / Clot Activator',
    unit: 'mg/dL',
    normalRange: '70 - 110 mg/dL',
    priceINR: 350,
    mrpINR: 600,
    tatHours: 4,
    turnaroundTime: '4 Hours',
    description: 'Standard clinical pathology diagnostic test for routine preventive and diagnostic evaluation.',
    fastingRequired: false,
    instructions: 'No special fasting preparation needed. Stay well hydrated.',
    isPopular: false,
    status: 'Active',
    isActive: true,
  });

  const categories = [
    'All',
    'Hematology',
    'Biochemistry',
    'Thyroid & Hormones',
    'Diabetes',
    'Lipids & Cardiac',
    'Liver & Renal',
    'Urine Analysis',
    'Immunology',
    'Vitamins & Minerals',
    'Infection & Serology',
  ];

  // 1-Click Fast Presets for Indian Diagnostic Labs
  const QUICK_PRESETS = [
    {
      name: 'Complete Blood Count (CBC + ESR)',
      code: 'CBC-01',
      category: 'Hematology',
      sampleType: 'EDTA Whole Blood (Purple Vial)',
      unit: 'cells/cu.mm & %',
      normalRange: 'Hb: 13-17 g/dL, WBC: 4000-11000 /cumm, Platelets: 1.5-4.5 Lakhs',
      priceINR: 350,
      mrpINR: 550,
      tatHours: 3,
      turnaroundTime: '3 Hours',
      description: 'Comprehensive screening for anemia, infections, leukemia, platelet disorders and systemic inflammation.',
      fastingRequired: false,
      instructions: 'Non-fasting test. Random blood collection anytime.',
      isPopular: true,
    },
    {
      name: 'HbA1c Glycated Hemoglobin',
      code: 'HBA1C-01',
      category: 'Diabetes',
      sampleType: 'EDTA Whole Blood (Purple Vial)',
      unit: '%',
      normalRange: 'Normal: <5.7%, Pre-diabetic: 5.7-6.4%, Diabetic: ≥6.5%',
      priceINR: 450,
      mrpINR: 750,
      tatHours: 4,
      turnaroundTime: '4 Hours',
      description: 'Golden benchmark test measuring 3-month average blood glucose control for diabetic management.',
      fastingRequired: false,
      instructions: 'Can be done non-fasting at any time of day.',
      isPopular: true,
    },
    {
      name: 'Lipid Profile / Cholesterol Panel (7 Parameters)',
      code: 'LIPID-01',
      category: 'Biochemistry',
      sampleType: 'Serum Clot Activator (Gold/Red Vial)',
      unit: 'mg/dL',
      normalRange: 'Total Chol: <200 mg/dL, HDL: >40 mg/dL, LDL: <100 mg/dL, Triglycerides: <150 mg/dL',
      priceINR: 650,
      mrpINR: 1100,
      tatHours: 6,
      turnaroundTime: '6 Hours',
      description: 'Assessment of cardiovascular heart risk, coronary health, HDL good cholesterol, LDL bad cholesterol & triglycerides.',
      fastingRequired: true,
      instructions: '10 to 12 hours overnight fasting mandatory. Only plain water allowed.',
      isPopular: true,
    },
    {
      name: 'Liver Function Test (LFT 11 Parameters)',
      code: 'LFT-01',
      category: 'Biochemistry',
      sampleType: 'Serum Clot Activator (Gold/Red Vial)',
      unit: 'U/L & g/dL',
      normalRange: 'SGOT: <40 U/L, SGPT: <45 U/L, Bilirubin Total: 0.2-1.2 mg/dL, Albumin: 3.5-5.0 g/dL',
      priceINR: 700,
      mrpINR: 1200,
      tatHours: 6,
      turnaroundTime: '6 Hours',
      description: 'Comprehensive liver evaluation including Bilirubin (Total, Direct, Indirect), SGOT, SGPT, Alkaline Phosphatase, Protein & Albumin.',
      fastingRequired: true,
      instructions: '8 to 10 hours overnight fasting recommended.',
      isPopular: false,
    },
    {
      name: 'Kidney Function Test (KFT / RFT with Electrolytes)',
      code: 'KFT-01',
      category: 'Biochemistry',
      sampleType: 'Serum Clot Activator (Gold/Red Vial)',
      unit: 'mg/dL',
      normalRange: 'Creatinine: 0.6-1.2 mg/dL, Blood Urea: 15-40 mg/dL, Uric Acid: 3.5-7.2 mg/dL',
      priceINR: 650,
      mrpINR: 1150,
      tatHours: 4,
      turnaroundTime: '4 Hours',
      description: 'Measures renal filtration, waste clearance, serum creatinine, urea nitrogen and uric acid.',
      fastingRequired: false,
      instructions: 'Drink plenty of water before testing. Avoid high protein meals night before.',
      isPopular: false,
    },
    {
      name: 'Thyroid Profile (Total T3, Total T4, Ultrasensitive TSH)',
      code: 'THY-01',
      category: 'Thyroid & Hormones',
      sampleType: 'Serum Clot Activator (Gold/Red Vial)',
      unit: 'ng/dL, µg/dL, µIU/mL',
      normalRange: 'TSH: 0.45 - 4.5 µIU/mL, Total T3: 60-200 ng/dL, Total T4: 4.5-12.0 µg/dL',
      priceINR: 500,
      mrpINR: 950,
      tatHours: 6,
      turnaroundTime: '6 Hours',
      description: 'Evaluates thyroid gland activity for hypothyroidism, hyperthyroidism, metabolic rate and hormonal balance.',
      fastingRequired: true,
      instructions: 'Early morning sample before taking daily thyroid medication.',
      isPopular: true,
    },
    {
      name: 'Vitamin D3 (25-Hydroxy Cholecalciferol)',
      code: 'VIT-D3',
      category: 'Vitamins & Minerals',
      sampleType: 'Serum Clot Activator (Gold/Red Vial)',
      unit: 'ng/mL',
      normalRange: 'Deficiency: <20 ng/mL, Insufficiency: 20-30 ng/mL, Optimal: 30-100 ng/mL',
      priceINR: 1199,
      mrpINR: 2000,
      tatHours: 12,
      turnaroundTime: '12 Hours',
      description: 'Essential marker for bone density, calcium absorption, immunity defense, musculoskeletal and fatigue evaluation.',
      fastingRequired: false,
      instructions: 'No special dietary fasting needed.',
      isPopular: true,
    },
    {
      name: 'Vitamin B12 (Cyanocobalamin)',
      code: 'VIT-B12',
      category: 'Vitamins & Minerals',
      sampleType: 'Serum Clot Activator (Gold/Red Vial)',
      unit: 'pg/mL',
      normalRange: 'Normal: 211 - 911 pg/mL',
      priceINR: 899,
      mrpINR: 1500,
      tatHours: 12,
      turnaroundTime: '12 Hours',
      description: 'Crucial for brain nerve function, red blood cell production, memory, concentration and energy metabolism.',
      fastingRequired: true,
      instructions: 'Overnight 8-10 hours fasting preferred.',
      isPopular: true,
    },
    {
      name: 'Urine Routine & Microscopic Examination (CUE)',
      code: 'URN-01',
      category: 'Urine Analysis',
      sampleType: 'Sterile Urine Container (Midstream)',
      unit: 'N/A',
      normalRange: 'Protein: Nil, Sugar: Nil, Pus Cells: 1-3 /hpf, RBCs: Nil',
      priceINR: 200,
      mrpINR: 350,
      tatHours: 2,
      turnaroundTime: '2 Hours',
      description: 'Direct urinalysis screening for urinary tract infections (UTI), proteinuria, kidney stones, and glucose spilling.',
      fastingRequired: false,
      instructions: 'First morning clean-catch midstream urine sample recommended.',
      isPopular: false,
    },
  ];

  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setTestForm({
      name: preset.name,
      code: preset.code,
      category: preset.category,
      sampleType: preset.sampleType,
      unit: preset.unit,
      normalRange: preset.normalRange,
      priceINR: preset.priceINR,
      mrpINR: preset.mrpINR,
      tatHours: preset.tatHours,
      turnaroundTime: preset.turnaroundTime,
      description: preset.description,
      fastingRequired: preset.fastingRequired,
      instructions: preset.instructions,
      isPopular: preset.isPopular,
      status: 'Active',
      isActive: true,
    });
    setToastMessage(`Template loaded: "${preset.name}". You can now customize or save it!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredTests = useMemo(() => {
    return vendorTests.filter((test) => {
      const matchesSearch =
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (test.sampleType && test.sampleType.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === 'Active') {
        matchesStatus = test.status === 'Active' || test.isActive === true;
      } else if (statusFilter === 'Popular') {
        matchesStatus = !!test.isPopular;
      }

      return matchesSearch && matchesStatus;
    });
  }, [vendorTests, searchTerm, statusFilter]);

  const handleOpenAddForm = () => {
    setEditingTest(null);
    setTestForm({
      name: '',
      code: `TST-${(vendorTests.length + 101).toString()}`,
      category: 'Biochemistry',
      sampleType: 'Serum / Clot Activator',
      unit: 'mg/dL',
      normalRange: '70 - 110 mg/dL',
      priceINR: 350,
      mrpINR: 600,
      tatHours: 4,
      turnaroundTime: '4 Hours',
      description: 'Standard diagnostic laboratory test for accurate clinical assessment and patient well-being.',
      fastingRequired: false,
      instructions: 'No fasting needed.',
      isPopular: false,
      status: 'Active',
      isActive: true,
    });
    handleSubTabChange('add');
  };

  const handleOpenEditModal = (test: TestItem) => {
    setEditingTest(test);
    setTestForm({
      name: test.name,
      code: test.code,
      category: test.category,
      sampleType: test.sampleType,
      unit: test.unit || 'mg/dL',
      normalRange: test.normalRange || 'Standard biological reference',
      priceINR: test.priceINR,
      mrpINR: test.mrpINR || Math.round(test.priceINR * 1.6),
      tatHours: test.tatHours || 4,
      turnaroundTime: test.turnaroundTime || (test.tatHours ? `${test.tatHours} Hours` : '4 Hours'),
      description: test.description || 'Clinical pathology diagnostic test.',
      fastingRequired: !!test.fastingRequired,
      instructions: test.instructions || 'Follow lab phlebotomist guidance.',
      isPopular: !!test.isPopular,
      status: test.status || (test.isActive === false ? 'Inactive' : 'Active'),
      isActive: test.isActive !== false && test.status !== 'Inactive',
    });
    setIsEditModalOpen(true);
  };

  const handleCreateTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.name.trim()) {
      setToastMessage('Please enter a valid Test Name');
      return;
    }

    addVendorTest({
      ...testForm,
      turnaroundTime: `${testForm.tatHours} Hours`,
    });

    setToastMessage(`✓ Test "${testForm.name}" created and added to Online Test catalog!`);
    setTimeout(() => setToastMessage(''), 3500);

    // Switch to list view so user immediately sees the new test
    handleSubTabChange('list');
  };

  const handleUpdateTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;

    updateVendorTest(editingTest.id, {
      ...testForm,
      turnaroundTime: `${testForm.tatHours} Hours`,
    });

    setIsEditModalOpen(false);
    setToastMessage(`✓ Test "${testForm.name}" updated successfully.`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleDeleteConfirm = () => {
    if (!deletingTest) return;
    deleteVendorTest(deletingTest.id);
    setToastMessage(`🗑️ Test "${deletingTest.name}" removed from catalog.`);
    setDeletingTest(null);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Live discount calculation for card preview
  const previewDiscount = useMemo(() => {
    if (testForm.mrpINR && testForm.mrpINR > testForm.priceINR) {
      return Math.round(((testForm.mrpINR - testForm.priceINR) / testForm.mrpINR) * 100);
    }
    return 0;
  }, [testForm.mrpINR, testForm.priceINR]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: ADD ONLINE TEST (Dedicated Form + 1-Click Presets + Live Card) */}
      {/* ========================================================================= */}
      {currentSubTab === 'add' && (
        <div className="space-y-6">
          {/* Quick Presets Bar */}
          <div className="bg-gradient-to-r from-amber-50/90 via-sky-50/70 to-emerald-50/80 rounded-2xl border border-amber-200/80 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  ⚡ 1-Click Quick Presets (Click any test to auto-fill)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Standard Indian diagnostic pathology profiles
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="bg-white hover:bg-amber-100/70 border border-slate-200 hover:border-amber-400 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FlaskConical className="w-3 h-3 text-[#123B6D]" />
                  <span>{preset.name.split('(')[0]}</span>
                  <span className="text-emerald-700 font-black">₹{preset.priceINR}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form and Live Preview Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Comprehensive Add Test Form */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-[#123B6D] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white/10 text-amber-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">Add New Online Diagnostic Test</h3>
                    <p className="text-[11px] text-blue-200">
                      Fill test parameters and publish to online lab booking portal
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('list')}
                  className="text-xs font-bold text-blue-200 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  View Catalog &gt;
                </button>
              </div>

              <form onSubmit={handleCreateTestSubmit} className="p-6 space-y-5 text-xs">
                {/* 1. Basic Identification */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#123B6D]" />
                    <span>1. Basic Test Details</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Test Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={testForm.name}
                        onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                        placeholder="e.g. Complete Blood Count (CBC + ESR)"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Test Code / SKU <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={testForm.code}
                        onChange={(e) => setTestForm({ ...testForm, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. CBC-101"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Specimen & Technical Parameters */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-rose-500" />
                    <span>2. Specimen &amp; Reference Interval</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Specimen / Sample Tube <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={testForm.sampleType}
                        onChange={(e) => setTestForm({ ...testForm, sampleType: e.target.value })}
                        placeholder="e.g. EDTA Whole Blood, Serum Clot Activator, Urine"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Unit of Measurement
                      </label>
                      <input
                        type="text"
                        value={testForm.unit}
                        onChange={(e) => setTestForm({ ...testForm, unit: e.target.value })}
                        placeholder="e.g. mg/dL, %, g/dL, µIU/mL"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Biological Reference Interval (Normal Range)
                      </label>
                      <input
                        type="text"
                        value={testForm.normalRange}
                        onChange={(e) => setTestForm({ ...testForm, normalRange: e.target.value })}
                        placeholder="e.g. Fasting: 70 - 110 mg/dL | Male: 13.0 - 17.0 g/dL"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Turnaround Time (Hours)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={testForm.tatHours}
                          onChange={(e) => setTestForm({ ...testForm, tatHours: parseInt(e.target.value) || 4 })}
                          className="w-24 px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                        />
                        <span className="text-slate-500 font-bold">Hours ({testForm.tatHours} hrs for report)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Fasting Required?
                      </label>
                      <div className="flex items-center gap-3 pt-1.5">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                          <input
                            type="radio"
                            name="fastingRadio"
                            checked={!testForm.fastingRequired}
                            onChange={() => setTestForm({ ...testForm, fastingRequired: false })}
                            className="text-[#123B6D] focus:ring-[#123B6D]"
                          />
                          <span>No Fasting</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
                          <input
                            type="radio"
                            name="fastingRadio"
                            checked={testForm.fastingRequired}
                            onChange={() => setTestForm({ ...testForm, fastingRequired: true })}
                            className="text-[#123B6D] focus:ring-[#123B6D]"
                          />
                          <span>Fasting Mandatory (8-12 hrs)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Pricing & Booking Settings */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Pricing &amp; Commercials (INR ₹)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Online Patient Price (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 font-bold text-emerald-700 text-sm">₹</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={testForm.priceINR}
                          onChange={(e) => setTestForm({ ...testForm, priceINR: parseInt(e.target.value) || 0 })}
                          className="w-full pl-8 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Amount the patient pays when booking online</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Standard MRP / Market Rate (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-sm">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={testForm.mrpINR || ''}
                          onChange={(e) => setTestForm({ ...testForm, mrpINR: parseInt(e.target.value) || 0 })}
                          className="w-full pl-8 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Crossed-out price to show patient savings discount</p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Clinical Significance &amp; Description
                      </label>
                      <textarea
                        rows={2}
                        value={testForm.description}
                        onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                        placeholder="Brief summary explaining what this test diagnoses and why doctors recommend it..."
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Patient Preparation Instructions
                      </label>
                      <input
                        type="text"
                        value={testForm.instructions}
                        onChange={(e) => setTestForm({ ...testForm, instructions: e.target.value })}
                        placeholder="e.g. 10 hours overnight fasting mandatory, avoid taking medication prior to test..."
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Visibility & Badges Toggles */}
                <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Mark as Popular / Featured Test</span>
                      <span className="text-[11px] text-slate-500">
                        Shows a highlighted &quot;Popular&quot; badge and priority ranking on your website
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testForm.isPopular}
                        onChange={(e) => setTestForm({ ...testForm, isPopular: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Online Booking Availability</span>
                      <span className="text-[11px] text-slate-500">
                        When Active, patients can select and book this test directly from your website
                      </span>
                    </div>
                    <select
                      value={testForm.status || 'Active'}
                      onChange={(e) => {
                        const val = e.target.value as 'Active' | 'Inactive';
                        setTestForm({ ...testForm, status: val, isActive: val === 'Active' });
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                        testForm.status === 'Inactive'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <option value="Active">✓ Active (Available Online)</option>
                      <option value="Inactive">✕ Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleSubTabChange('list')}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                  >
                    Cancel &amp; Return to List
                  </button>

                  <button
                    type="submit"
                    className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 shadow-md cursor-pointer hover:shadow-lg active:scale-95"
                  >
                    <Save className="w-4 h-4 text-amber-400" />
                    <span>Create &amp; Publish Online Test</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right 4 Cols: Live Patient Website Test Card Preview */}
            <div className="lg:col-span-4 sticky top-6 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#123B6D]" />
                    <span className="text-xs font-black text-slate-800">Live Website Card Preview</span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    Patient View
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mb-4">
                  This is how patients see and book this test on your laboratory website:
                </p>

                {/* Patient Facing Test Card Mockup */}
                <div className="rounded-2xl border-2 border-slate-200 hover:border-[#123B6D] bg-white p-4 shadow-sm transition space-y-3 relative overflow-hidden">
                  {testForm.isPopular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-400 text-slate-950 font-black text-[9px] px-3 py-0.5 rounded-bl-xl shadow-2xs flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-2.5 h-2.5" />
                      Popular
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-blue-50 text-[#123B6D] px-2 py-0.5 rounded-md font-mono">
                      {testForm.code || 'CODE'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-[#123B6D] leading-tight">
                      {testForm.name || 'Test Name'}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {testForm.description || 'Test description will appear here for patients.'}
                    </p>
                  </div>

                  {/* Specimen and TAT Badges */}
                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{testForm.sampleType || 'Specimen Tube'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Report in {testForm.tatHours || 4} Hours</span>
                    </div>

                    {testForm.fastingRequired && (
                      <div className="flex items-center gap-1.5 text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Fasting Required (10-12 hrs)</span>
                      </div>
                    )}
                  </div>

                  {/* Biological Reference interval */}
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px]">
                    <span className="text-slate-400 font-semibold block">Ref Interval:</span>
                    <span className="font-mono text-slate-700 font-bold">
                      {testForm.normalRange || 'Standard reference'}
                    </span>
                  </div>

                  {/* Pricing and Book CTA */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-[#123B6D]">₹{testForm.priceINR}</span>
                        {testForm.mrpINR && testForm.mrpINR > testForm.priceINR && (
                          <span className="text-xs text-slate-400 line-through">₹{testForm.mrpINR}</span>
                        )}
                      </div>
                      {previewDiscount > 0 && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          {previewDiscount}% OFF
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled
                      className="bg-[#123B6D] text-white text-[11px] font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs opacity-90 cursor-default"
                    >
                      <span>Book Online</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px] text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>Real-time Sync</span>
                  </div>
                  <p className="text-blue-800 text-[10px]">
                    Once saved, this test is instantly searchable on your patient website hero section and booking catalog.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ONLINE TESTS LIST (Search + Filters + Table/Grid + Edit/Delete) */}
      {/* ========================================================================= */}
      {currentSubTab === 'list' && (
        <div className="space-y-4">
          {/* Action and Search Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by test name, code, or specimen..."
                  className="w-full pl-10 pr-9 py-2 border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter & View Toggle */}
              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                {/* Status Toggle Buttons */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setStatusFilter('All')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                      statusFilter === 'All' ? 'bg-[#123B6D] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({vendorTests.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('Active')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                      statusFilter === 'Active' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => setStatusFilter('Popular')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                      statusFilter === 'Popular' ? 'bg-amber-500 text-slate-950 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⭐ Popular
                  </button>
                </div>

                {/* View Switcher: Table vs Grid */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === 'table' ? 'bg-white text-[#123B6D] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === 'grid' ? 'bg-white text-[#123B6D] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Grid Cards View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Add Button */}
                <button
                  onClick={handleOpenAddForm}
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ml-auto"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add Test</span>
                </button>
              </div>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-black border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Code &amp; Test Name</th>
                      <th className="px-4 py-3">Specimen &amp; Unit</th>
                      <th className="px-4 py-3">Biological Reference Range</th>
                      <th className="px-4 py-3">Report TAT</th>
                      <th className="px-4 py-3">Price (INR)</th>
                      <th className="px-4 py-3 text-center">Online Booking</th>
                      <th className="px-4 py-3 text-right">Actions (Edit / Delete)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          <FlaskConical className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-slate-600">No matching online diagnostic tests found</p>
                          <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search terms or filter</p>
                          <button
                            onClick={handleOpenAddForm}
                            className="mt-3 inline-flex items-center gap-1.5 bg-[#123B6D] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-400" />
                            <span>Add New Test</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredTests.map((test) => {
                        const isInactive = test.status === 'Inactive' || test.isActive === false;
                        return (
                          <tr
                            key={test.id}
                            className={`hover:bg-amber-50/40 transition group ${
                              isInactive ? 'opacity-65 bg-slate-50/50' : ''
                            }`}
                          >
                            {/* Code & Name */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{test.name}</span>
                                {test.isPopular && (
                                  <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                                    ⭐ POPULAR
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px]">
                                  {test.code}
                                </span>
                                {test.fastingRequired && (
                                  <span className="text-amber-800 text-[10px] font-bold">
                                    • Fasting
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Specimen & Unit */}
                            <td className="px-4 py-3.5 text-slate-700">
                              <div className="font-medium text-[11px]">{test.sampleType}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Unit: {test.unit || 'Standard'}
                              </div>
                            </td>

                            {/* Normal Range */}
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700 max-w-xs truncate" title={test.normalRange}>
                              {test.normalRange || 'Standard reference interval'}
                            </td>

                            {/* TAT */}
                            <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-bold">{test.tatHours ? `${test.tatHours} hrs` : test.turnaroundTime || '4 hrs'}</span>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="px-4 py-3.5 font-black text-[#123B6D] whitespace-nowrap">
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm">₹{test.priceINR}</span>
                                {test.mrpINR && test.mrpINR > test.priceINR && (
                                  <span className="text-[10px] text-slate-400 line-through">₹{test.mrpINR}</span>
                                )}
                              </div>
                            </td>

                            {/* Status Toggle */}
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const newStatus = isInactive ? 'Active' : 'Inactive';
                                  updateVendorTest(test.id, {
                                    status: newStatus,
                                    isActive: newStatus === 'Active',
                                  });
                                  setToastMessage(
                                    `Test "${test.name}" marked as ${newStatus}. ${
                                      newStatus === 'Active' ? 'Now available online.' : 'Hidden from booking.'
                                    }`
                                  );
                                  setTimeout(() => setToastMessage(''), 3000);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition border ${
                                  isInactive
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title="Click to toggle online booking availability"
                              >
                                {isInactive ? '✕ Hidden' : '✓ Active'}
                              </button>
                            </td>

                            {/* Actions: Edit & Delete */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(test)}
                                  className="px-2.5 py-1 text-slate-700 hover:text-[#123B6D] hover:bg-amber-100/70 border border-slate-200 rounded-lg transition font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                  title="Edit test parameters"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#123B6D]" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeletingTest(test)}
                                  className="px-2 py-1 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                  title="Delete test from catalog"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
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
          )}

          {/* GRID CARDS VIEW: 3 IN ROW, NEXT TEST IN SECOND ROW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5">
              {filteredTests.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                  <FlaskConical className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-600 text-sm">No matching online diagnostic tests found</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or category filter</p>
                  <button
                    onClick={handleOpenAddForm}
                    className="mt-3.5 inline-flex items-center gap-1.5 bg-[#123B6D] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Add New Test</span>
                  </button>
                </div>
              ) : (
                filteredTests.map((test) => {
                  const isInactive = test.status === 'Inactive' || test.isActive === false;

                  return (
                    <div
                      key={test.id}
                      className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-[#123B6D] hover:shadow-md transition flex flex-col justify-between space-y-4 ${
                        isInactive ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-bold bg-blue-50 text-[#123B6D] px-2 py-0.5 rounded-md font-mono border border-blue-100">
                            {test.code}
                          </span>
                          {test.isPopular && (
                            <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                              <Sparkles className="w-2.5 h-2.5" /> POPULAR
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-sm text-[#123B6D] leading-snug">{test.name}</h4>

                        <div className="space-y-1.5 text-[11px] text-slate-600 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Droplet className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate font-medium">{test.sampleType}</span>
                            {test.fastingRequired && (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                                Fasting
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>TAT: {test.tatHours ? `${test.tatHours} hrs` : test.turnaroundTime || '4 hrs'}</span>
                            {test.unit && (
                              <span className="text-slate-400 ml-auto font-mono text-[10px]">
                                Unit: {test.unit}
                              </span>
                            )}
                          </div>
                          {test.normalRange && (
                            <div className="text-[10px] font-mono text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-lg line-clamp-2" title={test.normalRange}>
                              <span className="text-slate-400 font-bold uppercase text-[9px] block">Reference Range:</span>
                              {test.normalRange}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className="text-base font-black text-[#123B6D]">₹{test.priceINR}</div>
                          {test.mrpINR && test.mrpINR > test.priceINR && (
                            <span className="text-[10px] text-slate-400 line-through">₹{test.mrpINR}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = isInactive ? 'Active' : 'Inactive';
                              updateVendorTest(test.id, {
                                status: newStatus,
                                isActive: newStatus === 'Active',
                              });
                              setToastMessage(
                                `Test "${test.name}" marked as ${newStatus}. ${
                                  newStatus === 'Active' ? 'Now available online.' : 'Hidden from booking.'
                                }`
                              );
                              setTimeout(() => setToastMessage(''), 3000);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition border ${
                              isInactive
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title="Click to toggle online booking availability"
                          >
                            {isInactive ? '✕ Hidden' : '✓ Active'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(test)}
                            className="px-2.5 py-1 text-slate-700 hover:text-[#123B6D] hover:bg-amber-100/70 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#123B6D]" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTest(test)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer"
                            title="Delete test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT MODAL: Full dialog to edit an existing test */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingTest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden">
            <div className="bg-[#123B6D] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-black">
                  Edit Online Test: {editingTest.name} ({editingTest.code})
                </span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTestSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Test Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={testForm.name}
                    onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Test Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={testForm.code}
                    onChange={(e) => setTestForm({ ...testForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Specimen / Sample Tube
                  </label>
                  <input
                    type="text"
                    value={testForm.sampleType}
                    onChange={(e) => setTestForm({ ...testForm, sampleType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Measurement Unit
                  </label>
                  <input
                    type="text"
                    value={testForm.unit}
                    onChange={(e) => setTestForm({ ...testForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Biological Reference Interval
                  </label>
                  <input
                    type="text"
                    value={testForm.normalRange}
                    onChange={(e) => setTestForm({ ...testForm, normalRange: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Price in INR (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={testForm.priceINR}
                    onChange={(e) => setTestForm({ ...testForm, priceINR: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Turnaround Time (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={testForm.tatHours}
                    onChange={(e) => setTestForm({ ...testForm, tatHours: parseInt(e.target.value) || 4 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div className="sm:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800">
                      Enable for Online Patient Booking
                    </label>
                    <p className="text-[10px] text-slate-500">
                      When Active, patients can find and book this test on your laboratory website.
                    </p>
                  </div>
                  <select
                    value={testForm.status || 'Active'}
                    onChange={(e) => {
                      const val = e.target.value as 'Active' | 'Inactive';
                      setTestForm({ ...testForm, status: val, isActive: val === 'Active' });
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                      testForm.status === 'Inactive'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    <option value="Active">✓ Active (Show Online)</option>
                    <option value="Inactive">✕ Inactive (Hide)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL (Iframe Safe) */}
      {/* ========================================================================= */}
      {deletingTest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-300 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="p-2.5 rounded-full bg-rose-50">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">Are you sure you want to delete this?</h3>
                <p className="text-[11px] text-slate-500">This action will remove the test from your online catalog</p>
              </div>
            </div>

            <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <p>
                Are you sure you want to delete this? Diagnostic test: <strong className="text-slate-900">{deletingTest.name}</strong> (Code: <span className="font-mono">{deletingTest.code}</span>).
              </p>
              <p className="text-[11px] text-slate-500">
                Patients will no longer be able to select this test online for home collection or lab visit bookings.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTest(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
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
