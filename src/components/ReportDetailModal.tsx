import React, { useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { LabReport } from '../types';
import { CanonicalPdfViewer } from './CanonicalPdfViewer';
import { useCms } from '../context/CmsContext';
import { CreateReportModal } from './CreateReportModal';
import { buildReportWhatsAppUrl } from '../utils/shareUtils';

interface ReportDetailModalProps {
  report: LabReport | null;
  isOpen: boolean;
  onClose: () => void;
  onEditReport?: (report: LabReport) => void;
  onDeleteReport?: (report: LabReport) => void;
  onOpenPatientPortal?: (reportId: string, mobile: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onEditReport,
  onDeleteReport,
  onOpenPatientPortal: _onOpenPatientPortal,
}) => {
  const { deleteLabReport } = useCms();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isInternalEditOpen, setIsInternalEditOpen] = useState(false);

  if (!isOpen || !report) return null;

  const handleEdit = () => {
    if (onEditReport) {
      onClose();
      onEditReport(report);
    } else {
      setIsInternalEditOpen(true);
    }
  };

  const handleDelete = () => {
    if (onDeleteReport) {
      onDeleteReport(report);
    } else {
      setShowConfirmDelete(true);
    }
  };

  const handleConfirmDirectDelete = () => {
    deleteLabReport(report.reportId);
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 w-full max-w-[1380px] xl:w-[95vw] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/70 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Minimalist Management Header */}
        <div className="bg-slate-900/95 backdrop-blur-xs border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 text-xs text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 ring-4 ring-emerald-400/20" />
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-sm text-slate-100 truncate">
                {report.patientName}
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">
                ({report.ageGender})
              </span>
              <span className="font-mono text-[11px] bg-slate-800 text-sky-300 px-2 py-0.5 rounded-md border border-slate-700 font-bold shrink-0">
                {report.reportId}
              </span>
              {report.tokenNumber && (
                <span className="font-mono text-[11px] bg-slate-800/80 text-amber-300 px-2 py-0.5 rounded-md border border-slate-700/80 font-bold hidden md:inline shrink-0">
                  Token: {report.tokenNumber}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Share via WhatsApp */}
            <button
              type="button"
              onClick={() => {
                const url = buildReportWhatsAppUrl({
                  reportId: report.reportId,
                  uhid: report.uhid,
                  patientName: report.patientName,
                  patientAge: report.patientAge,
                  patientGender: report.patientGender,
                  mobile: report.mobile || report.patientMobile || '',
                  email: report.email || report.patientEmail || '',
                  referringDoctor: report.referringDoctor || report.doctor,
                  reportedAt: report.reportedAt || report.reportDate,
                  testName: report.testName,
                  labId: report.labId,
                  labName: report.labName,
                  labPhone: report.labPhone,
                  tokenNumber: report.tokenNumber,
                });
                window.open(url, '_blank');
              }}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Share report via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-100" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleEdit}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Edit any mistake in this ready report (Patient details, doctor, parameters, observed values, flags, impressions)"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-950" />
              <span>Edit Report</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="bg-rose-950/40 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Delete this report"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CANONICAL REPORT PDF PREVIEW (PURE REPORT DISPLAY - NO BUTTONS INSIDE THE BOX) */}
        <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-slate-950 flex flex-col">
          <CanonicalPdfViewer
            report={report}
            onClose={onClose}
            className="flex-1 border-0 rounded-xl"
            title={`NABL CANONICAL REPORT • ${report.reportId}`}
          />
        </div>

        {/* MINIMALIST FOOTER (STRICTLY BELOW THE REPORT) */}
        <div className="bg-slate-900/95 border-t border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 text-slate-300">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-200">
              {report.patientName} <span className="font-normal text-slate-400">({report.ageGender})</span>
            </span>
            {report.doctor && (
              <span className="text-slate-400 hidden md:inline">
                • Ref: <strong className="text-slate-300">{report.doctor}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700 active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* DIRECT IN-MODAL EDIT IF onEditReport NOT PROVIDED BY PARENT */}
      {isInternalEditOpen && (
        <CreateReportModal
          isOpen={isInternalEditOpen}
          onClose={() => setIsInternalEditOpen(false)}
          existingReport={report}
          allowNewPatientEntry={true}
          onReportCreated={() => {
            setIsInternalEditOpen(false);
          }}
        />
      )}

      {/* CONFIRM DELETE MODAL IF DIRECTLY DELETING */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Are you sure you want to delete this?</h3>
                <p className="text-xs text-slate-500 font-medium">Diagnostic Report {report.reportId} will be permanently deleted.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Report for patient <strong>{report.patientName}</strong> will be permanently removed. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmDirectDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
