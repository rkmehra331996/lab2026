import React, { useState, useMemo } from 'react';
import {
  Building2,
  ExternalLink,
  Star,
  MapPin,
  Phone,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Search,
  Filter,
  CalendarCheck,
  FlaskConical,
  Globe,
  Radio,
} from 'lucide-react';
import { AppView, VendorLabDirectoryItem } from '../types';
import { useCms } from '../context/CmsContext';
import { VENDOR_LABS_DIRECTORY } from '../data/mockData';

interface VendorWebsitesShowcaseSectionProps {
  onSelectView: (view: AppView) => void;
  onOpenDemo?: () => void;
}

export const VendorWebsitesShowcaseSection: React.FC<VendorWebsitesShowcaseSectionProps> = ({
  onSelectView,
  onOpenDemo,
}) => {
  const { vendorLabsList, selectVendorLab, selectedVendorLabId, currentUser, companySettings } = useCms();
  const displayBrand = companySettings?.companyName || 'INDIANLALAJI.COM';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'nabl' | 'emergency' | 'home'>('all');
  const [showDraftsToAdmin, setShowDraftsToAdmin] = useState(false);

  const isPlatformAdmin = currentUser?.role === 'admin';
  
  // Safe effective list ensuring 6 shops always exist
  const effectiveLabs = useMemo(() => {
    if (Array.isArray(vendorLabsList) && vendorLabsList.length > 0) {
      return vendorLabsList;
    }
    return VENDOR_LABS_DIRECTORY;
  }, [vendorLabsList]);

  const draftCount = useMemo(() => {
    return effectiveLabs.filter((l) => (l.status || '').toLowerCase() === 'draft' || (l.status || '').toLowerCase() === 'pending').length;
  }, [effectiveLabs]);

  // Public visitor sees only Active labs; Admin can toggle to preview Draft labs
  const baseLabs = useMemo(() => {
    if (isPlatformAdmin && showDraftsToAdmin) {
      return effectiveLabs;
    }
    // Case-insensitive active check to match both 'Active' and 'active' from MySQL or JSON
    const activeOnly = effectiveLabs.filter((l) => (l.status || '').toLowerCase() === 'active');
    // If no active labs matched for any reason, fallback to default 6 active shops
    if (activeOnly.length === 0) {
      return VENDOR_LABS_DIRECTORY.filter((l) => (l.status || '').toLowerCase() === 'active');
    }
    return activeOnly;
  }, [effectiveLabs, isPlatformAdmin, showDraftsToAdmin]);

  // Distinct cities list from active labs
  const cities = useMemo(() => {
    const set = new Set(baseLabs.map((l) => l.city));
    return ['All', ...Array.from(set)];
  }, [baseLabs]);

  // Filtered labs
  const filteredLabs = useMemo(() => {
    return baseLabs.filter((lab) => {
      // City check
      if (selectedCity !== 'All' && lab.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Feature filter
      if (selectedFilter === 'nabl' && !lab.nablCode.toLowerCase().includes('nabl') && !lab.nablCode.toLowerCase().includes('mc-')) {
        return false;
      }
      if (selectedFilter === 'emergency' && !lab.emergency) {
        return false;
      }
      if (selectedFilter === 'home' && !lab.features?.some(f => f.toLowerCase().includes('home'))) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = lab.name.toLowerCase().includes(query);
        const matchesCity = lab.city.toLowerCase().includes(query);
        const matchesTagline = lab.tagline.toLowerCase().includes(query);
        const matchesBadge = lab.badge.toLowerCase().includes(query);
        const matchesPhone = (lab.phone || '').replace(/\s+/g, '').includes(query.replace(/\s+/g, ''));
        const matchesFeatures = lab.features?.some((f) => f.toLowerCase().includes(query));
        return matchesName || matchesCity || matchesTagline || matchesBadge || matchesPhone || matchesFeatures;
      }

      return true;
    });
  }, [baseLabs, selectedCity, selectedFilter, searchTerm]);

  const handleVisitWebsite = (labId: string) => {
    selectVendorLab(labId);
    onSelectView('vendor_website');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      id="lab-search-section"
      className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-b border-slate-200 scroll-mt-16 relative"
    >
      {/* Anchor for backward compatibility */}
      <span id="vendor-showcase-section" className="absolute -top-16 left-0 invisible" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold tracking-wide uppercase shadow-2xs mb-4">
            <Search className="w-3.5 h-3.5 text-teal-700" />
            <span>Lab Search • Partner Laboratory Directory</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#123B6D] tracking-tight leading-tight mb-2">
            Lab Search
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Find Verified Diagnostic Centers • Search certified partner pathology laboratories powered by <span className="font-bold text-[#123B6D]">{displayBrand}</span>. Explore test packages, compare rates, or visit individual laboratory websites directly for home collection and instant WhatsApp reports.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 mb-8 sm:mb-12">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search lab by name, city, test package, or mobile number..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#123B6D] focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Feature quick filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Live Labs ({baseLabs.length})
              </button>
              {isPlatformAdmin && draftCount > 0 && (
                <button
                  onClick={() => setShowDraftsToAdmin((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                    showDraftsToAdmin
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  }`}
                  title="Toggle visibility of unapproved Draft labs for Super Admin review"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Admin: {showDraftsToAdmin ? 'Hide Drafts' : `Show Drafts (${draftCount})`}</span>
                </button>
              )}
              <button
                onClick={() => setSelectedFilter('nabl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                  selectedFilter === 'nabl'
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>NABL Accredited</span>
              </button>
              <button
                onClick={() => setSelectedFilter('emergency')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                  selectedFilter === 'emergency'
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-rose-500" />
                <span>24x7 Emergency</span>
              </button>
              <button
                onClick={() => setSelectedFilter('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                  selectedFilter === 'home'
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
                <span>Home Collection</span>
              </button>
            </div>
          </div>

          {/* City Filter Pills */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
            <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              <span>City:</span>
            </span>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition shrink-0 cursor-pointer ${
                  selectedCity === city
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Showcase Cards Grid */}
        {filteredLabs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No laboratory found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try adjusting your search term or selecting "All Cities".
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCity('All');
                setSelectedFilter('all');
              }}
              className="px-4 py-2 rounded-lg bg-[#123B6D] text-white text-xs font-bold hover:bg-[#0e2c52] transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredLabs.map((lab) => {
              const isSelected = selectedVendorLabId === lab.id;

              return (
                <div
                  key={lab.id}
                  id={`vendor-card-${lab.id}`}
                  className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden group hover:shadow-xl ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                      : 'border-slate-200/90 hover:border-[#123B6D]/40'
                  }`}
                >
                  {/* Card Top: Browser Bar Simulation */}
                  <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-[11px] border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                      <span className="ml-2 font-mono text-[10px] text-slate-400 truncate max-w-[170px]">
                        {lab.domainPreview?.replace(/^https?:\/\//, '') || `indianlalaji.com/shop/${lab.id}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {lab.status === 'Draft' || lab.status === 'Pending' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          <span className="text-[10px] font-bold text-amber-300">Draft Mode</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-[10px] font-bold text-emerald-400">Live Website</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Banner & Brand Identity */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Header Row */}
                    <div className="flex items-start gap-3.5 mb-3">
                      {/* Monogram / Logo */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs"
                        style={{ backgroundColor: lab.color || '#123B6D' }}
                      >
                        {lab.name
                          .split(' ')
                          .filter((w) => !['&', 'and', 'the', 'of'].includes(w.toLowerCase()))
                          .slice(0, 2)
                          .map((w) => w.charAt(0))
                          .join('')
                          .toUpperCase()}
                      </div>

                      {/* Lab Title and City */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {lab.badge}
                          </span>
                          {lab.emergency && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-rose-600 animate-ping"></span>
                              24x7
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#123B6D] transition leading-snug line-clamp-2">
                          {lab.name}
                        </h3>

                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="font-medium truncate">{lab.city}, {lab.state}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tagline */}
                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      "{lab.tagline}"
                    </p>

                    {/* Key Metrics Chips */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                      <div className="bg-emerald-50/70 border border-emerald-100 p-2 rounded-lg flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-emerald-800 block">Accreditation</span>
                          <span className="font-semibold text-emerald-950 truncate block text-[10px]">
                            {lab.nablCode}
                          </span>
                        </div>
                      </div>

                      <div className="bg-blue-50/70 border border-blue-100 p-2 rounded-lg flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-blue-800 block">Reports In</span>
                          <span className="font-semibold text-blue-950 truncate block text-[10px]">
                            {lab.turnaroundTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rating & Active Packages */}
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <div className="flex items-center text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </div>
                        <span>{lab.rating}</span>
                        <span className="text-slate-400 text-[11px] font-normal">
                          ({lab.reviewsCount || 350}+ reviews)
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                        {lab.activePackages} Health Packages
                      </div>
                    </div>

                    {/* Features list */}
                    {lab.features && lab.features.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-4">
                        {lab.features.map((feat, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{feat}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-auto pt-2 space-y-2">
                      <button
                        onClick={() => handleVisitWebsite(lab.id)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer group-hover:bg-[#0e2c52]"
                      >
                        <Globe className="w-4 h-4 text-amber-300" />
                        <span>Visit Lab Website</span>
                        <ExternalLink className="w-3.5 h-3.5 text-white/80" />
                      </button>

                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-400 truncate flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {lab.phone}
                        </span>
                        <button
                          onClick={() => handleVisitWebsite(lab.id)}
                          className="text-[#0F766E] hover:underline font-bold shrink-0 cursor-pointer"
                        >
                          Book Home Test →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Banner: Call to Action for Lab Owners */}
        <div className="mt-14 sm:mt-18 bg-gradient-to-r from-[#123B6D] via-[#0f2f57] to-[#0F766E] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                For Pathology Laboratories & Diagnostics
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
                Want your laboratory to have its own branded patient portal like these?
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Get a complete diagnostic lab software with offline desktop billing, 500+ test catalog, automated WhatsApp PDF dispatch, and a customized patient website in under 24 hours.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              {onOpenDemo && (
                <button
                  onClick={onOpenDemo}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4 text-slate-950" />
                  <span>Schedule Live Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
