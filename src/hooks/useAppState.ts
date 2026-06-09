// Two-way bridge between React state and the URL query string.

import { useCallback, useEffect, useRef, useState } from 'react';
import { type AppState, decodeState, encodeState } from '../engine/url-state';
import { LOCALES, defaultsFor } from '../engine/locale';

const DEFAULT_STATE: AppState = (() => {
  const locale = LOCALES.US;
  const d = defaultsFor(locale, 'home', 'new');
  return {
    locale: locale.id,
    assetType: 'home',
    condition: 'new',
    assetValue: d.value,
    downPayment: d.downPayment,
    termYears: d.termYears,
    termMonths: 0,
    rateProfile: { kind: 'flat', apr: d.apr },
    overpayments: [],
  };
})();

export function useAppState(): [AppState, (updates: Partial<AppState>) => void] {
  const [state, setState] = useState<AppState>(() => ({
    ...DEFAULT_STATE,
    ...decodeState(window.location.search),
  }));

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

  const update = useCallback((updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return [state, update];
}
