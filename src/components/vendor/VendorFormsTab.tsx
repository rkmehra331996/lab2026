import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  Phone,
  ArrowRight,
  Send,
  Eye,
  X,
  Check,
  Mail,
  Copy,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { ContactSubmission, AppView } from '../../types';

interface VendorFormsTabProps {
  initialSubTab?: 'bookings' | 'contacts';
  activeSubTab?: 'bookings' | 'contacts';
  onSubTabChange?: (tab: 'bookings' | 'contacts') => void;
  onNavigateView?: (view: AppView) => void;
}

export const VendorFormsTab: React.FC<VendorFormsTabProps> = () => {
  const {
    contactSubmissions,
    markContactAsRead,
    toggleContactReadStatus,
    deleteContactSubmission,
    vendorLabSettings,
  } = useCms();

  const labName = vendorLabSettings?.labName || 'Our Diagnostic Laboratory';

  // --- CONTACT FORM STATE ---
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedContactToRead, setSelectedContactToRead] = useState<ContactSubmission | null>(null);
  const [contactToDelete, setContactToDelete] = useState<ContactSubmission | null>(null);

  // Shared Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; actionText?: string; onAction?: () => void } | null>(null);
  const showToast = (text: string, actionText?: string, onAction?: () => void) => {
    setToastMessage({ text, actionText, onAction });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 1-Click Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  // --- FILTERED CONTACTS ---
  const filteredContacts = useMemo(() => {
    return contactSubmissions.filter((c) => {
      const matchSearch =
        !contactSearch.trim() ||
        c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.phone?.includes(contactSearch) ||
        c.email?.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.subject?.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.message?.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.referenceToken?.toLowerCase().includes(contactSearch.toLowerCase());

      if (!matchSearch) return false;

      if (contactStatusFilter === 'unread') return c.status === 'unread';
      if (contactStatusFilter === 'read') return c.status === 'read';
      return true;
    });
  }, [contactSubmissions, contactSearch, contactStatusFilter]);

  const unreadContactsCount = contactSubmissions.filter((c) => c.status === 'unread').length;

  // Handler: Delete Contact
  const handleConfirmDeleteContact = () => {
    if (!contactToDelete) return;
    const name = contactToDelete.name;
    deleteContactSubmission(contactToDelete.id);
    setContactToDelete(null);
    if (selectedContactToRead?.id === contactToDelete.id) {
      setSelectedContactToRead(null);
    }
    showToast(`🗑️ Inquiry from "${name}" deleted.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
          {toastMessage.actionText && toastMessage.onAction && (
            <button
              type="button"
              onClick={toastMessage.onAction}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0 transition flex items-center gap-1 cursor-pointer"
            >
              <span>{toastMessage.actionText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTACT FORM INQUIRIES                                   */}
      {/* ======================================================== */}
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search by sender name, mobile, subject, reference token..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B6D]"
            />
            {contactSearch && (
              <button
                type="button"
                onClick={() => setContactSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Read/Unread Filters */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setContactStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                contactStatusFilter === 'all'
                  ? 'bg-[#123B6D] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({contactSubmissions.length})
            </button>
            <button
              type="button"
              onClick={() => setContactStatusFilter('unread')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                contactStatusFilter === 'unread'
                  ? 'bg-rose-600 text-white font-black shadow-2xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              Unread ({unreadContactsCount})
            </button>
            <button
              type="button"
              onClick={() => setContactStatusFilter('read')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                contactStatusFilter === 'read'
                  ? 'bg-emerald-600 text-white font-black shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              Read ({contactSubmissions.length - unreadContactsCount})
            </button>
          </div>
        </div>

        {/* Contact Submissions Grid: 3 in a row */}
        {filteredContacts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">No contact messages found</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {contactSearch ? 'Try adjusting your search criteria.' : 'Inquiries submitted from your website contact form will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5">
            {filteredContacts.map((c) => {
              const isUnread = c.status === 'unread';
              const cleanPhone = c.phone.replace(/\D/g, '');

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md hover:border-[#123B6D] flex flex-col justify-between space-y-4 ${
                    isUnread
                      ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300/40'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Sender Name, Token & Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {c.referenceToken ? (
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {c.referenceToken}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 font-mono">MSG-PORTAL</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        {isUnread ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                            ● Unread
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Read
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{c.createdAt}</span>
                        </span>
                      </div>
                    </div>

                    {/* Name & Contact */}
                    <div>
                      <h3 className="font-black text-base text-slate-900 leading-snug">{c.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-slate-600">
                        <a
                          href={`tel:+91${cleanPhone}`}
                          className="font-bold text-[#123B6D] hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>+91 {cleanPhone}</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopy(cleanPhone, `phone-${c.id}`)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="Copy phone number"
                        >
                          {copiedId === `phone-${c.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>

                        {c.email && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 w-full truncate">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <a href={`mailto:${c.email}`} className="hover:underline truncate">
                              {c.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(c.email, `mail-${c.id}`)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                              title="Copy email"
                            >
                              {copiedId === `mail-${c.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subject & Preview */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      {c.subject && (
                        <div className="font-bold text-[#123B6D] text-[11px] truncate">
                          {c.subject}
                        </div>
                      )}
                      <p className="text-slate-600 line-clamp-3 leading-relaxed text-[11px]">
                        "{c.message}"
                      </p>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContactToRead(c);
                        if (c.status === 'unread') {
                          markContactAsRead(c.id);
                        }
                      }}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Read full message inquiry"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>Read Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleContactReadStatus(c.id)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      title={isUnread ? 'Mark as read' : 'Mark as unread'}
                    >
                      {isUnread ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setContactToDelete(c)}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete inquiry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: READ CONTACT INQUIRY MODAL (Full View & Reply)   */}
      {/* ======================================================== */}
      {selectedContactToRead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#123B6D] border border-blue-200 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Website Contact Form Message</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span>Token: <strong>{selectedContactToRead.referenceToken || selectedContactToRead.id}</strong></span>
                    <span>•</span>
                    <span>{selectedContactToRead.createdAt}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContactToRead(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sender Detail Block */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Sender Name:</span>
                <span className="font-black text-slate-900 text-sm">{selectedContactToRead.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Mobile Phone:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-800">+91 {selectedContactToRead.phone}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedContactToRead.phone, 'phone')}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    title="Copy phone"
                  >
                    {copiedId === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {selectedContactToRead.email && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Email Address:</span>
                  <span className="text-slate-700">{selectedContactToRead.email}</span>
                </div>
              )}
              {selectedContactToRead.subject && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Inquiry Subject:</span>
                  <span className="font-extrabold text-[#123B6D]">{selectedContactToRead.subject}</span>
                </div>
              )}
            </div>

            {/* Message Body */}
            <div>
              <span className="font-bold text-slate-700 block mb-1 text-xs">Full Message Text:</span>
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                {selectedContactToRead.message}
              </div>
            </div>

            {/* Quick Reply & Action Buttons */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick Response:</span>
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://wa.me/91${selectedContactToRead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hello ${selectedContactToRead.name}, thank you for contacting ${labName} regarding "${selectedContactToRead.subject || 'your inquiry'}". How can we assist you today?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp Reply</span>
                </a>

                <a
                  href={`tel:+91${selectedContactToRead.phone.replace(/\D/g, '')}`}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-[11px] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <Phone className="w-3 h-3 text-[#123B6D]" />
                  <span>Call +91</span>
                </a>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  toggleContactReadStatus(selectedContactToRead.id);
                  setSelectedContactToRead(null);
                  showToast('Message status updated.');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
              >
                Mark as Unread
              </button>

              <button
                type="button"
                onClick={() => setSelectedContactToRead(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DELETE CONTACT INQUIRY CONFIRMATION             */}
      {/* ======================================================== */}
      {contactToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Are you sure you want to delete this?</h3>
                <p className="text-[11px] text-slate-500">Remove from customer records.</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-xs">
              Are you sure you want to delete this? Contact inquiry message from{' '}
              <strong>"{contactToDelete.name}"</strong>.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteContact}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
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
