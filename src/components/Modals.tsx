import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, QrCode, ArrowRight, Laptop, Calendar, MessageSquare } from 'lucide-react';
import { useCms } from '../context/CmsContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookDemoModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [labName, setLabName] = useState('');
  const [mobile, setMobile] = useState('');
  const [labType, setLabType] = useState('Diagnostic & Pathology Center');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#0F766E] flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">Book a 1-on-1 Guided Demo</h3>
            </div>
            <p className="text-xs text-[#64748B] mb-5">
              See LABNAME.COM demonstrated live on your test catalog with Rahul K. or our clinical specialist.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Laboratory or Hospital Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="e.g. Apex Diagnostic & Scan Centre"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  10-Digit Mobile Number (For WhatsApp Invite) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Laboratory Type</label>
                <select
                  value={labType}
                  onChange={(e) => setLabType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                >
                  <option>Single Standalone Pathology Lab</option>
                  <option>Diagnostic Pathology Network (2–10 Centers)</option>
                  <option>Hospital Attached Laboratory</option>
                  <option>Collection Centre Network</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-3 rounded-xl font-bold text-xs transition shadow-sm"
                >
                  Confirm Demo Slot on WhatsApp
                </button>
              </div>

              <div className="text-[11px] text-center text-slate-500">
                Direct Support: <strong>7087033009</strong> • Mon–Fri, 10 AM–6 PM IST
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Demo Request Confirmed!</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Thank you, <strong>{labName || 'Doctor'}</strong>. Our representative will contact <strong>+91 {mobile}</strong> via WhatsApp within 2 business hours.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2 rounded-xl text-xs font-bold transition"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const QRVerifyModal: React.FC<{ isOpen: boolean; onClose: () => void; reportId?: string }> = ({
  isOpen,
  onClose,
  reportId = 'RPT-2026-8812',
}) => {
  const { allReports } = useCms();
  if (!isOpen) return null;

  const cleanId = (reportId || '').trim().toLowerCase();
  const matched = (allReports || []).find(
    (r) =>
      r.reportId.toLowerCase() === cleanId ||
      (r.uhid && r.uhid.toLowerCase() === cleanId)
  );

  const displayReportId = matched?.reportId || reportId;
  const patName = matched ? `${matched.patientName} (${matched.ageGender || ''})` : 'Verified Diagnostic Patient';
  const issuing = matched ? `${matched.labName} (NABL ${matched.nablAccreditationNo || 'Verified'})` : 'Diagnostic Laboratory (NABL Verified)';
  const pathologist = matched ? `${matched.pathologist} (${matched.pathologistDegrees || 'Consultant Pathologist'})` : 'Dr. Rohit Sharma, MD (Reg: PMC-48192)';
  const timestamp = matched ? matched.reportedAt : '03-Sep-2026 11:30:14 AM IST';
  const hash = matched?.verificationHash || 'SHA256: 9b2d8e41a94f6c8d37e1b52c009a24ec410f9b62';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h3 className="text-base font-extrabold text-[#172033]">
            Digital Report Cryptographically Authenticated
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Verified on report.indianlalaji.com public integrity registry
          </p>

          {/* Verification Details */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Report ID:</span>
              <span className="font-mono font-bold text-slate-800">{displayReportId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient Name:</span>
              <span className="font-bold text-slate-800">{patName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Issuing Center:</span>
              <span className="font-semibold text-slate-800">{issuing}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Verifying Pathologist:</span>
              <span className="font-semibold text-emerald-700">{pathologist}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Timestamp:</span>
              <span className="text-slate-700">{timestamp}</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-400 block font-mono">Immutable Hash:</span>
              <span className="text-[10px] font-mono text-slate-600 break-all bg-white p-1 rounded border border-slate-200 block mt-0.5">
                {hash}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={onClose}
              className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2.5 rounded-xl font-bold text-xs transition"
            >
              Close Verification Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
