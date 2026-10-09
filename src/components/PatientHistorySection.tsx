import React, { useState } from 'react';
import { Search, History, Calendar, FileText, ArrowRight, UserCheck } from 'lucide-react';

export const PatientHistorySection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('Mobile');
  const searchFields = [
    'Name',
    'Mobile',
    'Patient ID',
    'Report ID',
    'Invoice',
    'Doctor',
    'Test',
    'Date',
    'Department',
  ];

  const timelineRecords = [
    {
      date: '03-Sep-2026',
      time: '11:30 AM',
      reportId: 'RPT-2026-8812',
      tests: 'Complete Blood Count (CBC) + HbA1c Diabetes Profile',
      doctor: 'Dr. S. K. Gupta (MD Med)',
      branch: 'Clinical Pathology',
      flag: 'HbA1c: 6.8% (Elevated)',
      status: 'Verified & Delivered',
    },
    {
      date: '14-May-2026',
      time: '09:15 AM',
      reportId: 'RPT-2026-4109',
      tests: 'Lipid Profile Comprehensive + Fasting Blood Sugar',
      doctor: 'Dr. S. K. Gupta (MD Med)',
      branch: 'Biochemistry',
      flag: 'FBS: 142 mg/dL',
      status: 'Archived',
    },
    {
      date: '10-Nov-2025',
      time: '10:40 AM',
      reportId: 'RPT-2025-9921',
      tests: 'Executive Health Checkup Package (54 Parameters)',
      doctor: 'Self Walk-in',
      branch: 'Wellness Screening',
      flag: 'Vit D3: 16.4 ng/mL (Deficient)',
      status: 'Archived',
    },
  ];

  return (
    <section className="py-16 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-semibold mb-3">
            <span>Longitudinal Electronic Health Records</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Every Patient. Every Report. One History.
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            When a patient returns months later, their complete clinical trajectory, previous test comparisons, and doctor referrals are instantly retrieved in a single click.
          </p>
        </div>

        {/* Search Matrix as specified */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
          <div className="text-xs font-bold text-slate-700 mb-2">Search Patient Records By:</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {searchFields.map((field) => (
              <button
                key={field}
                onClick={() => setActiveFilter(field)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeFilter === field
                    ? 'bg-[#123B6D] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {field}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              defaultValue="9876543210 (Ramesh Kumar Verma)"
              placeholder={`Search by ${activeFilter}...`}
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
            />
            <span className="absolute right-3 top-2.5 text-[11px] font-bold text-[#0F766E]">
              1 UHID Match Found
            </span>
          </div>
        </div>

        {/* Timeline View */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-800">
              Clinical Chronology • Ramesh Kumar Verma (UHID: LAB-2026-9041)
            </span>
            <span>3 Recorded Visits</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {timelineRecords.map((rec, idx) => (
              <div
                key={idx}
                className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#123B6D]/30 transition"
              >
                {/* Dot */}
                <div className="absolute -left-6 top-5 w-3 h-3 rounded-full bg-[#123B6D] border-2 border-white shadow-xs" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-[#172033]">{rec.date}</span>
                    <span className="text-[11px] text-slate-400">({rec.time})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500">{rec.reportId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      {rec.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-800">{rec.tests}</div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-[#64748B] pt-2 border-t border-slate-100">
                  <span>Dr: <strong className="text-slate-700">{rec.doctor}</strong></span>
                  <span>Dept: <strong className="text-slate-700">{rec.branch}</strong></span>
                  <span className="text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                    {rec.flag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
