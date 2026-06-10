import { useId, useState, useEffect } from 'react';

interface DualInputProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step: number;
  /** Display formatter for the text input (e.g. currency). Applied only
   *  when the field is NOT focused — while typing, the user sees their
   *  raw input so cursor position and partial edits aren't fought by
   *  on-the-fly reformatting. */
  format?: (n: number) => string;
  /** Suffix shown next to the input (e.g. "%"). */
  suffix?: string;
  /** Hint shown under the label. */
  hint?: string;
}

/**
 * Per FR-2.1: every primary numeric input is exposed as both a precise
 * text field and a smooth slider, both bound to the same value.
 *
 * Edit behaviour: while the field is focused, the input shows the raw
 * value the user has typed so partial edits work normally — no comma
 * reformatting mid-keystroke, no cursor jump, no auto-select-all swallowing
 * keystrokes. The formatted display returns on blur.
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
}: DualInputProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  // Local string state mirrors the input while editing. We seed it from
  // `value` on focus and on external changes (e.g. slider drag while
  // typing — rare but possible).
  const [draft, setDraft] = useState<string>(() => String(value));

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const displayValue = focused ? draft : format ? format(value) : String(value);

  const handleTextChange = (raw: string) => {
    setDraft(raw);
    // Permit only digits, one optional decimal point, and a leading minus.
    const cleaned = raw.replace(/[^0-9.\-]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return;
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

      <div className="flex items-stretch border border-surface-line rounded-lg bg-surface focus-within:border-ink transition-colors">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => {
            // Seed the draft with the raw numeric value (not the formatted
            // string) so commas and currency symbols don't trip up editing.
            setDraft(String(value));
            setFocused(true);
            // Deliberately not calling .select() here — that's what caused
            // the "starts typing and everything disappears" bug.
          }}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent px-3 py-2 text-base num text-ink focus:outline-none min-w-0"
        />
        {suffix && (
          <span className="self-center pr-3 text-ink-faint text-sm">{suffix}</span>
        )}
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clampedSliderValue}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} slider`}
        className="mt-3"
      />
    </div>
  );
}
