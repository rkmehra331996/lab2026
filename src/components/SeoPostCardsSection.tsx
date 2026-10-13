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

  // Filter only published posts
  const publishedPosts = (seoPosts || []).filter((p) => p.status === 'published');

  const categories = ['All', ...Array.from(new Set(publishedPosts.map((p) => p.category).filter(Boolean)))];

  const displayedPosts = selectedCategory === 'All'
    ? publishedPosts
    : publishedPosts.filter((p) => p.category === selectedCategory);

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
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
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

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPosts.slice(0, 6).map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost && onSelectPost(post)}
              className={`group flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                isDark
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
      </div>
    </section>
  );
};
