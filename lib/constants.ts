

import { InvestmentStrategy, InvestmentStrategyType, UserInput, HistoricalBenchmark, CurrencyCode, CountryCode } from './types';

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
  CAD: { symbol: '$', label: 'CAD ($)', locale: 'en-CA' },
};

export const COUNTRY_CONFIG: Record<CountryCode, {
  currency: CurrencyCode;
  labels: {
    trad401k: string;
    roth401k: string;
    rothIra: string;
    brokerage: string;
    socialSecurity: string;
    taxEstimatorTitle: string;
    educationAccount: string;
  };
  tips: {
    catchUp: string;
    taxAdvantage: string;
  }
}> = {
  US: {
    currency: 'USD',
    labels: {
      trad401k: "Traditional 401k/403b",
      roth401k: "Roth 401k/403b",
      rothIra: "Roth IRA / Backdoor",
      brokerage: "Brokerage (Taxable)",
      socialSecurity: "Social Security",
      taxEstimatorTitle: "Federal Tax Estimator (US)",
      educationAccount: "529 Plan"
    },
    tips: {
      catchUp: "Since you are over 50, you can contribute extra 'catch-up' funds to your 401(k) and IRA.",
      taxAdvantage: "Maximize tax-advantaged accounts (401k, IRA, HSA) before funding taxable brokerage accounts."
    }
  },
  UK: {
    currency: 'GBP',
    labels: {
      trad401k: "Workplace Pension",
      roth401k: "Additional Voluntary Contrib.",
      rothIra: "ISA (Stocks & Shares)",
      brokerage: "General Investment Account",
      socialSecurity: "State Pension",
      taxEstimatorTitle: "Income Tax Estimator (UK)",
      educationAccount: "Junior ISA / Education"
    },
    tips: {
      catchUp: "Ensure you are maximizing your pension annual allowance (£60k). Unused allowance from previous 3 years can be carried forward.",
      taxAdvantage: "Maximize your £20,000 ISA allowance annually. It is completely tax-free for growth and withdrawals."
    }
  },
  CA: {
    currency: 'CAD',
    labels: {
      trad401k: "RRSP (Registered)",
      roth401k: "Group RRSP / DCPP",
      rothIra: "TFSA (Tax-Free)",
      brokerage: "Non-Registered / Margin",
      socialSecurity: "CPP & OAS",
      taxEstimatorTitle: "Income Tax Estimator (Canada)",
      educationAccount: "RESP"
    },
    tips: {
      catchUp: "Check your CRA My Account for unused RRSP deduction limit and TFSA contribution room carried forward.",
      taxAdvantage: "Max out your TFSA first for flexibility, then RRSP for tax deduction if your income is high."
    }
  }
};

export const INITIAL_INPUTS: UserInput = {
  currentAge: 35,
  retirementAge: 65,
  lifeExpectancy: 90,
  currentPortfolio: 50000,
  currentRothBalance: 0,
  currentBrokerageBalance: 0,
  
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

export const US_BENCHMARKS: HistoricalBenchmark[] = [
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

export const UK_BENCHMARKS: HistoricalBenchmark[] = [
  {
    ticker: 'VUKE',
    name: 'FTSE 100 (UK Large Cap)',
    description: 'The 100 largest UK companies. Heavy in energy, financials, and materials.',
    cagr5: 6.5,
    cagr10: 5.8,
    cagr15: 6.2,
    cagr20: 5.5,
    cagr25: 4.8,
    cagr30: 6.5,
    cagr35: 6.9,
    risk: 'Medium'
  },
  {
    ticker: 'VMID',
    name: 'FTSE 250 (UK Mid Cap)',
    description: 'Mid-sized UK companies. More domestic focus and historically higher growth than FTSE 100.',
    cagr5: 4.2,
    cagr10: 6.5,
    cagr15: 9.5,
    cagr20: 9.2,
    cagr25: 8.8,
    cagr30: 9.8,
    cagr35: 10.1,
    risk: 'High'
  },
  {
    ticker: 'VUSA',
    name: 'S&P 500 (GBP)',
    description: 'US Top 500 companies priced in GBP. Currency fluctuations impact returns.',
    cagr5: 16.2,
    cagr10: 15.8,
    cagr15: 16.5,
    cagr20: 11.5,
    cagr25: 8.9,
    cagr30: 11.8,
    cagr35: 12.1,
    risk: 'High'
  },
  {
    ticker: 'VWRL',
    name: 'FTSE All-World',
    description: 'Global stocks including emerging markets. The default passive global tracker.',
    cagr5: 11.5,
    cagr10: 11.8,
    cagr15: 10.9,
    cagr20: 8.5,
    cagr25: 7.2,
    cagr30: 8.8,
    cagr35: 8.5,
    risk: 'Medium'
  },
  {
    ticker: 'VGOV',
    name: 'UK Gilts (Gov Bonds)',
    description: 'UK Government Bonds. Lower risk, lower return, used for stability.',
    cagr5: -3.5,
    cagr10: 0.2,
    cagr15: 2.5,
    cagr20: 3.8,
    cagr25: 4.5,
    cagr30: 5.2,
    cagr35: 5.8,
    risk: 'Low'
  }
];

export const CA_BENCHMARKS: HistoricalBenchmark[] = [
  {
    ticker: 'XIU',
    name: 'TSX 60 (Can Large Cap)',
    description: 'Top 60 companies in Canada. Heavy in Financials and Energy.',
    cagr5: 8.5,
    cagr10: 7.2,
    cagr15: 7.8,
    cagr20: 8.1,
    cagr25: 7.5,
    cagr30: 8.2,
    cagr35: 8.5,
    risk: 'Medium'
  },
  {
    ticker: 'VFV',
    name: 'S&P 500 (CAD)',
    description: 'US Top 500 companies priced in CAD (Unhedged). Boosted by USD strength recently.',
    cagr5: 15.2,
    cagr10: 14.5,
    cagr15: 14.8,
    cagr20: 9.8,
    cagr25: 7.9,
    cagr30: 10.5,
    cagr35: 10.8,
    risk: 'High'
  },
  {
    ticker: 'XBB',
    name: 'CDN Aggregate Bond',
    description: 'Broad Canadian investment grade bonds. Stability and income.',
    cagr5: 0.8,
    cagr10: 2.1,
    cagr15: 3.2,
    cagr20: 3.8,
    cagr25: 4.5,
    cagr30: 5.5,
    cagr35: 6.1,
    risk: 'Low'
  },
  {
    ticker: 'XEF',
    name: 'EAFE (Intl Developed)',
    description: 'Europe, Australia, and Far East stocks. Diversification outside North America.',
    cagr5: 6.5,
    cagr10: 5.2,
    cagr15: 5.5,
    cagr20: 5.1,
    cagr25: 4.8,
    cagr30: 5.5,
    cagr35: 5.8,
    risk: 'Medium'
  },
  {
    ticker: 'VEE',
    name: 'Emerging Markets',
    description: 'Developing economies. High risk, potential for high growth.',
    cagr5: 3.5,
    cagr10: 3.8,
    cagr15: 3.2,
    cagr20: 7.5,
    cagr25: 6.8,
    cagr30: 6.5,
    cagr35: 7.2,
    risk: 'High'
  }
];


export const BENCHMARKS_BY_COUNTRY: Record<CountryCode, HistoricalBenchmark[]> = {
  US: US_BENCHMARKS,
  UK: UK_BENCHMARKS,
  CA: CA_BENCHMARKS
};

// Backwards compatibility if needed
export const HISTORICAL_BENCHMARKS = US_BENCHMARKS;