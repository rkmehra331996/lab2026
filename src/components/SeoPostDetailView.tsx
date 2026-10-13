import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Check,
  Bookmark,
  User,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Building,
  FileText,
  ShieldCheck,
  ExternalLink,
  BookOpen,
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
  const { seoPosts } = useCms();
  const [isCopied, setIsCopied] = useState(false);

  // Update dynamic head metadata, OpenGraph and JSON-LD schema
  useEffect(() => {
    applyPostSeoToDOM(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [post]);

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : post.canonicalUrl || '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      });
    }
  };

  const handleWhatsAppShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : post.canonicalUrl || '';
    const text = `Read "${post.title}" on IndianLalaji Diagnostic Clinical Knowledge Base:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Find other published posts for recommended reading
  const relatedPosts = (seoPosts || [])
    .filter((p) => p.id !== post.id && p.status === 'published')
    .slice(0, 3);

  // Render markdown-like sections simply and cleanly
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listBuffer: string[] = [];
    let isInsideTable = false;
    let tableRows: string[][] = [];

    const flushList = () => {
      if (listBuffer.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-4 space-y-2 list-disc list-outside pl-5 text-slate-700 text-sm leading-relaxed">
            {listBuffer.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        );
        listBuffer = [];
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const bodyRows = tableRows.slice(1).filter((r) => !r.every((c) => c.match(/^:?-+:?$/)));

        elements.push(
          <div key={`table-${elements.length}`} className="my-6 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-xs text-left text-slate-800">
              <thead className="bg-[#123B6D] text-white uppercase text-[10px] tracking-wider font-extrabold">
                <tr>
                  {headerRow.map((h, i) => (
                    <th key={i} className="px-3.5 py-3 border-r border-white/10 last:border-r-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2.5 font-medium border-r border-slate-100 last:border-r-0" dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        isInsideTable = false;
      }
    };

    const formatInline = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-[#123B6D] font-mono px-1 py-0.5 rounded text-[11px]">$1</code>');
    };

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();

      // Table line
      if (line.startsWith('|') && line.endsWith('|')) {
        flushList();
        isInsideTable = true;
        const cols = line
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        tableRows.push(cols);
        return;
      } else if (isInsideTable) {
        flushTable();
      }

      // Divider
      if (line === '---' || line === '***') {
        flushList();
        elements.push(<hr key={`hr-${idx}`} className="my-6 border-slate-200" />);
        return;
      }

      // Headings
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${idx}`} className="text-lg font-black text-slate-900 mt-6 mb-2 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#123B6D] rounded-full inline-block" />
            <span>{line.replace('### ', '')}</span>
          </h3>
        );
        return;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${idx}`} className="text-xl font-black text-slate-900 mt-8 mb-3 tracking-tight">
            {line.replace('## ', '')}
          </h2>
        );
        return;
      }

      // Bullet items
      if (line.startsWith('* ') || line.startsWith('- ')) {
        listBuffer.push(line.replace(/^(\*|-)\s+/, ''));
        return;
      }

      // Numbered items
      if (/^\d+\.\s+/.test(line)) {
        listBuffer.push(line.replace(/^\d+\.\s+/, ''));
        return;
      }

      // Regular paragraph
      if (line.length > 0) {
        flushList();
        elements.push(
          <p
            key={`p-${idx}`}
            className="text-slate-700 text-sm leading-relaxed my-3 font-normal"
            dangerouslySetInnerHTML={{ __html: formatInline(line) }}
          />
        );
      }
    });

    flushList();
    flushTable();

    return elements;
  };

  return (
    <main className="flex-1 bg-[#F8FAFC]">
      {/* Top Breadcrumb & Return Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#123B6D] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Main Website</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-2xs cursor-pointer"
              title="Share on WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share on WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
              title="Copy Article Link"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isCopied ? 'Link Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Article Container */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Article Meta Header */}
        <header className="space-y-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
              {post.category || 'Clinical Guide'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime || '5 min read'}
            </span>
            {post.publishedAt && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {post.publishedAt}
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Author Badge */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <div className="w-9 h-9 rounded-full bg-[#123B6D] text-white flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">{post.author || 'IndianLalaji Editorial Desk'}</div>
              <div className="text-[11px] text-slate-500">Pathology &amp; Laboratory Operations Contributor</div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 mb-8 bg-slate-900 aspect-video max-h-96 w-full shadow-xs">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Lead Excerpt Summary Box */}
        {post.excerpt && (
          <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 mb-6 space-y-1.5">
            <div className="text-[11px] font-black uppercase tracking-wide text-teal-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Clinical Summary / Key Takeaway</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {post.excerpt}
            </p>
          </div>
        )}

        {/* Formatted Article Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xs prose-slate max-w-none">
          {renderFormattedContent(post.content)}

          {/* Clinical Disclaimer Box */}
          <div className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-500 leading-relaxed space-y-1">
            <strong className="text-slate-700 font-bold block">Medical &amp; Diagnostic Disclaimer:</strong>
            <p>
              This publication is intended strictly for diagnostic laboratory workflow education, laboratory information systems (LIMS) implementation, and quality assurance guidance. Biological reference intervals must always be validated by individual laboratory medical directors in alignment with local demographics and analyzer manufacturer specifications.
            </p>
          </div>
        </div>

        {/* Lab Software CTA Strip */}
        <div className="my-8 rounded-3xl bg-gradient-to-r from-[#123B6D] to-[#0F766E] text-white p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
              <Building className="w-3 h-3" />
              <span>INDIANLALAJI.COM LAB OS</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              Run Your Pathology Lab Offline with WhatsApp Reports
            </h3>
            <p className="text-xs text-slate-200 max-w-xl leading-relaxed">
              Equip your diagnostic lab with 500+ pre-calibrated tests, dynamic UPI QR billing, and automated patient report delivery across India.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onNavigateView) {
                onNavigateView('website');
                setTimeout(() => {
                  const demoBtn = document.getElementById('pricing');
                  if (demoBtn) demoBtn.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              } else {
                onBack();
              }
            }}
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            Explore Lab Software &amp; Pricing
          </button>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#123B6D]" />
              <span>More Diagnostic SOPs &amp; Clinical Guides</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectPost && onSelectPost(rel)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#123B6D] transition shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase">
                      {rel.category}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 mt-2 line-clamp-2 hover:text-[#123B6D] transition">
                      {rel.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {rel.excerpt}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{rel.readingTime}</span>
                    <span className="font-bold text-[#123B6D] flex items-center gap-0.5">
                      <span>Read</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
};
