import { useState } from 'react';
import { DualInput } from './DualInput';
import { AssetTypeSelector } from './AssetTypeSelector';
import type { AppState } from '../engine/url-state';
import type { AssetCondition, AssetType, RateProfile } from '../engine/types';
import { type LocaleConfig, formatNumber, defaultsFor } from '../engine/locale';

interface InputPanelProps {
  state: AppState;
  onChange: (updates: Partial<AppState>) => void;
  locale: LocaleConfig;
}

/**
 * Primary input surface. Houses the asset fork (FR-1.3), the four core
 * input tokens (FR-2.1), and the rate profile (flat or tiered promo).
 *
 * Switching asset type resets value / down / APR / term to that asset's
 * locale-aware defaults — a Home's millions don't carry over to a Car.
 * Switching condition only adjusts APR (the asset is the same; only
 * the financing rate differs between new and used).
 */
export function InputPanel({ state, onChange, locale }: InputPanelProps) {
  const [downMode, setDownMode] = useState<'amount' | 'percent'>('percent');

  const caps = locale.caps[state.assetType];
  const downPct = state.assetValue > 0 ? (state.downPayment / state.assetValue) * 100 : 0;

  const handleAssetTypeChange = (nextType: AssetType) => {
    if (nextType === state.assetType) return;
    const d = defaultsFor(locale, nextType, state.condition);
    onChange({
      assetType: nextType,
      assetValue: d.value,
      downPayment: d.downPayment,
      termYears: d.termYears,
      termMonths: 0,
      rateProfile: { kind: 'flat', apr: d.apr },
    });
  };

  const handleConditionChange = (nextCondition: AssetCondition) => {
    if (nextCondition === state.condition) return;
    const d = defaultsFor(locale, state.assetType, nextCondition);
    // Only adjust the APR — keep the user's value/down/term as-is, since
    // a specific car or home doesn't change price when its condition
    // label flips. Preserve a promo if one is active, just update the
    // standard rate.
    const nextRate: RateProfile =
      state.rateProfile.kind === 'flat'
        ? { kind: 'flat', apr: d.apr }
        : { ...state.rateProfile, postApr: d.apr };
    onChange({ condition: nextCondition, rateProfile: nextRate });
  };

  const handleAssetValueChange = (v: number) => {
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
        onAssetTypeChange={handleAssetTypeChange}
        onConditionChange={handleConditionChange}
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

        <RateProfileEditor
          rateProfile={state.rateProfile}
          maxApr={caps.maxApr}
          onChange={(rp) => onChange({ rateProfile: rp })}
          assetType={state.assetType}
        />
      </div>
    </div>
  );
}

/**
 * Rate profile editor. Defaults to a flat APR; users can toggle a
 * promo period (common in car finance — Norwegian dealers often run
 * 0% or 2.99% intro deals for 1–3 years). The toggle is visible for
 * both asset types but the copy emphasizes the car use case.
 */
function RateProfileEditor({
  rateProfile,
  maxApr,
  onChange,
  assetType,
}: {
  rateProfile: RateProfile;
  maxApr: number;
  onChange: (rp: RateProfile) => void;
  assetType: 'home' | 'car';
}) {
  const isTiered = rateProfile.kind === 'tiered';
  const standardApr = isTiered ? rateProfile.postApr : rateProfile.apr;

  const togglePromo = () => {
    if (isTiered) {
      onChange({ kind: 'flat', apr: rateProfile.postApr });
    } else {
      // Sensible promo defaults: 0% for 36 months (matches Norwegian car
      // dealer offers); user can dial them in from there.
      onChange({
        kind: 'tiered',
        promoApr: 0,
        promoMonths: 36,
        postApr: rateProfile.apr,
      });
    }
  };

  const setStandardApr = (v: number) => {
    if (isTiered) onChange({ ...rateProfile, postApr: v });
    else onChange({ kind: 'flat', apr: v });
  };

  return (
    <div>
      <DualInput
        label={isTiered ? 'Standard rate (after promo)' : 'Interest rate (APR)'}
        value={standardApr}
        onChange={setStandardApr}
        min={0}
        max={maxApr}
        step={0.05}
        format={(n) => n.toFixed(2)}
        suffix="%"
      />

      <button
        type="button"
        onClick={togglePromo}
        className={`mt-3 text-xs uppercase tracking-[0.14em] transition-colors ${
          isTiered
            ? 'text-ink-muted hover:text-ink'
            : 'text-ink-faint hover:text-ink-soft'
        }`}
      >
        {isTiered ? '− Remove promo period' : '+ Add promo period'}
        {!isTiered && assetType === 'car' && (
          <span className="ml-1.5 normal-case tracking-normal text-ink-faint">
            (e.g. 0% for 36 months)
          </span>
        )}
      </button>

      {isTiered && (
        <div className="mt-4 pl-3 border-l-2 border-l-paper-line space-y-4">
          <DualInput
            label="Promo rate"
            value={rateProfile.promoApr}
            onChange={(v) => onChange({ ...rateProfile, promoApr: v })}
            min={0}
            max={maxApr}
            step={0.05}
            format={(n) => n.toFixed(2)}
            suffix="%"
          />
          <DualInput
            label="Promo duration"
            value={rateProfile.promoMonths}
            onChange={(v) => onChange({ ...rateProfile, promoMonths: Math.max(1, Math.floor(v)) })}
            min={1}
            max={120}
            step={1}
            format={(n) => String(Math.floor(n))}
            suffix="months"
          />
        </div>
      )}
    </div>
  );
}

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
