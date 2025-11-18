
import { InvestmentStrategy, InvestmentStrategyType, UserInput, HistoricalBenchmark } from './types';

export const INVESTMENT_STRATEGIES: Record<InvestmentStrategyType, InvestmentStrategy> = {
  [InvestmentStrategyType.CONSERVATIVE]: {
    id: InvestmentStrategyType.CONSERVATIVE,
    name: 'Conservative',
    rate: 4.0,
    description: 'Preservation of capital with modest growth.',
    volatility: 'Low',
    assetMix: 'Mostly Bonds, Cash, Treasury Bills'
  },
  [InvestmentStrategyType.BALANCED]: {
    id: InvestmentStrategyType.BALANCED,
    name: 'Balanced',
    rate: 6.0,
    description: 'A middle ground between growth and stability.',
    volatility: 'Medium',
    assetMix: '60% Stocks, 40% Bonds'
  },
  [InvestmentStrategyType.AGGRESSIVE]: {
    id: InvestmentStrategyType.AGGRESSIVE,
    name: 'Aggressive',
    rate: 9.0,
    description: 'Maximum long-term growth potential.',
    volatility: 'High',
    assetMix: 'Broad Equity Indices (Total Market), Small Cap, Emerging Markets'
  },
  [InvestmentStrategyType.CUSTOM]: {
    id: InvestmentStrategyType.CUSTOM,
    name: 'Custom',
    rate: 7.0,
    description: 'User defined strategy.',
    volatility: 'Medium',
    assetMix: 'Custom Mix'
  }
};

export const INITIAL_INPUTS: UserInput = {
  currentAge: 35,
  retirementAge: 65,
  lifeExpectancy: 90,
  currentPortfolio: 50000,
  currentRothBalance: 0,
  monthlyContribution: 1000,
  estimatedSocialSecurity: 2000, 
  targetType: 'income',
  targetValue: 60000, 
  safeWithdrawalRate: 4.0,
  strategy: InvestmentStrategyType.BALANCED,
  customReturnRate: 7.0,
  inflationRate: 3.0,
  retirementTaxRate: 15.0,
  monthlyRothContribution: 0
};

// Approximate Historical Annualized Returns (Nominal with Dividend Reinvestment)
// Data source approximation for illustrative "Reality Check" purposes
export const HISTORICAL_BENCHMARKS: HistoricalBenchmark[] = [
  {
    ticker: 'SPY',
    name: 'S&P 500 (Large Cap)',
    description: 'The 500 largest US companies. The standard benchmark for US equities.',
    cagr10: 12.5,
    cagr20: 10.2,
    cagr30: 10.7,
    risk: 'High'
  },
  {
    ticker: 'QQQ',
    name: 'Nasdaq-100 (Tech/Growth)',
    description: 'Top 100 non-financial companies on Nasdaq. Heavy tech focus.',
    cagr10: 17.8,
    cagr20: 14.5,
    cagr30: 14.2,
    risk: 'High'
  },
  {
    ticker: 'VTI',
    name: 'Total US Stock Market',
    description: 'Entire US equity market including small and mid-cap stocks.',
    cagr10: 12.1,
    cagr20: 10.4,
    cagr30: 10.5,
    risk: 'High'
  },
  {
    ticker: 'VXUS',
    name: 'Total Intl Stock',
    description: 'Global markets excluding the US. Provides geographic diversification.',
    cagr10: 4.8,
    cagr20: 5.5,
    cagr30: 6.2, // Estimate based on EAFE/Emerging blends
    risk: 'High'
  },
  {
    ticker: 'BND',
    name: 'Total Bond Market',
    description: 'US Investment Grade Bonds. Used for capital preservation and income.',
    cagr10: 1.8,
    cagr20: 3.2,
    cagr30: 4.6, 
    risk: 'Low'
  }
];
