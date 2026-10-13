import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  Check,
  Tag,
  BookOpen,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  FileText,
  Printer,
} from 'lucide-react';
import { SeoPost, AppView } from '../types';
import { useCms } from '../context/CmsContext';
import { applyPostSeoToDOM } from '../utils/seoManager';

interface SeoPostDetailViewProps {
  post: SeoPost;
  onBack: () => void;
  onSelectPost?: (post: SeoPost) => void;
  onNavigateView?: (view: AppView) => void;
}

export const SeoPostDetailView: React.FC<SeoPostDetailViewProps> = ({
  post,
  onBack,
  onSelectPost,
  onNavigateView,
}) => {
  const { publishedSeoPosts, companySettings } = useCms();
  const [copiedLink, setCopiedLink] = useState(false);

  // Apply rich SEO tags and JSON-LD schema to document head on view
  useEffect(() => {
    applyPostSeoToDOM(post);

    // Update browser URL to clean SEO-friendly slug without full reload
    if (typeof window !== 'undefined' && post.slug) {
      const cleanPath = `/blog/${post.slug}`;
      if (window.location.pathname !== cleanPath) {
        window.history.pushState({ postId: post.id }, post.title, cleanPath);
      }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [post]);

  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog/${post.slug || post.id}` : `https://indianlalaji.com/blog/${post.slug || post.id}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`*${post.title}*\n\nRead full clinical guide:\n${postUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${post.title}\n${postUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`, '_blank');
  };

  // Other related articles (excluding current)
  const relatedPosts = publishedSeoPosts.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#123B6D] transition cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Back to Main Website</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              title="Share on WhatsApp"
              className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy Article Link"
              className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Article Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-slate-800 transition cursor-pointer font-medium"
          >
            IndianLalaJi
          </button>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-slate-600 font-medium">Articles &amp; Guides</span>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-teal-700 font-bold shrink-0">{post.category || 'Pathology'}</span>
        </nav>

        {/* Article Header Card */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
              {post.category || 'Clinical Guide'}
            </span>
            {post.focusKeyword && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-600" />
                <span>{post.focusKeyword}</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            {post.title}
          </h1>

          {/* Author, Date, Reading Time Metadata Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 border-y border-slate-200/80 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#123B6D] text-amber-300 font-bold flex items-center justify-center text-xs shadow-xs">
                {post.author ? post.author.charAt(0).toUpperCase() : 'E'}
              </div>
              <div>
                <span className="font-bold text-slate-900 block leading-tight">{post.author || 'Editorial Diagnostics Team'}</span>
                <span className="text-[11px] text-slate-500">Clinical Reviewer</span>
              </div>
            </div>

            <span className="text-slate-300 hidden sm:inline">•</span>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published: {post.publishedAt || (post.createdAt ? post.createdAt.slice(0, 10) : '2026')}</span>
            </div>

            <span className="text-slate-300 hidden sm:inline">•</span>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{post.readingTime || '4 min read'}</span>
            </div>

            <span className="text-slate-300 hidden sm:inline">•</span>

            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Medical Content</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-950">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full max-h-[480px] object-cover"
            />
            {post.excerpt && (
              <p className="p-3 text-xs text-slate-500 bg-slate-50 border-t border-slate-200 italic">
                {post.excerpt}
              </p>
            )}
          </div>
        )}

        {/* Rich Article Body */}
        <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm mb-10">
          <div
            className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed
              [&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:font-extrabold [&>h2]:text-slate-900 [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:pb-2 [&>h2]:border-b [&>h2]:border-slate-100
              [&>h3]:text-lg sm:[&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-slate-900 [&>h3]:mt-6 [&>h3]:mb-3
              [&>p]:mb-4 [&>p]:leading-relaxed
              [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul]:space-y-1.5
              [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>ol]:space-y-1.5
              [&>li]:text-slate-700
              [&>blockquote]:border-l-4 [&>blockquote]:border-teal-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-600 [&>blockquote]:bg-slate-50 [&>blockquote]:py-2 [&>blockquote]:my-4 [&>blockquote]:rounded-r-lg
              [&>table]:w-full [&>table]:border-collapse [&>table]:my-6 [&>table]:text-xs sm:[&>table]:text-sm
              [&>table_th]:bg-slate-100 [&>table_th]:p-3 [&>table_th]:text-left [&>table_th]:font-bold [&>table_th]:border [&>table_th]:border-slate-200
              [&>table_td]:p-3 [&>table_td]:border [&>table_td]:border-slate-200
            "
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tag Cloud */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                Tags &amp; Keywords
              </span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Share Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-teal-600" />
              <span>Share this diagnostic guide:</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="px-3 py-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#20ba59] transition text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleTwitterShare}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>X / Twitter</span>
              </button>
              <button
                type="button"
                onClick={handleLinkedInShare}
                className="px-3 py-1.5 rounded-lg bg-[#0077b5] text-white hover:bg-[#006097] transition text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>LinkedIn</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition text-xs font-bold flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </article>

        {/* Clinical Disclaimer Box */}
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 mb-12 text-xs text-amber-900 flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold text-amber-950 block">Medical Disclaimer</span>
            <p className="leading-relaxed">
              This article is published for educational and laboratory information purposes only. It should not be used as a substitute for professional medical diagnosis, advice, or treatment. Always consult a qualified medical doctor or registered pathologist with specific questions regarding your blood tests and medical conditions.
            </p>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <span>Recommended Diagnostic Guides</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <article
                  key={rel.id}
                  onClick={() => onSelectPost ? onSelectPost(rel) : window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="aspect-16/10 bg-slate-950 overflow-hidden">
                      <img
                        src={rel.featuredImage || 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80'}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {rel.category}
                      </span>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-teal-700 transition line-clamp-2">
                        {rel.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {rel.excerpt}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 text-[11px] font-bold text-teal-700 flex items-center gap-1">
                    <span>Read Guide</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
