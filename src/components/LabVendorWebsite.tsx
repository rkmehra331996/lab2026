import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Search,
  ArrowRight,
  Eye,
  User,
  Activity,
  Award,
  Hash,
  FlaskConical,
  Heart,
  Droplets,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  QrCode,
  Copy,
  Globe,
  Mail,
  Shield,
  RotateCcw,
  Send,
  Share2,
  Navigation,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ExternalLink,
  Lock,
  KeyRound,
  Image as ImageIcon,
  Users,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Upload,
  Trash2,
  Plus,
  ShoppingCart,
  Info,
  Sparkles,
  Tag,
  TestTube,
  Layers,
  Download,
  Printer,
  Camera,
  BookmarkPlus,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useCms, DEFAULT_ALL_VENDOR_DOCTORS } from '../context/CmsContext';
import { updateDocumentMetadata, generateDefaultOgImage } from '../utils/seo';
import { Language, LabReport, ReceptionPatientEntry } from '../types';
import { generateReportPdf, printCanonicalReportPdf } from '../utils/pdfGenerator';
import { safePrint } from '../utils/printHelper';
import { OnlineTestBookingModal } from './vendor/OnlineTestBookingModal';
import { HeroBookingForm } from './vendor/HeroBookingForm';
import { LabWelcomeFirstScreen } from './vendor/LabWelcomeFirstScreen';
import { TermsConditionsModal } from './TermsConditionsModal';
import { VendorPolicyModal, PolicyTabType } from './vendor/VendorPolicyModal';
import { HomeScreenShortcutModal, DownloadAppModal } from './DownloadAppModal';
import { VendorAiVoiceBot } from './vendor/VendorAiVoiceBot';
import { IndianLalajiMarquee } from './IndianLalajiMarquee';
import { getTenantWebsiteUrl, getTenantSubdomain, getTenantBrowserUrl, SUPER_ADMIN_DOMAIN, normalizeToDirectoryUrl } from '../constants/domains';
import { isTenantMatch, isReportAccessibleToTenant } from '../utils/tenantSecurity';
import { optimizeImageFile } from '../utils/imageOptimizer';

interface LabVendorWebsiteProps {
  targetLabId?: string;
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
  onOpenReportPortal: (reportId?: string, mobile?: string, labId?: string) => void;
  onOpenLabSoftware: () => void;
  onOpenSoftwareWebsite: () => void;
  onOpenVendorDashboard?: () => void;
  onOpenReceptionDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
}

export const LabVendorWebsite: React.FC<LabVendorWebsiteProps> = ({
  targetLabId,
  language = 'en',
  onSelectLanguage,
  onOpenReportPortal,
  onOpenLabSoftware,
  onOpenSoftwareWebsite,
  onOpenVendorDashboard,
  onOpenReceptionDashboard,
  onOpenAdminDashboard,
}) => {
  const {
    currentUser,
    vendorLabSettings,
    vendorPackages,
    vendorTests,
    vendorDoctors,
    allVendorDoctors,
    addHomeCollectionBooking,
    openLoginModal,
    vendorLabsList,
    selectedVendorLabId,
    setVendorStatus,
    allReports,
    allReceptionEntries,
    updateVendorLabSettings,
    addContactSubmission,
  } = useCms();

  const safeVendorPackages = React.useMemo(() => {
    if (!Array.isArray(vendorPackages)) return [];
    return vendorPackages.map((p) => {
      const featArr = Array.isArray(p?.features)
        ? p.features
        : (typeof (p as any)?.features === 'string'
            ? [(p as any).features]
            : (Array.isArray((p as any)?.testsIncluded) ? (p as any).testsIncluded : []));
      return {
        ...p,
        name: p?.name || (p as any)?.title || 'Health Checkup Package',
        features: featArr,
        testsCount: p?.testsCount || (p as any)?.testCount || featArr.length || 0,
        priceINR: p?.priceINR || (p as any)?.price || 999,
        mrpINR: p?.mrpINR || (p as any)?.originalPrice || Math.round((p?.priceINR || (p as any)?.price || 999) * 1.5),
      };
    });
  }, [vendorPackages]);

  const safeVendorTests = React.useMemo(() => {
    if (!Array.isArray(vendorTests)) return [];
    return vendorTests.map((t) => ({
      ...t,
      name: t?.name || (t as any)?.testName || 'Diagnostic Test',
      category: t?.category || 'General',
      priceINR: t?.priceINR || (t as any)?.price || 350,
    }));
  }, [vendorTests]);

  const effectiveLabId = targetLabId || selectedVendorLabId || vendorLabSettings?.labId;

  const currentLabItem = React.useMemo(() => {
    if (effectiveLabId) {
      const effDigits = effectiveLabId.replace(/\D/g, '');
      const eff10 = effDigits.length >= 10 ? effDigits.slice(-10) : '';

      const match = vendorLabsList.find((l) => {
        const idLower = (l.id || '').toLowerCase();
        const effLower = effectiveLabId.toLowerCase();
        const labPhoneDigits = (l.phone || '').replace(/\D/g, '');
        const labPhone10 = labPhoneDigits.length >= 10 ? labPhoneDigits.slice(-10) : '';

        return (
          idLower === effLower ||
          idLower === `lab-${effLower}` ||
          idLower.replace(/^lab-/, '') === effLower.replace(/^lab-/, '') ||
          (eff10 && labPhone10 === eff10) ||
          (l.domainPreview && l.domainPreview.toLowerCase().includes(effLower)) ||
          (l.domainPreview && l.domainPreview.toLowerCase().split('.')[0] === effLower) ||
          (l.slug && l.slug.toLowerCase() === effLower) ||
          (l.name && l.name.toLowerCase().replace(/[^a-z0-9]/g, '') === effLower.replace(/[^a-z0-9]/g, ''))
        );
      });
      if (match) return match;

      // If not yet in vendorLabsList, synthesize lab item from effectiveLabId and vendorLabSettings
      const cleanSlug = effectiveLabId.replace(/^lab-/, '');
      const formattedName = cleanSlug
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') + ' Laboratory';
      return {
        id: effectiveLabId,
        name: vendorLabSettings?.labName || vendorLabSettings?.name || formattedName,
        tagline: vendorLabSettings?.tagline || 'Advanced Diagnostic & Pathology Services',
        city: vendorLabSettings?.city || 'India',
        state: vendorLabSettings?.state || 'India',
        address: vendorLabSettings?.address || 'Healthcare Complex, India',
        phone: vendorLabSettings?.phone || '+91 9876543210',
        nablCode: (vendorLabSettings as any)?.nablCode || vendorLabSettings?.nablAccreditationNo || vendorLabSettings?.nablNumber || 'NABL Accredited',
        badge: 'Verified Diagnostic Lab',
        status: 'Active',
        isWebsiteApproved: true,
        domainPreview: (vendorLabSettings?.domainPreview && !vendorLabSettings.domainPreview.endsWith('.indianlalaji.com'))
          ? vendorLabSettings.domainPreview
          : `indianlalaji.com/shop/${cleanSlug}`,
        slug: cleanSlug,
      } as any;
    }
    return (
      vendorLabsList.find((l) => l.id === (vendorLabSettings?.labId || selectedVendorLabId)) ||
      vendorLabsList.find(
        (l) => l.name?.toLowerCase() === (vendorLabSettings?.labName || vendorLabSettings?.name)?.toLowerCase()
      ) ||
      vendorLabsList[0] ||
      null
    );
  }, [vendorLabsList, vendorLabSettings, selectedVendorLabId, effectiveLabId]);

  const currentVendorReport = React.useMemo(() => {
    const tid = currentLabItem?.id || selectedVendorLabId;
    return (allReports || []).find((r) => isTenantMatch(r, tid, false));
  }, [allReports, currentLabItem?.id, selectedVendorLabId]);

  const defaultDirectoryLab = React.useMemo(() => {
    return vendorLabsList.find((l) => l.status === 'Active') || vendorLabsList[0];
  }, [vendorLabsList]);

  // Dynamic team members for the currently displayed website laboratory
  const currentWebsiteLabId = currentLabItem?.id || vendorLabSettings?.labId || selectedVendorLabId || defaultDirectoryLab?.id || 'lab';
  const effectiveTeamDoctors = React.useMemo(() => {
    if (allVendorDoctors && allVendorDoctors.length > 0) {
      return allVendorDoctors.filter((d) => isTenantMatch(d, currentWebsiteLabId, false));
    }
    return (vendorDoctors || []).filter((d) => isTenantMatch(d, currentWebsiteLabId, false));
  }, [allVendorDoctors, vendorDoctors, currentWebsiteLabId]);

  const handleCheckReport = (reportId?: string, mobile?: string) => {
    if (!hasEnteredWebsite) {
      setIsWelcomeReportModalOpen(true);
      if (reportId) {
        setQuickReportTab('report_id');
        setQuickReportInput(reportId);
        performInlineReportSearch(reportId, 'report_id');
      } else if (mobile) {
        setQuickReportTab('mobile');
        setQuickReportInput(mobile.replace(/\D/g, '').slice(0, 10));
        performInlineReportSearch(mobile, 'mobile');
      }
      return;
    }
    if (reportId) {
      setQuickReportTab('report_id');
      setQuickReportInput(reportId);
    } else if (mobile) {
      setQuickReportTab('mobile');
      setQuickReportInput(mobile.replace(/\D/g, '').slice(0, 10));
    }
    setTimeout(() => {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      const el = document.getElementById(isDesktop ? 'check-report-section-desktop' : 'check-report-section') ||
                 document.getElementById('check-report-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      const inputEl = document.getElementById(
        isDesktop
          ? (reportId ? 'check-report-token-input-desktop' : 'check-report-mobile-input-desktop')
          : (reportId ? 'check-report-token-input' : 'check-report-mobile-input')
      ) || document.getElementById(
        reportId ? 'check-report-token-input' : 'check-report-mobile-input'
      );
      if (inputEl) {
        inputEl.focus();
      }
    }, 120);
  };

  const dedicatedShopPath = currentLabItem?.slug || currentLabItem?.id || effectiveLabId || 'lab-apex';
  const canonicalUrl = getTenantWebsiteUrl(dedicatedShopPath);

  const handleOpenAdmin = () => {
    if (currentUser && (currentUser.role === 'vendor' || currentUser.role === 'admin')) {
      if (onOpenVendorDashboard) onOpenVendorDashboard();
    } else {
      openLoginModal('vendor');
    }
  };

  const handleOpenManagement = () => {
    if (currentUser && (currentUser.role === 'vendor' || currentUser.role === 'admin')) {
      if (onOpenVendorDashboard) onOpenVendorDashboard();
    } else {
      openLoginModal('vendor');
    }
  };

  const handleOpenReception = () => {
    if (currentUser && (currentUser.role === 'reception' || currentUser.role === 'vendor' || currentUser.role === 'admin')) {
      if (onOpenReceptionDashboard) onOpenReceptionDashboard();
    } else {
      openLoginModal('reception');
    }
  };

  const handleOpenTechnician = () => {
    if (currentUser && (currentUser.role === 'technician' || currentUser.role === 'vendor' || currentUser.role === 'admin')) {
      if (onOpenLabSoftware) onOpenLabSoftware();
    } else {
      openLoginModal('technician');
    }
  };

  const labShopId = vendorLabSettings?.labShopId || (currentLabItem ? `LSP-${currentLabItem.id.replace('lab-', '').toUpperCase()}` : (defaultDirectoryLab ? `LSP-${defaultDirectoryLab.id.replace('lab-', '').toUpperCase()}` : 'LSP-101'));
  const labName = currentLabItem?.name || vendorLabSettings?.labName || vendorLabSettings?.name || defaultDirectoryLab?.name || 'Diagnostic Laboratory';
  const labNabl = vendorLabSettings?.nablAccreditationNo || vendorLabSettings?.nablNumber || currentLabItem?.nablCode || defaultDirectoryLab?.nablCode || 'Verified';
  const labPhone = currentLabItem?.phone || vendorLabSettings?.phone || vendorLabSettings?.helplinePhone || defaultDirectoryLab?.phone || '6070809010';
  const labWhatsapp = vendorLabSettings?.whatsapp || currentLabItem?.phone || labPhone || '6070809010';
  const labEmail = currentLabItem?.email || vendorLabSettings?.email || defaultDirectoryLab?.email || 'care@indianlalaji.com';
  const labTagline = currentLabItem?.tagline || vendorLabSettings?.tagline || defaultDirectoryLab?.tagline || 'Advanced Pathology, Biochemistry & Diagnostic Testing Centre';
  const labHours = vendorLabSettings?.openingHours || 'Open 7:00 AM – 9:00 PM (All 7 Days)';
  const labEmergency = vendorLabSettings?.emergencyHours || '24x7 Emergency Services at Central Lab';
  const labAddress = currentLabItem?.address || vendorLabSettings?.address || defaultDirectoryLab?.address || 'Healthcare Complex, India';
  const labDescription = vendorLabSettings?.description || labTagline || `${labName} - Authorized NABL Accredited Diagnostic Center.`;
  const labWebsiteUrl =
    vendorLabSettings?.websiteUrl &&
    !vendorLabSettings.websiteUrl.includes('labname.com') &&
    !vendorLabSettings.websiteUrl.includes('.indianlalaji.com') &&
    !vendorLabSettings.websiteUrl.includes('.indianalala.com')
      ? vendorLabSettings.websiteUrl
      : canonicalUrl;
  const labLogoUrl = vendorLabSettings?.logoUrl || '';
  const labOgImageUrl = vendorLabSettings?.ogImageUrl || labLogoUrl || generateDefaultOgImage(labName, labShopId, labNabl);
  const labEstablishedYear = vendorLabSettings?.establishedYear || (currentLabItem as any)?.establishedYear || (vendorLabSettings as any)?.sinceYear || '2012';

  const cleanPhone = (labPhone || '7087033009').replace(/\D/g, '');
  const cleanWhatsapp = (labWhatsapp || '7087033009').replace(/\D/g, '');
  const stickyWhatsappUrl = `https://wa.me/91${cleanWhatsapp}?text=${encodeURIComponent(
    `Hello ${labName}, I would like to inquire about medical lab tests & home sample collection.`
  )}`;
  const stickyTelUrl = `tel:+91${cleanPhone}`;

  // Multi-number support for WhatsApp & Calling
  const whatsappNumberList = React.useMemo<string[]>(() => {
    const raw = vendorLabSettings?.whatsapp || labWhatsapp || '6070809010';
    const splitNums = raw.split(/[,/|&]+/).map((s: string) => s.trim()).filter(Boolean);
    const unique = Array.from<string>(new Set(splitNums));
    return unique.length > 0 ? unique : ['6070809010'];
  }, [vendorLabSettings?.whatsapp, labWhatsapp]);

  const callNumberList = React.useMemo<string[]>(() => {
    const rawList: string[] = [];
    if (vendorLabSettings?.phone) {
      rawList.push(...vendorLabSettings.phone.split(/[,/|&]+/));
    }
    if (vendorLabSettings?.helplinePhone && vendorLabSettings.helplinePhone !== vendorLabSettings.phone) {
      rawList.push(...vendorLabSettings.helplinePhone.split(/[,/|&]+/));
    }
    if (rawList.length === 0 && labPhone) {
      rawList.push(...labPhone.split(/[,/|&]+/));
    }
    const cleanList = Array.from<string>(new Set(rawList.map((s: string) => s.trim()).filter(Boolean)));
    return cleanList.length > 0 ? cleanList : ['6070809010'];
  }, [vendorLabSettings?.phone, vendorLabSettings?.helplinePhone, labPhone]);

  // Dynamic Social Media Links (Only show channels where a valid link/handle is entered)
  const effectiveSocialMedia = React.useMemo(() => {
    const raw = vendorLabSettings?.socialMedia;
    if (raw && typeof raw === 'object') {
      const hasAny = Object.entries(raw).some(
        ([k, v]) => k !== 'enabled' && typeof v === 'string' && v.trim().length > 0 && v !== '#' && v !== '/'
      );
      if (hasAny) return raw;
    }
    try {
      const backup =
        localStorage.getItem(`cms_vendor_social_media_${currentWebsiteLabId}`) ||
        localStorage.getItem('cms_vendor_social_media');
      if (backup) {
        const parsed = JSON.parse(backup);
        if (parsed && typeof parsed === 'object') {
          return { ...(raw || {}), ...parsed };
        }
      }
    } catch {}
    return raw;
  }, [vendorLabSettings?.socialMedia, currentWebsiteLabId]);

  const cleanSocialUrl = (val?: string, defaultDomains: string[] = []): string | null => {
    if (!val) return null;
    const trimmed = val.trim();
    if (!trimmed || trimmed === '#' || trimmed === '/') return null;
    const lower = trimmed.toLowerCase();
    if (defaultDomains.some((d) => lower === d || lower === `${d}/`)) return null;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const socialWhatsappUrl = React.useMemo(() => {
    const val = effectiveSocialMedia?.whatsapp;
    if (!val) return null;
    const trimmed = val.trim();
    if (!trimmed || trimmed === '#' || trimmed === '/') return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const digits = trimmed.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : null;
  }, [effectiveSocialMedia?.whatsapp]);

  const socialFacebookUrl = React.useMemo(() => {
    return cleanSocialUrl(effectiveSocialMedia?.facebook, [
      'https://facebook.com',
      'https://www.facebook.com',
      'http://facebook.com',
      'http://www.facebook.com',
    ]);
  }, [effectiveSocialMedia?.facebook]);

  const socialInstagramUrl = React.useMemo(() => {
    return cleanSocialUrl(effectiveSocialMedia?.instagram, [
      'https://instagram.com',
      'https://www.instagram.com',
      'http://instagram.com',
      'http://www.instagram.com',
    ]);
  }, [effectiveSocialMedia?.instagram]);

  const socialTwitterUrl = React.useMemo(() => {
    return cleanSocialUrl(effectiveSocialMedia?.twitter, [
      'https://twitter.com',
      'https://www.twitter.com',
      'https://x.com',
      'https://www.x.com',
    ]);
  }, [effectiveSocialMedia?.twitter]);

  const socialYoutubeUrl = React.useMemo(() => {
    return cleanSocialUrl(effectiveSocialMedia?.youtube, [
      'https://youtube.com',
      'https://www.youtube.com',
    ]);
  }, [effectiveSocialMedia?.youtube]);

  const socialLinkedinUrl = React.useMemo(() => {
    return cleanSocialUrl(effectiveSocialMedia?.linkedin, [
      'https://linkedin.com',
      'https://www.linkedin.com',
    ]);
  }, [effectiveSocialMedia?.linkedin]);

  const hasAnySocialLinks = Boolean(
    socialWhatsappUrl ||
    socialFacebookUrl ||
    socialInstagramUrl ||
    socialTwitterUrl ||
    socialYoutubeUrl ||
    socialLinkedinUrl
  );

  // Dynamic Open Graph, Page Title & Metadata Synchronization for Current Tenant/Shop
  useEffect(() => {
    updateDocumentMetadata({
      title: `${labName} - Diagnostic & Pathology Laboratory`,
      description: labDescription,
      ogImage: labOgImageUrl,
      ogUrl: labWebsiteUrl,
      ogType: 'website',
    });

    return () => {
      // Revert to laboratory metadata on unmount
      updateDocumentMetadata({
        title: `${labName} - Diagnostic & Pathology Laboratory`,
        description: labDescription,
        ogImage: labOgImageUrl,
        ogUrl: typeof window !== 'undefined' ? window.location.origin : '',
        ogType: 'website',
      });
    };
  }, [labName, labShopId, labNabl, labDescription, labWebsiteUrl, labOgImageUrl]);

  // First Screen (Welcome Gateway) vs Full Website Exploration State
  const [hasEnteredWebsite, setHasEnteredWebsite] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBookTestCategory, setSelectedBookTestCategory] = useState<string>('All');
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });
  const [visibleTestsCount, setVisibleTestsCount] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 20;
    }
    return 40;
  });
  const [activeMobilePkgIndex, setActiveMobilePkgIndex] = useState(0);
  const [activeMobileDoctorIndex, setActiveMobileDoctorIndex] = useState(0);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      setIsMobileScreen(isMobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [selectedTestInfoModal, setSelectedTestInfoModal] = useState<any | null>(null);
  const [addingTestId, setAddingTestId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<{
    id: string;
    name: string;
    price: number;
    code?: string;
    category?: string;
    sampleType?: string;
    turnaroundTime?: string;
  }[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [showFullDirectory, setShowFullDirectory] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPaymentQrModalOpen, setIsPaymentQrModalOpen] = useState(false);
  const [websiteDynamicAmount, setWebsiteDynamicAmount] = useState<number>(500);
  const [websitePatientRef, setWebsitePatientRef] = useState<string>('');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isWebsiteQrModalOpen, setIsWebsiteQrModalOpen] = useState(false);
  const [copiedWebsiteUrl, setCopiedWebsiteUrl] = useState(false);
  const [isDownloadAppModalOpen, setIsDownloadAppModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyModalTab, setPolicyModalTab] = useState<PolicyTabType>('terms');
  const [fullScreenImage, setFullScreenImage] = useState<{
    url: string;
    title: string;
    price?: number;
    testsCount?: number;
    features?: string[];
  } | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAdminPreviewingDraft, setIsAdminPreviewingDraft] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isReportModalOpen) setIsReportModalOpen(false);
        if (fullScreenImage) {
          setFullScreenImage(null);
          setIsImageZoomed(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReportModalOpen, fullScreenImage]);

  const openPolicyModal = (tab: PolicyTabType) => {
    setPolicyModalTab(tab);
    setIsPolicyModalOpen(true);
  };

  // Guaranteed non-null vendor lab ID & clean slug
  const effectiveVendorId = effectiveLabId || currentLabItem?.id || 'lab-apex';
  const effectiveSlug = (
    currentLabItem?.slug ||
    currentLabItem?.id ||
    effectiveVendorId ||
    'lab-apex'
  )
    .replace(/^https?:\/\//i, '')
    .replace(/^indianlalaji\.com\/shop\//i, '')
    .replace(/\.?(indianlalaji|indianalala)\.com$/i, '')
    .replace(/^lab-/, '');

  // Clean shop identifier ensuring directory format:
  // e.g. 'lab-1020304050' or clean slug 'baburamlab'
  const cleanShopIdentifier = React.useMemo(() => {
    // If lab has explicit clean slug like 'baburamlab' or 'apex'
    if (currentLabItem?.slug && !currentLabItem.slug.includes('.') && currentLabItem.slug !== 'shop') {
      return currentLabItem.slug;
    }
    // Clean any prefix or subdomain string (e.g. 'baburamlab.indianlalaji.com' -> 'baburamlab')
    const rawTarget = currentLabItem?.id || effectiveVendorId || 'lab-apex';
    const cleanId = getTenantSubdomain(rawTarget);
    return cleanId;
  }, [currentLabItem, effectiveVendorId]);

  // Canonical live public URL for the vendor's dedicated website
  // Format: https://indianlalaji.com/shop/baburamlab or https://indianlalaji.com/shop/lab-apex
  // NEVER subdomain like https://baburamlab.indianlalaji.com
  const vendorCanonicalWebsiteUrl = React.useMemo(() => {
    // 1. If verified external 3rd-party custom domain is active (e.g. baburamlab.in or apexdiag.com)
    // Must NOT contain indianlalaji.com or indianalala.com!
    if (vendorLabSettings?.isCustomDomainActive && vendorLabSettings?.websiteDomain) {
      const cleanDom = vendorLabSettings.websiteDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (
        cleanDom &&
        !cleanDom.includes('indianlalaji.com') &&
        !cleanDom.includes('indianalala.com') &&
        cleanDom.includes('.') &&
        !cleanDom.startsWith('localhost')
      ) {
        return `https://${cleanDom}`;
      }
    }
    // 2. If explicit external 3rd-party custom domain set in websiteUrl (e.g. https://baburamlab.in)
    if (vendorLabSettings?.websiteUrl && !vendorLabSettings.websiteUrl.includes('labname.com')) {
      const cleanUrl = vendorLabSettings.websiteUrl.trim();
      if (
        cleanUrl.startsWith('http') &&
        !cleanUrl.includes('indianlalaji.com') &&
        !cleanUrl.includes('indianalala.com')
      ) {
        return cleanUrl;
      }
    }
    // 3. Central Official Canonical Shop URL on indianlalaji.com:
    // ALWAYS Directory format: https://indianlalaji.com/shop/[id] (NEVER subdomain!)
    return normalizeToDirectoryUrl(
      currentLabItem?.slug ||
      currentLabItem?.domainPreview ||
      vendorLabSettings?.domainPreview ||
      cleanShopIdentifier ||
      effectiveSlug ||
      effectiveVendorId
    );
  }, [vendorLabSettings, cleanShopIdentifier, currentLabItem, effectiveSlug, effectiveVendorId]);

  // In-browser direct URL (for local preview, in-app navigation, and copy button)
  const websiteDirectUrl = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      // If vendor custom domain is configured:
      if (vendorLabSettings?.isCustomDomainActive && vendorLabSettings?.websiteDomain) {
        const cleanDom = vendorLabSettings.websiteDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (cleanDom && !cleanDom.includes('indianlalaji.com') && !cleanDom.includes('indianalala.com') && cleanDom.includes('.')) {
          return `https://${cleanDom}`;
        }
      }
      const rawTarget = currentLabItem?.slug || cleanShopIdentifier || effectiveSlug || 'lab-apex';
      const cleanSlug = rawTarget
        .replace(/^https?:\/\//i, '')
        .replace(/^indianlalaji\.com\/shop\//i, '')
        .replace(/\.?(indianlalaji|indianalala)\.com$/i, '');
      return `${window.location.origin}/shop/${cleanSlug}`;
    }
    return vendorCanonicalWebsiteUrl;
  }, [vendorCanonicalWebsiteUrl, vendorLabSettings, cleanShopIdentifier, currentLabItem, effectiveSlug]);

  // The QR Code URL for "Visit Website": Always routes to the canonical public shop directory URL
  // e.g. https://indianlalaji.com/shop/baburamlab
  // Ensures any patient scanning from a smartphone in the real world reaches the exact vendor shop!
  const qrWebsiteUrl = React.useMemo(() => {
    return normalizeToDirectoryUrl(vendorCanonicalWebsiteUrl);
  }, [vendorCanonicalWebsiteUrl]);

  // URL for Home Screen Shortcut
  const homeScreenUrl = React.useMemo(() => {
    return qrWebsiteUrl;
  }, [qrWebsiteUrl]);

  // Direct URL for backward compatibility
  const downloadAppUrl = homeScreenUrl;

  // Instant client-side QR Code Data URL for Visit Website
  const [websiteQrDataUrl, setWebsiteQrDataUrl] = useState<string>('');
  useEffect(() => {
    let isMounted = true;
    if (qrWebsiteUrl) {
      QRCode.toDataURL(qrWebsiteUrl, {
        width: 280,
        margin: 1,
        color: { dark: '#123B6D', light: '#FFFFFF' },
      })
        .then((dataUri) => {
          if (isMounted) setWebsiteQrDataUrl(dataUri);
        })
        .catch(() => {
          if (isMounted) {
            setWebsiteQrDataUrl(
              `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrWebsiteUrl)}`
            );
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [qrWebsiteUrl]);

  // Auto-update PWA manifest so installing app opens directly to this vendor website
  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      const targetStartUrl = `/shop/${effectiveSlug}`;
      const dynamicManifest = {
        id: `/shop/${effectiveSlug}`,
        name: `${labName} Diagnostic App`,
        short_name: (labName || 'Lab App').slice(0, 24),
        description: `Official Diagnostic & Pathology Mobile App for ${labName}`,
        start_url: targetStartUrl,
        scope: '/',
        display: 'standalone',
        theme_color: '#123B6D',
        background_color: '#F8FAFC',
        icons: [
          {
            src: labLogoUrl || '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: labLogoUrl || '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      };

      const blob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/manifest+json' });
      const manifestUrl = URL.createObjectURL(blob);
      let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'manifest';
        document.head.appendChild(link);
      }
      link.href = manifestUrl;

      localStorage.setItem('cms_installed_vendor_app_slug', effectiveSlug);
      localStorage.setItem('cms_installed_vendor_app_id', effectiveVendorId);

      return () => {
        URL.revokeObjectURL(manifestUrl);
      };
    } catch {}
  }, [effectiveSlug, effectiveVendorId, labName, labLogoUrl]);

  // Auto-open Home Screen Shortcut Modal if URL contains ?page=home-screen-shortcut, ?page=shortcut or ?page=download-app
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      const hash = window.location.hash;
      const params = new URLSearchParams(search);
      if (
        params.get('page') === 'home-screen-shortcut' ||
        params.get('page') === 'shortcut' ||
        params.get('page') === 'download-app' ||
        hash === '#shortcut' ||
        hash === '#download-app'
      ) {
        setIsDownloadAppModalOpen(true);
      }
    }
  }, []);

  const handleCloseDownloadAppModal = () => {
    setIsDownloadAppModalOpen(false);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        let changed = false;
        ['download-app', 'shortcut', 'home-screen-shortcut'].forEach((p) => {
          if (url.searchParams.get('page') === p) {
            url.searchParams.delete('page');
            changed = true;
          }
        });
        if (url.hash === '#download-app' || url.hash === '#shortcut') {
          url.hash = '';
          changed = true;
        }
        if (changed) {
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      } catch {}
    }
  };

  // Default Pathology & Diagnostic Banners
  const DEFAULT_HERO_BANNER_IMAGES = React.useMemo(() => [
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80',
  ], []);

  // Section 1: Hero Carousel State (Admin Uploadable Photo Banners with 2%-5% Peek Effect)
  const heroBannersList = React.useMemo(() => {
    if (vendorLabSettings?.heroBanners && vendorLabSettings.heroBanners.length > 0) {
      return vendorLabSettings.heroBanners;
    }
    return DEFAULT_HERO_BANNER_IMAGES;
  }, [vendorLabSettings?.heroBanners, DEFAULT_HERO_BANNER_IMAGES]);

  const [activeHeroBanner, setActiveHeroBanner] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const heroCarouselRef = React.useRef<HTMLDivElement>(null);
  const heroCarouselDesktopRef = React.useRef<HTMLDivElement>(null);
  const touchStartXRef = React.useRef<number | null>(null);
  const touchEndXRef = React.useRef<number | null>(null);
  const packagesCarouselRef = React.useRef<HTMLDivElement>(null);
  const teamCarouselRef = React.useRef<HTMLDivElement>(null);

  const scrollToVendorSection = (targetId: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      let el: HTMLElement | null = null;
      if (targetId === 'packages') {
        el = document.getElementById('packages') || document.getElementById('packages-section');
      } else if (targetId === 'team' || targetId === 'doctors') {
        el = document.getElementById('team') || document.getElementById('doctors');
      } else if (targetId === 'tests') {
        el = document.getElementById('book-test-section') || document.getElementById('test-directory');
      } else if (targetId === 'booking') {
        el = document.getElementById('lab-test-health-booking');
      } else {
        el = document.getElementById(targetId);
      }
      if (el) {
        const yOffset = -75;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 60);
  };

  const handleScrollPackages = (direction: 'left' | 'right') => {
    if (!packagesCarouselRef.current) return;
    const container = packagesCarouselRef.current;
    const scrollAmount = container.clientWidth * 0.88;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleScrollTeam = (direction: 'left' | 'right') => {
    if (!teamCarouselRef.current) return;
    const container = teamCarouselRef.current;
    const scrollAmount = container.clientWidth * 0.82;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Admin Banner Upload & Management State
  const [isBannerManagerOpen, setIsBannerManagerOpen] = useState(false);
  const [tempBannersList, setTempBannersList] = useState<string[]>([]);
  const [newBannerInputUrl, setNewBannerInputUrl] = useState('');
  const [bannerSaveNotice, setBannerSaveNotice] = useState('');
  const bannerFileInputRef = React.useRef<HTMLInputElement>(null);

  const openBannerManager = () => {
    setTempBannersList([...heroBannersList]);
    setNewBannerInputUrl('');
    setBannerSaveNotice('');
    setIsBannerManagerOpen(true);
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setBannerSaveNotice('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    try {
      const optimized = await optimizeImageFile(file, { maxWidth: 1400, maxHeight: 700, quality: 0.82 });
      if (optimized) {
        setTempBannersList((prev) => [...prev, optimized]);
        setBannerSaveNotice('Image photo added! Click "Save & Publish" to update.');
      }
    } catch (err) {
      console.error('Error optimizing banner photo:', err);
    }
    if (e.target) e.target.value = '';
  };

  const handleAddBannerUrl = () => {
    const url = newBannerInputUrl.trim();
    if (!url) return;
    setTempBannersList((prev) => [...prev, url]);
    setNewBannerInputUrl('');
    setBannerSaveNotice('Banner URL added! Click "Save & Publish" to update.');
  };

  const handleRemoveBanner = (index: number) => {
    setTempBannersList((prev) => prev.filter((_, i) => i !== index));
    setBannerSaveNotice('Banner removed from list. Click "Save & Publish" to update.');
  };

  const handleMoveBanner = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tempBannersList.length) return;
    const updated = [...tempBannersList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setTempBannersList(updated);
    setBannerSaveNotice('Banner order updated! Click "Save & Publish" to confirm.');
  };

  const handleSaveBanners = () => {
    const finalBanners = tempBannersList.length > 0 ? tempBannersList : DEFAULT_HERO_BANNER_IMAGES;
    updateVendorLabSettings({ heroBanners: finalBanners });
    setBannerSaveNotice('✅ Banners updated successfully!');
    setTimeout(() => {
      setIsBannerManagerOpen(false);
      setBannerSaveNotice('');
      setActiveHeroBanner(0);
    }, 900);
  };

  const handleResetDefaultBanners = () => {
    setTempBannersList([...DEFAULT_HERO_BANNER_IMAGES]);
    updateVendorLabSettings({ heroBanners: DEFAULT_HERO_BANNER_IMAGES });
    setBannerSaveNotice('Reset to default diagnostic promotional banners.');
  };

  // Auto-slide carousel every 4.5 seconds (resets on interaction)
  useEffect(() => {
    if (isHeroPaused || heroBannersList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroBanner((prev) => (prev + 1) % heroBannersList.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHeroPaused, heroBannersList.length]);

  // Smooth scroll carousel container to active slide
  useEffect(() => {
    [heroCarouselRef.current, heroCarouselDesktopRef.current].forEach((container) => {
      if (container) {
        const targetCard = container.children[activeHeroBanner] as HTMLElement;
        if (targetCard) {
          container.scrollTo({
            left: targetCard.offsetLeft,
            behavior: 'smooth',
          });
        }
      }
    });
  }, [activeHeroBanner]);

  const handleHeroTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsHeroPaused(true);
  };

  const handleHeroTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleHeroTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const delta = touchStartXRef.current - touchEndXRef.current;
      if (Math.abs(delta) > 35) {
        if (delta > 0) {
          // swipe left -> next slide
          setActiveHeroBanner((prev) => (prev + 1) % heroBannersList.length);
        } else {
          // swipe right -> previous slide
          setActiveHeroBanner((prev) => (prev - 1 + heroBannersList.length) % heroBannersList.length);
        }
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    setTimeout(() => setIsHeroPaused(false), 2500);
  };

  // Section 2: Quick Check Report Box State & Inline Report Display
  const [quickReportTab, setQuickReportTab] = useState<'mobile' | 'report_id'>('mobile');
  const [quickReportInput, setQuickReportInput] = useState('');
  const [quickReportError, setQuickReportError] = useState('');
  const [inlineSearchedReport, setInlineSearchedReport] = useState<LabReport | null>(null);
  const [inlineMultipleReports, setInlineMultipleReports] = useState<LabReport[]>([]);
  const [inlinePendingSample, setInlinePendingSample] = useState<{
    tokenNumber: string;
    patientName: string;
    ageGender: string;
    tests: string[];
    registeredAt: string;
    status: string;
    technicianStatus: string;
    branchName?: string;
  } | null>(null);
  const [inlineSearchNotFound, setInlineSearchNotFound] = useState(false);
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);
  const [isWelcomeReportModalOpen, setIsWelcomeReportModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const performInlineReportSearch = (rawQuery?: string, explicitTab?: 'mobile' | 'report_id') => {
    setQuickReportError('');
    setInlineSearchNotFound(false);
    setInlineSearchedReport(null);
    setInlineMultipleReports([]);
    setInlinePendingSample(null);

    const activeTab = explicitTab || quickReportTab;
    const val = (rawQuery !== undefined ? rawQuery : quickReportInput).trim();

    if (!val) {
      setHasSubmittedSearch(false);
      setQuickReportError(
        activeTab === 'mobile'
          ? 'Please enter your 10-digit registered mobile number.'
          : 'Please enter your Token Number or Report ID.'
      );
      return;
    }

    setHasSubmittedSearch(true);

    const scrollReportIntoView = () => {
      setTimeout(() => {
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
        const target =
          document.getElementById(
            isDesktop ? 'inline-report-display-container-desktop' : 'inline-report-display-container'
          ) || document.getElementById('inline-report-display-container');
        target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    };

    const currentLabId = currentWebsiteLabId || currentLabItem?.id || selectedVendorLabId;

    // Strict Tenant Isolation Guard: Cross-lab report search strictly blocked
    if (!isReportAccessibleToTenant(val, currentLabId, allReports, allReceptionEntries)) {
      setQuickReportError(`Access Denied: Patient report or record for "${val}" belongs to another diagnostic laboratory. Reports can only be accessed through the laboratory where the patient was tested.`);
      setInlineSearchNotFound(true);
      return;
    }

    // Filter reports and reception entries strictly for current lab - NO cross-lab data leakage
    const availableReports = (allReports || []).filter((r) => isTenantMatch(r, currentLabId, false));
    const availableEntries = (allReceptionEntries || []).filter((e) => isTenantMatch(e, currentLabId, false));

    if (activeTab === 'mobile') {
      const cleanDigits = val.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        setQuickReportError('Please enter a valid 10-digit mobile number (e.g. 9876543210).');
        return;
      }
      const search10 = cleanDigits.slice(-10);

      // 1. Find matched verified/published reports strictly by exact 10-digit mobile
      const matchedReports = availableReports.filter((r) => {
        const rDigits = (r.mobile || '').replace(/\D/g, '');
        return rDigits.length >= 10 && rDigits.slice(-10) === search10;
      });

      // 2. Find matched reception entries strictly by exact 10-digit mobile
      const matchedEntries = availableEntries.filter((e) => {
        const eDigits = (e.mobile || '').replace(/\D/g, '');
        return eDigits.length >= 10 && eDigits.slice(-10) === search10;
      });

      if (matchedReports.length > 0) {
        setInlineSearchedReport(matchedReports[0]);
        if (matchedReports.length > 1) {
          setInlineMultipleReports(matchedReports);
        }
        scrollReportIntoView();
      } else if (matchedEntries.length > 0) {
        const entry = matchedEntries[0];
        if (entry.reportId) {
          const found = availableReports.find(
            (r) => r.reportId.toLowerCase() === entry.reportId?.toLowerCase()
          );
          if (found) {
            setInlineSearchedReport(found);
            scrollReportIntoView();
            return;
          }
        }
        setInlinePendingSample({
          tokenNumber: entry.tokenNumber || 'Token',
          patientName: entry.patientName || 'Patient',
          ageGender: `${entry.age || '-'} Yrs / ${entry.gender || '-'}`,
          tests: entry.tests || [],
          registeredAt: entry.registeredAt || 'Today',
          status: entry.status || 'Sample Under Testing',
          technicianStatus: entry.technicianStatus || 'Processing in Lab',
          branchName: entry.branchName || labName,
        });
        scrollReportIntoView();
      } else {
        setInlineSearchNotFound(true);
      }
    } else {
      // Search by Token Number or Report ID - STRICT EXACT MATCH ONLY
      const cleanVal = val.trim().toLowerCase();
      const cleanDigits = val.replace(/\D/g, '');

      // 1. Direct exact match in reports by reportId, tokenNumber, or UHID
      const foundReport = availableReports.find((r) => {
        const rId = r.reportId.trim().toLowerCase();
        const rUhid = (r.uhid || '').trim().toLowerCase();
        const rToken = (r.tokenNumber || '').trim().toLowerCase();
        const rTokenDigits = rToken.replace(/\D/g, '');
        const rIdDigits = rId.replace(/\D/g, '');
        const rUhidDigits = rUhid.replace(/\D/g, '');

        return (
          rId === cleanVal ||
          rUhid === cleanVal ||
          rToken === cleanVal ||
          rToken === `tk-${cleanVal}` ||
          `tk-${rToken}` === cleanVal ||
          rId === `rpt-${cleanVal}` ||
          `rpt-${rId}` === cleanVal ||
          rUhid === `uhid-${cleanVal}` ||
          (cleanDigits.length > 0 && (rTokenDigits === cleanDigits || rIdDigits === cleanDigits || rUhidDigits === cleanDigits))
        );
      });

      if (foundReport) {
        setInlineSearchedReport(foundReport);
        scrollReportIntoView();
        return;
      }

      // 2. Check if it matches an entry by exact token number, uhid, or reportId
      const foundEntry = availableEntries.find((e) => {
        const entryToken = (e.tokenNumber || '').trim().toLowerCase();
        const entryTokenDigits = entryToken.replace(/\D/g, '');
        const uhidLower = (e.uhid || '').trim().toLowerCase();
        const reportIdLower = (e.reportId || '').trim().toLowerCase();
        const rIdDigits = reportIdLower.replace(/\D/g, '');
        const rUhidDigits = uhidLower.replace(/\D/g, '');

        return (
          entryToken === cleanVal ||
          entryToken === `tk-${cleanVal}` ||
          `tk-${entryToken}` === cleanVal ||
          (cleanDigits.length > 0 && (entryTokenDigits === cleanDigits || rIdDigits === cleanDigits || rUhidDigits === cleanDigits)) ||
          reportIdLower === cleanVal ||
          reportIdLower === `rpt-${cleanVal}` ||
          uhidLower === cleanVal ||
          uhidLower === `uhid-${cleanVal}`
        );
      });

      if (foundEntry) {
        if (foundEntry.reportId) {
          const relReport = availableReports.find(
            (r) => r.reportId.toLowerCase() === foundEntry.reportId?.toLowerCase()
          );
          if (relReport) {
            setInlineSearchedReport(relReport);
            scrollReportIntoView();
            return;
          }
        }

        setInlinePendingSample({
          tokenNumber: foundEntry.tokenNumber || val,
          patientName: foundEntry.patientName || 'Patient',
          ageGender: `${foundEntry.age || '-'} Yrs / ${foundEntry.gender || '-'}`,
          tests: foundEntry.tests || [],
          registeredAt: foundEntry.registeredAt || 'Today',
          status: foundEntry.status || 'Sample Under Testing',
          technicianStatus: foundEntry.technicianStatus || 'Processing in Lab',
          branchName: foundEntry.branchName || labName,
        });
        scrollReportIntoView();
      } else {
        setInlineSearchNotFound(true);
      }
    }
  };

  const handleQuickReportSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performInlineReportSearch();
  };

  const handleDownloadInlinePdf = async () => {
    if (!inlineSearchedReport) return;
    try {
      setIsDownloadingPdf(true);
      await generateReportPdf(inlineSearchedReport);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintInlineReport = async () => {
    if (!inlineSearchedReport) return;
    try {
      const printed = await printCanonicalReportPdf(inlineSearchedReport);
      if (!printed) {
        safePrint();
      }
    } catch {
      safePrint();
    }
  };

  // Home collection booking form state
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [bookingDate, setBookingDate] = useState('Tomorrow Morning (7:00 AM - 9:00 AM)');
  const [selectedTestOrPackage, setSelectedTestOrPackage] = useState(
    vendorPackages[0] ? `${vendorPackages[0].name} (₹${vendorPackages[0].priceINR})` : 'Full Body Health Checkup (₹999)'
  );

  // Contact Us Inquiry Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('Test Inquiry & Pricing');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactRefId, setContactRefId] = useState('');
  const [contactError, setContactError] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');

    if (!contactName.trim()) {
      setContactError('Please enter your full name.');
      return;
    }

    const cleanNum = contactPhone.replace(/\D/g, '');
    if (cleanNum.length < 10) {
      setContactError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setContactSubmitting(true);
    setTimeout(() => {
      const generatedRef = `INQ-${Math.floor(100000 + Math.random() * 900000)}`;
      setContactRefId(generatedRef);
      addContactSubmission({
        name: contactName.trim(),
        phone: cleanNum,
        email: contactEmail?.trim() || undefined,
        subject: contactSubject?.trim() || 'General Test Inquiry',
        message: contactMessage?.trim() || 'Website inquiry received',
        labId: currentLabItem?.id || vendorLabSettings?.labId || selectedVendorLabId || defaultDirectoryLab?.id || 'lab',
        referenceToken: generatedRef,
      });
      setContactSubmitting(false);
      setContactSubmitted(true);
    }, 500);
  };

  const handleCopyText = (text: string, type: 'phone' | 'email') => {
    try {
      navigator.clipboard.writeText(text);
      if (type === 'phone') {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
    } catch {}
  };

  const categories = [
    'All',
    'Hematology',
    'Biochemistry',
    'Thyroid & Hormones',
    'Diabetes',
    'Vitamins & Minerals',
    'Urine Analysis',
  ];

  // Section 4: Book Test Section Category Tabs
  const BOOK_TEST_CATEGORY_TABS = [
    'All',
    'Hematology',
    'Biochemistry',
    'Thyroid & Hormones',
    'Diabetes',
    'Vitamins',
    'Urine Analysis',
  ];

  const isTestInBookCategory = (test: any, cat: string) => {
    if (cat === 'All') return true;
    const catLower = cat.toLowerCase();
    const tCat = (test.category || '').toLowerCase();
    const tName = (test.name || '').toLowerCase();
    const tCode = (test.code || '').toLowerCase();

    if (cat === 'Hematology') {
      return (
        tCat.includes('hematology') ||
        tCat.includes('blood') ||
        tName.includes('cbc') ||
        tName.includes('esr') ||
        tName.includes('hemogram') ||
        tCode.includes('hem')
      );
    }
    if (cat === 'Biochemistry') {
      return (
        tCat.includes('biochemistry') ||
        tName.includes('lft') ||
        tName.includes('kft') ||
        tName.includes('liver') ||
        tName.includes('kidney') ||
        tName.includes('lipid') ||
        tCode.includes('bio')
      );
    }
    if (cat === 'Thyroid & Hormones') {
      return (
        tCat.includes('thyroid') ||
        tCat.includes('hormone') ||
        tName.includes('tsh') ||
        tName.includes('thyroid') ||
        tName.includes('t3') ||
        tName.includes('t4') ||
        tCode.includes('thy')
      );
    }
    if (cat === 'Diabetes') {
      return (
        tCat.includes('diabetes') ||
        tName.includes('hba1c') ||
        tName.includes('glucose') ||
        tName.includes('sugar') ||
        tName.includes('insulin')
      );
    }
    if (cat === 'Vitamins') {
      return (
        tCat.includes('vitamin') ||
        tName.includes('vitamin') ||
        tName.includes('d3') ||
        tName.includes('b12') ||
        tName.includes('calcium') ||
        tCode.includes('vit')
      );
    }
    if (cat === 'Urine Analysis') {
      return (
        tCat.includes('urine') ||
        tCat.includes('stool') ||
        tName.includes('urine') ||
        tName.includes('stool') ||
        tCode.includes('urn')
      );
    }
    return tCat.includes(catLower) || tName.includes(catLower);
  };

  const getTestDetails = (test: any) => {
    const name = test.name || '';
    const price = test.priceINR || 350;
    const mrp = test.mrpINR || Math.round(price * 1.85);
    const discount = Math.max(15, Math.round(((mrp - price) / mrp) * 100));
    const turnaround = test.turnaroundTime || '4-6 Hours';
    const sample = test.sampleType || 'Whole Blood (EDTA)';
    const code = test.code || 'LAB-01';

    const isFastingRequired =
      name.toLowerCase().includes('lipid') ||
      name.toLowerCase().includes('sugar') ||
      name.toLowerCase().includes('glucose') ||
      name.toLowerCase().includes('fasting') ||
      name.toLowerCase().includes('kft');

    const fastingLabel = isFastingRequired
      ? '10-12 Hours Fasting Required'
      : 'No Fasting Required (Can be given anytime)';

    const fastingDetail = isFastingRequired
      ? 'Overnight fasting for 10-12 hours is required before sample collection. Do not consume tea, coffee, milk, or breakfast. Plain drinking water is permitted.'
      : 'No fasting required. You may follow your normal dietary and medication schedule prior to sample collection.';

    let clinicalUse = test.description || 'Clinical diagnostic blood/specimen test used to assess physiological markers and detect medical conditions.';
    if (name.includes('CBC')) {
      clinicalUse = 'Complete 24-parameter automated cell counter analysis (Hemoglobin, RBC, WBC, Platelets, MCV). Essential for detecting viral/bacterial infections, anemia, fatigue, and blood disorders.';
    } else if (name.includes('HbA1c')) {
      clinicalUse = 'Gold standard 3-month average blood glucose control analysis via HPLC. Highly accurate for diabetic diagnosis, quarterly monitoring, and pre-diabetic risk evaluation.';
    } else if (name.includes('Thyroid') || name.includes('TSH')) {
      clinicalUse = 'Assesses Thyroid Stimulating Hormone (TSH), Total T3, and Total T4. Crucial for diagnosing Hypothyroidism, Hyperthyroidism, unexplained weight changes, lethargy, and hair loss.';
    } else if (name.includes('Lipid')) {
      clinicalUse = 'Measures Total Cholesterol, HDL (good cholesterol), LDL (bad cholesterol), and Triglycerides. Evaluates cardiac risk, arterial health, and blood vessel wellness.';
    } else if (name.includes('Vitamin D')) {
      clinicalUse = '25-Hydroxy Vitamin D level check essential for bone calcium absorption, joint strength, muscle wellness, and immune resistance.';
    } else if (name.includes('Vitamin B12')) {
      clinicalUse = 'Serum Cyanocobalamin evaluation vital for nervous system health, red blood cell generation, memory clarity, and preventing tingling sensations.';
    } else if (name.includes('LFT') || name.includes('Liver')) {
      clinicalUse = 'Screens liver enzymes (SGOT, SGPT, Bilirubin, Alkaline Phosphatase, Albumin) to evaluate liver health, fatty liver, jaundice, or medication load.';
    } else if (name.includes('KFT') || name.includes('Kidney')) {
      clinicalUse = 'Assesses Serum Creatinine, Blood Urea, and Uric Acid to assess kidney filtration, hydration, and renal clearance rate.';
    } else if (name.includes('Urine')) {
      clinicalUse = 'Physical, chemical, and microscopic urine screen for pus cells, RBCs, protein, sugar, and crystals. Rapidly flags Urinary Tract Infection (UTI) and kidney stones.';
    }

    const lowerName = name.toLowerCase();
    let testFor = test.testFor || '';
    if (!testFor) {
      if (lowerName.includes('cbc') || lowerName.includes('hemogram') || lowerName.includes('blood count') || lowerName.includes('esr')) {
        testFor = 'Infections, Anemia & Blood Health';
      } else if (lowerName.includes('hba1c') || lowerName.includes('sugar') || lowerName.includes('glucose') || lowerName.includes('insulin')) {
        testFor = 'Diabetes & Blood Sugar Monitoring';
      } else if (lowerName.includes('thyroid') || lowerName.includes('tsh') || lowerName.includes('t3') || lowerName.includes('t4')) {
        testFor = 'Thyroid Gland & Hormone Balance';
      } else if (lowerName.includes('lipid') || lowerName.includes('cholesterol') || lowerName.includes('triglyceride')) {
        testFor = 'Heart Health & Cholesterol Risk';
      } else if (lowerName.includes('vitamin d') || lowerName.includes('d3')) {
        testFor = 'Bone Strength & Calcium Absorption';
      } else if (lowerName.includes('vitamin b12') || lowerName.includes('b12')) {
        testFor = 'Nerve Function & Red Blood Cells';
      } else if (lowerName.includes('lft') || lowerName.includes('liver') || lowerName.includes('bilirubin') || lowerName.includes('sgot') || lowerName.includes('sgpt')) {
        testFor = 'Liver Enzymes & Hepatic Function';
      } else if (lowerName.includes('kft') || lowerName.includes('kidney') || lowerName.includes('creatinine') || lowerName.includes('urea') || lowerName.includes('uric')) {
        testFor = 'Kidney Filtration & Renal Wellness';
      } else if (lowerName.includes('urine') || lowerName.includes('urinary')) {
        testFor = 'UTI, Kidney Stones & Metabolic Check';
      } else if (lowerName.includes('iron') || lowerName.includes('ferritin') || lowerName.includes('tibc')) {
        testFor = 'Iron Deficiency & Anemia Screen';
      } else if (lowerName.includes('electrolyte') || lowerName.includes('sodium') || lowerName.includes('potassium')) {
        testFor = 'Electrolyte & Hydration Balance';
      } else if (lowerName.includes('dengue') || lowerName.includes('malaria') || lowerName.includes('widal') || lowerName.includes('typhoid')) {
        testFor = 'Fever Cause & Viral/Parasite Screen';
      } else if (lowerName.includes('calcium')) {
        testFor = 'Bone Density & Calcium Levels';
      } else if (test.category) {
        testFor = `${test.category} Diagnostic Screening`;
      } else {
        testFor = 'Clinical Diagnostic & Health Check';
      }
    }

    return {
      price,
      mrp,
      discount,
      turnaround,
      sample,
      code,
      isFastingRequired,
      fastingLabel,
      fastingDetail,
      clinicalUse,
      testFor,
    };
  };

  const handleToggleCartItem = (test: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const testId = String(test.id || test.code || test.name);
    const testPrice = test.priceINR || 350;
    const exists = cartItems.some(
      (item) => item.id === testId || item.name.toLowerCase() === test.name.toLowerCase()
    );

    if (exists) {
      setCartItems((prev) =>
        prev.filter((item) => item.id !== testId && item.name.toLowerCase() !== test.name.toLowerCase())
      );
    } else {
      const newItem = {
        id: testId,
        name: test.name,
        price: testPrice,
        code: test.code,
        category: test.category,
        sampleType: test.sampleType,
        turnaroundTime: test.turnaroundTime,
      };
      setCartItems((prev) => [...prev, newItem]);
    }
  };

  const handleRemoveFromCart = (testId: string, testName: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.id !== testId && item.name.toLowerCase() !== testName.toLowerCase())
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
    setIsCartDrawerOpen(false);
  };

  const handleProceedToBooking = () => {
    if (cartItems.length === 0) return;
    setIsCartDrawerOpen(false);
    setIsBookingModalOpen(true);
  };

  const cartTotalPrice = cartItems.reduce((acc, item) => acc + item.price, 0);

  const handleBookTestClick = (e: React.MouseEvent, test: any) => {
    e.stopPropagation();
    handleToggleCartItem(test);
  };

  const filteredTests = vendorTests.filter((test) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      test.name.toLowerCase().includes(term) ||
      (test.code && test.code.toLowerCase().includes(term)) ||
      (test.category && test.category.toLowerCase().includes(term));
    const matchesCategory =
      selectedBookTestCategory === 'All' || isTestInBookCategory(test, selectedBookTestCategory);
    return matchesSearch && matchesCategory;
  });

  const displayedTests = filteredTests.slice(0, visibleTestsCount);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addHomeCollectionBooking({
      patientName,
      mobile: mobileNumber,
      address,
      timeSlot: bookingDate,
      packageOrTest: selectedTestOrPackage,
    });
    setBookedSuccess(true);
    handleClearCart();
  };

  const handleWhatsAppBooking = (testName: string, price?: number) => {
    const text = encodeURIComponent(
      `Hello ${labName}, I would like to book "${testName}"${
        price ? ` (₹${price})` : ''
      }. Please confirm home sample collection slot.`
    );
    const cleanWa = (labWhatsapp || '7087033009').replace(/\D/g, '');
    const waNumber = cleanWa.length === 10 ? `91${cleanWa}` : cleanWa;
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
  };

  // Check if website is in Draft mode (Not Approved/Published by Admin)
  // If lab is explicitly Active or has isWebsiteApproved === true, it is LIVE and accessible!
  const isDraftOrPending = currentLabItem
    ? currentLabItem.status === 'Draft' || currentLabItem.status === 'Pending' || (currentLabItem.status !== 'Active' && !currentLabItem.isWebsiteApproved)
    : false;

  if (isDraftOrPending && !isAdminPreviewingDraft) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
              HQ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">{currentLabItem?.name || labName}</span>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Draft Mode (Pending Approval)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' ? (
              <button
                type="button"
                onClick={onOpenAdminDashboard}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>← Super Admin Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenSoftwareWebsite}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>🏠 Main Portal</span>
              </button>
            )}
          </div>
        </header>

        {/* Central Draft Lock Box - Light Theme Only */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-lg w-full bg-white border border-amber-300 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Lock Icon */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-18 h-18 rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-amber-600 shadow-inner">
                <Lock className="w-9 h-9" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-sm">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Titles & Message in English Only */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <span>⚠️ Website In Draft Mode • Pending Admin Approval</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Website In Draft Mode
              </h1>
              <p className="text-sm font-semibold text-amber-800">
                This website will not be live or accessible for visit until the Admin publishes it.
              </p>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed pt-1">
                This laboratory website was created and is currently in <strong>Draft Status</strong>. Public visit, patient bookings, and diagnostic catalog are locked until Super Admin reviews and approves it.
              </p>
            </div>

            {/* Contact Support Box */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="font-extrabold text-amber-950 flex items-center justify-center gap-1.5 text-sm">
                <Phone className="w-4 h-4 text-amber-700" />
                <span>Contact with 7087033009</span>
              </div>
              <p className="text-[11px] text-slate-600">
                For approval, verification, or administrative queries, contact central support:
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <a
                  href="tel:+917087033009"
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Call: 7087033009</span>
                </a>
                <a
                  href="https://wa.me/917087033009?text=Hello%20Admin,%20I%20need%20approval%20and%20activation%20for%20my%20laboratory%20website"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                  <span>WhatsApp: 7087033009</span>
                </a>
              </div>
            </div>

            {/* Lab Info Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Laboratory:</span>
                <span className="font-bold text-slate-900 text-right">{currentLabItem?.name || labName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Owner / City:</span>
                <span className="font-medium text-slate-700">{currentLabItem?.ownerName || 'Lab Owner'} • {currentLabItem?.city || 'India'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                  Draft (Pending Approval)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {currentUser?.role === 'admin' ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentLabItem) {
                        setVendorStatus(currentLabItem.id, 'Active');
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Approve & Publish Live Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdminPreviewingDraft(true)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
                  >
                    <Eye className="w-4 h-4 text-slate-600" />
                    <span>Preview Website Layout (ड्राफ्ट वेबसाइट प्रीव्यू देखें)</span>
                  </button>
                  <p className="text-[11px] text-slate-500">
                    Clicking "Approve" will make this website instantly live and move the laboratory to "Our Clients".
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onOpenSoftwareWebsite}
                    className="w-full bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
                  >
                    Return to Main Portal
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Shared Reusable Component: Check & Download Patient Lab Report Card
  const renderCheckReportCard = (isModal = false, onCloseModal?: () => void, cardSuffix = '') => {
    const containerId = isModal
      ? 'welcome-check-report-container'
      : cardSuffix === 'desktop'
      ? 'inline-report-display-container-desktop'
      : 'inline-report-display-container';

    const mobileInputId = isModal
      ? 'welcome-check-report-mobile-input'
      : cardSuffix === 'desktop'
      ? 'check-report-mobile-input-desktop'
      : 'check-report-mobile-input';

    const tokenInputId = isModal
      ? 'welcome-check-report-token-input'
      : cardSuffix === 'desktop'
      ? 'check-report-token-input-desktop'
      : 'check-report-token-input';

    const submitBtnId = isModal
      ? 'welcome-check-report-submit-btn'
      : cardSuffix === 'desktop'
      ? 'check-report-submit-btn-desktop'
      : 'check-report-submit-btn';

    const viewReportBtnId = isModal
      ? 'welcome-btn-view-report'
      : cardSuffix === 'desktop'
      ? 'btn-view-report-desktop'
      : 'btn-view-report';

    return (
      <div
        id={containerId}
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative"
      >
      {/* Card Top Header */}
      <div className="bg-gradient-to-r from-[#123B6D] via-[#1a4a85] to-[#0F766E] p-4 sm:p-5 text-white">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-white/10 text-amber-300 backdrop-blur-xs">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight leading-tight">
                Check &amp; Download Report
              </h3>
              <p className="text-[11px] text-slate-200 font-medium">
                Instant 10-Second Digital Report Download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[10px] font-bold text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>256-Bit Encrypted</span>
            </div>
            {isModal && onCloseModal && (
              <button
                type="button"
                onClick={onCloseModal}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Mode Pill Tabs */}
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setQuickReportTab('mobile');
              setQuickReportError('');
              setHasSubmittedSearch(false);
              setInlineSearchedReport(null);
              setInlinePendingSample(null);
              setInlineSearchNotFound(false);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              quickReportTab === 'mobile'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Search by Mobile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setQuickReportTab('report_id');
              setQuickReportError('');
              setHasSubmittedSearch(false);
              setInlineSearchedReport(null);
              setInlinePendingSample(null);
              setInlineSearchNotFound(false);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              quickReportTab === 'report_id'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Search by Token</span>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 space-y-4 text-xs bg-white">
        {/* Error Alert Banner */}
        {quickReportError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold flex-1">{quickReportError}</span>
            <button
              type="button"
              onClick={() => setQuickReportError('')}
              className="text-rose-500 hover:text-rose-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Fast Form Input Box */}
        <form onSubmit={handleQuickReportSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {quickReportTab === 'mobile'
                ? '10-Digit Registered Mobile Number'
                : 'Token Number / Report ID'} <span className="text-rose-500">*</span>
            </label>

            <div className="relative">
              {quickReportTab === 'mobile' ? (
                <>
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={quickReportInput}
                    onChange={(e) => {
                      setQuickReportInput(e.target.value.replace(/\D/g, '').slice(0, 10));
                      if (quickReportError) setQuickReportError('');
                      if (hasSubmittedSearch) setHasSubmittedSearch(false);
                    }}
                    placeholder="Enter 10-digit registered mobile"
                    className="w-full pl-11 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                    id={mobileInputId}
                    autoFocus={isModal}
                  />
                </>
              ) : (
                <>
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={quickReportInput}
                    onChange={(e) => {
                      setQuickReportInput(e.target.value);
                      if (quickReportError) setQuickReportError('');
                      if (hasSubmittedSearch) setHasSubmittedSearch(false);
                    }}
                    placeholder="Enter Token Number (e.g. 101, TK-101 or Report ID)"
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                    id={tokenInputId}
                    autoFocus={isModal}
                  />
                </>
              )}

              {quickReportInput && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickReportInput('');
                    setQuickReportError('');
                    setHasSubmittedSearch(false);
                    setInlineSearchedReport(null);
                    setInlinePendingSample(null);
                    setInlineSearchNotFound(false);
                  }}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Submit Search Button */}
          <button
            type="submit"
            className="w-full bg-[#123B6D] hover:bg-[#0c294d] text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            id={submitBtnId}
          >
            <Search className="w-4 h-4 text-amber-300" />
            <span>Search Patient Report</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </form>

        {/* REPORT STATUS ACTIONS BELOW FORM (Appears strictly according to search result) */}
        <div className="pt-3 border-t border-slate-100">
          {!hasSubmittedSearch ? (
            /* Initial state before user searches: Clean helper info, no under process button */
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-1.5 font-medium text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Enter mobile number or token above and click search to view report</span>
            </div>
          ) : inlineSearchedReport ? (
            /* Result Case 1: Report is ready & published -> View Report & Download Report buttons */
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <div className="p-2.5 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{inlineSearchedReport.patientName}</span>
                </div>
                <span className="text-[11px] bg-emerald-100 text-emerald-900 font-mono px-2 py-0.5 rounded font-bold shrink-0">
                  {inlineSearchedReport.reportId}
                </span>
              </div>

              {/* Multiple reports selector if patient has more than 1 report */}
              {inlineMultipleReports.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-500 font-bold self-center">Other Reports:</span>
                  {inlineMultipleReports.map((rpt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInlineSearchedReport(rpt)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        inlineSearchedReport.reportId === rpt.reportId
                          ? 'bg-[#123B6D] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {rpt.reportId}
                    </button>
                  ))}
                </div>
              )}

              {/* Inline Side-by-Side: View Report & Download Report */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex-1 py-3 px-3 rounded-xl bg-[#123B6D] hover:bg-[#0c294d] text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-98"
                  id={viewReportBtnId}
                >
                  <Eye className="w-4 h-4 text-amber-300" />
                  <span>View Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadInlinePdf}
                  disabled={isDownloadingPdf}
                  className="flex-1 py-3 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-98 disabled:opacity-50"
                  id={isModal ? 'welcome-btn-download-report' : 'btn-download-report'}
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>{isDownloadingPdf ? 'Preparing...' : 'Download Report'}</span>
                </button>
              </div>
            </div>
          ) : inlinePendingSample ? (
            /* Result Case 2: Sample under testing in lab -> "Report is Under Process" */
            <div className="space-y-2 animate-in fade-in duration-200">
              <button
                type="button"
                disabled
                className="w-full py-3 px-4 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-2xs cursor-not-allowed"
                id="btn-report-under-process"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Report is Under Process</span>
              </button>
              <p className="text-xs text-amber-800 text-center font-medium leading-normal">
                Sample for <strong>{inlinePendingSample.patientName}</strong> (Token #{inlinePendingSample.tokenNumber}) is currently being tested in lab.
              </p>
            </div>
          ) : (
            /* Result Case 3: Searched, but no report found in this lab */
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs text-center space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 font-bold text-rose-900 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>No Report Found in {labName}</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed max-w-sm mx-auto">
                  No patient record matches this number in <strong>{labName}</strong>. Each diagnostic laboratory maintains strictly isolated patient records. Please check your registered number or contact <strong>{labPhone}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {isModal && (
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Explore tests or book online?</span>
            <button
              type="button"
              onClick={() => {
                if (onCloseModal) onCloseModal();
                setHasEnteredWebsite(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[#123B6D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Visit Full Website</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

  // Full-Screen Diagnostic Report Preview Modal (Reusable)
  const renderReportPreviewModal = () => {
    if (!isReportModalOpen || !inlineSearchedReport) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
        onClick={() => setIsReportModalOpen(false)}
      >
        <div
          className="relative max-w-5xl w-full h-[95vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Modal Top Bar */}
          <div className="bg-[#123B6D] text-white px-4 py-3 sm:px-6 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300 font-bold shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-2">
                  <span>Diagnostic Report Preview</span>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    ✓ Verified &amp; Signed
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  {inlineSearchedReport.labName || labName} • ID: {inlineSearchedReport.reportId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Download Official PDF */}
              <button
                type="button"
                onClick={handleDownloadInlinePdf}
                disabled={isDownloadingPdf}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                id="modal-btn-download-pdf"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">{isDownloadingPdf ? 'Preparing...' : 'Download PDF'}</span>
              </button>

              {/* Print Report */}
              <button
                type="button"
                onClick={handlePrintInlineReport}
                className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/20"
                id="modal-btn-print-report"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                title="Close Report"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Paper Sheet Report Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/80 flex justify-center">
            <div className="max-w-4xl w-full bg-white shadow-xl rounded-xl p-6 sm:p-10 border border-slate-200/90 text-slate-900 space-y-6">
              {/* Report Header */}
              <div className="border-b-2 border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#123B6D] to-[#0F766E] flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                    {labName.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-[#123B6D] tracking-tight">
                      {inlineSearchedReport.labName || labName}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      {labAddress} • Phone: +91 {cleanPhone}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {vendorLabSettings?.nablAccreditationNo || 'NABL Accredited'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                        ISO 15189:2022 Certified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="inline-block px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
                    ✓ Verified Final Report
                  </div>
                  <p className="text-xs font-mono text-slate-600 font-bold">
                    Report ID: <span className="text-[#123B6D]">{inlineSearchedReport.reportId}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Sample Date: {inlineSearchedReport.sampleCollectedAt || inlineSearchedReport.reportedAt || 'Today'}
                  </p>
                </div>
              </div>

              {/* Patient Demographic Details Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Patient Name</span>
                  <span className="font-black text-slate-900 text-sm">{inlineSearchedReport.patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Age / Gender</span>
                  <span className="font-bold text-slate-800">{inlineSearchedReport.ageGender || `${inlineSearchedReport.mobile ? 'Adult' : '-'}`}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Referring Doctor</span>
                  <span className="font-bold text-slate-800">{inlineSearchedReport.doctor || 'Self / Walk-in'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">UHID / Barcode</span>
                  <span className="font-mono font-bold text-[#123B6D]">{inlineSearchedReport.uhid || inlineSearchedReport.tokenNumber || inlineSearchedReport.reportId}</span>
                </div>
              </div>

              {/* Test Investigation Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#123B6D] text-white uppercase text-[10px] font-black tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Investigation / Parameter</th>
                      <th className="py-3 px-4 text-center">Result</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Biological Ref. Range</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inlineSearchedReport.items.map((item, idx) => {
                      const isAbnormal = Boolean(item.isAbnormal);
                      return (
                        <tr
                          key={idx}
                          className={isAbnormal ? 'bg-amber-50/60 font-medium' : 'hover:bg-slate-50/80 transition'}
                        >
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            <div>{item.testName}</div>
                            {item.parameter && item.parameter !== item.testName && (
                              <div className="text-[11px] font-normal text-slate-500">{item.parameter}</div>
                            )}
                          </td>
                          <td className={`py-2.5 px-4 text-center font-black text-sm ${isAbnormal ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {item.result}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 font-medium">
                            {item.unit || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                            {item.referenceRange || 'Standard'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {isAbnormal ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                ATTENTION
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                NORMAL
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Clinical Impression & Notes */}
              {inlineSearchedReport.clinicalImpression && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-800 space-y-1">
                  <span className="font-bold text-[#123B6D] text-xs uppercase tracking-wider block">Clinical Impression / Note:</span>
                  <p className="leading-relaxed text-slate-700">{inlineSearchedReport.clinicalImpression}</p>
                </div>
              )}

              {/* Pathologist Verification & Signature */}
              <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Digitally Verified &amp; Signed</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    This is an authenticated electronic clinical pathology report.
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-block p-2 rounded-lg bg-slate-50 border border-slate-200 mb-1">
                    <span className="font-serif italic font-black text-slate-800 text-sm tracking-wide">
                      {inlineSearchedReport.pathologist || 'Dr. Rohit Sharma, MD'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {inlineSearchedReport.pathologist || 'Consultant Pathologist'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Reg No: DMC/R/18429 • MD Pathology
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* 3. Modal Bottom Action Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Close Preview
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintInlineReport}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Report</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadInlinePdf}
                disabled={isDownloadingPdf}
                className="px-5 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0c294d] text-white font-bold text-xs transition flex items-center gap-2 shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 1. ISOLATED FIRST SCREEN GATEWAY (Pure Welcome Screen - No Scrolling into Website)
  // Shown exclusively until user clicks "Visit Website", "Book Test", or "Check Report"
  if (!hasEnteredWebsite) {
    return (
      <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950 font-sans">
        <LabWelcomeFirstScreen
          labName={labName}
          labShopId={labShopId}
          labLogoUrl={labLogoUrl}
          labNabl={labNabl}
          labAddress={labAddress}
          labPhone={labPhone}
          backgroundImageUrl={vendorLabSettings?.heroBackgroundImageUrl}
          onVisitWebsite={() => {
            setHasEnteredWebsite(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBookTest={() => {
            setHasEnteredWebsite(true);
            setSelectedTestOrPackage(
              vendorPackages[0] ? `${vendorPackages[0].name} (₹${vendorPackages[0].priceINR})` : 'Full Body Health Checkup (₹999)'
            );
            setIsBookingModalOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onCheckReport={() => {
            setIsWelcomeReportModalOpen(true);
          }}
          onStaffLogin={() => openLoginModal('vendor')}
          onOpenSoftwareWebsite={onOpenSoftwareWebsite}
        />

        {/* Check Report Modal for Welcome Page: Exact Same Design as Website Check Report Section */}
        {isWelcomeReportModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsWelcomeReportModalOpen(false);
            }}
          >
            <div className="w-full max-w-xl sm:max-w-2xl my-auto animate-in zoom-in-95 duration-200">
              {renderCheckReportCard(true, () => setIsWelcomeReportModalOpen(false))}
            </div>
          </div>
        )}

        {/* Full-Screen Diagnostic Report Preview Modal */}
        {renderReportPreviewModal()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans selection:bg-[#123B6D]/15 selection:text-[#123B6D]">
      {/* Super Admin Website Live Control & Status Banner */}
      {currentUser?.role === 'admin' && (
        <div className="bg-slate-950 text-white px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
              Super Admin Mode
            </span>
            <span className="text-slate-300">
              Previewing Lab Website: <strong className="text-white">{labName}</strong>
            </span>
            {currentLabItem?.status === 'Draft' ? (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Status: DRAFT (Pending Approval)</span>
              </span>
            ) : (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Status: LIVE (Approved & Active)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentLabItem && (currentLabItem.status !== 'Active' || !currentLabItem.isWebsiteApproved) && (
              <button
                type="button"
                onClick={() => {
                  setVendorStatus(currentLabItem.id, 'Active');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Website (Make Live)</span>
              </button>
            )}

            {currentLabItem && currentLabItem.status !== 'Draft' && (
              <button
                type="button"
                onClick={() => {
                  setVendorStatus(currentLabItem.id, 'Draft');
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Move to Draft</span>
              </button>
            )}

            {onOpenAdminDashboard && (
              <button
                type="button"
                onClick={onOpenAdminDashboard}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-slate-700"
              >
                <span>← Back to Super Admin Dashboard</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSoftwareWebsite}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Go to IndianLalaji.com Home Portal"
            >
              <span>🏠 Main Portal Home</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Lab Header */}
      <header id="main-website-header" className="sticky top-0 bg-white border-b border-slate-200 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Lab Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 sm:gap-3 text-left cursor-pointer group min-w-0"
              id="vendor-header-logo-btn"
            >
              {labLogoUrl ? (
                <img
                  src={labLogoUrl}
                  alt={labName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shadow-2xs group-hover:scale-105 transition shrink-0"
                />
              ) : (
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-xl bg-[#123B6D] text-white flex items-center justify-center font-black text-xs xs:text-sm sm:text-lg shadow-2xs group-hover:scale-105 transition shrink-0">
                  <span className="text-amber-400">{labName.charAt(0) || 'A'}</span>
                  <span>{labName.split(' ')[1]?.charAt(0) || 'L'}</span>
                </div>
              )}
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <div className="overflow-hidden w-full max-w-[125px] xs:max-w-[165px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[380px]">
                  {React.createElement(
                    'marquee',
                    {
                      direction: 'left',
                      scrollamount: '4',
                      behavior: 'scroll',
                      className: 'text-xs xs:text-sm sm:text-base lg:text-lg font-black tracking-tight text-[#123B6D] leading-tight block whitespace-nowrap'
                    },
                    labName.toUpperCase()
                  )}
                </div>
                <div className="text-[9px] xs:text-[10px] sm:text-[11px] text-slate-500 font-semibold tracking-wide flex items-center gap-1 whitespace-nowrap mt-0.5">
                  <span className="hidden xs:inline">ID:</span>
                  <span className="font-mono font-bold text-[#123B6D] bg-slate-100 px-1 py-0.2 rounded text-[9px] xs:text-[10px] border border-slate-200">
                    {labShopId}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links: Balanced & Clean */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs lg:text-sm font-semibold text-slate-700 whitespace-nowrap">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-[#123B6D] transition cursor-pointer text-[#123B6D] font-bold whitespace-nowrap py-1"
              id="vendor-nav-home"
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => scrollToVendorSection('packages')}
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1 cursor-pointer"
              id="vendor-nav-packages"
            >
              Packages
            </button>

            <button
              type="button"
              onClick={() => scrollToVendorSection('tests')}
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1 cursor-pointer"
              id="vendor-nav-tests"
            >
              Tests
            </button>

            <button
              type="button"
              onClick={() => scrollToVendorSection('booking')}
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1 cursor-pointer"
              id="vendor-nav-booking"
            >
              Booking
            </button>

            <button
              type="button"
              onClick={() => scrollToVendorSection('about')}
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1 cursor-pointer"
              id="vendor-nav-about"
            >
              About
            </button>

            {Boolean(effectiveTeamDoctors && effectiveTeamDoctors.length > 0) && (
              <button
                type="button"
                onClick={() => scrollToVendorSection('team')}
                className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1 cursor-pointer"
                id="vendor-nav-team"
              >
                Team
              </button>
            )}

            <button
              type="button"
              onClick={() => scrollToVendorSection('contact')}
              className="hover:text-[#123B6D] transition text-slate-700 hover:font-bold whitespace-nowrap py-1 cursor-pointer"
              id="vendor-nav-contact"
            >
              Contact
            </button>
          </nav>

          {/* Action Items: Mobile (Report + Test + Menu) | Desktop (QR + Report + Test + Login) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Desktop Payment QR Button */}
            <button
              onClick={() => setIsPaymentQrModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition cursor-pointer shadow-2xs shrink-0"
              id="header-payment-qr-btn"
              title="Scan Lab Payment QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Payment QR</span>
            </button>

            {/* 1. Report Button (Scrolls directly to Check & Download section on same page) */}
            <button
              onClick={() => {
                const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
                const el = document.getElementById(
                  isDesktop ? 'check-report-section-desktop' : 'check-report-section'
                ) || document.getElementById('check-report-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  handleCheckReport();
                }
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-300/90 font-bold text-xs transition cursor-pointer shadow-2xs shrink-0 active:scale-95"
              id="header-download-report-btn"
              title={`Check or Download Patient Lab Report for ${labName}`}
            >
              <FileText className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
              <span className="hidden sm:inline">Report</span>
              <span className="sm:hidden text-[11px]">Report</span>
            </button>

            {/* 2. Test Button (Scrolls to Lab Test & Health Booking Form Section) */}
            <button
              onClick={() => {
                const el = document.getElementById('lab-test-health-booking');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setSelectedTestOrPackage(
                    vendorPackages[0] ? `${vendorPackages[0].name} (₹${vendorPackages[0].priceINR})` : 'Full Body Health Checkup (₹999)'
                  );
                  setIsBookingModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-2xs shrink-0 active:scale-95"
              id="header-book-test-btn"
              title="Book Lab Test & Health Booking"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>Test</span>
            </button>

            {/* 3. Menu Icon (Hamburger: opens Side Drawer on Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 xs:p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 lg:hidden transition cursor-pointer shrink-0"
              aria-label="Open Navigation Menu Drawer"
              id="header-mobile-menu-btn"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>
          </div>
        </div>

        {/* Mobile Slide-Over Side Drawer with all 9 links & actions */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-over Drawer Panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
              <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
                {/* Drawer Header */}
                <div className="px-5 py-4 bg-[#123B6D] text-white flex items-center justify-between border-b border-blue-900/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {labLogoUrl ? (
                      <img
                        src={labLogoUrl}
                        alt={labName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                        <span className="text-amber-400">{labName.charAt(0) || 'A'}</span>
                        <span>{labName.split(' ')[1]?.charAt(0) || 'L'}</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-sm text-white truncate leading-tight">
                        {labName}
                      </span>
                      <span className="text-[10px] text-blue-200 font-mono">
                        ID: {labShopId}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                    aria-label="Close Navigation Drawer"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Scrollable Navigation Links (Home, Packages, Tests, About, Team, Contact) - Clean Text Only, Zero Icons */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 text-sm font-semibold text-slate-700">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">
                    Navigation Menu
                  </div>

                  {/* 1. Home */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold cursor-pointer"
                  >
                    Home
                  </button>

                  {/* 2. Packages */}
                  <button
                    type="button"
                    onClick={() => scrollToVendorSection('packages')}
                    className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold cursor-pointer"
                  >
                    Packages
                  </button>

                  {/* 3. Tests */}
                  <button
                    type="button"
                    onClick={() => scrollToVendorSection('tests')}
                    className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold cursor-pointer"
                  >
                    Tests Directory
                  </button>

                  {/* 3b. Lab Test & Health Booking */}
                  <button
                    type="button"
                    onClick={() => scrollToVendorSection('booking')}
                    className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold cursor-pointer"
                  >
                    Book Test Online
                  </button>

                  {/* 4. About */}
                  <button
                    type="button"
                    onClick={() => scrollToVendorSection('about')}
                    className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold cursor-pointer"
                  >
                    About Us
                  </button>

                  {/* 5. Team */}
                  {Boolean(effectiveTeamDoctors && effectiveTeamDoctors.length > 0) && (
                    <button
                      type="button"
                      onClick={() => scrollToVendorSection('team')}
                      className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold cursor-pointer"
                    >
                      Team (Pathologists)
                    </button>
                  )}

                  {/* 6. Contact */}
                  <button
                    type="button"
                    onClick={() => scrollToVendorSection('contact')}
                    className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold cursor-pointer"
                  >
                    Contact &amp; Location
                  </button>

                  {/* Home Screen Shortcut & Visit Website QR Buttons in Drawer */}
                  <div className="pt-2 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsDownloadAppModalOpen(true);
                      }}
                      className="w-full text-left py-2.5 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition text-xs font-bold cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <BookmarkPlus className="w-4 h-4 text-emerald-600" />
                        <span>Home Screen Shortcut</span>
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black">
                        1-Tap Add
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsWebsiteQrModalOpen(true);
                      }}
                      className="w-full text-left py-2.5 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition text-xs font-bold cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-indigo-600" />
                        <span>Visit Website QR</span>
                      </span>
                      <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-black">
                        Live QR
                      </span>
                    </button>

                    {/* Payment QR Button in Drawer */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsPaymentQrModalOpen(true);
                      }}
                      className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-amber-50 text-amber-900 border border-amber-200 transition text-xs font-bold cursor-pointer flex items-center justify-between"
                    >
                      <span>Lab Payment QR Code (UPI)</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-black">
                        UPI
                      </span>
                    </button>
                  </div>
                </div>

                {/* Drawer Footer Actions (Staff Login, T&C, Call Support) */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2.5">
                  {/* Staff Login - Text Only */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openLoginModal('vendor');
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold text-xs flex items-center justify-between shadow-xs transition cursor-pointer"
                  >
                    <span>Staff Login (Admin / Tech / Rec)</span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black">
                      Portal
                    </span>
                  </button>

                  {/* Terms & Conditions Modal Opener - Text Only */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsTermsModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <span>Terms &amp; Conditions (T&amp;C)</span>
                    <span className="text-slate-400 text-xs font-bold">View →</span>
                  </button>

                  {/* Call Helpline Direct */}
                  <a
                    href={`tel:${cleanPhone}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs"
                  >
                    Call Lab Helpline: +91 {cleanPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: 2-Column Layout matching indianlalaji.com Homepage Hero   */}
      {/* ========================================================================= */}
      <section id="hero-section" className="relative overflow-hidden bg-[#F8FAFC] pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-slate-200 scroll-mt-20">
        {/* Subtle Background Radial Gradients */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Two-Column Grid: Left Content | Right Simple Plain Image Carousel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* ========================================================
                LEFT SIDE: Content, Highlights & CTAs
                ======================================================== */}
            <div className="lg:col-span-6 space-y-6">
              {/* Trust Badge with Live Pulse */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#123B6D]/10 border border-[#123B6D]/15 text-[#123B6D] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {vendorLabSettings?.tagline || `NABL Accredited • Since ${labEstablishedYear} • ${labName}`}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] leading-[1.18] lg:leading-[1.12] font-black text-[#123B6D] tracking-tight">
                {vendorLabSettings?.heroPromoText || 'Fast, Accurate & Reliable Diagnostics for Your Entire Family'}
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-[540px]">
                {vendorLabSettings?.description ||
                  'Experience same-day digital lab reports on WhatsApp, 100% automated barcoded testing, certified pathologist approval, and free doorstep home sample collection.'}
              </p>

              {/* Key Lab Benefits Checklist - Left-Right 2 Columns on Mobile & Desktop */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-1">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Same-Day Reports</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Online WhatsApp Reports</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Barcoded Analyzers</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="leading-tight sm:leading-normal">Doorstep Home Collection</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  id="vendor-hero-btn-book"
                  onClick={() => {
                    setSelectedTestOrPackage(
                      vendorPackages[0]
                        ? `${vendorPackages[0].name} (₹${vendorPackages[0].priceINR})`
                        : 'Full Body Health Checkup (₹999)'
                    );
                    setIsBookingModalOpen(true);
                  }}
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Book Health Checkup</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  id="vendor-hero-btn-report"
                  onClick={() => {
                    const el = document.getElementById('check-report-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white hover:bg-slate-50 text-[#123B6D] border border-slate-300 px-6 py-3.5 rounded-xl font-bold text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <FileText className="w-4 h-4 text-[#0F766E]" />
                  <span>Check &amp; Download Report</span>
                </button>

                <a
                  href={`tel:+91${cleanPhone}`}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#123B6D] px-2 py-1.5 transition"
                  title="Call Lab Helpline"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>+91 {labPhone}</span>
                </a>
              </div>
            </div>

            {/* ========================================================
                RIGHT SIDE: Simple Plain Image Carousel
                ======================================================== */}
            <div className="lg:col-span-6 relative">
              <div
                className="group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 bg-white"
                onMouseEnter={() => setIsHeroPaused(true)}
                onMouseLeave={() => setIsHeroPaused(false)}
              >
                {/* Plain Image Canvas */}
                <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-slate-100 select-none">
                  {heroBannersList.map((bannerUrl, index) => {
                    const isActive = index === activeHeroBanner;
                    return (
                      <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out cursor-pointer ${
                          isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                        onClick={() => {
                          setSelectedTestOrPackage(
                            vendorPackages[0]
                              ? `${vendorPackages[0].name} (₹${vendorPackages[0].priceINR})`
                              : 'Full Body Health Checkup (₹999)'
                          );
                          setIsBookingModalOpen(true);
                        }}
                      >
                        <img
                          src={bannerUrl}
                          alt={`${labName} Showcase ${index + 1}`}
                          className="w-full h-full object-cover object-center"
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                      </div>
                    );
                  })}

                  {/* Subtle Prev / Next Navigation Arrows */}
                  {heroBannersList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveHeroBanner(
                            (prev) => (prev === 0 ? heroBannersList.length - 1 : prev - 1)
                          );
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-sm border border-slate-200/80 flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95 cursor-pointer opacity-70 group-hover:opacity-100"
                        aria-label="Previous Image"
                      >
                        <ChevronLeft className="w-5 h-5 text-slate-700" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveHeroBanner((prev) => (prev + 1) % heroBannersList.length);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-sm border border-slate-200/80 flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95 cursor-pointer opacity-70 group-hover:opacity-100"
                        aria-label="Next Image"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-700" />
                      </button>
                    </>
                  )}

                  {/* Admin Banner Edit Trigger */}
                  {(currentUser?.role === 'vendor' || currentUser?.role === 'admin') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBannerManagerOpen(true);
                      }}
                      className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm text-xs font-bold transition cursor-pointer shadow-md"
                      title="Edit Carousel Photos"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                      <span>Edit Banners</span>
                    </button>
                  )}
                </div>

                {/* Clean Dot Indicators Below Image */}
                <div className="py-3 bg-white flex items-center justify-center gap-2 border-t border-slate-100">
                  {heroBannersList.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveHeroBanner(index)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        index === activeHeroBanner
                          ? 'w-7 bg-[#123B6D]'
                          : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CHECK & DOWNLOAD PATIENT LAB REPORT (Full-width section directly below hero) */}
      {/* ========================================================================= */}
      <section id="check-report-section" className="py-12 sm:py-16 bg-gradient-to-b from-[#F8FAFC] via-slate-50 to-white border-b border-slate-200 scroll-mt-20">
        <span id="check-report-quick" className="sr-only" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold mb-3">
              <FileText className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Instant Lab Report Access</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
              {vendorLabSettings?.reportCheckTitle || 'Check & Download Patient Lab Report'}
            </h2>
            <p className="text-sm text-[#64748B] mt-2">
              {vendorLabSettings?.reportCheckSubtitle ||
                'Access your verified diagnostic reports directly using your registered mobile number or Token Number.'}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {renderCheckReportCard(false, undefined, '')}
          </div>
        </div>
      </section>

      {/* SECTION 3: HEALTH PACKAGES (with Booking Button & Peek Carousel) */}
      <div id="packages-section" className="scroll-mt-24" />
      <section id="packages" className="py-16 bg-white border-b border-slate-200 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-bold mb-3">
              <span>{vendorLabSettings?.packagesBadge || 'Preventive Health Packages'}</span>
            </div>

            {/* Mobile View Title & Subtitle */}
            <div className="md:hidden">
              <h2 className="text-2xl font-extrabold text-[#123B6D] tracking-tight">
                {vendorLabSettings?.packagesTitle || 'Comprehensive Health Checkups for Complete Wellness'}
              </h2>
              {Boolean(vendorLabSettings?.packagesSubtitle) && (
                <p className="text-sm text-[#64748B] mt-1.5 font-medium">
                  {vendorLabSettings?.packagesSubtitle}
                </p>
              )}
            </div>

            {/* Desktop View Title & Subtitle */}
            <div className="hidden md:block">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
                {vendorLabSettings?.packagesTitle || 'Comprehensive Health Checkups for Complete Wellness'}
              </h2>
              {Boolean(vendorLabSettings?.packagesSubtitle) && (
                <p className="text-sm text-[#64748B] mt-2">
                  {vendorLabSettings?.packagesSubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Curated Package Image Helper */}
          {(() => {
            const getPackageImg = (p: typeof vendorPackages[0], index: number) => {
              if (p.imageUrl) return p.imageUrl;
              const name = (p.name || '').toLowerCase();
              if (name.includes('diabet') || name.includes('sugar')) {
                return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80';
              }
              if (name.includes('senior') || name.includes('elder') || name.includes('cardiac') || name.includes('heart')) {
                return 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1000&q=80';
              }
              if (name.includes('women') || name.includes('female') || name.includes('hormon')) {
                return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80';
              }
              const curated = [
                'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1000&q=80',
              ];
              return curated[index % curated.length];
            };

            return (
              <div className="max-w-6xl mx-auto">
                {/* Desktop View: Grid */}
                <div
                  className={`hidden md:grid gap-6 lg:gap-8 items-stretch justify-center ${
                    safeVendorPackages.length === 1
                      ? 'grid-cols-1 max-w-md mx-auto'
                      : safeVendorPackages.length === 2
                      ? 'grid-cols-2 max-w-3xl mx-auto'
                      : 'grid-cols-3 max-w-6xl mx-auto'
                  }`}
                >
                  {safeVendorPackages.slice(0, 3).map((pkg, idx) => {
                    const pkgImageUrl = getPackageImg(pkg, idx);
                    const pkgFeatures = Array.isArray(pkg.features) ? pkg.features : [];
                    const pkgTestsCount = pkg.testsCount || pkgFeatures.length || 0;

                    return (
                      <div
                        key={pkg.id || idx}
                        className="bg-white rounded-3xl border border-slate-200/90 hover:border-[#123B6D]/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group relative w-full"
                      >
                        {/* Package Cover Image */}
                        <div className="relative w-full h-48 sm:h-52 bg-slate-100 overflow-hidden shrink-0 group/cover">
                          <img
                            src={pkgImageUrl}
                            alt={pkg.name}
                            className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />

                          {/* Popular Badge */}
                          {(pkg.isPopular || idx === 0) && (
                            <div className="absolute top-3 left-3 bg-[#F59E0B] text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                              Most Popular
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-5 sm:p-6 flex flex-col flex-1">
                          <h3 className="text-base sm:text-lg font-black text-[#123B6D] leading-snug mb-2">
                            {pkg.name}
                          </h3>

                          {Boolean(pkg.description) && (
                            <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                              {pkg.description}
                            </p>
                          )}

                          {/* List of Tests */}
                          <div className="space-y-2 mb-4">
                            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                              <span>Included Tests:</span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {pkgTestsCount} Tests
                              </span>
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {pkgFeatures.map((feat, fIdx) => (
                                <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span className="font-medium text-slate-700">{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Uske neeche inline 2 buttons: Price aur Book Test */}
                          <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5 mt-auto shrink-0">
                            <div className="px-3.5 py-2.5 rounded-xl bg-blue-50/90 border border-blue-200 text-[#123B6D] font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-2xs">
                              ₹{pkg.priceINR}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTestOrPackage(`${pkg.name} (₹${pkg.priceINR})`);
                                setIsBookingModalOpen(true);
                              }}
                              className="flex-1 bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                            >
                              <span>Book Test</span>
                              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile View: 1 Package = 100% width, 2+ Packages = 90% card with 10% peek & swipe */}
                <div className="block md:hidden">
                  {safeVendorPackages.length === 1 ? (
                    /* 1 Package: Full screen width (100%) */
                    <div className="w-full">
                      {(() => {
                        const pkg = safeVendorPackages[0];
                        const pkgImageUrl = getPackageImg(pkg, 0);
                        const pkgFeatures = Array.isArray(pkg.features) ? pkg.features : [];
                        const pkgTestsCount = pkg.testsCount || pkgFeatures.length || 0;
                        return (
                          <div
                            key={pkg.id || 0}
                            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden relative w-full"
                          >
                            <div className="relative w-full h-48 bg-slate-100 overflow-hidden shrink-0 group/cover">
                              <img
                                src={pkgImageUrl}
                                alt={pkg.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />
                              <div className="absolute top-3 left-3 bg-[#F59E0B] text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                Most Popular
                              </div>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                              <div>
                                <h3 className="text-base font-black text-[#123B6D] leading-snug mb-1.5">
                                  {pkg.name}
                                </h3>
                                {Boolean(pkg.description) && (
                                  <p className="text-xs text-slate-500 mb-2.5 line-clamp-2 leading-relaxed">
                                    {pkg.description}
                                  </p>
                                )}
                                <div className="space-y-2 mb-3">
                                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Included Tests:</span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {pkgTestsCount} Tests
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {pkgFeatures.map((feat, fIdx) => (
                                      <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span className="font-medium text-slate-700">{feat}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5 mt-auto">
                                <div className="px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#123B6D] font-black text-base shadow-2xs">
                                  ₹{pkg.priceINR}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTestOrPackage(`${pkg.name} (₹${pkg.priceINR})`);
                                    setIsBookingModalOpen(true);
                                  }}
                                  className="flex-1 bg-[#123B6D] text-white py-2.5 px-3 rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
                                >
                                  <span>Book Test</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : safeVendorPackages.length > 1 ? (
                    /* 2+ Packages: First card 90% width, next card 10% visible on right. Horizontal swipe & click navigation enabled. */
                    <div className="relative">
                      <div
                        ref={packagesCarouselRef}
                        className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2 -mx-4 px-4 scroll-smooth touch-pan-x"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          WebkitOverflowScrolling: 'touch',
                        }}
                        onScroll={(e) => {
                          const el = e.currentTarget;
                          const scrollLeft = el.scrollLeft;
                          const cardWidth = el.offsetWidth * 0.88;
                          if (cardWidth > 0) {
                            const idx = Math.min(
                              safeVendorPackages.length - 1,
                              Math.max(0, Math.round(scrollLeft / cardWidth))
                            );
                            if (idx !== activeMobilePkgIndex) {
                              setActiveMobilePkgIndex(idx);
                            }
                          }
                        }}
                      >
                        {safeVendorPackages.map((pkg, idx) => {
                          const pkgImageUrl = getPackageImg(pkg, idx);
                          const pkgFeatures = Array.isArray(pkg.features) ? pkg.features : [];
                          const pkgTestsCount = pkg.testsCount || pkgFeatures.length || 0;
                          return (
                            <div
                              key={pkg.id || idx}
                              className="w-[88vw] shrink-0 snap-start bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden relative"
                            >
                              {/* Package Cover Image */}
                              <div className="relative w-full h-44 bg-slate-100 overflow-hidden shrink-0 group/cover">
                                <img
                                  src={pkgImageUrl}
                                  alt={pkg.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />

                                {/* Popular Badge */}
                                {(pkg.isPopular || idx === 0) && (
                                  <div className="absolute top-3 left-3 bg-[#F59E0B] text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                                    Most Popular
                                  </div>
                                )}
                              </div>

                              {/* Card Content */}
                              <div className="p-4 sm:p-5 flex flex-col flex-1">
                                <h3 className="text-base font-black text-[#123B6D] leading-snug mb-1.5">
                                  {pkg.name}
                                </h3>

                                {Boolean(pkg.description) && (
                                  <p className="text-xs text-slate-500 mb-2.5 line-clamp-2 leading-relaxed">
                                    {pkg.description}
                                  </p>
                                )}

                                <div className="space-y-2 mb-3">
                                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Included Tests:</span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {pkgTestsCount} Tests
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {pkgFeatures.map((feat, fIdx) => (
                                      <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span className="font-medium text-slate-700">{feat}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-auto shrink-0">
                                  <div className="px-3 py-2 rounded-xl bg-blue-50/90 border border-blue-200 text-[#123B6D] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                    ₹{pkg.priceINR}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTestOrPackage(`${pkg.name} (₹${pkg.priceINR})`);
                                      setIsBookingModalOpen(true);
                                    }}
                                    className="flex-1 bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2 px-3 rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                                  >
                                    <span>Book Test</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile Swipe Pagination Dots & Scroll Controls */}
                      <div className="flex items-center justify-between mt-3 px-1">
                        <div className="flex items-center gap-1.5">
                          {safeVendorPackages.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              type="button"
                              onClick={() => {
                                const el = packagesCarouselRef.current;
                                if (el) {
                                  const cardW = el.offsetWidth * 0.88;
                                  el.scrollTo({ left: dotIdx * cardW, behavior: 'smooth' });
                                  setActiveMobilePkgIndex(dotIdx);
                                }
                              }}
                              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                activeMobilePkgIndex === dotIdx
                                  ? 'w-6 bg-[#123B6D]'
                                  : 'w-2 bg-slate-300 hover:bg-slate-400'
                              }`}
                              aria-label={`Scroll to package ${dotIdx + 1}`}
                            />
                          ))}
                        </div>

                        {/* Prev & Next Click Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleScrollPackages('left')}
                            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
                            aria-label="Previous package"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {activeMobilePkgIndex + 1}/{vendorPackages.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleScrollPackages('right')}
                            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
                            aria-label="Next package"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* SECTION 4: ONLINE PATHOLOGY TESTS SECTION (Search Bar + Category Tabs + Desktop Grid + Show More) */}
      <section id="book-test-section" className="py-16 bg-[#F8FAFC] border-b border-slate-200 scroll-mt-20 relative">
        <span id="test-directory" className="absolute -top-20 left-0 invisible pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold mb-2">
              <FlaskConical className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{vendorLabSettings?.testsBadge || 'Diagnostic Tests & Profiles'}</span>
            </div>

            {/* Mobile View Title & Subtitle */}
            <div className="md:hidden">
              <h2 className="text-2xl font-extrabold text-[#123B6D] tracking-tight">
                {vendorLabSettings?.testsTitle || 'Explore Lab Tests'}
              </h2>
              {Boolean(vendorLabSettings?.testsSubtitle !== undefined ? vendorLabSettings.testsSubtitle : true) && (
                <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
                  {vendorLabSettings?.testsSubtitle || 'Affordable Diagnostic Tests for Your Better Health'}
                </p>
              )}
            </div>

            {/* Desktop View Title & Subtitle */}
            <div className="hidden md:block">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
                {vendorLabSettings?.testsTitle || 'Book Pathology Tests Online'}
              </h2>
              {Boolean(vendorLabSettings?.testsSubtitle !== undefined ? vendorLabSettings.testsSubtitle : true) && (
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  {vendorLabSettings?.testsSubtitle || 'Search tests by name with transparent rates, specimen requirements, and home collection.'}
                </p>
              )}
            </div>
          </div>

          {/* 1. TOP SEARCH BAR (Unchanged) */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVisibleTestsCount(isMobileScreen ? 20 : 40);
                }}
                placeholder="Search test by name (e.g., CBC, HbA1c, Thyroid, Lipid, Vitamin D, Urine, LFT)..."
                className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-2xl border-2 border-slate-200 focus:border-[#123B6D] focus:ring-4 focus:ring-[#123B6D]/10 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold shadow-xs transition-all outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setVisibleTestsCount(isMobileScreen ? 20 : 40);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results Summary (only shown when user types in search bar) */}
          {searchTerm && (
            <div className="flex items-center justify-between px-1 mb-4 text-xs font-semibold text-slate-500">
              <span>
                Search results for &ldquo;<strong className="text-[#123B6D]">{searchTerm}</strong>&rdquo;
              </span>
              <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                {displayedTests.length} tests found
              </span>
            </div>
          )}

          {/* 2. RESPONSIVE GRID (Mobile: 2 tests per row | Desktop: 4 per row) */}
          {displayedTests.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
              {displayedTests.map((test, idx) => {
                const details = getTestDetails(test);
                const testIdentifier = String(test.id || test.code || test.name);
                const isItemInCart = cartItems.some(
                  (ci) =>
                    ci.id === testIdentifier ||
                    ci.name.toLowerCase() === test.name.toLowerCase()
                );
                return (
                  <div
                    key={test.id || `test-${idx}`}
                    onClick={() => setSelectedTestInfoModal(test)}
                    className={`bg-white rounded-xl sm:rounded-2xl border transition-all p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer group relative ${
                      isItemInCart
                        ? 'border-emerald-500/80 shadow-md ring-1 ring-emerald-400/30'
                        : 'border-slate-200 hover:border-[#123B6D]/50 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Test Name: maximum 2 lines */}
                      <h4 className="font-black text-xs sm:text-sm text-[#123B6D] line-clamp-2 leading-tight sm:leading-snug group-hover:text-blue-700 transition mb-1 min-h-[2rem] sm:min-h-[2.4rem]">
                        {test.name}
                      </h4>

                      {/* Test For: 1-2 lines */}
                      <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        <span className="font-bold text-slate-700">Test For:</span> {details.testFor}
                      </p>
                    </div>

                    {/* Single Price & Cart (+) Icon in ONE single line (no sale price / MRP) */}
                    <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm sm:text-base font-black text-[#123B6D]">₹{details.price}</span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleCartItem(test, e)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer group/btn ${
                          isItemInCart
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/60 shadow-sm scale-105'
                            : 'bg-[#123B6D] hover:bg-[#0e2c52] text-white'
                        }`}
                        title={isItemInCart ? 'Cart mein added hai (Click to remove)' : 'Add to Multi-Cart'}
                      >
                        {isItemInCart ? (
                          <Check className="w-4 h-4 text-white stroke-[2.5] animate-in zoom-in-50 duration-150" />
                        ) : (
                          <div className="relative flex items-center justify-center">
                            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 group-hover/btn:scale-110 transition-transform" />
                            <span className="absolute -top-1 -right-1.5 bg-emerald-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[9px] font-black leading-none shadow-2xs">
                              +
                            </span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <h4 className="font-extrabold text-base text-slate-800">No Tests Found</h4>
              <p className="text-xs text-slate-500">
                No pathology tests matched &ldquo;<strong>{searchTerm}</strong>&rdquo;. Try searching for CBC, Sugar, Thyroid, LFT, or contact our diagnostic helpline.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedBookTestCategory('All');
                  setVisibleTestsCount(isMobileScreen ? 20 : 40);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Clear Search &amp; Filters
              </button>
            </div>
          )}

          {/* 3. SHOW MORE BUTTON (Mobile: 20 initially / Desktop: 40 initially, Show More button if more available) */}
          {filteredTests.length > visibleTestsCount && (
            <div className="mt-8 sm:mt-10 text-center">
              <button
                type="button"
                onClick={() => setVisibleTestsCount((prev) => prev + (isMobileScreen ? 20 : 40))}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <span>Show More Tests ({filteredTests.length - visibleTestsCount} More Available)</span>
                <ChevronDown className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION: LAB TEST & HEALTH BOOKING SECTION (Directly Below "Book Pathology Tests Online") */}
      <section id="lab-test-health-booking" className="py-14 sm:py-20 bg-gradient-to-b from-[#F8FAFC] via-slate-50 to-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold mb-2.5">
              <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{vendorLabSettings?.bookingBadge || 'Diagnostic Test & Health Booking'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
              {vendorLabSettings?.bookingTitle || 'Lab Test & Health Booking'}
            </h2>
            {Boolean(vendorLabSettings?.bookingSubtitle !== undefined ? vendorLabSettings.bookingSubtitle : true) && (
              <p className="text-xs sm:text-sm text-[#64748B] mt-1.5">
                {vendorLabSettings?.bookingSubtitle || 'Fill the details below to book pathology tests with optional home sample collection or direct branch visit.'}
              </p>
            )}
          </div>

          {/* Section me Sirf center me Form hoga */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-3xl">
              <HeroBookingForm
                onOpenReportPortal={() => handleCheckReport()}
                cartItems={cartItems}
                onBookingSuccess={handleClearCart}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: ABOUT US SECTION (with Founder / Director Image & Lab Story) */}
      <section id="about" className="py-16 sm:py-20 bg-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          {/* Top Title & Accreditation Badges */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            {/* Accreditation Badge (Desktop only, hidden on mobile) */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{vendorLabSettings?.aboutBadgeText || 'Trusted & Accredited Diagnostic Laboratory'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#123B6D] tracking-tight">
              {vendorLabSettings?.aboutTitle || 'About Our Laboratory & Medical Leadership'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              {vendorLabSettings?.aboutSubtitle || `Serving patients, referring physicians, and hospital networks with uncompromising diagnostic precision, automated pathology, and compassionate care since ${vendorLabSettings?.establishedYear || currentLabItem?.establishedYear || 2012}.`}
            </p>
          </div>

          {/* Main 2-Column Grid: Lab Story & Legacy + Founder / Director Profile Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left 7 Columns: Lab Story & Clinical Heritage */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-blue-100 text-[#123B6D] flex items-center justify-center font-black text-sm">
                    🏛️
                  </span>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 leading-snug">
                      Our Journey &amp; Legacy of Clinical Excellence
                    </h3>
                    <span className="text-xs font-semibold text-[#0F766E]">
                      Trusted Laboratory &amp; Diagnostic Pathology Services
                    </span>
                  </div>
                </div>

                {/* About Us Paragraphs (Max 5 lines on mobile unless expanded, full on desktop) */}
                <div className={`space-y-3.5 transition-all duration-300 ${isAboutExpanded ? '' : 'line-clamp-5 sm:line-clamp-none'}`}>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {vendorLabSettings?.aboutStory || (
                      <>
                        Founded with a singular dedication to diagnostic excellence, <strong>{labName}</strong> bridges the gap between modern clinical science and patient-centered healthcare. From routine health panels to specialized diagnostic assays, our laboratory is trusted by families, clinicians, and medical networks.
                      </>
                    )}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    We operate in strict compliance with <strong>ISO 15189:2022</strong> and <strong>NABL (National Accreditation Board for Testing and Calibration Laboratories)</strong> standards (Accreditation No: <span className="font-mono font-bold text-[#123B6D]">{labNabl}</span>). Every specimen undergoes rigorous multi-tier internal quality controls (IQC) and participating International External Quality Assessment Schemes (EQAS).
                  </p>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {vendorLabSettings?.aboutHeritage || (
                      <>
                        Equipped with advanced fully-automated biochemistry analyzers, 5-part hematology counters, and bidirectionally interfaced barcode systems, we maintain sample integrity and deliver verified digital reports on time.
                      </>
                    )}
                  </p>
                </div>

                {/* Mobile Read More / Read Less Link */}
                <div className="sm:hidden pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                    className="text-[#123B6D] hover:text-blue-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer py-1 underline underline-offset-2"
                  >
                    <span>{isAboutExpanded ? 'Read Less' : 'Read More'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAboutExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Founder / Medical Director Profile Card */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="h-full bg-gradient-to-b from-[#F8FAFC] to-white rounded-3xl border-2 border-slate-200/90 hover:border-[#123B6D]/40 p-6 sm:p-7 shadow-lg flex flex-col justify-between relative group transition-all">
                {/* Director Badge */}
                <div className="absolute -top-3.5 right-6 bg-[#123B6D] text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>{vendorLabSettings?.founderDesignation || 'Chief Medical Director & Founder'}</span>
                </div>

                <div className="space-y-5">
                  {/* Photo & Identity Header */}
                  <div className="flex items-center gap-4 pt-1">
                    {/* Founder Real Photo or Clean Isolated Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md bg-slate-100 flex items-center justify-center">
                        {vendorLabSettings?.founderPhotoUrl ? (
                          <img
                            src={vendorLabSettings.founderPhotoUrl}
                            alt={vendorLabSettings?.founderName || 'Founder & Chief Medical Director'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-indigo-100 to-teal-100 flex items-center justify-center text-indigo-700 font-black text-2xl select-none">
                            {(vendorLabSettings?.founderName || 'MD').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" title="Verified Pathologist">
                        ✓
                      </span>
                    </div>

                    {/* Name, Degrees, AIIMS Gold Medalist */}
                    <div className="space-y-1 min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F766E] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{vendorLabSettings?.founderBadge || 'AIIMS Gold Medalist'}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-[#123B6D] leading-tight truncate">
                        {vendorLabSettings?.founderName || 'Dr. R. K. Sharma'}
                      </h3>
                      <div className="text-xs font-bold text-slate-800">
                        {vendorLabSettings?.founderDegrees || 'MBBS, MD (Pathology)'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {vendorLabSettings?.founderExperience || 'Chief Pathologist • 18+ Years Clinical Experience'}
                      </div>
                    </div>
                  </div>

                  {/* Founder's Message & Resolution */}
                  <div className="relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                    <span className="text-3xl text-blue-200 font-serif absolute -top-3 left-3 select-none pointer-events-none">
                      &ldquo;
                    </span>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#123B6D] flex items-center gap-1.5 pt-1">
                      <span>Message from Chief Medical Director</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-line">
                      &ldquo;{vendorLabSettings?.founderMessage || 'A pathology report is not merely numbers on paper; a doctor relies on it to prescribe life-saving medicine, and a patient trusts it with their health. At our laboratory, our sacred commitment is diagnostic accuracy, uncompromising sample purity, and delivering every report with complete transparency.'}&rdquo;
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-[#123B6D]">
                        — {vendorLabSettings?.founderName || 'Dr. R. K. Sharma'}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {vendorLabSettings?.founderDesignation?.split('&')[0]?.trim() || 'Consultant Pathologist'}
                      </span>
                    </div>
                  </div>

                  {/* Clinical Credentials List */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {(vendorLabSettings?.founderCredentials || [
                      'MD Pathology from AIIMS • Senior Resident Ex-Fellow',
                      'Fellow of Indian College of Pathologists (FICP)',
                      'Lead Auditor for NABL / ISO 15189 Quality Systems',
                    ]).map((cred, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{cred}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: QUALIFIED TEAM SECTION (Pathologists, Biochemists & Senior Lab Technicians) */}
      {Boolean(effectiveTeamDoctors && effectiveTeamDoctors.length > 0) && (
        <>
          <div id="team" className="scroll-mt-24" />
          <section id="doctors" className="py-14 sm:py-20 bg-[#F8FAFC] border-b border-slate-200 scroll-mt-24">
          <div className="max-w-4xl sm:max-w-6xl mx-auto px-4 sm:px-6">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              {/* Desktop Badge */}
              <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/80 text-[#123B6D] text-xs font-black mb-3 border border-blue-200/80 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                <span>{vendorLabSettings?.doctorsBadge || 'Qualified Clinical & Laboratory Team'}</span>
              </div>

              {/* Mobile View Title & Subtitle */}
              <div className="block sm:hidden">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#123B6D] text-xs font-black mb-2.5 border border-blue-200/80">
                  <Users className="w-3.5 h-3.5 text-blue-700" />
                  <span>{vendorLabSettings?.doctorsBadge || 'Medical Team'}</span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#123B6D] tracking-tight">
                  {vendorLabSettings?.doctorsTitle || 'Our Medical & Laboratory Experts'}
                </h2>
                {Boolean(vendorLabSettings?.doctorsSubtitle !== undefined ? vendorLabSettings.doctorsSubtitle : true) && (
                  <p className="text-sm text-slate-600 mt-1.5 font-medium">
                    {vendorLabSettings?.doctorsSubtitle || 'Qualified Clinical & Laboratory Team'}
                  </p>
                )}
              </div>

              {/* Desktop View Title & Subtitle */}
              <div className="hidden sm:block">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
                  {vendorLabSettings?.doctorsTitle || 'Our Medical & Laboratory Experts'}
                </h2>
                {Boolean(vendorLabSettings?.doctorsSubtitle !== undefined ? vendorLabSettings.doctorsSubtitle : true) && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {vendorLabSettings?.doctorsSubtitle || 'Experienced Pathologists, Biochemists & Senior Technicians ensuring accurate diagnostics and timely reports.'}
                  </p>
                )}
              </div>
            </div>

            {/* Laboratory Diagnostic Team Group Photo Banner */}
            {vendorLabSettings?.teamGroupPhotoUrl && (
              <div className="mt-4 mb-8 max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 relative group">
                <img
                  src={vendorLabSettings.teamGroupPhotoUrl}
                  alt={`${vendorLabSettings.labName || 'Laboratory'} Diagnostic Team`}
                  referrerPolicy="no-referrer"
                  className="w-full h-48 sm:h-64 md:h-72 object-cover object-center group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                      Clinical Diagnostic Team
                    </span>
                    <span className="text-xs text-white/90 font-medium">
                      100% NABL Quality Assured
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-black text-white">
                    {vendorLabSettings.labName} Diagnostic Medical Team
                  </h3>
                  <p className="text-xs text-slate-200 line-clamp-1 sm:line-clamp-none mt-0.5">
                    Pathologists, Biochemists, Microbiologists &amp; Senior Technologists dedicated to accurate patient testing.
                  </p>
                </div>
              </div>
            )}

            {(() => {
              const doctorsList = effectiveTeamDoctors;
              if (!doctorsList || doctorsList.length === 0) return null;

            const renderDoctorCard = (doc: any, idx: number, isMobile: boolean, isSingle: boolean) => {
              // Doctor values with robust fallbacks
              const docName = doc.name || 'Medical Specialist';
              const docQualification = doc.qualification || doc.degrees || 'MBBS, MD (Pathology)';
              const docSpeciality =
                doc.specialization ||
                doc.specialty ||
                doc.specialExpertise ||
                doc.designation ||
                doc.roleCategory ||
                'Clinical Pathology & Diagnostics';

              // Clean experience for side badge
              const docExp = doc.experience || '';
              const expMatch = docExp.match(/(\d+\+?\s*(?:years?|yrs?))/i);
              const cleanExp = expMatch
                ? `${expMatch[1]} Exp`
                : docExp
                ? docExp.length > 15
                  ? docExp.split('•').pop()?.trim() || docExp
                  : docExp
                : '';

              // Fallback image based on role
              let fallbackImg = '/src/assets/images/team_pathologist_woman_1790345423035.jpg';
              if (doc.roleCategory === 'Biochemist' || docSpeciality.toLowerCase().includes('biochem')) {
                fallbackImg = '/src/assets/images/team_biochemist_1790345449541.jpg';
              } else if (doc.roleCategory === 'Phlebotomist' || docSpeciality.toLowerCase().includes('phlebotom')) {
                fallbackImg = '/src/assets/images/team_phlebotomist_1790345465190.jpg';
              } else if (doc.roleCategory === 'Technician' || docSpeciality.toLowerCase().includes('technic')) {
                fallbackImg = '/src/assets/images/team_technologist_1790345481173.jpg';
              } else if (doc.roleCategory === 'Receptionist' || docSpeciality.toLowerCase().includes('reception') || docSpeciality.toLowerCase().includes('front desk')) {
                fallbackImg = '/src/assets/images/team_pathologist_woman_1790345423035.jpg';
              } else if (idx === 0) {
                fallbackImg = '/src/assets/images/founder_pathologist_1790345211989.jpg';
              }
              const displayImage = doc.imageUrl || fallbackImg;

              return (
                <div
                  key={doc.id || idx}
                  className={`bg-white rounded-2xl border border-slate-200 hover:border-[#123B6D]/40 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative ${
                    isMobile
                      ? isSingle
                        ? 'w-full shrink-0'
                        : 'w-[80%] min-w-[80%] shrink-0 snap-start'
                      : ''
                  }`}
                >
                  {/* Top: Photo, Name & Experience Side Badge */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* 1. Image */}
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-2xs group-hover:border-[#123B6D] transition-colors bg-slate-100">
                          <img
                            src={displayImage}
                            alt={docName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <span
                          className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black border-2 border-white shadow-2xs"
                          title="Verified Specialist"
                        >
                          ✓
                        </span>
                      </div>

                      {/* 2. Name */}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-sm sm:text-base text-[#123B6D] leading-snug group-hover:text-blue-700 transition">
                          {docName}
                        </h3>
                      </div>
                    </div>

                    {/* 5. Experience (Side me chhota sa badge) */}
                    {cleanExp && (
                      <span className="shrink-0 text-[10px] sm:text-[11px] font-bold text-[#123B6D] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap mt-0.5">
                        ⏱️ {cleanExp}
                      </span>
                    )}
                  </div>

                  {/* Bottom: 3. Qualification + 4. Speciality */}
                  <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
                    {/* Qualification */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-400 font-medium shrink-0">Qualification:</span>
                      <span className="font-bold text-slate-800 break-words">
                        {docQualification}
                      </span>
                    </div>

                    {/* Speciality */}
                    <div className="flex items-baseline gap-1.5 text-[#0F766E]">
                      <span className="text-slate-400 font-medium shrink-0">Speciality:</span>
                      <span className="font-bold text-[#0F766E] break-words">
                        {docSpeciality}
                      </span>
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <div className="w-full flex justify-center">
                <div className="w-full max-w-3xl sm:max-w-none">
                  {/* Desktop View: Grid (Unchanged) */}
                  <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {doctorsList.map((doc, idx) => renderDoctorCard(doc, idx, false, false))}
                  </div>

                  {/* Mobile View: 1 Member = 100% width, 2+ Members = 80% card with 20% peek & swipe */}
                  <div className="block sm:hidden w-full">
                    {doctorsList.length === 1 ? (
                      /* 1 Team Member: Full screen width (100% of container, same as form) */
                      <div className="w-full">
                        {renderDoctorCard(doctorsList[0], 0, true, true)}
                      </div>
                    ) : doctorsList.length > 1 ? (
                      /* 2+ Team Members: First card 80% width, next card 20% visible on right. Horizontal swipe enabled. */
                      <div className="w-full relative">
                        <div
                          ref={teamCarouselRef}
                          className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 scroll-smooth touch-pan-x"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch',
                          }}
                          onScroll={(e) => {
                            const el = e.currentTarget;
                            const scrollLeft = el.scrollLeft;
                            const cardWidth = el.offsetWidth * 0.8;
                            if (cardWidth > 0) {
                              const idx = Math.min(
                                doctorsList.length - 1,
                                Math.max(0, Math.round(scrollLeft / cardWidth))
                              );
                              if (idx !== activeMobileDoctorIndex) {
                                setActiveMobileDoctorIndex(idx);
                              }
                            }
                          }}
                        >
                          {doctorsList.map((doc, idx) => renderDoctorCard(doc, idx, true, false))}
                        </div>

                        {/* Mobile Swipe Pagination Dots & Scroll Controls */}
                        <div className="flex items-center justify-between mt-3 px-1">
                          <div className="flex items-center gap-1.5">
                            {doctorsList.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                type="button"
                                onClick={() => {
                                  const el = teamCarouselRef.current;
                                  if (el) {
                                    const cardW = el.offsetWidth * 0.8;
                                    el.scrollTo({ left: dotIdx * cardW, behavior: 'smooth' });
                                    setActiveMobileDoctorIndex(dotIdx);
                                  }
                                }}
                                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                  activeMobileDoctorIndex === dotIdx
                                    ? 'w-6 bg-[#123B6D]'
                                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                                }`}
                                aria-label={`Scroll to team member ${dotIdx + 1}`}
                              />
                            ))}
                          </div>

                          {/* Prev & Next Click Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleScrollTeam('left')}
                              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
                              aria-label="Previous team member"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {activeMobileDoctorIndex + 1}/{doctorsList.length}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleScrollTeam('right')}
                              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
                              aria-label="Next team member"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>
      </>
      )}

      {/* 9. Minimal Contact Us Section */}
      <section id="contact" className="py-12 sm:py-16 bg-white border-b border-slate-200 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header (Center-aligned on mobile and desktop) */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold mb-2.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Get In Touch</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123B6D] tracking-tight">
              {vendorLabSettings?.contactTitle || 'Contact Us'}
            </h2>
            {Boolean(vendorLabSettings?.contactSubtitle !== undefined ? vendorLabSettings.contactSubtitle : true) && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {vendorLabSettings?.contactSubtitle || 'Connect with our laboratory desk or submit an inquiry form below.'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Side: 5 Minimal Contact Lines */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5">
              {/* 1. Line: WhatsApp Number (may be multi) */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Number</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    {whatsappNumberList.map((num, idx) => {
                      const clean = num.replace(/\D/g, '');
                      return (
                        <a
                          key={idx}
                          href={`https://wa.me/91${clean}?text=${encodeURIComponent(`Hello ${labName}, I would like to inquire about tests & services.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                        >
                          <span>+91 {num}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Line: Call Number (maybe multi) */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B6D] border border-blue-200/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Call Number</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    {callNumberList.map((num, idx) => {
                      const clean = num.replace(/\D/g, '');
                      return (
                        <a
                          key={idx}
                          href={`tel:+91${clean}`}
                          className="text-xs sm:text-sm font-bold text-[#123B6D] hover:underline inline-flex items-center gap-1"
                        >
                          <span>+91 {num}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Line: Email ID */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email ID</span>
                  <a
                    href={`mailto:${labEmail}`}
                    className="text-xs sm:text-sm font-bold text-slate-800 hover:text-[#123B6D] hover:underline mt-0.5 block break-all"
                  >
                    {labEmail}
                  </a>
                </div>
              </div>

              {/* 4. Line: Address in text only (not google location) */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5 leading-relaxed">
                    {labAddress}
                  </p>
                </div>
              </div>

              {/* 5. Line: Social Media Small Icons (Only show channels where a valid link is entered) */}
              {vendorLabSettings?.socialMedia?.enabled !== false && hasAnySocialLinks && (
                <div className="flex items-start gap-3.5 pt-3 border-t border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Social Media</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {socialWhatsappUrl && (
                        <a
                          href={socialWhatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                          className="w-7 h-7 rounded-full bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialFacebookUrl && (
                        <a
                          href={socialFacebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Facebook"
                          className="w-7 h-7 rounded-full bg-white hover:bg-blue-50 text-[#1877F2] border border-slate-200 hover:border-blue-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Facebook className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialInstagramUrl && (
                        <a
                          href={socialInstagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Instagram"
                          className="w-7 h-7 rounded-full bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialTwitterUrl && (
                        <a
                          href={socialTwitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Twitter / X"
                          className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-400 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Twitter className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialYoutubeUrl && (
                        <a
                          href={socialYoutubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="YouTube"
                          className="w-7 h-7 rounded-full bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Youtube className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialLinkedinUrl && (
                        <a
                          href={socialLinkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="LinkedIn"
                          className="w-7 h-7 rounded-full bg-white hover:bg-sky-50 text-[#0A66C2] border border-slate-200 hover:border-sky-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Form (name, phone, subject, message) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
              <h3 className="text-base sm:text-lg font-bold text-[#123B6D] mb-1">
                Send Us a Message
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Leave your details below and our diagnostic coordinator will assist you.
              </p>

              {contactSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950">Message Sent Successfully!</h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      Thank you, <span className="font-bold">{contactName}</span>. Your message regarding{' '}
                      <span className="font-semibold">"{contactSubject || 'General Inquiry'}"</span> has been received.
                    </p>
                    <p className="text-[11px] font-mono text-emerald-700 mt-1">
                      Reference Token: {contactRefId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactName('');
                      setContactPhone('');
                      setContactEmail('');
                      setContactSubject('');
                      setContactMessage('');
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 underline cursor-pointer pt-1 block mx-auto"
                  >
                    Submit Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5">
                  {contactError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{contactError}</span>
                    </div>
                  )}

                  {/* Row 1: Name + Phone: Inline (50% each) on mobile and desktop */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                    {/* 1. Name (50%) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full pl-8 pr-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                        />
                      </div>
                    </div>

                    {/* 2. Phone (50%) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="text-xs font-bold text-slate-400 absolute left-2.5 top-2 select-none">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="98765 43210"
                          className="w-full pl-9 pr-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Email + Subject: Inline (50% each) on mobile and desktop */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                    {/* 3. Email (50%) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="name@email.com"
                          className="w-full pl-8 pr-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                        />
                      </div>
                    </div>

                    {/* 4. Subject (50%) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="e.g. Test Inquiry"
                        className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
                      />
                    </div>
                  </div>

                  {/* Row 3: Message: Full-width textarea with 2 visible lines */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={2}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Write your message or inquiry..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D] resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full bg-[#123B6D] hover:bg-[#0e2f57] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-75 active:scale-99"
                  >
                    {contactSubmitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-amber-400" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* IndianLalaji Infinite Loop Marquee - Just Before Vendor Footer */}
      <IndianLalajiMarquee theme="light" labName={labName} labId={labShopId} />

      {/* 10. Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Footer — 5 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 text-xs text-slate-600">
            {/* Column 1: Lab Brand Profile (Lab Name + Lab ID Number) */}
            <div className="space-y-3 sm:col-span-2 lg:col-span-1">
              {/* Lab ka Name */}
              <div>
                <span className="font-extrabold text-[#123B6D] text-sm sm:text-base block leading-snug">
                  {labName}
                </span>

                {/* Uske Niche Lab ID Number */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold border border-slate-200 shadow-2xs">
                    Lab ID: {labShopId}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Advanced automated laboratory offering reliable diagnostic testing and comprehensive clinical pathology services, supported by modern technology, efficient processes, and quality-focused laboratory practices.
                </p>

                {/* Social Media Links in Footer */}
                {vendorLabSettings?.socialMedia?.enabled !== false && hasAnySocialLinks && (
                  <div className="pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Connect With Us</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {socialWhatsappUrl && (
                        <a
                          href={socialWhatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialFacebookUrl && (
                        <a
                          href={socialFacebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Facebook"
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-blue-50 text-[#1877F2] border border-slate-200 hover:border-blue-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Facebook className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialInstagramUrl && (
                        <a
                          href={socialInstagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Instagram"
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialTwitterUrl && (
                        <a
                          href={socialTwitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Twitter / X"
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 hover:border-slate-400 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Twitter className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialYoutubeUrl && (
                        <a
                          href={socialYoutubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="YouTube"
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Youtube className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialLinkedinUrl && (
                        <a
                          href={socialLinkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="LinkedIn"
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-sky-50 text-[#0A66C2] border border-slate-200 hover:border-sky-300 flex items-center justify-center transition shadow-2xs hover:scale-105"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Main Menu */}
            <div>
              <h4 className="font-extrabold text-[#123B6D] mb-4 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>Main Menu</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('top') || document.getElementById('main-website-header');
                      el ? el.scrollIntoView({ behavior: 'smooth' }) : window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-[#123B6D] hover:font-bold transition cursor-pointer text-slate-600 text-left"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToVendorSection('packages')}
                    className="hover:text-[#123B6D] hover:font-bold transition text-slate-600 block text-left cursor-pointer"
                  >
                    Packages
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToVendorSection('tests')}
                    className="hover:text-[#123B6D] hover:font-bold transition text-slate-600 block text-left cursor-pointer"
                  >
                    Tests
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToVendorSection('about')}
                    className="hover:text-[#123B6D] hover:font-bold transition text-slate-600 block text-left cursor-pointer"
                  >
                    About Us
                  </button>
                </li>
                {Boolean(effectiveTeamDoctors && effectiveTeamDoctors.length > 0) && (
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToVendorSection('team')}
                      className="hover:text-[#123B6D] hover:font-bold transition text-slate-600 block text-left cursor-pointer"
                    >
                      Team
                    </button>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToVendorSection('contact')}
                    className="hover:text-[#123B6D] hover:font-bold transition text-slate-600 block text-left cursor-pointer"
                  >
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Quick Access */}
            <div>
              <h4 className="font-extrabold text-[#123B6D] mb-4 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>Quick Access</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => handleCheckReport()}
                    className="hover:text-[#123B6D] text-teal-700 font-bold flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Download Report</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    id="btn-footer-home-screen-shortcut"
                    onClick={() => setIsDownloadAppModalOpen(true)}
                    className="hover:text-[#123B6D] text-emerald-700 font-bold flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Home Screen Shortcut</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                      1-Tap Add
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    id="btn-footer-visit-website"
                    onClick={() => setIsWebsiteQrModalOpen(true)}
                    className="hover:text-[#123B6D] text-indigo-700 font-bold flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Visit website</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-mono font-bold border border-indigo-200">
                      QR
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsPaymentQrModalOpen(true)}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Lab Payment UPI QR</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Policy */}
            <div>
              <h4 className="font-extrabold text-[#123B6D] mb-4 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>Legal &amp; Policy</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('terms')}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Terms &amp; Conditions</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('privacy')}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openPolicyModal('refund')}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Refund &amp; Cancellation Policy</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 5: Login / Portal */}
            <div>
              <h4 className="font-extrabold text-[#123B6D] mb-4 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>Login / Portal</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={handleOpenAdmin}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    <span>Lab Admin Login</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleOpenReception}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
                    <span>Reception Login</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleOpenTechnician}
                    className="hover:text-[#123B6D] hover:font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer text-left transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                    <span>Technician Login</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>


          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span>© {new Date().getFullYear()} {labName}. All Rights Reserved.</span>
            </div>
            <div className="flex items-center gap-2 font-medium flex-wrap">
              <span>Powered by</span>
              <a
                href="https://indianlalaji.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#123B6D] hover:underline font-black"
              >
                indianlalaji.com
              </a>
              <span className="text-slate-300">|</span>
              <a
                href="tel:7087033009"
                className="text-[#123B6D] hover:underline font-black inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 px-2.5 py-1 rounded-md transition border border-slate-200"
              >
                <Phone className="w-3.5 h-3.5 text-[#123B6D]" />
                <span>7087033009</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Payment QR Modal */}
      {isPaymentQrModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 relative shadow-2xl border border-slate-100 flex flex-col items-center text-center">
            <button
              onClick={() => setIsPaymentQrModalOpen(false)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close Payment QR Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-600">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-black text-[#123B6D] leading-tight">
                  {labName}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Official UPI Payment QR
                </p>
              </div>
            </div>

            {/* Dynamic Amount Selector & Inputs */}
            {(() => {
              const cleanUpi =
                vendorLabSettings?.upiId1 ||
                (vendorLabSettings as any)?.upiId ||
                'apexlab@icici';
              const cleanMerchant = vendorLabSettings?.merchantName || labName;
              const cleanNote = websitePatientRef.trim()
                ? `Test Bill - ${websitePatientRef.trim()}`
                : `Test Bill - ${labName}`;
              const dynamicWebsiteUpiUri = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanMerchant)}&am=${websiteDynamicAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
              const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(dynamicWebsiteUpiUri)}`;

              return (
                <div className="w-full space-y-3 mt-2">
                  {/* Dynamic Amount Badge */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between text-left">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                        Pre-Filled Dynamic Amount
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        ₹{websiteDynamicAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Auto Filled</span>
                    </span>
                  </div>

                  {/* Preset Amount Chips & Custom Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Select or Enter Test Bill Amount (₹)
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[200, 500, 1000, 2500].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setWebsiteDynamicAmount(preset)}
                          className={`py-1 px-2 rounded-lg text-xs font-black transition cursor-pointer border ${
                            websiteDynamicAmount === preset
                              ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          ₹{preset}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="1"
                          max="200000"
                          value={websiteDynamicAmount}
                          onChange={(e) => setWebsiteDynamicAmount(Math.max(1, Number(e.target.value) || 0))}
                          className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                          placeholder="Amount"
                        />
                      </div>
                      <input
                        type="text"
                        value={websitePatientRef}
                        onChange={(e) => setWebsitePatientRef(e.target.value)}
                        placeholder="Token / Name (Optional)"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 w-full flex flex-col items-center">
                    <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                      <img
                        src={dynamicQrUrl}
                        alt="Dynamic UPI Payment QR Code"
                        className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                      />
                    </div>

                    {/* Merchant and UPI ID Details */}
                    <div className="mt-2 text-center w-full">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {cleanMerchant}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Shop ID: <span className="font-mono font-bold text-[#123B6D]">{labShopId}</span>
                      </div>

                      {/* 1-Click Copy UPI Bar */}
                      <div className="mt-2 flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs w-full">
                        <div className="truncate font-mono font-bold text-slate-700 text-[11px]">
                          {cleanUpi}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(cleanUpi);
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 transition shrink-0 cursor-pointer"
                        >
                          {copiedUpi ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy UPI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Deep Link */}
                  <a
                    href={dynamicWebsiteUpiUri}
                    className="w-full py-2.5 px-3 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Pay ₹{websiteDynamicAmount.toLocaleString('en-IN')} on UPI App</span>
                  </a>

                  {/* Supported UPI Apps Strip */}
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-semibold">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">GPay</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">PhonePe</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">Paytm</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">BHIM</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">Any UPI</span>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Scanning automatically sets ₹{websiteDynamicAmount} in your Google Pay, PhonePe, or Paytm app.
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsPaymentQrModalOpen(false)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2-Step Online Test Booking Modal (Step 1: Test & Form, Step 2: QR / Pay at Branch) */}
      <OnlineTestBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialSelection={selectedTestOrPackage}
        initialTests={
          cartItems.length > 0
            ? cartItems.map((ci) => ({ name: ci.name, price: ci.price, type: 'test' as const }))
            : undefined
        }
        onOpenReportPortal={handleCheckReport}
        onBookingSuccess={handleClearCart}
      />

      {/* Terms & Conditions / Privacy / Refund Policy Modal */}
      <VendorPolicyModal
        isOpen={isPolicyModalOpen || isTermsModalOpen}
        onClose={() => {
          setIsPolicyModalOpen(false);
          setIsTermsModalOpen(false);
        }}
        activeTab={policyModalTab}
        onSelectTab={setPolicyModalTab}
        labName={labName}
        labPhone={labPhone}
        labEmail={labEmail}
        customTerms={vendorLabSettings?.termsAndConditions}
        customPrivacy={vendorLabSettings?.privacyPolicy}
        customRefund={vendorLabSettings?.refundPolicy}
      />

      {/* Home Screen Shortcut Modal (Android & iOS with Step-by-Step 1-Tap Add Guide) */}
      <HomeScreenShortcutModal
        isOpen={isDownloadAppModalOpen}
        onClose={handleCloseDownloadAppModal}
        labName={labName}
        labId={effectiveSlug}
        websiteDirectUrl={websiteDirectUrl}
      />

      {/* Visit Website QR Modal */}
      {isWebsiteQrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="website-qr-modal-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setIsWebsiteQrModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 relative shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsWebsiteQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close Visit Website QR Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 id="website-qr-modal-title" className="text-base font-extrabold text-slate-900 leading-tight mb-1">
              Visit Website (Official Lab QR)
            </h3>
            <p className="text-xs text-slate-500 mb-4 line-clamp-1">
              {labName}
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 shadow-inner flex flex-col items-center">
              <img
                src={websiteQrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrWebsiteUrl)}`}
                alt={`${labName} Website QR`}
                className="w-48 h-48 rounded-xl object-contain bg-white p-2 border border-slate-200 shadow-xs"
              />
              <span className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                Scan to open vendor lab website page
              </span>
            </div>

            <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200 mb-4 flex items-center justify-between text-xs font-mono text-slate-700">
              <span className="truncate pr-2 select-all font-bold text-[#123B6D]">{qrWebsiteUrl}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(qrWebsiteUrl);
                  setCopiedWebsiteUrl(true);
                  setTimeout(() => setCopiedWebsiteUrl(false), 2000);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
              >
                {copiedWebsiteUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebsiteUrl ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 text-xs">
              <a
                href={qrWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                <span>Visit Website</span>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Visit ${labName} Official Website: ${qrWebsiteUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share QR</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Test Information & Fasting Preparation Modal */}
      {selectedTestInfoModal && (() => {
        const details = getTestDetails(selectedTestInfoModal);
        const testIdentifier = String(
          selectedTestInfoModal.id || selectedTestInfoModal.code || selectedTestInfoModal.name
        );
        const isItemInCart = cartItems.some(
          (ci) =>
            ci.id === testIdentifier ||
            ci.name.toLowerCase() === selectedTestInfoModal.name.toLowerCase()
        );

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="test-info-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedTestInfoModal(null)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Name only (no test icon or short code) */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                <h2 id="test-info-modal-title" className="text-base sm:text-lg font-black text-slate-900 leading-tight pr-4">
                  {selectedTestInfoModal.name}
                </h2>

                <button
                  type="button"
                  onClick={() => setSelectedTestInfoModal(null)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-lg font-bold transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body: Preparation & Uses */}
              <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
                {/* Preparation */}
                <div className={`p-4 rounded-2xl border ${
                  details.isFastingRequired
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold text-xs uppercase tracking-wider mb-1">
                    Preparation: {details.isFastingRequired ? '10-12 Hours Fasting' : 'No Fasting Required'}
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {details.fastingDetail}
                  </p>
                </div>

                {/* Uses */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Clinical Significance &amp; Uses:</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {details.clinicalUse}
                  </p>
                </div>
              </div>

              {/* Footer: Inline Do Button (Price and + Cart Icon) */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[#123B6D] font-black text-base sm:text-lg flex items-center justify-center shrink-0">
                  ₹{details.price}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleCartItem(selectedTestInfoModal)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 ${
                    isItemInCart
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#123B6D] hover:bg-[#0e2c52] text-white'
                  }`}
                >
                  {isItemInCart ? (
                    <>
                      <Check className="w-4 h-4 text-white stroke-[2.5]" />
                      <span>Added in Cart (Remove)</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 text-amber-400" />
                      <span>+ Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Admin Hero Banner Upload & Management Modal */}
      {isBannerManagerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-manager-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setIsBannerManagerOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-[#123B6D] to-[#1E4E8C] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h2 id="banner-manager-modal-title" className="text-base font-extrabold leading-tight">
                    Manage Hero Photo Banners (Admin)
                  </h2>
                  <p className="text-[11px] text-blue-100">
                    Upload photos from your computer/phone or enter image web links
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBannerManagerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Notice Banner */}
              {bannerSaveNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{bannerSaveNotice}</span>
                </div>
              )}

              {/* Upload Input Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Device File Upload */}
                <div
                  className="p-4 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 transition text-center flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  onClick={() => bannerFileInputRef.current?.click()}
                >
                  <input
                    ref={bannerFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#123B6D] flex items-center justify-center shadow-2xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#123B6D] block">
                      Upload from Computer / Mobile
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Supports JPG, PNG, WebP (Max 5MB)
                    </span>
                  </div>
                </div>

                {/* 2. Web Image URL Input */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Or Paste Image URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      value={newBannerInputUrl}
                      onChange={(e) => setNewBannerInputUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBannerUrl();
                        }
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#123B6D]"
                    />
                    <button
                      type="button"
                      onClick={handleAddBannerUrl}
                      disabled={!newBannerInputUrl.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[#123B6D] text-white text-xs font-bold hover:bg-[#0e2c52] disabled:opacity-50 transition cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Recommended dimension: 1600×700 or 1200×600
                  </span>
                </div>
              </div>

              {/* Current Banners Grid Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Current Active Banners ({tempBannersList.length})</span>
                  <button
                    type="button"
                    onClick={handleResetDefaultBanners}
                    className="text-[#0F766E] hover:underline cursor-pointer text-[11px]"
                  >
                    Reset to Default Images
                  </button>
                </div>

                {tempBannersList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                    No banners added. Please upload at least one photo banner.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tempBannersList.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[16/9] shadow-2xs"
                      >
                        <img
                          src={url}
                          alt={`Banner ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white font-mono text-[10px] font-bold">
                          #{idx + 1}
                        </div>

                        {/* Banner Management Overlay Controls: Move Left, Move Right, Delete */}
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveBanner(idx, 'prev')}
                              className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                              title="Move Banner Left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < tempBannersList.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveBanner(idx, 'next')}
                              className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                              title="Move Banner Right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveBanner(idx)}
                            className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                            title="Remove this banner photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsBannerManagerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveBanners}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save &amp; Publish Banners</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Floating Side Capsule Cart Button (Small & Compact in Footer Corner) */}
      {cartItems.length > 0 && !isBookingModalOpen && (
        <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#123B6D] hover:bg-[#0e2c52] text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all border border-white/30 cursor-pointer group"
            title={`View Cart (${cartItems.length} Tests • ₹${cartTotalPrice})`}
          >
            <div className="relative flex items-center">
              <ShoppingCart className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none shadow-xs">
                {cartItems.length}
              </span>
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-amber-300">
              ₹{cartTotalPrice}
            </span>
            <span className="text-[11px] font-bold text-blue-100">
              Cart
            </span>
          </button>
        </div>
      )}

      {/* AI Voice Bot / Voice Command – Vendor Website */}
      <VendorAiVoiceBot
        currentLabItem={currentLabItem}
        vendorLabSettings={vendorLabSettings}
        vendorTests={safeVendorTests}
        vendorPackages={safeVendorPackages}
        vendorDoctors={effectiveTeamDoctors}
        allReports={allReports}
        allReceptionEntries={allReceptionEntries}
        currentWebsiteLabId={currentWebsiteLabId}
        onOpenReportPortal={(reportId, mobile) => handleCheckReport(reportId, mobile)}
        onOpenBookingModal={(preselectedTestId) => {
          if (preselectedTestId) {
            const found = (vendorTests || []).find((t) => t.id === preselectedTestId);
            if (found) {
              setSelectedTestOrPackage(`${found.name || found.testName} (₹${found.priceINR || found.price || 0})`);
            }
          }
          setIsBookingModalOpen(true);
        }}
        onOpenDownloadAppModal={() => setIsDownloadAppModalOpen(true)}
        language={language}
      />

      {/* Multi-Cart Drawer / List Modal */}
      {isCartDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsCartDrawerOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#123B6D] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">
                    Diagnostic Multi-Cart ({cartItems.length} Tests)
                  </h3>
                  <p className="text-[11px] text-blue-100">
                    Review selected tests before proceeding to booking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-6 space-y-3 overflow-y-auto flex-1">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                    🛒
                  </div>
                  <p className="text-sm font-bold text-slate-700">Aapka cart khali hai</p>
                  <p className="text-xs text-slate-400">Tests section se tests cart mein add karein</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#123B6D] flex items-center justify-center font-bold text-xs shrink-0">
                        🧪
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          {item.code && <span className="font-mono bg-slate-200 px-1 rounded">{item.code}</span>}
                          {item.category && <span>{item.category}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm sm:text-base font-black text-[#123B6D]">
                        ₹{item.price}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.id, item.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Action */}
            {cartItems.length > 0 && (
              <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Total Booking Amount:</span>
                  <span className="text-xl font-black text-[#123B6D]">₹{cartTotalPrice}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToBooking}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#123B6D] via-[#1E4E8C] to-[#0F766E] hover:from-[#0e2c52] hover:to-[#0d5f58] text-white text-xs sm:text-sm font-black shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <ShoppingCart className="w-4 h-4 text-amber-400" />
                    <span>Proceed to Book ({cartItems.length} Tests)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Image Screen Lightbox Modal */}
      {fullScreenImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2.5 sm:p-4 md:p-6 animate-in fade-in duration-200"
          onClick={() => {
            setFullScreenImage(null);
            setIsImageZoomed(false);
          }}
        >
          <div
            className="relative max-w-4xl w-full max-h-[96vh] flex flex-col items-center justify-between bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button & Title Bar */}
            <div className="w-full flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white text-sm sm:text-base font-extrabold truncate">
                    {fullScreenImage.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {fullScreenImage.price && (
                      <span className="font-extrabold text-amber-400">₹{fullScreenImage.price}</span>
                    )}
                    {fullScreenImage.testsCount && (
                      <span>• {fullScreenImage.testsCount} Tests Included</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Zoom toggle button */}
                <button
                  type="button"
                  onClick={() => setIsImageZoomed(!isImageZoomed)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700"
                  title={isImageZoomed ? 'Zoom Out' : 'Zoom In'}
                >
                  {isImageZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setFullScreenImage(null);
                    setIsImageZoomed(false);
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 flex items-center justify-center transition cursor-pointer border border-slate-700"
                  aria-label="Close full image view"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* High-Res Full Image Container */}
            <div className="relative rounded-xl overflow-auto my-3 bg-black/60 max-h-[60vh] sm:max-h-[66vh] w-full flex items-center justify-center border border-slate-800">
              <img
                src={fullScreenImage.url}
                alt={fullScreenImage.title}
                onClick={() => setIsImageZoomed(!isImageZoomed)}
                className={`transition-all duration-300 object-contain cursor-zoom-in ${
                  isImageZoomed
                    ? 'scale-150 sm:scale-175 cursor-zoom-out origin-center my-10'
                    : 'w-full h-auto max-h-[60vh] sm:max-h-[66vh]'
                }`}
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
              <p className="text-slate-400 text-[11px] sm:text-xs">
                💡 Click image or zoom button to magnify • Press Esc to close
              </p>

              <div className="flex items-center gap-2">
                <a
                  href={fullScreenImage.url}
                  download={`${fullScreenImage.title.replace(/\s+/g, '_')}_poster.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Save Image</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTestOrPackage(
                      fullScreenImage.price
                        ? `${fullScreenImage.title} (₹${fullScreenImage.price})`
                        : fullScreenImage.title
                    );
                    setFullScreenImage(null);
                    setIsImageZoomed(false);
                    setIsBookingModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#123B6D] to-[#0F766E] hover:from-[#0e2c52] hover:to-[#0d5f58] text-white font-extrabold shadow-md transition cursor-pointer active:scale-98"
                >
                  <span>Book This Package</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Diagnostic Report Preview Modal */}
      {isReportModalOpen && inlineSearchedReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full h-[95vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Modal Top Bar */}
            <div className="bg-[#123B6D] text-white px-4 py-3 sm:px-6 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300 font-bold shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-2">
                    <span>Diagnostic Report Preview</span>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      ✓ Verified &amp; Signed
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {inlineSearchedReport.labName || labName} • ID: {inlineSearchedReport.reportId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Download Official PDF */}
                <button
                  type="button"
                  onClick={handleDownloadInlinePdf}
                  disabled={isDownloadingPdf}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  id="modal-btn-download-pdf"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">{isDownloadingPdf ? 'Preparing...' : 'Download PDF'}</span>
                </button>

                {/* Print Report */}
                <button
                  type="button"
                  onClick={handlePrintInlineReport}
                  className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/20"
                  id="modal-btn-print-report"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                {/* Close Modal */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer ml-1"
                  aria-label="Close report viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Modal Body: Official Diagnostic Report Sheet (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100/70 space-y-5">
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-8 space-y-6">
                
                {/* Lab Official Letterhead */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-[#123B6D]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#123B6D] to-[#0F766E] flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                      {labName.charAt(0)}
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-xl font-black text-[#123B6D] tracking-tight">
                        {inlineSearchedReport.labName || labName}
                      </h1>
                      <p className="text-xs text-slate-500 font-medium">
                        {labAddress} • Phone: +91 {cleanPhone}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          NABL Accredited: {labNabl}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          ISO 15189:2022 Certified
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="inline-block px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
                      ✓ Verified Final Report
                    </div>
                    <p className="text-xs font-mono text-slate-600 font-bold">
                      Report ID: <span className="text-[#123B6D]">{inlineSearchedReport.reportId}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Sample Date: {inlineSearchedReport.sampleCollectedAt || inlineSearchedReport.reportedAt || 'Today'}
                    </p>
                  </div>
                </div>

                {/* Patient Demographic Details Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Patient Name</span>
                    <span className="font-black text-slate-900 text-sm">{inlineSearchedReport.patientName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Age / Gender</span>
                    <span className="font-bold text-slate-800">{inlineSearchedReport.ageGender || `${inlineSearchedReport.mobile ? 'Adult' : '-'}`}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Referring Doctor</span>
                    <span className="font-bold text-slate-800">{inlineSearchedReport.doctor || 'Self / Walk-in'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">UHID / Barcode</span>
                    <span className="font-mono font-bold text-[#123B6D]">{inlineSearchedReport.uhid || inlineSearchedReport.tokenNumber || inlineSearchedReport.reportId}</span>
                  </div>
                </div>

                {/* Test Investigation Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#123B6D] text-white uppercase text-[10px] font-black tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Investigation / Parameter</th>
                        <th className="py-3 px-4 text-center">Result</th>
                        <th className="py-3 px-4">Unit</th>
                        <th className="py-3 px-4">Biological Ref. Range</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inlineSearchedReport.items.map((item, idx) => {
                        const isAbnormal = Boolean(item.isAbnormal);
                        return (
                          <tr
                            key={idx}
                            className={isAbnormal ? 'bg-amber-50/60 font-medium' : 'hover:bg-slate-50/80 transition'}
                          >
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              <div>{item.testName}</div>
                              {item.parameter && item.parameter !== item.testName && (
                                <div className="text-[11px] font-normal text-slate-500">{item.parameter}</div>
                              )}
                            </td>
                            <td className={`py-2.5 px-4 text-center font-black text-sm ${isAbnormal ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {item.result}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 font-medium">
                              {item.unit || '-'}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                              {item.referenceRange || 'Standard'}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {isAbnormal ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                  ATTENTION
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  NORMAL
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Clinical Impression & Notes */}
                {inlineSearchedReport.clinicalImpression && (
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-800 space-y-1">
                    <span className="font-bold text-[#123B6D] text-xs uppercase tracking-wider block">Clinical Impression / Note:</span>
                    <p className="leading-relaxed text-slate-700">{inlineSearchedReport.clinicalImpression}</p>
                  </div>
                )}

                {/* Pathologist Verification & Signature */}
                <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Digitally Verified &amp; Signed</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      This is an authenticated electronic clinical pathology report.
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="inline-block p-2 rounded-lg bg-slate-50 border border-slate-200 mb-1">
                      <span className="font-serif italic font-black text-slate-800 text-sm tracking-wide">
                        {inlineSearchedReport.pathologist || 'Dr. Rohit Sharma, MD'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {inlineSearchedReport.pathologist || 'Consultant Pathologist'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Reg No: DMC/R/18429 • MD Pathology
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. Modal Bottom Action Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInlineReport}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Print Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadInlinePdf}
                  disabled={isDownloadingPdf}
                  className="px-5 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0c294d] text-white font-bold text-xs transition flex items-center gap-2 shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
