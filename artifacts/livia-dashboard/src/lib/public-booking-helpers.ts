/** B2C public booking — vertical copy, grouping, and medspa/consult helpers. */

import {
  getVerticalPlaybook,
  groupAlliedServicesByKind,
  guestPublicCareNotes as guestPublicCareNotesFromPolicy,
  guestPublicGuardSectionTitle,
  type BusinessVertical,
} from "@workspace/policy";

export type PublicServiceRow = {
  id: string;
  name: string;
  description: string | null;
  category?: string | null;
  durationMinutes: number;
  priceMinor: number;
  currency: string;
  imageUrl?: string | null;
  sortOrder?: number;
  serviceKind?: string | null;
  rebookIntervalDays?: number | null;
  requiresPatchTest?: boolean;
};

export type PublicStaffRow = {
  id: string;
  displayName: string;
  bio?: string | null;
  photoUrl?: string | null;
  color?: string | null;
};

export type PublicSlotRow = {
  startAt: string;
  endAt?: string;
  available?: boolean;
  staffId?: string | null;
};

/** One pickable time per clock label — API dedupes too; belt for older responses. */
export function dedupePublicSlotsByStartAt<T extends PublicSlotRow>(slots: T[]): T[] {
  const byStart = new Map<string, T>();
  for (const slot of slots) {
    const prev = byStart.get(slot.startAt);
    if (!prev) {
      byStart.set(slot.startAt, slot);
      continue;
    }
    if (slot.available !== false && prev.available === false) {
      byStart.set(slot.startAt, slot);
    }
  }
  return [...byStart.values()].sort((a, b) => a.startAt.localeCompare(b.startAt));
}

import { parseUserFacingError } from "@/lib/user-facing-errors";

/** Strip HTTP status prefixes and support ref ids from generated API client errors. */
export function parsePublicApiError(
  err: unknown,
  fallback = "Something went wrong — please try again.",
): string {
  return parseUserFacingError(err, fallback);
}

export type PublicSlotDayPart = "morning" | "afternoon" | "evening";

export function publicSlotDayPart(startAt: string, timeZone?: string): PublicSlotDayPart {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: timeZone ?? "Europe/Dublin",
    }).format(new Date(startAt)),
  );
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const DAY_PART_LABELS: Record<PublicSlotDayPart, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export function groupPublicSlotsByDayPart<T extends PublicSlotRow>(
  slots: T[],
  timeZone?: string,
): Array<{ part: PublicSlotDayPart; label: string; slots: T[] }> {
  const order: PublicSlotDayPart[] = ["morning", "afternoon", "evening"];
  const buckets = new Map<PublicSlotDayPart, T[]>();
  for (const slot of slots) {
    const part = publicSlotDayPart(slot.startAt, timeZone);
    const list = buckets.get(part) ?? [];
    list.push(slot);
    buckets.set(part, list);
  }
  return order
    .filter((part) => (buckets.get(part)?.length ?? 0) > 0)
    .map((part) => ({
      part,
      label: DAY_PART_LABELS[part],
      slots: buckets.get(part) ?? [],
    }));
}

export type PublicPolicyTrust = {
  cancelWindowHours: number;
  lateGraceMinutes: number;
  depositRequired: boolean;
  depositPercent?: number;
};

/** Category A barber/salon catalog vs Category B beauty treatment catalog layout. */
export type PublicBookingLayout = "staff-forward" | "catalog";

export function publicBookingLayout(vertical?: string | null): PublicBookingLayout {
  switch (vertical) {
    case "hair":
    case "beauty":
    case "body-art":
      return "staff-forward";
    default:
      return "catalog";
  }
}

export function verticalPublicCta(vertical?: string | null): string {
  if (!vertical) return "Book now";
  try {
    return getVerticalPlaybook(vertical as BusinessVertical).publicCta;
  } catch {
    return "Book now";
  }
}

/** Hero pill CTA — screen card w5.public.book.mobile vertical_overrides. */
export function verticalHeroCta(vertical?: string | null, businessCta?: string | null): string {
  if (businessCta?.trim()) return businessCta.trim();
  switch (vertical) {
    case "body-art":
      return "Request a consult";
    case "medspa":
      return "Book treatment";
    case "fitness":
      return "Book class";
    default:
      return verticalPublicCta(vertical);
  }
}

const CATEGORY_FALLBACK = "Services";

function humanizeCategory(raw: string): string {
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Infer menu section when DB category is empty (demo + legacy rows). */
export function inferServiceCategory(name: string, vertical?: string | null): string {
  const n = name.toLowerCase();
  if (vertical === "pet-grooming") {
    if (n.includes("cat")) return "Cats";
    if (n.includes("puppy") || n.includes("dog")) return "Dogs";
    return "Grooming";
  }
  if (vertical === "medspa" || vertical === "allied-health") {
    if (n.includes("consult")) return "Consultations";
    if (n.includes("filler") || n.includes("botox") || n.includes("peel")) return "Injectables & peels";
    return "Treatments";
  }
  if (vertical === "beauty") {
    if (n.includes("lash") || n.includes("brow")) return "Lashes & brows";
    if (n.includes("nail") || n.includes("manicure") || n.includes("pedicure")) return "Nails";
    return "Services";
  }
  if (vertical === "hair") {
    if (n.includes("colour") || n.includes("color") || n.includes("balayage")) return "Colour";
    if (n.includes("beard") || n.includes("fade") || n.includes("trim") || n.includes("cut")) {
      return "Cuts & grooming";
    }
    if (n.includes("consult")) return "Consultations";
    return "Hair";
  }
  if (vertical === "body-art") {
    if (n.includes("consult")) return "Consultations";
    if (n.includes("tattoo") || n.includes("session") || n.includes("pierc")) return "Sessions";
    return "Sessions";
  }
  if (vertical === "wellness") {
    if (n.includes("couple")) return "Couples";
    if (n.includes("float") || n.includes("90")) return "Long sessions";
    if (n.includes("massage") || n.includes("min")) return "Massage";
    return "Sessions";
  }
  if (vertical === "fitness") return "Sessions";
  return CATEGORY_FALLBACK;
}

export function groupServicesByCategory(
  services: PublicServiceRow[],
  vertical?: string | null,
): Array<{ category: string; services: PublicServiceRow[] }> {
  const sorted = [...services].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
  );
  if (vertical === "allied-health") {
    return groupAlliedServicesByKind(sorted).map((g) => ({
      category: g.label,
      services: g.services,
    }));
  }
  const map = new Map<string, PublicServiceRow[]>();
  for (const svc of sorted) {
    const key = svc.category?.trim()
      ? humanizeCategory(svc.category.trim())
      : inferServiceCategory(svc.name, vertical);
    const list = map.get(key) ?? [];
    list.push(svc);
    map.set(key, list);
  }
  return [...map.entries()].map(([category, items]) => ({ category, services: items }));
}

/** Short “before you book” copy — policy hub `guest-public-experience.ts`. */
export function publicCareNotes(vertical?: string | null, category?: string | null): string[] {
  return guestPublicCareNotesFromPolicy(vertical, category);
}

export function guardSectionTitle(vertical?: string | null, category?: string | null): string {
  return guestPublicGuardSectionTitle(vertical, category);
}

export function formatPublicAddress(b: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  state?: string | null;
}): string | null {
  const cityLine = [b.city, b.state, b.postalCode].filter(Boolean).join(" ");
  const parts = [b.addressLine1, b.addressLine2, cityLine || null].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function guessMedspaProcedureCode(
  serviceName: string,
  procedures: { code: string; label: string }[],
): string {
  if (!procedures.length) return "";
  const n = serviceName.toLowerCase();
  const byCode = (code: string) => procedures.find((p) => p.code === code)?.code;
  if (n.includes("filler")) return byCode("dermal-filler") ?? procedures[0]!.code;
  if (n.includes("peel")) return byCode("chemical-peel-light") ?? procedures[0]!.code;
  if (n.includes("botox") && !n.includes("consult")) {
    return byCode("botox-consult") ?? procedures[0]!.code;
  }
  if (n.includes("consult")) {
    return procedures.find((p) => p.code.includes("consult"))?.code ?? procedures[0]!.code;
  }
  return procedures.find((p) => !p.code.includes("consult"))?.code ?? procedures[0]!.code;
}

/** Body-art: free consult services — deposit messaging on sessions applies later. */
export function isConsultOnlyService(
  name: string,
  priceMinor: number,
  vertical?: string | null,
): boolean {
  if (vertical !== "body-art") return false;
  const n = name.toLowerCase();
  return priceMinor === 0 || n.includes("consult");
}

export function consultServiceBadge(vertical?: string | null): string | null {
  if (vertical !== "body-art") return null;
  return "Consultation — deposit may apply for session work";
}

/** Per-service CTA on /b — consult vs paid session (body-art uses vertical default only as fallback). */
export function publicServiceBookCta(
  svc: PublicServiceRow,
  vertical?: string | null,
  businessCta?: string,
): string {
  const fallback = businessCta ?? verticalPublicCta(vertical);
  if (isConsultOnlyService(svc.name, svc.priceMinor, vertical)) {
    return vertical === "body-art" ? "Request a consult" : fallback;
  }
  if (vertical === "body-art") return "Book session";
  return fallback;
}
