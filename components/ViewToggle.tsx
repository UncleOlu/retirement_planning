import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface ViewToggleProps {
  isReal: boolean;
  onChange: (isReal: boolean) => void;
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ isReal, onChange, className = '' }) => {
  return (
    <div className={`flex items-center bg-slate-100 p-1 rounded-lg ${className}`}>
      <button
        onClick={() => onChange(false)}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          !isReal 
            ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' 
            : 'text-slate-500 hover:text-slate-700'
        }`}
        title="Nominal Value: The actual dollar amount in the future, not adjusted for inflation."
      >
        <EyeOff size={14} />
        <span>Future $</span>
      </button>
      <button
        onClick={() => onChange(true)}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          isReal 
            ? 'bg-white shadow-sm text-emerald-600 ring-1 ring-black/5' 
            : 'text-slate-500 hover:text-slate-700'
        }`}
        title="Real Value: The purchasing power in today's dollars, adjusted for inflation."
      >
        <Eye size={14} />
        <span>Today's $</span>
      </button>
    </div>
  );
};