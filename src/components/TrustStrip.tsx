import React from 'react';
import { Cloud, Building2, WifiOff, MessageSquare, ShieldCheck, IndianRupee } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const items = [
    {
      title: 'Cloud Based',
      desc: 'Tier-IV Indian cloud with instantaneous multi-device sync',
      icon: Cloud,
      color: 'text-[#123B6D] bg-blue-50',
    },
    {
      title: 'Diagnostic Centers',
      desc: 'Consolidated Head Office view across all your lab centers',
      icon: Building2,
      color: 'text-[#0F766E] bg-teal-50',
    },
    {
      title: 'Offline Support',
      desc: 'Never stop billing or entering results when internet fails',
      icon: WifiOff,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'WhatsApp Reports',
      desc: 'Automatic PDF delivery directly to patient mobile numbers',
      icon: MessageSquare,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Secure Backup',
      desc: 'Automated point-in-time recovery & tenant data isolation',
      icon: ShieldCheck,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: '₹ INR Billing',
      desc: 'Native UPI QR codes, cash counter receipts & GST invoicing',
      icon: IndianRupee,
      color: 'text-[#123B6D] bg-blue-50',
    },
  ];

  return (
    <section className="py-8 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition duration-200"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xs font-bold text-[#123B6D] tracking-tight">{item.title}</h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
