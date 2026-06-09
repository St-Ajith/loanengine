import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LoanResult } from '../engine/types';
import { type LocaleConfig, formatCurrency } from '../engine/locale';

interface AmortizationChartProps {
  result: LoanResult;
  locale: LocaleConfig;
}

/**
 * Stacked area chart: cumulative principal at the bottom, cumulative
 * interest on top, with the outstanding balance overlaid as a line.
 *
 * This is the signature visual of the app. It does one thing well:
 * makes the relationship between what-you-owe and what-you-pay legible
 * at a glance — and shows users *why* extra payments matter (later, in
 * Phase 2, when we add overpayments).
 */
export function AmortizationChart({ result, locale }: AmortizationChartProps) {
  // Sample the schedule down to ~120 points max so very long mortgages
  // still render smoothly and the chart line stays clean.
  const step = Math.max(1, Math.floor(result.schedule.length / 120));
  const data = result.schedule
    .filter((_, i) => i % step === 0 || i === result.schedule.length - 1)
    .map((row) => ({
      month: row.month,
      year: +(row.month / 12).toFixed(2),
      principal: row.cumulativePrincipal,
      interest: row.cumulativeInterest,
      balance: row.balance,
    }));

  if (data.length === 0 || result.totalMonths === 0) {
    return (
      <div className="border hairline rounded-lg p-8 text-center text-ink-muted text-sm">
        Set a loan term to see the amortization breakdown.
      </div>
    );
  }

  return (
    <div className="border hairline rounded-lg p-4 sm:p-6 bg-paper">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-ink-muted">
            Amortization
          </div>
          <div className="font-serif text-xl text-ink mt-0.5">
            Where your money goes, month by month
          </div>
        </div>
        <Legend />
      </div>

      <div className="h-72 sm:h-80 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="principalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0.55} />
              </linearGradient>
              <linearGradient id="interestFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9F1239" stopOpacity={0.75} />
                <stop offset="100%" stopColor="#9F1239" stopOpacity={0.45} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#DCDAD0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, +(result.totalMonths / 12).toFixed(2)]}
              tickFormatter={(v) => `${Math.round(v)}y`}
              stroke="#9CA0A8"
              fontSize={11}
              tick={{ fill: '#6B7079' }}
            />
            <YAxis
              tickFormatter={(v) => compactCurrency(v, locale)}
              stroke="#9CA0A8"
              fontSize={11}
              tick={{ fill: '#6B7079' }}
              width={70}
            />
            <Tooltip content={<CustomTooltip locale={locale} />} />
            <Area
              type="monotone"
              dataKey="principal"
              stackId="1"
              stroke="#1E3A8A"
              strokeWidth={1.5}
              fill="url(#principalFill)"
              name="Principal paid"
            />
            <Area
              type="monotone"
              dataKey="interest"
              stackId="1"
              stroke="#9F1239"
              strokeWidth={1.5}
              fill="url(#interestFill)"
              name="Interest paid"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-ink-soft">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-principal" /> Principal
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-interest" /> Interest
      </span>
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; dataKey: string; payload: { year: number; month: number } }>;
  locale: LocaleConfig;
}

function CustomTooltip({ active, payload, locale }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const principal = payload.find((p) => p.dataKey === 'principal')?.value ?? 0;
  const interest = payload.find((p) => p.dataKey === 'interest')?.value ?? 0;
  return (
    <div className="bg-paper border hairline rounded shadow-sm px-3 py-2 text-xs">
      <div className="font-mono text-ink-muted mb-1.5">
        Year {Math.floor(point.month / 12)}, month {point.month}
      </div>
      <div className="flex items-center gap-3 num font-mono">
        <span className="w-2 h-2 bg-principal rounded-sm" />
        <span className="text-ink-soft mr-auto">Principal</span>
        <span className="text-ink">{formatCurrency(principal, locale)}</span>
      </div>
      <div className="flex items-center gap-3 num font-mono mt-1">
        <span className="w-2 h-2 bg-interest rounded-sm" />
        <span className="text-ink-soft mr-auto">Interest</span>
        <span className="text-ink">{formatCurrency(interest, locale)}</span>
      </div>
    </div>
  );
}

function compactCurrency(value: number, locale: LocaleConfig): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const symbol =
    new Intl.NumberFormat(locale.intlLocale, { style: 'currency', currency: locale.currency })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? '';
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${symbol}${Math.round(abs / 1_000)}K`;
  return `${sign}${symbol}${Math.round(abs)}`;
}
