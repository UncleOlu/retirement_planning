
import React from 'react';
import { SimulationResult, UserInput } from '../lib/types';
import { CheckCircle, AlertTriangle, TrendingUp, PiggyBank, AlertOctagon } from 'lucide-react';
import { CURRENCIES } from '../lib/constants';

interface ResultsSummaryProps {
  result: SimulationResult;
  inputs: UserInput;
  isBuyingPowerReal: boolean;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({ result, inputs, isBuyingPowerReal }) => {
  if (!result.isValid) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-100 flex items-start gap-3">
        <AlertTriangle className="shrink-0 mt-1" />
        <div>
          <h3 className="font-bold">Plan Unrealistic</h3>
          <p className="text-sm mt-1">{result.validationError}</p>
        </div>
      </div>
    );
  }

  const currencyConfig = CURRENCIES[inputs.currency];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: inputs.currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const projectedPortfolio = isBuyingPowerReal ? result.projectedAfterTaxReal : result.projectedAfterTaxNominal;
  const targetPortfolio = isBuyingPowerReal ? result.targetReal : result.targetNominal;
  
  const projectedIncome = isBuyingPowerReal ? result.projectedIncomeReal : result.projectedIncomeNominal;
  const targetIncome = isBuyingPowerReal ? result.targetIncomeReal : result.targetIncomeNominal;

  // Risk Analysis
  const solvencyIssue = result.solvencyAge !== null && result.solvencyAge < inputs.lifeExpectancy;
  const highWithdrawalRisk = inputs.safeWithdrawalRate > 4.5;
  const isRisky = solvencyIssue || highWithdrawalRisk;

  // Determine Status Styling
  let statusColor = 'text-emerald-600';
  let statusBg = 'bg-emerald-50';
  let statusBorder = 'border-emerald-100';
  let StatusIcon = CheckCircle;
  let statusTitle = 'On Track';
  let statusDesc = "You are projected to meet your spendable income goal.";

  if (!result.isOnTrack) {
    statusColor = 'text-orange-600';
    statusBg = 'bg-orange-50';
    statusBorder = 'border-orange-100';
    StatusIcon = AlertTriangle;
    statusTitle = 'Gap Detected';
    statusDesc = "Projected income is below your target. Consider adjusting contributions or retirement age.";
  } else if (isRisky) {
    // On Track but Risky
    statusColor = 'text-amber-600';
    statusBg = 'bg-amber-50';
    statusBorder = 'border-amber-100';
    StatusIcon = AlertOctagon;
    statusTitle = 'High Risk Plan';
    statusDesc = "You meet the income goal, but your plan relies on aggressive assumptions or depletes capital.";
  }

  return (
    <div>
      {/* Mode Indicator */}
      <div className="flex justify-end mb-2">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
          Showing: <span className={`font-bold ${isBuyingPowerReal ? 'text-emerald-600' : 'text-indigo-600'}`}>
            {isBuyingPowerReal ? "Purchasing Power (Today's Value)" : "Future Value (Nominal)"}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Status */}
        <div className={`md:col-span-3 ${statusBg} border ${statusBorder} p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors`}>
          <div className="flex items-start md:items-center gap-4">
            <div className={`p-3 rounded-full bg-white shadow-sm ${statusColor} shrink-0`}>
              <StatusIcon size={24} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${statusColor}`}>
                {statusTitle}
              </h2>
              <p className="text-slate-600 text-sm">
                {statusDesc}
              </p>
              
              {/* Specific Warnings */}
              {(solvencyIssue || highWithdrawalRisk) && (
                <div className="mt-2 space-y-1">
                  {solvencyIssue && (
                    <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-white/50 px-2 py-1 rounded w-fit">
                      <AlertTriangle size={12} />
                      Depletion Warning: Funds run out at age {Math.floor(result.solvencyAge!)}
                    </div>
                  )}
                  {highWithdrawalRisk && (
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-white/50 px-2 py-1 rounded w-fit">
                      <AlertTriangle size={12} />
                      Withdrawal Rate ({inputs.safeWithdrawalRate}%) exceeds safe limit (&gt;4.5%)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Portfolio Projection */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">
               Est. Net Liquidation Value
            </h3>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(projectedPortfolio)}</div>
          <div className="text-xs text-slate-400 mt-1 flex justify-between">
             <span>Goal: {formatCurrency(targetPortfolio)}</span>
             <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">After Tax</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${result.isOnTrack && !isRisky ? 'bg-emerald-500' : isRisky ? 'bg-amber-400' : 'bg-orange-400'}`} 
              style={{ width: `${Math.min(100, (projectedPortfolio / targetPortfolio) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Monthly Income */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Monthly Spendable Income</h3>
            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Net / Mo</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(projectedIncome / 12)}</div>
          <div className="text-xs text-slate-400 mt-1">
             Goal: {formatCurrency(targetIncome / 12)}
          </div>
           <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
             <span className={projectedIncome >= targetIncome ? "text-emerald-600 font-medium" : "text-orange-500 font-medium"}>
               {Math.round((projectedIncome / targetIncome) * 100)}%
             </span>
             <span>of income goal covered</span>
           </div>
        </div>

        {/* Card 4: Tax Efficiency / Strategy */}
        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
           <div className="relative z-10">
             <h3 className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
               <PiggyBank size={12} /> Tax Efficiency
             </h3>
             <div className="flex justify-between items-end">
               <div>
                 <div className="text-2xl font-bold text-indigo-700">
                   {Math.round((result.projectedAfterTaxReal / result.projectedReal) * 100)}%
                 </div>
                 <div className="text-xs text-indigo-400 mt-1">of Wealth Kept After Tax</div>
               </div>
             </div>
           </div>
           <div className="absolute right-0 bottom-0 opacity-5">
             <PiggyBank size={80} />
           </div>
        </div>
      </div>
    </div>
  );
};