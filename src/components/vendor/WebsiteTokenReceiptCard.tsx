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
  ImageIcon,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { generateThermalReceiptPdf, buildReceiptInvoicePdf } from '../../utils/pdfGenerator';
import { safePrint } from '../../utils/printHelper';
import { buildPatientReportUrl } from '../../utils/domainRouting';
import { buildReceiptSlipImage, downloadReceiptImage } from '../../utils/receiptImageGenerator';

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
  labId?: string;
  labName: string;
  labPhone?: string;
  labAddress?: string;
  notes?: string;
  bookingSource?: string;
}

interface WebsiteTokenReceiptCardProps {
  receipt: WebsiteTokenReceiptData;
  onClose?: () => void;
  onBookAnother?: () => void;
  showDoneButton?: boolean;
  showPrices?: boolean;
}

export const WebsiteTokenReceiptCard: React.FC<WebsiteTokenReceiptCardProps> = ({
  receipt,
  onClose,
  onBookAnother,
  showDoneButton = true,
  showPrices = true,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const testNames = receipt.tests.map((t) => (typeof t === 'string' ? t : t.name));
  const testNamesStr = testNames.join(', ');
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Build the patient-specific report URL
  const reportUrl = buildPatientReportUrl(receipt.labId, receipt.tokenNumber);

  const cleanMobile = (receipt.mobile || '').replace(/\D/g, '');
  const clean10 = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

  const total = receipt.totalAmount || 0;
  const discount = receipt.discountINR || 0;
  const net = total - discount;
  const paid = receipt.paidAmount || 0;
  const due = receipt.dueAmount ?? Math.max(0, net - paid);

  // Complete Slip Text Message formatted specifically for WhatsApp Web / App
  const slipTextMessage = [
    `🏥 *Registration Confirmed!*`,
    ``,
    `Dear *${receipt.patientName}*, your lab test registration is confirmed. ✅`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🎫 *Token No.:* *${receipt.tokenNumber}*`,
    `📋 *UHID:* ${receipt.uhid}`,
    `👤 *Patient:* ${receipt.patientName} (${receipt.age} Yrs / ${receipt.gender})`,
    receipt.referringDoctor ? `👨‍⚕️ *Doctor:* ${receipt.referringDoctor}` : '',
    `🧪 *Tests:* ${testNamesStr}`,
    showPrices ? `💰 *Bill Summary:* Gross ₹${total}${discount > 0 ? `, Concession -₹${discount}` : ''} | *Net ₹${net}*` : '',
    showPrices ? `💵 *Paid:* ₹${paid} (${receipt.paymentMode || 'Cash'})` : '',
    showPrices ? (due > 0 ? `⚠️ *Balance Due:* ₹${due} (Pay on Spot)` : `✅ *Payment Status:* Paid in Full`) : '',
    receipt.visitType === 'Home Collection' && receipt.address ? `🏠 *Home Pickup:* ${receipt.address}${receipt.timeSlot ? ` (${receipt.timeSlot})` : ''}` : '',
    `📅 *Date:* ${receipt.registeredAt || dateStr}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🔗 *View Report:* ${reportUrl}`,
    ``,
    `🖼️ *Receipt Slip:* Attached / Downloaded with this WhatsApp message.`,
    `📍 *${receipt.labName}*${receipt.labPhone ? ` • Ph: ${receipt.labPhone}` : ''}`,
  ].filter(Boolean).join('\n');

  const encodedMsg = encodeURIComponent(slipTextMessage);

  // 1. WhatsApp Web URL (Direct for PC / Desktop Web Browser)
  const whatsappWebUrl = clean10
    ? `https://web.whatsapp.com/send?phone=91${clean10}&text=${encodedMsg}`
    : `https://web.whatsapp.com/send?text=${encodedMsg}`;

  // 2. WhatsApp App / Mobile URL (wa.me)
  const whatsappAppUrl = clean10
    ? `https://wa.me/91${clean10}?text=${encodedMsg}`
    : `https://wa.me/?text=${encodedMsg}`;

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
    totalAmount: showPrices ? receipt.totalAmount : 0,
    discountINR: showPrices ? (receipt.discountINR || 0) : 0,
    paidAmount: showPrices ? receipt.paidAmount : 0,
    dueAmount: showPrices ? receipt.dueAmount : 0,
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

  const handleDownloadImage = async () => {
    try {
      const { dataUrl, filename } = await buildReceiptSlipImage({
        tokenNumber: receipt.tokenNumber,
        uhid: receipt.uhid,
        patientName: receipt.patientName,
        age: receipt.age,
        gender: receipt.gender,
        mobile: receipt.mobile,
        referringDoctor: receipt.referringDoctor,
        tests: receipt.tests,
        totalAmount: receipt.totalAmount,
        paidAmount: receipt.paidAmount,
        dueAmount: receipt.dueAmount,
        paymentMode: receipt.paymentMode,
        paymentStatus: receipt.paymentStatus,
        registeredAt: receipt.registeredAt,
        visitType: receipt.visitType,
        address: receipt.address,
        timeSlot: receipt.timeSlot,
        labId: receipt.labId,
        labName: receipt.labName,
        labPhone: receipt.labPhone,
        showPrices: showPrices,
      }, receipt.labName);
      downloadReceiptImage(dataUrl, filename);
    } catch (e) {
      console.error('Download image error:', e);
    }
  };

  const handleShareWhatsApp = async (preferredTarget: 'web' | 'app' = 'web') => {
    setIsSharing(true);
    setShareNotice(null);

    try {
      // 1. Generate high-resolution receipt image (PNG)
      const { file, blob, dataUrl, filename } = await buildReceiptSlipImage({
        tokenNumber: receipt.tokenNumber,
        uhid: receipt.uhid,
        patientName: receipt.patientName,
        age: receipt.age,
        gender: receipt.gender,
        mobile: receipt.mobile,
        referringDoctor: receipt.referringDoctor,
        tests: receipt.tests,
        totalAmount: receipt.totalAmount,
        paidAmount: receipt.paidAmount,
        dueAmount: receipt.dueAmount,
        paymentMode: receipt.paymentMode,
        paymentStatus: receipt.paymentStatus,
        registeredAt: receipt.registeredAt,
        visitType: receipt.visitType,
        address: receipt.address,
        timeSlot: receipt.timeSlot,
        labId: receipt.labId,
        labName: receipt.labName,
        labPhone: receipt.labPhone,
        showPrices: showPrices,
      }, receipt.labName);

      // 2. Mobile WhatsApp Direct Share: Shares Receipt IMAGE file + CAPTION TEXT (with clickable report link!)
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== 'undefined' ? navigator.userAgent : ''
      );

      if (isMobileDevice && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Registration Slip ${receipt.tokenNumber}`,
            text: slipTextMessage,
          });
          setIsSharing(false);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setIsSharing(false);
            return;
          }
        }
      }

      // 3. Desktop / Web Sharing:
      // Download receipt image so user has PNG slip
      downloadReceiptImage(dataUrl, filename);

      // Copy PNG image to clipboard for easy Ctrl+V in WhatsApp Web
      let copiedImage = false;
      try {
        if (navigator.clipboard && (window as any).ClipboardItem && blob) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob }),
          ]);
          copiedImage = true;
        }
      } catch {
        try {
          await navigator.clipboard.writeText(slipTextMessage);
        } catch {}
      }

      // 4. Open WhatsApp Web or App
      const targetUrl = preferredTarget === 'app' ? whatsappAppUrl : whatsappWebUrl;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');

      setShareNotice(
        preferredTarget === 'app'
          ? 'WhatsApp App opened with slip text! Slip image downloaded.'
          : copiedImage
          ? 'WhatsApp Web opened with complete slip text & Report Link! Slip image downloaded & copied to clipboard (press Ctrl+V in WhatsApp chat to paste image).'
          : 'WhatsApp Web opened with complete slip text & Report Link! Slip image downloaded.'
      );
    } catch (e) {
      console.warn('Image/WhatsApp error:', e);
      const targetUrl = preferredTarget === 'app' ? whatsappAppUrl : whatsappWebUrl;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setShareNotice('WhatsApp opened with slip text!');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-5 sm:p-6 space-y-4 max-w-md w-full mx-auto text-slate-800 relative max-h-[92vh] overflow-y-auto">
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
          <span>Registration Confirmed</span>
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

        {/* 3. Website Booking Approval Notice (only for website bookings) */}
        {receipt.bookingSource?.toLowerCase().includes('website') && (
          <div className="mt-3 pt-2.5 border-t border-amber-200/80 bg-amber-50/95 -mx-4 -mb-4 px-3 py-2 border-dashed flex items-center justify-center gap-1.5 text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px] sm:text-xs font-black text-amber-950 text-center tracking-tight">
              (Booking submitted. Final confirmation after Lab Owner approval.)
            </span>
          </div>
        )}
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
                  {showPrices && price !== null && (
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
          {showPrices ? (
            <>
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
            </>
          ) : (
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Booking Token Registered with Lab</span>
              </div>
              <p className="text-[11px] text-teal-800 mt-1 leading-snug">
                Your test appointment has been registered. The final bill and invoice will be issued directly at the laboratory reception counter / department.
              </p>
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

      {/* 5. Action Buttons: Share Slip with Text on WhatsApp Web + Options */}
      <div className="space-y-2 pt-1">
        {/* Notice Banner if WhatsApp Web opened or image copied */}
        {shareNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{shareNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setShareNotice(null)}
                className="text-emerald-700 hover:text-emerald-950 p-0.5 shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 pt-0.5 border-t border-emerald-200/80">
              <span className="font-semibold">WhatsApp Web didn't open?</span>
              <a
                href={whatsappWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-black underline text-emerald-900 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Click here to open WhatsApp Web</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* PRIMARY ACTION: Share Slip with Text on WhatsApp Web */}
        <button
          type="button"
          disabled={isSharing}
          onClick={() => handleShareWhatsApp('web')}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
          title="Share complete slip with text and report link on WhatsApp Web"
        >
          {isSharing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Opening WhatsApp Web with Slip...</span>
            </span>
          ) : (
            <>
              <Globe className="w-4 h-4 text-emerald-200" />
              <span>Share Slip with Text (WhatsApp Web)</span>
            </>
          )}
        </button>

        {/* Downloads: Slip Image (PNG) + PDF */}
        <div className="grid grid-cols-2 gap-2">
          {/* Download Image Button */}
          <button
            type="button"
            onClick={handleDownloadImage}
            className="bg-teal-700 hover:bg-teal-800 text-white py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
            title="Download receipt slip as image (PNG)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-200" />
            <span>Slip Image (PNG)</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
            title="Download token receipt PDF"
          >
            <Download className="w-3.5 h-3.5 text-cyan-300" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Print & Close */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={handlePrintSlip}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-3 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Slip</span>
          </button>

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
