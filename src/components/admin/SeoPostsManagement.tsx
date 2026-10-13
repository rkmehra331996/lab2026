import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Share2,
  Globe,
  Tag,
  Folder,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  Upload,
  Calendar,
  User,
  Hash,
  Laptop,
  Smartphone,
  BookOpen,
  ArrowRight,
  X,
  RotateCcw,
} from 'lucide-react';
import { SeoPost } from '../../types';
import { useCms } from '../../context/CmsContext';
import { optimizeImageFile } from '../../utils/imageOptimizer';

interface SeoPostsManagementProps {
  showToast?: (message: string) => void;
  onPreviewPost?: (post: SeoPost) => void;
}

const PRESET_CATEGORIES = [
  'Pathology Guides',
  'Preventive Health',
  'Endocrinology',
  'Lab Standards',
  'Health & Wellness',
  'Clinical Biochemistry',
  'Diagnostic Tech',
];

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80',
];

function generateSlug(text: string): string {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function calculateReadingTime(text: string): string {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export const SeoPostsManagement: React.FC<SeoPostsManagementProps> = ({
  showToast = () => {},
  onPreviewPost,
}) => {
  const { allSeoPosts, addSeoPost, updateSeoPost, deleteSeoPost } = useCms();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Modal / Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'content' | 'seo' | 'preview'>('content');
  const [previewDevice, setPreviewDevice] = useState<'google_desktop' | 'google_mobile' | 'social'>('google_desktop');
  const [tagInput, setTagInput] = useState('');

  // Delete Confirmation Modal
  const [deletingPost, setDeletingPost] = useState<SeoPost | null>(null);

  // Form State
  const initialFormState: Omit<SeoPost, 'id' | 'createdAt' | 'updatedAt'> = {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: PRESET_IMAGES[0],
    category: 'Pathology Guides',
    tags: ['Pathology', 'Blood Test', 'Health Guide'],
    seoTitle: '',
    metaDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
    openGraph: {
      ogTitle: '',
      ogDescription: '',
      ogImage: PRESET_IMAGES[0],
    },
    schemaMarkup: '',
    status: 'published',
    author: 'Editorial Desk',
    readingTime: '3 min read',
    viewsCount: 0,
  };

  const [formData, setFormData] = useState<typeof initialFormState>(initialFormState);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return allSeoPosts.filter((post) => {
      const matchSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.focusKeyword && post.focusKeyword.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || post.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [allSeoPosts, searchQuery, selectedCategory, selectedStatus]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    PRESET_CATEGORIES.forEach((c) => set.add(c));
    allSeoPosts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [allSeoPosts]);

  // Open Editor for Creating New Post
  const handleOpenCreate = () => {
    setEditingPostId(null);
    setFormData({
      ...initialFormState,
      featuredImage: PRESET_IMAGES[Math.floor(Math.random() * PRESET_IMAGES.length)],
    });
    setTagInput('');
    setActiveEditorTab('content');
    setIsEditorOpen(true);
  };

  // Open Editor for Editing Existing Post
  const handleOpenEdit = (post: SeoPost) => {
    setEditingPostId(post.id);
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      featuredImage: post.featuredImage || PRESET_IMAGES[0],
      category: post.category || 'Pathology Guides',
      tags: post.tags || [],
      seoTitle: post.seoTitle || post.title || '',
      metaDescription: post.metaDescription || post.excerpt || '',
      focusKeyword: post.focusKeyword || '',
      canonicalUrl: post.canonicalUrl || `https://indianlalaji.com/blog/${post.slug || post.id}`,
      openGraph: {
        ogTitle: post.openGraph?.ogTitle || post.seoTitle || post.title,
        ogDescription: post.openGraph?.ogDescription || post.metaDescription || post.excerpt,
        ogImage: post.openGraph?.ogImage || post.featuredImage,
      },
      schemaMarkup: post.schemaMarkup || '',
      status: post.status || 'published',
      author: post.author || 'Editorial Desk',
      readingTime: post.readingTime || calculateReadingTime(post.content),
      viewsCount: post.viewsCount || 0,
      publishedAt: post.publishedAt,
    });
    setTagInput('');
    setActiveEditorTab('content');
    setIsEditorOpen(true);
  };

  // Title change: auto-fill slug, seoTitle, canonical if not touched
  const handleTitleChange = (val: string) => {
    const slug = generateSlug(val);
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug === '' || prev.slug === generateSlug(prev.title) ? slug : prev.slug,
      seoTitle: prev.seoTitle === '' || prev.seoTitle === prev.title ? val : prev.seoTitle,
      canonicalUrl: `https://indianlalaji.com/blog/${slug}`,
    }));
  };

  // Content change: auto-calculate reading time
  const handleContentChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      content: val,
      readingTime: calculateReadingTime(val),
    }));
  };

  // Tag Add / Remove
  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (!formData.tags.includes(clean)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
  };

  // Rich Text Insertion Helper
  const handleInsertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('post-rich-content-area') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    handleContentChange(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 50);
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const optimized = await optimizeImageFile(file, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.85,
        format: 'image/jpeg',
      });
      if (optimized) {
        // Upload to server or save dataUrl
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: optimized, prefix: 'blog' }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              setFormData((prev) => ({ ...prev, featuredImage: data.url }));
              showToast('Featured image uploaded successfully!');
              return;
            }
          }
        } catch {}
        setFormData((prev) => ({ ...prev, featuredImage: optimized }));
        showToast('Featured image saved!');
      }
    } catch {
      showToast('Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Auto Generate Schema
  const handleGenerateSchema = () => {
    const domain = 'https://indianlalaji.com';
    const postUrl = formData.canonicalUrl || `${domain}/blog/${formData.slug || 'article'}`;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: formData.seoTitle || formData.title,
      description: formData.metaDescription || formData.excerpt,
      image: [formData.featuredImage],
      datePublished: formData.publishedAt || new Date().toISOString(),
      dateModified: new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: formData.author || 'IndianLalaJi Editorial Desk',
      },
      publisher: {
        '@type': 'Organization',
        name: 'INDIANLALAJI.COM',
        url: domain,
        logo: {
          '@type': 'ImageObject',
          url: `${domain}/icon.svg`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': postUrl,
      },
    };
    setFormData((prev) => ({ ...prev, schemaMarkup: JSON.stringify(schema, null, 2) }));
    showToast('JSON-LD Article Schema generated!');
  };

  // Save Post
  const handleSavePost = async () => {
    if (!formData.title.trim()) {
      showToast('Please enter a post title');
      return;
    }
    const cleanSlug = formData.slug ? generateSlug(formData.slug) : generateSlug(formData.title);

    const postPayload = {
      ...formData,
      slug: cleanSlug,
      seoTitle: formData.seoTitle.trim() || formData.title.trim(),
      metaDescription: formData.metaDescription.trim() || formData.excerpt.trim(),
      canonicalUrl: formData.canonicalUrl || `https://indianlalaji.com/blog/${cleanSlug}`,
      openGraph: {
        ogTitle: formData.openGraph?.ogTitle || formData.seoTitle || formData.title,
        ogDescription: formData.openGraph?.ogDescription || formData.metaDescription || formData.excerpt,
        ogImage: formData.openGraph?.ogImage || formData.featuredImage,
      },
      readingTime: formData.readingTime || calculateReadingTime(formData.content),
    };

    if (editingPostId) {
      await updateSeoPost(editingPostId, postPayload);
      showToast(`Post "${formData.title}" updated successfully!`);
    } else {
      await addSeoPost(postPayload);
      showToast(`New post "${formData.title}" created & published!`);
    }

    setIsEditorOpen(false);
    setEditingPostId(null);
  };

  // Focus Keyword Analysis Checkers
  const keywordHealth = useMemo(() => {
    const kw = (formData.focusKeyword || '').toLowerCase().trim();
    if (!kw) {
      return { hasKeyword: false, inTitle: false, inDesc: false, inSlug: false, inContent: false, wordCount: 0 };
    }
    const titleLower = (formData.seoTitle || formData.title || '').toLowerCase();
    const descLower = (formData.metaDescription || formData.excerpt || '').toLowerCase();
    const slugLower = (formData.slug || '').toLowerCase();
    const contentLower = (formData.content || '').toLowerCase();
    const words = (formData.content || '').trim().split(/\s+/).filter(Boolean).length;

    return {
      hasKeyword: true,
      inTitle: titleLower.includes(kw),
      inDesc: descLower.includes(kw),
      inSlug: slugLower.includes(generateSlug(kw)),
      inContent: contentLower.includes(kw),
      wordCount: words,
      score:
        (titleLower.includes(kw) ? 25 : 0) +
        (descLower.includes(kw) ? 25 : 0) +
        (slugLower.includes(generateSlug(kw)) ? 20 : 0) +
        (contentLower.includes(kw) ? 20 : 0) +
        (words >= 250 ? 10 : words >= 100 ? 5 : 0),
    };
  }, [formData.focusKeyword, formData.seoTitle, formData.title, formData.metaDescription, formData.excerpt, formData.slug, formData.content]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="bg-gradient-to-br from-[#123B6D] via-slate-900 to-[#123B6D] text-white rounded-2xl p-6 border border-slate-700 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-400/30">
              <Globe className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  SEO Posts &amp; Articles Management
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Google Indexing Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Create and publish keyword-optimized pathology guides, blood test preparation manuals, and healthcare articles. Each article includes Schema markup, OpenGraph social cards, and is automatically included in <code className="text-amber-300 font-mono">/sitemap.xml</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch md:self-auto shrink-0">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition border border-white/20 flex items-center gap-1.5"
              title="View live XML Sitemap"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>View Sitemap.xml</span>
            </a>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shadow-md flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Create New SEO Post</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Total Posts</span>
            <span className="text-xl font-black text-white">{allSeoPosts.length}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Published (Live)</span>
            <span className="text-xl font-black text-emerald-400">
              {allSeoPosts.filter((p) => p.status === 'published').length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Drafts</span>
            <span className="text-xl font-black text-amber-400">
              {allSeoPosts.filter((p) => p.status === 'draft').length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Categories</span>
            <span className="text-xl font-black text-blue-300">{allCategories.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, keyword, slug..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Posts Grid List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No SEO Posts Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No articles matched "${searchQuery}". Try clearing filters.`
              : 'Start by creating your first laboratory article or pathology test guide!'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#123B6D] text-white text-xs font-bold rounded-xl hover:bg-[#0e2c52] transition cursor-pointer"
          >
            + Create First Article
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col group"
            >
              {/* Card Image */}
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={post.featuredImage || PRESET_IMAGES[0]}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_IMAGES[0];
                  }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white">
                    {post.category || 'General'}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      post.status === 'published'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {post.status === 'published' ? 'Live' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                    <span>{post.publishedAt || 'Not published'}</span>
                    <span>•</span>
                    <span>{post.readingTime || '3 min read'}</span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-[#123B6D] transition">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {post.excerpt || post.metaDescription}
                  </p>

                  <div className="pt-1 text-[11px] font-mono text-slate-400 truncate">
                    /blog/<span className="text-slate-600 font-bold">{post.slug}</span>
                  </div>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {post.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{post.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(post)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                      title="Edit Post"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onPreviewPost && (
                      <button
                        type="button"
                        onClick={() => onPreviewPost(post)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-600 transition cursor-pointer"
                        title="Preview Article Reader"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingPost(post)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                      title="Delete Post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#123B6D] hover:underline flex items-center gap-1"
                  >
                    <span>View URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL POST EDITOR MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#123B6D] text-amber-300 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    {editingPostId ? 'Edit SEO Article' : 'Create New SEO Article'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Target URL: <code className="text-[#123B6D] font-mono font-bold">/blog/{formData.slug || 'slug'}</code>
                  </span>
                </div>
              </div>

              {/* Status Toggle & Close */}
              <div className="flex items-center gap-2">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${
                    formData.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  <option value="published">🟢 Published (Live on Site & Sitemap)</option>
                  <option value="draft">🟡 Draft (Admin Only)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-white text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveEditorTab('content')}
                className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeEditorTab === 'content'
                    ? 'border-[#123B6D] text-[#123B6D]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>1. Article Content &amp; Media</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveEditorTab('seo')}
                className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeEditorTab === 'seo'
                    ? 'border-[#123B6D] text-[#123B6D]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>2. SEO Meta, Keyword &amp; Schema</span>
                {keywordHealth.hasKeyword && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-mono">
                    {keywordHealth.score}%
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveEditorTab('preview')}
                className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeEditorTab === 'preview'
                    ? 'border-[#123B6D] text-[#123B6D]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>3. Live SERP &amp; Social Preview</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* TAB 1: ARTICLE CONTENT */}
              {activeEditorTab === 'content' && (
                <div className="space-y-4">
                  {/* Title & Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-1">
                      <label className="block font-bold text-slate-700">Article Headline / Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. Complete Blood Count (CBC) Normal Values & Fasting Guide"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">URL Slug *</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                        placeholder="cbc-test-normal-range-india"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-700 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Category, Author, Published Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none"
                      >
                        {allCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Author / Doctor Name</label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="Dr. Rohit Sharma (MD Pathologist)"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Published Date</label>
                      <input
                        type="date"
                        value={formData.publishedAt || new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Short Excerpt / Teaser (for post card & search snippet)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Brief 1-2 sentence overview explaining what the patient will learn..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none resize-none"
                    />
                  </div>

                  {/* Featured Image */}
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-700">Featured Image</label>
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      <div className="w-32 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={formData.featuredImage}
                          alt="Featured"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PRESET_IMAGES[0];
                          }}
                        />
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <input
                          type="text"
                          value={formData.featuredImage}
                          onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                          placeholder="Image URL or choose preset below"
                          className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
                        />

                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>

                          <span className="text-slate-400 text-[11px]">or pick preset:</span>
                          <div className="flex items-center gap-1.5">
                            {PRESET_IMAGES.slice(0, 4).map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setFormData({ ...formData, featuredImage: img })}
                                className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 hover:scale-110 transition cursor-pointer"
                              >
                                <img src={img} alt="Preset" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags Input */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Tags (Press Enter or Add)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="e.g. FastingRules, Cholesterol, Diabetes"
                        className="flex-1 p-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        + Add Tag
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Content & Rich Editor Toolbar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700">
                        Article Body Content (HTML / Formatted Text) *
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {calculateReadingTime(formData.content)} •{' '}
                        {(formData.content || '').trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>

                    {/* Quick Formatting Toolbar */}
                    <div className="p-1.5 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting('<h2>', '</h2>')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-200 font-bold text-slate-800 cursor-pointer"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting('<h3>', '</h3>')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-200 font-bold text-slate-800 cursor-pointer"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting('<strong>', '</strong>')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-200 font-bold text-slate-800 cursor-pointer"
                      >
                        Bold
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting('<em>', '</em>')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-200 italic font-bold text-slate-800 cursor-pointer"
                      >
                        Italic
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting('<ul>\n  <li>', '</li>\n</ul>')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-200 font-bold text-slate-800 cursor-pointer"
                      >
                        • Bullets
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting('<ol>\n  <li>', '</li>\n</ol>')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-200 font-bold text-slate-800 cursor-pointer"
                      >
                        1. Numbers
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting('<blockquote>', '</blockquote>')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-200 font-bold text-slate-800 cursor-pointer"
                      >
                        Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormatting('<p>', '</p>')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-200 font-bold text-slate-800 cursor-pointer"
                      >
                        Paragraph
                      </button>
                    </div>

                    <textarea
                      id="post-rich-content-area"
                      rows={12}
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Write your diagnostic guide, test breakdown, preparation guidelines, and normal ranges here..."
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: SEO META, FOCUS KEYWORD & SCHEMA */}
              {activeEditorTab === 'seo' && (
                <div className="space-y-4">
                  {/* Focus Keyword Health Checker */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Focus Keyword Optimizer</span>
                      </div>
                      {keywordHealth.hasKeyword && (
                        <span className="font-extrabold text-xs text-[#123B6D]">
                          SEO Score: {keywordHealth.score}/100
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={formData.focusKeyword}
                      onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                      placeholder="e.g. CBC test normal range"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />

                    {keywordHealth.hasKeyword && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                        <div className={`p-2 rounded-xl flex items-center gap-1.5 ${keywordHealth.inTitle ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {keywordHealth.inTitle ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          <span>In SEO Title</span>
                        </div>
                        <div className={`p-2 rounded-xl flex items-center gap-1.5 ${keywordHealth.inDesc ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {keywordHealth.inDesc ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          <span>In Meta Description</span>
                        </div>
                        <div className={`p-2 rounded-xl flex items-center gap-1.5 ${keywordHealth.inSlug ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {keywordHealth.inSlug ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          <span>In URL Slug</span>
                        </div>
                        <div className={`p-2 rounded-xl flex items-center gap-1.5 ${keywordHealth.inContent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {keywordHealth.inContent ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          <span>In Body Content</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SEO Title */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700">SEO Meta Title (Search Results Headline)</label>
                      <span className={`text-[11px] font-mono ${formData.seoTitle.length > 60 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                        {formData.seoTitle.length} / 60 characters
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="e.g. CBC Test Normal Range & Fasting Guide India | Complete Blood Count"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Meta Description */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700">SEO Meta Description</label>
                      <span className={`text-[11px] font-mono ${formData.metaDescription.length > 160 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                        {formData.metaDescription.length} / 160 characters
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="Detailed 140-160 character description designed to maximize Google CTR..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none resize-none"
                    />
                  </div>

                  {/* Canonical URL */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Canonical URL</label>
                    <input
                      type="url"
                      value={formData.canonicalUrl}
                      onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                      placeholder="https://indianlalaji.com/blog/slug"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none"
                    />
                  </div>

                  {/* OpenGraph & Social Cards */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-blue-600" />
                      <span>Social Sharing Card (OpenGraph)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">OG Title</label>
                        <input
                          type="text"
                          value={formData.openGraph?.ogTitle || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              openGraph: { ...(formData.openGraph || {}), ogTitle: e.target.value },
                            })
                          }
                          placeholder={formData.seoTitle || formData.title}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">OG Image URL</label>
                        <input
                          type="text"
                          value={formData.openGraph?.ogImage || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              openGraph: { ...(formData.openGraph || {}), ogImage: e.target.value },
                            })
                          }
                          placeholder={formData.featuredImage}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* JSON-LD Schema Markup */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span>Schema.org Structured Data (JSON-LD)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleGenerateSchema}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold rounded-lg cursor-pointer"
                      >
                        ⚡ Generate Article Schema
                      </button>
                    </div>

                    <textarea
                      rows={6}
                      value={formData.schemaMarkup}
                      onChange={(e) => setFormData({ ...formData, schemaMarkup: e.target.value })}
                      placeholder="Paste or generate JSON-LD BlogPosting schema..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-[11px] text-slate-800 bg-slate-50 focus:bg-white focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE PREVIEW */}
              {activeEditorTab === 'preview' && (
                <div className="space-y-6">
                  {/* Device toggle */}
                  <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('google_desktop')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                        previewDevice === 'google_desktop'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Google Desktop SERP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewDevice('google_mobile')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                        previewDevice === 'google_mobile'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Google Mobile SERP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewDevice('social')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                        previewDevice === 'social'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp / Social Card</span>
                    </button>
                  </div>

                  {/* Google Desktop Preview */}
                  {previewDevice === 'google_desktop' && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5 max-w-2xl font-sans">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                          IL
                        </div>
                        <span className="font-medium text-slate-800">INDIANLALAJI.COM</span>
                        <span className="text-slate-400">›</span>
                        <span className="text-slate-500 font-mono">blog › {formData.slug || 'article'}</span>
                      </div>

                      <h4 className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-medium leading-normal line-clamp-1">
                        {formData.seoTitle || formData.title || 'Diagnostic Guide Headline'}
                      </h4>

                      <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                        {formData.metaDescription || formData.excerpt || 'Article summary description...'}
                      </p>
                    </div>
                  )}

                  {/* Google Mobile Preview */}
                  {previewDevice === 'google_mobile' && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5 max-w-sm font-sans">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                          IL
                        </div>
                        <span className="font-semibold text-slate-800">indianlalaji.com</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        /blog/{formData.slug || 'article'}
                      </div>

                      <h4 className="text-base text-[#1a0dab] font-medium leading-snug line-clamp-2">
                        {formData.seoTitle || formData.title || 'Diagnostic Guide Headline'}
                      </h4>

                      <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-3">
                        {formData.metaDescription || formData.excerpt || 'Article summary description...'}
                      </p>
                    </div>
                  )}

                  {/* Social Share Preview (WhatsApp / Facebook) */}
                  {previewDevice === 'social' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-md max-w-md overflow-hidden font-sans">
                      <div className="h-48 overflow-hidden bg-slate-100">
                        <img
                          src={formData.openGraph?.ogImage || formData.featuredImage}
                          alt="Social Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PRESET_IMAGES[0];
                          }}
                        />
                      </div>
                      <div className="p-3.5 space-y-1 bg-slate-50 border-t border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          INDIANLALAJI.COM
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                          {formData.openGraph?.ogTitle || formData.seoTitle || formData.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {formData.openGraph?.ogDescription || formData.metaDescription || formData.excerpt}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, status: 'draft' });
                    setTimeout(() => handleSavePost(), 50);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, status: 'published' });
                    setTimeout(() => handleSavePost(), 50);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>{editingPostId ? 'Update & Save' : 'Publish Article Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Delete SEO Article?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong>"{deletingPost.title}"</strong>? It will be removed from search indexing and the XML sitemap.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPost(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteSeoPost(deletingPost.id);
                  showToast(`Deleted "${deletingPost.title}"`);
                  setDeletingPost(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
