

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
  ],
  headOfHousehold: [
    { rate: 0.10, min: 0, max: 17000 },
    { rate: 0.12, min: 17000, max: 64850 },
    { rate: 0.22, min: 64850, max: 103350 },
    { rate: 0.24, min: 103350, max: 197300 },
    { rate: 0.32, min: 197300, max: 250500 },
    { rate: 0.35, min: 250500, max: 626350 },
    { rate: 0.37, min: 626350, max: Infinity },
  ]
};

// Long Term Capital Gains Brackets (0%, 15%, 20%)
// Based on Taxable Income
export const LTCG_BRACKETS_2025 = {
  single: [
    { rate: 0, max: 48350 },
    { rate: 0.15, max: 533400 },
    { rate: 0.20, max: Infinity }
  ],
  married: [
    { rate: 0, max: 96700 },
    { rate: 0.15, max: 600050 },
    { rate: 0.20, max: Infinity }
  ],
  headOfHousehold: [
    { rate: 0, max: 64750 },
    { rate: 0.15, max: 566700 },
    { rate: 0.20, max: Infinity }
  ]
};

// Increased Standard Deduction for 2025 Projection
export const STANDARD_DEDUCTION_2025 = {
  single: 15000,
  married: 30000,
  headOfHousehold: 22500
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
  capitalGainsTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  ficaTax: number;
  totalTax: number;
  netPay: number;
  effectiveRate: number;
  marginalRate: number;
  bracketsBreakdown: { rate: number; amount: number }[];
  taxableOrdinaryIncome: number;
  deductionUsed: number;
}

export const calculateUSFederalTax = (
  wages: number, 
  otherOrdinaryIncome: number, // Business income, STCG, etc.
  longTermCapitalGains: number,
  preTaxDeductions: number, 
  filingStatus: 'single' | 'married' | 'headOfHousehold',
  itemizedDeduction?: number
): TaxResult => {
  
  const standardDeduction = STANDARD_DEDUCTION_2025[filingStatus];
  
  // Determine effective deduction
  const deductionUsed = itemizedDeduction !== undefined ? itemizedDeduction : standardDeduction;

  // 1. Calculate Gross Ordinary Income
  const grossOrdinary = wages + otherOrdinaryIncome;
  
  // 2. AGI & Taxable Ordinary Income
  // Note: LTCG is part of AGI, but we separate it for tax calculation logic
  const agiOrdinary = Math.max(0, grossOrdinary - preTaxDeductions);
  const taxableOrdinaryIncome = Math.max(0, agiOrdinary - deductionUsed);
  
  // 3. Calculate Federal Income Tax (Ordinary Progressive)
  let federalTax = 0;
  let marginalRate = 0;
  const bracketsBreakdown: { rate: number; amount: number }[] = [];
  
  const brackets = TAX_BRACKETS_2025[filingStatus];

  for (const bracket of brackets) {
    if (taxableOrdinaryIncome > bracket.min) {
      const taxableAmountInBracket = Math.min(taxableOrdinaryIncome, bracket.max) - bracket.min;
      const taxInBracket = taxableAmountInBracket * bracket.rate;
      federalTax += taxInBracket;
      bracketsBreakdown.push({ rate: bracket.rate, amount: taxInBracket });
      marginalRate = bracket.rate;
    }
  }

  // 4. Calculate Long Term Capital Gains Tax
  // LTCG "stacks" on top of Ordinary Taxable Income
  let capitalGainsTax = 0;
  if (longTermCapitalGains > 0) {
    const ltcgBrackets = LTCG_BRACKETS_2025[filingStatus];
    let remainingLTCG = longTermCapitalGains;
    let currentStack = taxableOrdinaryIncome; // Start stacking from here

    // 0% Bucket
    const limit0 = ltcgBrackets[0].max;
    const roomIn0 = Math.max(0, limit0 - currentStack);
    const amountIn0 = Math.min(remainingLTCG, roomIn0);
    // tax is 0
    remainingLTCG -= amountIn0;
    currentStack += amountIn0;

    // 15% Bucket
    if (remainingLTCG > 0) {
       const limit15 = ltcgBrackets[1].max;
       const roomIn15 = Math.max(0, limit15 - currentStack);
       const amountIn15 = Math.min(remainingLTCG, roomIn15);
       capitalGainsTax += amountIn15 * 0.15;
       remainingLTCG -= amountIn15;
       currentStack += amountIn15;
    }

    // 20% Bucket
    if (remainingLTCG > 0) {
      capitalGainsTax += remainingLTCG * 0.20;
    }
  }

  // 5. Calculate FICA (Social Security + Medicare)
  // FICA applies to Wages (Earned Income) usually. Other Income might be passive or SE.
  // For estimator simplicity, we apply FICA to Wages only.
  
  // Social Security (Capped at wage base)
  const socialSecurityTax = Math.min(wages, SS_WAGE_BASE) * SS_RATE;

  // Medicare (Uncapped 1.45% + Additional 0.9% over threshold)
  let medicareTax = wages * MEDICARE_RATE;
  
  const addlMedThreshold = filingStatus === 'married' ? ADDL_MED_THRESHOLD_MARRIED : ADDL_MED_THRESHOLD_SINGLE; // HoH uses Single threshold usually
  if (wages > addlMedThreshold) {
    medicareTax += (wages - addlMedThreshold) * ADDITIONAL_MEDICARE_RATE;
  }

  const ficaTax = socialSecurityTax + medicareTax;
  const totalTax = federalTax + capitalGainsTax + ficaTax;

  const totalIncome = wages + otherOrdinaryIncome + longTermCapitalGains;

  return {
    federalTax,
    capitalGainsTax,
    socialSecurityTax,
    medicareTax,
    ficaTax,
    totalTax,
    netPay: totalIncome - totalTax - preTaxDeductions,
    effectiveRate: totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0,
    marginalRate: marginalRate * 100,
    bracketsBreakdown,
    taxableOrdinaryIncome,
    deductionUsed
  };
};

// --- UK TAX LOGIC (2024/25) ---

export interface UKTaxResult {
  incomeTax: number;
  nationalInsurance: number;
  totalTax: number;
  netPay: number;
  effectiveRate: number;
  marginalRate: number;
  personalAllowance: number;
}

export const calculateUKTax = (
  wages: number,
  preTaxDeductions: number, // e.g. Salary Sacrifice Pension
): UKTaxResult => {
  
  const taxableIncome = Math.max(0, wages - preTaxDeductions);
  
  // 1. Personal Allowance Logic
  // Standard £12,570. Tapers by £1 for every £2 over £100k
  let personalAllowance = 12570;
  if (taxableIncome > 100000) {
    const reduction = (taxableIncome - 100000) / 2;
    personalAllowance = Math.max(0, personalAllowance - reduction);
  }

  const incomeSubjectToTax = Math.max(0, taxableIncome - personalAllowance);

  // 2. Income Tax Bands (2024/25)
  // Basic: £12,571 to £50,270 (20%)
  // Higher: £50,271 to £125,140 (40%)
  // Additional: Over £125,140 (45%)
  
  // Note: These bands sit on top of Personal Allowance if PA is standard,
  // but strictly the bands are defined by taxable income AFTER PA? 
  // UK system: Bands usually defined as "Taxable Income" brackets where Taxable Income = Gross - PA?
  // Actually, UK usually defines bands by "Gross Income" thresholds assuming Standard PA.
  // Let's use the "Taxable Income" approach (Gross - PA).
  // Basic Band size: 37,700 (50270 - 12570)
  // Higher Band size: 74,870 (125140 - 50270)
  
  let incomeTax = 0;
  let marginalRate = 0;
  let remaining = incomeSubjectToTax;

  // Basic Rate (20%)
  const basicBand = 37700;
  const taxedAtBasic = Math.min(remaining, basicBand);
  if (taxedAtBasic > 0) {
    incomeTax += taxedAtBasic * 0.20;
    remaining -= taxedAtBasic;
    marginalRate = 20;
  }

  // Higher Rate (40%)
  const higherBand = 74870;
  if (remaining > 0) {
    const taxedAtHigher = Math.min(remaining, higherBand);
    incomeTax += taxedAtHigher * 0.40;
    remaining -= taxedAtHigher;
    marginalRate = 40;
  }

  // Additional Rate (45%)
  if (remaining > 0) {
    incomeTax += remaining * 0.45;
    marginalRate = 45;
  }

  // 3. National Insurance (Class 1)
  // Thresholds (Annualized approx):
  // Lower Earnings Limit (LEL): £6,396 (0%)
  // Primary Threshold (PT): £12,570 (Start paying)
  // Upper Earnings Limit (UEL): £50,270
  // Rates: 8% between PT and UEL, 2% above UEL.
  
  // Note: NI is based on GROSS WAGES usually (before pension if relief at source, but AFTER if salary sacrifice).
  // We will assume Salary Sacrifice (preTaxDeductions reduces NIable pay).
  const niablePay = taxableIncome; 
  
  let ni = 0;
  const pt = 12570;
  const uel = 50270;

  if (niablePay > pt) {
    const niMainBand = Math.min(niablePay, uel) - pt;
    ni += niMainBand * 0.08; // 8%
  }
  
  if (niablePay > uel) {
    const niUpperBand = niablePay - uel;
    ni += niUpperBand * 0.02; // 2%
  }

  const totalTax = incomeTax + ni;

  return {
    incomeTax,
    nationalInsurance: ni,
    totalTax,
    netPay: wages - totalTax - preTaxDeductions,
    effectiveRate: wages > 0 ? (totalTax / wages) * 100 : 0,
    marginalRate,
    personalAllowance
  };
};

// --- CANADA TAX LOGIC (2025 Estimate) ---

export interface CanadaTaxResult {
  federalTax: number;
  provincialTax: number;
  cppContribution: number;
  eiContribution: number;
  totalTax: number;
  netPay: number;
  effectiveRate: number;
  marginalRate: number;
  rrspReduction: number; // Tax saved via RRSP
}

export const calculateCanadaTax = (
  wages: number,
  rrspContribution: number,
): CanadaTaxResult => {
  // 1. CPP & EI (Applied to Gross Wages)
  
  // CPP 2025 (Projected)
  // YMPE: $71,300 (Basic Exemption $3,500)
  // Rate: 5.95%
  // Enhanced YAMPE: ~$81,000 (4% rate on difference)
  
  const YMPE = 71300;
  const YAMPE = 81200; // Est
  const CPP_BASIC_EXEMPTION = 3500;
  
  let cpp = 0;
  // Base CPP
  const pensionableEarnings = Math.min(wages, YMPE) - CPP_BASIC_EXEMPTION;
  if (pensionableEarnings > 0) {
    cpp += pensionableEarnings * 0.0595;
  }
  // Enhanced CPP (Tier 2)
  if (wages > YMPE) {
    const tier2Earnings = Math.min(wages, YAMPE) - YMPE;
    cpp += tier2Earnings * 0.04;
  }

  // EI 2025 (Projected)
  // Max Insurable Earnings: $65,700 approx
  // Rate: 1.64% (Outside Quebec)
  const EI_MAX_EARNINGS = 65700; 
  const ei = Math.min(wages, EI_MAX_EARNINGS) * 0.0164;

  // 2. Taxable Income (After RRSP)
  // Note: CPP/EI deductions are tax credits, not direct income deductions usually (except enhanced CPP), 
  // but for simple estimation we usually deduct RRSP from Gross.
  // We will treat Enhanced CPP as a deduction, and basic CPP/EI as credits.
  // Simplifying: Just Taxable = Gross - RRSP. The credits are applied against tax.
  
  const taxableIncome = Math.max(0, wages - rrspContribution);

  // 3. Federal Tax (2025 Brackets Estimate)
  // $0 - $57,375: 15%
  // $57,375 - $114,750: 20.5%
  // $114,750 - $177,882: 26%
  // $177,882 - $253,400: 29%
  // Over $253,400: 33%
  
  const fedBrackets = [
    { rate: 0.15, min: 0, max: 57375 },
    { rate: 0.205, min: 57375, max: 114750 },
    { rate: 0.26, min: 114750, max: 177882 },
    { rate: 0.29, min: 177882, max: 253400 },
    { rate: 0.33, min: 253400, max: Infinity }
  ];

  let federalTax = 0;
  let marginalRateFed = 0;

  for (const b of fedBrackets) {
    if (taxableIncome > b.min) {
      const amt = Math.min(taxableIncome, b.max) - b.min;
      federalTax += amt * b.rate;
      marginalRateFed = b.rate;
    }
  }

  // Basic Personal Amount Credit (Fed) ~ $16,000 * 15%
  const BPA = 16000; // Approx
  const fedCredits = (BPA + (Math.min(wages, YMPE) - 3500) * 0.0595 /* Base CPP */ + ei) * 0.15;
  // Enhanced CPP deduction
  // Actually, enhanced CPP is a deduction from income, Base CPP is a credit. 
  // For this estimator, we simplified taxable income. Let's just apply credits.
  
  federalTax = Math.max(0, federalTax - fedCredits);

  // 4. Provincial Tax (Ontario Proxy for "Average")
  // 5.05% on first $52k
  // 9.15% on next up to $104k
  // 11.16% on next up to $150k
  // 12.16% on next up to $220k
  // 13.16% on excess
  // Plus Surtax (Health Premium etc). Complicated.
  // Simplifying to a flat percentage of Federal Tax or simplified brackets for estimation.
  // Let's use simplified Ontario brackets.
  
  const provBrackets = [
    { rate: 0.0505, min: 0, max: 52000 },
    { rate: 0.0915, min: 52000, max: 104000 },
    { rate: 0.1116, min: 104000, max: 150000 },
    { rate: 0.1216, min: 150000, max: 220000 },
    { rate: 0.1316, min: 220000, max: Infinity }
  ];

  let provincialTax = 0;
  let marginalRateProv = 0;
  for (const b of provBrackets) {
    if (taxableIncome > b.min) {
       const amt = Math.min(taxableIncome, b.max) - b.min;
       provincialTax += amt * b.rate;
       marginalRateProv = b.rate;
    }
  }
  
  // Provincial Credits (BPA ~12k)
  const provCredits = (12000 + (Math.min(wages, YMPE) - 3500)*0.0595 + ei) * 0.0505;
  provincialTax = Math.max(0, provincialTax - provCredits);
  
  // Ontario Health Premium (approx)
  let ohp = 0;
  if (taxableIncome > 20000) ohp = 300;
  if (taxableIncome > 36000) ohp = 450;
  if (taxableIncome > 48000) ohp = 600;
  if (taxableIncome > 72000) ohp = 750;
  if (taxableIncome > 200000) ohp = 900;
  
  provincialTax += ohp;

  const totalTax = federalTax + provincialTax + cpp + ei;

  return {
    federalTax,
    provincialTax,
    cppContribution: cpp,
    eiContribution: ei,
    totalTax,
    netPay: wages - totalTax - rrspContribution,
    effectiveRate: (totalTax / wages) * 100,
    marginalRate: (marginalRateFed + marginalRateProv) * 100,
    rrspReduction: 0 // Placeholder, logic would involve re-calc with 0 rrsp and diff
  };
};