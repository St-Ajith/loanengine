import type { ComparisonResult } from '../engine/types';
import { type LocaleConfig, formatCurrency } from '../engine/locale';
import { formatTerm } from '../engine/amortization';

interface SummaryMetricsProps {
  comparison: ComparisonResult;
  locale: LocaleConfig;
}

/**
 * Hero metrics for the loan. Designed to live in the top half of the
 * unified impact card — the extra-payments editor sits directly below
 * it in App.tsx, sharing the same border so the cause→effect link is
 * unmistakable.
 *
 * When modifications are active, each supporting metric shows an inline
 * "saves X" indicator instead of a separate banner. Same delta info,
 * but it's attached to the number it modifies.
 */
export function SummaryMetrics({ comparison, locale }: SummaryMetricsProps) {
  const { modified, baseline, hasModifications, interestSaved, monthsSaved, totalPaidSaved } =
    comparison;
  const payoffDate = computePayoffDate(modified.actualMonths);
  const hasPromo = Math.abs(modified.paymentInitial - modified.paymentPostPromo) > 0.5;

  return (
    <div className="p-6 sm:p-8">
      <div className="text-xs uppercase tracking-[0.18em] text-ink-muted mb-2">
        Monthly payment
        {hasPromo && <span className="ml-1 normal-case tracking-normal">— during promo</span>}
      </div>
      <div className="font-serif text-5xl sm:text-6xl text-ink num leading-none">
        {formatCurrency(modified.paymentInitial, locale, 0)}
      </div>
      <div className="text-sm text-ink-muted mt-2 font-mono">
        on {formatCurrency(modified.principal, locale)} borrowed
      </div>

      {hasPromo && (
        <div className="mt-3 text-sm font-mono num text-ink-soft">
          then{' '}
          <span className="text-ink font-medium">
            {formatCurrency(modified.paymentPostPromo, locale)}
          </span>{' '}
          for the remaining term
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t hairline">
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
      <div className="text-xs uppercase tracking-[0.14em] text-ink-muted mb-1">{label}</div>
      <div className={`font-mono text-base sm:text-lg num ${toneClass}`}>{value}</div>
      {sublabel && !delta && (
        <div className="text-xs text-ink-faint mt-0.5 font-mono">{sublabel}</div>
      )}
      {delta && (
        <div className="mt-1 space-y-0.5">
          <div className="text-xs font-mono text-savings num">↓ {delta.text}</div>
          <div className="text-[10px] font-mono text-ink-faint num line-through">
            was {delta.was}
          </div>
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
