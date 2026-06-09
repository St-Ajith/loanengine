// URL state codec (FR-4.1).
//
// Every meaningful input lives in the query string so users can share a
// scenario by copying the URL. Encoding stays flat and human-inspectable.

import type { LoanInputs, Overpayment } from './types';
import { LOCALES, type LocaleId } from './locale';

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
  apr: 'r',         // flat APR or post-promo APR
  promoApr: 'pr',   // optional, when tiered
  promoMonths: 'pm', // optional, when tiered
  overpayments: 'op',
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

  if (state.rateProfile.kind === 'flat') {
    params.set(KEYS.apr, String(round(state.rateProfile.apr, 3)));
  } else {
    params.set(KEYS.apr, String(round(state.rateProfile.postApr, 3)));
    params.set(KEYS.promoApr, String(round(state.rateProfile.promoApr, 3)));
    params.set(KEYS.promoMonths, String(state.rateProfile.promoMonths));
  }

  if (state.overpayments.length > 0) {
    params.set(KEYS.overpayments, encodeOverpayments(state.overpayments));
  }

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

  const apr = numParam(params, KEYS.apr);
  const promoApr = numParam(params, KEYS.promoApr);
  const promoMonths = numParam(params, KEYS.promoMonths);
  if (apr !== null) {
    if (promoApr !== null && promoMonths !== null && promoMonths > 0) {
      out.rateProfile = {
        kind: 'tiered',
        promoApr,
        promoMonths: Math.floor(promoMonths),
        postApr: apr,
      };
    } else {
      out.rateProfile = { kind: 'flat', apr };
    }
  }

  const opString = params.get(KEYS.overpayments);
  if (opString) {
    out.overpayments = decodeOverpayments(opString);
  }

  return out;
}

/**
 * Overpayment encoding (compact):
 *   recurring: "r:amount:startMonth" or "r:amount:startMonth:endMonth"
 *   lump:      "l:amount:month"
 *   multiple separated by "|"
 */
function encodeOverpayments(ops: Overpayment[]): string {
  return ops
    .map((op) => {
      if (op.kind === 'lump') return `l:${round(op.amount, 2)}:${op.month}`;
      const tail = op.endMonth !== undefined ? `:${op.endMonth}` : '';
      return `r:${round(op.amount, 2)}:${op.startMonth}${tail}`;
    })
    .join('|');
}

function decodeOverpayments(raw: string): Overpayment[] {
  return raw
    .split('|')
    .map((seg) => parseOverpayment(seg))
    .filter((op): op is Overpayment => op !== null);
}

function parseOverpayment(seg: string): Overpayment | null {
  const parts = seg.split(':');
  if (parts.length < 3) return null;
  const [kind, amountStr, monthStr, endStr] = parts;
  const amount = Number(amountStr);
  const month = Number(monthStr);
  if (!Number.isFinite(amount) || !Number.isFinite(month) || amount <= 0) return null;
  if (kind === 'l') return { kind: 'lump', amount, month: Math.floor(month) };
  if (kind === 'r') {
    const op: Overpayment = { kind: 'recurring', amount, startMonth: Math.floor(month) };
    if (endStr !== undefined) {
      const end = Number(endStr);
      if (Number.isFinite(end)) op.endMonth = Math.floor(end);
    }
    return op;
  }
  return null;
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
