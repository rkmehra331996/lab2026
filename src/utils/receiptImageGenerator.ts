import QRCode from 'qrcode';

export interface ReceiptSlipInput {
  tokenNumber: string;
  uhid?: string;
  patientName: string;
  age?: number | string;
  gender?: string;
  mobile?: string;
  referringDoctor?: string;
  tests?: Array<{ name: string; price?: number } | string> | string[];
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  discountINR?: number;
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
  upiTransactionRef?: string;
}

export interface ReceiptSlipImageResult {
  dataUrl: string;
  blob: Blob;
  file: File;
  filename: string;
}

/**
 * Builds a clean, high-resolution PNG receipt slip image for WhatsApp sharing and download.
 */
export async function buildReceiptSlipImage(
  data: ReceiptSlipInput,
  labTitle: string = 'Diagnostic Laboratory'
): Promise<ReceiptSlipImageResult> {
  const width = 640;
  // Estimate canvas height
  const testItems = Array.isArray(data.tests) ? data.tests : [];
  const testCount = Math.max(1, testItems.length);
  const hasUtr = Boolean(data.upiTransactionRef);
  const height = (hasUtr ? 830 : 800) + testCount * 30;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, width, height);

  // Main Card
  const cardX = 20;
  const cardY = 20;
  const cardW = width - 40;
  const cardH = height - 40;
  const radius = 16;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();
  ctx.stroke();

  // Header Banner
  ctx.fillStyle = '#123B6D';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, 110, [radius, radius, 0, 0]);
  ctx.fill();

  // Lab Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(labTitle || data.labName || 'DIAGNOSTIC LABORATORY', width / 2, cardY + 45);

  ctx.fillStyle = '#93C5FD';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillText('Official Patient Registration & Billing Slip', width / 2, cardY + 72);

  if (data.labPhone) {
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Helpline: ${data.labPhone}`, width / 2, cardY + 94);
  }

  // Token Badge
  let y = cardY + 140;
  ctx.fillStyle = '#EFF6FF';
  ctx.strokeStyle = '#BFDBFE';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX + 24, y, cardW - 48, 55, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('TOKEN NUMBER', cardX + 40, y + 25);

  ctx.fillStyle = '#1D4ED8';
  ctx.font = 'bold 22px monospace';
  const cleanToken = data.tokenNumber || 'TK-101';
  ctx.fillText(cleanToken, cardX + 40, y + 47);

  if (data.uhid) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`UHID: ${data.uhid}`, cardX + cardW - 40, y + 34);
  }

  // Patient Info Box
  y += 75;
  ctx.fillStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.roundRect(cardX + 24, y, cardW - 48, 90, 10);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(data.patientName || 'Patient', cardX + 40, y + 30);

  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  const ageGen = [data.age ? `${data.age} Yrs` : '', data.gender].filter(Boolean).join(' / ');
  ctx.fillText(`${ageGen || 'Age/Gender'} • Mob: ${data.mobile || '-'}`, cardX + 40, y + 54);

  if (data.referringDoctor) {
    ctx.fillText(`Ref. Doctor: ${data.referringDoctor}`, cardX + 40, y + 76);
  }

  // Tests Section
  y += 110;
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('PRESCRIBED INVESTIGATIONS', cardX + 30, y);

  y += 12;
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 30, y);
  ctx.lineTo(cardX + cardW - 30, y);
  ctx.stroke();

  y += 24;
  testItems.forEach((item, idx) => {
    const testName = typeof item === 'string' ? item : item.name;
    const testPrice = typeof item === 'string' ? null : item.price;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1E293B';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${idx + 1}. ${testName}`, cardX + 35, y);

    if (data.showPrices !== false && testPrice !== null && testPrice !== undefined) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`₹${testPrice}`, cardX + cardW - 35, y);
    }
    y += 28;
  });

  // Billing Summary Box
  if (data.showPrices !== false && data.totalAmount !== undefined) {
    y += 10;
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    const boxH = hasUtr ? 110 : 85;
    ctx.beginPath();
    ctx.roundRect(cardX + 24, y, cardW - 48, boxH, 10);
    ctx.fill();
    ctx.stroke();

    const total = data.totalAmount || 0;
    const discount = data.discountINR || 0;
    const paid = data.paidAmount || 0;
    const due = data.dueAmount ?? Math.max(0, total - discount - paid);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Total Amount: ₹${total}${discount > 0 ? ` (Disc: -₹${discount})` : ''}`, cardX + 40, y + 30);
    ctx.fillText(`Paid: ₹${paid} (${data.paymentMode || 'Cash'})`, cardX + 40, y + 54);

    if (hasUtr) {
      ctx.fillStyle = '#6D28D9';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`UPI Ref / UTR: ${data.upiTransactionRef}`, cardX + 40, y + 78);
    }

    ctx.textAlign = 'right';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    if (due > 0) {
      ctx.fillStyle = '#DC2626';
      ctx.fillText(`Due Balance: ₹${due}`, cardX + cardW - 40, y + 45);
    } else {
      ctx.fillStyle = '#16A34A';
      ctx.fillText('PAID IN FULL', cardX + cardW - 40, y + 45);
    }
    y += hasUtr ? 120 : 95;
  } else {
    y += 20;
  }

  // QR Code Generation
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://indianlalaji.com';
  const cleanShop = data.labId || '';
  const reportUrl = cleanShop
    ? `${origin}/shop/${encodeURIComponent(cleanShop)}/report/${encodeURIComponent(cleanToken)}`
    : `${origin}/report/${encodeURIComponent(cleanToken)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(reportUrl, {
      margin: 1,
      width: 120,
      color: {
        dark: '#123B6D',
        light: '#FFFFFF',
      },
    });

    const qrImg = new Image();
    qrImg.src = qrDataUrl;
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.onerror = resolve;
    });

    const qrSize = 100;
    const qrX = cardX + (cardW - qrSize) / 2;
    ctx.drawImage(qrImg, qrX, y, qrSize, qrSize);

    y += qrSize + 16;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('SCAN WITH CAMERA TO VIEW & DOWNLOAD REPORT', width / 2, y);

    y += 18;
    ctx.fillStyle = '#64748B';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText('Online reports available on official lab portal', width / 2, y);
  } catch (err) {
    console.error('QR code generation failed on slip image:', err);
  }

  // Convert canvas to Blob & DataURL
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
  });

  const filename = `Receipt_${cleanToken}_${(data.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  return {
    dataUrl,
    blob,
    file,
    filename,
  };
}

/**
 * Downloads a dataUrl directly to the patient's device
 */
export function downloadReceiptImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Uploads the generated receipt image to the server storage to obtain a permanent, publicly shareable link
 * that can be directly attached/opened in WhatsApp chats.
 */
export async function uploadReceiptSlipImage(dataUrl: string, prefix: string = 'slip'): Promise<string | null> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: dataUrl,
        prefix: prefix,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if ((data.status === 'success' || data.url) && data.url) {
        const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
        const cleanUrl: string = data.url;
        return cleanUrl.startsWith('http') ? cleanUrl : `${origin}${cleanUrl}`;
      }
    }
  } catch (err) {
    console.warn('[uploadReceiptSlipImage error]:', err);
  }
  return null;
}

