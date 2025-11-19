

export interface TaxBracket {
  rate: number;
  min: number;
  max: number;
}

// 2025 Projected US Federal Tax Brackets 
// Adjusted for "Big Beautiful Bill" scenario (Hypothetical Inflation/Policy Adj)
export const TAX_BRACKETS_2025 = {
  single: [
    { rate: 0.10, min: 0, max: 11925 },
    { rate: 0.12, min: 11925, max: 48475 },
    { rate: 0.22, min: 48475, max: 103350 },
    { rate: 0.24, min: 103350, max: 197300 },
    { rate: 0.32, min: 197300, max: 250525 },
    { rate: 0.35, min: 250525, max: 626350 },
    { rate: 0.37, min: 626350, max: Infinity },
  ],
  married: [
    { rate: 0.10, min: 0, max: 23850 },
    { rate: 0.12, min: 23850, max: 96950 },
    { rate: 0.22, min: 96950, max: 206700 },
    { rate: 0.24, min: 206700, max: 394600 },
    { rate: 0.32, min: 394600, max: 501050 },
    { rate: 0.35, min: 501050, max: 751600 },
    { rate: 0.37, min: 751600, max: Infinity },
  ]
};

// Increased Standard Deduction for 2025 Projection
export const STANDARD_DEDUCTION_2025 = {
  single: 15000,
  married: 30000
};

// FICA Limits 2025 Projection
const SS_WAGE_BASE = 176100; // Projected 2025 wage base
const SS_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_RATE = 0.009;
const ADDL_MED_THRESHOLD_SINGLE = 200000;
const ADDL_MED_THRESHOLD_MARRIED = 250000;

export interface TaxResult {
  federalTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  ficaTax: number;
  totalTax: number;
  netPay: number;
  effectiveRate: number;
  marginalRate: number;
  bracketsBreakdown: { rate: number; amount: number }[];
  taxableIncome: number;
  deductionUsed: number;
}

export const calculateUSFederalTax = (
  grossIncome: number, 
  preTaxDeductions: number, 
  filingStatus: 'single' | 'married',
  itemizedDeduction?: number
): TaxResult => {
  const standardDeduction = filingStatus === 'single' ? STANDARD_DEDUCTION_2025.single : STANDARD_DEDUCTION_2025.married;
  
  // Determine effective deduction
  const deductionUsed = itemizedDeduction !== undefined ? itemizedDeduction : standardDeduction;

  // 1. Calculate Taxable Income
  const agi = Math.max(0, grossIncome - preTaxDeductions);
  const taxableIncome = Math.max(0, agi - deductionUsed);

  // 2. Calculate Federal Income Tax (Progressive)
  let federalTax = 0;
  let marginalRate = 0;
  const bracketsBreakdown: { rate: number; amount: number }[] = [];
  
  const brackets = filingStatus === 'single' ? TAX_BRACKETS_2025.single : TAX_BRACKETS_2025.married;

  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      const taxableAmountInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
      const taxInBracket = taxableAmountInBracket * bracket.rate;
      federalTax += taxInBracket;
      bracketsBreakdown.push({ rate: bracket.rate, amount: taxInBracket });
      marginalRate = bracket.rate;
    }
  }

  // 3. Calculate FICA (Social Security + Medicare)
  // Note: FICA is based on Gross Wages (generally before 401k, though HSA/Insurance might reduce it. 
  // For simplicity in this estimator, we use Gross Income as FICA wage base).
  
  // Social Security (Capped at wage base)
  const socialSecurityTax = Math.min(grossIncome, SS_WAGE_BASE) * SS_RATE;

  // Medicare (Uncapped 1.45% + Additional 0.9% over threshold)
  let medicareTax = grossIncome * MEDICARE_RATE;
  
  const addlMedThreshold = filingStatus === 'single' ? ADDL_MED_THRESHOLD_SINGLE : ADDL_MED_THRESHOLD_MARRIED;
  if (grossIncome > addlMedThreshold) {
    medicareTax += (grossIncome - addlMedThreshold) * ADDITIONAL_MEDICARE_RATE;
  }

  const ficaTax = socialSecurityTax + medicareTax;
  const totalTax = federalTax + ficaTax;

  return {
    federalTax,
    socialSecurityTax,
    medicareTax,
    ficaTax,
    totalTax,
    netPay: grossIncome - totalTax - preTaxDeductions,
    effectiveRate: grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0,
    marginalRate: marginalRate * 100,
    bracketsBreakdown,
    taxableIncome,
    deductionUsed
  };
};
