import React from 'react';
import { X, ShieldCheck, Lock, AlertCircle, FileText, Shield, RotateCcw, CheckCircle2, Phone, Mail } from 'lucide-react';

export type PolicyTabType = 'terms' | 'privacy' | 'refund';

interface VendorPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: PolicyTabType;
  onSelectTab: (tab: PolicyTabType) => void;
  labName?: string;
  labPhone?: string;
  labEmail?: string;
  customTerms?: string;
  customPrivacy?: string;
  customRefund?: string;
}

export const VendorPolicyModal: React.FC<VendorPolicyModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  labName = 'Apex Diagnostic & Clinical Pathology Laboratory',
  labPhone = '7087033009',
  labEmail = 'care@apexdiagnostics.in',
  customTerms,
  customPrivacy,
  customRefund,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Close (×) button */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {labName}
            </span>
            <h2 id="policy-modal-title" className="text-base font-black text-slate-900 tracking-tight">
              Legal, Privacy &amp; Policies
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-lg font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-white shrink-0 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => onSelectTab('terms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms &amp; Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('privacy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('refund')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund &amp; Cancellation</span>
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          {/* TAB 1: Terms & Conditions */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              {customTerms ? (
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl whitespace-pre-line text-slate-700 text-xs leading-relaxed">
                  {customTerms}
                </div>
              ) : (
                <>
                  <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider mb-1">
                      <ShieldCheck className="w-4 h-4 text-[#123B6D]" />
                      <span>Clinical Correlation &amp; Medical Disclaimer</span>
                    </div>
                    <p>
                      Diagnostic investigations and laboratory test findings are clinical laboratory observations intended to assist registered medical practitioners. Laboratory reports must always be clinically correlated by treating physicians with patient symptoms, clinical history, and other diagnostic modalities before initiating or altering any medical treatment.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Doctor Prescription Requirement</span>
                    </div>
                    <p>
                      While routine preventive wellness tests (such as Lipid Profile, CBC, HbA1c) can be booked directly for screening purposes, specialized investigations, biopsies, hormonal assays, or radiologic tests may require a valid prescription from a Registered Medical Practitioner (MBBS / MD).
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Sample Collection &amp; Patient Preparation</span>
                    </div>
                    <p>
                      Accurate diagnostic findings depend upon adherence to test preparation guidelines (e.g. 10-12 hours overnight fasting for Fasting Blood Sugar and Lipid Profile, avoiding certain medications or strenuous exercise). Patients are requested to follow instructions communicated by the phlebotomist or counter executive.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <span>Digital Report Validity &amp; IT Act Compliance</span>
                    </div>
                    <p>
                      All digital PDF reports dispatched via WhatsApp, SMS link, or downloaded from this laboratory portal are digitally generated and electronically verified under Section 65B of the Indian Evidence Act and the Information Technology Act, 2000. Each report includes an authentic verification QR code for tamper detection.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Privacy Policy */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {customPrivacy ? (
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl whitespace-pre-line text-slate-700 text-xs leading-relaxed">
                  {customPrivacy}
                </div>
              ) : (
                <>
                  <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-xs uppercase tracking-wider mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Confidentiality of Health &amp; Diagnostic Records</span>
                    </div>
                    <p className="text-emerald-900/90">
                      {labName} adheres to strict medical data privacy standards. Your diagnostic tests, numerical results, doctor referral notes, and digital reports are considered confidential patient medical data and are protected against unauthorized access.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span>Purpose of Data Collection</span>
                    </div>
                    <p>
                      We collect your full name, age, gender, contact number, address (for home sample collection), and email solely for:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Generating uniquely barcoded sample tubes and test requisitions.</li>
                      <li>Delivering verified PDF reports directly to your registered WhatsApp &amp; SMS.</li>
                      <li>Notifying you regarding critical lab test alerts or sample collection schedules.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Zero Third-Party Data Selling</span>
                    </div>
                    <p>
                      We never sell, rent, lease, or monetize your patient contact numbers or diagnostic data to third-party telemarketers, insurance agents, or pharmaceutical advertisers. Access is restricted strictly to authorized lab personnel (duty technician, pathologist, and assigned reception staff).
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>Secure Transmission &amp; Encryption</span>
                    </div>
                    <p>
                      All patient communication and report downloads are conducted over secure 256-bit SSL encrypted channels. Reports stored on the cloud can only be retrieved by matching the unique Report ID with the verified registered phone number.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: Refund & Cancellation Policy */}
          {activeTab === 'refund' && (
            <div className="space-y-4">
              {customRefund ? (
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl whitespace-pre-line text-slate-700 text-xs leading-relaxed">
                  {customRefund}
                </div>
              ) : (
                <>
                  <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-rose-950 font-extrabold text-xs uppercase tracking-wider mb-1">
                      <RotateCcw className="w-4 h-4 text-rose-600" />
                      <span>Home Collection Cancellation &amp; 100% Refund</span>
                    </div>
                    <p className="text-rose-900/90">
                      If you need to cancel a home sample collection appointment, please notify us at least <strong>2 hours prior</strong> to the scheduled collection time slot. In such cases, 100% of the advance amount paid will be refunded without any deduction.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Post-Sample Collection Non-Refundable Policy</span>
                    </div>
                    <p>
                      Once the phlebotomist has visited the patient location and drawn the biological sample (blood, urine, swab, tissue), or once the sample has been barcoded and loaded into automated analyzers at the lab, <strong>no cancellation or refund</strong> can be processed as single-use vacuum tubes, reagents, and clinical consumables are already utilized.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>Duplicate Online / UPI Payment Reversal</span>
                    </div>
                    <p>
                      In the rare event of a network glitch where an online UPI payment or counter QR payment is deducted more than once for the same booking, the excess amount will be verified against our bank statement and refunded back to your source account within <strong>3 to 5 working days</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                      <Phone className="w-4 h-4 text-[#123B6D]" />
                      <span>How to Request a Refund</span>
                    </div>
                    <p>
                      To request a refund or cancellation, please contact our laboratory helpdesk with your Patient Name, Mobile Number, and Payment Reference / UPI Transaction ID:
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-slate-700 font-bold">
                      <a href={`tel:${labPhone}`} className="inline-flex items-center gap-1.5 hover:text-[#123B6D]">
                        <Phone className="w-3.5 h-3.5 text-[#123B6D]" />
                        <span>+91 {labPhone}</span>
                      </a>
                      <span className="text-slate-300">|</span>
                      <a href={`mailto:${labEmail}`} className="inline-flex items-center gap-1.5 hover:text-[#123B6D]">
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{labEmail}</span>
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Effective Date: 2026 • {labName}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
          >
            I Understand &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
