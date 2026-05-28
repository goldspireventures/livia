import type { RitualNavItem } from "./persona-rituals";

export type NavSectionId = "today" | "people" | "business" | "account";

export const NAV_SECTION_LABELS: Record<NavSectionId, string> = {
  today: "Today",
  people: "People",
  business: "Business",
  account: "Account",
};

const HREF_SECTION: Record<string, NavSectionId> = {
  "/my-day": "today",
  "/dashboard": "today",
  "/chain": "today",
  "/inbox": "today",
  "/bookings": "today",
  "/toolkit": "today",
  "/customers": "people",
  "/staff": "people",
  "/rota": "people",
  "/classes": "people",
  "/host": "business",
  "/brands": "business",
  "/franchise": "business",
  "/medspa": "business",
  "/design-proofs": "business",
  "/day-packages": "business",
  "/premises": "business",
  "/audit": "account",
  "/lifecycle": "account",
  "/portal": "account",
  "/experience": "account",
  "/settings": "account",
};

export function sectionForNavItem(href: string): NavSectionId {
  return HREF_SECTION[href] ?? "account";
}

export function groupNavBySection(items: RitualNavItem[]): { id: NavSectionId; label: string; items: RitualNavItem[] }[] {
  const order: NavSectionId[] = ["today", "people", "business", "account"];
  const buckets = new Map<NavSectionId, RitualNavItem[]>();
  for (const id of order) buckets.set(id, []);
  for (const item of items) {
    const s = sectionForNavItem(item.href);
    buckets.get(s)!.push(item);
  }
  return order
    .map((id) => ({ id, label: NAV_SECTION_LABELS[id], items: buckets.get(id)! }))
    .filter((g) => g.items.length > 0);
}

/** Mobile bottom bar: first four ritual-ordered items + sheet for the rest */
export function splitMobileNav(items: RitualNavItem[]): {
  primary: RitualNavItem[];
  overflow: RitualNavItem[];
} {
  return {
    primary: items.slice(0, 4),
    overflow: items.slice(4),
  };
}
