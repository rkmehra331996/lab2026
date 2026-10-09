import React, { useState } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Search,
  Check,
  Sparkles,
  User,
  Clock,
  Send,
  MessageSquare,
  BadgeCheck,
  ChevronRight,
  Eye,
  Building,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView, LabReport, ReportItem } from '../types';
import { RoleContextBanner } from './RoleContextBanner';
import { DashboardFooter } from './DashboardFooter';

interface PathologistDashboardProps {
  onNavigateView: (view: AppView) => void;
  onOpenReportPreview?: (reportId: string, mobile: string) => void;
  onOpenReportPortal?: (reportId?: string, mobile?: string) => void;
}

export const PathologistDashboard: React.FC<PathologistDashboardProps> = ({
  onNavigateView,
  onOpenReportPreview,
  onOpenReportPortal,
}) => {
  const { currentUser, labReports, updateLabReport, vendorLabSettings } = useCms();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'pending' | 'critical' | 'verified'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeImpression, setActiveImpression] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const selectedReport = selectedReportId
    ? labReports.find((r) => r.reportId === selectedReportId) || null
    : null;

  // Sync impression when selected report changes
  React.useEffect(() => {
    if (selectedReport) {
      setActiveImpression(selectedReport.clinicalImpression || '');
    }
  }, [selectedReportId, selectedReport]);

  const doctorName = currentUser?.name || 'Dr. Meenakshi Sundaram';
  const doctorDegree = 'MD (Microbiology & Clinical Pathology), FICPath';
  const medicalRegNo = 'MCI / PMC-48291';
  const nablAccreditation = vendorLabSettings?.nablAccreditationNo || 'MC-4821';

  // Identify panic / critical values
  const hasCriticalValues = (report: LabReport): boolean => {
    return report.items.some((item) => {
      const val = parseFloat(item.result);
      if (isNaN(val)) return false;
      // Critical check thresholds
      if (item.parameter.toLowerCase().includes('hemoglobin') && val < 7.0) return true;
      if (item.parameter.toLowerCase().includes('platelet') && val < 50000) return true;
      if (item.parameter.toLowerCase().includes('sugar') && (val > 300 || val < 50)) return true;
      if (item.parameter.toLowerCase().includes('creatinine') && val > 3.0) return true;
      if (item.parameter.toLowerCase().includes('bilirubin') && val > 6.0) return true;
      return false;
    });
  };

  // Filtered reports
  const filteredReports = labReports.filter((rep) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        rep.patientName.toLowerCase().includes(q) ||
        rep.reportId.toLowerCase().includes(q) ||
        rep.uhid.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filterMode === 'pending') {
      return !rep.verified || !rep.pathologistSigned;
    }
    if (filterMode === 'critical') {
      return hasCriticalValues(rep);
    }
    if (filterMode === 'verified') {
      return rep.verified && rep.pathologistSigned;
    }
    return true;
  });

  const pendingCount = labReports.filter((r) => !r.verified || !r.pathologistSigned).length;
  const criticalCount = labReports.filter((r) => hasCriticalValues(r)).length;
  const verifiedCount = labReports.filter((r) => r.verified && r.pathologistSigned).length;

  const handleSignReport = (report: LabReport) => {
    const timestamp = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    updateLabReport(report.reportId, {
      verified: true,
      status: 'Verified',
      clinicalImpression: activeImpression || report.clinicalImpression || 'Normal findings. Clinically correlated.',
      pathologistSigned: true,
      pathologistSignatureTime: timestamp,
      pathologistSignedBy: `${doctorName}, ${doctorDegree}`,
      verificationHash: `NABL-MD-SIG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    });

    setActionSuccessMsg(`Report #${report.reportId} for ${report.patientName} digitally approved & signed!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const quickTemplates = [
    'Complete hemogram within acceptable biological reference intervals.',
    'Microcytic hypochromic anemia with moderate anisopoikilocytosis; recommend serum ferritin & iron studies.',
    'Impaired fasting glucose profile; clinical correlation and HbA1c advised for glycemic evaluation.',
    'Elevated liver transaminases (ALT/AST); suggestive of acute hepatocellular injury/steatosis.',
    'Elevated acute phase reactant (hs-CRP); suggestive of active inflammatory response.',
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
      <RoleContextBanner currentView="pathologist_dashboard" onNavigateView={onNavigateView} />

      {/* Pathologist Header Strip */}
      <div className="bg-[#1e1b4b] text-white py-6 px-4 sm:px-8 border-b border-indigo-900/50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-indigo-500 text-white px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor / Pathologist Portal</span>
              </span>
              <span className="text-xs bg-indigo-950 text-indigo-200 border border-indigo-800 px-2 py-0.5 rounded-md font-mono">
                Reg No: {medicalRegNo}
              </span>
              <span className="text-xs bg-emerald-400 text-slate-950 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>NABL Accredited Signatory ({nablAccreditation.split(' ')[0]})</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Clinical Verification & Digital Sign-off Console
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200">
              {doctorName}, {doctorDegree} • Apex Reference Pathology Hub
            </p>
          </div>

          {/* Back Button & Direct Link to Technician Workstation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateView('vendor_website')}
              className="bg-indigo-900/80 hover:bg-indigo-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs border border-indigo-700/60"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateView('technician_dashboard')}
              className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Switch to Analyzer Workstation</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Panic / Critical Alert Banner if critical reports exist */}
      {criticalCount > 0 && (
        <div className="bg-rose-500 text-white px-4 py-2.5 shadow-sm text-xs font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="bg-white text-rose-600 px-2 py-0.5 rounded-full font-black text-[10px] animate-pulse">
                PANIC ALERT
              </span>
              <span>
                <strong>{criticalCount} Report(s)</strong> contain critical physiological / panic values requiring immediate medical review.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFilterMode('critical')}
              className="underline font-bold hover:text-rose-100 cursor-pointer text-xs"
            >
              Filter Panic Reports →
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4 w-full">
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-950 font-black p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout: Master-Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
              filterMode === 'pending'
                ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-indigo-900 text-xs font-bold uppercase tracking-wider">
              <span>Pending Doctor Signature</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-900 mt-1">{pendingCount}</div>
            <p className="text-[11px] text-slate-500">Drafted by Technicians awaiting approval</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('critical')}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
              filterMode === 'critical'
                ? 'bg-rose-50 border-rose-300 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-rose-900 text-xs font-bold uppercase tracking-wider">
              <span>Critical / Panic Values</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700 mt-1">{criticalCount}</div>
            <p className="text-[11px] text-slate-500">Immediate critical flag cases</p>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('verified')}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
              filterMode === 'verified'
                ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-900 text-xs font-bold uppercase tracking-wider">
              <span>Verified & Dispatched</span>
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{verifiedCount}</div>
            <p className="text-[11px] text-slate-500">Digitally authorized & released to patient</p>
          </button>
        </div>

        {/* Master Detail Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Reports List (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patient, UHID or report ID..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
                <span>Showing {filteredReports.length} Reports</span>
                <span className="capitalize">{filterMode} Queue</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredReports.map((report) => {
                const isSelected = report.reportId === selectedReport?.reportId;
                const isCrit = hasCriticalValues(report);
                const isSigned = report.verified && report.pathologistSigned;

                return (
                  <div
                    key={report.reportId}
                    onClick={() => setSelectedReportId(report.reportId)}
                    className={`p-4 rounded-2xl border transition cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-900">{report.reportId}</span>
                      <div className="flex items-center gap-1">
                        {isCrit && (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 border border-rose-300 rounded font-black text-[9px]">
                            CRITICAL
                          </span>
                        )}
                        {isSigned ? (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-black text-[9px]">
                            SIGNED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded font-black text-[9px]">
                            PENDING
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm">{report.patientName}</div>
                      <div className="text-[11px] text-slate-500">
                        {report.ageGender} • UHID: {report.uhid}
                      </div>
                    </div>

                    <div className="text-slate-600 text-[11px]">
                      Tests: {report.items.map((i) => i.parameter).slice(0, 3).join(', ')}
                      {report.items.length > 3 ? '...' : ''}
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <span>Ref: {report.doctor}</span>
                      <span>{report.reportedAt}</span>
                    </div>
                  </div>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-800">No reports found in this view</p>
                  <p>All laboratory tests in this category have been processed.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Clinical Review Workspace (8 Cols) */}
          <div className="lg:col-span-8">
            {selectedReport ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                {/* Report Header Card */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                        {selectedReport.reportId}
                      </span>
                      <span className="text-xs text-slate-500">UHID: {selectedReport.uhid}</span>
                      {selectedReport.verified && selectedReport.pathologistSigned && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Signed by {selectedReport.pathologistSignedBy || doctorName}</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-slate-900">{selectedReport.patientName}</h2>
                    <p className="text-xs text-slate-500">
                      {selectedReport.ageGender} • Mobile: {selectedReport.mobile} • Doctor: {selectedReport.doctor}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {onOpenReportPreview && (
                      <button
                        type="button"
                        onClick={() => onOpenReportPreview(selectedReport.reportId, selectedReport.mobile)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Patient PDF</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSignReport(selectedReport)}
                      className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 ${
                        selectedReport.verified && selectedReport.pathologistSigned
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 animate-pulse'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {selectedReport.verified && selectedReport.pathologistSigned
                          ? 'Re-Authorize & Update Stamp'
                          : 'Authorize & Sign with Digital Stamp'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Parameters Review Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Laboratory Findings & Analyzed Parameters ({selectedReport.items.length})
                  </h3>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-800">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Test Parameter</th>
                          <th className="py-3 px-4">Result</th>
                          <th className="py-3 px-4">Unit</th>
                          <th className="py-3 px-4">Reference Range</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReport.items.map((item, idx) => {
                          const val = parseFloat(item.result);
                          const isHigh = item.isAbnormal;

                          return (
                            <tr
                              key={idx}
                              className={isHigh ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/60'}
                            >
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <div>{item.parameter}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{item.testName}</div>
                              </td>
                              <td className="py-3 px-4 font-mono font-black text-sm">
                                <span className={isHigh ? 'text-rose-700' : 'text-slate-900'}>
                                  {item.result}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500">{item.unit}</td>
                              <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                                {item.referenceRange}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isHigh ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>Abnormal</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Normal</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pathologist Clinical Impression & Diagnosis Editor */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Doctor&apos;s Clinical Impression & Remarks:</span>
                    </label>
                    <span className="text-[11px] text-slate-500">Will be printed on final patient PDF</span>
                  </div>

                  {/* 1-Click Quick Template Injector */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 py-1 mr-1">Quick Templates:</span>
                    {quickTemplates.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImpression(tpl)}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] text-slate-700 font-medium transition cursor-pointer"
                      >
                        {tpl.length > 35 ? tpl.substring(0, 35) + '...' : tpl}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={activeImpression}
                    onChange={(e) => setActiveImpression(e.target.value)}
                    placeholder="Enter clinical interpretation, differential diagnosis, or recommendations..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Digital Signature & NABL Seal Card */}
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200/80 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-700" />
                      <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Authorized Signatory Credentials
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">{doctorName}, {doctorDegree}</div>
                    <div className="text-xs text-slate-600">
                      PMC Reg: {medicalRegNo} • NABL Cert: {nablAccreditation}
                    </div>
                    {selectedReport.verificationHash && (
                      <div className="text-[11px] font-mono text-indigo-700 font-semibold">
                        Verification Hash: {selectedReport.verificationHash}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500">Sign-off Timestamp:</div>
                    <div className="text-xs font-bold text-slate-800">
                      {selectedReport.pathologistSignatureTime || 'Ready to Sign'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 text-center text-slate-500 shadow-xs space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-base text-slate-800">
                  Select a Report from the List
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Click on any patient report from the queue on the left to review analyzed laboratory parameters, evaluate critical values, and authorize with digital signature.
                </p>
                <div className="pt-2 inline-flex items-center gap-2 text-[11px] font-semibold text-indigo-700 bg-indigo-50/70 px-3 py-1.5 rounded-full border border-indigo-200/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>NABL ISO 15189 Digital Signatory Console</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DashboardFooter currentRoleTitle="MD Pathologist" onNavigateView={onNavigateView} />
    </div>
  );
};
