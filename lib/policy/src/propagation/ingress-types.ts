/**
 * Propagation ingress taxonomy — every passenger through border control.
 * @see docs/engineering/PROPAGATION-PROGRAM.md
 */

/** Platform-level registration (compile-time / CI). */
export type PlatformIngressKind =
  | "vertical.manifest"
  | "capability.add"
  | "platform.release"
  | "copy.evolution";

/** Tenant-level registration (runtime resolve-time). */
export type TenantIngressKind =
  | "tenant.birth"
  | "tenant.mutation"
  | "tenant.plan_change";

/** Live domain activity (runtime event-time). */
export type DomainIngressKind =
  | "booking.lifecycle"
  | "guest.ingress"
  | "operator.action"
  | "support.ticket"
  | "liv.action";

export type PropagationIngressKind =
  | PlatformIngressKind
  | TenantIngressKind
  | DomainIngressKind;

/** Which clock handles clearance + fan-out. */
export type PropagationClock = "build" | "resolve" | "event";

export const INGRESS_CLOCK: Record<PropagationIngressKind, PropagationClock> = {
  "vertical.manifest": "build",
  "capability.add": "build",
  "platform.release": "build",
  "copy.evolution": "build",
  "tenant.birth": "resolve",
  "tenant.mutation": "resolve",
  "tenant.plan_change": "resolve",
  "booking.lifecycle": "event",
  "guest.ingress": "event",
  "operator.action": "event",
  "support.ticket": "event",
  "liv.action": "event",
};

export type PropagationReceipt = {
  ingress: PropagationIngressKind;
  vertical?: string;
  businessId?: string;
  cleared: boolean;
  fanOut: string[];
  at: string;
};
