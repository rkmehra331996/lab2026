import React from 'react';
import {
  Users,
  Building2,
  BookOpen,
  TestTubes,
  FileEdit,
  FileText,
  IndianRupee,
  History,
  CalendarCheck,
  Stethoscope,
  UserCog,
  Activity,
  Layers,
  Zap,
  Globe,
  MessageSquare,
  QrCode,
  Award,
  HardDriveDownload,
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
    desc: 'Token No., mobile search & patient records',
    icon: Users,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    id: 'f-2',
    title: 'Reception Dashboard',
    desc: 'Tokens, billing & counter',
    icon: Building2,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
  {
    id: 'f-3',
    title: 'Test Management',
    desc: 'Tests, packages & pricing',
    icon: BookOpen,
    color: 'text-teal-600 bg-teal-50 border-teal-100',
  },
  {
    id: 'f-4',
    title: 'Sample Management',
    desc: 'Sample collection & tracking',
    icon: TestTubes,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
  },
  {
    id: 'f-5',
    title: 'Result Entry',
    desc: 'Fast result entry & value alerts',
    icon: FileEdit,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    id: 'f-6',
    title: 'Report Generation',
    desc: 'Branded reports',
    icon: FileText,
    color: 'text-sky-600 bg-sky-50 border-sky-100',
  },
  {
    id: 'f-7',
    title: 'Billing & Payments',
    desc: 'Cash, UPI & receipts',
    icon: IndianRupee,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    id: 'f-8',
    title: 'Patient History',
    desc: 'Complete patient records',
    icon: History,
    color: 'text-violet-600 bg-violet-50 border-violet-100',
  },
  {
    id: 'f-9',
    title: 'Booking Management',
    desc: 'Branch booking & home sample',
    icon: CalendarCheck,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
  },
  {
    id: 'f-10',
    title: 'Doctor Management',
    desc: 'Doctor directory & referrals',
    icon: Stethoscope,
    color: 'text-blue-700 bg-blue-50 border-blue-100',
  },
  {
    id: 'f-11',
    title: 'Staff & Roles',
    desc: 'Reception, technician & admin access',
    icon: UserCog,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
  },
  {
    id: 'f-12',
    title: 'Technician Dashboard',
    desc: 'Tests, worklists & reports',
    icon: Activity,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  {
    id: 'f-13',
    title: 'Multi-Department',
    desc: 'Reception & technician workflow',
    icon: Layers,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  },
  {
    id: 'f-14',
    title: 'Auto Report Generation',
    desc: 'Faster report preparation',
    icon: Zap,
    color: 'text-amber-500 bg-amber-50 border-amber-100',
  },
  {
    id: 'f-15',
    title: 'Online Reports',
    desc: 'Patient report access',
    icon: Globe,
    color: 'text-cyan-700 bg-cyan-50 border-cyan-100',
  },
  {
    id: 'f-16',
    title: 'WhatsApp Reports',
    desc: 'Quick report sharing',
    icon: MessageSquare,
    color: 'text-green-600 bg-green-50 border-green-100',
  },
  {
    id: 'f-17',
    title: 'QR Report Verification',
    desc: 'Instant report verification',
    icon: QrCode,
    color: 'text-teal-700 bg-teal-50 border-teal-100',
  },
  {
    id: 'f-18',
    title: 'NABL Formats',
    desc: 'Reference ranges & report formats',
    icon: Award,
    color: 'text-blue-800 bg-blue-50 border-blue-100',
  },
  {
    id: 'f-19',
    title: 'Backup & Restore',
    desc: 'Secure data backup',
    icon: HardDriveDownload,
    color: 'text-slate-700 bg-slate-100 border-slate-200',
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* ========================================================
            SECTION HEADER
            ======================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 border border-[#123B6D]/15 text-[#123B6D] text-xs font-bold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Complete Pathology System</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#123B6D] tracking-tight">
            Core Features
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Everything your laboratory needs to streamline reception, phlebotomy, diagnostics, billing, and automated patient delivery.
          </p>
        </div>

        {/* ========================================================
            CORE FEATURES GRID:
            - Mobile: 3 features per row (grid-cols-3) -> 7 rows (6x3=18, last=1)
            - Desktop: 4 features per row (md:grid-cols-4) -> 5 rows
            ======================================================== */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 lg:gap-5">
          {CORE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="group relative p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white hover:border-[#123B6D]/40 hover:shadow-md transition-all duration-200 flex flex-col items-center sm:items-start text-center sm:text-left h-full"
              >
                {/* Feature Icon */}
                <div
                  className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 mb-2 sm:mb-3 border transition-transform duration-200 group-hover:scale-105 ${feat.color}`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>

                {/* Feature Title */}
                <h3 className="text-[11px] sm:text-sm font-bold text-slate-900 tracking-tight leading-snug sm:leading-normal">
                  {feat.title}
                </h3>

                {/* Feature Description */}
                <p className="text-[9.5px] sm:text-xs text-slate-500 mt-1 leading-tight sm:leading-relaxed">
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


