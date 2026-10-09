import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  IndianRupee,
  Clock,
  Phone,
  Filter,
  Check,
  Receipt,
  FileDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCms } from '../../context/CmsContext';
import { ReceptionPatientEntry } from '../../types';

interface DayEndCashClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  receptionEntries?: ReceptionPatientEntry[];
  staffName?: string;
}

type DateFilterOption = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Custom Date';
type PaymentFilterOption = 'All' | 'Full Payment' | 'Advance Payment' | 'Due Payment';

/**
 * Formats PDF filename strictly as: LABCODE_DATE_TIME.pdf
 * Example: ABC123_27-09-2026_03-21-PM.pdf
 */
export const formatPdfFilename = (labCodeRaw?: string): string => {
  const raw = labCodeRaw || 'ABC123';
  const cleanCode = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'ABC123';

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateStr = `${dd}-${mm}-${yyyy}`;

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12 in 12-hour format
  const hh = String(hours).padStart(2, '0');
  const timeStr = `${hh}-${minutes}-${ampm}`;

  return `${cleanCode}_${dateStr}_${timeStr}.pdf`;
};

export const DayEndCashClosingModal: React.FC<DayEndCashClosingModalProps> = ({
  isOpen,
  onClose,
  receptionEntries: propReceptionEntries,
}) => {
  const { receptionEntries: contextReceptionEntries, vendorLabSettings } = useCms();
  const receptionEntries = propReceptionEntries || contextReceptionEntries || [];

  // Date Filter & Custom Range
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterOption>('Today');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Payment Filter
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterOption>('All');

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to extract comparable date string 'YYYY-MM-DD' from an entry
  const getEntryDateKey = (entry: ReceptionPatientEntry): string => {
    if (entry.entryDate && /^\d{4}-\d{2}-\d{2}$/.test(entry.entryDate)) {
      return entry.entryDate;
    }
    if (entry.registeredAt) {
      const match = entry.registeredAt.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) return match[0];
      const parsed = new Date(entry.registeredAt);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
    return todayStr;
  };

  // Date Boundaries Calculation
  const dateBoundaries = useMemo(() => {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];

    // Monday of current week
    const currentDay = today.getDay(); // 0 is Sunday
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const mondayFormatted = monday.toISOString().split('T')[0];

    // 1st day of current month
    const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayMonthFormatted = firstDayMonth.toISOString().split('T')[0];

    return {
      today: todayFormatted,
      yesterday: yesterdayFormatted,
      monday: mondayFormatted,
      firstDayMonth: firstDayMonthFormatted,
    };
  }, []);

  // Filtered Entries according to Date Filter and Payment Filter
  const filteredEntries = useMemo(() => {
    return receptionEntries.filter((entry) => {
      const entryDate = getEntryDateKey(entry);

      // 1. Date Filter Matching
      let matchesDate = false;
      if (selectedDateFilter === 'Today') {
        matchesDate = entryDate === dateBoundaries.today;
      } else if (selectedDateFilter === 'Yesterday') {
        matchesDate = entryDate === dateBoundaries.yesterday;
      } else if (selectedDateFilter === 'This Week') {
        matchesDate = entryDate >= dateBoundaries.monday && entryDate <= dateBoundaries.today;
      } else if (selectedDateFilter === 'This Month') {
        matchesDate = entryDate >= dateBoundaries.firstDayMonth && entryDate <= dateBoundaries.today;
      } else if (selectedDateFilter === 'Custom Date') {
        const start = customStartDate || '1970-01-01';
        const end = customEndDate || '2099-12-31';
        matchesDate = entryDate >= start && entryDate <= end;
      }

      if (!matchesDate) return false;

      // 2. Payment Filter Matching
      const netTotal = Math.max(0, (entry.totalAmount || 0) - (entry.discountINR || 0));
      const received = (entry.paidAmount || 0) + (entry.balancePaidAmount || 0);
      const due = entry.dueAmount ?? Math.max(0, netTotal - received);

      const isFull = due === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid';
      const isAdvance = (due > 0 && received > 0) || entry.paymentStatus === 'Advance' || entry.paymentStatus === 'Partial';
      const isDue = (received === 0 && due > 0) || entry.paymentStatus === 'Due' || entry.paymentStatus === 'Due Payment';

      if (paymentFilter === 'Full Payment') return isFull;
      if (paymentFilter === 'Advance Payment') return isAdvance;
      if (paymentFilter === 'Due Payment') return isDue;

      return true;
    });
  }, [
    receptionEntries,
    selectedDateFilter,
    customStartDate,
    customEndDate,
    paymentFilter,
    dateBoundaries,
  ]);

  // Summary Metrics — Automatically calculated based on filtered entries
  const metrics = useMemo(() => {
    let totalEarning = 0; // Net Invoiced
    let inPocket = 0; // Actually Received
    let cashInPocket = 0;
    let upiInPocket = 0;
    let cardInPocket = 0;
    let fullPaymentAmount = 0;
    let fullPaymentCount = 0;
    let advancePaymentAmount = 0;
    let advancePaymentCount = 0;
    let duePaymentAmount = 0;
    let duePaymentCount = 0;

    filteredEntries.forEach((entry) => {
      const net = Math.max(0, (entry.totalAmount || 0) - (entry.discountINR || 0));
      totalEarning += net;

      // Received
      const initialPaid = entry.paidAmount || 0;
      const balancePaid = entry.balancePaidAmount || 0;
      const totalRec = initialPaid + balancePaid;
      inPocket += totalRec;

      // Cash / UPI breakdown
      if (entry.paymentMode === 'Cash') cashInPocket += initialPaid;
      if (entry.paymentMode === 'UPI') upiInPocket += initialPaid;
      if (entry.paymentMode === 'Card') cardInPocket += initialPaid;

      if (entry.balancePaymentMode === 'Cash') cashInPocket += balancePaid;
      if (entry.balancePaymentMode === 'UPI') upiInPocket += balancePaid;
      if (entry.balancePaymentMode === 'Card') cardInPocket += balancePaid;

      // Status Categorization
      const due = entry.dueAmount ?? Math.max(0, net - totalRec);

      if (due === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid') {
        fullPaymentAmount += totalRec;
        fullPaymentCount++;
      } else if (due > 0 && totalRec > 0) {
        advancePaymentAmount += totalRec;
        advancePaymentCount++;
        duePaymentAmount += due;
        duePaymentCount++;
      } else {
        duePaymentAmount += due;
        duePaymentCount++;
      }
    });

    return {
      totalEarning,
      inPocket,
      cashInPocket,
      upiInPocket,
      cardInPocket,
      fullPaymentAmount,
      fullPaymentCount,
      advancePaymentAmount,
      advancePaymentCount,
      duePaymentAmount,
      duePaymentCount,
      patientCount: filteredEntries.length,
    };
  }, [filteredEntries]);

  // Download Complete Patient Earning Record PDF
  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    try {
      const labName = vendorLabSettings?.labName || 'Apex Diagnostic & Pathology Laboratory';
      const address = vendorLabSettings?.address || 'Main Hospital Road, Medical Enclave';
      const phone = vendorLabSettings?.phone || '9876543210';
      const rawLabCode =
        vendorLabSettings?.labShopId ||
        vendorLabSettings?.labId ||
        vendorLabSettings?.nablAccreditationNo ||
        'ABC123';

      const filename = formatPdfFilename(rawLabCode);

      const dateRangeLabel =
        selectedDateFilter === 'Custom Date'
          ? `${customStartDate} to ${customEndDate}`
          : selectedDateFilter;

      // Landscape A4 for wide table presentation
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
      const marginX = 14;

      // 1. Top Header Banner
      doc.setFillColor(15, 118, 110); // #0F766E Teal
      doc.roundedRect(marginX, 12, pageWidth - marginX * 2, 22, 3, 3, 'F');

      // Lab Name
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(labName, marginX + 6, 20);

      // Lab Details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(204, 251, 241);
      doc.text(`${address}  •  Phone: +91 ${phone}`, marginX + 6, 26);

      // Top Right Header Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(253, 230, 138); // Amber
      doc.text('PATIENT EARNING RECORD', pageWidth - marginX - 6, 19, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`Date: ${dateRangeLabel}  |  Payment Filter: ${paymentFilter}`, pageWidth - marginX - 6, 25, {
        align: 'right',
      });

      // 2. Summary Metrics Strip
      const metricY = 38;
      const cardW = (pageWidth - marginX * 2 - 12) / 5;
      const cardH = 15;

      const metricsDefs = [
        {
          title: 'TOTAL EARNING',
          val: `Rs. ${metrics.totalEarning.toLocaleString('en-IN')}`,
          sub: `${metrics.patientCount} Patients Billed`,
        },
        {
          title: 'IN POCKET (REC.)',
          val: `Rs. ${metrics.inPocket.toLocaleString('en-IN')}`,
          sub: `Cash: Rs. ${metrics.cashInPocket} • UPI: Rs. ${metrics.upiInPocket}`,
        },
        {
          title: 'FULL PAYMENT',
          val: `Rs. ${metrics.fullPaymentAmount.toLocaleString('en-IN')}`,
          sub: `${metrics.fullPaymentCount} Cleared (Nil Due)`,
        },
        {
          title: 'ADVANCE PAYMENT',
          val: `Rs. ${metrics.advancePaymentAmount.toLocaleString('en-IN')}`,
          sub: `${metrics.advancePaymentCount} Patients Advance`,
        },
        {
          title: 'DUE PAYMENT',
          val: `Rs. ${metrics.duePaymentAmount.toLocaleString('en-IN')}`,
          sub: `${metrics.duePaymentCount} Pending Balance`,
        },
      ];

      metricsDefs.forEach((m, idx) => {
        const cx = marginX + idx * (cardW + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cx, metricY, cardW, cardH, 2, 2, 'FD');

        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(m.title, cx + 3, metricY + 4.2);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(m.val, cx + 3, metricY + 9.5);

        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text(m.sub, cx + 3, metricY + 13.5);
      });

      // 3. Complete Patient Earning Record Table (WITHOUT In Pocket column)
      const tableRows = filteredEntries.map((entry, idx) => {
        const netTotal = Math.max(0, (entry.totalAmount || 0) - (entry.discountINR || 0));
        const received = (entry.paidAmount || 0) + (entry.balancePaidAmount || 0);
        const due = entry.dueAmount ?? Math.max(0, netTotal - received);

        const statusLabel =
          due === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid'
            ? 'Full Paid'
            : due > 0 && received > 0
            ? 'Advance'
            : 'Due';

        const token = entry.tokenNumber || entry.tokenNo || `TK-${101 + idx}`;
        const dateTime = `${entry.entryDate || todayStr}\n${entry.registeredAt || 'Shift'}`;
        const client = `${entry.patientName} (${entry.age || '-'}Y/${entry.gender?.[0] || '-'})\n+91 ${entry.mobile || ''}`;
        const tests = Array.isArray(entry.tests) ? entry.tests.join(', ') : 'General Checkup';

        return [
          token,
          dateTime,
          client,
          tests,
          `Rs. ${netTotal.toLocaleString('en-IN')}`,
          statusLabel,
          due > 0 ? `Rs. ${due.toLocaleString('en-IN')}` : 'Rs. 0',
        ];
      });

      autoTable(doc, {
        startY: metricY + cardH + 4,
        margin: { left: marginX, right: marginX, bottom: 16 },
        head: [['TOKEN', 'DATE & TIME', 'CLIENT / MOBILE', 'TESTS SELECTED', 'TOTAL BILL', 'STATUS', 'DUE AMOUNT']],
        body: tableRows.length > 0 ? tableRows : [['-', '-', 'No patient records found', '-', '-', '-', '-']],
        foot:
          filteredEntries.length > 0
            ? [
                [
                  'TOTALS',
                  `${filteredEntries.length} Patients`,
                  '',
                  '',
                  `Rs. ${metrics.totalEarning.toLocaleString('en-IN')}`,
                  `${metrics.fullPaymentCount} Full • ${metrics.advancePaymentCount} Adv`,
                  `Rs. ${metrics.duePaymentAmount.toLocaleString('en-IN')}`,
                ],
              ]
            : undefined,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontSize: 8.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: 2.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 26, fontStyle: 'bold' },
          1: { cellWidth: 32 },
          2: { cellWidth: 54 },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
          5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        },
        didDrawPage: (data) => {
          // Dynamic Page Footer
          const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}  •  Generated: ${new Date().toLocaleString('en-IN')}  •  ${labName}`;
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(pageStr, pageWidth / 2, pageHeight - 8, { align: 'center' });
        },
      });

      doc.save(filename);
      showToast(`✅ PDF "${filename}" downloaded successfully!`);
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header Bar */}
        <div className="bg-[#0F766E] text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl border border-white/20 shadow-xs shrink-0">
              📊
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Day & Cash Workspace
                </h2>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Patient Earning Records
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-0.5 truncate">
                {vendorLabSettings?.labName || 'Apex Diagnostic & Pathology Laboratory'} • Daily Register & Financial Summary
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 text-[#172033] space-y-5">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-emerald-700 hover:underline text-xs cursor-pointer ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Controls Bar: Filters & Download Record - PDF Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5 no-print">
            {/* Row 1: Date Filter Buttons + Download Record - PDF Button */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-700" />
                  <span>Date Filter:</span>
                </span>
                {(['Today', 'Yesterday', 'This Week', 'This Month', 'Custom Date'] as DateFilterOption[]).map(
                  (opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedDateFilter(opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs ${
                        selectedDateFilter === opt
                          ? 'bg-[#0F766E] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                )}
              </div>

              {/* Single Download Record - PDF Action Button */}
              <div>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="bg-[#0F766E] hover:bg-[#0d655e] active:bg-[#0b544e] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Download complete Patient Earning Record PDF"
                >
                  <FileDown className="w-4 h-4 text-amber-300" />
                  <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Record - PDF'}</span>
                </button>
              </div>
            </div>

            {/* Row 2: Custom Date Pickers & Payment Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              {/* Custom Date Pickers (if Custom Date is chosen) */}
              {selectedDateFilter === 'Custom Date' ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 outline-none focus:border-teal-600 bg-white"
                  />
                  <span className="text-xs font-semibold text-slate-600">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 outline-none focus:border-teal-600 bg-white"
                  />
                </div>
              ) : (
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>
                    Showing report for: <strong>{selectedDateFilter}</strong> ({filteredEntries.length} patient records)
                  </span>
                </div>
              )}

              {/* Payment Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <span>Payment Filter:</span>
                </span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as PaymentFilterOption)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:ring-1 focus:ring-teal-600 outline-none cursor-pointer"
                >
                  <option value="All">All Payments</option>
                  <option value="Full Payment">Full Payment</option>
                  <option value="Advance Payment">Advance Payment</option>
                  <option value="Due Payment">Due Payment</option>
                </select>
              </div>
            </div>
          </div>

          {/* Report Display Container */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            {/* Report Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#123B6D] tracking-tight">
                  {vendorLabSettings?.labName || 'Apex Diagnostic & Pathology Laboratory'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {vendorLabSettings?.address || 'Main Hospital Road, Medical Enclave'} • Phone: +91 {vendorLabSettings?.phone || '9876543210'}
                </p>
              </div>
              <div className="sm:text-right">
                <div className="inline-block bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl text-xs font-black text-[#0F766E] uppercase tracking-wider">
                  Patient Earning Record
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center sm:justify-end gap-1.5">
                  <span>Date:</span>
                  <strong className="text-slate-800">
                    {selectedDateFilter === 'Custom Date' ? `${customStartDate} to ${customEndDate}` : selectedDateFilter}
                  </strong>
                  <span>•</span>
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* 5 Summary Cards: Automatically updated according to date range */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Card 1: Total Earning */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 p-3.5 rounded-2xl border border-blue-200 shadow-2xs">
                <div className="text-[11px] font-black text-blue-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Total Earning</span>
                  <IndianRupee className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#123B6D] mt-1 font-mono">
                  ₹{metrics.totalEarning.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-blue-700 mt-0.5 font-medium truncate">
                  Net Billed ({metrics.patientCount} Patients)
                </div>
              </div>

              {/* Card 2: In Pocket — actually received amount */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
                <div className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                  <span>In Pocket</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.2 rounded">
                    Received
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 font-mono">
                  ₹{metrics.inPocket.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-800 mt-0.5 font-semibold flex items-center gap-1.5 flex-wrap">
                  <span>💵 Cash: ₹{metrics.cashInPocket.toLocaleString('en-IN')}</span>
                  <span>•</span>
                  <span>📱 UPI: ₹{metrics.upiInPocket.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Card 3: Full Payment */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100/60 p-3.5 rounded-2xl border border-teal-200 shadow-2xs">
                <div className="text-[11px] font-black text-teal-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Full Payment</span>
                  <Check className="w-3.5 h-3.5 text-teal-700" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-teal-800 mt-1 font-mono">
                  ₹{metrics.fullPaymentAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-teal-700 mt-0.5 font-medium">
                  {metrics.fullPaymentCount} Patients (Nil Due)
                </div>
              </div>

              {/* Card 4: Advance Payment */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
                <div className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Advance Payment</span>
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-800 mt-1 font-mono">
                  ₹{metrics.advancePaymentAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
                  {metrics.advancePaymentCount} Patients with Advance
                </div>
              </div>

              {/* Card 5: Due Payment */}
              <div className="bg-gradient-to-br from-rose-50 to-rose-100/60 p-3.5 rounded-2xl border border-rose-200 shadow-2xs col-span-2 sm:col-span-1">
                <div className="text-[11px] font-black text-rose-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Due Payment</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1 font-mono">
                  ₹{metrics.duePaymentAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-rose-700 mt-0.5 font-medium">
                  {metrics.duePaymentCount} Pending Balance
                </div>
              </div>
            </div>

            {/* Patient Earning Record Table (WITHOUT "In Pocket" column) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span className="uppercase tracking-wider">
                  Patient Earning Records ({filteredEntries.length})
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Auto-updated as filters change
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                        <th className="py-3 px-3">Token No.</th>
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Client Details / Mobile</th>
                        <th className="py-3 px-3">Tests Selected</th>
                        <th className="py-3 px-3 text-right">Total Bill</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Due Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <div className="font-bold text-slate-600 text-sm">No records found for this filter</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Try selecting another date or payment filter.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((entry, idx) => {
                          const netTotal = Math.max(0, (entry.totalAmount || 0) - (entry.discountINR || 0));
                          const received = (entry.paidAmount || 0) + (entry.balancePaidAmount || 0);
                          const due = entry.dueAmount ?? Math.max(0, netTotal - received);

                          const paymentStatusType: 'Full Payment' | 'Advance' | 'Due' =
                            due === 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid'
                              ? 'Full Payment'
                              : due > 0 && received > 0
                              ? 'Advance'
                              : 'Due';

                          return (
                            <tr key={entry.id || idx} className="hover:bg-teal-50/40 transition">
                              {/* Token Number */}
                              <td className="py-3 px-3 font-mono font-black text-slate-900">
                                <span className="bg-[#123B6D] text-white px-2 py-0.5 rounded text-[11px]">
                                  {entry.tokenNumber || entry.tokenNo || `TK-${100 + idx + 1}`}
                                </span>
                              </td>

                              {/* Date & Time */}
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-800">
                                  {entry.entryDate || todayStr}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {entry.registeredAt || 'Morning Shift'}
                                </div>
                              </td>

                              {/* Client Details: Name, Age, Mobile */}
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{entry.patientName}</span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    ({entry.age}Y • {entry.gender})
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>+91 {entry.mobile}</span>
                                </div>
                              </td>

                              {/* Tests Selected */}
                              <td className="py-3 px-3">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {entry.tests && entry.tests.length > 0 ? (
                                    entry.tests.map((t, tIdx) => (
                                      <span
                                        key={tIdx}
                                        className="bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded text-[10px] text-slate-700"
                                      >
                                        {t}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">General Checkup</span>
                                  )}
                                </div>
                              </td>

                              {/* Total Bill */}
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                                ₹{netTotal.toLocaleString('en-IN')}
                              </td>

                              {/* Status */}
                              <td className="py-3 px-3 text-center">
                                {paymentStatusType === 'Full Payment' ? (
                                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> Full Paid
                                  </span>
                                ) : paymentStatusType === 'Advance' ? (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    Advance Paid
                                  </span>
                                ) : (
                                  <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    Payment Due
                                  </span>
                                )}
                              </td>

                              {/* Due Amount */}
                              <td className="py-3 px-3 text-right font-mono font-bold">
                                {due > 0 ? (
                                  <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    ₹{due.toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 text-[11px]">✓ ₹0</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>

                    {/* Grand Totals Footer */}
                    {filteredEntries.length > 0 && (
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-black text-xs text-slate-900">
                        <tr>
                          <td colSpan={4} className="py-3 px-3 uppercase tracking-wider">
                            Total Summary ({filteredEntries.length} Patients)
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[#123B6D] text-sm">
                            ₹{metrics.totalEarning.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-center text-[11px] text-slate-500 font-semibold">
                            {metrics.fullPaymentCount} Full • {metrics.advancePaymentCount} Adv
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-rose-600 text-sm">
                            ₹{metrics.duePaymentAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Info Strip */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                <span>Official Patient Earning Record • {vendorLabSettings?.labName}</span>
              </div>
              <div className="text-[11px]">
                Powered by Apex Lab Smart OS (indianlalaji.com)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
