import React from 'react';
import {
  Lock,
  KeyRound,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  Database,
  Link,
  Clock,
  ShieldAlert,
  Eye,
} from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const securityControls = [
    { title: 'HTTPS', desc: 'TLS 1.3 in-transit encryption with HSTS enforced across all endpoints', icon: Lock },
    { title: 'Secure Authentication', desc: 'Salted cryptographic password hashing with optional two-factor verification', icon: KeyRound },
    { title: 'Role-Based Access', desc: 'Strict privilege boundaries preventing cross-role functional leakage', icon: Users },
    { title: 'Tenant Isolation', desc: 'Logical database separation guaranteeing no lab cross-contamination', icon: ShieldCheck },
    { title: 'Audit Logs', desc: 'Append-only ledger of every clinical edit, view, print, and export event', icon: FileSpreadsheet },
    { title: 'Encrypted Backups', desc: 'AES-256 encrypted archival stored across independent cloud zones', icon: Database },
    { title: 'Secure Report Links', desc: 'Time-expiring cryptographic tokens preventing unauthorized indexing', icon: Link },
    { title: 'Session Security', desc: 'Automated timeout on idle workstations to protect unattended terminals', icon: Clock },
    { title: 'Login Protection', desc: 'Intelligent rate-limiting and lockout protection against brute-force attempts', icon: ShieldAlert },
    { title: 'Report Access Logs', desc: 'Timestamped IP and user-agent logging whenever a report is viewed', icon: Eye },
  ];

  return (
    <section id="security-section" className="py-16 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-semibold mb-3">
            <span>Clinical-Grade Compliance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Security Architecture & Data Controls
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Built on documented, verifiable technical controls to protect medical records and laboratory operations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {securityControls.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#0F766E]/40 hover:shadow-xs transition"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center mb-2.5">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[#172033]">{sec.title}</h3>
                <p className="text-[11px] text-[#64748B] mt-1 leading-snug">{sec.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
