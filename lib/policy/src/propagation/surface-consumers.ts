/**
 * Surface consumer registry — W4/W5/W6 routes declare what they consume.
 */
import { P0_PLATFORM_SURFACES, type PlatformSurfaceDef } from "../platform-surface-registry";

export type SurfaceConsumerDef = PlatformSurfaceDef & {
  consumesCapabilities: string[];
  policyModules: string[];
};

const SURFACE_CONSUMER_EXTENSIONS: Record<
  string,
  Pick<SurfaceConsumerDef, "consumesCapabilities" | "policyModules">
> = {
  "tenant.owner.dashboard": {
    consumesCapabilities: ["owner-today"],
    policyModules: ["vocabulary.ts", "booking-experience-copy.ts", "vertical-announcement.ts"],
  },
  "tenant.staff.my-day": {
    consumesCapabilities: ["owner-today", "bookings-list"],
    policyModules: ["vocabulary.ts", "booking-experience-copy.ts"],
  },
  "tenant.founder.chain": {
    consumesCapabilities: ["owner-today"],
    policyModules: ["vocabulary.ts", "vertical-announcement.ts"],
  },
  "tenant.inbox": {
    consumesCapabilities: ["inbox-continuity"],
    policyModules: ["booking-experience-copy.ts", "continuity-templates.ts"],
  },
  "tenant.settings": {
    consumesCapabilities: ["owner-today"],
    policyModules: ["tenant-experience.ts", "presentation-presets.ts"],
  },
  "tenant.bookings.list": {
    consumesCapabilities: ["bookings-list", "inbox-continuity"],
    policyModules: ["booking-experience-copy.ts", "vocabulary.ts", "presentation-surface.ts"],
  },
  "tenant.booking.new": {
    consumesCapabilities: ["bookings-list"],
    policyModules: ["booking-experience-copy.ts", "booking-guards.ts"],
  },
  "tenant.booking.detail": {
    consumesCapabilities: ["inbox-continuity"],
    policyModules: ["booking-experience-copy.ts", "continuity-templates.ts"],
  },
  "tenant.design-proofs": {
    consumesCapabilities: ["inbox-continuity"],
    policyModules: ["body-art-design-proof-program.ts", "booking-experience-copy.ts"],
  },
  "tenant.medspa.hub": {
    consumesCapabilities: ["owner-today", "inbox-continuity"],
    policyModules: ["vertical-announcement.ts", "booking-experience-copy.ts"],
  },
  "tenant.notifications": {
    consumesCapabilities: ["inbox-continuity"],
    policyModules: ["notification-policy.ts", "tenant-experience.ts"],
  },
  "tenant.founder.shops.mobile": {
    consumesCapabilities: ["owner-today"],
    policyModules: ["vocabulary.ts", "vertical-coverage.ts"],
  },
  "guest.public.book": {
    consumesCapabilities: ["public-storefront"],
    policyModules: [
      "guest-public-experience.ts",
      "public-book-layout.ts",
      "booking-guards.ts",
      "booking-experience-copy.ts",
    ],
  },
  "guest.public.proof": {
    consumesCapabilities: ["visit-token"],
    policyModules: ["body-art-design-proof-program.ts", "guest-hub-copy.ts"],
  },
  "public.visit": {
    consumesCapabilities: ["visit-token"],
    policyModules: ["guest-public-experience.ts", "guest-hub-copy.ts"],
  },
  "public.intake": {
    consumesCapabilities: ["public-storefront", "visit-token"],
    policyModules: ["booking-guards.ts", "guest-public-experience.ts"],
  },
  "public.deposit-pay": {
    consumesCapabilities: ["public-storefront"],
    policyModules: ["guest-public-experience.ts", "booking-experience-copy.ts"],
  },
  "guest.public.hub": {
    consumesCapabilities: ["guest-hub", "visit-token"],
    policyModules: ["guest-hub-copy.ts", "guest-my-relationship.ts"],
  },
  "gateway.onboarding": {
    consumesCapabilities: ["owner-today"],
    policyModules: ["vertical-onboarding.ts", "vertical-announcement.ts", "verticals.ts"],
  },
  "gateway.sign-in": {
    consumesCapabilities: ["owner-today"],
    policyModules: ["tenant-experience.ts"],
  },
  "gateway.legal-accept": {
    consumesCapabilities: ["owner-today"],
    policyModules: ["tenant-experience.ts"],
  },
  "gateway.demo.launcher": {
    consumesCapabilities: ["owner-today"],
    policyModules: ["vertical-coverage.ts", "wedge-demo-stories.ts"],
  },
  "gateway.demo.wedge": {
    consumesCapabilities: ["owner-today", "public-storefront"],
    policyModules: ["wedge-demo-stories.ts", "vertical-playbooks.ts"],
  },
};

export function getSurfaceConsumer(surfaceId: string): SurfaceConsumerDef | undefined {
  const base = P0_PLATFORM_SURFACES.find((s) => s.surfaceId === surfaceId);
  if (!base) return undefined;
  const ext = SURFACE_CONSUMER_EXTENSIONS[surfaceId];
  return {
    ...base,
    consumesCapabilities: ext?.consumesCapabilities ?? [],
    policyModules: ext?.policyModules ?? [],
  };
}

export function listSurfaceConsumers(): SurfaceConsumerDef[] {
  return P0_PLATFORM_SURFACES.map((s) => getSurfaceConsumer(s.surfaceId)!);
}

export function validateSurfaceConsumers(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = P0_PLATFORM_SURFACES.filter(
    (s) =>
      s.app === "dashboard" ||
      s.app === "mobile" ||
      (s.app === "public" && (s.surfaceId.startsWith("guest.") || s.surfaceId.startsWith("public."))),
  );

  for (const surface of required) {
    const consumer = getSurfaceConsumer(surface.surfaceId);
    if (!consumer) continue;
    if (!consumer.consumesCapabilities.length) {
      errors.push(`${surface.surfaceId}: missing consumesCapabilities`);
    }
    if (!consumer.policyModules.length) {
      errors.push(`${surface.surfaceId}: missing policyModules`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function surfacesConsumingCapability(capabilityId: string): string[] {
  return listSurfaceConsumers()
    .filter((s) => s.consumesCapabilities.includes(capabilityId))
    .map((s) => s.surfaceId);
}
