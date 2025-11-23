import React from 'react';
import { SimulationResult, UserInput } from '../lib/types';
import { CheckCircle, AlertTriangle, TrendingUp, PiggyBank, AlertOctagon, ArrowUpRight } from 'lucide-react';
import { CURRENCIES } from '../lib/constants';
import { ExplainPlan } from './ExplainPlan';

interface ResultsSummaryProps {
  result: SimulationResult;
  inputs: UserInput;
  isBuyingPowerReal: boolean;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({ result, inputs, isBuyingPowerReal }) => {
  const currencyConfig = CURRENCIES[inputs.currency];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: inputs.currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (!result.isValid) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-100 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="shrink-0 mt-1" />
        <div>
          <h3 className="font-bold">Plan Unrealistic</h3>
          <p className="text-sm mt-1">{result.validationError}</p>
        </div>
      </div>
    );
  }

  const projectedPortfolio = isBuyingPowerReal ? result.projectedAfterTaxReal : result.projectedAfterTaxNominal;
  const targetPortfolio = isBuyingPowerReal ? result.targetReal : result.targetNominal;
  
  const projectedIncome = isBuyingPowerReal ? result.projectedIncomeReal : result.projectedIncomeNominal;
  const targetIncome = isBuyingPowerReal ? result.targetIncomeReal : result.targetIncomeNominal;

  // Risk Analysis
  const solvencyIssue = result.solvencyAge !== null && result.solvencyAge < inputs.lifeExpectancy;
  const highWithdrawalRisk = inputs.safeWithdrawalRate > 4.5;
  const isRisky = solvencyIssue || highWithdrawalRisk;

  // Determine Status Styling
  let statusColor = 'text-emerald-700';
  let statusBg = 'bg-emerald-50';
  let statusBorder = 'border-emerald-100';
  let StatusIcon = CheckCircle;
  let statusTitle = 'On Track';
  let statusDesc = "You are projected to meet your spendable income goal.";

  if (!result.isOnTrack) {
    statusColor = 'text-orange-700';
    statusBg = 'bg-orange-50';
    statusBorder = 'border-orange-100';
    StatusIcon = AlertTriangle;
    statusTitle = 'Income Gap';
    statusDesc = "Projected income falls short of your target. Adjust contributions or expectations.";
  } else if (isRisky) {
    statusColor = 'text-amber-700';
    statusBg = 'bg-amber-50';
    statusBorder = 'border-amber-100';
    StatusIcon = AlertOctagon;
    statusTitle = 'High Risk';
    statusDesc = "You meet the goal, but aggressive assumptions or depletion risks exist.";
  }

  return (
    <div>
      {/* Mode Indicator & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
         <ExplainPlan inputs={inputs} result={result} currencySymbol={currencyConfig.symbol} />
         
         <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
          <span>Displaying:</span> 
          <span className={`font-bold flex items-center gap-1 ${isBuyingPowerReal ? 'text-emerald-600' : 'text-indigo-600'}`}>
            {isBuyingPowerReal ? "Today's Purchasing Power" : "Future Nominal Value"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Status - Spans full width on mobile/tablet for emphasis */}
        <div className={`col-span-1 md:col-span-2 lg:col-span-3 ${statusBg} border ${statusBorder} p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all`}>
          <div className="flex items-start gap-5">
            <div className={`p-3 rounded-xl bg-white shadow-sm ${statusColor} shrink-0`}>
              <StatusIcon size={28} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${statusColor} mb-1`}>
                {statusTitle}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
                {statusDesc}
              </p>
              
              {/* Specific Warnings */}
              {(solvencyIssue || highWithdrawalRisk) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {solvencyIssue && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100/50 px-2.5 py-1 rounded-md border border-red-100">
                      <AlertTriangle size={12} />
                      Depletion Age: {Math.floor(result.solvencyAge!)}
                    </div>
                  )}
                  {highWithdrawalRisk && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-md border border-amber-100">
                      <AlertTriangle size={12} />
                      Unsafe Withdrawal Rate ({inputs.safeWithdrawalRate}%)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Stat for Status Card */}
           <div className="hidden sm:block text-right border-l border-black/5 pl-6 min-w-[140px]">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Success Rate</div>
             <div className="text-2xl font-bold text-slate-700">
               {result.isOnTrack ? (isRisky ? 'Marginal' : 'High') : 'Low'}
             </div>
           </div>
        </div>

        {/* Card 2: Portfolio Projection */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
               <TrendingUp size={14} /> Est. Net Liquidation
            </h3>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{formatCurrency(projectedPortfolio)}</div>
          <div className="text-xs text-slate-400 mt-2 flex justify-between items-center">
             <span>Goal: {formatCurrency(targetPortfolio)}</span>
             <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">After Tax</span>
          </div>
          <div className="mt-auto pt-4">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${result.isOnTrack && !isRisky ? 'bg-emerald-500' : isRisky ? 'bg-amber-400' : 'bg-orange-400'}`} 
                style={{ width: `${Math.min(100, (projectedPortfolio / targetPortfolio) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Income */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <PiggyBank size={14} /> Monthly Income
            </h3>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{formatCurrency(projectedIncome / 12)}</div>
          
           <div className="text-xs text-slate-400 mt-2 flex justify-between items-center">
             <span>Goal: {formatCurrency(targetIncome / 12)}</span>
             <span className={projectedIncome >= targetIncome ? "text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded" : "text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded"}>
               {Math.round((projectedIncome / targetIncome) * 100)}%
             </span>
          </div>
          <div className="mt-auto pt-4 flex items-center gap-1 text-xs text-slate-400">
             <ArrowUpRight size={12} />
             <span>Including Social Security</span>
          </div>
        </div>

        {/* Card 4: Tax Efficiency / Strategy (Smaller) */}
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-center relative overflow-hidden md:col-span-2 lg:col-span-1">
           <div className="relative z-10">
             <h3 className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
               Tax Efficiency Score
             </h3>
             <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-bold text-indigo-700">
                   {Math.round((result.projectedAfterTaxReal / result.projectedReal) * 100)}
                 </span>
                 <span className="text-sm font-bold text-indigo-400">/ 100</span>
             </div>
             <p className="text-xs text-indigo-500/80 mt-2 max-w-[200px] leading-snug">
               Percentage of your gross wealth kept after estimated taxes.
             </p>
           </div>
           <div className="absolute -right-4 -bottom-6 opacity-10 text-indigo-600 rotate-12">
             <PiggyBank size={100} />
           </div>
        </div>
      </div>
    </div>
  );
};