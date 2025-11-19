
import React, { useState } from 'react';
import { Calculator, ArrowLeft, Home, Percent, TrendingUp } from 'lucide-react';
import { MortgageCalculator } from './MortgageCalculator';
import { CurrencyCode } from '../../lib/types';

interface ExtrasDashboardProps {
  currency: CurrencyCode;
}

type ToolId = 'mortgage' | null;

export const ExtrasDashboard: React.FC<ExtrasDashboardProps> = ({ currency }) => {
  const [activeTool, setActiveTool] = useState<ToolId>(null);

  if (activeTool === 'mortgage') {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setActiveTool(null)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft size={16} /> Back to Tools
        </button>
        <MortgageCalculator currencyCode={currency} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Financial Tools & Calculators</h2>
        <p className="text-slate-500">
          Extra utilities to help you make smarter decisions about debt, housing, and taxes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Mortgage Tool Card */}
        <button 
          onClick={() => setActiveTool('mortgage')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition text-left group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <Home size={100} />
          </div>
          
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Home size={24} />
          </div>
          
          <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
            Mortgage & Refinance
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Analyze amortization schedules, visualize extra payment impacts, and calculate break-even points for refinancing.
          </p>
        </button>

        {/* Placeholder for Future Tools */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-70">
           <div className="w-12 h-12 bg-slate-100 text-slate-300 rounded-xl flex items-center justify-center mb-4">
            <Percent size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-400 mb-2">
            Tax Estimator
          </h3>
          <p className="text-xs text-slate-400">Coming Soon</p>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-70">
           <div className="w-12 h-12 bg-slate-100 text-slate-300 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-400 mb-2">
            FIRE Calculator
          </h3>
          <p className="text-xs text-slate-400">Coming Soon</p>
        </div>

      </div>
    </div>
  );
};
