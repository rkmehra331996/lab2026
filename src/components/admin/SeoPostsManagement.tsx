import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Search,
  RotateCcw,
  Globe,
  Tag,
  Share2,
  Check,
  X,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { SeoPost } from '../../types';
import { useCms } from '../../context/CmsContext';

interface SeoPostsManagementProps {
  showToast?: (message: string) => void;
  onPreviewPost?: (post: SeoPost) => void;
}

export const SeoPostsManagement: React.FC<SeoPostsManagementProps> = ({
  showToast,
  onPreviewPost,
}) => {
  const {
    seoPosts,
    addSeoPost,
    updateSeoPost,
    deleteSeoPost,
    resetSeoPostsToDefault,
  } = useCms();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SeoPost | null>(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<SeoPost | null>(null);

  // Form State
  const [form, setForm] = useState<Omit<SeoPost, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    category: 'Accreditation & Compliance',
    tags: [],
    seoTitle: '',
    metaDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
    status: 'published',
    author: 'Editorial Desk',
    readingTime: '5 min read',
    viewsCount: 0,
  });

  const categories = [
    'Accreditation & Compliance',
    'Clinical Hematology',
    'Digital Health & Automation',
    'Billing & Administration',
    'Biochemistry & QC',
    'Phlebotomy & Field Ops',
    'Pathology Lab Guides',
  ];

  const handleOpenAddModal = () => {
    setEditingPost(null);
    setForm({
      title: '',
      slug: '',
      content: '### Section Heading\nWrite your standard operating procedure or clinical diagnostic article details here...\n\n* Key finding 1\n* Key finding 2\n\n### Clinical Interpretation\nDescribe clinical action limits and normal intervals...',
      excerpt: '',
      featuredImage: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
      category: 'Accreditation & Compliance',
      tags: ['Pathology', 'NABL', 'Clinical Guide'],
      seoTitle: '',
      metaDescription: '',
      focusKeyword: '',
      canonicalUrl: '',
      status: 'published',
      author: 'Editorial Desk',
      readingTime: '5 min read',
      viewsCount: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: SeoPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      category: post.category,
      tags: post.tags || [],
      seoTitle: post.seoTitle || post.title,
      metaDescription: post.metaDescription || post.excerpt,
      focusKeyword: post.focusKeyword || '',
      canonicalUrl: post.canonicalUrl || '',
      status: post.status,
      author: post.author || 'Editorial Desk',
      readingTime: post.readingTime || '5 min read',
      viewsCount: post.viewsCount || 0,
    });
    setIsModalOpen(true);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast?.('Please enter an article title.');
      return;
    }

    const safeSlug = (form.slug || form.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const postPayload = {
      ...form,
      slug: safeSlug,
      seoTitle: form.seoTitle || form.title,
      metaDescription: form.metaDescription || form.excerpt,
      canonicalUrl: form.canonicalUrl || `https://indianlalaji.com/blog/${safeSlug}`,
    };

    if (editingPost) {
      updateSeoPost(editingPost.id, postPayload);
      showToast?.(`Article "${form.title}" updated successfully!`);
    } else {
      addSeoPost(postPayload);
      showToast?.(`Article "${form.title}" created and published!`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (post: SeoPost) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    updateSeoPost(post.id, { status: nextStatus });
    showToast?.(`Article marked as ${nextStatus === 'published' ? 'Live Published' : 'Draft'}.`);
  };

  const handleDelete = (post: SeoPost) => {
    deleteSeoPost(post.id);
    setDeleteConfirmPost(null);
    showToast?.(`Deleted article "${post.title}".`);
  };

  // Filtered List
  const filteredPosts = (seoPosts || []).filter((p) => {
    const matchQuery =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.focusKeyword && p.focusKeyword.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchStatus = selectedStatus === 'All' || p.status === selectedStatus;

    return matchQuery && matchCategory && matchStatus;
  });

  const totalPublished = (seoPosts || []).filter((p) => p.status === 'published').length;
  const totalDrafts = (seoPosts || []).filter((p) => p.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-[#123B6D] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Search Engine Optimization
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {totalPublished} Live in Google Sitemap
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#123B6D]" />
            <span>SEO Knowledge Base &amp; Clinical Guides</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Create, edit, and publish search engine optimized diagnostic SOPs and articles. Indexed dynamically on <code>indianlalaji.com/blog/[slug]</code> and crawlable by Googlebot.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset SEO articles back to default pre-loaded clinical guides?')) {
                resetSeoPostsToDefault();
                showToast?.('Reset articles to default catalog.');
              }
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Restore Default Diagnostic Articles"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New SEO Article</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500">Total Articles</span>
          <div className="text-2xl font-black text-slate-900">{seoPosts.length}</div>
          <div className="text-[10px] text-slate-400">Knowledge articles catalog</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600">Live Published</span>
          <div className="text-2xl font-black text-emerald-600">{totalPublished}</div>
          <div className="text-[10px] text-slate-400">Visible on main website</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-600">Drafts</span>
          <div className="text-2xl font-black text-amber-600">{totalDrafts}</div>
          <div className="text-[10px] text-slate-400">Unpublished working copies</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-blue-600">XML Sitemap</span>
          <div className="text-sm font-black text-blue-700 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Synchronized</span>
          </div>
          <div className="text-[10px] text-slate-400">/sitemap.xml updated</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Articles List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No SEO articles matching your filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left side info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {post.featuredImage && (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-16 h-12 rounded-xl object-cover border border-slate-200 shrink-0 hidden sm:block"
                    />
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-teal-50 text-teal-700 border border-teal-200">
                        {post.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                          post.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {post.status}
                      </span>
                      {post.readingTime && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {post.readingTime}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                      {post.title}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>/blog/{post.slug}</span>
                      {post.focusKeyword && (
                        <span className="text-slate-400">• Keyword: <strong className="text-slate-600 font-sans">{post.focusKeyword}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(post)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      post.status === 'published'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>

                  {onPreviewPost && (
                    <button
                      type="button"
                      onClick={() => onPreviewPost(post)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Preview Article"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(post)}
                    className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                    title="Edit Article"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmPost(post)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                    title="Delete Article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#123B6D] text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingPost ? 'Edit SEO Article' : 'Create New SEO Article'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Published content appears on the public website and blog directory
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Guide to NABL ISO 15189 in Indian Pathology Labs"
                  value={form.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      title: newTitle,
                      slug: prev.slug ? prev.slug : newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                      seoTitle: prev.seoTitle ? prev.seoTitle : newTitle,
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123B6D]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    URL Slug (e.g. nabl-lab-guide) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Reading Time
                  </label>
                  <input
                    type="text"
                    value={form.readingTime}
                    onChange={(e) => setForm((prev) => ({ ...prev, readingTime: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'published' | 'draft' }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="published">Live Published</option>
                    <option value="draft">Draft Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Excerpt / Search Meta Description
                </label>
                <textarea
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Short 1-2 sentence overview shown on Google cards and preview lists"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Featured Image URL
                </label>
                <input
                  type="url"
                  value={form.featuredImage}
                  onChange={(e) => setForm((prev) => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Article Full Content (Markdown Supported) *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Use ### for headings, * for bullet items, | for tables
                  </span>
                </div>
                <textarea
                  required
                  rows={8}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#123B6D]/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#123B6D] hover:bg-[#0e2c52] text-white font-black transition shadow-xs cursor-pointer"
                >
                  {editingPost ? 'Save Changes' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-sm text-slate-900">Delete SEO Article?</h4>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete &ldquo;{deleteConfirmPost.title}&rdquo;?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPost(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmPost)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer"
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
