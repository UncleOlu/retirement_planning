
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
     } else if (country === 'CA') {
       setAnnualCollegeCost(7000 + 13000); // Avg Tuition + Living
       setStateTaxRate(0);
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
  const CA_RESP_LIFETIME = 50000; // Lifetime RESP Limit
  
  const projection = useMemo(() => {
    const data = [];
    const yearsUntilCollege = Math.max(0, collegeStartAge - childAge);
    const duration = (country === 'UK' || country === 'CA') ? 3 : 4;
    
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
          
          // Canadian CESG Logic (Basic 20% Grant)
          if (country === 'CA') {
             const eligibleForGrant = Math.min(annualContrib, 2500);
             const grant = eligibleForGrant * 0.20;
             // Limit check roughly ($7200 lifetime max, simplified here)
             if (totalContributed < CA_RESP_LIFETIME) {
                balance += grant;
             }
          }
          
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
  
  // Strategy Logic
  const getStrategyTip = () => {
    if (country === 'CA') return { title: "CESG Grant", text: "Canada contributes 20% on the first $2,500/yr. Free money!" };
    if (projection.yearsUntilCollege > 12) return { title: "Strategy: Aggressive Growth", text: "100% Equity focus." };
    if (projection.yearsUntilCollege > 5) return { title: "Strategy: Balanced Growth", text: "60/40 Stock/Bond mix." };
    return { title: "Strategy: Capital Preservation", text: "Focus on stable value funds." };
  };
  const strategy = getStrategyTip();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-cyan-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
         {/* ... (Header Content) ... */}
         <div className="relative z-10"><h2 className="text-2xl font-bold flex items-center gap-3 mb-2"><GraduationCap className="text-cyan-300" /> {config.labels.educationAccount} Planner</h2></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Controls */}
        <div className="xl:col-span-5 space-y-6">
           {/* ... (Inputs) ... */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><TrendingUp size={16} /> Student Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Current Age</label><input type="number" value={childAge} onChange={(e) => setChildAge(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none bg-white" /></div>
                 <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Uni/College Start</label><input type="number" value={collegeStartAge} onChange={(e) => setCollegeStartAge(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none bg-white" /></div>
              </div>
           </div>
           
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><PiggyBank size={16} /> Funding Plan</h3>
              <div className="space-y-4">
                 <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Current Balance</label><CurrencyInput value={currentSavings} onChange={setCurrentSavings} symbol={currencyConfig.symbol} className="w-full p-2 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none bg-white" /></div>
                 <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Monthly Contribution</label><CurrencyInput value={monthlyContribution} onChange={setMonthlyContribution} symbol={currencyConfig.symbol} className="w-full p-2 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none bg-white" /></div>
                 
                 {country === 'CA' && (
                    <div className="bg-cyan-50 text-cyan-800 text-xs p-3 rounded-lg border border-cyan-100 flex gap-2">
                       <Info size={14} className="shrink-0 mt-0.5" />
                       We automatically add the 20% CESG grant to your projection (up to annual limits).
                    </div>
                 )}
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
                    <h3 className={`text-lg font-bold ${isShortfall ? 'text-orange-800' : 'text-emerald-800'}`}>{isShortfall ? 'Funding Gap Detected' : 'Fully Funded!'}</h3>
                 </div>
                 <p className={`text-sm leading-relaxed ${isShortfall ? 'text-orange-700' : 'text-emerald-700'}`}>
                    {isShortfall ? `Projected coverage: ${Math.round(((projection.projectedTotalCost + projection.finalBalance)/projection.projectedTotalCost)*100)}%` : "Surplus predicted."}
                 </p>
              </div>
              <div className="text-right bg-white/50 p-4 rounded-xl min-w-[140px] border border-white/50">
                 <div className="text-xs font-bold uppercase opacity-60 mb-1">Ending Balance</div>
                 <div className={`text-2xl font-bold ${isShortfall ? 'text-orange-600' : 'text-emerald-600'}`}>{formatCurrency(projection.finalBalance)}</div>
              </div>
           </div>

           {/* Chart - UPDATED CONTAINER */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Savings Projection vs. Costs</h3>
              {/* Added min-w-0 to prevent flex collapse */}
              <div className="flex-1 w-full min-h-[100px] min-w-0 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projection.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <defs>
                          <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="age" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                       <YAxis tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                       <RechartsTooltip 
                          formatter={(val: number) => formatCurrency(val)}
                          labelFormatter={(label) => `Age ${label}`}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       />
                       <Legend />
                       <ReferenceLine x={collegeStartAge} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Studies Start', position: 'insideTopLeft', fill: '#f59e0b', fontSize: 10, angle: -90 }} />
                       <Area type="monotone" dataKey="totalContributed" name="Principal" stroke="#94a3b8" fill="none" strokeWidth={1} strokeDasharray="3 3"/>
                       <Area type="monotone" dataKey="balance" name="Total Value" stroke="#06b6d4" fill="url(#gradBalance)" strokeWidth={3} />
                       <Area type="monotone" dataKey="yearlyCost" name="Annual Cost" stroke="#ef4444" fill="none" strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
