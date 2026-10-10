import React, { useState } from 'react';
import {
  Search,
  Globe,
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  X,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Award,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView, VendorLabDirectoryItem } from '../types';

interface LabSearchSectionProps {
  onSelectView: (view: AppView) => void;
  onOpenDemo?: () => void;
}

export const LabSearchSection: React.FC<LabSearchSectionProps> = ({
  onSelectView,
  onOpenDemo,
}) => {
  const {
    vendorLabsList,
    selectVendorLab,
    setSelectedVendorLabId,
    openRegisterLabModal,
    openLoginModal,
    companySettings,
  } = useCms();

  const displayBrand = companySettings?.companyName || 'INDIANLALAJI.COM';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedLab, setSearchedLab] = useState<VendorLabDirectoryItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Execute search by 10-digit mobile number, or lab name, or city
  const executeSearch = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    setSearchError('');
    setHasSearched(true);

    if (!trimmed) {
      setSearchError('Please enter a 10-digit mobile number or laboratory name.');
      setSearchedLab(null);
      return;
    }

    const cleanDigits = trimmed.replace(/\D/g, '').slice(-10);

    // If query has digits (e.g. mobile search)
    if (cleanDigits.length >= 10) {
      const matched = vendorLabsList.find((lab) => {
        const labDigits = (lab.phone || '').replace(/\D/g, '').slice(-10);
        return labDigits === cleanDigits;
      });

      if (matched) {
        setSearchedLab(matched);
        setSearchError('');
        return;
      }
    }

    // Otherwise search by name, city, or ID
    const queryLower = trimmed.toLowerCase();
    const matchedByName = vendorLabsList.find((lab) => {
      const nameMatch = String(lab.name || '').toLowerCase().includes(queryLower);
      const cityMatch = String(lab.city || '').toLowerCase().includes(queryLower);
      const idMatch = String(lab.id || '').toLowerCase().includes(queryLower);
      const ownerMatch = String(lab.ownerName || '').toLowerCase().includes(queryLower);
      return nameMatch || cityMatch || idMatch || ownerMatch;
    });

    if (matchedByName) {
      setSearchedLab(matchedByName);
      setSearchError('');
    } else {
      setSearchedLab(null);
      setSearchError(
        cleanDigits.length >= 10
          ? `No laboratory registered with mobile number +91 ${cleanDigits}. Exactly 1 laboratory website is linked per mobile number.`
          : `No registered laboratory found for "${trimmed}". Please enter a valid 10-digit mobile number or laboratory name.`
      );
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleVisitWebsite = (lab: VendorLabDirectoryItem) => {
    if (selectVendorLab) {
      selectVendorLab(lab.id);
    }
    if (setSelectedVendorLabId) {
      setSelectedVendorLabId(lab.id);
    }
    try {
      const cleanSlug = lab.slug || lab.id.replace(/^lab-/, '');
      window.history.pushState({}, '', `/shop/${cleanSlug}`);
    } catch {}
    onSelectView('vendor_website');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchedLab(null);
    setHasSearched(false);
    setSearchError('');
  };

  return (
    <section
      id="lab-search-section"
      className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800 relative overflow-hidden border-t border-b border-slate-200 scroll-mt-16"
    >
      {/* Background Soft Gradients (Light Theme) */}
      <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-emerald-100/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Backward compatible anchor */}
      <span id="vendor-showcase-section" className="absolute -top-16 left-0 invisible" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-black tracking-wider uppercase shadow-2xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Lab Search Portal • Direct Access</span>
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#123B6D] tracking-tight leading-tight">
            Lab Search
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Find Verified Diagnostic Centers • Enter your registered 10-digit mobile number or laboratory name to instantly access your dedicated laboratory website.
          </p>
        </div>

        {/* Central Search Card Box (Light Theme) */}
        <div className="max-w-3xl mx-auto bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative">
          {/* Subtle Top Accent line */}
          <div className="absolute top-0 left-12 right-12 h-[3px] bg-gradient-to-r from-transparent via-[#123B6D] to-transparent rounded-full" />

          {/* Search Header Info */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Find Your Laboratory Website
              </h3>
            </div>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs font-semibold">
                  <span className="text-slate-700 mr-1.5 flex items-center gap-1 font-bold">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <span className="text-slate-300">|</span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (hasSearched) setHasSearched(false);
                  }}
                  placeholder="Enter 10-digit mobile or lab name (e.g. 7087033009)"
                  className="w-full pl-20 pr-10 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-[#123B6D]/50 focus:border-[#123B6D] focus:ring-4 focus:ring-[#123B6D]/10 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium tracking-wide focus:outline-none transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer transition"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white font-black px-7 py-3.5 rounded-2xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#123B6D]/20 active:scale-98 whitespace-nowrap"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search Lab Website</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>


          {/* Search Result Card (Shows if Searched) */}
          {hasSearched && (
            <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-3 duration-300">
              {searchedLab ? (
                <div className="bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 border-2 border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Registered Laboratory</span>
                      </span>

                      {searchedLab.nablCode && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <Award className="w-3 h-3 text-blue-700" />
                          <span>{searchedLab.nablCode}</span>
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ID: {searchedLab.id}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>{searchedLab.name}</span>
                      </h4>
                      {searchedLab.tagline && (
                        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                          {searchedLab.tagline}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 text-[#123B6D] font-mono font-bold">
                        <Phone className="w-3.5 h-3.5 text-[#123B6D] shrink-0" />
                        <span>{searchedLab.phone}</span>
                      </div>
                      {searchedLab.ownerName && (
                        <div>
                          Owner: <strong className="text-slate-800">{searchedLab.ownerName}</strong>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span>
                          {searchedLab.city}, {searchedLab.state || 'India'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visit Website and Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 justify-center">
                    <button
                      type="button"
                      onClick={() => handleVisitWebsite(searchedLab)}
                      className="bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold px-6 py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                    >
                      <Globe className="w-4.5 h-4.5" />
                      <span>Visit Website</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openLoginModal(undefined, 'login')}
                      className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300 hover:border-slate-400"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>Lab Admin Login</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 sm:p-6 text-rose-800 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-rose-950 text-base">
                        {searchError || 'No laboratory registered with this detail.'}
                      </p>
                      <p className="text-xs text-rose-700 leading-relaxed">
                        Only one laboratory is registered per mobile number. If you have not registered your laboratory yet,
                        register now to get your dedicated live laboratory website.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openRegisterLabModal}
                    className="bg-[#123B6D] hover:bg-[#0e2c52] text-white font-black px-5 py-3 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md active:scale-98"
                  >
                    <span>Register New Lab Now</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
export default LabSearchSection;
