// Domain types for the loan engine.

export type AssetType = 'home' | 'car';
export type AssetCondition = 'new' | 'used';

/**
 * Rate profile. A flat rate is the common case; a tiered rate models
 * dealer promo financing — common in Norway car loans where the
 * manufacturer offers 0% (or e.g. 2.99%) for the first N months,
 * then the standard rate kicks in.
 */
export type RateProfile =
  | { kind: 'flat'; apr: number }
  | { kind: 'tiered'; promoApr: number; promoMonths: number; postApr: number };

/**
 * Overpayment modifiers. Recurring layers a fixed extra amount onto
 * every payment in a window; lump is a single one-off principal hit
 * applied at a specific month. Both shorten the loan term — the
 * monthly EMI stays fixed.
 */
export type Overpayment =
  | { kind: 'recurring'; amount: number; startMonth: number; endMonth?: number }
  | { kind: 'lump'; amount: number; month: number };

export interface LoanInputs {
  /** Gross asset purchase value (V). */
  assetValue: number;
  /** Capital down payment (D). */
  downPayment: number;
  /** Loan term — years component. */
  termYears: number;
  /** Loan term — months component. Total term = termYears * 12 + termMonths. */
  termMonths: number;
  /** Rate profile — flat by default, or tiered for promo financing. */
  rateProfile: RateProfile;
  /** Asset type — drives sensible defaults and limits. */
  assetType: AssetType;
  /** Condition — drives default APR ranges. */
  condition: AssetCondition;
  /** Active overpayment scenarios. Empty array = baseline. */
  overpayments: Overpayment[];
}

export interface ScheduleRow {
  /** 1-indexed month number. */
  month: number;
  /** Cumulative principal paid through this month. */
  cumulativePrincipal: number;
  /** Cumulative interest paid through this month. */
  cumulativeInterest: number;
  /** Principal paid from the scheduled EMI this month. */
  principalPaid: number;
  /** Interest paid this month. */
  interestPaid: number;
  /** Extra principal applied this month from overpayments. */
  overpayment: number;
  /** Outstanding balance after this month. */
  balance: number;
  /** Scheduled EMI for this month (changes at promo boundary). */
  scheduledPayment: number;
}

export interface LoanResult {
  /** Net principal financed = assetValue − downPayment. */
  principal: number;
  /** Months in the original term. */
  scheduledMonths: number;
  /** Months actually used — may be fewer if overpayments closed it early. */
  actualMonths: number;
  /** Monthly EMI during the promo period (or for the full term if flat). */
  paymentInitial: number;
  /** Monthly EMI after the promo period, if rate is tiered. Same as initial otherwise. */
  paymentPostPromo: number;
  /** Total interest paid across the actual schedule. */
  totalInterest: number;
  /** Total cash out: principal + total interest. */
  totalPaid: number;
  /** Sum of all overpayments applied. */
  totalOverpayments: number;
  /** Full month-by-month schedule. */
  schedule: ScheduleRow[];
}

/**
 * Side-by-side baseline vs modified result.
 */
export interface ComparisonResult {
  baseline: LoanResult;
  modified: LoanResult;
  /** True when modified differs from baseline (any overpayment or tiered rate). */
  hasModifications: boolean;
  interestSaved: number;
  monthsSaved: number;
  totalPaidSaved: number;
}
