
import React, { useState, useMemo } from 'react';
import { CURRENCIES } from '../../lib/constants';
import { CurrencyCode } from '../../lib/types';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DecimalInput } from '../ui/DecimalInput';
import { GraduationCap, TrendingUp, BookOpen, AlertTriangle, CheckCircle, PiggyBank, Landmark, ArrowRight, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

interface EducationCalculatorProps {
  currency: CurrencyCode;
}

export const EducationCalculator: React.FC<EducationCalculatorProps> = ({ currency }) => {
  const [childAge, setChildAge] = useState(2);
  const [collegeStartAge, setCollegeStartAge] = useState(18);
  const [currentSavings, setCurrentSavings] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  
  // Advanced Inputs
  const [annualCollegeCost, setAnnualCollegeCost] = useState(30000); // In today's dollars
  const [educationInflation, setEducationInflation] = useState(5); // Higher than CPI usually
  const [investmentReturn, setInvestmentReturn] = useState(7); 
  const [stateTaxRate, setStateTaxRate] = useState(0); // For tax deduction calc

  const currencyConfig = CURRENCIES[currency];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);

  // Constants for 2025
  const GIFT_TAX_EXCLUSION = 18000; 
  
  const projection = useMemo(() => {
    const data = [];
    const yearsUntilCollege = Math.max(0, collegeStartAge - childAge);
    const durationOfCollege = 4;
    const monthsUntilCollege = yearsUntilCollege * 12;
    
    let balance = currentSavings;
    let totalContributed = currentSavings;
    
    // We simulate until end of college
    const endAge = collegeStartAge + durationOfCollege;
    
    // Calculate Gap
    let projectedTotalCost = 0;

    for (let age = childAge; age <= endAge; age++) {
       const yearIndex = age - childAge;
       const isCollegeYears = age >= collegeStartAge && age < collegeStartAge + durationOfCollege;
       
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
    // Simple FV solver to find required monthly contribution
    let requiredMonthly = 0;
    if (balance < 0) {
       const shortfall = Math.abs(balance); // Amount short at end of college
       // Very rough approximation of required extra monthly PMT to cover shortfall
       // This treats the shortfall as a future value we need to hit by end of college
       // FV = PMT * ... complex annuity due formula. 
       // Simplified: Shortfall / Months / GrowthFactor
       // A safer simple heuristic for the user:
       requiredMonthly = monthlyContribution + (shortfall / (monthsUntilCollege + (durationOfCollege * 12))); 
       // Adjust for growth
       requiredMonthly = requiredMonthly * 0.75; // Discounting because the money grows
    }

    return { 
      data, 
      finalBalance: balance, 
      yearsUntilCollege, 
      projectedTotalCost,
      requiredMonthly
    };
  }, [childAge, collegeStartAge, currentSavings, monthlyContribution, annualCollegeCost, educationInflation, investmentReturn]);

  const isShortfall = projection.finalBalance < -1000; // Tolerance
  const annualTaxSavings = (monthlyContribution * 12) * (stateTaxRate / 100);
  const isOverGiftLimit = (monthlyContribution * 12) > GIFT_TAX_EXCLUSION;

  // Dynamic Tips
  const getStrategyTip = () => {
    if (projection.yearsUntilCollege > 12) return { title: "Aggressive Growth", text: "Time is on your side. A 100% Equity strategy is common for this age to maximize compounding." };
    if (projection.yearsUntilCollege > 5) return { title: "Balanced Approach", text: "Start introducing bonds or fixed income to protect gains as college approaches." };
    return { title: "Capital Preservation", text: "You are close to enrollment. Shift to cash equivalents or stable value funds to ensure tuition money is there when bills arrive." };
  };
  const strategy = getStrategyTip();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-cyan-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
            <GraduationCap className="text-cyan-300" /> 529 Education Planner
          </h2>
          <p className="text-cyan-100 max-w-2xl text-sm">
            Plan for the rising cost of education. Calculate 529 growth, state tax benefits, and potential funding gaps.
          </p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <GraduationCap size={250} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left: Inputs */}
        <div className="xl:col-span-5 space-y-6">
           
           {/* Profile */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Student Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Child's Current Age</label>
                    <input 
                      type="number" 
                      min="0" max="18"
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">College Start Age</label>
                    <input 
                      type="number" 
                      min={childAge + 1} max="25"
                      value={collegeStartAge}
                      onChange={(e) => setCollegeStartAge(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Current 529 Balance</label>
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
                       {isOverGiftLimit && (
                          <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded flex items-center gap-1">
                             <Info size={10}/> Gift Tax Limit?
                          </span>
                       )}
                    </div>
                    <CurrencyInput 
                       value={monthlyContribution}
                       onChange={setMonthlyContribution}
                       symbol={currencyConfig.symbol}
                       className={`w-full p-2 pl-8 border rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none ${isOverGiftLimit ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}
                    />
                    {isOverGiftLimit && (
                       <p className="text-[10px] text-orange-600 leading-tight">
                          Annual total exceeds ${GIFT_TAX_EXCLUSION.toLocaleString()}. You may need to file a gift tax return or utilize "Superfunding" (5-year spread).
                       </p>
                    )}
                 </div>
              </div>
           </div>

           {/* Costs & Benefits */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Costs & Benefits</h3>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Annual College Cost (Today's $)</label>
                    <CurrencyInput 
                       value={annualCollegeCost}
                       onChange={setAnnualCollegeCost}
                       symbol={currencyConfig.symbol}
                       className="w-full p-2 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400">Avg: Public In-State $11k, Private $42k+</p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700">Tuition Inflation</label>
                       <DecimalInput 
                          value={educationInflation}
                          onChange={setEducationInflation}
                          className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                          rightSymbol="%"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700">Inv. Return</label>
                       <DecimalInput 
                          value={investmentReturn}
                          onChange={setInvestmentReturn}
                          className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                          rightSymbol="%"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700">State Tax Rate</label>
                       <DecimalInput 
                          value={stateTaxRate}
                          onChange={setStateTaxRate}
                          className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                          rightSymbol="%"
                       />
                    </div>
                 </div>
                 
                 {stateTaxRate > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center gap-3">
                       <Landmark size={18} className="text-emerald-600"/>
                       <div>
                          <div className="text-xs text-emerald-800 font-bold">State Tax Benefit</div>
                          <div className="text-[10px] text-emerald-700">
                             Your contributions could save you <span className="font-bold">{formatCurrency(annualTaxSavings)}</span> in state taxes annually.*
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>

           {/* Strategy Tip */}
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-3">
              <div className="p-2 bg-white rounded-full shadow-sm h-fit text-cyan-600">
                 <TrendingUp size={16} />
              </div>
              <div>
                 <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">{strategy.title}</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">{strategy.text}</p>
              </div>
           </div>
        </div>

        {/* Right: Visualization */}
        <div className="xl:col-span-7 space-y-6">
           
           {/* Status Card */}
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
                       ? `Projected savings cover ${Math.round(((projection.projectedTotalCost + projection.finalBalance)/projection.projectedTotalCost)*100)}% of the ${formatCurrency(projection.projectedTotalCost)} estimated cost.` 
                       : "You are on track to cover all qualified expenses with a surplus!"}
                 </p>
                 
                 {isShortfall && (
                    <div className="mt-4 bg-white/60 p-3 rounded-lg flex items-center gap-3">
                       <div className="text-xs font-bold text-orange-800 uppercase shrink-0">To Close Gap</div>
                       <ArrowRight size={14} className="text-orange-400"/>
                       <div className="text-sm font-bold text-orange-900">
                          Increase monthly savings to {formatCurrency(Math.ceil(projection.requiredMonthly))}
                       </div>
                    </div>
                 )}
              </div>
              
              <div className="text-right bg-white/50 p-4 rounded-xl min-w-[140px]">
                 <div className="text-xs font-bold uppercase opacity-60 mb-1">Ending Balance</div>
                 <div className={`text-2xl font-bold ${isShortfall ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {formatCurrency(projection.finalBalance)}
                 </div>
                 {projection.finalBalance > 0 && (
                    <div className="text-[10px] opacity-60 mt-1">Leftover for Grad School</div>
                 )}
              </div>
           </div>

           {/* Chart */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">529 Balance vs. Tuition Costs</h3>
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
                       <ReferenceLine x={collegeStartAge} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'College Starts', position: 'insideTopLeft', fill: '#f59e0b', fontSize: 10, angle: -90 }} />
                       
                       <Area 
                          type="monotone" 
                          dataKey="balance" 
                          name="529 Balance" 
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
                          strokeDasharray="5 5"
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Simple Stats Grid */}
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total Principal</div>
                 <div className="text-lg font-bold text-slate-700">
                    {formatCurrency(projection.data[projection.data.length-1].totalContributed)}
                 </div>
              </div>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Tax-Free Growth</div>
                 <div className="text-lg font-bold text-emerald-600">
                    {formatCurrency(Math.max(0, projection.data[projection.data.length-1].balance + projection.projectedTotalCost - projection.data[projection.data.length-1].totalContributed))}
                 </div>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total Cost</div>
                 <div className="text-lg font-bold text-slate-700">
                    {formatCurrency(projection.projectedTotalCost)}
                 </div>
              </div>
           </div>

           {/* Why use a 529 Plan? - Re-added */}
           <div className="bg-cyan-50 rounded-xl p-5 border border-cyan-100">
              <h4 className="text-sm font-bold text-cyan-800 mb-3 flex items-center gap-2">
                <BookOpen size={16} /> Why use a 529 Plan?
              </h4>
              <ul className="space-y-2 text-xs text-cyan-900">
                 <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 text-cyan-600 shrink-0" />
                    <span><strong>Tax-Free Growth:</strong> Investment earnings are not subject to federal tax.</span>
                 </li>
                 <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 text-cyan-600 shrink-0" />
                    <span><strong>Tax-Free Withdrawals:</strong> No tax when used for qualified education expenses (tuition, books, room & board).</span>
                 </li>
                 <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 text-cyan-600 shrink-0" />
                    <span><strong>State Benefits:</strong> Over 30 states offer tax deductions or credits for contributions.</span>
                 </li>
                 <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 text-cyan-600 shrink-0" />
                    <span><strong>Flexibility:</strong> Funds can be transferred to another family member if the beneficiary decides not to go to college.</span>
                 </li>
              </ul>
           </div>
           
           <div className="text-[10px] text-slate-400 italic">
             * State tax savings are estimates. Rules vary by state (e.g., some states tax out-of-state plans). 529 funds must be used for qualified expenses to remain tax-free.
           </div>
        </div>
      </div>
    </div>
  );
};
