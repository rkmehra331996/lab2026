import React, { useState, useEffect } from 'react';
import { AppView, Language, SeoPost } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { LabWorkflow } from './components/LabWorkflow';
import { FeaturesSection } from './components/FeaturesSection';
import { OfflineSection } from './components/OfflineSection';
import { PatientPortalSection } from './components/PatientPortalSection';
import { ReportPreviewSection } from './components/ReportPreviewSection';
import { WhatsAppReportSection } from './components/WhatsAppReportSection';
import { TestLibrarySection } from './components/TestLibrarySection';
import { StaffRolesSection } from './components/StaffRolesSection';
import { PatientHistorySection } from './components/PatientHistorySection';
import { DataSafetySection } from './components/DataSafetySection';
import { SecuritySection } from './components/SecuritySection';
import { AuditLogSection } from './components/AuditLogSection';
import { IndianMarketSection } from './components/IndianMarketSection';
import { LabSearchSection } from './components/LabSearchSection';
import { PricingSection } from './components/PricingSection';
import { DemoSection } from './components/DemoSection';
import { FinalCTASection } from './components/FinalCTASection';
import { MobileFixedCTA } from './components/MobileFixedCTA';
import { BookDemoModal } from './components/Modals';
import { LabSoftwareApp } from './components/LabSoftwareApp';
import { PatientPortalApp } from './components/PatientPortalApp';
import { LabVendorWebsite } from './components/LabVendorWebsite';
import { CompanyAdminDashboard } from './components/CompanyAdminDashboard';
import { LabVendorDashboard } from './components/LabVendorDashboard';
import { ReceptionEntryDashboard } from './components/ReceptionEntryDashboard';
import { TechnicianDepartmentDashboard } from './components/technician/TechnicianDepartmentDashboard';
import { DashboardAuthGuard } from './components/DashboardAuthGuard';
import { CmsAuthModal } from './components/CmsAuthModal';
import { CacheManagerModal } from './components/CacheManagerModal';
import { BranchManagerDashboard } from './components/BranchManagerDashboard';
import { PathologistDashboard } from './components/PathologistDashboard';
import { ExpertMemberDashboard } from './components/ExpertMemberDashboard';
import { RoleContextBanner } from './components/RoleContextBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { SeoPostDetailView } from './components/SeoPostDetailView';
import { Building, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { isUserAuthorizedForView } from './utils/rbac';
import { useCms } from './context/CmsContext';
import { getTenantSubdomain } from './constants/domains';
import { resolveAppRoute } from './utils/domainRouting';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    try {
      const resolution = resolveAppRoute(
        typeof window !== 'undefined' ? window.location.hostname : '',
        typeof window !== 'undefined' ? window.location.search : '',
        undefined,
        typeof window !== 'undefined' ? window.location.pathname : '',
        typeof window !== 'undefined' ? window.location.hash : ''
      );

      // If visiting the main official platform (indianlalaji.com or www.indianlalaji.com),
      // ALWAYS open the main company website ('website') and clear any stale dashboard memory
      if (resolution.isExplicitMainPlatform) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('cms_current_view');
          } catch {}
        }
        return 'website';
      }

      if (resolution.view && resolution.view !== 'website') {
        return resolution.view;
      }
      // If URL did not specify an explicit view, restore saved dashboard view if present
      const saved = typeof window !== 'undefined' ? (localStorage.getItem('cms_current_view') as AppView) : null;
      if (
        saved &&
        [
          'vendor_dashboard',
          'admin_dashboard',
          'reception_dashboard',
          'technician_dashboard',
          'branch_manager_dashboard',
          'pathologist_dashboard',
          'lab_app',
        ].includes(saved)
      ) {
        return saved;
      }
      return resolution.view || 'website';
    } catch {
      return 'website';
    }
  });
  const [language, setLanguage] = useState<Language>('en');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string>(() => {
    try {
      const resolution = resolveAppRoute(
        typeof window !== 'undefined' ? window.location.hostname : '',
        typeof window !== 'undefined' ? window.location.search : '',
        undefined,
        typeof window !== 'undefined' ? window.location.pathname : '',
        typeof window !== 'undefined' ? window.location.hash : ''
      );
      return resolution.targetReport || '';
    } catch {
      return '';
    }
  });
  const [selectedPatientMobile, setSelectedPatientMobile] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');

  // Loading & error state when resolving lab directly from the URL
  const [isFetchingUrlLab, setIsFetchingUrlLab] = useState(false);
  const [urlLabError, setUrlLabError] = useState<{ identifier: string; message: string } | null>(null);
  const [activePost, setActivePost] = useState<SeoPost | null>(null);
  const isFetchingLabRef = React.useRef(false);
  const attemptedLabFetchesRef = React.useRef<Set<string>>(new Set());

  const {
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    portalSections,
    selectVendorLab,
    selectedVendorLabId,
    setSelectedVendorLabId,
    vendorLabsList,
    refreshCloudData,
    injectCloudLab,
    isCacheModalOpen,
    closeCacheModal,
    getPostBySlug,
    seoPosts,
  } = useCms();

  // Fetch and resolve specific lab directly from the current URL
  const fetchAndApplyLabFromUrl = async (
    targetIdentifier: string,
    currentLabs: typeof vendorLabsList,
    intendedView?: AppView
  ) => {
    if (!targetIdentifier) return;
    const cleanId = targetIdentifier.trim();
    const cleanIdLower = cleanId.toLowerCase();

    // Guard against duplicate or infinite re-fetch loop
    if (isFetchingLabRef.current || attemptedLabFetchesRef.current.has(cleanIdLower)) {
      return;
    }
    isFetchingLabRef.current = true;
    attemptedLabFetchesRef.current.add(cleanIdLower);

    setIsFetchingUrlLab(true);
    setUrlLabError(null);

    const nextView = (intendedView && intendedView !== 'website')
      ? intendedView
      : 'vendor_website';

    try {
      const targetLower = cleanId.toLowerCase();
      const cleanDigits = cleanId.replace(/\D/g, '');
      const clean10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : '';

      // Step 1: Check existing local lab list
      const existing = currentLabs.find((l) => {
        const id = (l.id || '').toLowerCase();
        const slug = (l.slug || '').toLowerCase();
        const labPhoneDigits = (l.phone || '').replace(/\D/g, '');
        const labPhone10 = labPhoneDigits.length >= 10 ? labPhoneDigits.slice(-10) : '';

        return (
          id === targetLower ||
          id === `lab-${targetLower}` ||
          id.replace(/^lab-/, '') === targetLower.replace(/^lab-/, '') ||
          slug === targetLower ||
          (clean10 && labPhone10 === clean10) ||
          (l.domainPreview && l.domainPreview.toLowerCase().includes(targetLower)) ||
          (l.domainPreview && l.domainPreview.toLowerCase().split('.')[0] === targetLower) ||
          (l.name && l.name.toLowerCase().replace(/[^a-z0-9]/g, '') === targetLower.replace(/[^a-z0-9]/g, ''))
        );
      });

      if (existing) {
        selectVendorLab(existing.id);
        setSelectedVendorLabId(existing.id);
        setCurrentView(nextView);
        // If lab is currently marked Draft locally, query server in background to get latest approved state
        if (existing.status !== 'Active' || !existing.isWebsiteApproved) {
          fetch(`/api/lab/${encodeURIComponent(cleanId)}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.found && data.lab && (data.lab.status === 'Active' || data.lab.isWebsiteApproved)) {
                injectCloudLab(data.lab, data.settings);
              }
            })
            .catch(() => {});
        }
        return;
      }

      // Step 2: Fetch specific lab directly from backend /api/lab/:identifier
      try {
        const res = await fetch(`/api/lab/${encodeURIComponent(cleanId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.lab) {
            injectCloudLab(data.lab, data.settings);
            selectVendorLab(data.lab.id);
            setSelectedVendorLabId(data.lab.id);
            setCurrentView(nextView);
            return;
          }
        }
      } catch (err) {
        console.warn('Direct lab API fetch failed, checking sync fallback:', err);
      }

      // Step 3: Trigger cloud sync refresh as a fallback (safely without re-triggering loops)
      try {
        await refreshCloudData();
      } catch {}

      // Check again after refresh
      const matchAfterSync = vendorLabsList.find((l) => {
        const id = (l.id || '').toLowerCase();
        const slug = (l.slug || '').toLowerCase();
        const labPhoneDigits = (l.phone || '').replace(/\D/g, '');
        const labPhone10 = labPhoneDigits.length >= 10 ? labPhoneDigits.slice(-10) : '';

        return (
          id === targetLower ||
          id === `lab-${targetLower}` ||
          id.replace(/^lab-/, '') === targetLower.replace(/^lab-/, '') ||
          slug === targetLower ||
          (clean10 && labPhone10 === clean10) ||
          (l.domainPreview && l.domainPreview.toLowerCase().includes(targetLower)) ||
          (l.name && l.name.toLowerCase().replace(/[^a-z0-9]/g, '') === targetLower.replace(/[^a-z0-9]/g, ''))
        );
      });

      if (matchAfterSync) {
        selectVendorLab(matchAfterSync.id);
        setSelectedVendorLabId(matchAfterSync.id);
        setCurrentView(nextView);
      } else {
        if (intendedView === 'patient_portal') {
          setCurrentView('patient_portal');
        } else {
          setUrlLabError({
            identifier: cleanId,
            message: `Laboratory '${cleanId}' could not be located in our directory.`,
          });
        }
      }
    } finally {
      isFetchingLabRef.current = false;
      setIsFetchingUrlLab(false);
    }
  };

  const hasInitialSyncedRef = React.useRef(false);

  // Persist currentView to localStorage whenever it changes (only for authenticated or dashboard views, avoid trapping homepage)
  useEffect(() => {
    try {
      if (currentView === 'website') {
        localStorage.removeItem('cms_current_view');
      } else {
        localStorage.setItem('cms_current_view', currentView);
      }
    } catch {}
  }, [currentView]);

  // Sync view and lab tenant from URL parameters, subdomains, /shop/ or /lab/ paths, or custom domains on initial load
  useEffect(() => {
    if (hasInitialSyncedRef.current) return;

    try {
      const resolution = resolveAppRoute(
        window.location.hostname,
        window.location.search,
        vendorLabsList,
        window.location.pathname,
        window.location.hash
      );

      // If URL explicitly points to an SEO post, load the post object
      if (resolution.targetPost && !activePost) {
        const post = getPostBySlug(resolution.targetPost);
        if (post) {
          setActivePost(post);
        }
      }

      // Never reset or overwrite active dashboard workspaces or active post view during in-app navigation
      const isDashboardView = [
        'vendor_dashboard',
        'admin_dashboard',
        'technician_dashboard',
        'reception_dashboard',
        'pathologist_dashboard',
        'expert_dashboard',
        'branch_manager_dashboard',
        'lab_app',
      ].includes(currentView);

      if (isDashboardView || currentView === 'seo_post') {
        hasInitialSyncedRef.current = true;
        return;
      }

      // CRITICAL: When user explicitly opens the main platform domain (indianlalaji.com or www.indianlalaji.com),
      // always reset to the homepage 'website' view and purge any stale dashboard view.
      if (resolution.isExplicitMainPlatform) {
        setCurrentView('website');
        setUrlLabError(null);
        try {
          localStorage.removeItem('cms_current_view');
        } catch {}
        hasInitialSyncedRef.current = true;
        return;
      }

      if (resolution.targetPost) {
        const post = getPostBySlug(resolution.targetPost);
        if (post) {
          setActivePost(post);
          setCurrentView('seo_post');
          setUrlLabError(null);
          hasInitialSyncedRef.current = true;
          return;
        }
      }

      if (resolution.targetLab) {
        const cleanId = resolution.targetLab.trim();
        const targetLower = cleanId.toLowerCase();
        const cleanDigits = cleanId.replace(/\D/g, '');
        const clean10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : '';

        // Immediate direct synchronous resolution from current vendor directory
        const directMatch = vendorLabsList.find((l) => {
          const id = (l.id || '').toLowerCase();
          const slug = (l.slug || '').toLowerCase();
          const labPhoneDigits = (l.phone || '').replace(/\D/g, '');
          const labPhone10 = labPhoneDigits.length >= 10 ? labPhoneDigits.slice(-10) : '';

          return (
            id === targetLower ||
            id === `lab-${targetLower}` ||
            id.replace(/^lab-/, '') === targetLower.replace(/^lab-/, '') ||
            slug === targetLower ||
            (clean10 && labPhone10 === clean10) ||
            (l.domainPreview && l.domainPreview.toLowerCase().includes(targetLower)) ||
            (l.domainPreview && l.domainPreview.toLowerCase().split('.')[0] === targetLower)
          );
        });

        if (directMatch) {
          selectVendorLab(directMatch.id);
          setSelectedVendorLabId(directMatch.id);
          const targetView = (resolution.view && resolution.view !== 'website')
            ? resolution.view
            : 'vendor_website';
          setCurrentView(targetView);
          setUrlLabError(null);
          hasInitialSyncedRef.current = true;
        } else if (!isFetchingLabRef.current && !attemptedLabFetchesRef.current.has(cleanId.toLowerCase())) {
          fetchAndApplyLabFromUrl(resolution.targetLab, vendorLabsList, resolution.view || 'patient_portal');
        }
      } else if (!selectedVendorLabId || selectedVendorLabId === 'all') {
        const defaultLab = vendorLabsList.find((l) => l.status === 'Active')?.id || vendorLabsList[0]?.id;
        if (defaultLab) {
          selectVendorLab(defaultLab);
        }
      }

      if (resolution.targetReport) {
        setSelectedReportId(resolution.targetReport);
        setCurrentView('patient_portal');
      } else if (resolution.view && !resolution.targetLab && resolution.view !== currentView) {
        setCurrentView(resolution.view);
      }

      if (vendorLabsList && vendorLabsList.length > 0) {
        hasInitialSyncedRef.current = true;
      }
    } catch {}
  }, [vendorLabsList]);

  // Support browser Back/Forward navigation across /shop/, /lab/ paths and views
  useEffect(() => {
    const handlePopState = () => {
      try {
        const resolution = resolveAppRoute(
          window.location.hostname,
          window.location.search,
          vendorLabsList,
          window.location.pathname,
          window.location.hash
        );
        if (resolution.targetPost) {
          const post = getPostBySlug(resolution.targetPost);
          if (post) {
            setActivePost(post);
            setCurrentView('seo_post');
            return;
          }
        }
        if (resolution.targetLab) {
          fetchAndApplyLabFromUrl(resolution.targetLab, vendorLabsList, resolution.view || (resolution.targetReport ? 'patient_portal' : undefined));
        }
        if (resolution.targetReport) {
          setSelectedReportId(resolution.targetReport);
          setCurrentView('patient_portal');
        } else if (resolution.view) {
          setCurrentView(resolution.view);
        }
      } catch {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [vendorLabsList, selectVendorLab, getPostBySlug]);

  // Update URL search parameters and path when view or selected lab changes
  useEffect(() => {
    // CRITICAL: If we are currently fetching or resolving a lab from URL, DO NOT overwrite the browser URL
    if (isFetchingUrlLab) return;

    // Never mutate or flicker the browser URL for in-app views like dashboard workspaces or SEO posts
    // This stops screen blinking and eliminates URL bar jumping completely!
    const isDashboardOrPost = [
      'vendor_dashboard',
      'admin_dashboard',
      'technician_dashboard',
      'reception_dashboard',
      'pathologist_dashboard',
      'expert_dashboard',
      'branch_manager_dashboard',
      'lab_app',
      'seo_post',
    ].includes(currentView);

    if (isDashboardOrPost) {
      return;
    }

    try {
      const url = new URL(window.location.href);

      let targetPath = window.location.pathname;
      let targetSearch = '';

      if (currentView === 'website') {
        if (url.pathname.startsWith('/shop/') || url.pathname.startsWith('/lab/')) {
          url.searchParams.delete('view');
          url.searchParams.delete('post');
          url.searchParams.delete('lab');
          url.searchParams.delete('shop');
          url.searchParams.delete('vendor');
          url.searchParams.delete('subdomain');
          targetPath = '/';
          targetSearch = url.search ? url.search : '';
          const targetFullUrl = targetPath + targetSearch;
          const currentFullUrl = window.location.pathname + window.location.search;
          if (targetFullUrl !== currentFullUrl) {
            window.history.replaceState({}, '', targetFullUrl);
          }
        }
      } else if (currentView === 'vendor_website') {
        const currentLab = vendorLabsList.find((l) => l.id === selectedVendorLabId);
        const defaultActiveLab = vendorLabsList.find((l) => l.status === 'Active')?.id || vendorLabsList[0]?.id || 'lab-apex';
        const vendorId = currentLab?.id || selectedVendorLabId || defaultActiveLab;
        url.searchParams.delete('view');
        url.searchParams.delete('post');
        url.searchParams.delete('lab');
        url.searchParams.delete('shop');
        url.searchParams.delete('vendor');
        url.searchParams.delete('subdomain');
        const prefix = window.location.pathname.startsWith('/lab/') ? '/lab/' : '/shop/';
        targetPath = `${prefix}${vendorId}`;
        targetSearch = url.search ? url.search : '';
        const targetFullUrl = targetPath + targetSearch;
        const currentFullUrl = window.location.pathname + window.location.search;
        if (targetFullUrl !== currentFullUrl) {
          window.history.replaceState({}, '', targetFullUrl);
        }
      } else if (currentView === 'patient_portal') {
        url.searchParams.set('view', 'patient_portal');
        url.searchParams.delete('post');
        if (selectedVendorLabId && selectedVendorLabId !== 'all') {
          const currentLab = vendorLabsList.find((l) => l.id === selectedVendorLabId);
          url.searchParams.set('lab', currentLab?.id || selectedVendorLabId);
        } else {
          url.searchParams.delete('lab');
        }
        targetPath = url.pathname.startsWith('/shop/') || url.pathname.startsWith('/lab/') ? '/' : url.pathname;
        targetSearch = url.search;
        const targetFullUrl = targetPath + targetSearch;
        const currentFullUrl = window.location.pathname + window.location.search;
        if (targetFullUrl !== currentFullUrl) {
          window.history.replaceState({}, '', targetFullUrl);
        }
      }
    } catch {}
  }, [currentView, selectedVendorLabId, vendorLabsList, currentUser, activePost]);

  // Keep dashboard views strictly locked to logged-in user's own laboratory
  useEffect(() => {
    const dashboardViews: AppView[] = [
      'vendor_dashboard',
      'reception_dashboard',
      'technician_dashboard',
      'branch_manager_dashboard',
      'pathologist_dashboard',
    ];
    if (
      dashboardViews.includes(currentView) &&
      currentUser &&
      currentUser.role !== 'admin' &&
      currentUser.labId &&
      currentUser.labId !== 'all'
    ) {
      const userNorm = currentUser.labId.toLowerCase().replace(/^lab-/, '');
      const selectedNorm = (selectedVendorLabId || '').toLowerCase().replace(/^lab-/, '');
      if (userNorm && userNorm !== selectedNorm && selectedVendorLabId !== currentUser.labId) {
        selectVendorLab(currentUser.labId);
      }
    }
  }, [currentView, currentUser, selectedVendorLabId, selectVendorLab]);

  // Authorization check for protected dashboard workspaces using RBAC
  const isAuthorizedForView = (view: AppView): boolean => {
    return isUserAuthorizedForView(currentUser, view);
  };

  const handleOpenDemo = () => setIsDemoModalOpen(true);

  const handleViewPatientPortal = (reportId?: string, mobile?: string, labId?: string, patientName?: string) => {
    if (labId) {
      setSelectedVendorLabId(labId);
      selectVendorLab(labId);
    }
    setSelectedReportId(reportId?.trim() || '');
    setSelectedPatientMobile(mobile?.trim() || '');
    setSelectedPatientName(patientName?.trim() || '');
    setCurrentView('patient_portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchLabApp = () => {
    setCurrentView('lab_app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToWebsite = () => {
    setSelectedReportId('');
    setSelectedPatientMobile('');
    setSelectedPatientName('');
    const resolution = resolveAppRoute(
      typeof window !== 'undefined' ? window.location.hostname : '',
      typeof window !== 'undefined' ? window.location.search : ''
    );
    if (resolution.targetLab) {
      setCurrentView('vendor_website');
    } else {
      setCurrentView('website');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dedicated Loading Experience when fetching a specific lab from URL (Only for vendor_website, never during lab creation modal)
  if (isFetchingUrlLab && currentView === 'vendor_website' && !isAuthModalOpen) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-[#123B6D] text-amber-300 flex items-center justify-center shadow-lg mb-4 animate-pulse">
          <Building className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-1">
          Loading Laboratory Website...
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
          Fetching verified diagnostic catalog, test pricing, and doctor profiles directly from the URL...
        </p>
        <div className="flex items-center gap-2 text-xs font-bold text-[#123B6D]">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Connecting to laboratory portal...</span>
        </div>
      </div>
    );
  }

  // Fallback Experience if the specific lab requested in the URL could not be found
  if (urlLabError && currentView === 'vendor_website') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900">
              Laboratory Website Not Found
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn't locate a verified diagnostic laboratory matching <span className="font-bold text-slate-800 font-mono bg-slate-100 px-1.5 py-0.5 rounded">"{urlLabError.identifier}"</span> in our network. It may have moved or the link may be mistyped.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left space-y-2">
            <span className="text-[11px] font-bold text-slate-600 block">Verified Active Laboratories:</span>
            <div className="space-y-1.5">
              {vendorLabsList.slice(0, 3).map((lab) => (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => {
                    setUrlLabError(null);
                    selectVendorLab(lab.id);
                    setSelectedVendorLabId(lab.id);
                    window.history.pushState({}, '', `/shop/${lab.id}`);
                  }}
                  className="w-full p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition flex items-center justify-between text-xs font-bold text-slate-800 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{lab.name}</span>
                  </div>
                  <span className="text-[10px] text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full shrink-0 font-extrabold">Visit Lab</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setUrlLabError(null);
                setCurrentView('website');
                window.history.pushState({}, '', '/');
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-black transition cursor-pointer"
            >
              Go to IndianLalaji Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dedicated Experience: SEO Blog Post & Clinical Guide View
  if (currentView === 'seo_post' && activePost) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <SeoPostDetailView
          post={activePost}
          onBack={() => {
            setCurrentView('website');
            setActivePost(null);
            window.scrollTo({ top: 0 });
          }}
          onSelectPost={(p) => setActivePost(p)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0 });
          }}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 1. Dedicated Experience: Diagnostic Laboratory (Vendor) Website
  if (currentView === 'vendor_website') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <ErrorBoundary
          fallbackTitle="Laboratory Website"
          fallbackMessage="Diagnostic lab website load karte waqt ek problem aayi. Please refresh karein ya dobara koshish karein."
        >
          <LabVendorWebsite
            targetLabId={selectedVendorLabId}
            language={language}
            onSelectLanguage={setLanguage}
            onOpenReportPortal={handleViewPatientPortal}
            onOpenLabSoftware={handleLaunchLabApp}
            onOpenSoftwareWebsite={() => {
              setCurrentView('website');
              window.history.pushState({}, '', '/');
            }}
            onOpenVendorDashboard={() => setCurrentView('vendor_dashboard')}
            onOpenReceptionDashboard={() => setCurrentView('reception_dashboard')}
            onOpenAdminDashboard={() => setCurrentView('vendor_dashboard')}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </ErrorBoundary>
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          isVendorContext={true}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 2. Dedicated Experience: Company Admin CMS Dashboard
  if (currentView === 'admin_dashboard') {
    if (!isAuthorizedForView('admin_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="admin_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <ErrorBoundary
          fallbackTitle="Super Admin Console"
          fallbackMessage="Super Admin dashboard load karte waqt ek error aayi. Please Retry karein."
        >
          <CompanyAdminDashboard
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </ErrorBoundary>
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 3. Dedicated Experience: Diagnostic Lab Vendor CMS Dashboard
  if (currentView === 'vendor_dashboard') {
    if (!isAuthorizedForView('vendor_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="vendor_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            isVendorContext={true}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <ErrorBoundary
          fallbackTitle="Lab Owner / Management Dashboard"
          fallbackMessage="Lab dashboard load karte waqt ek error aayi. Please Retry karein."
        >
          <LabVendorDashboard
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </ErrorBoundary>
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          isVendorContext={true}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 4. Dedicated Experience: Reception Entry & Billing Dashboard
  if (currentView === 'reception_dashboard') {
    if (!isAuthorizedForView('reception_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="reception_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            isVendorContext={true}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <RoleContextBanner currentView={currentView} onNavigateView={(v) => setCurrentView(v)} />
        <ErrorBoundary
          fallbackTitle="Reception & Billing Dashboard"
          fallbackMessage="Reception dashboard load karte waqt ek error aayi. Please Retry karein."
        >
          <ReceptionEntryDashboard
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenReportPortal={handleViewPatientPortal}
          />
        </ErrorBoundary>
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          isVendorContext={true}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 4b. Dedicated Experience: Technician Department Dashboard (Reports, Edit, Cancel Reason)
  if (currentView === 'technician_dashboard') {
    if (!isAuthorizedForView('technician_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="technician_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            isVendorContext={true}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <RoleContextBanner currentView={currentView} onNavigateView={(v) => setCurrentView(v)} />
        <ErrorBoundary
          fallbackTitle="Technician Testing Workstation"
          fallbackMessage="Technician workstation load karte waqt ek error aayi. Please Retry karein."
        >
          <LabSoftwareApp
            onBackToWebsite={handleBackToWebsite}
            onViewReport={handleViewPatientPortal}
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </ErrorBoundary>
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          isVendorContext={true}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 4c. Dedicated Experience: Branch Manager Operations & Daily Cash Reconciliation
  if (currentView === 'branch_manager_dashboard') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <ErrorBoundary
          fallbackTitle="Branch Operations"
          fallbackMessage="Branch dashboard load karte waqt ek error aayi. Please Retry karein."
        >
          <BranchManagerDashboard
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenReportPortal={handleViewPatientPortal}
          />
        </ErrorBoundary>
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          isVendorContext={true}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 4d. Dedicated Experience: Consultant Pathologist Verification & Clinical Sign-off Desk
  if (currentView === 'pathologist_dashboard') {
    if (!isAuthorizedForView('pathologist_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="pathologist_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            isVendorContext={true}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <ErrorBoundary
          fallbackTitle="Pathologist Verification Desk"
          fallbackMessage="Pathologist dashboard load karte waqt ek error aayi. Please Retry karein."
        >
          <PathologistDashboard
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenReportPortal={handleViewPatientPortal}
          />
        </ErrorBoundary>
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          isVendorContext={true}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 4e. Dedicated Experience: Expert Member Dashboard – Reception & Technician Department Management
  if (currentView === 'expert_dashboard') {
    if (!isAuthorizedForView('expert_dashboard')) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
          <DashboardAuthGuard
            view="expert_dashboard"
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <CmsAuthModal
            isOpen={isAuthModalOpen}
            isVendorContext={true}
            onClose={() => setIsAuthModalOpen(false)}
            onNavigateView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <ErrorBoundary
          fallbackTitle="Expert Member Dashboard"
          fallbackMessage="Expert member dashboard load karte waqt ek error aayi. Please Retry karein."
        >
          <ExpertMemberDashboard
            onNavigateView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenReportPortal={handleViewPatientPortal}
          />
        </ErrorBoundary>
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          isVendorContext={true}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 5. Dedicated Experience: Laboratory Software (app.indianlalaji.com)
  if (currentView === 'lab_app') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <LabSoftwareApp
          onBackToWebsite={handleBackToWebsite}
          onViewReport={handleViewPatientPortal}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          isVendorContext={true}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 5. Dedicated Experience: Patient Report Portal (report.indianlalaji.com)
  if (currentView === 'patient_portal') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans">
        <PatientPortalApp
          onBackToWebsite={handleBackToWebsite}
          initialReportId={selectedReportId}
          initialMobile={selectedPatientMobile}
          initialPatientName={selectedPatientName}
          vendorLabId={selectedVendorLabId}
          onSelectVendorLab={(labId) => {
            setSelectedVendorLabId(labId);
            selectVendorLab(labId);
          }}
        />
        <CmsAuthModal
          isOpen={isAuthModalOpen}
          isVendorContext={true}
          onClose={() => setIsAuthModalOpen(false)}
          onNavigateView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // 3. Dedicated Experience: Public Website (indianlalaji.com)
  // Section 37: HOMEPAGE FINAL ORDER
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col font-sans selection:bg-[#123B6D]/15 selection:text-[#123B6D]">
      {/* Navigation Bar with Language Selector */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenDemo={handleOpenDemo}
        language={language}
        onSelectLanguage={setLanguage}
      />

      <main className="flex-1 pb-16 sm:pb-0">
        {/* 1. Home Section */}
        {portalSections.hero !== false && (
          <Hero
            onOpenDemo={handleOpenDemo}
            onLaunchApp={handleLaunchLabApp}
            onLaunchLabShop={() => {
              const defaultActiveLab = vendorLabsList.find((l) => l.status === 'Active')?.id || vendorLabsList[0]?.id || '';
              selectVendorLab(selectedVendorLabId || defaultActiveLab);
              setCurrentView('vendor_website');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            language={language}
          />
        )}

        {/* 2. Feature Section */}
        {portalSections.features !== false && <FeaturesSection />}

        {/* 3. Lab Search Section (Premium Styling, Under Features) */}
        <LabSearchSection
          onSelectView={setCurrentView}
          onOpenDemo={handleOpenDemo}
        />

        {/* 4. Pricing Section */}
        {portalSections.pricing !== false && (
          <PricingSection onOpenDemo={handleOpenDemo} />
        )}



        {/* 5. Contact Us Section */}
        {portalSections.finalCta !== false && (
          <FinalCTASection onOpenDemo={handleOpenDemo} />
        )}
      </main>

      {/* Website Footer with SEO Post Cards & Platform Navigation */}
      <Footer
        onSelectView={setCurrentView}
        onOpenDemo={handleOpenDemo}
        onSelectPost={(post) => {
          setActivePost(post);
          setCurrentView('seo_post');
          window.scrollTo({ top: 0 });
        }}
      />

      {/* 33. Mobile Fixed CTA */}
      <MobileFixedCTA onOpenReport={() => handleViewPatientPortal()} />

      {/* Offline Status & Sync Queue Indicator */}
      <OfflineIndicator />

      {/* Interactive Modals */}
      <BookDemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      <CacheManagerModal isOpen={isCacheModalOpen} onClose={closeCacheModal} />
      <CmsAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onNavigateView={(v) => {
          setCurrentView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
