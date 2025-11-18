import React, { useState, useMemo } from 'react';
import { UserInput } from '../lib/types';
import { growRealToNominal, calculateRequiredContribution, calculateRequiredReturn } from '../lib/financeMath';
import { Sliders, TrendingUp, DollarSign, Calendar, ShieldCheck } from 'lucide-react';

interface GoalSandboxProps {
  inputs: UserInput;
}

export const GoalSandbox: React.FC<GoalSandboxProps> = ({ inputs }) => {
  // Initialize local state with user inputs or defaults
  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState(inputs.targetType === 'income' ? inputs.targetValue / 12 : 5000);
  const [retirementAge, setRetirementAge] = useState(inputs.retirementAge);
  const [returnRate, setReturnRate] = useState(inputs.strategy === 'Custom' ? inputs.customReturnRate : (inputs.strategy === 'Conservative' ? 4 : inputs.strategy === 'Balanced' ? 6 : 9));
  const [sandboxSS, setSandboxSS] = useState(inputs.estimatedSocialSecurity || 0);

  // Safe bounds
  const safeRetirementAge = Math.max(inputs.currentAge + 1, retirementAge);
  const yearsToRetirement = safeRetirementAge - inputs.currentAge;
  const inflationRate = inputs.inflationRate / 100;
  const safeWithdrawalRate = inputs.safeWithdrawalRate / 100;

  // Real-time Calculations
  const calculation = useMemo(() => {
    // 1. Target Income (Real)
    const targetAnnualIncomeReal = desiredMonthlyIncome * 12;
    
    // 2. Adjust for Social Security
    // The portfolio only needs to cover: Total Desired - Social Security
    const annualSS = sandboxSS * 12;
    const portfolioIncomeNeededReal = Math.max(0, targetAnnualIncomeReal - annualSS);

    // 3. Target Portfolio Size (Real)
    const targetPortfolioReal = portfolioIncomeNeededReal / safeWithdrawalRate;

    // 4. Convert to Nominal Target (Future Dollars) for the Solver
    const targetPortfolioNominal = growRealToNominal(targetPortfolioReal, inflationRate, yearsToRetirement);

    // 5. Solve for Required Contribution (using User's Rate)
    // Returns Math.ceil from helper to ensure gap coverage
    const requiredContribution = calculateRequiredContribution(
      targetPortfolioNominal,
      inputs.currentPortfolio,
      returnRate / 100,
      yearsToRetirement
    );

    // 6. Solve for Required Return (using User's Current Contribution)
    const requiredReturn = calculateRequiredReturn(
      targetPortfolioNominal,
      inputs.currentPortfolio,
      inputs.monthlyContribution,
      yearsToRetirement
    );

    return {
      targetAnnualIncomeReal,
      portfolioIncomeNeededReal,
      targetPortfolioNominal,
      requiredContribution: Math.max(0, requiredContribution),
      requiredReturn: requiredReturn ? requiredReturn * 100 : null
    };
  }, [desiredMonthlyIncome, safeRetirementAge, returnRate, sandboxSS, inputs.currentPortfolio, inputs.monthlyContribution, inputs.inflationRate, inputs.safeWithdrawalRate]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Comparison Metrics
  const contributionGap = calculation.requiredContribution - inputs.monthlyContribution;
  const isCovered = contributionGap <= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Sliders className="text-emerald-400" />
              Goal Sandbox
            </h2>
            <p className="text-slate-400 mt-1">Interactive playground. Adjust your goals to see the price tag.</p>
          </div>
          <div className="text-right hidden md:block">
             <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Current Savings</div>
             <div className="text-xl font-mono font-medium text-emerald-400">{formatCurrency(inputs.monthlyContribution)} <span className="text-sm text-slate-500">/ mo</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Control 1: Income */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <DollarSign size={16} className="text-indigo-400"/> 
                  Desired Monthly Income
                  <span className="text-[10px] bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded ml-2">TODAY'S VALUE</span>
                </label>
                <span className="text-2xl font-bold text-white">{formatCurrency(desiredMonthlyIncome)}</span>
              </div>
              <input 
                type="range" 
                min="2000" max="20000" step="500"
                value={desiredMonthlyIncome}
                onChange={(e) => setDesiredMonthlyIncome(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-xs text-slate-500">
                Total Annual: {formatCurrency(desiredMonthlyIncome * 12)}
              </p>
            </div>

            {/* Control: Social Security */}
             <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-400"/> 
                  Est. Social Security
                </label>
                <span className="text-xl font-bold text-white">{formatCurrency(sandboxSS)}</span>
              </div>
              <input 
                type="range" 
                min="0" max="5000" step="100"
                value={sandboxSS}
                onChange={(e) => setSandboxSS(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-xs text-slate-500">
                Portfolio needs to cover: {formatCurrency(Math.max(0, desiredMonthlyIncome - sandboxSS))} / mo
              </p>
            </div>

            {/* Control 2: Age */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                 <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Calendar size={16} className="text-emerald-400"/> 
                  Retirement Age
                </label>
                <span className="text-2xl font-bold text-white">{safeRetirementAge}</span>
              </div>
              <input 
                type="range" 
                min={inputs.currentAge + 1} max="80" step="1"
                value={safeRetirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
               <p className="text-xs text-slate-500">
                {yearsToRetirement} years to save and compound.
              </p>
            </div>

            {/* Control 3: Return */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                 <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-400"/> 
                  Growth Rate
                </label>
                <span className="text-2xl font-bold text-white">{returnRate}%</span>
              </div>
              <input 
                type="range" 
                min="2" max="12" step="0.5"
                value={returnRate}
                onChange={(e) => setReturnRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <p className="text-xs text-slate-500">
                Assumed annual nominal return.
              </p>
            </div>

          </div>

          {/* Divider */}
          <div className="hidden lg:block lg:col-span-1 border-r border-slate-800 h-full mx-auto opacity-50"></div>

          {/* Results Column */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            
            {/* Big Result */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
               <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Required Monthly Savings</h3>
               <div className="flex items-baseline gap-3">
                 <span className="text-5xl font-bold text-white tracking-tight">
                   {formatCurrency(calculation.requiredContribution)}
                 </span>
                 <span className="text-slate-500">/ mo</span>
               </div>

               {/* Gap Indicator */}
               <div className="mt-6 pt-6 border-t border-slate-700">
                 <div className="flex justify-between text-sm mb-2">
                   <span className="text-slate-400">Current Plan</span>
                   <span className="text-white">{formatCurrency(inputs.monthlyContribution)}</span>
                 </div>
                 <div className="flex justify-between text-sm mb-4">
                   <span className="text-slate-400">Gap</span>
                   <span className={`${isCovered ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                     {isCovered ? '+ Surplus' : formatCurrency(contributionGap)}
                   </span>
                 </div>
                 
                 {/* Visual Bar */}
                 <div className="relative h-4 bg-slate-900 rounded-full overflow-hidden">
                   {/* Target Marker */}
                   <div className="absolute top-0 bottom-0 w-1 bg-white/20 z-10" style={{ left: `${Math.min(100, (inputs.monthlyContribution / calculation.requiredContribution) * 100)}%` }}></div>
                   
                   {/* Fill */}
                   <div 
                     className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ${isCovered ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                     style={{ width: `${Math.min(100, (inputs.monthlyContribution / calculation.requiredContribution) * 100)}%` }}
                   ></div>
                 </div>
                 <div className="mt-2 text-xs text-center text-slate-500">
                   {isCovered 
                     ? "You are saving enough to hit this goal!" 
                     : `You need to increase savings by ${Math.round((calculation.requiredContribution / inputs.monthlyContribution - 1) * 100)}%`}
                 </div>
               </div>
            </div>

            {/* Secondary Stat: Required Rate */}
            <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-800 bg-slate-800/30 hover:bg-slate-800/50 transition">
               <div className="p-3 rounded-full bg-amber-900/30 text-amber-500">
                 <TrendingUp size={20} />
               </div>
               <div>
                 <div className="text-xs text-slate-400 uppercase font-bold">Alternative Path</div>
                 <div className="text-sm text-slate-300">
                   To hit this goal with <u>current savings</u>, you'd need a return of:
                   <span className={`ml-2 font-mono font-bold text-lg ${calculation.requiredReturn && calculation.requiredReturn > 12 ? 'text-red-400' : 'text-white'}`}>
                      {calculation.requiredReturn ? calculation.requiredReturn.toFixed(1) + '%' : 'Unrealistic'}
                   </span>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};