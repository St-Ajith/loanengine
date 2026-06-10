import type { ComparisonResult } from '../engine/types';
import { type LocaleConfig, formatCurrency } from '../engine/locale';
import { formatTerm } from '../engine/amortization';

interface SummaryMetricsProps {
  comparison: ComparisonResult;
  locale: LocaleConfig;
}

/**
 * Hero metrics. The whole section sits on a soft indigo-tinted backdrop
 * so the monthly payment — the answer the user came here for — visibly
 * pops away from the extra-payments controls that share the same card.
 *
 * Modifications are surfaced as inline deltas under each affected metric.
 */
export function SummaryMetrics({ comparison, locale }: SummaryMetricsProps) {
  const { modified, baseline, hasModifications, interestSaved, monthsSaved, totalPaidSaved } =
    comparison;
  const payoffDate = computePayoffDate(modified.actualMonths);
  const hasPromo = Math.abs(modified.paymentInitial - modified.paymentPostPromo) > 0.5;

  return (
    <div className="bg-surface-accent p-6 sm:p-10">
      <div className="text-xs uppercase tracking-[0.16em] text-principal font-semibold mb-3">
        Monthly payment
        {hasPromo && <span className="ml-1 normal-case tracking-normal text-ink-muted font-medium">— during promo</span>}
      </div>
      <div className="text-6xl sm:text-7xl text-ink num leading-[0.95] font-semibold tracking-display">
        {formatCurrency(modified.paymentInitial, locale, 0)}
      </div>
      <div className="text-sm text-ink-muted mt-3">
        on {formatCurrency(modified.principal, locale)} borrowed
      </div>

      {hasPromo && (
        <div className="mt-3 text-sm num text-ink-soft">
          then{' '}
          <span className="text-ink font-semibold">
            {formatCurrency(modified.paymentPostPromo, locale)}
          </span>{' '}
          for the remaining term
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-principal/15">
        <Stat
          label="Total interest"
          value={formatCurrency(modified.totalInterest, locale)}
          tone="interest"
          delta={
            hasModifications && interestSaved > 0.5
              ? {
                  text: `saves ${formatCurrency(interestSaved, locale)}`,
                  was: formatCurrency(baseline.totalInterest, locale),
                }
              : null
          }
        />
        <Stat
          label="Total paid"
          value={formatCurrency(modified.totalPaid, locale)}
          tone="ink"
          delta={
            hasModifications && totalPaidSaved > 0.5
              ? {
                  text: `saves ${formatCurrency(totalPaidSaved, locale)}`,
                  was: formatCurrency(baseline.totalPaid, locale),
                }
              : null
          }
        />
        <Stat
          label="Paid off"
          value={payoffDate}
          tone="ink"
          sublabel={formatTerm(modified.actualMonths)}
          delta={
            hasModifications && monthsSaved > 0
              ? {
                  text: `${formatTerm(monthsSaved)} earlier`,
                  was: formatTerm(baseline.actualMonths),
                }
              : null
          }
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  sublabel,
  delta,
}: {
  label: string;
  value: string;
  tone: 'ink' | 'interest';
  sublabel?: string;
  delta: { text: string; was: string } | null;
}) {
  const toneClass = tone === 'interest' ? 'text-interest' : 'text-ink';
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.12em] text-ink-muted mb-1.5 font-medium">
        {label}
      </div>
      <div className={`text-base sm:text-lg num font-semibold ${toneClass}`}>{value}</div>
      {sublabel && !delta && (
        <div className="text-xs text-ink-faint mt-0.5 num">{sublabel}</div>
      )}
      {delta && (
        <div className="mt-1.5 space-y-0.5">
          <div className="text-xs text-savings num font-medium">↓ {delta.text}</div>
          <div className="text-[10px] text-ink-faint num line-through">was {delta.was}</div>
        </div>
      )}
    </div>
  );
}

function computePayoffDate(totalMonths: number): string {
  if (totalMonths === 0) return '—';
  const now = new Date();
  const payoff = new Date(now.getFullYear(), now.getMonth() + totalMonths, 1);
  return payoff.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}
