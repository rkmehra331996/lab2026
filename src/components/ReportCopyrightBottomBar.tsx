import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ReportCopyrightBottomBarProps {
  softwareDomain?: string;
  reportId?: string;
  verificationHash?: string;
}

export const ReportCopyrightBottomBar: React.FC<ReportCopyrightBottomBarProps> = () => {
  return (
    <div
      className="mt-6 pt-3 pb-2.5 border-t border-slate-200 text-[10px] text-slate-500 bg-slate-50/90 px-4 py-2.5 rounded-xl flex items-center justify-center text-center print:bg-white print:border-t print:mt-4 print:pt-2"
      id="report-copyright-bottom-bar"
    >
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
          <ShieldCheck className="w-3 h-3 text-emerald-600 print:hidden" />
          <span>NABL & ISO 15189 Standard Diagnostic Laboratory Report</span>
        </span>
        <span className="text-slate-300 hidden sm:inline">•</span>
        <span>Electronically verified & release authorized by Pathologist</span>
      </div>
    </div>
  );
};
