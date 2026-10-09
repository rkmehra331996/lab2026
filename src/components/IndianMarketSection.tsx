import React from 'react';
import { IndianRupee, QrCode, MessageSquare, Clock, Smartphone, Languages } from 'lucide-react';

export const IndianMarketSection: React.FC = () => {
  const cards = [
    {
      title: '₹ INR Billing',
      desc: 'Native Rupee denominations with GST exemption & tax-compliant receipt generation.',
      icon: IndianRupee,
      badge: 'Currency Native',
    },
    {
      title: 'UPI QR Codes',
      desc: 'Instant dynamic UPI QR generation at billing for PhonePe, GPay, Paytm, and BHIM.',
      icon: QrCode,
      badge: 'Zero MDR',
    },
    {
      title: 'WhatsApp Reports',
      desc: 'Direct dispatch to Indian patient numbers without costly SMS aggregator delays.',
      icon: MessageSquare,
      badge: '98% Open Rate',
    },
    {
      title: 'IST Timezone Native',
      desc: 'Collection, analyzer run, and report sign-off timestamps recorded strictly in Indian Standard Time.',
      icon: Clock,
      badge: 'UTC +5:30',
    },
    {
      title: '10-Digit Mobile First',
      desc: 'Quick lookup and validation optimized for Indian +91 mobile prefixes and regional operators.',
      icon: Smartphone,
      badge: 'Fast Lookup',
    },
    {
      title: 'English / Hindi / Punjabi',
      desc: 'Multilingual interface ready for lab staff across regions, with future Indian language support.',
      icon: Languages,
      badge: 'Multilingual',
    },
  ];

  return (
    <section className="py-16 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-3 border border-amber-200">
            <span>Designed for India</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Built for Indian Laboratories
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            No forced western workflows, no USD pricing confusion, and no complex foreign telephone formats.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-[#123B6D]/30 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#123B6D]/10 text-[#123B6D] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#172033]">{card.title}</h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
