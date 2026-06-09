// URL state codec (FR-4.1).
//
// Every meaningful input lives in the query string so users can share a
// scenario by copying the URL. Encoding stays flat and human-inspectable
// — no base64, no compression — because the param list is small and the
// readability helps debugging.

import type { LoanInputs } from './types';
import type { LocaleId } from './locale';
import { LOCALES } from './locale';

export interface AppState extends LoanInputs {
  locale: LocaleId;
}

const KEYS = {
  locale: 'loc',
  assetType: 't',
  condition: 'c',
  assetValue: 'v',
  downPayment: 'd',
  termYears: 'ty',
  termMonths: 'tm',
  apr: 'r',
} as const;

export function encodeState(state: AppState): string {
  const params = new URLSearchParams();
  params.set(KEYS.locale, state.locale);
  params.set(KEYS.assetType, state.assetType);
  params.set(KEYS.condition, state.condition);
  params.set(KEYS.assetValue, String(round(state.assetValue, 2)));
  params.set(KEYS.downPayment, String(round(state.downPayment, 2)));
  params.set(KEYS.termYears, String(state.termYears));
  params.set(KEYS.termMonths, String(state.termMonths));
  params.set(KEYS.apr, String(round(state.apr, 3)));
  return params.toString();
}

export function decodeState(search: string): Partial<AppState> {
  const params = new URLSearchParams(search);
  const out: Partial<AppState> = {};

  const locale = params.get(KEYS.locale);
  if (locale && locale in LOCALES) out.locale = locale as LocaleId;

  const assetType = params.get(KEYS.assetType);
  if (assetType === 'home' || assetType === 'car') out.assetType = assetType;

  const condition = params.get(KEYS.condition);
  if (condition === 'new' || condition === 'used') out.condition = condition;

  const v = numParam(params, KEYS.assetValue);
  if (v !== null) out.assetValue = v;
  const d = numParam(params, KEYS.downPayment);
  if (d !== null) out.downPayment = d;
  const ty = numParam(params, KEYS.termYears);
  if (ty !== null) out.termYears = Math.max(0, Math.floor(ty));
  const tm = numParam(params, KEYS.termMonths);
  if (tm !== null) out.termMonths = Math.max(0, Math.min(11, Math.floor(tm)));
  const r = numParam(params, KEYS.apr);
  if (r !== null) out.apr = r;

  return out;
}

function numParam(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}
