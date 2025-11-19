import React, { useState, useMemo } from 'react';
import { CURRENCIES } from '../../lib/constants';
import { CurrencyCode } from '../../lib/types';
import { calculateUSFederalTax, STANDARD_DEDUCTION_2025 } from '../../lib/taxMath';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DecimalInput } from '../ui/DecimalInput';
import { Percent, Briefcase, FileCheck, Calculator, Info, CheckCircle2, AlertTriangle, Landmark, Users, TrendingUp, Plus, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface TaxEstimatorProps {
  currency: CurrencyCode;
}

export const TaxEstimator: React.FC<TaxEstimatorProps> = ({ currency }) => {
  const [grossWages, setGrossWages] = useState(95000);
  const [householdSize, setHouseholdSize] = useState(1);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married' | 'headOfHousehold'>('single');

  // Additional Income
  const [shortTermGains, setShortTermGains] = useState(0);
  const [longTermGains, setLongTermGains] = useState(0);
  const [otherIncome, setOtherIncome] = useState(0); // Can be negative for losses

  // Pre-Tax
  const [preTaxDeductions, setPreTaxDeductions] = useState(5000);
  const [preTaxMode, setPreTaxMode] = useState<'fixed' | 'percent'>('fixed');
  const [preTaxPercent, setPreTaxPercent] = useState(5);
  
  // Deduction State
  const [deductionMethod, setDeductionMethod] = useState<'standard' | 'itemized'>('standard');
  const [salt, setSalt] = useState(0); // State & Local Taxes
  const [mortgageInterest, setMortgageInterest] = useState(0);
  const [charity, setCharity] = useState(0);
  const [medical, setMedical] = useState(0);

  const currencyConfig = CURRENCIES[currency];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);
  
  // --- Calculation Logic ---
  
  // 1. Normalize Pre-tax to Dollars
  const preTaxDollarAmount = preTaxMode === 'fixed' 
    ? preTaxDeductions 
    : (grossWages * (preTaxPercent / 100));

  // 2. Total Ordinary Income (Wages + STCG + Other)
  // Note: Other Income can be negative (losses), but usually limited ($3k cap for net capital loss, etc). 
  // For estimator simplicity, we allow direct addition/subtraction but clamp AGI at 0 in taxMath.
  const otherOrdinaryIncome = shortTermGains + otherIncome;

  // 3. Itemized Calculation
  // UPDATED: SALT Cap is now $40,000 per "Big Beautiful Bill" specs
  const SALT_CAP = 40000;
  const saltDeductible = Math.min(salt, SALT_CAP);
  
  // AGI for Medical Floor calc (Standard AGI definition usually includes all income)
  const estimatedAGI = Math.max(0, grossWages + otherOrdinaryIncome + longTermGains - preTaxDollarAmount);
  
  const medicalFloor = estimatedAGI * 0.075; // 7.5% of AGI
  const medicalDeductible = Math.max(0, medical - medicalFloor);
  
  const totalItemized = saltDeductible + mortgageInterest + charity + medicalDeductible;

  // 4. Standard Amount
  const standardAmount = STANDARD_DEDUCTION_2025[filingStatus];

  // 5. Determine Used Deduction
  const effectiveDeduction = deductionMethod === 'itemized' ? totalItemized : undefined; // If undefined, math lib uses standard

  // 6. Run Main Calc
  const result = useMemo(() => {
    return calculateUSFederalTax(
      grossWages, 
      otherOrdinaryIncome, 
      longTermGains, 
      preTaxDollarAmount, 
      filingStatus, 
      effectiveDeduction
    );
  }, [grossWages, otherOrdinaryIncome, longTermGains, preTaxDollarAmount, filingStatus, effectiveDeduction]);

  const chartData = [
    { name: 'Net Pay', value: result.netPay, color: '#10b981' }, // Emerald
    { name: 'Federal Tax', value: result.federalTax, color: '#6366f1' }, // Indigo
    { name: 'Cap Gains Tax', value: result.capitalGainsTax, color: '#8b5cf6' }, // Violet
    { name: 'FICA', value: result.ficaTax, color: '#f59e0b' }, // Amber
    { name: 'Savings', value: preTaxDollarAmount, color: '#3b82f6' }, // Blue
  ].filter(d => d.value > 0);

  const betterOption = totalItemized > standardAmount ? 'itemized' : 'standard';
  const difference = Math.abs(totalItemized - standardAmount);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
             <div>
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
                  <Briefcase className="text-indigo-300" /> Federal Tax Estimator
                </h2>
                <p className="text-indigo-200 max-w-2xl text-sm">
                  Estimate your 2025 federal tax liability based on the "Big Beautiful Bill" proposal. Includes Capital Gains and Itemized Deductions.
                </p>
             </div>
             <div className="flex bg-indigo-800/50 border border-indigo-700 backdrop-blur-sm px-3 py-1.5 rounded-lg items-center gap-2">
               <Landmark size={16} className="text-emerald-400" />
               <span className="text-xs font-bold text-indigo-100">New Legislation Applied</span>
             </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Percent size={250} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Income & Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Filing Status & Wages</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Filing Status</label>
                  <select 
                    value={filingStatus}
                    onChange={(e) => setFilingStatus(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married (Joint)</option>
                    <option value="headOfHousehold">Head of Household</option>
                  </select>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                     <Users size={12} /> Household Size
                   </label>
                   <input 
                      type="number" 
                      min="1" max="10"
                      value={householdSize}
                      onChange={(e) => setHouseholdSize(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                   />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Gross Wages (W-2)</label>
                <CurrencyInput 
                  value={grossWages}
                  onChange={setGrossWages}
                  symbol={currencyConfig.symbol}
                  className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-bold text-slate-700 flex gap-1">
                     Pre-Tax Contributions <span className="font-normal text-slate-400">(401k, HSA)</span>
                   </label>
                   <div className="flex bg-slate-100 rounded p-0.5">
                      <button 
                        onClick={() => setPreTaxMode('fixed')} 
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${preTaxMode === 'fixed' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                      >
                        $
                      </button>
                      <button 
                        onClick={() => setPreTaxMode('percent')} 
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${preTaxMode === 'percent' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                      >
                        %
                      </button>
                   </div>
                </div>

                {preTaxMode === 'fixed' ? (
                  <CurrencyInput 
                    value={preTaxDeductions}
                    onChange={setPreTaxDeductions}
                    symbol={currencyConfig.symbol}
                    className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                  />
                ) : (
                  <div className="relative">
                     <DecimalInput 
                       value={preTaxPercent}
                       onChange={setPreTaxPercent}
                       className="w-full p-3 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                       rightSymbol="%"
                     />
                     <div className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-slate-400 mr-2">
                        {formatCurrency(preTaxDollarAmount)}
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>

           {/* 2. Capital Gains & Other Income */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
               <TrendingUp size={16} /> Investment & Other Income
             </h3>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Long Term Cap Gains</label>
                      <CurrencyInput 
                         value={longTermGains}
                         onChange={setLongTermGains}
                         symbol={currencyConfig.symbol}
                         className="w-full p-2 pl-6 text-sm border border-slate-200 rounded text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                      />
                      <p className="text-[10px] text-slate-400">Taxed at 0%, 15%, or 20%</p>
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Short Term Cap Gains</label>
                      <CurrencyInput 
                         value={shortTermGains}
                         onChange={setShortTermGains}
                         symbol={currencyConfig.symbol}
                         className="w-full p-2 pl-6 text-sm border border-slate-200 rounded text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                      />
                      <p className="text-[10px] text-slate-400">Taxed as Ordinary Income</p>
                   </div>
                </div>
                
                <div className="space-y-1 pt-2 border-t border-slate-50">
                   <label className="text-xs font-bold text-slate-700">Other Income / (Loss)</label>
                   <div className="relative">
                      <input 
                         type="text"
                         value={otherIncome === 0 ? '' : otherIncome}
                         onChange={(e) => {
                           // Allow negative numbers
                           const val = parseInt(e.target.value || '0', 10);
                           if (!isNaN(val)) setOtherIncome(val);
                         }}
                         placeholder="0"
                         className="w-full p-2 pl-8 text-sm border border-slate-200 rounded text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
                        {currencyConfig.symbol}
                      </span>
                   </div>
                   <p className="text-[10px] text-slate-400">Business income, rental losses, etc.</p>
                </div>
             </div>
           </div>

          {/* 3. Deduction Strategy Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-bold text-slate-500 uppercase">Deductions</h3>
               {deductionMethod === 'itemized' && totalItemized < standardAmount && (
                 <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                   <AlertTriangle size={10} /> Standard is better
                 </span>
               )}
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
               <button 
                 onClick={() => setDeductionMethod('standard')}
                 className={`flex-1 py-2 text-xs font-bold rounded-md transition ${deductionMethod === 'standard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Standard ({formatCurrency(standardAmount)})
               </button>
               <button 
                 onClick={() => setDeductionMethod('itemized')}
                 className={`flex-1 py-2 text-xs font-bold rounded-md transition ${deductionMethod === 'itemized' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Itemized
               </button>
            </div>

            {deductionMethod === 'itemized' ? (
              <div className="space-y-4 animate-fade-in">
                 <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 space-y-4">
                    {/* SALT */}
                    <div className="space-y-1">
                       <div className="flex justify-between items-baseline">
                         <label className="text-xs font-bold text-slate-700">State & Local Taxes (SALT)</label>
                         <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100 px-1.5 rounded">Cap: $40k</span>
                       </div>
                       <div className="flex gap-2">
                          <CurrencyInput 
                             value={salt}
                             onChange={setSalt}
                             symbol={currencyConfig.symbol}
                             className="w-full p-2 pl-6 text-sm border border-indigo-200 rounded text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          />
                          <div className="w-20 flex items-center justify-center bg-indigo-100 rounded text-xs font-bold text-indigo-700 border border-indigo-200">
                            {formatCurrency(saltDeductible)}
                          </div>
                       </div>
                    </div>

                    {/* Mortgage */}
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700">Mortgage Interest</label>
                       <CurrencyInput 
                          value={mortgageInterest}
                          onChange={setMortgageInterest}
                          symbol={currencyConfig.symbol}
                          className="w-full p-2 pl-6 text-sm border border-indigo-200 rounded text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                       />
                    </div>

                    {/* Charity */}
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700">Charitable Donations</label>
                       <CurrencyInput 
                          value={charity}
                          onChange={setCharity}
                          symbol={currencyConfig.symbol}
                          className="w-full p-2 pl-6 text-sm border border-indigo-200 rounded text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                       />
                    </div>

                    {/* Medical */}
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-700 flex justify-between">
                         Medical Expenses
                         <span className="text-[10px] text-slate-400 font-normal">&gt; 7.5% AGI</span>
                       </label>
                       <div className="flex gap-2">
                          <CurrencyInput 
                             value={medical}
                             onChange={setMedical}
                             symbol={currencyConfig.symbol}
                             className="w-full p-2 pl-6 text-sm border border-indigo-200 rounded text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          />
                          <div className="w-20 flex items-center justify-center bg-indigo-100 rounded text-xs font-bold text-indigo-700 border border-indigo-200">
                            {formatCurrency(medicalDeductible)}
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Comparison */}
                 <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">Total Itemized</div>
                    <div className={`text-xl font-bold ${totalItemized > standardAmount ? 'text-emerald-600' : 'text-slate-400'}`}>
                       {formatCurrency(totalItemized)}
                    </div>
                 </div>
                 
                 {/* Recommendation Alert */}
                 <div className={`text-xs p-2 rounded border flex items-center gap-2 ${
                    betterOption === 'itemized' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                      : 'bg-amber-50 border-amber-100 text-amber-700'
                 }`}>
                    {betterOption === 'itemized' ? <CheckCircle2 size={14} /> : <Info size={14} />}
                    {betterOption === 'itemized' 
                      ? <span>Itemizing saves you taxes on an extra <strong>{formatCurrency(difference)}</strong>.</span>
                      : <span>Standard deduction is higher by <strong>{formatCurrency(difference)}</strong>.</span>
                    }
                 </div>
              </div>
            ) : (
               <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="mb-2">Using the 2025 Projected Standard Deduction:</p>
                  <div className="text-2xl font-bold text-slate-800 mb-2">{formatCurrency(standardAmount)}</div>
                  <p className="text-xs text-slate-400">Standard Deduction is usually best unless you have significant SALT, Mortgage Interest, or Charity expenses.</p>
               </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
               <div className="text-xs text-slate-400 uppercase font-bold mb-1">Effective Tax Rate</div>
               <div className="text-3xl font-bold text-indigo-600">{result.effectiveRate.toFixed(1)}%</div>
               <div className="text-xs text-slate-500 mt-1">Total Tax / Total Income</div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
               <div className="text-xs text-slate-400 uppercase font-bold mb-1">Marginal Ordinary Rate</div>
               <div className="text-3xl font-bold text-slate-700">{result.marginalRate}%</div>
               <div className="text-xs text-slate-500 mt-1">Top rate on ordinary income</div>
             </div>
          </div>

          {/* Breakdown Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-700 mb-6">Estimated 2025 Liability Breakdown</h3>
             
             <div className="flex flex-col sm:flex-row gap-8 items-center">
               <div className="w-48 h-48 shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Net Pay</div>
                    <div className="text-sm font-bold text-emerald-600">{formatCurrency(result.netPay)}</div>
                  </div>
               </div>

               <div className="flex-1 w-full space-y-3">
                  {chartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between group">
                       <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-sm font-medium text-slate-600">{item.name}</span>
                       </div>
                       <div className="text-sm font-bold text-slate-800">
                         {formatCurrency(item.value)}
                       </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-slate-100 pt-2 mt-4">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-slate-500">Taxable Ordinary Income</span>
                        <span className="text-xs font-bold text-slate-700">{formatCurrency(result.taxableOrdinaryIncome)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-500">Deduction Used</span>
                        <span className="text-xs font-bold text-indigo-600">-{formatCurrency(result.deductionUsed)}</span>
                     </div>
                  </div>
               </div>
             </div>
          </div>

          {/* Detailed FICA Breakdown */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">FICA Details</h4>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <div className="text-xs text-slate-400">Social Security (6.2%)</div>
                 <div className="font-mono font-medium text-slate-700">{formatCurrency(result.socialSecurityTax)}</div>
                 {grossWages > 176100 && <div className="text-[10px] text-amber-600">Capped at wage base</div>}
               </div>
               <div>
                 <div className="text-xs text-slate-400">Medicare (1.45%+)</div>
                 <div className="font-mono font-medium text-slate-700">{formatCurrency(result.medicareTax)}</div>
                 {grossWages > (filingStatus === 'married' ? 250000 : 200000) && (
                   <div className="text-[10px] text-indigo-600 flex items-center gap-1">
                     <Info size={8} /> Includes 0.9% Addl. Tax
                   </div>
                 )}
               </div>
             </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-3">
             <Calculator className="text-slate-400 shrink-0" size={20} />
             <p className="text-xs text-slate-500 leading-relaxed">
               <strong>Note:</strong> This tool applies 2025 projected tax brackets and a <strong>$40,000 SALT Cap</strong>. Actual tax liability depends on final legislation, specific tax credits (e.g., Child Tax Credit, which varies by household size), and Alternative Minimum Tax (AMT). Consult a tax professional.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};