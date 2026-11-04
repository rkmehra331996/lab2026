import React, { useState, useMemo } from 'react';
import {
  Layers,
  FlaskConical,
  Binary,
  Calculator,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  IndianRupee,
  Activity,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  X,
  Save,
  Check,
  Tag,
  Eye,
  Percent,
  Play,
  Sparkles,
  HelpCircle,
  FolderTree,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import {
  ClinicalDepartment,
  ClinicalParameter,
  ClinicalFormula,
  ClinicalTestDefinition,
  ParameterDataType,
} from '../../types';
import {
  extractFormulaTokens,
  validateFormulaSyntax,
  evaluateFormula,
} from '../../utils/clinicalFormulaEngine';

export type ClinicalCatalogTab = 'departments' | 'tests' | 'parameters' | 'formulas';

interface ClinicalCatalogManagementProps {
  initialTab?: ClinicalCatalogTab;
  onClose?: () => void;
}

export const ClinicalCatalogManagement: React.FC<ClinicalCatalogManagementProps> = ({
  initialTab = 'departments',
  onClose,
}) => {
  const {
    clinicalDepartments,
    addClinicalDepartment,
    updateClinicalDepartment,
    deleteClinicalDepartment,
    clinicalParameters,
    addClinicalParameter,
    updateClinicalParameter,
    deleteClinicalParameter,
    clinicalFormulas,
    addClinicalFormula,
    updateClinicalFormula,
    deleteClinicalFormula,
    clinicalTests,
    addClinicalTestDefinition,
    updateClinicalTestDefinition,
    deleteClinicalTestDefinition,
    resetClinicalCatalogToDefault,
  } = useCms();

  const [activeTab, setActiveTab] = useState<ClinicalCatalogTab>(initialTab);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ================= DEPARTMENTS STATE =================
  const [deptSearch, setDeptSearch] = useState('');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<ClinicalDepartment | null>(null);
  const [deptForm, setDeptForm] = useState<Omit<ClinicalDepartment, 'id'>>({
    name: '',
    code: '',
    description: '',
    headOfDepartment: '',
    accentColor: '#0284c7',
    defaultSpecimens: ['Serum'],
    defaultTatHours: 4,
    displayOrder: 1,
    isActive: true,
  });
  const [specimenInput, setSpecimenInput] = useState('');

  // ================= PARAMETERS STATE =================
  const [paramSearch, setParamSearch] = useState('');
  const [paramDeptFilter, setParamDeptFilter] = useState('All');
  const [paramTypeFilter, setParamTypeFilter] = useState('All');
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<ClinicalParameter | null>(null);
  const [paramForm, setParamForm] = useState<Omit<ClinicalParameter, 'id'>>({
    name: '',
    code: '',
    shortName: '',
    departmentId: '',
    departmentName: '',
    unit: 'mg/dL',
    dataType: 'numeric',
    universalRange: 'Normal / Biological Reference Interval',
    defaultNormalValue: '',
    minNormal: undefined,
    maxNormal: undefined,
    panicLow: undefined,
    panicHigh: undefined,
    isCalculated: false,
    formulaExpression: '',
    decimalPlaces: 2,
    methodology: '',
    clinicalSignificance: '',
    isActive: true,
  });

  // ================= FORMULAS STATE =================
  const [formulaSearch, setFormulaSearch] = useState('');
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<ClinicalFormula | null>(null);
  const [formulaForm, setFormulaForm] = useState<Omit<ClinicalFormula, 'id'>>({
    name: '',
    outputParameterCode: '',
    outputParameterName: '',
    expression: '',
    requiredParameterCodes: [],
    decimalPlaces: 2,
    description: '',
    clinicalNote: '',
    isActive: true,
  });

  // Interactive formula simulator inside modal or tab
  const [simValues, setSimValues] = useState<Record<string, string>>({
    TBIL: '2.4',
    DBIL: '0.8',
    TP: '7.2',
    ALB: '4.2',
    GLOB: '3.0',
    TG: '150',
    TC: '210',
    HDL: '45',
    UREA: '28',
    CREAT: '0.9',
    WBC: '7200',
    NEUT: '65',
    HB: '14.2',
    RBC: '4.8',
    PCV: '42.5',
  });

  // ================= TESTS STATE =================
  const [testSearch, setTestSearch] = useState('');
  const [testDeptFilter, setTestDeptFilter] = useState('All');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<ClinicalTestDefinition | null>(null);
  const [testForm, setTestForm] = useState<Omit<ClinicalTestDefinition, 'id'>>({
    code: '',
    name: '',
    shortName: '',
    departmentId: '',
    departmentName: '',
    testType: 'panel',
    methodology: 'Automated Clinical Chemistry',
    sampleType: 'Serum',
    containerTube: 'SST Gel Separator (Yellow Top)',
    fastingRequired: false,
    fastingInstructions: '',
    turnaroundTime: '2 to 4 Hours',
    priceINR: 500,
    mrpINR: 800,
    b2bPriceINR: 250,
    parameterIds: [],
    formulaIds: [],
    status: 'Active',
    isPopular: false,
    description: '',
  });

  // ================= FILTERED LISTS =================
  const filteredDepartments = useMemo(() => {
    return clinicalDepartments.filter((d) => {
      const q = deptSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.headOfDepartment && d.headOfDepartment.toLowerCase().includes(q))
      );
    });
  }, [clinicalDepartments, deptSearch]);

  const filteredParameters = useMemo(() => {
    return clinicalParameters.filter((p) => {
      const q = paramSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.shortName && p.shortName.toLowerCase().includes(q)) ||
        (p.unit && p.unit.toLowerCase().includes(q));

      const matchDept = paramDeptFilter === 'All' || p.departmentId === paramDeptFilter;
      const matchType =
        paramTypeFilter === 'All' ||
        (paramTypeFilter === 'calculated' && p.isCalculated) ||
        (paramTypeFilter === 'numeric' && p.dataType === 'numeric') ||
        (paramTypeFilter === 'text' && p.dataType === 'text');

      return matchSearch && matchDept && matchType;
    });
  }, [clinicalParameters, paramSearch, paramDeptFilter, paramTypeFilter]);

  const filteredFormulas = useMemo(() => {
    return clinicalFormulas.filter((f) => {
      const q = formulaSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.outputParameterCode.toLowerCase().includes(q) ||
        f.outputParameterName.toLowerCase().includes(q) ||
        f.expression.toLowerCase().includes(q)
      );
    });
  }, [clinicalFormulas, formulaSearch]);

  const filteredTests = useMemo(() => {
    return clinicalTests.filter((t) => {
      const q = testSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.shortName && t.shortName.toLowerCase().includes(q)) ||
        (t.sampleType && t.sampleType.toLowerCase().includes(q));

      const matchDept = testDeptFilter === 'All' || t.departmentId === testDeptFilter;
      return matchSearch && matchDept;
    });
  }, [clinicalTests, testSearch, testDeptFilter]);

  // Available parameter codes for formula auto-completion
  const availableCodes = useMemo(() => {
    return clinicalParameters.map((p) => p.code.toUpperCase());
  }, [clinicalParameters]);

  // Live syntax check for the formula being edited
  const liveFormulaCheck = useMemo(() => {
    if (!formulaForm.expression.trim()) {
      return { isValid: false, error: 'Enter a mathematical expression with tokens' };
    }
    return validateFormulaSyntax(formulaForm.expression, availableCodes);
  }, [formulaForm.expression, availableCodes]);

  // Live simulation for the active formula
  const liveFormulaSimResult = useMemo(() => {
    if (!formulaForm.expression.trim()) return null;
    return evaluateFormula(formulaForm.expression, simValues, formulaForm.decimalPlaces);
  }, [formulaForm.expression, simValues, formulaForm.decimalPlaces]);

  // ================= HANDLERS: DEPARTMENTS =================
  const handleOpenDeptModal = (dept?: ClinicalDepartment) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({
        name: dept.name,
        code: dept.code,
        description: dept.description || '',
        headOfDepartment: dept.headOfDepartment || '',
        accentColor: dept.accentColor || '#0284c7',
        defaultSpecimens: dept.defaultSpecimens || ['Serum'],
        defaultTatHours: dept.defaultTatHours || 4,
        displayOrder: dept.displayOrder || 1,
        isActive: dept.isActive !== false,
      });
    } else {
      setEditingDept(null);
      setDeptForm({
        name: '',
        code: '',
        description: '',
        headOfDepartment: '',
        accentColor: '#0284c7',
        defaultSpecimens: ['Serum'],
        defaultTatHours: 4,
        displayOrder: clinicalDepartments.length + 1,
        isActive: true,
      });
    }
    setSpecimenInput('');
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      showToast('⚠️ Please enter department name and code');
      return;
    }

    if (editingDept) {
      updateClinicalDepartment(editingDept.id, deptForm);
      showToast(`✅ Department "${deptForm.name}" updated successfully!`);
    } else {
      addClinicalDepartment(deptForm);
      showToast(`✅ Department "${deptForm.name}" created successfully!`);
    }
    setIsDeptModalOpen(false);
  };

  const handleDeleteDept = (dept: ClinicalDepartment) => {
    if (window.confirm(`Are you sure you want to delete department "${dept.name}" (${dept.code})?`)) {
      deleteClinicalDepartment(dept.id);
      showToast(`🗑️ Department "${dept.name}" removed.`);
    }
  };

  const handleAddSpecimenTag = () => {
    if (specimenInput.trim() && !deptForm.defaultSpecimens.includes(specimenInput.trim())) {
      setDeptForm((prev) => ({
        ...prev,
        defaultSpecimens: [...prev.defaultSpecimens, specimenInput.trim()],
      }));
      setSpecimenInput('');
    }
  };

  const handleRemoveSpecimenTag = (specimen: string) => {
    setDeptForm((prev) => ({
      ...prev,
      defaultSpecimens: prev.defaultSpecimens.filter((s) => s !== specimen),
    }));
  };

  // ================= HANDLERS: PARAMETERS =================
  const handleOpenParamModal = (param?: ClinicalParameter) => {
    if (param) {
      setEditingParam(param);
      setParamForm({
        name: param.name,
        code: param.code,
        shortName: param.shortName || '',
        departmentId: param.departmentId || (clinicalDepartments[0]?.id || ''),
        departmentName: param.departmentName || '',
        unit: param.unit || '',
        dataType: param.dataType || 'numeric',
        universalRange: param.universalRange || '',
        defaultNormalValue: param.defaultNormalValue || '',
        minNormal: param.minNormal,
        maxNormal: param.maxNormal,
        panicLow: param.panicLow,
        panicHigh: param.panicHigh,
        isCalculated: Boolean(param.isCalculated),
        formulaExpression: param.formulaExpression || '',
        decimalPlaces: param.decimalPlaces !== undefined ? param.decimalPlaces : 2,
        methodology: param.methodology || '',
        clinicalSignificance: param.clinicalSignificance || '',
        isActive: param.isActive !== false,
      });
    } else {
      setEditingParam(null);
      setParamForm({
        name: '',
        code: '',
        shortName: '',
        departmentId: clinicalDepartments[0]?.id || '',
        departmentName: clinicalDepartments[0]?.name || '',
        unit: 'mg/dL',
        dataType: 'numeric',
        universalRange: 'Normal / Biological Reference Interval',
        defaultNormalValue: '',
        minNormal: undefined,
        maxNormal: undefined,
        panicLow: undefined,
        panicHigh: undefined,
        isCalculated: false,
        formulaExpression: '',
        decimalPlaces: 2,
        methodology: '',
        clinicalSignificance: '',
        isActive: true,
      });
    }
    setIsParamModalOpen(true);
  };

  const handleSaveParam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paramForm.name.trim() || !paramForm.code.trim()) {
      showToast('⚠️ Please enter parameter name and code');
      return;
    }

    const dept = clinicalDepartments.find((d) => d.id === paramForm.departmentId);
    const payload = {
      ...paramForm,
      code: paramForm.code.toUpperCase().trim(),
      departmentName: dept?.name || paramForm.departmentName,
    };

    if (editingParam) {
      updateClinicalParameter(editingParam.id, payload);
      showToast(`✅ Clinical parameter "${payload.name}" updated!`);
    } else {
      addClinicalParameter(payload);
      showToast(`✅ Clinical parameter "${payload.name}" added to library!`);
    }
    setIsParamModalOpen(false);
  };

  const handleDeleteParam = (param: ClinicalParameter) => {
    if (window.confirm(`Delete parameter "${param.name}" [${param.code}]?`)) {
      deleteClinicalParameter(param.id);
      showToast(`🗑️ Parameter "${param.name}" deleted.`);
    }
  };

  // ================= HANDLERS: FORMULAS =================
  const handleOpenFormulaModal = (formula?: ClinicalFormula) => {
    if (formula) {
      setEditingFormula(formula);
      setFormulaForm({
        name: formula.name,
        outputParameterCode: formula.outputParameterCode,
        outputParameterName: formula.outputParameterName,
        expression: formula.expression,
        requiredParameterCodes: formula.requiredParameterCodes || [],
        decimalPlaces: formula.decimalPlaces !== undefined ? formula.decimalPlaces : 2,
        description: formula.description || '',
        clinicalNote: formula.clinicalNote || '',
        isActive: formula.isActive !== false,
      });
    } else {
      setEditingFormula(null);
      setFormulaForm({
        name: '',
        outputParameterCode: '',
        outputParameterName: '',
        expression: '',
        requiredParameterCodes: [],
        decimalPlaces: 2,
        description: '',
        clinicalNote: '',
        isActive: true,
      });
    }
    setIsFormulaModalOpen(true);
  };

  const handleInsertTokenIntoFormula = (token: string) => {
    setFormulaForm((prev) => {
      const exp = prev.expression.trim();
      const newExp = exp ? `${exp} [${token}]` : `[${token}]`;
      const tokens = extractFormulaTokens(newExp);
      return {
        ...prev,
        expression: newExp,
        requiredParameterCodes: tokens,
      };
    });
  };

  const handleInsertOperatorIntoFormula = (op: string) => {
    setFormulaForm((prev) => ({
      ...prev,
      expression: `${prev.expression} ${op} `,
    }));
  };

  const handleSaveFormula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulaForm.name.trim() || !formulaForm.outputParameterCode.trim()) {
      showToast('⚠️ Please provide formula title and target output parameter');
      return;
    }

    const check = validateFormulaSyntax(formulaForm.expression, availableCodes);
    if (!check.isValid) {
      showToast(`⚠️ Formula syntax error: ${check.error}`);
      return;
    }

    const payload = {
      ...formulaForm,
      requiredParameterCodes: check.tokens,
    };

    if (editingFormula) {
      updateClinicalFormula(editingFormula.id, payload);
      showToast(`✅ Formulation "${payload.name}" updated!`);
    } else {
      addClinicalFormula(payload);
      showToast(`✅ Formulation "${payload.name}" saved to calculation engine!`);
    }
    setIsFormulaModalOpen(false);
  };

  const handleDeleteFormula = (formula: ClinicalFormula) => {
    if (window.confirm(`Delete formula "${formula.name}"?`)) {
      deleteClinicalFormula(formula.id);
      showToast(`🗑️ Formula "${formula.name}" deleted.`);
    }
  };

  // ================= HANDLERS: TESTS =================
  const handleOpenTestModal = (test?: ClinicalTestDefinition) => {
    if (test) {
      setEditingTest(test);
      setTestForm({
        code: test.code,
        name: test.name,
        shortName: test.shortName || '',
        departmentId: test.departmentId || (clinicalDepartments[0]?.id || ''),
        departmentName: test.departmentName || '',
        testType: test.testType || 'panel',
        methodology: test.methodology || '',
        sampleType: test.sampleType || 'Serum',
        containerTube: test.containerTube || 'SST Gel Separator (Yellow Top)',
        fastingRequired: Boolean(test.fastingRequired),
        fastingInstructions: test.fastingInstructions || '',
        turnaroundTime: test.turnaroundTime || '2 to 4 Hours',
        priceINR: test.priceINR || 500,
        mrpINR: test.mrpINR || 800,
        b2bPriceINR: test.b2bPriceINR || 250,
        parameterIds: test.parameterIds || [],
        formulaIds: test.formulaIds || [],
        status: test.status || 'Active',
        isPopular: Boolean(test.isPopular),
        description: test.description || '',
      });
    } else {
      setEditingTest(null);
      setTestForm({
        code: '',
        name: '',
        shortName: '',
        departmentId: clinicalDepartments[0]?.id || '',
        departmentName: clinicalDepartments[0]?.name || '',
        testType: 'panel',
        methodology: 'Automated Clinical Chemistry',
        sampleType: 'Serum',
        containerTube: 'SST Gel Separator (Yellow Top)',
        fastingRequired: false,
        fastingInstructions: '',
        turnaroundTime: '2 to 4 Hours',
        priceINR: 450,
        mrpINR: 750,
        b2bPriceINR: 220,
        parameterIds: [],
        formulaIds: [],
        status: 'Active',
        isPopular: false,
        description: '',
      });
    }
    setIsTestModalOpen(true);
  };

  const handleToggleParamInTest = (paramId: string) => {
    setTestForm((prev) => {
      const exists = prev.parameterIds.includes(paramId);
      const nextIds = exists
        ? prev.parameterIds.filter((id) => id !== paramId)
        : [...prev.parameterIds, paramId];
      return { ...prev, parameterIds: nextIds };
    });
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.name.trim() || !testForm.code.trim()) {
      showToast('⚠️ Please enter test name and code');
      return;
    }

    const dept = clinicalDepartments.find((d) => d.id === testForm.departmentId);
    const payload = {
      ...testForm,
      code: testForm.code.toUpperCase().trim(),
      departmentName: dept?.name || testForm.departmentName,
    };

    if (editingTest) {
      updateClinicalTestDefinition(editingTest.id, payload);
      showToast(`✅ Test definition "${payload.name}" updated!`);
    } else {
      addClinicalTestDefinition(payload);
      showToast(`✅ Test "${payload.name}" added to diagnostic catalog & billing!`);
    }
    setIsTestModalOpen(false);
  };

  const handleDeleteTest = (test: ClinicalTestDefinition) => {
    if (window.confirm(`Delete clinical test "${test.name}" (${test.code})?`)) {
      deleteClinicalTestDefinition(test.id);
      showToast(`🗑️ Test "${test.name}" deleted.`);
    }
  };

  const handleResetCatalog = () => {
    if (
      window.confirm(
        'Are you sure you want to restore the entire Clinical Catalog to NABL Standard Defaults? This will reset all departments, tests, parameters, and formulations.'
      )
    ) {
      resetClinicalCatalogToDefault();
      showToast('✨ Clinical Catalog restored to standard NABL medical defaults!');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white px-4 sm:px-8 py-6 shadow-md border-b border-indigo-800/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-semibold text-sky-200 mb-2">
              <FlaskConical className="w-3.5 h-3.5 text-sky-300" />
              <span>NABL & ISO 15189 Clinical Standards</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Clinical Catalog & Formulation Engine
            </h1>
            <p className="text-sm text-sky-200/90 mt-1 max-w-2xl">
              Configure diagnostic departments, tests, clinical parameters, biological reference intervals, and real-time mathematical formulation engines.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleResetCatalog}
              type="button"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors border border-white/20"
              title="Reset all departments, parameters, formulas and tests to standard defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standards</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                type="button"
                className="inline-flex items-center space-x-1 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-6 flex overflow-x-auto gap-2 border-b border-white/15 pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'departments'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-sky-100 hover:bg-white/10'
            }`}
          >
            <FolderTree className="w-4 h-4 text-sky-600" />
            <span>1. Departments</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/80 text-slate-800">
              {clinicalDepartments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'tests'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-sky-100 hover:bg-white/10'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-emerald-600" />
            <span>2. Tests & Panels</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/80 text-slate-800">
              {clinicalTests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('parameters')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'parameters'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-sky-100 hover:bg-white/10'
            }`}
          >
            <Binary className="w-4 h-4 text-indigo-600" />
            <span>3. Clinical Parameters</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/80 text-slate-800">
              {clinicalParameters.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('formulas')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'formulas'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-sky-100 hover:bg-white/10'
            }`}
          >
            <Calculator className="w-4 h-4 text-rose-600" />
            <span>4. Formulation Engine</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-200/80 text-slate-800">
              {clinicalFormulas.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* ========================================================================= */}
        {/* TAB 1: DEPARTMENTS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    placeholder="Search department name, code, or HOD..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleOpenDeptModal()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Department</span>
                </button>
              </div>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDepartments.map((dept) => {
                const testCount = clinicalTests.filter((t) => t.departmentId === dept.id).length;
                const paramCount = clinicalParameters.filter((p) => p.departmentId === dept.id).length;

                return (
                  <div
                    key={dept.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: dept.accentColor || '#0284c7' }}
                    />

                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: dept.accentColor || '#0284c7' }}
                          >
                            {dept.code}
                          </span>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                            <span className="text-xs text-slate-500">Order #{dept.displayOrder}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenDeptModal(dept)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Edit Department"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDept(dept)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {dept.description && (
                        <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                          {dept.description}
                        </p>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        {dept.headOfDepartment && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Head of Dept:</span>
                            <span className="font-medium text-slate-800">{dept.headOfDepartment}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Turnaround Time:</span>
                          <span className="font-semibold text-slate-800 flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500 inline" />
                            <span>{dept.defaultTatHours} Hours</span>
                          </span>
                        </div>
                      </div>

                      {/* Specimen Tags */}
                      {dept.defaultSpecimens && dept.defaultSpecimens.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {dept.defaultSpecimens.map((specimen, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {specimen}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          {testCount} Tests
                        </span>
                        <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                          {paramCount} Params
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          dept.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TESTS & PANELS CATALOG */}
        {/* ========================================================================= */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative min-w-[240px] flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search test name, code, specimen..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={testDeptFilter}
                  onChange={(e) => setTestDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All">All Departments</option>
                  {clinicalDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleOpenTestModal()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Clinical Test</span>
              </button>
            </div>

            {/* Tests Table / Cards */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Test Code & Name</th>
                      <th className="px-4 py-3.5">Department</th>
                      <th className="px-4 py-3.5">Specimen & Tube</th>
                      <th className="px-4 py-3.5">Turnaround</th>
                      <th className="px-4 py-3.5">Parameters</th>
                      <th className="px-4 py-3.5">Pricing (₹ INR)</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          No clinical tests found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredTests.map((test) => {
                        const dept = clinicalDepartments.find((d) => d.id === test.departmentId);
                        const hasFormulas = (test.formulaIds && test.formulaIds.length > 0);

                        return (
                          <tr key={test.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center space-x-2.5">
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                  {test.code}
                                </span>
                                <div>
                                  <div className="font-semibold text-slate-900">{test.name}</div>
                                  <div className="text-xs text-slate-500">
                                    {test.testType === 'panel' ? 'Comprehensive Panel' : 'Single Investigation'} • {test.methodology}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span
                                className="px-2.5 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: dept ? `${dept.accentColor}15` : '#f1f5f9',
                                  color: dept?.accentColor || '#334155',
                                }}
                              >
                                {dept?.name || test.departmentName || 'Biochemistry'}
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="text-xs font-medium text-slate-800">{test.sampleType}</div>
                              <div className="text-[11px] text-slate-500">{test.containerTube}</div>
                              {test.fastingRequired && (
                                <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                                  Fasting Required
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-700">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>{test.turnaroundTime}</span>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="flex items-center space-x-1.5">
                                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs">
                                  {test.parameterIds?.length || 0} Params
                                </span>
                                {hasFormulas && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-medium flex items-center space-x-1" title="Includes Auto-calculated formulas">
                                    <Calculator className="w-3 h-3" />
                                    <span>Formulas</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="text-xs">
                                <span className="font-bold text-emerald-700 text-sm">₹{test.priceINR}</span>
                                {test.mrpINR && test.mrpINR > test.priceINR && (
                                  <span className="text-slate-400 line-through ml-1.5 text-xs">
                                    ₹{test.mrpINR}
                                  </span>
                                )}
                              </div>
                              {test.b2bPriceINR && (
                                <div className="text-[11px] text-slate-500">
                                  B2B: ₹{test.b2bPriceINR}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => handleOpenTestModal(test)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Edit Test"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTest(test)}
                                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Test"
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CLINICAL PARAMETERS LIBRARY */}
        {/* ========================================================================= */}
        {activeTab === 'parameters' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative min-w-[240px] flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={paramSearch}
                    onChange={(e) => setParamSearch(e.target.value)}
                    placeholder="Search parameter name, code, token..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={paramDeptFilter}
                  onChange={(e) => setParamDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Departments</option>
                  {clinicalDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>

                <select
                  value={paramTypeFilter}
                  onChange={(e) => setParamTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Types</option>
                  <option value="calculated">⚡ Calculated via Formula</option>
                  <option value="numeric">Numeric Value</option>
                  <option value="text">Text / Semi-Quantitative</option>
                </select>
              </div>

              <button
                onClick={() => handleOpenParamModal()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Parameter</span>
              </button>
            </div>

            {/* Parameters Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Parameter Code / Token</th>
                      <th className="px-4 py-3.5">Full Name</th>
                      <th className="px-4 py-3.5">Department</th>
                      <th className="px-4 py-3.5">Unit</th>
                      <th className="px-4 py-3.5">Reference Range</th>
                      <th className="px-4 py-3.5">Panic / Critical Limits</th>
                      <th className="px-4 py-3.5">Type & Formula</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParameters.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          No clinical parameters found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredParameters.map((param) => {
                        const dept = clinicalDepartments.find((d) => d.id === param.departmentId);

                        return (
                          <tr key={param.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5 font-mono">
                              <span className="px-2.5 py-1 rounded bg-slate-900 text-amber-300 font-bold text-xs">
                                [{param.code}]
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-900">{param.name}</div>
                              {param.methodology && (
                                <div className="text-xs text-slate-500">{param.methodology}</div>
                              )}
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                              {dept?.name || param.departmentName || 'Biochemistry'}
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700">
                              {param.unit || '—'}
                            </td>

                            <td className="px-4 py-3.5 text-xs text-slate-800">
                              <span className="font-medium">{param.universalRange}</span>
                            </td>

                            <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                              {param.panicLow !== undefined || param.panicHigh !== undefined ? (
                                <span className="inline-flex items-center space-x-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>
                                    {param.panicLow !== undefined ? `< ${param.panicLow}` : ''}
                                    {param.panicLow !== undefined && param.panicHigh !== undefined ? ' | ' : ''}
                                    {param.panicHigh !== undefined ? `> ${param.panicHigh}` : ''}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              {param.isCalculated ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-900 font-medium">
                                  <Calculator className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Formula: {param.formulaExpression || 'Calculated'}</span>
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                                  Direct Measurement
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => handleOpenParamModal(param)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Edit Parameter"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteParam(param)}
                                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Parameter"
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FORMULATION & CALCULATION ENGINE */}
        {/* ========================================================================= */}
        {activeTab === 'formulas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formulaSearch}
                    onChange={(e) => setFormulaSearch(e.target.value)}
                    placeholder="Search formula name, output parameter, token..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleOpenFormulaModal()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Build New Formulation</span>
                </button>
              </div>
            </div>

            {/* Formulas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredFormulas.map((formula) => {
                const simResult = evaluateFormula(formula.expression, simValues, formula.decimalPlaces);

                return (
                  <div
                    key={formula.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-100 text-rose-800">
                              [{formula.outputParameterCode}]
                            </span>
                            <h3 className="font-bold text-slate-900 text-base">{formula.name}</h3>
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            Target Parameter: {formula.outputParameterName}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenFormulaModal(formula)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Edit Formula"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFormula(formula)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Formula"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Mathematical Expression Code Box */}
                      <div className="mt-3 p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-sm tracking-wide border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 mr-2">[{formula.outputParameterCode}] =</span>
                          <span>{formula.expression}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-sans">
                          {formula.decimalPlaces} Decimals
                        </span>
                      </div>

                      {formula.description && (
                        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                          {formula.description}
                        </p>
                      )}

                      {formula.clinicalNote && (
                        <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start space-x-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span>{formula.clinicalNote}</span>
                        </div>
                      )}
                    </div>

                    {/* Live Sandbox Calculation Preview */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-600 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Live Calculation Preview:</span>
                        </span>
                        {simResult.value !== null ? (
                          <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Result = {simResult.displayValue}
                          </span>
                        ) : (
                          <span className="text-rose-600 text-[11px]">{simResult.error}</span>
                        )}
                      </div>

                      {/* Required parameters tokens */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {formula.requiredParameterCodes?.map((code) => (
                          <span
                            key={code}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200"
                          >
                            [{code}]: {simValues[code] || '?'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT DEPARTMENT */}
      {/* ========================================================================= */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center space-x-2">
                <FolderTree className="w-5 h-5 text-sky-400" />
                <span>{editingDept ? 'Edit Clinical Department' : 'Create Clinical Department'}</span>
              </h2>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    placeholder="e.g. Clinical Biochemistry"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code (Token) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    placeholder="BIO"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Sub-specialty Scope
                </label>
                <textarea
                  rows={2}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="Automated wet chemistry, dry chemistry, enzymes, liver & renal panels..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Head of Department / Pathologist
                  </label>
                  <input
                    type="text"
                    value={deptForm.headOfDepartment}
                    onChange={(e) => setDeptForm({ ...deptForm, headOfDepartment: e.target.value })}
                    placeholder="Dr. R. K. Sharma, MD"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard TAT (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={deptForm.defaultTatHours}
                    onChange={(e) => setDeptForm({ ...deptForm, defaultTatHours: Number(e.target.value) || 2 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Color Theme
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={deptForm.accentColor || '#0284c7'}
                      onChange={(e) => setDeptForm({ ...deptForm, accentColor: e.target.value })}
                      className="w-10 h-10 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={deptForm.accentColor || '#0284c7'}
                      onChange={(e) => setDeptForm({ ...deptForm, accentColor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Order in Reports
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={deptForm.displayOrder}
                    onChange={(e) => setDeptForm({ ...deptForm, displayOrder: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Specimen Tags Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accepted Biological Specimens
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specimenInput}
                    onChange={(e) => setSpecimenInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpecimenTag();
                      }
                    }}
                    placeholder="e.g. Serum, EDTA Whole Blood, CSF..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecimenTag}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
                  >
                    Add Specimen
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {deptForm.defaultSpecimens.map((specimen, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 text-slate-800 text-xs rounded-full border border-slate-200"
                    >
                      <span>{specimen}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecimenTag(specimen)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-md"
                >
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PARAMETER */}
      {/* ========================================================================= */}
      {isParamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center space-x-2">
                <Binary className="w-5 h-5 text-indigo-400" />
                <span>{editingParam ? 'Edit Clinical Parameter' : 'Add Clinical Parameter'}</span>
              </h2>
              <button
                onClick={() => setIsParamModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParam} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parameter Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={paramForm.name}
                    onChange={(e) => setParamForm({ ...paramForm, name: e.target.value })}
                    placeholder="e.g. Total Bilirubin"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code / Token *
                  </label>
                  <input
                    type="text"
                    required
                    value={paramForm.code}
                    onChange={(e) => setParamForm({ ...paramForm, code: e.target.value.toUpperCase() })}
                    placeholder="TBIL"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={paramForm.departmentId}
                    onChange={(e) => setParamForm({ ...paramForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {clinicalDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    value={paramForm.unit}
                    onChange={(e) => setParamForm({ ...paramForm, unit: e.target.value })}
                    placeholder="mg/dL, g/dL, U/L, %, /cumm"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Type
                  </label>
                  <select
                    value={paramForm.dataType}
                    onChange={(e) => setParamForm({ ...paramForm, dataType: e.target.value as ParameterDataType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="numeric">Numeric (Continuous)</option>
                    <option value="text">Text / Semi-Quantitative</option>
                    <option value="range">Range Bracket</option>
                    <option value="options">Dropdown Options</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biological Reference Interval (Universal Display Range) *
                </label>
                <input
                  type="text"
                  required
                  value={paramForm.universalRange}
                  onChange={(e) => setParamForm({ ...paramForm, universalRange: e.target.value })}
                  placeholder="e.g. 0.2 - 1.2 mg/dL or Negative"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Normal numeric thresholds for automated abnormality detection */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-700 block">
                  Numeric Thresholds & Abnormal Flags
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Min Normal</label>
                    <input
                      type="number"
                      step="any"
                      value={paramForm.minNormal ?? ''}
                      onChange={(e) => setParamForm({ ...paramForm, minNormal: e.target.value !== '' ? Number(e.target.value) : undefined })}
                      placeholder="0.2"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Max Normal</label>
                    <input
                      type="number"
                      step="any"
                      value={paramForm.maxNormal ?? ''}
                      onChange={(e) => setParamForm({ ...paramForm, maxNormal: e.target.value !== '' ? Number(e.target.value) : undefined })}
                      placeholder="1.2"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-rose-600 mb-0.5 font-semibold">Panic Low</label>
                    <input
                      type="number"
                      step="any"
                      value={paramForm.panicLow ?? ''}
                      onChange={(e) => setParamForm({ ...paramForm, panicLow: e.target.value !== '' ? Number(e.target.value) : undefined })}
                      placeholder="Optional"
                      className="w-full px-2.5 py-1.5 border border-rose-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-rose-600 mb-0.5 font-semibold">Panic High</label>
                    <input
                      type="number"
                      step="any"
                      value={paramForm.panicHigh ?? ''}
                      onChange={(e) => setParamForm({ ...paramForm, panicHigh: e.target.value !== '' ? Number(e.target.value) : undefined })}
                      placeholder="Optional"
                      className="w-full px-2.5 py-1.5 border border-rose-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Formulation Link Section */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-900">
                      Calculated Parameter (Automated Formulation)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paramForm.isCalculated}
                      onChange={(e) => setParamForm({ ...paramForm, isCalculated: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {paramForm.isCalculated && (
                  <div className="space-y-2 pt-2 border-t border-amber-200/60">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                        Mathematical Formula Expression
                      </label>
                      <input
                        type="text"
                        value={paramForm.formulaExpression || ''}
                        onChange={(e) => setParamForm({ ...paramForm, formulaExpression: e.target.value })}
                        placeholder="e.g. [TBIL] - [DBIL] or [TC] - [HDL] - ([TG] / 5)"
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-mono text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-amber-800">
                      <span>Decimal precision:</span>
                      <select
                        value={paramForm.decimalPlaces}
                        onChange={(e) => setParamForm({ ...paramForm, decimalPlaces: Number(e.target.value) || 2 })}
                        className="px-2 py-1 bg-white border border-amber-300 rounded text-xs"
                      >
                        <option value={0}>0 (Integer e.g. 7200)</option>
                        <option value={1}>1 Decimal (e.g. 14.2)</option>
                        <option value={2}>2 Decimals (e.g. 1.25)</option>
                        <option value={3}>3 Decimals (e.g. 0.045)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Methodology / Assay Principle
                </label>
                <input
                  type="text"
                  value={paramForm.methodology}
                  onChange={(e) => setParamForm({ ...paramForm, methodology: e.target.value })}
                  placeholder="e.g. Jaffe Kinetic, Enzymatic CHOD-PAP, Flow Cytometry"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsParamModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md"
                >
                  {editingParam ? 'Update Parameter' : 'Save Parameter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT FORMULA BUILDER */}
      {/* ========================================================================= */}
      {isFormulaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-rose-400" />
                <span>{editingFormula ? 'Edit Formulation' : 'Interactive Formula Builder'}</span>
              </h2>
              <button
                onClick={() => setIsFormulaModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFormula} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Formula Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formulaForm.name}
                    onChange={(e) => setFormulaForm({ ...formulaForm, name: e.target.value })}
                    placeholder="e.g. Indirect Bilirubin Calculation"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Output Parameter Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formulaForm.outputParameterCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        const match = clinicalParameters.find((p) => p.code === code);
                        setFormulaForm({
                          ...formulaForm,
                          outputParameterCode: code,
                          outputParameterName: match ? match.name : formulaForm.outputParameterName,
                        });
                      }}
                      placeholder="e.g. IBIL"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Parameter Display Name
                </label>
                <input
                  type="text"
                  value={formulaForm.outputParameterName}
                  onChange={(e) => setFormulaForm({ ...formulaForm, outputParameterName: e.target.value })}
                  placeholder="e.g. Indirect Bilirubin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Mathematical Expression Input Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Mathematical Formula Expression *
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Use tokens like <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">[TBIL]</code>
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formulaForm.expression}
                  onChange={(e) => {
                    const exp = e.target.value;
                    const tokens = extractFormulaTokens(exp);
                    setFormulaForm({
                      ...formulaForm,
                      expression: exp,
                      requiredParameterCodes: tokens,
                    });
                  }}
                  placeholder="e.g. [TBIL] - [DBIL]"
                  className="w-full px-3 py-2.5 bg-slate-900 text-emerald-400 font-mono text-sm rounded-lg border border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                {/* Live Syntax Validation Indicator */}
                <div className="mt-1.5 flex items-center space-x-1.5 text-xs">
                  {liveFormulaCheck.isValid ? (
                    <span className="text-emerald-600 flex items-center space-x-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Formula expression syntax is valid</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center space-x-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{liveFormulaCheck.error}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Token Inserters (Chips) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Click to Insert Parameter Token:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white border border-slate-200 rounded-lg">
                  {clinicalParameters.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleInsertTokenIntoFormula(p.code)}
                      className="px-2 py-1 bg-slate-100 hover:bg-indigo-100 text-slate-800 hover:text-indigo-900 rounded text-xs font-mono font-medium transition-colors border border-slate-200"
                    >
                      + [{p.code}] ({p.name})
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-slate-500 mr-1">Operators:</span>
                  {['+', '-', '*', '/', '(', ')'].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => handleInsertOperatorIntoFormula(op)}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 border border-slate-300 rounded font-mono font-bold text-slate-800 text-sm"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Calculation Simulator Sandbox */}
              <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Formula Simulator (Test Bench)</span>
                  </span>
                  {liveFormulaSimResult && liveFormulaSimResult.value !== null ? (
                    <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border border-emerald-300">
                      [{formulaForm.outputParameterCode || 'OUT'}] = {liveFormulaSimResult.displayValue}
                    </span>
                  ) : (
                    <span className="text-rose-600 text-xs">
                      {liveFormulaSimResult?.error || 'Enter test inputs'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {extractFormulaTokens(formulaForm.expression).map((token) => (
                    <div key={token}>
                      <label className="block text-[11px] font-mono text-slate-600 mb-0.5">
                        [{token}] =
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={simValues[token] || ''}
                        onChange={(e) => setSimValues({ ...simValues, [token]: e.target.value })}
                        placeholder="Value"
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Decimal Precision
                  </label>
                  <select
                    value={formulaForm.decimalPlaces}
                    onChange={(e) => setFormulaForm({ ...formulaForm, decimalPlaces: Number(e.target.value) || 2 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value={0}>0 (Integer e.g. 7200)</option>
                    <option value={1}>1 Decimal (e.g. 14.2)</option>
                    <option value={2}>2 Decimals (e.g. 1.25)</option>
                    <option value={3}>3 Decimals (e.g. 0.045)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Note / Interpretation
                  </label>
                  <input
                    type="text"
                    value={formulaForm.clinicalNote}
                    onChange={(e) => setFormulaForm({ ...formulaForm, clinicalNote: e.target.value })}
                    placeholder="e.g. Reversal of A:G ratio indicates chronic liver disease"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormulaModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-md"
                >
                  {editingFormula ? 'Update Formulation' : 'Save to Calculation Engine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT TEST DEFINITION */}
      {/* ========================================================================= */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center space-x-2">
                <FlaskConical className="w-5 h-5 text-emerald-400" />
                <span>{editingTest ? 'Edit Clinical Test / Panel' : 'Define New Clinical Test'}</span>
              </h2>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test / Panel Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={testForm.name}
                    onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                    placeholder="e.g. Liver Function Test (LFT) Profile"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={testForm.code}
                    onChange={(e) => setTestForm({ ...testForm, code: e.target.value.toUpperCase() })}
                    placeholder="LFT"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={testForm.departmentId}
                    onChange={(e) => setTestForm({ ...testForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {clinicalDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test Type
                  </label>
                  <select
                    value={testForm.testType}
                    onChange={(e) => setTestForm({ ...testForm, testType: e.target.value as 'single' | 'panel' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="panel">Multi-Parameter Profile / Panel</option>
                    <option value="single">Single Parameter Investigation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Turnaround Time (TAT)
                  </label>
                  <input
                    type="text"
                    value={testForm.turnaroundTime}
                    onChange={(e) => setTestForm({ ...testForm, turnaroundTime: e.target.value })}
                    placeholder="2 to 4 Hours"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specimen Sample Type
                  </label>
                  <input
                    type="text"
                    value={testForm.sampleType}
                    onChange={(e) => setTestForm({ ...testForm, sampleType: e.target.value })}
                    placeholder="Serum, EDTA Blood, Urine"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vacutainer Tube / Container
                  </label>
                  <input
                    type="text"
                    value={testForm.containerTube}
                    onChange={(e) => setTestForm({ ...testForm, containerTube: e.target.value })}
                    placeholder="SST Gel (Yellow), EDTA (Lavender)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Methodology
                  </label>
                  <input
                    type="text"
                    value={testForm.methodology}
                    onChange={(e) => setTestForm({ ...testForm, methodology: e.target.value })}
                    placeholder="Enzymatic Kinetic, Spectrophotometry"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing in INR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">
                    Direct Patient Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={testForm.priceINR}
                    onChange={(e) => setTestForm({ ...testForm, priceINR: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">
                    Printed MRP (₹ INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={testForm.mrpINR}
                    onChange={(e) => setTestForm({ ...testForm, mrpINR: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">
                    B2B / Center Cost (₹ INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={testForm.b2bPriceINR ?? ''}
                    onChange={(e) => setTestForm({ ...testForm, b2bPriceINR: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Fasting Toggle */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testForm.fastingRequired}
                    onChange={(e) => setTestForm({ ...testForm, fastingRequired: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>Fasting Required for Patient</span>
                </label>
                {testForm.fastingRequired && (
                  <input
                    type="text"
                    value={testForm.fastingInstructions || ''}
                    onChange={(e) => setTestForm({ ...testForm, fastingInstructions: e.target.value })}
                    placeholder="e.g. 10 to 12 hours overnight fasting"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                )}
              </div>

              {/* Parameter Selection for this Test */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Map Parameters to this Test ({testForm.parameterIds.length} Selected)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click to include/exclude
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-white border border-slate-200 rounded-lg">
                  {clinicalParameters.map((param) => {
                    const isSelected = testForm.parameterIds.includes(param.id);
                    return (
                      <button
                        key={param.id}
                        type="button"
                        onClick={() => handleToggleParamInTest(param.id)}
                        className={`p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between border ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-mono text-[11px] text-slate-500">[{param.code}]</span>
                          <span className="truncate">{param.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md"
                >
                  {editingTest ? 'Update Test' : 'Add to Diagnostic Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
