import React, { useState } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Eye,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  Layers,
  FileText,
  Shield,
  CreditCard,
  HelpCircle,
  Laptop,
  Smartphone,
  Database,
  Building,
  Check,
  X,
  Edit2,
  Save,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { PortalWebsiteSections, AppView } from '../../types';

interface WebsiteSectionsTabProps {
  onNavigateView: (view: AppView) => void;
  showToast: (msg: string) => void;
}

interface SectionMeta {
  key: keyof PortalWebsiteSections;
  name: string;
  category: 'Core' | 'Features' | 'Diagnostics' | 'Security' | 'Conversion';
  description: string;
  badge?: string;
}

const SECTIONS_CONFIG: SectionMeta[] = [
  {
    key: 'hero',
    name: 'Hero Section & Instant Demo Access',
    category: 'Core',
    description: 'Main display headline, announcement badge, call-to-action buttons, and preview.',
  },
  {
    key: 'trustStrip',
    name: 'Trust Strip & Lab Accreditations',
    category: 'Core',
    description: 'NABL, ICMR, ISO 9001:2015, and 100% Made in India trust markers.',
  },
  {
    key: 'problemSection',
    name: 'Challenges Faced by Traditional Diagnostic Labs',
    category: 'Core',
    description: 'Highlights manual transcription errors, WhatsApp chaos, and paper delays.',
  },
  {
    key: 'solutionSection',
    name: 'Unified Modern Diagnostic Solution',
    category: 'Core',
    description: 'Overview of modern laboratory architecture solving traditional operational bottlenecks.',
  },
  {
    key: 'workflow',
    name: '5-Step Pathological Workflow Engine',
    category: 'Features',
    description: 'Patient entry → Barcoding → Analyzer tests → Pathologist verification → Delivery.',
  },
  {
    key: 'features',
    name: 'Core Clinical Features & Smart Alerts',
    category: 'Features',
    description: 'Panic range notifications, abnormal reference flags, and digital signature stamps.',
  },
  {
    key: 'offline',
    name: '100% Offline Desktop Desk (USP #1)',
    category: 'Features',
    description: 'Allows patient registration and billing during internet outages with auto-sync.',
    badge: 'Flagship USP',
  },
  {
    key: 'patientPortal',
    name: 'Online Patient Report Download Portal (USP #2)',
    category: 'Features',
    description: 'Self-service patient report download using mobile number and token or UHID.',
    badge: 'Popular',
  },
  {
    key: 'vendorWebsitesShowcase',
    name: 'Partner Laboratories & Vendor Directory Showcase',
    category: 'Features',
    description: 'Interactive directory showcasing partnered clinical laboratories with dedicated sites.',
    badge: 'Vendor Hub',
  },
  {
    key: 'reportPreview',
    name: 'Interactive Diagnostic Report Preview',
    category: 'Diagnostics',
    description: 'Live interactive NABL-formatted lab report showing CBC, Lipid, and Thyroid profiles.',
  },
  {
    key: 'whatsapp',
    name: 'Automated Instant WhatsApp Delivery',
    category: 'Diagnostics',
    description: 'Dispatches signed PDF reports directly to patients and doctors on WhatsApp.',
  },
  {
    key: 'testLibrary',
    name: '500+ Pre-Configured Pathology Test Catalog',
    category: 'Diagnostics',
    description: 'Comprehensive test definitions with Indian clinical reference ranges and units.',
  },
  {
    key: 'staffRoles',
    name: 'Staff Roles & Permission Matrix',
    category: 'Security',
    description: 'Role-based access separating Reception, Lab Technician, Doctor, and Admin.',
  },
  {
    key: 'patientHistory',
    name: '10-Year Longitudinal Patient Medical History',
    category: 'Diagnostics',
    description: 'Track patient parameter trends (e.g. HbA1c, Creatinine) over multiple visits.',
  },
  {
    key: 'dataSafety',
    name: 'Bank-Grade Data Safety & Automated Backups',
    category: 'Security',
    description: 'Daily automated cloud snapshots, AES-256 encryption, and local backup vault.',
  },
  {
    key: 'security',
    name: 'DISHA & HIPAA Regulatory Compliance',
    category: 'Security',
    description: 'Ensures full compliance with Indian digital health data protection standards.',
  },
  {
    key: 'auditLog',
    name: 'Regulatory Audit Trail & Forensic Activity Log',
    category: 'Security',
    description: 'Every edit, reprint, and verification is permanently logged with timestamp and actor.',
  },
  {
    key: 'indianMarket',
    name: 'Built Specifically for Indian Diagnostic Labs',
    category: 'Security',
    description: 'Multi-language support (Hindi, Punjabi), UPI QR payments, and GST tax invoicing.',
  },
  {
    key: 'pricing',
    name: 'Transparent SaaS Pricing Packages',
    category: 'Conversion',
    description: 'Interactive monthly/annual pricing comparison with feature checklists.',
  },
  {
    key: 'demo',
    name: 'Interactive Video & Live Software Demo',
    category: 'Conversion',
    description: 'Schedule an in-depth walkthrough or request a 1-on-1 personalized demo.',
  },
  {
    key: 'finalCta',
    name: 'Final Call to Action (Book Live Demo)',
    category: 'Conversion',
    description: 'Prominent closing section encouraging new laboratories to digitize with the platform.',
  },
  {
    key: 'faq',
    name: 'Frequently Asked Questions (FAQ)',
    category: 'Conversion',
    description: 'Answers common questions regarding installation, WhatsApp API, and data migration.',
  },
  {
    key: 'footer',
    name: 'Portal Website Footer & Navigation',
    category: 'Core',
    description: 'Company information, social links, legal notices, and directory shortcuts.',
  },
];

export const WebsiteSectionsTab: React.FC<WebsiteSectionsTabProps> = ({
  onNavigateView,
  showToast,
}) => {
  const {
    portalSections,
    updatePortalSection,
    toggleAllPortalSections,
    companySettings,
    updateCompanySettings,
  } = useCms();

  const totalSections = SECTIONS_CONFIG.length;
  const activeCount = Object.values(portalSections).filter(Boolean).length;

  // Custom section text overrides
  const [customSectionContent, setCustomSectionContent] = useState<
    Record<string, { title?: string; description?: string; badge?: string }>
  >(() => {
    try {
      const saved = localStorage.getItem('cms_custom_sections_content');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [editingSection, setEditingSection] = useState<SectionMeta | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    badge: '',
    heroTitle: '',
    heroSubtitle: '',
    heroBadge: '',
    announcementText: '',
    supportPhone: '',
    supportEmail: '',
  });

  const handleOpenEditContent = (sec: SectionMeta) => {
    setEditingSection(sec);
    const custom = customSectionContent[sec.key] || {};
    setEditForm({
      title: custom.title || sec.name,
      description: custom.description || sec.description,
      badge: custom.badge || sec.badge || '',
      heroTitle: companySettings.heroTitle || '',
      heroSubtitle: companySettings.heroSubtitle || '',
      heroBadge: companySettings.heroBadge || '',
      announcementText: companySettings.announcementText || '',
      supportPhone: companySettings.supportPhone || '',
      supportEmail: companySettings.supportEmail || '',
    });
  };

  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    // Update section custom content
    const updatedCustom = {
      ...customSectionContent,
      [editingSection.key]: {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        badge: editForm.badge.trim(),
      },
    };
    setCustomSectionContent(updatedCustom);
    try {
      localStorage.setItem('cms_custom_sections_content', JSON.stringify(updatedCustom));
    } catch {}

    // If hero section, also update companySettings
    if (editingSection.key === 'hero') {
      updateCompanySettings({
        ...companySettings,
        heroTitle: editForm.heroTitle.trim() || companySettings.heroTitle,
        heroSubtitle: editForm.heroSubtitle.trim() || companySettings.heroSubtitle,
        heroBadge: editForm.heroBadge.trim() || companySettings.heroBadge,
        announcementText: editForm.announcementText.trim() || companySettings.announcementText,
      });
    }

    // If footer or contact, update support info
    if (editingSection.key === 'footer') {
      updateCompanySettings({
        ...companySettings,
        supportPhone: editForm.supportPhone.trim() || companySettings.supportPhone,
        supportEmail: editForm.supportEmail.trim() || companySettings.supportEmail,
      });
    }

    showToast(`Content for "${editingSection.name}" updated and saved successfully!`);
    setEditingSection(null);
  };

  const handleToggle = (key: keyof PortalWebsiteSections) => {
    const nextState = !portalSections[key];
    updatePortalSection(key, nextState);
    showToast(
      `${SECTIONS_CONFIG.find((s) => s.key === key)?.name || key} is now ${
        nextState ? 'visible (ON)' : 'hidden (OFF)'
      }`
    );
  };

  const handleEnableAll = () => {
    toggleAllPortalSections(true);
    showToast('All 24 website sections are now enabled and visible on the portal.');
  };

  const handleMinimalMode = () => {
    // Keep only essential sections
    toggleAllPortalSections(false);
    updatePortalSection('hero', true);
    updatePortalSection('vendorWebsitesShowcase', true);
    updatePortalSection('pricing', true);
    updatePortalSection('footer', true);
    showToast('Minimalist mode enabled (Hero, Vendor Showcase, Pricing, and Footer only).');
  };

  const handleResetDefaults = () => {
    toggleAllPortalSections(true);
    showToast('Restored all sections to default active state.');
  };

  // Group by category
  const categories = ['Core', 'Features', 'Diagnostics', 'Security', 'Conversion'] as const;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Website Edit — Website Sections</span>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Edit content (Edit conect) & Hide / Unhide with Toggle for all 24 homepage sections. Control headline texts, descriptions, badges, or toggle visibility instantly.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigateView('website')}
            className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Inspect changes on the live website"
          >
            <Eye className="w-3.5 h-3.5 text-amber-300" />
            <span>Preview Live Website</span>
          </button>
        </div>
      </div>

      {/* Control Strip & Counters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Active Counter */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">
            {activeCount}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              {activeCount} of {totalSections} Sections Active (Live on Portal)
            </div>
            <div className="text-[11px] text-slate-500">
              {totalSections - activeCount} section(s) currently hidden on public website
            </div>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleEnableAll}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Enable All Sections
          </button>
          <button
            onClick={handleMinimalMode}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Minimalist Mode
          </button>
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Section Categories */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const catSections = SECTIONS_CONFIG.filter((s) => s.category === cat);
          if (catSections.length === 0) return null;

          const catActiveCount = catSections.filter((s) => portalSections[s.key]).length;

          return (
            <div key={cat} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              {/* Category Header */}
              <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-slate-700">
                  <span>{cat} Sections</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px] text-slate-600 font-mono font-bold">
                    {catActiveCount} / {catSections.length} ON
                  </span>
                </div>
              </div>

              {/* Sections List */}
              <div className="divide-y divide-slate-100">
                {catSections.map((sec) => {
                  const isEnabled = !!portalSections[sec.key];
                  const custom = customSectionContent[sec.key];
                  const displayTitle = custom?.title || sec.name;
                  const displayDesc = custom?.description || sec.description;
                  const displayBadge = custom?.badge || sec.badge;

                  return (
                    <div
                      key={sec.key}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                        isEnabled ? 'bg-white' : 'bg-slate-50/50 opacity-75'
                      }`}
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900">{displayTitle}</h4>
                          {displayBadge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                              {displayBadge}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono px-2 py-0.2 rounded-md ${
                              isEnabled
                                ? 'bg-emerald-100 text-emerald-800 font-bold'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isEnabled ? '● Active on Live Site' : '○ Disabled (Hidden)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{displayDesc}</p>
                      </div>

                      {/* Controls: Edit content & Hide / Unhide with Toggle */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                        {/* Edit content Button (Edit conect) */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditContent(sec)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-900 text-slate-700 border border-slate-200 hover:border-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          title={`Edit content for ${sec.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Edit content</span>
                        </button>

                        {/* Hide / Unhide with Toggle Button */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500 hidden md:inline">
                            {isEnabled ? 'Unhidden' : 'Hidden'}
                          </span>
                          <button
                            onClick={() => handleToggle(sec.key)}
                            id={`toggle-section-${sec.key}`}
                            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#123B6D] focus:ring-offset-2 ${
                              isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                            role="switch"
                            aria-checked={isEnabled}
                            title={`Click to ${isEnabled ? 'Hide' : 'Unhide'} ${sec.name}`}
                          >
                            <span className="sr-only">Toggle {sec.name}</span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                isEnabled ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-slate-400'
                              }`}
                            >
                              {isEnabled ? <Check className="w-3.5 h-3.5 font-bold" /> : <X className="w-3.5 h-3.5" />}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Section Content Modal (Edit conect) */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#123B6D] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Edit Website Section Content: {editingSection.name}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Category: {editingSection.category} • Section Key: <code className="font-mono text-amber-300">{editingSection.key}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSection(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContent} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Display Title / Headline
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Subtitle / Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Badge Text (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flagship USP, NABL Compliant, Popular"
                  value={editForm.badge}
                  onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#123B6D] focus:outline-none"
                />
              </div>

              {/* Special fields for Hero Section */}
              {editingSection.key === 'hero' && (
                <div className="pt-3 border-t border-slate-200 space-y-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                  <div className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    Hero Section Specific Content:
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hero Announcement Top Bar
                    </label>
                    <input
                      type="text"
                      value={editForm.announcementText}
                      onChange={(e) => setEditForm({ ...editForm, announcementText: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hero Big Title
                    </label>
                    <input
                      type="text"
                      value={editForm.heroTitle}
                      onChange={(e) => setEditForm({ ...editForm, heroTitle: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hero Detailed Subtitle
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.heroSubtitle}
                      onChange={(e) => setEditForm({ ...editForm, heroSubtitle: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hero Trust Badge
                    </label>
                    <input
                      type="text"
                      value={editForm.heroBadge}
                      onChange={(e) => setEditForm({ ...editForm, heroBadge: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Special fields for Footer */}
              {editingSection.key === 'footer' && (
                <div className="pt-3 border-t border-slate-200 space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Footer Support Contact:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={editForm.supportPhone}
                        onChange={(e) => setEditForm({ ...editForm, supportPhone: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editForm.supportEmail}
                        onChange={(e) => setEditForm({ ...editForm, supportEmail: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Content (कंटेंट सेव करें)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
