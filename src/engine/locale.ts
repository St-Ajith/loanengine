// Locale presets with mid-2026 reference rates per region.
//
// Rates sourced from public benchmarks (Freddie Mac PMMS, Bank of England,
// SSB Norway, ECB MIR, RBI / SBI, June 2026). They're defaults to seed the
// inputs with realistic figures — actual user rates depend on credit, LTV,
// and lender, so the slider always lets users dial in their own.

import type { AssetType, AssetCondition } from './types';

export type LocaleId = 'US' | 'EU' | 'UK' | 'IN' | 'NO';

export interface AssetDefaults {
  value: number;
  downPct: number;
  aprNew: number;
  aprUsed: number;
  termYears: number;
}

export interface LocaleConfig {
  id: LocaleId;
  label: string;
  currency: string;
  intlLocale: string;
  defaults: {
    home: AssetDefaults;
    car: AssetDefaults;
  };
  caps: {
    home: { maxValue: number; maxApr: number; maxTermYears: number };
    car: { maxValue: number; maxApr: number; maxTermYears: number };
  };
}

export const LOCALES: Record<LocaleId, LocaleConfig> = {
  US: {
    id: 'US',
    label: 'United States',
    currency: 'USD',
    intlLocale: 'en-US',
    defaults: {
      home: { value: 450_000, downPct: 20, aprNew: 6.5, aprUsed: 6.7, termYears: 30 },
      car: { value: 38_000, downPct: 15, aprNew: 6.8, aprUsed: 8.5, termYears: 5 },
    },
    caps: {
      home: { maxValue: 2_500_000, maxApr: 15, maxTermYears: 40 },
      car: { maxValue: 200_000, maxApr: 25, maxTermYears: 8 },
    },
  },
  EU: {
    id: 'EU',
    label: 'Eurozone',
    currency: 'EUR',
    intlLocale: 'de-DE',
    defaults: {
      home: { value: 380_000, downPct: 20, aprNew: 3.7, aprUsed: 3.8, termYears: 25 },
      car: { value: 32_000, downPct: 20, aprNew: 5.5, aprUsed: 7.0, termYears: 5 },
    },
    caps: {
      home: { maxValue: 2_000_000, maxApr: 12, maxTermYears: 35 },
      car: { maxValue: 150_000, maxApr: 20, maxTermYears: 8 },
    },
  },
  UK: {
    id: 'UK',
    label: 'United Kingdom',
    currency: 'GBP',
    intlLocale: 'en-GB',
    defaults: {
      home: { value: 320_000, downPct: 15, aprNew: 5.6, aprUsed: 5.7, termYears: 25 },
      car: { value: 25_000, downPct: 15, aprNew: 7.5, aprUsed: 9.0, termYears: 5 },
    },
    caps: {
      home: { maxValue: 2_000_000, maxApr: 14, maxTermYears: 35 },
      car: { maxValue: 150_000, maxApr: 22, maxTermYears: 7 },
    },
  },
  IN: {
    id: 'IN',
    label: 'India',
    currency: 'INR',
    intlLocale: 'en-IN',
    defaults: {
      home: { value: 8_500_000, downPct: 20, aprNew: 8.4, aprUsed: 8.6, termYears: 20 },
      car: { value: 1_200_000, downPct: 20, aprNew: 9.2, aprUsed: 11.5, termYears: 5 },
    },
    caps: {
      home: { maxValue: 100_000_000, maxApr: 18, maxTermYears: 30 },
      car: { maxValue: 10_000_000, maxApr: 22, maxTermYears: 8 },
    },
  },
  NO: {
    id: 'NO',
    label: 'Norway',
    currency: 'NOK',
    intlLocale: 'nb-NO',
    defaults: {
      home: { value: 5_200_000, downPct: 15, aprNew: 5.3, aprUsed: 5.4, termYears: 25 },
      car: { value: 480_000, downPct: 20, aprNew: 6.5, aprUsed: 8.0, termYears: 5 },
    },
    caps: {
      home: { maxValue: 30_000_000, maxApr: 14, maxTermYears: 35 },
      car: { maxValue: 3_000_000, maxApr: 20, maxTermYears: 8 },
    },
  },
};

/**
 * Convenience accessor — defaults for a (locale, asset, condition) triple.
 * Used when the user switches asset type or condition so the figures
 * stay sensible instead of carrying a million-kroner balance over to a car.
 */
export function defaultsFor(
  locale: LocaleConfig,
  assetType: AssetType,
  condition: AssetCondition,
): { value: number; downPayment: number; apr: number; termYears: number } {
  const d = locale.defaults[assetType];
  return {
    value: d.value,
    downPayment: Math.round(d.value * (d.downPct / 100)),
    apr: condition === 'new' ? d.aprNew : d.aprUsed,
    termYears: d.termYears,
  };
}

export function formatCurrency(value: number, locale: LocaleConfig, fractionDigits = 0): string {
  return new Intl.NumberFormat(locale.intlLocale, {
    style: 'currency',
    currency: locale.currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatNumber(value: number, locale: LocaleConfig, fractionDigits = 0): string {
  return new Intl.NumberFormat(locale.intlLocale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
