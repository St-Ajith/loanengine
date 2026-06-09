import type { LoanResult } from '../engine/types';
import { type LocaleConfig, formatCurrency } from '../engine/locale';
import { formatTerm } from '../engine/amortization';

interface SummaryMetricsProps {
  result: LoanResult;
  locale: LocaleConfig;
}

/**
 * Hero summary. The monthly payment lives at display-typography size
 * because it is the single thing every user wants to know first; the
 * supporting figures are demoted to a tighter horizontal rail.
 */
export function SummaryMetrics({ result, locale }: SummaryMetricsProps) {
  const payoffDate = computePayoffDate(result.totalMonths);

  return (
    <div className="bg-paper-dim/50 border hairline rounded-lg p-6 sm:p-8">
      <div className="text-xs uppercase tracking-[0.18em] text-ink-muted mb-2">
        Monthly payment
      </div>
      <div className="font-serif text-5xl sm:text-6xl text-ink num leading-none">
        {formatCurrency(result.emi, locale, 0)}
      </div>
      <div className="text-sm text-ink-muted mt-2 font-mono">
        on {formatCurrency(result.principal, locale)} borrowed
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t hairline">
        <Stat
          label="Total interest"
          value={formatCurrency(result.totalInterest, locale)}
          tone="interest"
        />
        <Stat
          label="Total paid"
          value={formatCurrency(result.totalPayments + (result.principal === 0 ? 0 : 0), locale)}
          tone="ink"
        />
        <Stat label="Payoff" value={payoffDate} tone="ink" sublabel={formatTerm(result.totalMonths)} />
      </div>
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
  const now = new Date();
  const payoff = new Date(now.getFullYear(), now.getMonth() + totalMonths, 1);
  return payoff.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}
