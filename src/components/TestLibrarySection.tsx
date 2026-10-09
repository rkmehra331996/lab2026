import React, { useState } from 'react';
import { Search, Filter, FlaskConical, Clock, IndianRupee, Tag, Check } from 'lucide-react';
import { TEST_CATEGORIES } from '../data/mockData';
import { TestItem } from '../types';
import { useCms } from '../context/CmsContext';

export const TestLibrarySection: React.FC = () => {
  const { vendorTests } = useCms();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTests = vendorTests.filter((t) => {
    const matchesCategory =
      selectedCategory === 'All Categories' || t.category === selectedCategory;
    const matchesQuery =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sampleType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <section id="test-library-section" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-semibold mb-3">
            <span>Pre-Configured NABL Standards</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            500+ Tests Ready to Use
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Eliminate weeks of manual data entry. Built-in Indian standard reference ranges, units, specimen specs, and configurable pricing.
          </p>
        </div>

        {/* Search & Category Filter Interface */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests (e.g., CBC, Thyroid, HbA1c, Urine, Vit D)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 focus:border-[#123B6D]"
            />
          </div>

          {/* Category Tabs / Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {TEST_CATEGORIES.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#123B6D] text-white shadow-xs font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Test Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#123B6D]/40 hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#123B6D]/10 text-[#123B6D] uppercase tracking-wider">
                    {test.category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    {test.code}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#172033] leading-snug">
                  {test.name}
                </h3>

                <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 text-[11px]">Sample:</span>
                    <span className="font-medium text-slate-800">{test.sampleType}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 text-[11px]">Unit:</span>
                    <span className="font-mono text-slate-700">{test.unit}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="text-slate-400 text-[11px] block">Reference Range:</span>
                    <span className="text-[11px] font-mono text-slate-700 block bg-slate-50 p-1.5 rounded border border-slate-100 mt-0.5">
                      {test.normalRange}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Price & TAT Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>TAT: {test.turnaroundTime}</span>
                </div>
                <div className="text-sm font-black text-[#123B6D]">
                  ₹{test.priceINR}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            No tests found matching "{searchQuery}" in {selectedCategory}.
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-[#64748B]">
          All reference ranges are pre-stratified by Adult Male, Adult Female, Pediatric, and Geriatric intervals according to Indian ICMR/NABL clinical directives.
        </div>
      </div>
    </section>
  );
};
