
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, MapPin } from 'lucide-react';

export const ComplianceBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('compliance-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('compliance-consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] z-50 p-4 md:p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" /> 
            US State Law & Privacy Compliance
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            This application operates in strict compliance with United States consumer privacy laws, including the <strong>California Consumer Privacy Act (CCPA)</strong>, <strong>CPRA</strong>, and applicable state regulations. 
          </p>
          <div className="flex flex-wrap gap-3 mt-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
               <Lock size={10} /> Local Storage Only
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
               <MapPin size={10} /> Location Private
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
           <button className="text-xs font-bold text-slate-400 hover:text-slate-600 transition whitespace-nowrap">
             Do Not Sell My Info
           </button>
           <button 
             onClick={handleAccept}
             className="w-full sm:w-auto bg-emerald-600 text-white text-xs font-bold px-6 py-3 rounded-lg hover:bg-emerald-700 transition shadow-sm shadow-emerald-200"
           >
             Acknowledge & Continue
           </button>
        </div>
      </div>
    </div>
  );
};
