import React, { useState } from 'react';
import { X, IndianRupee, Check, ShieldCheck, Lock, AlertCircle, Printer, MessageSquare, QrCode, Smartphone, Copy } from 'lucide-react';
import { ReceptionPatientEntry } from '../types';
import { useCms } from '../context/CmsContext';

interface CollectRemainingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: ReceptionPatientEntry | null;
  onCollectPayment?: (
    entryId: string,
    collectedAmount: number,
    mode: 'Cash' | 'UPI' | 'Card',
    note?: string
  ) => void;
  onPaymentCollected?: (updatedEntry: ReceptionPatientEntry) => void;
}

export const CollectRemainingPaymentModal: React.FC<CollectRemainingPaymentModalProps> = ({
  isOpen,
  onClose,
  entry,
  onCollectPayment,
  onPaymentCollected,
}) => {
  const { vendorLabSettings } = useCms();
  if (!isOpen || !entry) return null;

  const netPayable = Math.max(0, entry.totalAmount - (entry.discountINR || 0));
  const currentDue = entry.dueAmount ?? 0;
  const isAlreadyFullPaid = currentDue <= 0 || entry.paymentStatus === 'Full Payment' || entry.paymentStatus === 'Paid';

  const [collectAmount, setCollectAmount] = useState<number>(currentDue);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [receiptNote, setReceiptNote] = useState('');

  const remainingAfterCollection = Math.max(0, currentDue - collectAmount);
  const willBeFullPayment = remainingAfterCollection === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyFullPaid) {
      alert('Full payment is already completed. The payment cannot be edited again.');
      onClose();
      return;
    }
    if (collectAmount <= 0) {
      alert('Please enter a valid collection amount greater than 0');
      return;
    }
    if (collectAmount > currentDue) {
      alert(`Collection amount cannot exceed due balance of ₹${currentDue}`);
      return;
    }

    const newPaidAmount = (entry.paidAmount || 0) + collectAmount;
    const newDueAmount = Math.max(0, currentDue - collectAmount);
    const newStatus: ReceptionPatientEntry['paymentStatus'] = newDueAmount === 0 ? 'Full Payment' : 'Partial';

    const updatedEntry: ReceptionPatientEntry = {
      ...entry,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      paymentStatus: newStatus,
      balancePaidAmount: collectAmount,
      balancePaymentMode: paymentMode,
      balancePaidAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    if (onCollectPayment) {
      onCollectPayment(entry.id, collectAmount, paymentMode, receiptNote.trim() || undefined);
    }
    if (onPaymentCollected) {
      onPaymentCollected(updatedEntry);
    }
    onClose();
  };

  const isReportReady =
    entry.status === 'Report Ready' ||
    entry.technicianStatus === 'Report Generated' ||
    Boolean(entry.reportId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#123B6D] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="bg-white/20 text-white font-black px-2.5 py-1 rounded-lg text-xs font-mono">
              {entry.tokenNumber || entry.tokenNo}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                <span>Update Payment Status</span>
              </h2>
              <p className="text-xs text-blue-100">
                {entry.patientName} • UHID: {entry.uhid}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Banner if Report is Ready */}
        {isReportReady && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-amber-950 text-xs">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="flex-1">
              <span className="font-black text-amber-950">Report Ready</span>
              <span className="text-amber-900 ml-1">
                — Only payment status can be updated. Once full payment is completed, it cannot be edited again.
              </span>
            </div>
          </div>
        )}

        {isAlreadyFullPaid ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Full Payment Completed</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                All dues (₹0 due) have already been settled for this patient. Once full payment is completed, the payment cannot be edited again.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 font-bold">
              Report is ready for download on the patient card.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Financial Breakdown Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Bill (Tests):</span>
              <span className="font-bold text-slate-900">₹{entry.totalAmount}</span>
            </div>
            {entry.discountINR > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount / Concession:</span>
                <span className="font-bold">-₹{entry.discountINR}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
              <span>Net Bill Amount:</span>
              <span className="font-extrabold text-[#123B6D]">₹{netPayable}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Previously Paid ({entry.paymentMode}):</span>
              <span className="font-bold text-emerald-700">₹{entry.paidAmount}</span>
            </div>
            <div className="flex justify-between items-center bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-rose-900 mt-1">
              <span className="font-extrabold">Current Balance Due:</span>
              <span className="text-base font-black text-rose-700">₹{currentDue}</span>
            </div>
          </div>

          {/* Collection Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Amount to Collect Now (₹) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCollectAmount(currentDue)}
                className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
              >
                Pay Full Due (₹{currentDue})
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="1"
                max={currentDue}
                required
                value={collectAmount}
                onChange={(e) => setCollectAmount(Math.min(currentDue, Number(e.target.value) || 0))}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Payment Method for Remaining Balance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'Cash', 'Card'] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMode === mode
                      ? 'bg-[#123B6D] text-white border-[#123B6D] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {mode === 'UPI' && <span>📱 UPI / QR</span>}
                  {mode === 'Cash' && <span>💵 Cash</span>}
                  {mode === 'Card' && <span>💳 Card</span>}
                </button>
              ))}
            </div>

            {/* Dynamic UPI QR Code Scanner when UPI is selected */}
            {paymentMode === 'UPI' && (() => {
              const labUpi = vendorLabSettings?.upiId1 || (vendorLabSettings as any)?.upiId || 'apexlab@icici';
              const labMerchant = vendorLabSettings?.merchantName || vendorLabSettings?.labName || 'Apex Diagnostic Lab';
              const dynamicUpiUri = `upi://pay?pa=${encodeURIComponent(labUpi)}&pn=${encodeURIComponent(labMerchant)}&am=${collectAmount}&cu=INR&tn=${encodeURIComponent(`Token ${entry.tokenNumber || entry.tokenNo} Balance - ${entry.patientName}`)}`;
              const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dynamicUpiUri)}`;

              return (
                <div className="mt-3 bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3.5 text-xs">
                  <div className="p-1.5 bg-white rounded-xl shadow-xs border border-amber-200 shrink-0">
                    <img
                      src={dynamicQrUrl}
                      alt="Dynamic Counter UPI QR"
                      className="w-28 h-28 object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                        Exact Due Amount Injected
                      </span>
                      <span className="text-base font-black text-slate-900 font-mono">₹{collectAmount}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">{labMerchant}</div>
                    <div className="text-[11px] font-mono text-slate-600 font-bold">{labUpi}</div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Patient scans with Google Pay, PhonePe, or Paytm. Exact amount of <strong>₹{collectAmount}</strong> will auto-fill on phone.
                    </p>
                    <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                      <a
                        href={dynamicUpiUri}
                        className="px-2.5 py-1 bg-[#123B6D] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Open on UPI App</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Status Preview Card */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Updated Payment Status:</span>
              <span
                className={`font-black text-xs ${
                  willBeFullPayment ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {willBeFullPayment ? '✓ Full Payment (All Dues Cleared)' : '⚠️ Advance (Remaining Balance Due)'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Remaining After Payment:</span>
              <span
                className={`font-black text-xs ${
                  remainingAfterCollection === 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                ₹{remainingAfterCollection}
              </span>
            </div>
          </div>

          {/* Receipt Note / Transaction Ref */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receipt Note / Reference (Optional)
            </label>
            <input
              type="text"
              value={receiptNote}
              onChange={(e) => setReceiptNote(e.target.value)}
              placeholder="e.g. Settle balance at report counter • UPI Ref 928374"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Collect ₹{collectAmount} & Confirm</span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
