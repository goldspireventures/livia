import { useMemo } from "react";
import { useBusiness } from "@/lib/business-context";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatHeaderDate,
  formatTime,
  type FormatLocaleOptions,
} from "@/lib/format";

/** Date/time formatters bound to the active business locale + timezone. */
export function useFormat() {
  const { business } = useBusiness();
  const opts: FormatLocaleOptions = useMemo(
    () => ({
      locale: business?.locale ?? "en-IE",
      timeZone: business?.timezone ?? "Europe/Dublin",
    }),
    [business?.locale, business?.timezone],
  );

  return useMemo(
    () => ({
      opts,
      formatCurrency: (amountMinor: number, currency?: string) =>
        formatCurrency(amountMinor, currency ?? business?.currency ?? "EUR", opts),
      formatDate: (dateStr: string) => formatDate(dateStr, opts),
      formatTime: (dateStr: string) => formatTime(dateStr, opts),
      formatDateTime: (dateStr: string) => formatDateTime(dateStr, opts),
      formatHeaderDate: (d: Date) => formatHeaderDate(d, opts),
    }),
    [opts, business?.currency],
  );
}
