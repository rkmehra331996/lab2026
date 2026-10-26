import QRCode from 'qrcode';
import { buildPatientReportUrl } from './domainRouting';

export interface ReceiptImageParams {
  tokenNumber: string;
  uhid?: string;
  patientName: string;
  age?: number | string;
  gender?: string;
  mobile?: string;
  referringDoctor?: string;
  tests: Array<string | { name: string; price?: number }>;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentMode?: string;
  paymentStatus?: string;
  registeredAt?: string;
  visitType?: string;
  address?: string;
  timeSlot?: string;
  labId?: string;
  labName?: string;
  labPhone?: string;
  showPrices?: boolean;
}

/**
 * Builds a high-resolution Diagnostic Laboratory Receipt Slip as an Image (PNG)
 * Uses 2x canvas resolution (1400px wide) so text, barcodes, and QR codes are razor sharp on mobile & desktop.
 */
export async function buildReceiptSlipImage(
  receipt: ReceiptImageParams,
  labNameRaw?: string
): Promise<{
  canvas: HTMLCanvasElement;
  dataUrl: string;
  blob: Blob;
  file: File;
  filename: string;
  reportUrl: string;
}> {
  const labName = receipt.labName || labNameRaw || 'Apex Diagnostic & Clinical Laboratory';
  const token = (receipt.tokenNumber || 'TK-101').trim();
  const patient = (receipt.patientName || 'Patient').trim();
  const uhid = (receipt.uhid || `UHID-W-${token.replace(/\D/g, '') || '101'}`).trim();
  const mobile = (receipt.mobile || '').replace(/\D/g, '');
  const clean10 = mobile.length >= 10 ? mobile.slice(-10) : mobile;
  const doctor = (receipt.referringDoctor || 'Self / Direct Walk-in').trim();
  const dateStr = receipt.registeredAt || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const showPrices = receipt.showPrices !== false;

  const testList: string[] = (receipt.tests || []).map((t) =>
    typeof t === 'string' ? t : t.name
  );
  if (testList.length === 0) {
    testList.push('Diagnostic Investigation');
  }

  // Build the patient-specific report URL
  const reportUrl = buildPatientReportUrl(receipt.labId, token);

  // Generate QR code data URL for reportUrl
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(reportUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#123B6D',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch {
    // fallback if QR generation fails
    qrDataUrl = '';
  }

  // Pre-load QR image if available
  let qrImage: HTMLImageElement | null = null;
  if (qrDataUrl) {
    try {
      qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = qrDataUrl;
      });
    } catch {
      qrImage = null;
    }
  }

  // Dimensions: 700px width at 2x scale = 1400px canvas
  const scale = 2;
  const baseWidth = 680;

  // Dynamic height calculation
  const headerHeight = 120;
  const tokenBoxHeight = 110;
  const patientBoxHeight = 130;
  const testItemsHeight = Math.max(70, testList.length * 32 + 45);
  const billingHeight = showPrices ? 90 : 50;
  const qrSectionHeight = 160;
  const footerHeight = 65;

  const baseHeight =
    headerHeight +
    tokenBoxHeight +
    patientBoxHeight +
    testItemsHeight +
    billingHeight +
    qrSectionHeight +
    footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = baseWidth * scale;
  canvas.height = baseHeight * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.scale(scale, scale);

  // 1. Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // Outer border with subtle rounded styling
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  roundRect(ctx, 12, 12, baseWidth - 24, baseHeight - 24, 18);
  ctx.stroke();

  // Subtle top accent line (Navy Blue & Teal gradient)
  const topGrad = ctx.createLinearGradient(12, 12, baseWidth - 12, 12);
  topGrad.addColorStop(0, '#123B6D');
  topGrad.addColorStop(0.5, '#1E4E8C');
  topGrad.addColorStop(1, '#0F766E');
  ctx.fillStyle = topGrad;
  roundRectTop(ctx, 12, 12, baseWidth - 24, 8, 18);
  ctx.fill();

  let curY = 32;

  // 2. Green Confirmation Pill Banner
  const bannerW = 380;
  const bannerH = 28;
  const bannerX = (baseWidth - bannerW) / 2;
  ctx.fillStyle = '#ECFDF5';
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 1.2;
  roundRect(ctx, bannerX, curY, bannerW, bannerH, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓  REGISTRATION CONFIRMED • TOKEN ISSUED', baseWidth / 2, curY + bannerH / 2);

  curY += bannerH + 16;

  // 3. Laboratory Name & Header
  ctx.fillStyle = '#123B6D';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(labName, baseWidth / 2, curY);

  curY += 18;
  ctx.fillStyle = '#64748B';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const subtitle = `Government Verified & Accredited Diagnostic Center  •  ${receipt.labPhone ? `Ph: +91 ${receipt.labPhone}` : 'Ph: +91 7087033009'}`;
  ctx.fillText(subtitle, baseWidth / 2, curY);

  curY += 18;
  // Dotted separator line
  drawDashedLine(ctx, 30, curY, baseWidth - 30, curY);
  curY += 14;

  // 4. Highlighted Token Number Box (Navy/Blue Tint Card)
  const tokenBoxX = 28;
  const tokenBoxW = baseWidth - 56;
  const tokenBoxH = 92;

  ctx.fillStyle = '#F0F7FF';
  ctx.strokeStyle = '#123B6D';
  ctx.lineWidth = 1.8;
  roundRect(ctx, tokenBoxX, curY, tokenBoxW, tokenBoxH, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OFFICIAL PATIENT QUEUE TOKEN', baseWidth / 2, curY + 20);

  ctx.fillStyle = '#123B6D';
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(token, baseWidth / 2, curY + 54);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`UHID: ${uhid}    •    Date: ${dateStr}`, baseWidth / 2, curY + 76);

  curY += tokenBoxH + 16;

  // 5. Patient Demographics Card
  const patBoxX = 28;
  const patBoxW = baseWidth - 56;
  const patBoxH = 105;

  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.2;
  roundRect(ctx, patBoxX, curY, patBoxW, patBoxH, 12);
  ctx.fill();
  ctx.stroke();

  // Column 1: Patient Name & Age/Gender
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PATIENT NAME', patBoxX + 16, curY + 22);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(patient.slice(0, 26), patBoxX + 16, curY + 40);

  ctx.fillStyle = '#475569';
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${receipt.age || '-'} Yrs / ${receipt.gender || 'Unknown'}`, patBoxX + 16, curY + 58);

  ctx.fillStyle = '#0F766E';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const visitText = receipt.visitType === 'Home Collection' ? '📍 Home Collection Pickup' : '🏢 Direct Lab Walk-in';
  ctx.fillText(visitText, patBoxX + 16, curY + 84);

  // Column 2: Mobile & Ref Doctor
  const col2X = patBoxX + patBoxW / 2 + 10;
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('REGISTERED MOBILE', col2X, curY + 22);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(clean10 ? `+91 ${clean10}` : 'Self Registered', col2X, curY + 40);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('REFERRING DOCTOR', col2X, curY + 64);

  ctx.fillStyle = '#334155';
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(doctor.slice(0, 24), col2X, curY + 84);

  curY += patBoxH + 16;

  // 6. Prescribed Tests Section
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`PRESCRIBED DIAGNOSTIC TESTS (${testList.length})`, 32, curY);
  curY += 10;

  testList.forEach((testName, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    ctx.fillRect(28, curY, baseWidth - 56, 26);

    ctx.fillStyle = '#334155';
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}.  ${testName}`, 36, curY + 17);

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('✓ Prescribed', baseWidth - 40, curY + 17);

    curY += 28;
  });

  curY += 10;

  // 7. Billing Summary Box
  const billBoxX = 28;
  const billBoxW = baseWidth - 56;
  const billBoxH = showPrices ? 74 : 38;

  ctx.fillStyle = showPrices ? '#F1F5F9' : '#ECFDF5';
  ctx.strokeStyle = showPrices ? '#CBD5E1' : '#A7F3D0';
  ctx.lineWidth = 1;
  roundRect(ctx, billBoxX, curY, billBoxW, billBoxH, 10);
  ctx.fill();
  ctx.stroke();

  if (showPrices) {
    const gross = Number(receipt.totalAmount) || 0;
    const paid = Number(receipt.paidAmount) || 0;
    const due = receipt.dueAmount !== undefined ? Number(receipt.dueAmount) : Math.max(0, gross - paid);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Total Bill: ₹${gross}`, billBoxX + 16, curY + 24);
    ctx.fillText(`Amount Paid: ₹${paid} (${receipt.paymentMode || 'Cash'})`, billBoxX + 16, curY + 48);

    ctx.textAlign = 'right';
    if (due > 0) {
      ctx.fillStyle = '#BE123C';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Due on Spot: ₹${due}`, billBoxX + billBoxW - 16, curY + 36);
    } else {
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`✓ Full Advance Paid`, billBoxX + billBoxW - 16, curY + 36);
    }
  } else {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#065F46';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Registration Confirmed • Pay Test Charges at Lab Reception / Spot', baseWidth / 2, curY + 23);
  }

  curY += billBoxH + 16;

  // 8. QR Code & Direct Report Verification Card
  const qrBoxX = 28;
  const qrBoxW = baseWidth - 56;
  const qrBoxH = 144;

  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.2;
  roundRect(ctx, qrBoxX, curY, qrBoxW, qrBoxH, 14);
  ctx.fill();
  ctx.stroke();

  // Draw QR Image
  const qrSize = 114;
  const qrImgX = qrBoxX + 16;
  const qrImgY = curY + 15;

  if (qrImage) {
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, qrImgX - 4, qrImgY - 4, qrSize + 8, qrSize + 8, 8);
    ctx.fill();
    ctx.drawImage(qrImage, qrImgX, qrImgY, qrSize, qrSize);
  }

  // QR Instructions
  const textLeft = qrImgX + qrSize + 18;
  ctx.textAlign = 'left';

  ctx.fillStyle = '#123B6D';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('SCAN QR TO TRACK & VIEW REPORT', textLeft, curY + 34);

  ctx.fillStyle = '#475569';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Scan with any Camera or UPI App to verify registration,', textLeft, curY + 54);
  ctx.fillText('check sample status, and view verified digital report.', textLeft, curY + 70);

  // Link Pill
  const pillW = qrBoxW - (textLeft - qrBoxX) - 16;
  ctx.fillStyle = '#EFF6FF';
  ctx.strokeStyle = '#BFDBFE';
  roundRect(ctx, textLeft, curY + 86, pillW, 36, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1D4ED8';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`🔗 ${reportUrl.replace(/^https?:\/\//, '')}`, textLeft + 10, curY + 108);

  curY += qrBoxH + 16;

  // 9. Footer Safety Strip
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 10.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Please present this slip image at the blood collection counter  •  Official Digital Slip', baseWidth / 2, curY + 6);

  // Export to Blob & File
  const filename = `Receipt-${token.replace(/\s+/g, '_')}-${patient.replace(/\s+/g, '_')}.png`;
  const dataUrl = canvas.toDataURL('image/png');

  const blob: Blob = await new Promise((resolve) => {
    canvas.toBlob((b) => {
      resolve(b || new Blob([], { type: 'image/png' }));
    }, 'image/png');
  });

  const file = new File([blob], filename, { type: 'image/png' });

  return {
    canvas,
    dataUrl,
    blob,
    file,
    filename,
    reportUrl,
  };
}

/**
 * Helper to download the receipt image to user's device
 */
export function downloadReceiptImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Canvas rounded rect helpers
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function roundRectTop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dashLen: number = 4
) {
  ctx.save();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.setLineDash([dashLen, dashLen]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
