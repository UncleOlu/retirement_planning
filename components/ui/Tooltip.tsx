import React from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  return (
    <div className="group relative inline-flex items-center ml-2 cursor-help">
      <Info size={14} className="text-slate-400 hover:text-slate-600 transition-colors" />
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 opacity-0 transition-opacity group-hover:opacity-100 z-50">
        <div className="bg-slate-800 text-slate-50 text-xs rounded p-2 shadow-lg text-center leading-relaxed">
          {text}
          {/* Small triangle arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
      </div>
    </div>
  );
};