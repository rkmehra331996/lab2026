import React from 'react';
import { Database, GitCompare, RotateCcw, Server, Shield, Layers } from 'lucide-react';

export const DataSafetySection: React.FC = () => {
  const pillars = [
    {
      title: 'Automated Backup',
      desc: 'Scheduled hourly snapshots and encrypted nightly archive replication across geographically separated datacenters.',
      icon: Database,
    },
    {
      title: 'Database Migration',
      desc: 'Zero-downtime schema evolution engine tested on live replicas prior to version deployment.',
      icon: GitCompare,
    },
    {
      title: 'Rollback Protection',
      desc: 'Instant rollback capability if an application update encounters unexpected runtime anomalies.',
      icon: RotateCcw,
    },
    {
      title: 'Staging Environment',
      desc: 'Rigorous isolated testing pipeline where new diagnostic features are validated before lab release.',
      icon: Server,
    },
    {
      title: 'Tenant Isolation',
      desc: 'Strict logical partition ensuring each laboratory group’s records are completely segmented.',
      icon: Shield,
    },
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-semibold mb-3">
            <span>Enterprise Architecture Resilience</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Your Laboratory Data Should Survive Every Update.
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Software evolves rapidly, but medical records and patient billing history must remain permanent and untainted.
          </p>
        </div>

        {/* The Mandatory Visual Statement as specified */}
        <div className="max-w-2xl mx-auto mb-10 text-center">
          <div className="inline-block bg-slate-900 text-amber-300 font-mono text-sm sm:text-base font-bold py-3 px-6 rounded-xl border border-slate-700 shadow-md">
            APPLICATION CODE ≠ CUSTOMER DATA
          </div>
          <p className="text-xs text-[#64748B] mt-2">
            Application binaries are strictly decoupled from persistent laboratory databases and patient ledgers.
          </p>
        </div>

        {/* 5 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-xs transition"
              >
                <div className="w-10 h-10 rounded-lg bg-[#123B6D]/10 text-[#123B6D] flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#172033]">{pillar.title}</h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Responsible Safety Disclaimer (Mandatory: never claim 100% secure or zero data loss) */}
        <div className="mt-8 text-center text-xs text-slate-500 max-w-2xl mx-auto">
          We maintain defense-in-depth infrastructure protocols, point-in-time state replication, and cryptographic verification logs to maximize system integrity under real-world operating conditions.
        </div>
      </div>
    </section>
  );
};
