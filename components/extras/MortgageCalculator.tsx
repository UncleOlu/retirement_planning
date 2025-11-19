
import React, { useState, useMemo, useEffect } from 'react';
import { calculateAmortization, analyzeRefinance, RefinanceOption } from '../../lib/mortgageMath';
import { DollarSign, Euro, PoundSterling, TrendingDown, Home, Percent, CheckCircle, XCircle, Unlock, Lock, History } from 'lucide-react';
import { CURRENCIES } from '../../lib/constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

interface MortgageCalculatorProps {
  currencyCode: 'USD' | 'EUR' | 'GBP';
}

// Helper Component for formatted inputs
const CurrencyInput = ({ 
  value, 
  onChange, 
  className,
  symbol
}: { 
  value: number; 
  onChange: (val: number) => void; 
  className?: string;
  symbol?: string;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digits (keeping it integer-only for simplicity in this context)
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (!raw) {
      onChange(0);
    } else {
      onChange(parseInt(raw, 10));
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="numeric"
        // Display empty if 0 to allow cleaner typing from scratch
        value={value === 0 ? '' : value.toLocaleString('en-US')} 
        onChange={handleChange}
        placeholder="0"
        className={className}
      />
      {symbol && (
         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
            {symbol}
         </span>
      )}
    </div>
  );
};

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ currencyCode }) => {
  const currencyConfig = CURRENCIES[currencyCode];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(val);

  // --- Main Loan State ---
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  
  const [loanAmount, setLoanAmount] = useState(300000); // "Original Principal" if existing
  const [interestRate, setInterestRate] = useState(6.5);
  const [termYears, setTermYears] = useState(30);
  
  // Existing Mortgage Specifics
  const [monthsPaid, setMonthsPaid] = useState(24); // 2 years in

  // Extra Payments
  const [extraPayment, setExtraPayment] = useState(0);
  
  // --- Refinance State ---
  const [homeValue, setHomeValue] = useState(400000);
  const [refiRate, setRefiRate] = useState(5.5);
  const [closingCosts, setClosingCosts] = useState(5000);
  
  // Advanced Refinance
  const [overrideCurrentRate, setOverrideCurrentRate] = useState(false);
  const [currentRateOverride, setCurrentRateOverride] = useState(interestRate);

  // Sync override rate with main rate unless overridden
  useEffect(() => {
    if (!overrideCurrentRate) {
      setCurrentRateOverride(interestRate);
    }
  }, [interestRate, overrideCurrentRate]);

  // --- Calculations ---

  // 1. Base Schedule (The "Agreement")
  const baseSchedule = useMemo(() => {
    return calculateAmortization(loanAmount, interestRate, termYears, 0, 0);
  }, [loanAmount, interestRate, termYears]);

  // 2. Current Status (Where are we now?)
  const effectiveMonthsPaid = mode === 'new' ? 0 : monthsPaid;
  
  const currentStatus = useMemo(() => {
    if (effectiveMonthsPaid >= baseSchedule.schedule.length) {
      return baseSchedule.schedule[baseSchedule.schedule.length - 1];
    }
    return baseSchedule.schedule[effectiveMonthsPaid] || { 
      balance: loanAmount, 
      totalPaid: 0, 
      principal: 0, 
      interest: 0, 
      totalInterest: 0, 
      month: 0 
    };
  }, [baseSchedule, effectiveMonthsPaid, loanAmount]);

  const currentBalance = currentStatus.balance;
  const principalPaidSoFar = loanAmount - currentBalance;

  // 3. Future Projection (The "Reality" with Extra Payments)
  const projectedSchedule = useMemo(() => {
    return calculateAmortization(
      loanAmount, 
      interestRate, 
      termYears, 
      extraPayment, 
      effectiveMonthsPaid // Start extra payments from "Now"
    );
  }, [loanAmount, interestRate, termYears, extraPayment, effectiveMonthsPaid]);

  // 4. Savings Analysis (From "Now" onwards)
  const projectedTotalCost = projectedSchedule.totalPaid;
  const savingsInterest = baseSchedule.totalPaid - projectedTotalCost; // Total Lifetime Savings
  const timeSavedMonths = baseSchedule.payoffMonths - projectedSchedule.payoffMonths;

  // 5. Refinance Analysis
  const refiOptions: RefinanceOption[] = [
    { termYears: 30, rate: refiRate, closingCosts, rollInCosts: false },
    { termYears: 20, rate: Math.max(2, refiRate - 0.25), closingCosts, rollInCosts: false },
    { termYears: 15, rate: Math.max(2, refiRate - 0.5), closingCosts, rollInCosts: false },
  ];

  const refiAnalysis = useMemo(() => {
    const remainingMonthsBase = baseSchedule.payoffMonths - effectiveMonthsPaid;
    const remainingTotalCostBase = baseSchedule.monthlyPayment * remainingMonthsBase;
    
    let baselinePayment = baseSchedule.monthlyPayment;
    let baselineTotalCost = remainingTotalCostBase;

    if (overrideCurrentRate && currentRateOverride !== interestRate) {
       const reAmortizedPayment = (currentBalance * (currentRateOverride/1200)) / (1 - Math.pow(1 + currentRateOverride/1200, -remainingMonthsBase));
       baselinePayment = reAmortizedPayment;
       baselineTotalCost = reAmortizedPayment * remainingMonthsBase;
    }

    return analyzeRefinance(
      currentBalance, 
      baselinePayment, 
      baselineTotalCost, 
      refiOptions
    );
  }, [currentBalance, baseSchedule, effectiveMonthsPaid, refiOptions, overrideCurrentRate, currentRateOverride, interestRate]);

  // Chart Data
  const chartData = useMemo(() => {
    const data = [];
    const maxLen = Math.max(baseSchedule.schedule.length, projectedSchedule.schedule.length);
    const step = Math.max(1, Math.floor(maxLen / 60));
    
    for (let i = 0; i < maxLen; i += step) {
       const baseItem = baseSchedule.schedule[i] || { balance: 0 };
       const projItem = projectedSchedule.schedule[i] || { balance: 0 };
       
       data.push({
         month: i,
         year: (i / 12).toFixed(1),
         Standard: baseItem.balance,
         Accelerated: projItem.balance,
         isFuture: i > effectiveMonthsPaid
       });
    }
    return data;
  }, [baseSchedule, projectedSchedule, effectiveMonthsPaid]);

  const ltv = (currentBalance / homeValue) * 100;

  const handleLtvChange = (newLtv: number) => {
    setHomeValue(Math.round(currentBalance / (newLtv / 100)));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
         <div className="relative z-10">
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
              <Home className="text-indigo-300" /> Mortgage & Refinance Analyzer
            </h2>
            <p className="text-indigo-200 max-w-2xl text-sm">
              Optimize your payoff strategy. Switch between planning a new loan or tracking your existing mortgage to see the impact of extra payments.
            </p>
         </div>
         <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
            <Home size={300} />
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Calculator */}
        <div className="xl:col-span-7 space-y-6">
           
           {/* Loan Configuration */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* Toggle Tabs */}
              <div className="flex border-b border-slate-100">
                 <button 
                   onClick={() => setMode('new')}
                   className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'new' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                 >
                   Plan New Loan
                 </button>
                 <button 
                   onClick={() => setMode('existing')}
                   className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${mode === 'existing' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                 >
                   <History size={14} /> Existing Mortgage
                 </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {mode === 'existing' ? 'Original Loan Amount' : 'Loan Amount'}
                    </label>
                    <CurrencyInput 
                      value={loanAmount}
                      onChange={setLoanAmount}
                      symbol={currencyConfig.symbol}
                      className="w-full p-2 pl-8 border border-slate-200 rounded font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Interest Rate (%)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.125"
                        value={interestRate}
                        onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {mode === 'existing' ? 'Original Term' : 'Term'} (Years)
                    </label>
                    <select 
                      value={termYears}
                      onChange={(e) => setTermYears(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value={10}>10 Years</option>
                      <option value={15}>15 Years</option>
                      <option value={20}>20 Years</option>
                      <option value={25}>25 Years</option>
                      <option value={30}>30 Years</option>
                    </select>
                 </div>

                 {mode === 'existing' && (
                   <div className="space-y-1 animate-fade-in">
                      <label className="text-xs font-bold text-slate-700 flex justify-between">
                        Time Since Start
                        <span className="text-indigo-600">{(monthsPaid/12).toFixed(1)} Years</span>
                      </label>
                      <input 
                        type="range"
                        min="0"
                        max={termYears * 12}
                        value={monthsPaid}
                        onChange={(e) => setMonthsPaid(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Just Started</span>
                        <span>{termYears} Years</span>
                      </div>
                   </div>
                 )}
              </div>

              {/* Results Bar */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                  <div className="flex justify-between items-end mb-4">
                     <div>
                       <div className="text-xs text-slate-400 uppercase font-bold">Monthly Payment (P&I)</div>
                       <div className="text-3xl font-bold text-slate-800">{formatCurrency(baseSchedule.monthlyPayment)}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase font-bold">Current Balance</div>
                        <div className="text-xl font-bold text-slate-700">{formatCurrency(currentBalance)}</div>
                     </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {mode === 'existing' && (
                    <div className="space-y-1">
                       <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                          <span>Paid: {formatCurrency(principalPaidSoFar)}</span>
                          <span>{Math.round((1 - (currentBalance/loanAmount))*100)}% Equity</span>
                       </div>
                       <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                          <div className="bg-indigo-500 h-full" style={{ width: `${(1 - (currentBalance/loanAmount))*100}%` }}></div>
                       </div>
                    </div>
                  )}
              </div>
           </div>

           {/* Extra Payments */}
           <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                   <TrendingDown size={18} /> Extra Payments
                </h3>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8 items-center">
                 <div className="w-full md:w-1/2 space-y-3">
                    <label className="text-sm font-bold text-emerald-900">Add Monthly Principal</label>
                    <div className="flex items-center gap-4">
                       <input 
                         type="range" 
                         min="0" 
                         max={baseSchedule.monthlyPayment} 
                         step="50"
                         value={extraPayment}
                         onChange={(e) => setExtraPayment(Number(e.target.value))}
                         className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                       />
                       <div className="w-24">
                         <CurrencyInput 
                           value={extraPayment}
                           onChange={setExtraPayment}
                           symbol={currencyConfig.symbol}
                           className="w-full p-1.5 pl-6 text-sm font-bold border border-emerald-300 rounded text-emerald-800 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                         />
                       </div>
                    </div>
                    {extraPayment > 0 && mode === 'existing' && (
                      <div className="text-[10px] text-emerald-700">
                        Applied starting from <strong>Month {monthsPaid + 1}</strong> (Next Payment).
                      </div>
                    )}
                 </div>

                 {extraPayment > 0 ? (
                   <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                         <div className="text-xs text-emerald-600 font-bold uppercase">Interest Saved</div>
                         <div className="text-lg font-bold text-emerald-800">{formatCurrency(savingsInterest)}</div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                         <div className="text-xs text-emerald-600 font-bold uppercase">Time Saved</div>
                         <div className="text-lg font-bold text-emerald-800">{(timeSavedMonths/12).toFixed(1)} Years</div>
                      </div>
                   </div>
                 ) : (
                   <div className="w-full md:w-1/2 text-center text-emerald-600/60 text-sm italic">
                      Move slider to see savings...
                   </div>
                 )}
              </div>
           </div>

           {/* Chart */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[320px] flex flex-col">
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Balance Projection</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    formatter={(val: number) => formatCurrency(val)}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="Standard" stroke="#6366f1" fillOpacity={1} fill="url(#colorStd)" strokeWidth={2} />
                  {extraPayment > 0 && (
                    <Area type="monotone" dataKey="Accelerated" stroke="#10b981" fillOpacity={1} fill="url(#colorAcc)" strokeWidth={2} />
                  )}
                  {mode === 'existing' && (
                     <ReferenceLine x={effectiveMonthsPaid/12} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Today', position: 'insideTop', fontSize: 10, fill: '#64748b' }} />
                  )}
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* RIGHT COLUMN: Refinance */}
        <div className="xl:col-span-5 space-y-6">
           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <Percent className="text-amber-500" /> Refinance Explorer
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                   Compare your existing loan (above) against current market rates.
                </p>
              </div>

              <div className="space-y-5 mb-6 bg-white p-5 rounded-xl border border-slate-200">
                 
                 {/* Home Value & LTV */}
                 <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Est. Home Value</label>
                    <CurrencyInput 
                      value={homeValue} 
                      onChange={setHomeValue} 
                      symbol={currencyConfig.symbol}
                      className="w-full p-2 pl-8 border border-slate-200 rounded font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input 
                         type="range" 
                         min={currentBalance} 
                         max={currentBalance * 2}
                         step={5000}
                         value={homeValue}
                         onChange={(e) => setHomeValue(Number(e.target.value))}
                         className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                       <span className="text-xs text-slate-400 font-medium">Loan-to-Value (LTV)</span>
                       <div className="flex items-center gap-2">
                          <input 
                             type="range"
                             min="10" max="120"
                             value={ltv}
                             onChange={(e) => handleLtvChange(Number(e.target.value))}
                             className="w-20 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                          <span className={`text-xs font-bold ${ltv > 80 ? 'text-orange-500' : 'text-emerald-500'}`}>
                             {ltv.toFixed(0)}%
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-1 pt-2 border-t border-slate-50">
                     <label className="text-xs font-bold text-slate-500 mb-1 block">Closing Costs</label>
                     <div className="flex items-center gap-4">
                         <div className="flex-1">
                           <input 
                            type="range" 
                            min="0" max="15000" step="500"
                            value={closingCosts}
                            onChange={(e) => setClosingCosts(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-400"
                          />
                         </div>
                         <div className="w-28">
                           <CurrencyInput 
                             value={closingCosts}
                             onChange={setClosingCosts}
                             symbol={currencyConfig.symbol}
                             className="w-full p-1.5 pl-6 text-xs font-bold border border-slate-200 rounded text-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                           />
                         </div>
                     </div>
                 </div>
                 
                 {/* Rate Config */}
                 <div className="space-y-3 pt-2 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-bold text-slate-500">Refinance Rate (New)</label>
                       <span className="text-lg font-bold text-amber-600">{refiRate}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="2" max="10" step="0.125"
                      value={refiRate}
                      onChange={(e) => setRefiRate(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                 </div>

                 {/* Advanced: Override Current Rate */}
                 <div className="pt-2">
                   <button 
                     onClick={() => setOverrideCurrentRate(!overrideCurrentRate)}
                     className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition mb-2"
                   >
                      {overrideCurrentRate ? <Unlock size={10} /> : <Lock size={10} />}
                      {overrideCurrentRate ? 'Reset to Loan Rate' : 'Override Current Rate'}
                   </button>
                   
                   {overrideCurrentRate && (
                      <div className="flex items-center gap-3 animate-fade-in bg-slate-50 p-2 rounded border border-slate-100">
                         <span className="text-xs text-slate-500">Current:</span>
                         <input 
                           type="number" 
                           step="0.125"
                           value={currentRateOverride}
                           onChange={(e) => setCurrentRateOverride(parseFloat(e.target.value) || 0)}
                           className="w-16 p-1 text-xs font-bold border border-slate-300 rounded"
                         />
                         <span className="text-xs text-slate-500">%</span>
                      </div>
                   )}
                 </div>

              </div>

              {/* Analysis Output */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                 {refiAnalysis.map((scenario) => (
                    <div key={scenario.option.termYears} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition hover:border-indigo-300 hover:shadow-md">
                       <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                          <span className="font-bold text-slate-700 text-sm">{scenario.option.termYears}-Year Fixed</span>
                          <div className="flex flex-col items-end">
                             <span className="text-xs font-bold text-slate-600">{scenario.option.rate.toFixed(2)}%</span>
                             <span className="text-[10px] text-slate-400">APR</span>
                          </div>
                       </div>
                       
                       <div className="p-4 grid grid-cols-2 gap-4">
                          <div>
                             <div className="text-[10px] text-slate-400 uppercase font-bold">New Payment</div>
                             <div className="text-lg font-bold text-slate-800">{formatCurrency(scenario.newMonthlyPayment)}</div>
                             <div className={`text-xs font-medium mt-1 flex items-center gap-1 ${scenario.monthlySavings > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {scenario.monthlySavings > 0 ? <TrendingDown size={12} /> : <TrendingDown size={12} className="rotate-180" />}
                                {scenario.monthlySavings > 0 ? 'Save' : 'Pay'} {formatCurrency(Math.abs(scenario.monthlySavings))}
                             </div>
                          </div>

                          <div className="text-right">
                             <div className="text-[10px] text-slate-400 uppercase font-bold">Break Even</div>
                             {scenario.monthlySavings > 0 ? (
                                <div className="text-lg font-bold text-indigo-600">
                                   {(scenario.breakEvenMonths / 12).toFixed(1)} <span className="text-sm text-indigo-400 font-normal">years</span>
                                </div>
                             ) : (
                                <div className="text-sm text-slate-400 italic mt-1">Never</div>
                             )}
                          </div>
                       </div>

                       <div className={`px-4 py-2 text-xs flex items-center gap-2 ${scenario.isViable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {scenario.isViable ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {scenario.isViable 
                             ? `Lifetime Savings: ${formatCurrency(scenario.lifetimeSavings)}`
                             : `Loss: ${formatCurrency(Math.abs(scenario.lifetimeSavings))}`
                          }
                       </div>
                    </div>
                 ))}
              </div>

           </div>
        </div>

      </div>
    </div>
  );
};
