# Phase 2 changes

## What's new

- **Simulator panel** — payment frequency (monthly / bi-weekly / quarterly / semi-annual / annual) plus a list-style editor for recurring overpayments and lump-sum injections.
- **Promo period (tiered rates)** — toggleable in the rate section. Defaults to "0% for 36 months" when first added (matches Norwegian dealer offers); both the promo rate and duration are editable.
- **Savings ribbon** — green banner under the hero metric showing interest saved and months shaved off the term, but only when modifications are active.
- **Baseline overlay on chart** — dashed line shows where the un-modified balance would have been at any point in time.
- **Asset-switch defaults reset** — switching Home → Car (or vice versa) now resets value, down payment, term, and APR to that asset's sensible defaults. Switching New ↔ Used only adjusts the APR (the asset is the same; only the financing rate differs).
- **Real mid-2026 reference rates per region** — sourced from Freddie Mac PMMS (US), Bank of England (UK), ECB MIR / German Pfandbrief (EU), RBI / SBI (India), SSB (Norway).

## Reference rates baked in

| Region | Home | New Car | Used Car |
|--------|------|---------|----------|
| US     | 6.5% | 6.8%    | 7.8%     |
| EU     | 3.7% | 5.5%    | 7.0%     |
| UK     | 5.6% | 7.5%    | 9.0%     |
| India  | 8.4% | 9.2%    | 11.5%    |
| Norway | 5.3% | 6.5%    | 8.0%     |

These are seed defaults — the slider always lets users dial in their own.

## File changes

```
src/engine/types.ts          rewritten — new types: Frequency, RateProfile, Overpayment, ComparisonResult
src/engine/amortization.ts   rewritten — handles frequency, tiered rates, overpayments, early payoff
src/engine/comparison.ts     NEW       — baseline vs modified delta computation
src/engine/locale.ts         rewritten — real mid-2026 rates + defaultsFor() accessor
src/engine/url-state.ts      rewritten — encodes promo, frequency, overpayments
src/hooks/useAppState.ts     rewritten — new state shape
src/App.tsx                  rewritten — wires in SimulatorPanel and comparison
src/components/InputPanel.tsx           rewritten — asset-switch reset + RateProfileEditor
src/components/AssetTypeSelector.tsx    rewritten — split callbacks for asset vs condition
src/components/SimulatorPanel.tsx       NEW       — frequency + overpayments
src/components/SummaryMetrics.tsx       rewritten — promo split + savings ribbon
src/components/AmortizationChart.tsx    rewritten — baseline overlay
src/components/ScheduleTable.tsx        rewritten — adds Extra column when active
```

No changes to `package.json`, `vite.config.ts`, `Dockerfile`, `Caddyfile`, or `index.html`. Same dependencies, same Railway config.

## Pulling it in

Quickest path is to replace your `src/` folder entirely:

```bash
cd your-repo
rm -rf src
# unzip the Phase 2 zip and copy its src/ into place
cp -r /path/to/loan-engine-phase2/src .
git add -A
git commit -m "Phase 2: simulator, promo rates, asset-switch defaults"
git push
```

Railway will rebuild on push and the new version goes live in ~60–90s.
