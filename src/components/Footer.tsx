import React, { useState } from 'react';
import { MessageSquare, Phone, MapPin, Heart, Shield } from 'lucide-react';
import { AppView } from '../types';
import { useCms } from '../context/CmsContext';
import { TermsConditionsModal } from './TermsConditionsModal';

interface FooterProps {
  onSelectView: (view: AppView) => void;
  onOpenDemo?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectView, onOpenDemo }) => {
  const { companySettings } = useCms();
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const displayBrand = companySettings?.companyName || 'INDIANLALAJI.COM';
  const superAdminDomain = companySettings?.superAdminDomain || 'indianlalaji.com';

  const scrollTo = (id: string) => {
    onSelectView('website');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <footer className="bg-[#0b1c33] text-slate-300 text-xs border-t border-slate-800 pb-20 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#123B6D] text-white flex items-center justify-center font-bold text-sm border border-white/20">
                <span className="text-amber-400">I</span>L
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white uppercase">
                {displayBrand.replace(/\.com$/i, '')}<span className="text-teal-400">.COM</span>
              </span>
            </div>

            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              Laboratory Management Software for India.
            </p>
            <p className="text-slate-400 max-w-sm text-[11px] leading-relaxed">
              Empowering standalone pathology labs and diagnostic healthcare centres with offline capabilities, ₹ INR billing, and instant WhatsApp report delivery.
            </p>

            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <div>Founder: <strong>Rahul K.</strong></div>
              <div>Market: <strong>India 🇮🇳</strong></div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollTo('hero-section')} className="hover:text-white transition cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('features-section')} className="hover:text-white transition cursor-pointer">
                  Feature
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('lab-search-section')} className="hover:text-white transition cursor-pointer">
                  Lab Search
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('pricing-section')} className="hover:text-white transition cursor-pointer">
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('contact-section')} className="hover:text-white transition cursor-pointer">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Laboratory Portal
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollTo('contact-section')}
                  className="hover:text-white transition text-amber-300 font-semibold cursor-pointer"
                >
                  Create Lab
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('contact-section')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Lab Login
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/917087033009"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition text-emerald-400 font-semibold flex items-center gap-1"
                >
                  <span>WhatsApp Help</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Support & Helpline
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="tel:+917087033009" className="text-slate-300 hover:text-white transition">
                  +91 7087033009
                </a>
              </li>
              <li>
                <a href="mailto:rkmehra331996@gmail.com" className="text-slate-300 hover:text-white transition break-all">
                  rkmehra331996@gmail.com
                </a>
              </li>
              <li>
                <button onClick={() => scrollTo('contact-section')} className="hover:text-white transition cursor-pointer">
                  Contact Form
                </button>
              </li>
            </ul>

            <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] space-y-1">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>+91 7087033009</span>
              </div>
              <div className="text-slate-400">All India Diagnostic Support</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Company Links and Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-400">
            <span>© 2026 IndianLalaJi.com — LIMS</span>
            <span className="text-slate-600">|</span>
            <span>Powered by PageGuru.in</span>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setIsTermsModalOpen(true)}
              className="text-slate-300 hover:text-amber-400 underline underline-offset-2 transition cursor-pointer font-medium"
            >
              Terms &amp; Conditions
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            <button onClick={() => scrollTo('security-section')} className="hover:text-white transition">
              Security
            </button>
            <button onClick={() => scrollTo('data-safety-section')} className="hover:text-white transition">
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setIsTermsModalOpen(true)}
              className="hover:text-white transition cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <a
              href="https://wa.me/917087033009"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              Contact Support
            </a>
          </div>
        </div>

        {/* Terms & Conditions Modal */}
        <TermsConditionsModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
        />
      </div>
    </footer>
  );
};
