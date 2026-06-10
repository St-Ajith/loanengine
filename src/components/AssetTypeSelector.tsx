import type { AssetType, AssetCondition } from '../engine/types';

interface AssetTypeSelectorProps {
  assetType: AssetType;
  condition: AssetCondition;
  onAssetTypeChange: (next: AssetType) => void;
  onConditionChange: (next: AssetCondition) => void;
}

const ASSET_OPTIONS: { value: AssetType; label: string; sublabel: string }[] = [
  { value: 'home', label: 'Home', sublabel: 'Mortgage' },
  { value: 'car', label: 'Car', sublabel: 'Auto finance' },
];

const CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
];

export function AssetTypeSelector({
  assetType,
  condition,
  onAssetTypeChange,
  onConditionChange,
}: AssetTypeSelectorProps) {
  // Home loan rates are typically identical for new and existing properties
  // — only car finance prices condition into the APR. Hide the toggle when
  // it can't actually change anything.
  const showCondition = assetType === 'car';

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-ink-muted mb-2 font-medium">
          Asset
        </div>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Asset type">
          {ASSET_OPTIONS.map((opt) => {
            const selected = assetType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onAssetTypeChange(opt.value)}
                className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  selected
                    ? 'bg-ink text-surface border-ink'
                    : 'bg-surface border-surface-line hover:border-surface-hover text-ink-soft'
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    selected ? 'text-surface/70' : 'text-ink-faint'
                  }`}
                >
                  {opt.sublabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showCondition && (
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-ink-muted mb-2 font-medium">
            Condition
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Asset condition">
            {CONDITION_OPTIONS.map((opt) => {
              const selected = condition === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onConditionChange(opt.value)}
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    selected
                      ? 'bg-ink text-surface border-ink'
                      : 'bg-surface border-surface-line hover:border-surface-hover text-ink-soft'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
