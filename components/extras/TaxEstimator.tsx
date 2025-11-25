

import React, { useState, useMemo } from 'react';
import { CURRENCIES, COUNTRY_CONFIG } from '../../lib/constants';
import { CurrencyCode, CountryCode } from '../../lib/types';
import { calculateUSFederalTax, calculateUKTax, calculateCanadaTax, STANDARD_DEDUCTION_2025 } from '../../lib/taxMath';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DecimalInput } from '../ui/DecimalInput';
import { Percent, Briefcase, FileCheck, Calculator, Info, CheckCircle2, AlertTriangle, Landmark, Users, TrendingUp, Plus, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface TaxEstimatorProps {
  currency: CurrencyCode;
  country?: CountryCode;
}

export const TaxEstimator: React.FC<TaxEstimatorProps> = ({ currency, country = 'US' }) => {
  if (country === 'UK') {
    return <UKTaxEstimator currency={currency} />;
  }
  if (country === 'CA') {
    return <CanadaTaxEstimator currency={currency} />;
  }
  return <USTaxEstimator currency={currency} />;
};

const USTaxEstimator: React.FC<{ currency: CurrencyCode }> = ({ currency }) => {
  const [grossWages, setGrossWages] = useState(95000);
  const [householdSize, setHouseholdSize] = useState(1);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married' | 'headOfHousehold'>('single');

  // Additional Income
  const [shortTermGains, setShortTermGains] = useState(0);
  const [longTermGains, setLongTermGains] = useState(0);
  const [otherIncome, setOtherIncome] = useState(0);

  // Pre-Tax
  const [preTaxDeductions, setPreTaxDeductions] = useState(5000);
  const [preTaxMode, setPreTaxMode] = useState<'fixed' | 'percent'>('fixed');
  const [preTaxPercent, setPreTaxPercent] = useState(5);
  
  // Deduction State
  const [deductionMethod, setDeductionMethod] = useState<'standard' | 'itemized'>('standard');
  const [salt, setSalt] = useState(0); 
  const [mortgageInterest, setMortgageInterest] = useState(0);
  const [charity, setCharity] = useState(0);
  const [medical, setMedical] = useState(0);

  const currencyConfig = CURRENCIES[currency];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);
  
  // Calc Logic
  const preTaxDollarAmount = preTaxMode === 'fixed' ? preTaxDeductions : (grossWages * (preTaxPercent / 100));
  const otherOrdinaryIncome = shortTermGains + otherIncome;
  const SALT_CAP = 40000;
  const saltDeductible = Math.min(salt, SALT_CAP);
  const estimatedAGI = Math.max(0, grossWages + otherOrdinaryIncome + longTermGains - preTaxDollarAmount);
  const medicalFloor = estimatedAGI * 0.075;
  const medicalDeductible = Math.max(0, medical - medicalFloor);
  const totalItemized = saltDeductible + mortgageInterest + charity + medicalDeductible;
  const standardAmount = STANDARD_DEDUCTION_2025[filingStatus];
  const effectiveDeduction = deductionMethod === 'itemized' ? totalItemized : undefined;

  const result = useMemo(() => {
    return calculateUSFederalTax(grossWages, otherOrdinaryIncome, longTermGains, preTaxDollarAmount, filingStatus, effectiveDeduction);
  }, [grossWages, otherOrdinaryIncome, longTermGains, preTaxDollarAmount, filingStatus, effectiveDeduction]);

  const chartData = [
    { name: 'Net Pay', value: result.netPay, color: '#10b981' },
    { name: 'Federal Tax', value: result.federalTax, color: '#6366f1' },
    { name: 'Cap Gains Tax', value: result.capitalGainsTax, color: '#8b5cf6' },
    { name: 'FICA', value: result.ficaTax, color: '#f59e0b' },
    { name: 'Savings', value: preTaxDollarAmount, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const betterOption = totalItemized > standardAmount ? 'itemized' : 'standard';
  const difference = Math.abs(totalItemized - standardAmount);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
           <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
             <Briefcase className="text-indigo-300" /> Federal Tax Estimator (US)
           </h2>
           <p className="text-indigo-200 max-w-2xl text-sm">
             Estimate 2025 federal liability including Capital Gains and Itemized Deductions.
           </p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Percent size={250} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Filing Status & Wages</h3>
            <div className="space-y-4">
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Filing Status</label>
                  <select value={filingStatus} onChange={(e) => setFilingStatus(e.target.value as any)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-800">
                    <option value="single">Single</option>
                    <option value="married">Married (Joint)</option>
                    <option value="headOfHousehold">Head of Household</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Gross Wages</label>
                  <CurrencyInput value={grossWages} onChange={setGrossWages} symbol={currencyConfig.symbol} className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold bg-slate-50" />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Pre-Tax Contributions</label>
                  <CurrencyInput value={preTaxDeductions} onChange={setPreTaxDeductions} symbol={currencyConfig.symbol} className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold bg-slate-50" />
               </div>
            </div>
           </div>

           {/* Deduction Toggles */}
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
                <button onClick={() => setDeductionMethod('standard')} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${deductionMethod === 'standard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Standard</button>
                <button onClick={() => setDeductionMethod('itemized')} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${deductionMethod === 'itemized' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Itemized</button>
             </div>
             {deductionMethod === 'itemized' ? (
                <div className="space-y-2">
                   <div className="space-y-1"><label className="text-xs font-bold">SALT (Taxes)</label><CurrencyInput value={salt} onChange={setSalt} symbol={currencyConfig.symbol} className="w-full p-2 pl-6 border rounded" /></div>
                   <div className="space-y-1"><label className="text-xs font-bold">Mortgage Int.</label><CurrencyInput value={mortgageInterest} onChange={setMortgageInterest} symbol={currencyConfig.symbol} className="w-full p-2 pl-6 border rounded" /></div>
                </div>
             ) : (
               <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  Using Standard Deduction: <span className="font-bold">{formatCurrency(standardAmount)}</span>
               </div>
             )}
           </div>
        </div>

        {/* Right Results */}
        <div className="lg:col-span-7 space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-700 mb-6">Liability Breakdown</h3>
             <div className="flex gap-8 items-center">
                <div className="w-48 h-48 shrink-0 relative min-w-[12rem] min-h-[12rem]">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} innerRadius={60} outerRadius={80} dataKey="value">
                           {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <RechartsTooltip formatter={(val:number) => formatCurrency(val)} />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                   {chartData.map(item => (
                      <div key={item.name} className="flex justify-between items-center text-sm">
                         <span className="font-medium text-slate-600 flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>{item.name}</span>
                         <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
                      </div>
                   ))}
                   <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between text-sm">
                      <span className="font-bold text-indigo-600">Effective Rate</span>
                      <span className="font-bold text-slate-900">{result.effectiveRate.toFixed(1)}%</span>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const UKTaxEstimator: React.FC<{ currency: CurrencyCode }> = ({ currency }) => {
  const [grossWages, setGrossWages] = useState(50000);
  const [pensionContrib, setPensionContrib] = useState(0); // Salary Sacrifice
  
  const currencyConfig = CURRENCIES[currency];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);

  const result = useMemo(() => {
     return calculateUKTax(grossWages, pensionContrib);
  }, [grossWages, pensionContrib]);

  const chartData = [
    { name: 'Net Pay', value: result.netPay, color: '#10b981' },
    { name: 'Income Tax', value: result.incomeTax, color: '#6366f1' },
    { name: 'National Insurance', value: result.nationalInsurance, color: '#f59e0b' },
    { name: 'Pension', value: pensionContrib, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
           <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
             <Briefcase className="text-indigo-300" /> Income Tax Estimator (UK)
           </h2>
           <p className="text-indigo-200 max-w-2xl text-sm">
             Estimate your 2024/25 take-home pay, Income Tax, and National Insurance contributions.
           </p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Percent size={250} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Income Details</h3>
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Annual Gross Salary</label>
                    <CurrencyInput value={grossWages} onChange={setGrossWages} symbol={currencyConfig.symbol} className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold bg-slate-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Pension (Salary Sacrifice)</label>
                    <CurrencyInput value={pensionContrib} onChange={setPensionContrib} symbol={currencyConfig.symbol} className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold bg-slate-50" />
                    <p className="text-[10px] text-slate-400">Reduces taxable income and NI (typically)</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h3 className="text-sm font-bold text-slate-700 mb-6">Breakdown</h3>
               <div className="flex gap-8 items-center">
                  <div className="w-48 h-48 shrink-0 relative min-w-[12rem] min-h-[12rem]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} innerRadius={60} outerRadius={80} dataKey="value">
                             {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <RechartsTooltip formatter={(val:number) => formatCurrency(val)} />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                     {chartData.map(item => (
                        <div key={item.name} className="flex justify-between items-center text-sm">
                           <span className="font-medium text-slate-600 flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>{item.name}</span>
                           <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
                        </div>
                     ))}
                      <div className="pt-4 mt-4 border-t border-slate-100">
                        <div className="flex justify-between text-sm mb-1">
                           <span className="font-medium text-slate-500">Personal Allowance</span>
                           <span className="font-bold text-slate-700">{formatCurrency(result.personalAllowance)}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="font-bold text-indigo-600">Effective Tax Rate</span>
                           <span className="font-bold text-slate-900">{result.effectiveRate.toFixed(1)}%</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const CanadaTaxEstimator: React.FC<{ currency: CurrencyCode }> = ({ currency }) => {
  const [grossWages, setGrossWages] = useState(75000);
  const [rrspContrib, setRrspContrib] = useState(0); 

  const currencyConfig = CURRENCIES[currency];
  const formatCurrency = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);

  const result = useMemo(() => {
     return calculateCanadaTax(grossWages, rrspContrib);
  }, [grossWages, rrspContrib]);

  const chartData = [
    { name: 'Net Pay', value: result.netPay, color: '#10b981' },
    { name: 'Federal Tax', value: result.federalTax, color: '#6366f1' },
    { name: 'Provincial Tax (ON Est.)', value: result.provincialTax, color: '#8b5cf6' },
    { name: 'CPP & EI', value: result.cppContribution + result.eiContribution, color: '#f59e0b' },
    { name: 'RRSP', value: rrspContrib, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
           <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
             <Briefcase className="text-indigo-300" /> Income Tax Estimator (Canada)
           </h2>
           <p className="text-indigo-200 max-w-2xl text-sm">
             Estimate your 2025 take-home pay, Federal & Provincial Tax (Ontario Proxy), CPP, and EI.
           </p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Percent size={250} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Income Details</h3>
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Annual Gross Salary</label>
                    <CurrencyInput value={grossWages} onChange={setGrossWages} symbol={currencyConfig.symbol} className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold bg-slate-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">RRSP Contribution</label>
                    <CurrencyInput value={rrspContrib} onChange={setRrspContrib} symbol={currencyConfig.symbol} className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-bold bg-slate-50" />
                    <p className="text-[10px] text-slate-400">Deductible from taxable income.</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h3 className="text-sm font-bold text-slate-700 mb-6">Breakdown</h3>
               <div className="flex gap-8 items-center">
                  <div className="w-48 h-48 shrink-0 relative min-w-[12rem] min-h-[12rem]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} innerRadius={60} outerRadius={80} dataKey="value">
                             {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <RechartsTooltip formatter={(val:number) => formatCurrency(val)} />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                     {chartData.map(item => (
                        <div key={item.name} className="flex justify-between items-center text-sm">
                           <span className="font-medium text-slate-600 flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>{item.name}</span>
                           <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
                        </div>
                     ))}
                      <div className="pt-4 mt-4 border-t border-slate-100">
                         <div className="flex justify-between text-sm">
                           <span className="font-bold text-indigo-600">Effective Tax Rate</span>
                           <span className="font-bold text-slate-900">{result.effectiveRate.toFixed(1)}%</span>
                        </div>
                         <div className="flex justify-between text-sm mt-1">
                           <span className="font-bold text-slate-500">Marginal Rate</span>
                           <span className="font-bold text-slate-700">{result.marginalRate.toFixed(1)}%</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
