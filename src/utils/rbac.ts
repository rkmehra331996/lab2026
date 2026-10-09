import { UserRole, RolePermissions, AppView, CmsUser } from '../types';

export interface RoleConfig {
  role: 'admin' | 'vendor' | 'branch_manager' | 'reception' | 'technician' | 'pathologist';
  title: string;
  hindiTitle: string;
  subtitle: string;
  emoji: string;
  badgeColor: string;
  defaultIdentifier: string;
  identifierLabel: string;
  identifierType: 'email' | 'tel' | 'text';
  defaultPassword: string;
  hasPin: boolean;
  defaultPin?: string;
  defaultLabId: string;
  defaultBranchId: string;
  defaultView: AppView;
  allowedViews: AppView[];
  permissionsDescription: string[];
  restrictedDescription: string[];
}

export const ALL_ROLES_CONFIG: Record<
  'super_admin' | 'lab_admin' | 'branch_manager' | 'receptionist' | 'technician' | 'pathologist',
  RoleConfig
> = {
  super_admin: {
    role: 'admin',
    title: 'Super Admin (SaaS Portal Owner)',
    hindiTitle: 'सुपर एडमिन (मास्टर पोर्टल ओनर)',
    subtitle: 'Full master authority over all diagnostics labs, SaaS plans, and global audit logs',
    emoji: '👑',
    badgeColor: 'bg-rose-500 text-white border-rose-600',
    defaultIdentifier: 'therkmehra331996@gmail.com',
    identifierLabel: 'Super Admin Email ID',
    identifierType: 'email',
    defaultPassword: 'Asdfzxcv@336699',
    hasPin: true,
    defaultPin: '331996',
    defaultLabId: 'all',
    defaultBranchId: 'all',
    defaultView: 'admin_dashboard',
    allowedViews: [
      'admin_dashboard',
      'vendor_dashboard',
      'branch_manager_dashboard',
      'reception_dashboard',
      'technician_dashboard',
      'pathologist_dashboard',
      'lab_app',
      'vendor_website',
      'website',
      'patient_portal',
    ],
    permissionsDescription: [
      'Global control across all registered diagnostic labs & branches',
      'Platform subscription pricing, licensing & SaaS billing control',
      'Directory of lab vendors & status overrides (Active/Suspended)',
      'Global security audit trail & system configurations',
    ],
    restrictedDescription: ['None (Super Admin has unrestricted system override)'],
  },
  lab_admin: {
    role: 'vendor',
    title: 'Lab Admin (Diagnostic Center Owner)',
    hindiTitle: 'लैब एडमिन (लैब संचालक / मेडिकल डायरेक्टर)',
    subtitle: 'Diagnostic Center Licensee • Full control over this lab, tests, pricing, and all branches',
    emoji: '🏢',
    badgeColor: 'bg-amber-500 text-slate-950 border-amber-600',
    defaultIdentifier: '9876543210',
    identifierLabel: 'Registered Mobile Number (10 Digits)',
    identifierType: 'tel',
    defaultPassword: 'LabOwner@2026#',
    hasPin: true,
    defaultPin: '123456',
    defaultLabId: 'lab-apex',
    defaultBranchId: 'all',
    defaultView: 'vendor_dashboard',
    allowedViews: [
      'vendor_dashboard',
      'branch_manager_dashboard',
      'reception_dashboard',
      'technician_dashboard',
      'pathologist_dashboard',
      'lab_app',
      'vendor_website',
      'patient_portal',
    ],
    permissionsDescription: [
      'Manage Lab branding, NABL accreditation, and Website CMS',
      'Configure 500+ test catalog, pricing, and health packages',
      'Manage referral doctors & B2B commission structures',
      'Oversee all branch collection centers & staff accounts',
      'Access lab-wide revenue analytics, GST & collection reports',
    ],
    restrictedDescription: ['Cannot modify global SaaS portal plans or other labs data'],
  },
  branch_manager: {
    role: 'branch_manager',
    title: 'Branch Manager (Center In-Charge)',
    hindiTitle: 'ब्रांच मैनेजर (शाखा प्रभारी)',
    subtitle: 'Supervises branch collections, counter cash reconciliation, staff, and sample courier dispatch',
    emoji: '📍',
    badgeColor: 'bg-blue-600 text-white border-blue-700',
    defaultIdentifier: 'manager.modeltown@apexlab.com',
    identifierLabel: 'Branch Manager Username / Email',
    identifierType: 'text',
    defaultPassword: 'manager123',
    hasPin: false,
    defaultLabId: 'lab-apex',
    defaultBranchId: 'branch-2',
    defaultView: 'branch_manager_dashboard',
    allowedViews: [
      'branch_manager_dashboard',
      'reception_dashboard',
      'vendor_website',
      'patient_portal',
    ],
    permissionsDescription: [
      'Monitor branch daily footfall and patient token worklist',
      'Branch cash drawer reconciliation & daily closing balance',
      'Cold-chain sample batch dispatch to Central Lab Hub',
      'Branch staff shift tracking & reception counter monitoring',
    ],
    restrictedDescription: [
      'Data locked strictly to assigned branch (Cannot view other branches)',
      'Cannot modify clinical test parameters or analyzer findings',
      'Cannot approve/sign medical diagnostic reports',
      'Cannot alter test master catalog pricing or doctor commissions',
    ],
  },
  receptionist: {
    role: 'reception',
    title: 'Receptionist (Front Desk & Billing)',
    hindiTitle: 'रिसेप्शनिस्ट (फ्रंट डेस्क एवं बिलिंग काउंटर)',
    subtitle: 'Patient registration, token generation, instant INR bills, UPI QR & balance dues collection',
    emoji: '🖥️',
    badgeColor: 'bg-teal-600 text-white border-teal-700',
    defaultIdentifier: 'reception@apexlab.com',
    identifierLabel: 'Receptionist Staff ID / Email',
    identifierType: 'text',
    defaultPassword: 'reception123',
    hasPin: false,
    defaultLabId: 'lab-apex',
    defaultBranchId: 'branch-1',
    defaultView: 'reception_dashboard',
    allowedViews: ['reception_dashboard', 'vendor_website', 'patient_portal'],
    permissionsDescription: [
      'Issue queue tokens & register new walk-in / referred patients',
      'Instant INR billing, print itemized receipt & sample barcodes',
      'Collect payments via Cash, Dynamic UPI QR, or Card',
      'Track partial dues & collect remaining balances',
      'Send sample to Lab Technician queue',
    ],
    restrictedDescription: [
      'Cannot view or edit lab test clinical findings or analyzer values',
      'Cannot digitally sign or authorize NABL medical reports',
      'Cannot view lab profit/loss or manage employee accounts',
      'Cannot modify test master price catalog',
    ],
  },
  technician: {
    role: 'technician',
    title: 'Technician (Lab Workstation & Analyzers)',
    hindiTitle: 'लैब टेक्नीशियन (टेस्टिंग एवं एनालाइजर वर्कस्टेशन)',
    subtitle: 'Sample accessioning, analyzer values entry, abnormal flags review, and report drafting',
    emoji: '🔬',
    badgeColor: 'bg-purple-600 text-white border-purple-700',
    defaultIdentifier: 'technician@apexlab.com',
    identifierLabel: 'Technician Staff ID / Email',
    identifierType: 'text',
    defaultPassword: 'tech123',
    hasPin: false,
    defaultLabId: 'lab-apex',
    defaultBranchId: 'branch-1',
    defaultView: 'technician_dashboard',
    allowedViews: ['technician_dashboard', 'lab_app', 'vendor_website'],
    permissionsDescription: [
      'Accession samples sent from reception & collection desks',
      'Enter quantitative & qualitative test parameter findings',
      'Highlight biological reference interval abnormal flags (High/Low)',
      'Draft laboratory reports for Pathologist review & sign-off',
    ],
    restrictedDescription: [
      'Cannot access billing counter, cash drawer, or due collection',
      'Cannot release unverified reports directly without doctor review',
      'Cannot alter test fees or doctor referral commissions',
    ],
  },
  pathologist: {
    role: 'pathologist',
    title: 'Pathologist (MD Clinical Reviewer & Signatory)',
    hindiTitle: 'पैथोलॉजिस्ट (एमडी डॉक्टर - रिपोर्ट अप्रूवल एवं सिग्नेचर)',
    subtitle: 'Clinical verification, critical value review, medical impression, and digital sign-off',
    emoji: '🩺',
    badgeColor: 'bg-indigo-600 text-white border-indigo-700',
    defaultIdentifier: 'pathologist@apexlab.com',
    identifierLabel: 'Doctor / Pathologist ID or Email',
    identifierType: 'text',
    defaultPassword: 'patho123',
    hasPin: false,
    defaultLabId: 'lab-apex',
    defaultBranchId: 'all',
    defaultView: 'pathologist_dashboard',
    allowedViews: [
      'pathologist_dashboard',
      'technician_dashboard',
      'lab_app',
      'vendor_website',
      'patient_portal',
    ],
    permissionsDescription: [
      'Clinical review of test findings submitted by technicians',
      'Immediate alert & action on critical/panic physiological values',
      'Add clinical impressions, differential diagnosis & doctor notes',
      '1-Click digital signature authorization & NABL stamp verification',
      'Release finalized verified reports to WhatsApp and Patient Portal',
    ],
    restrictedDescription: [
      'Restricted from front-desk billing and cashier cash handover',
      'Cannot alter company-level SaaS portal subscriptions',
    ],
  },
};

export interface LabOption {
  id: string;
  name: string;
  city: string;
  nablCode: string;
  branches: { id: string; name: string; type: string }[];
}

export const LAB_OPTIONS: LabOption[] = [
  {
    id: '1020304050',
    name: 'Lab 1 — Diagnostics & Path Care (1020304050)',
    city: 'New Delhi',
    nablCode: 'MC-1020',
    branches: [
      { id: 'branch-1', name: 'Device A — Reception & Billing Desk (1020304050)', type: 'Device A' },
      { id: 'branch-2', name: 'Device B — Testing Workstation (1020304050)', type: 'Device B' },
    ],
  },
  {
    id: '6070809010',
    name: 'Lab 2 — Clinical & Molecular Diagnostics (6070809010)',
    city: 'Gurugram',
    nablCode: 'MC-6070',
    branches: [
      { id: 'branch-1', name: 'Device A — Reception & Billing Desk (6070809010)', type: 'Device A' },
      { id: 'branch-2', name: 'Device B — Molecular Testing Workstation (6070809010)', type: 'Device B' },
    ],
  },
  {
    id: 'lab-apex',
    name: 'Apex Diagnostic & Clinical Pathology Laboratory',
    city: 'Ludhiana, Punjab',
    nablCode: 'MC-4821',
    branches: [
      { id: 'branch-1', name: 'Device A — Reception & Billing Desk (Counter 1)', type: 'Device A' },
      { id: 'branch-2', name: 'Device B — Lab Testing & Analyzer Workstation (Counter 2)', type: 'Device B' },
    ],
  },
  {
    id: 'lab-citycare',
    name: 'CityCare Advanced Diagnostics & Scan Centre',
    city: 'Mohali, Punjab',
    nablCode: 'MC-3912',
    branches: [
      { id: 'branch-1', name: 'Device A — Reception Counter', type: 'Device A' },
      { id: 'branch-2', name: 'Device B — Lab Testing Workstation', type: 'Device B' },
    ],
  },
  {
    id: 'lab-metropath',
    name: 'MetroPath Scans & Molecular Pathology Hub',
    city: 'Chandigarh',
    nablCode: 'MC-5104',
    branches: [
      { id: 'branch-1', name: 'Device A — Reception Counter', type: 'Device A' },
      { id: 'branch-2', name: 'Device B — Molecular Lab Workstation', type: 'Device B' },
    ],
  },
];

export const BRANCH_OPTIONS = [
  { id: 'branch-1', name: '🖥️ Device A — Reception & Billing Desk (Counter 1)', badge: 'Device A' },
  { id: 'branch-2', name: '💻 Device B — Lab Testing & Analyzer Workstation (Counter 2)', badge: 'Device B' },
];

export function getPermissionsForRole(role: string): RolePermissions {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return {
        canAccessSuperAdmin: true,
        canManageLabSettings: true,
        canManageBranches: true,
        canManageStaff: true,
        canViewAllBranchesData: true,
        canRegisterPatients: true,
        canCollectBilling: true,
        canEnterLabResults: true,
        canSignAndApproveReports: true,
        canViewFinancials: true,
        canDispatchWhatsApp: true,
        canReconcileCash: true,
      };
    case 'vendor':
    case 'lab_admin':
      return {
        canAccessSuperAdmin: false,
        canManageLabSettings: true,
        canManageBranches: true,
        canManageStaff: true,
        canViewAllBranchesData: true,
        canRegisterPatients: true,
        canCollectBilling: true,
        canEnterLabResults: true,
        canSignAndApproveReports: true,
        canViewFinancials: true,
        canDispatchWhatsApp: true,
        canReconcileCash: true,
      };
    case 'branch_manager':
      return {
        canAccessSuperAdmin: false,
        canManageLabSettings: false,
        canManageBranches: false,
        canManageStaff: false,
        canViewAllBranchesData: false,
        canRegisterPatients: true,
        canCollectBilling: true,
        canEnterLabResults: false,
        canSignAndApproveReports: false,
        canViewFinancials: true,
        canDispatchWhatsApp: true,
        canReconcileCash: true,
      };
    case 'reception':
    case 'receptionist':
      return {
        canAccessSuperAdmin: false,
        canManageLabSettings: false,
        canManageBranches: false,
        canManageStaff: false,
        canViewAllBranchesData: false,
        canRegisterPatients: true,
        canCollectBilling: true,
        canEnterLabResults: false,
        canSignAndApproveReports: false,
        canViewFinancials: false,
        canDispatchWhatsApp: true,
        canReconcileCash: false,
      };
    case 'technician':
      return {
        canAccessSuperAdmin: false,
        canManageLabSettings: false,
        canManageBranches: false,
        canManageStaff: false,
        canViewAllBranchesData: false,
        canRegisterPatients: false,
        canCollectBilling: false,
        canEnterLabResults: true,
        canSignAndApproveReports: false,
        canViewFinancials: false,
        canDispatchWhatsApp: false,
        canReconcileCash: false,
      };
    case 'pathologist':
      return {
        canAccessSuperAdmin: false,
        canManageLabSettings: false,
        canManageBranches: false,
        canManageStaff: false,
        canViewAllBranchesData: true,
        canRegisterPatients: false,
        canCollectBilling: false,
        canEnterLabResults: true,
        canSignAndApproveReports: true,
        canViewFinancials: false,
        canDispatchWhatsApp: true,
        canReconcileCash: false,
      };
    default:
      return {
        canAccessSuperAdmin: false,
        canManageLabSettings: false,
        canManageBranches: false,
        canManageStaff: false,
        canViewAllBranchesData: false,
        canRegisterPatients: false,
        canCollectBilling: false,
        canEnterLabResults: false,
        canSignAndApproveReports: false,
        canViewFinancials: false,
        canDispatchWhatsApp: false,
        canReconcileCash: false,
      };
  }
}

export function isUserAuthorizedForView(user: CmsUser | null, view: AppView): boolean {
  if (!user) return false;
  const role = user.role;

  if (view === 'admin_dashboard') {
    return role === 'admin';
  }

  if (view === 'vendor_dashboard') {
    return role === 'vendor' || role === 'admin';
  }

  if (view === 'branch_manager_dashboard') {
    return role === 'branch_manager' || role === 'vendor' || role === 'admin';
  }

  if (view === 'reception_dashboard') {
    return (
      role === 'reception' ||
      role === 'branch_manager' ||
      role === 'vendor' ||
      role === 'admin'
    );
  }

  if (view === 'technician_dashboard') {
    return (
      role === 'technician' ||
      role === 'pathologist' ||
      role === 'vendor' ||
      role === 'admin'
    );
  }

  if (view === 'pathologist_dashboard') {
    return (
      role === 'pathologist' ||
      role === 'vendor' ||
      role === 'admin'
    );
  }

  return true;
}
