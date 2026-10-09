import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  DollarSign,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Eye,
  Check,
  Truck,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { VendorLabSettings } from '../../types';

interface VendorBookingSettingsTabProps {
  initialSubTab?: 'all' | 'charges' | 'timing';
  onNavigateView?: (view: any) => void;
}

const DEFAULT_BOOKING_SLOTS = [
  'Tomorrow: 6:30 AM - 8:30 AM (Fasting Preferred)',
  'Tomorrow: 8:30 AM - 10:30 AM (Fasting / Routine)',
  'Tomorrow: 10:30 AM - 1:00 PM (Standard Daytime)',
  'Tomorrow: 1:00 PM - 4:00 PM (Afternoon Slot)',
  'Tomorrow: 4:00 PM - 7:00 PM (Evening Slot)',
  'Today: Urgent Sample Collection (Within 1 Hour)',
];

export const VendorBookingSettingsTab: React.FC<VendorBookingSettingsTabProps> = ({
  initialSubTab = 'all',
  onNavigateView,
}) => {
  const { vendorLabSettings, updateVendorLabSettings } = useCms();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'charges' | 'timing'>(initialSubTab);

  // Form State
  const [homeCharge, setHomeCharge] = useState<number>(
    vendorLabSettings.homeCollectionCharge ?? 100
  );
  const [isFreeThresholdEnabled, setIsFreeThresholdEnabled] = useState<boolean>(
    (vendorLabSettings.freeHomeCollectionThreshold ?? 0) > 0
  );
  const [freeThreshold, setFreeThreshold] = useState<number>(
    vendorLabSettings.freeHomeCollectionThreshold || 999
  );
  const [statCharge, setStatCharge] = useState<number>(
    vendorLabSettings.statCollectionCharge ?? 150
  );

  const [openingHours, setOpeningHours] = useState<string>(
    vendorLabSettings.openingHours || 'Open 7:00 AM – 9:00 PM (All 7 Days)'
  );
  const [emergencyHours, setEmergencyHours] = useState<string>(
    vendorLabSettings.emergencyHours || '24x7 Emergency Services at Central Lab'
  );
  const [bookingTimingNote, setBookingTimingNote] = useState<string>(
    vendorLabSettings.bookingTiming || 'Online Bookings Open 24x7 • Doorstep Pickup 6:30 AM – 7:30 PM'
  );

  const [timeSlots, setTimeSlots] = useState<string[]>(
    vendorLabSettings.bookingTimeSlots && vendorLabSettings.bookingTimeSlots.length > 0
      ? vendorLabSettings.bookingTimeSlots
      : DEFAULT_BOOKING_SLOTS
  );
  const [newSlotText, setNewSlotText] = useState('');
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [editingSlotValue, setEditingSlotValue] = useState('');

  const [toastMessage, setToastMessage] = useState('');

  // Keep state synced if vendorLabSettings changes externally
  useEffect(() => {
    setHomeCharge(vendorLabSettings.homeCollectionCharge ?? 100);
    setIsFreeThresholdEnabled((vendorLabSettings.freeHomeCollectionThreshold ?? 0) > 0);
    setFreeThreshold(vendorLabSettings.freeHomeCollectionThreshold || 999);
    setStatCharge(vendorLabSettings.statCollectionCharge ?? 150);
    setOpeningHours(vendorLabSettings.openingHours || 'Open 7:00 AM – 9:00 PM (All 7 Days)');
    setEmergencyHours(vendorLabSettings.emergencyHours || '24x7 Emergency Services at Central Lab');
    setBookingTimingNote(
      vendorLabSettings.bookingTiming || 'Online Bookings Open 24x7 • Doorstep Pickup 6:30 AM – 7:30 PM'
    );
    if (vendorLabSettings.bookingTimeSlots && vendorLabSettings.bookingTimeSlots.length > 0) {
      setTimeSlots(vendorLabSettings.bookingTimeSlots);
    }
  }, [vendorLabSettings]);

  // Handle Save
  const handleSave = () => {
    const payload: Partial<VendorLabSettings> = {
      homeCollectionCharge: Number(homeCharge),
      freeHomeCollectionThreshold: isFreeThresholdEnabled ? Number(freeThreshold) : 0,
      statCollectionCharge: Number(statCharge),
      openingHours: openingHours.trim(),
      emergencyHours: emergencyHours.trim(),
      bookingTiming: bookingTimingNote.trim(),
      bookingTimeSlots: timeSlots,
    };

    updateVendorLabSettings(payload);
    setToastMessage('Booking form settings saved and updated across all patient forms!');
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Add Time Slot
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotText.trim()) return;
    setTimeSlots((prev) => [...prev, newSlotText.trim()]);
    setNewSlotText('');
  };

  // Save Edited Slot
  const handleSaveEditSlot = (index: number) => {
    if (!editingSlotValue.trim()) return;
    setTimeSlots((prev) => {
      const copy = [...prev];
      copy[index] = editingSlotValue.trim();
      return copy;
    });
    setEditingSlotIndex(null);
    setEditingSlotValue('');
  };

  // Confirmation state for deleting time slots
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Delete Slot
  const handleDeleteSlot = (index: number) => {
    const slot = timeSlots[index] || 'Time Slot';
    setDeleteConfirm({
      isOpen: true,
      message: `Are you sure you want to delete this? Booking time slot: "${slot}".`,
      onConfirm: () => {
        setTimeSlots((prev) => prev.filter((_, idx) => idx !== index));
        setDeleteConfirm(null);
      },
    });
  };

  // Reset to Default Slots
  const handleResetSlots = () => {
    setTimeSlots(DEFAULT_BOOKING_SLOTS);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
            <CalendarCheck className="w-5 h-5 text-amber-600" />
          </span>
          <div>
            <h1 className="text-lg font-black text-[#123B6D]">
              9. Booking Form Settings
            </h1>
            <p className="text-xs text-slate-500">
              Configure home collection sample charges, lab operating hours, and patient preferred collection slots.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateView && (
            <button
              type="button"
              onClick={() => onNavigateView('vendor_website')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>Preview Live Form</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-1.5 overflow-x-auto shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'all'
              ? 'bg-[#123B6D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Booking Settings
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('charges')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
            activeSubTab === 'charges'
              ? 'bg-[#123B6D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Home Sample Charges — Edit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('timing')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
            activeSubTab === 'timing'
              ? 'bg-[#123B6D] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Booking Timing — Edit</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. HOME SAMPLE CHARGES — EDIT */}
      {/* ======================================================== */}
      {(activeSubTab === 'all' || activeSubTab === 'charges') && (
        <div id="section-charges" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Truck className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  1. Home Sample Charges — Edit
                </h2>
                <p className="text-xs text-slate-500">
                  Control the doorstep blood sample collection fee added automatically to the patient's checkout bill.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Checkout Pricing
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Form Inputs */}
            <div className="lg:col-span-2 space-y-5">
              {/* Primary Charge Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Base Home Collection Charge (₹ INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative max-w-sm">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={homeCharge}
                    onChange={(e) => setHomeCharge(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 font-extrabold text-sm text-[#123B6D] focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                    placeholder="100"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  This fee is applied when the patient selects <strong>"Home Sample Collection"</strong> on the website or booking form.
                </p>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400">Presets:</span>
                  {[
                    { label: 'Free (₹0)', val: 0 },
                    { label: '₹50', val: 50 },
                    { label: '₹100 (Standard)', val: 100 },
                    { label: '₹150', val: 150 },
                    { label: '₹200', val: 200 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setHomeCharge(preset.val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        homeCharge === preset.val
                          ? 'bg-[#123B6D] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free Home Collection Waiver Rule */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Free Home Collection Above Minimum Order Value
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFreeThresholdEnabled}
                      onChange={(e) => setIsFreeThresholdEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {isFreeThresholdEnabled && (
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Waive home sample charges when cart total exceeds (₹ INR):
                    </label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={freeThreshold}
                        onChange={(e) => setFreeThreshold(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-300 font-bold text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      ✓ Patients booking tests worth ₹{freeThreshold} or more will get free doorstep sample pickup.
                    </p>
                  </div>
                )}
              </div>

              {/* Stat / Emergency Surcharge */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Optional: Urgent / Stat Sample Collection Surcharge (₹ INR)
                </label>
                <div className="relative max-w-sm">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={statCharge}
                    onChange={(e) => setStatCharge(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-xs"
                    placeholder="150"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  For immediate 1-hour fast-track home phlebotomy dispatch.
                </p>
              </div>
            </div>

            {/* Live Patient Form Preview Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Live Patient Checkout Preview
              </span>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Sample Collection Mode</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                    Selected
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl border-2 border-[#123B6D] bg-sky-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#123B6D]" />
                      <span className="font-bold text-slate-800">Doorstep Home Collection</span>
                    </div>
                    <span className="font-mono font-black text-[#123B6D]">
                      {homeCharge === 0 ? 'FREE' : `+₹${homeCharge}`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between opacity-70">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏥</span>
                      <span className="font-medium text-slate-600">Walk-in Visit at Lab</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600">₹0 (Free)</span>
                  </div>
                </div>

                {/* Billing Summary Box */}
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Selected Tests (Example)</span>
                    <span>₹1,200</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>Doorstep Collection Fee</span>
                    <span className="text-emerald-700">
                      {homeCharge === 0 ? 'FREE' : `+₹${homeCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-[#123B6D] pt-1 border-t border-dashed border-slate-200">
                    <span>Grand Total</span>
                    <span>₹{1200 + homeCharge}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center">
                Updating Home Sample Charges updates the total instantly on all online booking flows.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. BOOKING TIMING — EDIT */}
      {/* ======================================================== */}
      {(activeSubTab === 'all' || activeSubTab === 'timing') && (
        <div id="section-timing" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  2. Booking Timing — Edit
                </h2>
                <p className="text-xs text-slate-500">
                  Set laboratory operating hours, morning fasting windows, and customize patient preferred time slots.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Schedule &amp; Slots
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Lab Operating Hours */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Regular Lab Operating Hours <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Sun className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="e.g. Open 7:00 AM – 9:00 PM (All 7 Days)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Displayed in website top bar, contact section, and booking instructions.
              </p>
            </div>

            {/* Emergency Service Timing */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Emergency / 24x7 Night Service Timing
              </label>
              <div className="relative">
                <Moon className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={emergencyHours}
                  onChange={(e) => setEmergencyHours(e.target.value)}
                  placeholder="e.g. 24x7 Emergency Services at Central Lab"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Highlighted for urgent blood investigations and ICU emergency panels.
              </p>
            </div>
          </div>

          {/* Booking Timing Banner Note */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Booking Timing Banner Notice for Patients
            </label>
            <input
              type="text"
              value={bookingTimingNote}
              onChange={(e) => setBookingTimingNote(e.target.value)}
              placeholder="e.g. Online Bookings Open 24x7 • Doorstep Sample Pickup 6:30 AM – 7:30 PM"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none font-medium"
            />
          </div>

          {/* ======================================================== */}
          {/* TIME SLOTS MANAGER */}
          {/* ======================================================== */}
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span>Preferred Sample Collection Time Slots</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {timeSlots.length} Slots
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  These slots appear in the dropdown when patients book tests online.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetSlots}
                className="text-[11px] font-bold text-slate-500 hover:text-[#123B6D] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to Standard Slots</span>
              </button>
            </div>

            {/* List of Slots */}
            <div className="space-y-2">
              {timeSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-300 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {editingSlotIndex === idx ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingSlotValue}
                          onChange={(e) => setEditingSlotValue(e.target.value)}
                          className="flex-1 p-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditSlot(idx)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSlotIndex(null)}
                          className="px-2 py-1 text-slate-600 rounded-lg text-xs hover:bg-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {slot}
                      </span>
                    )}
                  </div>

                  {editingSlotIndex !== idx && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSlotIndex(idx);
                          setEditingSlotValue(slot);
                        }}
                        className="p-1.5 text-slate-500 hover:text-[#123B6D] hover:bg-white rounded-lg transition cursor-pointer"
                        title="Edit Slot"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition cursor-pointer"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Slot Form */}
            <form onSubmit={handleAddSlot} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="e.g. Tomorrow: 7:00 AM - 9:00 AM (Fasting Preferred)"
                value={newSlotText}
                onChange={(e) => setNewSlotText(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B6D]/30 focus:outline-none bg-white font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#123B6D] hover:bg-[#0e2c52] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Slot</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Save Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-300 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-700">
            Home Sample Charge: <strong className="text-emerald-700">{homeCharge === 0 ? 'Free' : `₹${homeCharge}`}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-700">
            Active Slots: <strong className="text-[#123B6D]">{timeSlots.length} Options</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 rounded-xl text-xs font-black bg-[#123B6D] hover:bg-[#0e2c52] text-white flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
        >
          <Save className="w-4 h-4 text-amber-400" />
          <span>Save All Settings</span>
        </button>
      </div>

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
