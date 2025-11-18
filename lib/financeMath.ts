
import { SimulationResult, UserInput, YearlyProjection, InvestmentStrategyType } from './types';
import { INVESTMENT_STRATEGIES } from './constants';

/**
 * Calculates the nominal annual return rate based on user selection.
 */
export const getNominalReturnRate = (inputs: UserInput): number => {
  if (inputs.strategy === InvestmentStrategyType.CUSTOM) {
    return inputs.customReturnRate / 100;
  }
  return INVESTMENT_STRATEGIES[inputs.strategy].rate / 100;
};

/**
 * Adjusts a future nominal value to today's real dollars.
 */
export const adjustFutureToReal = (futureValue: number, inflationRate: number, years: number): number => {
  return futureValue / Math.pow(1 + inflationRate, years);
};

/**
 * Grows a real value today to a future nominal value.
 */
export const growRealToNominal = (presentValue: number, inflationRate: number, years: number): number => {
  return presentValue * Math.pow(1 + inflationRate, years);
};

/**
 * Solves for the required monthly contribution.
 * Note: This simplified solver assumes Tax-Deferred (Traditional) for simplicity in the "Quick Gap" check.
 */
export const calculateRequiredContribution = (
  targetFV: number,
  currentPrincipal: number,
  annualRate: number,
  years: number
): number => {
  if (years <= 0) return 0;
  
  const months = years * 12;
  const monthlyRate = annualRate / 12;
  
  const fvPrincipal = currentPrincipal * Math.pow(1 + monthlyRate, months);
  const shortfall = targetFV - fvPrincipal;
  
  if (shortfall <= 0) return 0;

  if (monthlyRate === 0) {
    return Math.ceil(shortfall / months);
  }

  const annuityFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  return Math.ceil(shortfall / annuityFactor);
};

/**
 * Solves for the required annual return rate to hit a target future value.
 * Uses binary search approximation.
 */
export const calculateRequiredReturn = (
  targetFV: number,
  currentPrincipal: number,
  monthlyContribution: number,
  years: number
): number | null => {
  if (years <= 0) return 0;
  
  const months = years * 12;
  
  // Helper to calculate FV given an annual rate
  const getFV = (annualRate: number) => {
    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0) {
      return currentPrincipal + (monthlyContribution * months);
    }
    const factor = Math.pow(1 + monthlyRate, months);
    const fvPrincipal = currentPrincipal * factor;
    const fvContributions = monthlyContribution * ((factor - 1) / monthlyRate);
    return fvPrincipal + fvContributions;
  };

  // Binary search for rate
  let low = -0.5; // -50%
  let high = 2.0; // 200% - Realistic upper bound for search
  
  // Quick check if even high return isn't enough
  if (getFV(high) < targetFV) return null; 

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const fv = getFV(mid);
    
    if (Math.abs(fv - targetFV) < 10) { // Precision within $10
       return mid;
    }
    
    if (fv < targetFV) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return (low + high) / 2;
};

export const runSimulation = (inputs: UserInput): SimulationResult => {
  const inflationRate = inputs.inflationRate / 100;
  const nominalReturnRate = getNominalReturnRate(inputs);
  const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
  const yearsInRetirement = inputs.lifeExpectancy - inputs.retirementAge;
  const withdrawRate = inputs.safeWithdrawalRate / 100;
  const taxRate = (inputs.retirementTaxRate || 0) / 100;

  // Roth Contribution logic: We now trust the input (capped at total contribution by UI)
  // This allows for Roth 401(k) scenarios where limit is > $7000
  const effectiveRothContribution = Math.min(inputs.monthlyRothContribution, inputs.monthlyContribution);
  const effectiveTradContribution = Math.max(0, inputs.monthlyContribution - effectiveRothContribution);

  // 1. Validation
  if (yearsToRetirement <= 0) {
    return {
      isValid: false,
      validationError: "Retirement age must be greater than current age.",
      yearsToRetirement: 0,
      yearsInRetirement: 0,
      projectedNominal: 0, projectedReal: 0, targetNominal: 0, targetReal: 0,
      projectedAfterTaxNominal: 0, projectedAfterTaxReal: 0,
      projectedIncomeNominal: 0, projectedIncomeReal: 0, targetIncomeNominal: 0, targetIncomeReal: 0,
      isOnTrack: false, gapNominal: 0, requiredMonthlyContribution: 0, projections: [], solvencyAge: null
    };
  }

  // 2. Determine Targets
  // Social Security is usually partially taxable, but for simplicity we treat it as Net Income here
  const ssAnnualReal = (inputs.estimatedSocialSecurity || 0) * 12;

  let targetIncomeReal = 0; // Spendable (After-Tax) Goal

  if (inputs.targetType === 'income') {
    targetIncomeReal = inputs.targetValue;
  } else {
    // If target is Portfolio Value, we assume that's the GROSS portfolio they want.
    // We convert that to a Real Income estimate.
    const targetPortfolioNominal = inputs.targetValue;
    const targetPortfolioReal = adjustFutureToReal(targetPortfolioNominal, inflationRate, yearsToRetirement);
    
    // How much income does this generate?
    // We assume this portfolio is Traditional (Taxable) for the "Goal" definition to be safe.
    // Net Income = (Portfolio * SafeRate) * (1 - TaxRate) + SS
    const grossPortfolioIncome = targetPortfolioReal * withdrawRate;
    const netPortfolioIncome = grossPortfolioIncome * (1 - taxRate);
    targetIncomeReal = netPortfolioIncome + ssAnnualReal;
  }

  // 3. Simulation Setup
  const projections: YearlyProjection[] = [];
  
  // Buckets Initialization
  // Safely split current portfolio. Ensure we don't have more Roth than Total Portfolio.
  const safeCurrentRoth = Math.min(inputs.currentRothBalance || 0, inputs.currentPortfolio);
  let balanceRoth = safeCurrentRoth;
  let balanceTrad = Math.max(0, inputs.currentPortfolio - safeCurrentRoth);

  let totalContributions = 0;
  let solvencyAge: number | null = null;
  
  const monthlyRate = nominalReturnRate / 12;
  const monthlyInflation = Math.pow(1 + inflationRate, 1/12) - 1;
  
  const totalMonthsToSimulate = (yearsToRetirement + yearsInRetirement) * 12; 
  const retirementMonthIndex = yearsToRetirement * 12;

  // Drawdown Logic Preparation
  const baseRealMonthlySpendable = Math.max(0, (targetIncomeReal - ssAnnualReal) / 12);
  const initialNominalMonthlySpendable = baseRealMonthlySpendable * Math.pow(1 + inflationRate, yearsToRetirement);

  for (let m = 0; m <= totalMonthsToSimulate; m++) {
    const currentYearIndex = Math.floor(m / 12);
    const age = inputs.currentAge + currentYearIndex;
    const isRetired = m >= retirementMonthIndex;
    
    // Snapshot
    if (m % 12 === 0) {
      const totalNominal = balanceTrad + balanceRoth;
      
      // Calculate After-Tax Value (Liquidation Value)
      // If we liquidated everything today: Roth is free, Trad is taxed.
      const totalAfterTaxNominal = balanceRoth + (balanceTrad * (1 - taxRate));
      // const totalAfterTaxReal = adjustFutureToReal(totalAfterTaxNominal, inflationRate, currentYearIndex);
      
      // Reference Target Lines
      const incomeGapReal = Math.max(0, targetIncomeReal - ssAnnualReal);
      // Required Portfolio to generate this Net Income from a traditional source
      const requiredTradPortfolioReal = incomeGapReal / (withdrawRate * (1 - taxRate));
      const requiredTradPortfolioNominal = growRealToNominal(requiredTradPortfolioReal, inflationRate, yearsToRetirement);

      projections.push({
        year: currentYearIndex,
        age,
        balanceNominal: Math.round(totalNominal),
        balanceReal: Math.round(adjustFutureToReal(totalNominal, inflationRate, currentYearIndex)),
        contributionsTotal: Math.round(totalContributions + inputs.currentPortfolio),
        growthNominal: Math.round(totalNominal - (totalContributions + inputs.currentPortfolio)),
        targetLineNominal: Math.round(requiredTradPortfolioNominal),
        targetLineReal: Math.round(requiredTradPortfolioReal)
      });
    }

    if (!isRetired) {
       // Accumulation
       balanceTrad += balanceTrad * monthlyRate + effectiveTradContribution;
       balanceRoth += balanceRoth * monthlyRate + effectiveRothContribution;
       totalContributions += inputs.monthlyContribution;
    } else {
       // Drawdown
       // Growth first
       balanceTrad += balanceTrad * monthlyRate;
       balanceRoth += balanceRoth * monthlyRate;

       // Withdrawal
       const monthsSinceRetirement = m - retirementMonthIndex;
       const nominalSpendableNeeded = initialNominalMonthlySpendable * Math.pow(1 + monthlyInflation, monthsSinceRetirement);
       
       let remainingCashNeeded = nominalSpendableNeeded;
       
       // 1. Try Traditional (Taxable)
       const grossWithdrawalNeeded = remainingCashNeeded / (1 - taxRate);
       
       if (balanceTrad >= grossWithdrawalNeeded) {
         balanceTrad -= grossWithdrawalNeeded;
         remainingCashNeeded = 0;
       } else {
         // Take all Trad
         const cashFromTrad = balanceTrad * (1 - taxRate);
         balanceTrad = 0;
         remainingCashNeeded -= cashFromTrad;
       }
       
       // 2. Try Roth (Tax Free)
       if (remainingCashNeeded > 0) {
         if (balanceRoth >= remainingCashNeeded) {
           balanceRoth -= remainingCashNeeded;
           remainingCashNeeded = 0;
         } else {
           balanceRoth = 0;
           remainingCashNeeded -= balanceRoth; // Still short
         }
       }

       if (remainingCashNeeded > 1) { // Tolerance
         if (solvencyAge === null) {
           solvencyAge = age + (m % 12) / 12;
         }
       }
    }
  }

  // Final Retirement Snapshot
  const retirementProj = projections.find(p => p.age === inputs.retirementAge);
  const finalGrossNominal = retirementProj ? retirementProj.balanceNominal : 0;
  const finalGrossReal = retirementProj ? retirementProj.balanceReal : 0;

  // Re-calculate split at retirement for income projection
  // We can't just use the loop vars because loop goes to death
  // We need the values at 'retirementMonthIndex'
  // Since we didn't store split in projection array, let's simulate just accumulation again quickly?
  // Or better, just add split to Projection object? For now, let's approximate ratio based on accumulation.
  // Actually, let's just re-run accumulation phase math to get exact split.
  let rTrad = Math.max(0, inputs.currentPortfolio - safeCurrentRoth);
  let rRoth = safeCurrentRoth;
  const accumMonths = yearsToRetirement * 12;
  for(let i=0; i<accumMonths; i++) {
      rTrad += rTrad * monthlyRate + effectiveTradContribution;
      rRoth += rRoth * monthlyRate + effectiveRothContribution;
  }
  const finalTradBal = rTrad;
  const finalRothBal = rRoth;

  const safeIncomeTrad = finalTradBal * withdrawRate * (1 - taxRate);
  const safeIncomeRoth = finalRothBal * withdrawRate; // Tax free
  
  const projectedNetIncomeNominal = safeIncomeTrad + safeIncomeRoth + growRealToNominal(ssAnnualReal, inflationRate, yearsToRetirement);
  const projectedNetIncomeReal = adjustFutureToReal(projectedNetIncomeNominal, inflationRate, yearsToRetirement);
  
  // Calculate Liquidation Value (After Tax Portfolio)
  const liquidationNominal = finalRothBal + (finalTradBal * (1 - taxRate));
  const liquidationReal = adjustFutureToReal(liquidationNominal, inflationRate, yearsToRetirement);

  // Target Calculation for Comparison
  const targetNominal = growRealToNominal(targetIncomeReal, inflationRate, yearsToRetirement); 

  const incomeGap = projectedNetIncomeReal - targetIncomeReal;
  const isOnTrack = incomeGap > -100; // $100 tolerance

  return {
    isValid: true,
    yearsToRetirement,
    yearsInRetirement,
    projectedNominal: finalGrossNominal,
    projectedReal: finalGrossReal,
    projectedAfterTaxNominal: liquidationNominal,
    projectedAfterTaxReal: liquidationReal,
    
    targetNominal: inputs.targetType === 'total' ? inputs.targetValue : targetNominal, 
    targetReal: inputs.targetType === 'total' ? adjustFutureToReal(inputs.targetValue, inflationRate, yearsToRetirement) : targetIncomeReal,

    projectedIncomeNominal: projectedNetIncomeNominal,
    projectedIncomeReal: projectedNetIncomeReal,
    targetIncomeNominal: growRealToNominal(targetIncomeReal, inflationRate, yearsToRetirement),
    targetIncomeReal: targetIncomeReal,

    isOnTrack,
    gapNominal: incomeGap,
    requiredMonthlyContribution: 0, 
    solvencyAge,
    
    projections
  };
};
