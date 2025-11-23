
export enum InvestmentStrategyType {
  CONSERVATIVE = 'Conservative',
  BALANCED = 'Balanced',
  AGGRESSIVE = 'Aggressive',
  CUSTOM = 'Custom'
}

export interface InvestmentStrategy {
  id: InvestmentStrategyType;
  name: string;
  rate: number;
  description: string;
  volatility: 'Low' | 'Medium' | 'High';
  assetMix: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD';
export type CountryCode = 'US' | 'UK' | 'CA';

export interface UserInput {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentPortfolio: number;
  
  // Portfolio Breakdown
  currentRothBalance: number; 
  currentBrokerageBalance: number; // New: Taxable Brokerage portion
  
  // Aggregate fields used for calculation
  monthlyContribution: number; 
  monthlyRothContribution: number; // Portion of monthlyContribution that is Roth
  
  // Detailed Contribution Breakdown (New)
  savingsTrad401k: number;
  savingsRoth401k: number;
  savingsRothIRA: number;
  savingsBrokerage: number;
  
  // New field
  estimatedSocialSecurity: number; // Monthly, in today's dollars

  // Goal Settings
  targetType: 'income' | 'total';
  targetValue: number; // The raw number entered by user
  
  // Advanced
  safeWithdrawalRate: number; // Percentage (e.g., 4.0)
  
  // Assumptions
  strategy: InvestmentStrategyType;
  customReturnRate: number; // Percentage
  inflationRate: number; // Percentage

  // Tax & Roth Strategy
  retirementTaxRate: number; // Percentage (0-50)
  
  // App Settings
  currency: CurrencyCode;
}

export interface YearlyProjection {
  year: number;
  age: number;
  balanceNominal: number;
  balanceReal: number;
  contributionsTotal: number;
  growthNominal: number;
  targetLineNominal: number;
  targetLineReal: number;
}

export interface SimulationResult {
  isValid: boolean;
  validationError?: string;
  yearsToRetirement: number;
  yearsInRetirement: number;
  
  // Balances at Retirement
  projectedNominal: number; // Gross Nominal
  projectedReal: number;    // Gross Real
  projectedAfterTaxNominal: number; // Net Nominal (liquidation value)
  projectedAfterTaxReal: number;    // Net Real (liquidation value)

  targetNominal: number;
  targetReal: number;
  
  // Income at Retirement (Annual)
  projectedIncomeNominal: number; // After-tax spendable
  projectedIncomeReal: number;    // After-tax spendable
  targetIncomeNominal: number;
  targetIncomeReal: number;
  
  // Analysis
  isOnTrack: boolean;
  gapNominal: number; 
  requiredMonthlyContribution: number; 
  solvencyAge: number | null; 
  
  // Tax Impact
  totalTaxesAvoided?: number; // Hypothetical
  effectiveTaxDrag?: number;
  
  projections: YearlyProjection[];
}

export interface HistoricalBenchmark {
  ticker: string;
  name: string;
  description: string;
  cagr5: number;  // 5 year annualized
  cagr10: number; // 10 year annualized
  cagr15: number; // 15 year annualized
  cagr20: number; // 20 year annualized
  cagr25: number; // 25 year annualized
  cagr30: number; // 30 year annualized
  cagr35: number; // 35 year annualized
  risk: 'Low' | 'Medium' | 'High';
}

export interface Scenario {
  id: string;
  name: string;
  createdAt: number;
  inputs: UserInput;
}