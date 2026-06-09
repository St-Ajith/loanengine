import { useState } from 'react';
import { DualInput } from './DualInput';
import { AssetTypeSelector } from './AssetTypeSelector';
import type { AppState } from '../engine/url-state';
import { type LocaleConfig, formatNumber } from '../engine/locale';

interface InputPanelProps {
  state: AppState;
  onChange: (updates: Partial<AppState>) => void;
  locale: LocaleConfig;
}

/**
 * Primary input surface. Houses the asset fork (FR-1.3), the four core
 * input tokens (FR-2.1), and the down-payment $/% toggle that lets users
 * express the same value in whichever unit feels native.
 */
export function InputPanel({ state, onChange, locale }: InputPanelProps) {
  const [downMode, setDownMode] = useState<'amount' | 'percent'>('percent');

  const caps = locale.caps[state.assetType];
  const downPct = state.assetValue > 0 ? (state.downPayment / state.assetValue) * 100 : 0;

  const handleAssetValueChange = (v: number) => {
    // Preserve the down-payment percentage when the user adjusts asset value
    // — that's almost always what they mean when nudging the headline price.
    const pct = state.assetValue > 0 ? state.downPayment / state.assetValue : 0;
    onChange({ assetValue: v, downPayment: Math.round(v * pct) });
  };

  const handleDownAmountChange = (amount: number) => {
    onChange({ downPayment: Math.min(amount, state.assetValue) });
  };

  const handleDownPercentChange = (pct: number) => {
    const clamped = Math.min(100, Math.max(0, pct));
    onChange({ downPayment: Math.round(state.assetValue * (clamped / 100)) });
  };

  const formatMoney = (n: number) => formatNumber(n, locale, 0);

  return (
    <div className="space-y-6">
      <AssetTypeSelector
        assetType={state.assetType}
        condition={state.condition}
        onChange={onChange}
      />

      <div className="border-t hairline pt-6 space-y-5">
        <DualInput
          label="Asset value"
          value={state.assetValue}
          onChange={handleAssetValueChange}
          min={0}
          max={caps.maxValue}
          step={1000}
          format={formatMoney}
          suffix={locale.currency}
        />

        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="text-sm text-ink-soft font-medium">Down payment</label>
            <div className="flex rounded border border-paper-line overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setDownMode('amount')}
                className={`px-2 py-0.5 transition-colors ${
                  downMode === 'amount' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {locale.currency}
              </button>
              <button
                type="button"
                onClick={() => setDownMode('percent')}
                className={`px-2 py-0.5 transition-colors ${
                  downMode === 'percent' ? 'bg-ink text-paper' : 'text-ink-muted hover:text-ink'
                }`}
              >
                %
              </button>
            </div>
          </div>

          {downMode === 'amount' ? (
            <DualInput
              label=""
              value={state.downPayment}
              onChange={handleDownAmountChange}
              min={0}
              max={state.assetValue}
              step={500}
              format={formatMoney}
              suffix={locale.currency}
              hint={`${downPct.toFixed(1)}% of asset`}
            />
          ) : (
            <DualInput
              label=""
              value={Number(downPct.toFixed(2))}
              onChange={handleDownPercentChange}
              min={0}
              max={100}
              step={0.5}
              format={(n) => n.toFixed(1)}
              suffix="%"
              hint={`${formatMoney(state.downPayment)} ${locale.currency}`}
            />
          )}
        </div>

        <div>
          <div className="text-sm text-ink-soft font-medium mb-1.5">Loan term</div>
          <div className="grid grid-cols-2 gap-3">
            <TermStepper
              label="Years"
              value={state.termYears}
              max={caps.maxTermYears}
              onChange={(v) => onChange({ termYears: v })}
            />
            <TermStepper
              label="Months"
              value={state.termMonths}
              max={11}
              onChange={(v) => onChange({ termMonths: v })}
            />
          </div>
        </div>

        <DualInput
          label="Interest rate (APR)"
          value={state.apr}
          onChange={(v) => onChange({ apr: v })}
          min={0}
          max={caps.maxApr}
          step={0.05}
          format={(n) => n.toFixed(2)}
          suffix="%"
        />
      </div>
    </div>
  );
}

/**
 * Compact stepper used for the years/months pair. A full DualInput
 * would be overkill for a small integer range.
 */
function TermStepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div>
      <div className="flex items-stretch border border-paper-line rounded bg-paper-dim/40 focus-within:border-ink transition-colors">
        <button
          type="button"
          onClick={dec}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="w-8 text-ink-muted hover:text-ink hover:bg-paper-line/50 transition-colors"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={0}
          max={max}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.max(0, Math.min(max, Math.floor(n))));
          }}
          className="flex-1 bg-transparent px-2 py-2 text-center font-mono text-base num focus:outline-none w-0 min-w-0"
          aria-label={label}
        />
        <button
          type="button"
          onClick={inc}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="w-8 text-ink-muted hover:text-ink hover:bg-paper-line/50 transition-colors"
        >
          +
        </button>
      </div>
      <div className="text-xs text-ink-faint mt-1 text-center">{label}</div>
    </div>
  );
}
