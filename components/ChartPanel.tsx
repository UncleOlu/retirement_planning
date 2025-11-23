import React from 'react';
import { YearlyProjection, CurrencyCode } from '../lib/types';
import { CURRENCIES } from '../lib/constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface ChartPanelProps {
  data: YearlyProjection[];
  isBuyingPowerReal: boolean;
  targetAmount: number;
  currency: CurrencyCode;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({ data, isBuyingPowerReal, targetAmount, currency }) => {
  
  const currencyConfig = CURRENCIES[currency];

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
       return new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 1 }).format(val / 1000000) + 'M';
    }
    if (val >= 1000) {
       return new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val / 1000) + 'k';
    }
    return new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);
  };

  const tooltipFormatter = (value: number) => {
     return new Intl.NumberFormat(currencyConfig.locale, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(value);
  };

  const dataKey = isBuyingPowerReal ? 'balanceReal' : 'balanceNominal';
  const targetLineKey = isBuyingPowerReal ? 'targetLineReal' : 'targetLineNominal';

  const chartData = data; 

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm h-[300px] sm:h-[360px] md:h-[420px] flex flex-col relative transition-all">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">Wealth Trajectory</h3>
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full shadow-sm"></div>
            <span className="text-slate-500 font-medium">Projected</span>
          </div>
           <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-t-2 border-dashed border-slate-400"></div>
            <span className="text-slate-500 font-medium">Target</span>
          </div>
        </div>
      </div>
      
      {/* Added min-w-0 to prevent flex blowout and ensure chart calculates width correctly */}
      <div className="flex-1 w-full min-h-0 min-w-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="age" 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              label={{ value: 'Age', position: 'insideBottomRight', offset: -5, fill: '#cbd5e1', fontSize: 10 }}
            />
            <YAxis 
              tickFormatter={formatCurrency} 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <RechartsTooltip 
              formatter={tooltipFormatter}
              labelFormatter={(label) => `Age: ${label}`}
              cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                padding: '12px' 
              }}
            />
            
            <Area 
              type="monotone" 
              dataKey={targetLineKey} 
              stroke="#94a3b8" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              fill="none" 
              isAnimationActive={false}
            />

            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorBalance)" 
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};