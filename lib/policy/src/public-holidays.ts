import type { JurisdictionCode } from "./types";

export type PublicHoliday = {
  date: string;
  name: string;
  /** Closed all day — no public slots. */
  closed: boolean;
};

/** Fixed-date + movable anchors for beta markets (extend annually). */
const FIXED: Partial<Record<JurisdictionCode, PublicHoliday[]>> = {
  IE: [
    { date: "2026-01-01", name: "New Year's Day", closed: true },
    { date: "2026-03-17", name: "St Patrick's Day", closed: true },
    { date: "2026-12-25", name: "Christmas Day", closed: true },
    { date: "2026-12-26", name: "St Stephen's Day", closed: true },
    { date: "2025-12-25", name: "Christmas Day", closed: true },
    { date: "2025-12-26", name: "St Stephen's Day", closed: true },
  ],
  GB: [
    { date: "2026-01-01", name: "New Year's Day", closed: true },
    { date: "2026-12-25", name: "Christmas Day", closed: true },
    { date: "2026-12-26", name: "Boxing Day", closed: true },
    { date: "2026-04-03", name: "Good Friday", closed: true },
    { date: "2026-04-06", name: "Easter Monday", closed: true },
    { date: "2026-05-04", name: "Early May bank holiday", closed: true },
    { date: "2026-05-25", name: "Spring bank holiday", closed: true },
    { date: "2026-08-31", name: "Summer bank holiday", closed: true },
  ],
  DE: [
    { date: "2026-01-01", name: "Neujahr", closed: true },
    { date: "2026-05-01", name: "Tag der Arbeit", closed: true },
    { date: "2026-10-03", name: "Tag der Deutschen Einheit", closed: true },
    { date: "2026-12-25", name: "1. Weihnachtstag", closed: true },
    { date: "2026-12-26", name: "2. Weihnachtstag", closed: true },
    { date: "2026-04-03", name: "Karfreitag", closed: true },
    { date: "2026-04-06", name: "Ostermontag", closed: true },
  ],
  FR: [
    { date: "2026-01-01", name: "Jour de l'an", closed: true },
    { date: "2026-05-01", name: "Fête du Travail", closed: true },
    { date: "2026-07-14", name: "Fête nationale", closed: true },
    { date: "2026-12-25", name: "Noël", closed: true },
    { date: "2026-04-06", name: "Lundi de Pâques", closed: true },
    { date: "2026-05-08", name: "Victoire 1945", closed: true },
    { date: "2026-11-11", name: "Armistice", closed: true },
  ],
  DK: [
    { date: "2026-01-01", name: "Nytårsdag", closed: true },
    { date: "2026-06-05", name: "Grundlovsdag", closed: true },
    { date: "2026-12-25", name: "Juledag", closed: true },
    { date: "2026-12-26", name: "2. juledag", closed: true },
    { date: "2026-04-02", name: "Skærtorsdag", closed: true },
    { date: "2026-04-03", name: "Langfredag", closed: true },
    { date: "2026-04-06", name: "2. påskedag", closed: true },
    { date: "2026-05-01", name: "Store bededag (obs.)", closed: true },
  ],
};

export function listPublicHolidays(jurisdiction: JurisdictionCode): PublicHoliday[] {
  return [...(FIXED[jurisdiction] ?? [])].sort((a, b) => a.date.localeCompare(b.date));
}

export function isPublicHolidayClosed(
  jurisdiction: JurisdictionCode,
  dateYmd: string,
): PublicHoliday | null {
  const hit = (FIXED[jurisdiction] ?? []).find((h) => h.date === dateYmd && h.closed);
  return hit ?? null;
}

export function upcomingPublicHolidays(
  jurisdiction: JurisdictionCode,
  fromYmd: string,
  limit = 4,
): PublicHoliday[] {
  return listPublicHolidays(jurisdiction)
    .filter((h) => h.date >= fromYmd)
    .slice(0, limit);
}
