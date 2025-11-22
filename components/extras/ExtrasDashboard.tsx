
import React, { useState } from 'react';
import { ArrowLeft, Home, Percent, TrendingUp, Flame, Briefcase, GraduationCap } from 'lucide-react';
import { MortgageCalculator } from './MortgageCalculator';
import { FireCalculator } from './FireCalculator';
import { TaxEstimator } from './TaxEstimator';
import { EducationCalculator } from './EducationCalculator';
import { CurrencyCode, CountryCode } from '../../lib/types';
import { COUNTRY_CONFIG } from '../../lib/constants';

interface ExtrasDashboardProps {
  currency: CurrencyCode;
  country?: CountryCode;
}

type ToolId = 'mortgage' | 'tax' | 'fire' | 'education' | null;

export const ExtrasDashboard: React.FC<ExtrasDashboardProps> = ({ currency, country = 'US' }) => {
  const activeToolState = useState<ToolId>(null);
  const activeTool = activeToolState[0];
  const setActiveTool = activeToolState[1];

  const config = COUNTRY_CONFIG[country];

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'mortgage':
        return <MortgageCalculator currencyCode={currency} />;
      case 'tax':
        return <TaxEstimator currency={currency} country={country} />;
      case 'fire':
        return <FireCalculator currency={currency} />;
      case 'education':
        return <EducationCalculator currency={currency} country={country} />;
      default:
        return null;
    }
  };

  if (activeTool) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setActiveTool(null)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft size={16} /> Back to Tools
        </button>
        {renderActiveTool()}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Financial Tools & Calculators</h2>
        <p className="text-slate-500">
          Extra utilities to help you make smarter decisions about debt, housing, taxes, education, and early retirement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        
        {/* Mortgage Tool Card */}
        <button 
          onClick={() => setActiveTool('mortgage')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition text-left group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <Home size={120} />
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

        {/* Tax Tool Card */}
        <button 
          onClick={() => setActiveTool('tax')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition text-left group relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <Briefcase size={120} />
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Briefcase size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">
            {config.labels.taxEstimatorTitle}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {country === 'UK' 
              ? "Estimate your Take-Home Pay, Income Tax, and National Insurance contributions."
              : "Estimate 2025 federal tax liability with itemized deductions, SALT caps, and projected brackets."
            }
          </p>
        </button>
        
        {/* FIRE Tool Card */}
        <button 
          onClick={() => setActiveTool('fire')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition text-left group relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <Flame size={120} />
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <Flame size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors">
            FIRE Calculator
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Plan your escape. Calculate your savings rate, Financial Independence number, and years until early retirement.
          </p>
        </button>

        {/* Education Tool Card */}
        <button 
          onClick={() => setActiveTool('education')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition text-left group relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <GraduationCap size={120} />
          </div>
          <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
            <GraduationCap size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-cyan-600 transition-colors">
            {config.labels.educationAccount} Planner
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
             {country === 'UK' 
               ? "Forecast university costs and Junior ISA growth."
               : "Forecast college costs and 529 savings growth."}
          </p>
        </button>

      </div>
    </div>
  );
};
