import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Search,
  Tag,
  Sparkles,
  Share2,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SeoPost } from '../types';

interface SeoPostCardsSectionProps {
  onSelectPost?: (post: SeoPost) => void;
  className?: string;
  theme?: 'dark' | 'light';
  maxItems?: number;
}

export const SeoPostCardsSection: React.FC<SeoPostCardsSectionProps> = ({
  onSelectPost,
  className = '',
  theme = 'dark',
  maxItems,
}) => {
  const { publishedSeoPosts } = useCms();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    publishedSeoPosts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [publishedSeoPosts]);

  // Filtered published posts
  const filteredPosts = useMemo(() => {
    return publishedSeoPosts.filter((post) => {
      const matchCat = selectedCategory === 'all' || post.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        (post.focusKeyword && post.focusKeyword.toLowerCase().includes(q)) ||
        post.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [publishedSeoPosts, selectedCategory, searchQuery]);

  const displayPosts = maxItems ? filteredPosts.slice(0, maxItems) : filteredPosts;

  const handleCardClick = (post: SeoPost) => {
    if (onSelectPost) {
      onSelectPost(post);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/blog/${post.slug || post.id}`;
    }
  };

  const handleShare = (e: React.MouseEvent, post: SeoPost) => {
    e.stopPropagation();
    const url = `${window.location.origin}/blog/${post.slug || post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSlug(post.id);
      setTimeout(() => setCopiedSlug(null), 2500);
    }
  };

  const isDark = theme === 'dark';

  return (
    <section
      id="seo-knowledge-posts"
      aria-label="Diagnostic Healthcare & Pathology Knowledge Base"
      className={`py-12 sm:py-16 transition-colors ${
        isDark
          ? 'bg-[#061224] text-slate-100 border-t border-slate-800/80'
          : 'bg-slate-50 text-slate-900 border-t border-slate-200'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3 bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Healthcare Insights &amp; Clinical Guides</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Latest Pathology &amp; Diagnostic Articles
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              Curated by certified pathologists and lab directors. Clinical reference values, fasting guidelines, and diagnostic laboratory best practices in India.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests, symptoms, guides..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-900/90 text-white placeholder-slate-500 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/50'
                  }`}
                >
                  {cat === 'all' ? 'All Articles' : cat}
                  {cat === 'all' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/20 text-slate-950 font-black">
                      {publishedSeoPosts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Posts Cards Grid */}
        {displayPosts.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No articles matched your search</h3>
            <p className="text-xs text-slate-500 mt-1">Try another keyword or select All Articles.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-500 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => handleCardClick(post)}
                className="group relative flex flex-col bg-slate-900/80 hover:bg-slate-850 rounded-2xl border border-slate-800 hover:border-teal-500/50 overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                {/* Featured Image Container */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-950">
                  <img
                    src={post.featuredImage || 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80'}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>

                  {/* Category Badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-teal-500 text-slate-950 shadow-md">
                    {post.category || 'Pathology Guide'}
                  </span>

                  {/* Reading Time */}
                  <span className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 text-slate-300 backdrop-blur-xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{post.readingTime || '4 min read'}</span>
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Date & Author */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{post.publishedAt || (post.createdAt ? post.createdAt.slice(0, 10) : '2026')}</span>
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-[120px] font-medium text-slate-300">
                        {post.author || 'Editorial Desk'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-teal-300 transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {post.excerpt || post.metaDescription}
                    </p>

                    {/* Focus Keyword Pill */}
                    {post.focusKeyword && (
                      <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        <Tag className="w-2.5 h-2.5 text-amber-400" />
                        <span className="truncate max-w-[160px]">{post.focusKeyword}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Read Action & Share */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold">
                    <span className="text-teal-400 group-hover:text-amber-400 flex items-center gap-1 transition">
                      <span>Read Full Guide</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleShare(e, post)}
                      title="Copy Article Link"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {copiedSlug === post.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Bottom Crawlability & Canonical Information Note */}
        <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-400">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span>Articles automatically indexed in Google XML Sitemap with Schema.org BlogPosting metadata.</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 font-semibold underline underline-offset-2 flex items-center gap-1"
            >
              <span>XML Sitemap</span>
              <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
