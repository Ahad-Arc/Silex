// ─── Currency registry ────────────────────────────────────────────────────────
// Single source of truth for all supported currencies.
// `locale` is used by Intl.NumberFormat to produce correct digit grouping.
// `symbol` is the display prefix shown in the UI and PDF.

export interface CurrencyDef {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  /** Decimal places to display (most currencies: 2, JPY/IDR: 0, KWD/OMR/BHD: 3) */
  decimals: number;
}

export const CURRENCIES: CurrencyDef[] = [
  // ── Major global ──────────────────────────────────────────────────────────
  { code: "USD", symbol: "$",  name: "US Dollar",          locale: "en-US",  decimals: 2 },
  { code: "EUR", symbol: "€",  name: "Euro",               locale: "de-DE",  decimals: 2 },
  { code: "GBP", symbol: "£",  name: "British Pound",      locale: "en-GB",  decimals: 2 },
  { code: "CAD", symbol: "CA$",name: "Canadian Dollar",    locale: "en-CA",  decimals: 2 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar",  locale: "en-AU",  decimals: 2 },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar",   locale: "en-SG",  decimals: 2 },
  { code: "HKD", symbol: "HK$",name: "Hong Kong Dollar",   locale: "zh-HK",  decimals: 2 },
  { code: "JPY", symbol: "¥",  name: "Japanese Yen",       locale: "ja-JP",  decimals: 0 },
  { code: "CNY", symbol: "¥",  name: "Chinese Yuan",       locale: "zh-CN",  decimals: 2 },

  // ── South / Southeast Asia ────────────────────────────────────────────────
  { code: "INR", symbol: "₹",  name: "Indian Rupee",       locale: "en-IN",  decimals: 2 },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit",  locale: "ms-MY",  decimals: 2 },
  { code: "THB", symbol: "฿",  name: "Thai Baht",          locale: "th-TH",  decimals: 2 },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah",  locale: "id-ID",  decimals: 0 },

  // ── Gulf / Middle East ────────────────────────────────────────────────────
  { code: "AED", symbol: "د.إ",name: "UAE Dirham",         locale: "ar-AE",  decimals: 2 },
  { code: "SAR", symbol: "﷼",  name: "Saudi Riyal",        locale: "ar-SA",  decimals: 2 },
  { code: "QAR", symbol: "﷼",  name: "Qatari Riyal",       locale: "ar-QA",  decimals: 2 },
  { code: "KWD", symbol: "KD", name: "Kuwaiti Dinar",      locale: "ar-KW",  decimals: 3 },
  { code: "OMR", symbol: "﷼",  name: "Omani Rial",         locale: "ar-OM",  decimals: 3 },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar",     locale: "ar-BH",  decimals: 3 },
];

// Fast lookup map: code → CurrencyDef
export const CURRENCY_MAP: Record<string, CurrencyDef> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c])
);

/** Returns the CurrencyDef for a code, falling back to USD if unknown. */
export function getCurrency(code: string): CurrencyDef {
  return CURRENCY_MAP[code] ?? CURRENCY_MAP["USD"];
}

/**
 * Format a numeric amount for display.
 *
 * Examples:
 *   formatCurrency(15950, "INR")  → "₹ 15,950.00"
 *   formatCurrency(15950, "USD")  → "$ 15,950.00"
 *   formatCurrency(15950, "JPY")  → "¥ 15,950"
 *   formatCurrency(15950, "KWD")  → "KD 15,950.000"
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  opts?: { compact?: boolean }
): string {
  const def = getCurrency(currencyCode);

  if (opts?.compact && Math.abs(amount) >= 1000) {
    // Compact form: ₹ 15.9K, $ 1.2M
    const [divisor, suffix] =
      Math.abs(amount) >= 1_000_000
        ? [1_000_000, "M"]
        : [1_000, "K"];
    const val = (amount / divisor).toFixed(1).replace(/\.0$/, "");
    return `${def.symbol} ${val}${suffix}`;
  }

  const formatted = new Intl.NumberFormat(def.locale, {
    minimumFractionDigits: def.decimals,
    maximumFractionDigits: def.decimals,
  }).format(amount);

  // Always render as "SYMBOL AMOUNT" with a thin space for readability
  return `${def.symbol}\u00A0${formatted}`;
}

/**
 * Format for PDF HTML — same as formatCurrency but returns a plain string
 * safe to embed in HTML (no JSX, no React).
 */
export function formatCurrencyHtml(amount: number, currencyCode: string): string {
  return formatCurrency(amount, currencyCode);
}

/** localStorage key for workspace default currency */
export const WORKSPACE_CURRENCY_KEY = "silex_workspace_currency";
