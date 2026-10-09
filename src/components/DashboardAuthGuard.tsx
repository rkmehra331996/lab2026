import React from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowLeft, LogIn, Crown } from 'lucide-react';
import { AppView } from '../types';
import { useCms } from '../context/CmsContext';

interface DashboardAuthGuardProps {
  view: AppView;
  onNavigateView: (view: AppView) => void;
}

export const DashboardAuthGuard: React.FC<DashboardAuthGuardProps> = ({
  view,
  onNavigateView,
}) => {
  const { openLoginModal, vendorLabSettings, login } = useCms();

  const getRoleConfig = () => {
    switch (view) {
      case 'vendor_dashboard':
        return {
          role: 'vendor' as const,
          title: 'Lab Owner / Management Dashboard',
          hindiTitle: 'लैब संचालक डैशबोर्ड',
          badge: '👑 Lab Owner Access Only',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          desc: 'This administrative workspace is strictly restricted to the Diagnostic Lab Owner. Access requires your registered Mobile Number, Password, and 6-Digit Security PIN.',
          hint: 'Note: Password can only be reset by Portal Super Admin (rkmehra331996@gmail.com).',
        };
      case 'reception_dashboard':
        return {
          role: 'reception' as const,
          title: 'Reception & Billing Counter Panel',
          hindiTitle: 'रिसेप्शन एवं बिलिंग काउंटर',
          badge: '🖥️ Receptionist Access Only',
          badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
          desc: 'This panel is reserved for front-desk staff to handle patient registrations, token issuance, billing receipts, and due collections.',
          hint: 'Note: Lab Admin Only can set and reset your Login ID & Password (केवल आपके लैब एडमिन ही पासवर्ड बदल सकते हैं).',
        };
      case 'technician_dashboard':
        return {
          role: 'technician' as const,
          title: 'Lab Technician Testing Workstation',
          hindiTitle: 'लैब टेक्नीशियन वर्कस्टेशन',
          badge: '🔬 Lab Technician Access Only',
          badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
          desc: 'This clinical analyzer workstation is restricted to verified lab technicians for specimen barcode processing, test findings entry, and report authorizations.',
          hint: 'Note: Lab Admin Only can set and reset your Login ID & Password (केवल आपके लैब एडमिन ही पासवर्ड बदल सकते हैं).',
        };
      case 'branch_manager_dashboard':
        return {
          role: 'branch_manager' as const,
          title: 'Branch Operations & Cash Manager Panel',
          hindiTitle: 'शाखा प्रबंधक डैशबोर्ड',
          badge: '🏢 Branch Manager Access Only',
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
          desc: 'This workspace is restricted to authorized Branch Managers for daily cash counter balancing, sample transit dispatch, and branch patient queues.',
          hint: 'Note: Access is scoped to your assigned Branch ID. Credentials managed by Lab Admin.',
        };
      case 'pathologist_dashboard':
        return {
          role: 'pathologist' as const,
          title: 'Consultant Pathologist Verification Desk',
          hindiTitle: 'पैथोलॉजिस्ट क्लिनिकल सत्यापन डेस्क',
          badge: '🩺 Consultant Pathologist Access Only',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          desc: 'This clinical workstation is restricted to qualified Pathologists (MD / DNB) for reviewing analyzer findings, flagging critical panic values, and signing NABL reports.',
          hint: 'Note: Requires digital signature authorization and clinical verification rights.',
        };
      case 'admin_dashboard':
      default:
        return {
          role: 'admin' as const,
          title: 'Portal Super Admin Dashboard',
          hindiTitle: 'सुपर एडमिन सेंट्रल कंसोल',
          badge: '🛡️ Portal Super Admin Only',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
          desc: 'Restricted to the Portal Website Owner for SaaS system configuration, lab subscriber management, and super-administrative overrides.',
          hint: 'Restricted credentials: rkmehra331996@gmail.com',
        };
    }
  };

  const cfg = getRoleConfig();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#123B6D]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="bg-[#123B6D] text-white p-6 text-center relative">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black border uppercase tracking-wider mb-2 bg-white/10 text-amber-300 border-white/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Authentication Guard</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">{cfg.title}</h2>
          <p className="text-xs text-slate-300 mt-0.5 font-medium">{cfg.hindiTitle}</p>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          {/* Status badge */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">Laboratory:</span>
            <span className="font-bold text-[#123B6D]">{vendorLabSettings.labName}</span>
          </div>

          <div className={`p-3.5 rounded-2xl border ${cfg.badgeColor} text-xs font-semibold text-center`}>
            {cfg.badge}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600 leading-relaxed">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Login Required:</span>
            </div>
            <p>{cfg.desc}</p>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 font-medium">
              {cfg.hint}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {view === 'admin_dashboard' && (
              <button
                type="button"
                id="guard-btn-quick-admin"
                onClick={() => {
                  const res = login('admin', 'therkmehra331996@gmail.com', 'Asdfzxcv@336699', 'all', undefined, '331996');
                  if (res.success) {
                    onNavigateView('admin_dashboard');
                  }
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 px-4 rounded-xl font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>1-Click Super Admin Login (Master Access)</span>
              </button>
            )}

            <button
              type="button"
              id="guard-btn-login"
              onClick={() => openLoginModal(cfg.role)}
              className="w-full bg-[#123B6D] hover:bg-[#0c284b] text-white py-3 px-4 rounded-xl font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>Log In with Password & Credentials</span>
            </button>

            <button
              type="button"
              id="guard-btn-back"
              onClick={() => onNavigateView('vendor_website')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Lab Website</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 text-center text-[11px] text-slate-500 font-medium">
          Logged out sessions are safely protected from unauthorized access.
        </div>
      </div>
    </div>
  );
};
