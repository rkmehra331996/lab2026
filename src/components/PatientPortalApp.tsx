import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  ArrowLeft,
  MessageSquare,
  QrCode,
  Calendar,
  AlertTriangle,
  Building,
  User,
  Hash,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Check,
  Lock,
  Phone,
  MapPin,
  CreditCard,
  IndianRupee,
  Clock,
  ExternalLink,
  X,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { QRVerifyModal } from './Modals';
import { useCms } from '../context/CmsContext';
import { LabReport, ReceptionPatientEntry } from '../types';
import { maskMobileForOnlineReport } from '../utils/reportUtils';
import { ReportCopyrightBottomBar } from './ReportCopyrightBottomBar';
import { generateReportPdf } from '../utils/pdfGenerator';
import { safePrint } from '../utils/printHelper';
import { CanonicalPdfViewer } from './CanonicalPdfViewer';
import { isTenantMatch, isReportAccessibleToTenant, normalizeTenantId } from '../utils/tenantSecurity';
import { getTenantSubdomain } from '../constants/domains';

interface PatientPortalAppProps {
  onBackToWebsite: () => void;
  initialReportId?: string;
  initialMobile?: string;
  initialPatientName?: string;
  vendorLabId?: string;
  onSelectVendorLab?: (labId: string) => void;
}

export const PatientPortalApp: React.FC<PatientPortalAppProps> = ({
  onBackToWebsite,
  initialReportId = '',
  initialMobile = '',
  initialPatientName = '',
  vendorLabId = '',
  onSelectVendorLab,
}) => {
  const { 
    reports, 
    allReports,
    receptionEntries, 
    allReceptionEntries,
    vendorLabSettings, 
    vendorLabSettingsMap,
    getLabSettings,
    vendorLabsList,
    selectedVendorLabId,
    setSelectedVendorLabId,
    selectVendorLab,
    updateReceptionEntry,
    refreshCloudData,
    isCloudConnected,
    cloudSyncStatus,
    lastCloudSyncTime 
  } = useCms();

  // Active Lab Resolution: prop > URL parameter (?lab=...) > selectedVendorLabId
  const urlLabParam = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('lab') || new URLSearchParams(window.location.search).get('subdomain'))
    : null;

  const currentLabIdentifier = vendorLabId || urlLabParam || (selectedVendorLabId && selectedVendorLabId !== 'all' ? selectedVendorLabId : '');

  // Match directory item for current lab
  const activeVendorLab = React.useMemo(() => {
    if (!currentLabIdentifier || currentLabIdentifier === 'all') return null;
    const clean = currentLabIdentifier.toLowerCase().trim();
    const cleanDigits = clean.replace(/\D/g, '');
    return (
      vendorLabsList.find((l) => l.id.toLowerCase() === clean) ||
      vendorLabsList.find((l) => normalizeTenantId(l.id) === normalizeTenantId(clean)) ||
      vendorLabsList.find((l) => cleanDigits.length >= 7 && (l.phone || '').replace(/\D/g, '').endsWith(cleanDigits)) ||
      vendorLabsList.find((l) => cleanDigits.length >= 7 && (l.id || '').replace(/\D/g, '').endsWith(cleanDigits)) ||
      vendorLabsList.find((l) => getTenantSubdomain(l.domainPreview || l.id).toLowerCase() === clean) ||
      vendorLabsList.find((l) => String(l.name || '').toLowerCase().includes(clean)) ||
      null
    );
  }, [currentLabIdentifier, vendorLabsList]);

  // Is this page opened for a specific vendor's lab?
  const isVendorDedicated = Boolean(activeVendorLab);

  // Lab details for contact & display
  const currentSettings = React.useMemo(() => {
    if (activeVendorLab) {
      return getLabSettings ? getLabSettings(activeVendorLab.id) : (vendorLabSettingsMap?.[activeVendorLab.id] || vendorLabSettings);
    }
    return vendorLabSettings;
  }, [activeVendorLab, getLabSettings, vendorLabSettingsMap, vendorLabSettings]);

  const labName = activeVendorLab?.name || currentSettings?.labName || 'Diagnostic Laboratory';
  const labPhone = activeVendorLab?.phone || currentSettings?.phone || '7087033009';
  const labAddress = currentSettings?.address || activeVendorLab?.address || `${activeVendorLab?.city || 'Punjab'}, India`;
  const labNabl = activeVendorLab?.nablCode || currentSettings?.nablAccreditationNo || 'NABL Accredited';
  const labUpi = currentSettings?.upiId || 'apexlab@upi';

  // Target reports & reception entries scoped strictly to active vendor lab (zero cross-lab data leakage)
  const scopedReports = React.useMemo(() => {
    const targetLab = activeVendorLab?.id || (currentLabIdentifier && currentLabIdentifier !== 'all' ? currentLabIdentifier : null);
    if (targetLab) {
      return (allReports || []).filter((r) => isTenantMatch(r, targetLab, false));
    }
    const defaultActive = (selectedVendorLabId && selectedVendorLabId !== 'all')
      ? selectedVendorLabId
      : (vendorLabsList.find((l) => l.status === 'Active')?.id || vendorLabsList[0]?.id);
    if (defaultActive) {
      return (allReports || []).filter((r) => isTenantMatch(r, defaultActive, false));
    }
    return [];
  }, [activeVendorLab, currentLabIdentifier, allReports, selectedVendorLabId, vendorLabsList]);

  const scopedReceptionEntries = React.useMemo(() => {
    const targetLab = activeVendorLab?.id || (currentLabIdentifier && currentLabIdentifier !== 'all' ? currentLabIdentifier : null);
    if (targetLab) {
      return (allReceptionEntries || []).filter((e) => isTenantMatch(e, targetLab, false));
    }
    const defaultActive = (selectedVendorLabId && selectedVendorLabId !== 'all')
      ? selectedVendorLabId
      : (vendorLabsList.find((l) => l.status === 'Active')?.id || vendorLabsList[0]?.id);
    if (defaultActive) {
      return (allReceptionEntries || []).filter((e) => isTenantMatch(e, defaultActive, false));
    }
    return [];
  }, [activeVendorLab, currentLabIdentifier, allReceptionEntries, selectedVendorLabId, vendorLabsList]);

  // Demo test chips for quick 1-click verification
  const demoReport = React.useMemo(() => {
    return scopedReports.find((r) => r.verified) || scopedReports[0] || null;
  }, [scopedReports]);

  const demoEntry = React.useMemo(() => {
    return scopedReceptionEntries[0] || null;
  }, [scopedReceptionEntries]);

  // Search Tab Option: 'name_mobile' (Left Tab: Option 1) | 'report_id' (Right Tab: Option 2)
  const [searchMethod, setSearchMethod] = useState<'name_mobile' | 'report_id'>('name_mobile');

  // Option 1 Fields (Patient Search: Mobile Number + optional Patient Name)
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Option 2 Field (Token or Report ID)
  const [reportIdInput, setReportIdInput] = useState('');

  // Current Searched Report State (null by default - no report shown until searched & matched)
  const [searchedReport, setSearchedReport] = useState<LabReport | null>(null);

  // Matched Reception Entry (for checking payment dues and publication status)
  const [matchedEntry, setMatchedEntry] = useState<ReceptionPatientEntry | null>(null);

  // Online Payment Clearance Modal
  const [showPayOnlineModal, setShowPayOnlineModal] = useState(false);
  const [payingMode, setPayingMode] = useState<'UPI' | 'Card'>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Pending Sample Status (for samples in lab registered at reception but report not finalized yet)
  const [pendingSampleStatus, setPendingSampleStatus] = useState<{
    tokenNumber: string;
    patientName: string;
    ageGender: string;
    tests: string[];
    registeredAt: string;
    status: string;
    technicianStatus: string;
    branchName?: string;
    branchPhone?: string;
  } | null>(null);

  // Error States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // QR Modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [matchedList, setMatchedList] = useState<Array<{ type: 'report' | 'entry'; report?: LabReport; entry?: ReceptionPatientEntry }>>([]);

  // Calculate active due amount
  const activeDueAmount =
    matchedEntry !== null && matchedEntry.dueAmount !== undefined
      ? matchedEntry.dueAmount
      : searchedReport?.dueAmount !== undefined
      ? searchedReport.dueAmount
      : 0;

  const isPaymentPending = activeDueAmount > 0;

  // Real-time Hostinger auto-sync for patient screen (Instant updates on client phone when lab changes anything)
  useEffect(() => {
    if (searchedReport) {
      const liveReport = scopedReports.find(
        (r) => r.reportId.toLowerCase() === searchedReport.reportId.toLowerCase()
      );
      if (liveReport) {
        if (
          liveReport.status !== searchedReport.status ||
          liveReport.verified !== searchedReport.verified ||
          liveReport.dueAmount !== searchedReport.dueAmount ||
          liveReport.paymentStatus !== searchedReport.paymentStatus ||
          JSON.stringify(liveReport.items) !== JSON.stringify(searchedReport.items)
        ) {
          setSearchedReport(liveReport);
        }
      }
    }
  }, [scopedReports, searchedReport]);

  useEffect(() => {
    if (matchedEntry) {
      const liveEntry = (scopedReceptionEntries || []).find((e) => e.id === matchedEntry.id);
      if (liveEntry) {
        if (
          liveEntry.status !== matchedEntry.status ||
          liveEntry.technicianStatus !== matchedEntry.technicianStatus ||
          liveEntry.dueAmount !== matchedEntry.dueAmount ||
          liveEntry.reportId !== matchedEntry.reportId ||
          liveEntry.isReportPublished !== matchedEntry.isReportPublished
        ) {
          setMatchedEntry(liveEntry);
          // If lab technician finalized report and generated reportId, instantly switch to full report!
          if (liveEntry.reportId) {
            const foundReport = scopedReports.find(
              (r) => r.reportId.toLowerCase() === liveEntry.reportId?.toLowerCase()
            );
            if (foundReport) {
              setSearchedReport(foundReport);
              setPendingSampleStatus(null);
            }
          }
        }
      }
    }
  }, [scopedReceptionEntries, scopedReports, matchedEntry]);

  // Initialize from props only if explicitly passed (e.g. from lab queue direct link or portal search)
  useEffect(() => {
    if (initialReportId && initialReportId.trim()) {
      const cleanId = initialReportId.trim().toLowerCase();
      const found = scopedReports.find(
        (r) => r.reportId.toLowerCase() === cleanId || (r.uhid && r.uhid.toLowerCase() === cleanId)
      );
      if (found) {
        // If initialMobile was also passed, verify mobile ownership
        if (initialMobile && initialMobile.trim()) {
          const reqDigits = initialMobile.replace(/\D/g, '').slice(-10);
          const rDigits = (found.mobile || '').replace(/\D/g, '').slice(-10);
          if (reqDigits.length === 10 && rDigits.length === 10 && rDigits !== reqDigits) {
            setErrorMessage('Mobile Verification Mismatch');
            setErrorDetails('The registered mobile number does not match this report ID.');
            return;
          }
        }
        setSearchedReport(found);
        setReportIdInput(found.reportId);
        setSearchMethod('report_id');
        setErrorMessage(null);
        setErrorDetails(null);

        const match = (scopedReceptionEntries || []).find(
          (e) =>
            (e.reportId && e.reportId.toLowerCase() === found.reportId.toLowerCase()) ||
            (e.uhid && found.uhid && e.uhid.toLowerCase() === found.uhid.toLowerCase())
        );
        setMatchedEntry(match || null);
      } else {
        // Check if matching reception entry exists
        const entryMatch = (scopedReceptionEntries || []).find(
          (e) =>
            e.tokenNumber.toLowerCase() === cleanId ||
            (e.reportId && e.reportId.toLowerCase() === cleanId) ||
            (e.uhid && e.uhid.toLowerCase() === cleanId)
        );
        if (entryMatch) {
          handleSelectRecord({ type: 'entry', entry: entryMatch });
        }
      }
    } else if (initialMobile && initialMobile.trim()) {
      const cleanMob = initialMobile.replace(/\D/g, '').slice(-10);
      if (cleanMob.length === 10) {
        const inputName = initialPatientName.trim().toLowerCase();

        // 1. Matched reports for this exact 10-digit mobile
        const matchedReports = scopedReports.filter((r) => {
          const rDigits = (r.mobile || '').replace(/\D/g, '');
          return rDigits.length >= 10 && rDigits.slice(-10) === cleanMob;
        });

        // 2. Matched reception entries for this exact 10-digit mobile
        const matchedEntries = (scopedReceptionEntries || []).filter((e) => {
          const eDigits = (e.mobile || '').replace(/\D/g, '');
          return eDigits.length >= 10 && eDigits.slice(-10) === cleanMob;
        });

        // Combine into distinct matches
        const allMatches: Array<{ type: 'report' | 'entry'; report?: LabReport; entry?: ReceptionPatientEntry }> = [];
        matchedReports.forEach((r) => {
          const assoc = matchedEntries.find(
            (e) =>
              (e.reportId && e.reportId.toLowerCase() === r.reportId.toLowerCase()) ||
              (e.uhid && r.uhid && e.uhid.toLowerCase() === r.uhid.toLowerCase())
          );
          allMatches.push({ type: 'report', report: r, entry: assoc });
        });
        matchedEntries.forEach((e) => {
          const exists = allMatches.some(
            (m) =>
              (m.report && e.reportId && m.report.reportId.toLowerCase() === e.reportId.toLowerCase()) ||
              (m.entry && m.entry.id === e.id)
          );
          if (!exists) {
            allMatches.push({ type: 'entry', entry: e });
          }
        });

        // If patient name was provided, filter strictly by name
        let targetList = allMatches;
        if (inputName) {
          const byName = allMatches.filter((m) => {
            const pName = (m.report?.patientName || m.entry?.patientName || '').toLowerCase().trim();
            return pName.includes(inputName) || inputName.includes(pName);
          });
          if (byName.length > 0) {
            targetList = byName;
          }
        }

        if (targetList.length === 1) {
          handleSelectRecord(targetList[0]);
          setMobileNumber(initialMobile);
          setPatientName(targetList[0].report?.patientName || targetList[0].entry?.patientName || initialPatientName);
          setSearchMethod('name_mobile');
        } else if (targetList.length > 1) {
          setMobileNumber(initialMobile);
          if (initialPatientName) setPatientName(initialPatientName);
          setSearchMethod('name_mobile');
          setMatchedList(targetList);
        }
      }
    }
  }, [initialReportId, initialMobile, initialPatientName, scopedReports, scopedReceptionEntries]);

  const handleSelectRecord = (match: { type: 'report' | 'entry'; report?: LabReport; entry?: ReceptionPatientEntry }) => {
    setErrorMessage(null);
    setErrorDetails(null);
    setMatchedList([]);

    if (match.type === 'report' && match.report) {
      setSearchedReport(match.report);
      setMatchedEntry(match.entry || null);
      setPendingSampleStatus(null);
    } else if (match.entry) {
      setMatchedEntry(match.entry);
      setSearchedReport(null);
      setPendingSampleStatus({
        tokenNumber: match.entry.tokenNumber,
        patientName: match.entry.patientName,
        ageGender: `${match.entry.age} Yrs / ${match.entry.gender}`,
        tests: match.entry.tests || [],
        registeredAt: match.entry.registeredAt || 'Today',
        status: match.entry.status || 'Sample in Testing',
        technicianStatus: match.entry.technicianStatus || 'Sent to Lab',
        branchName: match.entry.branchName || `${labName} (Central Hub)`,
        branchPhone: labPhone,
      });
    }
  };

  // Option 1: Search by Mobile Number (Instant client lookup, Name optional)
  const handleSearchByNameAndMobile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorDetails(null);
    setSearchedReport(null);
    setPendingSampleStatus(null);
    setMatchedEntry(null);
    setMatchedList([]);

    // Trigger instant background server pull to guarantee 0% stale cache
    refreshCloudData().catch(() => {});

    const inputMobile = mobileNumber.replace(/\D/g, '');
    const inputName = patientName.trim().toLowerCase();

    const cleanInput10 = inputMobile.slice(-10);

    if (cleanInput10.length < 10) {
      setErrorMessage('Please enter mobile number');
      setErrorDetails('Please enter your 10-digit registered mobile number (e.g. 9876543210).');
      return;
    }

    // Strict Tenant Isolation Guard: Multi-tenant report isolation
    const targetLab = activeVendorLab?.id || currentLabIdentifier || selectedVendorLabId;
    if (!isReportAccessibleToTenant(cleanInput10, targetLab, allReports, allReceptionEntries)) {
      setErrorMessage('Access Denied');
      setErrorDetails(`Reports for mobile number +91 ${cleanInput10} belong to another laboratory. Under strict patient data confidentiality, patient reports can only be viewed through the specific laboratory where the patient was tested.`);
      return;
    }

    // 1. Find all matching reports strictly by exact 10-digit mobile
    const matchedReports = scopedReports.filter((r) => {
      const rDigits = (r.mobile || '').replace(/\D/g, '');
      return rDigits.length >= 10 && rDigits.slice(-10) === cleanInput10;
    });

    // 2. Find all matching reception entries strictly by exact 10-digit mobile
    const matchedReception = (scopedReceptionEntries || []).filter((entry) => {
      const eDigits = (entry.mobile || '').replace(/\D/g, '');
      return eDigits.length >= 10 && eDigits.slice(-10) === cleanInput10;
    });

    // Combine matches
    const allMatches: Array<{ type: 'report' | 'entry'; report?: LabReport; entry?: ReceptionPatientEntry }> = [];

    matchedReports.forEach((r) => {
      const associatedEntry = (scopedReceptionEntries || []).find(
        (e) =>
          (e.reportId && e.reportId.toLowerCase() === r.reportId.toLowerCase()) ||
          (e.uhid && r.uhid && e.uhid.toLowerCase() === r.uhid.toLowerCase())
      );
      allMatches.push({ type: 'report', report: r, entry: associatedEntry });
    });

    matchedReception.forEach((entry) => {
      const alreadyIncluded = allMatches.some(
        (m) =>
          (m.report && entry.reportId && m.report.reportId.toLowerCase() === entry.reportId.toLowerCase()) ||
          (m.entry && m.entry.id === entry.id)
      );
      if (!alreadyIncluded) {
        if (entry.reportId) {
          const rep = scopedReports.find((r) => r.reportId.toLowerCase() === entry.reportId?.toLowerCase());
          if (rep) {
            allMatches.push({ type: 'report', report: rep, entry });
            return;
          }
        }
        allMatches.push({ type: 'entry', entry });
      }
    });

    // Filter or prioritize if name was entered
    let results = allMatches;
    if (inputName) {
      const byName = allMatches.filter((m) => {
        const pName = (m.report?.patientName || m.entry?.patientName || '').toLowerCase().trim();
        return pName.includes(inputName) || inputName.includes(pName);
      });
      if (byName.length > 0) {
        results = byName;
      } else {
        setErrorMessage('Name Does Not Match');
        setErrorDetails(
          `Record exists for mobile +91 ${cleanInput10}, but the patient name "${patientName.trim()}" does not match. Please verify spelling or leave Name blank.`
        );
        return;
      }
    }

    if (results.length === 0) {
      setErrorMessage('No Record Found');
      setErrorDetails(
        `No active diagnostic record found for mobile number +91 ${cleanInput10} ${inputName ? `(Name: ${patientName})` : ''} at ${labName}. Please check the registered phone number or search with Token Number.`
      );
      return;
    }

    if (results.length === 1) {
      const match = results[0];
      handleSelectRecord(match);
      return;
    }

    // Multiple records found for this mobile number
    setMatchedList(results);
  };

  // Option 2: Search by Token Number OR Report ID
  const handleSearchByReportIdOrToken = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorDetails(null);
    setSearchedReport(null);
    setMatchedEntry(null);
    setPendingSampleStatus(null);
    refreshCloudData().catch(() => {});

    const raw = reportIdInput.trim().toLowerCase();
    if (!raw) {
      setErrorMessage('Please enter details');
      setErrorDetails('Please enter Token Number or Report ID.');
      return;
    }

    const cleanDigits = raw.replace(/\D/g, '');

    // Strict Tenant Isolation Guard: Multi-tenant report isolation
    const targetLab = activeVendorLab?.id || currentLabIdentifier || selectedVendorLabId;
    if (!isReportAccessibleToTenant(raw, targetLab, allReports, allReceptionEntries)) {
      setErrorMessage('Access Denied');
      setErrorDetails(`Patient report or token "${reportIdInput}" belongs to another laboratory and cannot be accessed from ${labName}. Under strict multi-tenant isolation rules, patient reports can only be viewed through the specific laboratory where the patient was tested.`);
      return;
    }

    // 1. Direct match in reports - STRICT EXACT MATCH ONLY, NO FUZZY SUBSTRINGS
    const reportMatch = scopedReports.find((r) => {
      const rId = r.reportId.trim().toLowerCase();
      const rUhid = (r.uhid || '').trim().toLowerCase();
      const rToken = (r.tokenNumber || '').trim().toLowerCase();
      const rTokenDigits = rToken.replace(/\D/g, '');

      return (
        rId === raw ||
        rUhid === raw ||
        rToken === raw ||
        rToken === `tk-${raw}` ||
        `tk-${rToken}` === raw ||
        (cleanDigits.length > 0 && rTokenDigits === cleanDigits)
      );
    });

    if (reportMatch) {
      setSearchedReport(reportMatch);
      const match = (scopedReceptionEntries || []).find(
        (e) =>
          (e.reportId && e.reportId.toLowerCase() === reportMatch.reportId.toLowerCase()) ||
          (e.uhid && reportMatch.uhid && e.uhid.toLowerCase() === reportMatch.uhid.toLowerCase()) ||
          (e.tokenNumber && reportMatch.tokenNumber && e.tokenNumber.toLowerCase() === reportMatch.tokenNumber.toLowerCase())
      );
      setMatchedEntry(match || null);
      return;
    }

    // 2. Check in receptionEntries by Token or UHID - STRICT EXACT MATCH ONLY
    const receptionMatch = (scopedReceptionEntries || []).find((entry) => {
      const tokenLower = (entry.tokenNumber || '').trim().toLowerCase();
      const tokenDigits = tokenLower.replace(/\D/g, '');
      const uhidLower = (entry.uhid || '').trim().toLowerCase();
      const reportIdLower = (entry.reportId || '').trim().toLowerCase();

      return (
        tokenLower === raw ||
        tokenLower === `tk-${raw}` ||
        `tk-${tokenLower}` === raw ||
        (cleanDigits.length > 0 && tokenDigits === cleanDigits) ||
        uhidLower === raw ||
        reportIdLower === raw
      );
    });

    if (receptionMatch) {
      setMatchedEntry(receptionMatch);
      const hasReportReady =
        receptionMatch.status === 'Report Ready' ||
        receptionMatch.technicianStatus === 'Report Generated' ||
        Boolean(receptionMatch.reportId);

      // Check if report already exists for this entry
      if (hasReportReady && receptionMatch.reportId) {
        const foundReport = scopedReports.find(
          (r) =>
            r.reportId.toLowerCase() === receptionMatch.reportId?.toLowerCase() ||
            (r.uhid && r.uhid.toLowerCase() === receptionMatch.uhid.toLowerCase())
        );
        if (foundReport) {
          setSearchedReport(foundReport);
          return;
        }
      }

      // If report is not yet finalized, show live sample progress status!
      setPendingSampleStatus({
        tokenNumber: receptionMatch.tokenNumber,
        patientName: receptionMatch.patientName,
        ageGender: `${receptionMatch.age} Yrs / ${receptionMatch.gender}`,
        tests: receptionMatch.tests || [],
        registeredAt: receptionMatch.registeredAt || 'Today',
        status: receptionMatch.status || 'Sample in Testing',
        technicianStatus: receptionMatch.technicianStatus || 'Sent to Lab',
        branchName: receptionMatch.branchName || `${labName} (Central Hub)`,
        branchPhone: labPhone,
      });
      return;
    }

    // Not found
    setErrorMessage('Token Number Not Found');
    setErrorDetails(
      `No active record matched Token Number "${reportIdInput}" at ${labName}. Please check your receipt slip or try again.`
    );
  };

  const handleResetSearch = () => {
    setSearchedReport(null);
    setMatchedEntry(null);
    setPendingSampleStatus(null);
    setErrorMessage(null);
    setErrorDetails(null);
    setPatientName('');
    setMobileNumber('');
    setReportIdInput('');
  };

  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [printIframeNotice, setPrintIframeNotice] = useState(false);

  // Online Payment Clearance Handler (Simulates immediate clearance & unlocks report)
  const handlePayDueOnline = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      if (matchedEntry) {
        const updatedPaid = (matchedEntry.paidAmount || 0) + activeDueAmount;
        updateReceptionEntry(matchedEntry.id, {
          paidAmount: updatedPaid,
          dueAmount: 0,
          paymentStatus: 'Full Payment',
          paymentMode: payingMode,
          isReportPublished: true,
          publishedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          publishedBy: 'Online Portal Gateway',
          balancePaidAmount: (matchedEntry.balancePaidAmount || 0) + activeDueAmount,
          balancePaymentMode: payingMode,
          balancePaidAt: `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
        });
        setMatchedEntry((prev) =>
          prev
            ? {
                ...prev,
                paidAmount: updatedPaid,
                dueAmount: 0,
                paymentStatus: 'Full Payment',
                paymentMode: payingMode,
                isReportPublished: true,
              }
            : null
        );
      }
      if (searchedReport) {
        setSearchedReport((prev) =>
          prev
            ? {
                ...prev,
                dueAmount: 0,
                paidAmount: (prev.paidAmount || 0) + activeDueAmount,
                isReportPublished: true,
              }
            : null
        );
      }
      setIsProcessingPayment(false);
      setShowPayOnlineModal(false);
      setDownloadSuccessToast(
        `Payment of ₹${activeDueAmount} received successfully! Your complete diagnostic report is now unlocked.`
      );
      setTimeout(() => setDownloadSuccessToast(null), 5000);
    }, 800);
  };

  const handleDownloadPdf = async () => {
    if (!searchedReport) return;
    if (isPaymentPending) {
      setShowPayOnlineModal(true);
      return;
    }
    try {
      const ok = await generateReportPdf(searchedReport);
      if (!ok) {
        setShowPayOnlineModal(true);
        return;
      }
      setDownloadSuccessToast(`Report ${searchedReport.reportId} PDF downloaded successfully!`);
      setTimeout(() => setDownloadSuccessToast(null), 4000);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handlePrint = () => {
    if (!searchedReport) return;
    if (isPaymentPending) {
      setShowPayOnlineModal(true);
      return;
    }
    const success = safePrint(() => {
      // In sandboxed iframes where window.print() is blocked by browser security
      setPrintIframeNotice(true);
      generateReportPdf(searchedReport);
      setDownloadSuccessToast(`Browser preview sandboxed: Downloaded ${searchedReport.reportId} PDF to print directly!`);
      setTimeout(() => setDownloadSuccessToast(null), 5000);
    });

    if (!success) {
      setPrintIframeNotice(true);
      generateReportPdf(searchedReport);
      setDownloadSuccessToast(`Official PDF downloaded for printing.`);
      setTimeout(() => setDownloadSuccessToast(null), 5000);
    }
  };

  const handleShareWhatsApp = () => {
    if (!searchedReport) return;
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/rpt/${searchedReport.reportId}`
        : `https://report.labportal.online/rpt/${searchedReport.reportId}`;
    const text = encodeURIComponent(
      `Here is my authenticated lab report (${searchedReport.reportId}) from ${searchedReport.labName}: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
      {/* Top Header */}
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Left: Back button */}
          <button
            onClick={onBackToWebsite}
            className="px-3 py-1.5 text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition border border-slate-200 bg-white shadow-2xs shrink-0"
            title="Back to Website"
          >
            <ArrowLeft className="w-4 h-4 text-[#123B6D]" />
            <span>Back</span>
          </button>

          {/* Center: Lab Name + Lab Switcher */}
          <div className="flex-1 text-center min-w-0 px-2 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-2 max-w-full">
              <h1 className="font-extrabold text-xs sm:text-sm text-[#123B6D] truncate">
                {labName}
              </h1>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-bold shrink-0">
                ID: {activeVendorLab?.id || selectedVendorLabId || '1020304050'}
              </span>
            </div>
            {/* Quick Lab Switcher to verify strict data isolation */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">Active Lab:</span>
              <select
                value={activeVendorLab?.id || selectedVendorLabId || '1020304050'}
                onChange={(e) => {
                  const newId = e.target.value;
                  if (setSelectedVendorLabId) setSelectedVendorLabId(newId);
                  if (selectVendorLab) selectVendorLab(newId);
                  if (onSelectVendorLab) onSelectVendorLab(newId);
                  setSearchedReport(null);
                  setMatchedEntry(null);
                  setMatchedList([]);
                  setErrorMessage(null);
                  setErrorDetails(null);
                }}
                className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer max-w-[220px] truncate"
                title="Select Laboratory to test strict data isolation"
              >
                {vendorLabsList.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name} ({lab.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Visit Website button */}
          <button
            onClick={onBackToWebsite}
            className="px-3 py-1.5 rounded-lg bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer transition shadow-2xs shrink-0"
            title="Visit Website"
          >
            <Globe className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xs:inline">Visit Website</span>
            <span className="xs:hidden">Website</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Search / Access Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm no-print">
          {/* ERROR ALERT BANNER */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="font-bold text-rose-800">{errorMessage}</div>
                {errorDetails && <p className="text-rose-700 text-[11px] mt-0.5">{errorDetails}</p>}
              </div>
            </div>
          )}

          {/* TWO SEARCH TABS: PATIENT SEARCH & TOKEN / REPORT ID */}
          <div className="flex bg-slate-100 p-1 rounded-xl max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                setSearchMethod('name_mobile');
                setErrorMessage(null);
                setErrorDetails(null);
              }}
              className={`flex-1 py-2 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                searchMethod === 'name_mobile'
                  ? 'bg-white text-[#123B6D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-[#123B6D] shrink-0" />
              <span>Patient Search</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchMethod('report_id');
                setErrorMessage(null);
                setErrorDetails(null);
              }}
              className={`flex-1 py-2 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                searchMethod === 'report_id'
                  ? 'bg-white text-[#123B6D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Hash className="w-3.5 h-3.5 text-[#123B6D] shrink-0" />
              <span>Token Number</span>
            </button>
          </div>

          {/* LEFT TAB: OPTION 1 — PATIENT SEARCH */}
          {searchMethod === 'name_mobile' && (
            <div className="mt-5 bg-slate-50/70 rounded-xl p-4 sm:p-5 border border-slate-200 animate-in fade-in duration-150">
              <form onSubmit={handleSearchByNameAndMobile} className="space-y-3.5">
                {/* Mobile Number & Patient Name INLINE on mobile & desktop */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1 truncate">
                      Mobile Number: <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 sm:left-3 top-2.5 text-xs text-slate-500 font-bold">+91</span>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        value={mobileNumber}
                        onChange={(e) => {
                          setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Enter Mobile Number"
                        className="w-full pl-9 sm:pl-11 pr-2 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none font-mono placeholder:text-slate-400 placeholder:text-[11px] sm:placeholder:text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1 truncate">
                      Patient Name: <span className="text-slate-400 font-normal text-[10px] sm:text-[11px]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-3" />
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => {
                          setPatientName(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Enter Patient Name"
                        className="w-full pl-8 sm:pl-9 pr-2 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none placeholder:text-slate-400 placeholder:text-[11px] sm:placeholder:text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Search className="w-4 h-4 text-amber-300" />
                  <span>Search Report</span>
                </button>
              </form>

              {/* MULTI-RECORD RESULTS LIST FOR CLIENT MOBILE NUMBER */}
              {matchedList.length > 0 && (
                <div className="mt-4 p-3.5 sm:p-4 bg-blue-50/90 border border-blue-200 rounded-xl animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[#123B6D] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {matchedList.length}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xs text-[#123B6D]">
                          {matchedList.length} Records Found for +91 {mobileNumber}
                        </h3>
                        <p className="text-[11px] text-slate-600">
                          Select your report from the list below:
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMatchedList([])}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      title="Close list"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {matchedList.map((m, idx) => {
                      const pName = m.report?.patientName || m.entry?.patientName || 'Patient';
                      const testNames =
                        m.report?.items?.map((p) => p.testName || p.parameter).slice(0, 3).join(', ') ||
                        m.entry?.tests?.slice(0, 3).join(', ') ||
                        'Diagnostic Profile';
                      const tokenOrId = m.report?.reportId || m.entry?.tokenNumber || `Record #${idx + 1}`;
                      const isReady = Boolean(m.report) || m.entry?.status === 'Report Ready';

                      return (
                        <div
                          key={idx}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-[#123B6D] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:shadow-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {isReady ? <FileText className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                <span>{pName}</span>
                                <span className="font-mono text-[10px] text-slate-600 px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-bold">
                                  {tokenOrId}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 truncate max-w-xs sm:max-w-md mt-0.5">
                                {testNames}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isReady ? 'Report Ready' : 'In Testing'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSelectRecord(m)}
                              className="px-3 py-1.5 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <span>View Report</span>
                              <ArrowRight className="w-3 h-3 text-amber-300" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RIGHT TAB: OPTION 2 — TOKEN NUMBER */}
          {searchMethod === 'report_id' && (
            <div className="mt-5 bg-slate-50/70 rounded-xl p-4 sm:p-5 border border-slate-200 animate-in fade-in duration-150">
              <form onSubmit={handleSearchByReportIdOrToken} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
                    Token Number: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={reportIdInput}
                      onChange={(e) => {
                        setReportIdInput(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Enter Token Number (e.g. 101, TK-101 or Report ID)"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] focus:outline-none placeholder:text-slate-400 placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-sans bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Search className="w-4 h-4 text-amber-300" />
                  <span>Search Report</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* LIVE SAMPLE PROGRESS STATE (When Token or Patient is registered but lab testing is still in progress) */}
        {pendingSampleStatus && !searchedReport && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs animate-in fade-in duration-200 no-print">
            {/* Header Strip with Live Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#123B6D] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5 text-blue-600 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <div>
                  <div className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <span>{pendingSampleStatus.patientName}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-[#123B6D] font-bold border border-blue-200">
                      {pendingSampleStatus.tokenNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {pendingSampleStatus.ageGender} • Registered: {pendingSampleStatus.registeredAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Sample in Lab Testing</span>
                </span>
              </div>
            </div>

            {/* 4-Step Visual Progress Tracker */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="space-y-1.5">
                  <div className="w-7 h-7 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                  <div className="font-bold text-[11px] text-emerald-800">1. Reception</div>
                  <div className="text-[10px] text-slate-400">Registered</div>
                </div>

                <div className="space-y-1.5">
                  <div className="w-7 h-7 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                  <div className="font-bold text-[11px] text-emerald-800">2. Sample</div>
                  <div className="text-[10px] text-slate-400">Collected</div>
                </div>

                <div className="space-y-1.5">
                  <div className="w-7 h-7 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs ring-4 ring-blue-100">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="font-bold text-[11px] text-blue-900">3. Lab Testing</div>
                  <div className="text-[10px] text-blue-600 font-semibold">In Progress</div>
                </div>

                <div className="space-y-1.5">
                  <div className="w-7 h-7 mx-auto rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <div className="font-bold text-[11px] text-slate-400">4. Report PDF</div>
                  <div className="text-[10px] text-slate-400">Authorization</div>
                </div>
              </div>
            </div>

            {/* Notification message */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-950 flex items-start gap-3">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-900">
                  “Aapki report abhi lab mein process ho rahi hai, please wait.”
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Your biological sample is undergoing biochemical testing. Once verified and digitally signed by our Pathologist, the complete report PDF will be available right here.
                </p>
              </div>
            </div>

            {/* Investigations list & Lab contact */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                  Tests in Process:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pendingSampleStatus.tests.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-800 text-[11px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${labPhone}`}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Call Lab</span>
                </a>
                <a
                  href={`https://wa.me/91${labPhone.replace(/\D/g, '')}?text=Hello,%20checking%20status%20of%20Token%20${pendingSampleStatus.tokenNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* DEFAULT STATE: WHEN NO REPORT HAS BEEN SEARCHED YET */}
        {!searchedReport && !pendingSampleStatus && !errorMessage && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 no-print">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">
              No Report Displayed
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              For patient privacy and data protection, reports are not displayed by default. Please enter your details using <strong>Patient Search</strong> (Mobile Number) or <strong>Token Number</strong> above to view your report.
            </p>
            <div className="pt-2 flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% NABL Verified
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#123B6D]">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit Encrypted
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-teal-700">
                <Smartphone className="w-3.5 h-3.5" /> Instant PDF Download
              </span>
            </div>
          </div>
        )}

        {/* THE AUTHENTICATED REPORT VIEW: SHOWN ONLY WHEN MATCHED SUCCESSFULLY */}
        {searchedReport && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Bar above report with Patient Name and Close Report */}
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs no-print">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-[#123B6D] shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">
                  Viewing Report: <strong className="text-[#123B6D]">{searchedReport.patientName}</strong> <span className="text-slate-500 font-mono text-[11px]">({searchedReport.reportId})</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
                title="Close report and search another"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Close</span>
              </button>
            </div>
            {/* Prominent Cancellation Banner if Report Was Cancelled */}
            {searchedReport.cancelled && (
              <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-5 text-xs text-rose-950 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-rose-600 text-white font-black px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wide">
                      REPORT CANCELLED
                    </span>
                    <span className="text-[11px] text-rose-700 font-semibold">
                      Cancelled on {searchedReport.cancelledAt || 'Recently'} {searchedReport.cancelledBy ? `by ${searchedReport.cancelledBy}` : ''}
                    </span>
                  </div>
                  <div className="text-rose-900 font-extrabold text-sm pt-0.5">
                    Cancellation Reason: <span className="font-semibold text-rose-800 underline decoration-rose-300">{searchedReport.cancelReason || 'Sample hemolysis / recollect advised by pathologist'}</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    This lab report has been marked as cancelled by the laboratory. Please contact the laboratory reception desk for fresh sample collection or assistance.
                  </p>
                </div>
              </div>
            )}

            {/* MANDATORY PAYMENT PENDING NOTIFICATION BANNER (When Report is Ready but Payment is Due) */}
            {isPaymentPending && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 text-xs text-amber-950 shadow-xs space-y-3.5 no-print">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">
                          Report Ready • Payment Due: ₹{activeDueAmount}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-semibold mt-1 max-w-xl leading-relaxed">
                        “Aapki report ready hai, lekin payment clear na hone ki wajah se report abhi view nahi ki ja sakti. Payment clear karne ke baad aap complete report dekh sakte hain.”
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Please clear the pending balance to view investigations and download official signed PDF.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setShowPayOnlineModal(true)}
                      className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                      <span>Pay ₹{activeDueAmount} & Unlock</span>
                    </button>
                    <a
                      href={`tel:${labPhone}`}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Call Lab Reception"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Call Lab</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Success Download / Print Toast */}
            {downloadSuccessToast && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{downloadSuccessToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDownloadSuccessToast(null)}
                  className="text-emerald-700 hover:text-emerald-950 text-xs px-2 py-0.5 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* CANONICAL REPORT PDF PREVIEW (Full Screen / Direct Presence) */}
            <div className="pt-1">
              <CanonicalPdfViewer
                report={searchedReport}
                isPaymentPending={isPaymentPending}
                activeDueAmount={activeDueAmount}
                onPayOnline={() => setShowPayOnlineModal(true)}
                title={`OFFICIAL REPORT MASTER • ${searchedReport.reportId}`}
              />
            </div>

            {/* ACTION BAR (Neatly positioned BELOW the report) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    searchedReport.cancelled
                      ? 'bg-rose-500'
                      : isPaymentPending
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                <span className="text-xs font-bold text-[#172033]">
                  {(searchedReport as any).cancelled || searchedReport.cancelledAt ? (
                    <>Cancelled Report for <strong>{searchedReport.patientName}</strong></>
                  ) : isPaymentPending ? (
                    <>Report Ready (Locked • Due ₹{activeDueAmount}) for <strong>{searchedReport.patientName}</strong></>
                  ) : (
                    <>Report Verified & Unlocked for <strong>{searchedReport.patientName}</strong></>
                  )}{' '}
                  <span className="text-slate-400 font-mono">({searchedReport.reportId})</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* 1. PDF Download Button (Conditional on Payment Clearance) */}
                {isPaymentPending ? (
                  <button
                    id="btn-download-pdf-portal-locked"
                    onClick={() => setShowPayOnlineModal(true)}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                    title={`Payment pending: Clear ₹${activeDueAmount} to download report PDF`}
                  >
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>Download PDF (Due ₹{activeDueAmount})</span>
                  </button>
                ) : (
                  <button
                    id="btn-download-pdf-portal"
                    onClick={handleDownloadPdf}
                    className="bg-[#0F766E] hover:bg-[#0d655e] text-white px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                    title="Download Official NABL Medical Report PDF"
                  >
                    <Download className="w-4 h-4 text-emerald-300" />
                    <span>Download PDF</span>
                  </button>
                )}

                {/* 2. Print Report Button (Conditional on Payment Clearance) */}
                {isPaymentPending ? (
                  <button
                    id="btn-print-report-portal-locked"
                    onClick={() => setShowPayOnlineModal(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
                    title={`Payment pending: Clear ₹${activeDueAmount} to print report`}
                  >
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>Print Report (Locked)</span>
                  </button>
                ) : (
                  <button
                    id="btn-print-report-portal"
                    onClick={handlePrint}
                    className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer"
                    title="Print Report on A4 / Letterhead"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>Print Report</span>
                  </button>
                )}

                {/* 3. Share on WhatsApp Button */}
                <button
                  id="btn-share-whatsapp-portal"
                  onClick={handleShareWhatsApp}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                  title="Share report on WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </button>

                {/* 4. Close / Search Another Report */}
                <button
                  id="btn-reset-report-portal"
                  type="button"
                  onClick={handleResetSearch}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Close report and search another"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                  <span>Search Another</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ONLINE PAYMENT CLEARANCE MODAL (Simulated Instant Clearance to Unlock Report) */}
      {showPayOnlineModal && searchedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Clear Balance & Unlock Report
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Secure Patient Payment Portal • {searchedReport.reportId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPayOnlineModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Bill & Due Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Patient Name:</span>
                <span className="font-bold text-slate-900">{searchedReport.patientName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>UHID / Token:</span>
                <span className="font-mono font-bold text-[#123B6D]">{searchedReport.uhid}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Investigation Cost:</span>
                <span className="font-mono font-semibold text-slate-800">
                  ₹{matchedEntry?.totalAmount || searchedReport.totalAmount || 650}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Already Paid at Counter:</span>
                <span className="font-mono font-semibold text-emerald-700">
                  ₹{matchedEntry?.paidAmount || searchedReport.paidAmount || 350}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black">
                <span className="text-slate-900">Outstanding Balance to Clear:</span>
                <span className="text-rose-600 font-mono text-base">₹{activeDueAmount}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayingMode('UPI')}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    payingMode === 'UPI'
                      ? 'border-[#123B6D] bg-[#123B6D]/5 text-[#123B6D] font-bold ring-2 ring-[#123B6D]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-[#0F766E]" />
                  <div>
                    <div className="text-xs font-bold">UPI / QR Code</div>
                    <div className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayingMode('Card')}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    payingMode === 'Card'
                      ? 'border-[#123B6D] bg-[#123B6D]/5 text-[#123B6D] font-bold ring-2 ring-[#123B6D]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#123B6D]" />
                  <div>
                    <div className="text-xs font-bold">Debit / Card</div>
                    <div className="text-[10px] text-slate-500">Visa, RuPay, Master</div>
                  </div>
                </button>
              </div>

              {/* UPI QR Display Box with Dynamic Amount */}
              {payingMode === 'UPI' && (() => {
                const dynamicPatientUpiUri = `upi://pay?pa=${encodeURIComponent(labUpi)}&pn=${encodeURIComponent(labName)}&am=${activeDueAmount}&cu=INR&tn=${encodeURIComponent(`Due Clearance - Token ${searchedReport.uhid || searchedReport.reportId}`)}`;
                const dynamicPatientQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(dynamicPatientUpiUri)}`;

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                    <div className="w-full flex items-center justify-between text-left border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Payable Balance</span>
                        <span className="text-lg font-black text-rose-600">₹{activeDueAmount}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                        ⚡ Amount Pre-filled in QR
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                      <img
                        src={dynamicPatientQrUrl}
                        alt="Dynamic Balance UPI QR"
                        className="w-40 h-40 object-contain rounded-lg"
                      />
                    </div>

                    <div className="w-full space-y-1">
                      <div className="font-bold text-xs text-slate-900">{labName}</div>
                      <div className="text-[11px] text-slate-600 font-mono font-bold">UPI ID: {labUpi}</div>
                      <p className="text-[10px] text-slate-400">
                        Scan with Google Pay, PhonePe, or Paytm. Exact amount of <strong>₹{activeDueAmount}</strong> will auto-fill.
                      </p>
                    </div>

                    <a
                      href={dynamicPatientUpiUri}
                      className="w-full py-2 px-3 bg-[#0F766E] hover:bg-[#0d655e] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Pay ₹{activeDueAmount} directly in UPI App</span>
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Pay Action Buttons */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowPayOnlineModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handlePayDueOnline}
                className="flex-2 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0d655e] text-white text-xs font-black transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Authorizing Payment...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Pay ₹{activeDueAmount} & Unlock Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Verification Modal */}
      {searchedReport && (
        <QRVerifyModal
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          reportId={searchedReport.reportId}
        />
      )}
    </div>
  );
};
