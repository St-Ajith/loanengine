// Reference amortization engine for the Universal Loan Engine.
// All functions here are pure: same inputs → same outputs, no side effects.
// Phase 1 covers FR-2.1 and FR-2.2 (baseline EMI + full schedule).
// Phase 2 will extend with overpayments and frequency remapping (FR-3.x).

import type { LoanInputs, LoanResult, ScheduleRow } from './types';

/**
 * Compute the Equated Monthly Installment (EMI) for a fixed-rate loan.
 *
 *   EMI = [P × r × (1+r)^n] / [(1+r)^n − 1]
 *
 * Falls back to the linear case P / n when r is zero, which is otherwise
 * a division-by-zero.
 */
export function computeEmi(principal: number, monthlyRate: number, totalMonths: number): number {
  if (totalMonths <= 0) return 0;
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return principal / totalMonths;

  const compounded = Math.pow(1 + monthlyRate, totalMonths);
  return (principal * monthlyRate * compounded) / (compounded - 1);
}

/**
 * Generate the full month-by-month amortization schedule for a baseline loan.
 * Each row reports the principal and interest portions of that period's EMI,
 * plus running totals for charting.
 */
export function buildSchedule(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  emi: number,
): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let balance = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  for (let month = 1; month <= totalMonths; month++) {
    const interestPaid = balance * monthlyRate;
    let principalPaid = emi - interestPaid;

    // Final-period clamp: floating-point drift can leave a tiny residual
    // balance. Sweep it into the last payment so the schedule actually
    // closes out at zero.
    if (month === totalMonths || principalPaid > balance) {
      principalPaid = balance;
    }

    balance = Math.max(0, balance - principalPaid);
    cumulativePrincipal += principalPaid;
    cumulativeInterest += interestPaid;

    rows.push({
      month,
      principalPaid,
      interestPaid,
      cumulativePrincipal,
      cumulativeInterest,
      balance,
    });
  }

  return rows;
}

/**
 * Top-level entry: take user inputs, return everything the UI needs.
 * All UI components consume `LoanResult`, never raw inputs — this keeps
 * the math in one place and makes adding overpayment scenarios later
 * a matter of plugging in a different result builder.
 */
export function calculateLoan(inputs: LoanInputs): LoanResult {
  const principal = Math.max(0, inputs.assetValue - inputs.downPayment);
  const monthlyRate = inputs.apr / 12 / 100;
  const totalMonths = inputs.termYears * 12 + inputs.termMonths;

  const emi = computeEmi(principal, monthlyRate, totalMonths);
  const schedule = buildSchedule(principal, monthlyRate, totalMonths, emi);

  const totalInterest = schedule.reduce((sum, row) => sum + row.interestPaid, 0);
  const totalPayments = principal + totalInterest;

  return {
    principal,
    monthlyRate,
    totalMonths,
    emi,
    totalInterest,
    totalPayments,
    schedule,
  };
}

/**
 * Format a number of months as "Y yr M mo" for human display.
 */
export function formatTerm(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months} mo`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months} mo`;
}
