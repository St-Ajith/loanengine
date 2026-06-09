// Phase 2 amortization engine.
//
// Handles:
//   - Variable payment frequency (monthly / biweekly / quarterly / semi / annual)
//   - Tiered (promo) rate profiles — e.g. 0% for 36 months, then 6.5%
//   - Recurring and lump-sum overpayments, with early payoff
//
// All functions are pure: same inputs → same outputs, no side effects.
// The UI consumes `LoanResult` only — it doesn't care which combination
// of features produced it.

import type {
  Frequency,
  LoanInputs,
  LoanResult,
  Overpayment,
  RateProfile,
  ScheduleRow,
} from './types';
import { PAYMENTS_PER_YEAR } from './types';

/**
 * Standard EMI formula for an annuity loan.
 *   payment = [P × r × (1+r)^n] / [(1+r)^n − 1]
 * Falls back to P/n when r is zero (otherwise a division by zero).
 */
export function computePayment(principal: number, periodRate: number, periods: number): number {
  if (periods <= 0 || principal <= 0) return 0;
  if (periodRate === 0) return principal / periods;
  const compounded = Math.pow(1 + periodRate, periods);
  return (principal * periodRate * compounded) / (compounded - 1);
}

/**
 * Annual APR (percentage) → per-period decimal rate.
 */
function periodRateFromApr(apr: number, frequency: Frequency): number {
  return apr / 100 / PAYMENTS_PER_YEAR[frequency];
}

/**
 * Convert calendar months to a count of periods at the given frequency.
 * Rounds to the nearest whole period since payments don't split fractionally.
 */
function monthsToPeriods(months: number, frequency: Frequency): number {
  return Math.max(0, Math.round((months / 12) * PAYMENTS_PER_YEAR[frequency]));
}

/**
 * The rate active during a given period — handles the promo boundary
 * for tiered rate profiles.
 */
function activeApr(rateProfile: RateProfile, period: number, frequency: Frequency): number {
  if (rateProfile.kind === 'flat') return rateProfile.apr;
  const promoPeriods = monthsToPeriods(rateProfile.promoMonths, frequency);
  return period <= promoPeriods ? rateProfile.promoApr : rateProfile.postApr;
}

/**
 * Look up the overpayment amount to apply at a given period boundary.
 * A period maps to a calendar month via `month = round(period × 12 / paymentsPerYear)`,
 * which we use to match lump sums and bound recurring windows.
 */
function overpaymentAt(period: number, frequency: Frequency, overpayments: Overpayment[]): number {
  if (overpayments.length === 0) return 0;
  const periodMonth = Math.round((period * 12) / PAYMENTS_PER_YEAR[frequency]);
  let total = 0;
  for (const op of overpayments) {
    if (op.kind === 'lump') {
      if (op.month === periodMonth) total += op.amount;
    } else {
      const inWindow =
        periodMonth >= op.startMonth && (op.endMonth === undefined || periodMonth <= op.endMonth);
      if (inWindow) total += op.amount;
    }
  }
  return total;
}

/**
 * Generate the full schedule. The loop iterates one period at a time,
 * accruing interest at the period's active rate, applying the scheduled
 * payment, and adding any overpayments as bonus principal reduction.
 * Stops early when the balance reaches zero.
 *
 * For tiered rates the scheduled payment switches at the promo boundary:
 *   - During promo: payment that would amortize full principal at the
 *     promo rate over the full term (so 0% promos pay only principal).
 *   - After promo: re-amortize the remaining balance over the remaining
 *     periods at the post-promo rate.
 */
function buildSchedule(
  principal: number,
  rateProfile: RateProfile,
  totalPeriods: number,
  frequency: Frequency,
  overpayments: Overpayment[],
): { schedule: ScheduleRow[]; paymentInitial: number; paymentPostPromo: number } {
  let balance = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  const schedule: ScheduleRow[] = [];

  const initialApr =
    rateProfile.kind === 'flat' ? rateProfile.apr : rateProfile.promoApr;
  const initialRate = periodRateFromApr(initialApr, frequency);
  let scheduledPayment = computePayment(principal, initialRate, totalPeriods);
  const paymentInitial = scheduledPayment;
  let paymentPostPromo = scheduledPayment;

  let recomputedAtBoundary = rateProfile.kind === 'flat'; // flat: nothing to switch
  const promoPeriods =
    rateProfile.kind === 'tiered'
      ? monthsToPeriods(rateProfile.promoMonths, frequency)
      : 0;

  for (let period = 1; period <= totalPeriods && balance > 0.005; period++) {
    // For tiered rates, recompute the payment when crossing the promo boundary.
    if (!recomputedAtBoundary && rateProfile.kind === 'tiered' && period > promoPeriods) {
      const postRate = periodRateFromApr(rateProfile.postApr, frequency);
      const remainingPeriods = totalPeriods - promoPeriods;
      scheduledPayment = computePayment(balance, postRate, remainingPeriods);
      paymentPostPromo = scheduledPayment;
      recomputedAtBoundary = true;
    }

    const apr = activeApr(rateProfile, period, frequency);
    const rate = periodRateFromApr(apr, frequency);

    const interestPaid = balance * rate;
    let principalPaid = scheduledPayment - interestPaid;

    // Final-period clamp: protect against floating-point drift on the
    // last scheduled payment. Also handles the case where the scheduled
    // payment slightly exceeds the remaining balance.
    if (principalPaid > balance) principalPaid = balance;
    if (period === totalPeriods && principalPaid < balance) {
      principalPaid = balance;
    }

    let workingBalance = balance - principalPaid;

    // Apply overpayments AFTER the scheduled principal portion is taken
    // — they reduce remaining balance and may zero it out early.
    const op = overpaymentAt(period, frequency, overpayments);
    const opApplied = Math.min(op, Math.max(0, workingBalance));
    workingBalance -= opApplied;

    cumulativePrincipal += principalPaid + opApplied;
    cumulativeInterest += interestPaid;

    schedule.push({
      period,
      month: Math.round((period * 12) / PAYMENTS_PER_YEAR[frequency]),
      principalPaid,
      interestPaid,
      overpayment: opApplied,
      cumulativePrincipal,
      cumulativeInterest,
      balance: Math.max(0, workingBalance),
      scheduledPayment,
    });

    balance = workingBalance;
  }

  return { schedule, paymentInitial, paymentPostPromo };
}

/**
 * Top-level engine entry. UI components consume the returned LoanResult.
 */
export function calculateLoan(inputs: LoanInputs): LoanResult {
  const principal = Math.max(0, inputs.assetValue - inputs.downPayment);
  const scheduledMonths = inputs.termYears * 12 + inputs.termMonths;
  const scheduledPeriods = monthsToPeriods(scheduledMonths, inputs.frequency);

  if (principal === 0 || scheduledPeriods === 0) {
    return {
      principal,
      frequency: inputs.frequency,
      scheduledPeriods,
      scheduledMonths,
      actualPeriods: 0,
      actualMonths: 0,
      paymentInitial: 0,
      paymentPostPromo: 0,
      totalInterest: 0,
      totalPaid: principal,
      totalOverpayments: 0,
      schedule: [],
    };
  }

  const { schedule, paymentInitial, paymentPostPromo } = buildSchedule(
    principal,
    inputs.rateProfile,
    scheduledPeriods,
    inputs.frequency,
    inputs.overpayments,
  );

  const last = schedule[schedule.length - 1];
  const totalInterest = last ? last.cumulativeInterest : 0;
  const totalOverpayments = schedule.reduce((s, r) => s + r.overpayment, 0);
  const actualPeriods = schedule.length;
  const actualMonths = last ? last.month : 0;

  return {
    principal,
    frequency: inputs.frequency,
    scheduledPeriods,
    scheduledMonths,
    actualPeriods,
    actualMonths,
    paymentInitial,
    paymentPostPromo,
    totalInterest,
    totalPaid: principal + totalInterest,
    totalOverpayments,
    schedule,
  };
}

/**
 * Format a count of months as "Y yr M mo".
 */
export function formatTerm(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months} mo`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months} mo`;
}

/**
 * Human label for a frequency.
 */
export function frequencyLabel(frequency: Frequency): string {
  return {
    monthly: 'Monthly',
    biweekly: 'Bi-weekly',
    quarterly: 'Quarterly',
    semiannual: 'Semi-annual',
    annual: 'Annual',
  }[frequency];
}
