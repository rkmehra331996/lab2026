import React, { useState, useEffect } from 'react';
import {
  Globe,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Check,
  Upload,
  Image as ImageIcon,
  Share2,
  Link as LinkIcon,
  Copy,
  Users,
  Edit2,
  Award,
  FileText,
  Shield,
  RotateCcw,
  Mail,
  MessageSquare,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  X,
  Camera,
  ChevronLeft,
  ChevronRight,
  Type,
  AlignLeft,
  ArrowRight,
  User,
} from 'lucide-react';
import { useCms, DEFAULT_ALL_VENDOR_DOCTORS } from '../../context/CmsContext';
import { VendorLabSettings, VendorBannerItem, VendorDoctor, VendorSocialLinks } from '../../types';
import { generateDefaultOgImage } from '../../utils/seo';
import { VendorPolicyModal, PolicyTabType } from './VendorPolicyModal';
import { optimizeImageFile } from '../../utils/imageOptimizer';

export type WebsiteSubSection =
  | 'banners'
  | 'about'
  | 'founder'
  | 'team'
  | 'contact'
  | 'social'
  | 'legal'
  | 'sections'
  | 'section_content';

interface VendorWebsiteCmsTabProps {
  onPreviewWebsite?: () => void;
  activeSubTab?: WebsiteSubSection;
  onSubTabChange?: (tab: WebsiteSubSection) => void;
}

export const PRESET_SPECIALIST_AVATARS = [
  {
    label: 'Receptionist / Front Desk (Female)',
    role: 'Receptionist',
    url: '/src/assets/images/team_pathologist_woman_1790345423035.jpg',
  },
  {
    label: 'Lab Technician / Technologist (Female)',
    role: 'Technician',
    url: '/src/assets/images/team_technologist_1790345481173.jpg',
  },
  {
    label: 'Consultant Pathologist (Female)',
    role: 'Pathologist',
    url: '/src/assets/images/team_pathologist_woman_1790345423035.jpg',
  },
  {
    label: 'Chief Pathologist (Male)',
    role: 'Pathologist',
    url: '/src/assets/images/founder_pathologist_1790345211989.jpg',
  },
  {
    label: 'Clinical Biochemist (Male)',
    role: 'Biochemist',
    url: '/src/assets/images/team_biochemist_1790345449541.jpg',
  },
  {
    label: 'Phlebotomist Lead (Male)',
    role: 'Phlebotomist',
    url: '/src/assets/images/team_phlebotomist_1790345465190.jpg',
  },
  {
    label: 'Diagnostic Lab Team',
    role: 'Team',
    url: '/src/assets/images/medical_lab_team_1790603478312.jpg',
  },
];

export const VendorWebsiteCmsTab: React.FC<VendorWebsiteCmsTabProps> = ({
  onPreviewWebsite,
  activeSubTab: externalSubTab,
  onSubTabChange,
}) => {
  const {
    vendorLabSettings,
    updateVendorLabSettings,
    vendorLabsList,
    selectedVendorLabId,
    currentUser,
    setVendorStatus,
    vendorDoctors,
    addVendorDoctor,
    updateVendorDoctor,
    deleteVendorDoctor,
  } = useCms();

  // Internal Sub-tab State
  const [internalSubTab, setInternalSubTab] = useState<WebsiteSubSection>('banners');
  const activeSubTab = (externalSubTab === 'sections' ? 'banners' : externalSubTab) || internalSubTab;

  const handleSelectSubTab = (tab: WebsiteSubSection) => {
    setInternalSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  const currentLabItem = vendorLabsList.find(
    (l) => l.id === (vendorLabSettings?.labId || selectedVendorLabId)
  ) || vendorLabsList.find(
    (l) => l.name?.toLowerCase() === (vendorLabSettings?.labName || vendorLabSettings?.name)?.toLowerCase()
  );

  const isDraft = currentLabItem
    ? (currentLabItem.status === 'Draft' || currentLabItem.status === 'Pending' || currentLabItem.status !== 'Active' || !currentLabItem.isWebsiteApproved)
    : false;

  // Local form for Website Details
  const [formData, setFormData] = useState<VendorLabSettings>({
    ...vendorLabSettings,
  });

  useEffect(() => {
    setFormData({
      ...vendorLabSettings,
    });
  }, [vendorLabSettings]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastText, setToastText] = useState('Website updates saved successfully!');

  // Confirmation state for deleting banners, team members, and credentials
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerToast = (msg: string) => {
    setToastText(msg);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // ==========================================
  // 1. BANNERS SECTION STATE & HANDLERS
  // ==========================================
  const [bannerList, setBannerList] = useState<VendorBannerItem[]>(() => {
    if (vendorLabSettings.banners && vendorLabSettings.banners.length > 0) {
      return vendorLabSettings.banners;
    }
    if (vendorLabSettings.heroBanners && vendorLabSettings.heroBanners.length > 0) {
      return vendorLabSettings.heroBanners.map((imgUrl, idx) => ({
        id: `banner-${idx + 1}`,
        title: idx === 0
          ? 'Advanced Diagnostic Pathology & Automated Biochemistry'
          : idx === 1
          ? 'Free Doorstep Home Sample Collection'
          : 'Preventative Full Body Health Screening Profiles',
        subtitle: idx === 0
          ? 'NABL Accredited & ISO 15189 Certified. 100% Verified Digital WhatsApp Reports.'
          : idx === 1
          ? 'Certified phlebotomists with temperature-monitored cold chain sample transit.'
          : 'Flat 50% discount on Comprehensive Executive Full Body Health Checkup.',
        badge: idx === 0 ? 'NABL ACCREDITED' : idx === 1 ? 'HOME COLLECTION' : 'SPECIAL OFFER',
        imageUrl: imgUrl,
        linkUrl: idx === 1 ? '#home-collection' : '#packages',
        buttonText: idx === 1 ? 'Book Sample Pickup' : 'Explore Packages',
        active: true,
      }));
    }
    return [
      {
        id: 'banner-1',
        title: 'Advanced Diagnostic Pathology & Automated Biochemistry',
        subtitle: 'NABL Accredited & ISO 15189 Certified. 100% Verified Digital WhatsApp Reports.',
        badge: 'NABL ACCREDITED',
        imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
        linkUrl: '#packages',
        buttonText: 'Explore Health Packages',
        active: true,
      },
    ];
  });

  const [editingBanner, setEditingBanner] = useState<VendorBannerItem | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState<VendorBannerItem>({
    id: '',
    title: '',
    subtitle: '',
    badge: 'SPECIAL OFFER',
    imageUrl: '',
    linkUrl: '#packages',
    buttonText: 'View Details',
    active: true,
  });

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      id: `banner-${Date.now()}`,
      title: 'Special Health Checkup Camp',
      subtitle: 'Accurate pathology testing with 100% verified digital reports on WhatsApp.',
      badge: 'LIMITED TIME',
      imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80',
      linkUrl: '#packages',
      buttonText: 'Book Now',
      active: true,
    });
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: VendorBannerItem) => {
    setEditingBanner(b);
    setBannerForm({ ...b });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: VendorBannerItem[];
    if (editingBanner) {
      updated = bannerList.map((b) => (b.id === editingBanner.id ? bannerForm : b));
    } else {
      updated = [bannerForm, ...bannerList];
    }
    setBannerList(updated);
    // Sync to context
    updateVendorLabSettings({
      banners: updated,
      heroBanners: updated.filter((b) => b.active).map((b) => b.imageUrl),
    });
    setIsBannerModalOpen(false);
    triggerToast(editingBanner ? 'Banner updated successfully!' : 'New banner added successfully!');
  };

  const handleDeleteBanner = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      message: 'Are you sure you want to delete this? This banner photo will be removed from your website and promotions.',
      onConfirm: () => {
        const updated = bannerList.filter((b) => b.id !== id);
        setBannerList(updated);
        updateVendorLabSettings({
          banners: updated,
          heroBanners: updated.filter((b) => b.active).map((b) => b.imageUrl),
        });
        setDeleteConfirm(null);
        triggerToast('Banner deleted successfully!');
      },
    });
  };

  const handleToggleBannerActive = (id: string) => {
    const updated = bannerList.map((b) => (b.id === id ? { ...b, active: !b.active } : b));
    setBannerList(updated);
    updateVendorLabSettings({
      banners: updated,
      heroBanners: updated.filter((b) => b.active).map((b) => b.imageUrl),
    });
    triggerToast('Banner status updated!');
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageFile(file, { maxWidth: 1200, maxHeight: 600, quality: 0.82 });
      if (optimized) {
        setBannerForm((prev) => ({ ...prev, imageUrl: optimized }));
      }
    } catch (err) {
      console.error('Error optimizing banner file:', err);
    }
    if (e.target) e.target.value = '';
  };

  // Simple Hero Banner Photo Upload (Pure image banners without complex codes)
  const [heroBanners, setHeroBanners] = useState<string[]>(() => {
    if (vendorLabSettings.heroBanners && vendorLabSettings.heroBanners.length > 0) {
      return vendorLabSettings.heroBanners;
    }
    return [
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80',
    ];
  });
  const [heroBannerUrlInput, setHeroBannerUrlInput] = useState('');
  const heroBannerFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (vendorLabSettings.heroBanners && vendorLabSettings.heroBanners.length > 0) {
      setHeroBanners(vendorLabSettings.heroBanners);
    }
  }, [vendorLabSettings.heroBanners]);

  const handleHeroBannerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageFile(file, { maxWidth: 1400, maxHeight: 700, quality: 0.82 });
      if (optimized) {
        const isDefaultStockOnly = heroBanners.every((b) => b.includes('unsplash.com'));
        const updated = isDefaultStockOnly ? [optimized] : [optimized, ...heroBanners];
        setHeroBanners(updated);
        updateVendorLabSettings({ heroBanners: updated });
        triggerToast('Hero banner photo uploaded & published to website!');
      }
    } catch (err) {
      console.error('Error optimizing hero banner:', err);
    }
    if (e.target) e.target.value = '';
  };

  const handleAddHeroBannerUrl = () => {
    const trimmed = heroBannerUrlInput.trim();
    if (!trimmed) return;
    const isDefaultStockOnly = heroBanners.every((b) => b.includes('unsplash.com'));
    const updated = isDefaultStockOnly ? [trimmed] : [trimmed, ...heroBanners];
    setHeroBanners(updated);
    updateVendorLabSettings({ heroBanners: updated });
    setHeroBannerUrlInput('');
    triggerToast('Hero banner photo added & published to website!');
  };

  const handleRemoveHeroBannerPhoto = (idx: number) => {
    const updated = heroBanners.filter((_, i) => i !== idx);
    setHeroBanners(updated);
    updateVendorLabSettings({ heroBanners: updated });
    triggerToast('Hero banner photo removed!');
  };

  const handleMoveHeroBanner = (idx: number, direction: 'prev' | 'next') => {
    const target = direction === 'prev' ? idx - 1 : idx + 1;
    if (target < 0 || target >= heroBanners.length) return;
    const updated = [...heroBanners];
    const [moved] = updated.splice(idx, 1);
    updated.splice(target, 0, moved);
    setHeroBanners(updated);
    updateVendorLabSettings({ heroBanners: updated });
    triggerToast('Hero banner order updated!');
  };

  // ==========================================
  // 2. ABOUT US SECTION FORM
  // ==========================================
  const [aboutForm, setAboutForm] = useState({
    aboutTitle: vendorLabSettings.aboutTitle || 'About Our Laboratory & Medical Leadership',
    aboutSubtitle: vendorLabSettings.aboutSubtitle || 'Serving patients, referring physicians, and hospital networks with uncompromising diagnostic precision, automated pathology, and compassionate care.',
    establishedYear: vendorLabSettings.establishedYear || 2012,
    aboutStory: vendorLabSettings.aboutStory || 'Founded with a singular dedication to diagnostic excellence, our laboratory bridges the gap between modern clinical science and patient-centered healthcare. From routine health panels to specialized diagnostic assays, our laboratory is trusted by families, clinicians, and medical networks.',
    aboutHeritage: vendorLabSettings.aboutHeritage || 'We operate in strict compliance with ISO 15189:2022 and NABL standards. Every specimen undergoes rigorous multi-tier internal quality controls (IQC) and participating International External Quality Assessment Schemes (EQAS). Equipped with advanced fully-automated biochemistry analyzers and 5-part hematology counters.',
  });

  const handleSaveAbout = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      ...aboutForm,
    });
    triggerToast('About Us section updated successfully!');
  };

  // ==========================================
  // 3. FOUNDER SECTION FORM
  // ==========================================
  const [founderForm, setFounderForm] = useState({
    founderName: vendorLabSettings.founderName || '',
    founderDesignation: vendorLabSettings.founderDesignation || '',
    founderDegrees: vendorLabSettings.founderDegrees || '',
    founderExperience: vendorLabSettings.founderExperience || '',
    founderBadge: vendorLabSettings.founderBadge || '',
    founderPhotoUrl: vendorLabSettings.founderPhotoUrl || '',
    founderMessage: vendorLabSettings.founderMessage || '',
    founderCredentials: vendorLabSettings.founderCredentials || [],
  });

  useEffect(() => {
    setFounderForm({
      founderName: vendorLabSettings.founderName || '',
      founderDesignation: vendorLabSettings.founderDesignation || '',
      founderDegrees: vendorLabSettings.founderDegrees || '',
      founderExperience: vendorLabSettings.founderExperience || '',
      founderBadge: vendorLabSettings.founderBadge || '',
      founderPhotoUrl: vendorLabSettings.founderPhotoUrl || '',
      founderMessage: vendorLabSettings.founderMessage || '',
      founderCredentials: vendorLabSettings.founderCredentials || [],
    });
  }, [vendorLabSettings.founderPhotoUrl, vendorLabSettings.founderName, vendorLabSettings.labId]);

  const [newCredential, setNewCredential] = useState('');

  const handleFounderPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
      if (optimized) {
        setFounderForm((prev) => ({ ...prev, founderPhotoUrl: optimized }));
        updateVendorLabSettings({ founderPhotoUrl: optimized });
        triggerToast('Founder DP uploaded and saved to Hostinger server!');
      }
    } catch (err) {
      console.error('Error optimizing founder photo:', err);
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveFounderPhoto = () => {
    setFounderForm((prev) => ({ ...prev, founderPhotoUrl: '' }));
    updateVendorLabSettings({ founderPhotoUrl: '' });
    triggerToast('Founder DP removed from server & database!');
  };

  const handleAddCredential = () => {
    if (!newCredential.trim()) return;
    setFounderForm((prev) => ({
      ...prev,
      founderCredentials: [...(prev.founderCredentials || []), newCredential.trim()],
    }));
    setNewCredential('');
  };

  const handleRemoveCredential = (index: number) => {
    const cred = (founderForm.founderCredentials || [])[index] || 'Credential';
    setDeleteConfirm({
      isOpen: true,
      message: `Are you sure you want to delete this? Credential: "${cred}".`,
      onConfirm: () => {
        setFounderForm((prev) => ({
          ...prev,
          founderCredentials: (prev.founderCredentials || []).filter((_, i) => i !== index),
        }));
        setDeleteConfirm(null);
      },
    });
  };

  const handleSaveFounder = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      ...founderForm,
    });
    triggerToast('Founder Section updated successfully!');
  };

  // ==========================================
  // 4. TEAM SECTION (ADD / EDIT / DELETE)
  // ==========================================
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<VendorDoctor | null>(null);
  const [teamForm, setTeamForm] = useState<Omit<VendorDoctor, 'id'>>({
    name: '',
    degrees: 'MBBS, MD (Pathology)',
    qualification: 'MD Pathology',
    designation: 'Consultant Pathologist',
    roleCategory: 'Pathologist',
    specialization: 'Clinical Pathology & Histopathology',
    specialExpertise: 'Hematology & Bone Marrow Aspiration',
    experience: '10+ Years Experience',
    bio: 'Dedicated medical laboratory specialist ensuring highest accuracy and prompt digital report validation.',
    avatarEmoji: '👨‍⚕️',
    imageUrl: '/src/assets/images/team_pathologist_woman_1790345423035.jpg',
  });

  const handleOpenAddTeam = () => {
    setEditingTeamMember(null);
    setTeamForm({
      name: '',
      degrees: 'MBBS, MD (Pathology)',
      qualification: 'MD Pathology',
      designation: 'Consultant Clinical Pathologist',
      roleCategory: 'Pathologist',
      specialization: 'Clinical Pathology',
      specialExpertise: 'Automated Hematology & Quality Assurance',
      experience: '8+ Years Experience',
      bio: 'Experienced clinical pathologist overseeing daily specimen verifications and critical alert findings.',
      avatarEmoji: '👨‍⚕️',
      imageUrl: '/src/assets/images/team_pathologist_woman_1790345423035.jpg',
    });
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (doc: VendorDoctor) => {
    setEditingTeamMember(doc);
    setTeamForm({
      name: doc.name,
      degrees: doc.degrees || doc.qualification || 'MBBS, MD',
      qualification: doc.qualification || doc.degrees,
      designation: doc.designation || 'Consultant Specialist',
      roleCategory: doc.roleCategory || 'Pathologist',
      specialization: doc.specialization || 'Clinical Pathology',
      specialExpertise: doc.specialExpertise || '',
      experience: doc.experience || '5+ Years Experience',
      bio: doc.bio || '',
      avatarEmoji: doc.avatarEmoji || '👨‍⚕️',
      imageUrl: doc.imageUrl || '',
    });
    setIsTeamModalOpen(true);
  };

  const handleRoleCategoryChange = (
    newRole: 'Pathologist' | 'Biochemist' | 'Microbiologist' | 'Technician' | 'Receptionist' | 'Phlebotomist'
  ) => {
    setTeamForm((prev) => {
      let degrees = prev.degrees;
      let designation = prev.designation;
      let specialization = prev.specialization;
      let bio = prev.bio;
      let imageUrl = prev.imageUrl;
      let avatarEmoji = prev.avatarEmoji || '👨‍⚕️';

      if (newRole === 'Receptionist') {
        if (!degrees || degrees.includes('MBBS') || degrees.includes('MD') || degrees.includes('DMLT')) {
          degrees = 'Graduate (B.A. / B.Com)';
        }
        if (!designation || designation.includes('Pathologist') || designation.includes('Specialist') || designation.includes('Technician')) {
          designation = 'Receptionist / Front Desk Executive';
        }
        if (!specialization || specialization.includes('Pathology') || specialization.includes('Histopathology')) {
          specialization = 'Front Desk & Patient Care';
        }
        if (!bio || bio.includes('specimen') || bio.includes('report validation')) {
          bio = 'Welcomes patients at the front counter, coordinates test bookings, handles patient billing, and provides instant digital report assistance.';
        }
        avatarEmoji = '👩‍💼';
        if (!imageUrl || imageUrl.includes('team_technologist') || imageUrl.includes('team_biochemist')) {
          imageUrl = '/src/assets/images/team_pathologist_woman_1790345423035.jpg';
        }
      } else if (newRole === 'Technician') {
        if (!degrees || degrees.includes('MBBS') || degrees.includes('MD') || degrees.includes('Graduate')) {
          degrees = 'DMLT / B.Sc Medical Lab Technology';
        }
        if (!designation || designation.includes('Pathologist') || designation.includes('Receptionist')) {
          designation = 'Senior Lab Technician';
        }
        if (!specialization || specialization.includes('Registration') || specialization.includes('Billing') || specialization.includes('Pathology')) {
          specialization = 'Automated Biochemistry & Hematology';
        }
        if (!bio || bio.includes('counter') || bio.includes('booking') || bio.includes('specimen verifications')) {
          bio = 'Performs precise laboratory diagnostic testing, operates automated clinical analyzers, and ensures rigorous quality control standards.';
        }
        avatarEmoji = '🔬';
        if (!imageUrl || imageUrl.includes('team_pathologist') || imageUrl.includes('team_phlebotomist')) {
          imageUrl = '/src/assets/images/team_technologist_1790345481173.jpg';
        }
      } else if (newRole === 'Phlebotomist') {
        if (!degrees || degrees.includes('MBBS') || degrees.includes('MD') || degrees.includes('Graduate')) {
          degrees = 'Diploma in Medical Laboratory Technology (DMLT)';
        }
        if (!designation || designation.includes('Pathologist') || designation.includes('Receptionist')) {
          designation = 'Senior Phlebotomist';
        }
        if (!specialization || specialization.includes('Registration')) {
          specialization = 'Home Sample Collection & Vacutainer Blood Draw';
        }
        avatarEmoji = '🩸';
        if (!imageUrl) {
          imageUrl = '/src/assets/images/team_phlebotomist_1790345465190.jpg';
        }
      } else if (newRole === 'Biochemist') {
        if (!degrees || degrees.includes('DMLT') || degrees.includes('Graduate')) {
          degrees = 'M.Sc (Medical Biochemistry)';
        }
        if (!designation || designation.includes('Receptionist') || designation.includes('Technician')) {
          designation = 'Senior Clinical Biochemist';
        }
        if (!specialization || specialization.includes('Registration')) {
          specialization = 'Clinical Biochemistry & Hormonal Immunoassays';
        }
        avatarEmoji = '🧪';
        if (!imageUrl) {
          imageUrl = '/src/assets/images/team_biochemist_1790345449541.jpg';
        }
      } else if (newRole === 'Pathologist') {
        if (!degrees || degrees.includes('DMLT') || degrees.includes('Graduate')) {
          degrees = 'MBBS, MD (Pathology)';
        }
        if (!designation || designation.includes('Receptionist') || designation.includes('Technician')) {
          designation = 'Consultant Clinical Pathologist';
        }
        if (!specialization || specialization.includes('Registration')) {
          specialization = 'Clinical Pathology & Histopathology';
        }
        avatarEmoji = '👨‍⚕️';
        if (!imageUrl) {
          imageUrl = '/src/assets/images/team_pathologist_woman_1790345423035.jpg';
        }
      }

      return {
        ...prev,
        roleCategory: newRole,
        degrees,
        qualification: degrees,
        designation,
        specialization,
        bio,
        imageUrl,
        avatarEmoji,
      };
    });
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    const effectiveLabId = selectedVendorLabId || vendorLabSettings.labId || 'lab-apex';
    const payload = {
      ...teamForm,
      labId: effectiveLabId,
      degrees: teamForm.degrees?.trim() || (teamForm.roleCategory === 'Receptionist' ? 'Front Desk Executive' : teamForm.roleCategory === 'Technician' ? 'DMLT' : 'Clinical Specialist'),
      qualification: teamForm.qualification || teamForm.degrees,
      specialization: teamForm.specialization?.trim() || (teamForm.roleCategory === 'Receptionist' ? 'Front Desk & Patient Care' : teamForm.roleCategory === 'Technician' ? 'Diagnostic Testing' : 'Pathology'),
    };

    if (editingTeamMember) {
      updateVendorDoctor(editingTeamMember.id, payload);
      triggerToast(`Team member "${teamForm.name}" updated successfully!`);
    } else {
      addVendorDoctor(payload);
      triggerToast(`New team member "${teamForm.name}" added successfully!`);
    }
    setIsTeamModalOpen(false);
  };

  const handleDeleteTeam = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      message: `Are you sure you want to delete this? Team member: "${name}".`,
      onConfirm: () => {
        deleteVendorDoctor(id);
        setDeleteConfirm(null);
        triggerToast(`Team member "${name}" removed.`);
      },
    });
  };

  const handleTeamPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
      if (optimized) {
        setTeamForm((prev) => ({ ...prev, imageUrl: optimized }));
      }
    } catch (err) {
      console.error('Error optimizing team photo:', err);
    }
    if (e.target) e.target.value = '';
  };


  const handleQuickDoctorPhotoUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await optimizeImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
      if (optimized) {
        const targetDoc = vendorDoctors.find((d) => d.id === docId);
        if (targetDoc) {
          updateVendorDoctor(docId, { ...targetDoc, imageUrl: optimized });
          triggerToast(`Photo updated for ${targetDoc.name}!`);
        }
      }
    } catch (err) {
      console.error('Error optimizing doctor photo:', err);
    }
    if (e.target) e.target.value = '';
  };

  // ==========================================
  // 5. CONTACT US SECTION FORM
  // ==========================================
  const [contactForm, setContactForm] = useState({
    phone: vendorLabSettings.phone || '',
    helplinePhone: vendorLabSettings.helplinePhone || '',
    whatsapp: vendorLabSettings.whatsapp || '',
    email: vendorLabSettings.email || '',
    address: vendorLabSettings.address || '',
    openingHours: vendorLabSettings.openingHours || 'Open 7:00 AM – 9:00 PM (All 7 Days)',
    emergencyHours: vendorLabSettings.emergencyHours || '24x7 Emergency Services at Central Lab',
    contactGoogleMapUrl: vendorLabSettings.contactGoogleMapUrl || '',
  });

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      ...contactForm,
    });
    triggerToast('Contact Us details updated successfully!');
  };

  // ==========================================
  // 6. SOCIAL MEDIA SECTION FORM (Edit, Disable & Smart Normalization)
  // ==========================================
  const normalizeSocialUrl = (
    platform: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'linkedin' | 'whatsapp',
    input?: string
  ): string => {
    if (!input) return '';
    const trimmed = input.trim();
    if (!trimmed || trimmed === '#' || trimmed === '/') return '';

    // If already full http(s) URL
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    const clean = trimmed.startsWith('@') ? trimmed.slice(1).trim() : trimmed;

    switch (platform) {
      case 'facebook':
        if (clean.startsWith('facebook.com/') || clean.startsWith('www.facebook.com/')) {
          return `https://${clean}`;
        }
        return `https://facebook.com/${clean}`;

      case 'instagram':
        if (clean.startsWith('instagram.com/') || clean.startsWith('www.instagram.com/')) {
          return `https://${clean}`;
        }
        return `https://instagram.com/${clean}`;

      case 'twitter':
        if (
          clean.startsWith('twitter.com/') ||
          clean.startsWith('x.com/') ||
          clean.startsWith('www.twitter.com/') ||
          clean.startsWith('www.x.com/')
        ) {
          return `https://${clean}`;
        }
        return `https://x.com/${clean}`;

      case 'youtube':
        if (clean.startsWith('youtube.com/') || clean.startsWith('www.youtube.com/')) {
          return `https://${clean}`;
        }
        return clean.startsWith('@') ? `https://youtube.com/${clean}` : `https://youtube.com/@${clean}`;

      case 'linkedin':
        if (clean.startsWith('linkedin.com/') || clean.startsWith('www.linkedin.com/')) {
          return `https://${clean}`;
        }
        return `https://linkedin.com/company/${clean}`;

      case 'whatsapp': {
        if (trimmed.includes('wa.me') || trimmed.includes('api.whatsapp.com')) {
          return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        }
        const digits = trimmed.replace(/\D/g, '');
        if (digits.length === 10) {
          return `https://wa.me/91${digits}`;
        } else if (digits.length > 10) {
          return `https://wa.me/${digits}`;
        }
        return digits ? `https://wa.me/${digits}` : '';
      }

      default:
        return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    }
  };

  const sanitizeInitialSocial = (val?: string) => {
    if (!val) return '';
    const trimmed = val.trim();
    const lower = trimmed.toLowerCase();
    if (
      lower === 'https://facebook.com' ||
      lower === 'https://facebook.com/' ||
      lower === 'https://www.facebook.com' ||
      lower === 'https://www.facebook.com/' ||
      lower === 'http://facebook.com' ||
      lower === 'http://facebook.com/' ||
      lower === 'https://instagram.com' ||
      lower === 'https://instagram.com/' ||
      lower === 'https://www.instagram.com' ||
      lower === 'https://www.instagram.com/' ||
      lower === 'http://instagram.com' ||
      lower === 'http://instagram.com/' ||
      lower === 'https://twitter.com' ||
      lower === 'https://twitter.com/' ||
      lower === 'https://www.twitter.com' ||
      lower === 'https://www.twitter.com/' ||
      lower === 'https://x.com' ||
      lower === 'https://x.com/' ||
      lower === 'https://www.x.com' ||
      lower === 'https://www.x.com/' ||
      lower === 'https://youtube.com' ||
      lower === 'https://youtube.com/' ||
      lower === 'https://www.youtube.com' ||
      lower === 'https://www.youtube.com/' ||
      lower === 'https://linkedin.com' ||
      lower === 'https://linkedin.com/' ||
      lower === 'https://www.linkedin.com' ||
      lower === 'https://www.linkedin.com/' ||
      lower === '#' ||
      lower === '/'
    ) {
      return '';
    }
    return trimmed;
  };

  const targetEffectiveLabId = vendorLabSettings.labId || selectedVendorLabId || 'lab-apex';

  const [socialForm, setSocialForm] = useState<VendorSocialLinks>(() => {
    try {
      const backup =
        localStorage.getItem(`cms_vendor_social_media_${targetEffectiveLabId}`) ||
        localStorage.getItem('cms_vendor_social_media');
      if (backup) {
        const parsed = JSON.parse(backup);
        if (parsed && typeof parsed === 'object') {
          return {
            enabled: parsed.enabled !== false,
            facebook: parsed.facebook || '',
            instagram: parsed.instagram || '',
            twitter: parsed.twitter || '',
            youtube: parsed.youtube || '',
            linkedin: parsed.linkedin || '',
            whatsapp: parsed.whatsapp || '',
          };
        }
      }
    } catch {}

    return {
      enabled: vendorLabSettings.socialMedia?.enabled !== false,
      facebook: sanitizeInitialSocial(vendorLabSettings.socialMedia?.facebook),
      instagram: sanitizeInitialSocial(vendorLabSettings.socialMedia?.instagram),
      twitter: sanitizeInitialSocial(vendorLabSettings.socialMedia?.twitter),
      youtube: sanitizeInitialSocial(vendorLabSettings.socialMedia?.youtube),
      linkedin: sanitizeInitialSocial(vendorLabSettings.socialMedia?.linkedin),
      whatsapp: vendorLabSettings.socialMedia?.whatsapp?.trim() || '',
    };
  });

  const isSocialDirtyRef = React.useRef(false);
  const currentSocialLabIdRef = React.useRef(targetEffectiveLabId);
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [socialSavedSuccess, setSocialSavedSuccess] = useState(false);

  // Sync when labId changes or when vendorLabSettings updates, provided user is not actively typing
  useEffect(() => {
    const isLabSwitch = Boolean(vendorLabSettings.labId && vendorLabSettings.labId !== currentSocialLabIdRef.current);
    if (isLabSwitch) {
      currentSocialLabIdRef.current = vendorLabSettings.labId;
      isSocialDirtyRef.current = false;
    }

    if (!isSocialDirtyRef.current || isLabSwitch) {
      let initialData = vendorLabSettings.socialMedia;
      const targetId = vendorLabSettings.labId || targetEffectiveLabId;
      try {
        const backup =
          localStorage.getItem(`cms_vendor_social_media_${targetId}`) ||
          localStorage.getItem('cms_vendor_social_media');
        if (backup) {
          const parsed = JSON.parse(backup);
          if (parsed && typeof parsed === 'object') {
            initialData = { ...(initialData || {}), ...parsed };
          }
        }
      } catch {}

      if (initialData) {
        setSocialForm({
          enabled: initialData.enabled !== false,
          facebook: sanitizeInitialSocial(initialData.facebook),
          instagram: sanitizeInitialSocial(initialData.instagram),
          twitter: sanitizeInitialSocial(initialData.twitter),
          youtube: sanitizeInitialSocial(initialData.youtube),
          linkedin: sanitizeInitialSocial(initialData.linkedin),
          whatsapp: initialData.whatsapp?.trim() || '',
        });
      }
    }
  }, [vendorLabSettings.labId, vendorLabSettings.socialMedia, targetEffectiveLabId]);

  const handleSaveSocial = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSavingSocial(true);
    isSocialDirtyRef.current = false;

    const targetLabId = vendorLabSettings.labId || selectedVendorLabId || 'lab-apex';

    const cleanedSocial: VendorSocialLinks = {
      enabled: true,
      facebook: normalizeSocialUrl('facebook', socialForm.facebook),
      instagram: normalizeSocialUrl('instagram', socialForm.instagram),
      twitter: normalizeSocialUrl('twitter', socialForm.twitter),
      youtube: normalizeSocialUrl('youtube', socialForm.youtube),
      linkedin: normalizeSocialUrl('linkedin', socialForm.linkedin),
      whatsapp: normalizeSocialUrl('whatsapp', socialForm.whatsapp),
    };

    // 1. Immediately retain normalized links in form inputs
    setSocialForm(cleanedSocial);

    // 2. Persist to dedicated local backup so they never disappear
    try {
      localStorage.setItem(`cms_vendor_social_media_${targetLabId}`, JSON.stringify(cleanedSocial));
      localStorage.setItem('cms_vendor_social_media', JSON.stringify(cleanedSocial));
    } catch {}

    // 3. Update CmsContext & send to cloud storage
    updateVendorLabSettings({
      labId: targetLabId,
      socialMedia: cleanedSocial,
    });

    // 4. Keep parent formData in sync
    setFormData((prev) => ({
      ...prev,
      socialMedia: cleanedSocial,
    }));

    setTimeout(() => {
      setIsSavingSocial(false);
      setSocialSavedSuccess(true);
      setTimeout(() => setSocialSavedSuccess(false), 4000);
      triggerToast('Social Media settings saved! Active links are now live on your website.');
    }, 250);
  };

  const handleClearAllSocial = () => {
    const targetLabId = vendorLabSettings.labId || selectedVendorLabId || 'lab-apex';
    isSocialDirtyRef.current = false;
    const emptied: VendorSocialLinks = {
      enabled: true,
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      linkedin: '',
      whatsapp: '',
    };
    setSocialForm(emptied);
    try {
      localStorage.setItem(`cms_vendor_social_media_${targetLabId}`, JSON.stringify(emptied));
      localStorage.setItem('cms_vendor_social_media', JSON.stringify(emptied));
    } catch {}
    updateVendorLabSettings({
      labId: targetLabId,
      socialMedia: emptied,
    });
    setFormData((prev) => ({
      ...prev,
      socialMedia: emptied,
    }));
    triggerToast('All social media links cleared. Icons hidden from website.');
  };

  // ==========================================
  // 7. LEGAL PAGES SECTION FORM (T&C, P&P, Refund)
  // ==========================================
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'refund'>('terms');
  const [legalForm, setLegalForm] = useState({
    termsAndConditions: vendorLabSettings.termsAndConditions || '',
    privacyPolicy: vendorLabSettings.privacyPolicy || '',
    refundPolicy: vendorLabSettings.refundPolicy || '',
  });

  const [isPreviewPolicyModalOpen, setIsPreviewPolicyModalOpen] = useState(false);

  const handleSaveLegal = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      ...legalForm,
    });
    triggerToast('Legal policies saved successfully!');
  };

  const handleResetLegalToDefault = (type: 'terms' | 'privacy' | 'refund') => {
    if (type === 'terms') {
      const def = `1. ACCEPTANCE OF TERMS: By accessing or utilizing the services provided by this diagnostic laboratory, patients and referring healthcare providers agree to abide by all clinical laboratory terms and protocols.
2. DIAGNOSTIC SERVICES & TESTING: All testing is performed under strictly regulated NABL accredited and ISO 15189 standards using calibrated automated analyzers. Reports reflect specimen findings at the time of collection.
3. SAMPLE COLLECTION & FASTING PROTOCOLS: Certain clinical tests mandate pre-test fasting, medication adjustments, or specific dietary preparations. Failure to adhere may affect diagnostic accuracy.
4. DELIVERY OF RESULTS: Verified digital reports are dispatched via secure WhatsApp PDF and online patient portal. In cases of critical alert values, referring clinicians or patient emergency contacts will be promptly notified.
5. LIMITATION OF LIABILITY: Test results should always be correlated with clinical symptoms and interpreted by a registered medical practitioner. No medical diagnosis is conclusive based solely on an isolated report.`;
      setLegalForm((prev) => ({ ...prev, termsAndConditions: def }));
    } else if (type === 'privacy') {
      const def = `1. DATA CONFIDENTIALITY: We uphold stringent patient privacy and medical confidentiality in compliance with medical data security standards and healthcare data protection laws.
2. COLLECTION OF INFORMATION: We collect necessary demographic and clinical details (e.g., patient name, age, gender, contact number, referring doctor) solely for accurate test processing, billing, and report generation.
3. DIGITAL REPORT ACCESS: Patient test results are accessible only via authenticated credentials (Unique Report ID & registered Mobile Number) or direct authorized WhatsApp transmission.
4. THIRD-PARTY SHARING: Patient diagnostic records are never sold, rented, or disclosed to unauthorized commercial third parties. Data is shared exclusively with treating medical practitioners upon patient consent or as required by statutory public health mandates.
5. DATA STORAGE & RETENTION: Physical specimen records and digital pathology logs are safely archived in accordance with statutory medical record retention schedules.`;
      setLegalForm((prev) => ({ ...prev, privacyPolicy: def }));
    } else if (type === 'refund') {
      const def = `1. CANCELLATION BEFORE SAMPLE COLLECTION: If a patient cancels a scheduled laboratory test or home sample collection appointment before the phlebotomist visits or sample is drawn, a 100% full refund will be processed promptly.
2. POST-COLLECTION STATUS: Once a biological specimen has been collected, transported, or processed in the laboratory analyzer, cancellations or refunds cannot be issued due to incurred reagent and consumable costs.
3. FAILED OR INCONCLUSIVE SAMPLES: In the rare event of hemolysis, lipemia, or insufficient sample volume necessitating a repeat test, a free recollected sample will be processed at no additional charge to the patient.
4. REFUND DISPATCH TIMELINE: Approved digital payment refunds are credited back to the original source UPI / Bank Account within 2 to 5 business days.`;
      setLegalForm((prev) => ({ ...prev, refundPolicy: def }));
    }
    triggerToast('Reset to standard medical policy template.');
  };

  // ==========================================
  // 9. SECTION TITLES & PARAGRAPHS STATE & HANDLERS
  // ==========================================
  const [sectionTextForm, setSectionTextForm] = useState({
    // 1. Health Packages
    packagesBadge: vendorLabSettings.packagesBadge || 'Preventive Health Packages',
    packagesTitle: vendorLabSettings.packagesTitle || 'Comprehensive Health Checkups for Complete Wellness',
    packagesSubtitle: vendorLabSettings.packagesSubtitle !== undefined ? vendorLabSettings.packagesSubtitle : '',
    // 2. About Us Accreditation & Story
    aboutBadgeText: vendorLabSettings.aboutBadgeText || 'Trusted & Accredited Diagnostic Laboratory',
    aboutTitle: vendorLabSettings.aboutTitle || 'About Our Laboratory & Medical Leadership',
    aboutSubtitle: vendorLabSettings.aboutSubtitle || 'Serving patients, referring physicians, and hospital networks with uncompromising diagnostic precision, automated pathology, and compassionate care.',
    // 3. Diagnostic Tests Directory
    testsBadge: vendorLabSettings.testsBadge || 'Diagnostic Tests & Profiles',
    testsTitle: vendorLabSettings.testsTitle || 'Book Pathology Tests Online',
    testsSubtitle: vendorLabSettings.testsSubtitle !== undefined ? vendorLabSettings.testsSubtitle : 'Search tests by name with transparent rates, specimen requirements, and home collection.',
    // 4. Lab Test & Health Booking
    bookingBadge: vendorLabSettings.bookingBadge || 'Diagnostic Test & Health Booking',
    bookingTitle: vendorLabSettings.bookingTitle || 'Lab Test & Health Booking',
    bookingSubtitle: vendorLabSettings.bookingSubtitle !== undefined ? vendorLabSettings.bookingSubtitle : 'Fill the details below to book pathology tests with optional home sample collection or direct branch visit.',
    // 5. Medical Experts / Doctors
    doctorsBadge: vendorLabSettings.doctorsBadge || 'Qualified Clinical & Laboratory Team',
    doctorsTitle: vendorLabSettings.doctorsTitle || 'Our Medical & Laboratory Experts',
    doctorsSubtitle: vendorLabSettings.doctorsSubtitle !== undefined ? vendorLabSettings.doctorsSubtitle : 'Experienced Pathologists, Biochemists & Senior Technicians ensuring accurate diagnostics and timely reports.',
    // 6. Patient Report Download
    reportCheckTitle: vendorLabSettings.reportCheckTitle || 'Check & Download Patient Lab Report',
    reportCheckSubtitle: vendorLabSettings.reportCheckSubtitle !== undefined ? vendorLabSettings.reportCheckSubtitle : 'Access your verified diagnostic reports directly using your registered mobile number or Token Number.',
    // 7. Contact Us
    contactTitle: vendorLabSettings.contactTitle || 'Contact Us',
    contactSubtitle: vendorLabSettings.contactSubtitle !== undefined ? vendorLabSettings.contactSubtitle : 'Connect with our laboratory desk or submit an inquiry form below.',
  });

  useEffect(() => {
    setSectionTextForm({
      packagesBadge: vendorLabSettings.packagesBadge || 'Preventive Health Packages',
      packagesTitle: vendorLabSettings.packagesTitle || 'Comprehensive Health Checkups for Complete Wellness',
      packagesSubtitle: vendorLabSettings.packagesSubtitle !== undefined ? vendorLabSettings.packagesSubtitle : '',
      aboutBadgeText: vendorLabSettings.aboutBadgeText || 'Trusted & Accredited Diagnostic Laboratory',
      aboutTitle: vendorLabSettings.aboutTitle || 'About Our Laboratory & Medical Leadership',
      aboutSubtitle: vendorLabSettings.aboutSubtitle || 'Serving patients, referring physicians, and hospital networks with uncompromising diagnostic precision, automated pathology, and compassionate care.',
      testsBadge: vendorLabSettings.testsBadge || 'Diagnostic Tests & Profiles',
      testsTitle: vendorLabSettings.testsTitle || 'Book Pathology Tests Online',
      testsSubtitle: vendorLabSettings.testsSubtitle !== undefined ? vendorLabSettings.testsSubtitle : 'Search tests by name with transparent rates, specimen requirements, and home collection.',
      bookingBadge: vendorLabSettings.bookingBadge || 'Diagnostic Test & Health Booking',
      bookingTitle: vendorLabSettings.bookingTitle || 'Lab Test & Health Booking',
      bookingSubtitle: vendorLabSettings.bookingSubtitle !== undefined ? vendorLabSettings.bookingSubtitle : 'Fill the details below to book pathology tests with optional home sample collection or direct branch visit.',
      doctorsBadge: vendorLabSettings.doctorsBadge || 'Qualified Clinical & Laboratory Team',
      doctorsTitle: vendorLabSettings.doctorsTitle || 'Our Medical & Laboratory Experts',
      doctorsSubtitle: vendorLabSettings.doctorsSubtitle !== undefined ? vendorLabSettings.doctorsSubtitle : 'Experienced Pathologists, Biochemists & Senior Technicians ensuring accurate diagnostics and timely reports.',
      reportCheckTitle: vendorLabSettings.reportCheckTitle || 'Check & Download Patient Lab Report',
      reportCheckSubtitle: vendorLabSettings.reportCheckSubtitle !== undefined ? vendorLabSettings.reportCheckSubtitle : 'Access your verified diagnostic reports directly using your registered mobile number or Token Number.',
      contactTitle: vendorLabSettings.contactTitle || 'Contact Us',
      contactSubtitle: vendorLabSettings.contactSubtitle !== undefined ? vendorLabSettings.contactSubtitle : 'Connect with our laboratory desk or submit an inquiry form below.',
    });
  }, [vendorLabSettings]);

  const handleSaveSectionTexts = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorLabSettings({
      ...sectionTextForm,
    });
    triggerToast('Section titles & paragraphs saved successfully!');
  };

  const handleResetSectionTextToDefault = () => {
    const defaults = {
      packagesBadge: 'Preventive Health Packages',
      packagesTitle: 'Comprehensive Health Checkups for Complete Wellness',
      packagesSubtitle: '',
      aboutBadgeText: 'Trusted & Accredited Diagnostic Laboratory',
      aboutTitle: 'About Our Laboratory & Medical Leadership',
      aboutSubtitle: 'Serving patients, referring physicians, and hospital networks with uncompromising diagnostic precision, automated pathology, and compassionate care.',
      testsBadge: 'Diagnostic Tests & Profiles',
      testsTitle: 'Book Pathology Tests Online',
      testsSubtitle: 'Search tests by name with transparent rates, specimen requirements, and home collection.',
      bookingBadge: 'Diagnostic Test & Health Booking',
      bookingTitle: 'Lab Test & Health Booking',
      bookingSubtitle: 'Fill the details below to book pathology tests with optional home sample collection or direct branch visit.',
      doctorsBadge: 'Qualified Clinical & Laboratory Team',
      doctorsTitle: 'Our Medical & Laboratory Experts',
      doctorsSubtitle: 'Experienced Pathologists, Biochemists & Senior Technicians ensuring accurate diagnostics and timely reports.',
      reportCheckTitle: 'Check & Download Patient Lab Report',
      reportCheckSubtitle: 'Access your verified diagnostic reports directly using your registered mobile number or Token Number.',
      contactTitle: 'Contact Us',
      contactSubtitle: 'Connect with our laboratory desk or submit an inquiry form below.',
    };
    setSectionTextForm(defaults);
    updateVendorLabSettings(defaults);
    triggerToast('Reset all section titles & paragraphs to default standard template!');
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Website Status: Draft Mode Notice (if draft) */}
      {isDraft && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-amber-950">
                  Website Status: Draft Mode (ड्राफ्ट मोड - एडमिन अप्रूवल पेंडिंग)
                </span>
                <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Awaiting Admin Approval
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 max-w-2xl leading-relaxed">
                लैब बनाने के बाद वेबसाइट अभी <strong>ड्राफ्ट मोड</strong> में है। <strong>ड्राफ्ट वेबसाइट को सिर्फ सुपर एडमिन ही लाइव कर सकता है।</strong> जब प्लेटफॉर्म सुपर एडमिन (Super Admin) इसे रिव्यू करके अप्रूव करेंगे, तभी यह पब्लिकली लाइव होगी।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              href="tel:7087033009"
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call 70870 33009</span>
            </a>
            <a
              href="https://wa.me/917087033009?text=Hello%20Super%20Admin%2C%20please%20approve%20and%20make%20my%20laboratory%20website%20live."
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>💬 WhatsApp 70870 33009</span>
            </a>
          </div>
        </div>
      )}

      {/* Horizontal Sub-tab Switcher Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
        {[
          { id: 'banners', label: '1. Banners', icon: ImageIcon },
          { id: 'about', label: '2. About Us', icon: Sparkles },
          { id: 'founder', label: '3. Founder', icon: Award },
          { id: 'team', label: '4. Team', icon: Users },
          { id: 'contact', label: '5. Contact Us', icon: Phone },
          { id: 'social', label: '6. Social Media', icon: Share2 },
          { id: 'legal', label: '7. Legal Policies', icon: FileText },
          { id: 'section_content', label: '8. Section Titles & Para', icon: Type, highlight: true },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectSubTab(item.id as WebsiteSubSection)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#123B6D] text-white shadow-xs font-black'
                  : item.highlight
                  ? 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 font-extrabold'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : item.highlight ? 'text-purple-600' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. BANNER SECTION (Change / Delete / Add) */}
      {/* ======================================================== */}
      {activeSubTab === 'banners' && (
        <div className="space-y-6">
          {/* HERO SECTION SIMPLE IMAGE BANNER UPLOAD CARD */}
          <div className="bg-white rounded-2xl border-2 border-[#123B6D]/30 shadow-md overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#123B6D] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Hero Section • Pure Photo Upload
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Live on Website ({heroBanners.length} Banners)
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#123B6D]" />
                  <span>Hero Section Photo Banners (Simple Image Upload)</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Direct photo upload for the main Hero banner carousel. No complex codes or text overlays — simply upload or paste your high-resolution banner photo!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => heroBannerFileInputRef.current?.click()}
                  className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                  title="Upload image photo directly from your device"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Upload Banner Photo</span>
                </button>
                <input
                  ref={heroBannerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeroBannerPhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* URL Upload Bar & Guidelines */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Or paste direct image URL (e.g. https://yourcdn.com/banner.jpg)..."
                  value={heroBannerUrlInput}
                  onChange={(e) => setHeroBannerUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHeroBannerUrl();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
                />
                <button
                  type="button"
                  onClick={handleAddHeroBannerUrl}
                  disabled={!heroBannerUrlInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  Add Photo
                </button>
              </div>

              <span className="text-[11px] text-slate-500 whitespace-nowrap hidden lg:inline">
                Recommended aspect ratio: <strong>21:9</strong> or <strong>16:9</strong> (1600×700 px)
              </span>
            </div>

            {/* Active Hero Banner Photos Grid */}
            <div className="p-5">
              {heroBanners.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                  No hero banner photos uploaded yet. Click "Upload Banner Photo" above to add your first photo banner.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heroBanners.map((imgUrl, hIdx) => (
                    <div
                      key={hIdx}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-[16/9] shadow-sm hover:shadow-md transition"
                    >
                      <img
                        src={imgUrl}
                        alt={`Hero Banner ${hIdx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                      />
                      {/* Slide Badge */}
                      <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border border-white/20">
                        Slide #{hIdx + 1}
                      </div>

                      {/* Action Controls Overlay: Move Left, Move Right, Delete */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                        {hIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveHeroBanner(hIdx, 'prev')}
                            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                            title="Move Banner Left (Earlier in carousel)"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hIdx < heroBanners.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveHeroBanner(hIdx, 'next')}
                            className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                            title="Move Banner Right (Later in carousel)"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveHeroBannerPhoto(hIdx)}
                          className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition cursor-pointer active:scale-90"
                          title="Delete this hero banner photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Bottom Quick Indicator */}
                      <div className="absolute bottom-2 left-2 right-2 text-[10px] text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded text-center truncate">
                        {hIdx === 0 ? '★ Primary (First) Banner' : `Secondary Carousel Banner #${hIdx + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ABOUT US SECTION (Edit) */}
      {/* ======================================================== */}
      {activeSubTab === 'about' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>About Us Section Editor (Lab Story &amp; Clinical Heritage)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize your lab's founding history, established year, clinical heritage, and ISO/NABL quality commitment.
              </p>
            </div>
            <button
              onClick={handleSaveAbout}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save About Section</span>
            </button>
          </div>

          <form onSubmit={handleSaveAbout} className="p-6 space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Section Headline / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={aboutForm.aboutTitle}
                  onChange={(e) => setAboutForm({ ...aboutForm, aboutTitle: e.target.value })}
                  placeholder="About Our Laboratory & Medical Leadership"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Established Year
                </label>
                <input
                  type="number"
                  value={aboutForm.establishedYear}
                  onChange={(e) => setAboutForm({ ...aboutForm, establishedYear: Number(e.target.value) || 2012 })}
                  placeholder="2012"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Sub-heading / Summary Statement
              </label>
              <textarea
                rows={2}
                value={aboutForm.aboutSubtitle}
                onChange={(e) => setAboutForm({ ...aboutForm, aboutSubtitle: e.target.value })}
                placeholder="Serving patients, referring physicians, and hospital networks with uncompromising diagnostic precision..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#123B6D]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Our Journey &amp; Legacy of Clinical Excellence (Main Story) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={aboutForm.aboutStory}
                onChange={(e) => setAboutForm({ ...aboutForm, aboutStory: e.target.value })}
                placeholder="Founded with a singular dedication to diagnostic excellence, our laboratory bridges the gap between modern clinical science and patient-centered healthcare..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 leading-relaxed focus:ring-2 focus:ring-[#123B6D]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Clinical Equipment &amp; Quality Control Highlights
              </label>
              <textarea
                rows={3}
                value={aboutForm.aboutHeritage}
                onChange={(e) => setAboutForm({ ...aboutForm, aboutHeritage: e.target.value })}
                placeholder="Equipped with advanced fully-automated biochemistry analyzers, 5-part hematology counters, and bidirectionally interfaced barcode systems..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 leading-relaxed focus:ring-2 focus:ring-[#123B6D]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save About Us Content</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. FOUNDER SECTION (Edit) */}
      {/* ======================================================== */}
      {activeSubTab === 'founder' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Founder / Chief Medical Director Section Editor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit the Founder's name, photograph, qualifications, clinical credentials, and personalized message to patients.
              </p>
            </div>
            <button
              onClick={handleSaveFounder}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Founder Section</span>
            </button>
          </div>

          <form onSubmit={handleSaveFounder} className="p-6 space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {/* Founder Photo */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-[11px] font-bold text-slate-700">
                  Founder Photograph
                </label>
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-300 mx-auto bg-slate-100 shadow-sm relative group flex items-center justify-center">
                  {founderForm.founderPhotoUrl ? (
                    <img
                      src={founderForm.founderPhotoUrl}
                      alt="Founder Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold gap-1 select-none">
                      <User className="w-9 h-9 text-slate-300" />
                      <span>No Photo</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition">
                    <Upload className="w-3.5 h-3.5 text-[#123B6D]" />
                    <span>{founderForm.founderPhotoUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFounderPhotoUpload}
                    />
                  </label>
                  {founderForm.founderPhotoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveFounderPhoto}
                      className="cursor-pointer bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete Photo</span>
                    </button>
                  )}
                  <input
                    type="url"
                    value={founderForm.founderPhotoUrl}
                    onChange={(e) => setFounderForm({ ...founderForm, founderPhotoUrl: e.target.value })}
                    placeholder="or paste image URL"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-[11px] font-mono"
                  />
                </div>
              </div>

              {/* Founder Credentials & Details */}
              <div className="md:col-span-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Founder Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={founderForm.founderName}
                      onChange={(e) => setFounderForm({ ...founderForm, founderName: e.target.value })}
                      placeholder="e.g. Dr. R. K. Sharma"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Founder Designation / Role
                    </label>
                    <input
                      type="text"
                      value={founderForm.founderDesignation}
                      onChange={(e) => setFounderForm({ ...founderForm, founderDesignation: e.target.value })}
                      placeholder="e.g. Chief Medical Director & Founder"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Medical Degrees &amp; Fellowship
                    </label>
                    <input
                      type="text"
                      value={founderForm.founderDegrees}
                      onChange={(e) => setFounderForm({ ...founderForm, founderDegrees: e.target.value })}
                      placeholder="e.g. MBBS, MD (Pathology), FICP"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Experience &amp; Specialty
                    </label>
                    <input
                      type="text"
                      value={founderForm.founderExperience}
                      onChange={(e) => setFounderForm({ ...founderForm, founderExperience: e.target.value })}
                      placeholder="e.g. Chief Pathologist • 18+ Years Clinical Experience"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Top Honor / Accreditation Badge
                    </label>
                    <input
                      type="text"
                      value={founderForm.founderBadge}
                      onChange={(e) => setFounderForm({ ...founderForm, founderBadge: e.target.value })}
                      placeholder="e.g. AIIMS Gold Medalist or Senior Consultant Pathologist"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold text-[#0F766E] focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Founder's Message to Patients &amp; Doctors
                  </label>
                  <textarea
                    rows={3}
                    value={founderForm.founderMessage}
                    onChange={(e) => setFounderForm({ ...founderForm, founderMessage: e.target.value })}
                    placeholder="A pathology report is not merely numbers on paper; a doctor relies on it to prescribe life-saving medicine..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 italic leading-relaxed focus:ring-2 focus:ring-[#123B6D]"
                  />
                </div>
              </div>
            </div>

            {/* Clinical Credentials List (Add / Delete) */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
              <label className="block text-[11px] font-bold text-slate-700">
                Clinical Credentials &amp; Certifications (Bullet points)
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCredential}
                  onChange={(e) => setNewCredential(e.target.value)}
                  placeholder="e.g. Lead Auditor for NABL / ISO 15189 Quality Systems"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCredential}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold cursor-pointer"
                >
                  Add Credential
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {(founderForm.founderCredentials || []).map((cred, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-slate-800">{cred}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCredential(idx)}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save Founder Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TEAM SECTION (Add / Edit / Delete) */}
      {/* ======================================================== */}
      {activeSubTab === 'team' && (
        <div className="space-y-6">
          {/* Qualified Clinical Team & Specialists */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#123B6D]" />
                    <span>Laboratory &amp; Clinical Team (Add / Edit / Delete)</span>
                  </h3>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                    vendorDoctors.length > 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${vendorDoctors.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {vendorDoctors.length > 0
                      ? `Live on Website (${vendorDoctors.length} ${vendorDoctors.length === 1 ? 'Member' : 'Members'})`
                      : 'Section Hidden (0 Members)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage Receptionists, Lab Technicians, Pathologists, Biochemists, and Phlebotomists. If no members are added, this section is automatically hidden on your website.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddTeam}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Team Member</span>
              </button>
            </div>

            {/* Team Grid or Empty State */}
            {vendorDoctors.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3 shadow-2xs">
                  <Users className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">No Team Members Added</h4>
                <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                  The Team section is currently <strong>hidden</strong> on your website. Add your first Pathologist or Medical Specialist below to automatically display the Team section on your website.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddTeam}
                  className="mt-4 bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add First Team Member</span>
                </button>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {vendorDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-[#123B6D]/40 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {/* Photo Thumbnail + Quick Upload Trigger */}
                        <div className="relative group/photo shrink-0">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
                            {doc.imageUrl ? (
                              <img
                                src={doc.imageUrl}
                                alt={doc.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                                <span className="text-2xl">{doc.avatarEmoji || '👨‍⚕️'}</span>
                                <span className="text-[9px] font-bold text-slate-500 mt-0.5">+ Photo</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Camera Overlay */}
                          <label
                            className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] font-bold gap-0.5"
                            title="Click to change team member photo"
                          >
                            <Camera className="w-4 h-4 text-amber-300" />
                            <span>Change</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleQuickDoctorPhotoUpload(doc.id, e)}
                            />
                          </label>
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#123B6D] inline-block mb-0.5">
                            {doc.roleCategory || 'Specialist'}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {doc.name}
                          </h4>
                          <div className="text-[11px] text-slate-600 font-semibold truncate">
                            {doc.degrees || doc.qualification || 'MBBS, MD'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="text-slate-700 font-bold">
                          {doc.specialization || doc.designation}
                        </div>
                        <div className="text-[11px] text-emerald-800 font-semibold">
                          {doc.experience || 'Experienced Specialist'}
                        </div>
                        {doc.bio && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                            {doc.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* Direct Quick Photo Upload Label */}
                      <label className="text-[11px] text-[#123B6D] hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer py-1 px-2 rounded hover:bg-blue-50 transition">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{doc.imageUrl ? 'Update Photo' : '+ Add Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleQuickDoctorPhotoUpload(doc.id, e)}
                        />
                      </label>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTeam(doc)}
                          className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-amber-300" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeam(doc.id, doc.name)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add / Edit Team Modal */}
          {isTeamModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#123B6D] text-white">
                  <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>{editingTeamMember ? 'Edit Team Member' : 'Add New Team Member'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsTeamModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveTeam} className="p-6 space-y-4 overflow-y-auto text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full Name (Receptionist / Technician / Doctor) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      placeholder="e.g. Pooja Sharma / Dr. Kavita Deshmukh"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-[#123B6D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Role Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={teamForm.roleCategory || 'Receptionist'}
                        onChange={(e) => handleRoleCategoryChange(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold bg-white"
                      >
                        <option value="Receptionist">🖥️ Receptionist (Front Desk &amp; Billing)</option>
                        <option value="Technician">🔬 Lab Technician / Technologist</option>
                        <option value="Pathologist">🩺 Pathologist (MD / MBBS)</option>
                        <option value="Biochemist">🧪 Clinical Biochemist</option>
                        <option value="Microbiologist">🧫 Microbiologist</option>
                        <option value="Phlebotomist">🩸 Senior Phlebotomist</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Qualifications / Degrees
                      </label>
                      <input
                        type="text"
                        value={teamForm.degrees}
                        onChange={(e) => setTeamForm({ ...teamForm, degrees: e.target.value, qualification: e.target.value })}
                        placeholder="e.g. MBBS, MD (Microbiology)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Specialization / Focus
                      </label>
                      <input
                        type="text"
                        value={teamForm.specialization}
                        onChange={(e) => setTeamForm({ ...teamForm, specialization: e.target.value })}
                        placeholder="e.g. Clinical Immunology & Serology"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Experience
                      </label>
                      <input
                        type="text"
                        value={teamForm.experience}
                        onChange={(e) => setTeamForm({ ...teamForm, experience: e.target.value })}
                        placeholder="e.g. 12+ Years Clinical Experience"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Team Member Photo Section with Live Preview & Preset Avatars */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Team Member Photo / Profile Image
                    </label>

                    <div className="flex items-center gap-4">
                      {/* Live Image Preview */}
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-300 bg-white shadow-sm flex items-center justify-center">
                          {teamForm.imageUrl ? (
                            <img
                              src={teamForm.imageUrl}
                              alt={teamForm.name || 'Team Member'}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                              <Camera className="w-6 h-6 text-slate-400 mb-0.5" />
                              <span className="text-[9px] font-bold text-slate-400">No Image</span>
                            </div>
                          )}
                        </div>

                        {teamForm.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setTeamForm((prev) => ({ ...prev, imageUrl: '' }))}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md cursor-pointer transition text-xs"
                            title="Remove photo"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Upload / Paste Options */}
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="cursor-pointer bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition">
                            <Upload className="w-3.5 h-3.5 text-amber-300" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleTeamPhotoUpload}
                            />
                          </label>
                          <span className="text-[11px] text-slate-400">from device (phone / PC)</span>
                        </div>

                        <div>
                          <input
                            type="url"
                            value={teamForm.imageUrl || ''}
                            onChange={(e) => setTeamForm({ ...teamForm, imageUrl: e.target.value })}
                            placeholder="or paste image URL link (https://...)"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px] bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Pick Clinical Avatars */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                        Or 1-Click Quick Preset Specialists:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {PRESET_SPECIALIST_AVATARS.map((avatar, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => setTeamForm((prev) => ({ ...prev, imageUrl: avatar.url }))}
                            className={`p-1 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                              teamForm.imageUrl === avatar.url
                                ? 'bg-amber-100/80 border-amber-400 text-slate-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80'
                            }`}
                          >
                            <img
                              src={avatar.url}
                              alt={avatar.label}
                              className="w-7 h-7 rounded-md object-cover shrink-0 border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] block leading-tight truncate font-semibold">
                                {avatar.label}
                              </span>
                              <span className="text-[8px] text-slate-500 block truncate">
                                {avatar.role}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Short Biography
                    </label>
                    <textarea
                      rows={3}
                      value={teamForm.bio || ''}
                      onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })}
                      placeholder="Specialized expertise and clinical hospital affiliations..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsTeamModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-amber-400" />
                      <span>{editingTeamMember ? 'Save Changes' : 'Add Member'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. CONTACT US SECTION (Edit) */}
      {/* ======================================================== */}
      {activeSubTab === 'contact' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Contact Us &amp; Location Section (Edit)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit physical address, helpline numbers, WhatsApp dispatch, timings, and map location.
              </p>
            </div>
            <button
              onClick={handleSaveContact}
              className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Contact Info</span>
            </button>
          </div>

          <form onSubmit={handleSaveContact} className="p-6 space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Primary Helpline Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="e.g. 7087033009"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  24x7 Emergency Line
                </label>
                <input
                  type="text"
                  value={contactForm.helplinePhone}
                  onChange={(e) => setContactForm({ ...contactForm, helplinePhone: e.target.value })}
                  placeholder="e.g. +91 7087033009"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  WhatsApp Booking &amp; Dispatch Number
                </label>
                <input
                  type="text"
                  value={contactForm.whatsapp}
                  onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                  placeholder="e.g. 917087033009"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="e.g. care@apexdiagnostics.in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Physical Laboratory Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={contactForm.address}
                  onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                  placeholder="SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana, Punjab"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Laboratory Timings
                </label>
                <input
                  type="text"
                  value={contactForm.openingHours}
                  onChange={(e) => setContactForm({ ...contactForm, openingHours: e.target.value })}
                  placeholder="e.g. Open 7:00 AM – 9:00 PM (All 7 Days)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Emergency Services Availability
                </label>
                <input
                  type="text"
                  value={contactForm.emergencyHours}
                  onChange={(e) => setContactForm({ ...contactForm, emergencyHours: e.target.value })}
                  placeholder="e.g. 24x7 Emergency Services at Central Lab"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Google Maps Location Link or Embed URL
                </label>
                <input
                  type="text"
                  value={contactForm.contactGoogleMapUrl}
                  onChange={(e) => setContactForm({ ...contactForm, contactGoogleMapUrl: e.target.value })}
                  placeholder="e.g. https://maps.google.com/?q=Apex+Diagnostic+Ludhiana"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save Contact Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SOCIAL MEDIA (Profiles & Links) */}
      {/* ======================================================== */}
      {activeSubTab === 'social' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>Social Media Profiles</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your social media links for your website footer and contact section.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSaveSocial()}
              disabled={isSavingSocial}
              className="bg-[#123B6D] hover:bg-[#0e2c52] disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isSavingSocial ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Links...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Social Settings</span>
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleSaveSocial} noValidate className="p-6 space-y-5 text-xs">
            {/* Success Banner */}
            {socialSavedSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center gap-3 text-emerald-900 animate-in fade-in">
                <span className="text-base shrink-0">✅</span>
                <div>
                  <p className="font-bold text-xs text-emerald-950">
                    सोशल मीडिया लिंक्स सफलतापूर्वक सेव और वेबसाइट पर लाइव हो गए हैं!
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Social media links saved and synced with cloud database. Active links are now live on your website.
                  </p>
                </div>
              </div>
            )}

            {/* Real-time Display Rule Banner */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-amber-900">
              <span className="text-base shrink-0">💡</span>
              <div className="space-y-1">
                <p className="font-bold text-xs text-amber-950">
                  सोशल मीडिया वही शो होंगे जिसमें लिंक डाला जाएगा, नहीं तो शो नहीं होंगे।
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You can enter a full URL (e.g. <span className="font-mono font-bold">https://instagram.com/yourlab</span>), a handle (e.g. <span className="font-mono font-bold">@yourlab</span>), or username. It will automatically format and connect.
                </p>
              </div>
            </div>

            {/* Social Links Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Facebook */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                    <span>Facebook Profile / Page URL</span>
                  </span>
                  {socialForm.facebook && (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={socialForm.facebook || ''}
                    onChange={(e) => {
                      setSocialForm((prev) => ({ ...prev, facebook: e.target.value }));
                      isSocialDirtyRef.current = true;
                    }}
                    placeholder="e.g. yourlab or facebook.com/yourlab"
                    className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  {socialForm.facebook && (
                    <button
                      type="button"
                      onClick={() => {
                        setSocialForm((prev) => ({ ...prev, facebook: '' }));
                        isSocialDirtyRef.current = true;
                      }}
                      title="Clear Facebook link"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {socialForm.facebook?.trim() && (
                  <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500 font-mono">
                    <span className="truncate">Preview: {normalizeSocialUrl('facebook', socialForm.facebook)}</span>
                    <a
                      href={normalizeSocialUrl('facebook', socialForm.facebook)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-0.5 shrink-0 ml-2 font-sans font-bold"
                    >
                      Test Link ↗
                    </a>
                  </div>
                )}
              </div>

              {/* 2. Instagram */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-rose-600" />
                    <span>Instagram Handle / Profile URL</span>
                  </span>
                  {socialForm.instagram && (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={socialForm.instagram || ''}
                    onChange={(e) => {
                      setSocialForm((prev) => ({ ...prev, instagram: e.target.value }));
                      isSocialDirtyRef.current = true;
                    }}
                    placeholder="e.g. @yourlab or instagram.com/yourlab"
                    className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px] focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                  {socialForm.instagram && (
                    <button
                      type="button"
                      onClick={() => {
                        setSocialForm((prev) => ({ ...prev, instagram: '' }));
                        isSocialDirtyRef.current = true;
                      }}
                      title="Clear Instagram link"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {socialForm.instagram?.trim() && (
                  <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500 font-mono">
                    <span className="truncate">Preview: {normalizeSocialUrl('instagram', socialForm.instagram)}</span>
                    <a
                      href={normalizeSocialUrl('instagram', socialForm.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline flex items-center gap-0.5 shrink-0 ml-2 font-sans font-bold"
                    >
                      Test Link ↗
                    </a>
                  </div>
                )}
              </div>

              {/* 3. Twitter / X */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Twitter className="w-3.5 h-3.5 text-slate-800" />
                    <span>Twitter / X Profile URL</span>
                  </span>
                  {socialForm.twitter && (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={socialForm.twitter || ''}
                    onChange={(e) => {
                      setSocialForm((prev) => ({ ...prev, twitter: e.target.value }));
                      isSocialDirtyRef.current = true;
                    }}
                    placeholder="e.g. @yourlab or x.com/yourlab"
                    className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px] focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  />
                  {socialForm.twitter && (
                    <button
                      type="button"
                      onClick={() => {
                        setSocialForm((prev) => ({ ...prev, twitter: '' }));
                        isSocialDirtyRef.current = true;
                      }}
                      title="Clear Twitter link"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {socialForm.twitter?.trim() && (
                  <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500 font-mono">
                    <span className="truncate">Preview: {normalizeSocialUrl('twitter', socialForm.twitter)}</span>
                    <a
                      href={normalizeSocialUrl('twitter', socialForm.twitter)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-800 hover:underline flex items-center gap-0.5 shrink-0 ml-2 font-sans font-bold"
                    >
                      Test Link ↗
                    </a>
                  </div>
                )}
              </div>

              {/* 4. YouTube */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-600" />
                    <span>YouTube Channel URL</span>
                  </span>
                  {socialForm.youtube && (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={socialForm.youtube || ''}
                    onChange={(e) => {
                      setSocialForm((prev) => ({ ...prev, youtube: e.target.value }));
                      isSocialDirtyRef.current = true;
                    }}
                    placeholder="e.g. @yourlab or youtube.com/@yourlab"
                    className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px] focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                  {socialForm.youtube && (
                    <button
                      type="button"
                      onClick={() => {
                        setSocialForm((prev) => ({ ...prev, youtube: '' }));
                        isSocialDirtyRef.current = true;
                      }}
                      title="Clear YouTube link"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {socialForm.youtube?.trim() && (
                  <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500 font-mono">
                    <span className="truncate">Preview: {normalizeSocialUrl('youtube', socialForm.youtube)}</span>
                    <a
                      href={normalizeSocialUrl('youtube', socialForm.youtube)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:underline flex items-center gap-0.5 shrink-0 ml-2 font-sans font-bold"
                    >
                      Test Link ↗
                    </a>
                  </div>
                )}
              </div>

              {/* 5. LinkedIn */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                    <span>LinkedIn Company URL</span>
                  </span>
                  {socialForm.linkedin && (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={socialForm.linkedin || ''}
                    onChange={(e) => {
                      setSocialForm((prev) => ({ ...prev, linkedin: e.target.value }));
                      isSocialDirtyRef.current = true;
                    }}
                    placeholder="e.g. linkedin.com/company/yourlab or yourlab"
                    className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px] focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                  {socialForm.linkedin && (
                    <button
                      type="button"
                      onClick={() => {
                        setSocialForm((prev) => ({ ...prev, linkedin: '' }));
                        isSocialDirtyRef.current = true;
                      }}
                      title="Clear LinkedIn link"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {socialForm.linkedin?.trim() && (
                  <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500 font-mono">
                    <span className="truncate">Preview: {normalizeSocialUrl('linkedin', socialForm.linkedin)}</span>
                    <a
                      href={normalizeSocialUrl('linkedin', socialForm.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline flex items-center gap-0.5 shrink-0 ml-2 font-sans font-bold"
                    >
                      Test Link ↗
                    </a>
                  </div>
                )}
              </div>

              {/* 6. WhatsApp */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Link / Number</span>
                  </span>
                  {socialForm.whatsapp && (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={socialForm.whatsapp || ''}
                    onChange={(e) => {
                      setSocialForm((prev) => ({ ...prev, whatsapp: e.target.value }));
                      isSocialDirtyRef.current = true;
                    }}
                    placeholder="917087033009 or https://wa.me/917087033009"
                    className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  {socialForm.whatsapp && (
                    <button
                      type="button"
                      onClick={() => {
                        setSocialForm((prev) => ({ ...prev, whatsapp: '' }));
                        isSocialDirtyRef.current = true;
                      }}
                      title="Clear WhatsApp"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {socialForm.whatsapp?.trim() && (
                  <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500 font-mono">
                    <span className="truncate">Preview: {normalizeSocialUrl('whatsapp', socialForm.whatsapp)}</span>
                    <a
                      href={normalizeSocialUrl('whatsapp', socialForm.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-0.5 shrink-0 ml-2 font-sans font-bold"
                    >
                      Test Chat ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleClearAllSocial}
                className="text-slate-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer py-1.5 px-3 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Links (Hide All from Website)</span>
              </button>

              <button
                type="submit"
                disabled={isSavingSocial}
                className="bg-[#123B6D] hover:bg-[#0e2c52] disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center"
              >
                {isSavingSocial ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-400" />
                    <span>Save Social Media Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. LEGAL PAGES (T&C, P&P, Refund : Edit) */}
      {/* ======================================================== */}
      {activeSubTab === 'legal' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#123B6D]" />
                <span>Legal Pages Editor (Terms &amp; Conditions, Privacy Policy &amp; Refund)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize your medical laboratory terms, patient data privacy statement, and cancellation &amp; refund clauses.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewPolicyModalOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Preview Modal</span>
              </button>

              <button
                onClick={handleSaveLegal}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Legal Policies</span>
              </button>
            </div>
          </div>

          {/* Sub-tabs for T&C, Privacy, Refund */}
          <div className="px-6 pt-4 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setLegalTab('terms')}
              className={`px-4 py-2 rounded-t-xl font-bold transition border-b-2 cursor-pointer ${
                legalTab === 'terms'
                  ? 'border-[#123B6D] text-[#123B6D] bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 Terms &amp; Conditions (T&amp;C)
            </button>

            <button
              type="button"
              onClick={() => setLegalTab('privacy')}
              className={`px-4 py-2 rounded-t-xl font-bold transition border-b-2 cursor-pointer ${
                legalTab === 'privacy'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              🛡️ Privacy Policy (P&amp;P)
            </button>

            <button
              type="button"
              onClick={() => setLegalTab('refund')}
              className={`px-4 py-2 rounded-t-xl font-bold transition border-b-2 cursor-pointer ${
                legalTab === 'refund'
                  ? 'border-rose-600 text-rose-700 bg-rose-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              🔄 Refund &amp; Cancellation Policy
            </button>
          </div>

          <form onSubmit={handleSaveLegal} className="p-6 space-y-4 text-xs">
            {legalTab === 'terms' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Terms &amp; Conditions Content
                  </label>
                  <button
                    type="button"
                    onClick={() => handleResetLegalToDefault('terms')}
                    className="text-xs text-[#123B6D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Standard Medical Template</span>
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={legalForm.termsAndConditions}
                  onChange={(e) => setLegalForm({ ...legalForm, termsAndConditions: e.target.value })}
                  placeholder="Enter custom terms and conditions..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-[#123B6D]"
                />
              </div>
            )}

            {legalTab === 'privacy' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Privacy Policy &amp; Data Protection Statement
                  </label>
                  <button
                    type="button"
                    onClick={() => handleResetLegalToDefault('privacy')}
                    className="text-xs text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Standard Privacy Template</span>
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={legalForm.privacyPolicy}
                  onChange={(e) => setLegalForm({ ...legalForm, privacyPolicy: e.target.value })}
                  placeholder="Enter custom privacy policy details..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            )}

            {legalTab === 'refund' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Refund &amp; Cancellation Policy Content
                  </label>
                  <button
                    type="button"
                    onClick={() => handleResetLegalToDefault('refund')}
                    className="text-xs text-rose-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Standard Refund Template</span>
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={legalForm.refundPolicy}
                  onChange={(e) => setLegalForm({ ...legalForm, refundPolicy: e.target.value })}
                  placeholder="Enter custom cancellation and refund policies..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-rose-600"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save Legal Policies</span>
              </button>
            </div>
          </form>

          {/* Test Policy Modal */}
          <VendorPolicyModal
            isOpen={isPreviewPolicyModalOpen}
            onClose={() => setIsPreviewPolicyModalOpen(false)}
            activeTab={legalTab}
            onSelectTab={setLegalTab}
            labName={vendorLabSettings.labName}
            labPhone={vendorLabSettings.phone}
            labEmail={vendorLabSettings.email}
            customTerms={legalForm.termsAndConditions}
            customPrivacy={legalForm.privacyPolicy}
            customRefund={legalForm.refundPolicy}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION TITLES & PARAGRAPHS (HEADINGS & SUBTITLES) */}
      {/* ======================================================== */}
      {activeSubTab === 'section_content' && (
        <form onSubmit={handleSaveSectionTexts} className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-white rounded-2xl border-2 border-purple-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-purple-950">
                    Website Section Titles &amp; Paragraphs (शीर्षक व विवरण एडिट)
                  </h3>
                  <span className="text-[10px] font-black uppercase bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full border border-purple-300">
                    Live CMS
                  </span>
                </div>
                <p className="text-xs text-purple-900 mt-1 max-w-2xl leading-relaxed">
                  Customize every section's Heading, Subtitle/Paragraph, and Badge. Changes are immediately reflected on your public laboratory website. To hide any subtitle paragraph, simply leave the input blank.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetSectionTextToDefault}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Reset to default text"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>

          {/* Section 1: Preventive Health Packages */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">1</span>
                <h4 className="text-sm font-extrabold text-slate-900">Health Packages Section (प्रिवेंटिव हेल्थ पैकेज)</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                #packages
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Section Badge / Pill (छोटा टैग)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.packagesBadge}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, packagesBadge: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Preventive Health Packages"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Main Heading / Title (मुख्य शीर्षक)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.packagesTitle}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, packagesTitle: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Comprehensive Health Checkups for Complete Wellness"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Subtitle / Paragraph (विवरण पैराग्राफ)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Leave empty to remove subtitle</span>
                </label>
                <textarea
                  rows={2}
                  value={sectionTextForm.packagesSubtitle}
                  onChange={(e) => setSectionTextForm({ ...sectionTextForm, packagesSubtitle: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="Leave empty or enter description text..."
                />
              </div>

              {/* Live Preview */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" />
                  <span>Website Preview (लाइव प्रीव्यू)</span>
                </div>
                <div className="text-center py-2">
                  {sectionTextForm.packagesBadge && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-[10px] font-bold mb-1">
                      {sectionTextForm.packagesBadge}
                    </span>
                  )}
                  <h5 className="text-base sm:text-lg font-extrabold text-[#123B6D]">
                    {sectionTextForm.packagesTitle || 'Comprehensive Health Checkups for Complete Wellness'}
                  </h5>
                  {sectionTextForm.packagesSubtitle ? (
                    <p className="text-xs text-[#64748B] mt-1 max-w-xl mx-auto">
                      {sectionTextForm.packagesSubtitle}
                    </p>
                  ) : (
                    <span className="text-[10px] italic text-slate-400 mt-0.5 inline-block">
                      (No subtitle paragraph - clean title only)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: About Us & Accreditation Badge */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">2</span>
                <h4 className="text-sm font-extrabold text-slate-900">About Us &amp; Accreditation (अबाउट अस व एक्रीडिटेशन)</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                #about
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Accreditation Badge Text (एक्रीडिटेशन बैज टेक्स्ट)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.aboutBadgeText}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, aboutBadgeText: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Trusted &amp; Accredited Diagnostic Laboratory"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Main Heading / Title (अबाउट अस मुख्य शीर्षक)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.aboutTitle}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, aboutTitle: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. About Our Laboratory &amp; Medical Leadership"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Subtitle / Paragraph (अबाउट अस विवरण पैराग्राफ)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Leave empty to remove subtitle</span>
                </label>
                <textarea
                  rows={2}
                  value={sectionTextForm.aboutSubtitle}
                  onChange={(e) => setSectionTextForm({ ...sectionTextForm, aboutSubtitle: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="Describe your laboratory legacy, precision, and mission..."
                />
              </div>

              {/* Live Preview */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" />
                  <span>Website Preview (लाइव प्रीव्यू)</span>
                </div>
                <div className="text-center py-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{sectionTextForm.aboutBadgeText || 'Trusted & Accredited Diagnostic Laboratory'}</span>
                  </div>
                  <h5 className="text-base sm:text-lg font-extrabold text-[#123B6D]">
                    {sectionTextForm.aboutTitle || 'About Our Laboratory & Medical Leadership'}
                  </h5>
                  {sectionTextForm.aboutSubtitle && (
                    <p className="text-xs text-[#64748B] mt-1 max-w-xl mx-auto">
                      {sectionTextForm.aboutSubtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Diagnostic Tests Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">3</span>
                <h4 className="text-sm font-extrabold text-slate-900">Diagnostic Tests Directory (पैथोलॉजी टेस्ट लिस्ट)</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                #book-test-section
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Section Badge / Pill (टैग)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.testsBadge}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, testsBadge: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Diagnostic Tests &amp; Profiles"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Main Heading / Title (मुख्य शीर्षक)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.testsTitle}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, testsTitle: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Book Pathology Tests Online"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Subtitle / Paragraph (विवरण पैराग्राफ)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Leave empty to remove subtitle</span>
                </label>
                <textarea
                  rows={2}
                  value={sectionTextForm.testsSubtitle}
                  onChange={(e) => setSectionTextForm({ ...sectionTextForm, testsSubtitle: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="e.g. Search tests by name with transparent rates, specimen requirements, and home collection."
                />
              </div>
            </div>
          </div>

          {/* Section 4: Lab Test & Health Booking Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">4</span>
                <h4 className="text-sm font-extrabold text-slate-900">Lab Test &amp; Health Booking Form (बुकिंग फॉर्म सेक्शन)</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                #lab-test-health-booking
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Section Badge / Pill (टैग)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.bookingBadge}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, bookingBadge: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Diagnostic Test &amp; Health Booking"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Main Heading / Title (मुख्य शीर्षक)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.bookingTitle}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, bookingTitle: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Lab Test &amp; Health Booking"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Subtitle / Paragraph (विवरण पैराग्राफ)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Leave empty to remove subtitle</span>
                </label>
                <textarea
                  rows={2}
                  value={sectionTextForm.bookingSubtitle}
                  onChange={(e) => setSectionTextForm({ ...sectionTextForm, bookingSubtitle: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="e.g. Fill the details below to book pathology tests with optional home sample collection or direct branch visit."
                />
              </div>
            </div>
          </div>

          {/* Section 5: Doctors & Medical Team */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">5</span>
                <h4 className="text-sm font-extrabold text-slate-900">Pathologists &amp; Medical Team (डॉक्टर्स व टीम सेक्शन)</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                #doctors
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Section Badge / Pill (टैग)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.doctorsBadge}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, doctorsBadge: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Qualified Clinical &amp; Laboratory Team"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Main Heading / Title (मुख्य शीर्षक)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.doctorsTitle}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, doctorsTitle: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Our Medical &amp; Laboratory Experts"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Subtitle / Paragraph (विवरण पैराग्राफ)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Leave empty to remove subtitle</span>
                </label>
                <textarea
                  rows={2}
                  value={sectionTextForm.doctorsSubtitle}
                  onChange={(e) => setSectionTextForm({ ...sectionTextForm, doctorsSubtitle: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="e.g. Experienced Pathologists, Biochemists &amp; Senior Technicians ensuring accurate diagnostics and timely reports."
                />
              </div>
            </div>
          </div>

          {/* Section 6 & 7: Report Check & Contact Us */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Report Download */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">6</span>
                  <h4 className="text-sm font-extrabold text-slate-900">Report Download Callout</h4>
                </div>
                <span className="text-[10px] font-bold text-slate-400">#check-report-section</span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Main Title (शीर्षक)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.reportCheckTitle}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, reportCheckTitle: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Check &amp; Download Patient Lab Report"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtitle / Paragraph (पैराग्राफ)
                  </label>
                  <textarea
                    rows={2}
                    value={sectionTextForm.reportCheckSubtitle}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, reportCheckSubtitle: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Access your verified diagnostic reports directly..."
                  />
                </div>
              </div>
            </div>

            {/* Contact Us */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">7</span>
                  <h4 className="text-sm font-extrabold text-slate-900">Contact Us Section</h4>
                </div>
                <span className="text-[10px] font-bold text-slate-400">#contact</span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Main Title (शीर्षक)
                  </label>
                  <input
                    type="text"
                    value={sectionTextForm.contactTitle}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, contactTitle: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Contact Us"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtitle / Paragraph (पैराग्राफ)
                  </label>
                  <textarea
                    rows={2}
                    value={sectionTextForm.contactSubtitle}
                    onChange={(e) => setSectionTextForm({ ...sectionTextForm, contactSubtitle: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Connect with our laboratory desk or submit an inquiry form below."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Fixed-style Save Button Bar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All changes are automatically synced to your live website once saved.</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleResetSectionTextToDefault}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Reset Defaults
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Section Titles &amp; Paragraphs</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Are you sure you want to delete this?</h3>
                <p className="text-[11px] text-slate-500 font-medium">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {deleteConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={deleteConfirm.onConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
