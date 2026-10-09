export type AppView =
  | 'website'
  | 'vendor_website'
  | 'lab_app'
  | 'patient_portal'
  | 'admin_dashboard'
  | 'vendor_dashboard'
  | 'branch_manager_dashboard'
  | 'reception_dashboard'
  | 'technician_dashboard'
  | 'pathologist_dashboard';

export type UserRole =
  | 'admin'
  | 'super_admin'
  | 'vendor'
  | 'lab_admin'
  | 'branch_manager'
  | 'reception'
  | 'receptionist'
  | 'technician'
  | 'pathologist'
  | null;

export interface RolePermissions {
  canAccessSuperAdmin: boolean;
  canManageLabSettings: boolean;
  canManageBranches: boolean;
  canManageStaff: boolean;
  canViewAllBranchesData: boolean;
  canRegisterPatients: boolean;
  canCollectBilling: boolean;
  canEnterLabResults: boolean;
  canSignAndApproveReports: boolean;
  canViewFinancials: boolean;
  canDispatchWhatsApp: boolean;
  canReconcileCash: boolean;
}

export interface CmsUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendor' | 'branch_manager' | 'reception' | 'technician' | 'pathologist';
  avatar?: string;
  entityName: string;
  labId?: string;
  labName?: string;
  branchId?: string;
  branchName?: string;
  permissions?: RolePermissions;
}

export interface LabStaffAccount {
  id: string;
  name: string;
  role: 'admin' | 'vendor' | 'branch_manager' | 'reception' | 'technician' | 'pathologist';
  username: string; // or email / phone
  email?: string;
  phone?: string;
  password: string;
  pin?: string;
  labId?: string;
  labName?: string;
  branchId?: string;
  branchName?: string;
  status: 'active' | 'suspended';
  lastPasswordReset?: string;
  shift?: string;
  notes?: string;
}

export interface PortalWebsiteSections {
  hero: boolean;
  trustStrip: boolean;
  problemSection: boolean;
  solutionSection: boolean;
  workflow: boolean;
  features: boolean;
  offline: boolean;
  patientPortal: boolean;
  vendorWebsitesShowcase: boolean;
  reportPreview: boolean;
  whatsapp: boolean;
  testLibrary: boolean;
  staffRoles: boolean;
  patientHistory: boolean;
  dataSafety: boolean;
  security: boolean;
  auditLog: boolean;
  indianMarket: boolean;
  pricing: boolean;
  demo: boolean;
  finalCta: boolean;
  faq: boolean;
  footer: boolean;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  supportPhone: string;
  supportEmail: string;
  announcementText: string;
  superAdminDomain?: string;
  platformDomain?: string;
  sections?: Partial<PortalWebsiteSections>;
  upiId?: string;
  upiMerchantName?: string;
  qrCodeUrl?: string;
}

export interface SeoSettings {
  faviconUrl: string; // Favicon – Website browser tab icon
  ogImageUrl: string; // Featured Image / OG Image – Social media sharing image
  seoTitle: string; // SEO Title – Search engine title
  metaDescription: string; // Meta Description – Website/page description
  metaKeywords: string; // Meta Keywords – Optional keywords
  googleSiteVerification: string; // Google Site Verification – Verification code
  googleAnalyticsId: string; // Google Analytics ID – Analytics tracking
  robotsTxt: string; // Robots.txt – Search engine crawling settings
  canonicalUrl: string; // Canonical URL – Preferred page URL
  customHeaderCode: string; // Custom Header Code – <head> scripts/code
  customFooterCode: string; // Custom Footer Code – Footer scripts/code
  schemaJsonLd: string; // Schema / JSON-LD – Structured SEO data
  updatedAt?: string;
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  faviconUrl: '/icon.svg',
  ogImageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
  seoTitle: 'INDIANLALAJI.COM - Pathology Laboratory & Diagnostic Operating System',
  metaDescription: 'Complete diagnostic laboratory management software for Indian pathology labs. Works offline, ₹ INR billing, automated WhatsApp PDF reports, and instant no-login patient report portal.',
  metaKeywords: 'pathology lab software, laboratory management system, diagnostic lab billing, nabl software india, lab report generator, whatsapp lab report, indian pathology software',
  googleSiteVerification: '',
  googleAnalyticsId: '',
  robotsTxt: `User-agent: *
Allow: /
Disallow: /admin
Disallow: /technician
Disallow: /reception

Sitemap: https://indianlalaji.com/sitemap.xml`,
  canonicalUrl: 'https://indianlalaji.com',
  customHeaderCode: `<!-- Super Admin SEO Custom Head Code -->
<meta name="application-name" content="IndianLalaji Lab OS" />`,
  customFooterCode: `<!-- Super Admin SEO Custom Footer Code -->`,
  schemaJsonLd: JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "IndianLalaji Pathology Lab OS",
      "url": "https://indianlalaji.com",
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Web, Windows, Android, macOS",
      "description": "Comprehensive NABL-compliant pathology lab operating system with instant patient report portal, WhatsApp reports, and ₹ INR billing.",
      "offers": {
        "@type": "Offer",
        "price": "4999",
        "priceCurrency": "INR"
      },
      "publisher": {
        "@type": "Organization",
        "name": "INDIANLALAJI.COM",
        "url": "https://indianlalaji.com",
        "logo": "https://indianlalaji.com/icon.svg"
      }
    },
    null,
    2
  ),
  updatedAt: new Date().toISOString(),
};

export interface PricingPlan {
  id: string;
  name: string;
  target: string;
  duration?: string;
  priceINR?: number;
  monthlyPriceINR: number;
  yearlyPriceINR: number;
  billingCycle?: string;
  description: string;
  isPopular: boolean;
  features: string[];
}

export interface CompanyFeature {
  id: string;
  title: string;
  description: string;
  category: string;
  badge?: string;
}

export interface LabManagementFeature {
  id: string;
  title: string;
  desc: string;
  category?: string;
  iconName?: string;
}

export interface CompanyFaq {
  id: string;
  question: string;
  answer: string;
  q?: string;
  a?: string;
  category?: string;
}

export interface CompanyStat {
  id: string;
  label: string;
  value: string;
  subtext: string;
}

export interface VendorWebsiteSections {
  announcementBar: boolean;
  header: boolean;
  hero: boolean;
  dashboardsShowcase: boolean;
  packages: boolean;
  testDirectory: boolean;
  whyChooseUs: boolean;
  doctors: boolean;
  branches: boolean;
  reportInterlink: boolean;
  footer: boolean;
}

export interface VendorBannerItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl: string;
  linkUrl?: string;
  buttonText?: string;
  active: boolean;
}

export interface VendorSocialLinks {
  enabled: boolean;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
}

export interface VendorLabSettings {
  labId?: string;
  labShopId?: string;
  _updatedAt?: string;
  labName: string;
  name?: string;
  tagline: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  ogImageUrl?: string;
  phone: string;
  helplinePhone?: string;
  whatsapp: string;
  nablAccreditationNo: string;
  nablNumber?: string;
  isoCert: string;
  openingHours: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  heroPromoText: string;
  emergencyHours: string;
  whatsappTemplate?: string;
  enableDigitalSignature?: boolean;
  enableLabStamp?: boolean;
  gstin?: string;
  pmcRegistrationNo?: string;
  email?: string;
  primaryColor?: string;
  domainPreview?: string;
  announcementText?: string;
  heroBackgroundImageUrl?: string;
  heroBanners?: string[];
  banners?: VendorBannerItem[];
  // About Us Section
  aboutBadgeText?: string;
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutStory?: string;
  aboutHeritage?: string;
  establishedYear?: number | string;
  // Section Headings & Paragraphs (Customizable by Vendor)
  packagesBadge?: string;
  packagesTitle?: string;
  packagesSubtitle?: string;
  testsBadge?: string;
  testsTitle?: string;
  testsSubtitle?: string;
  bookingBadge?: string;
  bookingTitle?: string;
  bookingSubtitle?: string;
  doctorsBadge?: string;
  doctorsTitle?: string;
  doctorsSubtitle?: string;
  whyChooseBadge?: string;
  whyChooseTitle?: string;
  whyChooseSubtitle?: string;
  branchesBadge?: string;
  branchesTitle?: string;
  branchesSubtitle?: string;
  contactTitle?: string;
  contactSubtitle?: string;
  reportCheckTitle?: string;
  reportCheckSubtitle?: string;
  // Founder Section
  founderName?: string;
  founderDesignation?: string;
  founderDegrees?: string;
  founderExperience?: string;
  founderBadge?: string;
  founderPhotoUrl?: string;
  founderMessage?: string;
  founderCredentials?: string[];
  // Team Section
  teamGroupPhotoUrl?: string;
  teamBannerUrl?: string;
  // Contact Us Map
  contactGoogleMapUrl?: string;
  // Social Media
  socialMedia?: VendorSocialLinks;
  // Legal Policies
  termsAndConditions?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
  sections?: Partial<VendorWebsiteSections>;
  // 1 or 2 QR Code images for payment
  qrCode1Url?: string;
  qrCode1Label?: string;
  upiId1?: string;
  qrCode2Url?: string;
  qrCode2Label?: string;
  upiId2?: string;
  upiId?: string;
  merchantName?: string;
  homeCollectionCharge?: number;
  websiteDomain?: string;
  isWebsiteApproved?: boolean;
  status?: VendorStatus;
  ownerPassword?: string;
  ownerPin?: string;
  ownerName?: string;
  // Site Settings & Plan Visibility
  faviconUrl?: string;
  featureImageUrl?: string;
  siteDescription?: string;
  siteName?: string;
  paymentQrUrl?: string;
  purchasedPlan?: '1 Month' | '3 Months' | '1 Year' | string;
  planPurchasedAt?: string;
  planExpiresAt?: string;
  planDurationDays?: number;
  remainingVisibilityDays?: number;
  // Booking Form Settings
  bookingTiming?: string;
  bookingTimeSlots?: string[];
  freeHomeCollectionThreshold?: number;
  statCollectionCharge?: number;
  // Payment Method Logic (Mutual Exclusion: Manual UPI vs PhonePe)
  activeOnlinePaymentMethod?: 'manual_upi' | 'phonepe'; // Only 1 Online Payment Method can be active at a time!
  isPayOnSpotEnabled?: boolean; // Separate option, can remain ON in both cases (defaults to true)
  isCustomDomainActive?: boolean; // Vendor custom domain active status
  // PhonePe Payment Gateway Credentials
  phonepeMerchantId?: string;
  phonepeSaltKey?: string;
  phonepeSaltIndex?: string;
  phonepeEnvironment?: 'SANDBOX' | 'PRODUCTION';
  phonepeAutoVerify?: boolean;
}

export interface VendorPackage {
  id: string;
  name: string;
  testsCount: number;
  description: string;
  priceINR: number;
  mrpINR: number;
  isPopular?: boolean;
  features: string[];
  labId?: string;
  imageUrl?: string;
}

export interface VendorDoctor {
  id: string;
  name: string;
  degrees: string;
  qualification?: string;
  designation?: string;
  roleCategory?: 'Pathologist' | 'Biochemist' | 'Microbiologist' | 'Technician' | 'Phlebotomist' | 'Receptionist';
  specialization: string;
  specialty?: string;
  specialExpertise?: string;
  experience: string;
  bio: string;
  avatarEmoji: string;
  imageUrl?: string;
  referralCommissionPct?: number;
  monthlyReferrals?: number;
  totalReferredBilling?: number;
  labId?: string;
}

export interface VendorBranch {
  id: string;
  name: string;
  badge: string;
  type?: string;
  address: string;
  phone: string;
  timings: string;
  timing?: string;
  isEmergency?: boolean;
  labId?: string;
}

export interface HomeCollectionBooking {
  id: string;
  patientName: string;
  mobile: string;
  address: string;
  timeSlot: string;
  packageOrTest: string;
  status: 'Pending' | 'Phlebotomist Assigned' | 'Sample Collected' | 'Report Delivered' | 'Cancelled';
  createdAt: string;
  labId?: string;
  branchId?: string;
  amountINR?: number;
  paymentMode?: string;
  transferredToReception?: boolean;
  transferredAt?: string;
  receptionToken?: string;
  receptionEntryId?: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number | string;
  notes?: string;
  bookingType?: 'home_collection' | 'lab_visit' | 'online_booking';
}

export interface ContactSubmission {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read';
  labId?: string;
  referenceToken?: string;
  replyNotes?: string;
  repliedAt?: string;
}

export type Language = 'en' | 'hi' | 'pa';

export interface TestItem {
  id: string;
  name: string;
  testName?: string;
  price?: number;
  code: string;
  category: string;
  sampleType: string;
  unit: string;
  normalRange: string;
  priceINR: number;
  mrpINR?: number;
  turnaroundTime?: string;
  turnaroundHours?: number | string;
  tatHours?: number;
  description?: string;
  isPopular?: boolean;
  labId?: string;
  status?: 'Active' | 'Inactive';
  isActive?: boolean;
  fastingRequired?: boolean;
  instructions?: string;
}

export type LabTest = TestItem;
export type LabPackage = VendorPackage;

export interface Patient {
  id: string;
  uhid: string;
  tokenNumber?: string;
  tokenNo?: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  city: string;
  referringDoctor: string;
  registeredAt: string;
  entryDate?: string;
  reportId: string;
  status: 'Sample Collected' | 'In Processing' | 'Pending Verification' | 'Report Ready' | 'Delivered' | 'Waiting' | 'In Testing' | 'Report Done';
  isDraft?: boolean;
  tests: string[];
  totalBill: number;
  paidAmount: number;
  dueAmount: number;
  paymentMode: 'UPI' | 'Cash' | 'Card' | 'PhonePe' | string;
  labId?: string;
  branchId?: string;
  branchName?: string;
  sentToReceptionDesk?: boolean;
  sentToReceptionAt?: string;
  technicianStatus?: string;
  returnedByTechnician?: boolean;
  returnReason?: string;
  returnedAt?: string;
  notes?: string;
}

export interface ReportItem {
  testName: string;
  parameter: string;
  result: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  notes?: string;
}

export interface LabReport {
  reportId: string;
  uhid: string;
  patientName: string;
  ageGender: string;
  mobile: string;
  doctor: string;
  sampleCollectedAt: string;
  reportedAt: string;
  labName: string;
  labAddress: string;
  labPhone: string;
  nablAccreditationNo: string;
  pathologist: string;
  pathologistDegrees: string;
  barcode: string;
  tokenNumber?: string;
  sampleType?: string;
  receptionId?: string;
  items: ReportItem[];
  verified: boolean;
  verificationHash: string;
  isDraft?: boolean;
  clinicalImpression?: string;
  status?: 'Normal' | 'Verified' | 'Cancelled';
  cancelled?: boolean;
  cancelReason?: string;
  totalAmount?: number;
  paidAmount?: number;
  isCancelled?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  labId?: string;
  branchId?: string;
  branchName?: string;
  pathologistSigned?: boolean;
  pathologistSignatureTime?: string;
  pathologistSignedBy?: string;
  isPublished?: boolean;
  publishedAt?: string;
  publishedBy?: string;
  paymentStatus?: string;
  dueAmount?: number;
  sentToReceptionDesk?: boolean;
  sentToReceptionAt?: string;
}

export interface BranchStat {
  id: string;
  name: string;
  city: string;
  patientsToday: number;
  testsToday: number;
  collectionToday: number;
  dueAmount: number;
  pendingReports: number;
  activeStaff: number;
}

export interface AuditEntry {
  id: string;
  time: string;
  action: string;
  actor: string;
  role: string;
  details: string;
  ip: string;
  labId?: string;
  tenantId?: string;
}

export type VendorStatus =
  | 'Active'
  | 'Draft'
  | 'Pending'
  | 'Processing due to payment confirmation'
  | 'Suspended';

export interface VendorLabDirectoryItem {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  ogImageUrl?: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  nablCode: string;
  badge: string;
  rating: number;
  activePackages: number;
  turnaroundTime: string;
  emergency: boolean;
  color: string;
  status: VendorStatus;
  isWebsiteApproved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  password?: string;
  pin?: string;
  ownerName?: string;
  email?: string;
  subscriptionPlan?: string;
  subscriptionAmount?: number;
  purchasedPlan?: string;
  planPurchasedAt?: string;
  planExpiresAt?: string;
  remainingVisibilityDays?: number;
  planStatusReason?: string;
  paymentMode?: string;
  paymentReference?: string;
  paymentNotes?: string;
  joinedDate?: string;
  domainPreview?: string;
  slug?: string;
  establishedYear?: number;
  reviewsCount?: number;
  features?: string[];
  _updatedAt?: string;
}

export interface PlanRenewalRequest {
  id: string;
  labId: string;
  labName: string;
  phone: string;
  currentPlan: string;
  currentExpiryDate?: string;
  requestedPlan: string;
  requestedDurationDays: number;
  amountINR: number;
  paymentMode?: string;
  notes?: string;
  createdAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ReceptionPatientEntry {
  id: string;
  uhid: string;
  tokenNumber?: string;
  tokenNo?: string;
  patientName: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  referringDoctor: string;
  tests?: string[];
  sampleType: string;
  totalAmount: number;
  discountINR?: number;
  paidAmount: number;
  dueAmount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'PhonePe' | string;
  paymentStatus: 'Full Payment' | 'Paid' | 'Advance' | 'Pending' | 'Partial' | 'Due' | 'Due Payment';
  status: 'Waiting' | 'Sample Collected' | 'In Lab' | 'Report Ready';
  registeredAt?: string;
  entryDate?: string;
  entryTime?: string;
  testNames?: string[];
  notes?: string;
  sentToTechnician?: boolean;
  technicianStatus?: 'Not Sent' | 'Sent to Lab' | 'Accepted' | 'Report Generated' | 'Pending' | 'Returned';
  sentToLabAt?: string;
  reportId?: string;
  technicianNotes?: string;
  balancePaidAmount?: number;
  balancePaymentMode?: 'Cash' | 'UPI' | 'Card' | 'PhonePe' | string;
  balancePaidAt?: string;
  labId?: string;
  branchId?: string;
  branchName?: string;
  bookingSource?: 'Counter' | 'Website' | 'App' | string;
  visitType?: 'Walk-in' | 'Home Collection' | string;
  address?: string;
  preferredTimeSlot?: string;
  upiTransactionRef?: string;
  receiptNumber?: string;
  paymentScreenshot?: string;
  paymentGateway?: 'Manual UPI' | 'PhonePe' | 'Pay on Spot';
  paymentGatewayTxnId?: string;
  autoVerified?: boolean;
  paymentVerificationStatus?: 'Pending Verification' | 'Verified' | 'Pay on Spot / Unpaid';
  homeCollectionCharges?: number;
  areaLocality?: string;
  city?: string;
  pincode?: string;
  selectedTestsBreakdown?: Array<{ name: string; price: number }>;
  isReportPublished?: boolean;
  publishedAt?: string;
  publishedBy?: string;
  receptionistId?: string;
  receptionistName?: string;
  technicianId?: string;
  technicianName?: string;
  sentToReceptionDesk?: boolean;
  sentToReceptionAt?: string;
  returnedByTechnician?: boolean;
  returnReason?: string;
  returnedAt?: string;
}

export type DomainRequestType = 'custom_domain' | 'subdomain';
export type DomainRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Active';

export interface DomainRequest {
  id: string;
  labId: string;
  labName: string;
  domainType: DomainRequestType;
  requestedDomain: string; // e.g., 'apexpathology.in' or 'apex.indianlalaji.com'
  currentDomain?: string; // previous or default subdomain e.g. 'apexdiagnostics.indianlalaji.com'
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  registrar?: string; // e.g. 'GoDaddy', 'Hostinger', 'Namecheap', 'Cloudflare'
  cnameTarget?: string; // default e.g. 'indianlalaji.com'
  aRecordIp?: string; // e.g. '34.149.120.45'
  dnsStatus?: 'Configured & Verified' | 'Pending DNS Propagation' | 'Pending Verification';
  sslStatus?: 'Active' | 'Pending Provisioning' | 'Failed';
  notes?: string;
  status: DomainRequestStatus;
  adminRemarks?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

