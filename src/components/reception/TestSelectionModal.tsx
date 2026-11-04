import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Plus,
  FolderTree,
  FlaskConical,
  Sparkles,
  CheckCircle2,
  Trash2,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';

export interface ClinicalTestItem {
  name: string;
  price: number;
  sample?: string;
  category: string;
  isPopular?: boolean;
  code?: string;
}

export interface DepartmentCategory {
  key: string;
  label: string;
  icon: string;
  shortName: string;
  color?: string;
  bg?: string;
  border?: string;
}

interface TestSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTests: string[];
  onToggleTest: (testName: string, suggestedSample?: string) => void;
  onSelectAllCategoryTests: (tests: { name: string }[]) => void;
  onDeselectCategoryTests: (tests: { name: string }[]) => void;
  onClearAllTests: () => void;
  allAvailableTests: ClinicalTestItem[];
  parentCategories: DepartmentCategory[];
  categoryStats: Record<string, { total: number; selected: number }>;
  grossAmount: number;
}

export const TestSelectionModal: React.FC<TestSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedTests,
  onToggleTest,
  onSelectAllCategoryTests,
  onDeselectCategoryTests,
  onClearAllTests,
  allAvailableTests,
  parentCategories,
  categoryStats,
  grossAmount,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Popular');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tests under the selected department
  const departmentTests = useMemo(() => {
    if (activeCategory === 'Popular') {
      return allAvailableTests.filter((t) => t.isPopular);
    }
    if (activeCategory === 'All') {
      return allAvailableTests;
    }
    return allAvailableTests.filter((t) => t.category === activeCategory);
  }, [allAvailableTests, activeCategory]);

  // Filtered tests when user searches (searches whole catalog or active category)
  const displayedTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return departmentTests;

    // When searching, search all available tests to make finding any test seamless
    return allAvailableTests.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.code && t.code.toLowerCase().includes(q)) ||
        (t.sample && t.sample.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
    );
  }, [allAvailableTests, departmentTests, searchQuery]);

  if (!isOpen) return null;

  const currentCategoryMeta = parentCategories.find((c) => c.key === activeCategory) || {
    key: activeCategory,
    label: activeCategory,
    icon: '🧪',
    shortName: activeCategory,
  };

  const selectedCountInCurrentView = displayedTests.filter((t) =>
    selectedTests.includes(t.name)
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[92vh] max-h-[820px] flex flex-col overflow-hidden text-slate-800">
        {/* 1. Modal Header: Title + Live Selection Counter + Close */}
        <div className="bg-[#0F766E] text-white px-4 sm:px-6 py-3.5 border-b border-teal-800 flex items-center justify-between gap-3 shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
              <FlaskConical className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                  Select Diagnostic Tests &amp; Profiles
                </h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Clinical Departments
                </span>
              </div>
              <p className="text-[11px] text-teal-100/90 truncate hidden sm:block">
                Choose clinical department on left to view tests, or search directly by test name or code.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Count Pill */}
            <div className="bg-white/15 border border-white/20 rounded-xl px-2.5 sm:px-3 py-1 flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-teal-100 hidden sm:inline">Selected:</span>
              <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                {selectedTests.length} Tests
              </span>
              <span className="text-teal-200 font-bold hidden sm:inline">|</span>
              <span className="text-xs sm:text-sm font-black text-white font-mono hidden sm:inline">
                ₹{grossAmount}
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-white transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Global Search Bar */}
        <div className="p-3 sm:px-5 bg-slate-50 border-b border-slate-200 shrink-0 flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search test by name (e.g. CBC, Sugar, LFT, KFT, Lipid, HbA1c, Thyroid, Urine, Dengue)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery && (
            <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1.5 rounded-xl shrink-0">
              {displayedTests.length} matches
            </span>
          )}
        </div>

        {/* 3. TWO-PANEL BODY: Left = Departments | Right = Department Tests */}
        <div className="flex-1 flex flex-col md:grid md:grid-cols-12 overflow-hidden min-h-0">
          {/* LEFT PANEL: Departments / Categories List */}
          <div className="md:col-span-4 lg:col-span-3.5 bg-slate-50/90 border-b md:border-b-0 md:border-r border-slate-200 overflow-x-auto md:overflow-y-auto p-2 sm:p-2.5 shrink-0 max-h-24 md:max-h-none flex md:flex-col gap-1.5 md:gap-1 scrollbar-thin">
            <div className="hidden md:flex px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 items-center justify-between">
              <span className="flex items-center gap-1">
                <FolderTree className="w-3 h-3 text-teal-700" />
                <span>Departments ({parentCategories.length})</span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {allAvailableTests.length} Total
              </span>
            </div>

            <div className="flex md:flex-col gap-1.5 md:gap-1 w-full">
              {parentCategories.map((cat) => {
                const stats = categoryStats[cat.key] || { total: 0, selected: 0 };
                const isActive = activeCategory === cat.key && !searchQuery;

                return (
                  <button
                    type="button"
                    key={cat.key}
                    onClick={() => {
                      setActiveCategory(cat.key);
                      if (searchQuery) setSearchQuery('');
                    }}
                    className={`text-left px-2.5 md:px-3 py-2 md:py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-between gap-2 cursor-pointer border shrink-0 md:shrink md:w-full ${
                      isActive
                        ? 'bg-[#0F766E] text-white border-teal-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:border-teal-400 hover:bg-teal-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                      <span className="text-base shrink-0">{cat.icon}</span>
                      <span className="truncate leading-tight text-xs">{cat.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Total count */}
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isActive ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {stats.total}
                      </span>

                      {/* Selected in category badge */}
                      {stats.selected > 0 && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs ${
                            isActive
                              ? 'bg-amber-300 text-amber-950'
                              : 'bg-emerald-600 text-white'
                          }`}
                          title={`${stats.selected} test(s) currently selected from this department`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>{stats.selected}</span>
                        </span>
                      )}

                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-teal-200' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: Tests belonging to selected Department */}
          <div className="md:col-span-8 lg:col-span-8.5 bg-white flex flex-col overflow-hidden min-h-0 flex-1">
            {/* Right Panel Header: Active Department info + Bulk Select/Deselect */}
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{searchQuery ? '🔍' : currentCategoryMeta.icon}</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                    {searchQuery ? `Search Results for "${searchQuery}"` : currentCategoryMeta.label}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {displayedTests.length} test{displayedTests.length === 1 ? '' : 's'} available
                    {selectedCountInCurrentView > 0 ? ` • ${selectedCountInCurrentView} selected in this view` : ''}
                  </p>
                </div>
              </div>

              {displayedTests.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => onSelectAllCategoryTests(displayedTests)}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-[11px] transition cursor-pointer"
                  >
                    + Select All ({displayedTests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeselectCategoryTests(displayedTests)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-medium text-[11px] transition cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              )}
            </div>

            {/* Test Cards Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/30">
              {displayedTests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {displayedTests.map((test) => {
                    const isSelected = selectedTests.includes(test.name);

                    return (
                      <div
                        key={test.name}
                        onClick={() => onToggleTest(test.name, test.sample)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isSelected
                            ? 'bg-teal-50/90 border-2 border-[#0F766E] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-xs'
                        }`}
                      >
                        {/* Custom Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isSelected
                              ? 'bg-[#0F766E] border-teal-700 text-white'
                              : 'bg-white border-slate-300 text-transparent hover:border-teal-500'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        {/* Test Meta */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <h5
                              className={`text-xs sm:text-[13px] font-bold leading-tight ${
                                isSelected ? 'text-teal-950 font-black' : 'text-slate-900'
                              }`}
                            >
                              {test.name}
                            </h5>

                            {/* Price Badge */}
                            <span
                              className={`font-mono text-xs font-black px-2 py-0.5 rounded-md shrink-0 border ${
                                isSelected
                                  ? 'bg-teal-700 text-amber-200 border-teal-800 shadow-2xs'
                                  : 'bg-blue-50 text-[#123B6D] border-blue-200'
                              }`}
                            >
                              ₹{test.price}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {test.code && (
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                {test.code}
                              </span>
                            )}

                            {test.sample && (
                              <span className="text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <span>🧪</span>
                                <span className="truncate max-w-[150px]">{test.sample}</span>
                              </span>
                            )}

                            {searchQuery && test.category && (
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                                {test.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 text-xl">
                    🔍
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h5 className="font-bold text-slate-900 text-sm">
                      No clinical test matching "{searchQuery}"
                    </h5>
                    <p className="text-xs text-slate-500">
                      Check spelling or click below to add this as a custom test item for this patient.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleTest(searchQuery.trim());
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0d655e] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Add "{searchQuery.trim()}" as Custom Test (₹300)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Modal Footer: Selected Summary Strip + Done/Apply Button */}
        <div className="p-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left: Summary */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>
                Selected: <strong className="text-teal-900">{selectedTests.length} Tests</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                Gross Total: <strong className="font-mono text-[#123B6D] text-sm">₹{grossAmount}</strong>
              </span>
            </div>

            {selectedTests.length > 0 && (
              <button
                type="button"
                onClick={onClearAllTests}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1 ml-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Right: Close & Done Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0d655e] active:scale-98 text-white text-xs sm:text-sm font-black transition cursor-pointer shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-amber-300 stroke-[3]" />
              <span>Done / Apply Selection ({selectedTests.length} Tests • ₹{grossAmount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
