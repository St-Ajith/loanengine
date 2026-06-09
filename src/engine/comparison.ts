// Baseline vs modified comparison.
//
// "Baseline" = flat rate (no promo), no overpayments — the loan as
// originally quoted. "Modified" = whatever the user is currently exploring.
// The UI only shows delta metrics when they actually differ.

import type { ComparisonResult, LoanInputs, RateProfile } from './types';
import { calculateLoan } from './amortization';

function flattenRate(rateProfile: RateProfile): RateProfile {
  // For baseline, collapse a tiered rate down to its post-promo APR —
  // the rate that would apply without the dealer deal.
  if (rateProfile.kind === 'tiered') {
    return { kind: 'flat', apr: rateProfile.postApr };
  }
  return rateProfile;
}

export function compareLoan(inputs: LoanInputs): ComparisonResult {
  const baselineInputs: LoanInputs = {
    ...inputs,
    rateProfile: flattenRate(inputs.rateProfile),
    overpayments: [],
  };

  const baseline = calculateLoan(baselineInputs);
  const modified = calculateLoan(inputs);

  const hasModifications =
    inputs.rateProfile.kind === 'tiered' || inputs.overpayments.length > 0;

  return {
    baseline,
    modified,
    hasModifications,
    interestSaved: baseline.totalInterest - modified.totalInterest,
    monthsSaved: baseline.actualMonths - modified.actualMonths,
    totalPaidSaved: baseline.totalPaid - modified.totalPaid,
  };
}
