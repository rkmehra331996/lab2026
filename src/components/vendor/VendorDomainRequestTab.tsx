import React, { useState } from 'react';
import {
  Globe,
  Send,
  XCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Check,
  Copy,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';

interface VendorDomainRequestTabProps {
  initialSubTab?: 'add' | 'list';
  onNavigateSubTab?: (subTab: 'add' | 'list') => void;
}

export const VendorDomainRequestTab: React.FC<VendorDomainRequestTabProps> = () => {
  const {
    vendorLabSettings,
    updateVendorLabSettings,
    domainRequests,
    addDomainRequest,
    deleteDomainRequest,
    currentUser,
    selectedVendorLabId,
  } = useCms();

  const [formDomain, setFormDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // In-app Delete Confirmation Modal State
  const [isDeletingDomain, setIsDeletingDomain] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    showToast(`Copied "${text}" to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Find approved and pending requests for this lab
  const approvedRequest = domainRequests.find((r) => r.status === 'Approved');
  const pendingRequest = domainRequests.find((r) => r.status === 'Pending');

  // Existing/Already added domain
  const existingDomain =
    vendorLabSettings?.websiteDomain ||
    approvedRequest?.requestedDomain ||
    (vendorLabSettings?.domainPreview &&
    !vendorLabSettings.domainPreview.includes('indianlalaji.com')
      ? vendorLabSettings.domainPreview
      : null) ||
    (vendorLabSettings?.websiteUrl &&
    !vendorLabSettings.websiteUrl.includes('indianlalaji.com')
      ? vendorLabSettings.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
      : null);

  // Submit Domain Request (Only 1 text field -> SUBMIT button)
  const handleSubmitDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = formDomain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    if (!cleanDomain) {
      showToast('Please enter a domain name.');
      return;
    }

    if (!cleanDomain.includes('.')) {
      showToast('Please enter a valid domain (e.g. yourlabname.com).');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      addDomainRequest({
        labId: selectedVendorLabId || vendorLabSettings?.labId || 'lab-apex',
        labName: vendorLabSettings?.labName || 'Apex Diagnostic Center',
        domainType:
          cleanDomain.includes('.') && !cleanDomain.endsWith('.indianlalaji.com')
            ? 'custom_domain'
            : 'subdomain',
        requestedDomain: cleanDomain,
        currentDomain:
          existingDomain || `indianlalaji.com/shop/${selectedVendorLabId || 'lab-apex'}`,
        registrar: 'Direct Submission',
        contactPerson:
          vendorLabSettings?.founderName || currentUser?.name || 'Lab Admin',
        contactPhone:
          vendorLabSettings?.phone ||
          vendorLabSettings?.helplinePhone ||
          '+91 7087033009',
        contactEmail:
          vendorLabSettings?.email ||
          currentUser?.email ||
          'admin@indianlalaji.com',
        notes: `Domain request for ${cleanDomain} sent to Super Admin.`,
        cnameTarget: 'indianlalaji.com',
        aRecordIp: '34.149.120.45',
        dnsStatus: 'Pending DNS Propagation',
        sslStatus: 'Pending Provisioning',
      });

      setIsSubmitting(false);
      setFormDomain('');
      showToast(`Domain request for "${cleanDomain}" sent to Super Admin successfully!`);
    }, 350);
  };

  // Cancel Request (req. send to super admin)
  const handleCancelRequest = (requestId: string) => {
    deleteDomainRequest(requestId);
    showToast('Domain request cancelled successfully.');
  };

  // Delete Domain (Agar domain already added/existing hai)
  const handleConfirmDeleteDomain = () => {
    if (approvedRequest) {
      deleteDomainRequest(approvedRequest.id);
    }
    // Delete any requests matching this domain
    if (existingDomain) {
      domainRequests
        .filter(
          (r) =>
            r.requestedDomain.toLowerCase() === existingDomain.toLowerCase()
        )
        .forEach((r) => deleteDomainRequest(r.id));
    }

    const resetTarget = selectedVendorLabId || 'lab-apex';
    updateVendorLabSettings({
      websiteDomain: '',
      domainPreview: `indianlalaji.com/shop/${resetTarget}`,
      websiteUrl: `https://indianlalaji.com/shop/${resetTarget}`,
    });

    setIsDeletingDomain(false);
    showToast(`Domain "${existingDomain}" deleted successfully.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#123B6D] text-white px-5 py-3 rounded-2xl shadow-2xl border border-sky-400 flex items-center gap-3 animate-bounce">
          <span className="text-amber-400 font-bold">✓</span>
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. AGAR DOMAIN ALREADY ADDED / EXISTING HAI: US DOMAIN KE NEECHE DELETE DOMAIN BUTTON SHOW HOGA */}
      {existingDomain && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Existing Domain
              </h3>
            </div>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active &amp; Connected</span>
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base sm:text-lg font-black text-slate-900">
                https://{existingDomain}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(`https://${existingDomain}`, 'existing_domain')}
                className="text-slate-400 hover:text-slate-700 p-1 rounded transition cursor-pointer"
                title="Copy Domain URL"
              >
                {copiedKey === 'existing_domain' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href={`https://${existingDomain}`}
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:text-sky-800 p-1 rounded transition"
                title="Visit Live Domain"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Delete Domain button below that domain */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsDeletingDomain(true)}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete Domain</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ADD DOMAIN: SIRF 1 TEXT FIELD AUR SIRF SUBMIT BUTTON */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Add Domain
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter domain to send request to Super Admin
          </p>
        </div>

        {/* AFTER SUBMISSION: CANCEL REQUEST KA OPTION VISIBLE HOGA (REQ. SEND TO SUPER ADMIN) */}
        {pendingRequest && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-200 text-amber-950 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                    <span>Request Sent to Super Admin</span>
                  </span>
                  <span className="text-[11px] text-amber-900 font-medium">
                    (Pending Approval)
                  </span>
                </div>
                <div className="font-mono text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>https://{pendingRequest.requestedDomain}</span>
                  <span className="text-xs text-amber-700 font-bold font-sans">
                    (req. send to super admin)
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Request submitted: {pendingRequest.createdAt}. Super Admin will verify DNS CNAME and activate routing.
                </p>
              </div>

              {/* Cancel Request button */}
              <button
                type="button"
                onClick={() => handleCancelRequest(pendingRequest.id)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Request</span>
              </button>
            </div>
          </div>
        )}

        {/* Form: Sirf 1 text field aur sirf SUBMIT button */}
        <form onSubmit={handleSubmitDomain} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
              Domain Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                https://
              </span>
              <input
                type="text"
                required
                value={formDomain}
                onChange={(e) => setFormDomain(e.target.value.toLowerCase().trim())}
                placeholder="e.g. apexpathology.in or yourlab.com"
                className="w-full pl-18 pr-4 py-3 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:border-transparent transition bg-slate-50/50"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Enter your domain name (e.g. yourlabname.com or yourlab.in)
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !formDomain.trim()}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'Submitting...' : 'SUBMIT'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Delete Domain Confirmation Modal */}
      {isDeletingDomain && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Delete Domain
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete this domain?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete domain{' '}
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                https://{existingDomain}
              </span>
              ? Your custom domain routing will be disconnected and reset to platform default.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeletingDomain(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDomain}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Domain</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
