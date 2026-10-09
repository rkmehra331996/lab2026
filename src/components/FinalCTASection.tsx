import React, { useState } from 'react';
import {
  ArrowRight,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Building2,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { TermsConditionsModal } from './TermsConditionsModal';

interface FinalCTASectionProps {
  onOpenDemo?: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = () => {
  const { openRegisterLabModal, openLoginModal, companySettings } = useCms();
  const displayBrand = companySettings?.companyName || 'INDIANLALAJI.COM';
  const phone = companySettings?.supportPhone || '+91 7087033009';
  const cleanPhone = phone.replace(/\D/g, '');
  const email = companySettings?.supportEmail || 'rkmehra331996@gmail.com';

  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    labName: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.phone.trim()) return;

    setSubmitted(true);

    const waText = encodeURIComponent(
      `Hello IndianLalaji Team,\n\nName: ${formState.name}\nPhone: ${formState.phone}\nLab Name: ${formState.labName}\nMessage: ${formState.message || 'I would like to inquire about IndianLalaji Lab Software.'}`
    );

    // After brief confirmation, open WhatsApp
    setTimeout(() => {
      window.open(`https://wa.me/${cleanPhone}?text=${waText}`, '_blank');
    }, 600);
  };

  return (
    <section id="contact-section" className="py-16 sm:py-24 bg-[#0B1E38] text-white relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#123B6D]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-amber-300 border border-white/20 text-xs font-bold mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Contact Us • 24x7 Diagnostic Support</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Contact Our Diagnostics Team
          </h2>

          <p className="text-base sm:text-lg text-slate-300 mt-3 font-medium">
            Have questions about setting up your laboratory, pricing plans, or need live assistance? We are here to help.
          </p>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={openRegisterLabModal}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-6 py-3 rounded-xl font-black text-sm transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Building2 className="w-4 h-4 text-slate-950" />
              <span>Create Your Lab Now</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              onClick={() => openLoginModal(undefined, 'login')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-xl font-bold text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Existing Lab Login</span>
            </button>
          </div>
        </div>

        {/* Contact Info Grid + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Contact Cards */}
          <div className="lg:col-span-5 space-y-4">
            {/* Phone Helpline Card */}
            <a
              href={`tel:${phone}`}
              className="group block p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-white/10 transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Direct Helpline</div>
                  <div className="text-lg font-bold text-white mt-0.5">{phone}</div>
                  <div className="text-xs text-amber-300 font-medium mt-1">Click to call immediately</div>
                </div>
              </div>
            </a>

            {/* WhatsApp Chat Card */}
            <a
              href={`https://wa.me/${cleanPhone}?text=Hello%20IndianLalaji,%20I%20want%20to%20inquire%20about%20the%20laboratory%20software`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-white/10 transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">WhatsApp Support</div>
                  <div className="text-lg font-bold text-white mt-0.5">+91 7087033009</div>
                  <div className="text-xs text-emerald-400 font-medium mt-1">Instant messaging & onboarding help</div>
                </div>
              </div>
            </a>

            {/* Email Card */}
            <a
              href={`mailto:${email}`}
              className="group block p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-400/50 hover:bg-white/10 transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Official Email</div>
                  <div className="text-sm sm:text-base font-bold text-white mt-0.5 break-all">{email}</div>
                  <div className="text-xs text-blue-300 font-medium mt-1">Super Admin & Enterprise inquiries</div>
                </div>
              </div>
            </a>

            {/* Hours & Location */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Hours & Coverage</div>
                  <div className="text-sm font-bold text-white mt-0.5">Mon - Sat: 9:00 AM - 9:00 PM IST</div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Serving 1,200+ Pathology Labs Across India</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Send Message Form */}
          <div className="lg:col-span-7 bg-white/5 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-2">Send Us a Direct Message</h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-6">
              Fill in your details below and our team will get in touch with you immediately on WhatsApp or Phone.
            </p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-center py-10 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Thank You for Reaching Out!</h4>
                <p className="text-sm text-emerald-200">
                  Your message has been initiated. WhatsApp is opening to connect you directly with our representative.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajesh Sharma"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Laboratory Name & City</label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma Diagnostic Center, Ludhiana"
                    value={formState.labName}
                    onChange={(e) => setFormState({ ...formState, labName: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Message or Requirement</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us what you are looking for (e.g., pricing details, barcode integration, multi-branch, report format)..."
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Clean Bottom Copyright Strip with Terms & Conditions */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center text-xs text-slate-400">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>© 2026 IndianLalaJi.com — LIMS</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span>Powered by PageGuru.in</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <button
              type="button"
              onClick={() => setIsTermsModalOpen(true)}
              className="text-slate-300 hover:text-amber-400 underline underline-offset-2 transition cursor-pointer font-medium"
            >
              Terms &amp; Conditions
            </button>
          </p>
        </div>

        {/* Terms & Conditions Modal Popup */}
        <TermsConditionsModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
        />
      </div>
    </section>
  );
};
export default FinalCTASection;
