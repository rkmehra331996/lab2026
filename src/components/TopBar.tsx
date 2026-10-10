import React, { useState } from 'react';
import { Phone, Globe, KeyRound, LogOut, UserCheck, LayoutDashboard, Building2, Stethoscope, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { AppView, Language, UserRole } from '../types';
import { useCms } from '../context/CmsContext';
import { ALL_ROLES_CONFIG } from '../utils/rbac';

interface TopBarProps {
  currentView?: AppView;
  onSelectView?: (view: AppView) => void;
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView = 'website',
  onSelectView = (_view: AppView) => {},
  language = 'en',
  onSelectLanguage = (_lang: Language) => {},
}) => {
  const {
    currentUser,
    logout,
    openLoginModal,
    openRegisterLabModal,
    companySettings,
    isCloudConnected,
    cloudSyncStatus,
    lastCloudSyncTime,
    refreshCloudData,
    activeBranchId,
    setActiveBranchId,
    selectVendorLab,
    selectedVendorLabId,
  } = useCms();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      await refreshCloudData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };
  const supportPhone = companySettings.supportPhone || '+91 7087033009';

  const handleLaunchDepartment = (role: UserRole, view: AppView) => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'vendor' || currentUser.role === role)) {
      onSelectView(view);
    } else {
      openLoginModal(role);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '👑 Super Admin';
      case 'vendor':
        return '🏢 Lab Admin';
      case 'branch_manager':
        return '🏢 Branch Mgr';
      case 'reception':
        return '🖥️ Reception';
      case 'technician':
        return '🔬 Tech';
      case 'pathologist':
        return '🩺 Pathologist';
      default:
        return role;
    }
  };

  return (
    <div className="bg-[#123B6D] text-white text-xs border-b border-white/10 shrink-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2 flex items-center justify-between gap-4">
        {/* 1. Support Number & Navigation */}
        <div className="flex items-center gap-3">
          <a
            href={`tel:${supportPhone.replace(/\s+/g, '')}`}
            id="topbar-support-phone"
            className="inline-flex items-center gap-2 text-slate-100 hover:text-white transition font-medium text-xs sm:text-sm group"
            title="Call laboratory support helpline"
          >
            <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="hidden sm:inline text-slate-300 font-normal text-xs">Support:</span>
            <span className="font-semibold tracking-wide text-amber-300 group-hover:text-amber-200">{supportPhone}</span>
          </a>

          {currentView === 'vendor_website' && (
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Lab Active</span>
              </span>
              <button
                type="button"
                onClick={() => onSelectView('website')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-full text-[11px] sm:text-xs transition shadow-xs cursor-pointer active:scale-95"
                title="Go to IndianLalaji.com Home Portal"
              >
                <span>🏠 Software Home</span>
              </button>
            </div>
          )}

          {(currentView === 'reception_dashboard' ||
            currentView === 'technician_dashboard' ||
            currentView === 'branch_manager_dashboard' ||
            currentView === 'pathologist_dashboard' ||
            currentView === 'vendor_dashboard' ||
            currentView === 'admin_dashboard' ||
            currentView === 'lab_app') && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectView('website')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-full text-[11px] sm:text-xs transition shadow-xs cursor-pointer active:scale-95"
                title="Go to IndianLalaji.com Home Portal"
              >
                <span>🏠 Home</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectView('vendor_website')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-full text-[11px] sm:text-xs transition shadow-xs cursor-pointer active:scale-95"
                title="Return to Vendor Home Website"
              >
                <Globe className="w-3.5 h-3.5 text-slate-950" />
                <span className="hidden sm:inline">Lab Website</span>
              </button>
            </div>
          )}
        </div>

        {/* Right side: 2. Staff Login & 3. Language */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Active User Session & Role Switches */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/25 pl-2.5 pr-1.5 py-1 rounded-full border border-white/20 text-xs">
              <div className="flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate text-slate-200 font-semibold">
                  {currentUser.name}
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/15 text-amber-300">
                  {getRoleLabel(currentUser.role)}
                </span>
                {currentUser.branchName && (
                  <span className="hidden xl:inline-block text-[10px] text-slate-300 font-normal">
                    • {currentUser.branchName}
                  </span>
                )}
              </div>

              {/* Quick Workspace Switchers for Lab Vendor / Owner */}
              {currentUser.role === 'vendor' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectView('vendor_dashboard')}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      currentView === 'vendor_dashboard'
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-white/50'
                        : 'bg-amber-400/80 hover:bg-amber-400 text-slate-950'
                    }`}
                    title="Lab Owner / Vendor Dashboard"
                  >
                    <span>Lab HQ</span>
                  </button>
                  <button
                    onClick={() => onSelectView('reception_dashboard')}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      currentView === 'reception_dashboard'
                        ? 'bg-teal-400 text-slate-950 ring-2 ring-white/50'
                        : 'bg-teal-400/80 hover:bg-teal-400 text-slate-950'
                    }`}
                    title="Receptionist Counter"
                  >
                    <span>Reception</span>
                  </button>
                  <button
                    onClick={() => onSelectView('technician_dashboard')}
                    className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      currentView === 'technician_dashboard'
                        ? 'bg-purple-400 text-slate-950 ring-2 ring-white/50'
                        : 'bg-purple-400/80 hover:bg-purple-400 text-slate-950'
                    }`}
                    title="Technician Workstation"
                  >
                    <span>Tech</span>
                  </button>
                </div>
              )}

              {/* Dedicated role button for non-admin staff */}
              {currentUser.role === 'reception' && (
                <button
                  onClick={() => onSelectView('reception_dashboard')}
                  className="px-2 py-0.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-full text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  <LayoutDashboard className="w-3 h-3" />
                  <span>Reception Desk</span>
                </button>
              )}

              {currentUser.role === 'technician' && (
                <button
                  onClick={() => onSelectView('technician_dashboard')}
                  className="px-2 py-0.5 bg-purple-400 hover:bg-purple-300 text-slate-950 font-bold rounded-full text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  <LayoutDashboard className="w-3 h-3" />
                  <span>Technician Bench</span>
                </button>
              )}

              <button
                onClick={logout}
                title="Sign out of staff account"
                className="ml-1 text-rose-300 hover:text-rose-100 font-bold hover:underline flex items-center gap-1 p-1 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openLoginModal(undefined, 'login')}
                id="topbar-btn-staff-login"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer active:scale-95"
                title="Staff & Role Login"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>Login</span>
              </button>

              {/* Only show Create Lab on main platform, not on vendor lab website */}
              {currentView !== 'vendor_website' && (
                <button
                  type="button"
                  onClick={() => openRegisterLabModal()}
                  id="topbar-btn-create-lab"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-2xs cursor-pointer active:scale-95"
                  title="Register & Create New Diagnostic Laboratory"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>+ Create Lab</span>
                </button>
              )}
            </div>
          )}

          {/* Active Devices / Workstation Toggle: Device A & Device B */}
          <div
            id="topbar-device-selector"
            className="hidden sm:inline-flex items-center gap-1 bg-black/35 p-1 rounded-full border border-white/20 text-[11px]"
            title="Multi-Device Cloud Sync: Toggle between Device A and Device B"
          >
            <span className="text-[10px] text-slate-300 font-bold px-1.5 hidden xl:inline">Workstations:</span>
            <button
              type="button"
              onClick={() => setActiveBranchId('branch-1')}
              className={`px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeBranchId === 'branch-1'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white bg-white/5'
              }`}
              title="Device A: Reception & Billing Counter (Online & Synced)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>🖥️ Device A</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveBranchId('branch-2')}
              className={`px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeBranchId === 'branch-2'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white bg-white/5'
              }`}
              title="Device B: Lab Testing & Analyzer Workstation (Online & Synced)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>💻 Device B</span>
            </button>
          </div>

          {/* Cloud Database Multi-Device Live Sync Button & Status */}
          <button
            type="button"
            onClick={handleManualSync}
            id="topbar-cloud-sync-status"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer active:scale-95 ${
              isCloudConnected
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
            }`}
            title={
              isCloudConnected
                ? `🟢 Multi-Device Cloud Sync Active: Changes sync live across all phones, tablets, and computers. Click to force-refresh. (Last sync: ${lastCloudSyncTime})`
                : 'Offline: Local fallback active. Click to retry connection.'
            }
          >
            {isCloudConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="hidden sm:inline">All Devices Live</span>
                <span className="sm:hidden">Live</span>
                <RefreshCw className={`w-3 h-3 text-emerald-300 ${isRefreshing || cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Offline</span>
                <RefreshCw className={`w-3 h-3 text-amber-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              </>
            )}
          </button>

          {/* 3. Language Selector */}
          <div className="flex items-center gap-1.5 pl-2 sm:pl-3 border-l border-white/20">
            <Globe className="w-3.5 h-3.5 text-slate-300" />
            <select
              id="topbar-language-select"
              aria-label="Select website language"
              value={language}
              onChange={(e) => onSelectLanguage(e.target.value as Language)}
              className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-md px-2 py-1 border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer transition"
            >
              <option value="en" className="text-slate-900 bg-white">English</option>
              <option value="hi" className="text-slate-900 bg-white">हिंदी</option>
              <option value="pa" className="text-slate-900 bg-white">ਪੰਜਾਬੀ</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
