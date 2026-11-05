import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Phone,
  Mail,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Building2,
  Copy,
  Check,
  ExternalLink,
  Eye,
  UserCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { CompanyEmployee } from '../../types';
import { maskPanNumber } from '../../data/companyEmployeesSeed';

export const EmployeeManagementTab: React.FC = () => {
  const {
    companyEmployees,
    addCompanyEmployee,
    updateCompanyEmployee,
    deleteCompanyEmployee,
    resetCompanyEmployeesToDefault,
  } = useCms();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'active' | 'inactive'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<CompanyEmployee | null>(null);
  const [previewEmployee, setPreviewEmployee] = useState<CompanyEmployee | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<CompanyEmployee, 'id'>>({
    name: '',
    phone: '',
    email: '',
    panNumber: '',
    maskedPan: '',
    employeeId: '',
    designation: 'Software Consultation Executive',
    department: 'Software Consultation & Lab Solutions',
    photoUrl: '',
    status: 'verified',
    badge: 'Verified Employee • IndianLalaji OS',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      panNumber: '',
      maskedPan: '',
      employeeId: `IL-EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
      designation: 'Software Consultation Executive',
      department: 'Software Consultation & Lab Solutions',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      status: 'verified',
      badge: 'Verified Employee • IndianLalaji OS',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: CompanyEmployee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      phone: emp.phone,
      email: emp.email,
      panNumber: emp.panNumber,
      maskedPan: emp.maskedPan || maskPanNumber(emp.panNumber),
      employeeId: emp.employeeId,
      designation: emp.designation,
      department: emp.department || 'Software Consultation & Lab Solutions',
      photoUrl: emp.photoUrl || '',
      status: emp.status,
      badge: emp.badge || 'Verified Employee • IndianLalaji OS',
      notes: emp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rawPan = formData.panNumber.trim().toUpperCase();
    const computedMasked = maskPanNumber(rawPan);

    if (editingEmployee) {
      updateCompanyEmployee(editingEmployee.id, {
        ...formData,
        panNumber: rawPan,
        maskedPan: computedMasked,
      });
    } else {
      addCompanyEmployee({
        ...formData,
        panNumber: rawPan,
        maskedPan: computedMasked,
      });
    }

    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleCopyId = (idText: string) => {
    navigator.clipboard?.writeText(idText);
    setCopiedId(idText);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEmployees = companyEmployees.filter((emp) => {
    if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const name = (emp.name || '').toLowerCase();
    const phone = (emp.phone || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const empId = (emp.employeeId || '').toLowerCase();
    const pan = (emp.panNumber || '').toLowerCase();
    const desig = (emp.designation || '').toLowerCase();

    return (
      name.includes(q) ||
      phone.includes(q) ||
      email.includes(q) ||
      empId.includes(q) ||
      pan.includes(q) ||
      desig.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#0e294b] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Central Enterprise Registry
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {companyEmployees.length} Registered Executives
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Employee Verification Database (Software Consultation Executives)</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            This database powers the <strong>"Verify Employee"</strong> verification popup on the Main Website. Any employee added, edited, or removed here reflects immediately in the live public verification system.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={resetCompanyEmployeesToDefault}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Restore standard 4 consultation executive records"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-[#0e294b] hover:bg-[#123B6D] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
            id="btn-add-executive-employee"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>+ Add New Executive</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Executives
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {companyEmployees.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Software Consultation Staff</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Verified Status
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {companyEmployees.filter((e) => e.status === 'verified' || e.status === 'active').length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Authorized for Public Client Calls</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            Official Designation
          </div>
          <div className="text-sm font-black text-slate-800 mt-2 truncate">
            Software Consultation Executive
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Enterprise Standard Role</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Registry Protocol
          </div>
          <div className="text-sm font-black text-emerald-700 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>100% RBI/IT Masked</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Privacy Protected Verification</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, emp ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium hidden md:inline">Status:</span>
          {(['all', 'verified', 'inactive'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer capitalize ${
                statusFilter === st
                  ? 'bg-[#0e294b] text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Employees Directory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition space-y-4 flex flex-col justify-between"
          >
            <div>
              {/* Card Header (Photo, Name, ID, Designation) */}
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0">
                  {emp.photoUrl ? (
                    <img
                      src={emp.photoUrl}
                      alt={emp.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-slate-100 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#0e294b] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                      {emp.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white shadow-2xs">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-black text-sm text-slate-900 truncate">
                      {emp.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      ● {emp.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block mt-1 truncate max-w-full">
                    {emp.designation || 'Software Consultation Executive'}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                    <span className="font-mono text-slate-500 font-semibold text-[11px]">
                      ID: {emp.employeeId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(emp.employeeId)}
                      className="text-slate-400 hover:text-slate-600 transition"
                      title="Copy ID"
                    >
                      {copiedId === emp.employeeId ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Detail Rows */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                    Registered Mobile
                  </span>
                  <div className="font-mono font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>+91 {emp.phone}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                    Masked PAN Number
                  </span>
                  <div className="font-mono font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <CreditCard className="w-3 h-3 text-amber-600" />
                    <span>{emp.maskedPan || maskPanNumber(emp.panNumber)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl col-span-2">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                    Official Email Address
                  </span>
                  <div className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5 truncate">
                    <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setPreviewEmployee(emp)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Card Preview</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(emp)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3 text-blue-600" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${emp.name} from verified employees registry?`)) {
                      deleteCompanyEmployee(emp.id);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Executives Found</h4>
            <p className="text-xs text-slate-400">
              Try adjusting your search criteria or add a new consultation executive.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0e294b] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{editingEmployee ? 'Edit Executive Employee' : 'Add New Consultation Executive'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Name (पूरा नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Registered Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit number e.g. 9876543210"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Used by clients to verify on the website
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="e.g. IL-EXEC-1042"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul.sharma@indianlalaji.com"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    PAN Number (Full PAN) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.panNumber}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFormData({
                        ...formData,
                        panNumber: val,
                        maskedPan: maskPanNumber(val),
                      });
                    }}
                    placeholder="e.g. ABCPS1244M"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-mono uppercase"
                  />
                  <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                    Masked preview: {maskPanNumber(formData.panNumber)}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Designation (पद) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Software Consultation Executive"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Photo URL (प्रोफाइल फोटो URL)
                  </label>
                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="https://... photo url"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Department / Authorization Scope
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Software Consultation & Lab Solutions"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0e294b] hover:bg-[#123B6D] text-white px-5 py-2 rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  {editingEmployee ? 'Update Executive' : 'Save & Register Executive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Card Preview Modal */}
      {previewEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Public Verification Card Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The exact profile card shown on the live site */}
            <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border-2 border-emerald-500/40 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Employee • IndianLalaji OS</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center gap-3">
                {previewEmployee.photoUrl ? (
                  <img
                    src={previewEmployee.photoUrl}
                    alt={previewEmployee.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#0e294b] text-white flex items-center justify-center font-bold text-xl">
                    {previewEmployee.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-black text-slate-900 truncate">
                    {previewEmployee.name}
                  </h4>
                  <div className="text-[11px] font-bold text-[#0e294b] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                    {previewEmployee.designation || 'Software Consultation Executive'}
                  </div>
                  <div className="text-xs font-mono text-slate-500 mt-1">
                    ID: {previewEmployee.employeeId}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono font-bold text-slate-900">+91 {previewEmployee.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{previewEmployee.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Masked PAN:</span>
                  <span className="font-mono font-bold text-slate-900 tracking-wider">
                    {previewEmployee.maskedPan || maskPanNumber(previewEmployee.panNumber)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setPreviewEmployee(null)}
                className="w-full bg-[#0e294b] text-white py-2 rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
