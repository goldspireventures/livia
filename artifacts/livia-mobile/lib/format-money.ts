/** Format minor currency units for display (matches web Intl usage). */
export function formatPriceMinor(currency: string, minor: number): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

/** List row — omit price when zero/unset. */
export function formatServicePriceLine(
  priceMinor: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (priceMinor == null || priceMinor <= 0) return "";
  return formatPriceMinor(currency ?? "EUR", priceMinor);
}
