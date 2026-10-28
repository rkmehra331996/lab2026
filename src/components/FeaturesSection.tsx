import React from 'react';
import {
  Users,
  Building2,
  Activity,
  Microscope,
  BookOpen,
  TestTubes,
  FileEdit,
  FileText,
  IndianRupee,
  CalendarCheck,
  UserCog,
  LayoutDashboard,
  Receipt,
  Globe,
  MessageSquare,
  QrCode,
  Award,
  HardDriveDownload,
  Cloud,
  Infinity as InfinityIcon,
  Laptop,
  Calendar,
  Coins,
  Network,
  BarChart3,
  ShieldCheck,
  Headphones,
  Sparkles,
} from 'lucide-react';

interface FeatureItem {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CORE_FEATURES: FeatureItem[] = [
  {
    id: 'f-1',
    title: 'Patient Management',
    desc: 'Patient registration, token number and patient records.',
    icon: Users,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    id: 'f-2',
    title: 'Reception Dashboard',
    desc: 'Patient entry, token management and billing.',
    icon: Building2,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
  {
    id: 'f-3',
    title: 'Technician Dashboard',
    desc: 'Assigned tests, sample status and result entry.',
    icon: Activity,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    id: 'f-4',
    title: 'Expert / Pathologist Dashboard',
    desc: 'Result checking, report verification and approval.',
    icon: Microscope,
    color: 'text-teal-600 bg-teal-50 border-teal-100',
  },
  {
    id: 'f-5',
    title: 'Test Management',
    desc: 'Manage tests, packages and prices.',
    icon: BookOpen,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
  },
  {
    id: 'f-6',
    title: 'Sample Management',
    desc: 'Sample collection and tracking.',
    icon: TestTubes,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
  },
  {
    id: 'f-7',
    title: 'Result Entry',
    desc: 'Enter test results and check abnormal values.',
    icon: FileEdit,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  {
    id: 'f-8',
    title: 'Report Generation',
    desc: 'Generate unlimited PDF reports.',
    icon: FileText,
    color: 'text-sky-600 bg-sky-50 border-sky-100',
  },
  {
    id: 'f-9',
    title: 'Billing & Payments',
    desc: 'Bills, cash, UPI and payment receipts.',
    icon: IndianRupee,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    id: 'f-10',
    title: 'Booking Management',
    desc: 'Manage appointments and home collection bookings.',
    icon: CalendarCheck,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
  },
  {
    id: 'f-11',
    title: 'Staff & Role Management',
    desc: 'Manage staff accounts and access permissions.',
    icon: UserCog,
    color: 'text-violet-600 bg-violet-50 border-violet-100',
  },
  {
    id: 'f-12',
    title: 'Admin Dashboard',
    desc: 'Manage the complete lab software.',
    icon: LayoutDashboard,
    color: 'text-[#123B6D] bg-blue-50 border-blue-100',
  },
  {
    id: 'f-13',
    title: 'Auto Booking Receipt',
    desc: 'Generate booking receipts automatically.',
    icon: Receipt,
    color: 'text-teal-700 bg-teal-50 border-teal-100',
  },
  {
    id: 'f-14',
    title: 'Online Patient Reports',
    desc: 'Patients can view and download reports online.',
    icon: Globe,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  },
  {
    id: 'f-15',
    title: 'WhatsApp Reports',
    desc: 'Send PDF reports through WhatsApp.',
    icon: MessageSquare,
    color: 'text-green-600 bg-green-50 border-green-100',
  },
  {
    id: 'f-16',
    title: 'QR Report Download',
    desc: 'Scan QR codes to access reports.',
    icon: QrCode,
    color: 'text-blue-700 bg-blue-50 border-blue-100',
  },
  {
    id: 'f-17',
    title: 'NABL-Ready Formats',
    desc: 'Configure report formats and reference ranges.',
    icon: Award,
    color: 'text-amber-700 bg-amber-50 border-amber-100',
  },
  {
    id: 'f-18',
    title: 'Backup & Restore',
    desc: 'Back up and restore laboratory data.',
    icon: HardDriveDownload,
    color: 'text-slate-700 bg-slate-100 border-slate-200',
  },
  {
    id: 'f-19',
    title: 'Cloud-Based Software',
    desc: 'No software download or installation required.',
    icon: Cloud,
    color: 'text-sky-700 bg-sky-50 border-sky-100',
  },
  {
    id: 'f-20',
    title: 'Unlimited Reports & Entries',
    desc: 'Unlimited patient entries, bills, tests and reports, subject to plan terms.',
    icon: InfinityIcon,
    color: 'text-emerald-800 bg-emerald-50 border-emerald-100',
  },
  {
    id: 'f-21',
    title: 'Lifetime Lab Website',
    desc: 'A dedicated website for your diagnostic laboratory.',
    icon: Laptop,
    color: 'text-blue-800 bg-blue-50 border-blue-100',
  },
  {
    id: 'f-22',
    title: 'Patient Self-Booking',
    desc: 'Patients can book tests directly through your website.',
    icon: Calendar,
    color: 'text-rose-700 bg-rose-50 border-rose-100',
  },
  {
    id: 'f-23',
    title: 'Doctor Commission & B2B',
    desc: 'Manage doctor referrals and commissions.',
    icon: Coins,
    color: 'text-amber-700 bg-amber-50 border-amber-100',
  },
  {
    id: 'f-24',
    title: 'Multi-Branch Management',
    desc: 'Manage multiple lab branches.',
    icon: Network,
    color: 'text-purple-700 bg-purple-50 border-purple-100',
  },
  {
    id: 'f-25',
    title: 'Reports & Analytics',
    desc: 'View collection, booking and business reports.',
    icon: BarChart3,
    color: 'text-cyan-700 bg-cyan-50 border-cyan-100',
  },
  {
    id: 'f-26',
    title: 'Security & Access Management',
    desc: 'Secure login and role-based permissions.',
    icon: ShieldCheck,
    color: 'text-indigo-800 bg-indigo-50 border-indigo-100',
  },
  {
    id: 'f-27',
    title: 'Customer Support',
    desc: 'WhatsApp and phone support.',
    icon: Headphones,
    color: 'text-green-700 bg-green-50 border-green-100',
  },
];

interface FeaturesSectionProps {
  onExploreFeatures?: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = () => {
  return (
    <section
      id="features-section"
      className="py-14 sm:py-20 bg-linear-to-b from-white via-slate-50/50 to-white border-b border-slate-200 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================
            SECTION HEADER
            ======================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 border border-[#123B6D]/15 text-[#123B6D] text-xs font-bold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Complete Pathology &amp; Diagnostic OS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#123B6D] tracking-tight">
            Core Features
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Everything your laboratory needs to streamline reception, phlebotomy, diagnostics, billing, and automated patient delivery.
          </p>
        </div>

        {/* ========================================================
            CORE FEATURES GRID (27 Complete Features)
            ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {CORE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="group relative p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#123B6D]/40 hover:shadow-md transition-all duration-200 flex flex-col items-start text-left h-full"
              >
                {/* Feature Icon */}
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 mb-3 border transition-transform duration-200 group-hover:scale-105 ${feat.color}`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Feature Title */}
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-snug">
                  {feat.title}
                </h3>

                {/* Feature Description */}
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
