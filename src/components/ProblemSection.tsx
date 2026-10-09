import React from 'react';
import { BookOpen, Clock, AlertTriangle, Calculator, Stethoscope, PhoneCall, XCircle } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const problems = [
    {
      title: 'Manual Registers',
      icon: BookOpen,
      explanation: 'Paper entry books get torn, lost, and slow down morning rush hours.',
    },
    {
      title: 'Delayed Reports',
      icon: Clock,
      explanation: 'Typing report values in Word/Excel leads to bottlenecks and typos.',
    },
    {
      title: 'Data Loss Risk',
      icon: AlertTriangle,
      explanation: 'Hard drive failures or accidental computer crashes erase patient records.',
    },
    {
      title: 'Billing Confusion',
      icon: Calculator,
      explanation: 'Unclear partial payments, due amounts, and missing cash tallies.',
    },
    {
      title: 'Doctor Referral Disputes',
      icon: Stethoscope,
      explanation: 'Manual incentive calculation and untracked doctor referral payouts lead to revenue leakage.',
    },
    {
      title: 'Patients Calling for Reports',
      icon: PhoneCall,
      explanation: 'Reception phone rings constantly with repetitive status inquiries.',
    },
  ];

  return (
    <section className="py-16 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold mb-3">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>The Daily Reality of Manual Operations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Running a Laboratory Shouldn't Mean Managing Everything Manually.
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Most diagnostic centers in India struggle with paper logs, delayed delivery, and repetitive front-desk friction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-rose-200 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#172033]">{prob.title}</h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">{prob.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
