import React from 'react';
import { FileText, User, ShieldCheck, Download, CreditCard, Clock, Activity } from 'lucide-react';

export const AuditLogSection: React.FC = () => {
  const logs = [
    {
      time: '10:42 AM',
      action: 'Patient Created',
      actor: 'Anita Sharma (Receptionist)',
      details: 'UHID LAB-2026-9041 (Ramesh Verma) • CBC, HbA1c scheduled',
      ip: '192.168.1.104 (Terminal 01)',
      icon: User,
      color: 'bg-blue-50 text-[#123B6D]',
    },
    {
      time: '11:18 AM',
      action: 'Result Entered',
      actor: 'Suresh Kumar (Lab Technician)',
      details: 'Observed parameters entered: Hb 14.6 g/dL, HbA1c 6.8%',
      ip: '192.168.1.108 (Analyzer Desk)',
      icon: Activity,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      time: '12:03 PM',
      action: 'Report Verified',
      actor: 'Dr. Rohit Sharma, MD (Chief Pathologist)',
      details: 'Clinically reviewed & signed with SHA-256 digital stamp',
      ip: '192.168.1.101 (Consultant Cabin)',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      time: '12:15 PM',
      action: 'Invoice Generated',
      actor: 'Rajesh Verma (Accountant)',
      details: 'Bill #INV-2026-0814 issued for ₹1,450 • UPI payment confirmed',
      ip: '192.168.1.105 (Billing Desk)',
      icon: CreditCard,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      time: '12:42 PM',
      action: 'Report Downloaded',
      actor: 'Patient (Zero-Login Portal)',
      details: 'Accessed via report.indianlalaji.com link from verified mobile 9876543210',
      ip: '103.212.14.88 (Mobile Chrome)',
      icon: Download,
      color: 'bg-teal-50 text-teal-700',
    },
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-semibold mb-3">
            <span>Immutable Trail</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Complete Real-Time Activity Audit Log
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Every clinical decision, value edit, and financial receipt leaves an immutable, timestamped breadcrumb with staff identification.
          </p>
        </div>

        {/* Audit Log Card */}
        <div className="max-w-3xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 text-xs">
            <span className="font-bold text-[#172033] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#123B6D]" />
              System Event Chronology • Today (03-Sep-2026)
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
              All events cryptographically signed
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {logs.map((log, idx) => {
              const Icon = log.icon;
              return (
                <div key={idx} className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  {/* Dot */}
                  <div className="absolute -left-6 top-4 w-3 h-3 rounded-full bg-[#123B6D] border-2 border-white" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#123B6D] bg-blue-50 px-2 py-0.5 rounded">
                        {log.time}
                      </span>
                      <h3 className="text-xs font-bold text-[#172033]">{log.action}</h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{log.actor}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-snug">{log.details}</p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>IP: {log.ip}</span>
                    <span>Audit Status: Logged & Sealed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
