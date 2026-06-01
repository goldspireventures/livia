/** Owner briefing copy — avoid repeating shop name and header stats. */

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
