import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Share2,
  Download,
  Printer,
  X,
  RotateCcw,
  Sparkles,
  Phone,
  Clock,
  MapPin,
  Building2,
  Home,
  Check,
} from 'lucide-react';
import { generateThermalReceiptPdf } from '../../utils/pdfGenerator';
import { safePrint } from '../../utils/printHelper';

export interface WebsiteTokenReceiptData {
  tokenNumber: string;
  uhid: string;
  patientName: string;
  age: number | string;
  gender: string;
  mobile: string;
  referringDoctor?: string;
  tests: Array<{ name: string; price?: number } | string>;
  totalAmount: number;
  discountINR?: number;
  paidAmount: number;
  dueAmount: number;
  paymentMode: string;
  paymentStatus?: string;
  registeredAt: string;
  visitType?: 'Walk-in' | 'Home Collection' | 'Home' | 'Branch' | string;
  address?: string;
  timeSlot?: string;
  upiTransactionRef?: string;
  labName: string;
  labPhone?: string;
  labAddress?: string;
  notes?: string;
}

interface WebsiteTokenReceiptCardProps {
  receipt: WebsiteTokenReceiptData;
  onClose?: () => void;
  onBookAnother?: () => void;
  showDoneButton?: boolean;
}

export const WebsiteTokenReceiptCard: React.FC<WebsiteTokenReceiptCardProps> = ({
  receipt,
  onClose,
  onBookAnother,
  showDoneButton = true,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const testNames = receipt.tests.map((t) => (typeof t === 'string' ? t : t.name));
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Prepare standard reception entry format for generateThermalReceiptPdf
  const pdfEntry = {
    tokenNumber: receipt.tokenNumber,
    tokenNo: receipt.tokenNumber,
    uhid: receipt.uhid,
    patientName: receipt.patientName,
    age: receipt.age,
    gender: receipt.gender,
    mobile: receipt.mobile,
    referringDoctor: receipt.referringDoctor || 'Self / Direct',
    tests: testNames,
    totalAmount: receipt.totalAmount,
    discountINR: receipt.discountINR || 0,
    paidAmount: receipt.paidAmount,
    dueAmount: receipt.dueAmount,
    paymentMode: receipt.paymentMode,
    registeredAt: receipt.registeredAt,
    bookingSource: 'Website',
  };

  const handleDownloadPdf = () => {
    generateThermalReceiptPdf(pdfEntry, receipt.labName);
  };

  const handlePrintSlip = () => {
    const success = safePrint(() => {
      generateThermalReceiptPdf(pdfEntry, receipt.labName);
    });
    if (!success) {
      generateThermalReceiptPdf(pdfEntry, receipt.labName);
    }
  };

  const handleShareWhatsApp = () => {
    const testsFormatted = testNames.map((t, i) => `  ${i + 1}. ${t}`).join('\n');
    const msg =
      `*━━━━━━━━━━━━━━━━━━━━━*\n` +
      `🏥 *${receipt.labName}*\n` +
      `*━━━━━━━━━━━━━━━━━━━━━*\n` +
      `🎟️ *GENERATED TOKEN NUMBER: ${receipt.tokenNumber}*\n` +
      `🆔 UHID: ${receipt.uhid}\n` +
      `👤 Patient: ${receipt.patientName} (${receipt.age} Y / ${receipt.gender})\n` +
      `📱 Mobile: +91 ${receipt.mobile}\n` +
      `🩺 Ref Doctor: ${receipt.referringDoctor || 'Direct / Self'}\n` +
      `📅 Booking Date: ${receipt.registeredAt}\n\n` +
      `🧪 *Prescribed Tests:*\n${testsFormatted}\n\n` +
      `💰 Total: ₹${receipt.totalAmount}\n` +
      `💵 Paid: ₹${receipt.paidAmount} (${receipt.paymentMode})\n` +
      (receipt.dueAmount > 0 ? `⚠️ Balance Due: ₹${receipt.dueAmount} (Pay on Spot)\n` : `✅ Payment: Full Cleared\n`) +
      (receipt.upiTransactionRef ? `🔢 UTR / UPI Ref: ${receipt.upiTransactionRef}\n` : '') +
      (receipt.visitType ? `📍 Visit: ${receipt.visitType}\n` : '') +
      (receipt.address ? `🏠 Address: ${receipt.address}\n` : '') +
      (receipt.timeSlot ? `⏰ Slot: ${receipt.timeSlot}\n` : '') +
      `\n⚠️ *Booking submitted. Final confirmation after Lab Owner approval.*\n` +
      `*━━━━━━━━━━━━━━━━━━━━━*`;

    const encoded = encodeURIComponent(msg);
    const targetMobile = receipt.mobile ? receipt.mobile.replace(/\D/g, '') : '';
    const waUrl = targetMobile.length === 10
      ? `https://wa.me/91${targetMobile}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-5 sm:p-6 space-y-4 max-w-md w-full mx-auto text-slate-800 relative">
      {/* Close Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          title="Close receipt"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* 1. Modal Header (Exact same header as Reception Entry Dashboard) */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Entry Submitted</span>
        </div>
        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          Token &amp; Invoice
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {receipt.labName} • {dateStr}
        </p>
      </div>

      {/* 2. Generated Token Number Display (Minimalist & Prominent like Reception Dashboard) */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border-2 border-[#123B6D]/20 rounded-2xl p-4 text-center relative overflow-hidden shadow-2xs">
        <div className="text-[11px] font-black uppercase tracking-widest text-[#123B6D]/80">
          Generated Token Number
        </div>
        <div className="text-4xl sm:text-5xl font-black text-[#123B6D] tracking-tight font-mono my-1">
          {receipt.tokenNumber}
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-medium">
          <span>
            UHID: <strong className="font-mono text-slate-800">{receipt.uhid}</strong>
          </span>
          <span>•</span>
          <span>
            Time: <strong>{receipt.registeredAt}</strong>
          </span>
        </div>

        {/* 3. Mandatory Website Booking Notice requested by User */}
        <div className="mt-3 pt-2.5 border-t border-amber-200/80 bg-amber-50/95 -mx-4 -mb-4 px-3 py-2 border-dashed flex items-center justify-center gap-1.5 text-amber-950">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-[11px] sm:text-xs font-black text-amber-950 text-center tracking-tight">
            (Booking submitted. Final confirmation after Lab Owner approval.)
          </span>
        </div>
      </div>

      {/* 4. Clean Minimalist Bill / Invoice Section (Identical to Reception Dashboard) */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 text-xs text-slate-700 shadow-2xs">
        {/* Patient Details */}
        <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
              Patient
            </span>
            <span className="font-bold text-slate-900 text-sm block truncate">
              {receipt.patientName}
            </span>
            <span className="text-slate-500 text-[11px]">
              {receipt.age} Yrs / {receipt.gender}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
              Mobile &amp; Ref Doctor
            </span>
            <span className="font-mono font-semibold text-slate-900 block">
              +91 {receipt.mobile}
            </span>
            <span className="text-slate-500 text-[11px] truncate block">
              Dr: {receipt.referringDoctor || 'Self / Direct'}
            </span>
          </div>
        </div>

        {/* Prescribed Tests */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Prescribed Diagnostic Tests ({receipt.tests.length})
          </span>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1 divide-y divide-slate-50">
            {receipt.tests.map((testItem, i) => {
              const name = typeof testItem === 'string' ? testItem : testItem.name;
              const price = typeof testItem === 'object' && testItem.price ? testItem.price : null;
              return (
                <div key={i} className="flex justify-between items-center py-1 text-xs">
                  <span className="text-slate-800 truncate pr-2 font-medium">
                    {i + 1}. {name}
                  </span>
                  {price !== null && (
                    <span className="font-mono text-slate-600 font-semibold shrink-0">
                      ₹{price}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bill Financial Breakdown */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Gross Test Amount:</span>
            <span className="font-mono font-semibold text-slate-900">₹{receipt.totalAmount}</span>
          </div>

          {(receipt.discountINR || 0) > 0 && (
            <div className="flex justify-between text-xs text-emerald-700 font-medium">
              <span>Discount / Concession:</span>
              <span className="font-mono">-₹{receipt.discountINR}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>Net Payable:</span>
            <span className="font-mono text-sm font-black text-[#123B6D]">
              ₹{receipt.totalAmount - (receipt.discountINR || 0)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-emerald-700 font-semibold">
              Amount Paid ({receipt.paymentMode}):
            </span>
            <span className="font-mono font-bold text-emerald-700">₹{receipt.paidAmount}</span>
          </div>

          {receipt.dueAmount > 0 ? (
            <div className="flex justify-between items-center text-xs pt-1 border-t border-rose-100 text-rose-700 font-bold">
              <span>Balance Due (Pay on Spot):</span>
              <span className="font-mono text-sm">₹{receipt.dueAmount}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-emerald-100 text-emerald-700 font-bold">
              <span>Payment Status:</span>
              <span>✓ Full Advance Payment Received</span>
            </div>
          )}

          {receipt.upiTransactionRef && (
            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
              <span>UPI UTR / Reference No:</span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                {receipt.upiTransactionRef}
              </span>
            </div>
          )}

          {receipt.visitType === 'Home Collection' && (
            <div className="mt-2 p-2 rounded-xl bg-teal-50/80 border border-teal-200 text-[11px] text-teal-900 space-y-0.5">
              <div className="font-bold flex items-center gap-1 text-teal-950">
                <Home className="w-3.5 h-3.5 text-teal-700" />
                <span>Home Sample Pickup Details</span>
              </div>
              {receipt.address && <div><strong>Address:</strong> {receipt.address}</div>}
              {receipt.timeSlot && <div><strong>Slot:</strong> {receipt.timeSlot}</div>}
            </div>
          )}
        </div>
      </div>

      {/* 5. Action Buttons (Exact layout from Reception Dashboard: Share WhatsApp, Download PDF, Print Slip, Done) */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Share Button (WhatsApp) */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            title="Share token slip via WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span>Share (WhatsApp)</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            title="Download token receipt PDF"
          >
            <Download className="w-4 h-4 text-cyan-300" />
            <span>Download PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          {/* Print Slip Button */}
          <button
            type="button"
            onClick={handlePrintSlip}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-3 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Slip</span>
          </button>

          {/* Done / Book Another Button */}
          {onBookAnother ? (
            <button
              type="button"
              onClick={onBookAnother}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Book Another</span>
            </button>
          ) : onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl font-semibold text-xs transition flex items-center justify-center cursor-pointer"
            >
              <span>Done</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
