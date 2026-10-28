import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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
  Copy,
  FileText,
  Eye,
  QrCode as QrCodeIcon,
} from 'lucide-react';
import { generateThermalReceiptPdf } from '../../utils/pdfGenerator';
import { safePrint } from '../../utils/printHelper';
import { buildPatientReportUrl } from '../../utils/domainRouting';
import { getTenantDirectUrl } from '../../constants/domains';
import {
  buildReceiptSlipImage,
  downloadReceiptImage,
  uploadReceiptSlipImage,
} from '../../utils/receiptImageGenerator';

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
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'slip' | 'image_preview'>('slip');
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

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

  // Generate on-screen QR Code on component load
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(reportUrl, {
      margin: 1,
      width: 160,
      color: {
        dark: '#123B6D',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch((e) => console.warn('QR code generation error:', e));

    return () => {
      isMounted = false;
    };
  }, [reportUrl]);

  // Pre-generate slip image preview when user switches to image preview tab
  useEffect(() => {
    if (activeTab === 'image_preview' && !generatedImageDataUrl) {
      buildReceiptSlipImage(
        {
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
          discountINR: receipt.discountINR,
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
          upiTransactionRef: receipt.upiTransactionRef,
        },
        receipt.labName
      )
        .then((res) => setGeneratedImageDataUrl(res.dataUrl))
        .catch((e) => console.warn('Preview generation error:', e));
    }
  }, [activeTab, generatedImageDataUrl, receipt, showPrices]);

  // Generate structured message for WhatsApp (will also include uploaded slip image link)
  const buildSlipTextMessage = (uploadedSlipUrl?: string | null) => {
    return [
      `🏥 *${receipt.labName.toUpperCase()}*`,
      `📍 *Official Patient Registration & Billing Slip*`,
      ``,
      `Dear *${receipt.patientName}*, your diagnostic registration is confirmed. ✅`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🎫 *TOKEN NUMBER:* *${receipt.tokenNumber}*`,
      `📋 *UHID:* ${receipt.uhid}`,
      `📅 *Date & Time:* ${receipt.registeredAt || dateStr}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *PATIENT INFORMATION*`,
      `• Patient: *${receipt.patientName}* (${receipt.age} Yrs / ${receipt.gender})`,
      `• Mobile: +91 ${receipt.mobile}`,
      receipt.referringDoctor ? `• Ref. Doctor: ${receipt.referringDoctor}` : '',
      receipt.visitType === 'Home Collection' && receipt.address
        ? `• Home Pickup: ${receipt.address}${receipt.timeSlot ? ` (${receipt.timeSlot})` : ''}`
        : '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🧪 *PRESCRIBED INVESTIGATIONS (${testNames.length})*`,
      ...testNames.map((name, i) => {
        const item = receipt.tests[i];
        const price = typeof item === 'object' && item?.price ? item.price : null;
        return `  ${i + 1}. ${name}${showPrices && price !== null ? ` — ₹${price}` : ''}`;
      }),
      showPrices ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : '',
      showPrices ? `💰 *BILLING SUMMARY*` : '',
      showPrices ? `• Gross Total: ₹${total}` : '',
      showPrices && discount > 0 ? `• Concession: -₹${discount}` : '',
      showPrices ? `• Net Payable: *₹${net}*` : '',
      showPrices ? `• Amount Paid: ₹${paid} (${receipt.paymentMode || 'Cash'})` : '',
      receipt.upiTransactionRef ? `• 🔍 *UPI Reference / UTR:* *${receipt.upiTransactionRef}*` : '',
      showPrices
        ? due > 0
          ? `• Status: ⚠️ *Balance Due: ₹${due}* (Pay on Spot)`
          : `• Status: ✅ *PAID IN FULL*`
        : '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔗 *REPORT Download:* ${reportUrl}`,
      `🌐 *Website:* ${getTenantDirectUrl(receipt.labId)}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📍 *${receipt.labName}*${receipt.labPhone ? ` • Helpline: ${receipt.labPhone}` : ''}`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  // Standard reception entry format for generateThermalReceiptPdf
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
    discountINR: showPrices ? receipt.discountINR || 0 : 0,
    paidAmount: showPrices ? receipt.paidAmount : 0,
    dueAmount: showPrices ? receipt.dueAmount : 0,
    paymentMode: receipt.paymentMode,
    upiTransactionRef: receipt.upiTransactionRef,
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
      const { dataUrl, filename } = await buildReceiptSlipImage(
        {
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
          discountINR: receipt.discountINR,
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
          upiTransactionRef: receipt.upiTransactionRef,
        },
        receipt.labName
      );
      setGeneratedImageDataUrl(dataUrl);
      downloadReceiptImage(dataUrl, filename);
    } catch (e) {
      console.error('Download image error:', e);
    }
  };

  const handleCopySlipImage = async () => {
    setIsCopyingImage(true);
    setCopySuccess(false);
    try {
      const { blob, dataUrl } = await buildReceiptSlipImage(
        {
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
          discountINR: receipt.discountINR,
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
          upiTransactionRef: receipt.upiTransactionRef,
        },
        receipt.labName
      );
      setGeneratedImageDataUrl(dataUrl);

      if (navigator.clipboard && (window as any).ClipboardItem && blob) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob }),
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } else {
        await navigator.clipboard.writeText(buildSlipTextMessage(null));
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      }
    } catch (err) {
      console.warn('Copy slip image failed:', err);
    } finally {
      setIsCopyingImage(false);
    }
  };

  /**
   * Primary Action: Share Slip with Image & Text on WhatsApp Web / Mobile
   * 1. Builds the high-resolution PNG Slip Image
   * 2. Uploads it to get a permanent public link embedded directly in the message
   * 3. Copies the image to clipboard (for 1-click Ctrl+V pasting in WhatsApp Web)
   * 4. Downloads the image locally
   * 5. Uses native file sharing if supported (mobile WhatsApp attaches image directly)
   * 6. Opens WhatsApp Web / App with complete formatted text and direct image link
   */
  const handleShareWhatsApp = async (preferredTarget: 'web' | 'app' = 'web') => {
    setIsSharing(true);
    setShareNotice(null);

    try {
      // 1. Generate high-resolution receipt image (PNG)
      const { file, blob, dataUrl, filename } = await buildReceiptSlipImage(
        {
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
          discountINR: receipt.discountINR,
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
          upiTransactionRef: receipt.upiTransactionRef,
        },
        receipt.labName
      );

      setGeneratedImageDataUrl(dataUrl);

      // 2. Upload image to server to generate a permanent direct public link for WhatsApp
      let publicImageUrl: string | null = null;
      try {
        publicImageUrl = await uploadReceiptSlipImage(
          dataUrl,
          `slip_${receipt.tokenNumber.replace(/[^a-zA-Z0-9]/g, '_')}`
        );
      } catch (uploadErr) {
        console.warn('Slip image upload warning:', uploadErr);
      }

      // 3. Prepare the final complete text message with image link
      const finalMessage = buildSlipTextMessage(publicImageUrl);
      const encodedMsg = encodeURIComponent(finalMessage);

      const targetWebUrl = clean10
        ? `https://web.whatsapp.com/send?phone=91${clean10}&text=${encodedMsg}`
        : `https://web.whatsapp.com/send?text=${encodedMsg}`;

      const targetAppUrl = clean10
        ? `https://wa.me/91${clean10}?text=${encodedMsg}`
        : `https://wa.me/?text=${encodedMsg}`;

      // 4. Mobile WhatsApp Native Direct Share (Sends actual PNG image file directly to WhatsApp!)
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== 'undefined' ? navigator.userAgent : ''
      );

      if (
        isMobileDevice &&
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `Registration Slip ${receipt.tokenNumber}`,
            text: finalMessage,
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

      // 5. Desktop / Web Sharing:
      // A. Copy PNG image to clipboard for easy Ctrl+V in WhatsApp Web
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
          await navigator.clipboard.writeText(finalMessage);
        } catch {}
      }

      // B. Trigger file download so user has the PNG slip file immediately
      downloadReceiptImage(dataUrl, filename);

      // C. Open WhatsApp Web or App in new tab
      const targetUrl = preferredTarget === 'app' ? targetAppUrl : targetWebUrl;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');

      setShareNotice(
        copiedImage
          ? '✅ WhatsApp Web opened with Slip Text & Direct Image Link! Slip Image is copied to clipboard (press Ctrl+V in WhatsApp to paste image) and downloaded.'
          : '✅ WhatsApp Web opened with Slip Text & Direct Image Link! Slip Image is downloaded.'
      );
    } catch (e) {
      console.warn('Image/WhatsApp error:', e);
      const fallbackMsg = buildSlipTextMessage(null);
      const encodedFallback = encodeURIComponent(fallbackMsg);
      const fallbackUrl = clean10
        ? `https://web.whatsapp.com/send?phone=91${clean10}&text=${encodedFallback}`
        : `https://web.whatsapp.com/send?text=${encodedFallback}`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      setShareNotice('WhatsApp Web opened with slip text!');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl space-y-3.5 max-w-lg w-full mx-auto text-slate-800 relative max-h-[94vh] overflow-y-auto">
      {/* Close Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-full transition cursor-pointer backdrop-blur-xs"
          title="Close receipt"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* DESIGN 2 APPLIED: Official Header Banner (#123B6D Navy Blue) */}
      <div className="bg-[#123B6D] text-white px-5 pt-6 pb-4 rounded-t-3xl relative overflow-hidden text-center shadow-xs">
        {/* Decorative corner accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-400/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-blue-400/10 rounded-full blur-lg pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-sky-100 text-[11px] font-bold mb-2 shadow-2xs backdrop-blur-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Patient Registration Confirmed</span>
        </div>

        <h3 className="text-base sm:text-lg font-black tracking-tight uppercase text-white leading-snug">
          {receipt.labName}
        </h3>
        <p className="text-xs font-semibold text-sky-200 mt-0.5 tracking-wide">
          Official Patient Registration &amp; Billing Slip
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-sky-100/90 mt-2 font-medium">
          {receipt.labPhone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-sky-300" />
              <span>Helpline: {receipt.labPhone}</span>
            </span>
          )}
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-300" />
            <span>{receipt.registeredAt || dateStr}</span>
          </span>
        </div>

        {/* View Switcher: Slip Design vs Generated PNG Image Preview */}
        <div className="mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('slip')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'slip'
                ? 'bg-white text-[#123B6D] shadow-xs'
                : 'text-sky-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Official Slip View</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image_preview')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'image_preview'
                ? 'bg-white text-[#123B6D] shadow-xs'
                : 'text-sky-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Full PNG Slip Preview</span>
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-6 pb-5 space-y-3.5">
        {activeTab === 'image_preview' ? (
          /* TAB 2: Generated Full PNG Slip Preview */
          <div className="space-y-3 text-center">
            <div className="text-xs text-slate-500 font-medium">
              High-resolution PNG slip image generated for WhatsApp and mobile sharing:
            </div>
            <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50 overflow-hidden shadow-inner flex justify-center">
              {generatedImageDataUrl ? (
                <img
                  src={generatedImageDataUrl}
                  alt="Official Slip"
                  className="max-h-[500px] w-auto rounded-xl object-contain shadow-sm border border-slate-200"
                />
              ) : (
                <div className="py-16 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>Rendering Slip Image (PNG)...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAB 1: Official Slip View (Styled identically to the 2nd Slip Image Design) */
          <>
            {/* DESIGN 2: TOKEN BADGE (#EFF6FF with #BFDBFE border) */}
            <div className="bg-[#EFF6FF] border-2 border-[#BFDBFE] rounded-2xl p-3.5 relative overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#1E3A8A]">
                    TOKEN NUMBER
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-[#1D4ED8] tracking-tight font-mono leading-none mt-0.5">
                    {receipt.tokenNumber}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="inline-block bg-white/90 border border-blue-200/90 text-slate-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg shadow-2xs">
                    UHID: {receipt.uhid}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Reg: {receipt.registeredAt || dateStr}
                  </span>
                </div>
              </div>

              {/* Website Booking Approval Notice if applicable */}
              {receipt.bookingSource?.toLowerCase().includes('website') && (
                <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex items-center gap-1.5 text-amber-900 bg-amber-50/80 -mx-3.5 -mb-3.5 px-3 py-1.5 border-dashed">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-bold tracking-tight">
                    Online booking submitted. Final confirmation upon lab check-in.
                  </span>
                </div>
              )}
            </div>

            {/* DESIGN 2: PATIENT INFO BOX (#F1F5F9 Slate Box) */}
            <div className="bg-[#F1F5F9] border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    Patient Name
                  </span>
                  <h4 className="font-black text-[#0F172A] text-sm sm:text-base leading-tight">
                    {receipt.patientName}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    Contact Mobile
                  </span>
                  <span className="font-mono font-bold text-slate-900 block">
                    +91 {receipt.mobile}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1 border-t border-slate-200/60 text-slate-600 text-[11px]">
                <span>
                  Age &amp; Gender:{' '}
                  <strong className="text-slate-800 font-semibold">
                    {receipt.age} Yrs / {receipt.gender}
                  </strong>
                </span>
                <span>
                  Ref. Doctor:{' '}
                  <strong className="text-slate-800 font-semibold">
                    {receipt.referringDoctor || 'Self / Direct'}
                  </strong>
                </span>
              </div>

              {receipt.visitType === 'Home Collection' && (
                <div className="mt-1.5 pt-1.5 border-t border-teal-200/60 bg-teal-50/90 -mx-3.5 -mb-3.5 px-3 py-2 rounded-b-2xl text-[11px] text-teal-950 flex items-start gap-1.5">
                  <Home className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Home Sample Pickup: </span>
                    <span>{receipt.address || 'Address provided'}</span>
                    {receipt.timeSlot && (
                      <span className="font-semibold text-teal-800"> ({receipt.timeSlot})</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DESIGN 2: PRESCRIBED INVESTIGATIONS SECTION */}
            <div className="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-2 shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  PRESCRIBED INVESTIGATIONS ({receipt.tests.length})
                </span>
                {showPrices && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Rate (₹)</span>
                )}
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 divide-y divide-slate-50">
                {receipt.tests.map((testItem, i) => {
                  const name = typeof testItem === 'string' ? testItem : testItem.name;
                  const price =
                    typeof testItem === 'object' && testItem.price ? testItem.price : null;
                  return (
                    <div
                      key={i}
                      className="flex justify-between items-center py-1 text-xs text-slate-800"
                    >
                      <span className="font-medium truncate pr-2">
                        {i + 1}. {name}
                      </span>
                      {showPrices && price !== null && (
                        <span className="font-mono font-bold text-slate-700 shrink-0">
                          ₹{price}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DESIGN 2: BILLING SUMMARY BOX */}
            {showPrices ? (
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Gross Total Amount:</span>
                  <span className="font-mono font-bold text-slate-800">₹{receipt.totalAmount}</span>
                </div>

                {(receipt.discountINR || 0) > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-700 font-medium">
                    <span>Discount / Concession:</span>
                    <span className="font-mono font-bold">-₹{receipt.discountINR}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono text-base font-black text-[#123B6D]">₹{net}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-700 pt-1 border-t border-slate-100">
                  <span className="font-medium">
                    Amount Paid ({receipt.paymentMode || 'Cash'}):
                  </span>
                  <span className="font-mono font-bold text-emerald-700">₹{receipt.paidAmount}</span>
                </div>

                {due > 0 ? (
                  <div className="flex justify-between items-center p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Balance Due (Pay on Spot):</span>
                    </span>
                    <span className="font-mono text-sm font-black text-rose-700">₹{due}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Payment Status:</span>
                    </span>
                    <span className="text-[11px] font-black uppercase text-emerald-700">
                      PAID IN FULL
                    </span>
                  </div>
                )}

                {receipt.upiTransactionRef ? (
                  <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 font-medium mt-1">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                      <span>UPI Reference / UTR Number:</span>
                    </span>
                    <span className="font-mono font-black text-xs sm:text-sm text-purple-900 bg-white px-2.5 py-0.5 rounded-lg border border-purple-300 shadow-2xs tracking-wider">
                      {receipt.upiTransactionRef}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* DESIGN 2: QR CODE SCAN & ONLINE REPORT SECTION */}
            <div className="border border-slate-200/90 rounded-2xl p-3 bg-gradient-to-b from-white to-blue-50/40 text-center space-y-2 shadow-2xs">
              <div className="flex items-center justify-center gap-3">
                {qrCodeDataUrl ? (
                  <div className="p-1 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0">
                    <img
                      src={qrCodeDataUrl}
                      alt="Report QR Code"
                      className="w-18 h-18 sm:w-20 sm:h-20"
                    />
                  </div>
                ) : (
                  <div className="w-18 h-18 bg-slate-100 rounded-xl flex items-center justify-center">
                    <QrCodeIcon className="w-8 h-8 text-slate-400" />
                  </div>
                )}

                <div className="text-left space-y-1">
                  <div className="text-[11px] font-black uppercase tracking-wider text-[#123B6D] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Scan to View &amp; Download Report</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Scan with any phone camera or tap link below to view verified test reports
                    without login:
                  </p>
                  <a
                    href={reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D4ED8] hover:underline"
                  >
                    <span>🔗 REPORT Download</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <div className="pt-0.5">
                    <a
                      href={getTenantDirectUrl(receipt.labId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline"
                    >
                      <Globe className="w-3 h-3 shrink-0" />
                      <span>🌐 Lab Website</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* NOTICES & FEEDBACK */}
        {shareNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1.5 animate-in fade-in duration-150">
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
            <div className="text-[11px] text-emerald-800 flex items-center justify-between pt-1 border-t border-emerald-200/80">
              <span>Quick Actions:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySlipImage}
                  className="font-bold underline text-emerald-900 hover:text-emerald-950 cursor-pointer inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Re-copy Image</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="font-bold underline text-emerald-900 hover:text-emerald-950 cursor-pointer inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {copySuccess && (
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Slip Image copied to clipboard! Paste directly (Ctrl+V) into WhatsApp Web.</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="space-y-2 pt-1">
          {/* PRIMARY ACTION: Share Slip with Image & Text on WhatsApp Web */}
          <button
            type="button"
            disabled={isSharing}
            onClick={() => handleShareWhatsApp('web')}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] active:scale-98 text-white py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-md disabled:opacity-60"
            title="Share slip with image and text on WhatsApp Web"
          >
            {isSharing ? (
              <span className="flex items-center gap-2 py-0.5">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Preparing WhatsApp Slip &amp; Image...</span>
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-100" />
                  <span>Share Slip &amp; Image (WhatsApp Web)</span>
                </span>
                <span className="text-[10px] font-medium text-emerald-100 opacity-90">
                  (Attaches Direct Slip Image Link + Copies Image for Ctrl+V Paste)
                </span>
              </>
            )}
          </button>

          {/* SECONDARY ROW 1: Slip Image (PNG) + Copy Slip Image */}
          <div className="grid grid-cols-2 gap-2">
            {/* Download Slip Image (PNG) Button */}
            <button
              type="button"
              onClick={handleDownloadImage}
              className="bg-[#0F766E] hover:bg-[#0d645e] text-white py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              title="Download high-resolution receipt slip image (PNG)"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-200" />
              <span>Slip Image (PNG)</span>
            </button>

            {/* Copy Slip Image to Clipboard Button */}
            <button
              type="button"
              disabled={isCopyingImage}
              onClick={handleCopySlipImage}
              className="bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 disabled:opacity-60"
              title="Copy slip image directly to clipboard"
            >
              {isCopyingImage ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-300" />
              )}
              <span>{copySuccess ? 'Copied!' : 'Copy Slip Image'}</span>
            </button>
          </div>

          {/* SECONDARY ROW 2: Download PDF + Print Slip */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="bg-white hover:bg-slate-50 text-[#123B6D] border border-[#123B6D]/30 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
              title="Download token receipt PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#123B6D]" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSlip}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-3 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Print receipt slip"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Slip</span>
            </button>
          </div>

          {/* DONE / BOOK ANOTHER ROW */}
          {(onBookAnother || onClose) && (
            <div className="pt-1">
              {onBookAnother ? (
                <button
                  type="button"
                  onClick={onBookAnother}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Book Another Patient</span>
                </button>
              ) : onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl font-semibold text-xs transition flex items-center justify-center cursor-pointer"
                >
                  <span>Done / Close</span>
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
