/**
 * Platform resilience — side-effect isolation, kill switches, degradation modes.
 * Core tenant operations (bookings, proofs, payments) must succeed even when
 * notifications, push, or workflows are down.
 *
 * @see docs/engineering/COMPOSABLE-EVOLUTION.md Ring 3 — live ops must not block Ring 1.
 */

/** Non-critical subsystems that fan out from domain state changes. */
export type SideEffectSubsystem =
  | "notifications"
  | "push"
  | "workflows"
  | "messaging_outbound"
  | "messaging_inbound";

export type SideEffectMode = "full" | "in_app_only" | "disabled";

export const SIDE_EFFECT_CIRCUIT_DEFAULTS = {
  /** Consecutive failures before circuit opens. */
  failureThreshold: 5,
  /** Ms to keep circuit open before half-open probe. */
  cooldownMs: 30_000,
  /** Rolling window for failure counting. */
  windowMs: 60_000,
} as const;

export function resolveSideEffectMode(
  env: Record<string, string | undefined> = process.env,
): SideEffectMode {
  const raw = (
    env.LIVIA_SIDE_EFFECTS_MODE ??
    (env.LIVIA_NOTIFICATIONS_DISABLED === "true" ? "disabled" : undefined)
  )
    ?.trim()
    .toLowerCase();

  if (raw === "disabled" || raw === "off" || raw === "none") return "disabled";
  if (raw === "in_app_only" || raw === "in-app-only" || raw === "inapp") return "in_app_only";
  return "full";
}

export function isSubsystemEnabled(
  subsystem: SideEffectSubsystem,
  mode: SideEffectMode = resolveSideEffectMode(),
): boolean {
  if (mode === "disabled") return false;
  if (mode === "in_app_only") {
    return subsystem === "notifications";
  }
  return true;
}

/**
 * Blast-radius rules (engineering contract):
 * - Side effects never throw into request handlers.
 * - Policy resolution errors are logged and skipped — DB commit already happened.
 * - Circuit opens per subsystem, not globally — push can fail while in-app works.
 * - Tenant queries stay scoped by businessId — one shop cannot read another's rows.
 * - Kill switch env vars affect delivery only, never booking/proof/payment writes.
 */
export const PLATFORM_RESILIENCE_CONTRACT = {
  sideEffectsAreNonBlocking: true,
  circuitPerSubsystem: true,
  tenantScopedData: true,
  killSwitchAffectsDeliveryOnly: true,
  /** Messages land in thread before channel send is attempted. */
  conversationalPersistBeforeDeliver: true,
} as const;
