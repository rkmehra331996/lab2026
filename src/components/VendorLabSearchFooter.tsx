import React, { useState } from 'react';
import { Search, Globe, Building2, Phone, MapPin, CheckCircle2, ArrowRight, AlertCircle, X, ShieldCheck, Copy, Check } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { AppView, VendorLabDirectoryItem } from '../types';
import { getTenantDirectUrl } from '../constants/domains';

interface VendorLabSearchFooterProps {
  onSelectView: (view: AppView) => void;
  onOpenDemo?: () => void;
}

export const VendorLabSearchFooter: React.FC<VendorLabSearchFooterProps> = ({
  onSelectView,
  onOpenDemo,
}) => {
  const { vendorLabsList, selectVendorLab, setSelectedVendorLabId } = useCms();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchedLab, setSearchedLab] = useState<VendorLabDirectoryItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const executeSearch = (phoneToSearch: string) => {
    const cleanDigits = phoneToSearch.replace(/\D/g, '').slice(-10);
    setSearchError('');
    setHasSearched(true);

    if (cleanDigits.length < 10) {
      setSearchError('Please enter a valid 10-digit registered mobile number.');
      setSearchedLab(null);
      return;
    }

    // Search by registered mobile number: One mobile number corresponds to exactly one lab
    const matchedLab = vendorLabsList.find((lab) => {
      const labPhoneDigits = (lab.phone || '').replace(/\D/g, '').slice(-10);
      return labPhoneDigits === cleanDigits;
    });

    if (matchedLab) {
      setSearchedLab(matchedLab);
      setSearchError('');
    } else {
      setSearchedLab(null);
      setSearchError(
        `No registered laboratory found for mobile number +91 ${cleanDigits}. Only 1 lab is registered per mobile number.`
      );
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(phoneNumber);
  };

  const handleVisitWebsite = (lab: VendorLabDirectoryItem) => {
    if (selectVendorLab) {
      selectVendorLab(lab.id);
    }
    if (setSelectedVendorLabId) {
      setSelectedVendorLabId(lab.id);
    }
    onSelectView('vendor_website');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClear = () => {
    setPhoneNumber('');
    setSearchedLab(null);
    setHasSearched(false);
    setSearchError('');
  };

  return (
    <div className="mb-12 bg-gradient-to-br from-slate-900 via-[#0e2746] to-slate-950 border border-teal-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header Badge & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1">
                <Globe className="w-3 h-3 text-teal-400" />
                <span>Vendor Lab Website Search</span>
              </span>
              <span className="text-[11px] text-amber-300/90 font-medium">
                • 1 Mobile = 1 Dedicated Lab Website
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400 shrink-0" />
              <span>Search & Visit Your Laboratory Website</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Enter your registered 10-digit mobile number to directly access your laboratory's dedicated website. Each mobile number corresponds to exactly one laboratory.
            </p>
          </div>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="mt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">
                <span className="text-slate-400 mr-1.5 flex items-center gap-1">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </span>
                <span className="text-slate-600">|</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (hasSearched) setHasSearched(false);
                }}
                placeholder="Enter 10-digit registered mobile (e.g. 7087033009)"
                maxLength={14}
                className="w-full pl-20 pr-10 py-3 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-teal-500/50 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30 text-white placeholder-slate-400 text-xs sm:text-sm font-medium tracking-wide focus:outline-none transition shadow-inner"
              />
              {phoneNumber && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20 active:scale-98 whitespace-nowrap"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Search My Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Demo Quick Search Hints */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">Quick Test Registered Numbers:</span>
          <button
            type="button"
            onClick={() => {
              setPhoneNumber('9888123456');
              executeSearch('9888123456');
            }}
            className="px-2 py-0.5 rounded-md bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-500/50 transition cursor-pointer font-mono text-[10px] font-bold"
          >
            9888123456 (Sanjivani Path)
          </button>
          <button
            type="button"
            onClick={() => {
              setPhoneNumber('7087033009');
              executeSearch('7087033009');
            }}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 hover:border-teal-500/50 transition cursor-pointer font-mono text-[10px]"
          >
            7087033009 (Apex Lab)
          </button>
          <button
            type="button"
            onClick={() => {
              setPhoneNumber('9815012345');
              executeSearch('9815012345');
            }}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 hover:border-teal-500/50 transition cursor-pointer font-mono text-[10px]"
          >
            9815012345 (CityCare)
          </button>
          <button
            type="button"
            onClick={() => {
              setPhoneNumber('9417098765');
              executeSearch('9417098765');
            }}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 hover:border-teal-500/50 transition cursor-pointer font-mono text-[10px]"
          >
            9417098765 (MetroPath)
          </button>
        </div>

        {/* Search Results Area */}
        {hasSearched && (
          <div className="mt-5 pt-5 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-300">
            {searchedLab ? (
              <div className="bg-slate-800/80 border-2 border-teal-500/50 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Verified Registered Laboratory</span>
                    </span>
                    {searchedLab.nablCode && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {searchedLab.nablCode}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ID: {searchedLab.id}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                      {searchedLab.name}
                    </h4>
                    {searchedLab.tagline && (
                      <p className="text-xs text-slate-300">{searchedLab.tagline}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-teal-300">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono font-bold">{searchedLab.phone}</span>
                    </div>
                    {searchedLab.ownerName && (
                      <div className="text-slate-400">
                        Owner: <strong className="text-slate-200">{searchedLab.ownerName}</strong>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span>{searchedLab.city}, {searchedLab.state || 'India'}</span>
                    </div>
                  </div>

                  {/* Direct Live URL & Subdomain Details */}
                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-700/80 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-slate-400 font-medium">Live URL:</span>
                        <span className="font-mono text-emerald-300 font-bold truncate">
                          {getTenantDirectUrl(searchedLab.domainPreview || searchedLab.id)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const directUrl = getTenantDirectUrl(searchedLab.domainPreview || searchedLab.id);
                          try {
                            navigator.clipboard.writeText(directUrl);
                          } catch {}
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-600 hover:border-teal-400 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Working Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <Globe className="w-3 h-3 text-teal-400 shrink-0" />
                      <span>Shop Path: </span>
                      <span className="text-teal-300">
                        {searchedLab.domainPreview?.replace(/^https?:\/\//, '') || `indianlalaji.com/shop/${searchedLab.id}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleVisitWebsite(searchedLab)}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-teal-500/30 active:scale-98"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Visit Lab Website</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {onOpenDemo && (
                    <button
                      type="button"
                      onClick={onOpenDemo}
                      className="bg-slate-700/80 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-600 hover:border-slate-500"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Lab Admin Login</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 sm:p-5 text-rose-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-white">
                      {searchError || 'No laboratory registered with this mobile number.'}
                    </p>
                    <p className="text-xs text-rose-300/80 leading-relaxed">
                      Only one laboratory is registered per mobile number. If you haven't registered your laboratory yet, register now to get your dedicated live website.
                    </p>
                  </div>
                </div>

                {onOpenDemo && (
                  <button
                    type="button"
                    onClick={onOpenDemo}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-md active:scale-98"
                  >
                    <span>Register New Lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
