
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
  const CAP_GAINS_RATE = 0.15; // Assumed Long Term Capital Gains Rate

  // 1. Validation
  if (yearsToRetirement < 0) {
     // Allow 0 for "Just Retired"
     return {
      isValid: false,
      validationError: "Retirement age cannot be in the past.",
      yearsToRetirement: 0,
      yearsInRetirement: 0,
      projectedNominal: 0, projectedReal: 0, targetNominal: 0, targetReal: 0,
      projectedAfterTaxNominal: 0, projectedAfterTaxReal: 0,
      projectedIncomeNominal: 0, projectedIncomeReal: 0, targetIncomeNominal: 0, targetIncomeReal: 0,
      isOnTrack: false, gapNominal: 0, requiredMonthlyContribution: 0, projections: [], solvencyAge: null
    };
  }

  // Contribution Routing
  // Explicit buckets based on user input
  const contribRoth = inputs.savingsRoth401k + inputs.savingsRothIRA;
  const contribBrokerage = inputs.savingsBrokerage;
  const contribTrad = inputs.savingsTrad401k; 
  
  const breakdownSum = contribRoth + contribBrokerage + contribTrad;
  
  // Fallback Logic if user used the main slider but not the detailed inputs (legacy support or direct edit)
  // If the detailed buckets are 0, but monthlyContribution is > 0, allocate based on legacy logic
  let effectiveRoth = contribRoth;
  let effectiveBrokerage = contribBrokerage;
  let effectiveTrad = contribTrad;

  if (breakdownSum === 0 && inputs.monthlyContribution > 0) {
      effectiveRoth = Math.min(inputs.monthlyRothContribution, inputs.monthlyContribution);
      effectiveTrad = Math.max(0, inputs.monthlyContribution - effectiveRoth);
      effectiveBrokerage = 0;
  }

  // 2. Determine Targets
  const ssAnnualReal = (inputs.estimatedSocialSecurity || 0) * 12;

  let targetIncomeReal = 0; // Spendable (After-Tax) Goal

  if (inputs.targetType === 'income') {
    targetIncomeReal = inputs.targetValue;
  } else {
    const targetPortfolioNominal = inputs.targetValue;
    const targetPortfolioReal = adjustFutureToReal(targetPortfolioNominal, inflationRate, yearsToRetirement);
    const grossPortfolioIncome = targetPortfolioReal * withdrawRate;
    const netPortfolioIncome = grossPortfolioIncome * (1 - taxRate);
    targetIncomeReal = netPortfolioIncome + ssAnnualReal;
  }

  // 3. Simulation Setup
  const projections: YearlyProjection[] = [];
  
  // Current Balance Buckets
  // User inputs determine the starting buckets explicitly.
  const safeCurrentRoth = Math.min(inputs.currentRothBalance || 0, inputs.currentPortfolio);
  const safeCurrentBrokerage = Math.min(inputs.currentBrokerageBalance || 0, inputs.currentPortfolio - safeCurrentRoth);
  
  let balanceRoth = safeCurrentRoth;
  let balanceBrokerage = safeCurrentBrokerage;
  // Traditional is the remainder
  let balanceTrad = Math.max(0, inputs.currentPortfolio - safeCurrentRoth - safeCurrentBrokerage);
  
  // Tracks principal for tax calculations. We assume the current Brokerage balance is the "Cost Basis" 
  // (principal) for the simulation, so we only tax future growth.
  let basisBrokerage = safeCurrentBrokerage; 

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
      const totalNominal = balanceTrad + balanceRoth + balanceBrokerage;
      
      // Calculate After-Tax Value (Liquidation Value)
      // Roth: 100%
      // Trad: 100% * (1 - taxRate)
      // Brokerage: Basis + (Gains * (1 - CAP_GAINS_RATE))
      const brokerageGains = Math.max(0, balanceBrokerage - basisBrokerage);
      const brokerageAfterTax = basisBrokerage + (brokerageGains * (1 - CAP_GAINS_RATE));
      
      // Approximate liquidation value (if we sold everything today)
      const totalAfterTaxNominal = balanceRoth + brokerageAfterTax + (balanceTrad * (1 - taxRate));
      
      // Reference Target Lines
      const incomeGapReal = Math.max(0, targetIncomeReal - ssAnnualReal);
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
       balanceTrad += balanceTrad * monthlyRate + effectiveTrad;
       balanceRoth += balanceRoth * monthlyRate + effectiveRoth;
       
       balanceBrokerage += balanceBrokerage * monthlyRate + effectiveBrokerage;
       basisBrokerage += effectiveBrokerage; // Add new principal to basis

       totalContributions += inputs.monthlyContribution;
    } else {
       // Drawdown
       // Growth first
       balanceTrad += balanceTrad * monthlyRate;
       balanceRoth += balanceRoth * monthlyRate;
       balanceBrokerage += balanceBrokerage * monthlyRate;

       // Withdrawal
       const monthsSinceRetirement = m - retirementMonthIndex;
       const nominalSpendableNeeded = initialNominalMonthlySpendable * Math.pow(1 + monthlyInflation, monthsSinceRetirement);
       
       let remainingCashNeeded = nominalSpendableNeeded;
       
       // Strategy: Burn Taxable (Trad) -> Brokerage -> Roth
       // 1. Try Traditional (Taxable Income)
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
       
       // 2. Try Brokerage (Cap Gains)
       if (remainingCashNeeded > 0) {
          // Estimate tax drag on brokerage withdrawal
          // Simplified: We assume the withdrawal has the same basis/gain ratio as the whole account
          const totalBrok = balanceBrokerage;
          if (totalBrok > 0) {
             const gainRatio = Math.max(0, (balanceBrokerage - basisBrokerage) / balanceBrokerage);
             const effectiveTaxDrag = gainRatio * CAP_GAINS_RATE;
             const grossBrokNeeded = remainingCashNeeded / (1 - effectiveTaxDrag);

             if (balanceBrokerage >= grossBrokNeeded) {
               balanceBrokerage -= grossBrokNeeded;
               // Reduce basis proportionally
               basisBrokerage -= (grossBrokNeeded * (1 - gainRatio)); 
               remainingCashNeeded = 0;
             } else {
               // Take all Brokerage
               const cashFromBrok = balanceBrokerage * (1 - effectiveTaxDrag);
               balanceBrokerage = 0;
               basisBrokerage = 0;
               remainingCashNeeded -= cashFromBrok;
             }
          }
       }

       // 3. Try Roth (Tax Free)
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

  // Final Snapshot for Summary
  const retirementProj = projections.find(p => p.age === inputs.retirementAge);
  const finalGrossNominal = retirementProj ? retirementProj.balanceNominal : 0;
  const finalGrossReal = retirementProj ? retirementProj.balanceReal : 0;

  // Recalculate liquidation value at retirement specific timestamp for accuracy
  let rTrad = Math.max(0, inputs.currentPortfolio - safeCurrentRoth - safeCurrentBrokerage);
  let rRoth = safeCurrentRoth;
  let rBrok = safeCurrentBrokerage;
  let rBasisBrok = safeCurrentBrokerage;
  const accumMonths = yearsToRetirement * 12;
  for(let i=0; i<accumMonths; i++) {
      rTrad += rTrad * monthlyRate + effectiveTrad;
      rRoth += rRoth * monthlyRate + effectiveRoth;
      rBrok += rBrok * monthlyRate + effectiveBrokerage;
      rBasisBrok += effectiveBrokerage;
  }
  
  const finalBrokGains = Math.max(0, rBrok - rBasisBrok);
  const finalBrokNet = rBasisBrok + (finalBrokGains * (1 - CAP_GAINS_RATE));
  const liquidationNominal = rRoth + finalBrokNet + (rTrad * (1 - taxRate));
  const liquidationReal = adjustFutureToReal(liquidationNominal, inflationRate, yearsToRetirement);

  // Estimate Income Generation Potential
  const brokDrag = (rBrok > 0 ? ((rBrok - rBasisBrok)/rBrok) : 0) * CAP_GAINS_RATE;
  
  const safeIncomeTrad = rTrad * withdrawRate * (1 - taxRate);
  const safeIncomeRoth = rRoth * withdrawRate;
  const safeIncomeBrok = rBrok * withdrawRate * (1 - brokDrag);
  
  const projectedNetIncomeNominal = safeIncomeTrad + safeIncomeRoth + safeIncomeBrok + growRealToNominal(ssAnnualReal, inflationRate, yearsToRetirement);
  const projectedNetIncomeReal = adjustFutureToReal(projectedNetIncomeNominal, inflationRate, yearsToRetirement);
  
  const targetNominal = growRealToNominal(targetIncomeReal, inflationRate, yearsToRetirement); 
  const incomeGap = projectedNetIncomeReal - targetIncomeReal;
  const isOnTrack = incomeGap > -100; 

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
