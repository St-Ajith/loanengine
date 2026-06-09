import type { AssetType, AssetCondition } from '../engine/types';

interface AssetTypeSelectorProps {
  assetType: AssetType;
  condition: AssetCondition;
  onChange: (next: { assetType?: AssetType; condition?: AssetCondition }) => void;
}

const ASSET_OPTIONS: { value: AssetType; label: string; sublabel: string }[] = [
  { value: 'home', label: 'Home', sublabel: 'Mortgage / property' },
  { value: 'car', label: 'Car', sublabel: 'Auto financing' },
];

const CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
];

export function AssetTypeSelector({ assetType, condition, onChange }: AssetTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-ink-muted mb-2">Asset</div>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Asset type">
          {ASSET_OPTIONS.map((opt) => {
            const selected = assetType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ assetType: opt.value })}
                className={`text-left px-3 py-2.5 rounded border transition-colors ${
                  selected
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-paper-dim/40 border-paper-line hover:border-ink-muted text-ink-soft'
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    selected ? 'text-paper/70' : 'text-ink-faint'
                  }`}
                >
                  {opt.sublabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-ink-muted mb-2">Condition</div>
        <div className="flex gap-2" role="radiogroup" aria-label="Asset condition">
          {CONDITION_OPTIONS.map((opt) => {
            const selected = condition === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ condition: opt.value })}
                className={`flex-1 px-3 py-1.5 rounded border text-sm transition-colors ${
                  selected
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-paper-dim/40 border-paper-line hover:border-ink-muted text-ink-soft'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
