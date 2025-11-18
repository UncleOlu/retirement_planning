
import React from 'react';
import { HISTORICAL_BENCHMARKS } from '../lib/constants';
import { UserInput, InvestmentStrategyType, SimulationResult } from '../lib/types';
import { History, AlertTriangle, TrendingUp, AlertOctagon, Hourglass } from 'lucide-react';

interface RealityCheckProps {
  inputs: UserInput;
  result: SimulationResult;
}

export const RealityCheck: React.FC<RealityCheckProps> = ({ inputs, result }) => {
  const timeHorizon = inputs.retirementAge - inputs.currentAge;
  
  // Determine user's effective rate
  const userRate = inputs.strategy === InvestmentStrategyType.CUSTOM 
    ? inputs.customReturnRate 
    : (inputs.strategy === InvestmentStrategyType.AGGRESSIVE ? 9 : inputs.strategy === InvestmentStrategyType.BALANCED ? 6 : 4);

  // Select best comparison window
  let windowLabel = "Last 10 Years";
  let dataKey: 'cagr10' | 'cagr20' | 'cagr30' = 'cagr10';

  if (timeHorizon >= 25) {
    windowLabel = "Last 30 Years";
    dataKey = 'cagr30';
  } else if (timeHorizon >= 15) {
    windowLabel = "Last 20 Years";
    dataKey = 'cagr20';
  }

  // Check if user is overly optimistic ( > 2% over S&P 500 history)
  const sp500 = HISTORICAL_BENCHMARKS.find(b => b.ticker === 'SPY');
  const isOptimistic = sp500 && userRate > (sp500[dataKey] + 1.5);
  
  // Solvency Check
  const runsOutEarly = result.solvencyAge !== null && result.solvencyAge < inputs.lifeExpectancy;
  const highWithdrawal = inputs.safeWithdrawalRate > 4.5;
  const showSolvencyWarning = runsOutEarly || highWithdrawal;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="text-indigo-500" size={20} />
          <h3 className="font-bold text-slate-800">Reality Check</h3>
        </div>
        <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
          Window: {windowLabel}
        </span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Section 1: Solvency Warning (Run out of Money) */}
        {showSolvencyWarning && (
          <div className="mb-8 bg-red-50 border border-red-100 rounded-xl p-4">
            <h4 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-2">
              <AlertOctagon size={16} /> Solvency Risk Detected
            </h4>
            
            {runsOutEarly ? (
               <div className="text-sm text-red-700 mb-2">
                 Based on your target income, you are projected to run out of money at age <span className="font-bold text-xl block mt-1">{Math.floor(result.solvencyAge!)}</span>
                 <span className="text-xs text-red-500">Your life expectancy is {inputs.lifeExpectancy}.</span>
               </div>
            ) : (
               <div className="text-sm text-red-700 mb-2">
                 A withdrawal rate of <strong>{inputs.safeWithdrawalRate}%</strong> is considered risky. Most experts recommend 3.5% - 4%.
               </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-red-600 mt-3 pt-3 border-t border-red-200/60">
              <Hourglass size={12} />
              Try lowering your withdrawal rate or increasing savings.
            </div>
          </div>
        )}
        
        {/* Section 2: Growth Comparison */}
        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          You're assuming a <strong>{userRate}%</strong> return. Here is how broad market funds performed over the {windowLabel}.
        </p>

        {isOptimistic && (
           <div className="mb-6 bg-amber-50 text-amber-800 p-3 rounded-lg text-xs flex items-start gap-2 border border-amber-100">
             <AlertTriangle className="shrink-0 mt-0.5" size={14} />
             <div>
               <strong>Optimistic Assumption.</strong> Your rate is higher than the S&P 500 average ({sp500?.[dataKey]}%).
             </div>
           </div>
        )}

        <div className="space-y-4 mb-8">
          {/* User Bar */}
          <div className="relative">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-indigo-600 flex items-center gap-1">
                <TrendingUp size={14} /> Your Plan
              </span>
              <span className="font-bold text-indigo-600">{userRate}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full" 
                style={{ width: `${Math.min(100, (userRate / 18) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Section 3: Detailed Data Table */}
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Historical ETF Benchmarks</h4>
        <div className="overflow-hidden rounded-lg border border-slate-100">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Fund</th>
                <th className="px-3 py-2 font-medium text-right">Growth</th>
                <th className="px-3 py-2 font-medium text-right">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HISTORICAL_BENCHMARKS.map((bench) => (
                <tr key={bench.ticker} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2">
                    <div className="font-bold text-slate-700">{bench.ticker}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{bench.name}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-600">
                    {bench[dataKey]}%
                  </td>
                   <td className="px-3 py-2 text-right">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      bench.risk === 'High' ? 'bg-orange-100 text-orange-700' : 
                      bench.risk === 'Medium' ? 'bg-blue-100 text-blue-700' : 
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {bench.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-[10px] text-slate-400 italic text-center">
           *Past performance is not indicative of future results. Data represents nominal annualized returns (CAGR).
        </div>
      </div>
    </div>
  );
};
