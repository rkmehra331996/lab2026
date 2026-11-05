import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  IndianRupee,
  Receipt,
  FileCheck,
  ChevronDown,
  X,
  Sparkles,
  ArrowRight,
  Filter,
  Globe,
  FileText,
  Copy,
  Check,
  Lock,
  Eye,
  RefreshCw,
  Rocket,
  MessageSquare,
  Calendar,
  UserCheck,
  LogOut,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { VendorLabDirectoryItem, AppView } from '../types';
import { INDIAN_STATES } from './CmsAuthModal';

interface EmployeeDashboardProps {
  onBackToWebsite: () => void;
  onNavigateView?: (view: AppView) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  onBackToWebsite,
  onNavigateView,
}) => {
  const {
    currentUser,
    logout,
    companyEmployees,
    vendorLabsList,
    addVendorLab,
    updateVendorLab,
    deleteVendorLab,
    activateTwoDayDemo,
    addLabCallNote,
    companySettings,
  } = useCms();

  // Clean current employee
  const currentEmpPhoneDigits = (currentUser?.phone || '').replace(/\D/g, '');
  const currentEmpLast10 = currentEmpPhoneDigits.length >= 10 ? currentEmpPhoneDigits.slice(-10) : currentEmpPhoneDigits;

  const currentEmployee = useMemo(() => {
    if (currentUser?.employeeId) {
      const match = companyEmployees.find((e) => e.id === currentUser.employeeId);
      if (match) return match;
    }
    if (currentEmpLast10) {
      const match = companyEmployees.find((e) => {
        const ph = (e.phone || '').replace(/\D/g, '');
        return ph.endsWith(currentEmpLast10) || currentEmpLast10.endsWith(ph);
      });
      if (match) return match;
    }
    return companyEmployees[0] || null;
  }, [currentUser, companyEmployees, currentEmpLast10]);

  // Current month default: YYYY-MM
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Month Filter state for Paid Labs calculation ("jo paid lab hi count hogi")
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'paid' | 'demo' | 'unpaid'>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<VendorLabDirectoryItem | null>(null);
  const [notesClient, setNotesClient] = useState<VendorLabDirectoryItem | null>(null);
  const [deleteClientConfirm, setDeleteClientConfirm] = useState<VendorLabDirectoryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // STRICT TENANT ISOLATION: View Own Clients ONLY
  // Permission: View Other Members' Clients: No
  // -------------------------------------------------------------
  const myClients = useMemo(() => {
    if (!currentEmployee) return [];
    const empId = currentEmployee.id;
    const empPhoneDigits = (currentEmployee.phone || '').replace(/\D/g, '');
    const empLast10 = empPhoneDigits.length >= 10 ? empPhoneDigits.slice(-10) : empPhoneDigits;

    return vendorLabsList.filter((lab) => {
      // Direct assignment match
      if (lab.assignedEmployeeId && lab.assignedEmployeeId === empId) return true;
      if (lab.assignedEmployeePhone) {
        const labAssignedDigits = lab.assignedEmployeePhone.replace(/\D/g, '');
        if (empLast10 && labAssignedDigits.endsWith(empLast10)) return true;
      }
      return false;
    });
  }, [vendorLabsList, currentEmployee]);

  // -------------------------------------------------------------
  // MONTHLY PAID LABS CALCULATION ("jo paid lab hi count hogi")
  // -------------------------------------------------------------
  const paidLabsThisMonth = useMemo(() => {
    return myClients.filter((lab) => {
      // Must be paid!
      const isPaid = lab.isPaid === true;
      if (!isPaid) return false;

      if (selectedMonth === 'all') return true;

      // Check payment date or published date within the selected month
      const paidDate = lab.paidAt || lab.planPurchasedAt || lab.publishedAt || '';
      return paidDate.startsWith(selectedMonth);
    });
  }, [myClients, selectedMonth]);

  const paidAmountThisMonth = useMemo(() => {
    return paidLabsThisMonth.reduce(
      (sum, l) => sum + (l.paidAmount || l.subscriptionAmount || 1499),
      0
    );
  }, [paidLabsThisMonth]);

  // Available months options
  const monthOptions = useMemo(() => {
    const list: Array<{ value: string; label: string }> = [];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      list.push({ value: `${year}-${month}`, label: monthName });
      d.setMonth(d.getMonth() - 1);
    }
    return list;
  }, []);

  // Filtered clients list for UI display
  const filteredClients = useMemo(() => {
    return myClients.filter((lab) => {
      // Tab filter
      if (statusTab === 'paid') {
        if (!lab.isPaid) return false;
      } else if (statusTab === 'demo') {
        if (!lab.isDemoActive || lab.isPaid) return false;
      } else if (statusTab === 'unpaid') {
        if (lab.isPaid) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (lab.name || '').toLowerCase();
        const phone = (lab.phone || '').toLowerCase();
        const city = (lab.city || '').toLowerCase();
        const state = (lab.state || '').toLowerCase();
        const owner = (lab.ownerName || '').toLowerCase();
        if (
          !name.includes(q) &&
          !phone.includes(q) &&
          !city.includes(q) &&
          !state.includes(q) &&
          !owner.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [myClients, statusTab, searchQuery]);

  // -------------------------------------------------------------
  // CREATE CLIENT FORM STATE
  // -------------------------------------------------------------
  const [createForm, setCreateForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    city: 'Ludhiana',
    state: 'Punjab',
    address: '',
    password: '',
    pin: '123456',
    subscriptionPlan: 'Free Demo Plan',
    autoActivateDemo: true,
  });

  const handleOpenCreateModal = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const nums = '23456789';
    let lettersPart = '';
    for (let i = 0; i < 5; i++) lettersPart += letters.charAt(Math.floor(Math.random() * letters.length));
    let numsPart = '';
    for (let i = 0; i < 5; i++) numsPart += nums.charAt(Math.floor(Math.random() * nums.length));

    setCreateForm({
      name: '',
      ownerName: '',
      phone: '',
      city: currentEmployee?.department?.includes('Punjab') ? 'Ludhiana' : 'Delhi NCR',
      state: 'Punjab',
      address: '',
      password: `${lettersPart}${numsPart}`,
      pin: String(Math.floor(100000 + Math.random() * 900000)),
      subscriptionPlan: 'Free Demo Plan',
      autoActivateDemo: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      alert('Please enter Laboratory Name.');
      return;
    }
    const cleanPhone = createForm.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const isDemo = createForm.autoActivateDemo;
    const newLabData: Omit<VendorLabDirectoryItem, 'id'> = {
      name: createForm.name.trim(),
      tagline: `Accurate Diagnostics & Clinical Pathology — ${createForm.name.trim()}`,
      phone: `+91 ${cleanPhone}`,
      ownerName: createForm.ownerName.trim() || `${createForm.name.trim()} Director`,
      city: createForm.city.trim() || 'Ludhiana',
      state: createForm.state.trim() || 'Punjab',
      address: createForm.address.trim() || `${createForm.city}, ${createForm.state}`,
      nablCode: 'Under Processing',
      badge: isDemo ? '2-Day Demo Live' : 'Draft Client',
      rating: 4.8,
      activePackages: 12,
      turnaroundTime: 'Same Day TAT',
      emergency: false,
      color: '#123B6D',
      status: isDemo ? 'Active' : 'Draft',
      isWebsiteApproved: isDemo ? true : false,
      password: createForm.password.trim(),
      pin: createForm.pin.trim(),
      subscriptionPlan: createForm.subscriptionPlan,
      domainPreview: `${cleanPhone}.indianlalaji.com`,
      slug: cleanPhone,
      // Employee assignment
      assignedEmployeeId: currentEmployee?.id || '',
      assignedEmployeeName: currentEmployee?.name || 'Team Member',
      assignedEmployeePhone: currentEmployee?.phone || '',
      isPaid: false,
      isDemoActive: isDemo,
      demoActivatedAt: isDemo ? now.toISOString() : undefined,
      demoExpiresAt: isDemo ? expiry.toISOString() : undefined,
      remainingVisibilityDays: isDemo ? 2 : 0,
      leadStatus: isDemo ? 'Demo Active' : 'New Lead',
      followUpNotes: [
        {
          id: `note-${Date.now()}`,
          date: now.toISOString(),
          authorName: currentEmployee?.name || 'Team Member',
          status: isDemo ? 'Demo Active' : 'New Lead',
          notes: `Client registered by ${currentEmployee?.name || 'Team Member'}.${isDemo ? ' 2-Day Demo automatically activated & live website published.' : ''}`,
        },
      ],
      _updatedAt: now.toISOString(),
    };

    const created = addVendorLab(newLabData);
    setIsCreateModalOpen(false);
    showToast(`✅ Client "${created.name}" created successfully!`);
  };

  // -------------------------------------------------------------
  // ACTIVATE 2-DAY DEMO ACTION
  // Permission: Activate 2-Day Demo: Yes, Auto-Publish 2-Day Demo Lab: Yes
  // -------------------------------------------------------------
  const handleActivateDemo = (lab: VendorLabDirectoryItem) => {
    const res = activateTwoDayDemo(lab.id);
    showToast(`🚀 ${res.message}`);
  };

  // -------------------------------------------------------------
  // DELETE CLIENT ACTION
  // Permission: Delete Unpaid Eligible Lab: Yes | Delete Paid Lab: No
  // -------------------------------------------------------------
  const handleDeleteClient = (lab: VendorLabDirectoryItem) => {
    if (lab.isPaid) {
      alert('❌ Permission Denied: Paid labs cannot be deleted by team members. Please contact Super Admin.');
      return;
    }
    setDeleteClientConfirm(lab);
  };

  const confirmDeleteClient = () => {
    if (!deleteClientConfirm) return;
    if (deleteClientConfirm.isPaid) {
      alert('❌ Cannot delete a paid laboratory.');
      setDeleteClientConfirm(null);
      return;
    }
    deleteVendorLab(deleteClientConfirm.id);
    showToast(`🗑️ Unpaid client "${deleteClientConfirm.name}" deleted.`);
    setDeleteClientConfirm(null);
  };

  // -------------------------------------------------------------
  // CALL NOTE SUBMISSION
  // Permission: Follow-up & Call Notes: Yes
  // -------------------------------------------------------------
  const [noteStatus, setNoteStatus] = useState('Follow-up');
  const [noteText, setNoteText] = useState('');
  const [nextDate, setNextDate] = useState('');

  const handleSaveCallNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesClient || !noteText.trim()) return;

    addLabCallNote(notesClient.id, {
      status: noteStatus,
      notes: noteText.trim(),
      nextFollowUpDate: nextDate,
      authorName: currentEmployee?.name || 'Team Member',
    });

    setNoteText('');
    setNextDate('');
    showToast('📞 Call note saved successfully!');
    setNotesClient(null);
  };

  // -------------------------------------------------------------
  // WHATSAPP SHARE CLIENT CREDENTIALS HELPER
  // -------------------------------------------------------------
  const handleShareWhatsApp = (lab: VendorLabDirectoryItem) => {
    const cleanPh = (lab.phone || '').replace(/\D/g, '').slice(-10);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://indianlalaji.com';
    const siteUrl = `${origin}/shop/${lab.slug || cleanPh}`;

    const msg = `🏥 *INDIANLALAJI.COM LAB SOFTWARE PORTAL*
━━━━━━━━━━━━━━━━━━━━━━
Namaste! Here are the official login credentials for *${lab.name}*:

🔐 *LOGIN CREDENTIALS:*
• *Login ID / Mobile:* ${cleanPh}
• *Password:* ${lab.password || 'Set in account'}
• *PIN Code:* ${lab.pin || '123456'}
• *Status:* ${lab.isPaid ? '✅ Paid Verified' : lab.isDemoActive ? '🚀 2-Day Live Demo Active' : '⏳ Registration Pending'}

🌐 *DEDICATED LAB WEBSITE:*
${siteUrl}

🚀 *DASHBOARD ACCESS:*
${origin}?view=vendor_dashboard

👤 *Executive Contact:*
${currentEmployee?.name || 'Software Consultation Executive'} (+91 ${currentEmployee?.phone || ''})
━━━━━━━━━━━━━━━━━━━━━━
_IndianLalaji Pathology Lab OS - 100% Offline & Online Sync_`;

    window.open(`https://api.whatsapp.com/send?phone=91${cleanPh}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0e294b] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToWebsite}
              className="flex items-center gap-2 text-left group"
              title="Return to Main Website"
            >
              <div className="w-9 h-9 rounded-xl bg-[#123B6D] text-white flex items-center justify-center font-black text-sm tracking-wider shadow-xs">
                <span className="text-amber-400">I</span>L
              </div>
              <div>
                <div className="font-black text-base tracking-tight text-[#123B6D] flex items-center gap-2">
                  <span>INDIANLALAJI.COM</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Team Member Portal
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Software Consultation & Client Onboarding
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Logged in Employee Info */}
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#0e294b] text-white flex items-center justify-center font-bold text-xs">
                {currentEmployee?.name?.charAt(0) || 'E'}
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-slate-900 leading-tight">
                  {currentEmployee?.name || 'Consultation Executive'}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  ID: {currentEmployee?.employeeId || 'IL-EXEC'} • +91 {currentEmployee?.phone}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
              id="btn-emp-create-client"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Create Client / Lab</span>
            </button>

            <button
              type="button"
              onClick={onBackToWebsite}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition hidden md:flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Main Website</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="text-rose-600 hover:text-rose-800 p-2 rounded-xl hover:bg-rose-50 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Banner with Monthly Paid Performance Tracker */}
        <div className="bg-gradient-to-br from-[#0e294b] via-[#123B6D] to-[#0F766E] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-white/15">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Authorized Team Member Session • Role: Sales & Consultation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome back, {currentEmployee?.name || 'Executive'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Register diagnostic laboratories, activate 2-day live demos, manage client follow-up call notes, and track your verified monthly paid conversions.
              </p>
            </div>

            {/* MONTH FILTER CARD FOR PAID LABS */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[280px] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <span>Paid Performance Month</span>
                </span>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Paid Only
                </span>
              </div>

              {/* Month Picker / Selector */}
              <div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-[#0e294b] border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                >
                  <option value="all">All Months (Overall Total)</option>
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} {opt.value === currentMonthStr ? '(Current Month)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* PAID METRIC BOX */}
              <div className="bg-white rounded-xl p-3 text-slate-900 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paid Labs Count</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                    {paidLabsThisMonth.length}{' '}
                    <span className="text-xs font-bold text-slate-500">
                      {paidLabsThisMonth.length === 1 ? 'Paid Lab' : 'Paid Labs'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Jo Paid Lab Hi Count Hogi
                  </div>
                </div>

                <div className="text-right border-l border-slate-200 pl-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Paid Value</div>
                  <div className="text-base font-black text-emerald-600 font-mono">
                    ₹{paidAmountThisMonth.toLocaleString('en-IN')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusTab('paid')}
                    className="text-[10px] font-bold text-[#123B6D] hover:underline cursor-pointer"
                  >
                    View Paid Labs →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Rules Summary Strip */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-[#123B6D] font-bold px-2.5 py-1 rounded-lg">
                Permission Scope: Team Member
              </span>
              <span className="text-slate-500 font-medium">
                Showing strictly your own clients ({myClients.length} assigned)
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Check className="w-3.5 h-3.5" /> Create & Edit Own Clients
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Check className="w-3.5 h-3.5" /> 2-Day Demo Auto-Publish
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Check className="w-3.5 h-3.5" /> Delete Unpaid Labs
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-semibold">
                <Lock className="w-3 h-3" /> Delete Paid Lab: No (Admin Only)
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Own Clients
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {myClients.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Labs Assigned to You</div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-2xs">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
              <span>Paid Labs ({selectedMonth === 'all' ? 'All' : selectedMonth})</span>
              <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                Filtered
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
              {paidLabsThisMonth.length}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Verified Paid Conversions</div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/30 p-4 shadow-2xs">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Active 2-Day Demos
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
              {myClients.filter((l) => l.isDemoActive && !l.isPaid).length}
            </div>
            <div className="text-[11px] text-amber-600 mt-0.5">Live Websites in Demo</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Follow-up Required
            </div>
            <div className="text-2xl font-black text-[#123B6D] mt-1 font-mono">
              {myClients.filter((l) => !l.isPaid && !l.isDemoActive).length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Leads in Pipeline</div>
          </div>
        </div>

        {/* Search, Filter & Tabs Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: 'all', label: `All Clients (${myClients.length})` },
                { id: 'paid', label: `Paid Labs (${paidLabsThisMonth.length})` },
                { id: 'demo', label: `Active Demos (${myClients.filter((l) => l.isDemoActive && !l.isPaid).length})` },
                { id: 'unpaid', label: `Unpaid / Leads (${myClients.filter((l) => !l.isPaid).length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusTab === tab.id
                    ? 'bg-[#0e294b] text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by lab name, phone, city..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
            />
          </div>
        </div>

        {/* Clients List Cards */}
        <div className="space-y-3">
          {filteredClients.map((lab) => {
            const cleanPh = (lab.phone || '').replace(/\D/g, '').slice(-10);
            const notesCount = lab.followUpNotes?.length || (lab.callNotes ? 1 : 0);
            const isPaid = lab.isPaid === true;
            const isDemo = Boolean(lab.isDemoActive && !isPaid);

            return (
              <div
                key={lab.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition shadow-2xs space-y-4 ${
                  isPaid
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : isDemo
                    ? 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Top Header of Client Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-slate-900">
                        {lab.name}
                      </h3>

                      {isPaid ? (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>PAID VERIFIED (₹{lab.paidAmount || lab.subscriptionAmount || 1499})</span>
                        </span>
                      ) : isDemo ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Rocket className="w-3 h-3 text-amber-600" />
                          <span>2-DAY DEMO LIVE</span>
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Unpaid Eligible
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        ID: {lab.id}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-slate-800">
                        Dr. / Owner: {lab.ownerName || 'Director'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lab.city}, {lab.state}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono font-bold text-slate-900">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+91 {cleanPh}</span>
                      </span>
                    </div>
                  </div>

                  {/* Top Right Actions: WhatsApp & Live Link */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(lab)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      title="Share Credentials & Website on WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Credentials</span>
                    </button>

                    <a
                      href={`/shop/${lab.slug || cleanPh}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                      title="Open Public Lab Website"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>Visit Website</span>
                    </a>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Client Login Password
                    </span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5 truncate">
                      {lab.password || 'LabOwner@2026#'}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      6-Digit Security PIN
                    </span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">
                      {lab.pin || '123456'}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Payment Status
                    </span>
                    <div className="mt-0.5 font-bold">
                      {isPaid ? (
                        <span className="text-emerald-700 font-bold">
                          Paid (₹{lab.paidAmount || lab.subscriptionAmount || 1499}) • {lab.paidAt || 'Verified'}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold">
                          Unpaid (Pending Admin Verification)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      2-Day Demo Status
                    </span>
                    <div className="mt-0.5 font-bold">
                      {isDemo ? (
                        <span className="text-amber-600 font-bold">
                          Live • Expires {lab.demoExpiresAt ? new Date(lab.demoExpiresAt).toLocaleDateString('en-IN') : 'in 2 days'}
                        </span>
                      ) : isPaid ? (
                        <span className="text-emerald-600 font-bold">Paid License Active</span>
                      ) : (
                        <span className="text-slate-500">Not Activated</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Follow-up Notes Preview if exists */}
                {lab.callNotes && (
                  <div className="bg-amber-50/50 border border-amber-200/70 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Latest Call Note:</span>
                      </span>
                      {lab.nextFollowUpDate && (
                        <span>Next Call Date: {lab.nextFollowUpDate}</span>
                      )}
                    </div>
                    <p className="text-slate-700">{lab.callNotes}</p>
                  </div>
                )}

                {/* Bottom Action Buttons (Strictly according to permissions) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. Activate 2-Day Demo & Auto-Publish (Permission: Yes) */}
                    {!lab.isPaid && !isDemo && (
                      <button
                        type="button"
                        onClick={() => handleActivateDemo(lab)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-98"
                        title="Auto-publish live website for 2 days"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>🚀 Activate 2-Day Demo & Auto-Publish</span>
                      </button>
                    )}

                    {/* 2. Call Notes & Follow-up (Permission: Yes) */}
                    <button
                      type="button"
                      onClick={() => setNotesClient(lab)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Follow-up & Call Notes ({notesCount})</span>
                    </button>

                    {/* 3. Edit Client Details (Permission: Yes) */}
                    <button
                      type="button"
                      onClick={() => setEditingClient(lab)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-slate-600" />
                      <span>Edit Details</span>
                    </button>
                  </div>

                  {/* 4. Delete Action: Unpaid: Yes | Paid: NO */}
                  <div>
                    {isPaid ? (
                      <div
                        className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-bold flex items-center gap-1"
                        title="Permission: Delete Paid Lab: No (Admin Only)"
                      >
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Delete Paid Lab: Protected</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteClient(lab)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                        title="Delete this unpaid/demo client"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete Unpaid Lab</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">No Clients Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {myClients.length === 0
                  ? 'You have not registered any clients yet. Click "+ Create Client / Lab" to add your first diagnostic laboratory!'
                  : 'No clients match your selected tab or search query.'}
              </p>
              {myClients.length === 0 && (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="bg-[#123B6D] text-white px-4 py-2 rounded-xl text-xs font-bold mt-2"
                >
                  + Register First Client
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* CREATE CLIENT / LAB MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0e294b] text-white p-4.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Register New Diagnostic Client / Lab</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl text-[11px] text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Assigned Executive: {currentEmployee?.name}</span>
                </div>
                <div className="text-slate-600">
                  This client will be strictly linked to your account. Paid conversions will count towards your monthly performance metrics.
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Laboratory Name (लैब का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Apollo Pathology & Diagnostic Centre"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Doctor / Owner Name (संचालक का नाम)
                    </label>
                    <input
                      type="text"
                      value={createForm.ownerName}
                      onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Registered Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="10-digit number e.g. 9815012345"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      State (राज्य) *
                    </label>
                    <select
                      value={createForm.state}
                      onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 cursor-pointer"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      City (शहर) *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      placeholder="e.g. Ludhiana / Mohali"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Address (पूरा पता)
                  </label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="SCO 42, Main Civil Hospital Road"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Client Login Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      6-Digit Security PIN *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={createForm.pin}
                      onChange={(e) => setCreateForm({ ...createForm, pin: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 font-bold"
                    />
                  </div>
                </div>

                {/* 2-Day Demo Auto-Publish Option */}
                <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="chk-auto-demo"
                    checked={createForm.autoActivateDemo}
                    onChange={(e) => setCreateForm({ ...createForm, autoActivateDemo: e.target.checked })}
                    className="mt-0.5 rounded text-[#123B6D] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="chk-auto-demo" className="cursor-pointer">
                    <span className="font-bold text-slate-900 block">
                      🚀 Activate 2-Day Demo & Auto-Publish Live Website Immediately
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Client can view their full dedicated lab website and software immediately for 2 days.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2 rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Register Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLIENT DETAILS MODAL */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0e294b] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>Edit Client Details: {editingClient.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateVendorLab(editingClient.id, {
                  name: editingClient.name,
                  ownerName: editingClient.ownerName,
                  city: editingClient.city,
                  state: editingClient.state,
                  address: editingClient.address,
                  password: editingClient.password,
                  pin: editingClient.pin,
                  _updatedAt: new Date().toISOString(),
                });
                showToast(`✅ Client details updated for ${editingClient.name}`);
                setEditingClient(null);
              }}
              className="p-5 overflow-y-auto space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Laboratory Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Doctor / Owner Name
                  </label>
                  <input
                    type="text"
                    value={editingClient.ownerName || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, ownerName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phone (Read-only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingClient.phone}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClient.city}
                    onChange={(e) => setEditingClient({ ...editingClient, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    State *
                  </label>
                  <select
                    value={editingClient.state}
                    onChange={(e) => setEditingClient({ ...editingClient, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 cursor-pointer"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Address
                </label>
                <input
                  type="text"
                  value={editingClient.address}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Client Password
                  </label>
                  <input
                    type="text"
                    value={editingClient.password || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    6-Digit PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editingClient.pin || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, pin: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2 rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CALL NOTES & FOLLOW-UP MODAL */}
      {notesClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0e294b] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>Call Logs & Follow-up: {notesClient.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setNotesClient(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Add New Note Box */}
              <form onSubmit={handleSaveCallNote} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Log New Follow-up Call / Interaction</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Call Outcome / Status
                    </label>
                    <select
                      value={noteStatus}
                      onChange={(e) => setNoteStatus(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-slate-300 font-semibold cursor-pointer"
                    >
                      <option value="Demo Active">Demo Active</option>
                      <option value="Interested">Interested / Follow-up</option>
                      <option value="Payment Promised">Payment Promised</option>
                      <option value="Callback Requested">Callback Requested</option>
                      <option value="Not Reachable">Not Reachable</option>
                      <option value="Closed / Paid">Closed / Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Next Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-slate-300 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    Discussion Summary / Notes *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter discussion details, questions asked, expected payment date..."
                    className="w-full p-2 bg-white rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="submit"
                    className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-1.5 rounded-xl font-bold transition shadow-2xs cursor-pointer"
                  >
                    + Save Call Note
                  </button>
                </div>
              </form>

              {/* Existing Notes History */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">
                  Interaction History ({notesClient.followUpNotes?.length || 0})
                </h4>

                {notesClient.followUpNotes && notesClient.followUpNotes.length > 0 ? (
                  notesClient.followUpNotes.map((n) => (
                    <div key={n.id} className="bg-white border border-slate-200 p-3 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {n.status}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(n.date).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs">{n.notes}</p>
                      {n.nextFollowUpDate && (
                        <div className="text-[10px] text-amber-700 font-semibold">
                          📅 Scheduled next call: {n.nextFollowUpDate}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    No notes recorded yet. Add your first call summary above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE UNPAID CLIENT MODAL */}
      {deleteClientConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-base">
                Delete Unpaid Client?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to delete <strong>"{deleteClientConfirm.name}"</strong>? This will permanently remove their records from your client pipeline.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteClientConfirm(null)}
                className="w-1/2 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteClient}
                className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
