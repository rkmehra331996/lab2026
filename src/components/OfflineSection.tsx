import React, { useState } from 'react';
import { Wifi, WifiOff, Cloud, RefreshCw, ArrowDown, CheckCircle2, Zap, Server, ShieldCheck } from 'lucide-react';

interface OfflineSectionProps {
  onLaunchApp?: () => void;
}

export const OfflineSection: React.FC<OfflineSectionProps> = ({ onLaunchApp }) => {
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [simulatedQueue, setSimulatedQueue] = useState(3);
  const [syncingState, setSyncingState] = useState(false);

  const toggleSimulation = () => {
    if (!isSimulatedOffline) {
      setIsSimulatedOffline(true);
      setSimulatedQueue(prev => prev + 1);
    } else {
      setSyncingState(true);
      setTimeout(() => {
        setIsSimulatedOffline(false);
        setSimulatedQueue(0);
        setSyncingState(false);
      }, 1200);
    }
  };

  return (
    <section id="offline-section" className="py-16 bg-[#123B6D] text-white relative overflow-hidden border-b border-[#0e2c52]">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Badge as required */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold mb-4 tracking-wide uppercase">
            <span>OFFLINE → SYNC QUEUE → CLOUD</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Internet Down? Your Laboratory Operations Never Stop.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
            Laboratory software that works even when the internet doesn't. Your reception desk, sample collection, and analyzer result entries never stall due to fiber cuts or cellular outages.
          </p>
        </div>

        {/* Visual Workflow as required by spec */}
        <div className="max-w-4xl mx-auto bg-[#0e2c52] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center text-center">
            {/* Step 1: Internet Off */}
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-2">
                <WifiOff className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-red-300 uppercase tracking-wider">
                INTERNET OFF
              </span>
              <span className="text-[11px] text-slate-300 mt-1">
                Broadband or mobile outage
              </span>
            </div>

            <div className="flex justify-center text-amber-400">
              <span className="hidden md:block text-xl font-bold">→</span>
              <span className="md:hidden text-xl font-bold">↓</span>
            </div>

            {/* Step 2: Offline Mode active + Modules continuing */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                OFFLINE MODE
              </span>
              <div className="flex flex-wrap justify-center gap-1 mt-2 text-[10px] text-amber-200 font-medium">
                <span className="bg-amber-900/40 px-1.5 py-0.5 rounded">Patients</span>
                <span className="bg-amber-900/40 px-1.5 py-0.5 rounded">Tests</span>
                <span className="bg-amber-900/40 px-1.5 py-0.5 rounded">Samples</span>
                <span className="bg-amber-900/40 px-1.5 py-0.5 rounded">Results</span>
                <span className="bg-amber-900/40 px-1.5 py-0.5 rounded">Billing</span>
                <span className="bg-amber-900/40 px-1.5 py-0.5 rounded">Reports</span>
              </div>
            </div>

            <div className="flex justify-center text-emerald-400">
              <span className="hidden md:block text-xl font-bold">→</span>
              <span className="md:hidden text-xl font-bold">↓</span>
            </div>

            {/* Step 3: Internet returns & auto cloud sync */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <Cloud className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                INTERNET RETURNS
              </span>
              <span className="text-[11px] text-emerald-200 mt-1 font-semibold">
                AUTOMATIC CLOUD SYNC
              </span>
            </div>
          </div>

          {/* Explanation Box + Interactive Simulator */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-300 max-w-xl">
              <p>
                <strong className="text-white">How it works:</strong> All local entries are stored in encrypted client-side storage with an immutable revision log. When internet connection returns, the sync queue automatically uploads pending records to the Tier-IV cloud without human input or data conflict.
              </p>
            </div>

            {/* Live Interactive Simulator Pill */}
            <div className="flex items-center gap-3 bg-black/30 p-2.5 rounded-xl border border-white/15">
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Simulator Status:</div>
                <div className="text-xs font-bold flex items-center justify-end gap-1.5">
                  {syncingState ? (
                    <span className="text-blue-300 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing {simulatedQueue} items...
                    </span>
                  ) : isSimulatedOffline ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      <WifiOff className="w-3.5 h-3.5" /> Offline ({simulatedQueue} queued)
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected (Cloud Active)
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={toggleSimulation}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm bg-white/10 hover:bg-white/20 text-white border border-white/20"
                id="btn-simulate-offline"
              >
                {isSimulatedOffline ? 'Restore Internet' : 'Cut Internet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
