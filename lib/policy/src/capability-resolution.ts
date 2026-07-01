/**
 * Resolves tenant capability graph from vertical + registry + readiness.
 * @see docs/engineering/CAPABILITY-GRAPH-SPEC.md
 */
import type { BusinessVertical } from "./types";
import {
  CAPABILITY_REGISTRY,
  getCapabilityDefinition,
  type CapabilityDefinition,
} from "./capability-registry";
import { welcomeVerticalAnnouncement } from "./vertical-announcement";

export type CapabilityState = "defined" | "installed" | "configured" | "active" | "suspended";

export type ResolvedPlatformCapability = {
  id: string;
  name: string;
  description: string;
  category: CapabilityDefinition["category"];
  state: CapabilityState;
  v1: boolean;
  readinessMet: boolean;
  readinessBlockers: string[];
  livTools: string[];
  events: string[];
};

export type TenantCapabilityGraph = {
  vertical: BusinessVertical;
  platformCapabilities: ResolvedPlatformCapability[];
  verticalCapabilities: ReturnType<typeof welcomeVerticalAnnouncement>["readyCapabilities"];
  deferredVerticalCapabilities: ReturnType<
    typeof welcomeVerticalAnnouncement
  >["deferredCapabilities"];
};

/** Platform capabilities required per vertical (graph mapping — not vertical forks). */
export const VERTICAL_PLATFORM_CAPABILITY_MAP: Record<BusinessVertical, string[]> = {
  hair: ["bookings", "availability", "messaging", "reviews"],
  beauty: ["bookings", "availability", "messaging", "reviews", "portfolio"],
  "body-art": ["bookings", "availability", "payments", "messaging", "portfolio"],
  wellness: ["bookings", "availability", "messaging", "memberships"],
  fitness: ["bookings", "availability", "messaging", "memberships"],
  medspa: ["bookings", "availability", "payments", "messaging", "reviews"],
  "allied-health": ["bookings", "availability", "messaging"],
  "pet-grooming": ["bookings", "availability", "messaging", "reviews"],
  "automotive-detailing": ["bookings", "availability", "messaging"],
  "event-vendors": ["messaging", "deposits"],
};

export type CapabilityReadinessFacts = {
  serviceCount: number;
  staffCount: number;
  hasPublicSlug: boolean;
  hasAvailabilityRules: boolean;
  paymentsConnected: boolean;
  messagingConfigured: boolean;
  aiEnabled?: boolean;
  sacredMetricMet?: boolean;
};

function readinessForCapability(
  id: string,
  facts: CapabilityReadinessFacts,
): { met: boolean; blockers: string[] } {
  const blockers: string[] = [];
  switch (id) {
    case "bookings":
      if (facts.serviceCount < 1) blockers.push("Add at least one service");
      if (facts.staffCount < 1) blockers.push("Confirm who takes bookings");
      break;
    case "availability":
      if (facts.staffCount < 1) blockers.push("Set your opening hours");
      else if (!facts.hasAvailabilityRules) blockers.push("Set opening hours");
      break;
    case "payments":
    case "deposits":
    case "messaging":
      // Billing and channels are optional for V1 launch — web + Liv chat work without them.
      break;
    case "reviews":
    case "portfolio":
    case "memberships":
      break;
    default:
      break;
  }
  return { met: blockers.length === 0, blockers };
}

function resolveState(
  installed: boolean,
  readinessMet: boolean,
  activeUse: boolean,
): CapabilityState {
  if (!installed) return "defined";
  if (!readinessMet) return "installed";
  if (activeUse) return "active";
  return "configured";
}

export function resolveTenantCapabilityGraph(args: {
  vertical: BusinessVertical;
  facts: CapabilityReadinessFacts;
  activeCapabilityIds?: string[];
}): TenantCapabilityGraph {
  const announcement = welcomeVerticalAnnouncement(args.vertical);
  const requiredIds = VERTICAL_PLATFORM_CAPABILITY_MAP[args.vertical] ?? ["bookings", "messaging"];
  const activeSet = new Set(args.activeCapabilityIds ?? []);

  const platformCapabilities: ResolvedPlatformCapability[] = requiredIds
    .map((id) => getCapabilityDefinition(id))
    .filter((def): def is CapabilityDefinition => def != null)
    .map((def) => {
      const { met, blockers } = readinessForCapability(def.id, args.facts);
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        category: def.category,
        state: resolveState(true, met, activeSet.has(def.id)),
        v1: def.v1,
        readinessMet: met,
        readinessBlockers: blockers,
        livTools: def.livTools,
        events: def.events,
      };
    });

  return {
    vertical: args.vertical,
    platformCapabilities,
    verticalCapabilities: announcement.readyCapabilities,
    deferredVerticalCapabilities: announcement.deferredCapabilities,
  };
}

export function listAllRegistryCapabilities(): CapabilityDefinition[] {
  return [...CAPABILITY_REGISTRY];
}
