import React, { useState } from 'react';
import {
  X,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  CreditCard,
  Building2,
  Copy,
  Check,
  User,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { CompanyEmployee } from '../types';
import { maskPanNumber } from '../data/companyEmployeesSeed';

interface VerifyEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VerifyEmployeeModal: React.FC<VerifyEmployeeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { findCompanyEmployeeByPhone, companyEmployees } = useCms();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchedPhone, setSearchedPhone] = useState('');
  const [employee, setEmployee] = useState<CompanyEmployee | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPan, setCopiedPan] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (phoneToTest?: string) => {
    const target = phoneToTest !== undefined ? phoneToTest : phoneNumber;
    const clean = target.replace(/\D/g, '').trim();
    if (!clean) return;

    setIsSearching(true);
    setSearchedPhone(target.trim());

    // Small realistic delay for professional lookup experience
    setTimeout(() => {
      const found = findCompanyEmployeeByPhone(clean);
      setEmployee(found || null);
      setHasSearched(true);
      setIsSearching(false);
    }, 250);
  };

  const handleReset = () => {
    setPhoneNumber('');
    setEmployee(null);
    setHasSearched(false);
    setSearchedPhone('');
  };

  const handleCopyId = (idText: string) => {
    navigator.clipboard?.writeText(idText);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyPan = (panText: string) => {
    navigator.clipboard?.writeText(panText);
    setCopiedPan(true);
    setTimeout(() => setCopiedPan(false), 2000);
  };

  // Provide first 3 sample employee phones for easy one-click testing
  const samplePhones = companyEmployees.slice(0, 3).map((e) => ({
    name: e.name,
    phone: e.phone,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-verify-employee-title"
      >
        {/* Modal Header */}
        <div className="bg-[#0e294b] text-white p-4 sm:p-5 relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2
                  id="modal-verify-employee-title"
                  className="font-black text-sm sm:text-base tracking-tight leading-tight flex items-center gap-2"
                >
                  <span>Official Employee Verification</span>
                  <span className="text-[10px] bg-emerald-400 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Official
                  </span>
                </h2>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  IndianLalaji Healthcare OS • Central Registry Check
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Search Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Employee's Registered Mobile Number (पंजीकृत मोबाइल नंबर)
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                  +91
                </div>
                <input
                  type="tel"
                  id="employee-phone-search-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={15}
                  autoFocus
                  className="w-full pl-11 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 focus:border-[#123B6D] transition"
                />
                {phoneNumber && (
                  <button
                    type="button"
                    onClick={() => setPhoneNumber('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!phoneNumber.trim() || isSearching}
                className="bg-[#0e294b] hover:bg-[#123B6D] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-98"
                id="btn-submit-verify-employee"
              >
                {isSearching ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Verify</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Test Sample Numbers */}
            {!hasSearched && samplePhones.length > 0 && (
              <div className="pt-1.5 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                <span className="font-semibold text-slate-400">Quick Test:</span>
                {samplePhones.map((s) => (
                  <button
                    key={s.phone}
                    type="button"
                    onClick={() => {
                      setPhoneNumber(s.phone);
                      handleVerify(s.phone);
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition cursor-pointer border border-slate-200"
                  >
                    {s.phone} ({s.name.split(' ')[0]})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Result Area */}
          {hasSearched && employee && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              {/* Profile Card Container */}
              <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border-2 border-emerald-500/40 p-4 sm:p-5 shadow-xs relative overflow-hidden space-y-4">
                {/* Official Verified Banner */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                      {employee.badge || 'Verified Employee • IndianLalaji OS'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                    ACTIVE EXECUTIVE
                  </span>
                </div>

                {/* Profile Main Header (Photo + Name + Designation) */}
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Photo with Badge */}
                  <div className="relative shrink-0">
                    {employee.photoUrl ? (
                      <img
                        src={employee.photoUrl}
                        alt={employee.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md bg-slate-100"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0e294b] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
                        {employee.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-xs border-2 border-white">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Name and Designation */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                      {employee.name}
                    </h3>

                    {/* Official Designation */}
                    <div className="mt-0.5">
                      <span className="inline-block text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#0e294b] border border-blue-200/80">
                        {employee.designation || 'Software Consultation Executive'}
                      </span>
                    </div>

                    {/* Employee ID with Copy */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        Emp ID:
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {employee.employeeId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(employee.employeeId)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 transition cursor-pointer"
                        title="Copy Employee ID"
                      >
                        {copiedId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Structured Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs">
                  {/* Phone */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      Registered Phone
                    </span>
                    <a
                      href={`tel:${employee.phone}`}
                      className="font-mono font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5 mt-0.5"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>+91 {employee.phone}</span>
                    </a>
                  </div>

                  {/* Official Email */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      Official Email
                    </span>
                    <a
                      href={`mailto:${employee.email}`}
                      className="font-medium text-slate-800 hover:text-blue-700 truncate flex items-center gap-1.5 mt-0.5"
                    >
                      <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </a>
                  </div>

                  {/* Masked PAN Number */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                        Masked PAN Number (Govt. ID)
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        Masked for Privacy
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm tracking-wider">
                          {employee.maskedPan || maskPanNumber(employee.panNumber)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyPan(employee.maskedPan || maskPanNumber(employee.panNumber))
                        }
                        className="text-slate-400 hover:text-slate-700 p-1 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Copy Masked PAN"
                      >
                        {copiedPan ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Department & Authority Footer */}
                <div className="bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {employee.department || 'Software Consultation & Laboratory Solutions'}
                    </span>
                  </div>
                  <span className="text-slate-400 shrink-0 text-[10px] font-mono">
                    HQ Verified
                  </span>
                </div>

                {/* Reset / Search Another */}
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Verify Another Employee</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Not Found Area */}
          {hasSearched && !employee && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-rose-50/80 rounded-2xl border-2 border-rose-300 p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-2xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-black text-rose-950">
                    Employee Not Found
                  </h3>
                  <p className="text-xs text-rose-700 mt-1 max-w-sm mx-auto">
                    No verified Software Consultation Executive found registered with mobile number{' '}
                    <strong className="font-mono text-rose-900 font-bold">
                      "{searchedPhone}"
                    </strong>
                    .
                  </p>
                </div>

                <div className="bg-white/80 border border-rose-200 rounded-xl p-3 text-left text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px] uppercase tracking-wider text-rose-800">
                    <span>⚠️ Security Warning:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    If someone is claiming to represent IndianLalaji.com and asking for payments, OTPs, or contracts, please do not proceed. Always confirm with the Super Admin HQ helpline.
                  </p>
                  <div className="pt-1">
                    <a
                      href="tel:7087033009"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0e294b] hover:underline"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>Call Super Admin Helpline: +91 7087033009</span>
                    </a>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Another Mobile Number</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security & Verification Assurance Footer */}
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-tight">
              IndianLalaji Enterprise Registry ensures 100% genuine authorization for software consultations, demonstrations, and clinical setup agreements across India.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
