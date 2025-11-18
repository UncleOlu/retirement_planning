
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

export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

export interface UserInput {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentPortfolio: number;
  currentRothBalance: number; // New: Portion of currentPortfolio that is Roth
  monthlyContribution: number;
  
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
  monthlyRothContribution: number; // Portion of monthlyContribution that is Roth
  
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
  cagr10: number; // 10 year annualized return
  cagr20: number; // 20 year annualized return
  cagr30: number; // 30 year annualized return
  risk: 'Low' | 'Medium' | 'High';
}

export interface Scenario {
  id: string;
  name: string;
  createdAt: number;
  inputs: UserInput;
}