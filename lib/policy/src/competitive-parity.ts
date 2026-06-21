/**
 * Competitive parity program — capability matrix by vertical and org shape.
 * Research-backed; no third-party product names in exports or owner copy.
 */

import type { BusinessTier, BusinessVertical } from "./types";
import type { OrgShapeTemplate } from "./subvertical-profiles";

/** Generic incumbent categories (research taxonomy — not vendor names). */
export type IncumbentCategory =
  | "solo_scheduling" /** Generic appointment scheduler — deposits, forms, self-book */
  | "salon_suite" /** All-in-one salon/spa — POS, staff, inventory */
  | "marketplace_booking" /** Discovery marketplace + booking fee */
  | "fitness_studio" /** Class capacity, packs, memberships */
  | "clinical_aesthetics" /** Consent, clinical intake, compliance */
  | "horizontal_pos" /** Cross-vertical POS + appointments */
  | "consult_first_vendor"; /** Enquire → quote → book — event/creative trades */

export type ParityCapabilityId =
  | "online_self_book"
  | "deposit_at_book"
  | "intake_forms"
  | "automated_reminders"
  | "packages_memberships"
  | "waitlist_recovery"
  | "client_memory"
  | "dm_whatsapp_book"
  | "voice_receptionist"
  | "multi_staff_calendar"
  | "chair_rental_model"
  | "chain_rollup"
  | "class_capacity"
  | "consent_clinical"
  | "design_proof_workflow"
  | "pet_profile"
  | "vehicle_profile"
  | "consult_quote_book"
  | "csv_migration"
  | "api_migration"
  | "eu_gdpr_default";

export type ParityTier = "table_stakes" | "wedge" | "differentiator";

export type ParityCapability = {
  id: ParityCapabilityId;
  label: string;
  tier: ParityTier;
  /** What generic incumbents typically offer */
  incumbentBaseline: IncumbentCategory[];
  /** Livia target — must exceed baseline */
  liviaTarget: "match" | "exceed" | "own";
};

export const PARITY_CAPABILITIES: ParityCapability[] = [
  { id: "online_self_book", label: "Public self-book page", tier: "table_stakes", incumbentBaseline: ["solo_scheduling", "salon_suite", "marketplace_booking"], liviaTarget: "exceed" },
  { id: "deposit_at_book", label: "Deposit or prepay at book", tier: "table_stakes", incumbentBaseline: ["solo_scheduling", "salon_suite"], liviaTarget: "match" },
  { id: "intake_forms", label: "Pre-visit intake & consent", tier: "table_stakes", incumbentBaseline: ["solo_scheduling", "clinical_aesthetics"], liviaTarget: "exceed" },
  { id: "automated_reminders", label: "Confirmations & reminders", tier: "table_stakes", incumbentBaseline: ["solo_scheduling", "salon_suite", "fitness_studio"], liviaTarget: "match" },
  { id: "packages_memberships", label: "Packages & memberships", tier: "table_stakes", incumbentBaseline: ["solo_scheduling", "fitness_studio", "salon_suite"], liviaTarget: "match" },
  { id: "waitlist_recovery", label: "Waitlist & cancel fill", tier: "wedge", incumbentBaseline: ["salon_suite", "fitness_studio"], liviaTarget: "exceed" },
  { id: "client_memory", label: "Relationship memory across visits", tier: "wedge", incumbentBaseline: ["salon_suite"], liviaTarget: "own" },
  { id: "dm_whatsapp_book", label: "Book in DM / WhatsApp thread", tier: "differentiator", incumbentBaseline: [], liviaTarget: "own" },
  { id: "voice_receptionist", label: "Voice receptionist (Liv)", tier: "differentiator", incumbentBaseline: [], liviaTarget: "own" },
  { id: "multi_staff_calendar", label: "Multi-practitioner calendar", tier: "table_stakes", incumbentBaseline: ["solo_scheduling", "salon_suite"], liviaTarget: "match" },
  { id: "chair_rental_model", label: "Chair-rental host model", tier: "wedge", incumbentBaseline: [], liviaTarget: "own" },
  { id: "chain_rollup", label: "Multi-location rollup", tier: "wedge", incumbentBaseline: ["salon_suite"], liviaTarget: "exceed" },
  { id: "class_capacity", label: "Class capacity & waitlist", tier: "table_stakes", incumbentBaseline: ["fitness_studio"], liviaTarget: "match" },
  { id: "consent_clinical", label: "Clinical consent queue", tier: "table_stakes", incumbentBaseline: ["clinical_aesthetics"], liviaTarget: "match" },
  { id: "design_proof_workflow", label: "Design proof sign-off", tier: "table_stakes", incumbentBaseline: [], liviaTarget: "own" },
  { id: "pet_profile", label: "Pet profile & temperament", tier: "table_stakes", incumbentBaseline: ["salon_suite"], liviaTarget: "exceed" },
  { id: "vehicle_profile", label: "Vehicle continuity", tier: "table_stakes", incumbentBaseline: [], liviaTarget: "own" },
  { id: "consult_quote_book", label: "Enquire → quote → book", tier: "table_stakes", incumbentBaseline: ["consult_first_vendor"], liviaTarget: "exceed" },
  { id: "csv_migration", label: "CSV import (clients, menu, bookings)", tier: "table_stakes", incumbentBaseline: ["solo_scheduling"], liviaTarget: "exceed" },
  { id: "api_migration", label: "API / OAuth migration path", tier: "wedge", incumbentBaseline: ["salon_suite", "solo_scheduling"], liviaTarget: "match" },
  { id: "eu_gdpr_default", label: "EU residency & GDPR DSR", tier: "wedge", incumbentBaseline: [], liviaTarget: "own" },
];

/** Primary incumbent categories per vertical (research 2026). */
export const VERTICAL_INCUMBENT_CATEGORIES: Record<BusinessVertical, IncumbentCategory[]> = {
  hair: ["salon_suite", "solo_scheduling", "marketplace_booking", "horizontal_pos"],
  beauty: ["solo_scheduling", "salon_suite", "marketplace_booking"],
  wellness: ["solo_scheduling", "salon_suite", "fitness_studio"],
  "body-art": ["solo_scheduling", "consult_first_vendor"],
  fitness: ["fitness_studio", "solo_scheduling", "horizontal_pos"],
  medspa: ["clinical_aesthetics", "salon_suite", "solo_scheduling"],
  "allied-health": ["solo_scheduling", "clinical_aesthetics"],
  "pet-grooming": ["salon_suite", "solo_scheduling"],
  "automotive-detailing": ["solo_scheduling", "horizontal_pos"],
  "event-vendors": ["consult_first_vendor", "solo_scheduling"],
};

/** Required capabilities per vertical — must ship for competitive parity. */
export const VERTICAL_PARITY_REQUIRED: Record<BusinessVertical, ParityCapabilityId[]> = {
  hair: ["online_self_book", "deposit_at_book", "multi_staff_calendar", "automated_reminders", "client_memory", "csv_migration", "waitlist_recovery", "dm_whatsapp_book", "api_migration"],
  beauty: ["online_self_book", "deposit_at_book", "intake_forms", "multi_staff_calendar", "automated_reminders", "client_memory", "csv_migration", "waitlist_recovery", "dm_whatsapp_book", "api_migration"],
  wellness: ["online_self_book", "deposit_at_book", "packages_memberships", "automated_reminders", "client_memory", "csv_migration", "waitlist_recovery", "api_migration"],
  "body-art": ["online_self_book", "deposit_at_book", "design_proof_workflow", "intake_forms", "csv_migration", "client_memory", "api_migration"],
  fitness: ["online_self_book", "class_capacity", "packages_memberships", "waitlist_recovery", "automated_reminders", "csv_migration", "client_memory"],
  medspa: ["online_self_book", "deposit_at_book", "consent_clinical", "intake_forms", "automated_reminders", "csv_migration", "api_migration"],
  "allied-health": ["online_self_book", "intake_forms", "automated_reminders", "client_memory", "csv_migration", "api_migration"],
  "pet-grooming": ["online_self_book", "pet_profile", "automated_reminders", "csv_migration", "client_memory", "waitlist_recovery"],
  "automotive-detailing": ["online_self_book", "vehicle_profile", "deposit_at_book", "csv_migration", "automated_reminders", "client_memory"],
  "event-vendors": ["consult_quote_book", "online_self_book", "csv_migration", "dm_whatsapp_book", "api_migration"],
};

/** Org-shape adds capabilities beyond vertical baseline. */
export function parityCapabilitiesForOrg(
  vertical: BusinessVertical,
  orgShape: OrgShapeTemplate,
  tier?: BusinessTier,
): ParityCapabilityId[] {
  const base = [...VERTICAL_PARITY_REQUIRED[vertical]];
  if (orgShape === "chair_rental" || tier === "chair-host") {
    if (!base.includes("chair_rental_model")) base.push("chair_rental_model");
  }
  if (orgShape === "multi_site" || tier === "chain" || tier === "mid-chain" || tier === "franchise") {
    if (!base.includes("chain_rollup")) base.push("chain_rollup");
  }
  if (orgShape === "solo" && !base.includes("voice_receptionist")) {
    base.push("voice_receptionist");
  }
  base.push("eu_gdpr_default", "api_migration");
  return [...new Set(base)];
}

export type ParityGap = {
  capabilityId: ParityCapabilityId;
  label: string;
  tier: ParityTier;
  status: "shipped" | "partial" | "planned";
};

/** Engineering status snapshot — update when capabilities ship. */
const CAPABILITY_SHIP_STATUS: Partial<Record<ParityCapabilityId, "shipped" | "partial" | "planned">> = {
  online_self_book: "shipped",
  deposit_at_book: "shipped",
  intake_forms: "shipped",
  automated_reminders: "shipped",
  packages_memberships: "shipped",
  waitlist_recovery: "shipped",
  client_memory: "shipped",
  dm_whatsapp_book: "shipped",
  voice_receptionist: "shipped",
  multi_staff_calendar: "shipped",
  chair_rental_model: "shipped",
  chain_rollup: "shipped",
  class_capacity: "shipped",
  consent_clinical: "shipped",
  design_proof_workflow: "shipped",
  pet_profile: "shipped",
  vehicle_profile: "shipped",
  consult_quote_book: "shipped",
  csv_migration: "shipped",
  api_migration: "shipped",
  eu_gdpr_default: "shipped",
};

export function parityGapsForVertical(
  vertical: BusinessVertical,
  orgShape: OrgShapeTemplate = "owner_plus_staff",
  tier?: BusinessTier,
): ParityGap[] {
  const required = parityCapabilitiesForOrg(vertical, orgShape, tier);
  return required.map((id) => {
    const cap = PARITY_CAPABILITIES.find((c) => c.id === id)!;
    return {
      capabilityId: id,
      label: cap.label,
      tier: cap.tier,
      status: CAPABILITY_SHIP_STATUS[id] ?? "planned",
    };
  });
}

export function parityScorePercent(gaps: ParityGap[]): number {
  if (gaps.length === 0) return 100;
  const weights = { shipped: 1, partial: 0.5, planned: 0 };
  const sum = gaps.reduce((acc, g) => acc + weights[g.status], 0);
  return Math.round((sum / gaps.length) * 100);
}

/** Top incumbent categories to beat for a vertical pitch (generic). */
export function incumbentCategoriesForVertical(vertical: BusinessVertical): IncumbentCategory[] {
  return VERTICAL_INCUMBENT_CATEGORIES[vertical];
}
