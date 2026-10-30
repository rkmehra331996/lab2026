import { pdfjsLib } from './canonicalPdfRenderer';

export const DEFAULT_LETTERHEAD_BODY_TOP = 48; // mm
export const DEFAULT_LETTERHEAD_BODY_BOTTOM = 32; // mm
export const DEFAULT_LETTERHEAD_MARGIN_LEFT = 12; // mm
export const DEFAULT_LETTERHEAD_MARGIN_RIGHT = 12; // mm
export const DEFAULT_LETTERHEAD_FONT_SCALE = 100; // %

/**
 * Converts an uploaded File (PDF or Image) into a pristine high-resolution
 * rasterized PNG data URL suitable for embedding into jsPDF as an A4 page background.
 */
export async function rasterizeUploadedFile(file: File): Promise<{
  dataUrl: string;
  pdfDataUrl: string;
  filename: string;
  pageCount: number;
}> {
  const filename = file.name;
  const isPdf = file.type === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();

    // Also convert arrayBuffer to base64 PDF data URL for permanent storage
    const binary = new Uint8Array(arrayBuffer);
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < binary.length; i += chunkSize) {
      binaryString += String.fromCharCode.apply(null, Array.from(binary.subarray(i, i + chunkSize)));
    }
    const pdfDataUrl = `data:application/pdf;base64,${btoa(binaryString)}`;

    // Render Page 1 using PDF.js at 2.5x resolution for 300 DPI A4 output
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    const page = await pdfDoc.getPage(1);

    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not create 2D canvas context for PDF letterhead');
    }

    // @ts-expect-error PDF.js render options
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/png', 0.95);

    return {
      dataUrl,
      pdfDataUrl,
      filename,
      pageCount,
    };
  } else {
    // Image file (PNG / JPEG)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawDataUrl = reader.result as string;
        // Load into image to ensure A4 proportions
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Standard A4 at ~180 DPI (1488 x 2105)
          canvas.width = 1488;
          canvas.height = 2105;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: rawDataUrl, pdfDataUrl: rawDataUrl, filename, pageCount: 1 });
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png', 0.95);
          resolve({ dataUrl, pdfDataUrl: dataUrl, filename, pageCount: 1 });
        };
        img.onerror = () => {
          resolve({ dataUrl: rawDataUrl, pdfDataUrl: rawDataUrl, filename, pageCount: 1 });
        };
        img.src = rawDataUrl;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Creates a pre-designed A4 medical diagnostic letterhead containing
 * BOTH Header and Footer with an empty body zone.
 * Useful as a preset sample or demo so the laboratory owner can immediately test.
 */
export function generateSampleLetterheadDataUrl(
  labName = 'APEX CLINICAL & PATHOLOGY DIAGNOSTICS',
  phone = '+91 7087033009',
  address = 'SCF 42-43, Sector 18-C, Central Healthcare Enclave, Ludhiana - 141001'
): string {
  const canvas = document.createElement('canvas');
  // 1488 x 2105 corresponds to A4 (1:1.414 ratio at high resolution)
  canvas.width = 1488;
  canvas.height = 2105;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Crisp white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. HEADER SECTION (Top ~260 px out of 2105 px = ~37 mm)
  // Deep Blue Gradient Banner
  const headerGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  headerGrad.addColorStop(0, '#0F2744');
  headerGrad.addColorStop(0.65, '#123B6D');
  headerGrad.addColorStop(1, '#0284C7');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, canvas.width, 240);

  // Gold accent strip below header
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(0, 240, canvas.width, 8);

  // Cyan bottom hairline
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(0, 248, canvas.width, 3);

  // Medical Cross Icon in Header (Left)
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(70, 48, 80, 80, 16);
  ctx.fill();

  ctx.fillStyle = '#0F2744';
  // Cross bars
  ctx.fillRect(100, 62, 20, 52);
  ctx.fillRect(84, 78, 52, 20);
  ctx.restore();

  // Lab Name in Header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(labName.toUpperCase(), 175, 92);

  // Lab Tagline
  ctx.fillStyle = '#BAE6FD';
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('NABL ISO 15189:2022 ACCREDITED MEDICAL LABORATORY • ICMR APPROVED', 175, 126);

  // Lab Address and Contacts
  ctx.fillStyle = '#F1F5F9';
  ctx.font = '400 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(address, 175, 158);
  ctx.fillText(`Tel: ${phone}  •  Email: care@apexdiagnostics.in  •  Emergency: 24x7 Services`, 175, 186);

  // NABL Accreditation Badge on Right
  ctx.save();
  ctx.strokeStyle = '#BAE6FD';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(canvas.width - 240, 48, 170, 80, 10);
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NABL ACCREDITED', canvas.width - 155, 78);
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#FDE047';
  ctx.fillText('MC-4821', canvas.width - 155, 102);
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText('ISO 15189:2022', canvas.width - 155, 118);
  ctx.restore();

  // 3. FOOTER SECTION (Bottom ~160 px out of 2105 px = ~23 mm)
  const footerY = canvas.height - 150;

  // Navy Top strip for Footer
  ctx.fillStyle = '#0F2744';
  ctx.fillRect(0, footerY, canvas.width, 150);

  // Gold accent strip above footer
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(0, footerY - 6, canvas.width, 6);

  // Footer Content
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LAB TIMINGS: 7:00 AM – 9:00 PM (ALL 7 DAYS)  |  SUNDAY: 8:00 AM – 4:00 PM', 70, footerY + 45);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '400 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Strict internal quality control (IQC) & external proficiency testing (EQAS). Laboratory reports are intended for clinical correlation.', 70, footerY + 80);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('www.indianlalaji.com  •  Patient Portal 24x7', canvas.width - 70, footerY + 45);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Digital QR Verified • NABL Standards Compliant', canvas.width - 70, footerY + 80);

  return canvas.toDataURL('image/png', 0.95);
}
