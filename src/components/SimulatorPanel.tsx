import type { Frequency, Overpayment } from '../engine/types';
import { frequencyLabel } from '../engine/amortization';
import { type LocaleConfig, formatCurrency, formatNumber } from '../engine/locale';

interface SimulatorPanelProps {
  frequency: Frequency;
  overpayments: Overpayment[];
  totalMonths: number;
  locale: LocaleConfig;
  onFrequencyChange: (f: Frequency) => void;
  onOverpaymentsChange: (ops: Overpayment[]) => void;
}

const FREQUENCIES: Frequency[] = ['monthly', 'biweekly', 'quarterly', 'semiannual', 'annual'];

/**
 * Phase 2 simulator surface. Lives separate from the core InputPanel
 * because it answers a different question — "what if I changed my
 * repayment strategy?" instead of "what's the loan?". The two are
 * stacked in the main column on mobile, side-by-side on wide screens.
 */
export function SimulatorPanel({
  frequency,
  overpayments,
  totalMonths,
  locale,
  onFrequencyChange,
  onOverpaymentsChange,
}: SimulatorPanelProps) {
  const addRecurring = () => {
    onOverpaymentsChange([
      ...overpayments,
      { kind: 'recurring', amount: 100, startMonth: 1 },
    ]);
  };

  const addLump = () => {
    const month = Math.min(totalMonths, Math.max(1, Math.floor(totalMonths / 4)));
    onOverpaymentsChange([...overpayments, { kind: 'lump', amount: 5000, month }]);
  };

  const updateAt = (index: number, op: Overpayment) => {
    onOverpaymentsChange(overpayments.map((existing, i) => (i === index ? op : existing)));
  };

  const removeAt = (index: number) => {
    onOverpaymentsChange(overpayments.filter((_, i) => i !== index));
  };

  return (
    <div className="border hairline rounded-lg p-5 sm:p-6 bg-paper">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-ink-muted">Simulator</div>
          <div className="font-serif text-xl text-ink mt-0.5">What if you paid differently?</div>
        </div>
        {overpayments.length > 0 || frequency !== 'monthly' ? (
          <button
            type="button"
            onClick={() => {
              onFrequencyChange('monthly');
              onOverpaymentsChange([]);
            }}
            className="text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline"
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className="mb-5">
        <div className="text-sm text-ink-soft font-medium mb-2">Payment frequency</div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 border border-paper-line rounded overflow-hidden bg-paper-dim/40">
          {FREQUENCIES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFrequencyChange(f)}
              className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                frequency === f
                  ? 'bg-ink text-paper'
                  : 'text-ink-soft hover:bg-paper-line/50'
              }`}
            >
              {frequencyLabel(f)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-sm text-ink-soft font-medium">Extra payments</div>
          {overpayments.length > 0 && (
            <div className="text-xs text-ink-faint font-mono">
              {overpayments.length} active
            </div>
          )}
        </div>

        {overpayments.length === 0 && (
          <div className="text-sm text-ink-faint italic mb-3">
            Layer extra principal payments on top of your scheduled EMI to see how much interest you'd save.
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
            className="text-xs px-3 py-1.5 border border-paper-line rounded text-ink-soft hover:border-ink hover:text-ink transition-colors"
          >
            + Recurring
          </button>
          <button
            type="button"
            onClick={addLump}
            className="text-xs px-3 py-1.5 border border-paper-line rounded text-ink-soft hover:border-ink hover:text-ink transition-colors"
          >
            + Lump sum
          </button>
        </div>
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
                  ? { kind: 'recurring', amount: op.amount, startMonth: op.startMonth, endMonth: op.endMonth }
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
        <div className="mt-2 flex items-center gap-2 text-xs">
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
                const n = Math.max(op.startMonth, Math.min(totalMonths, Math.floor(Number(e.target.value) || op.startMonth)));
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
