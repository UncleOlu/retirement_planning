
import React, { useState, useMemo, useEffect } from 'react';
import { calculateAmortization, analyzeRefinance, RefinanceOption } from '../../lib/mortgageMath';
import { TrendingDown, Home, Percent, CheckCircle, XCircle, Unlock, Lock, History, Shield, Building2, Landmark, Receipt, Info } from 'lucide-react';
import { CURRENCIES } from '../../lib/constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { CurrencyInput } from '../ui/CurrencyInput';

interface MortgageCalculatorProps {
  currencyCode: 'USD' | 'EUR' | 'GBP';
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ currencyCode }) => {
  const currencyConfig = CURRENCIES[currencyCode];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(val);

  // --- Main Loan State ---
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  
  const [loanAmount, setLoanAmount] = useState(300000); 
  const [propertyValue, setPropertyValue] = useState(375000); // Default to 80% LTV for 300k loan
  
  const [interestRate, setInterestRate] = useState(6.5);
  const [termYears, setTermYears] = useState(30);
  
  // Escrow / Fees State
  const [taxMode, setTaxMode] = useState<'percent' | 'fixed'>('percent');
  const [taxRate, setTaxRate] = useState(1.1); // National Avg approx 1.1%
  const [taxFixed, setTaxFixed] = useState(0);

  const [insuranceMode, setInsuranceMode] = useState<'percent' | 'fixed'>('percent');
  const [insuranceRate, setInsuranceRate] = useState(0.5); // National Avg approx 0.5%
  const [insuranceFixed, setInsuranceFixed] = useState(0);

  const [hoaFees, setHoaFees] = useState(0);
  
  const [pmiMode, setPmiMode] = useState<'percent' | 'fixed'>('percent');
  const [pmiRate, setPmiRate] = useState(0.5); // Approx 0.5% - 1%
  const [pmiFixed, setPmiFixed] = useState(0);
  const [includePmi, setIncludePmi] = useState(false);

  // Existing Mortgage Specifics
  const [monthsPaid, setMonthsPaid] = useState(24); // 2 years in

  // Extra Payments
  const [extraPayment, setExtraPayment] = useState(0);
  
  // --- Refinance State ---
  // propertyValue is shared now
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

  // Auto-detect PMI need based on LTV
  const ltv = (loanAmount / propertyValue) * 100;
  useEffect(() => {
    if (ltv > 80) {
      setIncludePmi(true);
    } else {
      setIncludePmi(false);
    }
  }, [loanAmount, propertyValue]);

  // --- Logic Helpers ---
  const toggleTaxMode = (newMode: 'percent' | 'fixed') => {
    if (newMode === taxMode) return;
    if (newMode === 'fixed') {
      setTaxFixed(Math.round((propertyValue * (taxRate / 100)) / 12));
    } else {
      if (propertyValue > 0) setTaxRate(Number((((taxFixed * 12) / propertyValue) * 100).toFixed(2)));
    }
    setTaxMode(newMode);
  };

  const toggleInsuranceMode = (newMode: 'percent' | 'fixed') => {
    if (newMode === insuranceMode) return;
    if (newMode === 'fixed') {
      setInsuranceFixed(Math.round((propertyValue * (insuranceRate / 100)) / 12));
    } else {
      if (propertyValue > 0) setInsuranceRate(Number((((insuranceFixed * 12) / propertyValue) * 100).toFixed(2)));
    }
    setInsuranceMode(newMode);
  };

  const togglePmiMode = (newMode: 'percent' | 'fixed') => {
    if (newMode === pmiMode) return;
    if (newMode === 'fixed') {
      setPmiFixed(Math.round((loanAmount * (pmiRate / 100)) / 12));
    } else {
      if (loanAmount > 0) setPmiRate(Number((((pmiFixed * 12) / loanAmount) * 100).toFixed(2)));
    }
    setPmiMode(newMode);
  };

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

  // 4. Escrow Monthly Costs
  const monthlyTax = taxMode === 'percent' ? (propertyValue * (taxRate / 100)) / 12 : taxFixed;
  const monthlyInsurance = insuranceMode === 'percent' ? (propertyValue * (insuranceRate / 100)) / 12 : insuranceFixed;
  // PMI is usually based on original loan amount, though strictly it drops off.
  const monthlyPmi = includePmi 
    ? (pmiMode === 'percent' ? (loanAmount * (pmiRate / 100)) / 12 : pmiFixed) 
    : 0;
  
  const monthlyFeesTotal = monthlyTax + monthlyInsurance + monthlyPmi + hoaFees;
  const totalMonthlyPayment = baseSchedule.monthlyPayment + monthlyFeesTotal;

  // 5. Savings Analysis (From "Now" onwards)
  const projectedTotalCost = projectedSchedule.totalPaid;
  const savingsInterest = baseSchedule.totalPaid - projectedTotalCost; // Total Lifetime Savings
  const timeSavedMonths = baseSchedule.payoffMonths - projectedSchedule.payoffMonths;

  // 6. Refinance Analysis
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

  const currentLtv = (currentBalance / propertyValue) * 100;

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
                    <label className="text-xs font-bold text-slate-700">Property Value</label>
                    <CurrencyInput 
                      value={propertyValue}
                      onChange={setPropertyValue}
                      symbol={currencyConfig.symbol}
                      className="w-full p-2 pl-8 border border-slate-200 rounded font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {mode === 'existing' ? 'Original Loan Amount' : 'Loan Amount'}
                    </label>
                    <CurrencyInput 
                      value={loanAmount}
                      onChange={setLoanAmount}
                      symbol={currencyConfig.symbol}
                      className="w-full p-2 pl-8 border border-slate-200 rounded font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                    <div className="flex justify-between text-[10px]">
                       <span className="text-slate-400">LTV: {ltv.toFixed(0)}%</span>
                       {ltv > 80 && <span className="text-orange-500 font-bold">PMI Likely</span>}
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Interest Rate (%)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.125"
                        value={interestRate}
                        onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
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
                   <div className="space-y-1 animate-fade-in col-span-1 md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
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

               {/* --- Taxes & Fees Section --- */}
              <div className="bg-slate-50 border-t border-slate-100 p-6">
                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                   <Landmark size={14} /> Taxes, Insurance & Fees
                 </h4>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Property Tax */}
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                             <Landmark size={12} className="text-slate-400" /> Prop. Tax
                          </label>
                          <div className="flex bg-slate-200/60 rounded p-0.5">
                            <button 
                              onClick={() => toggleTaxMode('percent')} 
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${taxMode === 'percent' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                            >
                              %
                            </button>
                            <button 
                              onClick={() => toggleTaxMode('fixed')} 
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${taxMode === 'fixed' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                            >
                              $
                            </button>
                          </div>
                       </div>
                       
                       {taxMode === 'percent' ? (
                         <div className="flex items-center gap-2">
                            <input 
                               type="range" min="0" max="4" step="0.1"
                               value={taxRate}
                               onChange={(e) => setTaxRate(Number(e.target.value))}
                               className="flex-1 h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-500"
                            />
                            <div className="w-16 relative">
                               <input 
                                  type="number" step="0.1"
                                  value={taxRate}
                                  onChange={(e) => setTaxRate(Number(e.target.value))}
                                  className="w-full p-1 pr-4 text-xs border border-slate-300 rounded text-right bg-white text-slate-800"
                               />
                               <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                            </div>
                         </div>
                       ) : (
                         <div className="relative">
                            <CurrencyInput 
                              value={taxFixed}
                              onChange={setTaxFixed}
                              symbol={currencyConfig.symbol}
                              className="w-full p-1.5 pl-6 text-xs font-bold border border-slate-300 rounded text-slate-800 bg-white"
                              placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">/mo</span>
                         </div>
                       )}
                       <div className="text-right text-[10px] text-slate-500">
                         {taxMode === 'percent' ? formatCurrency(monthlyTax) + '/mo' : `approx ${(taxRate).toFixed(2)}%`}
                       </div>
                    </div>

                    {/* Home Insurance */}
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                             <Shield size={12} className="text-slate-400" /> Insurance
                          </label>
                          <div className="flex bg-slate-200/60 rounded p-0.5">
                            <button 
                              onClick={() => toggleInsuranceMode('percent')} 
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${insuranceMode === 'percent' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                            >
                              %
                            </button>
                            <button 
                              onClick={() => toggleInsuranceMode('fixed')} 
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${insuranceMode === 'fixed' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                            >
                              $
                            </button>
                          </div>
                       </div>
                       
                       {insuranceMode === 'percent' ? (
                         <div className="flex items-center gap-2">
                            <input 
                               type="range" min="0" max="2" step="0.05"
                               value={insuranceRate}
                               onChange={(e) => setInsuranceRate(Number(e.target.value))}
                               className="flex-1 h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-500"
                            />
                            <div className="w-16 relative">
                               <input 
                                  type="number" step="0.05"
                                  value={insuranceRate}
                                  onChange={(e) => setInsuranceRate(Number(e.target.value))}
                                  className="w-full p-1 pr-4 text-xs border border-slate-300 rounded text-right bg-white text-slate-800"
                               />
                               <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                            </div>
                         </div>
                       ) : (
                         <div className="relative">
                            <CurrencyInput 
                              value={insuranceFixed}
                              onChange={setInsuranceFixed}
                              symbol={currencyConfig.symbol}
                              className="w-full p-1.5 pl-6 text-xs font-bold border border-slate-300 rounded text-slate-800 bg-white"
                              placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">/mo</span>
                         </div>
                       )}
                       <div className="text-right text-[10px] text-slate-500">
                         {insuranceMode === 'percent' ? formatCurrency(monthlyInsurance) + '/mo' : `approx ${(insuranceRate).toFixed(2)}%`}
                       </div>
                    </div>

                    {/* PMI */}
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <input 
                               type="checkbox" 
                               checked={includePmi} 
                               onChange={(e) => setIncludePmi(e.target.checked)}
                               className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3 bg-white"
                             />
                             <label className="text-xs font-bold text-slate-700">PMI</label>
                          </div>
                          {includePmi && (
                            <div className="flex bg-slate-200/60 rounded p-0.5">
                              <button 
                                onClick={() => togglePmiMode('percent')} 
                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${pmiMode === 'percent' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                              >
                                %
                              </button>
                              <button 
                                onClick={() => togglePmiMode('fixed')} 
                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${pmiMode === 'fixed' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                              >
                                $
                              </button>
                            </div>
                          )}
                       </div>
                       
                       <div className={`${!includePmi ? 'opacity-50 pointer-events-none' : ''}`}>
                         {pmiMode === 'percent' ? (
                           <div className="flex items-center gap-2">
                              <input 
                                 type="range" min="0.1" max="2" step="0.1"
                                 value={pmiRate}
                                 onChange={(e) => setPmiRate(Number(e.target.value))}
                                 className="flex-1 h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-orange-500"
                              />
                              <div className="w-16 relative">
                                 <input 
                                    type="number" step="0.1"
                                    value={pmiRate}
                                    onChange={(e) => setPmiRate(Number(e.target.value))}
                                    className="w-full p-1 pr-4 text-xs border border-slate-300 rounded text-right bg-white text-slate-800"
                                 />
                                 <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                              </div>
                           </div>
                         ) : (
                           <div className="relative">
                              <CurrencyInput 
                                value={pmiFixed}
                                onChange={setPmiFixed}
                                symbol={currencyConfig.symbol}
                                className="w-full p-1.5 pl-6 text-xs font-bold border border-slate-300 rounded text-slate-800 bg-white"
                                placeholder="0"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">/mo</span>
                           </div>
                         )}
                       </div>
                       <div className={`text-right text-[10px] text-slate-500 ${!includePmi ? 'opacity-0' : ''}`}>
                         {pmiMode === 'percent' ? formatCurrency(monthlyPmi) + '/mo' : `approx ${(pmiRate).toFixed(2)}%`}
                       </div>
                    </div>

                    {/* HOA */}
                    <div className="space-y-2">
                       <div className="flex justify-between items-baseline">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                             <Building2 size={12} className="text-slate-400" /> HOA
                          </label>
                       </div>
                       <div className="relative">
                          <CurrencyInput 
                             value={hoaFees}
                             onChange={setHoaFees}
                             symbol={currencyConfig.symbol}
                             className="w-full p-1.5 pl-6 text-xs font-bold border border-slate-200 rounded text-slate-700 bg-white"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">/mo</span>
                       </div>
                    </div>

                 </div>
              </div>

              {/* Results Bar */}
              <div className="bg-slate-100 px-6 py-5 border-t border-slate-200">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4">
                     <div>
                       <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Monthly Payment</div>
                       <div className="text-3xl font-bold text-indigo-900">{formatCurrency(totalMonthlyPayment)}</div>
                       <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className="flex items-center gap-1 text-slate-600">
                             <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                             P&I: {formatCurrency(baseSchedule.monthlyPayment)}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                             <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                             Escrow: {formatCurrency(monthlyFeesTotal)}
                          </span>
                       </div>
                     </div>
                     
                     {mode === 'existing' && (
                        <div className="text-right w-full md:w-auto">
                           <div className="text-xs text-slate-500 uppercase font-bold">Current Loan Balance</div>
                           <div className="text-xl font-bold text-slate-700">{formatCurrency(currentBalance)}</div>
                           
                           {/* Equity Bar */}
                           <div className="mt-2 w-full md:w-40 ml-auto">
                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                                  <div className="bg-emerald-500 h-full" style={{ width: `${100 - currentLtv}%` }}></div>
                              </div>
                              <div className="text-[10px] text-slate-500 text-right mt-0.5">
                                 {(100 - currentLtv).toFixed(0)}% Equity
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
              </div>
           </div>

           {/* Extra Payments */}
           <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                   <TrendingDown size={18} /> Extra Principal
                </h3>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8 items-center">
                 <div className="w-full md:w-1/2 space-y-3">
                    <label className="text-sm font-bold text-emerald-900">Add Monthly Payment</label>
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
                      Move slider to see interest savings...
                   </div>
                 )}
              </div>
           </div>

           {/* Chart */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[320px] flex flex-col">
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Loan Balance Projection</h3>
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
                 
                 {/* LTV */}
                 <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                       <span className="text-xs text-slate-400 font-medium">Current LTV</span>
                       <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${currentLtv > 80 ? 'text-orange-500' : 'text-emerald-500'}`}>
                             {currentLtv.toFixed(1)}%
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-1 pt-2 border-t border-slate-50">
                     <label className="text-xs font-bold text-slate-500 mb-1 block">Refi Closing Costs</label>
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
                             className="w-full p-1.5 pl-6 text-xs font-bold border border-slate-200 rounded text-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
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
                           className="w-16 p-1 text-xs font-bold border border-slate-300 rounded bg-white text-slate-700"
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
                             <div className="text-[10px] text-slate-400 uppercase font-bold">Total New Payment</div>
                             {/* Display P&I + Fees */}
                             <div className="text-lg font-bold text-slate-800">{formatCurrency(scenario.newMonthlyPayment + monthlyFeesTotal)}</div>
                             
                             {/* Savings is still based on P&I comparison for correctness */}
                             <div className={`text-xs font-medium mt-1 flex items-center gap-1 ${scenario.monthlySavings > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {scenario.monthlySavings > 0 ? <TrendingDown size={12} /> : <TrendingDown size={12} className="rotate-180" />}
                                {scenario.monthlySavings > 0 ? 'Save' : 'Pay'} {formatCurrency(Math.abs(scenario.monthlySavings))} <span className="text-slate-400 text-[9px]">(P&I)</span>
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
