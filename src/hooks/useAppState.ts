// Two-way bridge between React state and the URL query string.
//
// The hook reads initial state from `location.search` on mount, then
// pushes every subsequent state change back to the URL via
// history.replaceState — replace, not push, so a 30-second tuning
// session doesn't litter the browser's back stack with 200 entries.

import { useEffect, useRef, useState } from 'react';
import { type AppState, decodeState, encodeState } from '../engine/url-state';
import { LOCALES } from '../engine/locale';

const DEFAULT_STATE: AppState = (() => {
  const locale = LOCALES.US;
  const d = locale.defaults.home;
  return {
    locale: locale.id,
    assetType: 'home',
    condition: 'new',
    assetValue: d.value,
    downPayment: d.value * (d.downPct / 100),
    termYears: d.termYears,
    termMonths: 0,
    apr: d.apr,
  };
})();

export function useAppState(): [AppState, (updates: Partial<AppState>) => void] {
  const [state, setState] = useState<AppState>(() => ({
    ...DEFAULT_STATE,
    ...decodeState(window.location.search),
  }));

  // Skip the first effect run — the URL is already the source of truth on mount.
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const query = encodeState(state);
    const newUrl = `${window.location.pathname}?${query}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }, [state]);

  const update = (updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return [state, update];
}
