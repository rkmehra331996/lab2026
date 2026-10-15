import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Phone,
  ArrowRight,
  X,
  Stethoscope,
  Activity,
  Lock,
  Star,
  Layers,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { LabStaffAccount } from '../../types';

interface VendorStaffManagementTabProps {
  initialSubTab?: 'list' | 'add';
  onNavigateView?: (view: any) => void;
}

export const VendorStaffManagementTab: React.FC<VendorStaffManagementTabProps> = ({
  initialSubTab = 'list',
  onNavigateView,
}) => {
  const {
    staffAccounts,
    addStaffAccount,
    updateStaffAccount,
    deleteStaffAccount,
    transferStaffDataAndDelete,
    receptionEntries,
    reports,
    vendorLabSettings,
    selectedVendorLabId,
    currentUser,
  } = useCms();

  const [subTab, setSubTab] = useState<'list' | 'add'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [roleFilter, setRoleFilter] = useState<'all' | 'reception' | 'technician' | 'expert'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Password & PIN visibility map & copy indicator
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [showPinMap, setShowPinMap] = useState<Record<string, boolean>>({});
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Add Staff Form State
  const [addForm, setAddForm] = useState<{
    name: string;
    role: 'reception' | 'technician' | 'expert';
    username: string;
    phone: string;
    password: string;
    pin: string;
    shift: string;
    status: 'active' | 'suspended';
    notes: string;
  }>({
    name: '',
    role: 'expert',
    username: '',
    phone: '',
    password: '',
    pin: '998877',
    shift: 'Dual Department Shift (8:00 AM – 6:00 PM)',
    status: 'active',
    notes: '',
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addFormError, setAddFormError] = useState('');

  // Edit Staff Modal State (Allows editing ID / Username, Password, Name, PIN, Shift, Role, Status)
  const [editingStaff, setEditingStaff] = useState<LabStaffAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editRole, setEditRole] = useState<'reception' | 'technician' | 'expert'>('expert');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  // Delete Confirmation & Data Transfer Modal State
  const [deletingStaff, setDeletingStaff] = useState<LabStaffAccount | null>(null);
  const [transferRecipientId, setTransferRecipientId] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffAccounts.filter((staff) => {
      // Role match
      if (roleFilter !== 'all' && staff.role !== roleFilter) {
        return false;
      }
      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = String(staff.name || '').toLowerCase().includes(query);
        const matchUser = String(staff.username || '').toLowerCase().includes(query);
        const matchPhone = (staff.phone || '').includes(query);
        const matchId = (staff.id || '').toLowerCase().includes(query);
        return matchName || matchUser || matchPhone || matchId;
      }
      return true;
    });
  }, [staffAccounts, roleFilter, searchTerm]);

  // Role counts
  const receptionCount = staffAccounts.filter((s) => s.role === 'reception').length;
  const techCount = staffAccounts.filter((s) => s.role === 'technician').length;
  const expertCount = staffAccounts.filter((s) => s.role === 'expert').length;

  // Generate Suggested Password
  const generateSuggestedPassword = (name: string, role: string) => {
    const clean = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '') || role;
    const randNum = Math.floor(100 + Math.random() * 900);
    return `${clean.charAt(0).toUpperCase() + clean.slice(1)}@${randNum}`;
  };

  // Auto-generate username on name blur
  const handleNameBlur = () => {
    if (addForm.name.trim() && !addForm.username.trim()) {
      const clean = addForm.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const prefix =
        addForm.role === 'reception'
          ? 'rec_'
          : addForm.role === 'technician'
          ? 'tech_'
          : 'exp_';
      const rand = Math.floor(10 + Math.random() * 90);
      setAddForm((prev) => ({
        ...prev,
        username: `${prefix}${clean}_${rand}`,
      }));
    }
  };

  // Handle Add Staff Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setAddFormError('Please enter the staff member’s full name.');
      return;
    }
    if (!addForm.username.trim()) {
      setAddFormError('Please provide a unique username or login ID.');
      return;
    }
    if (!addForm.password.trim() || addForm.password.length < 4) {
      setAddFormError('Password must be at least 4 characters long.');
      return;
    }

    // Check duplicate username
    const exists = staffAccounts.some(
      (s) => s.username.toLowerCase() === addForm.username.trim().toLowerCase()
    );
    if (exists) {
      setAddFormError('This username / Login ID is already taken. Please choose another username.');
      return;
    }

    const targetLabId =
      currentUser && currentUser.labId && currentUser.labId !== 'all'
        ? currentUser.labId
        : selectedVendorLabId && selectedVendorLabId !== 'all'
        ? selectedVendorLabId
        : vendorLabSettings.labId || 'lab-apex';

    addStaffAccount({
      name: addForm.name.trim(),
      role: addForm.role,
      username: addForm.username.trim(),
      phone: addForm.phone.trim() || undefined,
      password: addForm.password.trim(),
      pin: addForm.role === 'expert' ? addForm.pin.trim() || '998877' : addForm.pin.trim() || undefined,
      shift: addForm.shift,
      status: addForm.status,
      notes:
        addForm.notes.trim() ||
        (addForm.role === 'expert'
          ? 'Expert member supervising Reception Billing and Technician Analyzers'
          : undefined),
      labId: targetLabId,
      labName: vendorLabSettings.labName,
    });

    const roleName =
      addForm.role === 'expert'
        ? 'Expert Member'
        : addForm.role === 'reception'
        ? 'Receptionist'
        : 'Lab Technician';

    setToastMessage(`✅ ${roleName} "${addForm.name.trim()}" added successfully with Login ID: ${addForm.username.trim()}!`);
    setAddForm({
      name: '',
      role: 'expert',
      username: '',
      phone: '',
      password: '',
      pin: '998877',
      shift: 'Dual Department Shift (8:00 AM – 6:00 PM)',
      status: 'active',
      notes: '',
    });
    setAddFormError('');
    setSubTab('list');
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Open Edit Modal (Supports editing Login ID / Username, Password, Name, PIN, Shift, Role, Status)
  const handleOpenEdit = (staff: LabStaffAccount) => {
    setEditingStaff(staff);
    setEditName(staff.name || '');
    setEditUsername(staff.username || '');
    setEditPassword(staff.password || '');
    setEditPin(staff.pin || (staff.role === 'expert' ? '998877' : ''));
    setEditPhone(staff.phone || '');
    setEditShift(
      staff.shift ||
        (staff.role === 'expert'
          ? 'Dual Department Shift (8:00 AM – 6:00 PM)'
          : 'General Shift')
    );
    setEditRole(
      staff.role === 'expert'
        ? 'expert'
        : staff.role === 'technician'
        ? 'technician'
        : 'reception'
    );
    setEditStatus(staff.status || 'active');
    setShowEditPassword(false);
    setEditModalError('');
  };

  // Save Edit Staff
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    if (!editName.trim()) {
      setEditModalError('Staff name cannot be empty.');
      return;
    }
    if (!editUsername.trim()) {
      setEditModalError('Login ID / Username cannot be empty.');
      return;
    }
    if (!editPassword.trim() || editPassword.length < 4) {
      setEditModalError('Password must be at least 4 characters long.');
      return;
    }

    // Check duplicate username if username has changed
    const usernameChanged =
      editUsername.trim().toLowerCase() !== editingStaff.username.toLowerCase();
    if (usernameChanged) {
      const duplicate = staffAccounts.some(
        (s) =>
          s.id !== editingStaff.id &&
          s.username.toLowerCase() === editUsername.trim().toLowerCase()
      );
      if (duplicate) {
        setEditModalError(
          'This Login ID / Username is already in use by another staff member. Please select a unique username.'
        );
        return;
      }
    }

    // Role check to guarantee at least 1 Technician and 1 Receptionist always exist
    if (
      editingStaff.role === 'reception' &&
      editRole !== 'reception' &&
      receptionCount <= 1
    ) {
      setEditModalError(
        'Cannot change role: At least 1 Receptionist must always exist in the laboratory.'
      );
      return;
    }
    if (
      editingStaff.role === 'technician' &&
      editRole !== 'technician' &&
      techCount <= 1
    ) {
      setEditModalError(
        'Cannot change role: At least 1 Lab Technician must always exist in the laboratory.'
      );
      return;
    }

    updateStaffAccount(editingStaff.id, {
      name: editName.trim(),
      username: editUsername.trim(),
      password: editPassword.trim(),
      pin: editPin.trim() || undefined,
      phone: editPhone.trim() || undefined,
      shift: editShift,
      role: editRole,
      status: editStatus,
      lastPasswordReset: new Date().toISOString(),
    });

    setToastMessage(
      `✅ Updated credentials for "${editName.trim()}"! New Login ID: "${editUsername.trim()}"`
    );
    setEditingStaff(null);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (staff: LabStaffAccount) => {
    const sameRoleCandidates = staffAccounts.filter(
      (s) => s.role === staff.role && s.id !== staff.id
    );

    setDeletingStaff(staff);
    setTransferRecipientId(sameRoleCandidates[0]?.id || '');
    setTransferError('');
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingStaff) return;

    const sameRoleCandidates = staffAccounts.filter(
      (s) => s.role === deletingStaff.role && s.id !== deletingStaff.id
    );

    const recipient = transferRecipientId
      ? staffAccounts.find((s) => s.id === transferRecipientId)
      : null;

    if (
      sameRoleCandidates.length > 0 &&
      recipient &&
      recipient.role === deletingStaff.role
    ) {
      transferStaffDataAndDelete(deletingStaff.id, recipient.id);
      setToastMessage(
        `✅ Transferred data from ${deletingStaff.name} to ${recipient.name} & deleted staff account.`
      );
    } else {
      deleteStaffAccount(deletingStaff.id);
      setToastMessage(`✅ Staff account "${deletingStaff.name}" deleted successfully.`);
    }

    setDeletingStaff(null);
    setTransferRecipientId('');
    setTransferError('');
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Copy Login Credentials
  const handleCopyCredentials = (staff: LabStaffAccount) => {
    const roleName =
      staff.role === 'expert'
        ? '⭐ Expert Member (Dual Dept Lead: Reception + Testing)'
        : staff.role === 'reception'
        ? '🖥️ Receptionist (Front Desk Billing)'
        : '🔬 Lab Technician (Pathology Testing)';

    let text = `*🏥 ${vendorLabSettings.labName || 'Apex Diagnostic Lab'} Portal Access*\n• Role: ${roleName}\n• Staff Name: ${staff.name}\n• Login ID / Username: ${staff.username}\n• Password: ${staff.password}`;
    if (staff.pin || staff.role === 'expert') {
      text += `\n• Security PIN: ${staff.pin || '998877'}`;
    }
    text += `\n• Shift: ${staff.shift || 'General Shift'}\n• Status: ${staff.status === 'active' ? 'Active' : 'Suspended'}\n• Login Portal URL: ${window.location.origin}`;

    navigator.clipboard?.writeText(text);
    setCopiedStaffId(staff.id);
    setToastMessage(`Login credentials for ${staff.name} copied to clipboard!`);
    setTimeout(() => {
      setCopiedStaffId(null);
      setToastMessage('');
    }, 3000);
  };

  // Toggle single staff password visibility in list
  const toggleShowPassword = (staffId: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  // Toggle single staff PIN visibility in list
  const toggleShowPin = (staffId: string) => {
    setShowPinMap((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2.5 border border-indigo-400/40 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner explaining Staff Management & Expert Member Controls */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#1a4a82] to-[#2E1065] text-white p-5 rounded-2xl shadow-sm border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded-lg bg-amber-400/20 text-amber-300">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-black text-white">
              Staff Passwords &amp; User Accounts Control
            </h2>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
              Vendor Admin Master Control
            </span>
          </div>
          <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
            Manage, edit, or add employee credentials for <strong>⭐ Expert Member (Dual Dept Lead)</strong>, <strong>Reception Desk</strong>, and <strong>Lab Technician</strong>. You can change Login IDs (Usernames), passwords, and security PINs at any time.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('add')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
              subTab === 'add'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add New Staff</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('list')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
              subTab === 'list'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff List ({staffAccounts.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. ADD NEW STAFF FORM (subTab === 'add') */}
      {/* ======================================================== */}
      {subTab === 'add' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <UserPlus className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Add New Staff Member
                </h2>
                <p className="text-xs text-slate-500">
                  Provision new employee login credentials for Expert Member (Dual Dept), Front Desk Reception, or Pathology Testing Lab.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Staff Provisioning
            </span>
          </div>

          {addFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addFormError}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-5">
            {/* Step 1: Select Role (3 Cards: Receptionist, Technician, Expert Member) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Select Staff Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Expert Member Card (Featured) */}
                <div
                  onClick={() =>
                    setAddForm({
                      ...addForm,
                      role: 'expert',
                      shift: 'Dual Department Shift (8:00 AM – 6:00 PM)',
                      pin: addForm.pin || '998877',
                    })
                  }
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    addForm.role === 'expert'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                      ⭐
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-xs text-indigo-950 truncate">
                          Expert Member
                        </h4>
                        {addForm.role === 'expert' && (
                          <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                        Dual Department
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                        Supervisory access to both Reception Billing &amp; Tokens and Lab Technician Testing &amp; Analyzer queues.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Receptionist Card */}
                <div
                  onClick={() =>
                    setAddForm({
                      ...addForm,
                      role: 'reception',
                      shift: 'Morning (7:00 AM – 3:00 PM)',
                    })
                  }
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    addForm.role === 'reception'
                      ? 'border-teal-600 bg-teal-50/70 shadow-xs ring-1 ring-teal-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl shrink-0">
                      🖥️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">
                          Receptionist (Front Desk)
                        </h4>
                        {addForm.role === 'reception' && (
                          <Check className="w-4 h-4 text-teal-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                        Billing &amp; Intake
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        Patient intake, token queue registration, test billing, cash collection, and WhatsApp report dispensing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Technician Card */}
                <div
                  onClick={() =>
                    setAddForm({
                      ...addForm,
                      role: 'technician',
                      shift: 'Laboratory Shift (8:00 AM – 5:00 PM)',
                    })
                  }
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    addForm.role === 'technician'
                      ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-xl shrink-0">
                      🔬
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">
                          Lab Technician (Pathology)
                        </h4>
                        {addForm.role === 'technician' && (
                          <Check className="w-4 h-4 text-purple-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-100/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                        Testing &amp; Reports
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        Sample barcoding, analyzer test parameters entry, doctor signature sign-off, and PDF report publication.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Staff Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    addForm.role === 'expert'
                      ? 'e.g. Rajinder Sharma (Lead)'
                      : addForm.role === 'reception'
                      ? 'e.g. Priya Sharma'
                      : 'e.g. Amit Khurana (DMLT)'
                  }
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  onBlur={handleNameBlur}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone / Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9815099988"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Step 3: Login Credentials (Username, Password & Security PIN) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Login Credentials Configuration</span>
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Custom ID &amp; Password
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Login ID / Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      addForm.role === 'expert'
                        ? 'e.g. expert@apexlab.com or exp_rajinder'
                        : addForm.role === 'reception'
                        ? 'e.g. rec_priya_1'
                        : 'e.g. tech_amit_1'
                    }
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Staff member enters this ID / username on the login portal.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Login Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setAddForm({
                          ...addForm,
                          password: generateSuggestedPassword(addForm.name, addForm.role),
                        })
                      }
                      className="text-[11px] font-bold text-[#123B6D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Suggest Strong</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 4 characters (e.g. Expert@2026)"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Optional PIN for Expert Member */}
                {addForm.role === 'expert' && (
                  <div className="md:col-span-2 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-bold text-indigo-950 mb-0.5">
                        Security PIN (6-Digit PIN)
                      </label>
                      <p className="text-[11px] text-indigo-900/80">
                        Required for secondary dual-department confirmation (Default: 998877).
                      </p>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={addForm.pin}
                      onChange={(e) =>
                        setAddForm({ ...addForm, pin: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="998877"
                      className="w-32 p-2 rounded-lg border border-indigo-300 font-mono font-bold text-xs text-center bg-white text-indigo-950 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Shift & Working Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Shift Timings
                </label>
                <select
                  value={addForm.shift}
                  onChange={(e) => setAddForm({ ...addForm, shift: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                >
                  <option>Dual Department Shift (8:00 AM – 6:00 PM)</option>
                  <option>Morning (7:00 AM – 3:00 PM)</option>
                  <option>Evening (2:00 PM – 10:00 PM)</option>
                  <option>General Shift (9:00 AM – 6:00 PM)</option>
                  <option>Night Emergency (8:00 PM – 8:00 AM)</option>
                  <option>Part Time / Sunday Special</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={addForm.status}
                  onChange={(e) =>
                    setAddForm({ ...addForm, status: e.target.value as 'active' | 'suspended' })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white font-bold"
                >
                  <option value="active">Active (Can Login Immediately)</option>
                  <option value="suspended">Suspended (Access Temporarily Blocked)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubTab('list')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Save &amp; Add Staff Member</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STAFF LIST VIEW (subTab === 'list') */}
      {/* ======================================================== */}
      {subTab === 'list' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name, username / login ID or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Role Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-[#123B6D] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Roles ({staffAccounts.length})
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter('expert')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  roleFilter === 'expert'
                    ? 'bg-indigo-700 text-white shadow-2xs'
                    : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <span>⭐</span>
                <span>Expert Members ({expertCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter('reception')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'reception'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                }`}
              >
                🖥️ Receptionists ({receptionCount})
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter('technician')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'technician'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                🔬 Technicians ({techCount})
              </button>

              <button
                type="button"
                onClick={() => setSubTab('add')}
                className="ml-1 px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Add New Staff</span>
              </button>
            </div>
          </div>

          {/* Staff Cards Grid */}
          {filteredStaff.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-black text-slate-700">No Staff Accounts Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? 'No staff matched your search query. Try searching for a different name or login ID.'
                  : 'You have not added any staff accounts for this filter. Click below to add your first staff member.'}
              </p>
              <button
                type="button"
                onClick={() => setSubTab('add')}
                className="px-4 py-2 bg-[#123B6D] text-white text-xs font-bold rounded-xl hover:bg-[#0e2c52] transition cursor-pointer"
              >
                + Add Staff Member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStaff.map((staff) => {
                const isExpert = staff.role === 'expert';
                const isReception = staff.role === 'reception';
                const isShowingPassword = !!showPasswordMap[staff.id];
                const isShowingPin = !!showPinMap[staff.id];
                const isCopied = copiedStaffId === staff.id;

                return (
                  <div
                    key={staff.id}
                    className={`bg-white rounded-2xl border transition p-5 shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                      isExpert
                        ? 'border-indigo-300 bg-gradient-to-br from-indigo-50/20 via-white to-white hover:border-indigo-400 ring-1 ring-indigo-200/50'
                        : isReception
                        ? 'border-teal-200/80 hover:border-teal-300'
                        : 'border-purple-200/80 hover:border-purple-300'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs ${
                              isExpert
                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                                : isReception
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {isExpert ? '⭐' : isReception ? '🖥️' : '🔬'}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-sm text-slate-900 truncate">
                                {staff.name}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                  isExpert
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xs'
                                    : isReception
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {isExpert
                                  ? '⭐ Expert Member (Dual Dept)'
                                  : isReception
                                  ? 'Receptionist'
                                  : 'Lab Technician'}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                              <span>
                                Shift: <strong>{staff.shift || 'General Shift'}</strong>
                              </span>
                              <span>•</span>
                              <span
                                className={`font-semibold flex items-center gap-1 ${
                                  staff.status === 'active' ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    staff.status === 'active'
                                      ? 'bg-emerald-500 animate-pulse'
                                      : 'bg-rose-500'
                                  }`}
                                ></span>
                                {staff.status === 'active' ? 'Active' : 'Suspended'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top Direct Action: Edit & Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(staff)}
                            className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                            title="Edit Staff ID & Password"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(staff)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title={`Delete Staff (${staff.name})`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      </div>

                      {/* Credentials Box (Username, Password, and PIN) */}
                      <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                        {/* Username / Login ID */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-semibold flex items-center gap-1">
                            <span>Login ID / Username:</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200 select-all text-xs">
                            {staff.username}
                          </span>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-semibold">Login Password:</span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200 min-w-[70px] text-center select-all text-xs">
                              {isShowingPassword ? staff.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(staff.id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                              title={isShowingPassword ? 'Hide password' : 'Show password'}
                            >
                              {isShowingPassword ? (
                                <EyeOff className="w-3.5 h-3.5 text-slate-700" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-slate-700" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Security PIN for Expert Member */}
                        {(isExpert || staff.pin) && (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                            <span className="text-indigo-900 font-semibold flex items-center gap-1">
                              <KeyRound className="w-3 h-3 text-indigo-600" />
                              <span>Security PIN (Dual Dept):</span>
                            </span>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-bold text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 min-w-[50px] text-center select-all text-xs">
                                {isShowingPin ? staff.pin || '998877' : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleShowPin(staff.id)}
                                className="p-1 hover:bg-indigo-100 rounded text-indigo-600 cursor-pointer"
                                title={isShowingPin ? 'Hide PIN' : 'Show PIN'}
                              >
                                {isShowingPin ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Phone if available */}
                        {staff.phone && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                            <span className="text-slate-500 font-medium">Contact Phone:</span>
                            <span className="font-mono text-slate-700">{staff.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(staff)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Login Info</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(staff)}
                          className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
                          title="Change ID / Password / Edit Staff"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Change ID &amp; Password</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDelete(staff)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-1 transition cursor-pointer"
                          title={`Delete staff (${staff.name})`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT STAFF MODAL: CHANGE ID / USERNAME, NAME & PASSWORD */}
      {/* ======================================================== */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <span>Edit Staff — ID &amp; Password</span>
                    {editingStaff.role === 'expert' && (
                      <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">
                        ⭐ Expert Member
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Change Login ID, password, PIN, and profile access for {editingStaff.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              {editModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editModalError}</span>
                </div>
              )}

              {/* Editable Login ID / Username */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Login ID / Username <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Editable Login ID
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="e.g. expert@apexlab.com or exp_rajinder"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Staff member signs in using this unique Login ID / Username.
                </p>
              </div>

              {/* Edit Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Staff Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter staff name"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              {/* Change Password */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-amber-950 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Change Login Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generateSuggestedPassword(editName, editRole))}
                    className="text-[11px] font-bold text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Suggest New</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password (min 4 characters)"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono font-bold text-xs bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-900/80">
                  Updating the password here takes effect immediately for this user account.
                </p>
              </div>

              {/* Security PIN (for Expert Member or staff) */}
              {(editRole === 'expert' || editingStaff.role === 'expert') && (
                <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-indigo-950 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Security PIN (6-Digit Dual Dept Code)</span>
                    </label>
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                      Dual Dept Verification
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Default: 998877"
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                  />
                  <p className="text-[10px] text-indigo-900/80">
                    Secondary authorization code for Dual Department Reception &amp; Testing actions.
                  </p>
                </div>
              )}

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Role</label>
                  <select
                    value={editRole}
                    onChange={(e) =>
                      setEditRole(e.target.value as 'reception' | 'technician' | 'expert')
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="expert">⭐ Expert Member (Dual Dept)</option>
                    <option value="reception">🖥️ Reception Desk</option>
                    <option value="technician">🔬 Lab Technician</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as 'active' | 'suspended')
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="active">Active (Can Login)</option>
                    <option value="suspended">Suspended (Blocked)</option>
                  </select>
                </div>
              </div>

              {/* Shift & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift Timings</label>
                  <input
                    type="text"
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value)}
                    placeholder="e.g. 8:00 AM - 6:00 PM"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="9815099988"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = editingStaff;
                    setEditingStaff(null);
                    if (toDelete) handleOpenDelete(toDelete);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer flex items-center gap-1 transition"
                  title="Delete Staff Account"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Staff</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION & SAME-ROLE DATA TRANSFER MODAL */}
      {/* ======================================================== */}
      {deletingStaff && (() => {
        const sameRoleCandidates = staffAccounts.filter(
          (s) => s.role === deletingStaff.role && s.id !== deletingStaff.id
        );
        const selectedRecipient = staffAccounts.find((s) => s.id === transferRecipientId);

        // Assigned data metrics
        const assignedEntriesCount =
          deletingStaff.role === 'reception'
            ? receptionEntries.filter(
                (e) =>
                  e.receptionistId === deletingStaff.id ||
                  (e.receptionistName &&
                    e.receptionistName.trim().toLowerCase() === deletingStaff.name.trim().toLowerCase()) ||
                  (e.publishedBy &&
                    e.publishedBy.trim().toLowerCase() === deletingStaff.name.trim().toLowerCase())
              ).length
            : 0;

        const assignedTechEntriesCount =
          deletingStaff.role === 'technician'
            ? receptionEntries.filter(
                (e) =>
                  e.technicianId === deletingStaff.id ||
                  (e.technicianName &&
                    e.technicianName.trim().toLowerCase() === deletingStaff.name.trim().toLowerCase())
              ).length
            : 0;

        const assignedReportsCount =
          deletingStaff.role === 'technician'
            ? reports.filter(
                (r) =>
                  (r as any).technicianId === deletingStaff.id ||
                  ((r as any).technicianName &&
                    (r as any).technicianName.trim().toLowerCase() === deletingStaff.name.trim().toLowerCase()) ||
                  (r.pathologistSignedBy &&
                    r.pathologistSignedBy.trim().toLowerCase() === deletingStaff.name.trim().toLowerCase())
              ).length
            : 0;

        const transferRoleLabel =
          deletingStaff.role === 'expert'
            ? 'Expert → Expert'
            : deletingStaff.role === 'reception'
            ? 'Reception → Reception'
            : 'Technician → Technician';

        const roleDisplay =
          deletingStaff.role === 'expert'
            ? '⭐ Expert Member (Dual Dept)'
            : deletingStaff.role === 'reception'
            ? 'Receptionist'
            : 'Lab Technician';

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-slate-900">
                    Are you sure you want to delete this staff account?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Staff account: <strong>{deletingStaff.name}</strong> ({roleDisplay}) • Login ID: @{deletingStaff.username}
                  </p>
                </div>
              </div>

              {/* Data Transfer Rule Banner / Notice */}
              {sameRoleCandidates.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Data Handover &amp; Reassignment</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950">
                      {transferRoleLabel}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/90 leading-relaxed">
                    Assigned patient queue items, active specimens, and reports will be handed over to another {roleDisplay}.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed space-y-1">
                  <span className="font-bold text-slate-900 block">Staff Account Notice</span>
                  <p>
                    <strong>{deletingStaff.name}</strong> is currently a registered {roleDisplay} for this laboratory. Deleting this account will permanently deactivate their login credentials. All past patient records, bills, and published reports remain intact and safely preserved.
                  </p>
                </div>
              )}

              {/* Associated workload notice if applicable */}
              {(assignedEntriesCount > 0 || assignedTechEntriesCount > 0 || assignedReportsCount > 0) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                    Associated Records:
                  </span>
                  {deletingStaff.role === 'reception' ? (
                    <div className="font-semibold text-slate-800">
                      • <strong>{assignedEntriesCount}</strong> Patient Registrations / Reception Tokens
                    </div>
                  ) : (
                    <div className="font-semibold text-slate-800 space-y-0.5">
                      <div>• <strong>{assignedTechEntriesCount}</strong> Patient Specimen Queue Items</div>
                      <div>• <strong>{assignedReportsCount}</strong> Diagnostic Lab Reports</div>
                    </div>
                  )}
                </div>
              )}

              {/* Recipient Selector (When Same Role Candidates Exist) */}
              {sameRoleCandidates.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Select Handover Recipient ({roleDisplay})
                  </label>
                  <select
                    value={transferRecipientId}
                    onChange={(e) => {
                      setTransferRecipientId(e.target.value);
                      setTransferError('');
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-hidden text-xs"
                  >
                    {sameRoleCandidates.map((cand) => (
                      <option key={cand.id} value={cand.id}>
                        {cand.name} (@{cand.username}) • Shift: {cand.shift || 'General'}
                      </option>
                    ))}
                  </select>
                  {selectedRecipient && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                      ✓ Historical and active records will be reassigned to <strong>{selectedRecipient.name}</strong>.
                    </p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {transferError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {/* Actions: No / Yes */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingStaff(null);
                    setTransferRecipientId('');
                    setTransferError('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
