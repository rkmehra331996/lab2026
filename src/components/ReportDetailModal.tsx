import React from 'react';
import {
  X,
  Edit3,
  Trash2,
  Lock,
} from 'lucide-react';
import { LabReport } from '../types';
import { CanonicalPdfViewer } from './CanonicalPdfViewer';

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
  if (!isOpen || !report) return null;

  const handleEdit = () => {
    onClose();
    if (onEditReport) {
      onEditReport(report);
    }
  };

  const handleDelete = () => {
    if (onDeleteReport) {
      onDeleteReport(report);
    }
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
            {onEditReport && (
              report.sentToReceptionDesk ? (
                <div
                  className="bg-slate-850 text-slate-400 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed select-none"
                  title="Reports can be edited only before clicking the Send to Reception Desk button. Once sent, editing is disabled."
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editing Locked</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Edit Report parameters or patient info"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Report</span>
                </button>
              )
            )}

            {onDeleteReport && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Delete this report"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

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
    </div>
  );
};
