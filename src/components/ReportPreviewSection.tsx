import React from 'react';
import { ShieldCheck, QrCode } from 'lucide-react';
import { SAMPLE_REPORT } from '../data/mockData';
import { CanonicalPdfViewer } from './CanonicalPdfViewer';

interface ReportPreviewSectionProps {
  onOpenVerifyModal?: () => void;
  onViewFullReport?: () => void;
}

export const ReportPreviewSection: React.FC<ReportPreviewSectionProps> = ({
  onOpenVerifyModal,
}) => {
  const report = SAMPLE_REPORT;

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>NABL / ISO 15189 Standard Master</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Canonical Digital Medical Report Preview
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            The preview below is the exact same PDF document that users download and print. Identical fonts, tables, reference intervals, watermarked QR, NABL accreditation emblems, and DSC cryptographic signatures.
          </p>
        </div>

        {/* The Canonical PDF Document Viewer */}
        <div className="max-w-4xl mx-auto">
          <CanonicalPdfViewer
            report={report}
            title="CANONICAL NABL REPORT PREVIEW"
            className="w-full shadow-2xl"
          />

          {onOpenVerifyModal && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onOpenVerifyModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <QrCode className="w-4 h-4 text-[#0F766E]" />
                <span>Verify Live Security QR Code</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
