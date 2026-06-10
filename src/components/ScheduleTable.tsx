import { useMemo, useState } from 'react';
import type { LoanResult, ScheduleRow } from '../engine/types';
import { type LocaleConfig, formatCurrency } from '../engine/locale';

interface ScheduleTableProps {
  result: LoanResult;
  locale: LocaleConfig;
}

interface YearRow {
  year: number;
  principal: number;
  interest: number;
  overpayment: number;
  endingBalance: number;
  months: ScheduleRow[];
}

/**
 * Yearly rollup of the amortization schedule. Click any year row to
 * expand into the month-by-month breakdown. When overpayments are
 * active, an "Extra" column appears so the overpayment portion is
 * called out separately from scheduled principal.
 */
export function ScheduleTable({ result, locale }: ScheduleTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const hasOverpayments = useMemo(
    () => result.schedule.some((r) => r.overpayment > 0),
    [result.schedule],
  );

  const yearly = useMemo<YearRow[]>(() => {
    const buckets = new Map<number, YearRow>();
    for (const row of result.schedule) {
      const year = Math.max(1, Math.ceil(row.month / 12));
      let bucket = buckets.get(year);
      if (!bucket) {
        bucket = { year, principal: 0, interest: 0, overpayment: 0, endingBalance: 0, months: [] };
        buckets.set(year, bucket);
      }
      bucket.principal += row.principalPaid;
      bucket.interest += row.interestPaid;
      bucket.overpayment += row.overpayment;
      bucket.endingBalance = row.balance;
      bucket.months.push(row);
    }
    return Array.from(buckets.values());
  }, [result.schedule]);

  if (yearly.length === 0) {
    return null;
  }

  return (
    <div className="border hairline rounded-lg bg-surface overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b hairline">
        <div className="text-xs uppercase tracking-[0.16em] text-ink-muted">Schedule</div>
        <div className="text-xl text-ink mt-0.5">Year-by-year breakdown</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-ink-muted">
            <tr className="text-xs uppercase tracking-[0.12em]">
              <th className="text-left font-medium px-4 sm:px-6 py-2.5 w-16">Yr</th>
              <th className="text-right font-medium px-3 py-2.5">Principal</th>
              <th className="text-right font-medium px-3 py-2.5">Interest</th>
              {hasOverpayments && (
                <th className="text-right font-medium px-3 py-2.5">Extra</th>
              )}
              <th className="text-right font-medium px-4 sm:px-6 py-2.5">Balance</th>
            </tr>
          </thead>
          <tbody>
            {yearly.map((y) => (
              <YearRowView
                key={y.year}
                row={y}
                locale={locale}
                isOpen={expanded === y.year}
                onToggle={() => setExpanded(expanded === y.year ? null : y.year)}
                showOverpayment={hasOverpayments}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function YearRowView({
  row,
  locale,
  isOpen,
  onToggle,
  showOverpayment,
}: {
  row: YearRow;
  locale: LocaleConfig;
  isOpen: boolean;
  onToggle: () => void;
  showOverpayment: boolean;
}) {
  return (
    <>
      <tr
        className="border-t hairline cursor-pointer hover:bg-surface-muted transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 sm:px-6 py-2.5 num text-ink">
          <span className="inline-block w-3 text-ink-faint mr-1">{isOpen ? '−' : '+'}</span>
          {row.year}
        </td>
        <td className="text-right px-3 py-2.5 num text-principal">
          {formatCurrency(row.principal, locale)}
        </td>
        <td className="text-right px-3 py-2.5 num text-interest">
          {formatCurrency(row.interest, locale)}
        </td>
        {showOverpayment && (
          <td className="text-right px-3 py-2.5 num text-savings">
            {row.overpayment > 0 ? formatCurrency(row.overpayment, locale) : '—'}
          </td>
        )}
        <td className="text-right px-4 sm:px-6 py-2.5 num text-ink">
          {formatCurrency(row.endingBalance, locale)}
        </td>
      </tr>
      {isOpen &&
        row.months.map((m) => (
          <tr key={m.month} className="bg-surface-muted text-xs text-ink-soft">
            <td className="px-4 sm:px-6 py-1.5 num pl-10">M{m.month}</td>
            <td className="text-right px-3 py-1.5 num">
              {formatCurrency(m.principalPaid, locale)}
            </td>
            <td className="text-right px-3 py-1.5 num">
              {formatCurrency(m.interestPaid, locale)}
            </td>
            {showOverpayment && (
              <td className="text-right px-3 py-1.5 num">
                {m.overpayment > 0 ? formatCurrency(m.overpayment, locale) : '—'}
              </td>
            )}
            <td className="text-right px-4 sm:px-6 py-1.5 num">
              {formatCurrency(m.balance, locale)}
            </td>
          </tr>
        ))}
    </>
  );
}
