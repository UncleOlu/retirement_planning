
export interface MortgageDetails {
  principal: number;
  rate: number; // Annual percentage (e.g. 5.13)
  termYears: number;
  extraPaymentMonthly: number;
}

export interface AmortizationMonth {
  month: number;
  balance: number;
  interest: number;
  principal: number;
  totalInterest: number;
  totalPaid: number;
}

export interface MortgageResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  payoffMonths: number;
  schedule: AmortizationMonth[];
}

/**
 * Calculates standard monthly mortgage payment (Principal + Interest)
 */
export const calculateMonthlyPayment = (principal: number, annualRate: number, years: number): number => {
  if (years <= 0) return principal;
  if (annualRate === 0) return principal / (years * 12);
  
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;
  
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
};

/**
 * Generates full amortization schedule including extra payments starting at specific month
 */
export const calculateAmortization = (
  principal: number, 
  annualRate: number, 
  termYears: number, 
  extraPaymentMonthly: number = 0,
  startExtraPaymentMonth: number = 0 // Month index to start applying extra payment (0-based)
): MortgageResult => {
  const monthlyRate = annualRate / 100 / 12;
  const scheduledPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  
  let balance = principal;
  let totalInterest = 0;
  let totalPaid = 0;
  const schedule: AmortizationMonth[] = [];
  let month = 0;
  const maxMonths = termYears * 12; // Safety cap

  // Loop until paid off or max term + buffer
  while (balance > 0.01 && month < maxMonths + 120) { 
    const isExtraPaymentPeriod = month >= startExtraPaymentMonth;
    month++;
    
    const interestPayment = balance * monthlyRate;
    let principalPayment = scheduledPayment - interestPayment;
    
    // Add extra payment only if we are past the start month
    if (isExtraPaymentPeriod) {
       // Ensure we don't overpay if balance is low
       if (principalPayment + interestPayment + extraPaymentMonthly < balance + interestPayment) { 
         principalPayment += extraPaymentMonthly;
       } else {
         // Final payoff adjustment
         principalPayment = balance;
       }
    }

    // Cap principal payment at balance
    if (principalPayment > balance) {
      principalPayment = balance;
    }

    balance -= principalPayment;
    totalInterest += interestPayment;
    totalPaid += (interestPayment + principalPayment);

    schedule.push({
      month,
      balance: Math.max(0, balance),
      interest: interestPayment,
      principal: principalPayment,
      totalInterest,
      totalPaid
    });
  }

  return {
    monthlyPayment: scheduledPayment,
    totalInterest,
    totalPaid,
    payoffMonths: month,
    schedule
  };
};

export interface RefinanceOption {
  termYears: number;
  rate: number;
  closingCosts: number;
  rollInCosts: boolean;
}

export interface RefinanceAnalysis {
  option: RefinanceOption;
  newMonthlyPayment: number;
  monthlySavings: number;
  breakEvenMonths: number;
  lifetimeSavings: number; // Compared to remaining term of original
  isViable: boolean;
}

/**
 * Analyzes if refinancing is worth it compared to CURRENT REMAINING loan
 */
export const analyzeRefinance = (
  currentBalance: number,
  currentMonthlyPayment: number, // The actual P+I payment of the existing loan
  currentRemainingTotalCost: number, // The total P+I remaining to be paid on existing loan
  options: RefinanceOption[]
): RefinanceAnalysis[] => {
  
  return options.map(opt => {
    const loanAmount = opt.rollInCosts ? currentBalance + opt.closingCosts : currentBalance;
    const upFrontCost = opt.rollInCosts ? 0 : opt.closingCosts;
    
    // Calculate new loan details
    const newResult = calculateAmortization(loanAmount, opt.rate, opt.termYears, 0, 0);
    
    const monthlySavings = currentMonthlyPayment - newResult.monthlyPayment;
    
    // Break Even: Closing Costs / Monthly Savings
    // If costs are rolled in, "Closing Costs" is technically 0 upfront, 
    // but the logic is usually: How long until the lower payment makes up for the cost of the transaction?
    // If rolled in, the cost is the increased principal.
    // Simple standard: Total Investment / Monthly Return.
    // Investment = Closing Costs.
    
    let breakEvenMonths = 9999;
    if (monthlySavings > 0) {
       breakEvenMonths = opt.closingCosts / monthlySavings;
    }

    // Lifetime Savings: (Old Remaining Cost) - (New Total Cost + Upfront Cash)
    const lifetimeSavings = currentRemainingTotalCost - (newResult.totalPaid + upFrontCost);

    return {
      option: opt,
      newMonthlyPayment: newResult.monthlyPayment,
      monthlySavings,
      breakEvenMonths,
      lifetimeSavings,
      isViable: lifetimeSavings > 0 || monthlySavings > 0 // Viable if it saves money monthly OR total
    };
  });
};
