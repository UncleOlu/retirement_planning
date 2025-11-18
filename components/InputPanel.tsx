import React, { useState } from 'react';
import { UserInput, InvestmentStrategyType } from '../lib/types';
import { INVESTMENT_STRATEGIES } from '../lib/constants';
import { Tooltip } from './ui/Tooltip';
import { DollarSign, Percent, PiggyBank, ChevronUp, Lightbulb, AlertCircle, PieChart, Activity, ShieldCheck, TrendingUp } from 'lucide-react';

interface InputPanelProps {
  inputs: UserInput;
  onChange: (newInputs: UserInput) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ inputs, onChange }) => {
  const [showPortfolioSplit, setShowPortfolioSplit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: keyof UserInput, value: number, allInputs: UserInput): string | null => {
    switch(field) {
      case 'currentAge':
        if (value < 0 || value > 120) return "Age must be realistic (0-120).";
        if (value >= allInputs.retirementAge) return "Must be younger than retirement age.";
        break;
      case 'retirementAge':
        if (value <= allInputs.currentAge) return "Must be later than current age.";
        if (value > 120) return "Cap is 120 years.";
        break;
      case 'currentPortfolio':
        if (value < 0) return "Balance cannot be negative.";
        break;
      case 'monthlyContribution':
        if (value < 0) return "Contribution cannot be negative.";
        break;
      case 'inflationRate':
      case 'retirementTaxRate':
        if (value < 0 || value > 100) return "Rate must be 0-100%.";
        break;
    }
    return null;
  };

  const handleChange = (field: keyof UserInput, rawValue: string) => {
    const value = parseFloat(rawValue);
    const numValue = isNaN(value) ? 0 : value;
    
    // Construct proposed state for validation
    const proposedInputs = { ...inputs, [field]: numValue };
    
    // Efficiency: Enforce constraints immediately to prevent double-renders from effect cycles
    if (field === 'currentPortfolio') {
      if (numValue < proposedInputs.currentRothBalance) {
        proposedInputs.currentRothBalance = numValue;
      }
    }
    
    if (field === 'currentRothBalance') {
       if (numValue > proposedInputs.currentPortfolio) {
         proposedInputs.currentRothBalance = proposedInputs.currentPortfolio;
       }
    }
    
    if (field === 'monthlyContribution') {
      if (numValue < proposedInputs.monthlyRothContribution) {
        proposedInputs.monthlyRothContribution = numValue;
      }
    }

    if (field === 'monthlyRothContribution') {
       if (numValue > proposedInputs.monthlyContribution) {
         proposedInputs.monthlyRothContribution = proposedInputs.monthlyContribution;
       }
    }

    // Run Validation
    const error = validateField(field, numValue, proposedInputs);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[field] = error;
      else delete newErrors[field];
      
      // Clear cross-field errors
      if (field === 'currentAge' && newErrors['retirementAge']) {
         if (proposedInputs.retirementAge > numValue) delete newErrors['retirementAge'];
      }
      if (field === 'retirementAge' && newErrors['currentAge']) {
         if (numValue > proposedInputs.currentAge) delete newErrors['currentAge'];
      }
      return newErrors;
    });

    onChange(proposedInputs);
  };

  const handleStrategyChange = (strategy: InvestmentStrategyType) => {
    onChange({ ...inputs, strategy });
  };

  // Dynamic Tip Logic
  const getFinancialTip = () => {
    if (inputs.currentPortfolio > 0 && inputs.currentRothBalance === 0 && !showPortfolioSplit) {
      return { title: "Did you know?", text: "If you have a Roth IRA, check 'Split Portfolio' above. Tax-free growth is powerful!" };
    }
    if (inputs.monthlyRothContribution === 0) {
      return { title: "Diversify Taxes", text: "Consider a Roth. Paying taxes now means tax-free withdrawals later, hedging against future tax hikes." };
    }
    if (inputs.inflationRate < 2) {
      return { title: "Inflation Reality", text: "Historic inflation is closer to 3%. Planning too low might leave you short." };
    }
    if (inputs.safeWithdrawalRate > 4.5) {
      return { title: "Withdrawal Risk", text: "A rate above 4.5% significantly increases the risk of outliving your money during downturns." };
    }
    return { title: "Compounding Power", text: "The biggest factor in your success is Time. Starting even 1 year earlier can make a massive difference." };
  };

  const tip = getFinancialTip();

  return (
    <div className="space-y-8 pb-12">
      
      {/* Section 1: Profile & Contributions */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
          Profile & Contributions
        </h3>
        
        {/* Age Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Current Age</label>
            <input 
              type="number" 
              value={inputs.currentAge}
              onChange={(e) => handleChange('currentAge', e.target.value)}
              className={`w-full p-2 rounded border outline-none transition ${errors.currentAge ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'}`}
            />
            {errors.currentAge && <div className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {errors.currentAge}</div>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Retirement Age</label>
            <input 
              type="number" 
              value={inputs.retirementAge}
              onChange={(e) => handleChange('retirementAge', e.target.value)}
              className={`w-full p-2 rounded border outline-none transition ${errors.retirementAge ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'}`}
            />
             {errors.retirementAge && <div className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {errors.retirementAge}</div>}
          </div>
        </div>

        {/* Current Portfolio with Split */}
        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <label className="text-sm font-medium text-slate-700">Current Portfolio</label>
            {!showPortfolioSplit && (
               <button 
                 onClick={() => setShowPortfolioSplit(true)}
                 className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition flex items-center gap-1 font-medium mb-1 border border-indigo-100"
               >
                 <PieChart size={12}/> Split Roth/Trad
               </button>
            )}
          </div>

          <div className={`relative transition-all duration-300 ${showPortfolioSplit ? 'bg-white p-3 rounded-lg border border-slate-200 shadow-sm' : ''}`}>
            
            {/* Main Input */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="number" 
                value={inputs.currentPortfolio}
                onChange={(e) => handleChange('currentPortfolio', e.target.value)}
                className="w-full pl-9 p-2 rounded border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-700"
                placeholder="Total Savings"
              />
            </div>
            {errors.currentPortfolio && <div className="text-[10px] text-red-500 mt-1">{errors.currentPortfolio}</div>}
            
            {/* Split Details (Conditional) */}
            {showPortfolioSplit && (
               <div className="mt-4 pt-3 border-t border-slate-100 animate-fade-in">
                 <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Roth Portion
                    </label>
                    <button 
                      onClick={() => setShowPortfolioSplit(false)} 
                      className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      Hide <ChevronUp size={10} />
                    </button>
                 </div>

                 <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="0" 
                      max={inputs.currentPortfolio} 
                      step={inputs.currentPortfolio > 50000 ? 1000 : 100}
                      value={inputs.currentRothBalance || 0}
                      onChange={(e) => handleChange('currentRothBalance', e.target.value)}
                      className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="w-24 text-right relative">
                       <DollarSign className="absolute left-1 top-1/2 -translate-y-1/2 text-emerald-300" size={12} />
                       <input 
                          type="number"
                          min="0"
                          max={inputs.currentPortfolio}
                          value={inputs.currentRothBalance || 0}
                          onChange={(e) => handleChange('currentRothBalance', e.target.value)}
                          className="w-full pl-4 p-1 text-right text-sm font-bold text-emerald-600 border border-slate-200 rounded hover:border-emerald-300 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-200"
                       />
                    </div>
                 </div>
                 
                 <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                    <span>Traditional: ${Math.max(0, inputs.currentPortfolio - (inputs.currentRothBalance || 0))}</span>
                    <span>Roth: {inputs.currentPortfolio > 0 ? Math.round(((inputs.currentRothBalance || 0) / inputs.currentPortfolio) * 100) : 0}%</span>
                 </div>
               </div>
            )}
          </div>
        </div>

        {/* Monthly Contribution & Roth Split */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Monthly Contribution</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="number" 
              value={inputs.monthlyContribution}
              onChange={(e) => handleChange('monthlyContribution', e.target.value)}
              className="w-full pl-9 p-2 rounded border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          
          {/* Roth Strategy Nested */}
          <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 mt-2">
             <div className="flex justify-between items-end mb-2">
               <label className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                 <PiggyBank size={12} /> Roth Allocation
                 <Tooltip text="Portion of your monthly contribution that goes into a post-tax Roth account (IRA or 401k). Grows tax-free." />
               </label>
               <div className="text-right leading-tight relative w-24">
                  <DollarSign className="absolute left-1 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" size={12} />
                  <input 
                    type="number"
                    min="0"
                    max={inputs.monthlyContribution}
                    value={inputs.monthlyRothContribution}
                    onChange={(e) => handleChange('monthlyRothContribution', e.target.value)}
                    className="w-full pl-4 p-1 text-right text-sm font-bold text-indigo-700 bg-white/50 border border-indigo-100 rounded hover:border-indigo-300 focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-200"
                  />
               </div>
            </div>
            <input 
              type="range" 
              min="0" 
              max={inputs.monthlyContribution}
              step="10"
              value={inputs.monthlyRothContribution}
              onChange={(e) => handleChange('monthlyRothContribution', e.target.value)}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between mt-1 items-center">
              <span className="text-[10px] text-slate-500">Traditional: ${Math.max(0, inputs.monthlyContribution - inputs.monthlyRothContribution)}</span>
              {inputs.monthlyRothContribution > 584 && (
                <span className="text-[10px] text-indigo-600 flex items-center gap-1 font-medium">
                   Roth 401(k) Zone
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Financial Wisdom Tip */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex gap-3 transition-all hover:shadow-sm">
        <Lightbulb className="text-emerald-500 shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-xs font-bold text-emerald-700 uppercase mb-1">{tip.title}</h4>
          <p className="text-xs text-emerald-900 leading-relaxed">{tip.text}</p>
        </div>
      </div>

      {/* Section 2: Goals */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
          Retirement Goal
          <Tooltip text="Define what success looks like. Either a specific annual income or a total nest egg." />
        </h3>

        <div className="flex space-x-2 p-1 bg-slate-100 rounded-lg">
          <button 
            onClick={() => onChange({ ...inputs, targetType: 'income' })}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${inputs.targetType === 'income' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Annual Income
          </button>
          <button 
            onClick={() => onChange({ ...inputs, targetType: 'total' })}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${inputs.targetType === 'total' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Total Corpus
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
            {inputs.targetType === 'income' ? 'Desired Annual Income' : 'Target Portfolio Value'}
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
               {inputs.targetType === 'income' ? "In Today's Dollars (Real)" : "In Future Dollars (Nominal)"}
            </span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="number" 
              value={inputs.targetValue}
              onChange={(e) => handleChange('targetValue', e.target.value)}
              className="w-full pl-9 p-2 rounded border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-900"
            />
          </div>
        </div>

        {/* Social Security Input */}
         <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            Est. Monthly Social Security
            <Tooltip text="Estimated monthly benefit in today's dollars. This reduces the amount you need to withdraw from your portfolio." />
          </label>
          <div className="relative">
            <input 
              type="number" 
              value={inputs.estimatedSocialSecurity}
              onChange={(e) => handleChange('estimatedSocialSecurity', e.target.value)}
              placeholder="e.g. 2000"
              className="w-full p-2 rounded border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
           <label className="text-sm font-medium text-slate-700 flex items-center">
            Safe Withdrawal Rate
            <Tooltip text="The percentage of your portfolio you withdraw each year. 4% is the standard 'safe' rule." />
          </label>
           <div className="relative">
            <input 
              type="number" 
              step="0.1"
              value={inputs.safeWithdrawalRate}
              onChange={(e) => handleChange('safeWithdrawalRate', e.target.value)}
              className="w-full p-2 pr-8 rounded border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>
        </div>
      </section>

      {/* Section 3: Assumptions & Tax Rate */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
          Strategy & Assumptions
        </h3>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            Investment Strategy
            <Tooltip text="Choose a growth rate based on historical market performance for different portfolio mixes." />
          </label>
          <div className="grid grid-cols-1 gap-3">
            {(Object.keys(INVESTMENT_STRATEGIES) as InvestmentStrategyType[]).map((key) => {
              const strategy = INVESTMENT_STRATEGIES[key];
              const isSelected = inputs.strategy === key;
              
              // Determine volatility color
              const volColor = strategy.volatility === 'Low' ? 'bg-emerald-500' 
                            : strategy.volatility === 'Medium' ? 'bg-amber-500' 
                            : 'bg-red-500';
              
              const borderColor = isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50';
              
              return (
                <button
                  key={key}
                  onClick={() => handleStrategyChange(key)}
                  className={`text-left p-3 rounded-lg border transition-all relative overflow-hidden flex flex-col gap-2 ${borderColor}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      {key === InvestmentStrategyType.CONSERVATIVE && <ShieldCheck size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />}
                      {key === InvestmentStrategyType.BALANCED && <PieChart size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />}
                      {key === InvestmentStrategyType.AGGRESSIVE && <TrendingUp size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />}
                      
                      <span className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {strategy.name}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                       {key === InvestmentStrategyType.CUSTOM ? inputs.customReturnRate : strategy.rate}%
                    </span>
                  </div>

                  {/* Enhanced Asset Mix & Details */}
                  {key !== InvestmentStrategyType.CUSTOM ? (
                    <div className="w-full space-y-2 pl-6">
                      <div className="text-xs text-slate-500 leading-snug">
                        {strategy.assetMix}
                      </div>
                      <div className="flex items-center gap-3 pt-2 mt-1 border-t border-slate-200/50">
                         <div className="flex items-center gap-1.5">
                            <Activity size={12} className="text-slate-400" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Vol:</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${volColor}`}></span>
                            <span className="text-[10px] font-medium text-slate-600">{strategy.volatility}</span>
                         </div>
                         <div className="text-[10px] text-slate-400 border-l border-slate-200 pl-3 ml-auto">
                            {strategy.description}
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 pl-6">
                      Define your own fixed annual return rate based on your unique portfolio mix.
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {inputs.strategy === InvestmentStrategyType.CUSTOM && (
             <div className="mt-2 space-y-1 animate-fade-in">
              <label className="text-xs text-slate-500 font-medium">Custom Return Rate (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  min="0" max="20" step="0.1"
                  value={inputs.customReturnRate}
                  onChange={(e) => handleChange('customReturnRate', e.target.value)}
                  className="w-full p-2 rounded border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none pr-8"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              </div>
             </div>
          )}
        </div>

        {/* Inflation */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-slate-700 flex items-center">
              Inflation Rate
              <Tooltip text="The rate at which prices rise. Historic average is around 3%." />
            </label>
            <span className="text-sm font-bold text-slate-700">{inputs.inflationRate}%</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="0.5"
            value={inputs.inflationRate}
            onChange={(e) => handleChange('inflationRate', e.target.value)}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* Tax Rate */}
        <div className="space-y-1 pt-2">
           <label className="text-sm font-medium text-slate-700 flex items-center">
              Est. Retirement Tax Rate (%)
              <Tooltip text="Average tax rate on withdrawals from Traditional/Taxable accounts. Roth is tax-free." />
           </label>
           <div className="relative">
             <input 
                type="number" 
                min="0" max="50"
                value={inputs.retirementTaxRate}
                onChange={(e) => handleChange('retirementTaxRate', e.target.value)}
                className="w-full p-2 pr-8 rounded border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
           </div>
        </div>
      </section>
    </div>
  );
};