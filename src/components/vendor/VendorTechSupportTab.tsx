import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';

export const VendorTechSupportTab: React.FC = () => {
  const { vendorLabSettings } = useCms();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const supportEmail = 'Info@indianlalaji.com';
  const supportPhone = '7087033009';
  const supportPhoneFormatted = '70870 33009';
  const supportHours = 'Monday–Friday';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {copiedItem && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Copied {copiedItem} to clipboard!</span>
        </div>
      )}

      {/* 3-GRID CARDS FOR CONTACT DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {/* CARD 1: EMAIL SUPPORT */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 transition">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
                <Mail className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
                Official Email
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Email Support
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Send official inquiries, attachments, or bug reports
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">
                Support Email
              </div>
              <div className="text-sm sm:text-base font-mono font-bold text-indigo-950 truncate select-all">
                {supportEmail}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`mailto:${supportEmail}?subject=Tech%20Support%20Request%20-%20${encodeURIComponent(vendorLabSettings.labName || 'Lab')}`}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Mail</span>
            </a>
            <button
              type="button"
              onClick={() => copyToClipboard(supportEmail, 'Email Address')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* CARD 2: WHATSAPP SUPPORT */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition ring-2 ring-emerald-500/10">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Fastest Response</span>
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                WhatsApp Support
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant chat assistance with dedicated technical agents
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-slate-800">
              <div className="text-[11px] font-semibold text-emerald-800 uppercase">
                WhatsApp Number
              </div>
              <div className="text-base font-mono font-black text-emerald-950 select-all">
                {supportPhoneFormatted} <span className="text-xs text-emerald-700 font-sans font-medium">(WhatsApp)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`https://wa.me/91${supportPhone}?text=${encodeURIComponent(`Hello IndianLalaji Tech Support Team, I need assistance with lab: ${vendorLabSettings.labName || 'Laboratory'}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Now</span>
            </a>
            <button
              type="button"
              onClick={() => copyToClipboard(supportPhone, 'WhatsApp Number')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* CARD 3: SCHEDULE & TIMINGS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-300 transition">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                Support Schedule
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Working Days
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active business hours for technical escalations
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800">
              <div className="text-[11px] font-semibold text-amber-800 uppercase">
                Operating Days
              </div>
              <div className="text-base font-black text-amber-950">
                {supportHours}
              </div>
              <div className="text-xs text-slate-600 mt-0.5 font-medium">
                9:30 AM – 7:00 PM IST
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>24/7 Automated Cloud & Backup Monitoring Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
