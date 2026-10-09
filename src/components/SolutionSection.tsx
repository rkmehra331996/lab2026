import React from 'react';
import { UserCheck, FlaskConical, TestTube2, FileCheck, IndianRupee, MessageSquare, CheckCircle2 } from 'lucide-react';

interface SolutionSectionProps {
  onLaunchApp?: () => void;
}

export const SolutionSection: React.FC<SolutionSectionProps> = ({ onLaunchApp }) => {
  const solutions = [
    {
      title: 'Patient Management',
      desc: 'Complete patient registration and history.',
      details: 'Instant 10-digit mobile lookup, UHID generation, age/gender profiling, and referring doctor mapping.',
      icon: UserCheck,
      color: 'text-[#123B6D] bg-blue-50',
    },
    {
      title: 'Test Management',
      desc: 'Manage tests, prices, units and reference ranges.',
      details: 'Over 500+ pre-configured tests with age & gender-stratified biological reference ranges.',
      icon: FlaskConical,
      color: 'text-[#0F766E] bg-teal-50',
    },
    {
      title: 'Sample Management',
      desc: 'Track samples from collection to processing.',
      details: 'Barcode labeling, tube color coding (EDTA, Serum, Fluoride), collection timestamps, and analyzer status.',
      icon: TestTube2,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Digital Reports',
      desc: 'Generate professional verified PDF reports.',
      details: 'NABL-standard layouts, digital pathologist signatures, automatic abnormal flags, and tamper-evident QR verification.',
      icon: FileCheck,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Billing',
      desc: 'Manage invoices, payments and outstanding dues.',
      details: 'Split payments, partial advances, pending balance alerts, UPI QR generation, and GST tax invoice receipts.',
      icon: IndianRupee,
      color: 'text-[#123B6D] bg-blue-50',
    },
    {
      title: 'WhatsApp Reports',
      desc: 'Send completed reports directly to patients.',
      details: 'Zero-click dispatch as soon as the pathologist verifies. Eliminates front-desk telephone clutter.',
      icon: MessageSquare,
      color: 'text-teal-600 bg-teal-50',
    },
  ];

  return (
    <section id="solution-section" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>The Unified Lab Operating System</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Everything Your Laboratory Needs — In One Platform
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Engineered specifically for pathology and diagnostic centers across India to replace fragmented tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((sol, idx) => {
            const Icon = sol.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-[#123B6D]/30 hover:shadow-md transition duration-200 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${sol.color} group-hover:scale-105 transition`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#172033] group-hover:text-[#123B6D] transition">
                  {sol.title}
                </h3>
                <p className="text-xs font-semibold text-[#0F766E] mt-1">
                  {sol.desc}
                </p>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  {sol.details}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
