import React, { useState } from 'react';
import { LayoutDashboard, Users, FileText, IndianRupee, ArrowRight, Laptop, CheckCircle2, QrCode } from 'lucide-react';

interface DemoSectionProps {
  onOpenDemo: () => void;
  onLaunchApp: () => void;
}

export const DemoSection: React.FC<DemoSectionProps> = ({ onOpenDemo, onLaunchApp }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'reports' | 'billing'>('dashboard');

  return (
    <section id="demo-section" className="py-16 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123B6D]/10 text-[#123B6D] text-xs font-semibold mb-3">
            <Laptop className="w-3.5 h-3.5" />
            <span>Interactive Software Preview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            See LABNAME.COM in Action
          </h2>
          <p className="text-sm text-[#64748B] mt-2">
            Switch between modules to preview the high-speed, information-dense interface used daily by lab directors and staff across India.
          </p>

          {/* 4 Preview Tabs as specified */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-[#123B6D] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'patients'
                  ? 'bg-[#123B6D] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Patient Management</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-[#123B6D] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'billing'
                  ? 'bg-[#123B6D] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <IndianRupee className="w-4 h-4" />
              <span>Billing</span>
            </button>
          </div>
        </div>

        {/* Dynamic Preview Container */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#123B6D] px-4 py-3 text-white flex items-center justify-between text-xs border-b border-[#0e2c52]">
            <div className="flex items-center gap-2">
              <span className="font-bold">app.indianlalaji.com</span>
              <span className="text-slate-300">• Active Session (Ludhiana Main Lab)</span>
            </div>
            <button
              onClick={onLaunchApp}
              className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition"
            >
              Launch Full Interactive System
            </button>
          </div>

          <div className="p-6 bg-slate-50/50 min-h-[360px]">
            {/* Tab 1: Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Patients Today</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1">126</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Tests Scheduled</span>
                    <div className="text-2xl font-bold text-[#0F766E] mt-1">284</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Pending Verify</span>
                    <div className="text-2xl font-bold text-amber-600 mt-1">18</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Cash & UPI</span>
                    <div className="text-2xl font-bold text-[#123B6D] mt-1">₹42,850</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Live Analyzer & Phlebotomy Queue</h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800">UHID LAB-2026-9041 • Ramesh Verma (48/M)</span>
                        <div className="text-[11px] text-slate-500">Sysmex Analyzer XN-350 • CBC & HbA1c Complete</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Signed by Pathologist
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800">UHID LAB-2026-9042 • Gurpreet Kaur (34/F)</span>
                        <div className="text-[11px] text-slate-500">Beckman Coulter Access 2 • Thyroid & Vitamins</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Pending Verification
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Patient Management */}
            {activeTab === 'patients' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-800">
                    <span>Patient Intake & UHID Registration</span>
                    <span className="text-[#0F766E]">10-Digit Mobile First</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Mobile No:</span>
                      <div className="font-bold text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 mt-0.5">
                        +91 98765 43210
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Patient Name:</span>
                      <div className="font-bold text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 mt-0.5">
                        Ramesh Kumar Verma (48 / Male)
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Referring Doctor:</span>
                      <div className="font-bold text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 mt-0.5">
                        Dr. S. K. Gupta (MD Med)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <span className="text-xs font-bold text-slate-700 block mb-2">Selected Tests for Registration:</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 bg-blue-50 text-[#123B6D] border border-blue-200 rounded-md font-semibold">
                      CBC with ESR (₹350)
                    </span>
                    <span className="px-2.5 py-1 bg-blue-50 text-[#123B6D] border border-blue-200 rounded-md font-semibold">
                      HbA1c Glycosylated Hb (₹500)
                    </span>
                    <span className="px-2.5 py-1 bg-blue-50 text-[#123B6D] border border-blue-200 rounded-md font-semibold">
                      Lipid Profile Comprehensive (₹600)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Reports */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#123B6D] block">Report Verification Center</span>
                    <p className="text-xs text-slate-500">Dr. Rohit Sharma, MD Pathologist review desk</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                    NABL Layout Compliant
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-800">Report #RPT-2026-8812</span>
                    <span className="text-[#0F766E] font-medium">QR Timestamped</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1 text-slate-700">
                    <div>Hb: <strong className="text-slate-900">14.6 g/dL</strong> (Normal)</div>
                    <div>TLC: <strong className="text-slate-900">7,400 /cu.mm</strong> (Normal)</div>
                    <div>HbA1c: <strong className="text-rose-600">6.8%</strong> (High)</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Digital Hash: SHA256: 9b2d8e41a9...</span>
                    <span className="text-emerald-700 font-semibold">WhatsApp Auto-Dispatch Ready</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Billing */}
            {activeTab === 'billing' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-800">Invoice Generation #INV-2026-0814</span>
                    <span className="text-xs font-black text-[#123B6D]">₹1,450 INR</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Gross Total:</span>
                        <span className="font-semibold text-slate-800">₹1,450</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Healthcare GST Exemption:</span>
                        <span className="font-semibold text-slate-800">₹0 (Nil)</span>
                      </div>
                      <div className="flex justify-between text-[#123B6D] font-bold border-t border-slate-100 pt-1">
                        <span>Net Payable:</span>
                        <span>₹1,450</span>
                      </div>
                    </div>

                    {/* UPI QR Simulation */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-3">
                      <QrCode className="w-12 h-12 text-[#123B6D]" />
                      <div>
                        <div className="text-[11px] font-bold text-slate-800">Dynamic UPI QR</div>
                        <div className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Instant Reconciliation</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA Bar as specified */}
          <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#64748B]">
              Experience the live software on your desktop or mobile laboratory workstation.
            </div>
            <div className="flex items-center gap-2">
              <button
                id="demo-btn-book"
                onClick={onOpenDemo}
                className="bg-[#123B6D] hover:bg-[#0e2c52] text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <span>Book a Demo</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
