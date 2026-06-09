import type { Overpayment } from '../engine/types';
import { type LocaleConfig, formatCurrency, formatNumber } from '../engine/locale';

interface ExtraPaymentsPanelProps {
  overpayments: Overpayment[];
  totalMonths: number;
  locale: LocaleConfig;
  onChange: (ops: Overpayment[]) => void;
}

/**
 * Extra payments editor. Sits directly beneath the SummaryMetrics in
 * App.tsx — same card, no gap — so every change here causes a visible
 * change to the hero numbers above. That visual bond is the whole point
 * of the panel: cause and effect, one card.
 *
 * Two flavours: recurring (an extra amount every month from N onward)
 * and lump sum (a one-off principal hit at a specific month). Both
 * shorten the loan term; the EMI stays fixed.
 */
export function ExtraPaymentsPanel({
  overpayments,
  totalMonths,
  locale,
  onChange,
}: ExtraPaymentsPanelProps) {
  const addRecurring = () => {
    onChange([
      ...overpayments,
      { kind: 'recurring', amount: defaultRecurring(locale), startMonth: 1 },
    ]);
  };

  const addLump = () => {
    const month = Math.min(totalMonths, Math.max(1, Math.floor(totalMonths / 4)));
    onChange([...overpayments, { kind: 'lump', amount: defaultLump(locale), month }]);
  };

  const updateAt = (index: number, op: Overpayment) => {
    onChange(overpayments.map((existing, i) => (i === index ? op : existing)));
  };

  const removeAt = (index: number) => {
    onChange(overpayments.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-xs uppercase tracking-[0.18em] text-ink-muted">
          What if you paid extra?
        </div>
        {overpayments.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      <div className="font-serif text-xl text-ink mb-4">
        Layer extra principal — watch the impact above
      </div>

      {overpayments.length === 0 && (
        <div className="text-sm text-ink-soft leading-relaxed mb-4 max-w-prose">
          Banks let you put more money toward the principal whenever you want.
          Add a recurring contribution or a lump sum here and the loan finishes earlier —
          your monthly payment stays the same, but you pay less interest overall.
        </div>
      )}

      <div className="space-y-2 mb-3">
        {overpayments.map((op, i) => (
          <OverpaymentRow
            key={i}
            op={op}
            totalMonths={totalMonths}
            locale={locale}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={addRecurring}
          className="text-xs font-medium px-3 py-2 border border-paper-line rounded text-ink-soft hover:border-ink hover:text-ink hover:bg-paper-dim/40 transition-colors"
        >
          + Add monthly extra
        </button>
        <button
          type="button"
          onClick={addLump}
          className="text-xs font-medium px-3 py-2 border border-paper-line rounded text-ink-soft hover:border-ink hover:text-ink hover:bg-paper-dim/40 transition-colors"
        >
          + Add lump sum
        </button>
      </div>
    </div>
  );
}

function OverpaymentRow({
  op,
  totalMonths,
  locale,
  onChange,
  onRemove,
}: {
  op: Overpayment;
  totalMonths: number;
  locale: LocaleConfig;
  onChange: (next: Overpayment) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-paper-line rounded bg-paper-dim/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex rounded border border-paper-line overflow-hidden text-xs">
          <button
            type="button"
            onClick={() =>
              onChange(
                op.kind === 'recurring'
                  ? op
                  : { kind: 'recurring', amount: op.amount, startMonth: op.month },
              )
            }
            className={`px-2 py-0.5 transition-colors ${
              op.kind === 'recurring' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Recurring
          </button>
          <button
            type="button"
            onClick={() =>
              onChange(
                op.kind === 'lump'
                  ? op
                  : { kind: 'lump', amount: op.amount, month: op.startMonth },
              )
            }
            className={`px-2 py-0.5 transition-colors ${
              op.kind === 'lump' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Lump
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove overpayment"
          className="ml-auto w-6 h-6 text-ink-faint hover:text-interest hover:bg-interest/10 rounded transition-colors flex items-center justify-center"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">Amount</div>
          <div className="flex items-stretch border border-paper-line rounded bg-paper">
            <input
              type="text"
              inputMode="decimal"
              value={formatNumber(op.amount, locale)}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/[^0-9.]/g, ''));
                if (Number.isFinite(n)) onChange({ ...op, amount: n });
              }}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm font-mono num focus:outline-none min-w-0"
            />
            <span className="self-center pr-2 text-[10px] text-ink-faint font-mono">
              {locale.currency}
            </span>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">
            {op.kind === 'lump' ? 'At month' : 'Starting month'}
          </div>
          <input
            type="number"
            value={op.kind === 'lump' ? op.month : op.startMonth}
            min={1}
            max={totalMonths}
            onChange={(e) => {
              const n = Math.max(1, Math.min(totalMonths, Math.floor(Number(e.target.value) || 1)));
              if (op.kind === 'lump') onChange({ ...op, month: n });
              else onChange({ ...op, startMonth: n });
            }}
            className="w-full bg-paper border border-paper-line rounded px-2 py-1.5 text-sm font-mono num focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {op.kind === 'recurring' && (
        <div className="mt-2 flex items-center gap-2 text-xs flex-wrap">
          <label className="flex items-center gap-1.5 text-ink-soft cursor-pointer">
            <input
              type="checkbox"
              checked={op.endMonth !== undefined}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({ ...op, endMonth: Math.min(totalMonths, op.startMonth + 12) });
                } else {
                  const { endMonth, ...rest } = op;
                  void endMonth;
                  onChange(rest);
                }
              }}
              className="accent-ink"
            />
            End early
          </label>
          {op.endMonth !== undefined && (
            <input
              type="number"
              value={op.endMonth}
              min={op.startMonth}
              max={totalMonths}
              onChange={(e) => {
                const n = Math.max(
                  op.startMonth,
                  Math.min(totalMonths, Math.floor(Number(e.target.value) || op.startMonth)),
                );
                onChange({ ...op, endMonth: n });
              }}
              className="bg-paper border border-paper-line rounded px-2 py-1 text-xs font-mono num w-20 focus:outline-none focus:border-ink"
              aria-label="Last month"
            />
          )}
          <span className="text-ink-faint ml-auto font-mono">
            ≈ {formatCurrency(op.amount * 12, locale)} / yr
          </span>
        </div>
      )}
    </div>
  );
}

/** Sensible default starting amount for a recurring overpayment per locale. */
function defaultRecurring(locale: LocaleConfig): number {
  switch (locale.id) {
    case 'IN':
      return 5000;
    case 'NO':
      return 1000;
    case 'EU':
    case 'UK':
    case 'US':
      return 200;
  }
}

/** Sensible default starting amount for a lump sum per locale. */
function defaultLump(locale: LocaleConfig): number {
  switch (locale.id) {
    case 'IN':
      return 100_000;
    case 'NO':
      return 50_000;
    case 'EU':
    case 'UK':
    case 'US':
      return 5_000;
  }
}
