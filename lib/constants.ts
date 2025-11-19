
import { InvestmentStrategy, InvestmentStrategyType, UserInput, HistoricalBenchmark, CurrencyCode } from './types';

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

export const CURRENCIES: Record<CurrencyCode, { symbol: string, label: string, locale: string }> = {
  USD: { symbol: '$', label: 'USD ($)', locale: 'en-US' },
  EUR: { symbol: '€', label: 'EUR (€)', locale: 'de-DE' },
  GBP: { symbol: '£', label: 'GBP (£)', locale: 'en-GB' },
};

export const INITIAL_INPUTS: UserInput = {
  currentAge: 35,
  retirementAge: 65,
  lifeExpectancy: 90,
  currentPortfolio: 50000,
  currentRothBalance: 0,
  
  monthlyContribution: 1000,
  monthlyRothContribution: 0,
  
  // Detailed Breakdown Defaults
  savingsTrad401k: 1000,
  savingsRoth401k: 0,
  savingsRothIRA: 0,
  savingsBrokerage: 0,

  estimatedSocialSecurity: 2000, 
  targetType: 'income',
  targetValue: 60000, 
  safeWithdrawalRate: 4.0,
  strategy: InvestmentStrategyType.BALANCED,
  customReturnRate: 7.0,
  inflationRate: 3.0,
  retirementTaxRate: 15.0,
  currency: 'USD'
};

// Approximate Historical Annualized Returns (Nominal with Dividend Reinvestment)
// Data source approximation for illustrative "Reality Check" purposes
export const HISTORICAL_BENCHMARKS: HistoricalBenchmark[] = [
  {
    ticker: 'SPY',
    name: 'S&P 500 (Large Cap)',
    description: 'The 500 largest US companies. The standard benchmark for US equities.',
    cagr5: 15.0,
    cagr10: 12.5,
    cagr15: 13.8,
    cagr20: 10.2,
    cagr25: 7.8, // Includes dot-com crash/recovery
    cagr30: 10.7,
    cagr35: 10.9,
    risk: 'High'
  },
  {
    ticker: 'QQQ',
    name: 'Nasdaq-100 (Tech/Growth)',
    description: 'Top 100 non-financial companies on Nasdaq. Heavy tech focus.',
    cagr5: 21.0,
    cagr10: 17.8,
    cagr15: 18.5,
    cagr20: 14.5,
    cagr25: 10.5, // Volatile start 2000s
    cagr30: 14.2,
    cagr35: 13.5, // Approx long term tech growth
    risk: 'High'
  },
  {
    ticker: 'VTI',
    name: 'Total US Stock Market',
    description: 'Entire US equity market including small and mid-cap stocks.',
    cagr5: 14.5,
    cagr10: 12.1,
    cagr15: 13.2,
    cagr20: 10.4,
    cagr25: 8.1,
    cagr30: 10.5,
    cagr35: 10.6,
    risk: 'High'
  },
  {
    ticker: 'VXUS',
    name: 'Total Intl Stock',
    description: 'Global markets excluding the US. Provides geographic diversification.',
    cagr5: 7.2,
    cagr10: 4.8,
    cagr15: 4.5,
    cagr20: 5.5,
    cagr25: 4.9,
    cagr30: 6.2, 
    cagr35: 5.8,
    risk: 'High'
  },
  {
    ticker: 'BND',
    name: 'Total Bond Market',
    description: 'US Investment Grade Bonds. Used for capital preservation and income.',
    cagr5: 0.5,
    cagr10: 1.8,
    cagr15: 2.5,
    cagr20: 3.2,
    cagr25: 3.8,
    cagr30: 4.6, 
    cagr35: 5.1,
    risk: 'Low'
  }
];
