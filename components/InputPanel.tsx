
import React, { useState } from 'react';
import { UserInput, InvestmentStrategyType, CurrencyCode, CountryCode } from '../lib/types';
import { INVESTMENT_STRATEGIES, CURRENCIES, COUNTRY_CONFIG } from '../lib/constants';
import { Tooltip } from './ui/Tooltip';
import { CurrencyInput } from './ui/CurrencyInput';
import { DecimalInput } from './ui/DecimalInput';
import { DollarSign, Euro, PoundSterling, Percent, PiggyBank, ChevronUp, Lightbulb, AlertCircle, PieChart, Activity, ShieldCheck, TrendingUp, Briefcase, Wallet, Landmark } from 'lucide-react';

interface InputPanelProps {
  inputs: UserInput;
  onChange: (newInputs: UserInput) => void;
  country?: CountryCode;
}

export const InputPanel: React.FC<InputPanelProps> = ({ inputs, onChange, country = 'US' }) => {
  const [showPortfolioSplit, setShowPortfolioSplit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const config = COUNTRY_CONFIG[country];

  const CurrencyIcon = ({ className, size }: { className?: string, size?: number }) => {
    if (inputs.currency === 'EUR') return <Euro className={className} size={size} />;
    if (inputs.currency === 'GBP') return <PoundSterling className={className} size={size} />;
    return <DollarSign className={className} size={size} />;
  };

  const currencySymbol = CURRENCIES[inputs.currency].symbol;

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
      case 'monthlyRothContribution':
        // No specific limit validation here as it's aggregate
        break;
      case 'inflationRate':
      case 'retirementTaxRate':
        if (value < 0 || value > 100) return "Rate must be 0-100%.";
        break;
    }
    return null;
  };

  const handleChange = (field: keyof UserInput, rawValue: string | CurrencyCode | number) => {
    if (field === 'currency') {
      onChange({ ...inputs, currency: rawValue as CurrencyCode });
      return;
    }

    // If number, use as is (from DecimalInput/CurrencyInput), else parse string
    const numValue = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue as string);
    const finalValue = isNaN(numValue) ? 0 : numValue;
    
    // Construct proposed state for validation
    const proposedInputs = { ...inputs, [field]: finalValue };
    
    // Efficiency: Enforce constraints immediately
    if (field === 'currentPortfolio') {
       // Ensure parts don't exceed total
       const currentRoth = proposedInputs.currentRothBalance || 0;
       const currentBrokerage = proposedInputs.currentBrokerageBalance || 0;
       if (currentRoth + currentBrokerage > finalValue) {
         if (currentRoth > finalValue) {
           proposedInputs.currentRothBalance = finalValue;
           proposedInputs.currentBrokerageBalance = 0;
         } else {
           proposedInputs.currentBrokerageBalance = finalValue - currentRoth;
         }
       }
    }
    
    if (field === 'currentRothBalance') {
       const currentBrokerage = proposedInputs.currentBrokerageBalance || 0;
       if (finalValue + currentBrokerage > proposedInputs.currentPortfolio) {
         proposedInputs.currentRothBalance = Math.max(0, proposedInputs.currentPortfolio - currentBrokerage);
       }
    }

    if (field === 'currentBrokerageBalance') {
       const currentRoth = proposedInputs.currentRothBalance || 0;
       if (finalValue + currentRoth > proposedInputs.currentPortfolio) {
         proposedInputs.currentBrokerageBalance = Math.max(0, proposedInputs.currentPortfolio - currentRoth);
       }
    }

    // Run Validation
    const error = validateField(field, finalValue, proposedInputs);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[field] = error;
      else delete newErrors[field];
      
      // Clear cross-field errors
      if (field === 'currentAge' && newErrors['retirementAge']) {
         if (proposedInputs.retirementAge > finalValue) delete newErrors['retirementAge'];
      }
      if (field === 'retirementAge' && newErrors['currentAge']) {
         if (finalValue > proposedInputs.currentAge) delete newErrors['currentAge'];
      }
      return newErrors;
    });

    onChange(proposedInputs);
  };

  const handleContributionBreakdownChange = (
    subField: 'savingsTrad401k' | 'savingsRoth401k' | 'savingsRothIRA' | 'savingsBrokerage',
    val: number
  ) => {
    const newInputs = { ...inputs, [subField]: val };

    // Recalculate Aggregates
    const totalContrib = newInputs.savingsTrad401k + newInputs.savingsRoth401k + newInputs.savingsRothIRA + newInputs.savingsBrokerage;
    const totalRoth = newInputs.savingsRoth401k + newInputs.savingsRothIRA;

    onChange({
      ...newInputs,
      monthlyContribution: totalContrib,
      monthlyRothContribution: totalRoth
    });
  };

  const handleStrategyChange = (strategy: InvestmentStrategyType) => {
    onChange({ ...inputs, strategy });
  };

  // Helper for auto-selecting input content on focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  // Calc Derived Traditional Balance
  const currentTradBalance = Math.max(0, inputs.currentPortfolio - (inputs.currentRothBalance || 0) - (inputs.currentBrokerageBalance || 0));

  // Dynamic Tip Logic
  const getFinancialTip = () => {
    const total401k = inputs.savingsTrad401k + inputs.savingsRoth401k;
    const annual401k = total401k * 12;
    const totalAnnualSavings = inputs.monthlyContribution * 12;
    
    // Age 50+ Catch-up
    if (inputs.currentAge >= 50) {
       return { 
           title: "Age 50+ Catch-Up", 
           text: config.tips.catchUp
       };
    }

    // Tax Advantage Tip
    if (inputs.savingsBrokerage > 0 && annual401k < 10000) { // Simplified threshold for tip
      return { 
        title: "Maximize Tax Efficiency", 
        text: config.tips.taxAdvantage
      };
    }

    // 6. Standard Checks
    if (inputs.currentPortfolio > 0 && inputs.currentRothBalance === 0 && !showPortfolioSplit) {
      return { title: "Did you know?", text: `If you have tax-free accounts (like ${config.labels.rothIra}), check 'Split Tax-Free' above.` };
    }
    
    if (inputs.safeWithdrawalRate > 4.5) {
      return { title: "Withdrawal Risk", text: "A rate above 4.5% significantly increases the risk of outliving your money during downturns. Most planners suggest 3% - 4%." };
    }

    // Fallback
    return { title: "Compounding Power", text: "The biggest factor in your success is Time. Investing early yields significantly more than starting later." };
  };

  const tip = getFinancialTip();

  return (
    <div className="space-y-8 pb-12">
      
      {/* Section 1: Profile & Contributions */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Profile & Contributions
          </h3>
          {/* Currency Selector */}
          <select 
            value={inputs.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            className="text-xs font-bold bg-slate-100 text-slate-600 border-none rounded px-2 py-1 cursor-pointer hover:bg-slate-200 outline-none focus:ring-1 focus:ring-indigo-300"
          >
            {Object.entries(CURRENCIES).map(([code, c]) => (
              <option key={code} value={code}>{code} ({c.symbol})</option>
            ))}
          </select>
        </div>
        
        {/* Age Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Current Age</label>
            <input 
              type="number" 
              value={inputs.currentAge}
              onChange={(e) => handleChange('currentAge', e.target.value)}
              onFocus={handleFocus}
              className={`w-full p-2 rounded-lg border outline-none transition bg-white text-slate-900 font-semibold ${errors.currentAge ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'}`}
            />
            {errors.currentAge && <div className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {errors.currentAge}</div>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Retirement Age</label>
            <input 
              type="number" 
              value={inputs.retirementAge}
              onChange={(e) => handleChange('retirementAge', e.target.value)}
              onFocus={handleFocus}
              className={`w-full p-2 rounded-lg border outline-none transition bg-white text-slate-900 font-semibold ${errors.retirementAge ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'}`}
            />
             {errors.retirementAge && <div className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {errors.retirementAge}</div>}
          </div>
        </div>

        {/* Current Portfolio with Split */}
        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <label className="text-xs font-bold text-slate-700">Current Portfolio</label>
            {!showPortfolioSplit && (
               <button 
                 onClick={() => setShowPortfolioSplit(true)}
                 className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition flex items-center gap-1 font-medium mb-1 border border-indigo-100"
               >
                 <PieChart size={12}/> Split Tax-Free
               </button>
            )}
          </div>

          <div className={`relative transition-all duration-300 ${showPortfolioSplit ? 'bg-white p-3 rounded-lg border border-slate-200 shadow-sm' : ''}`}>
            
            {/* Main Input */}
            <CurrencyInput 
               value={inputs.currentPortfolio}
               onChange={(val) => handleChange('currentPortfolio', val)}
               className="w-full pl-9 p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 bg-white"
               placeholder="Total Savings"
               symbol={<CurrencyIcon size={16} />}
            />
            {errors.currentPortfolio && <div className="text-[10px] text-red-500 mt-1">{errors.currentPortfolio}</div>}
            
            {/* Split Details (Conditional) */}
            {showPortfolioSplit && (
               <div className="mt-4 pt-3 border-t border-slate-100 animate-fade-in space-y-4">
                 <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                       Breakdown
                    </label>
                    <button 
                      onClick={() => setShowPortfolioSplit(false)} 
                      className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      Hide <ChevronUp size={10} />
                    </button>
                 </div>

                 {/* Roth Row */}
                 <div>
                   <label className="text-[10px] text-emerald-600 font-bold flex justify-between mb-1">
                      <span>{config.labels.rothIra} / Tax-Free</span>
                   </label>
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
                         <CurrencyInput 
                            value={inputs.currentRothBalance || 0}
                            onChange={(val) => handleChange('currentRothBalance', val)}
                            className="w-full pl-4 p-1 text-right text-sm font-bold text-emerald-600 border border-slate-200 rounded hover:border-emerald-300 focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-200 bg-white"
                            symbol={<span className="text-emerald-300 text-xs"><CurrencyIcon size={12} /></span>}
                         />
                      </div>
                   </div>
                 </div>

                 {/* Brokerage Row */}
                 <div>
                   <label className="text-[10px] text-slate-500 font-bold flex justify-between mb-1">
                      <span className="flex items-center gap-1">
                        {config.labels.brokerage}
                        <Tooltip text="Assumes your current balance is the Cost Basis. Future gains will be taxed at Capital Gains rates." />
                      </span>
                   </label>
                   <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max={inputs.currentPortfolio} 
                        step={inputs.currentPortfolio > 50000 ? 1000 : 100}
                        value={inputs.currentBrokerageBalance || 0}
                        onChange={(e) => handleChange('currentBrokerageBalance', e.target.value)}
                        className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-400"
                      />
                      <div className="w-24 text-right relative">
                         <CurrencyInput 
                            value={inputs.currentBrokerageBalance || 0}
                            onChange={(val) => handleChange('currentBrokerageBalance', val)}
                            className="w-full pl-4 p-1 text-right text-sm font-bold text-slate-600 border border-slate-200 rounded hover:border-slate-300 focus:border-slate-500 outline-none focus:ring-1 focus:ring-slate-200 bg-white"
                            symbol={<span className="text-slate-300 text-xs"><CurrencyIcon size={12} /></span>}
                         />
                      </div>
                   </div>
                 </div>

                 {/* Calculated Traditional Row */}
                 <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                    <label className="text-[10px] text-slate-500 font-bold">
                      {config.labels.trad401k} <span className="font-normal">(Remainder)</span>
                    </label>
                    <span className="text-xs font-bold text-slate-700">
                       {currencySymbol}{currentTradBalance.toLocaleString()}
                    </span>
                 </div>
                 
               </div>
            )}
          </div>
        </div>

        {/* Monthly Contribution Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
             <label className="text-xs font-bold text-slate-700">Monthly Contribution</label>
             <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
               Total: {currencySymbol}{inputs.monthlyContribution.toLocaleString()}
             </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-6">
             
             {/* Work Retirement */}
             <div>
               <div className="flex items-center gap-2 mb-3">
                 <Briefcase size={14} className="text-slate-400" />
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workplace Plans</span>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] text-slate-500 mb-1">{config.labels.trad401k}</label>
                    <CurrencyInput 
                       value={inputs.savingsTrad401k || 0}
                       onChange={(val) => handleContributionBreakdownChange('savingsTrad401k', val)}
                       className="w-full pl-6 p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                       placeholder="0"
                       symbol={<span className="text-slate-400 text-xs"><CurrencyIcon size={12}/></span>}
                    />
                    <div className="text-[9px] text-slate-400 mt-0.5">Pre-Tax / Relief</div>
                 </div>
                 <div>
                    <label className="block text-[10px] text-emerald-600 mb-1">{config.labels.roth401k}</label>
                    <CurrencyInput 
                       value={inputs.savingsRoth401k || 0}
                       onChange={(val) => handleContributionBreakdownChange('savingsRoth401k', val)}
                       className="w-full pl-6 p-2 text-sm border border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50 text-emerald-800 font-medium"
                       placeholder="0"
                       symbol={<span className="text-emerald-300 text-xs"><CurrencyIcon size={12}/></span>}
                    />
                    <div className="text-[9px] text-emerald-500 mt-0.5">Post-Tax / AVC</div>
                 </div>
               </div>
             </div>

             <div className="border-t border-slate-100"></div>

             {/* Personal Retirement */}
             <div>
               <div className="flex items-center gap-2 mb-3">
                 <PiggyBank size={14} className="text-slate-400" />
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Savings</span>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] text-emerald-600 mb-1">{config.labels.rothIra}</label>
                    <CurrencyInput 
                       value={inputs.savingsRothIRA || 0}
                       onChange={(val) => handleContributionBreakdownChange('savingsRothIRA', val)}
                       className="w-full pl-6 p-2 text-sm border border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50 text-emerald-800 font-medium"
                       placeholder="0"
                       symbol={<span className="text-emerald-300 text-xs"><CurrencyIcon size={12}/></span>}
                    />
                    <div className="text-[9px] text-emerald-500 mt-0.5">Tax-Free Growth</div>
                 </div>
                 <div>
                    <label className="block text-[10px] text-slate-500 mb-1">{config.labels.brokerage}</label>
                    <CurrencyInput 
                       value={inputs.savingsBrokerage || 0}
                       onChange={(val) => handleContributionBreakdownChange('savingsBrokerage', val)}
                       className="w-full pl-6 p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                       placeholder="0"
                       symbol={<span className="text-slate-400 text-xs"><CurrencyIcon size={12}/></span>}
                    />
                    <div className="text-[9px] text-slate-400 mt-0.5">Taxable</div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Financial Wisdom Tip */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-3 transition-all hover:shadow-sm">
        <Lightbulb className="text-emerald-500 shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-xs font-bold text-emerald-700 uppercase mb-1">{tip.title}</h4>
          <p className="text-xs text-emerald-900 leading-relaxed">{tip.text}</p>
        </div>
      </div>

      {/* Section 2: Goals */}
      <section className="space-y-6 pt-4 border-t border-slate-100">
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
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            {inputs.targetType === 'income' ? 'Desired Annual Income' : 'Target Portfolio Value'}
            <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
               {inputs.targetType === 'income' ? "In Today's Dollars (Real)" : "In Future Dollars (Nominal)"}
            </span>
          </label>
          <CurrencyInput 
             value={inputs.targetValue}
             onChange={(val) => handleChange('targetValue', val)}
             className="w-full pl-9 p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-900 bg-white"
             symbol={<span className="text-slate-400"><CurrencyIcon size={16} /></span>}
          />
        </div>

        {/* Social Security Input */}
         <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
            {config.labels.socialSecurity}
            <Tooltip text="Estimated monthly government benefit in today's dollars. This reduces the amount you need to withdraw from your portfolio." />
          </label>
          <CurrencyInput 
             value={inputs.estimatedSocialSecurity}
             onChange={(val) => handleChange('estimatedSocialSecurity', val)}
             placeholder="e.g. 2000"
             className="w-full pl-9 p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900"
             symbol={<span className="text-slate-400"><CurrencyIcon size={16} /></span>}
          />
        </div>

        <div className="space-y-1">
           <label className="text-xs font-bold text-slate-700 flex items-center">
            Safe Withdrawal Rate
            <Tooltip text="The percentage of your portfolio you withdraw each year. 4% is the standard 'safe' rule." />
          </label>
           <DecimalInput 
             value={inputs.safeWithdrawalRate}
             onChange={(val) => handleChange('safeWithdrawalRate', val)}
             className="w-full p-2 pr-8 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900"
             rightSymbol="%"
           />
        </div>
      </section>

      {/* Section 3: Assumptions & Tax Rate */}
      <section className="space-y-6 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
          Strategy & Assumptions
        </h3>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
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
              <DecimalInput 
                value={inputs.customReturnRate}
                onChange={(val) => handleChange('customReturnRate', val)}
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none pr-8 bg-white text-slate-900"
                rightSymbol="%"
              />
             </div>
          )}
        </div>

        {/* Inflation */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 flex items-center">
              Inflation Rate
              <Tooltip text="The rate at which prices rise. Historic average is around 3%." />
            </label>
            <div className="w-20">
               <DecimalInput 
                 value={inputs.inflationRate}
                 onChange={(val) => handleChange('inflationRate', val)}
                 className="w-full p-1 pr-8 text-right text-sm font-bold text-slate-700 bg-transparent border-b border-slate-300 focus:border-emerald-500 outline-none"
                 rightSymbol="%"
               />
            </div>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="0.1"
            value={inputs.inflationRate}
            onChange={(e) => handleChange('inflationRate', e.target.value)}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* Tax Rate */}
        <div className="space-y-1 pt-2">
           <label className="text-xs font-bold text-slate-700 flex items-center">
              Est. Retirement Tax Rate (%)
              <Tooltip text="Average tax rate on withdrawals from Traditional/Taxable accounts. Roth is tax-free." />
           </label>
           <DecimalInput 
              value={inputs.retirementTaxRate}
              onChange={(val) => handleChange('retirementTaxRate', val)}
              className="w-full p-2 pr-8 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
              rightSymbol="%"
           />
        </div>
      </section>
    </div>
  );
};
