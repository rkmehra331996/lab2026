import React from 'react';
import { X, ShieldCheck, Lock, AlertCircle, FileText } from 'lucide-react';

interface TermsConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsConditionsModal: React.FC<TermsConditionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Close (×) button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#123B6D] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h2 id="terms-modal-title" className="text-base font-black text-slate-900 tracking-tight">
              Terms &amp; Conditions
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-lg font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-5 text-sm max-h-[80vh] overflow-y-auto">
          {/* Data & Privacy */}
          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Data &amp; Privacy:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              We do not intentionally store, misuse, or sell your personal data.
            </p>
          </div>

          {/* User Responsibility */}
          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>User Responsibility:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              Users are responsible for the information they submit and for keeping their account details secure.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Disclaimer:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              IndianLalaJi/LIMS is not responsible for any data loss, technical issues, service interruptions, or third-party service failures, to the extent permitted by applicable law.
            </p>
          </div>

          {/* Agreement Notice */}
          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500">
              By using this website/service, you agree to these Terms &amp; Conditions.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
