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
    voiceOutcomeCapEurCents: 5000, // €50/mo cap
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
    ]),
  },
  studio: {
    id: "studio",
    name: "Studio",
    baseEurCentsPerMonth: 14900, // €149
    seatEurCentsPerMonth: 1500, // €15/seat
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
    ]),
  },
} as const;

export function planHasEntitlement(plan: ProductPlan, key: EntitlementKey): boolean {
  return plan.entitlements.has(key);
}

export function lookupPlan(id: string): ProductPlan | undefined {
  return PLAN_CATALOGUE[id];
}
