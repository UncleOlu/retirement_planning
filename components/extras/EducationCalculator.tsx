
import React, { useState, useMemo, useEffect } from 'react';
import { CURRENCIES, COUNTRY_CONFIG } from '../../lib/constants';
import { CurrencyCode, CountryCode } from '../../lib/types';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DecimalInput } from '../ui/DecimalInput';
import { GraduationCap, TrendingUp, BookOpen, AlertTriangle, CheckCircle, PiggyBank, Landmark, ArrowRight, Info, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

interface EducationCalculatorProps {
  currency: CurrencyCode;
  country?: CountryCode;
}

export const EducationCalculator: React.FC<EducationCalculatorProps> = ({ currency, country = 'US' }) => {
  const [childAge, setChildAge] = useState(2);
  const [collegeStartAge, setCollegeStartAge] = useState(18);
  const [currentSavings, setCurrentSavings] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  
  // Advanced Inputs
  const [annualCollegeCost, setAnnualCollegeCost] = useState(30000); // In today's dollars
  const [educationInflation, setEducationInflation] = useState(5); // Higher than CPI usually
  const [investmentReturn, setInvestmentReturn] = useState(7); 
  const [stateTaxRate, setStateTaxRate] = useState(4.5); // Default to a typical state tax rate

  // Update default costs if country changes
  useEffect(() => {
     if (country === 'UK') {
       setAnnualCollegeCost(9250 + 10000); // Tuition + Living approx
       setStateTaxRate(0); // UK has no state tax deduction logic for JISA usually, it's just tax free
     } else {
       setAnnualCollegeCost(30000);
       setStateTaxRate(4.5);
     }
  }, [country]);

  const config = COUNTRY_CONFIG[country];
  const currencyConfig = CURRENCIES[currency];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);

  // Constants
  const US_GIFT_TAX_EXCLUSION = 18000; 
  const UK_JISA_LIMIT = 9000; // Annual JISA limit approx £9k
  
  const projection = useMemo(() => {
    const data = [];
    const yearsUntilCollege = Math.max(0, collegeStartAge - childAge);
    const durationOfCollege = 3; // UK standard 3 years, US 4
    const duration = country === 'UK' ? 3 : 4;
    
    let balance = currentSavings;
    let totalContributed = currentSavings;
    
    // We simulate until end of college
    const endAge = collegeStartAge + duration;
    
    // Calculate Gap
    let projectedTotalCost = 0;

    for (let age = childAge; age <= endAge; age++) {
       const yearIndex = age - childAge;
       const isCollegeYears = age >= collegeStartAge && age < collegeStartAge + duration;
       
       // Calculate cost for this year (compounded by education inflation)
       let yearlyCost = 0;
       if (isCollegeYears) {
          yearlyCost = annualCollegeCost * Math.pow(1 + educationInflation/100, yearIndex);
          projectedTotalCost += yearlyCost;
       }

       data.push({
          age,
          balance: Math.round(balance),
          yearlyCost: Math.round(yearlyCost),
          totalContributed: Math.round(totalContributed)
       });

       // End of year logic
       
       // 1. Growth
       balance = balance * (1 + investmentReturn/100);
       
       // 2. Contributions (stop at graduation)
       if (age < endAge) {
          const annualContrib = monthlyContribution * 12;
          balance += annualContrib;
          totalContributed += annualContrib;
       }

       // 3. Tuitions Paid (Drawdown)
       if (isCollegeYears) {
          balance -= yearlyCost; 
       }
    }
    
    // "Gap Closer" Math
    let requiredMonthly = 0;
    let shortfall = 0;
    if (balance < 0) {
       shortfall = Math.abs(balance); 
       const yearsToCover = yearsUntilCollege + (duration / 2); 
       const growthFactor = Math.pow(1 + investmentReturn/100, yearsToCover);
       const pvShortfall = shortfall / growthFactor;
       requiredMonthly = monthlyContribution + (pvShortfall / (yearsToCover * 12));
    }

    return { 
      data, 
      finalBalance: balance, 
      yearsUntilCollege, 
      projectedTotalCost,
      requiredMonthly,
      shortfall
    };
  }, [childAge, collegeStartAge, currentSavings, monthlyContribution, annualCollegeCost, educationInflation, investmentReturn, country]);

  const isShortfall = projection.finalBalance < -1000; 
  
  // Country Specific Logic
  const annualTaxSavings = (monthlyContribution * 12) * (stateTaxRate / 100);
  
  const isOverLimit = country === 'UK' 
     ? (monthlyContribution * 12) > UK_JISA_LIMIT
     : (monthlyContribution * 12) > US_GIFT_TAX_EXCLUSION;

  // Dynamic Tips based on Age
  const getStrategyTip = () => {
    if (projection.yearsUntilCollege > 12) return { 
      title: "Strategy: Aggressive Growth", 
      text: "Your child is young. History suggests a 100% Equity (Stock) allocation maximizes growth. Volatility is acceptable at this stage." 
    };
    if (projection.yearsUntilCollege > 5) return { 
      title: "Strategy: Balanced Growth", 
      text: "As high school approaches, consider shifting new contributions to a 60/40 Stock/Bond mix to protect gains while still growing." 
    };
    return { 
      title: "Strategy: Capital Preservation", 
      text: "Enrollment is imminent. Focus on stable value funds, cash equivalents, or short-term bonds to ensure tuition money is safe from market crashes." 
    };
  };
  const strategy = getStrategyTip();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-cyan-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
            <GraduationCap className="text-cyan-300" /> {config.labels.educationAccount} Planner
          </h2>
          <p className="text-cyan-100 max-w-2xl text-sm">
            {country === 'UK' 
              ? "Forecast university costs and Junior ISA growth to minimize student loans." 
              : "Forecast college costs, calculate state tax deductions, and optimize your 529 savings strategy."}
          </p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <GraduationCap size={250} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Controls */}
        <div className="xl:col-span-5 space-y-6">
           
           {/* Card 1: Student Profile */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                <TrendingUp size={16} /> Student Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Current Age</label>
                    <input 
                      type="number" 
                      min="0" max="20"
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Uni/College Start Age</label>
                    <input 
                      type="number" 
                      min={childAge + 1} max="30"
                      value={collegeStartAge}
                      onChange={(e) => setCollegeStartAge(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                 </div>
              </div>
           </div>

           {/* Card 2: Funding Plan */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                <PiggyBank size={16} /> Funding Plan
              </h3>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Current {config.labels.educationAccount} Balance</label>
                    <CurrencyInput 
                       value={currentSavings}
                       onChange={setCurrentSavings}
                       symbol={currencyConfig.symbol}
                       className="w-full p-2 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                 </div>
                 
                 <div className="space-y-1">
                    <div className="flex justify-between items-center">
                       <label className="text-xs font-bold text-slate-700">Monthly Contribution</label>
                       {isOverLimit && (
                          <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded flex items-center gap-1">
                             <Info size={10}/> Limit Warning
                          </span>
                       )}
                    </div>
                    <CurrencyInput 
                       value={monthlyContribution}
                       onChange={setMonthlyContribution}
                       symbol={currencyConfig.symbol}
                       className={`w-full p-2 pl-8 border rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none ${isOverLimit ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}
                    />
                    
                    {/* Limit Warnings */}
                    {isOverLimit && (
                       <div className="mt-2 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                         <p className="text-[10px] text-orange-800 font-medium mb-1 flex items-center gap-1">
                           <AlertTriangle size={10} /> Contribution Alert
                         </p>
                         <p className="text-[10px] text-orange-700 leading-relaxed">
                            {country === 'UK' 
                              ? `You are exceeding the annual Junior ISA allowance of approx ${formatCurrency(UK_JISA_LIMIT)}. Excess contributions may not be tax-privileged.`
                              : `You are contributing over ${formatCurrency(US_GIFT_TAX_EXCLUSION)}/year. 529 plans allow 5-year gift tax averaging.`
                            }
                         </p>
                       </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700">Exp. Return (%)</label>
                       <DecimalInput 
                          value={investmentReturn}
                          onChange={setInvestmentReturn}
                          className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                          rightSymbol="%"
                       />
                    </div>
                    {country === 'US' && (
                      <div className="space-y-1">
                         <label className="text-xs font-bold text-slate-700">State Tax Rate</label>
                         <DecimalInput 
                            value={stateTaxRate}
                            onChange={setStateTaxRate}
                            className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                            rightSymbol="%"
                         />
                      </div>
                    )}
                 </div>

                 {/* Tax Benefit Calc (US Only usually) */}
                 {country === 'US' && stateTaxRate > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center gap-3">
                       <Landmark size={18} className="text-emerald-600 shrink-0"/>
                       <div>
                          <div className="text-xs text-emerald-800 font-bold">Annual Tax Savings</div>
                          <div className="text-[10px] text-emerald-700">
                             Deducting contributions could save you <span className="font-bold">{formatCurrency(annualTaxSavings)}</span>/year in state taxes.*
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>

           {/* Card 3: Cost Assumptions */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                 <BookOpen size={16} /> Cost Assumptions
              </h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Annual Cost (Today's Value)</label>
                    <CurrencyInput 
                       value={annualCollegeCost}
                       onChange={setAnnualCollegeCost}
                       symbol={currencyConfig.symbol}
                       className="w-full p-2 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400">Includes Tuition, Living, Books.</p>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Education Inflation (%)</label>
                    <div className="flex items-center gap-2">
                       <input 
                          type="range" min="0" max="10" step="0.5"
                          value={educationInflation}
                          onChange={(e) => setEducationInflation(Number(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                       />
                       <div className="w-20">
                          <DecimalInput 
                             value={educationInflation}
                             onChange={setEducationInflation}
                             className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 text-right focus:ring-2 focus:ring-cyan-500 outline-none"
                             rightSymbol="%"
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

        </div>

        {/* Right Column: Visualization */}
        <div className="xl:col-span-7 space-y-6">
           
           {/* Status Banner */}
           <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 ${isShortfall ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-2">
                    {isShortfall ? <AlertTriangle className="text-orange-500"/> : <CheckCircle className="text-emerald-500"/>}
                    <h3 className={`text-lg font-bold ${isShortfall ? 'text-orange-800' : 'text-emerald-800'}`}>
                       {isShortfall ? 'Funding Gap Detected' : 'Fully Funded!'}
                    </h3>
                 </div>
                 <p className={`text-sm leading-relaxed ${isShortfall ? 'text-orange-700' : 'text-emerald-700'}`}>
                    {isShortfall 
                       ? `You are projected to cover ${Math.round(((projection.projectedTotalCost + projection.finalBalance)/projection.projectedTotalCost)*100)}% of the ${formatCurrency(projection.projectedTotalCost)} estimated cost.` 
                       : "You are on track to cover all estimated expenses with a surplus!"}
                 </p>
                 
                 {isShortfall && (
                    <div className="mt-4 bg-white/60 p-3 rounded-lg flex items-center gap-3 border border-orange-100">
                       <div className="text-xs font-bold text-orange-800 uppercase shrink-0">Close The Gap</div>
                       <ArrowRight size={14} className="text-orange-400 hidden sm:block"/>
                       <div className="text-sm font-bold text-orange-900">
                          Increase savings to {formatCurrency(Math.ceil(projection.requiredMonthly))} / mo
                       </div>
                    </div>
                 )}
              </div>
              
              <div className="text-right bg-white/50 p-4 rounded-xl min-w-[140px] border border-white/50">
                 <div className="text-xs font-bold uppercase opacity-60 mb-1">Ending Balance</div>
                 <div className={`text-2xl font-bold ${isShortfall ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {formatCurrency(projection.finalBalance)}
                 </div>
              </div>
           </div>

           {/* Chart */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Savings Projection vs. Costs</h3>
              <div className="flex-1 w-full min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projection.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <defs>
                          <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis 
                          dataKey="age" 
                          tick={{ fontSize: 10, fill: '#94a3b8' }} 
                          tickLine={false} 
                          axisLine={false}
                          label={{ value: 'Child Age', position: 'insideBottomRight', offset: -5, fill: '#cbd5e1', fontSize: 10 }}
                       />
                       <YAxis 
                          tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} 
                          tick={{ fontSize: 10, fill: '#94a3b8' }} 
                          tickLine={false} 
                          axisLine={false} 
                       />
                       <RechartsTooltip 
                          formatter={(val: number) => formatCurrency(val)}
                          labelFormatter={(label) => `Age ${label}`}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       />
                       <Legend />
                       <ReferenceLine x={collegeStartAge} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Studies Start', position: 'insideTopLeft', fill: '#f59e0b', fontSize: 10, angle: -90 }} />
                       
                       <Area 
                          type="monotone" 
                          dataKey="totalContributed" 
                          name="Principal" 
                          stroke="#94a3b8" 
                          fill="none" 
                          strokeWidth={1} 
                          strokeDasharray="3 3"
                       />

                       <Area 
                          type="monotone" 
                          dataKey="balance" 
                          name="Total Value" 
                          stroke="#06b6d4" 
                          fill="url(#gradBalance)" 
                          strokeWidth={3} 
                       />

                       <Area 
                          type="monotone" 
                          dataKey="yearlyCost" 
                          name="Annual Cost" 
                          stroke="#ef4444" 
                          fill="none" 
                          strokeWidth={2} 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Strategy Tip Box */}
           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 items-start">
              <div className="p-3 bg-white rounded-full shadow-sm h-fit text-cyan-600 shrink-0">
                 <ShieldCheck size={20} />
              </div>
              <div>
                 <h4 className="text-sm font-bold text-slate-700 uppercase mb-1">{strategy.title}</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">{strategy.text}</p>
              </div>
           </div>

           {/* Educational Section: Why Use This? */}
           <div className="bg-cyan-50 rounded-xl p-6 border border-cyan-100">
              <h4 className="text-sm font-bold text-cyan-800 mb-4 flex items-center gap-2">
                <BookOpen size={18} /> Why use a {config.labels.educationAccount}?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-cyan-900">
                 {country === 'US' ? (
                   <>
                    <div className="flex items-start gap-2">
                        <CheckCircle size={14} className="mt-0.5 text-cyan-600 shrink-0" />
                        <span><strong>Tax-Free Growth:</strong> Investment earnings are not subject to federal tax.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle size={14} className="mt-0.5 text-cyan-600 shrink-0" />
                        <span><strong>Tax-Free Withdrawals:</strong> No tax when used for qualified education expenses.</span>
                    </div>
                   </>
                 ) : (
                   <>
                    <div className="flex items-start gap-2">
                        <CheckCircle size={14} className="mt-0.5 text-cyan-600 shrink-0" />
                        <span><strong>Tax Efficiency:</strong> Junior ISAs are completely tax-free wrappers. No Capital Gains Tax or Income Tax on returns.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle size={14} className="mt-0.5 text-cyan-600 shrink-0" />
                        <span><strong>Control:</strong> The money belongs to the child at age 18, providing a nest egg for university or a house deposit.</span>
                    </div>
                   </>
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};
