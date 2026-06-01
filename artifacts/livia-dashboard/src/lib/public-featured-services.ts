import type { PublicServiceRow } from "@/lib/public-booking-helpers";

/** Featured tiles in the 2-column beauty grid. */
export const MAX_BEAUTY_FEATURED_GRID = 4;

/** At or below this count, show every treatment in the grid (no hidden overflow list). */
export const SHOW_ALL_SERVICES_IN_GRID_MAX = 6;

/** Team cards before we show a swipe hint (includes the "Any" card). */
export const STAFF_STRIP_SCROLL_HINT_THRESHOLD = 5;

/** Top grid on /b — configured ids first, then sort order fill. */
export function pickFeaturedPublicServices(
  services: PublicServiceRow[],
  featuredIds: string[] | null | undefined,
): { featured: PublicServiceRow[]; rest: PublicServiceRow[] } {
  const sorted = [...services].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
  );

  if (sorted.length <= SHOW_ALL_SERVICES_IN_GRID_MAX) {
    return { featured: sorted, rest: [] };
  }

  const byId = new Map(sorted.map((s) => [s.id, s]));
  const featured: PublicServiceRow[] = [];
  const used = new Set<string>();

  for (const id of featuredIds ?? []) {
    if (featured.length >= MAX_BEAUTY_FEATURED_GRID) break;
    const row = byId.get(id);
    if (row && !used.has(row.id)) {
      featured.push(row);
      used.add(row.id);
    }
  }

  for (const row of sorted) {
    if (featured.length >= MAX_BEAUTY_FEATURED_GRID) break;
    if (!used.has(row.id)) {
      featured.push(row);
      used.add(row.id);
    }
  }

  const rest = sorted.filter((s) => !used.has(s.id));
  return { featured, rest };
}

export function featuredServicesHint(
  featuredCount: number,
  restCount: number,
  totalCount: number,
): string | null {
  if (restCount > 0) {
    const noun = restCount === 1 ? "treatment" : "treatments";
    return `${restCount} more ${noun} in the list below`;
  }
  if (totalCount > 2 && featuredCount > 2) {
    return "Scroll for more treatments";
  }
  return null;
}

export function staffStripScrollHint(staffCount: number, teamNoun: string): string | null {
  const cards = staffCount + 1;
  if (cards < STAFF_STRIP_SCROLL_HINT_THRESHOLD) return null;
  const label = teamNoun.toLowerCase();
  return `Swipe to see all ${staffCount} ${label}`;
}
