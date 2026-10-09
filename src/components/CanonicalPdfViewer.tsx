import React, { useState, useEffect } from 'react';
import { AlertCircle, Lock, CreditCard } from 'lucide-react';
import { LabReport } from '../types';
import { getCanonicalReportPdfBlob } from '../utils/pdfGenerator';
import { renderPdfPages, RenderedPdfPage } from '../utils/canonicalPdfRenderer';

interface CanonicalPdfViewerProps {
  report: LabReport;
  isPaymentPending?: boolean;
  activeDueAmount?: number;
  onPayOnline?: () => void;
  onClose?: () => void;
  className?: string;
  autoRenderNativeEmbed?: boolean;
  title?: string;
}

export const CanonicalPdfViewer: React.FC<CanonicalPdfViewerProps> = ({
  report,
  isPaymentPending,
  activeDueAmount,
  onPayOnline,
  className = '',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<RenderedPdfPage[]>([]);

  const statusLower = (report.paymentStatus || '').toLowerCase();
  const isDuePaymentPending =
    isPaymentPending !== undefined
      ? isPaymentPending
      : Boolean(
          (report.dueAmount !== undefined && report.dueAmount > 0) ||
          statusLower === 'pending' ||
          statusLower === 'partial' ||
          statusLower === 'due' ||
          (report.paymentStatus !== undefined &&
            statusLower !== 'full payment' &&
            statusLower !== 'paid' &&
            statusLower !== 'completed' &&
            (report.dueAmount ?? 0) > 0)
        );

  const effectiveDueAmount =
    activeDueAmount !== undefined
      ? activeDueAmount
      : report.dueAmount !== undefined
      ? report.dueAmount
      : 0;

  // Generate canonical PDF bytes and render pages
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadPdf() {
      try {
        const canonical = await getCanonicalReportPdfBlob(report);
        if (!isMounted) return;

        // Render PDF pages using pdfjs-dist at high retina resolution
        // If payment is pending: blur the Report Body region
        const pages = await renderPdfPages(canonical.arrayBuffer, {
          scale: 2.0,
          blurBody: isDuePaymentPending,
        });
        if (!isMounted) return;

        setRenderedPages(pages);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to render canonical PDF:', err);
        if (isMounted) {
          setError('Could not render PDF preview directly.');
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [report.reportId, report.reportedAt, isDuePaymentPending, report.paymentStatus, report.dueAmount, activeDueAmount]);

  return (
    <div
      className={`bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col w-full ${className}`}
    >
      {/* PURE CANONICAL REPORT PRESENTATION */}
      <div className="flex-1 overflow-auto bg-slate-950 p-2 sm:p-6 flex flex-col items-center justify-start min-h-[500px]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-3">
            <div className="w-10 h-10 rounded-full border-3 border-slate-700 border-t-emerald-400 animate-spin" />
            <div className="text-xs text-slate-300 font-medium">Loading Diagnostic Report...</div>
          </div>
        )}

        {error && (
          <div className="max-w-md my-auto bg-rose-950/50 border border-rose-800 rounded-xl p-4 text-center text-xs text-rose-200 space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
            <div className="font-bold text-rose-100">Unable to load report</div>
            <p className="text-rose-300">{error}</p>
          </div>
        )}

        {/* PURE CANONICAL REPORT SHEET(S) */}
        {!loading && !error && renderedPages.length > 0 && (
          <div className="w-full flex flex-col items-center gap-6 py-1">
            {renderedPages.map((page) => (
              <div
                key={page.pageNumber}
                className="bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700/60 w-full max-w-[850px] transition-all select-none relative"
              >
                <img
                  src={page.dataUrl}
                  alt={`Diagnostic Report ${report.reportId} Page ${page.pageNumber}`}
                  className="w-full h-auto block"
                />

                {/* Report View Condition: If full payment is pending, Report Body is completely blurred with unlock prompt */}
                {isDuePaymentPending && (
                  <div
                    className="absolute left-0 right-0 top-[27%] bottom-[4.5%] backdrop-blur-md bg-white/65 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10 transition-all select-none"
                    style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
                  >
                    <div className="max-w-md mx-auto bg-slate-900/95 text-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-amber-400/40 backdrop-blur-xl flex flex-col items-center space-y-3.5 animate-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-inner">
                        <Lock className="w-6 h-6" />
                      </div>

                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 text-[11px] font-bold border border-amber-400/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Report Body Blurred & Locked</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-white">
                          Due Amount: <span className="text-amber-400 font-mono">₹{effectiveDueAmount}</span>
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                          Patient का full payment complete होने तक Report Body पूरी तरह blurred रहेगी। Due payment complete होने के बाद Report View और Download दोनों enable हो जाएंगे।
                        </p>
                      </div>

                      {onPayOnline && effectiveDueAmount > 0 && (
                        <button
                          type="button"
                          onClick={onPayOnline}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <CreditCard className="w-4 h-4 text-slate-950" />
                          <span>Pay ₹{effectiveDueAmount} & Unlock Report</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
