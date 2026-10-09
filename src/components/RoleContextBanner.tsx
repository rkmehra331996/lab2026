import React from 'react';
import {
  ShieldCheck,
  Building,
  MapPin,
  Lock,
  ChevronDown,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  UserCheck,
  RefreshCw,
  ArrowLeft,
  Cloud,
  WifiOff,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView } from '../types';
import { ALL_ROLES_CONFIG } from '../utils/rbac';
import { PWAInstallButton } from './PWAInstallButton';
import { getPendingOfflineCount, flushOfflineSyncQueue, subscribeOfflineQueueCount } from '../lib/cloudSync';

interface RoleContextBannerProps {
  currentView: AppView;
  onNavigateView: (view: AppView) => void;
}

export const RoleContextBanner: React.FC<RoleContextBannerProps> = ({
  currentView,
  onNavigateView,
}) => {
  const {
    currentUser,
    logout,
    openLoginModal,
    isCloudConnected,
    activeBranchId,
    setActiveBranchId,
    refreshCloudData,
    cloudSyncStatus,
    lastCloudSyncTime,
  } = useCms();

  const [isManualSyncing, setIsManualSyncing] = React.useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = React.useState(() => getPendingOfflineCount());

  React.useEffect(() => {
    return subscribeOfflineQueueCount((count) => {
      setOfflineQueueCount(count);
    });
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await flushOfflineSyncQueue();
      await refreshCloudData();
    } finally {
      setTimeout(() => setIsManualSyncing(false), 600);
    }
  };

  if (!currentUser) return null;

  const role = currentUser.role;

  // Find role metadata
  let roleKey: keyof typeof ALL_ROLES_CONFIG = 'receptionist';
  if (role === 'admin') roleKey = 'super_admin';
  else if (role === 'vendor') roleKey = 'lab_admin';
  else if (role === 'branch_manager') roleKey = 'branch_manager';
  else if (role === 'reception') roleKey = 'receptionist';
  else if (role === 'technician') roleKey = 'technician';
  else if (role === 'pathologist') roleKey = 'pathologist';

  const cfg = ALL_ROLES_CONFIG[roleKey];

  return (
    <aside aria-label="Role & Branch Context" className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs px-4 py-2 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: User Role & Active Lab */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* User Tag */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-full">
            <span className="text-sm">{cfg.emoji}</span>
            <span className="font-bold text-white tracking-tight">{currentUser.name}</span>
            <span
              className={`ml-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badgeColor}`}
            >
              {cfg.title.split('(')[0].trim()}
            </span>
          </div>

          {/* Active Lab */}
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full text-[11px]">
            <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400">Lab:</span>
            <span className="font-bold text-slate-200 truncate max-w-[130px] sm:max-w-[200px]">
              {currentUser.labName || 'Apex Diagnostic Central'}
            </span>
            <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-mono">
              {currentUser.labId || 'lab-apex'}
            </span>
          </div>

          {/* Active Workstation / Device (Device A & Device B) */}
          <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Workstation:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveBranchId('branch-1')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  activeBranchId === 'branch-1'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                }`}
                title="Device A (Counter 1 - Reception & Billing)"
              >
                🖥️ Device A
              </button>
              <button
                type="button"
                onClick={() => setActiveBranchId('branch-2')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  activeBranchId === 'branch-2'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                }`}
                title="Device B (Counter 2 - Lab Workstation)"
              >
                💻 Device B
              </button>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-semibold">
              Both Live
            </span>
          </div>

          {/* Multi-Computer Cloud Live Status */}
          <div
            id="role-banner-cloud-status"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              isCloudConnected
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
            }`}
            title="Real-time multi-computer sync across Reception, Technician, and Pathologist workstations"
          >
            {isCloudConnected ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>Multi-PC Sync: Live</span>
                {offlineQueueCount > 0 && (
                  <span className="bg-sky-400 text-slate-950 px-1.5 py-0.2 rounded-full font-bold text-[9px] animate-pulse">
                    {offlineQueueCount} syncing
                  </span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Offline Mode (IndexedDB)</span>
                {offlineQueueCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-bold text-[9px]">
                    {offlineQueueCount} queued
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Section: Role Permissions Pills & Switcher */}
        <div className="flex items-center gap-2 ml-auto">
          {/* PWA Install Button for Staff Workstations */}
          <PWAInstallButton variant="minimal" />
          {/* Dashboard Quick Switcher if user has multi-dashboard privilege */}
          {role === 'admin' && (
            <div className="hidden lg:flex items-center gap-1">
              <button
                type="button"
                onClick={() => onNavigateView('website')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  currentView === 'website'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white bg-slate-800'
                }`}
                title="Open IndianLalaji.com Home Portal"
              >
                🏠 Home
              </button>
              <button
                type="button"
                onClick={() => onNavigateView('admin_dashboard')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  currentView === 'admin_dashboard'
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-300 hover:text-white bg-slate-800'
                }`}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => onNavigateView('vendor_dashboard')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  currentView === 'vendor_dashboard'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white bg-slate-800'
                }`}
              >
                Lab Admin
              </button>
              <button
                type="button"
                onClick={() => onNavigateView('reception_dashboard')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  currentView === 'reception_dashboard'
                    ? 'bg-teal-500 text-white'
                    : 'text-slate-300 hover:text-white bg-slate-800'
                }`}
              >
                Reception
              </button>
              <button
                type="button"
                onClick={() => onNavigateView('technician_dashboard')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  currentView === 'technician_dashboard'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-300 hover:text-white bg-slate-800'
                }`}
              >
                Technician
              </button>
            </div>
          )}

          {/* Back button */}
          <button
            type="button"
            id="role-banner-btn-back"
            onClick={() => {
              if (
                currentView === 'reception_dashboard' ||
                currentView === 'technician_dashboard' ||
                currentView === 'pathologist_dashboard' ||
                currentView === 'branch_manager_dashboard'
              ) {
                onNavigateView(currentUser?.role === 'vendor' ? 'vendor_dashboard' : 'vendor_website');
              } else if (currentView === 'vendor_dashboard') {
                onNavigateView('vendor_website');
              } else {
                onNavigateView('website');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/50 rounded-lg text-xs font-black transition cursor-pointer shadow-xs active:scale-95"
            title="Back to Previous View / Website"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {/* Quick Home button for non-superadmin roles */}
          {role !== 'admin' && (
            <button
              type="button"
              onClick={() => onNavigateView('website')}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
              title="Return to Main indianlalaji.com Home Portal"
            >
              <span>🏠 Main Home</span>
            </button>
          )}

          {/* Quick 1-Click Role Switch button */}
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[11px] transition shadow-xs cursor-pointer active:scale-95"
            title="Switch login role or test another role"
          >
            <RefreshCw className="w-3 h-3 text-slate-950" />
            <span>Switch Role / Re-login</span>
          </button>

          {/* Quick Manual Server Sync button */}
          <button
            type="button"
            onClick={handleManualSync}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer active:scale-95"
            title={`Server Database Live: ${lastCloudSyncTime || 'Just Now'}. Click to pull latest updates from Hostinger server across all devices.`}
          >
            <RefreshCw className={`w-3 h-3 ${isManualSyncing || cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700/60 rounded-lg text-[11px] font-bold transition cursor-pointer"
            title="Sign out of current role"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
