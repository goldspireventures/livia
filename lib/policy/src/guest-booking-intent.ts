export type GuestTimeOfDayPreference = "morning" | "afternoon" | "evening";

function formatDateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) return date.toISOString().slice(0, 10);
  return `${year}-${month}-${day}`;
}

function addCalendarDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

/** Parse morning / afternoon / evening from guest free text. */
export function parseGuestTimeOfDayPreference(text: string): GuestTimeOfDayPreference | null {
  const lower = text.toLowerCase();
  if (/\bevening\b|\btonight\b|\bafter work\b/.test(lower)) return "evening";
  if (/\bafternoon\b|\bafter lunch\b|\bafter noon\b/.test(lower)) return "afternoon";
  if (/\bmorning\b|\bbefore noon\b/.test(lower)) return "morning";
  return null;
}

/** Resolve YYYY-MM-DD from guest text; defaults to tomorrow when no day hint. */
export function resolveGuestBookingDateHint(
  text: string,
  options: { now?: Date; timezone?: string } = {},
): string {
  const timezone = options.timezone ?? "Europe/Dublin";
  const now = options.now ?? new Date();
  const today = formatDateInTimezone(now, timezone);

  if (/\btoday\b/i.test(text)) return today;
  if (/\btomorrow\b/i.test(text)) return addCalendarDays(today, 1);

  return addCalendarDays(today, 1);
}

export function localHourInTimezone(isoUtc: string, timezone: string): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  }).format(new Date(isoUtc));
  return parseInt(hour, 10);
}

export function slotMatchesTimeOfDay(
  startAtIso: string,
  timezone: string,
  preference: GuestTimeOfDayPreference,
): boolean {
  const hour = localHourInTimezone(startAtIso, timezone);
  if (preference === "morning") return hour < 12;
  if (preference === "afternoon") return hour >= 12 && hour < 17;
  return hour >= 17;
}

export function guestTimeOfDayLabel(preference: GuestTimeOfDayPreference): string {
  if (preference === "morning") return "morning";
  if (preference === "afternoon") return "afternoon";
  return "evening";
}

export function pickSlotForGuestPreference<T extends { startAt: string }>(
  slots: T[],
  preference: GuestTimeOfDayPreference | null,
  timezone: string,
): T | undefined {
  if (!preference) return slots[0];
  return slots.find((slot) => slotMatchesTimeOfDay(slot.startAt, timezone, preference));
}
