/**
 * In-process circuit breaker for non-critical subsystems.
 * Limits blast radius when notifications/push/workflows error or slow down.
 * Ops can also set LIVIA_SIDE_EFFECTS_MODE=disabled for a global kill switch.
 */
import {
  SIDE_EFFECT_CIRCUIT_DEFAULTS,
  type SideEffectSubsystem,
} from "@workspace/policy";
import { logger } from "./logger";

type CircuitState = "closed" | "open" | "half_open";

type SubsystemCircuit = {
  state: CircuitState;
  failures: number[];
  openedAt: number | null;
  lastError: string | null;
};

const circuits = new Map<SideEffectSubsystem, SubsystemCircuit>();

function getCircuit(subsystem: SideEffectSubsystem): SubsystemCircuit {
  let c = circuits.get(subsystem);
  if (!c) {
    c = { state: "closed", failures: [], openedAt: null, lastError: null };
    circuits.set(subsystem, c);
  }
  return c;
}

function pruneFailures(c: SubsystemCircuit, now: number): void {
  const cutoff = now - SIDE_EFFECT_CIRCUIT_DEFAULTS.windowMs;
  c.failures = c.failures.filter((t) => t >= cutoff);
}

export function isSubsystemCircuitOpen(subsystem: SideEffectSubsystem): boolean {
  const c = getCircuit(subsystem);
  const now = Date.now();

  if (c.state === "open" && c.openedAt != null) {
    if (now - c.openedAt >= SIDE_EFFECT_CIRCUIT_DEFAULTS.cooldownMs) {
      c.state = "half_open";
      return false;
    }
    return true;
  }

  return false;
}

export function recordSubsystemSuccess(subsystem: SideEffectSubsystem): void {
  const c = getCircuit(subsystem);
  c.state = "closed";
  c.failures = [];
  c.openedAt = null;
  c.lastError = null;
}

export function recordSubsystemFailure(subsystem: SideEffectSubsystem, err: unknown): void {
  const c = getCircuit(subsystem);
  const now = Date.now();
  pruneFailures(c, now);
  c.failures.push(now);
  c.lastError = err instanceof Error ? err.message : String(err);

  if (
    c.state !== "open" &&
    c.failures.length >= SIDE_EFFECT_CIRCUIT_DEFAULTS.failureThreshold
  ) {
    c.state = "open";
    c.openedAt = now;
    logger.error(
      {
        subsystem,
        failures: c.failures.length,
        cooldownMs: SIDE_EFFECT_CIRCUIT_DEFAULTS.cooldownMs,
        lastError: c.lastError,
      },
      "subsystem circuit opened — side effects paused for cooldown",
    );
  }
}

export function getSubsystemCircuitHealth(): Record<
  SideEffectSubsystem,
  { state: CircuitState; recentFailures: number; lastError: string | null }
> {
  const now = Date.now();
  const out = {} as Record<
    SideEffectSubsystem,
    { state: CircuitState; recentFailures: number; lastError: string | null }
  >;

  for (const subsystem of [
    "notifications",
    "push",
    "workflows",
    "messaging_outbound",
    "messaging_inbound",
  ] as const) {
    const c = getCircuit(subsystem);
    pruneFailures(c, now);
    out[subsystem] = {
      state: c.state,
      recentFailures: c.failures.length,
      lastError: c.lastError,
    };
  }

  return out;
}

/** Reset circuits — tests and ops recovery. */
export function resetSubsystemCircuits(): void {
  circuits.clear();
}
