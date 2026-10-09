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
  Filter,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Phone,
  ArrowRight,
  RefreshCw,
  Share2,
  X,
  Stethoscope,
  Activity,
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

  const [roleFilter, setRoleFilter] = useState<'all' | 'reception' | 'technician'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Password visibility map & copy indicator
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Add Staff Form State
  const [addForm, setAddForm] = useState<{
    name: string;
    role: 'reception' | 'technician';
    username: string;
    phone: string;
    password: string;
    shift: string;
    status: 'active' | 'suspended';
    notes: string;
  }>({
    name: '',
    role: 'reception',
    username: '',
    phone: '',
    password: '',
    shift: 'Morning (7:00 AM – 3:00 PM)',
    status: 'active',
    notes: '',
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addFormError, setAddFormError] = useState('');

  // Edit Staff Modal State (Edit Staff — Name & Change Password, / Delete)
  const [editingStaff, setEditingStaff] = useState<LabStaffAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editRole, setEditRole] = useState<'reception' | 'technician'>('reception');
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
        const matchName = staff.name.toLowerCase().includes(query);
        const matchUser = staff.username.toLowerCase().includes(query);
        const matchPhone = (staff.phone || '').includes(query);
        return matchName || matchUser || matchPhone;
      }
      return true;
    });
  }, [staffAccounts, roleFilter, searchTerm]);

  // Reception vs Technician counts
  const receptionCount = staffAccounts.filter((s) => s.role === 'reception').length;
  const techCount = staffAccounts.filter((s) => s.role === 'technician').length;

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
      const prefix = addForm.role === 'reception' ? 'rec_' : 'tech_';
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
      setAddFormError('This username is already taken. Please choose another username.');
      return;
    }

    const targetLabId = (currentUser && currentUser.labId && currentUser.labId !== 'all')
      ? currentUser.labId
      : (selectedVendorLabId && selectedVendorLabId !== 'all' ? selectedVendorLabId : (vendorLabSettings.labId || 'lab-apex'));

    addStaffAccount({
      name: addForm.name.trim(),
      role: addForm.role,
      username: addForm.username.trim(),
      phone: addForm.phone.trim() || undefined,
      password: addForm.password.trim(),
      shift: addForm.shift,
      status: addForm.status,
      notes: addForm.notes.trim() || undefined,
      labId: targetLabId,
      labName: vendorLabSettings.labName,
    });

    setToastMessage(`Staff member "${addForm.name.trim()}" added successfully!`);
    setAddForm({
      name: '',
      role: 'reception',
      username: '',
      phone: '',
      password: '',
      shift: 'Morning (7:00 AM – 3:00 PM)',
      status: 'active',
      notes: '',
    });
    setAddFormError('');
    setSubTab('list');
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Open Edit Modal
  const handleOpenEdit = (staff: LabStaffAccount) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditPassword(staff.password);
    setEditPhone(staff.phone || '');
    setEditShift(staff.shift || 'General Shift');
    setEditRole(staff.role === 'technician' ? 'technician' : 'reception');
    setEditStatus(staff.status);
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
    if (!editPassword.trim() || editPassword.length < 4) {
      setEditModalError('Password must be at least 4 characters long.');
      return;
    }

    // Role check to guarantee at least 1 Technician and 1 Receptionist always exist
    if (editingStaff.role === 'reception' && editRole === 'technician' && receptionCount <= 1) {
      setEditModalError('Cannot change role: At least 1 Receptionist must always exist in the laboratory.');
      return;
    }
    if (editingStaff.role === 'technician' && editRole === 'reception' && techCount <= 1) {
      setEditModalError('Cannot change role: At least 1 Lab Technician must always exist in the laboratory.');
      return;
    }

    updateStaffAccount(editingStaff.id, {
      name: editName.trim(),
      password: editPassword.trim(),
      phone: editPhone.trim() || undefined,
      shift: editShift,
      role: editRole,
      status: editStatus,
      lastPasswordReset: new Date().toISOString(),
    });

    setToastMessage(`Staff "${editName.trim()}" profile and password updated!`);
    setEditingStaff(null);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Open Delete Confirmation & Data Transfer Modal
  const handleOpenDelete = (staff: LabStaffAccount) => {
    const isOnlyStaffOfRole =
      (staff.role === 'reception' && receptionCount <= 1) ||
      (staff.role === 'technician' && techCount <= 1);

    if (isOnlyStaffOfRole) {
      setToastMessage(
        `⚠️ Cannot delete: At least 1 ${
          staff.role === 'reception' ? 'Receptionist' : 'Lab Technician'
        } must always exist in the laboratory.`
      );
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    const sameRoleCandidates = staffAccounts.filter(
      (s) => s.role === staff.role && s.id !== staff.id
    );

    setDeletingStaff(staff);
    setTransferRecipientId(sameRoleCandidates[0]?.id || '');
    setTransferError('');
  };

  // Confirm Delete with Data Transfer
  const handleConfirmDelete = () => {
    if (!deletingStaff) return;

    const isOnlyStaffOfRole =
      (deletingStaff.role === 'reception' && receptionCount <= 1) ||
      (deletingStaff.role === 'technician' && techCount <= 1);

    if (isOnlyStaffOfRole) {
      setTransferError(
        `At least 1 ${
          deletingStaff.role === 'reception' ? 'Receptionist' : 'Lab Technician'
        } must always exist. Delete is disabled when only one staff member remains.`
      );
      return;
    }

    if (!transferRecipientId) {
      setTransferError(
        `Please select a replacement ${
          deletingStaff.role === 'reception' ? 'Receptionist' : 'Lab Technician'
        } to transfer all assigned data to.`
      );
      return;
    }

    const recipient = staffAccounts.find((s) => s.id === transferRecipientId);
    if (!recipient || recipient.role !== deletingStaff.role) {
      setTransferError(
        `Data must be transferred to another staff member of the exact same role (${
          deletingStaff.role === 'reception' ? 'Reception → Reception' : 'Technician → Technician'
        }).`
      );
      return;
    }

    // Execute transfer of all assigned queue items & records, then delete account
    transferStaffDataAndDelete(deletingStaff.id, recipient.id);

    setToastMessage(
      `✅ Transferred all assigned data from ${deletingStaff.name} to ${recipient.name} (${
        deletingStaff.role === 'reception' ? 'Reception → Reception' : 'Technician → Technician'
      }) & deleted staff account.`
    );
    setDeletingStaff(null);
    setTransferRecipientId('');
    setTransferError('');
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Copy Login Credentials
  const handleCopyCredentials = (staff: LabStaffAccount) => {
    const roleName = staff.role === 'reception' ? 'Receptionist (Front Desk)' : 'Lab Technician';
    const text = `*🏥 ${vendorLabSettings.labName || 'Apex Diagnostic Lab'} Portal Access*\n• Role: ${roleName}\n• Staff Name: ${staff.name}\n• Login ID / Username: ${staff.username}\n• Password: ${staff.password}\n• Shift: ${staff.shift || 'General'}\n• Login URL: ${window.location.origin}`;

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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. ADD NEW STAFF FORM (subTab === 'add') */}
      {/* ======================================================== */}
      {subTab === 'add' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <UserPlus className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Add New Staff Member
                </h2>
                <p className="text-xs text-slate-500">
                  Provision new employee login credentials for Front Desk Reception or Pathology Testing Lab.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
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
            {/* Step 1: Select Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Select Staff Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Receptionist Card */}
                <div
                  onClick={() => setAddForm({ ...addForm, role: 'reception' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    addForm.role === 'reception'
                      ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl shrink-0">
                    🖥️
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs text-slate-900">
                        Receptionist (Front Desk)
                      </h4>
                      {addForm.role === 'reception' && (
                        <Check className="w-3.5 h-3.5 text-teal-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Patient intake, token queue registration, test billing, cash collection, and WhatsApp report dispensing.
                    </p>
                  </div>
                </div>

                {/* Technician Card */}
                <div
                  onClick={() => setAddForm({ ...addForm, role: 'technician' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    addForm.role === 'technician'
                      ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-xl shrink-0">
                    🔬
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs text-slate-900">
                        Lab Technician (Pathology)
                      </h4>
                      {addForm.role === 'technician' && (
                        <Check className="w-3.5 h-3.5 text-purple-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Sample barcoding, analyzer test parameters entry, doctor signature sign-off, and PDF report publication.
                    </p>
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
                  placeholder="e.g. Priya Sharma"
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
                  placeholder="e.g. 9876543210"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Step 3: Login Credentials (Username & Password) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="text-xs font-black text-slate-800 block">
                2. Login Credentials Configuration
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Login ID / Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. rec_priya_1"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used by staff to sign in on their dedicated terminal desk.
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
                      placeholder="Min 4 characters (e.g. Priya@2026)"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white"
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
                  <option value="active">Active (Can Login)</option>
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
      {/* (With Edit Staff — Name & Change Password, / Delete) */}
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
                  placeholder="Search staff by name, username or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Role Filter Buttons */}
            <div className="flex items-center gap-1.5">
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
                className="ml-2 px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
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
                  ? 'No staff matched your search query. Try searching for a different name or username.'
                  : 'You have not added any staff accounts yet. Click the button below to add your first staff member.'}
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
                const isReception = staff.role === 'reception';
                const isShowingPassword = !!showPasswordMap[staff.id];
                const isCopied = copiedStaffId === staff.id;

                return (
                  <div
                    key={staff.id}
                    className={`bg-white rounded-2xl border transition p-5 shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                      isReception
                        ? 'border-teal-200/80 hover:border-teal-300'
                        : 'border-purple-200/80 hover:border-purple-300'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                              isReception
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {isReception ? '🖥️' : '🔬'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-sm text-slate-900">
                                {staff.name}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                  isReception
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {isReception ? 'Receptionist' : 'Lab Technician'}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
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
                        {(() => {
                          const isOnlyStaffOfRole =
                            (staff.role === 'reception' && receptionCount <= 1) ||
                            (staff.role === 'technician' && techCount <= 1);

                          return (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(staff)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#123B6D] transition cursor-pointer"
                                title="Edit Staff (Name & Change Password)"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              </button>

                              <button
                                type="button"
                                disabled={isOnlyStaffOfRole}
                                onClick={() => !isOnlyStaffOfRole && handleOpenDelete(staff)}
                                className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                                  isOnlyStaffOfRole
                                    ? 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                                    : 'border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer'
                                }`}
                                title={
                                  isOnlyStaffOfRole
                                    ? `Delete disabled: Minimum 1 ${
                                        staff.role === 'reception' ? 'Receptionist' : 'Lab Technician'
                                      } must always exist in the laboratory.`
                                    : `Delete Staff (${
                                        staff.role === 'reception'
                                          ? 'Reception → Reception'
                                          : 'Technician → Technician'
                                      } data transfer required)`
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Credentials Box */}
                      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                        {/* Username */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Username / Login ID:</span>
                          <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 select-all">
                            {staff.username}
                          </span>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Login Password:</span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 min-w-[70px] text-center select-all">
                              {isShowingPassword ? staff.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(staff.id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                              title={isShowingPassword ? 'Hide password' : 'Show password'}
                            >
                              {isShowingPassword ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Phone if available */}
                        {staff.phone && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                            <span className="text-slate-500 font-medium">Contact Phone:</span>
                            <span className="font-mono text-slate-700">{staff.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Minimum Staff Policy Indicator on Card */}
                    {(() => {
                      const isOnlyStaffOfRole =
                        (staff.role === 'reception' && receptionCount <= 1) ||
                        (staff.role === 'technician' && techCount <= 1);

                      if (!isOnlyStaffOfRole) return null;

                      return (
                        <div className="mt-2.5 py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Min 1 {isReception ? 'Receptionist' : 'Lab Technician'} Required</span>
                          </span>
                          <span className="text-[10px] uppercase tracking-wider bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-black shrink-0">
                            Delete Disabled
                          </span>
                        </div>
                      );
                    })()}

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
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition cursor-pointer"
                          title="Edit Staff Name & Password"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit (Name &amp; Password)</span>
                        </button>

                        {(() => {
                          const isOnlyStaffOfRole =
                            (staff.role === 'reception' && receptionCount <= 1) ||
                            (staff.role === 'technician' && techCount <= 1);

                          return (
                            <button
                              type="button"
                              disabled={isOnlyStaffOfRole}
                              onClick={() => !isOnlyStaffOfRole && handleOpenDelete(staff)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                                isOnlyStaffOfRole
                                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 cursor-pointer'
                              }`}
                              title={
                                isOnlyStaffOfRole
                                  ? `Delete disabled: At least 1 ${
                                      isReception ? 'Receptionist' : 'Lab Technician'
                                    } must always exist in the laboratory.`
                                  : `Delete staff (${
                                      isReception ? 'Reception → Reception' : 'Technician → Technician'
                                    } data transfer required)`
                              }
                            >
                              <Trash2 className={`w-3.5 h-3.5 ${isOnlyStaffOfRole ? 'text-slate-400' : 'text-rose-600'}`} />
                              <span>{isOnlyStaffOfRole ? 'Delete (Disabled)' : 'Delete'}</span>
                            </button>
                          );
                        })()}
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
      {/* EDIT STAFF MODAL: NAME & CHANGE PASSWORD, / DELETE */}
      {/* ======================================================== */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                  <Edit2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Edit Staff — Name &amp; Change Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update profile details and set a new login password for {editingStaff.name}
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

              {/* Readonly Username */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Login ID / Username (System Protected)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingStaff.username}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-600 font-bold cursor-not-allowed"
                />
              </div>

              {/* Edit Name */}
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
                    <span>Change Staff Login Password</span>
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
                  Changing the password here will update the staff's login credential immediately.
                </p>
              </div>

              {/* Role, Shift, Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'reception' | 'technician')}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="reception">Reception Desk</option>
                    <option value="technician">Lab Technician</option>
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
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift</label>
                  <input
                    type="text"
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value)}
                    placeholder="e.g. Morning (7 AM - 3 PM)"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {(() => {
                  const isEditingOnlyStaff = editingStaff && (
                    (editingStaff.role === 'reception' && receptionCount <= 1) ||
                    (editingStaff.role === 'technician' && techCount <= 1)
                  );

                  return (
                    <button
                      type="button"
                      disabled={Boolean(isEditingOnlyStaff)}
                      onClick={() => {
                        if (isEditingOnlyStaff) return;
                        const toDelete = editingStaff;
                        setEditingStaff(null);
                        handleOpenDelete(toDelete);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                        isEditingOnlyStaff
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                          : 'border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer'
                      }`}
                      title={
                        isEditingOnlyStaff
                          ? `Delete disabled: Minimum 1 ${
                              editingStaff?.role === 'reception' ? 'Receptionist' : 'Lab Technician'
                            } must always exist.`
                          : 'Delete Staff (Requires data transfer)'
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {isEditingOnlyStaff
                          ? `Delete (Disabled: Only 1 ${editingStaff?.role === 'reception' ? 'Reception' : 'Technician'})`
                          : 'Delete Staff'}
                      </span>
                    </button>
                  );
                })()}

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
          deletingStaff.role === 'reception' ? 'Reception → Reception' : 'Technician → Technician';

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
                    Are you sure you want to delete this?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Staff account: <strong>{deletingStaff.name}</strong> ({deletingStaff.role === 'reception' ? 'Receptionist' : 'Lab Technician'}) • @{deletingStaff.username}
                  </p>
                </div>
              </div>

              {/* Data Transfer Rule Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Mandatory Data Transfer Required</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950">
                    {transferRoleLabel}
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  Before deleting <strong>{deletingStaff.name}</strong>, all assigned patients, active specimen testing queues, and reports must be transferred to another staff member of the <strong>same role</strong>.
                </p>
              </div>

              {/* Assigned Workload Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Current Assigned Records to Transfer:
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

              {/* Recipient Selector (Same Role Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Recipient {deletingStaff.role === 'reception' ? 'Receptionist' : 'Lab Technician'} to Take Over All Data <span className="text-rose-500">*</span>
                </label>
                {sameRoleCandidates.length === 0 ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                    No other {deletingStaff.role === 'reception' ? 'Receptionist' : 'Lab Technician'} exists. You must add another staff member of this role before you can delete this one.
                  </div>
                ) : (
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
                )}
                {selectedRecipient && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    ✓ All historical and active records will be reassigned to <strong>{selectedRecipient.name}</strong> ({transferRoleLabel}).
                  </p>
                )}
              </div>

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
                  No
                </button>
                <button
                  type="button"
                  disabled={sameRoleCandidates.length === 0 || !transferRecipientId}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
