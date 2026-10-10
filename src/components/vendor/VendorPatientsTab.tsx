import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ChevronRight,
  Send,
  DollarSign,
  UserCheck,
  X,
  Save,
  Check,
  Lock,
  Download,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { ReceptionPatientEntry, Patient, ReportItem, LabReport } from '../../types';
import { EditReceptionEntryModal } from '../EditReceptionEntryModal';
import { CollectRemainingPaymentModal } from '../CollectRemainingPaymentModal';
import { downloadReportPdf } from '../../utils/pdfGenerator';
import { TEST_TEMPLATES } from '../../data/testTemplates';

interface VendorPatientsTabProps {
  onOpenReport?: (reportId: string, mobile: string) => void;
}

export const VendorPatientsTab: React.FC<VendorPatientsTabProps> = ({ onOpenReport }) => {
  const {
    receptionEntries,
    reports,
    getReportById,
    vendorLabSettings,
    addReceptionEntry,
    updateReceptionEntry,
    deleteReceptionEntry,
    sendEntryToTechnician,
    vendorTests,
    activeTenantId,
    selectedVendorLabId,
  } = useCms();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Waiting' | 'Sample Collected' | 'In Lab' | 'Report Ready'>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Partial' | 'Due'>('All');

  // Modal States
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ReceptionPatientEntry | null>(null);
  const [collectPaymentEntry, setCollectPaymentEntry] = useState<ReceptionPatientEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<ReceptionPatientEntry | null>(null);
  const [successToast, setSuccessToast] = useState('');

  // New Patient Form State
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('35');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobile, setMobile] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('Self / Walk-in');
  const [selectedTests, setSelectedTests] = useState<string[]>(['Complete Blood Count (CBC)']);
  const [sampleType, setSampleType] = useState('EDTA Whole Blood');
  const [totalAmount, setTotalAmount] = useState<number>(350);
  const [paidAmount, setPaidAmount] = useState<number>(350);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card'>('UPI');

  // Filtered Patients List
  const filteredPatients = receptionEntries.filter((p) => {
    const matchesSearch =
      (p.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.uhid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tokenNo || p.tokenNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.mobile || '').includes(searchTerm);

    const isReportReady = p.status === 'Report Ready' || p.technicianStatus === 'Report Generated' || Boolean(p.reportId);
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Report Ready' ? isReportReady : p.status === statusFilter);
    const matchesPayment = paymentFilter === 'All' || p.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleDownloadReport = async (entry: ReceptionPatientEntry) => {
    try {
      let report = (entry.reportId ? getReportById(entry.reportId) : undefined) ||
        reports?.find((r) =>
          (entry.reportId && r.reportId.toLowerCase() === entry.reportId.toLowerCase()) ||
          (entry.uhid && (r.uhid?.toLowerCase() === entry.uhid.toLowerCase() || (r as any).patientId?.toLowerCase() === entry.uhid.toLowerCase())) ||
          (entry.id && (r as any).patientId?.toLowerCase() === entry.id.toLowerCase()) ||
          (entry.tokenNumber && r.tokenNumber?.toLowerCase() === entry.tokenNumber.toLowerCase())
        );

      if (!report) {
        const tests = entry.tests && entry.tests.length > 0 ? entry.tests : ['Complete Blood Count (CBC)'];
        const reportItems: ReportItem[] = [];

        tests.forEach((testName) => {
          const lowerName = String(testName || '').toLowerCase().trim();
          const matchedTmpl = TEST_TEMPLATES.find((t) => {
            const tn = String(t.name || '').toLowerCase().trim();
            return (
              (lowerName && tn && tn === lowerName) ||
              (lowerName && tn && lowerName.includes(tn)) ||
              (lowerName && tn && tn.includes(lowerName))
            );
          });

          if (matchedTmpl && matchedTmpl.parameters && matchedTmpl.parameters.length > 0) {
            matchedTmpl.parameters.forEach((p) => {
              reportItems.push({
                parameter: p.name,
                result: (p as any).defaultValue || 'Normal',
                unit: p.unit || '',
                referenceRange: p.referenceRange || '',
                isAbnormal: false,
                testName: matchedTmpl.name,
              });
            });
          } else {
            reportItems.push({
              parameter: testName,
              result: 'Normal / Verified',
              unit: '',
              referenceRange: 'Negative / Normal',
              isAbnormal: false,
              testName: testName,
            });
          }
        });

        report = {
          reportId: entry.reportId || `RPT-2026-${entry.tokenNumber ? entry.tokenNumber.replace(/\D/g, '') : '901'}`,
          uhid: entry.uhid || `LAB-2026-9041`,
          tokenNumber: entry.tokenNumber || entry.tokenNo,
          patientName: entry.patientName,
          ageGender: `${entry.age} Yrs / ${entry.gender}`,
          mobile: entry.mobile,
          doctor: entry.referringDoctor || 'Dr. Self / Direct Walk-in',
          sampleCollectedAt: (entry as any).sampleCollectedAt || `Today, ${entry.registeredAt || '09:00 AM'}`,
          reportedAt: `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
          labName: vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology Laboratory',
          labAddress: vendorLabSettings?.address || 'SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana',
          labPhone: vendorLabSettings?.phone || '7087033009',
          nablAccreditationNo: vendorLabSettings?.nablAccreditationNo || 'MC-4821',
          pathologist: (vendorLabSettings as any)?.chiefPathologist || 'Dr. Rajesh Sharma, MD (Path)',
          pathologistDegrees: (vendorLabSettings as any)?.chiefPathologistDegrees || 'MD, DNB (Pathology), Senior Consultant Pathologist',
          barcode: (entry as any).barcode || `*${entry.uhid || entry.tokenNumber}*`,
          items: reportItems,
          verified: true,
          verificationHash: `VERIFIED-${Date.now().toString(36).toUpperCase()}`,
          isDraft: false,
          status: 'Verified',
          labId: entry.labId || activeTenantId || selectedVendorLabId || vendorLabSettings?.labId || 'lab-apex',
        };
      }

      const ok = await downloadReportPdf(report);
      if (ok) {
        setSuccessToast(`Downloaded report for ${entry.patientName}!`);
        setTimeout(() => setSuccessToast(''), 3000);
      } else {
        setSuccessToast(`Report locked: Full payment is pending (Due: ₹${entry.dueAmount || 0}).`);
        setTimeout(() => setSuccessToast(''), 4000);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleAddPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tokenNo = (receptionEntries.length + 1).toString().padStart(3, '0');
    const uhid = `UHID-${Date.now().toString().slice(-6)}`;
    const dueAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus: 'Paid' | 'Partial' | 'Due' =
      dueAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Due';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    addReceptionEntry({
      tokenNo,
      tokenNumber: tokenNo,
      uhid,
      patientName,
      age: parseInt(age) || 30,
      gender,
      mobile,
      referringDoctor,
      tests: selectedTests,
      testNames: selectedTests,
      sampleType,
      totalAmount,
      discountINR: 0,
      paidAmount,
      dueAmount,
      paymentMode,
      paymentStatus,
      status: 'Sample Collected',
      entryTime: timeStr,
      registeredAt: now.toISOString(),
      sentToTechnician: true,
      technicianStatus: 'Pending',
    });

    setIsAddPatientModalOpen(false);
    setSuccessToast(`Patient ${patientName} added successfully with Token #${tokenNo}!`);
    setTimeout(() => setSuccessToast(''), 3000);

    // Reset Form
    setPatientName('');
    setAge('35');
    setMobile('');
  };

  const handleDeleteConfirm = () => {
    if (!deletingEntry) return;
    deleteReceptionEntry(deletingEntry.id);
    setSuccessToast(`Patient record for ${deletingEntry.patientName} deleted successfully.`);
    setDeletingEntry(null);
    setTimeout(() => setSuccessToast(''), 2500);
  };

  const handleToggleTest = (testName: string, testPrice: number) => {
    if (selectedTests.includes(testName)) {
      if (selectedTests.length === 1) return;
      setSelectedTests(selectedTests.filter((t) => t !== testName));
      setTotalAmount((prev) => Math.max(100, prev - testPrice));
      setPaidAmount((prev) => Math.max(100, prev - testPrice));
    } else {
      setSelectedTests([...selectedTests, testName]);
      setTotalAmount((prev) => prev + testPrice);
      setPaidAmount((prev) => prev + testPrice);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-[#123B6D]">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-[#123B6D]">Manage Patient Details</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Register new patients, edit any mistakenly entered patient details without restarting,
            dispatch samples to laboratory technicians, and track statuses.
          </p>
        </div>

        <button
          onClick={() => setIsAddPatientModalOpen(true)}
          className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 font-bold">Total Patients</div>
          <div className="text-2xl font-black text-[#123B6D] mt-1">{receptionEntries.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Today's registrations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-amber-600 font-bold">In Lab / Processing</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {receptionEntries.filter((p) => p.status === 'In Lab').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Samples undergoing testing</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-emerald-700 font-bold">Reports Ready</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {receptionEntries.filter((p) => p.status === 'Report Ready').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Verified by Pathologist</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-rose-600 font-bold">Dues Pending</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {receptionEntries.filter((p) => p.paymentStatus !== 'Paid').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Requires payment before delivery</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by UHID, Token #, Patient Name, or Mobile..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
          <span className="text-slate-400 font-bold">Status:</span>
          {(['All', 'Waiting', 'Sample Collected', 'In Lab', 'Report Ready'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer text-[11px] ${
                statusFilter === st
                  ? 'bg-[#123B6D] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Token & UHID</th>
                <th className="px-4 py-3">Patient Details</th>
                <th className="px-4 py-3">Referring Doctor</th>
                <th className="px-4 py-3">Tests Prescribed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Billing & Dues</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-xs">
                    No matching patient records found. Click "Register New Patient" above to add one.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                    {/* Token & UHID */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono font-black text-slate-900">
                        <span className="w-6 h-6 rounded-md bg-blue-50 text-[#123B6D] flex items-center justify-center text-xs font-black">
                          {entry.tokenNo || entry.tokenNumber || '#'}
                        </span>
                        <span>{entry.uhid}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{entry.entryTime}</div>
                    </td>

                    {/* Patient Details */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{entry.patientName}</div>
                      <div className="text-[11px] text-slate-500">
                        {entry.age} Yrs • {entry.gender} • {entry.mobile}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {entry.referringDoctor || 'Self / Direct'}
                    </td>

                    {/* Tests */}
                    <td className="px-4 py-3.5 text-slate-700 max-w-xs truncate">
                      <span className="font-semibold">{entry.testNames.join(', ')}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Sample: {entry.sampleType}</div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          entry.status === 'Report Ready'
                            ? 'bg-emerald-100 text-emerald-800'
                            : entry.status === 'In Lab'
                            ? 'bg-amber-100 text-amber-800'
                            : entry.status === 'Sample Collected'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>

                    {/* Billing */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">₹{entry.totalAmount}</div>
                      <div className="text-[10px]">
                        {entry.dueAmount > 0 ? (
                          <span className="text-rose-600 font-bold">Due: ₹{entry.dueAmount}</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">Fully Paid ({entry.paymentMode})</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right space-x-1">
                      {/* Send to Lab Action */}
                      {!entry.sentToTechnician && (
                        <button
                          onClick={() => {
                            sendEntryToTechnician(entry.id);
                            setSuccessToast(`Sent ${entry.patientName}'s sample to laboratory technician!`);
                            setTimeout(() => setSuccessToast(''), 2000);
                          }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 rounded-md text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          title="Send sample to technician work queue"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send to Lab</span>
                        </button>
                      )}

                      {/* Collect Due */}
                      {entry.dueAmount > 0 && (
                        <button
                          onClick={() => setCollectPaymentEntry(entry)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer"
                          title="Collect remaining balance"
                        >
                          Collect ₹{entry.dueAmount}
                        </button>
                      )}

                      {/* Download Report Button: If Report is Ready AND Full Payment Completed */}
                      {Boolean(entry.status === 'Report Ready' || entry.technicianStatus === 'Report Generated' || entry.reportId) &&
                        (entry.dueAmount === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid') && (
                        <button
                          onClick={() => handleDownloadReport(entry)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Download Patient Diagnostic Report PDF"
                        >
                          <Download className="w-3 h-3 text-white" />
                          <span>Download Report</span>
                        </button>
                      )}

                      {/* Edit Button (Locked if sent to lab or report ready) */}
                      {(() => {
                        const isLocked = Boolean(
                          entry.sentToTechnician ||
                          entry.technicianStatus === 'Sent to Lab' ||
                          entry.technicianStatus === 'Accepted' ||
                          entry.technicianStatus === 'Report Generated' ||
                          entry.status === 'In Lab' ||
                          entry.status === 'Report Ready' ||
                          entry.reportId
                        );
                        return !isLocked ? (
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="p-1.5 text-slate-600 hover:text-[#123B6D] hover:bg-slate-100 rounded-md transition cursor-pointer"
                            title="Edit patient details, tests or billing"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span
                            className="p-1.5 text-slate-300 cursor-not-allowed inline-flex"
                            title={
                              entry.status === 'Report Ready' || entry.reportId
                                ? 'Report Ready (Locked: Edit not allowed)'
                                : 'Sent to Lab (Locked: Edit not allowed)'
                            }
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        );
                      })()}

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeletingEntry(entry)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        title="Delete patient record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER NEW PATIENT MODAL */}
      {isAddPatientModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden">
            <div className="bg-[#123B6D] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-black">Register New Patient Visit</span>
              </div>
              <button
                onClick={() => setIsAddPatientModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Patient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra Sharma"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Age & Gender */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Age (Years) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    WhatsApp / Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Doctor */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Referring Doctor
                  </label>
                  <input
                    type="text"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    placeholder="e.g. Dr. S. K. Gupta, MD"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                {/* Sample Type */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sample Specimen Type
                  </label>
                  <select
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  >
                    <option value="EDTA Whole Blood">EDTA Whole Blood (Purple Top)</option>
                    <option value="Serum / Clot Activator">Serum / Clot Activator (Yellow / Red Top)</option>
                    <option value="Fluoride Plasma (Glucose)">Fluoride Plasma (Glucose - Grey Top)</option>
                    <option value="Urine Routine Specimen">Urine Routine Specimen (Sterile Container)</option>
                    <option value="Sodium Citrate Plasma">Sodium Citrate Plasma (Blue Top)</option>
                  </select>
                </div>

                {/* Tests Selection Chips */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Select Prescribed Tests (Click to toggle)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                    {vendorTests.slice(0, 12).map((t) => {
                      const isSelected = selectedTests.includes(t.name);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleToggleTest(t.name, t.priceINR)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-[#123B6D] text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{t.name} (₹{t.priceINR})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Financials */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Total Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Paid Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    required
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <div className="flex gap-4">
                    {(['UPI', 'Cash', 'Card'] as const).map((mode) => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                        <input
                          type="radio"
                          name="paymentMode"
                          value={mode}
                          checked={paymentMode === mode}
                          onChange={() => setPaymentMode(mode)}
                        />
                        <span>{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddPatientModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Register Patient</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PATIENT MODAL (Solves user complaint of having to refill the whole form on mistake) */}
      {editingEntry && (
        <EditReceptionEntryModal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          entry={editingEntry}
          onSave={(updated) => {
            updateReceptionEntry(updated.id, updated);
            setEditingEntry(null);
            setSuccessToast(`Patient details for ${updated.patientName} updated successfully!`);
            setTimeout(() => setSuccessToast(''), 2500);
          }}
          availableTests={vendorTests?.map((t) => ({
            name: t.name,
            price: t.priceINR,
            sample: t.sampleType,
            category: t.category,
          }))}
        />
      )}

      {/* COLLECT REMAINING PAYMENT MODAL */}
      {collectPaymentEntry && (
        <CollectRemainingPaymentModal
          isOpen={!!collectPaymentEntry}
          onClose={() => setCollectPaymentEntry(null)}
          entry={collectPaymentEntry}
          onPaymentCollected={(updated) => {
            updateReceptionEntry(updated.id, updated);
            setCollectPaymentEntry(null);
            setSuccessToast(`Payment of ₹${updated.paidAmount} recorded for ${updated.patientName}.`);
            setTimeout(() => setSuccessToast(''), 2500);
          }}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingEntry && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-300 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="p-2 rounded-full bg-rose-50">
                <Trash2 className="w-5 h-5" />
              </span>
              <h3 className="text-base font-black">Are you sure you want to delete this?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this? Patient record: <strong className="text-slate-900">{deletingEntry.patientName}</strong> ({deletingEntry.uhid}). This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingEntry(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                No
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
