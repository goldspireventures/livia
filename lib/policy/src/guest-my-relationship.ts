/**
 * W6 `/my` — vertical relationship modules (what the guest sees per shop).
 */
import type { BusinessVertical } from "./types";
import { guestPublicVisitPrep } from "./guest-public-experience";

export type GuestMyModuleId =
  | "visit"
  | "message"
  | "rebook"
  | "package"
  | "proof"
  | "consent"
  | "memory"
  | "pet"
  | "vehicle"
  | "class_pack"
  | "care_plan"
  | "stylist";

export type GuestMyModuleDef = {
  id: GuestMyModuleId;
  label: string;
  description: string;
};

const MODULE: Record<GuestMyModuleId, GuestMyModuleDef> = {
  visit: {
    id: "visit",
    label: "Your visit",
    description: "Time, place, running late, prep",
  },
  message: {
    id: "message",
    label: "Message the studio",
    description: "Reach the team without a phone call",
  },
  rebook: {
    id: "rebook",
    label: "Book again",
    description: "Same service or your usual",
  },
  package: {
    id: "package",
    label: "Session pack",
    description: "Credits left and expiry",
  },
  proof: {
    id: "proof",
    label: "Design proof",
    description: "Approve or request changes",
  },
  consent: {
    id: "consent",
    label: "Forms & consent",
    description: "Intake and signatures",
  },
  memory: {
    id: "memory",
    label: "What they remember",
    description: "Your preferences on file",
  },
  pet: {
    id: "pet",
    label: "Your pet",
    description: "Grooming notes and temperament",
  },
  vehicle: {
    id: "vehicle",
    label: "Your vehicle",
    description: "Plate, colour, and service history",
  },
  class_pack: {
    id: "class_pack",
    label: "Class & PT packs",
    description: "Sessions remaining",
  },
  care_plan: {
    id: "care_plan",
    label: "Care plan",
    description: "Sessions and rebook cadence",
  },
  stylist: {
    id: "stylist",
    label: "Your stylist",
    description: "Book with the same person",
  },
};

const BY_VERTICAL: Record<BusinessVertical, GuestMyModuleId[]> = {
  hair: ["visit", "message", "rebook", "stylist", "memory"],
  beauty: ["visit", "message", "rebook", "memory", "package"],
  wellness: ["visit", "message", "rebook", "package", "memory"],
  "body-art": ["visit", "message", "proof", "rebook", "memory"],
  medspa: ["visit", "message", "consent", "rebook", "memory"],
  "allied-health": ["visit", "message", "rebook", "care_plan", "memory"],
  fitness: ["visit", "message", "rebook", "class_pack"],
  "pet-grooming": ["visit", "message", "rebook", "pet"],
  "automotive-detailing": ["visit", "message", "rebook", "vehicle"],
  "event-vendors": ["message", "memory"],
};

export function guestMyModulesForVertical(vertical: string | null | undefined): GuestMyModuleDef[] {
  const key = (vertical ?? "beauty") as BusinessVertical;
  const ids = BY_VERTICAL[key] ?? BY_VERTICAL.beauty;
  return ids.map((id) => MODULE[id]);
}

export function guestMyVisitPrep(vertical: string | null | undefined): string[] {
  return guestPublicVisitPrep(vertical, null);
}

export function guestMyQuickActions(vertical: string | null | undefined): Array<{
  id: "running_late" | "message" | "rebook" | "directions";
  label: string;
}> {
  const v = vertical ?? "beauty";
  const base = [
    { id: "running_late" as const, label: "Running late" },
    { id: "message" as const, label: "Message studio" },
    { id: "rebook" as const, label: "Book again" },
  ];
  if (v === "wellness" || v === "medspa") {
    return [...base, { id: "directions" as const, label: "Arrival & parking" }];
  }
  return base;
}
