import { useId } from 'react';

interface DualInputProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step: number;
  /** Display formatter for the text input (e.g. currency). */
  format?: (n: number) => string;
  /** Suffix shown next to the input (e.g. "%"). */
  suffix?: string;
  /** Hint shown under the label. */
  hint?: string;
  /** Disable the slider while keeping the text input usable. */
  sliderDisabled?: boolean;
}

/**
 * Per FR-2.1: every primary numeric input is exposed as both a precise
 * text field and a smooth slider, both bound to the same value. Editing
 * one updates the other live.
 *
 * The text input shows a formatted value (e.g. "$450,000") while idle.
 * On focus it switches to a raw numeric string so the user can type a
 * new value without fighting the formatter — the standard pattern for
 * money inputs.
 */
export function DualInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  suffix,
  hint,
  sliderDisabled,
}: DualInputProps) {
  const id = useId();

  const handleTextChange = (raw: string) => {
    // Strip everything that isn't a digit or decimal separator.
    const cleaned = raw.replace(/[^0-9.\-]/g, '');
    if (cleaned === '' || cleaned === '-') {
      onChange(0);
      return;
    }
    const n = Number(cleaned);
    if (Number.isFinite(n)) onChange(n);
  };

  const clampedSliderValue = Math.min(max, Math.max(min, value));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label htmlFor={id} className="text-sm text-ink-soft font-medium">
          {label}
        </label>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </div>

      <div className="flex items-stretch border border-paper-line rounded bg-paper-dim/40 focus-within:border-ink transition-colors">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={format ? format(value) : String(value)}
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="flex-1 bg-transparent px-3 py-2 font-mono text-base num text-ink focus:outline-none min-w-0"
        />
        {suffix && (
          <span className="self-center pr-3 text-ink-faint text-sm font-mono">{suffix}</span>
        )}
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clampedSliderValue}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={sliderDisabled}
        aria-label={`${label} slider`}
        className="mt-3"
      />
    </div>
  );
}
