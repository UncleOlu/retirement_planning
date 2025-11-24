
import React from 'react';
import { Sparkles, Sliders, TrendingUp, ShieldCheck, PieChart, ArrowRight, Home, Flame, Briefcase, GraduationCap, Calculator } from 'lucide-react';
import { CountryCode } from '../lib/types';

interface LandingPageProps {
  onChooseMode: (mode: 'wizard' | 'full') => void;
  onOpenTools: () => void;
  country: CountryCode;
  onCountryChange: (code: CountryCode) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onChooseMode, onOpenTools, country, onCountryChange }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in relative">
      
      {/* Top Right Region Selector */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-3 z-10">
        <div className="flex bg-white p-1 rounded-full border border-slate-200 shadow-sm">
          <button 
            onClick={() => onCountryChange('US')}
            className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all flex items-center gap-1.5 ${country === 'US' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span>🇺🇸</span> US
          </button>
          <button 
            onClick={() => onCountryChange('UK')}
            className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all flex items-center gap-1.5 ${country === 'UK' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span>🇬🇧</span> UK
          </button>
          <button 
            onClick={() => onCountryChange('CA')}
            className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all flex items-center gap-1.5 ${country === 'CA' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span>🇨🇦</span> CA
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl w-full text-center space-y-4 md:space-y-6 mb-8 md:mb-12 mt-12 md:mt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles size={14} /> Intelligent Financial Forecasting
        </div>
        <h1 className="text-3xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
          Plan with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">Confidence</span>
        </h1>
        <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
          Stop guessing. Visualize your financial future with professional-grade modeling.
        </p>
      </div>

      {/* Retirement Planning Container */}
      <div className="max-w-4xl w-full mb-10 md:mb-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 md:p-8">
           
           <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
               <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                   <TrendingUp size={24} />
               </div>
               <div>
                   <h2 className="text-xl font-bold text-slate-900">Retirement Planning</h2>
                   <p className="text-xs md:text-sm text-slate-500">Forecast your long-term wealth using our core engine.</p>
               </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              
              {/* Option 1: Wizard */}
              <button 
                onClick={() => onChooseMode('wizard')}
                className="group relative bg-slate-50 hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-500 rounded-2xl p-5 md:p-8 text-left transition-all duration-300"
              >
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600">
                  <ArrowRight size={24} />
                </div>
                <div className="flex items-center gap-4 md:block md:gap-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-0 md:mb-4 group-hover:scale-110 transition-transform shrink-0 shadow-sm">
                      <Sparkles size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                       <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1 md:mb-2">Quick Start Wizard</h3>
                       <p className="text-sm text-slate-500 mb-0 md:mb-4 leading-relaxed block md:hidden">
                          Answer 4 simple questions.
                       </p>
                    </div>
                </div>
                
                <p className="text-slate-500 mb-4 leading-relaxed hidden md:block text-sm">
                  Answer 4 simple questions to generate a baseline plan instantly. Best for getting a quick snapshot.
                </p>
                <ul className="space-y-2 hidden md:block">
                  <li className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div> Takes less than 2 minutes
                  </li>
                  <li className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div> Uses smart averages
                  </li>
                </ul>
              </button>

              {/* Option 2: Full Detail */}
              <button 
                onClick={() => onChooseMode('full')}
                className="group relative bg-slate-50 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-500 rounded-2xl p-5 md:p-8 text-left transition-all duration-300"
              >
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600">
                  <ArrowRight size={24} />
                </div>
                 <div className="flex items-center gap-4 md:block md:gap-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-0 md:mb-4 group-hover:scale-110 transition-transform shrink-0 shadow-sm">
                      <Sliders size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1 md:mb-2">Advanced Planner</h3>
                       <p className="text-sm text-slate-500 mb-0 md:mb-4 leading-relaxed block md:hidden">
                          Full control. Access dashboard.
                       </p>
                    </div>
                 </div>

                <p className="text-slate-500 mb-4 leading-relaxed hidden md:block text-sm">
                  Skip the guide and access the full dashboard immediately. Best if you know your exact numbers.
                </p>
                 <ul className="space-y-2 hidden md:block">
                  <li className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Control 20+ variables
                  </li>
                  <li className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Direct dashboard access
                  </li>
                </ul>
              </button>
           </div>
        </div>
      </div>

      {/* Value Props - Visible on all devices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl w-full mb-12">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg mb-3">
            <TrendingUp size={24} />
          </div>
          <h3 className="font-bold text-slate-800 mb-2">Real Purchasing Power</h3>
          <p className="text-sm text-slate-500">We adjust every dollar for inflation so you can see exactly what your future money will actually buy.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg mb-3">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-bold text-slate-800 mb-2">Tax-Aware Modeling</h3>
          <p className="text-sm text-slate-500">See the impact of taxes on your Traditional vs. Roth (TFSA/ISA) accounts and estimate your net spendable income.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg mb-3">
            <PieChart size={24} />
          </div>
          <h3 className="font-bold text-slate-800 mb-2">Strategic Asset Allocation</h3>
          <p className="text-sm text-slate-500">Compare conservative vs. aggressive growth strategies and test historical market benchmarks.</p>
        </div>
      </div>

      {/* Tools Showcase */}
      <div className="max-w-4xl w-full pt-8 md:pt-10 border-t border-slate-200/60">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="text-center md:text-left flex-1">
                <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1">Financial Toolkit included</h3>
                <p className="text-xs md:text-sm text-slate-500">Need a specific answer? Access standalone calculators for Mortgage, Taxes, FIRE, and Education.</p>
            </div>
            <button 
                onClick={onOpenTools}
                className="shrink-0 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold rounded-xl transition flex items-center gap-2 text-sm w-full md:w-auto justify-center"
            >
                <Calculator size={16} /> Open Calculators
            </button>
        </div>
        
        <div className="grid grid-cols-4 gap-2 md:gap-4 mt-6">
             <div className="flex flex-col items-center gap-2 text-slate-400 p-2 md:p-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer" onClick={onOpenTools}>
                <Home size={20} className="md:w-6 md:h-6" />
                <span className="text-[10px] md:text-xs font-bold text-center">Mortgage</span>
             </div>
             <div className="flex flex-col items-center gap-2 text-slate-400 p-2 md:p-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer" onClick={onOpenTools}>
                <Briefcase size={20} className="md:w-6 md:h-6" />
                <span className="text-[10px] md:text-xs font-bold text-center">Taxes</span>
             </div>
             <div className="flex flex-col items-center gap-2 text-slate-400 p-2 md:p-3 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer" onClick={onOpenTools}>
                <Flame size={20} className="md:w-6 md:h-6" />
                <span className="text-[10px] md:text-xs font-bold text-center">FIRE</span>
             </div>
             <div className="flex flex-col items-center gap-2 text-slate-400 p-2 md:p-3 rounded-lg hover:bg-cyan-50 hover:text-cyan-600 transition-colors cursor-pointer" onClick={onOpenTools}>
                <GraduationCap size={20} className="md:w-6 md:h-6" />
                <span className="text-[10px] md:text-xs font-bold text-center">Education</span>
             </div>
        </div>
      </div>

      <div className="mt-8 md:mt-12 text-center pb-8">
        <p className="text-[10px] md:text-xs text-slate-400">
          Private & Secure. No data is sent to external servers. All processing happens in your browser.
        </p>
      </div>
    </div>
  );
};
