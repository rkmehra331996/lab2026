import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { useCms } from '../context/CmsContext';

// Import clean, high-resolution laboratory photography
import receptionImg from '../assets/images/lab_reception_lounge_1790347166531.jpg';
import hematologyImg from '../assets/images/lab_hematology_analyzer_1790347081554.jpg';
import biochemistryImg from '../assets/images/lab_biochemistry_platform_1790347095136.jpg';
import microscopeImg from '../assets/images/lab_clinical_microscope_1790347120478.jpg';
import pathologistImg from '../assets/images/lab_pathologist_workstation_1790347181032.jpg';
import barcodeImg from '../assets/images/lab_barcode_station_1790347227373.jpg';

interface HeroProps {
  onOpenDemo: () => void;
  onLaunchApp: () => void;
  onLaunchLabShop?: () => void;
  language?: Language;
}

const CAROUSEL_IMAGES = [
  { id: '1', src: receptionImg, alt: 'Laboratory Reception Lounge & Registration' },
  { id: '2', src: hematologyImg, alt: '5-Part Hematology Analyzer' },
  { id: '3', src: biochemistryImg, alt: 'Biochemistry Platform' },
  { id: '4', src: microscopeImg, alt: 'Clinical Diagnostic Microscope' },
  { id: '5', src: pathologistImg, alt: 'Pathologist Doctor Workstation' },
  { id: '6', src: barcodeImg, alt: 'Thermal Barcode Sample Station' },
];

export const Hero: React.FC<HeroProps> = ({
  onOpenDemo,
  onLaunchApp,
  onLaunchLabShop,
  language = 'en',
}) => {
  const { companySettings, openRegisterLabModal, selectedVendorLabId, selectVendorLab } = useCms();
  const t = (language && TRANSLATIONS[language]) || TRANSLATIONS['en'];

  // Dynamic CMS copy
  const heroBadge = language === 'en' ? companySettings.heroBadge : t.tagline;
  const heroHeading = language === 'en' ? companySettings.heroTitle : t.heroHeading;
  const heroSubheading = language === 'en' ? companySettings.heroSubtitle : t.heroSubheading;

  // Simple image carousel state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance slides every 4 seconds when not hovered
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? CAROUSEL_IMAGES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  };

  return (
    <section id="hero-section" className="relative overflow-hidden bg-[#F8FAFC] pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-slate-200">
      {/* Subtle Background Radial Gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two-Column Grid: Left Content | Right Simple Plain Image Carousel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ========================================================
              LEFT SIDE: Content, Highlights & CTAs
              ======================================================== */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#123B6D]/10 border border-[#123B6D]/15 text-[#123B6D] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{heroBadge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] leading-[1.18] lg:leading-[1.12] font-black text-[#123B6D] tracking-tight">
              {heroHeading}
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-[540px]">
              {heroSubheading}
            </p>

            {/* Key Lab Benefits Checklist - Left-Right 2 Columns on Mobile & Desktop */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cloud-Based System</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Online Reports</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-Department</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="leading-tight sm:leading-normal">One Click Report Generation</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-btn-start"
                onClick={openRegisterLabModal}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-8 py-3.5 rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{t.getStarted}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>

          {/* ========================================================
              RIGHT SIDE: Simple Plain Image Carousel (No Banners)
              ======================================================== */}
          <div className="lg:col-span-6 relative">
            <div
              className="group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 bg-white"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Plain Image Canvas */}
              <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-slate-100 select-none">
                {CAROUSEL_IMAGES.map((img, index) => {
                  const isActive = index === currentSlideIndex;
                  return (
                    <div
                      key={img.id}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-cover object-center"
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                    </div>
                  );
                })}

                {/* Subtle Prev / Next Navigation Arrows */}
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-sm border border-slate-200/80 flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95 cursor-pointer opacity-70 group-hover:opacity-100"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>

                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-sm border border-slate-200/80 flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95 cursor-pointer opacity-70 group-hover:opacity-100"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
              </div>

              {/* Clean Dot Indicators Below Image */}
              <div className="py-3 bg-white flex items-center justify-center gap-2 border-t border-slate-100">
                {CAROUSEL_IMAGES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      index === currentSlideIndex
                        ? 'w-7 bg-[#123B6D]'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
