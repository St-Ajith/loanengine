// Amortization engine. Monthly-only — installments come once a month
// because that's how mortgages and car loans actually work.
//
// Handles:
//   - Tiered (promo) rate profiles — e.g. 0% for 36 months, then 6.5%
//   - Recurring and lump-sum overpayments, with early payoff
//
// All functions are pure: same inputs → same outputs, no side effects.

import type {
  LoanInputs,
  LoanResult,
  Overpayment,
  RateProfile,
  ScheduleRow,
} from './types';

/**
 * Standard EMI formula for an annuity loan.
 *   EMI = [P × r × (1+r)^n] / [(1+r)^n − 1]
 * Falls back to P/n when r is zero (otherwise a division by zero).
 */
export function computeEmi(principal: number, monthlyRate: number, totalMonths: number): number {
  if (totalMonths <= 0 || principal <= 0) return 0;
  if (monthlyRate === 0) return principal / totalMonths;
  const compounded = Math.pow(1 + monthlyRate, totalMonths);
  return (principal * monthlyRate * compounded) / (compounded - 1);
}

/** APR percentage → monthly decimal rate. */
function monthlyRate(apr: number): number {
  return apr / 12 / 100;
}

/** Rate active during a given month (handles the promo boundary). */
function activeApr(rateProfile: RateProfile, month: number): number {
  if (rateProfile.kind === 'flat') return rateProfile.apr;
  return month <= rateProfile.promoMonths ? rateProfile.promoApr : rateProfile.postApr;
}

/** Sum of overpayments applicable in a given month. */
function overpaymentAt(month: number, overpayments: Overpayment[]): number {
  if (overpayments.length === 0) return 0;
  let total = 0;
  for (const op of overpayments) {
    if (op.kind === 'lump') {
      if (op.month === month) total += op.amount;
    } else {
      const inWindow =
        month >= op.startMonth && (op.endMonth === undefined || month <= op.endMonth);
      if (inWindow) total += op.amount;
    }
  }
  return total;
}

/**
 * Build the schedule. Iterates month by month, accruing interest at
 * the current rate and applying the scheduled EMI plus any overpayments
 * as principal reduction. Stops early when balance reaches zero.
 *
 * For tiered rates the EMI switches at the promo boundary:
 *   - During promo: EMI sized to amortize full principal at the promo rate
 *     over the full term (so a 0% promo pays only principal).
 *   - After promo: re-amortize the remaining balance over the remaining
 *     months at the post-promo rate.
 */
function buildSchedule(
  principal: number,
  rateProfile: RateProfile,
  totalMonths: number,
  overpayments: Overpayment[],
): { schedule: ScheduleRow[]; paymentInitial: number; paymentPostPromo: number } {
  let balance = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  const schedule: ScheduleRow[] = [];

  const initialApr = rateProfile.kind === 'flat' ? rateProfile.apr : rateProfile.promoApr;
  let scheduledPayment = computeEmi(principal, monthlyRate(initialApr), totalMonths);
  const paymentInitial = scheduledPayment;
  let paymentPostPromo = scheduledPayment;

  let recomputedAtBoundary = rateProfile.kind === 'flat';
  const promoMonths = rateProfile.kind === 'tiered' ? rateProfile.promoMonths : 0;

  for (let month = 1; month <= totalMonths && balance > 0.005; month++) {
    if (!recomputedAtBoundary && rateProfile.kind === 'tiered' && month > promoMonths) {
      const postRate = monthlyRate(rateProfile.postApr);
      const remainingMonths = totalMonths - promoMonths;
      scheduledPayment = computeEmi(balance, postRate, remainingMonths);
      paymentPostPromo = scheduledPayment;
      recomputedAtBoundary = true;
    }

    const apr = activeApr(rateProfile, month);
    const rate = monthlyRate(apr);

    const interestPaid = balance * rate;
    let principalPaid = scheduledPayment - interestPaid;

    // Final-month and edge-case clamps.
    if (principalPaid > balance) principalPaid = balance;
    if (month === totalMonths && principalPaid < balance) principalPaid = balance;

    let workingBalance = balance - principalPaid;

    // Apply overpayments after the scheduled portion.
    const op = overpaymentAt(month, overpayments);
    const opApplied = Math.min(op, Math.max(0, workingBalance));
    workingBalance -= opApplied;

    cumulativePrincipal += principalPaid + opApplied;
    cumulativeInterest += interestPaid;

    schedule.push({
      month,
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

/** Top-level engine entry. */
export function calculateLoan(inputs: LoanInputs): LoanResult {
  const principal = Math.max(0, inputs.assetValue - inputs.downPayment);
  const scheduledMonths = inputs.termYears * 12 + inputs.termMonths;

  if (principal === 0 || scheduledMonths === 0) {
    return {
      principal,
      scheduledMonths,
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
    scheduledMonths,
    inputs.overpayments,
  );

  const last = schedule[schedule.length - 1];
  const totalInterest = last ? last.cumulativeInterest : 0;
  const totalOverpayments = schedule.reduce((s, r) => s + r.overpayment, 0);
  const actualMonths = last ? last.month : 0;

  return {
    principal,
    scheduledMonths,
    actualMonths,
    paymentInitial,
    paymentPostPromo,
    totalInterest,
    totalPaid: principal + totalInterest,
    totalOverpayments,
    schedule,
  };
}

/** Format a count of months as "Y yr M mo". */
export function formatTerm(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months} mo`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months} mo`;
}
