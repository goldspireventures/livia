export type FormatLocaleOptions = {
  locale?: string;
  timeZone?: string;
};

function intlLocale(opts?: FormatLocaleOptions): string {
  return opts?.locale ?? "en-IE";
}

function intlTimeZone(opts?: FormatLocaleOptions): string | undefined {
  return opts?.timeZone;
}

export function formatCurrency(
  amountMinor: number,
  currency: string = "EUR",
  opts?: FormatLocaleOptions,
) {
  return new Intl.NumberFormat(intlLocale(opts), {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

export function formatDate(dateStr: string, opts?: FormatLocaleOptions) {
  return new Intl.DateTimeFormat(intlLocale(opts), {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: intlTimeZone(opts),
  }).format(new Date(dateStr));
}

export function formatTime(dateStr: string, opts?: FormatLocaleOptions) {
  return new Intl.DateTimeFormat(intlLocale(opts), {
    hour: "numeric",
    minute: "2-digit",
    timeZone: intlTimeZone(opts),
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string, opts?: FormatLocaleOptions) {
  return new Intl.DateTimeFormat(intlLocale(opts), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: intlTimeZone(opts),
  }).format(new Date(dateStr));
}

export function formatHeaderDate(d: Date, opts?: FormatLocaleOptions): string {
  return new Intl.DateTimeFormat(intlLocale(opts), {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: intlTimeZone(opts),
  }).format(d);
}

/** Visit hub hero — "Tuesday 2:30 PM" in business timezone. */
export function formatVisitHeroTime(dateStr: string, opts?: FormatLocaleOptions): string {
  return new Intl.DateTimeFormat(intlLocale(opts), {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: intlTimeZone(opts),
  }).format(new Date(dateStr));
}

/** Date chip — "Today" when visit is on the same calendar day (business TZ). */
export function visitDateChip(dateStr: string, opts?: FormatLocaleOptions): string {
  const tz = intlTimeZone(opts);
  const dayKey = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: tz,
    }).format(new Date(iso));
  if (dayKey(dateStr) === dayKey(new Date().toISOString())) return "Today";
  return formatDate(dateStr, opts);
}
