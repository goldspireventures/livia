/** Owner briefing copy — avoid repeating shop name and header stats. */

export type DayPeriod = "morning" | "afternoon" | "evening";

export function currentDayPeriod(date = new Date()): DayPeriod {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** Morning briefings are generated once — re-align greeting when owner opens Today later in the day. */
export function alignBriefingTimeOfDay(line: string, period: DayPeriod = currentDayPeriod()): string {
  const target = period === "morning" ? "morning" : period === "afternoon" ? "afternoon" : "evening";
  return line
    .replace(/\bGood morning\b/gi, `Good ${target}`)
    .replace(/\bthis morning\b/gi, `this ${target}`)
    .replace(/\bYour top priority this morning\b/gi, `Your top priority this ${target}`);
}

export function stripBusinessPrefix(line: string, businessName?: string | null): string {
  const trimmed = line.trim();
  if (!businessName?.trim()) return trimmed;
  const name = businessName.trim();
  const prefixes = [`${name} · `, `${name}: `, `${name} — `];
  for (const p of prefixes) {
    if (trimmed.startsWith(p)) return trimmed.slice(p.length).trim();
  }
  return trimmed;
}
