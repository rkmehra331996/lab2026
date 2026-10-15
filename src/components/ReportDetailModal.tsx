import React, { useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
} from 'lucide-react';
import { LabReport } from '../types';
import { CanonicalPdfViewer } from './CanonicalPdfViewer';
import { useCms } from '../context/CmsContext';
import { CreateReportModal } from './CreateReportModal';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Management Header */}
        <div className="bg-[#0B2545] border-b border-slate-700 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-extrabold text-xs sm:text-sm">
              Diagnostic Report • ID: {report.reportId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Edit any mistake in this ready report (Patient details, doctor, parameters, observed values, flags, impressions)"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-950" />
              <span>Edit Report</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Delete this report"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer ml-1"
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

        {/* FOOTER (STRICTLY BELOW THE REPORT) */}
        <div className="bg-white border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-800">
              {report.patientName} <span className="font-normal text-slate-500">({report.ageGender})</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleEdit}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Edit any mistake in this report (Patient details, doctor, parameters, observed values, flags, impressions)"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-950" />
              <span>Edit Any Mistake in Report</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-300 active:scale-95"
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
