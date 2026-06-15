/**
 * Capability → consumer routing table.
 * Register a capability once; CI proves every consumer and copy key exists.
 */
import type { BusinessVertical } from "../types";
import { businessVerticalSchema } from "../types";
import { getVerticalAnnouncementPackage } from "../vertical-announcement";

export type CapabilityRoute = {
  id: string;
  label: string;
  /** Policy modules that own copy/rules for this capability. */
  policyModules: string[];
  /** Bundle keys surfaces read (tenant-experience / policy helpers). */
  bundleKeys: string[];
  /** Canonical platform surfaceIds (P0 registry). */
  surfaceIds: string[];
  /** Dashboard/mobile route patterns for parity audits. */
  routePatterns: string[];
};

const PLATFORM_DEFAULT_ROUTES: CapabilityRoute[] = [
  {
    id: "owner-today",
    label: "Owner today / briefing",
    policyModules: [
      "vocabulary.ts",
      "booking-experience-copy.ts",
      "owner-home-bookings.ts",
    ],
    bundleKeys: [
      "vocabulary.ownerTodayScheduleTitle",
      "vocabulary.ownerTodayLine",
      "announcement.readyCapabilities",
      "booking.pending",
    ],
    surfaceIds: ["tenant.owner.dashboard"],
    routePatterns: ["/dashboard", "/"],
  },
  {
    id: "inbox-continuity",
    label: "Inbox + booking continuity",
    policyModules: [
      "booking-experience-copy.ts",
      "continuity-templates.ts",
    ],
    bundleKeys: [
      "booking.experience.continuityPanelTitle",
      "booking.pending",
      "continuity.template",
    ],
    surfaceIds: ["tenant.inbox", "tenant.booking.detail"],
    routePatterns: ["/inbox", "/bookings/:id"],
  },
  {
    id: "public-storefront",
    label: "Guest storefront /b",
    policyModules: [
      "guest-public-experience.ts",
      "public-book-layout.ts",
      "booking-guards.ts",
    ],
    bundleKeys: ["guest.public.heroTitle", "guest.public.catalogTitle", "playbook.publicCta"],
    surfaceIds: ["guest.public.book"],
    routePatterns: ["/b/:slug"],
  },
  {
    id: "visit-token",
    label: "Visit token day-of",
    policyModules: ["guest-public-experience.ts", "guest-hub-copy.ts"],
    bundleKeys: ["guest.public.visitPrep", "guest.public.visitGreeting"],
    surfaceIds: ["public.visit"],
    routePatterns: ["/b/:slug/visit/:token", "/my/:slug/visit/:id"],
  },
  {
    id: "bookings-list",
    label: "Bookings / schedule list",
    policyModules: ["booking-experience-copy.ts", "vocabulary.ts"],
    bundleKeys: [
      "vocabulary.bookingsPageTitle",
      "booking.experience.listEmptyTitle",
      "booking.pending",
    ],
    surfaceIds: ["tenant.bookings.list"],
    routePatterns: ["/bookings"],
  },
  {
    id: "guest-hub",
    label: "Guest My Livia hub",
    policyModules: ["guest-hub-copy.ts", "guest-my-relationship.ts"],
    bundleKeys: ["guest.hub", "guest.my.modules"],
    surfaceIds: ["guest.public.hub"],
    routePatterns: ["/my", "/my/:slug"],
  },
];

/** Capability ids shipped per vertical (from announcement packages). */
export function capabilityIdsForVertical(vertical: BusinessVertical): string[] {
  const pack = getVerticalAnnouncementPackage(vertical);
  return pack.capabilities.map((c) => c.id);
}

export function allRegisteredCapabilityRoutes(): CapabilityRoute[] {
  return [...PLATFORM_DEFAULT_ROUTES];
}

export function getCapabilityRoute(capabilityId: string): CapabilityRoute | undefined {
  return PLATFORM_DEFAULT_ROUTES.find((r) => r.id === capabilityId);
}

/** Every vertical capability from announcement must map to a route or extension surface list. */
export function validateCapabilityRouting(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const knownRouteIds = new Set(PLATFORM_DEFAULT_ROUTES.map((r) => r.id));

  for (const vertical of businessVerticalSchema.options) {
    const caps = getVerticalAnnouncementPackage(vertical).capabilities;
    for (const cap of caps) {
      if (cap.maturity === "R2") continue;
      const hasRoute = knownRouteIds.has(cap.id);
      const hasSurfaces = (cap.surfaces?.length ?? 0) > 0;
      if (!hasRoute && !hasSurfaces) {
        errors.push(
          `${vertical}: capability "${cap.id}" has no CAPABILITY_ROUTING entry and no surfaces[]`,
        );
      }
      if (hasRoute) {
        const route = getCapabilityRoute(cap.id)!;
        if (!route.policyModules.length) {
          errors.push(`${vertical}: capability "${cap.id}" route missing policyModules`);
        }
        if (!route.surfaceIds.length && !route.routePatterns.length) {
          errors.push(`${vertical}: capability "${cap.id}" route missing consumers`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/** Change-impact helper: which capabilities touch a policy file? */
export function capabilitiesAffectedByPolicyModule(moduleBasename: string): string[] {
  const needle = moduleBasename.replace(/^.*\//, "");
  return PLATFORM_DEFAULT_ROUTES.filter((r) =>
    r.policyModules.some((m) => m === needle || m.endsWith(needle)),
  ).map((r) => r.id);
}

export function surfacesAffectedByPolicyModule(moduleBasename: string): string[] {
  const caps = capabilitiesAffectedByPolicyModule(moduleBasename);
  const surfaces = new Set<string>();
  for (const id of caps) {
    const route = getCapabilityRoute(id);
    if (route) for (const s of route.surfaceIds) surfaces.add(s);
  }
  return [...surfaces];
}
