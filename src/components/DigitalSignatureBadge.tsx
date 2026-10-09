import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, Award } from 'lucide-react';

interface DigitalSignatureBadgeProps {
  pathologistName?: string;
  pathologistDegrees?: string;
  pathologistRegNo?: string;
  signedAt?: string;
  verificationHash?: string;
  signatureUrl?: string;
  isCompact?: boolean;
  labName?: string;
}

export const DigitalSignatureBadge: React.FC<DigitalSignatureBadgeProps> = ({
  pathologistName = 'Dr. Rohit Sharma',
  pathologistDegrees = 'MBBS, MD (Clinical Pathology), FICPath',
  pathologistRegNo = 'MCI / PMC-48192',
  signedAt = '03-Sep-2026, 11:30 AM',
  verificationHash = 'SHA256: 9b2d8e41a94f6c8d37e1b52c009a24ec',
  signatureUrl,
  isCompact = false,
  labName = 'Apex Diagnostic Laboratory',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 ${isCompact ? 'text-xs' : 'text-sm'}`}>
      {/* Official Lab Circular Authority Stamp */}
      <div className="relative group select-none">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-[#123B6D]/70 p-1 flex items-center justify-center relative bg-blue-50/20 rotate-[-4deg] shadow-2xs">
          <div className="w-full h-full rounded-full border border-[#123B6D] p-1 flex flex-col items-center justify-center text-center text-[#123B6D]">
            <span className="text-[7px] font-black uppercase tracking-tighter leading-tight text-[#123B6D]">
              ★ NABL ACCREDITED ★
            </span>
            <div className="my-0.5 border-t border-b border-[#123B6D]/40 py-0.5 w-4/5 text-center">
              <span className="text-[8px] font-extrabold uppercase tracking-tight block text-[#123B6D]">
                AUTHORIZED
              </span>
              <span className="text-[7px] font-black tracking-widest text-emerald-700 block">
                SIGNATORY
              </span>
            </div>
            <span className="text-[6.5px] font-mono text-slate-600 font-bold block">
              ISO 15189:2022
            </span>
            <span className="text-[6px] text-slate-500 font-semibold block">
              MC-2849
            </span>
          </div>
        </div>
      </div>

      {/* Signature Graphic & Doctor Details */}
      <div className="flex flex-col items-start sm:items-end text-left sm:text-right space-y-1">
        {/* Stylized Digital Signature Vector or Custom Upload */}
        <div className="relative h-12 flex items-center justify-start sm:justify-end">
          {signatureUrl ? (
            <img
              src={signatureUrl}
              alt="Pathologist Digital Signature"
              referrerPolicy="no-referrer"
              className="h-12 object-contain filter contrast-125"
            />
          ) : (
            /* High-fidelity SVG Cursive Signature Graphic */
            <svg
              className="w-44 h-12 text-[#123B6D] overflow-visible"
              viewBox="0 0 200 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Doctor Cursive Stroke */}
              <path
                d="M10,42 C20,10 32,15 38,32 C42,45 48,46 55,24 C62,2 66,35 78,28 C88,22 92,38 105,30 C118,22 120,40 135,28 C145,20 152,36 168,22 C178,14 185,28 195,18"
                stroke="#123B6D"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M30,35 Q60,52 110,48 T180,38"
                stroke="#123B6D"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="188" cy="18" r="1.5" fill="#123B6D" />
            </svg>
          )}
        </div>

        {/* Doctor Name & Registration */}
        <div className="border-t border-slate-300 pt-1.5 w-full min-w-[200px]">
          <div className="font-black text-slate-900 text-sm tracking-tight flex items-center justify-start sm:justify-end gap-1.5">
            <span>{pathologistName}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </div>
          <div className="text-slate-600 text-[11px] font-medium leading-tight">
            {pathologistDegrees}
          </div>
          <div className="text-slate-500 text-[10px] font-mono mt-0.5">
            Reg No: <span className="font-bold text-slate-700">{pathologistRegNo}</span>
          </div>
        </div>

        {/* Cryptographic DSC Authenticity Stamp */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md px-2 py-1 text-[10px] shadow-2xs mt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <div className="text-left font-sans">
            <span className="font-bold block text-emerald-950">Digitally Verified & Authorized</span>
            <span className="text-[9px] text-emerald-700 block font-mono">
              Signed: {signedAt}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
