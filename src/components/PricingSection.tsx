import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Copy,
  Share2,
  Smartphone,
  X,
  IndianRupee,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { PricingPlan } from '../types';

interface PricingSectionProps {
  onOpenDemo?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenDemo }) => {
  const { pricingPlans, companySettings } = useCms();
  const [activeSlide, setActiveSlide] = useState(2); // Default to 3 Months (index 2)

  // Dynamic UPI Plan Modal State
  const [selectedUpiPlan, setSelectedUpiPlan] = useState<PricingPlan | null>(null);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [labNameInput, setLabNameInput] = useState('');
  const [labPhoneInput, setLabPhoneInput] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Touch swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeSlide < pricingPlans.length - 1) {
      setActiveSlide((prev) => prev + 1);
    }
    if (isRightSwipe && activeSlide > 0) {
      setActiveSlide((prev) => prev - 1);
    }
  };

  // Helper to get formatted duration / billing cycle subtitle
  const getBillingSubtitle = (plan: PricingPlan) => {
    const name = plan.name || '';
    const price = plan.priceINR ?? plan.monthlyPriceINR ?? 0;
    const lower = name.toLowerCase();

    if (lower.includes('demo') || lower.includes('free') || lower.includes('2 day') || price === 0) {
      return {
        rateText: `/ 2 Days`,
        originalPrice: plan.originalPriceINR ?? 0,
        savingsText: 'Savings: ₹0',
        discountBadge: 'FREE',
        breakdownText: 'Full software access for 2 days • Zero commitment',
        badge: '2 Days Free Demo',
        ribbon: '2 Days Demo (FREE)',
        isDemo: true,
        isPopular: false,
        isBestValue: false,
      };
    }
    if (lower.includes('1 month') || lower.includes('monthly') || price === 899) {
      return {
        rateText: `/ 1 Month`,
        originalPrice: plan.originalPriceINR ?? 899,
        savingsText: 'Savings: ₹0',
        discountBadge: null,
        breakdownText: 'Full software access for 1 month • Billed monthly',
        badge: 'Starter Monthly',
        ribbon: null,
        isDemo: false,
        isPopular: false,
        isBestValue: false,
      };
    }
    if (lower.includes('6 month') || lower.includes('semi') || price === 4315) {
      return {
        rateText: `/ 6 Months`,
        originalPrice: plan.originalPriceINR ?? 5394,
        savingsText: 'You Save ₹1,079',
        discountBadge: '20% OFF',
        breakdownText: 'Full software access for 6 months • ₹719/mo',
        badge: '20% OFF',
        ribbon: '20% OFF',
        isDemo: false,
        isPopular: false,
        isBestValue: false,
      };
    }
    if (lower.includes('12 month') || lower.includes('year') || lower.includes('annual') || price === 5933) {
      return {
        rateText: `/ 12 Months`,
        originalPrice: plan.originalPriceINR ?? 10788,
        savingsText: 'You Save ₹4,855',
        discountBadge: 'BEST VALUE · 45% OFF',
        breakdownText: 'Full software access for 12 months • ₹494/mo',
        badge: 'BEST VALUE · 45% OFF',
        ribbon: 'BEST VALUE · 45% OFF',
        isDemo: false,
        isPopular: true,
        isBestValue: true,
      };
    }
    return {
      rateText: `/ period`,
      originalPrice: plan.originalPriceINR ?? price,
      savingsText: plan.savingsINR ? `You Save ₹${plan.savingsINR.toLocaleString('en-IN')}` : 'Savings: ₹0',
      discountBadge: plan.discountBadge || null,
      breakdownText: 'Full software access with all features',
      badge: 'Standard Plan',
      ribbon: null,
      isDemo: false,
      isPopular: false,
      isBestValue: false,
    };
  };

  const validActiveIndex = Math.min(Math.max(0, activeSlide), Math.max(0, pricingPlans.length - 1));
  const activeMobilePlan = pricingPlans[validActiveIndex];

  return (
    <section id="pricing-section" className="py-16 sm:py-20 bg-linear-to-b from-white via-slate-50/50 to-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#123B6D] tracking-tight">
            Simple, All-Inclusive Plans for Every Laboratory
          </h2>
          <p className="text-xs sm:text-base text-slate-600 mt-3 leading-relaxed">
            Choose your plan: <span className="font-semibold text-slate-900">2 Days</span> (FREE),{' '}
            <span className="font-semibold text-slate-900">1 Month</span> (₹899),{' '}
            <span className="font-semibold text-slate-900">6 Months</span> (₹4,315 • 20% OFF), or{' '}
            <span className="font-semibold text-slate-900">12 Months</span> (₹5,933 • 45% OFF). Full software access, test catalog, WhatsApp PDF reports, and Indian support included.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Full Software Access Across All Packages • No Hidden Setup Fees</span>
          </div>
        </div>

        {/* =========================================================================
            MOBILE VIEW: Interactive Touch Carousel (< md breakpoint)
            ========================================================================= */}
        <div className="block md:hidden max-w-md mx-auto">
          {/* Quick Pill Selector Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 mb-5 text-center">
            {pricingPlans.map((p, idx) => {
              const isCurrent = validActiveIndex === idx;
              const tag = p.name.includes('12') ? '★ 45% OFF' : p.name.includes('6') ? '20% OFF' : p.name.includes('2') ? 'FREE' : null;
              return (
                <button
                  key={p.id || idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer truncate ${
                    isCurrent
                      ? 'bg-[#123B6D] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="block truncate">{p.name}</span>
                  {tag && (
                    <span className={`block text-[8px] font-extrabold leading-none mt-0.5 truncate ${isCurrent ? 'text-amber-300' : 'text-emerald-600'}`}>
                      {tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Carousel Card with Swipe Handlers & Arrows */}
          {activeMobilePlan && (() => {
            const price = activeMobilePlan.priceINR ?? activeMobilePlan.monthlyPriceINR ?? 0;
            const meta = getBillingSubtitle(activeMobilePlan);
            const isHighlighted = meta.isPopular;
            const isBestValue = meta.isBestValue;
            const isDemo = meta.isDemo;
            const planDisplayName = activeMobilePlan.name;

            return (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative select-none"
              >
                {/* Main Card */}
                <div
                  className={`rounded-3xl transition-all duration-300 flex flex-col justify-between relative bg-white ${
                    isHighlighted
                      ? 'border-2 border-[#123B6D] shadow-xl ring-4 ring-[#123B6D]/5'
                      : isBestValue
                      ? 'border-2 border-emerald-500 shadow-lg'
                      : isDemo
                      ? 'border-2 border-teal-500 shadow-md'
                      : 'border border-slate-200 shadow-md'
                  } p-6`}
                >
                  {/* Highlight Ribbon */}
                  {meta.ribbon && (
                    <div
                      className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap ${
                        isBestValue || isHighlighted
                          ? 'bg-[#123B6D] text-amber-300'
                          : isDemo
                          ? 'bg-teal-700 text-white'
                          : 'bg-emerald-700 text-white'
                      }`}
                    >
                      {isBestValue && <Sparkles className="w-3 h-3 text-amber-300" />}
                      {!isBestValue && isDemo && <Zap className="w-3 h-3 text-amber-300" />}
                      {!isBestValue && !isDemo && <Award className="w-3 h-3 text-amber-300" />}
                      <span>{meta.ribbon}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                          isBestValue || isHighlighted
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : isDemo
                            ? 'bg-teal-50 text-teal-900 border-teal-200'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        }`}
                      >
                        {activeMobilePlan.target || meta.badge}
                      </span>

                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {validActiveIndex + 1} / {pricingPlans.length}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900">{planDisplayName}</h3>
                    <p className="text-xs text-slate-500 mt-1 min-h-[30px] leading-relaxed">
                      {activeMobilePlan.description || 'Full software access with all features included.'}
                    </p>

                    {/* Price Block */}
                    <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {price === 0 ? (
                          <span className="text-3xl font-black text-[#123B6D]">FREE</span>
                        ) : (
                          <span className="text-3xl font-black text-[#123B6D]">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-semibold">{meta.rateText}</span>
                        {meta.discountBadge && (
                          <span className="ml-auto text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                            {meta.discountBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 mt-2 text-xs flex-wrap">
                        <span className="text-slate-400 font-mono">
                          Original: <span className={meta.originalPrice > price ? 'line-through text-slate-400' : ''}>₹{meta.originalPrice.toLocaleString('en-IN')}</span>
                        </span>
                        <span className={`text-[11px] font-bold ${meta.savingsText.includes('Save') ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md' : 'text-slate-500'}`}>
                          {meta.savingsText}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 font-medium mt-1.5">
                        {meta.breakdownText}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                        <span>Included in this plan:</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Full Access
                        </span>
                      </div>
                      {activeMobilePlan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-slate-700 leading-snug">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                    {isDemo ? (
                      <button
                        onClick={() => {
                          if (onOpenDemo) onOpenDemo();
                        }}
                        className="w-full py-3 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Start Free Demo • 2 Days Access</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUpiPlan(activeMobilePlan);
                          setIsUpiModalOpen(true);
                          setIsSubmitted(false);
                          setUtrNumber('');
                        }}
                        className="w-full py-3 rounded-xl border border-amber-300 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                      >
                        <QrCode className="w-4 h-4 text-slate-950" />
                        <span>Pay ₹{price.toLocaleString('en-IN')} via Dynamic UPI QR</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Carousel Controls Below Card */}
                <div className="mt-4 flex items-center justify-between px-2">
                  <button
                    onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
                    disabled={validActiveIndex === 0}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    aria-label="Previous Plan"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>

                  {/* Dot Indicators */}
                  <div className="flex items-center gap-2">
                    {pricingPlans.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setActiveSlide(dotIdx)}
                        aria-label={`Slide ${dotIdx + 1}`}
                        className={`h-2.5 rounded-full transition-all cursor-pointer ${
                          validActiveIndex === dotIdx
                            ? 'w-7 bg-[#123B6D]'
                            : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveSlide((prev) => Math.min(pricingPlans.length - 1, prev + 1))}
                    disabled={validActiveIndex === pricingPlans.length - 1}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    aria-label="Next Plan"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center text-[11px] text-slate-400 mt-2 font-medium">
                  ← Swipe left or right to view other packages →
                </div>
              </div>
            );
          })()}
        </div>

        {/* =========================================================================
            DESKTOP & TABLET VIEW: 4 Side-by-Side Responsive Grid
            ========================================================================= */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {pricingPlans.map((plan, idx) => {
            const price = plan.priceINR ?? plan.monthlyPriceINR ?? 0;
            const meta = getBillingSubtitle(plan);
            const isHighlighted = meta.isPopular;
            const isBestValue = meta.isBestValue;
            const isDemo = meta.isDemo;
            const planDisplayName = plan.name;

            return (
              <div
                key={plan.id || idx}
                className={`rounded-3xl transition-all duration-200 flex flex-col justify-between relative ${
                  isBestValue || isHighlighted
                    ? 'border-2 border-[#123B6D] bg-white shadow-xl ring-4 ring-[#123B6D]/5 -translate-y-1'
                    : isDemo
                    ? 'border-2 border-teal-500 bg-white shadow-sm'
                    : 'border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-slate-300'
                } p-5 sm:p-6`}
              >
                {/* Highlight Ribbon */}
                {meta.ribbon && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap ${
                      isBestValue || isHighlighted
                        ? 'bg-[#123B6D] text-amber-300'
                        : isDemo
                        ? 'bg-teal-700 text-white'
                        : 'bg-emerald-700 text-white'
                    }`}
                  >
                    {isBestValue && <Sparkles className="w-3 h-3 text-amber-300" />}
                    {!isBestValue && isDemo && <Zap className="w-3 h-3 text-amber-300" />}
                    {!isBestValue && !isDemo && <Award className="w-3 h-3 text-amber-300" />}
                    <span>{meta.ribbon}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border truncate ${
                        isBestValue || isHighlighted
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : isDemo
                          ? 'bg-teal-50 text-teal-900 border-teal-200'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      }`}
                    >
                      {plan.target || meta.badge}
                    </span>

                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isBestValue || isHighlighted
                          ? 'bg-[#123B6D] text-amber-400'
                          : isDemo
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isDemo && <Zap className="w-4 h-4" />}
                      {!isDemo && idx === 1 && <Smartphone className="w-4 h-4" />}
                      {!isDemo && idx === 2 && <Award className="w-4 h-4" />}
                      {!isDemo && isBestValue && <Sparkles className="w-4 h-4" />}
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900">{planDisplayName}</h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[36px] leading-relaxed">
                    {plan.description || 'Full software access with all features included.'}
                  </p>

                  {/* Price Block */}
                  <div className="my-5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {price === 0 ? (
                        <span className="text-2xl sm:text-3xl font-black text-[#123B6D]">FREE</span>
                      ) : (
                        <span className="text-2xl sm:text-3xl font-black text-[#123B6D]">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-semibold">{meta.rateText}</span>
                      {meta.discountBadge && (
                        <span className="ml-auto text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                          {meta.discountBadge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                      <span className="text-slate-400 font-mono text-[11px]">
                        Original: <span className={meta.originalPrice > price ? 'line-through text-slate-400' : ''}>₹{meta.originalPrice.toLocaleString('en-IN')}</span>
                      </span>
                      <span className={`text-[11px] font-bold ${meta.savingsText.includes('Save') ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded' : 'text-slate-500'}`}>
                        {meta.savingsText}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 font-medium mt-1.5">
                      {meta.breakdownText}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Included in this plan:
                    </div>
                    {plan.features.slice(0, 6).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-slate-700 leading-snug">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-[11px]">{feat}</span>
                      </div>
                    ))}
                    {plan.features.length > 6 && (
                      <div className="text-[10px] font-semibold text-slate-500 italic pt-1">
                        + {plan.features.length - 6} more included features
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                  {isDemo ? (
                    <button
                      onClick={() => {
                        if (onOpenDemo) onOpenDemo();
                      }}
                      className="w-full py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Start Free Demo (2 Days)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUpiPlan(plan);
                        setIsUpiModalOpen(true);
                        setIsSubmitted(false);
                        setUtrNumber('');
                      }}
                      className="w-full py-2.5 rounded-xl border border-amber-300 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98"
                    >
                      <QrCode className="w-4 h-4 text-slate-950" />
                      <span>Pay ₹{price.toLocaleString('en-IN')} via UPI QR</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC UPI PLAN PAYMENT MODAL */}
      {isUpiModalOpen && selectedUpiPlan && (() => {
        const planPrice = selectedUpiPlan.priceINR ?? selectedUpiPlan.monthlyPriceINR;
        const superAdminUpi = companySettings.upiId || '7087033009@okbizaxis';
        const superAdminMerchant = companySettings.upiMerchantName || 'INDIANLALAJI.COM LAB OS';
        const dynamicUpiUri = `upi://pay?pa=${encodeURIComponent(superAdminUpi)}&pn=${encodeURIComponent(superAdminMerchant)}&am=${planPrice}&cu=INR&tn=${encodeURIComponent(`${selectedUpiPlan.name} Plan - ${labNameInput || 'Lab Software'}`)}`;
        const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(dynamicUpiUri)}`;

        const handleSendConfirmation = (e: React.FormEvent) => {
          e.preventDefault();
          setIsSubmitted(true);
          const message = `*NEW LAB REGISTRATION & UPI PAYMENT CONFIRMATION*\n\n` +
            `*Plan:* ${selectedUpiPlan.name} (₹${planPrice.toLocaleString('en-IN')})\n` +
            `*Laboratory Name:* ${labNameInput || 'Pending'}\n` +
            `*Contact Phone:* ${labPhoneInput || 'Pending'}\n` +
            `*Payment UTR / Ref No:* ${utrNumber || 'Attached Screenshot'}\n` +
            `*Paid to UPI ID:* ${superAdminUpi}\n\n` +
            `Please activate our software account and confirm our dedicated website.`;
          const waUrl = `https://wa.me/917087033009?text=${encodeURIComponent(message)}`;
          window.open(waUrl, '_blank');
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6 relative">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#123B6D] to-[#0A2544] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-300/30">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base">
                      Subscribe to {selectedUpiPlan.name} Plan
                    </h3>
                    <p className="text-[11px] text-blue-200">
                      Dynamic UPI Payment • Instant Account Activation
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpiModalOpen(false)}
                  className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic Amount Banner */}
              <div className="bg-amber-50 border-b border-amber-200/80 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                    Pre-Filled Dynamic Amount
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    ₹{planPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Amount Injected</span>
                </span>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* QR Code Container */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center">
                  <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <img
                      src={dynamicQrUrl}
                      alt="Dynamic Plan UPI QR"
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                    />
                  </div>
                  <div className="mt-3">
                    <div className="text-xs font-black text-slate-800">{superAdminMerchant}</div>
                    <div className="text-[11px] font-mono text-slate-600 font-bold flex items-center justify-center gap-1.5 mt-0.5">
                      <span>{superAdminUpi}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(superAdminUpi);
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="text-[10px] font-bold text-[#123B6D] hover:underline cursor-pointer"
                      >
                        {copiedUpi ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Supported Apps Strip */}
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                    <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Google Pay</span>
                    <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">PhonePe</span>
                    <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Paytm</span>
                    <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">BHIM</span>
                    <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Any UPI</span>
                  </div>

                  <a
                    href={dynamicUpiUri}
                    className="mt-3 w-full py-2 px-3 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                    <span>Pay ₹{planPrice.toLocaleString('en-IN')} on Mobile UPI App</span>
                  </a>
                </div>

                {/* Form to submit confirmation */}
                {!isSubmitted ? (
                  <form onSubmit={handleSendConfirmation} className="space-y-3 pt-1 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Laboratory / Hospital Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={labNameInput}
                          onChange={(e) => setLabNameInput(e.target.value)}
                          placeholder="e.g. Apex Diagnostics"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          WhatsApp Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={labPhoneInput}
                          onChange={(e) => setLabPhoneInput(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        UPI Transaction UTR / Ref Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. 423987123901"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Confirm & Send Details on WhatsApp</span>
                    </button>
                  </form>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                    <h4 className="font-black text-xs text-emerald-950">Payment Confirmation Sent!</h4>
                    <p className="text-[11px] text-emerald-800">
                      Our onboarding specialist is verifying your payment. Your login credentials will be delivered to your WhatsApp within 15 minutes.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsUpiModalOpen(false)}
                      className="mt-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
