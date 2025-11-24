
import React, { useState, useMemo } from 'react';
import { CURRENCIES } from '../../lib/constants';
import { CurrencyCode } from '../../lib/types';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DecimalInput } from '../ui/DecimalInput';
import { Flame, TrendingUp, Target, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

interface FireCalculatorProps {
  currency: CurrencyCode;
}

export const FireCalculator: React.FC<FireCalculatorProps> = ({ currency }) => {
  const [currentAge, setCurrentAge] = useState(30);
  const [netWorth, setNetWorth] = useState(100000);
  const [annualIncome, setAnnualIncome] = useState(80000); // Net Income
  const [annualSpending, setAnnualSpending] = useState(50000);
  const [growthRate, setGrowthRate] = useState(7);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  const currencyConfig = CURRENCIES[currency];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);
  
  // Calculations
  const annualSavings = Math.max(0, annualIncome - annualSpending);
  const savingsRate = annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0;
  const fireNumber = annualSpending / (withdrawalRate / 100);
  
  const projection = useMemo(() => {
    const data = [];
    let balance = netWorth;
    let age = currentAge;
    let reachedFire = false;
    let fireAge = null;

    // Project for up to 50 years or until death logic (let's say age 90 cap)
    const maxAge = 90;
    
    while (age <= maxAge) {
      const isFire = balance >= fireNumber;
      if (isFire && !reachedFire) {
        reachedFire = true;
        fireAge = age;
      }

      data.push({
        age,
        netWorth: Math.round(balance),
        fireNumber: Math.round(fireNumber),
        isFire
      });

      // Growth logic
      balance = balance * (1 + growthRate / 100) + annualSavings;
      age++;
    }

    return { data, fireAge };
  }, [netWorth, annualSavings, growthRate, fireNumber, currentAge]);

  const yearsToFire = projection.fireAge ? projection.fireAge - currentAge : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
            <Flame className="text-orange-500" /> FIRE Calculator
          </h2>
          <p className="text-slate-400 max-w-2xl text-sm">
            Financial Independence, Retire Early. Calculate exactly when your investment income will cover your expenses.
          </p>
        </div>
        <div className="absolute right-0 top-0 opacity-20 transform translate-x-1/4 -translate-y-1/4">
          <Flame size={250} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Controls */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Your Numbers</h3>
             
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Current Age</label>
                      <input 
                        type="number" 
                        value={currentAge}
                        onChange={(e) => setCurrentAge(Number(e.target.value))}
                        className="w-full p-2 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Current Net Worth</label>
                      <CurrencyInput 
                         value={netWorth}
                         onChange={setNetWorth}
                         symbol={currencyConfig.symbol}
                         className="w-full p-2 pl-6 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                      />
                   </div>
                </div>
                {/* ... (Existing Inputs) ... */}
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-700">Annual Net Income (After Tax)</label>
                   <CurrencyInput value={annualIncome} onChange={setAnnualIncome} symbol={currencyConfig.symbol} className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-700">Annual Spending</label>
                   <CurrencyInput value={annualSpending} onChange={setAnnualSpending} symbol={currencyConfig.symbol} className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50" />
                </div>
             </div>
          </div>
          {/* ... (Assumptions Panel) ... */}
        </div>

        {/* Results & Chart */}
        <div className="xl:col-span-8 space-y-6">
           
           {/* KPI Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 shadow-sm">
                 <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase mb-1">
                    <Target size={14} /> FIRE Number
                 </div>
                 <div className="text-2xl font-bold text-emerald-900">{formatCurrency(fireNumber)}</div>
                 <div className="text-xs text-emerald-600 mt-1">Portfolio needed</div>
              </div>
              {/* ... (Other KPIs) ... */}
              <div className={`p-5 rounded-xl border shadow-sm ${projection.fireAge ? 'bg-white border-slate-200' : 'bg-red-50 border-red-100'}`}>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1"><Calendar size={14} /> Time to FIRE</div>
                 <div className="text-2xl font-bold text-slate-800">{projection.fireAge ? <span>{yearsToFire} <span className="text-sm font-normal text-slate-400">years</span></span> : <span className="text-red-600 text-lg">Never</span>}</div>
              </div>
           </div>

           {/* Chart - UPDATED CONTAINER */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Road to Independence</h3>
              {/* Added min-w-0 to fix width issues */}
              <div className="flex-1 w-full min-h-[100px] min-w-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projection.data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                       dataKey="age" 
                       type="number" 
                       domain={[currentAge, Math.min(currentAge + 50, 90)]}
                       tick={{ fontSize: 10, fill: '#94a3b8' }} 
                       tickLine={false} 
                       axisLine={false}
                       label={{ value: 'Age', position: 'insideBottomRight', offset: -10, fill: '#cbd5e1', fontSize: 10 }}
                    />
                    <YAxis 
                       tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}k`} 
                       tick={{ fontSize: 10, fill: '#94a3b8' }} 
                       tickLine={false} 
                       axisLine={false} 
                       width={40}
                    />
                    <RechartsTooltip 
                      formatter={(val: number) => formatCurrency(val)}
                      labelFormatter={(label) => `Age ${label}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <ReferenceLine y={fireNumber} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'FIRE Goal', position: 'insideTopRight', fill: '#10b981', fontSize: 10 }} />
                    <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="fireNumber" name="Target" stroke="#10b981" strokeWidth={1} strokeOpacity={0.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};
