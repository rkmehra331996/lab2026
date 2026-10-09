import React, { useState } from 'react';
import { Menu, X, Building2, KeyRound, Globe, LogOut, UserCheck, LayoutDashboard, FileText, Search } from 'lucide-react';
import { AppView, Language, UserRole } from '../types';
import { useCms } from '../context/CmsContext';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenDemo?: () => void;
  onSelectView: (view: AppView) => void;
  currentView: AppView;
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDemo,
  onSelectView,
  currentView,
  language = 'en',
  onSelectLanguage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    currentUser,
    logout,
    openLoginModal,
    openRegisterLabModal,
    companySettings,
    selectVendorLab,
    selectedVendorLabId,
  } = useCms();
  const displayBrand = companySettings?.companyName || 'INDIANLALAJI.COM';

  const handleGoToDashboard = () => {
    if (currentUser?.labId && currentUser.role !== 'admin' && currentUser.labId !== 'all') {
      selectVendorLab(currentUser.labId);
    }
    onSelectView(getDashboardViewForRole(currentUser.role));
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Super Admin';
      case 'vendor':
        return 'Lab Admin';
      case 'branch_manager':
        return 'Branch Mgr';
      case 'reception':
        return 'Reception';
      case 'technician':
        return 'Technician';
      case 'pathologist':
        return 'Pathologist';
      default:
        return role;
    }
  };

  const getDashboardViewForRole = (role: UserRole): AppView => {
    switch (role) {
      case 'admin':
        return 'admin_dashboard';
      case 'vendor':
        return 'vendor_dashboard';
      case 'reception':
        return 'reception_dashboard';
      case 'technician':
        return 'technician_dashboard';
      case 'branch_manager':
        return 'branch_manager_dashboard';
      case 'pathologist':
        return 'pathologist_dashboard';
      default:
        return 'website';
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'hero-section' || id === 'home') {
      if (currentView !== 'website') {
        onSelectView('website');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentView !== 'website') {
      onSelectView('website');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 bg-white border-b border-slate-200 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectView('website')}
              className="flex items-center gap-2.5 text-left group"
              id="navbar-logo-btn"
            >
              <div className="w-9 h-9 rounded-lg bg-[#123B6D] text-white flex items-center justify-center font-black text-base tracking-wider shadow-xs group-hover:bg-[#0e2c52] transition">
                <span className="text-amber-400">I</span>L
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl sm:text-2xl tracking-tighter text-[#123B6D] leading-none uppercase">
                  {displayBrand.replace(/\.com$/i, '')}<span className="text-[#0F766E]">.COM</span>
                </span>
                <span className="hidden sm:block text-[10px] text-[#64748B] font-medium tracking-wide mt-0.5">
                  Laboratory Management Software for India
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Menu: Home, Feature, Lab Search, Pricing, Contact Us */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-slate-700 whitespace-nowrap">
            <button
              onClick={() => scrollToSection('hero-section')}
              className="hover:text-[#123B6D] transition cursor-pointer text-slate-700 hover:font-bold whitespace-nowrap inline-block"
              id="nav-link-home"
            >
              Home
            </button>

            <button
              onClick={() => scrollToSection('features-section')}
              className="hover:text-[#123B6D] transition cursor-pointer text-slate-700 hover:font-bold whitespace-nowrap inline-block"
              id="nav-link-features"
            >
              Feature
            </button>

            <button
              onClick={() => scrollToSection('lab-search-section')}
              className="hover:text-[#123B6D] transition cursor-pointer text-slate-700 hover:font-bold whitespace-nowrap inline-flex items-center gap-1.5"
              id="nav-link-lab-search"
            >
              <Search className="w-3.5 h-3.5 text-teal-600" />
              <span>Lab Search</span>
            </button>

            <button
              onClick={() => scrollToSection('pricing-section')}
              className="hover:text-[#123B6D] transition cursor-pointer text-slate-700 hover:font-bold whitespace-nowrap inline-block"
              id="nav-link-pricing"
            >
              Pricing
            </button>

            <button
              onClick={() => scrollToSection('contact-section')}
              className="hover:text-[#123B6D] transition cursor-pointer text-slate-700 hover:font-bold whitespace-nowrap inline-block"
              id="nav-link-contact"
            >
              Contact Us
            </button>
          </div>

          {/* Right Desktop Actions: Language, Login, Create Lab */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Install Offline PWA App Button */}
            <PWAInstallButton variant="navbar" />

            {/* Language Selector */}
            {onSelectLanguage && (
              <div
                id="navbar-language-selector-wrap"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs transition"
                title="Select Language / भाषा चुनें"
              >
                <Globe className="w-3.5 h-3.5 text-[#123B6D] shrink-0" />
                <select
                  id="navbar-language-select"
                  aria-label="Select website language"
                  value={language}
                  onChange={(e) => onSelectLanguage(e.target.value as Language)}
                  className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="pa">ਪੰਜਾਬੀ</option>
                </select>
              </div>
            )}

            {/* Authenticated User Session or Login/Register Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="max-w-[100px] truncate font-bold text-slate-800">
                    {currentUser.name}
                  </span>
                  <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider bg-slate-200 text-slate-700">
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>

                <button
                  onClick={handleGoToDashboard}
                  className="px-2.5 py-1 bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="Go to Dashboard Workspace"
                >
                  <LayoutDashboard className="w-3 h-3" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={logout}
                  title="Sign out of account"
                  className="text-rose-600 hover:text-rose-800 p-1 font-bold transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => openLoginModal(undefined, 'login')}
                  className="text-xs font-bold text-slate-700 hover:text-[#123B6D] px-3.5 py-2 rounded-xl hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
                  id="navbar-btn-login"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Login</span>
                </button>

                <button
                  onClick={() => openRegisterLabModal()}
                  className="text-xs font-bold bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  id="navbar-btn-register-lab"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Create Lab</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Actions: ONLY the Menu Icon Button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-[#123B6D] focus:outline-none rounded-xl hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle navigation menu"
              id="navbar-mobile-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#123B6D]" /> : <Menu className="w-6 h-6 text-slate-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          {/* Mobile Language Selector */}
          {onSelectLanguage && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Globe className="w-4 h-4 text-[#123B6D]" />
                <span>Language / भाषा:</span>
              </div>
              <select
                aria-label="Select website language"
                value={language}
                onChange={(e) => onSelectLanguage(e.target.value as Language)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 cursor-pointer"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिंदी (HI)</option>
                <option value="pa">ਪੰਜਾਬੀ (PA)</option>
              </select>
            </div>
          )}

          <div className="flex flex-col space-y-1 text-sm font-semibold text-slate-800">
            <button
              onClick={() => scrollToSection('hero-section')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 font-bold text-[#123B6D] flex items-center justify-between"
            >
              <span>Home</span>
            </button>

            <button
              onClick={() => scrollToSection('features-section')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <span>Feature</span>
            </button>

            <button
              onClick={() => scrollToSection('lab-search-section')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-teal-600" />
                <span>Lab Search</span>
              </span>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Find Labs
              </span>
            </button>

            <button
              onClick={() => scrollToSection('pricing-section')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <span>Pricing</span>
            </button>

            <button
              onClick={() => scrollToSection('contact-section')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-between"
            >
              <span>Contact Us</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                7087033009
              </span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {/* Install Offline App for Mobile/Tablet */}
            <PWAInstallButton variant="banner" />

            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">
                        {getRoleLabel(currentUser.role)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800"
                  >
                    Logout
                  </button>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleGoToDashboard();
                  }}
                  className="w-full bg-[#123B6D] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Go to My Dashboard</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openLoginModal(undefined, 'login');
                  }}
                  className="w-full bg-[#123B6D] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openRegisterLabModal();
                  }}
                  className="w-full bg-amber-400 text-slate-950 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Create Lab</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

