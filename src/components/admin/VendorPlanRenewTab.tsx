import React, { useState, useMemo } from 'react';
import {
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Phone,
  ShieldCheck,
  ArrowRight,
  Search,
  Filter,
  Building2,
  Check,
  X,
  MessageSquare,
  Send,
  Lock,
  ExternalLink,
  ChevronRight,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { VendorLabDirectoryItem, PlanRenewalRequest } from '../../types';

interface VendorPlanRenewTabProps {
  showToast: (msg: string) => void;
  onOpenVendorWebsite?: (labId: string) => void;
}

export const VendorPlanRenewTab: React.FC<VendorPlanRenewTabProps> = ({
  showToast,
  onOpenVendorWebsite,
}) => {
  const {
    vendorLabsList,
    vendorLabSettingsMap,
    allPlanRequests,
    approvePlanRenewalRequest,
    rejectPlanRenewalRequest,
    renewOrExtendVendorPlan,
    expireVendorPlan,
    currentUser,
  } = useCms();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [activeSubSection, setActiveSubSection] = useState<'all' | 'requests' | 'vendors'>('all');

  // Modal State for Renew / Extend Plan
  const [selectedVendorForRenew, setSelectedVendorForRenew] = useState<VendorLabDirectoryItem | null>(null);
  const [renewPlanName, setRenewPlanName] = useState<'1 Month' | '3 Months' | '1 Year'>('3 Months');
  const [customDays, setCustomDays] = useState<number>(30);
  const [renewMode, setRenewMode] = useState<'package' | 'custom'>('package');

  // Reject Request Modal State
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Map package name to days & price
  const packageConfig: Record<string, { days: number; price: number; label: string; badge: string }> = {
    '1 Month': { days: 30, price: 1499, label: '1 Month (30 Days)', badge: 'Starter' },
    '3 Months': { days: 90, price: 3999, label: '3 Months (90 Days)', badge: '★ Most Popular' },
    '1 Year': { days: 365, price: 11999, label: '1 Year (365 Days)', badge: 'Best Value' },
  };

  // Helper to parse date
  const parseDateSafe = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Compute vendor plan info accurately
  const getVendorPlanDetails = (vendor: VendorLabDirectoryItem) => {
    const labSettings = vendorLabSettingsMap[vendor.id];
    const expiryStr = vendor.planExpiresAt || labSettings?.planExpiresAt;
    const currentPlan = vendor.purchasedPlan || vendor.subscriptionPlan || labSettings?.purchasedPlan || '1 Month';
    const purchasedAtStr = vendor.planPurchasedAt || labSettings?.planPurchasedAt || '15 Feb 2026';

    const expiryDate = parseDateSafe(expiryStr);
    let remainingDays = 0;
    let isExpired = false;

    if (!expiryDate) {
      // Default to 15 days or mock value if not set
      remainingDays = vendor.remainingVisibilityDays ?? 15;
      isExpired = remainingDays <= 0;
    } else {
      expiryDate.setHours(0, 0, 0, 0);
      const diffMs = expiryDate.getTime() - today.getTime();
      remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (remainingDays < 0) remainingDays = 0;
      isExpired = remainingDays <= 0;
    }

    if (vendor.status === 'Draft' || vendor.status === 'Pending' || vendor.status === 'Suspended' || !vendor.isWebsiteApproved || (vendor.remainingVisibilityDays !== undefined && vendor.remainingVisibilityDays <= 0)) {
      isExpired = true;
      remainingDays = 0;
    }

    return {
      currentPlan,
      purchasedAtStr,
      expiryStr: expiryStr || '17 Mar 2026',
      expiryDate,
      remainingDays,
      isExpired,
      status: isExpired ? 'Expired' : 'Active',
      statusReason: isExpired ? 'Expired — Contact 70870 33009' : undefined,
    };
  };

  // Filtered vendor list
  const filteredVendors = useMemo(() => {
    return vendorLabsList.filter((vendor) => {
      const details = getVendorPlanDetails(vendor);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        vendor.name.toLowerCase().includes(q) ||
        (vendor.phone && vendor.phone.toLowerCase().includes(q)) ||
        vendor.id.toLowerCase().includes(q) ||
        details.currentPlan.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'active') return !details.isExpired;
      if (statusFilter === 'expired') return details.isExpired;
      return true;
    });
  }, [vendorLabsList, vendorLabSettingsMap, searchQuery, statusFilter, today]);

  // Pending and all plan requests
  const pendingRequests = useMemo(
    () => allPlanRequests.filter((r) => r.status === 'Pending'),
    [allPlanRequests]
  );

  // Calculate live preview for Renew / Extend Plan modal
  const calculateRenewPreview = () => {
    if (!selectedVendorForRenew) return null;
    const current = getVendorPlanDetails(selectedVendorForRenew);
    const addedDays = renewMode === 'package' ? packageConfig[renewPlanName].days : customDays;
    const planName = renewMode === 'package' ? renewPlanName : `Custom (${customDays} Days)`;

    let startDate = new Date(today);
    let wasActive = false;

    // "Current plan ke remaining days waste nahi honge ,New plan current expiry date ke baad start hoga"
    if (current.expiryDate && current.expiryDate.getTime() > today.getTime() && !current.isExpired) {
      startDate = new Date(current.expiryDate);
      wasActive = true;
    }

    const calculatedNewExpiry = new Date(startDate);
    calculatedNewExpiry.setDate(calculatedNewExpiry.getDate() + addedDays);

    const diffFromToday = calculatedNewExpiry.getTime() - today.getTime();
    const newTotalRemainingDays = Math.max(0, Math.ceil(diffFromToday / (1000 * 60 * 60 * 24)));

    return {
      currentExpiryStr: current.expiryStr,
      currentRemainingDays: current.remainingDays,
      wasActive,
      planStartDateStr: startDate.toISOString().slice(0, 10),
      newExpiryDateStr: calculatedNewExpiry.toISOString().slice(0, 10),
      addedDays,
      newTotalRemainingDays,
      planName,
      daysPreserved: wasActive ? current.remainingDays : 0,
    };
  };

  const preview = calculateRenewPreview();

  // Handle Approve Request
  const handleApproveRequest = (request: PlanRenewalRequest) => {
    const result = approvePlanRenewalRequest(
      request.id,
      `Approved by Super Admin ${currentUser?.name || ''}`
    );
    if (result.success) {
      showToast(
        `Plan extended for ${request.labName}! New Expiry: ${result.newExpiryDate} (${result.remainingDays} days total, days preserved!).`
      );
    }
  };

  // Handle Reject Request
  const handleConfirmReject = () => {
    if (!rejectingRequestId) return;
    rejectPlanRenewalRequest(rejectingRequestId, rejectReason || 'Declined by Super Admin');
    showToast('Plan renewal request declined.');
    setRejectingRequestId(null);
    setRejectReason('');
  };

  // Handle Confirm Renew / Extend Plan Modal
  const handleConfirmRenewModal = () => {
    if (!selectedVendorForRenew || !preview) return;
    const addedDays = renewMode === 'package' ? packageConfig[renewPlanName].days : customDays;
    const planName = renewMode === 'package' ? renewPlanName : `Custom Plan (${customDays} Days)`;

    const res = renewOrExtendVendorPlan(selectedVendorForRenew.id, planName, addedDays);
    if (res.success) {
      showToast(
        `Success! ${selectedVendorForRenew.name} plan renewed to ${res.newExpiryDate} (${res.remainingDays} days total remaining). Remaining days preserved!`
      );
    }
    setSelectedVendorForRenew(null);
  };

  // Handle Expire Plan (Draft test)
  const handleSimulateExpire = (vendor: VendorLabDirectoryItem) => {
    expireVendorPlan(vendor.id);
    showToast(
      `${vendor.name} marked as EXPIRED! Website moved to Draft mode. Public access locked (Contact 70870 33009).`
    );
  };

  // Stats Counters
  const totalVendorsCount = vendorLabsList.length;
  const expiredVendorsCount = vendorLabsList.filter((v) => getVendorPlanDetails(v).isExpired).length;
  const activeVendorsCount = totalVendorsCount - expiredVendorsCount;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & GUARANTEE BANNER */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-[#123B6D] via-slate-900 to-[#123B6D] rounded-3xl p-6 sm:p-7 text-white shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Super Admin Plan Management
              </span>
              <span className="bg-white/10 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Days Wasted Guarantee Active</span>
              </span>
              {pendingRequests.length > 0 && (
                <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{pendingRequests.length} Pending Renewal Requests</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Plan Tab &amp; Renew Requests
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Super Admin central control for vendor subscription packages, plan renewal requests, and expiry lifecycle management.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/15 p-3 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Renewal Helpline</span>
              <a
                href="tel:7087033009"
                className="text-amber-400 font-mono font-black text-sm hover:underline flex items-center justify-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>70870 33009</span>
              </a>
            </div>
          </div>
        </div>

        {/* PROMINENT RULE CALLOUT */}
        <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-200 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>System Business Logic Enforced:</strong> <em>Current plan ke remaining days waste nahi honge, New plan current expiry date ke baad start hoga.</em> If a vendor has 15 days remaining and buys a 30-day plan, their new expiry is 45 days from today. If already expired, new plan starts immediately from today.
          </p>
        </div>

        {/* 4 Quick Stat Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-slate-900">
          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Vendor Labs</span>
            <div className="text-2xl font-black text-[#123B6D] mt-0.5">{totalVendorsCount}</div>
            <span className="text-[10px] text-slate-500 font-semibold">Registered Portals</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Active Subscriptions</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{activeVendorsCount}</div>
            <span className="text-[10px] text-emerald-700 font-semibold">Websites Live &amp; Public</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-[10px] font-bold text-rose-700 uppercase block">Expired / Draft Labs</span>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{expiredVendorsCount}</div>
            <span className="text-[10px] text-rose-700 font-semibold">Website Public Nahi Rahegi</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase block">Pending Renew Requests</span>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{pendingRequests.length}</div>
            <span className="text-[10px] text-amber-700 font-semibold">Awaiting Admin Action</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SUB-NAVIGATION PILLS (All, Renew Requests, Vendor List) */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubSection('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'all'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Sections</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative ${
              activeSubSection === 'requests'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Renew Requests Queue</span>
            {pendingRequests.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('vendors')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'vendors'
                ? 'bg-[#123B6D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Vendor List &amp; Extend Plan</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {vendorLabsList.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-2">
          Real-time synchronized across all lab portals
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SECTION 1: PLAN RENEWAL REQUESTS QUEUE (Admin → Plan Requests) */}
      {/* ======================================================== */}
      {(activeSubSection === 'all' || activeSubSection === 'requests') && (
        <div id="section-plan-requests" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  Admin → Plan Requests
                </span>
                <span className="text-xs font-bold text-slate-600">
                  Queue of renewal applications submitted by vendors
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Vendor Plan Renewal Requests</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                {pendingRequests.length} Pending Approval
              </span>
            </div>
          </div>

          {allPlanRequests.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No plan renewal requests currently in queue.</p>
              <p className="text-[11px] text-slate-400">
                When a lab vendor selects a package and clicks "Apply &gt; Submit to Admin" from Vendor Dashboard &gt; Site Settings &gt; Plan &amp; Pricing, it will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allPlanRequests.map((req) => (
                <div
                  key={req.id}
                  className={`p-5 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    req.status === 'Pending' ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-base text-[#123B6D]">{req.labName}</span>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                        {req.labId}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          req.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : req.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        }`}
                      >
                        Status: {req.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Submitted: {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Details row: Phone Number (labname), current plan, requested plan */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Phone &amp; Lab</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <a
                            href={`tel:${req.phone}`}
                            className="font-mono font-bold text-[#123B6D] hover:underline"
                          >
                            {req.phone || '70870 33009'}
                          </a>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate">{req.labName}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Plan &amp; Expiry</span>
                        <strong className="text-slate-800 block mt-0.5">{req.currentPlan || '1 Month'}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Expires: {req.currentExpiryDate || '17 Mar 2026'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-amber-700 uppercase block">Requested Package</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <strong className="text-amber-900 text-sm font-black">{req.requestedPlan}</strong>
                          <span className="text-xs text-slate-600 font-bold">(₹{req.amountINR?.toLocaleString('en-IN')})</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 block">
                          +{req.requestedDurationDays} Days Added (Zero Wasted Days)
                        </span>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700">Vendor Reference / UTR:</span> {req.notes}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                    {req.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApproveRequest(req)}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-98"
                        >
                          <Check className="w-4 h-4 text-emerald-200" />
                          <span>Approve &amp; Extend Plan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRejectingRequestId(req.id)}
                          className="px-3 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-right text-xs">
                        <span className="text-slate-400 block text-[10px]">Resolved</span>
                        <strong className="text-slate-700">
                          {req.status === 'Approved' ? '✅ Plan Extended' : '❌ Declined'}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SECTION 2: VENDOR LIST (with Phone, Lab Name, Current Plan, Expiry Date & Renew / Extend Plan Button) */}
      {/* ======================================================== */}
      {(activeSubSection === 'all' || activeSubSection === 'vendors') && (
        <div id="section-vendor-list" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#123B6D] text-white">
                  Vendor Directory &amp; Subscription Management
                </span>
                <span className="text-xs text-slate-500">
                  Showing {filteredVendors.length} of {vendorLabsList.length} diagnostic laboratories
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#123B6D]" />
                <span>Vendor List : Phone Number (Lab Name) Current Plan / Expiry Date</span>
              </h2>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lab, phone, plan..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/20 w-44 sm:w-56"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center rounded-xl border border-slate-300 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    statusFilter === 'all' ? 'bg-[#123B6D] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({totalVendorsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active ({activeVendorsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('expired')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    statusFilter === 'expired' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Expired ({expiredVendorsCount})
                </button>
              </div>
            </div>
          </div>

          {/* Vendors Grid / List */}
          {filteredVendors.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No diagnostic laboratories match the current filter or search criteria.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredVendors.map((vendor) => {
                const planDetails = getVendorPlanDetails(vendor);
                const isExpired = planDetails.isExpired;

                return (
                  <div
                    key={vendor.id}
                    className={`p-5 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isExpired ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Left: Phone Number (labname) + details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* 1. Phone number (labname) */}
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base sm:text-lg text-slate-900">
                            {vendor.name}
                          </span>
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                            {vendor.id}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5 ${
                            isExpired
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-600' : 'bg-emerald-500 animate-pulse'}`} />
                          <span>Status: {isExpired ? 'Expired (Draft)' : 'Active (Live)'}</span>
                        </span>

                        {isExpired && (
                          <span className="text-[10px] font-black text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded-full">
                            Reason: Expired — Contact 70870 33009
                          </span>
                        )}
                      </div>

                      {/* Detail Card Columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        {/* 1. Phone Number */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                            Phone Number
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <a
                              href={`tel:${vendor.phone || '7087033009'}`}
                              className="font-mono font-black text-sm text-[#123B6D] hover:underline"
                            >
                              {vendor.phone || '70870 33009'}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`https://wa.me/91${(vendor.phone || '7087033009').replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(vendor.name)}%2C%20regarding%20your%20laboratory%20package%20renewal.`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500 truncate">{vendor.city || 'India'}</span>
                          </div>
                        </div>

                        {/* 2. Current Plan */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                            Current Plan
                          </span>
                          <strong className="text-sm font-black text-slate-800 block">
                            {planDetails.currentPlan}
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Started: {planDetails.purchasedAtStr}
                          </span>
                        </div>

                        {/* 3. Expiry Date */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                            Expiry Date
                          </span>
                          <strong
                            className={`text-sm font-black font-mono block ${
                              isExpired ? 'text-rose-700' : 'text-slate-800'
                            }`}
                          >
                            {planDetails.expiryStr}
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            {isExpired ? 'Subscription Expired' : 'Active Period'}
                          </span>
                        </div>

                        {/* 4. Remaining Days & Website Status */}
                        <div
                          className={`p-2.5 rounded-xl border ${
                            isExpired
                              ? 'bg-rose-50 border-rose-200 text-rose-950'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase block text-slate-500">
                            Remaining Days
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span
                              className={`text-xl font-black font-mono ${
                                isExpired ? 'text-rose-700' : 'text-emerald-700'
                              }`}
                            >
                              {planDetails.remainingDays}
                            </span>
                            <span className="text-[11px] font-bold">Days Left</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold block mt-0.5 ${
                              isExpired ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            {isExpired
                              ? '⚠️ Website Public Nahi Rahegi (Draft)'
                              : '✅ Website Public & Accessible'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Buttons (Renew / Extend Plan) */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 self-start lg:self-center">
                      {/* Action Button: Renew / Extend plan */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVendorForRenew(vendor);
                          setRenewPlanName('3 Months');
                          setRenewMode('package');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                      >
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>Renew / Extend Plan</span>
                      </button>

                      {/* Quick Expire simulator button for Admin testing */}
                      {!isExpired ? (
                        <button
                          type="button"
                          onClick={() => handleSimulateExpire(vendor)}
                          className="px-2.5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Simulate Plan Expiration (Sets to 0d / Draft)"
                        >
                          <span>🔴 Expire</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            renewOrExtendVendorPlan(vendor.id, '1 Month', 30);
                            showToast(`Quickly reactivated ${vendor.name} with +30 Days!`);
                          }}
                          className="px-2.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Reactivate immediately (+30 Days)"
                        >
                          <span>🟢 Quick Reactivate (+30d)</span>
                        </button>
                      )}

                      {/* Link to view website if provided */}
                      {onOpenVendorWebsite && (
                        <button
                          type="button"
                          onClick={() => onOpenVendorWebsite(vendor.id)}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="View Laboratory Website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: RENEW / EXTEND PLAN (ZERO DAYS WASTED GUARANTEE) */}
      {/* ======================================================== */}
      {selectedVendorForRenew && preview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#123B6D] text-white">
                  Super Admin • Renew / Extend Lab Plan
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <span>Renew / Extend: {selectedVendorForRenew.name}</span>
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedVendorForRenew.phone || '70870 33009'}</span>
                  <span>•</span>
                  <span>ID: {selectedVendorForRenew.id}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVendorForRenew(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STRICT BUSINESS RULE BANNER */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs space-y-1 text-amber-950 shadow-2xs">
              <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Zero Days Wasted Guarantee</span>
              </div>
              <p className="leading-relaxed">
                <strong>Current plan ke remaining days waste nahi honge, New plan current expiry date ke baad start hoga.</strong>
              </p>
              {preview.wasActive ? (
                <p className="text-[11px] text-emerald-800 font-bold">
                  ✓ Current plan is active with {preview.currentRemainingDays} days remaining. The new package will start after current expiry ({preview.currentExpiryStr}).
                </p>
              ) : (
                <p className="text-[11px] text-rose-800 font-bold">
                  ✓ Currently expired (0 days). The new package will activate immediately starting today and website will be published live!
                </p>
              )}
            </div>

            {/* Select Plan Package Radio / Options */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-800 block">
                Select Package to Apply:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['1 Month', '3 Months', '1 Year'] as const).map((planKey) => {
                  const cfg = packageConfig[planKey];
                  const isSelected = renewMode === 'package' && renewPlanName === planKey;

                  return (
                    <label
                      key={planKey}
                      onClick={() => {
                        setRenewMode('package');
                        setRenewPlanName(planKey);
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-amber-50/70 border-[#123B6D] ring-2 ring-[#123B6D]/20 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {cfg.badge}
                        </span>
                        <input
                          type="radio"
                          name="adminRenewPlanRadio"
                          checked={isSelected}
                          onChange={() => {
                            setRenewMode('package');
                            setRenewPlanName(planKey);
                          }}
                          className="w-4 h-4 text-[#123B6D]"
                        />
                      </div>
                      <div>
                        <strong className="text-sm font-black text-slate-900 block">{planKey}</strong>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-[#123B6D]">₹{cfg.price.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-slate-500 font-bold">/ +{cfg.days}d</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Or Custom Days Option */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setRenewMode(renewMode === 'custom' ? 'package' : 'custom')}
                  className="text-xs font-bold text-[#123B6D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{renewMode === 'custom' ? '← Back to Standard Packages' : '+ Or Extend by Custom Days'}</span>
                </button>

                {renewMode === 'custom' && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Days to add:</span>
                    <input
                      type="number"
                      min={1}
                      max={1825}
                      value={customDays}
                      onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                    />
                    <span className="text-xs text-slate-500 font-bold">days added to current expiry</span>
                  </div>
                )}
              </div>
            </div>

            {/* REAL-TIME CALCULATION PREVIEW BOX */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Calculated Expiry Preview:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Current Expiry</span>
                  <strong className="text-xs font-mono font-black text-slate-800 block mt-0.5">
                    {preview.currentExpiryStr}
                  </strong>
                  <span className="text-[10px] text-slate-500">{preview.currentRemainingDays}d Left</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">New Plan Starts</span>
                  <strong className="text-xs font-mono font-black text-[#123B6D] block mt-0.5">
                    {preview.planStartDateStr}
                  </strong>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {preview.wasActive ? 'After current expiry' : 'Today'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-emerald-700 uppercase font-bold block">New Expiry Date</span>
                  <strong className="text-xs font-mono font-black text-emerald-700 block mt-0.5">
                    {preview.newExpiryDateStr}
                  </strong>
                  <span className="text-[10px] text-emerald-700 font-bold">+{preview.addedDays} Days</span>
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300">
                  <span className="text-[9px] text-emerald-800 uppercase font-bold block">Total Remaining</span>
                  <strong className="text-base font-mono font-black text-emerald-800 block">
                    {preview.newTotalRemainingDays}
                  </strong>
                  <span className="text-[10px] text-emerald-800 font-bold">Days Guaranteed</span>
                </div>
              </div>

              {preview.wasActive && (
                <div className="text-[11px] text-emerald-800 font-bold pt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Days Preserved: {preview.daysPreserved} remaining days carried over + {preview.addedDays} new days = {preview.newTotalRemainingDays} total days!
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedVendorForRenew(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRenewModal}
                className="px-6 py-2.5 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-md cursor-pointer active:scale-98"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Confirm &amp; Extend Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: DECLINE/REJECT REQUEST REASON */}
      {/* ======================================================== */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">Decline Renewal Request</h4>
                <p className="text-xs text-slate-500">Provide an optional reason for the vendor.</p>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (e.g. Payment not verified / Call 70870 33009)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRejectingRequestId(null);
                  setRejectReason('');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
