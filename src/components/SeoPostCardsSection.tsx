import React, { useState } from 'react';
import {
  FileText,
  Clock,
  ArrowRight,
  BookOpen,
  Sparkles,
  Tag,
  Eye,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { SeoPost } from '../types';
import { useCms } from '../context/CmsContext';

interface SeoPostCardsSectionProps {
  onSelectPost?: (post: SeoPost) => void;
  theme?: 'dark' | 'light';
}

export const SeoPostCardsSection: React.FC<SeoPostCardsSectionProps> = ({
  onSelectPost,
  theme = 'dark',
}) => {
  const { seoPosts } = useCms();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAllPosts, setShowAllPosts] = useState<boolean>(true);

  // Filter only published posts
  const publishedPosts = (seoPosts || []).filter((p) => p.status === 'published');

  const categories = ['All', ...Array.from(new Set(publishedPosts.map((p) => p.category).filter(Boolean)))];

  const displayedPosts = selectedCategory === 'All'
    ? publishedPosts
    : publishedPosts.filter((p) => p.category === selectedCategory);

  const hasFeaturedBanner = selectedCategory === 'All' && displayedPosts[0]?.id === 'post-best-laboratory-management-software-india';
  const cardPostsPool = hasFeaturedBanner ? displayedPosts.slice(1) : displayedPosts;
  const postsToRender = (selectedCategory !== 'All' || showAllPosts) ? cardPostsPool : cardPostsPool.slice(0, 6);

  if (publishedPosts.length === 0) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <section
      aria-label="Clinical Knowledge Base and Diagnostic Guides"
      className={`relative border-t py-12 transition-colors ${
        isDark
          ? 'bg-[#081528] text-slate-200 border-slate-800/80'
          : 'bg-slate-50 text-slate-800 border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2.5 bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Diagnostic Clinical Knowledge Base</span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Pathology Laboratory SOPs &amp; Clinical Guides
            </h2>
            <p className={`text-xs mt-1 max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Standard Operating Procedures, NABL ISO 15189 roadmaps, CBC reference intervals, and digital workflow practices for Indian diagnostic centers.
            </p>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowAllPosts(true);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-teal-500 text-slate-950 shadow-xs'
                      : isDark
                      ? 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Featured Flagship Post Showcase Banner (When viewing All) */}
        {selectedCategory === 'All' && displayedPosts[0] && displayedPosts[0].id === 'post-best-laboratory-management-software-india' && (
          <div
            onClick={() => onSelectPost && onSelectPost(displayedPosts[0])}
            className={`mb-8 p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-[#123B6D]/80 via-[#0f243f] to-[#081528] border-teal-500/40 hover:border-teal-400 shadow-xl'
                : 'bg-gradient-to-br from-blue-50 via-white to-teal-50/50 border-blue-200 hover:border-blue-400 shadow-md'
            }`}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                    <span>🏆</span>
                    <span>#1 Ranked Pillar Guide 2026</span>
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-blue-100 text-blue-800'}`}>
                    Software & Technology
                  </span>
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Clock className="w-3 h-3" />
                    <span>10 min read</span>
                  </span>
                </div>

                <h3 className={`text-xl sm:text-2xl font-black leading-tight ${isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-blue-700'} transition-colors`}>
                  {displayedPosts[0].title}
                </h3>

                <p className={`text-xs sm:text-sm leading-relaxed max-w-3xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {displayedPosts[0].excerpt}
                </p>

                {/* Keyword Pills */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {[
                    'Best Laboratory Management Software in India',
                    'Best Pathology Lab Software',
                    'Top LIMS Software',
                    'WhatsApp Reports',
                    'UPI Payments',
                    'NABL ISO 15189',
                    'Multi-Branch',
                  ].map((kw, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                <button
                  type="button"
                  className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition group-hover:scale-105 cursor-pointer"
                >
                  <span>Read Complete Post</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postsToRender.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost && onSelectPost(post)}
              className={`group flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                post.id === 'post-best-laboratory-management-software-india'
                  ? isDark
                    ? 'ring-2 ring-amber-400/80 bg-[#122844] border-amber-400/60 shadow-lg'
                    : 'ring-2 ring-blue-500/80 bg-blue-50/40 border-blue-400 shadow-md'
                  : isDark
                  ? 'bg-[#0f243f] hover:bg-[#132c4d] border-slate-800 hover:border-teal-500/40 shadow-xs hover:shadow-lg hover:shadow-teal-950/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-md'
              }`}
            >
              {/* Thumbnail Header */}
              {post.featuredImage && (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  <span className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-teal-500 text-slate-950 shadow-xs">
                    {post.category || 'Clinical Guide'}
                  </span>
                </div>
              )}

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {!post.featuredImage && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {post.category || 'Clinical Guide'}
                      </span>
                    </div>
                  )}

                  <h3
                    className={`font-black text-sm sm:text-base leading-snug line-clamp-2 transition-colors ${
                      isDark
                        ? 'text-white group-hover:text-teal-300'
                        : 'text-slate-900 group-hover:text-blue-700'
                    }`}
                  >
                    {post.title}
                  </h3>

                  <p className={`mt-2 text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {post.excerpt || post.metaDescription}
                  </p>
                </div>

                {/* Card Footer Info */}
                <div className={`mt-4 pt-3.5 border-t flex items-center justify-between text-[11px] ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                }`}>
                  <div className="flex items-center gap-3">
                    {post.readingTime && (
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{post.readingTime}</span>
                      </span>
                    )}
                    {post.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{post.publishedAt}</span>
                      </span>
                    )}
                  </div>

                  <span className="flex items-center gap-1 font-bold text-teal-400 group-hover:translate-x-1 transition-transform">
                    <span>Read</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {displayedPosts.length > 6 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowAllPosts((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-teal-500/10 text-teal-300 hover:bg-teal-500 hover:text-slate-950 border border-teal-500/30'
                  : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-300 shadow-xs'
              }`}
            >
              <span>{showAllPosts ? 'Show Top 6 Articles' : `View All ${displayedPosts.length} Clinical & Lab Guides`}</span>
              <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showAllPosts ? '-rotate-90' : 'rotate-0'}`} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
