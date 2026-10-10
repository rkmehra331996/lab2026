import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Database,
  Award,
  CheckCircle2,
  Clock,
  Printer,
  FileCheck2,
} from 'lucide-react';

interface IndianLalajiMarqueeProps {
  theme?: 'dark' | 'light' | 'superadmin';
  className?: string;
  labName?: string;
  labId?: string;
}

export const IndianLalajiMarquee: React.FC<IndianLalajiMarqueeProps> = ({
  theme = 'light',
  className = '',
  labName,
  labId,
}) => {
  // Pre-configured rich marquee items showcasing IndianLalaji.com ecosystem & certified diagnostics
  const baseItems = [
    {
      badge: 'INDIANLALAJI.COM',
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
      text: 'India’s Premier Pathology & Diagnostic Lab Operating System',
      icon: Award,
      iconColor: 'text-amber-400',
    },
    {
      badge: 'NABL & ISO 15189',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30',
      text: 'Compliant Reference Formats & Barcode Integration',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
    },
    {
      badge: 'WHATSAPP REPORTS',
      badgeColor: 'bg-[#25D366]/20 text-emerald-300 font-bold border border-[#25D366]/30',
      text: 'Instant Automated PDF Report Delivery to Patients & Doctors',
      icon: Zap,
      iconColor: 'text-[#25D366]',
    },
    {
      badge: 'CLOUD & OFFLINE',
      badgeColor: 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30',
      text: 'High-Speed Indian Cloud with 100% Offline Emergency Backup',
      icon: Database,
      iconColor: 'text-sky-400',
    },
    {
      badge: 'DIGITAL QR VERIFICATION',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-400/30',
      text: 'Tamper-Proof Online Patient Report Verification System',
      icon: Globe,
      iconColor: 'text-indigo-400',
    },
    {
      badge: '₹ INR BILLING & UPI',
      badgeColor: 'bg-teal-500/20 text-teal-300 font-bold border border-teal-400/30',
      text: 'Instant Dynamic UPI QR Codes & Complete Financial Day-End Closing',
      icon: CheckCircle2,
      iconColor: 'text-teal-400',
    },
    ...(labName
      ? [
          {
            badge: (labName.toUpperCase()).slice(0, 24),
            badgeColor: 'bg-blue-600 text-white font-black',
            text: `Powered by indianlalaji.com • Lab ID: ${labId || 'VERIFIED'}`,
            icon: Sparkles,
            iconColor: 'text-amber-300',
          },
        ]
      : []),
    {
      badge: '24x7 HIGH AVAILABILITY',
      badgeColor: 'bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30',
      text: 'Serving 1,200+ Pathology Laboratories & Diagnostic Centres across India',
      icon: Clock,
      iconColor: 'text-purple-400',
    },
    {
      badge: 'DOCTOR SIGN-OFF',
      badgeColor: 'bg-rose-500/20 text-rose-300 font-bold border border-rose-400/30',
      text: 'Multi-Department Approval Workflow & Digital Signatures',
      icon: FileCheck2,
      iconColor: 'text-rose-400',
    },
  ];

  // Theme styling definitions
  const containerClasses =
    theme === 'dark'
      ? 'bg-[#071322] border-t border-b border-slate-800 text-slate-200'
      : theme === 'superadmin'
      ? 'bg-slate-900 border-t border-b border-slate-800 text-slate-200 shadow-inner'
      : 'bg-gradient-to-r from-[#0d2a4e] via-[#123B6D] to-[#0e2a4f] border-t border-b border-[#1b4b85] text-white shadow-xs';

  const dotColor =
    theme === 'dark' || theme === 'superadmin' ? 'bg-amber-400/60' : 'bg-amber-400';

  return (
    <div
      className={`relative w-full overflow-hidden select-none py-2.5 sm:py-3 print:hidden ${containerClasses} ${className}`}
      aria-label="IndianLalaji Pathology Network Marquee"
    >
      {/* Side gradient blur masks for flawless edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-[#071322] to-transparent z-10 opacity-70" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-[#071322] to-transparent z-10 opacity-70" />

      {/* Infinite loop marquee track */}
      <div className="animate-marquee-infinite flex items-center">
        {/* Set 1 */}
        <div className="flex items-center shrink-0">
          {baseItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`m1-${idx}`}
                className="inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-xs whitespace-nowrap tracking-wide"
              >
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${item.iconColor}`} />
                <span className="font-semibold text-xs text-slate-100/95">
                  {item.text}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ml-4 shrink-0 opacity-75`} />
              </div>
            );
          })}
        </div>

        {/* Set 2 (Identical twin for seamless infinite loop with zero jumping) */}
        <div className="flex items-center shrink-0" aria-hidden="true">
          {baseItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={`m2-${idx}`}
                className="inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-xs whitespace-nowrap tracking-wide"
              >
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${item.iconColor}`} />
                <span className="font-semibold text-xs text-slate-100/95">
                  {item.text}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ml-4 shrink-0 opacity-75`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IndianLalajiMarquee;
