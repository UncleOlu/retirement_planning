
import React from 'react';
import { Coffee, ShoppingCart, TrendingUp, Car, Ticket } from 'lucide-react';
import { CurrencyCode } from '../lib/types';
import { CURRENCIES } from '../lib/constants';

interface InflationModuleProps {
  inflationRate: number;
  retirementYearsAway: number;
  currency: CurrencyCode;
}

export const InflationModule: React.FC<InflationModuleProps> = ({ inflationRate, retirementYearsAway, currency }) => {
  const multiplier = Math.pow(1 + inflationRate / 100, retirementYearsAway);
  const currencyConfig = CURRENCIES[currency];

  const format = (val: number) => new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency }).format(val);

  const basketItems = [
    { 
      name: "Artisanal Coffee", 
      price: 5.50, 
      icon: Coffee, 
      color: "text-amber-600", 
      bg: "bg-amber-100",
    },
    { 
      name: "Weekly Groceries", 
      price: 180.00, 
      icon: ShoppingCart, 
      color: "text-emerald-600", 
      bg: "bg-emerald-100",
    },
    { 
      name: "Movie Ticket", 
      price: 16.00, 
      icon: Ticket, 
      color: "text-purple-600", 
      bg: "bg-purple-100",
    },
    { 
      name: "Mid-Size Sedan", 
      price: 32000.00, 
      icon: Car, 
      color: "text-blue-600", 
      bg: "bg-blue-100",
    }
  ];

  return (
    <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 shadow-lg border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="bg-indigo-600 p-1.5 rounded-lg shadow-indigo-900/20 shadow-lg">
            <TrendingUp size={18} className="text-white" />
          </span>
          Inflation Time Machine
        </h3>
        <div className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
          {retirementYearsAway} Years @ {inflationRate}%
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Explanation Column */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Planning in <strong>Nominal (Future) Dollars</strong> can be confusing. A dollar in the future won't buy what it buys today.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
               At your inflation rate of <span className="text-emerald-400 font-bold">{inflationRate}%</span>, everyday items will cost significantly more by the time you retire.
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 relative overflow-hidden">
             <div className="relative z-10">
               <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Purchasing Power Decay</div>
               <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-bold text-white">{multiplier.toFixed(2)}x</span>
                 <span className="text-sm text-slate-400">higher prices</span>
               </div>
               <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700">
                 You need {format(1 * multiplier)} in the future to match the value of {format(1)} today.
               </p>
             </div>
             <div className="absolute -right-4 -bottom-4 text-slate-700 opacity-20 transform rotate-12">
               <TrendingUp size={100} />
             </div>
          </div>
        </div>

        {/* Basket of Goods Column */}
        <div className="lg:col-span-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Projected "Basket of Goods" Cost</h4>
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50">
            {basketItems.map((item, idx) => {
               const futurePrice = item.price * multiplier;
               return (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors first:rounded-t-xl last:rounded-b-xl">
                    <div className="flex items-center gap-3">
                      <div className={`${item.bg} p-2.5 rounded-full ${item.color} shadow-sm`}>
                        <item.icon size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200">{item.name}</div>
                        <div className="text-xs text-slate-500">Today: {format(item.price)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-0.5">Future Cost</div>
                      <div className="text-lg font-bold text-emerald-400 font-mono">
                        {format(futurePrice)}
                      </div>
                    </div>
                 </div>
               )
            })}
          </div>
        </div>
      </div>
    </div>
  );
};