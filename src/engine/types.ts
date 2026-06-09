// Domain types for the loan engine. Kept dependency-free so the engine
// module can be lifted out for tests or reuse in another runtime.

export type AssetType = 'home' | 'car';
export type AssetCondition = 'new' | 'used';

export interface LoanInputs {
  /** Gross asset purchase value (V) — sticker price of the home or car. */
  assetValue: number;
  /** Capital down payment (D) — paid upfront, not borrowed. */
  downPayment: number;
  /** Loan term — years component. */
  termYears: number;
  /** Loan term — months component. Total term = termYears * 12 + termMonths. */
  termMonths: number;
  /** Nominal Annual Percentage Rate (R) as a percentage, e.g. 6.5 for 6.5%. */
  apr: number;
  /** Asset type (home / car) — drives sensible defaults and limits. */
  assetType: AssetType;
  /** Condition — drives default APR ranges. */
  condition: AssetCondition;
}

export interface ScheduleRow {
  /** 1-indexed month number. */
  month: number;
  /** Cumulative principal paid through this month. */
  cumulativePrincipal: number;
  /** Cumulative interest paid through this month. */
  cumulativeInterest: number;
  /** Principal paid in this single period. */
  principalPaid: number;
  /** Interest paid in this single period. */
  interestPaid: number;
  /** Outstanding balance after this period. */
  balance: number;
}

export interface LoanResult {
  /** Net principal financed = assetValue − downPayment. */
  principal: number;
  /** Periodic monthly rate (r) = apr / 12 / 100. */
  monthlyRate: number;
  /** Total scheduled payments (n) = termYears × 12 + termMonths. */
  totalMonths: number;
  /** Equated monthly installment (EMI). */
  emi: number;
  /** Sum of all interest paid across the schedule. */
  totalInterest: number;
  /** Sum of EMI × n = total amount handed to the lender. */
  totalPayments: number;
  /** Full month-by-month amortization. */
  schedule: ScheduleRow[];
}
