import React, { useState } from 'react';
import { MessageSquare, Download, Share2, CheckCheck, Clock, FileText, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { SAMPLE_REPORT } from '../data/mockData';
import { generateReportPdf } from '../utils/pdfGenerator';

interface WhatsAppReportSectionProps {
  onLaunchApp?: () => void;
}

export const WhatsAppReportSection: React.FC<WhatsAppReportSectionProps> = ({ onLaunchApp }) => {
  const [copied, setCopied] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const handleDownloadPdf = () => {
    try {
      generateReportPdf(SAMPLE_REPORT);
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(
      "Dear Ramesh Verma, your Lab Test Report (ID: RPT-2026-8812) from Apex Diagnostics is ready. Click to download without login: https://report.indianlalaji.com/rpt/RPT-2026-8812"
    );
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };

  const benefits = [
    { title: 'Faster delivery', desc: 'Patients receive reports within seconds of pathologist verification.' },
    { title: 'Less printing', desc: 'Cut thermal and A4 paper costs by over 70% per month.' },
    { title: 'Better patient experience', desc: 'Zero queueing or repeat visits just to pick up a slip.' },
    { title: 'Easy sharing', desc: 'Patients can forward PDF reports directly to consulting doctors.' },
  ];

  return (
    <section className="py-16 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold mb-3 border border-emerald-200">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
            <span>Direct Patient Engagement</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Report Ready? Send It on WhatsApp.
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Automate laboratory report distribution over India's preferred messaging platform with zero manual copy-pasting.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Left: Realistic WhatsApp Chat Simulator */}
          <div className="lg:col-span-6 bg-[#efeae2] p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-md">
            <div className="bg-[#075e54] text-white p-3 rounded-t-xl flex items-center justify-between -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white text-[#075e54] flex items-center justify-center font-bold text-xs">
                  APEX
                </div>
                <div>
                  <div className="font-bold text-xs">Apex Diagnostics (Verified Lab)</div>
                  <div className="text-[10px] text-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />
                    Online • Official WhatsApp Business
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded text-emerald-100">
                Automated Bot
              </span>
            </div>

            {/* Chat Bubble */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Namaste Ramesh Verma Ji,</span>
                <span className="text-[10px]">11:32 AM</span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Your medical test results for <strong>Complete Blood Count (CBC)</strong> and <strong>HbA1c Diabetes Profile</strong> have been clinically verified by Dr. Rohit Sharma (MD Pathologist).
              </p>

              {/* PDF Document Attachment Card in WhatsApp */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      RPT-2026-8812_ApexLab.pdf
                    </div>
                    <div className="text-[10px] text-slate-500">
                      428 KB • 2 Pages • Digitally Signed
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg active:scale-95 cursor-pointer"
                  title="Download PDF file directly"
                >
                  {downloadDone ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Download className="w-4 h-4 text-[#0F766E]" />
                  )}
                </button>
              </div>

              {/* Action Buttons inside message preview as required by spec */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  {downloadDone ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSendWhatsApp}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send on WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                <span>Delivered</span>
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Right: 4 Benefits */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-lg font-bold text-[#172033]">
              Why Indian Laboratories Love WhatsApp Reports:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((b, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                    <h4 className="text-xs font-bold text-[#172033]">{b.title}</h4>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200/80 text-xs text-teal-950">
              <strong className="font-semibold block mb-1">Zero Per-SMS Charges:</strong>
              Use your official WhatsApp Business API or laboratory SIM directly. No recurring 25 paise / 30 paise SMS telecom fees.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
