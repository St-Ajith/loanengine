// Domain types for the loan engine. Kept dependency-free so the engine
// module can be lifted out for tests or reuse in another runtime.

export type AssetType = 'home' | 'car';
export type AssetCondition = 'new' | 'used';

/**
 * Payment frequency. The engine honestly re-amortizes at the selected
 * cadence — period rate = APR / paymentsPerYear, n = totalMonths × (paymentsPerYear/12).
 * Users wanting the "bi-weekly trick" savings (effectively one extra payment/year)
 * can express that as a recurring overpayment instead.
 */
export type Frequency = 'monthly' | 'biweekly' | 'quarterly' | 'semiannual' | 'annual';

export const PAYMENTS_PER_YEAR: Record<Frequency, number> = {
  monthly: 12,
  biweekly: 26,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
};

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
 * applied at a specific month.
 */
export type Overpayment =
  | { kind: 'recurring'; amount: number; startMonth: number; endMonth?: number }
  | { kind: 'lump'; amount: number; month: number };

export interface LoanInputs {
  /** Gross asset purchase value (V) — sticker price of the home or car. */
  assetValue: number;
  /** Capital down payment (D) — paid upfront, not borrowed. */
  downPayment: number;
  /** Loan term — years component. */
  termYears: number;
  /** Loan term — months component. Total term = termYears * 12 + termMonths. */
  termMonths: number;
  /** Rate profile — flat by default, or tiered for promo financing. */
  rateProfile: RateProfile;
  /** Asset type (home / car) — drives sensible defaults and limits. */
  assetType: AssetType;
  /** Condition — drives default APR ranges. */
  condition: AssetCondition;
  /** Payment frequency. Defaults to monthly. */
  frequency: Frequency;
  /** Active overpayment scenarios. Empty array means baseline only. */
  overpayments: Overpayment[];
}

export interface ScheduleRow {
  /** 1-indexed period number (NOT month — depends on frequency). */
  period: number;
  /** The calendar month this period falls in (rounded). For charting/labelling. */
  month: number;
  /** Cumulative principal paid through this period. */
  cumulativePrincipal: number;
  /** Cumulative interest paid through this period. */
  cumulativeInterest: number;
  /** Principal paid in this single period (from the scheduled payment). */
  principalPaid: number;
  /** Interest paid in this single period. */
  interestPaid: number;
  /** Extra principal applied this period from overpayments. */
  overpayment: number;
  /** Outstanding balance after this period. */
  balance: number;
  /** The scheduled payment for this period (may change at promo boundary). */
  scheduledPayment: number;
}

export interface LoanResult {
  /** Net principal financed = assetValue − downPayment. */
  principal: number;
  /** Selected payment frequency. */
  frequency: Frequency;
  /** Number of scheduled periods for the term (e.g. 360 for monthly 30y). */
  scheduledPeriods: number;
  /** Calendar months in the original term. */
  scheduledMonths: number;
  /** Periods actually used — may be fewer if overpayments closed the loan early. */
  actualPeriods: number;
  /** Calendar months the loan actually takes given modifications. */
  actualMonths: number;
  /** Periodic payment at the start (during promo, if any). */
  paymentInitial: number;
  /** Periodic payment after the promo period, if rate is tiered. Same as initial otherwise. */
  paymentPostPromo: number;
  /** Total interest paid across the entire actual schedule. */
  totalInterest: number;
  /** Total cash out: principal + total interest + total overpayments. */
  totalPaid: number;
  /** Sum of all overpayments applied. */
  totalOverpayments: number;
  /** Full period-by-period schedule. */
  schedule: ScheduleRow[];
}

/**
 * Side-by-side baseline vs modified result. The UI uses the delta fields
 * to highlight savings only when modifications are actually active.
 */
export interface ComparisonResult {
  baseline: LoanResult;
  modified: LoanResult;
  /** True when modified differs meaningfully from baseline (any overpayment,
   *  non-monthly frequency, or tiered rate). When false, UI hides deltas. */
  hasModifications: boolean;
  interestSaved: number;
  monthsSaved: number;
}
