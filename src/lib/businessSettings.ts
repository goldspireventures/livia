import "server-only";

export function getTimezoneFromBusinessSettings(settings: unknown): string {
  if (settings && typeof settings === "object" && "timezone" in settings) {
    const tz = (settings as { timezone?: unknown }).timezone;
    if (typeof tz === "string" && tz.trim()) return tz.trim();
  }
  return "UTC";
}
