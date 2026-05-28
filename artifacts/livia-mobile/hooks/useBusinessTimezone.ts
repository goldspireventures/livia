import { useMemo } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  deviceTimeZone,
  formatLongDateNowInZone,
  formatShortDateInZone,
  formatTimeInZone,
  resolveBusinessTimeZone,
} from "@/lib/datetime";

/** Business IANA timezone + format helpers (ADR 0011 — no hardcoded locales). */
export function useBusinessTimezone() {
  const { currentBusiness } = useBusiness();
  const timeZone = useMemo(
    () => resolveBusinessTimeZone(currentBusiness),
    [currentBusiness?.timezone],
  );

  return {
    timeZone,
    formatTime: (iso: string) => formatTimeInZone(iso, timeZone),
    formatShortDate: (iso: string) => formatShortDateInZone(iso, timeZone),
    formatLongDateNow: (nowMs: number = Date.now()) =>
      formatLongDateNowInZone(nowMs, timeZone),
    deviceTimeZone,
  };
}
