import { LOCALES, type LocaleId } from '../engine/locale';

interface HeaderProps {
  localeId: LocaleId;
  onLocaleChange: (id: LocaleId) => void;
}

export function Header({ localeId, onLocaleChange }: HeaderProps) {
  return (
    <header className="border-b hairline border-b-paper-line">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-2xl tracking-tight text-ink">
            Loan Engine
          </span>
          <span className="hidden sm:inline text-xs uppercase tracking-[0.18em] text-ink-muted">
            Planning Simulator
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <span className="hidden sm:inline">Region</span>
          <select
            value={localeId}
            onChange={(e) => onLocaleChange(e.target.value as LocaleId)}
            className="bg-transparent border border-paper-line rounded px-2 py-1 text-sm focus:border-ink hover:border-ink-muted transition-colors cursor-pointer"
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
