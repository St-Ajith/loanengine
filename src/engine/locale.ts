// Locale presets. Each locale carries currency formatting metadata and
// default input ranges that match the region's typical loan profile.
//
// Geo-IP auto-detection (FR-1.1) is deferred to Phase 3 — for now the
// header selector (FR-1.2) is the only entry point, and 'US' is the
// default until a user picks something else.

export type LocaleId = 'US' | 'EU' | 'UK' | 'IN' | 'NO';

export interface LocaleConfig {
  id: LocaleId;
  label: string;
  currency: string;
  /** Intl locale string used for number/currency formatting. */
  intlLocale: string;
  /** Sensible defaults so the calculator lands on a meaningful starting state. */
  defaults: {
    home: { value: number; downPct: number; apr: number; termYears: number };
    car: { value: number; downPct: number; apr: number; termYears: number };
  };
  /** Slider caps. Beyond these, users can still type a value — these just
   *  bound the slider for ergonomic dragging. */
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
      home: { value: 450_000, downPct: 20, apr: 6.8, termYears: 30 },
      car: { value: 38_000, downPct: 15, apr: 7.5, termYears: 5 },
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
      home: { value: 380_000, downPct: 20, apr: 4.2, termYears: 25 },
      car: { value: 32_000, downPct: 20, apr: 6.0, termYears: 5 },
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
      home: { value: 320_000, downPct: 15, apr: 5.2, termYears: 25 },
      car: { value: 25_000, downPct: 15, apr: 7.9, termYears: 5 },
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
      home: { value: 8_500_000, downPct: 20, apr: 8.5, termYears: 20 },
      car: { value: 1_200_000, downPct: 20, apr: 9.5, termYears: 5 },
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
      home: { value: 5_200_000, downPct: 15, apr: 5.9, termYears: 25 },
      car: { value: 480_000, downPct: 20, apr: 7.2, termYears: 5 },
    },
    caps: {
      home: { maxValue: 30_000_000, maxApr: 14, maxTermYears: 35 },
      car: { maxValue: 3_000_000, maxApr: 20, maxTermYears: 8 },
    },
  },
};

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
