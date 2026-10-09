import React from 'react';
import { User, Stethoscope, FileSpreadsheet, TestTube, Cpu, CheckSquare, ShieldCheck, FileCheck, Share2, ArrowRight, ArrowDown } from 'lucide-react';

export const LabWorkflow: React.FC = () => {
  const steps = [
    { title: 'Patient', sub: 'Registration & UHID', icon: User },
    { title: 'Doctor', sub: 'Referral Mapping', icon: Stethoscope },
    { title: 'Test', sub: 'Profile Selection', icon: FileSpreadsheet },
    { title: 'Sample', sub: 'Barcode Labeling', icon: TestTube },
    { title: 'Processing', sub: 'Analyzer Run', icon: Cpu },
    { title: 'Result', sub: 'Value Entry', icon: CheckSquare },
    { title: 'Verification', sub: 'Pathologist Sign', icon: ShieldCheck },
    { title: 'Final Report', sub: 'PDF Generated', icon: FileCheck },
    { title: 'Download / WhatsApp', sub: 'Instant Delivery', icon: Share2 },
  ];

  return (
    <section id="workflow-section" className="py-16 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-semibold mb-3">
            <span>Seamless Diagnostic Chain</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Complete Connected Laboratory Workflow
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Every specimen and test moves through an auditable, automated sequence from intake to patient delivery.
          </p>
        </div>

        {/* Desktop / Tablet Horizontal Workflow */}
        <div className="hidden lg:block overflow-x-auto pb-4">
          <div className="min-w-[1020px] flex items-center justify-between relative">
            {/* Connecting line behind items */}
            <div className="absolute top-7 left-8 right-8 h-0.5 bg-slate-300 z-0" />

            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isLast = idx === steps.length - 1;
              const isKey = idx === 6 || idx === 8; // Verification or WhatsApp
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center group w-28">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition duration-200 shadow-xs ${
                      isKey
                        ? 'bg-[#123B6D] text-white border-[#0e2c52] shadow-md'
                        : 'bg-white text-[#123B6D] border-slate-300 group-hover:border-[#123B6D]'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-[#172033] mt-2.5 leading-tight">
                    {step.title}
                  </span>
                  <span className="text-[10px] text-[#64748B] mt-0.5 leading-tight">
                    {step.sub}
                  </span>

                  {!isLast && (
                    <div className="absolute -right-3 top-5 text-slate-400">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile & Small Screen Vertical Workflow */}
        <div className="lg:hidden space-y-3 max-w-md mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === steps.length - 1;
            const isKey = idx === 6 || idx === 8;
            return (
              <React.Fragment key={idx}>
                <div className="flex items-center gap-3.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                      isKey ? 'bg-[#123B6D] text-white' : 'bg-slate-100 text-[#123B6D]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        Step {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-[#172033]">{step.title}</h4>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{step.sub}</p>
                  </div>
                </div>
                {!isLast && (
                  <div className="flex justify-center text-slate-400 py-0.5">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};
