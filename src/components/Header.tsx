import { LOCALES, type LocaleId } from '../engine/locale';

interface HeaderProps {
  localeId: LocaleId;
  onLocaleChange: (id: LocaleId) => void;
}

export function Header({ localeId, onLocaleChange }: HeaderProps) {
  return (
    <header className="border-b hairline bg-surface">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-semibold tracking-tight text-ink">Loan Engine</span>
          <span className="hidden sm:inline text-xs uppercase tracking-[0.16em] text-ink-muted font-medium">
            Planning simulator
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <span className="hidden sm:inline">Region</span>
          <select
            value={localeId}
            onChange={(e) => onLocaleChange(e.target.value as LocaleId)}
            className="bg-surface border border-surface-line rounded-lg px-2.5 py-1.5 text-sm focus:border-ink hover:border-surface-hover transition-colors cursor-pointer"
            aria-label="Select region"
          >
            {Object.values(LOCALES).map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label} ({loc.currency})
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
