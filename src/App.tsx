import { useMemo } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { SummaryMetrics } from './components/SummaryMetrics';
import { AmortizationChart } from './components/AmortizationChart';
import { ScheduleTable } from './components/ScheduleTable';
import { SimulatorPanel } from './components/SimulatorPanel';
import { useAppState } from './hooks/useAppState';
import { compareLoan } from './engine/comparison';
import { LOCALES, defaultsFor, type LocaleId } from './engine/locale';

export default function App() {
  const [state, updateState] = useAppState();

  const locale = LOCALES[state.locale];

  // The comparison computes both baseline and modified schedules. With
  // overpayments and 360+ periods this is still well under the 50ms
  // budget from PRD §4.1 — typically a millisecond on commodity hardware.
  const comparison = useMemo(() => compareLoan(state), [state]);

  const handleLocaleChange = (id: LocaleId) => {
    const next = LOCALES[id];
    const d = defaultsFor(next, state.assetType, state.condition);
    updateState({
      locale: id,
      assetValue: d.value,
      downPayment: d.downPayment,
      termYears: d.termYears,
      termMonths: 0,
      rateProfile: { kind: 'flat', apr: d.apr },
    });
  };

  const totalScheduledMonths = state.termYears * 12 + state.termMonths;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header localeId={state.locale} onLocaleChange={handleLocaleChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            Plan the loan, not the pitch.
          </h1>
          <p className="text-ink-muted mt-3 leading-relaxed">
            A working calculator for home and car loans. Model promo periods, extra payments,
            and frequency changes — see exactly how much you'd save. No accounts, no lead capture.
            Every scenario lives in the URL, so you can share a link.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 lg:gap-8 items-start">
          <aside className="lg:sticky lg:top-6 bg-paper border hairline rounded-lg p-5 sm:p-6">
            <InputPanel state={state} onChange={updateState} locale={locale} />
          </aside>

          <section className="space-y-6 min-w-0">
            <SummaryMetrics comparison={comparison} locale={locale} />
            <SimulatorPanel
              frequency={state.frequency}
              overpayments={state.overpayments}
              totalMonths={totalScheduledMonths}
              locale={locale}
              onFrequencyChange={(f) => updateState({ frequency: f })}
              onOverpaymentsChange={(ops) => updateState({ overpayments: ops })}
            />
            <AmortizationChart comparison={comparison} locale={locale} />
            <ScheduleTable result={comparison.modified} locale={locale} />
          </section>
        </div>
      </main>

      <footer className="border-t hairline mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs text-ink-muted flex flex-wrap items-center gap-x-6 gap-y-2">
          <span>Loan Engine v0.2 — Simulator</span>
          <span className="font-mono">
            All calculations run client-side. No data leaves your browser.
          </span>
        </div>
      </footer>
    </div>
  );
}
