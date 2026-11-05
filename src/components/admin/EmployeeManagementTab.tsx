import React, { useState, useMemo } from 'react';
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
  EyeOff,
  UserCheck,
  X,
  Sparkles,
  Calendar,
  IndianRupee,
  Lock,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { CompanyEmployee, VendorLabDirectoryItem } from '../../types';
import { maskPanNumber } from '../../data/companyEmployeesSeed';

export const EmployeeManagementTab: React.FC = () => {
  const {
    companyEmployees,
    addCompanyEmployee,
    updateCompanyEmployee,
    deleteCompanyEmployee,
    resetCompanyEmployeesToDefault,
    vendorLabsList,
  } = useCms();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'active' | 'inactive'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Current month default: YYYY-MM
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Month Filter state for Paid Labs calculation ("jo paid lab hi count hogi")
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [paidLabsModalEmployee, setPaidLabsModalEmployee] = useState<CompanyEmployee | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<CompanyEmployee | null>(null);
  const [previewEmployee, setPreviewEmployee] = useState<CompanyEmployee | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<CompanyEmployee | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

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
    password: '',
    role: 'team_member',
  });

  const [showFormPassword, setShowFormPassword] = useState(false);

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

  // Helper: Calculate Paid Labs for a specific Employee in the selected month
  // "jo paid lab hi count hogi" -> MUST be isPaid === true
  const getEmployeePaidLabs = (emp: CompanyEmployee) => {
    const empId = emp.id;
    const empDigits = (emp.phone || '').replace(/\D/g, '');
    const empLast10 = empDigits.length >= 10 ? empDigits.slice(-10) : empDigits;

    return vendorLabsList.filter((lab) => {
      // Must be assigned to this employee
      const matchEmp =
        lab.assignedEmployeeId === empId ||
        (lab.assignedEmployeePhone && (lab.assignedEmployeePhone.replace(/\D/g, '').endsWith(empLast10) || empLast10.endsWith(lab.assignedEmployeePhone.replace(/\D/g, ''))));

      if (!matchEmp) return false;

      // MUST be Paid!
      if (lab.isPaid !== true) return false;

      // Month filter
      if (selectedMonth === 'all') return true;

      const dateStr = lab.paidAt || lab.planPurchasedAt || lab.publishedAt || '';
      return dateStr.startsWith(selectedMonth);
    });
  };

  const getEmployeeTotalAssignedClients = (emp: CompanyEmployee) => {
    const empId = emp.id;
    const empDigits = (emp.phone || '').replace(/\D/g, '');
    const empLast10 = empDigits.length >= 10 ? empDigits.slice(-10) : empDigits;

    return vendorLabsList.filter((lab) => {
      return (
        lab.assignedEmployeeId === empId ||
        (lab.assignedEmployeePhone && (lab.assignedEmployeePhone.replace(/\D/g, '').endsWith(empLast10) || empLast10.endsWith(lab.assignedEmployeePhone.replace(/\D/g, ''))))
      );
    });
  };

  // Overall totals across all employees in selected month
  const totalPaidLabsAllEmployees = useMemo(() => {
    return vendorLabsList.filter((lab) => {
      if (lab.isPaid !== true) return false;
      if (!lab.assignedEmployeeId && !lab.assignedEmployeePhone) return false;
      if (selectedMonth === 'all') return true;
      const dateStr = lab.paidAt || lab.planPurchasedAt || lab.publishedAt || '';
      return dateStr.startsWith(selectedMonth);
    });
  }, [vendorLabsList, selectedMonth]);

  const totalPaidAmountAllEmployees = useMemo(() => {
    return totalPaidLabsAllEmployees.reduce(
      (sum, l) => sum + (l.paidAmount || l.subscriptionAmount || 1499),
      0
    );
  }, [totalPaidLabsAllEmployees]);

  const handleGeneratePassword = () => {
    const randPass = `emp${Math.floor(10000 + Math.random() * 90000)}`;
    setFormData((prev) => ({ ...prev, password: randPass }));
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setShowFormPassword(false);
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
      password: `emp${Math.floor(10000 + Math.random() * 90000)}`,
      role: 'team_member',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: CompanyEmployee) => {
    setEditingEmployee(emp);
    setShowFormPassword(false);
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
      password: emp.password || 'emp12345',
      role: emp.role || 'team_member',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rawPan = formData.panNumber.trim().toUpperCase();
    const computedMasked = maskPanNumber(rawPan);
    const cleanPass = (formData.password || 'emp12345').trim();

    if (editingEmployee) {
      updateCompanyEmployee(editingEmployee.id, {
        ...formData,
        panNumber: rawPan,
        maskedPan: computedMasked,
        password: cleanPass,
      });
    } else {
      addCompanyEmployee({
        ...formData,
        panNumber: rawPan,
        maskedPan: computedMasked,
        password: cleanPass,
      });
    }

    triggerToast(editingEmployee ? `Employee "${formData.name}" updated successfully.` : `Employee "${formData.name}" added successfully.`);
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleCopyId = (idText: string) => {
    navigator.clipboard?.writeText(idText);
    setCopiedId(idText);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
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
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#0e294b] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Central Enterprise Registry
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {companyEmployees.length} Registered Team Members
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Team Member & Software Consultation Executive System</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Admin can create employees with mobile numbers and login passwords. Employees log in to register clients, activate 2-day live demos, and manage follow-ups. Track verified paid conversions below.
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
            <span>+ Add New Employee</span>
          </button>
        </div>
      </div>

      {/* MONTHLY PAID LABS TRACKER SECTION ("jo paid lab hi count hogi") */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0e294b] to-[#0F766E] rounded-3xl p-5 sm:p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Monthly Paid Labs Tracker
              </span>
              <span className="text-xs font-bold text-emerald-300">
                (Jo Paid Lab Hi Count Hogi)
              </span>
            </div>
            <h3 className="text-lg font-black mt-1">
              Employee Paid Conversions & Monthly Revenue
            </h3>
            <p className="text-xs text-slate-300">
              Filtered strictly by verified paid clients assigned to each consultation executive in the selected month.
            </p>
          </div>

          {/* Month Filter Selector */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shrink-0">
            <Calendar className="w-4 h-4 text-amber-300 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#0e294b] text-white text-xs font-bold rounded-xl px-3 py-1.5 border border-white/15 focus:outline-none cursor-pointer"
            >
              <option value="all">All Months (Overall Total)</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {opt.value === currentMonthStr ? '(Current Month)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Summary Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Total Paid Labs ({selectedMonth === 'all' ? 'All Months' : selectedMonth})
            </div>
            <div className="text-2xl font-black text-emerald-300 font-mono mt-0.5">
              {totalPaidLabsAllEmployees.length}
            </div>
            <div className="text-[10px] text-slate-300">Verified Paid by Employees</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Total Subscription Revenue
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
              ₹{totalPaidAmountAllEmployees.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-300">Generated from Paid Labs</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Active Team Members
            </div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {companyEmployees.filter((e) => e.status !== 'inactive').length}
            </div>
            <div className="text-[10px] text-slate-300">Authorized for Consultations</div>
          </div>
        </div>

        {/* Table of Employees and Paid Count */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-xs text-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-700 font-black text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Login Mobile</th>
                  <th className="py-2.5 px-4">Assigned Clients</th>
                  <th className="py-2.5 px-4 text-emerald-800">Paid Labs (This Month)</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {companyEmployees.map((emp) => {
                  const paidLabs = getEmployeePaidLabs(emp);
                  const totalAssigned = getEmployeeTotalAssignedClients(emp);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">ID: {emp.employeeId}</div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                        +91 {emp.phone}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-700">
                        {totalAssigned.length} clients
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-xs font-mono ${
                          paidLabs.length > 0
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{paidLabs.length} Paid</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setPaidLabsModalEmployee(emp)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          View Paid List ({paidLabs.length})
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
        {filteredEmployees.map((emp) => {
          const isShowPass = Boolean(showPasswordMap[emp.id]);
          const paidLabs = getEmployeePaidLabs(emp);
          const totalAssigned = getEmployeeTotalAssignedClients(emp);

          return (
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
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0 border ${
                        emp.status === 'inactive'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
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
                        className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
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

                {/* LOGIN CREDENTIALS BOX (MOBILE + PASSWORD CREATED BY ADMIN) */}
                <div className="mt-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl p-3 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-blue-900 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      <span>Employee Login Credentials (लॉगिन विवरण)</span>
                    </span>
                    <span className="text-[9px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-bold">
                      Team Member
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Login Mobile Number
                      </span>
                      <div className="font-mono font-bold text-slate-900 flex items-center justify-between mt-0.5">
                        <span>+91 {emp.phone}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyId(emp.phone)}
                          className="text-slate-400 hover:text-slate-600"
                          title="Copy Mobile"
                        >
                          {copiedId === emp.phone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Login Password
                      </span>
                      <div className="font-mono font-bold text-slate-900 flex items-center justify-between mt-0.5">
                        <span>{isShowPass ? (emp.password || 'emp12345') : '••••••••'}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(emp.id)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {isShowPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyId(emp.password || 'emp12345')}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedId === (emp.password || 'emp12345') ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Summary Strip */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                      Paid Labs ({selectedMonth === 'all' ? 'All' : selectedMonth})
                    </span>
                    <div className="font-black text-emerald-800 text-sm font-mono mt-0.5 flex items-center justify-between">
                      <span>{paidLabs.length} Paid</span>
                      <button
                        type="button"
                        onClick={() => setPaidLabsModalEmployee(emp)}
                        className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Details →
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Total Clients Assigned
                    </span>
                    <div className="font-black text-slate-900 text-sm font-mono mt-0.5">
                      {totalAssigned.length} Labs
                    </div>
                  </div>
                </div>

                {/* Detail Rows */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Masked PAN Number
                    </span>
                    <div className="font-mono font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                      <CreditCard className="w-3 h-3 text-amber-600" />
                      <span>{emp.maskedPan || maskPanNumber(emp.panNumber)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Official Email
                    </span>
                    <div className="font-medium text-slate-800 truncate mt-0.5">
                      {emp.email}
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
                    onClick={() => setDeleteConfirmEmployee(emp)}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    title={`Delete ${emp.name}`}
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Team Members Found</h4>
            <p className="text-xs text-slate-400">
              Try adjusting your search criteria or add a new consultation executive.
            </p>
          </div>
        )}
      </div>

      {/* VIEW PAID LABS MODAL FOR EMPLOYEE */}
      {paidLabsModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#0e294b] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Paid Labs by {paidLabsModalEmployee.name}</span>
                </h3>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Filter Month: {selectedMonth === 'all' ? 'All Months' : selectedMonth}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaidLabsModalEmployee(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              {(() => {
                const list = getEmployeePaidLabs(paidLabsModalEmployee);
                if (list.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500 space-y-2">
                      <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                      <div className="font-bold text-slate-700">No Paid Labs Found in This Month</div>
                      <div className="text-[11px] text-slate-400">
                        Only verified paid client conversions within {selectedMonth} are shown.
                      </div>
                    </div>
                  );
                }

                return list.map((lab) => (
                  <div key={lab.id} className="bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm text-slate-900">{lab.name}</h4>
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-md font-mono">
                        ₹{lab.paidAmount || lab.subscriptionAmount || 1499}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Client Mobile</span>
                        <span className="font-mono font-bold text-slate-900">+91 {lab.phone.replace(/\D/g, '').slice(-10)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid Date</span>
                        <span className="font-mono font-bold text-emerald-700">{lab.paidAt || 'Verified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Plan</span>
                        <span>{lab.subscriptionPlan || '1 Month'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                        <span>{lab.city}, {lab.state}</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setPaidLabsModalEmployee(null)}
                className="bg-[#0e294b] text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0e294b] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{editingEmployee ? 'Edit Team Member Details' : 'Create New Team Member / Employee'}</span>
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
                    Registered Mobile Number (लॉगिन मोबाइल) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit number e.g. 9876543210"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-mono"
                  />
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                    Employee will use this mobile number to log in
                  </span>
                </div>

                {/* LOGIN PASSWORD CREATED BY ADMIN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      Login Password (पासवर्ड) *
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      ⚡ Auto Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      required
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="e.g. emp98210"
                      className="w-full p-2.5 pr-8 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30 font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Created by Admin for employee login
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

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status (स्थिति) *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 cursor-pointer font-bold"
                  >
                    <option value="verified">Verified & Active</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
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
                  {editingEmployee ? 'Update Team Member' : 'Save & Register Team Member'}
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
                  <span className="text-slate-400">Login Mobile:</span>
                  <span className="font-mono font-bold text-slate-900">+91 {previewEmployee.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Login Password:</span>
                  <span className="font-mono font-bold text-slate-900">{previewEmployee.password || 'emp12345'}</span>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                Delete Team Member? (कर्मचारी हटाएं)
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 py-2.5 px-3 rounded-xl border border-slate-200 font-medium break-words">
                Are you sure you want to delete <strong>{deleteConfirmEmployee.name}</strong> (+91 {deleteConfirmEmployee.phone}) from the registry?
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                This employee will be permanently removed and can no longer log in.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmEmployee(null)}
                className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Cancel (रद्द करें)
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCompanyEmployee(deleteConfirmEmployee.id);
                  triggerToast(`Employee "${deleteConfirmEmployee.name}" deleted successfully.`);
                  setDeleteConfirmEmployee(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete (हटाएं)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
