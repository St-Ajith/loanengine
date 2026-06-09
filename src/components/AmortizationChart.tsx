import {
  Area,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ComparisonResult } from '../engine/types';
import { type LocaleConfig, formatCurrency } from '../engine/locale';

interface AmortizationChartProps {
  comparison: ComparisonResult;
  locale: LocaleConfig;
}

/**
 * Stacked area: cumulative principal vs interest under the active scenario.
 * When modifications are present, the baseline outstanding balance is
 * overlaid as a dashed line — it visualises what the un-modified loan
 * would have looked like.
 */
export function AmortizationChart({ comparison, locale }: AmortizationChartProps) {
  const { modified, baseline, hasModifications } = comparison;

  if (modified.schedule.length === 0) {
    return (
      <div className="border hairline rounded-lg p-8 text-center text-ink-muted text-sm">
        Set a loan term to see the amortization breakdown.
      </div>
    );
  }

  const maxMonths = Math.max(baseline.actualMonths, modified.actualMonths);
  const step = Math.max(1, Math.floor(maxMonths / 120));

  const baselineByMonth = new Map<number, { balance: number }>();
  for (const row of baseline.schedule) {
    baselineByMonth.set(row.month, { balance: row.balance });
  }
  const modifiedByMonth = new Map<
    number,
    { balance: number; principal: number; interest: number }
  >();
  for (const row of modified.schedule) {
    modifiedByMonth.set(row.month, {
      balance: row.balance,
      principal: row.cumulativePrincipal,
      interest: row.cumulativeInterest,
    });
  }

  const data: Array<{
    month: number;
    year: number;
    principal: number;
    interest: number;
    baselineBalance: number | null;
  }> = [];
  let lastMod = { principal: 0, interest: 0 };
  let lastBaseline: number | null = baseline.principal;
  for (let m = 0; m <= maxMonths; m += step) {
    const mod = modifiedByMonth.get(m);
    if (mod) lastMod = { principal: mod.principal, interest: mod.interest };
    const bl = baselineByMonth.get(m);
    if (bl) lastBaseline = bl.balance;
    data.push({
      month: m,
      year: +(m / 12).toFixed(2),
      principal: lastMod.principal,
      interest: lastMod.interest,
      baselineBalance: lastBaseline,
    });
  }
  data.push({
    month: maxMonths,
    year: +(maxMonths / 12).toFixed(2),
    principal: modified.principal,
    interest: modified.totalInterest,
    baselineBalance: 0,
  });

  return (
    <div className="border hairline rounded-lg p-4 sm:p-6 bg-paper">
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-ink-muted">Amortization</div>
          <div className="font-serif text-xl text-ink mt-0.5">
            Where your money goes, month by month
          </div>
        </div>
        <Legend showBaseline={hasModifications} />
      </div>

      <div className="h-72 sm:h-80 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
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
              domain={[0, +(maxMonths / 12).toFixed(2)]}
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
            <Tooltip
              content={<CustomTooltip locale={locale} showBaseline={hasModifications} />}
            />
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
            {hasModifications && (
              <Line
                type="monotone"
                dataKey="baselineBalance"
                stroke="#6B7079"
                strokeWidth={1.25}
                strokeDasharray="4 3"
                dot={false}
                name="Baseline balance"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ showBaseline }: { showBaseline: boolean }) {
  return (
    <div className="flex items-center gap-4 text-xs text-ink-soft flex-wrap">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-principal" /> Principal
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-interest" /> Interest
      </span>
      {showBaseline && (
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-ink-muted" />
          Baseline balance
        </span>
      )}
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    payload: { month: number; baselineBalance: number | null };
  }>;
  locale: LocaleConfig;
  showBaseline: boolean;
}

function CustomTooltip({ active, payload, locale, showBaseline }: TooltipProps) {
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
      {showBaseline && point.baselineBalance !== null && (
        <div className="flex items-center gap-3 num font-mono mt-1 pt-1 border-t hairline">
          <span className="w-2 h-0.5 border-t border-dashed border-ink-muted" />
          <span className="text-ink-soft mr-auto">Baseline balance</span>
          <span className="text-ink">{formatCurrency(point.baselineBalance, locale)}</span>
        </div>
      )}
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
