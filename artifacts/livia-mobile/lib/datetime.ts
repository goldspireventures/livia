/**
 * Formatting for booking surfaces — uses the device locale with an explicit
 * IANA timezone (business record), never a hardcoded `en-US`.
 */

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function resolveBusinessTimeZone(business?: { timezone?: string } | null): string {
  const tz = business?.timezone?.trim();
  if (tz) return tz;
  return deviceTimeZone();
}

export function formatTimeInZone(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}

/** Short weekday + date in zone (e.g. for booking cards). */
export function formatShortDateInZone(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  });
}

/** Date + time for audit rows and detail headers. */
export function formatDateTimeInZone(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}

/** Long “today” line in zone (e.g. My day header). */
export function formatLongDateNowInZone(nowMs: number, timeZone: string): string {
  return new Date(nowMs).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  });
}
