/**
 * @workspace/entitlements
 *
 * Feature gates + product compositions (per ADR 0018, pattern #6).
 *
 * Products (Solo, Studio, Chain, Chair-Host, white-label) are compositions
 * of meters + entitlements declared as data, not code. New products = new
 * rows. Not new sprints.
 *
 * Feature flags (`@workspace/db` feature_flags table) live alongside this:
 *   - feature flags = release toggles + permission flags + experiments + killswitches.
 *   - entitlements = "is this tenant allowed to use this capability under their plan?"
 *
 * They overlap intentionally — a feature can be flag-gated AND entitlement-gated.
 */
import { z } from "zod";

/** ---------- Entitlement keys ---------- */

export const entitlementKeySchema = z.enum([
  "voice_receptionist",
  "whatsapp_inbound",
  "whatsapp_outbound",
  "sms_outbound",
  "audit_log_owner_view",
  "audit_log_export",
  "peer_set_insights",
  "cross_tenant_intelligence_opt_in",
  "deposits",
  "stripe_connect_payouts",
  "apple_wallet_passes",
  "google_calendar_export",
  "phorest_migration_broker",
  "booksy_migration_broker",
  "csv_importer",
  "delegations_advanced",
  "multi_brand",
  "chair_rental",
  "vertical_pack_beauty",
  "vertical_pack_body_art",
  "vertical_pack_wellness",
  "vertical_pack_fitness",
  "vertical_pack_medspa",
  "vertical_pack_allied_health",
  "vertical_pack_pet_grooming",
  "vertical_pack_automotive_detailing",
  "vertical_pack_event_vendors",
  "event_operator_pack",
  "retail_pack",
  "consult_first_inbox",
  "quote_generator",
  "milestone_deposits",
  "event_prep_lifecycle",
  "class_booking",
  "tattoo_design_proof",
  "package_credits",
  "franchise_rollup",
  "locale_pack_nordic",
  "public_api_alpha",
  "payroll_export",
  "booking_continuity",
  "enterprise_audit_export",
  "enterprise_sso",
]);
export type EntitlementKey = z.infer<typeof entitlementKeySchema>;

/** ---------- Product composition (data-driven) ---------- */

export interface ProductPlan {
  /** Stable identifier; survives marketing renames. */
  id: string;
  /** Marketing name as published. */
  name: string;
  /** Per-business base price in EUR cents per month. */
  baseEurCentsPerMonth: number;
  /** Per-staff seat fee in EUR cents per month (null if not seat-priced). */
  seatEurCentsPerMonth: number | null;
  /** Outcome-share rate (0..1) for voice receptionist; 0 if not enabled. */
  voiceOutcomeShare: number;
  /** Cap on voice outcome share in EUR cents per month (per Bet 4 commitment). */
  voiceOutcomeCapEurCents: number | null;
  /** Entitlements granted by this plan. */
  entitlements: ReadonlySet<EntitlementKey>;
}

/**
 * The v1 plan catalogue. Per docs/business/pricing-and-packaging.md.
 * Chain + Host + Multi-brand land at v1.5; declared here as scaffolding only.
 */
export const PLAN_CATALOGUE: Record<string, ProductPlan> = {
  solo: {
    id: "solo",
    name: "Solo",
    baseEurCentsPerMonth: 7900, // €79
    seatEurCentsPerMonth: null,
    voiceOutcomeShare: 0.04,
    voiceOutcomeCapEurCents: 5000, // €50/mo digest cap (see PRICING-RECONCILIATION-2026-06-02.md)
    entitlements: new Set<EntitlementKey>([
      "voice_receptionist",
      "whatsapp_inbound",
      "whatsapp_outbound",
      "sms_outbound",
      "audit_log_owner_view",
      "audit_log_export",
      "deposits",
      "stripe_connect_payouts",
      "apple_wallet_passes",
      "google_calendar_export",
      "csv_importer",
      "phorest_migration_broker",
      "payroll_export",
      "booking_continuity",
    ]),
  },
  studio: {
    id: "studio",
    name: "Studio",
    baseEurCentsPerMonth: 14900, // €149
    seatEurCentsPerMonth: 1500, // €15/seat flat in Stripe v1; role ladder at v1.5
    voiceOutcomeShare: 0.04,
    voiceOutcomeCapEurCents: 15000, // €150/mo cap
    entitlements: new Set<EntitlementKey>([
      "voice_receptionist",
      "whatsapp_inbound",
      "whatsapp_outbound",
      "sms_outbound",
      "audit_log_owner_view",
      "audit_log_export",
      "deposits",
      "stripe_connect_payouts",
      "apple_wallet_passes",
      "google_calendar_export",
      "csv_importer",
      "phorest_migration_broker",
      "delegations_advanced",
      "payroll_export",
      "booking_continuity",
    ]),
  },
  /** 14-day self-serve trial — core ops without voice (upgrade to Solo/Studio for wedge). */
  trial: {
    id: "trial",
    name: "Trial",
    baseEurCentsPerMonth: 0,
    seatEurCentsPerMonth: null,
    voiceOutcomeShare: 0,
    voiceOutcomeCapEurCents: null,
    entitlements: new Set<EntitlementKey>([
      "whatsapp_inbound",
      "sms_outbound",
      "audit_log_owner_view",
      "audit_log_export",
      "csv_importer",
    ]),
  },
  /** Multi-shop — per-shop billing (RFC 0010). */
  chain: {
    id: "chain",
    name: "Chain",
    baseEurCentsPerMonth: 24900,
    seatEurCentsPerMonth: 1500,
    voiceOutcomeShare: 0.04,
    voiceOutcomeCapEurCents: null,
    entitlements: new Set<EntitlementKey>([
      "voice_receptionist",
      "whatsapp_inbound",
      "whatsapp_outbound",
      "sms_outbound",
      "audit_log_owner_view",
      "audit_log_export",
      "deposits",
      "stripe_connect_payouts",
      "delegations_advanced",
      "multi_brand",
      "payroll_export",
      "booking_continuity",
      "enterprise_audit_export",
      "enterprise_sso",
      "public_api_alpha",
    ]),
  },
  "chair-host": {
    id: "chair-host",
    name: "Host",
    baseEurCentsPerMonth: 9900,
    seatEurCentsPerMonth: 1900,
    voiceOutcomeShare: 0.04,
    voiceOutcomeCapEurCents: 10000,
    entitlements: new Set<EntitlementKey>([
      "voice_receptionist",
      "chair_rental",
      "sms_outbound",
      "audit_log_owner_view",
      "audit_log_export",
      "deposits",
      "stripe_connect_payouts",
    ]),
  },
  "mid-chain": {
    id: "mid-chain",
    name: "Mid-chain",
    baseEurCentsPerMonth: 24900,
    seatEurCentsPerMonth: 3900,
    voiceOutcomeShare: 0.04,
    voiceOutcomeCapEurCents: null,
    entitlements: new Set<EntitlementKey>([
      "voice_receptionist",
      "whatsapp_inbound",
      "whatsapp_outbound",
      "sms_outbound",
      "audit_log_owner_view",
      "audit_log_export",
      "deposits",
      "stripe_connect_payouts",
      "delegations_advanced",
      "multi_brand",
      "class_booking",
      "enterprise_audit_export",
      "enterprise_sso",
      "public_api_alpha",
      "payroll_export",
      "booking_continuity",
    ]),
  },
  franchise: {
    id: "franchise",
    name: "Franchise",
    baseEurCentsPerMonth: 19900,
    seatEurCentsPerMonth: 1500,
    voiceOutcomeShare: 0.04,
    voiceOutcomeCapEurCents: 10000,
    entitlements: new Set<EntitlementKey>([
      "voice_receptionist",
      "sms_outbound",
      "audit_log_owner_view",
      "audit_log_export",
      "franchise_rollup",
      "delegations_advanced",
      "enterprise_audit_export",
      "enterprise_sso",
      "public_api_alpha",
    ]),
  },
  "white-label": {
    id: "white-label",
    name: "Multi-brand",
    baseEurCentsPerMonth: 9900,
    seatEurCentsPerMonth: 1500,
    voiceOutcomeShare: 0.04,
    voiceOutcomeCapEurCents: 15000,
    entitlements: new Set<EntitlementKey>([
      "voice_receptionist",
      "whatsapp_inbound",
      "whatsapp_outbound",
      "sms_outbound",
      "audit_log_owner_view",
      "audit_log_export",
      "deposits",
      "stripe_connect_payouts",
      "delegations_advanced",
      "multi_brand",
    ]),
  },
} as const;

/** Plans customers can subscribe to via Stripe Billing in v1. */
export const SELF_SERVE_PLAN_IDS = ["solo", "studio"] as const;

/** Plans available in Stripe Checkout (Phase 10: Chain + Host). */
export const CHECKOUT_PLAN_IDS = [
  "solo",
  "studio",
  "chain",
  "mid-chain",
  "franchise",
  "chair-host",
  "white-label",
] as const;

/** Peer insights add-on — €49/mo per pricing-and-packaging.md */
export const PEER_INSIGHTS_ADDON_EUR_CENTS = 4900;

/** Event Operator pack — consult-first + quotes + milestone deposits. */
export const EVENT_OPERATOR_ADDON_EUR_CENTS = 4900;

/** Take-Home Retail — guest cart + owner catalogue across appointment verticals. */
export const RETAIL_PACK_ADDON_EUR_CENTS = 2900;

export * from "./addons";

/** F9 role-based seat rates (v1.5 target). Stripe v1 uses flat seatEurCentsPerMonth from catalogue. */
export const SEAT_ROLE_RATES_EUR_CENTS = {
  manager: 1500,
  seniorWithAdmin: 1200,
  staff: 800,
  receptionist: 1000,
  apprentice: 400,
} as const;

export function formatEurFromCents(cents: number): string {
  return `€${Math.round(cents / 100)}`;
}

/** Customer-facing voice cap line for a plan. */
export function voiceOutcomeCapLabel(plan: ProductPlan): string | null {
  if (plan.voiceOutcomeShare <= 0) return null;
  const pct = Math.round(plan.voiceOutcomeShare * 100);
  if (plan.voiceOutcomeCapEurCents == null) {
    return `${pct}% on voice-recovered bookings`;
  }
  return `${pct}% on voice-recovered bookings — capped at ${formatEurFromCents(plan.voiceOutcomeCapEurCents)}/mo in your digest`;
}

export function planHasEntitlement(plan: ProductPlan, key: EntitlementKey): boolean {
  return plan.entitlements.has(key);
}

export function tenantHasEntitlement(
  plan: ProductPlan,
  key: EntitlementKey,
  denylist: ReadonlySet<string> = new Set(),
): boolean {
  if (denylist.has(key)) return false;
  return planHasEntitlement(plan, key);
}

export function lookupPlan(id: string): ProductPlan | undefined {
  return PLAN_CATALOGUE[id];
}
