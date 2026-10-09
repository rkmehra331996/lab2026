import React from 'react';
import { Phone, Globe } from 'lucide-react';
import { useCms } from '../context/CmsContext';

interface DashboardFooterProps {
  className?: string;
  customLabName?: string;
  currentRoleTitle?: string;
  onNavigateView?: (view: any) => void;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({
  className = '',
  customLabName,
}) => {
  const { vendorLabSettings, companySettings } = useCms();
  const currentYear = new Date().getFullYear();
  const labName = customLabName || vendorLabSettings?.labName || 'Apex Diagnostic & Clinical Pathology Laboratory';
  const superAdminDomain = companySettings?.superAdminDomain || 'indianlalaji.com';

  return (
    <footer
      id="dashboard-footer"
      className={`border-t border-slate-200 bg-white py-3.5 px-4 sm:px-6 text-xs text-slate-500 mt-auto transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {/* Left: Lab Copyright */}
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span className="font-semibold text-slate-700">
            © {currentYear} {labName}. All Rights Reserved.
          </span>
        </div>

        {/* Right: Powered by indianlalaji.com | Phone */}
        <div className="flex items-center gap-2 font-medium justify-center sm:justify-end flex-wrap">
          <span className="text-slate-600">Powered by</span>
          <a
            href={`https://${superAdminDomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#123B6D] hover:underline font-bold inline-flex items-center gap-1"
          >
            <Globe className="w-3 h-3 text-[#123B6D]" />
            <span>{superAdminDomain}</span>
          </a>
          <span className="text-slate-300">|</span>
          <a
            href={`tel:${companySettings?.supportPhone || '7087033009'}`}
            className="text-[#123B6D] hover:underline font-black inline-flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 px-2.5 py-1 rounded-md transition border border-slate-200"
          >
            <Phone className="w-3 h-3 text-[#123B6D]" />
            <span>{companySettings?.supportPhone || '7087033009'}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
