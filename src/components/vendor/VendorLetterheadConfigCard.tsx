import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Eye,
  Sliders,
  Printer,
  Sparkles,
  Info,
  Check,
  X,
  Layers,
  FileCheck,
  ShieldCheck,
  SlidersHorizontal,
  Settings2,
  UserCheck,
  Stethoscope,
  QrCode,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import {
  DEFAULT_LETTERHEAD_BODY_TOP,
  DEFAULT_LETTERHEAD_BODY_BOTTOM,
  DEFAULT_LETTERHEAD_MARGIN_LEFT,
  DEFAULT_LETTERHEAD_MARGIN_RIGHT,
  DEFAULT_LETTERHEAD_FONT_SCALE,
  rasterizeUploadedFile,
  generateSampleLetterheadDataUrl,
} from '../../utils/letterheadUtils';
import { CanonicalPdfViewer } from '../CanonicalPdfViewer';
import { SAMPLE_REPORT } from '../../data/mockData';

export const VendorLetterheadConfigCard: React.FC = () => {
  const { vendorLabSettings, updateVendorLabSettings } = useCms();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sub-tab inside Letterhead / Report Config Card
  const [activeCardTab, setActiveCardTab] = useState<'letterhead' | 'report_fields'>('letterhead');

  // Letterhead background & margin configuration state
  const [enabled, setEnabled] = useState<boolean>(
    Boolean(vendorLabSettings.enableStaticPdfLetterhead)
  );
  const [pdfName, setPdfName] = useState<string>(
    vendorLabSettings.letterheadPdfName || ''
  );
  const [bgDataUrl, setBgDataUrl] = useState<string>(
    vendorLabSettings.letterheadBgDataUrl || ''
  );
  const [pdfUrl, setPdfUrl] = useState<string>(
    vendorLabSettings.letterheadPdfUrl || ''
  );
  const [bodyTop, setBodyTop] = useState<number>(
    vendorLabSettings.letterheadBodyTop ?? DEFAULT_LETTERHEAD_BODY_TOP
  );
  const [bodyBottom, setBodyBottom] = useState<number>(
    vendorLabSettings.letterheadBodyBottom ?? DEFAULT_LETTERHEAD_BODY_BOTTOM
  );
  const [marginLeft, setMarginLeft] = useState<number>(
    vendorLabSettings.letterheadMarginLeft ?? DEFAULT_LETTERHEAD_MARGIN_LEFT
  );
  const [marginRight, setMarginRight] = useState<number>(
    vendorLabSettings.letterheadMarginRight ?? DEFAULT_LETTERHEAD_MARGIN_RIGHT
  );
  const [fontScale, setFontScale] = useState<number>(
    vendorLabSettings.letterheadFontScale ?? DEFAULT_LETTERHEAD_FONT_SCALE
  );

  // Report Field Customization & Show/Hide Toggles
  const [showReportQrCode, setShowReportQrCode] = useState<boolean>(
    vendorLabSettings.showReportQrCode !== false
  );
  const [showReportBarcode, setShowReportBarcode] = useState<boolean>(
    vendorLabSettings.showReportBarcode !== false
  );
  const [showReportMobile, setShowReportMobile] = useState<boolean>(
    vendorLabSettings.showReportMobile !== false
  );
  const [showReportRegDate, setShowReportRegDate] = useState<boolean>(
    vendorLabSettings.showReportRegDate !== false
  );
  const [showReportCollectionDate, setShowReportCollectionDate] = useState<boolean>(
    vendorLabSettings.showReportCollectionDate !== false
  );
  const [showReportReportingDate, setShowReportReportingDate] = useState<boolean>(
    vendorLabSettings.showReportReportingDate !== false
  );
  const [showReportStatusColumn, setShowReportStatusColumn] = useState<boolean>(
    vendorLabSettings.showReportStatusColumn !== false
  );
  const [showReportClinicNote, setShowReportClinicNote] = useState<boolean>(
    vendorLabSettings.showReportClinicNote !== false
  );
  const [showReportEndOfReport, setShowReportEndOfReport] = useState<boolean>(
    vendorLabSettings.showReportEndOfReport !== false
  );
  const [showReportTechnicianSign, setShowReportTechnicianSign] = useState<boolean>(
    vendorLabSettings.showReportTechnicianSign !== false
  );
  const [showReportPathologistSign, setShowReportPathologistSign] = useState<boolean>(
    vendorLabSettings.showReportPathologistSign !== false
  );
  const [showReportDigitalSignCurve, setShowReportDigitalSignCurve] = useState<boolean>(
    vendorLabSettings.showReportDigitalSignCurve !== false
  );
  const [showReportDepartmentHeader, setShowReportDepartmentHeader] = useState<boolean>(
    vendorLabSettings.showReportDepartmentHeader !== false
  );
  const [showReportMethod, setShowReportMethod] = useState<boolean>(
    vendorLabSettings.showReportMethod !== false
  );
  const [showReportPageNumber, setShowReportPageNumber] = useState<boolean>(
    vendorLabSettings.showReportPageNumber !== false
  );

  // Signatory & Notes Custom Details
  const [reportTechnicianName, setReportTechnicianName] = useState<string>(
    vendorLabSettings.reportTechnicianName || 'S. Verma, M.Sc., DMLT'
  );
  const [reportTechnicianDesignation, setReportTechnicianDesignation] = useState<string>(
    vendorLabSettings.reportTechnicianDesignation || 'Senior Medical Laboratory Technologist'
  );
  const [reportPathologistName, setReportPathologistName] = useState<string>(
    vendorLabSettings.reportPathologistName || vendorLabSettings.founderName || 'Dr. Rajesh Sharma, MD'
  );
  const [reportPathologistDegrees, setReportPathologistDegrees] = useState<string>(
    vendorLabSettings.reportPathologistDegrees || 'Consultant Pathologist & Lab Director (Reg No: MCI-PB-48192)'
  );
  const [reportCustomClinicNote, setReportCustomClinicNote] = useState<string>(
    vendorLabSettings.reportCustomClinicNote || ''
  );

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTestPreview, setShowTestPreview] = useState(false);
  const [diagramViewMode, setDiagramViewMode] = useState<'detailed' | 'wireframe'>('detailed');

  // Computed body dimensions in mm
  const printableWidth = Math.max(50, 210 - marginLeft - marginRight);
  const printableHeight = Math.max(50, 297 - bodyTop - bodyBottom);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const res = await rasterizeUploadedFile(file);
      setBgDataUrl(res.dataUrl);
      setPdfUrl(res.pdfDataUrl);
      setPdfName(res.filename);
      setEnabled(true);
    } catch (err: any) {
      console.error('Failed to process letterhead file:', err);
      alert('Could not process uploaded file. Please make sure it is a valid A4 PDF or image.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Load sample letterhead
  const handleLoadSample = () => {
    const sample = generateSampleLetterheadDataUrl(
      vendorLabSettings.labName || 'APEX CLINICAL & PATHOLOGY DIAGNOSTICS',
      vendorLabSettings.phone || '+91 7087033009',
      vendorLabSettings.address || 'SCO 101, Medical Enclave, Civil Road, Ludhiana - 141001'
    );
    setBgDataUrl(sample);
    setPdfUrl(sample);
    setPdfName('Sample_Diagnostic_Letterhead_A4.pdf');
    setEnabled(true);
  };

  // Reset to default margins
  const handleResetDefaults = () => {
    setBodyTop(DEFAULT_LETTERHEAD_BODY_TOP);
    setBodyBottom(DEFAULT_LETTERHEAD_BODY_BOTTOM);
    setMarginLeft(DEFAULT_LETTERHEAD_MARGIN_LEFT);
    setMarginRight(DEFAULT_LETTERHEAD_MARGIN_RIGHT);
    setFontScale(DEFAULT_LETTERHEAD_FONT_SCALE);
  };

  // Save changes to vendor settings
  const handleSave = () => {
    updateVendorLabSettings({
      enableStaticPdfLetterhead: enabled,
      letterheadPdfName: pdfName,
      letterheadBgDataUrl: bgDataUrl,
      letterheadPdfUrl: pdfUrl,
      letterheadBodyTop: bodyTop,
      letterheadBodyBottom: bodyBottom,
      letterheadMarginLeft: marginLeft,
      letterheadMarginRight: marginRight,
      letterheadFontScale: fontScale,
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
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Sample report for testing preview with live toggle synchronization
  const previewSampleReport = {
    ...SAMPLE_REPORT,
    enableStaticPdfLetterhead: enabled,
    letterheadBgDataUrl: bgDataUrl,
    letterheadPdfUrl: pdfUrl,
    letterheadBodyTop: bodyTop,
    letterheadBodyBottom: bodyBottom,
    letterheadMarginLeft: marginLeft,
    letterheadMarginRight: marginRight,
    letterheadFontScale: fontScale,
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
    pathologist: reportPathologistName,
    pathologistDegrees: reportPathologistDegrees,
    clinicNote: reportCustomClinicNote,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#0F2744] via-[#123B6D] to-[#1E4D8C] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-sky-200 text-xs font-semibold backdrop-blur-xs">
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>A4 Letterhead &amp; Report Design Control</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            PDF Letterhead &amp; Report Customization
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
            Upload pre-designed A4 stationery or customize which elements to show or remove (QR Code, 4-column vs 5-column table, clinic notes, doctor signatures, and dates).
          </p>
        </div>

        {/* Master ON/OFF Switch */}
        <div className="flex items-center gap-3 bg-white/10 p-2 sm:p-2.5 rounded-xl backdrop-blur-xs shrink-0 self-start sm:self-center border border-white/20">
          <span className="text-xs font-bold text-white">
            {enabled ? 'Letterhead Active' : 'Letterhead Disabled'}
          </span>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
              enabled ? 'bg-emerald-500' : 'bg-slate-500'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Background vs Content Visibility */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 pt-3 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveCardTab('letterhead')}
          className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeCardTab === 'letterhead'
              ? 'border-[#123B6D] text-[#123B6D]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-600" />
          <span>1. A4 Letterhead Background &amp; Margins (लेटरहेड बैकग्राउंड व मार्जिन)</span>
          {enabled && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              Active
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveCardTab('report_fields')}
          className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeCardTab === 'report_fields'
              ? 'border-[#123B6D] text-[#123B6D]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings2 className="w-4 h-4 text-amber-500" />
          <span>2. Report Content &amp; Visibility (रिपोर्ट में क्या दिखाना है / क्या हटाना है)</span>
          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900">
            Show / Hide Controls
          </span>
        </button>
      </div>

      {/* TAB 1: A4 LETTERHEAD BACKGROUND & MARGINS */}
      {activeCardTab === 'letterhead' && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Main Grid: Upload & Controls on Left, Visual Sheet Preview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Upload & Config Controls */}
            <div className="lg:col-span-7 space-y-5">
              {/* File Upload Box */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50 hover:bg-slate-100/70 transition flex flex-col items-center justify-center text-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-[#123B6D]/10 text-[#123B6D] flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    {pdfName ? `Loaded: ${pdfName}` : 'Upload A4 PDF or High-Res Image'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Upload your complete A4 pre-designed letterhead with your Header at top and Footer at bottom.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isProcessingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isProcessingFile ? 'Processing...' : pdfName ? 'Replace Letterhead PDF' : 'Select Letterhead File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Load Sample A4 Letterhead</span>
                  </button>

                  {bgDataUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setBgDataUrl('');
                        setPdfUrl('');
                        setPdfName('');
                        setEnabled(false);
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Body Zone Sliders */}
              <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#123B6D]" />
                    <span>Dynamic Body Printing Area (mm)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="text-[11px] font-bold text-[#123B6D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Top Margin (Header exclusion zone) */}
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Header Clearance (Top Margin)</span>
                      <span className="font-mono text-[#123B6D]">{bodyTop} mm</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={90}
                      value={bodyTop}
                      onChange={(e) => setBodyTop(Number(e.target.value))}
                      className="w-full accent-[#123B6D] cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-400">Leaves top area clear for uploaded header</div>
                  </div>

                  {/* Bottom Margin (Footer exclusion zone) */}
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Footer Clearance (Bottom Margin)</span>
                      <span className="font-mono text-[#123B6D]">{bodyBottom} mm</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={70}
                      value={bodyBottom}
                      onChange={(e) => setBodyBottom(Number(e.target.value))}
                      className="w-full accent-[#123B6D] cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-400">Leaves bottom area clear for uploaded footer</div>
                  </div>

                  {/* Left Margin */}
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Left Margin</span>
                      <span className="font-mono text-[#123B6D]">{marginLeft} mm</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      value={marginLeft}
                      onChange={(e) => setMarginLeft(Number(e.target.value))}
                      className="w-full accent-[#123B6D] cursor-pointer"
                    />
                  </div>

                  {/* Right Margin */}
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Right Margin</span>
                      <span className="font-mono text-[#123B6D]">{marginRight} mm</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      value={marginRight}
                      onChange={(e) => setMarginRight(Number(e.target.value))}
                      className="w-full accent-[#123B6D] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Font Scaling Slider */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between font-bold text-xs text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                      <span>Report Font Scale &amp; Row Density</span>
                    </span>
                    <span className="font-mono text-[#123B6D]">{fontScale}%</span>
                  </div>
                  <input
                    type="range"
                    min={75}
                    max={125}
                    value={fontScale}
                    onChange={(e) => setFontScale(Number(e.target.value))}
                    className="w-full accent-[#123B6D] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>75% (Compact / Fit more tests on 1 page)</span>
                    <span>100% Standard</span>
                    <span>125% (Large / Spacious)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: A4 Sheet Visual Layout Diagram */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                  <span>A4 Sheet Preview (210 × 297 mm)</span>
                </div>

                {/* View Mode Toggle: Detailed vs Wireframe */}
                <div className="inline-flex rounded-lg bg-slate-200 p-0.5 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setDiagramViewMode('detailed')}
                    className={`px-2 py-0.5 rounded-md transition ${
                      diagramViewMode === 'detailed'
                        ? 'bg-white text-[#123B6D] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Report View
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiagramViewMode('wireframe')}
                    className={`px-2 py-0.5 rounded-md transition ${
                      diagramViewMode === 'wireframe'
                        ? 'bg-white text-[#123B6D] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Margins
                  </button>
                </div>
              </div>

              {/* Scaled A4 Sheet Representation */}
              <div
                onClick={() => setShowTestPreview(true)}
                title="Click to view full-size high-resolution PDF report"
                className="w-[270px] h-[382px] bg-white rounded-lg shadow-xl border border-slate-300 relative overflow-hidden flex flex-col justify-between cursor-pointer group hover:ring-2 hover:ring-[#123B6D]/40 transition select-none"
              >
                {/* Background image preview if uploaded */}
                {bgDataUrl && (
                  <img
                    src={bgDataUrl}
                    alt="Letterhead Preview"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 z-0"
                  />
                )}

                {/* Header Zone */}
                <div
                  style={{ height: `${(bodyTop / 297) * 382}px` }}
                  className={`border-b relative flex items-center justify-center p-1 text-center shrink-0 z-10 ${
                    enabled && bgDataUrl
                      ? 'bg-amber-100/50 border-amber-300 text-amber-900'
                      : 'bg-[#123B6D] border-blue-900 text-white'
                  }`}
                >
                  {enabled && bgDataUrl ? (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded shadow-2xs">
                      Protected Header ({bodyTop} mm)
                    </span>
                  ) : (
                    <div className="w-full px-2 flex items-center justify-between">
                      <div className="text-left leading-tight">
                        <div className="text-[8px] font-black tracking-wide truncate max-w-[170px]">
                          {(vendorLabSettings.labName || 'APEX DIAGNOSTIC LABORATORY').toUpperCase()}
                        </div>
                        <div className="text-[6.5px] opacity-80 truncate max-w-[170px]">
                          {vendorLabSettings.address || 'SCO 101, Medical Enclave, Ludhiana'}
                        </div>
                        <div className="text-[6px] opacity-75">
                          Ph: +91 {vendorLabSettings.phone || '7087033009'}
                        </div>
                      </div>
                      {showReportQrCode && (
                        <div className="w-5 h-5 bg-white rounded p-0.5 flex items-center justify-center text-[#123B6D]">
                          <QrCode className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dynamic Body Area (Full actual report details) */}
                <div
                  style={{
                    marginLeft: `${(marginLeft / 210) * 270}px`,
                    marginRight: `${(marginRight / 210) * 270}px`,
                  }}
                  className="flex-1 bg-white/95 relative mx-1 my-0.5 rounded border border-emerald-400/80 shadow-2xs overflow-hidden flex flex-col justify-between p-1.5 z-10"
                >
                  {diagramViewMode === 'wireframe' ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-2 bg-emerald-50/70 border-2 border-dashed border-emerald-400 rounded">
                      <span className="text-[10px] font-black text-emerald-900 leading-tight">
                        DYNAMIC REPORT BODY AREA
                      </span>
                      <span className="text-[8.5px] font-mono text-emerald-700 mt-0.5">
                        {printableWidth} × {printableHeight} mm
                      </span>
                      <div className="mt-2 w-full space-y-1 opacity-60">
                        <div className="h-1.5 bg-emerald-300 rounded w-full" />
                        <div className="h-1.5 bg-emerald-300 rounded w-4/5 mx-auto" />
                        <div className="h-1.5 bg-emerald-300 rounded w-full" />
                      </div>
                      <span className="text-[7.5px] text-emerald-700 mt-2 font-medium">
                        Patient Box • Tests Table • Notes • Signatures
                      </span>
                    </div>
                  ) : (
                    /* Detailed Realistic Mini Report View */
                    <div className="h-full flex flex-col justify-between text-[7px] text-slate-800 leading-tight font-sans">
                      {/* 1. Patient Demographics Box */}
                      <div className="bg-slate-50 border border-slate-300 rounded p-1 mb-1">
                        <div className="flex justify-between items-start gap-1">
                          <div className="space-y-0.5 truncate flex-1">
                            <div className="font-extrabold text-[7.5px] text-slate-900">
                              PATIENT: RAMESH KUMAR <span className="font-normal text-slate-600">(45 Y / Male)</span>
                            </div>
                            <div className="text-[6.5px] text-slate-600 flex items-center gap-1">
                              <span>Ref: Dr. Self / Direct</span>
                              <span>•</span>
                              <span>Sample: EDTA Blood</span>
                            </div>
                            {showReportMobile && (
                              <div className="text-[6px] text-slate-500">
                                Contact: +91 98150 12345 | Reg: Today 08:30 AM
                              </div>
                            )}
                          </div>
                          {showReportQrCode && (
                            <div className="w-4.5 h-4.5 bg-white border border-slate-300 rounded shrink-0 flex items-center justify-center text-slate-700">
                              <QrCode className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Department & Test Section Header */}
                      {showReportDepartmentHeader && (
                        <div className="bg-slate-100 border-l-2 border-[#123B6D] px-1 py-0.5 mb-0.5 font-bold text-[6.5px] text-[#123B6D] uppercase flex justify-between">
                          <span>DEPT. OF HEMATOLOGY &amp; CLINICAL PATHOLOGY</span>
                          <span className="font-normal text-slate-500">CBC TEST</span>
                        </div>
                      )}

                      {/* 3. Core Test Results Table */}
                      <div className="border border-slate-200 rounded overflow-hidden mb-1">
                        {/* Table Header */}
                        <div className="bg-[#123B6D] text-white font-bold grid grid-cols-12 px-1 py-0.5 text-[6px]">
                          <span className={showReportStatusColumn ? 'col-span-4' : 'col-span-5'}>Investigation</span>
                          <span className="col-span-2 text-right">Value</span>
                          <span className="col-span-2 text-center">Unit</span>
                          <span className={showReportStatusColumn ? 'col-span-2 text-center' : 'col-span-3 text-center'}>Bio Range</span>
                          {showReportStatusColumn && <span className="col-span-2 text-center">Status</span>}
                        </div>

                        {/* Row 1: Hemoglobin */}
                        <div className="grid grid-cols-12 px-1 py-0.5 border-t border-slate-100 bg-white items-center text-[6px]">
                          <span className={`font-semibold truncate ${showReportStatusColumn ? 'col-span-4' : 'col-span-5'}`}>Hemoglobin (Hb)</span>
                          <span className="col-span-2 text-right font-bold text-slate-900">14.2</span>
                          <span className="col-span-2 text-center text-slate-500">g/dL</span>
                          <span className={`text-slate-600 text-center ${showReportStatusColumn ? 'col-span-2' : 'col-span-3'}`}>13.0 - 17.0</span>
                          {showReportStatusColumn && (
                            <span className="col-span-2 text-center">
                              <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[5.5px] font-bold">NORMAL</span>
                            </span>
                          )}
                        </div>

                        {/* Row 2: TLC */}
                        <div className="grid grid-cols-12 px-1 py-0.5 border-t border-slate-100 bg-slate-50/50 items-center text-[6px]">
                          <span className={`font-semibold truncate ${showReportStatusColumn ? 'col-span-4' : 'col-span-5'}`}>Total Leucocytes (WBC)</span>
                          <span className="col-span-2 text-right font-bold text-slate-900">8,400</span>
                          <span className="col-span-2 text-center text-slate-500">/cumm</span>
                          <span className={`text-slate-600 text-center ${showReportStatusColumn ? 'col-span-2' : 'col-span-3'}`}>4000 - 11000</span>
                          {showReportStatusColumn && (
                            <span className="col-span-2 text-center">
                              <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[5.5px] font-bold">NORMAL</span>
                            </span>
                          )}
                        </div>

                        {/* Row 3: Platelets */}
                        <div className="grid grid-cols-12 px-1 py-0.5 border-t border-slate-100 bg-white items-center text-[6px]">
                          <span className={`font-semibold truncate ${showReportStatusColumn ? 'col-span-4' : 'col-span-5'}`}>Platelet Count</span>
                          <span className="col-span-2 text-right font-bold text-slate-900">2.50</span>
                          <span className="col-span-2 text-center text-slate-500">Lac/cumm</span>
                          <span className={`text-slate-600 text-center ${showReportStatusColumn ? 'col-span-2' : 'col-span-3'}`}>1.5 - 4.5</span>
                          {showReportStatusColumn && (
                            <span className="col-span-2 text-center">
                              <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[5.5px] font-bold">NORMAL</span>
                            </span>
                          )}
                        </div>

                        {/* Row 4: Blood Sugar */}
                        <div className="grid grid-cols-12 px-1 py-0.5 border-t border-slate-100 bg-amber-50/40 items-center text-[6px]">
                          <span className={`font-semibold truncate ${showReportStatusColumn ? 'col-span-4' : 'col-span-5'}`}>Fasting Blood Sugar</span>
                          <span className="col-span-2 text-right font-bold text-amber-700">118 *</span>
                          <span className="col-span-2 text-center text-slate-500">mg/dL</span>
                          <span className={`text-slate-600 text-center ${showReportStatusColumn ? 'col-span-2' : 'col-span-3'}`}>70 - 100</span>
                          {showReportStatusColumn && (
                            <span className="col-span-2 text-center">
                              <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[5.5px] font-bold">HIGH</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 4. Clinic Note Section */}
                      {showReportClinicNote && (
                        <div className="bg-slate-50 border-l-2 border-[#123B6D] p-1 rounded-xs mb-1 text-[5.5px] text-slate-600">
                          <span className="font-bold text-[#123B6D]">CLINIC NOTE: </span>
                          <span>
                            {reportCustomClinicNote || 'Please correlate clinically with patient symptoms.'}
                          </span>
                        </div>
                      )}

                      {/* 5. End of Report Divider */}
                      {showReportEndOfReport && (
                        <div className="text-center text-[5.5px] text-slate-400 font-bold border-b border-dashed border-slate-200 pb-0.5 mb-1">
                          — END OF REPORT —
                        </div>
                      )}

                      {/* 6. Signatures Block */}
                      {(showReportTechnicianSign || showReportPathologistSign) && (
                        <div className="flex justify-between items-end pt-1 border-t border-slate-100 mt-auto">
                          {showReportTechnicianSign ? (
                            <div className="text-left leading-none space-y-0.5">
                              <div className="text-[5px] text-slate-400 uppercase font-bold">Prepared By</div>
                              <div className="font-bold text-[6px] text-slate-800 truncate max-w-[100px]">
                                {reportTechnicianName || 'S. Verma, DMLT'}
                              </div>
                              <div className="text-[5px] text-slate-500">QC Verified</div>
                            </div>
                          ) : <div />}

                          {showReportPathologistSign && (
                            <div className="text-right leading-none space-y-0.5">
                              {showReportDigitalSignCurve && (
                                <div className="text-[7px] text-[#123B6D] font-serif italic text-right">
                                  ✍️ Verified
                                </div>
                              )}
                              <div className="text-[5px] text-slate-400 uppercase font-bold">Authorized Signatory</div>
                              <div className="font-bold text-[6px] text-[#123B6D] truncate max-w-[110px]">
                                {reportPathologistName || 'Dr. Rajesh Sharma, MD'}
                              </div>
                              <div className="text-[5px] text-slate-500">Consultant Pathologist</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hover prompt */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-2 rounded backdrop-blur-2xs">
                    <span className="px-2.5 py-1 bg-white text-slate-900 text-[10px] font-bold rounded-lg shadow-lg flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-500" />
                      <span>Click for Full PDF Preview</span>
                    </span>
                  </div>
                </div>

                {/* Footer Zone */}
                <div
                  style={{ height: `${(bodyBottom / 297) * 382}px` }}
                  className={`border-t relative flex items-center justify-center p-1 text-center shrink-0 z-10 ${
                    enabled && bgDataUrl
                      ? 'bg-amber-100/50 border-amber-300 text-amber-900'
                      : 'bg-[#123B6D] border-blue-900 text-white'
                  }`}
                >
                  {enabled && bgDataUrl ? (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded shadow-2xs">
                      Protected Footer ({bodyBottom} mm)
                    </span>
                  ) : (
                    <div className="w-full px-2 flex items-center justify-between text-[6.5px]">
                      <span>{vendorLabSettings.bookingTiming || 'Mon - Sun: 07:00 AM - 09:00 PM'}</span>
                      <span className="font-bold">Electronically Verified Diagnostic Report</span>
                      <span>Page 1 of 1</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Click Full PDF Preview Button */}
              <button
                type="button"
                onClick={() => setShowTestPreview(true)}
                className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#123B6D] border border-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Eye className="w-4 h-4 text-amber-500" />
                <span>Open Full-Size Report Preview (लाइव रिपोर्ट देखें)</span>
              </button>

              <div className="mt-2 text-[11px] text-slate-500 text-center max-w-xs space-y-1">
                <p>
                  <strong>Yellow/Navy:</strong> Header &amp; Footer bands (letterhead zone).
                </p>
                <p>
                  <strong>Green Box:</strong> Dynamic Report Body containing real Patient, Test Results, Notes &amp; Signatures.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORT CONTENT & VISIBILITY (SHOW / HIDE CONTROLS) */}
      {activeCardTab === 'report_fields' && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Report Customization:</strong> Use these switches to control exactly what is displayed or removed on your printed and WhatsApp PDF reports. For instance, turn off the 5th "Status" column for a clean 4-column layout, remove the QR Code if printing on pre-printed letterheads, or hide the Clinic Note box so single-page reports fit without spilling.
            </p>
          </div>

          {/* Section 1: Patient Demographics & Header Fields */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 text-slate-900 font-extrabold text-sm">
              <UserCheck className="w-4 h-4 text-[#123B6D]" />
              <span>1. Patient Demographics &amp; Header Identifiers (मरीज़ की जानकारी व हेडर)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Toggle: QR Code */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReportQrCode}
                  onChange={(e) => setShowReportQrCode(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#123B6D] rounded"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">QR Code Verification</div>
                  <div className="text-[11px] text-slate-500">
                    {showReportQrCode ? 'Shown (Scannable camera link)' : 'Hidden (Removed completely)'}
                  </div>
                </div>
              </label>

              {/* Toggle: Barcode */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReportBarcode}
                  onChange={(e) => setShowReportBarcode(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#123B6D] rounded"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Barcode / Sample Number</div>
                  <div className="text-[11px] text-slate-500">
                    {showReportBarcode ? 'Shown in patient details' : 'Hidden from patient details'}
                  </div>
                </div>
              </label>

              {/* Toggle: Mobile Number */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReportMobile}
                  onChange={(e) => setShowReportMobile(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#123B6D] rounded"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Patient Contact Number</div>
                  <div className="text-[11px] text-slate-500">
                    {showReportMobile ? 'Shown (+91 XXXXX)' : 'Hidden (For patient privacy)'}
                  </div>
                </div>
              </label>

              {/* Toggle: Sample Collection Time */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReportCollectionDate}
                  onChange={(e) => setShowReportCollectionDate(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#123B6D] rounded"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Sample Collection Date &amp; Time</div>
                  <div className="text-[11px] text-slate-500">
                    {showReportCollectionDate ? 'Shown (COLLECTED ON)' : 'Hidden'}
                  </div>
                </div>
              </label>

              {/* Toggle: Report Time */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReportReportingDate}
                  onChange={(e) => setShowReportReportingDate(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#123B6D] rounded"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Reporting Approved Date &amp; Time</div>
                  <div className="text-[11px] text-slate-500">
                    {showReportReportingDate ? 'Shown (REPORTED ON)' : 'Hidden'}
                  </div>
                </div>
              </label>

              {/* Toggle: Page Numbering */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReportPageNumber}
                  onChange={(e) => setShowReportPageNumber(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#123B6D] rounded"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">Page Numbering</div>
                  <div className="text-[11px] text-slate-500">
                    {showReportPageNumber ? 'Shown (Page X of Y)' : 'Hidden'}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Investigation Table & Results Layout */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 text-slate-900 font-extrabold text-sm">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>2. Investigation Table Layout &amp; Columns (जांच टेबल लेआउट)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Toggle: Status Badge Column */}
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition cursor-pointer ${
                !showReportStatusColumn
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={showReportStatusColumn}
                  onChange={(e) => setShowReportStatusColumn(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#123B6D] rounded"
                />
                <div className="space-y-1">
                  <div className="font-black text-slate-900 flex items-center gap-1.5">
                    <span>5th "Status" Badge Column</span>
                    {!showReportStatusColumn && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                        4-Col Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    {showReportStatusColumn
                      ? '5 Columns: Parameter, Result, Unit, Ref Interval, Status'
                      : 'Clean 4 Columns: Abnormal values highlighted in bold red/blue font'}
                  </div>
                </div>
              </label>

              {/* Toggle: Department Header Strip */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReportDepartmentHeader}
                  onChange={(e) => setShowReportDepartmentHeader(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#123B6D] rounded"
                />
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Department Banner Header</div>
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    {showReportDepartmentHeader
                      ? 'Solid banner: e.g. "DEPARTMENT OF CLINICAL BIOCHEMISTRY"'
                      : 'Subtle clean underlined section divider'}
                  </div>
                </div>
              </label>

              {/* Toggle: Testing Methodology */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReportMethod}
                  onChange={(e) => setShowReportMethod(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#123B6D] rounded"
                />
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Test Methodology / Analyzer</div>
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    {showReportMethod
                      ? 'Shows method notes below parameter (e.g. Hexokinase, ECLIA)'
                      : 'Hides methodology notes'}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Clinic Notes, Interpretations & Signatures */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 text-slate-900 font-extrabold text-sm">
              <Stethoscope className="w-4 h-4 text-purple-700" />
              <span>3. Clinic Notes, Interpretations &amp; Signatures (नोट्स और डॉक्टर हस्ताक्षर)</span>
            </div>

            {/* Clinic Note Toggle & Text */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-2.5 font-bold text-slate-800 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showReportClinicNote}
                    onChange={(e) => setShowReportClinicNote(e.target.checked)}
                    className="w-4 h-4 text-[#123B6D] rounded"
                  />
                  <span>Show "CLINIC NOTE" / Interpretation Box on Report</span>
                </label>
                {!showReportClinicNote && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Box Removed (Frees 25mm space to fit on 1 page!)
                  </span>
                )}
              </div>

              {showReportClinicNote && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Custom Clinic Note / Advice (कस्टम क्लीनिकल नोट - खाली छोड़ने पर डिफ़ॉल्ट नोट छपेगा):
                  </label>
                  <textarea
                    rows={2}
                    value={reportCustomClinicNote}
                    onChange={(e) => setReportCustomClinicNote(e.target.value)}
                    placeholder="e.g. Please correlate clinically with patient symptoms. Repeat testing is advised in case of unexpected discordance."
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-[#123B6D]/20 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* End of Report Toggle */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={showReportEndOfReport}
                onChange={(e) => setShowReportEndOfReport(e.target.checked)}
                className="w-4 h-4 text-[#123B6D] rounded"
              />
              <span className="font-bold text-slate-800">
                Show "— END OF REPORT —" Divider Line
              </span>
            </label>

            {/* Signatures & Credentials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Signatory: Medical Lab Technician */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showReportTechnicianSign}
                      onChange={(e) => setShowReportTechnicianSign(e.target.checked)}
                      className="w-4 h-4 text-[#123B6D] rounded"
                    />
                    <span>Technician Signature (Prepared By)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Left Side</span>
                </div>

                {showReportTechnicianSign && (
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Technician Name &amp; Degree:
                      </label>
                      <input
                        type="text"
                        value={reportTechnicianName}
                        onChange={(e) => setReportTechnicianName(e.target.value)}
                        placeholder="e.g. S. Verma, M.Sc., DMLT"
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Designation Title:
                      </label>
                      <input
                        type="text"
                        value={reportTechnicianDesignation}
                        onChange={(e) => setReportTechnicianDesignation(e.target.value)}
                        placeholder="e.g. Senior Medical Laboratory Technologist"
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Signatory: Consultant Pathologist */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showReportPathologistSign}
                      onChange={(e) => setShowReportPathologistSign(e.target.checked)}
                      className="w-4 h-4 text-[#123B6D] rounded"
                    />
                    <span>Pathologist Signature (Authorized)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Right Side</span>
                </div>

                {showReportPathologistSign && (
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Pathologist / Doctor Name:
                      </label>
                      <input
                        type="text"
                        value={reportPathologistName}
                        onChange={(e) => setReportPathologistName(e.target.value)}
                        placeholder="e.g. Dr. Rajesh Sharma, MD"
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Degrees &amp; Medical Council Reg. No.:
                      </label>
                      <input
                        type="text"
                        value={reportPathologistDegrees}
                        onChange={(e) => setReportPathologistDegrees(e.target.value)}
                        placeholder="e.g. Consultant Pathologist (Reg No: MCI-PB-48192)"
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
                      />
                    </div>

                    <label className="flex items-center gap-2 pt-1 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showReportDigitalSignCurve}
                        onChange={(e) => setShowReportDigitalSignCurve(e.target.checked)}
                        className="w-3.5 h-3.5 text-[#123B6D] rounded"
                      />
                      <span className="text-[11px]">
                        {showReportDigitalSignCurve
                          ? 'Draw Digital Signature Stroke (डिजिटल लकीर)'
                          : 'Flat signature line (For physical blue ink doctor pen signing & rubber stamp)'}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Actions Bottom Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Settings are saved instantly to your cloud database and applied to all generated PDF reports.
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowTestPreview(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4 text-amber-500" />
            <span>Live Test Report Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Settings Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save Report Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Test Preview Modal */}
      {showTestPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Diagnostic Report Live Preview
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Verify all additions and removals (QR code, 4-col table, clinic notes, signatures, and letterhead bounds).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestPreview(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
              <CanonicalPdfViewer
                report={previewSampleReport}
                isPaymentPending={false}
              />
            </div>

            <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTestPreview(false)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
