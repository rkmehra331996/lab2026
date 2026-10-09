import React from 'react';
import { motion } from 'motion/react';
import {
  Globe,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LabWelcomeFirstScreenProps {
  labName: string;
  labShopId?: string;
  labLogoUrl?: string;
  labNabl?: string;
  labAddress?: string;
  labPhone?: string;
  backgroundImageUrl?: string;
  onVisitWebsite: () => void;
  onBookTest?: () => void;
  onCheckReport: () => void;
  onStaffLogin?: () => void;
  onOpenSoftwareWebsite?: () => void;
}

export const LabWelcomeFirstScreen: React.FC<LabWelcomeFirstScreenProps> = ({
  labName,
  backgroundImageUrl,
  onVisitWebsite,
  onCheckReport,
}) => {
  // High-resolution diagnostic pathology laboratory background
  const defaultLabBg =
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=2400&q=85';
  const effectiveBg = backgroundImageUrl?.trim() || defaultLabBg;

  return (
    <section className="relative w-full h-[100dvh] max-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-white select-none">
      {/* 1. Laboratory Background Image with Smooth Ken Burns Motion Effect */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url('${effectiveBg}')` }}
        initial={{ scale: 1, x: 0 }}
        animate={{ scale: [1, 1.08, 1], x: [0, -8, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 2. Deep Gradient & Vignette Overlays for Maximum Text Legibility without a Box */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030914]/85 via-[#06152B]/75 to-[#030914]/90 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(18,59,109,0.35)_0%,rgba(3,9,20,0.85)_80%)] pointer-events-none" />

      {/* 3. Floating Ambient Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-blue-500/20 blur-[130px] pointer-events-none animate-float-slow" />
      <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-teal-400/20 blur-[130px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-600/10 blur-[150px] pointer-events-none" />

      {/* Subtle Precision Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* 4. Open Center Content (NO enclosing card/box) */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-5 sm:px-8 py-6 flex flex-col items-center justify-center text-center my-auto">
        {/* Subtle Pill Tag */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-semibold backdrop-blur-md mb-6 sm:mb-8 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="tracking-wide">Diagnostic Pathology & Health Center</span>
        </motion.div>

        {/* Welcome H1 + Styled Lab Name in 1 or 2 lines */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.75 }}
          className="space-y-3 sm:space-y-4 mb-8 sm:mb-12 max-w-4xl mx-auto"
        >
          {/* Welcome as H1 */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-widest text-slate-100 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            Welcome to
          </h1>

          {/* Lab Name stylized in 1 or 2 lines */}
          <div className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.12] drop-shadow-[0_6px_35px_rgba(0,0,0,0.95)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-teal-300">
              {labName}
            </span>
          </div>
        </motion.div>

        {/* Action Buttons Section (Full Width Visit Website + View Report below) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="w-full max-w-md mx-auto space-y-3.5 sm:space-y-4"
        >
          {/* 1. Visit Website Button (Full Width) */}
          <motion.button
            type="button"
            onClick={onVisitWebsite}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-950 font-black text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer border-2 border-white/90 overflow-hidden"
            id="welcome-btn-visit-website"
          >
            {/* Shimmer Sweep Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/40 to-transparent pointer-events-none animate-shimmer-sweep" />

            <Globe className="w-5 h-5 text-[#123B6D] group-hover:rotate-12 transition-transform duration-300 shrink-0 relative z-10" />
            <span className="tracking-tight relative z-10">Visit Website</span>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1.5 transition-transform duration-200 ml-auto relative z-10" />
          </motion.button>

          {/* 2. View Report Button */}
          <motion.button
            type="button"
            onClick={onCheckReport}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full group flex items-center justify-center gap-2.5 px-6 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#0F766E] to-[#0d9488] hover:from-[#0c615a] hover:to-[#0b7e74] text-white font-black text-sm sm:text-base shadow-lg hover:shadow-teal-500/30 transition-all duration-200 cursor-pointer border border-teal-300/60 overflow-hidden"
            id="welcome-btn-check-report"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none animate-shimmer-sweep" />
            <FileText className="w-4.5 h-4.5 text-emerald-200 group-hover:scale-110 transition-transform duration-200 shrink-0 relative z-10" />
            <span className="tracking-tight relative z-10">Check &amp; Download Report</span>
            <ArrowRight className="w-4 h-4 text-emerald-200/80 group-hover:translate-x-1.5 transition-transform duration-200 ml-auto relative z-10" />
          </motion.button>
        </motion.div>
      </main>
    </section>
  );
};
