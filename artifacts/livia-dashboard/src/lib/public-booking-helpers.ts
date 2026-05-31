/** B2C public booking — vertical copy, grouping, and medspa/consult helpers. */

import { getVerticalPlaybook, type BusinessVertical } from "@workspace/policy";

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
};

export type PublicStaffRow = {
  id: string;
  displayName: string;
  bio?: string | null;
  photoUrl?: string | null;
  color?: string | null;
};

export type PublicPolicyTrust = {
  cancelWindowHours: number;
  lateGraceMinutes: number;
  depositRequired: boolean;
};

/** Fresha-style barber/salon vs Acuity-style beauty catalog. */
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
    return "Treatments";
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
  if (vertical === "wellness" || vertical === "fitness") return "Sessions";
  return CATEGORY_FALLBACK;
}

export function groupServicesByCategory(
  services: PublicServiceRow[],
  vertical?: string | null,
): Array<{ category: string; services: PublicServiceRow[] }> {
  const sorted = [...services].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
  );
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

/** Short “before you book” copy — Acuity-style care blocks per vertical. */
export function publicCareNotes(vertical?: string | null): string[] {
  switch (vertical) {
    case "beauty":
      return [
        "Patch tests may be required 24–48h before lash or tint services — we'll confirm by message.",
        "Arrive with clean lashes/nails and no heavy oils on the treatment area.",
      ];
    case "hair":
      return [
        "For colour appointments, bring reference photos if you have them.",
        "Running late? Use your visit link to let the team know — we'll do our best to fit you in.",
      ];
    case "medspa":
      return [
        "Consultations are required for first-time injectable treatments.",
        "Avoid blood thinners and alcohol 24h before certain procedures unless your clinician advises otherwise.",
      ];
    case "pet-grooming":
      return [
        "Tell us about temperament, matting, or medical needs in the notes step.",
        "Puppies and seniors may need shorter sessions — we'll confirm timing after you book.",
      ];
    case "body-art":
      return [
        "Consultations are free — session work may require a deposit to hold long slots.",
        "Come rested, fed, and hydrated; avoid alcohol before your session.",
      ];
    default:
      return [
        "You'll get a confirmation by email or SMS with everything you need for your visit.",
      ];
  }
}

export function guardSectionTitle(vertical?: string | null): string {
  switch (vertical) {
    case "pet-grooming":
      return "About your pet";
    case "allied-health":
      return "Clinical intake";
    case "automotive-detailing":
      return "Your vehicle";
    case "medspa":
      return "Treatment intake";
    case "fitness":
      return "Before your session";
    default:
      return "A few quick details";
  }
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
