import type { ComparisonResult } from '../engine/types';
import { type LocaleConfig, formatCurrency } from '../engine/locale';
import { formatTerm, frequencyLabel } from '../engine/amortization';

interface SummaryMetricsProps {
  comparison: ComparisonResult;
  locale: LocaleConfig;
}

/**
 * Hero summary. The periodic payment lives at display-typography size
 * because it is the first thing every user wants to know. When the user
 * has activated any modifications (frequency, overpayments, promo rate),
 * a savings ribbon appears below to highlight the delta.
 */
export function SummaryMetrics({ comparison, locale }: SummaryMetricsProps) {
  const { modified, hasModifications, interestSaved, monthsSaved } = comparison;
  const payoffDate = computePayoffDate(modified.actualMonths);
  const hasPromo = modified.paymentInitial !== modified.paymentPostPromo;

  return (
    <div className="bg-paper-dim/50 border hairline rounded-lg p-6 sm:p-8">
      <div className="text-xs uppercase tracking-[0.18em] text-ink-muted mb-2">
        {frequencyLabel(modified.frequency)} payment
        {hasPromo && <span className="ml-1 normal-case tracking-normal">— promo period</span>}
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
          after the promo
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t hairline">
        <Stat
          label="Total interest"
          value={formatCurrency(modified.totalInterest, locale)}
          tone="interest"
        />
        <Stat
          label="Total paid"
          value={formatCurrency(modified.totalPaid, locale)}
          tone="ink"
        />
        <Stat
          label="Paid off"
          value={payoffDate}
          tone="ink"
          sublabel={formatTerm(modified.actualMonths)}
        />
      </div>

      {hasModifications && (interestSaved > 0.5 || monthsSaved > 0) && (
        <SavingsBanner
          interestSaved={interestSaved}
          monthsSaved={monthsSaved}
          locale={locale}
        />
      )}
    </div>
  );
}

function SavingsBanner({
  interestSaved,
  monthsSaved,
  locale,
}: {
  interestSaved: number;
  monthsSaved: number;
  locale: LocaleConfig;
}) {
  return (
    <div className="mt-5 bg-savings/10 border border-savings/30 rounded p-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
      <div className="text-xs uppercase tracking-[0.16em] text-savings font-medium">
        Vs. baseline
      </div>
      {interestSaved > 0.5 && (
        <div>
          <span className="font-mono num text-savings text-base font-medium">
            −{formatCurrency(interestSaved, locale)}
          </span>
          <span className="text-xs text-ink-soft ml-1.5">interest</span>
        </div>
      )}
      {monthsSaved > 0 && (
        <div>
          <span className="font-mono num text-savings text-base font-medium">
            −{formatTerm(monthsSaved)}
          </span>
          <span className="text-xs text-ink-soft ml-1.5">on the term</span>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  sublabel,
}: {
  label: string;
  value: string;
  tone: 'ink' | 'interest' | 'savings';
  sublabel?: string;
}) {
  const toneClass =
    tone === 'interest' ? 'text-interest' : tone === 'savings' ? 'text-savings' : 'text-ink';
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.14em] text-ink-muted mb-1">{label}</div>
      <div className={`font-mono text-base sm:text-lg num ${toneClass}`}>{value}</div>
      {sublabel && <div className="text-xs text-ink-faint mt-0.5 font-mono">{sublabel}</div>}
    </div>
  );
}

function computePayoffDate(totalMonths: number): string {
  if (totalMonths === 0) return '—';
  const now = new Date();
  const payoff = new Date(now.getFullYear(), now.getMonth() + totalMonths, 1);
  return payoff.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}
