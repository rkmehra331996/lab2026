import { buildPatientReportUrl } from './domainRouting';
import { resolveReceiptTestsWithPrices } from './testPriceHelper';

export interface ReceiptShareData {
  tokenNumber: string;
  uhid?: string;
  patientName: string;
  age?: number | string;
  gender?: string;
  mobile: string;
  email?: string;
  referringDoctor?: string;
  tests: Array<{ name: string; price?: number } | string> | string[];
  totalAmount?: number;
  discountINR?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentMode?: string;
  paymentStatus?: string;
  registeredAt?: string;
  visitType?: string;
  address?: string;
  timeSlot?: string;
  upiTransactionRef?: string;
  labId?: string;
  labName?: string;
  labPhone?: string;
  labAddress?: string;
  publicImageUrl?: string | null;
}

export interface ReportShareData {
  reportId: string;
  uhid: string;
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  mobile: string;
  email?: string;
  referringDoctor?: string;
  doctor?: string;
  reportedAt?: string;
  sampleCollectedAt?: string;
  testName?: string;
  testsList?: string[];
  labId?: string;
  labName?: string;
  labPhone?: string;
  labEmail?: string;
  labAddress?: string;
  tokenNumber?: string;
}

/**
 * Normalizes an Indian mobile number to 10 digits
 */
export function normalizePhone10(raw: string | undefined | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Builds the complete WhatsApp share text for a patient's registration & billing receipt slip
 */
export function buildReceiptWhatsAppMessage(data: ReceiptShareData): string {
  const lab = data.labName || 'Diagnostic Laboratory';
  const cleanToken = data.tokenNumber || 'TK-101';
  const cleanUHID = data.uhid || 'UHID-NA';
  const regDate = data.registeredAt || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const resolvedTests = resolveReceiptTestsWithPrices(data.tests || [], data.totalAmount);
  const testLines = resolvedTests.map((t, i) => `  ${i + 1}. ${t.name}${data.totalAmount !== undefined ? ` (₹${t.price})` : ''}`).join('\n');

  const total = data.totalAmount || 0;
  const discount = data.discountINR || 0;
  const net = total - discount;
  const paid = data.paidAmount || 0;
  const due = data.dueAmount ?? Math.max(0, net - paid);

  const reportUrl = buildPatientReportUrl(data.labId, cleanToken);

  const lines = [
    `🏥 *${lab.toUpperCase()}*`,
    `📍 *Official Patient Registration & Billing Slip*`,
    ``,
    `Dear *${data.patientName}*, your diagnostic registration is confirmed. ✅`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🎫 *TOKEN NUMBER:* *${cleanToken}*`,
    `📋 *UHID:* ${cleanUHID}`,
    `📅 *Date & Time:* ${regDate}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *PATIENT INFORMATION*`,
    `• Patient: *${data.patientName}*${data.age || data.gender ? ` (${[data.age ? `${data.age} Yrs` : '', data.gender].filter(Boolean).join(' / ')})` : ''}`,
    `• Mobile: +91 ${data.mobile}`,
    data.email ? `• Email: ${data.email}` : '',
    data.referringDoctor ? `• Ref. Doctor: ${data.referringDoctor}` : '',
    data.visitType === 'Home Collection' && data.address
      ? `• Home Sample Pickup: ${data.address}${data.timeSlot ? ` (${data.timeSlot})` : ''}`
      : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🧪 *PRESCRIBED INVESTIGATIONS (${resolvedTests.length})*`,
    testLines || '  • Routine Diagnostic Investigation',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *BILLING BREAKDOWN*`,
    `• Gross Total: ₹${total}${discount > 0 ? ` | Discount: -₹${discount}` : ''}`,
    `• Net Payable: *₹${net}*`,
    `• Amount Paid: ₹${paid} (${data.paymentMode || 'Cash'})`,
    data.upiTransactionRef ? `• 🔍 *UPI Reference / UTR:* *${data.upiTransactionRef}*` : '',
    due > 0 ? `• Status: ⚠️ *Balance Due: ₹${due}* (Pay on Spot)` : `• Status: ✅ *PAID IN FULL*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔗 *TRACK & VIEW REPORT ONLINE:*`,
    reportUrl,
    data.publicImageUrl ? `🖼️ *Digital Slip Image:* ${data.publicImageUrl}` : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📍 *${lab}*${data.labPhone ? ` • Helpline: ${data.labPhone}` : ''}`,
  ];

  return lines.filter(Boolean).join('\n');
}

/**
 * Builds the WhatsApp web / mobile URL for sharing a receipt slip
 */
export function buildReceiptWhatsAppUrl(data: ReceiptShareData, preferWeb: boolean = false): string {
  const msg = buildReceiptWhatsAppMessage(data);
  const encoded = encodeURIComponent(msg);
  const clean10 = normalizePhone10(data.mobile);

  if (preferWeb) {
    return clean10
      ? `https://web.whatsapp.com/send?phone=91${clean10}&text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;
  }

  return clean10
    ? `https://wa.me/91${clean10}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/**
 * Builds the mailto: URL for sharing a receipt slip via Email ID
 */
export function buildReceiptEmailUrl(data: ReceiptShareData, customRecipientEmail?: string): string {
  const recipient = (customRecipientEmail || data.email || '').trim();
  const lab = data.labName || 'Diagnostic Laboratory';
  const token = data.tokenNumber || 'TK-101';
  const subject = `Official Registration & Billing Receipt - Token #${token} - ${lab}`;

  const resolvedTests = resolveReceiptTestsWithPrices(data.tests || [], data.totalAmount);
  const testLines = resolvedTests.map((t, i) => `  ${i + 1}. ${t.name}${data.totalAmount !== undefined ? ` - Rs. ${t.price}` : ''}`).join('\n');

  const total = data.totalAmount || 0;
  const discount = data.discountINR || 0;
  const net = total - discount;
  const paid = data.paidAmount || 0;
  const due = data.dueAmount ?? Math.max(0, net - paid);
  const reportUrl = buildPatientReportUrl(data.labId, token);

  const body = `Dear ${data.patientName},

Thank you for visiting ${lab}. Your registration and investigation booking is confirmed.

REGISTRATION & PATIENT DETAILS:
--------------------------------------------------
Token Number: ${token}
UHID: ${data.uhid || 'N/A'}
Date & Time: ${data.registeredAt || new Date().toLocaleString('en-IN')}
Patient Name: ${data.patientName} (${[data.age ? `${data.age} Yrs` : '', data.gender].filter(Boolean).join(' / ')})
Contact Mobile: +91 ${data.mobile}
Referring Doctor: ${data.referringDoctor || 'Self / Direct'}
${data.visitType === 'Home Collection' && data.address ? `Home Collection Address: ${data.address} ${data.timeSlot ? `(${data.timeSlot})` : ''}\n` : ''}
PRESCRIBED INVESTIGATIONS (${resolvedTests.length}):
--------------------------------------------------
${testLines}

${data.totalAmount !== undefined ? `BILLING SUMMARY:
--------------------------------------------------
Gross Amount: Rs. ${total}
${discount > 0 ? `Discount / Concession: -Rs. ${discount}\n` : ''}Net Payable Amount: Rs. ${net}
Amount Paid: Rs. ${paid} (${data.paymentMode || 'Cash'})
${data.upiTransactionRef ? `UPI Reference / UTR Number: ${data.upiTransactionRef}\n` : ''}Payment Status: ${due > 0 ? `Balance Due: Rs. ${due}` : 'PAID IN FULL'}
--------------------------------------------------
` : ''}
ONLINE REPORT ACCESS:
You can check report preparation status and download your verified PDF report at:
${reportUrl}
(Secure access - no login password required)

${data.publicImageUrl ? `Digital Receipt Slip Copy:\n${data.publicImageUrl}\n\n` : ''}Please keep this receipt reference safe for collecting your printed report.

Warm regards,
${lab}
${data.labPhone ? `Helpline: ${data.labPhone}\n` : ''}${data.labAddress ? `Address: ${data.labAddress}\n` : ''}`;

  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Builds the WhatsApp message for sharing an authenticated diagnostic report
 */
export function buildReportWhatsAppMessage(data: ReportShareData): string {
  const lab = data.labName || 'Apex Clinical & Pathology Diagnostics';
  const rptId = data.reportId || 'RPT-101';
  const uhid = data.uhid || 'UHID-101';
  const cleanToken = data.tokenNumber || rptId;
  const reportUrl = buildPatientReportUrl(data.labId, cleanToken);
  const repDate = data.reportedAt || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const testTitle = data.testName || (data.testsList && data.testsList.length > 0 ? data.testsList.join(', ') : 'Prescribed Diagnostic Tests');

  const lines = [
    `🏥 *${lab.toUpperCase()}*`,
    `📍 *Official Diagnostic Test Report Ready* ✅`,
    ``,
    `Dear *${data.patientName}*,`,
    `Your laboratory investigations have been clinically verified by the pathologist and your official diagnostic report is ready.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *REPORT ID:* *${rptId}*`,
    `🆔 *UHID:* ${uhid}`,
    `📅 *Report Date:* ${repDate}`,
    `👨‍⚕️ *Consultant Doctor:* ${data.referringDoctor || data.doctor || 'Self / Direct'}`,
    `🧪 *Investigations:* ${testTitle}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📥 *VIEW & DOWNLOAD OFFICIAL PDF REPORT:*`,
    reportUrl,
    ``,
    `*(Click above link to view & download your digitally signed PDF report directly. No password or login required.)*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📍 *${lab}*`,
    data.labPhone ? `📞 Helpline: ${data.labPhone}` : '',
    data.labEmail ? `✉️ Email: ${data.labEmail}` : '',
    `Thank you for trusting our diagnostic services.`,
  ];

  return lines.filter(Boolean).join('\n');
}

/**
 * Builds the WhatsApp URL for sharing a ready diagnostic report
 */
export function buildReportWhatsAppUrl(data: ReportShareData, preferWeb: boolean = false): string {
  const msg = buildReportWhatsAppMessage(data);
  const encoded = encodeURIComponent(msg);
  const clean10 = normalizePhone10(data.mobile);

  if (preferWeb) {
    return clean10
      ? `https://web.whatsapp.com/send?phone=91${clean10}&text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;
  }

  return clean10
    ? `https://wa.me/91${clean10}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/**
 * Builds the mailto: URL for sharing a ready diagnostic report via Email ID
 */
export function buildReportEmailUrl(data: ReportShareData, customRecipientEmail?: string): string {
  const recipient = (customRecipientEmail || data.email || '').trim();
  const lab = data.labName || 'Apex Clinical & Pathology Diagnostics';
  const rptId = data.reportId || 'RPT-101';
  const cleanToken = data.tokenNumber || rptId;
  const reportUrl = buildPatientReportUrl(data.labId, cleanToken);
  const subject = `Official Medical Diagnostic Report - ${data.patientName} (${rptId}) - ${lab}`;

  const testTitle = data.testName || (data.testsList && data.testsList.length > 0 ? data.testsList.join(', ') : 'Diagnostic Profile');

  const body = `Dear ${data.patientName},

We are pleased to inform you that your medical laboratory test report has been signed and certified by our pathologist.

REPORT & PATIENT DETAILS:
--------------------------------------------------
Patient Name: ${data.patientName}${data.patientAge || data.patientGender ? ` (${[data.patientAge ? `${data.patientAge} Yrs` : '', data.patientGender].filter(Boolean).join(' / ')})` : ''}
Report ID: ${rptId}
UHID: ${data.uhid}
Consultant / Ref. Doctor: ${data.referringDoctor || data.doctor || 'Self / Direct'}
Date of Reporting: ${data.reportedAt || new Date().toLocaleString('en-IN')}
Included Investigation(s): ${testTitle}

VIEW & DOWNLOAD OFFICIAL SIGNED PDF REPORT:
--------------------------------------------------
Click the secure link below to view or download your complete NABL-compliant signed PDF report:
${reportUrl}

(Note: This is a direct, verified link. No login password or portal account is required.)

Please consult your treating physician or referring doctor with this report for medical guidance.

Thank you for choosing ${lab}.

Warm regards,
Laboratory Director & Pathology Team
${lab}
${data.labPhone ? `Helpline: ${data.labPhone}\n` : ''}${data.labEmail ? `Email: ${data.labEmail}\n` : ''}${data.labAddress ? `Address: ${data.labAddress}\n` : ''}`;

  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
