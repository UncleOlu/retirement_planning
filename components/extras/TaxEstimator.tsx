
import React, { useState, useMemo } from 'react';
import { CURRENCIES } from '../../lib/constants';
import { CurrencyCode } from '../../lib/types';
import { calculateUSFederalTax, STANDARD_DEDUCTION_2025 } from '../../lib/taxMath';
import { CurrencyInput } from './ExtrasDashboard';
import { Percent, Briefcase, AlertCircle, FileCheck, Calculator, Info, CheckCircle2, AlertTriangle, Landmark } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface TaxEstimatorProps {
  currency: CurrencyCode;
}

export const TaxEstimator: React.FC<TaxEstimatorProps> = ({ currency }) => {
  const [grossIncome, setGrossIncome] = useState(95000);
  const [preTaxDeductions, setPreTaxDeductions] = useState(5000);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('single');
  
  // Deduction State
  const [deductionMethod, setDeductionMethod] = useState<'standard' | 'itemized'>('standard');
  const [salt, setSalt] = useState(0); // State & Local Taxes
  const [mortgageInterest, setMortgageInterest] = useState(0);
  const [charity, setCharity] = useState(0);
  const [medical, setMedical] = useState(0);

  const currencyConfig = CURRENCIES[currency];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);

  // --- Calculation Logic ---
  
  // 1. AGI (needed for medical floor)
  const agi = Math.max(0, grossIncome - preTaxDeductions);

  // 2. Itemized Calculation
  // UPDATED: SALT Cap is now $40,000 per "Big Beautiful Bill" specs
  const SALT_CAP = 40000;
  const saltDeductible = Math.min(salt, SALT_CAP);
  
  const medicalFloor = agi * 0.075; // 7.5% of AGI
  const medicalDeductible = Math.max(0, medical - medicalFloor);
  
  const totalItemized = saltDeductible + mortgageInterest + charity + medicalDeductible;

  // 3. Standard Amount
  const standardAmount = filingStatus === 'single' ? STANDARD_DEDUCTION_2025.single : STANDARD_DEDUCTION_2025.married;

  // 4. Determine Used Deduction
  const effectiveDeduction = deductionMethod === 'itemized' ? totalItemized : undefined; // If undefined, math lib uses standard

  // 5. Run Main Calc
  const result = useMemo(() => {
    return calculateUSFederalTax(grossIncome, preTaxDeductions, filingStatus, effectiveDeduction);
  }, [grossIncome, preTaxDeductions, filingStatus, effectiveDeduction]);

  const chartData = [
    { name: 'Net Pay', value: result.netPay, color: '#10b981' }, // Emerald
    { name: 'Federal Tax', value: result.federalTax, color: '#6366f1' }, // Indigo
    { name: 'FICA (SS/Med)', value: result.ficaTax, color: '#f59e0b' }, // Amber
    { name: 'Pre-Tax Savings', value: preTaxDeductions, color: '#3b82f6' }, // Blue
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
                  Estimate your 2025 federal tax liability based on the "Big Beautiful Bill" proposal.
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
          
          {/* 1. Income Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Income & Status</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Annual Gross Income</label>
                <CurrencyInput 
                  value={grossIncome}
                  onChange={setGrossIncome}
                  symbol={currencyConfig.symbol}
                  className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  Pre-Tax Contributions (401k, HSA)
                  <span className="text-slate-400 font-normal">Reduces AGI</span>
                </label>
                <CurrencyInput 
                  value={preTaxDeductions}
                  onChange={setPreTaxDeductions}
                  symbol={currencyConfig.symbol}
                  className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-700">Filing Status</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setFilingStatus('single')}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${filingStatus === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Single
                  </button>
                  <button 
                    onClick={() => setFilingStatus('married')}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${filingStatus === 'married' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Married (Joint)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Deduction Strategy Section */}
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
                         <span className="text-[10px] text-slate-400 font-normal">&gt; 7.5% AGI ({formatCurrency(medicalFloor)})</span>
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
               <div className="text-xs text-slate-500 mt-1">Total Tax / Gross Income</div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
               <div className="text-xs text-slate-400 uppercase font-bold mb-1">Marginal Tax Bracket</div>
               <div className="text-3xl font-bold text-slate-700">{result.marginalRate}%</div>
               <div className="text-xs text-slate-500 mt-1">Top rate applied to income</div>
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
                        <span className="text-xs font-medium text-slate-500">Taxable Income</span>
                        <span className="text-xs font-bold text-slate-700">{formatCurrency(result.taxableIncome)}</span>
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
                 {grossIncome > 176100 && <div className="text-[10px] text-amber-600">Capped at wage base</div>}
               </div>
               <div>
                 <div className="text-xs text-slate-400">Medicare (1.45%+)</div>
                 <div className="font-mono font-medium text-slate-700">{formatCurrency(result.medicareTax)}</div>
                 {grossIncome > (filingStatus === 'single' ? 200000 : 250000) && (
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
               <strong>Note:</strong> This tool applies 2025 projected tax brackets and a <strong>$40,000 SALT Cap</strong>. Actual tax liability depends on final legislation, specific tax credits (e.g., CTC), and Alternative Minimum Tax (AMT) applicability. Consult a tax professional.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};
