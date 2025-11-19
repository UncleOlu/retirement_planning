
import React, { useState, useMemo } from 'react';
import { CURRENCIES } from '../../lib/constants';
import { CurrencyCode } from '../../lib/types';
import { CurrencyInput } from './ExtrasDashboard';
import { GraduationCap, TrendingUp, BookOpen, PiggyBank, AlertTriangle, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

interface EducationCalculatorProps {
  currency: CurrencyCode;
}

export const EducationCalculator: React.FC<EducationCalculatorProps> = ({ currency }) => {
  const [childAge, setChildAge] = useState(2);
  const [collegeStartAge, setCollegeStartAge] = useState(18);
  const [currentSavings, setCurrentSavings] = useState(5000);
  const [monthlyContribution, setMonthlyContribution] = useState(300);
  const [annualCollegeCost, setAnnualCollegeCost] = useState(25000); // In today's dollars
  const [educationInflation, setEducationInflation] = useState(5); // Percent
  const [investmentReturn, setInvestmentReturn] = useState(7); // Percent

  const currencyConfig = CURRENCIES[currency];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);

  const projection = useMemo(() => {
    const data = [];
    const yearsUntilCollege = collegeStartAge - childAge;
    const durationOfCollege = 4;
    
    let balance = currentSavings;
    let totalContributed = currentSavings;
    
    // We simulate until end of college
    const endAge = collegeStartAge + durationOfCollege;
    
    let maxCost = 0;

    for (let age = childAge; age <= endAge; age++) {
       const yearIndex = age - childAge;
       const isCollegeYears = age >= collegeStartAge && age < collegeStartAge + durationOfCollege;
       
       // Calculate cost for this year (compounded by education inflation)
       let yearlyCost = 0;
       if (isCollegeYears) {
          yearlyCost = annualCollegeCost * Math.pow(1 + educationInflation/100, yearIndex);
       }
       if (yearlyCost > maxCost) maxCost = yearlyCost;

       data.push({
          age,
          balance: Math.round(balance),
          yearlyCost: Math.round(yearlyCost),
          totalContributed: Math.round(totalContributed)
       });

       // End of year logic
       // 1. Growth
       balance = balance * (1 + investmentReturn/100);
       
       // 2. Contributions (only before/during college, though usually people stop during? let's assume continue)
       // Let's assume contributions stop when college starts or user continues?
       // Standard planner: Contributions continue until end of college or specific stop. 
       // Let's assume they contribute until the end of college for simplicity, or just util start.
       // Let's say contributions stop at graduation (endAge).
       if (age < endAge) {
          const annualContrib = monthlyContribution * 12;
          balance += annualContrib;
          totalContributed += annualContrib;
       }

       // 3. Tuitions Paid (Drawdown)
       // We pay tuition at beginning of year usually, but simplified to end of year logic or mid-year
       // Let's subtract cost from balance.
       if (isCollegeYears) {
          balance -= yearlyCost; 
       }
    }

    // Total Cost in Future Dollars
    const futureTotalCost = annualCollegeCost * Math.pow(1 + educationInflation/100, yearsUntilCollege) * 4; // Approx

    return { data, finalBalance: balance, yearsUntilCollege };
  }, [childAge, collegeStartAge, currentSavings, monthlyContribution, annualCollegeCost, educationInflation, investmentReturn]);

  const isShortfall = projection.finalBalance < 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-cyan-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
            <GraduationCap className="text-cyan-300" /> 529 Education Planner
          </h2>
          <p className="text-cyan-100 max-w-2xl text-sm">
            Plan for the rising cost of education. Utilize tax-advantaged 529 plans to grow your savings tax-free for qualified expenses.
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
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Student & Savings</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Child's Current Age</label>
                    <input 
                      type="number" 
                      min="0" max="18"
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">College Start Age</label>
                    <input 
                      type="number" 
                      min={childAge + 1} max="25"
                      value={collegeStartAge}
                      onChange={(e) => setCollegeStartAge(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
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
                       className="w-full p-2 pl-8 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Monthly Contribution</label>
                    <CurrencyInput 
                       value={monthlyContribution}
                       onChange={setMonthlyContribution}
                       symbol={currencyConfig.symbol}
                       className="w-full p-2 pl-8 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                 </div>
              </div>
           </div>

           {/* Costs & Rates */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Costs & Growth</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Annual College Cost (Today's $)</label>
                    <CurrencyInput 
                       value={annualCollegeCost}
                       onChange={setAnnualCollegeCost}
                       symbol={currencyConfig.symbol}
                       className="w-full p-2 pl-8 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400">Avg: Public In-State $11k, Private $40k+</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700">Tuition Inflation (%)</label>
                       <input 
                          type="number" step="0.1"
                          value={educationInflation}
                          onChange={(e) => setEducationInflation(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700">Inv. Return (%)</label>
                       <input 
                          type="number" step="0.1"
                          value={investmentReturn}
                          onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* 529 Info Card */}
           <div className="bg-cyan-50 p-5 rounded-xl border border-cyan-100">
              <h4 className="text-sm font-bold text-cyan-800 flex items-center gap-2 mb-3">
                 <BookOpen size={16} /> Why use a 529 Plan?
              </h4>
              <ul className="space-y-2">
                 <li className="flex items-start gap-2 text-xs text-cyan-900">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-cyan-600" />
                    <span><strong>Tax-Free Growth:</strong> Earnings grow federal tax-free and are not taxed when withdrawn for qualified education expenses.</span>
                 </li>
                 <li className="flex items-start gap-2 text-xs text-cyan-900">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-cyan-600" />
                    <span><strong>Flexible:</strong> Use for tuition, books, room & board. Can be transferred to another family member if the child doesn't go to college.</span>
                 </li>
                 <li className="flex items-start gap-2 text-xs text-cyan-900">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-cyan-600" />
                    <span><strong>State Benefits:</strong> Many states offer tax deductions or credits for contributions.</span>
                 </li>
              </ul>
           </div>
        </div>

        {/* Right: Visualization */}
        <div className="xl:col-span-7 space-y-6">
           
           {/* Status Card */}
           <div className={`p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6 ${isShortfall ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    {isShortfall ? <AlertTriangle className="text-orange-500"/> : <CheckCircle className="text-emerald-500"/>}
                    <h3 className={`text-lg font-bold ${isShortfall ? 'text-orange-800' : 'text-emerald-800'}`}>
                       {isShortfall ? 'Projected Shortfall' : 'Fully Funded'}
                    </h3>
                 </div>
                 <p className={`text-sm ${isShortfall ? 'text-orange-700' : 'text-emerald-700'}`}>
                    {isShortfall 
                       ? "Your projected savings won't cover the full 4 years." 
                       : "You are on track to cover all estimated expenses!"}
                 </p>
              </div>
              <div className="text-right">
                 <div className="text-xs font-bold uppercase opacity-60">Ending Balance</div>
                 <div className={`text-3xl font-bold ${isShortfall ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {formatCurrency(projection.finalBalance)}
                 </div>
              </div>
           </div>

           {/* Chart */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Savings vs. Cost Trajectory</h3>
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
                          name="Annual Tuition Cost" 
                          stroke="#ef4444" 
                          fill="none" 
                          strokeWidth={2} 
                          strokeDasharray="5 5"
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Simple Stats */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div className="text-xs text-slate-400 uppercase font-bold">Total Contributions</div>
                 <div className="text-lg font-bold text-slate-700">
                    {formatCurrency(currentSavings + (monthlyContribution * 12 * (collegeStartAge + 4 - childAge)))}
                 </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div className="text-xs text-slate-400 uppercase font-bold">Total Projected Cost</div>
                 <div className="text-lg font-bold text-slate-700">
                    {formatCurrency(
                       annualCollegeCost * Math.pow(1 + educationInflation/100, projection.yearsUntilCollege) * 4
                    )}
                 </div>
                 <div className="text-[10px] text-slate-400">For 4 years</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
