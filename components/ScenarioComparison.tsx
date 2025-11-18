
import React, { useMemo } from 'react';
import { Scenario } from '../lib/types';
import { runSimulation } from '../lib/financeMath';
import { Trophy, TrendingUp, Calendar, DollarSign, Percent } from 'lucide-react';

interface ScenarioComparisonProps {
  scenarios: Scenario[];
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ scenarios }) => {
  
  const comparisonData = useMemo(() => {
    return scenarios.map(scenario => {
      const result = runSimulation(scenario.inputs);
      return {
        id: scenario.id,
        name: scenario.name,
        inputs: scenario.inputs,
        result: result
      };
    });
  }, [scenarios]);

  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="mb-2">No scenarios saved yet.</p>
        <p className="text-xs">Save a scenario from the sidebar to compare it here.</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Find winner for highlighting
  const maxWealth = Math.max(...comparisonData.map(d => d.result.projectedAfterTaxReal));
  const maxIncome = Math.max(...comparisonData.map(d => d.result.projectedIncomeReal));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Scenario Comparison</h2>
        <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {scenarios.length} Scenarios
        </span>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {comparisonData.map((item) => {
            const isWealthWinner = item.result.projectedAfterTaxReal === maxWealth;
            const isIncomeWinner = item.result.projectedIncomeReal === maxIncome;

            return (
              <div key={item.id} className="w-80 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition hover:shadow-md hover:border-indigo-200 relative">
                
                {/* Header */}
                <div className="p-5 bg-slate-50 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-800 truncate" title={item.name}>{item.name}</h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${item.result.isOnTrack ? 'bg-emerald-500' : 'bg-orange-400'}`}></span>
                     {item.result.isOnTrack ? 'On Track' : 'Gap Detected'}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="p-5 space-y-6 flex-1">
                  
                  {/* Outcome 1: Wealth */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                      Net Portfolio (Real)
                      {isWealthWinner && <Trophy size={14} className="text-amber-500" />}
                    </div>
                    <div className={`text-2xl font-bold ${isWealthWinner ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {formatCurrency(item.result.projectedAfterTaxReal)}
                    </div>
                  </div>

                  {/* Outcome 2: Income */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                      Monthly Income (Net)
                      {isIncomeWinner && <Trophy size={14} className="text-amber-500" />}
                    </div>
                    <div className={`text-xl font-bold ${isIncomeWinner ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {formatCurrency(item.result.projectedIncomeReal / 12)}
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-100 my-4"></div>

                  {/* Inputs Summary */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-2"><Calendar size={14}/> Ret. Age</span>
                      <span className="font-medium text-slate-800">{item.inputs.retirementAge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-2"><DollarSign size={14}/> Monthly Contr.</span>
                      <span className="font-medium text-slate-800">{formatCurrency(item.inputs.monthlyContribution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-2"><TrendingUp size={14}/> Return</span>
                      <span className="font-medium text-slate-800">
                        {item.inputs.strategy === 'Custom' ? item.inputs.customReturnRate : 
                          (item.inputs.strategy === 'Conservative' ? 4 : item.inputs.strategy === 'Balanced' ? 6 : 9)}%
                      </span>
                    </div>
                     <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-2"><Percent size={14}/> Tax Rate</span>
                      <span className="font-medium text-slate-800">{item.inputs.retirementTaxRate}%</span>
                    </div>
                     <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-2 text-indigo-500"><DollarSign size={14}/> Roth Part</span>
                      <span className="font-medium text-indigo-600">{formatCurrency(item.inputs.monthlyRothContribution)}</span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
