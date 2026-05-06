export function getTzOffsetMinutes(date: Date, timezone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });
    const parts = dtf.formatToParts(date);
    const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
    const m = offsetPart.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
    if (!m) return 0;
    const sign = m[1] === "+" ? 1 : -1;
    const hours = parseInt(m[2], 10);
    const mins = m[3] ? parseInt(m[3], 10) : 0;
    return sign * (hours * 60 + mins);
  } catch {
    return 0;
  }
}

export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  const utcGuessMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetMin = getTzOffsetMinutes(new Date(utcGuessMs), timezone);
  return new Date(utcGuessMs - offsetMin * 60_000);
}

export function dayOfWeekInTz(date: string, timezone: string): number {
  const [Y, M, D] = date.split("-").map(Number);
  const noonInTz = zonedDateTimeToUtc(Y, M, D, 12, 0, timezone);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(noonInTz);
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[weekday] ?? 0;
}

export function dayBoundsInTz(date: string, timezone: string): { start: Date; end: Date } {
  const [Y, M, D] = date.split("-").map(Number);
  const start = zonedDateTimeToUtc(Y, M, D, 0, 0, timezone);
  const nextCal = new Date(Date.UTC(Y, M - 1, D + 1));
  const end = zonedDateTimeToUtc(
    nextCal.getUTCFullYear(),
    nextCal.getUTCMonth() + 1,
    nextCal.getUTCDate(),
    0,
    0,
    timezone,
  );
  return { start, end };
}
