// Baseline vs modified comparison.
//
// "Baseline" = the loan as quoted: flat rate (no promo), monthly payments,
// no overpayments. "Modified" = whatever the user is currently exploring.
// The UI only shows delta metrics when they actually differ.

import type { ComparisonResult, LoanInputs, RateProfile } from './types';
import { calculateLoan } from './amortization';

function flattenRate(rateProfile: RateProfile): RateProfile {
  // For baseline, collapse a tiered rate down to its post-promo APR —
  // that's the rate the borrower would have paid without the dealer deal.
  if (rateProfile.kind === 'tiered') {
    return { kind: 'flat', apr: rateProfile.postApr };
  }
  return rateProfile;
}

export function compareLoan(inputs: LoanInputs): ComparisonResult {
  const baselineInputs: LoanInputs = {
    ...inputs,
    rateProfile: flattenRate(inputs.rateProfile),
    frequency: 'monthly',
    overpayments: [],
  };

  const baseline = calculateLoan(baselineInputs);
  const modified = calculateLoan(inputs);

  const hasModifications =
    inputs.rateProfile.kind === 'tiered' ||
    inputs.frequency !== 'monthly' ||
    inputs.overpayments.length > 0;

  return {
    baseline,
    modified,
    hasModifications,
    interestSaved: baseline.totalInterest - modified.totalInterest,
    monthsSaved: baseline.actualMonths - modified.actualMonths,
  };
}
