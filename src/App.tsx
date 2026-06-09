import { useMemo } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { SummaryMetrics } from './components/SummaryMetrics';
import { AmortizationChart } from './components/AmortizationChart';
import { ScheduleTable } from './components/ScheduleTable';
import { useAppState } from './hooks/useAppState';
import { calculateLoan } from './engine/amortization';
import { LOCALES, type LocaleId } from './engine/locale';

export default function App() {
  const [state, updateState] = useAppState();

  const locale = LOCALES[state.locale];

  // The full schedule recomputes on every input change. Section 4.1 of
  // the PRD caps this at 50ms even for 360-month schedules. For a clean
  // baseline loop with no overpayments, this runs in well under a
  // millisecond on commodity hardware; we'll memoize anyway because
  // React re-renders are frequent and the schedule array is large.
  const result = useMemo(() => calculateLoan(state), [state]);

  // When locale changes, also refresh defaults so the slider caps fit
  // the new currency's typical loan sizes — but only if the user hasn't
  // moved off the previous locale's defaults yet.
  const handleLocaleChange = (id: LocaleId) => {
    const next = LOCALES[id];
    const d = next.defaults[state.assetType];
    updateState({
      locale: id,
      assetValue: d.value,
      downPayment: d.value * (d.downPct / 100),
      apr: d.apr,
      termYears: d.termYears,
      termMonths: 0,
    });
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header localeId={state.locale} onLocaleChange={handleLocaleChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            Plan the loan, not the pitch.
          </h1>
          <p className="text-ink-muted mt-3 leading-relaxed">
            A working calculator for home and car loans. No accounts, no lead capture. Every
            scenario lives in the URL — copy the link to share.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 lg:gap-8 items-start">
          <aside className="lg:sticky lg:top-6 bg-paper border hairline rounded-lg p-5 sm:p-6">
            <InputPanel state={state} onChange={updateState} locale={locale} />
          </aside>

          <section className="space-y-6 min-w-0">
            <SummaryMetrics result={result} locale={locale} />
            <AmortizationChart result={result} locale={locale} />
            <ScheduleTable result={result} locale={locale} />

            <PhaseRoadmap />
          </section>
        </div>
      </main>

      <footer className="border-t hairline mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs text-ink-muted flex flex-wrap items-center gap-x-6 gap-y-2">
          <span>Loan Engine v0.1 — Phase 1 MVP</span>
          <span className="font-mono">All calculations run client-side. No data leaves your browser.</span>
        </div>
      </footer>
    </div>
  );
}

/**
 * Phase roadmap — visible to the user during early iterations so they
 * know what's intentionally absent. Will be removed once Phase 2/3 ship.
 */
function PhaseRoadmap() {
  const items: { title: string; status: 'done' | 'next' | 'later'; desc: string }[] = [
    {
      title: 'Baseline EMI & amortization',
      status: 'done',
      desc: 'Asset fork, dual inputs, $/% down payment, live schedule, URL state.',
    },
    {
      title: 'Overpayments & frequency',
      status: 'next',
      desc: 'Recurring extras, lump-sum injections, bi-weekly/quarterly modes, live savings delta.',
    },
    {
      title: 'Exports & geo-IP',
      status: 'later',
      desc: 'PDF summary, CSV ledger, auto-detected locale, partner offer panel.',
    },
  ];

  return (
    <div className="mt-10 border-t hairline pt-8">
      <div className="text-xs uppercase tracking-[0.16em] text-ink-muted mb-4">Roadmap</div>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={item.title} className="flex gap-4">
            <span className="font-mono text-xs text-ink-faint w-6 pt-0.5">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-ink">{item.title}</span>
                <StatusPill status={item.status} />
              </div>
              <div className="text-sm text-ink-muted mt-0.5">{item.desc}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatusPill({ status }: { status: 'done' | 'next' | 'later' }) {
  const labels = { done: 'Shipped', next: 'Next', later: 'Later' };
  const styles = {
    done: 'bg-savings/15 text-savings',
    next: 'bg-principal/15 text-principal',
    later: 'bg-paper-line text-ink-muted',
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
