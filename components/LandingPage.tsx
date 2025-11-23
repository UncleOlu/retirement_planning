
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
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <div className="flex bg-white p-1 rounded-full border border-slate-200 shadow-sm">
          <button 
            onClick={() => onCountryChange('US')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${country === 'US' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span>🇺🇸</span> US
          </button>
          <button 
            onClick={() => onCountryChange('UK')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${country === 'UK' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span>🇬🇧</span> UK
          </button>
          <button 
            onClick={() => onCountryChange('CA')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${country === 'CA' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span>🇨🇦</span> CA
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl w-full text-center space-y-6 mb-12 mt-10 md:mt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles size={14} /> Intelligent Financial Forecasting
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
          Retire with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">Confidence</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Stop guessing. Visualize your financial future with professional-grade modeling that accounts for inflation, taxes, and market volatility.
        </p>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-12">
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

      {/* Mode Selection */}
      <div className="max-w-4xl w-full">
        <h2 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Choose how you want to start</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Option 1: Wizard */}
          <button 
            onClick={() => onChooseMode('wizard')}
            className="group relative bg-white hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-500 rounded-2xl p-8 text-left transition-all duration-300 shadow-sm hover:shadow-xl"
          >
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600">
              <ArrowRight size={24} />
            </div>
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Quick Start Wizard</h3>
            <p className="text-slate-500 mb-4 leading-relaxed">
              Answer 4 simple questions to generate a baseline plan instantly. Best for getting a quick snapshot.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div> Takes less than 2 minutes
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div> Uses smart averages for detailed inputs
              </li>
            </ul>
          </button>

          {/* Option 2: Full Detail */}
          <button 
            onClick={() => onChooseMode('full')}
            className="group relative bg-white hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-500 rounded-2xl p-8 text-left transition-all duration-300 shadow-sm hover:shadow-xl"
          >
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600">
              <ArrowRight size={24} />
            </div>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sliders size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Advanced Planner</h3>
            <p className="text-slate-500 mb-4 leading-relaxed">
              Skip the guide and access the full dashboard immediately. Best if you know your exact numbers.
            </p>
             <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Full control over all 20+ variables
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Direct access to account breakdowns
              </li>
            </ul>
          </button>
        </div>
      </div>

      {/* Tools Showcase */}
      <div className="max-w-4xl w-full mt-12 pt-10 border-t border-slate-200/60">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="text-center md:text-left flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-1">Financial Toolkit included</h3>
                <p className="text-sm text-slate-500">Need a specific answer? Access standalone calculators for Mortgage, Taxes, FIRE, and Education without building a full plan.</p>
            </div>
            <button 
                onClick={onOpenTools}
                className="shrink-0 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold rounded-xl transition flex items-center gap-2 text-sm"
            >
                <Calculator size={16} /> Open Calculators
            </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
             <div className="flex flex-col items-center gap-2 text-slate-400 p-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer" onClick={onOpenTools}>
                <Home size={24} />
                <span className="text-xs font-bold">Mortgage</span>
             </div>
             <div className="flex flex-col items-center gap-2 text-slate-400 p-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer" onClick={onOpenTools}>
                <Briefcase size={24} />
                <span className="text-xs font-bold">Tax Estimator</span>
             </div>
             <div className="flex flex-col items-center gap-2 text-slate-400 p-3 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer" onClick={onOpenTools}>
                <Flame size={24} />
                <span className="text-xs font-bold">FIRE Calc</span>
             </div>
             <div className="flex flex-col items-center gap-2 text-slate-400 p-3 rounded-lg hover:bg-cyan-50 hover:text-cyan-600 transition-colors cursor-pointer" onClick={onOpenTools}>
                <GraduationCap size={24} />
                <span className="text-xs font-bold">Education</span>
             </div>
        </div>
      </div>

      <div className="mt-12 text-center pb-8">
        <p className="text-xs text-slate-400">
          Private & Secure. No data is sent to external servers. All processing happens in your browser.
        </p>
      </div>
    </div>
  );
};
