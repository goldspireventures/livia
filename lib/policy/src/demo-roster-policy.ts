/**
 * Demo tenant roster — which Clerk sign-in roles exist per business shape.
 * Solo design-partner shops (e.g. Atelier Decor) get owner only; studio tiers get the full team.
 * @see artifacts/api-server/src/services/demo-business-roster.seed.ts
 */

export type DemoRosterTenantRole = "owner" | "manager" | "desk" | "staff";

export type DemoRosterSignals = {
  tier?: string | null;
};

const FULL_TEAM_ROSTER: DemoRosterTenantRole[] = ["owner", "manager", "desk", "staff"];

const MULTI_SEAT_TIERS = new Set([
  "studio",
  "chain",
  "franchise",
  "mid-chain",
  "chair-host",
  "white-label",
]);

/** Clerk + gateway roster roles provisioned and shown for this demo tenant. */
export function listDemoTenantRosterRoles(signals: DemoRosterSignals): DemoRosterTenantRole[] {
  const tier = (signals.tier ?? "solo").toLowerCase();
  if (MULTI_SEAT_TIERS.has(tier)) return [...FULL_TEAM_ROSTER];
  return ["owner"];
}
