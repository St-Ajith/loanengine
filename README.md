# Loan Engine

A brand-agnostic universal loan calculator and planning simulator. Built per the Fintech Engine Initiative PRD v1.0 — model home and car loans with full visibility into amortization, no lead-capture funnel attached.

> **Status**: Phase 1 MVP. Baseline EMI, schedule, URL state, multi-locale. Overpayments, frequency remapping, and PDF/CSV exports are slated for Phases 2 and 3.

## Stack

- **React 18 + TypeScript** — single-page app, no router (everything lives in one workspace per PRD §4.2)
- **Vite** — dev server and bundler
- **Tailwind CSS** — utility styling with a custom palette/typography token set
- **Recharts** — amortization stack chart
- All math is **pure functions** in `src/engine/` so it's testable and engine-agnostic of the UI

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build       # produces dist/
npm run preview     # serves the production build locally
```

## Deploy to GitHub Pages

The repo includes `.github/workflows/deploy.yml` which builds and publishes on every push to `main`. To wire it up:

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source**: pick **GitHub Actions**.
3. Push to `main`. The workflow builds and deploys; the URL shows up under **Actions → Deploy to GitHub Pages**.

The Vite config uses `base: './'` (relative paths) so the app works at any repo path — no per-repo configuration needed.

## Project layout

```
src/
├── engine/                  # Pure, UI-free math. The reference implementation.
│   ├── types.ts             # LoanInputs, ScheduleRow, LoanResult
│   ├── amortization.ts      # computeEmi, buildSchedule, calculateLoan
│   ├── locale.ts            # Currency formatting + per-region defaults
│   └── url-state.ts         # Query-string codec for FR-4.1 shareable links
├── hooks/
│   └── useAppState.ts       # Two-way bind between React state and the URL
├── components/
│   ├── Header.tsx           # Wordmark + locale selector
│   ├── AssetTypeSelector.tsx# Home/Car × New/Used fork
│   ├── DualInput.tsx        # Text+slider bound input (FR-2.1 dual control)
│   ├── InputPanel.tsx       # Orchestrates all inputs, $/% toggle
│   ├── SummaryMetrics.tsx   # Hero monthly payment + supporting figures
│   ├── AmortizationChart.tsx# Stacked area: principal vs interest
│   └── ScheduleTable.tsx    # Year-by-year breakdown, expandable to months
├── App.tsx                  # Layout composition
├── main.tsx                 # React entry
└── index.css                # Tailwind + global element styling
```

## Architecture decisions

**All math runs client-side.** No backend, no API calls. The PRD requires <50ms recalc latency (§4.1); for a 360-month baseline loop this is a few hundred microseconds.

**URL is the only state store.** No accounts, no localStorage. Per FR-4.1, every parameter is encoded in the query string. Bookmarking and link-sharing work out of the box.

**Engine is decoupled from the UI.** `src/engine/` has zero React imports. When Phase 2 adds overpayments, the entry point becomes `calculateLoanWithModifications(inputs, mods)` returning the same `LoanResult` shape — the UI components don't change.

**Restraint over decoration.** Typography (Newsreader serif + Inter + JetBrains Mono) does the heavy identity lifting. Color is reserved for semantic meaning: blue = principal, crimson = interest, green = savings. Nothing is colored just to break up the page.

## PRD coverage — Phase 1

| Requirement | Status |
|---|---|
| FR-1.1 Geo-IP auto-detection | Deferred to Phase 3 |
| FR-1.2 Manual locale override | ✅ Header selector |
| FR-1.3 Asset type / condition | ✅ |
| FR-2.1 Dual-input controls | ✅ Text + slider for all primary inputs |
| FR-2.2 Standard EMI formula | ✅ `computeEmi()` in `engine/amortization.ts` |
| FR-3.1 Frequency remapping | Phase 2 |
| FR-3.2 Overpayment matrix | Phase 2 |
| FR-3.3 Live differential output | Phase 2 |
| FR-4.1 URL state serialization | ✅ |
| FR-4.2.A PDF compilation | Phase 3 |
| FR-4.2.B CSV ledger | Phase 3 |
| FR-5.1 Partner discovery panel | Phase 3 |
| NFR §4.1 <50ms recalc | ✅ Well under |
| NFR §4.2 Single workspace | ✅ |

## License

Add a license file appropriate to your use.
