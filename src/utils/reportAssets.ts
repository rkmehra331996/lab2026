import QRCode from 'qrcode';

/**
 * Generates a crisp, scannable QR code PNG data URL
 */
export async function generateQrDataUrl(
  text: string,
  options?: { size?: number; darkColor?: string; lightColor?: string }
): Promise<string> {
  const size = options?.size || 300;
  const dark = options?.darkColor || '#123B6D';
  const light = options?.lightColor || '#FFFFFF';

  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark,
        light,
      },
    });
  } catch (error) {
    console.warn('QRCode generation failed, falling back to minimal placeholder:', error);
    // Minimal fallback 1x1 png or simple canvas
    return createSimpleQrFallback();
  }
}

/**
 * Creates the official NABL (National Accreditation Board for Testing & Calibration Laboratories)
 * medical accreditation emblem logo as a crisp high-res PNG data URL (600x600).
 */
export function generateNablLogoDataUrl(certNo: string = 'MC-4892'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = 300;
  const cy = 300;

  // Background smooth circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 280, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Outer primary blue ring
  ctx.beginPath();
  ctx.arc(cx, cy, 275, 0, Math.PI * 2);
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#0B3558'; // NABL Deep Blue
  ctx.stroke();

  // Inner golden ring
  ctx.beginPath();
  ctx.arc(cx, cy, 258, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#D97706'; // Amber / Gold
  ctx.stroke();

  // Outer band fill for curved text
  ctx.beginPath();
  ctx.arc(cx, cy, 254, 0, Math.PI * 2);
  ctx.arc(cx, cy, 185, 0, Math.PI * 2, true);
  ctx.fillStyle = '#0B3558';
  ctx.fill();

  // Top curved text: NATIONAL ACCREDITATION BOARD
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Curved text helper
  drawCurvedText(ctx, 'NATIONAL ACCREDITATION BOARD', cx, cy, 222, Math.PI * 1.5, false);
  drawCurvedText(ctx, 'FOR TESTING & CALIBRATION LABORATORIES', cx, cy, 222, Math.PI * 0.5, true);

  // Inner circle
  ctx.beginPath();
  ctx.arc(cx, cy, 180, 0, Math.PI * 2);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0F766E'; // Teal border
  ctx.stroke();

  // Gold decorative stars
  ctx.fillStyle = '#F59E0B';
  drawStar(ctx, cx - 150, cy + 85, 10, 5, 5);
  drawStar(ctx, cx + 150, cy + 85, 10, 5, 5);

  // Central Emblem: NABL bold letters
  ctx.fillStyle = '#0B3558';
  ctx.font = '900 82px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NABL', cx, cy - 50);

  // Medical Cross / Lab Icon
  ctx.fillStyle = '#E11D48'; // Red cross / clinical emblem
  const crossW = 10;
  const crossH = 34;
  ctx.fillRect(cx - crossW / 2, cy - 5, crossW, crossH);
  ctx.fillRect(cx - crossH / 2, cy + (crossH - crossW) / 2 - 5, crossH, crossW);

  // Standard: ISO 15189
  ctx.fillStyle = '#0F766E';
  ctx.font = 'bold 26px Arial, Helvetica, sans-serif';
  ctx.fillText('ISO 15189:2022', cx, cy + 52);

  // Scope: MEDICAL TESTING
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 19px Arial, Helvetica, sans-serif';
  ctx.fillText('MEDICAL TESTING LAB', cx, cy + 82);

  // Accreditation Certificate pill
  const cleanCert = certNo.replace(/^Cert:\s*/i, '').trim();
  const certText = cleanCert.startsWith('MC-') ? cleanCert : `CERT: ${cleanCert}`;
  ctx.fillStyle = '#0B3558';
  ctx.beginPath();
  ctx.roundRect(cx - 110, cy + 105, 220, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#FDE68A'; // Amber gold text
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillText(certText, cx, cy + 124);

  // Govt of India seal note at very bottom
  ctx.fillStyle = '#64748B';
  ctx.font = 'italic 13px Arial, sans-serif';
  ctx.fillText('Govt. of India • QCI Recognized', cx, cy + 155);

  ctx.restore();
  return canvas.toDataURL('image/png');
}

/**
 * Generates an official, translucent background security watermark PNG
 * containing a watermarked QR code, concentric authenticity rings,
 * and hospital submission verification seals for medical credibility.
 */
export async function generateWatermarkedQrDataUrl(params: {
  reportId: string;
  uhid: string;
  nablCode: string;
  patientName: string;
  labName: string;
  verificationHash: string;
}): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = 600;
  const cy = 600;

  // Generate QR code for verification URL
  const verifyUrl = `https://indianlalaji.com/verify?id=${encodeURIComponent(
    params.reportId
  )}&uhid=${encodeURIComponent(params.uhid)}&auth=${encodeURIComponent(
    params.verificationHash.slice(0, 16)
  )}`;

  let qrImg: HTMLImageElement | null = null;
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 420,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0B3558',
        light: '#00000000', // Transparent QR background
      },
    });
    qrImg = await loadImage(qrDataUrl);
  } catch {
    // Canvas fallback if QR generation fails
  }

  // Set global watermark opacity (crisp but subtle so table text is 100% readable)
  ctx.save();
  ctx.globalAlpha = 0.095; // Subtle watermark for hospital records

  // 1. Concentric security guilloche rings
  ctx.strokeStyle = '#0B3558';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 540, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.arc(cx, cy, 515, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0F766E';
  ctx.beginPath();
  ctx.arc(cx, cy, 480, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Circular Watermark Security Text (Outer & Inner Ring)
  ctx.fillStyle = '#0B3558';
  ctx.font = 'bold 28px Arial, Helvetica, sans-serif';
  drawCurvedText(
    ctx,
    '★ OFFICIAL NABL ACCREDITED LABORATORY ★ ISO 15189:2022 COMPLIANT',
    cx,
    cy,
    495,
    Math.PI * 1.5,
    false
  );
  drawCurvedText(
    ctx,
    '★ VERIFIED FOR HOSPITAL SUBMISSION & SURGICAL CLEARANCE ★',
    cx,
    cy,
    495,
    Math.PI * 0.5,
    true
  );

  ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#0F766E';
  drawCurvedText(
    ctx,
    `REPORT ID: ${params.reportId} • UHID: ${params.uhid} • ${params.labName.toUpperCase()}`,
    cx,
    cy,
    450,
    Math.PI * 1.5,
    false
  );

  // 3. Central Watermarked QR Code
  if (qrImg) {
    const qrSize = 380;
    ctx.drawImage(qrImg, cx - qrSize / 2, cy - qrSize / 2, qrSize, qrSize);

    // Decorative NABL emblem in the center of the watermarked QR code
    const emblemSize = 78;
    ctx.beginPath();
    ctx.arc(cx, cy, emblemSize / 2 + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0B3558';
    ctx.stroke();

    ctx.fillStyle = '#0B3558';
    ctx.font = '900 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NABL', cx, cy - 6);
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = '#0F766E';
    ctx.fillText('VERIFIED', cx, cy + 10);
  }

  // 4. Diagonal Security Band across the watermark
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-28 * Math.PI) / 180);

  ctx.fillStyle = '#0B3558';
  ctx.font = '900 38px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HOSPITAL SUBMISSION VERIFIED', 0, -220);

  ctx.font = 'bold 24px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#0F766E';
  ctx.fillText('AUTHENTICATED DIAGNOSTIC RECORD • SECURE NABL AUDIT', 0, 220);

  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText(`HASH: ${params.verificationHash.slice(0, 32)}`, 0, 255);

  ctx.restore();
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * Helper to draw curved text around a circle
 */
function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  inward: boolean
) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const len = text.length;
  // Estimate character angle spacing
  const charSpacing = 0.038;
  const totalAngle = len * charSpacing;
  let angle = inward ? startAngle + totalAngle / 2 : startAngle - totalAngle / 2;

  for (let i = 0; i < len; i++) {
    const char = text[i];
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(0, inward ? radius : -radius);
    if (inward) {
      ctx.rotate(Math.PI);
    }
    ctx.fillText(char, 0, 0);
    ctx.restore();
    angle += inward ? -charSpacing : charSpacing;
  }

  ctx.restore();
}

/**
 * Helper to draw star polygon
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

/**
 * Generates an ultra-light, faded diagonal text watermark in the center of the report page:
 * Line 1: [Vendor Lab Name]
 * Line 2: [Vendor Contact Number]
 * 45° rotation / diagonal
 * Very light / faded opacity (0.055) - zero impact on test readability.
 */
export async function generateLaboratoryLogoWatermark(
  labName?: string,
  labPhone?: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = 600;
  const cy = 600;

  ctx.save();
  ctx.translate(cx, cy);
  // 45° rotation / diagonal
  ctx.rotate(-45 * Math.PI / 180);

  // Very light / faded opacity
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = '#123B6D';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const displayName = (labName || 'APEX DIAGNOSTIC & CLINICAL PATHOLOGY LABORATORY').toUpperCase();
  const rawDigits = (labPhone || '').replace(/\D/g, '');
  const cleanPhone = rawDigits.length >= 10 ? `+91 ${rawDigits.slice(-10)}` : `+91 ${labPhone || '7087033009'}`;

  // Line 1: [Vendor Lab Name] (Scaled to fit diagonal gracefully)
  const nameFontSize = displayName.length > 45 ? 32 : (displayName.length > 30 ? 38 : 46);
  ctx.font = `bold ${nameFontSize}px Arial, Helvetica, sans-serif`;
  ctx.fillText(displayName, 0, -22);

  // Line 2: [Vendor Contact Number]
  ctx.font = `bold 28px Arial, Helvetica, sans-serif`;
  ctx.fillText(cleanPhone, 0, 26);

  ctx.restore();
  return canvas.toDataURL('image/png');
}

/**
 * Generates the official Apex Diagnostics medical crest emblem logo
 * (Blue faceted 'A' with green/teal droplet fluid swoosh)
 */
export function generateApexEmblemDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, 400, 400);

  // 1. Teal/Emerald fluid swoosh and teardrop
  ctx.save();
  ctx.fillStyle = '#00A78E'; // Vibrant emerald-teal
  ctx.beginPath();
  ctx.moveTo(85, 230);
  ctx.bezierCurveTo(45, 280, 85, 360, 165, 360);
  ctx.bezierCurveTo(250, 360, 325, 305, 345, 235);
  ctx.bezierCurveTo(348, 215, 340, 195, 325, 205);
  ctx.bezierCurveTo(310, 215, 305, 235, 295, 255);
  ctx.bezierCurveTo(270, 300, 220, 332, 165, 332);
  ctx.bezierCurveTo(115, 332, 88, 285, 105, 245);
  ctx.bezierCurveTo(110, 235, 95, 220, 85, 230);
  ctx.closePath();
  ctx.fill();

  // Teardrop droplet accent on the lower right
  ctx.beginPath();
  ctx.arc(360, 310, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(360, 280);
  ctx.lineTo(347, 304);
  ctx.lineTo(373, 304);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Bold geometric dark navy 'A' emblem
  ctx.save();
  ctx.fillStyle = '#0E3B6C'; // Deep royal navy
  
  // Left leg of 'A'
  ctx.beginPath();
  ctx.moveTo(200, 50); // Peak
  ctx.lineTo(240, 50);
  ctx.lineTo(165, 315); // Bottom left outer
  ctx.lineTo(105, 315);
  ctx.closePath();
  ctx.fill();

  // Right leg of 'A'
  ctx.beginPath();
  ctx.moveTo(200, 50); // Peak
  ctx.lineTo(160, 50);
  ctx.lineTo(270, 315); // Bottom right outer
  ctx.lineTo(330, 315);
  ctx.closePath();
  ctx.fill();

  // Sharp faceted cutouts inside 'A'
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(200, 125);
  ctx.lineTo(162, 225);
  ctx.lineTo(238, 225);
  ctx.closePath();
  ctx.fill();

  // Crossbar and middle geometric facets
  ctx.fillStyle = '#0E3B6C';
  ctx.beginPath();
  ctx.moveTo(148, 238);
  ctx.lineTo(252, 238);
  ctx.lineTo(262, 268);
  ctx.lineTo(138, 268);
  ctx.closePath();
  ctx.fill();

  // Bottom cutout between legs
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(200, 252);
  ctx.lineTo(168, 320);
  ctx.lineTo(232, 320);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  return canvas.toDataURL('image/png');
}

export interface HeaderIconsMap {
  locationPin: string;
  phone: string;
  whatsapp: string;
  email: string;
  globe: string;
  ribbon: string;
  shield: string;
  regDoc: string;
  reportDoc: string;
  flask: string;
}

/**
 * Generates razor-sharp, clinical icon PNGs for header elements
 */
export function generateHeaderIconDataUrls(): HeaderIconsMap {
  const createIcon = (draw: (ctx: CanvasRenderingContext2D) => void): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.clearRect(0, 0, 64, 64);
    draw(ctx);
    return canvas.toDataURL('image/png');
  };

  const blue = '#0E3B6C';
  const green = '#25D366';

  const locationPin = createIcon((ctx) => {
    ctx.fillStyle = blue;
    ctx.beginPath();
    ctx.arc(32, 24, 16, Math.PI, 0, false);
    ctx.lineTo(32, 54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(32, 24, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  const phone = createIcon((ctx) => {
    ctx.save();
    ctx.translate(32, 32);
    ctx.rotate(-15 * Math.PI / 180);
    ctx.fillStyle = blue;
    // Handset body
    ctx.beginPath();
    ctx.roundRect(-8, -20, 16, 40, 6);
    ctx.fill();
    // Ear & mic earpieces
    ctx.fillStyle = blue;
    ctx.beginPath();
    ctx.arc(-2, -18, 9, 0, Math.PI * 2);
    ctx.arc(-2, 18, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const whatsapp = createIcon((ctx) => {
    // Green bubble
    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.arc(32, 30, 22, 0, Math.PI * 2);
    ctx.fill();
    // Little speech tail
    ctx.beginPath();
    ctx.moveTo(18, 40);
    ctx.lineTo(12, 52);
    ctx.lineTo(24, 47);
    ctx.closePath();
    ctx.fill();
    // White telephone handset
    ctx.save();
    ctx.translate(32, 30);
    ctx.rotate(-20 * Math.PI / 180);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-5, -12, 10, 24, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-1, -11, 5.5, 0, Math.PI * 2);
    ctx.arc(-1, 11, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const email = createIcon((ctx) => {
    ctx.fillStyle = blue;
    ctx.beginPath();
    ctx.roundRect(10, 16, 44, 32, 6);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(13, 20);
    ctx.lineTo(32, 34);
    ctx.lineTo(51, 20);
    ctx.stroke();
  });

  const globe = createIcon((ctx) => {
    ctx.strokeStyle = blue;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(32, 32, 22, 0, Math.PI * 2);
    ctx.stroke();
    // Equator line
    ctx.beginPath();
    ctx.moveTo(10, 32);
    ctx.lineTo(54, 32);
    ctx.stroke();
    // Latitude curves
    ctx.beginPath();
    ctx.moveTo(14, 20);
    ctx.lineTo(50, 20);
    ctx.moveTo(14, 44);
    ctx.lineTo(50, 44);
    ctx.stroke();
    // Meridian ellipse
    ctx.beginPath();
    ctx.ellipse(32, 32, 11, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  const ribbon = createIcon((ctx) => {
    ctx.fillStyle = blue;
    ctx.strokeStyle = blue;
    ctx.lineWidth = 3;
    // Circular medal / rosette
    ctx.beginPath();
    ctx.arc(32, 24, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(32, 24, 8, 0, Math.PI * 2);
    ctx.fill();
    // Twin ribbon tails
    ctx.beginPath();
    ctx.moveTo(25, 34);
    ctx.lineTo(19, 54);
    ctx.lineTo(26, 49);
    ctx.lineTo(33, 54);
    ctx.lineTo(29, 36);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(39, 34);
    ctx.lineTo(45, 54);
    ctx.lineTo(38, 49);
    ctx.lineTo(31, 54);
    ctx.lineTo(35, 36);
    ctx.closePath();
    ctx.fill();
  });

  const shield = createIcon((ctx) => {
    ctx.fillStyle = blue;
    ctx.beginPath();
    ctx.moveTo(14, 12);
    ctx.lineTo(50, 12);
    ctx.lineTo(50, 30);
    ctx.bezierCurveTo(50, 45, 32, 54, 32, 56);
    ctx.bezierCurveTo(32, 54, 14, 45, 14, 30);
    ctx.closePath();
    ctx.fill();
    // White checkmark
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(22, 32);
    ctx.lineTo(29, 39);
    ctx.lineTo(42, 24);
    ctx.stroke();
  });

  const regDoc = createIcon((ctx) => {
    ctx.fillStyle = blue;
    ctx.strokeStyle = blue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(14, 10, 36, 44, 4);
    ctx.stroke();
    // Inner text lines
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(22, 22);
    ctx.lineTo(42, 22);
    ctx.moveTo(22, 32);
    ctx.lineTo(42, 32);
    ctx.moveTo(22, 42);
    ctx.lineTo(34, 42);
    ctx.stroke();
  });

  const reportDoc = createIcon((ctx) => {
    ctx.strokeStyle = blue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(14, 10, 36, 44, 4);
    ctx.stroke();
    // Checklist check + lines
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(20, 22);
    ctx.lineTo(24, 26);
    ctx.lineTo(30, 20);
    ctx.moveTo(34, 23);
    ctx.lineTo(44, 23);

    ctx.moveTo(20, 34);
    ctx.lineTo(24, 38);
    ctx.lineTo(30, 32);
    ctx.moveTo(34, 35);
    ctx.lineTo(44, 35);
    ctx.stroke();
  });

  const flask = createIcon((ctx) => {
    ctx.strokeStyle = blue;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    // Rim
    ctx.moveTo(24, 12);
    ctx.lineTo(40, 12);
    // Neck
    ctx.moveTo(27, 12);
    ctx.lineTo(27, 24);
    // Conical flask body
    ctx.lineTo(14, 48);
    ctx.bezierCurveTo(13, 52, 16, 54, 20, 54);
    ctx.lineTo(44, 54);
    ctx.bezierCurveTo(48, 54, 51, 52, 50, 48);
    ctx.lineTo(37, 24);
    ctx.lineTo(37, 12);
    ctx.stroke();
    // Liquid level & bubbles
    ctx.fillStyle = blue;
    ctx.beginPath();
    ctx.moveTo(19, 41);
    ctx.bezierCurveTo(26, 43, 38, 39, 45, 41);
    ctx.lineTo(46, 48);
    ctx.lineTo(18, 48);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(28, 34, 2.5, 0, Math.PI * 2);
    ctx.arc(36, 30, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  return {
    locationPin,
    phone,
    whatsapp,
    email,
    globe,
    ribbon,
    shield,
    regDoc,
    reportDoc,
    flask,
  };
}

/**
 * Promisified Image loader
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Minimal fallback QR placeholder in case of environment issue
 */
function createSimpleQrFallback(): string {
  const c = document.createElement('canvas');
  c.width = 120;
  c.height = 120;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 120, 120);
    ctx.strokeStyle = '#123B6D';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 108, 108);
    ctx.strokeRect(18, 18, 30, 30);
    ctx.strokeRect(72, 18, 30, 30);
    ctx.strokeRect(18, 72, 30, 30);
    ctx.fillStyle = '#123B6D';
    ctx.fillRect(26, 26, 14, 14);
    ctx.fillRect(80, 26, 14, 14);
    ctx.fillRect(26, 80, 14, 14);
  }
  return c.toDataURL('image/png');
}
