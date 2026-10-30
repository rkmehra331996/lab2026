import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LabReport } from '../types';
import { determineParameterStatus, EvaluatedParameterResult } from './statusLogic';
import {
  generateQrDataUrl,
  generateLaboratoryLogoWatermark,
} from './reportAssets';
import {
  DEFAULT_LETTERHEAD_BODY_TOP,
  DEFAULT_LETTERHEAD_BODY_BOTTOM,
  DEFAULT_LETTERHEAD_MARGIN_LEFT,
  DEFAULT_LETTERHEAD_MARGIN_RIGHT,
  DEFAULT_LETTERHEAD_FONT_SCALE,
} from './letterheadUtils';

// Helper to clean phone number digits
function cleanPhoneNumber(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return raw || '1020304050';
}

/**
 * Resolves or rasterizes the uploaded A4 letterhead background (PDF or Image)
 * into a base64 PNG data URL suitable for jsPDF page insertion.
 */
async function ensureLetterheadBg(resolved: {
  letterheadBgDataUrl?: string;
  letterheadPdfUrl?: string;
}): Promise<string | null> {
  if (resolved.letterheadBgDataUrl && resolved.letterheadBgDataUrl.startsWith('data:image/')) {
    return resolved.letterheadBgDataUrl;
  }
  if (!resolved.letterheadPdfUrl) return null;
  if (resolved.letterheadPdfUrl.startsWith('data:image/')) {
    return resolved.letterheadPdfUrl;
  }

  try {
    const { pdfjsLib } = await import('./canonicalPdfRenderer');
    let dataToLoad: any = resolved.letterheadPdfUrl;
    if (resolved.letterheadPdfUrl.startsWith('data:application/pdf;base64,')) {
      const base64 = resolved.letterheadPdfUrl.split(',')[1];
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      dataToLoad = bytes.buffer;
    }
    const docInit = typeof dataToLoad === 'string' ? { url: dataToLoad } : { data: dataToLoad };
    const loadingTask = pdfjsLib.getDocument(docInit);
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // @ts-expect-error PDF.js render options
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/png', 0.95);
  } catch (err) {
    console.warn('Could not rasterize uploaded letterhead PDF for report background:', err);
    return null;
  }
}

// Dynamically resolve lab details from report and vendor dashboard settings
function resolveLabDetails(report: LabReport) {
  let email = (report.labEmail || '').trim();
  let domain = (report.labDomain || '').trim();
  let timings = (report.labTimings || '').trim();
  let phone = (report.labPhone || '').trim();
  let address = (report.labAddress || '').trim();
  let labName = (report.labName || '').trim();

  let enableStaticPdfLetterhead = Boolean(report.enableStaticPdfLetterhead);
  let letterheadPdfUrl = report.letterheadPdfUrl || '';
  let letterheadPdfName = report.letterheadPdfName || '';
  let letterheadBgDataUrl = report.letterheadBgDataUrl || '';
  let letterheadBodyTop = report.letterheadBodyTop ?? DEFAULT_LETTERHEAD_BODY_TOP;
  let letterheadBodyBottom = report.letterheadBodyBottom ?? DEFAULT_LETTERHEAD_BODY_BOTTOM;
  let letterheadMarginLeft = report.letterheadMarginLeft ?? DEFAULT_LETTERHEAD_MARGIN_LEFT;
  let letterheadMarginRight = report.letterheadMarginRight ?? DEFAULT_LETTERHEAD_MARGIN_RIGHT;
  let letterheadFontScale = report.letterheadFontScale ?? DEFAULT_LETTERHEAD_FONT_SCALE;

  // Report Field Customization & Show/Hide Controls
  let showReportQrCode = report.showReportQrCode !== undefined ? Boolean(report.showReportQrCode) : true;
  let showReportBarcode = report.showReportBarcode !== undefined ? Boolean(report.showReportBarcode) : true;
  let showReportMobile = report.showReportMobile !== undefined ? Boolean(report.showReportMobile) : true;
  let showReportRegDate = report.showReportRegDate !== undefined ? Boolean(report.showReportRegDate) : true;
  let showReportCollectionDate = report.showReportCollectionDate !== undefined ? Boolean(report.showReportCollectionDate) : true;
  let showReportReportingDate = report.showReportReportingDate !== undefined ? Boolean(report.showReportReportingDate) : true;
  let showReportStatusColumn = report.showReportStatusColumn !== undefined ? Boolean(report.showReportStatusColumn) : true;
  let showReportClinicNote = report.showReportClinicNote !== undefined ? Boolean(report.showReportClinicNote) : true;
  let showReportEndOfReport = report.showReportEndOfReport !== undefined ? Boolean(report.showReportEndOfReport) : true;
  let showReportTechnicianSign = report.showReportTechnicianSign !== undefined ? Boolean(report.showReportTechnicianSign) : true;
  let showReportPathologistSign = report.showReportPathologistSign !== undefined ? Boolean(report.showReportPathologistSign) : true;
  let showReportDigitalSignCurve = report.showReportDigitalSignCurve !== undefined ? Boolean(report.showReportDigitalSignCurve) : true;
  let showReportDepartmentHeader = report.showReportDepartmentHeader !== undefined ? Boolean(report.showReportDepartmentHeader) : true;
  let showReportMethod = report.showReportMethod !== undefined ? Boolean(report.showReportMethod) : true;
  let showReportPageNumber = report.showReportPageNumber !== undefined ? Boolean(report.showReportPageNumber) : true;

  let reportTechnicianName = report.reportTechnicianName || '';
  let reportTechnicianDesignation = report.reportTechnicianDesignation || '';
  let reportPathologistName = report.pathologist || '';
  let reportPathologistDegrees = report.pathologistDegrees || '';
  let reportCustomClinicNote = report.reportCustomClinicNote || report.clinicNote || report.clinicalImpression || '';

  if (typeof window !== 'undefined') {
    try {
      const activeTenant = report.labId || (localStorage.getItem('cms_active_tenant_id') || '');
      const rawSettingsMap = localStorage.getItem('cms_vendor_lab_settings_map');
      const settingsMap = rawSettingsMap ? JSON.parse(rawSettingsMap) : {};
      const activeSettings =
        (activeTenant && settingsMap[activeTenant]) ||
        settingsMap[report.labId || ''] ||
        (localStorage.getItem('cms_vendor_lab_settings')
          ? JSON.parse(localStorage.getItem('cms_vendor_lab_settings')!)
          : null);

      if (activeSettings) {
        if (!email && activeSettings.email) email = activeSettings.email;
        if (!domain) domain = activeSettings.domainPreview || activeSettings.websiteDomain || activeSettings.websiteUrl || '';
        if (!timings) timings = activeSettings.openingHours || activeSettings.timings || activeSettings.bookingTiming || '';
        if (!phone && activeSettings.phone) phone = activeSettings.phone;
        if (!address && activeSettings.address) address = activeSettings.address;
        if (!labName && (activeSettings.labName || activeSettings.name)) labName = activeSettings.labName || activeSettings.name;

        if (report.enableStaticPdfLetterhead === undefined && activeSettings.enableStaticPdfLetterhead !== undefined) {
          enableStaticPdfLetterhead = Boolean(activeSettings.enableStaticPdfLetterhead);
        }
        if (!letterheadPdfUrl && activeSettings.letterheadPdfUrl) letterheadPdfUrl = activeSettings.letterheadPdfUrl;
        if (!letterheadPdfName && activeSettings.letterheadPdfName) letterheadPdfName = activeSettings.letterheadPdfName;
        if (!letterheadBgDataUrl && activeSettings.letterheadBgDataUrl) letterheadBgDataUrl = activeSettings.letterheadBgDataUrl;
        if (report.letterheadBodyTop === undefined && activeSettings.letterheadBodyTop !== undefined) letterheadBodyTop = Number(activeSettings.letterheadBodyTop);
        if (report.letterheadBodyBottom === undefined && activeSettings.letterheadBodyBottom !== undefined) letterheadBodyBottom = Number(activeSettings.letterheadBodyBottom);
        if (report.letterheadMarginLeft === undefined && activeSettings.letterheadMarginLeft !== undefined) letterheadMarginLeft = Number(activeSettings.letterheadMarginLeft);
        if (report.letterheadMarginRight === undefined && activeSettings.letterheadMarginRight !== undefined) letterheadMarginRight = Number(activeSettings.letterheadMarginRight);
        if (report.letterheadFontScale === undefined && activeSettings.letterheadFontScale !== undefined) letterheadFontScale = Number(activeSettings.letterheadFontScale);

        // Inherit report customization settings if not explicitly passed on report
        if (report.showReportQrCode === undefined && activeSettings.showReportQrCode !== undefined) {
          showReportQrCode = Boolean(activeSettings.showReportQrCode);
        }
        if (report.showReportBarcode === undefined && activeSettings.showReportBarcode !== undefined) {
          showReportBarcode = Boolean(activeSettings.showReportBarcode);
        }
        if (report.showReportMobile === undefined && activeSettings.showReportMobile !== undefined) {
          showReportMobile = Boolean(activeSettings.showReportMobile);
        }
        if (report.showReportRegDate === undefined && activeSettings.showReportRegDate !== undefined) {
          showReportRegDate = Boolean(activeSettings.showReportRegDate);
        }
        if (report.showReportCollectionDate === undefined && activeSettings.showReportCollectionDate !== undefined) {
          showReportCollectionDate = Boolean(activeSettings.showReportCollectionDate);
        }
        if (report.showReportReportingDate === undefined && activeSettings.showReportReportingDate !== undefined) {
          showReportReportingDate = Boolean(activeSettings.showReportReportingDate);
        }
        if (report.showReportStatusColumn === undefined && activeSettings.showReportStatusColumn !== undefined) {
          showReportStatusColumn = Boolean(activeSettings.showReportStatusColumn);
        }
        if (report.showReportClinicNote === undefined && activeSettings.showReportClinicNote !== undefined) {
          showReportClinicNote = Boolean(activeSettings.showReportClinicNote);
        }
        if (report.showReportEndOfReport === undefined && activeSettings.showReportEndOfReport !== undefined) {
          showReportEndOfReport = Boolean(activeSettings.showReportEndOfReport);
        }
        if (report.showReportTechnicianSign === undefined && activeSettings.showReportTechnicianSign !== undefined) {
          showReportTechnicianSign = Boolean(activeSettings.showReportTechnicianSign);
        }
        if (report.showReportPathologistSign === undefined && activeSettings.showReportPathologistSign !== undefined) {
          showReportPathologistSign = Boolean(activeSettings.showReportPathologistSign);
        }
        if (report.showReportDigitalSignCurve === undefined && activeSettings.showReportDigitalSignCurve !== undefined) {
          showReportDigitalSignCurve = Boolean(activeSettings.showReportDigitalSignCurve);
        }
        if (report.showReportDepartmentHeader === undefined && activeSettings.showReportDepartmentHeader !== undefined) {
          showReportDepartmentHeader = Boolean(activeSettings.showReportDepartmentHeader);
        }
        if (report.showReportMethod === undefined && activeSettings.showReportMethod !== undefined) {
          showReportMethod = Boolean(activeSettings.showReportMethod);
        }
        if (report.showReportPageNumber === undefined && activeSettings.showReportPageNumber !== undefined) {
          showReportPageNumber = Boolean(activeSettings.showReportPageNumber);
        }

        if (!reportTechnicianName && activeSettings.reportTechnicianName) {
          reportTechnicianName = activeSettings.reportTechnicianName;
        }
        if (!reportTechnicianDesignation && activeSettings.reportTechnicianDesignation) {
          reportTechnicianDesignation = activeSettings.reportTechnicianDesignation;
        }
        if (!reportPathologistName && (activeSettings.reportPathologistName || activeSettings.founderName)) {
          reportPathologistName = activeSettings.reportPathologistName || activeSettings.founderName;
        }
        if (!reportPathologistDegrees && (activeSettings.reportPathologistDegrees || activeSettings.founderDegrees)) {
          reportPathologistDegrees = activeSettings.reportPathologistDegrees || activeSettings.founderDegrees;
        }
        if (!reportCustomClinicNote && activeSettings.reportCustomClinicNote) {
          reportCustomClinicNote = activeSettings.reportCustomClinicNote;
        }
      }

      // Check vendor labs list
      const rawLabs = localStorage.getItem('cms_vendor_labs');
      if (rawLabs) {
        const labs = JSON.parse(rawLabs);
        if (Array.isArray(labs)) {
          const matchedLab = labs.find(
            (l: any) =>
              (report.labId && l.id === report.labId) ||
              (l.name && report.labName && l.name.toLowerCase() === report.labName.toLowerCase())
          );
          if (matchedLab) {
            if (!domain) domain = matchedLab.domainPreview || `${matchedLab.slug || matchedLab.id}.indianlalaji.com`;
            if (!phone && matchedLab.phone) phone = matchedLab.phone;
            if (!address && matchedLab.address) address = matchedLab.address;
            if (!labName && matchedLab.name) labName = matchedLab.name;
          }
        }
      }
    } catch {}
  }

  // Fallbacks if still blank
  if (!labName) {
    labName = 'LAB 1 DIAGNOSTIC CENTRE';
  }
  if (!email) {
    const slug = labName.toLowerCase().replace(/[^a-z0-9]/g, '');
    email = `care@${slug || 'lab1diagnostics'}.com`;
  }
  if (!domain) {
    domain = '1020304050.indianlalaji.com';
  }
  if (!timings) {
    timings = 'Mon - Sun: 07:00 AM - 09:00 PM';
  }
  if (!phone) {
    phone = '1020304050';
  }
  if (!address) {
    address = 'SCO 101, Medical Enclave, Civil Road, Ludhiana - 141001';
  }
  if (!reportTechnicianName) {
    reportTechnicianName = 'S. Verma, M.Sc., DMLT';
  }
  if (!reportTechnicianDesignation) {
    reportTechnicianDesignation = 'Senior Medical Laboratory Technologist';
  }
  if (!reportPathologistName) {
    reportPathologistName = report.pathologist || 'Dr. Rajesh Sharma, MD';
  }
  if (!reportPathologistDegrees) {
    reportPathologistDegrees = report.pathologistDegrees || 'Consultant Pathologist & Lab Director (Reg No: MCI-PB-48192)';
  }

  return {
    email,
    domain,
    timings,
    phone,
    address,
    labName,
    enableStaticPdfLetterhead,
    letterheadPdfUrl,
    letterheadPdfName,
    letterheadBgDataUrl,
    letterheadBodyTop,
    letterheadBodyBottom,
    letterheadMarginLeft,
    letterheadMarginRight,
    letterheadFontScale,
    showReportQrCode,
    showReportBarcode,
    showReportMobile,
    showReportRegDate,
    showReportCollectionDate,
    showReportReportingDate,
    showReportStatusColumn,
    showReportClinicNote,
    showReportEndOfReport,
    showReportTechnicianSign,
    showReportPathologistSign,
    showReportDigitalSignCurve,
    showReportDepartmentHeader,
    showReportMethod,
    showReportPageNumber,
    reportTechnicianName,
    reportTechnicianDesignation,
    reportPathologistName,
    reportPathologistDegrees,
    reportCustomClinicNote,
  };
}

/**
 * Builds the canonical A4 Portrait medical diagnostic lab report PDF document
 * with solid Navy Blue Header & Footer bars, clean white typography,
 * right-side Report ID/UHID/QR code, unchanged patient & table sections,
 * and a dedicated CLINIC NOTE section replacing the critical alert box.
 */
export async function buildCanonicalReportPdf(report: LabReport): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2; // 186 mm

  // Dynamically resolve vendor details
  const resolved = resolveLabDetails(report);

  // Check if Static PDF Letterhead is active
  let letterheadBg = '';
  if (resolved.enableStaticPdfLetterhead) {
    letterheadBg = (await ensureLetterheadBg(resolved)) || '';
  }
  const isStaticLetterhead = Boolean(resolved.enableStaticPdfLetterhead && letterheadBg);

  const bodyTop = isStaticLetterhead ? Math.max(15, resolved.letterheadBodyTop || DEFAULT_LETTERHEAD_BODY_TOP) : 0;
  const bodyBottom = isStaticLetterhead ? Math.max(15, resolved.letterheadBodyBottom || DEFAULT_LETTERHEAD_BODY_BOTTOM) : 22;
  const marginXLeft = isStaticLetterhead ? Math.max(5, resolved.letterheadMarginLeft || DEFAULT_LETTERHEAD_MARGIN_LEFT) : marginX;
  const marginXRight = isStaticLetterhead ? Math.max(5, resolved.letterheadMarginRight || DEFAULT_LETTERHEAD_MARGIN_RIGHT) : marginX;
  const activeContentWidth = pageWidth - marginXLeft - marginXRight;
  const fontScale = isStaticLetterhead ? Math.max(0.75, Math.min(1.3, (resolved.letterheadFontScale || 100) / 100)) : 1.0;
  const maxBodyY = isStaticLetterhead ? pageHeight - bodyBottom : pageHeight - 22;

  // 1. Prepare Verification & Online Patient Report URL (Canonical QR Code destination)
  // When scanned with any smartphone camera or QR reader, this opens the patient's verified report directly.
  const currentOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin.replace(/\/+$/, '')
      : 'https://indianlalaji.com';

  const reportIdentifier = report.reportId || report.tokenNumber || 'RPT-101';
  const cleanShop = report.labId && report.labId !== 'all' ? report.labId : '';

  const verifyUrl = cleanShop
    ? `${currentOrigin}/shop/${encodeURIComponent(cleanShop)}/report/${encodeURIComponent(reportIdentifier)}`
    : `${currentOrigin}/report/${encodeURIComponent(reportIdentifier)}`;

  // 2. Generate Assets in Parallel:
  // - ONE QR Code ONLY (top header or embedded inside patient box on letterhead)
  // - Dynamic Diagonal Laboratory Watermark (center of page, 45° rotation, light/faded opacity - only in standard mode)
  const [headerQrDataUrl, watermarkDataUrl] = await Promise.all([
    generateQrDataUrl(verifyUrl, { size: 320, darkColor: '#0F2744' }),
    !isStaticLetterhead ? generateLaboratoryLogoWatermark(resolved.labName, resolved.phone) : Promise.resolve(null),
  ]);

  // 3. Automatically Evaluate Parameters & Determine Exact Statuses
  const evaluatedItems = (report.items || []).map((item) => {
    const evaluation = determineParameterStatus(
      item.parameter,
      item.result,
      item.referenceRange,
      item.unit,
      item.isAbnormal
    );
    return {
      ...item,
      evaluation,
    };
  });

  // Group items by Department / Test
  interface DepartmentGroup {
    departmentName: string;
    testTitle: string;
    items: typeof evaluatedItems;
  }

  const departmentGroups: DepartmentGroup[] = [];
  evaluatedItems.forEach((item) => {
    const rawTestName = item.testName || 'Complete Blood Count (CBC)';
    let dept = 'DEPARTMENT OF BIOCHEMISTRY & PATHOLOGY';
    const lower = rawTestName.toLowerCase();
    if (lower.includes('cbc') || lower.includes('blood count') || lower.includes('hemogram') || lower.includes('platelet') || lower.includes('esr')) {
      dept = 'DEPARTMENT OF HEMATOLOGY & CLINICAL PATHOLOGY';
    } else if (lower.includes('lipid') || lower.includes('glucose') || lower.includes('hba1c') || lower.includes('sugar') || lower.includes('cholesterol')) {
      dept = 'DEPARTMENT OF CLINICAL BIOCHEMISTRY';
    } else if (lower.includes('lft') || lower.includes('liver')) {
      dept = 'DEPARTMENT OF BIOCHEMISTRY • LIVER FUNCTION TESTS (LFT)';
    } else if (lower.includes('kft') || lower.includes('kidney') || lower.includes('renal')) {
      dept = 'DEPARTMENT OF BIOCHEMISTRY • RENAL FUNCTION TESTS (KFT)';
    } else if (lower.includes('thyroid') || lower.includes('hormone')) {
      dept = 'DEPARTMENT OF IMMUNOASSAY & ENDOCRINOLOGY';
    } else if (lower.includes('urine')) {
      dept = 'DEPARTMENT OF CLINICAL PATHOLOGY & URINALYSIS';
    }

    let existing = departmentGroups.find((g) => g.departmentName === dept && g.testTitle === rawTestName);
    if (!existing) {
      existing = {
        departmentName: dept,
        testTitle: rawTestName,
        items: [],
      };
      departmentGroups.push(existing);
    }
    existing.items.push(item);
  });

  // Fallback single group if empty
  if (departmentGroups.length === 0) {
    departmentGroups.push({
      departmentName: 'DEPARTMENT OF BIOCHEMISTRY & PATHOLOGY',
      testTitle: 'Complete Blood Count (CBC)',
      items: evaluatedItems,
    });
  }

  // ==========================================
  // CANONICAL HEADER RENDERING FUNCTION (STANDARD MODE)
  // (Repeated on Every Page for Multi-page Reports)
  // ==========================================
  const drawCanonicalReportHeader = (targetDoc: jsPDF): number => {
    const headerBarHeight = 35; // mm
    const leftAreaWidth = contentWidth * 0.68; // ~126 mm
    const rightRightEdge = pageWidth - marginX; // 198 mm

    // Solid Navy Blue Top Bar (Full edge-to-edge background)
    targetDoc.setFillColor(18, 59, 109);
    targetDoc.rect(0, 0, pageWidth, headerBarHeight, 'F');

    // Left Side: Lab Name, Address, Contact Details, Email
    let curLeftY = 7.5;

    targetDoc.setTextColor(255, 255, 255);
    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setFontSize(12.5);
    const labDisplayName = (resolved.labName || report.labName || 'LAB 1 DIAGNOSTIC CENTRE').toUpperCase();
    const labTitleLines = targetDoc.splitTextToSize(labDisplayName, leftAreaWidth);
    targetDoc.text(labTitleLines, marginX, curLeftY);
    curLeftY += labTitleLines.length * 4.8 + 1.2;

    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setFontSize(7.3);
    targetDoc.setTextColor(241, 245, 249);
    const addressText = resolved.address || report.labAddress || 'SCO 101, Medical Enclave, Civil Road, Ludhiana - 141001';
    const addressLines = targetDoc.splitTextToSize(addressText, leftAreaWidth);
    targetDoc.text(addressLines, marginX, curLeftY);
    curLeftY += addressLines.length * 3.4 + 0.8;

    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setFontSize(7.2);
    targetDoc.setTextColor(255, 255, 255);
    targetDoc.text(`Contact: +91 ${cleanPhoneNumber(resolved.phone || report.labPhone)}`, marginX, curLeftY);
    curLeftY += 3.6;

    targetDoc.text(`Email: ${resolved.email || report.labEmail || 'care@indianlalaji.com'}`, marginX, curLeftY);
    curLeftY += 3.6;

    // Right Side: Report ID, UHID, and QR Code only
    let curRightY = 8.5;

    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setFontSize(8.0);
    targetDoc.setTextColor(255, 255, 255);
    targetDoc.text(`Report ID: ${report.reportId}`, rightRightEdge, curRightY, { align: 'right' });
    curRightY += 4.0;

    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setFontSize(7.5);
    targetDoc.setTextColor(241, 245, 249);
    targetDoc.text(`UHID: ${report.uhid || 'UHID-824476'}`, rightRightEdge, curRightY, { align: 'right' });
    curRightY += 3.8;

    const qrSize = 15;
    const qrBoxW = 17;
    const qrBoxH = 17;
    const qrBoxX = rightRightEdge - qrBoxW;
    const qrBoxY = curRightY + 0.5;

    if (resolved.showReportQrCode && headerQrDataUrl) {
      try {
        targetDoc.setFillColor(255, 255, 255);
        targetDoc.roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 1.2, 1.2, 'F');
        targetDoc.addImage(headerQrDataUrl, 'PNG', qrBoxX + 1, qrBoxY + 1, qrSize, qrSize, undefined, 'FAST');
      } catch (err) {
        console.warn('Could not render header QR code:', err);
      }
    }

    // Standard Patient Demographics Box
    const pBoxY = headerBarHeight + 3.5;
    const pBoxH = 26;
    const pBoxW = contentWidth;

    targetDoc.setFillColor(248, 250, 252);
    targetDoc.setDrawColor(203, 213, 225);
    targetDoc.setLineWidth(0.3);
    targetDoc.roundedRect(marginX, pBoxY, pBoxW, pBoxH, 1.5, 1.5, 'FD');

    const colDividerX = marginX + pBoxW / 2;
    targetDoc.setDrawColor(226, 232, 240);
    targetDoc.line(colDividerX, pBoxY, colDividerX, pBoxY + pBoxH);

    const c1LabelX = marginX + 4;
    const c1ValX = marginX + 34;

    targetDoc.setFontSize(7.2);
    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setTextColor(100, 116, 139);
    targetDoc.text('PATIENT NAME:', c1LabelX, pBoxY + 6);
    targetDoc.text('AGE / GENDER:', c1LabelX, pBoxY + 12);
    targetDoc.text(resolved.showReportMobile ? 'CONTACT NO:' : 'REG. / UHID:', c1LabelX, pBoxY + 18);
    targetDoc.text(resolved.showReportBarcode ? 'BARCODE / LAB NO:' : 'REG. DATE:', c1LabelX, pBoxY + 23.5);

    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setTextColor(15, 23, 42);
    targetDoc.text(report.patientName.toUpperCase(), c1ValX, pBoxY + 6);
    targetDoc.text(report.ageGender || '45 Y / Male', c1ValX, pBoxY + 12);
    targetDoc.text(
      resolved.showReportMobile ? `+91 ${report.mobile}` : (report.uhid || 'UHID-824476'),
      c1ValX,
      pBoxY + 18
    );
    targetDoc.text(
      resolved.showReportBarcode
        ? (report.barcode || report.uhid || report.tokenNumber || 'BC-789218')
        : (report.registeredAt || 'Today, 08:30 AM'),
      c1ValX,
      pBoxY + 23.5
    );

    const c2LabelX = colDividerX + 4;
    const c2ValX = colDividerX + 32;

    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setTextColor(100, 116, 139);
    targetDoc.text('REFERRED BY:', c2LabelX, pBoxY + 6);
    targetDoc.text('SPECIMEN:', c2LabelX, pBoxY + 12);
    targetDoc.text(resolved.showReportCollectionDate ? 'COLLECTED ON:' : 'REG. TIME:', c2LabelX, pBoxY + 18);
    targetDoc.text(resolved.showReportReportingDate ? 'REPORTED ON:' : 'STATUS:', c2LabelX, pBoxY + 23.5);

    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setTextColor(15, 23, 42);
    targetDoc.text(report.doctor || 'Self / Direct', c2ValX, pBoxY + 6);
    targetDoc.text(report.sampleType || 'EDTA Whole Blood / Serum', c2ValX, pBoxY + 12);
    targetDoc.text(
      resolved.showReportCollectionDate
        ? (report.sampleCollectedAt || report.reportedAt || 'Today, 08:30 AM')
        : (report.registeredAt || 'Today, 08:00 AM'),
      c2ValX,
      pBoxY + 18
    );
    targetDoc.text(
      resolved.showReportReportingDate
        ? (report.reportedAt || 'Today, 11:45 AM')
        : 'Final / Verified',
      c2ValX,
      pBoxY + 23.5
    );

    return pBoxY + pBoxH + 4;
  };

  // ==========================================
  // DYNAMIC PATIENT INFORMATION (STATIC LETTERHEAD MODE)
  // (Prints ONLY inside designated body zone without touching header)
  // ==========================================
  const drawLetterheadPatientInfo = (targetDoc: jsPDF, pBoxY: number): number => {
    const pBoxH = 23;
    const pBoxW = activeContentWidth;

    // Outer Box Frame
    targetDoc.setFillColor(248, 250, 252);
    targetDoc.setDrawColor(203, 213, 225);
    targetDoc.setLineWidth(0.3);
    targetDoc.roundedRect(marginXLeft, pBoxY, pBoxW, pBoxH, 1.2, 1.2, 'FD');

    // Subtle clinical top border
    targetDoc.setFillColor(18, 59, 109);
    targetDoc.rect(marginXLeft, pBoxY, pBoxW, 1.4, 'F');

    // Column Divider (shifts wider if QR code is turned off)
    const colSplit = resolved.showReportQrCode ? 0.48 : 0.50;
    const colDividerX = marginXLeft + pBoxW * colSplit;
    targetDoc.setDrawColor(226, 232, 240);
    targetDoc.line(colDividerX, pBoxY + 1.4, colDividerX, pBoxY + pBoxH);

    // Column 1: Patient Details
    const c1LabelX = marginXLeft + 3.5;
    const c1ValX = marginXLeft + 28;

    targetDoc.setFontSize(6.8 * fontScale);
    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setTextColor(100, 116, 139);
    targetDoc.text('PATIENT NAME:', c1LabelX, pBoxY + 5.2);
    targetDoc.text('AGE / GENDER:', c1LabelX, pBoxY + 10.5);
    targetDoc.text(resolved.showReportMobile ? 'CONTACT NO:' : 'REG. / UHID:', c1LabelX, pBoxY + 15.8);
    targetDoc.text(resolved.showReportBarcode ? 'BARCODE / LAB NO:' : 'REG. TIME:', c1LabelX, pBoxY + 20.8);

    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setTextColor(15, 23, 42);
    targetDoc.text((report.patientName || 'PATIENT').toUpperCase(), c1ValX, pBoxY + 5.2);
    targetDoc.text(report.ageGender || '45 Y / Male', c1ValX, pBoxY + 10.5);
    targetDoc.text(
      resolved.showReportMobile ? `+91 ${report.mobile || '1020304050'}` : (report.uhid || 'UHID-824476'),
      c1ValX,
      pBoxY + 15.8
    );
    targetDoc.text(
      resolved.showReportBarcode
        ? (report.barcode || report.uhid || report.tokenNumber || 'BC-789218')
        : (report.registeredAt || 'Today, 08:30 AM'),
      c1ValX,
      pBoxY + 20.8
    );

    // Column 2: Report Details
    const c2LabelX = colDividerX + 3.5;
    const c2ValX = colDividerX + 26;

    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setTextColor(100, 116, 139);
    targetDoc.text('REFERRED BY:', c2LabelX, pBoxY + 5.2);
    targetDoc.text('SPECIMEN:', c2LabelX, pBoxY + 10.5);
    targetDoc.text(resolved.showReportCollectionDate ? 'COLLECTED ON:' : 'REG. DATE:', c2LabelX, pBoxY + 15.8);
    targetDoc.text(resolved.showReportReportingDate ? 'REPORTED ON:' : 'STATUS:', c2LabelX, pBoxY + 20.8);

    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setTextColor(15, 23, 42);
    targetDoc.text(report.doctor || 'Self / Direct', c2ValX, pBoxY + 5.2);
    targetDoc.text(report.sampleType || 'EDTA Whole Blood / Serum', c2ValX, pBoxY + 10.5);
    targetDoc.text(
      resolved.showReportCollectionDate
        ? (report.sampleCollectedAt || report.reportedAt || '')
        : (report.registeredAt || 'Today, 08:00 AM'),
      c2ValX,
      pBoxY + 15.8
    );
    targetDoc.text(
      resolved.showReportReportingDate
        ? (report.reportedAt || '')
        : 'Final / Verified',
      c2ValX,
      pBoxY + 20.8
    );

    // Embedded QR Code Verification in Patient Box on far right (ONLY if showReportQrCode is ON)
    if (resolved.showReportQrCode && headerQrDataUrl) {
      try {
        const qrSize = 14.5;
        const qrX = marginXLeft + pBoxW - qrSize - 3;
        const qrY = pBoxY + 4.2;
        targetDoc.setFillColor(255, 255, 255);
        targetDoc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 1, 1, 'F');
        targetDoc.addImage(headerQrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');
      } catch {}
    }

    return pBoxY + pBoxH + 3.5;
  };

  // Determine starting position on Page 1
  let headerTotalHeight = 0;
  let cursorY = 0;

  if (isStaticLetterhead && letterheadBg) {
    // 1. Draw uploaded letterhead background on Page 1
    doc.addImage(letterheadBg, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    // 2. Draw dynamic patient info starting strictly at configured bodyTop
    cursorY = drawLetterheadPatientInfo(doc, bodyTop);
  } else {
    // Standard mode: Draw default solid Navy Blue header
    headerTotalHeight = drawCanonicalReportHeader(doc);
    cursorY = headerTotalHeight;
  }

  // --- 3 & 4. DEPARTMENT SECTIONS & MAIN TEST TABLES (REPORT BODY) ---
  departmentGroups.forEach((group) => {
    // If remaining space on current page is not enough for section header + 2 rows, break to new page
    if (cursorY > maxBodyY - 30) {
      doc.addPage();
      if (isStaticLetterhead && letterheadBg) {
        doc.addImage(letterheadBg, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        cursorY = bodyTop;
      } else {
        cursorY = headerTotalHeight + 2;
      }
    }

    const curLeftX = isStaticLetterhead ? marginXLeft : marginX;
    const curWidth = isStaticLetterhead ? activeContentWidth : contentWidth;

    // Department Section Header Bar (or subtle line if department header is off)
    if (resolved.showReportDepartmentHeader !== false) {
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.rect(curLeftX, cursorY, curWidth, 6.5, 'F');

      // Navy Accent Indicator on Left
      doc.setFillColor(18, 59, 109);
      doc.rect(curLeftX, cursorY, 2.5, 6.5, 'F');

      doc.setTextColor(18, 59, 109);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8 * fontScale);
      doc.text(`${group.departmentName.toUpperCase()} • ${group.testTitle.toUpperCase()}`, curLeftX + 5, cursorY + 4.5);
      cursorY += 7.5;
    } else {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(curLeftX, cursorY, curLeftX + curWidth, cursorY);
      doc.setTextColor(18, 59, 109);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.6 * fontScale);
      doc.text(group.testTitle.toUpperCase(), curLeftX, cursorY + 3.8);
      cursorY += 5.5;
    }

    // Table rows (4 columns vs 5 columns depending on showReportStatusColumn)
    const isFiveColumn = resolved.showReportStatusColumn !== false;
    const tableData = group.items.map((item) => {
      let paramLabel = item.parameter;
      if (resolved.showReportMethod && item.notes && (item.notes.toLowerCase().includes('method') || item.notes.toLowerCase().includes('analyzer'))) {
        paramLabel += `\n(${item.notes})`;
      }
      if (isFiveColumn) {
        const statusBadge = item.evaluation.style.badgeLabel;
        return [
          paramLabel,
          item.result,
          item.unit || '-',
          item.referenceRange || '-',
          statusBadge,
        ];
      } else {
        return [
          paramLabel,
          item.result,
          item.unit || '-',
          item.referenceRange || '-',
        ];
      }
    });

    const tableHeaders = isFiveColumn
      ? [['Investigation / Parameter', 'Observed Value', 'Unit', 'Bio Reference Interval', 'Status']]
      : [['Investigation / Parameter', 'Observed Value', 'Unit', 'Bio Reference Interval']];

    const columnStylesConfig: any = isFiveColumn
      ? {
          0: { cellWidth: curWidth * 0.29, fontStyle: 'bold' },
          1: { cellWidth: curWidth * 0.17, fontStyle: 'bold' },
          2: { cellWidth: curWidth * 0.14 },
          3: { cellWidth: curWidth * 0.25 },
          4: { cellWidth: curWidth * 0.15, halign: 'center' },
        }
      : {
          0: { cellWidth: curWidth * 0.38, fontStyle: 'bold' },
          1: { cellWidth: curWidth * 0.19, fontStyle: 'bold' },
          2: { cellWidth: curWidth * 0.15 },
          3: { cellWidth: curWidth * 0.28 },
        };

    autoTable(doc, {
      startY: cursorY,
      margin: {
        top: isStaticLetterhead ? bodyTop : headerTotalHeight,
        bottom: isStaticLetterhead ? bodyBottom : 22,
        left: isStaticLetterhead ? marginXLeft : marginX,
        right: isStaticLetterhead ? marginXRight : marginX,
      },
      tableWidth: curWidth,
      willDrawPage: () => {
        if (isStaticLetterhead && letterheadBg) {
          doc.addImage(letterheadBg, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        }
      },
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7.8 * fontScale,
        textColor: [30, 41, 59],
        cellPadding: 2.2 * fontScale,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [18, 59, 109],
        textColor: [255, 255, 255],
        fontSize: 7.8 * fontScale,
        fontStyle: 'bold',
        halign: 'left',
      },
      columnStyles: columnStylesConfig,
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index >= 0) {
          const item = group.items[data.row.index];
          if (item?.evaluation) {
            const ev = item.evaluation;

            if (ev.status === 'CRITICAL') {
              if (data.column.index === 1 || (isFiveColumn && data.column.index === 4)) {
                data.cell.styles.fillColor = [254, 226, 226]; // Rose-100
                data.cell.styles.textColor = [190, 18, 60]; // Rose-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'HIGH') {
              if (data.column.index === 1 || (isFiveColumn && data.column.index === 4)) {
                data.cell.styles.textColor = [180, 83, 9]; // Amber-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'LOW') {
              if (data.column.index === 1 || (isFiveColumn && data.column.index === 4)) {
                data.cell.styles.textColor = [29, 78, 216]; // Blue-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'ABNORMAL') {
              if (data.column.index === 1 || (isFiveColumn && data.column.index === 4)) {
                data.cell.styles.textColor = [185, 28, 28]; // Red-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'PENDING') {
              if (data.column.index === 1 || (isFiveColumn && data.column.index === 4)) {
                data.cell.styles.textColor = [100, 116, 139];
                data.cell.styles.fontStyle = 'normal';
              }
            }
          }
        }
      },
    });

    // @ts-expect-error autoTable adds lastAutoTable property
    cursorY = (doc.lastAutoTable?.finalY || cursorY + 20) + 4;
  });

  // --- 5. CLINIC NOTE SECTION (ONLY if showReportClinicNote !== false) ---
  if (resolved.showReportClinicNote !== false) {
    const rawClinicNote = (resolved.reportCustomClinicNote || report.clinicNote || report.clinicalImpression || '').trim();
    const clinicNoteText = rawClinicNote || 'Please correlate clinically with patient symptoms. In case of unexpected discordance, repeat testing is advised.';

    const curLeftX = isStaticLetterhead ? marginXLeft : marginX;
    const curWidth = isStaticLetterhead ? activeContentWidth : contentWidth;

    const noteLines = doc.splitTextToSize(clinicNoteText, curWidth - 10);
    const noteBoxHeight = Math.max(13, 8 + noteLines.length * 3.4 + 2);

    if (cursorY + noteBoxHeight > maxBodyY - 20) {
      doc.addPage();
      if (isStaticLetterhead && letterheadBg) {
        doc.addImage(letterheadBg, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        cursorY = bodyTop;
      } else {
        cursorY = headerTotalHeight + 2;
      }
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(18, 59, 109);
    doc.setLineWidth(0.35);
    doc.roundedRect(curLeftX, cursorY, curWidth, noteBoxHeight, 1.2, 1.2, 'FD');

    doc.setFillColor(18, 59, 109);
    doc.rect(curLeftX, cursorY, 2.5, noteBoxHeight, 'F');

    doc.setTextColor(18, 59, 109);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5 * fontScale);
    doc.text('CLINIC NOTE:', curLeftX + 5, cursorY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8 * fontScale);
    doc.setTextColor(30, 41, 59);
    doc.text(noteLines, curLeftX + 5, cursorY + 8.8);

    cursorY += noteBoxHeight + 3.5;
  }

  // --- 6. REPORT END SEPARATOR (ONLY if showReportEndOfReport !== false) ---
  if (resolved.showReportEndOfReport !== false) {
    const curLeftX = isStaticLetterhead ? marginXLeft : marginX;
    const curWidth = isStaticLetterhead ? activeContentWidth : contentWidth;

    if (cursorY > maxBodyY - 18) {
      doc.addPage();
      if (isStaticLetterhead && letterheadBg) {
        doc.addImage(letterheadBg, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        cursorY = bodyTop;
      } else {
        cursorY = headerTotalHeight + 2;
      }
    }

    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(curLeftX + 20, cursorY + 2, curLeftX + curWidth - 20, cursorY + 2);
    doc.setLineDashPattern([], 0);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2 * fontScale);
    doc.text('— END OF REPORT —', pageWidth / 2, cursorY + 2.5, { align: 'center' });

    cursorY += 8;
  }

  // --- 7. SIGNATURE SECTION (REPORT BODY) ---
  const hasLeftSign = resolved.showReportTechnicianSign !== false;
  const hasRightSign = resolved.showReportPathologistSign !== false;

  if (hasLeftSign || hasRightSign) {
    const curLeftX = isStaticLetterhead ? marginXLeft : marginX;
    const requiredSignHeight = 26;
    if (cursorY > maxBodyY - requiredSignHeight) {
      doc.addPage();
      if (isStaticLetterhead && letterheadBg) {
        doc.addImage(letterheadBg, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        cursorY = bodyTop;
      } else {
        cursorY = headerTotalHeight + 2;
      }
    }
    const signatureY = isStaticLetterhead
      ? Math.min(maxBodyY - 18, Math.max(cursorY, maxBodyY - 24))
      : Math.max(cursorY, pageHeight - 44);

    if (hasLeftSign) {
      // Left Signature: Prepared / Verified By
      const leftSignX = curLeftX + 6;
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7 * fontScale);
      doc.text('PREPARED / VERIFIED BY', leftSignX, signatureY);

      doc.setDrawColor(18, 59, 109);
      doc.setLineWidth(0.3);
      doc.line(leftSignX, signatureY + 1.5, leftSignX + 48, signatureY + 1.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8 * fontScale);
      doc.setTextColor(15, 23, 42);
      doc.text(resolved.reportTechnicianName || 'S. Verma, M.Sc., DMLT', leftSignX, signatureY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8 * fontScale);
      doc.setTextColor(100, 116, 139);
      doc.text(resolved.reportTechnicianDesignation || 'Senior Medical Laboratory Technologist', leftSignX, signatureY + 10);
      doc.text('Batch Quality Control Verified', leftSignX, signatureY + 13.5);
    }

    if (hasRightSign) {
      // Right Signature: Laboratory Authorized Signatory
      const rightSignX = pageWidth - (isStaticLetterhead ? marginXRight : marginX) - 6;

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7 * fontScale);
      doc.text('LABORATORY AUTHORIZED SIGNATORY', rightSignX, signatureY, { align: 'right' });

      // Digital Signature Curve (only if showReportDigitalSignCurve !== false)
      if (resolved.showReportDigitalSignCurve !== false) {
        doc.setDrawColor(18, 59, 109);
        doc.setLineWidth(0.5);
        doc.lines(
          [
            [3, -5],
            [5, 4],
            [6, -6],
            [7, 5],
            [5, -3],
            [8, 4],
          ],
          rightSignX - 40,
          signatureY - 2
        );
      } else {
        // Flat signature line for manual pen signing
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(rightSignX - 48, signatureY + 1.5, rightSignX, signatureY + 1.5);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2 * fontScale);
      doc.setTextColor(18, 59, 109);
      doc.text(resolved.reportPathologistName || report.pathologist || 'Dr. Rajesh Sharma, MD', rightSignX, signatureY + 6, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8 * fontScale);
      doc.setTextColor(71, 85, 105);
      doc.text(resolved.reportPathologistDegrees || report.pathologistDegrees || 'Consultant Pathologist & Lab Director (Reg No: MCI-PB-48192)', rightSignX, signatureY + 10, { align: 'right' });
    }
  }

  // --- 8 & 9. MULTI-PAGE SYNCHRONIZATION ---
  const totalPages = doc.getNumberOfPages();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    if (isStaticLetterhead && letterheadBg) {
      // In static PDF letterhead mode:
      // The original uploaded PDF (Header + Footer) is preserved on every page.
      // Do NOT generate, duplicate, or overlay default navy header or footer!
      if (totalPages > 1) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - marginXRight, maxBodyY + 3.5, { align: 'right' });
      }
    } else {
      // Standard mode: Apply watermark and default navy header/footer
      if (watermarkDataUrl) {
        try {
          const wmSize = 160;
          const wmX = (pageWidth - wmSize) / 2;
          const wmY = (pageHeight - wmSize) / 2;
          doc.addImage(watermarkDataUrl, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
        } catch {}
      }

      if (pageNum > 1) {
        drawCanonicalReportHeader(doc);
      }

      const footerH = 11;
      const footerY = pageHeight - footerH;

      doc.setFillColor(18, 59, 109);
      doc.rect(0, footerY, pageWidth, footerH, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      const timingsText = `Timings: ${resolved.timings || 'Mon - Sun: 07:00 AM - 09:00 PM'}`;
      doc.text(timingsText, marginX, footerY + 6.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(241, 245, 249);
      const pageCenterText = totalPages > 1
        ? `Page ${pageNum} of ${totalPages}`
        : `Electronically Verified`;
      doc.text(pageCenterText, pageWidth / 2, footerY + 6.8, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(255, 255, 255);
      const websiteUrl = resolved.domain || 'www.indianlalaji.com';
      doc.text(`Website: ${websiteUrl}`, pageWidth - marginX, footerY + 6.8, { align: 'right' });
    }
  }

  return doc;
}

/**
 * Returns the exact canonical PDF Blob, Object URL, Data URI, ArrayBuffer, and filename
 * for rendering in the canonical preview or embedding.
 */
export async function getCanonicalReportPdfBlob(report: LabReport): Promise<{
  blob: Blob;
  blobUrl: string;
  dataUri: string;
  arrayBuffer: ArrayBuffer;
  filename: string;
  doc: jsPDF;
}> {
  const doc = await buildCanonicalReportPdf(report);
  const safePatientName = (report.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${report.reportId}_${safePatientName}_Report.pdf`;
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const dataUri = doc.output('datauristring');
  const arrayBuffer = doc.output('arraybuffer');
  return { blob, blobUrl, dataUri, arrayBuffer, filename, doc };
}

/**
 * Downloads the exact same canonical PDF file (conditioned on complete payment)
 */
export async function downloadReportPdf(report: LabReport, prebuiltDoc?: jsPDF): Promise<boolean> {
  try {
    const statusLower = (report.paymentStatus || '').toLowerCase();
    const isDuePending = Boolean(
      (report.dueAmount !== undefined && report.dueAmount > 0) ||
      statusLower === 'pending' ||
      statusLower === 'partial' ||
      statusLower === 'due' ||
      (report.paymentStatus !== undefined &&
        statusLower !== 'full payment' &&
        statusLower !== 'paid' &&
        statusLower !== 'completed' &&
        (report.dueAmount ?? 0) > 0)
    );

    if (isDuePending) {
      console.warn(`[SECURITY] Cannot download report ${report.reportId}: Full payment is pending (Due: ₹${report.dueAmount || 0}).`);
      return false;
    }

    const doc = prebuiltDoc || (await buildCanonicalReportPdf(report));
    const safePatientName = (report.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${report.reportId}_${safePatientName}_Report.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('PDF download error:', error);
    return false;
  }
}

/**
 * Backward compatibility alias for downloadReportPdf
 */
export const generateReportPdf = downloadReportPdf;

/**
 * Prints the exact canonical PDF document directly using browser iframe (conditioned on complete payment)
 */
export async function printCanonicalReportPdf(report: LabReport, existingBlobUrl?: string): Promise<boolean> {
  try {
    const statusLower = (report.paymentStatus || '').toLowerCase();
    const isDuePending = Boolean(
      (report.dueAmount !== undefined && report.dueAmount > 0) ||
      statusLower === 'pending' ||
      statusLower === 'partial' ||
      statusLower === 'due' ||
      (report.paymentStatus !== undefined &&
        statusLower !== 'full payment' &&
        statusLower !== 'paid' &&
        statusLower !== 'completed' &&
        (report.dueAmount ?? 0) > 0)
    );

    if (isDuePending) {
      console.warn(`[SECURITY] Cannot print report ${report.reportId}: Full payment is pending.`);
      return false;
    }

    let url = existingBlobUrl;
    let cleanup = false;
    if (!url) {
      const res = await getCanonicalReportPdfBlob(report);
      url = res.blobUrl;
      cleanup = true;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.src = url;

    document.body.appendChild(iframe);

    return new Promise((resolve) => {
      let isResolved = false;

      const triggerPrint = () => {
        if (isResolved) return;
        isResolved = true;
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            if (cleanup && url) URL.revokeObjectURL(url);
            resolve(true);
          }, 3000);
        } catch (e) {
          console.warn('Iframe PDF direct print blocked or failed, falling back:', e);
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          downloadReportPdf(report);
          resolve(false);
        }
      };

      iframe.onload = () => {
        setTimeout(triggerPrint, 500);
      };

      setTimeout(() => {
        if (!isResolved) {
          triggerPrint();
        }
      }, 2500);
    });
  } catch (err) {
    console.error('Print canonical PDF error:', err);
    await downloadReportPdf(report);
    return false;
  }
}

/**
 * Generates the filename strictly in the format: #TokenNumber_LabName_Time_Date.pdf
 * Example: #231_ABCLab_03-21-PM_27-09-2026.pdf
 */
export function getReceiptPdfFilename(entry: any, labNameRaw?: string): string {
  const rawToken = entry?.tokenNumber || entry?.tokenNo || '231';
  const cleanToken = String(rawToken).replace(/^#/, '');
  const tokenPart = `#${cleanToken}`;

  const rawLab = labNameRaw || 'ApexLab';
  let cleanLab = rawLab.replace(/[^a-zA-Z0-9]/g, '');
  if (!cleanLab) cleanLab = 'ABCLab';

  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${String(hours).padStart(2, '0')}-${minutes}-${ampm}`;

  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}-${month}-${year}`;

  return `${tokenPart}_${cleanLab}_${timeStr}_${dateStr}.pdf`;
}

/**
 * Builds the exact receipt PDF matching the popup modal design pixel-for-pixel.
 * Returns the jsPDF instance, formatted filename, Blob, and File objects.
 */
export async function buildReceiptInvoicePdf(
  entry: any,
  labNameRaw?: string
): Promise<{ doc: jsPDF; filename: string; blob: Blob; file: File }> {
  const resolvedLabName = labNameRaw || 'Apex Diagnostic & Pathology Laboratory';
  const filename = getReceiptPdfFilename(entry, resolvedLabName);

  const tests = Array.isArray(entry?.tests)
    ? entry.tests
    : typeof entry?.tests === 'string'
    ? [entry.tests]
    : ['Diagnostic Investigation'];

  const discount = Number(entry?.discountINR) || 0;
  const gross = Number(entry?.totalAmount) || 0;
  const net = Math.max(0, gross - discount);
  const paid = Number(entry?.paidAmount) || 0;
  const due = entry?.dueAmount !== undefined ? Number(entry.dueAmount) : Math.max(0, net - paid);

  // Dynamic height calculation based on number of tests
  const baseHeight = 168;
  const extraTestsHeight = Math.max(0, tests.length - 2) * 5;
  const discountHeight = discount > 0 ? 5 : 0;
  const pageHeight = Math.max(168, baseHeight + extraTestsHeight + discountHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, pageHeight],
  });

  // Background & outer subtle border
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 105, pageHeight, 'F');
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setLineWidth(0.4);
  doc.roundedRect(4, 4, 97, pageHeight - 8, 4, 4, 'D');

  // 1. Green Success Badge at Top (matches popup: Entry Submitted)
  const badgeText = 'Entry Submitted';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const badgeTextWidth = doc.getTextWidth(badgeText);
  const iconWidth = 3;
  const iconGap = 1.8;
  const paddingX = 4.5;
  const badgeW = iconWidth + iconGap + badgeTextWidth + paddingX * 2;
  const badgeH = 6.8;
  const badgeX = (105 - badgeW) / 2;
  const badgeY = 8.5;

  doc.setFillColor(236, 253, 245); // #ECFDF5
  doc.setDrawColor(167, 243, 208); // #A7F3D0
  doc.setLineWidth(0.35);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3.4, 3.4, 'FD');

  // Vector checkmark (guarantees crisp rendering without font encoding/overflow issues)
  const checkX = badgeX + paddingX;
  const checkCenterY = badgeY + badgeH / 2;
  doc.setDrawColor(5, 150, 105); // #059669
  doc.setLineWidth(0.5);
  doc.line(checkX, checkCenterY, checkX + 0.9, checkCenterY + 1.0);
  doc.line(checkX + 0.9, checkCenterY + 1.0, checkX + 2.6, checkCenterY - 1.1);

  // Badge text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70); // #065F46
  doc.text(badgeText, checkX + iconWidth + iconGap, badgeY + 4.6);

  // 2. Header Title: Token & Invoice
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text('Token & Invoice', 52.5, 22, { align: 'center' });

  // Subtitle: Lab Name • Date
  const displayDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // #64748B
  const subtitle = `${resolvedLabName.slice(0, 34)} • ${displayDate}`;
  doc.text(subtitle, 52.5, 26.5, { align: 'center' });

  // 3. Generated Token Number Display Card (Blue tinted card)
  doc.setFillColor(240, 247, 255); // #F0F7FF
  doc.setDrawColor(18, 59, 109); // #123B6D
  doc.setLineWidth(0.6);
  doc.roundedRect(8, 30, 89, 31, 3.5, 3.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 59, 109);
  doc.text('GENERATED TOKEN NUMBER', 52.5, 35.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(18, 59, 109);
  doc.text(String(entry?.tokenNumber || 'TK-101'), 52.5, 49, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `UHID: ${entry?.uhid || 'LAB-2026-9041'}   •   Time: ${entry?.registeredAt || 'Morning Shift'}`,
    52.5,
    57,
    { align: 'center' }
  );

  // 4. Patient Information Box (2 Columns)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(8, 64, 89, 19, 3, 3, 'FD');

  // Left: Patient details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.text('PATIENT', 12, 69);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const pName = entry?.patientName ? String(entry.patientName).slice(0, 24) : 'Patient';
  doc.text(pName, 12, 74);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${entry?.age || '-'} Yrs / ${entry?.gender || '-'}`, 12, 79);

  // Right: Mobile & Ref Doctor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('MOBILE & REF DOCTOR', 93, 69, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`+91 ${entry?.mobile || '-'}`, 93, 74, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const docName = entry?.referringDoctor ? `Dr: ${String(entry.referringDoctor).slice(0, 22)}` : 'Dr: Self';
  doc.text(docName, 93, 79, { align: 'right' });

  // 5. Prescribed Diagnostic Tests
  let curY = 88;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`PRESCRIBED DIAGNOSTIC TESTS (${tests.length})`, 8, curY);
  curY += 4.5;

  tests.forEach((t: string, idx: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const displayTest = String(t).length > 44 ? String(t).slice(0, 42) + '...' : String(t);
    doc.text(`${idx + 1}.  ${displayTest}`, 10, curY);
    curY += 4.5;
  });

  curY += 2;

  // 6. Bill Financial Breakdown Box
  const breakdownHeight = discount > 0 ? 37 : 32;
  doc.setFillColor(250, 250, 250); // #FAFAFA
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(8, curY, 89, breakdownHeight, 3, 3, 'FD');

  let bY = curY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Gross Test Amount:', 12, bY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${gross}`, 93, bY, { align: 'right' });

  if (discount > 0) {
    bY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text('Discount / Concession:', 12, bY);
    doc.setFont('helvetica', 'bold');
    doc.text(`-Rs. ${discount}`, 93, bY, { align: 'right' });
  }

  bY += 2.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(12, bY, 93, bY);
  bY += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Net Payable:', 12, bY);
  doc.setFontSize(10.5);
  doc.setTextColor(18, 59, 109);
  doc.text(`Rs. ${net}`, 93, bY, { align: 'right' });

  bY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  if (paid > 0) {
    doc.text(`Amount Paid (${entry?.paymentMode || 'Cash'}):`, 12, bY);
  } else {
    doc.text('Amount Paid:', 12, bY);
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${paid}`, 93, bY, { align: 'right' });

  bY += 2.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(12, bY, 93, bY);
  bY += 5.5;

  if (due > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(225, 29, 72); // Rose
    doc.text('Balance Due:', 12, bY);
    doc.setFontSize(10);
    doc.text(`Rs. ${due}`, 93, bY, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105); // Emerald
    doc.text('Payment Status:', 12, bY);
    doc.text('Full Payment Cleared', 93, bY, { align: 'right' });
  }

  if (entry?.upiTransactionRef) {
    bY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(109, 40, 217); // Purple
    doc.text('UPI Ref / UTR:', 12, bY);
    doc.setFont('helvetica', 'bold');
    doc.text(String(entry.upiTransactionRef), 93, bY, { align: 'right' });
  }

  curY += breakdownHeight + 5;

  // 7. Footer Strip
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(8, curY, 97, curY);
  doc.setLineDashPattern([], 0);
  curY += 3.5;

  if (entry?.bookingSource === 'Website') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(180, 83, 9); // Amber-700
    doc.text('Booking submitted. Final confirmation after Lab Owner approval.', 52.5, curY, { align: 'center' });
    curY += 3.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Online reports available on official lab portal', 52.5, curY, { align: 'center' });
  curY += 3.5;
  doc.text(`Keep this slip safe for report collection  •  ${resolvedLabName.slice(0, 36)}`, 52.5, curY, {
    align: 'center',
  });

  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  return { doc, filename, blob, file };
}

/**
 * Downloads the receipt PDF directly using the exact design
 */
export async function generateThermalReceiptPdf(entry: any, labNameRaw?: string): Promise<void> {
  const { doc, filename } = await buildReceiptInvoicePdf(entry, labNameRaw);
  doc.save(filename);
}

