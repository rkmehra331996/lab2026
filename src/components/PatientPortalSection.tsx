import React, { useState } from 'react';
import { Search, Download, ShieldCheck, FileText, CheckCircle2, User, Hash, Sparkles, Check } from 'lucide-react';
import { SAMPLE_REPORT } from '../data/mockData';
import { generateReportPdf } from '../utils/pdfGenerator';

interface PatientPortalSectionProps {
  onViewReport?: (reportId?: string, mobile?: string, labId?: string, patientName?: string) => void;
  onOpenVerifyModal?: (reportId: string) => void;
  onOpenPortal?: () => void;
}

export const PatientPortalSection: React.FC<PatientPortalSectionProps> = ({
  onViewReport,
  onOpenVerifyModal,
  onOpenPortal,
}) => {
  const [searchMethod, setSearchMethod] = useState<'name_mobile' | 'report_id'>('name_mobile');
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [reportId, setReportId] = useState('');
  const [downloadDone, setDownloadDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onViewReport) return;
    if (searchMethod === 'name_mobile') {
      onViewReport(undefined, mobileNumber.trim(), undefined, patientName.trim());
    } else {
      onViewReport(reportId.trim(), undefined, undefined, undefined);
    }
  };

  const handleDownloadDemo = () => {
    try {
      generateReportPdf(SAMPLE_REPORT);
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section id="patient-portal-section" className="py-16 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-3 border border-amber-200">
            <span>USP 2 • Zero Friction Experience</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Download Your Lab Report — No Login Required.
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Patients shouldn't have to create passwords or remember logins when they are unwell. Simple, secure, mobile-first verification.
          </p>
        </div>

        {/* The Portal Card */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8">
          {/* Trust badges inside portal */}
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-600 mb-5 pb-4 border-b border-slate-100">
            <span className="flex items-center gap-1 text-[#0F766E]">
              <CheckCircle2 className="w-4 h-4" /> No Registration
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-[#0F766E]">
              <CheckCircle2 className="w-4 h-4" /> No Password
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-[#0F766E]">
              <CheckCircle2 className="w-4 h-4" /> Instant PDF
            </span>
          </div>

          {/* Option Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSearchMethod('name_mobile')}
              className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                searchMethod === 'name_mobile'
                  ? 'bg-white text-[#123B6D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>1. Name + Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchMethod('report_id')}
              className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                searchMethod === 'report_id'
                  ? 'bg-white text-[#123B6D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>2. Token Number</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {searchMethod === 'name_mobile' ? (
              <>
                {/* Patient Name */}
                <div>
                  <label htmlFor="portal-patient-name" className="block text-xs font-bold text-[#172033] mb-1">
                    Patient Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="portal-patient-name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Verma"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 focus:border-[#123B6D]"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label htmlFor="portal-mobile" className="block text-xs font-bold text-[#172033] mb-1">
                    Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-semibold">+91</span>
                    <input
                      type="tel"
                      id="portal-mobile"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      pattern="[0-9]{10}"
                      required
                      className="w-full pl-12 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 focus:border-[#123B6D]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="portal-report-id" className="block text-xs font-bold text-[#172033] mb-1">
                  Token Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="portal-report-id"
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  placeholder="e.g. 101, TK-101 (or Report ID)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 focus:border-[#123B6D] font-mono"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                id="portal-btn-view-report"
                className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-3 rounded-xl font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Verify & Open Report Portal</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="portal-btn-download-pdf"
                  onClick={handleDownloadDemo}
                  className="bg-slate-100 hover:bg-slate-200 text-[#172033] py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Download sample NABL medical PDF"
                >
                  {downloadDone ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="portal-btn-verify-report"
                  onClick={() => onOpenVerifyModal(reportId || 'RPT-2026-8812')}
                  className="bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Verify Report</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
