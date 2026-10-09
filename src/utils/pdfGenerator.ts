import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LabReport } from '../types';
import { determineParameterStatus, EvaluatedParameterResult } from './statusLogic';
import {
  generateQrDataUrl,
  generateLaboratoryLogoWatermark,
} from './reportAssets';

/**
 * Builds the canonical A4 Portrait medical diagnostic lab report PDF document
 * in strict accordance with the Labname.com Diagnostic Report A4 Portrait specification:
 *
 * 1. Top Header (15–17% Height) with Lab details, Official Booking Receipt number, and ONE QR Code ONLY.
 * 2. Clean bordered Patient Information Box (Patient Details + Report Details).
 * 3. Department / Test Sections (e.g. DEPARTMENT OF BIOCHEMISTRY & PATHOLOGY • COMPLETE BLOOD COUNT).
 * 4. Main Test Table (Investigation/Parameter, Observed Value, Unit, Bio Reference Interval, Status).
 *    - Automatic Status Logic: NORMAL, LOW, HIGH, CRITICAL, ABNORMAL, PENDING.
 * 5. Critical / Panic Lab Value Alert Box (when configured panic values occur).
 * 6. Report End Separator: — END OF REPORT —
 * 7. Signature Section (Prepared/Verified By on Left, Authorized Signatory on Right).
 * 8. Dynamic Laboratory Logo Watermark (center-aligned, very light/faded, zero impact on readability).
 * 9. Fixed Clinical Center-Aligned Footer with Lab Name and dynamic Page X of Y.
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

  // 1. Prepare Verification URL (Single Canonical QR Code destination)
  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://labreport.online';
  const verifyUrl = `${currentOrigin}/verify?id=${encodeURIComponent(
    report.reportId
  )}&uhid=${encodeURIComponent(report.uhid)}&auth=${encodeURIComponent(
    (report.verificationHash || 'VERIFIED').slice(0, 16)
  )}`;

  // 2. Official Booking Receipt Number: e.g. "Official Booking Receipt LAB-2026-824476"
  const rawIdDigits = (report.reportId || '').replace(/\D/g, '');
  const receiptNumberSuffix = rawIdDigits ? rawIdDigits.slice(-6) : '824476';
  const bookingReceiptText = `Official Booking Receipt LAB-2026-${receiptNumberSuffix}`;

  // 3. Generate Assets in Parallel:
  // - ONE QR Code ONLY (top header)
  // - Dynamic Diagonal Laboratory Watermark (center of page, 45° rotation, light/faded opacity)
  const [headerQrDataUrl, watermarkDataUrl] = await Promise.all([
    generateQrDataUrl(verifyUrl, { size: 320, darkColor: '#0F2744' }),
    generateLaboratoryLogoWatermark(report.labName, report.labPhone),
  ]);

  // 4. Automatically Evaluate Parameters & Determine Exact Statuses
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

  const criticalItems = evaluatedItems.filter((i) => i.evaluation.isCritical);

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
  // CANONICAL HEADER RENDERING FUNCTION
  // (Repeated on Every Page for Multi-page Reports)
  // ==========================================
  const drawCanonicalReportHeader = (targetDoc: jsPDF): number => {
    // --- 1. TOP HEADER (70% Left Area | 30% Right Area - Clean Letterhead - No Top Bar / No Header Logo) ---
    const headerY = 8;
    const leftAreaWidth = contentWidth * 0.70; // 130.2 mm
    const rightAreaWidth = contentWidth * 0.30; // 55.8 mm
    const rightRightEdge = pageWidth - marginX;

    // Left 70% Area (Starts directly at marginX - logo removed from header):
    let leftY = headerY;

    // Lab Name Title (Bold, Multi-line wrapping if name is long)
    targetDoc.setTextColor(18, 59, 109);
    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setFontSize(12.5);
    const labDisplayName = (report.labName || 'APEX DIAGNOSTIC & CLINICAL PATHOLOGY LABORATORY').toUpperCase();
    const labTitleLines = targetDoc.splitTextToSize(labDisplayName, leftAreaWidth - 4);
    targetDoc.text(labTitleLines, marginX, leftY);
    leftY += labTitleLines.length * 4.8 + 1.2;

    // Address (Wrapped cleanly within left 70% area)
    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setFontSize(7.5);
    targetDoc.setTextColor(51, 65, 85);
    const addressText = report.labAddress || 'SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana';
    const addressLines = targetDoc.splitTextToSize(addressText, leftAreaWidth - 4);
    targetDoc.text(addressLines, marginX, leftY);
    leftY += addressLines.length * 3.6 + 0.8;

    // Phone & WhatsApp
    targetDoc.text(`Phone: +91 ${report.labPhone || '7087033009'} | WhatsApp: +91 7087033009`, marginX, leftY);
    leftY += 3.8;

    // Email & Website
    targetDoc.text('Email: care@apexdiagnostics.in | Website: www.apexdiagnostics.in', marginX, leftY);
    leftY += 3.8;

    // Registration / License details (NABL / ISO / Reg)
    targetDoc.setTextColor(15, 118, 110); // Medical Teal
    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setFontSize(7.2);

    const rawNabl = (report.nablAccreditationNo || 'MC-4821').trim();
    const cleanedNabl = rawNabl
      .replace(/\s*\([^)]*iso[^)]*\)/gi, '')
      .replace(/\s*\([^)]*nabl[^)]*\)/gi, '')
      .replace(/\s*-\s*iso.*$/i, '')
      .trim() || 'MC-4821';

    const licenseText = `NABL Accredited: ${cleanedNabl} • ISO 15189:2022 Certified • Reg No: LAB-2026-PB84`;
    const licenseLines = targetDoc.splitTextToSize(licenseText, leftAreaWidth - 4);
    targetDoc.text(licenseLines, marginX, leftY);
    leftY += licenseLines.length * 3.5;

    // Right 30% Area:
    // Official Booking Receipt Number + ONE QR CODE ONLY + Verification caption
    let rightY = headerY;

    // Official Booking Receipt Number (Prominent & bold)
    targetDoc.setTextColor(18, 59, 109);
    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setFontSize(7.5);
    targetDoc.text(bookingReceiptText, rightRightEdge, rightY, { align: 'right' });
    rightY += 4.2;

    // Report ID & UHID
    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setFontSize(6.8);
    targetDoc.setTextColor(100, 116, 139);
    targetDoc.text(`Report ID: ${report.reportId}`, rightRightEdge, rightY, { align: 'right' });
    rightY += 3.6;
    targetDoc.text(`UHID: ${report.uhid || 'UHID-824476'}`, rightRightEdge, rightY, { align: 'right' });
    rightY += 3.6;

    // ONE QR Code ONLY in entire report (Right side)
    const qrSize = 20;
    const qrX = rightRightEdge - qrSize;
    const qrY = rightY + 1;

    if (headerQrDataUrl) {
      try {
        targetDoc.setFillColor(255, 255, 255);
        targetDoc.setDrawColor(203, 213, 225);
        targetDoc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 5.5, 1.5, 1.5, 'FD');
        targetDoc.addImage(headerQrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');

        // Caption below QR: Verification prompt
        targetDoc.setFontSize(4.6);
        targetDoc.setFont('helvetica', 'bold');
        targetDoc.setTextColor(15, 118, 110);
        targetDoc.text('SCAN TO VERIFY REPORT', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
      } catch (err) {
        console.warn('Could not render header QR code:', err);
      }
    }

    const rightBottomY = qrY + qrSize + 6;

    // Dynamic header bottom dividing line that accommodates whatever height is required
    const headerBottomY = Math.max(leftY, rightBottomY) + 2.5;
    targetDoc.setDrawColor(203, 213, 225);
    targetDoc.setLineWidth(0.4);
    targetDoc.line(marginX, headerBottomY, pageWidth - marginX, headerBottomY);

    // --- 2. PATIENT INFORMATION BOX ---
    // Clean bordered box with two columns (Patient Details | Report Details)
    const pBoxY = headerBottomY + 3.8;
    const pBoxH = 26;
    const pBoxW = contentWidth;

    // Outer Box Frame
    targetDoc.setFillColor(248, 250, 252); // Soft clinical slate-50
    targetDoc.setDrawColor(203, 213, 225);
    targetDoc.setLineWidth(0.3);
    targetDoc.roundedRect(marginX, pBoxY, pBoxW, pBoxH, 1.5, 1.5, 'FD');

    // Vertical Center Column Divider
    const colDividerX = marginX + pBoxW / 2;
    targetDoc.setDrawColor(226, 232, 240);
    targetDoc.line(colDividerX, pBoxY, colDividerX, pBoxY + pBoxH);

    // Column 1: Patient Details
    const c1LabelX = marginX + 4;
    const c1ValX = marginX + 34;

    targetDoc.setFontSize(7.2);
    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setTextColor(100, 116, 139);
    targetDoc.text('PATIENT NAME:', c1LabelX, pBoxY + 6);
    targetDoc.text('AGE / GENDER:', c1LabelX, pBoxY + 12);
    targetDoc.text('CONTACT NO:', c1LabelX, pBoxY + 18);
    targetDoc.text('BARCODE / UHID:', c1LabelX, pBoxY + 23.5);

    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setTextColor(15, 23, 42); // Slate-900
    targetDoc.text(report.patientName.toUpperCase(), c1ValX, pBoxY + 6);
    targetDoc.text(report.ageGender || '45 Y / Male', c1ValX, pBoxY + 12);
    targetDoc.text(`+91 ${report.mobile}`, c1ValX, pBoxY + 18);
    targetDoc.text(report.barcode || report.uhid || 'BC-789218', c1ValX, pBoxY + 23.5);

    // Column 2: Report Details
    const c2LabelX = colDividerX + 4;
    const c2ValX = colDividerX + 32;

    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setTextColor(100, 116, 139);
    targetDoc.text('REFERRED BY:', c2LabelX, pBoxY + 6);
    targetDoc.text('SPECIMEN:', c2LabelX, pBoxY + 12);
    targetDoc.text('COLLECTED ON:', c2LabelX, pBoxY + 18);
    targetDoc.text('REPORTED ON:', c2LabelX, pBoxY + 23.5);

    targetDoc.setFont('helvetica', 'bold');
    targetDoc.setTextColor(15, 23, 42);
    targetDoc.text(report.doctor || 'Self / Dr. O. P. Sharma (MD)', c2ValX, pBoxY + 6);
    targetDoc.text('EDTA Whole Blood / Serum', c2ValX, pBoxY + 12);
    targetDoc.text(report.sampleCollectedAt || report.reportedAt, c2ValX, pBoxY + 18);
    targetDoc.text(report.reportedAt, c2ValX, pBoxY + 23.5);

    return pBoxY + pBoxH + 4;
  };

  // Measure exact Header Height & draw onto Page 1
  const headerTotalHeight = drawCanonicalReportHeader(doc);
  let cursorY = headerTotalHeight;

  // --- 3 & 4. DEPARTMENT SECTIONS & MAIN TEST TABLES (REPORT BODY) ---
  departmentGroups.forEach((group, gIdx) => {
    // If remaining space on current page is not enough for section header + 2 rows, break to new page
    if (cursorY > pageHeight - 50) {
      doc.addPage();
      cursorY = headerTotalHeight + 2;
    }

    // Department Section Header Bar
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.rect(marginX, cursorY, contentWidth, 6.5, 'F');

    // Navy Accent Indicator on Left
    doc.setFillColor(18, 59, 109);
    doc.rect(marginX, cursorY, 2.5, 6.5, 'F');

    doc.setTextColor(18, 59, 109);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${group.departmentName.toUpperCase()} • ${group.testTitle.toUpperCase()}`, marginX + 5, cursorY + 4.5);

    cursorY += 7.5;

    // Table rows
    const tableData = group.items.map((item) => {
      const statusBadge = item.evaluation.style.badgeLabel;
      return [
        item.parameter,
        item.result,
        item.unit || '-',
        item.referenceRange || '-',
        statusBadge,
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: {
        top: headerTotalHeight, // Ensures subsequent pages start below the repeated header
        bottom: 24,            // Ensures table stops before the footer
        left: marginX,
        right: marginX,
      },
      head: [['Investigation / Parameter', 'Observed Value', 'Unit', 'Bio Reference Interval', 'Status']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7.8,
        textColor: [30, 41, 59],
        cellPadding: 2.2,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [18, 59, 109],
        textColor: [255, 255, 255],
        fontSize: 7.8,
        fontStyle: 'bold',
        halign: 'left',
      },
      columnStyles: {
        0: { cellWidth: 54, fontStyle: 'bold' },
        1: { cellWidth: 32, fontStyle: 'bold' },
        2: { cellWidth: 26 },
        3: { cellWidth: 46 },
        4: { cellWidth: 28, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index >= 0) {
          const item = group.items[data.row.index];
          if (item?.evaluation) {
            const ev = item.evaluation;

            // Highlight Observed Value & Status column based on determined status
            if (ev.status === 'CRITICAL') {
              if (data.column.index === 1 || data.column.index === 4) {
                data.cell.styles.fillColor = [254, 226, 226]; // Rose-100
                data.cell.styles.textColor = [190, 18, 60]; // Rose-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'HIGH') {
              if (data.column.index === 1 || data.column.index === 4) {
                data.cell.styles.textColor = [180, 83, 9]; // Amber-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'LOW') {
              if (data.column.index === 1 || data.column.index === 4) {
                data.cell.styles.textColor = [29, 78, 216]; // Blue-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'ABNORMAL') {
              if (data.column.index === 1 || data.column.index === 4) {
                data.cell.styles.textColor = [185, 28, 28]; // Red-700
                data.cell.styles.fontStyle = 'bold';
              }
            } else if (ev.status === 'PENDING') {
              if (data.column.index === 1 || data.column.index === 4) {
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

  // --- 5. CRITICAL / ABNORMAL ALERT BOX (REPORT BODY) ---
  if (criticalItems.length > 0) {
    if (cursorY > pageHeight - 65) {
      doc.addPage();
      cursorY = headerTotalHeight + 2;
    }

    const alertH = 15;
    doc.setFillColor(255, 241, 242); // Rose-50
    doc.setDrawColor(225, 29, 72); // Rose-600
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, cursorY, contentWidth, alertH, 1.5, 1.5, 'FD');

    // Warning Header
    doc.setTextColor(190, 18, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('CRITICAL / PANIC LAB VALUE ALERT:', marginX + 4, cursorY + 5);

    // Standard clinical wording
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(136, 19, 55);
    const alertMsg =
      'One or more reported values require immediate clinical attention. Please correlate with clinical findings and contact the laboratory/ordering clinician as appropriate.';
    const splitAlert = doc.splitTextToSize(alertMsg, contentWidth - 8);
    doc.text(splitAlert, marginX + 4, cursorY + 9.5);

    cursorY += alertH + 4;
  }

  // --- 6. REPORT END SEPARATOR (REPORT BODY) ---
  if (cursorY > pageHeight - 50) {
    doc.addPage();
    cursorY = headerTotalHeight + 2;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(marginX + 20, cursorY + 2, pageWidth - marginX - 20, cursorY + 2);
  doc.setLineDashPattern([], 0);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('— END OF REPORT —', pageWidth / 2, cursorY + 2.5, { align: 'center' });

  cursorY += 8;

  // --- 7. SIGNATURE SECTION (REPORT BODY - Lower Portion of Final Page) ---
  const requiredSignHeight = 35;
  if (cursorY > pageHeight - requiredSignHeight - 12) {
    doc.addPage();
    cursorY = headerTotalHeight + 2;
  }
  const signatureY = Math.max(cursorY, pageHeight - 42);

  // Left Signature: Prepared / Verified By
  const leftSignX = marginX + 6;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('PREPARED / VERIFIED BY', leftSignX, signatureY);

  // Vector Verification Stamp Line
  doc.setDrawColor(18, 59, 109);
  doc.setLineWidth(0.3);
  doc.line(leftSignX, signatureY + 1.5, leftSignX + 48, signatureY + 1.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text('S. Verma, M.Sc., DMLT', leftSignX, signatureY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Senior Medical Laboratory Technologist', leftSignX, signatureY + 10);
  doc.text('Batch Quality Control Verified', leftSignX, signatureY + 13.5);

  // Right Signature: Laboratory Authorized Signatory
  const rightSignX = pageWidth - marginX - 6;

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('LABORATORY AUTHORIZED SIGNATORY', rightSignX, signatureY, { align: 'right' });

  // Vector Signature Curve
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

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(18, 59, 109);
  doc.text(report.pathologist || 'Dr. Rajesh Sharma, MD', rightSignX, signatureY + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(report.pathologistDegrees || 'Consultant Pathologist & Lab Director (Reg No: MCI-PB-48192)', rightSignX, signatureY + 10, { align: 'right' });

  // --- 8 & 9. MULTI-PAGE SYNCHRONIZATION: REPEAT HEADER, WATERMARK & FOOTER ON EVERY PAGE ---
  const totalPages = doc.getNumberOfPages();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // Apply Diagonal Watermark on every page
    if (watermarkDataUrl) {
      try {
        const wmSize = 160;
        const wmX = (pageWidth - wmSize) / 2;
        const wmY = (pageHeight - wmSize) / 2;
        doc.addImage(watermarkDataUrl, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
      } catch {}
    }

    // Repeat Exact Header on pages 2+ (On page 1 it was drawn at start)
    if (pageNum > 1) {
      drawCanonicalReportHeader(doc);
    }

    // Repeat Exact Footer on EVERY Page
    const footerLineY = pageHeight - 9;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerLineY, pageWidth - marginX, footerLineY);

    // Footer Text: Electronic Generation Notice (Center-Aligned with Page X of Y)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);

    const footerCenterText = totalPages > 1
      ? `Report electronically generated by ${report.labName || 'Apex Diagnostic Laboratory'} (Page ${pageNum} of ${totalPages})`
      : `Report electronically generated by ${report.labName || 'Apex Diagnostic Laboratory'}`;
    doc.text(footerCenterText, pageWidth / 2, pageHeight - 4.5, { align: 'center' });
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

