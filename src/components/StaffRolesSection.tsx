import React from 'react';
import {
  Shield,
  UserCheck,
  FlaskConical,
  Stethoscope,
  Calculator,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Receipt,
  LayoutDashboard,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView } from '../types';

interface StaffRolesSectionProps {
  onNavigateView?: (view: AppView) => void;
}

export const StaffRolesSection: React.FC<StaffRolesSectionProps> = ({ onNavigateView }) => {
  const { openLoginModal, currentUser } = useCms();

  const handleLaunch = (role: 'reception' | 'technician' | 'admin', view: AppView) => {
    const targetRole = role === 'admin' ? 'vendor' : role;
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'vendor' || currentUser.role === role)) {
      if (onNavigateView) {
        onNavigateView(view);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      openLoginModal(targetRole);
    }
  };

  const departments = [
    {
      id: 'dept-reception',
      number: 'DEPT 01',
      title: 'Reception & Billing Panel',
      subTitle: 'Reception Department (Counter #1)',
      desc: 'Dedicated front-desk panel: fast patient registration, UHID assignment, billing discount, token receipt slip & due collection.',
      icon: Receipt,
      view: 'reception_dashboard' as AppView,
      role: 'reception' as const,
      color: 'teal',
      bgHeader: 'bg-teal-700',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      btnColor: 'bg-teal-700 hover:bg-teal-800 text-white',
      features: [
        'UHID & Patient Master Registration',
        '2" / 3" Thermal Print Receipt Slips',
        'Cash & UPI Instant Due Collection',
        'Live Calling Token Queue Board',
        'Strictly isolated from clinical/lab data',
      ],
    },
    {
      id: 'dept-technician',
      number: 'DEPT 02',
      title: 'Technician & Lab Workstation',
      subTitle: 'Technician Department (Analyzer Room)',
      desc: 'Clinical testing workstation: receive blood/urine samples from reception, enter test findings, verify critical flags & print verified reports.',
      icon: FlaskConical,
      view: 'technician_dashboard' as AppView,
      role: 'technician' as const,
      color: 'purple',
      bgHeader: 'bg-purple-700',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      btnColor: 'bg-purple-700 hover:bg-purple-800 text-white',
      features: [
        'Incoming Reception Samples Queue',
        'CBC, LFT, KFT, Lipid Parameter Entry',
        'Auto Normal Ranges & Critical High/Low Flags',
        'Pathologist Digital Signature Stamp',
        'NABL Print/PDF & Sample Rejection Reasons',
      ],
    },
    {
      id: 'dept-admin',
      number: 'DEPT 03',
      title: 'Lab Owner & Admin Panel',
      subTitle: 'Lab Owner / Central Admin (Master Control)',
      desc: 'Comprehensive supervisory master panel: test catalog pricing, doctor commissions, revenue audit, and direct monitoring of both departments.',
      icon: Shield,
      view: 'vendor_dashboard' as AppView,
      role: 'admin' as const,
      color: 'amber',
      bgHeader: 'bg-slate-900',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      btnColor: 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-black',
      features: [
        'Full Test Catalog, Packages & Price Editor',
        'Doctor Referral Incentives & Commission Tracking',
        'Daily Net Revenue & Branch Accounting',
        'Multi-Staff Security Privileges & Audit Logs',
        'Direct 1-Click Access to Reception & Technician',
      ],
    },
  ];

  const roles = [
    {
      title: 'Lab Owner',
      desc: 'Full business access.',
      icon: Shield,
      badge: 'Super Admin',
      color: 'border-[#123B6D] text-[#123B6D]',
      permissions: [
        { label: 'Head Office Financials', allowed: true },
        { label: 'Branch Staff Management', allowed: true },
        { label: 'Audit Logs & Rollback', allowed: true },
        { label: 'Doctor Incentive Commission', allowed: true },
      ],
    },
    {
      title: 'Receptionist',
      desc: 'Patients, registration and billing.',
      icon: UserCheck,
      badge: 'Front Desk',
      color: 'border-[#0F766E] text-[#0F766E]',
      permissions: [
        { label: 'Patient Registration & UHID', allowed: true },
        { label: 'Cash & UPI Bill Generation', allowed: true },
        { label: 'Print Barcode Labels', allowed: true },
        { label: 'Test Result Clinical Editing', allowed: false },
      ],
    },
    {
      title: 'Technician',
      desc: 'Samples and result entry.',
      icon: FlaskConical,
      badge: 'Analyzer Room',
      color: 'border-amber-600 text-amber-600',
      permissions: [
        { label: 'Sample Intake & Centrifuge', allowed: true },
        { label: 'Test Value Entry & Units', allowed: true },
        { label: 'Analyzer Worklist Run', allowed: true },
        { label: 'Report Digital Sign-off', allowed: false },
      ],
    },
    {
      title: 'Pathologist / Doctor',
      desc: 'Result verification and reports.',
      icon: Stethoscope,
      badge: 'Clinical Verification',
      color: 'border-emerald-600 text-emerald-600',
      permissions: [
        { label: 'Review Abnormal Flags', allowed: true },
        { label: 'Digital Cryptographic Sign', allowed: true },
        { label: 'Clinical Remarks & Footnotes', allowed: true },
        { label: 'Authorize WhatsApp Dispatch', allowed: true },
      ],
    },
    {
      title: 'Accountant',
      desc: 'Billing and payment management.',
      icon: Calculator,
      badge: 'Ledger & Tax',
      color: 'border-indigo-600 text-indigo-600',
      permissions: [
        { label: 'Daily Cash Register Reconcile', allowed: true },
        { label: 'Doctor Referral Payouts', allowed: true },
        { label: 'GST Tax Invoicing', allowed: true },
        { label: 'Clinical Record Modification', allowed: false },
      ],
    },
  ];

  return (
    <section id="staff-roles-section" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>3 Department Panels</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            3 Independent Department Panels
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Each department has a dedicated workspace: Reception Counter, Technician Analyzer Workstation, and Central Lab Owner / Admin Control Panel.
          </p>
        </div>

        {/* 3 Department Workstation Showcase Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className={`${dept.bgHeader} text-white p-5 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-white/80 font-bold block">
                          {dept.number}
                        </span>
                        <h3 className="text-base font-black text-white">{dept.title}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <span className="inline-block text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md mb-2">
                      {dept.subTitle}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed min-h-[38px]">
                      {dept.desc}
                    </p>

                    {/* Features list */}
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Included Workflows:
                      </span>
                      {dept.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleLaunch(dept.role, dept.view)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${dept.btnColor}`}
                  >
                    <span>Launch {dept.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Granular Governance Matrix Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            Granular Staff Access Matrix (5 Pre-configured Roles)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Eliminate unauthorized discounts, accidental result modifications, and clinical liability with strict role privileges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#123B6D]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {role.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#172033]">{role.title}</h3>
                  <p className="text-xs font-medium text-[#0F766E] mt-0.5">{role.desc}</p>

                  {/* Permission Matrix */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Privilege Matrix:
                    </span>
                    {role.permissions.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-center justify-between text-[11px]">
                        <span className={p.allowed ? 'text-slate-700' : 'text-slate-400'}>
                          {p.label}
                        </span>
                        {p.allowed ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                  IP & Session Protected
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
