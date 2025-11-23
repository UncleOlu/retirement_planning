
import React, { useState, useEffect } from 'react';
import { UserInput, InvestmentStrategyType, CountryCode } from '../lib/types';
import { CurrencyInput } from './ui/CurrencyInput';
import { ArrowLeft, ArrowRight, CheckCircle, TrendingUp, DollarSign, Calendar, Target, Globe } from 'lucide-react';
import { CURRENCIES } from '../lib/constants';

interface WizardProps {
  currentInputs: UserInput;
  country: CountryCode;
  onCountryChange: (c: CountryCode) => void;
  onComplete: (inputs: UserInput) => void;
  onCancel: () => void;
}

export const Wizard: React.FC<WizardProps> = ({ currentInputs, country, onCountryChange, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState<UserInput>(currentInputs);

  // Sync internal state if currentInputs updates (e.g. from parent country change)
  useEffect(() => {
    setInputs(currentInputs);
  }, [currentInputs]);

  const totalSteps = 4;
  const currencyConfig = CURRENCIES[inputs.currency];

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else onComplete(inputs);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onCancel();
  };

  const update = (field: keyof UserInput, val: any) => {
    setInputs(prev => ({ ...prev, [field]: val }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[500px] animate-fade-in">
        
        {/* Header / Progress */}
        <div className="bg-slate-900 p-6 text-white relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-bold text-xl">Retirement Setup</h2>
              <div className="text-sm font-medium text-slate-400">Step {step} of {totalSteps}</div>
            </div>
            
            {/* Mini Region Selector */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
               <button 
                 onClick={() => onCountryChange('US')}
                 className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${country === 'US' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 🇺🇸 US
               </button>
               <button 
                 onClick={() => onCountryChange('UK')}
                 className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${country === 'UK' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 🇬🇧 UK
               </button>
               <button 
                 onClick={() => onCountryChange('CA')}
                 className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${country === 'CA' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
               >
                 🇨🇦 CA
               </button>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Calendar size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Let's start with time.</h3>
              <p className="text-slate-500">Your timeline is the most powerful lever in your financial plan.</p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Current Age</label>
                  <input 
                    type="number" 
                    value={inputs.currentAge}
                    onChange={(e) => update('currentAge', Number(e.target.value))}
                    className="w-full p-4 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Retirement Age</label>
                  <input 
                    type="number" 
                    value={inputs.retirementAge}
                    onChange={(e) => update('retirementAge', Number(e.target.value))}
                    className="w-full p-4 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Assets */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <DollarSign size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">What have you saved so far?</h3>
              <p className="text-slate-500">Don't worry about account types yet. Just give us the total.</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Total Portfolio Value</label>
                  <CurrencyInput 
                    value={inputs.currentPortfolio}
                    onChange={(val) => update('currentPortfolio', val)}
                    symbol={currencyConfig.symbol}
                    className="w-full p-4 pl-10 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Monthly Savings</label>
                  <CurrencyInput 
                    value={inputs.monthlyContribution}
                    onChange={(val) => update('monthlyContribution', val)}
                    symbol={currencyConfig.symbol}
                    className="w-full p-4 pl-10 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Target size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Define your target.</h3>
              <p className="text-slate-500">How much monthly spendable income do you want in retirement (in today's dollars)?</p>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Desired Monthly Income</label>
                <CurrencyInput 
                  value={inputs.targetType === 'income' ? inputs.targetValue / 12 : 5000}
                  onChange={(val) => {
                    update('targetType', 'income');
                    update('targetValue', val * 12);
                  }}
                  symbol={currencyConfig.symbol}
                  className="w-full p-4 pl-10 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl text-sm text-indigo-800 flex gap-3 items-start">
                 <CheckCircle size={18} className="shrink-0 mt-0.5" />
                 We will adjust this automatically for inflation, so you can think in terms of what things cost today.
              </div>
            </div>
          )}

           {/* Step 4: Strategy */}
           {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">How do you invest?</h3>
              <p className="text-slate-500">This determines your projected growth rate.</p>
              
              <div className="grid grid-cols-1 gap-3">
                 {[
                   { id: InvestmentStrategyType.CONSERVATIVE, label: 'Conservative', desc: 'Mostly Bonds/Cash (4% Growth)', color: 'border-emerald-200 hover:bg-emerald-50' },
                   { id: InvestmentStrategyType.BALANCED, label: 'Balanced', desc: 'Mixed Portfolio (6% Growth)', color: 'border-indigo-200 hover:bg-indigo-50' },
                   { id: InvestmentStrategyType.AGGRESSIVE, label: 'Aggressive', desc: 'Mostly Stocks (9% Growth)', color: 'border-amber-200 hover:bg-amber-50' },
                 ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => update('strategy', opt.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${inputs.strategy === opt.id ? 'border-slate-800 bg-slate-50' : `border-slate-100 ${opt.color}`}`}
                    >
                       <div className="font-bold text-slate-800">{opt.label}</div>
                       <div className="text-sm text-slate-500">{opt.desc}</div>
                    </button>
                 ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
           <button 
             onClick={handleBack}
             className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-800 hover:bg-white transition flex items-center gap-2"
           >
             <ArrowLeft size={18} /> {step === 1 ? 'Cancel' : 'Back'}
           </button>
           
           <button 
             onClick={handleNext}
             className="px-8 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-lg flex items-center gap-2"
           >
             {step === totalSteps ? 'Generate Plan' : 'Next'} <ArrowRight size={18} />
           </button>
        </div>

      </div>
    </div>
  );
};