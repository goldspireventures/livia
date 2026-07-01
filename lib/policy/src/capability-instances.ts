/**
 * Tenant capability instance persistence model — Era 2 Q1 v0.
 * @see docs/engineering/CAPABILITY-GRAPH-SPEC.md Phase 2
 */
import { z } from "zod/v4";
import type { CapabilityState, ResolvedPlatformCapability, CapabilityReadinessFacts } from "./capability-resolution";
import type { OnboardingActId, OnboardingChecklist, OnboardingState } from "./onboarding-state";
import { COMMERCE_BILLING_FIX_HREF } from "./commerce-signals";
import {
  countLaunchEssentialBlockers,
  isLaunchEssentialCapability,
} from "./store-setup-essentials";

/** Settings → Channels → SMS / WhatsApp / Instagram setup (not message templates). */
export const SETTINGS_CHANNELS_SETUP_HREF = "/settings?tab=comms#channels-setup";

export const capabilityStateSchema = z.enum([
  "defined",
  "installed",
  "configured",
  "active",
  "suspended",
]);

export const storedCapabilityInstanceSchema = z.object({
  capabilityId: z.string(),
  state: capabilityStateSchema,
  installedAt: z.string().optional(),
  configuredAt: z.string().optional(),
  activeAt: z.string().optional(),
  suspendedAt: z.string().optional(),
  updatedAt: z.string(),
});

export const capabilityInstancesStoreSchema = z.record(z.string(), storedCapabilityInstanceSchema);

export type StoredCapabilityInstance = z.infer<typeof storedCapabilityInstanceSchema>;
export type CapabilityInstancesStore = Record<string, StoredCapabilityInstance>;

export type CapabilityStateTransition = {
  capabilityId: string;
  from: CapabilityState | null;
  to: CapabilityState;
};

const STATE_RANK: Record<Exclude<CapabilityState, "suspended">, number> = {
  defined: 0,
  installed: 1,
  configured: 2,
  active: 3,
};

function rank(state: CapabilityState): number {
  if (state === "suspended") return -1;
  return STATE_RANK[state];
}

export function parseCapabilityInstancesStore(raw: unknown): CapabilityInstancesStore {
  const parsed = capabilityInstancesStoreSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : {};
}

function stampForState(
  state: CapabilityState,
  now: string,
  existing?: StoredCapabilityInstance,
): Pick<StoredCapabilityInstance, "installedAt" | "configuredAt" | "activeAt"> {
  const r = rank(state);
  return {
    installedAt: existing?.installedAt ?? (r >= 1 ? now : undefined),
    configuredAt: existing?.configuredAt ?? (r >= 2 ? now : undefined),
    activeAt: existing?.activeAt ?? (r >= 3 ? now : undefined),
  };
}

/** Reconcile computed readiness graph with persisted tenant instances. */
export function reconcileCapabilityInstances(args: {
  computed: ResolvedPlatformCapability[];
  stored: CapabilityInstancesStore;
  now?: string;
}): {
  store: CapabilityInstancesStore;
  transitions: CapabilityStateTransition[];
  mergedCapabilities: ResolvedPlatformCapability[];
} {
  const now = args.now ?? new Date().toISOString();
  const store: CapabilityInstancesStore = { ...args.stored };
  const transitions: CapabilityStateTransition[] = [];
  const mergedCapabilities: ResolvedPlatformCapability[] = [];

  for (const cap of args.computed) {
    const existing = store[cap.id];
    let nextState: CapabilityState;

    if (existing?.state === "suspended") {
      nextState = "suspended";
    } else if (!existing) {
      nextState = cap.state === "defined" ? "installed" : cap.state;
    } else {
      nextState = rank(cap.state) > rank(existing.state) ? cap.state : existing.state;
    }

    const fromState = existing?.state ?? null;
    const stamps = stampForState(nextState, now, existing);

    const updated: StoredCapabilityInstance = {
      capabilityId: cap.id,
      state: nextState,
      ...stamps,
      suspendedAt: existing?.suspendedAt,
      updatedAt: fromState !== nextState ? now : (existing?.updatedAt ?? now),
    };

    if (!existing || existing.state !== nextState) {
      if (fromState !== nextState) {
        transitions.push({ capabilityId: cap.id, from: fromState, to: nextState });
      }
      store[cap.id] = updated;
    } else {
      store[cap.id] = existing;
    }

    mergedCapabilities.push({
      ...cap,
      state: store[cap.id]!.state,
    });
  }

  return { store, transitions, mergedCapabilities };
}

/** Stable ordering for readiness-derived act hints. */
const ONBOARDING_ACT_ORDER: OnboardingActId[] = [
  "a1_create_business",
  "a2_shop_profile",
  "a3_service_menu",
  "a4_team",
  "a5_hours",
  "a6_liv",
  "a7_channels",
  "a8_public_link",
  "a9_billing",
  "a10_invite_team",
  "a11_migration",
  "a12_go_live",
];

/** Map capability readiness blockers to onboarding acts (readiness-driven setup). */
export function onboardingActsFromCapabilityBlockers(
  blockers: { capabilityId: string; blocker: string }[],
): OnboardingActId[] {
  const acts = new Set<OnboardingActId>();
  for (const b of blockers) {
    if (!isLaunchEssentialCapability(b.capabilityId)) continue;
    const text = b.blocker.toLowerCase();
    if (text.includes("service")) acts.add("a3_service_menu");
    if (text.includes("team member") || text.includes("staff")) acts.add("a4_team");
    if (text.includes("availability")) acts.add("a5_hours");
    if (text.includes("sms") || text.includes("channel")) acts.add("a7_channels");
    if (text.includes("stripe") || text.includes("connect")) acts.add("a9_billing");
    if (b.capabilityId === "bookings" && text.includes("service")) acts.add("a3_service_menu");
  }
  return ONBOARDING_ACT_ORDER.filter((act) => acts.has(act));
}

export const ONBOARDING_ACT_HREF: Partial<Record<OnboardingActId, string>> = {
  a2_shop_profile: "/onboarding",
  a3_service_menu: "/services",
  a4_team: "/staff",
  a5_hours: "/onboarding",
  a6_liv: "/settings?tab=liv",
  a7_channels: SETTINGS_CHANNELS_SETUP_HREF,
  a8_public_link: "/onboarding",
  a9_billing: "/settings?tab=billing",
  a10_invite_team: "/staff",
  a12_go_live: "/onboarding",
};

/** Deep link for a capability readiness blocker. */
export function capabilityBlockerHref(capabilityId: string, blocker: string): string {
  const text = blocker.toLowerCase();
  if (text.includes("service")) return "/services";
  if (text.includes("team member") || text.includes("staff")) return "/staff";
  if (text.includes("availability")) return "/onboarding";
  if (text.includes("stripe") || text.includes("connect")) return COMMERCE_BILLING_FIX_HREF;
  if (text.includes("sms") || text.includes("channel")) return SETTINGS_CHANNELS_SETUP_HREF;
  switch (capabilityId) {
    case "bookings":
      return "/services";
    case "messaging":
      return SETTINGS_CHANNELS_SETUP_HREF;
    case "payments":
      return COMMERCE_BILLING_FIX_HREF;
    case "memberships":
      return "/day-packages";
    case "reviews":
    case "portfolio":
      return "/customers";
    default:
      return "/settings?tab=liv";
  }
}

export type CapabilityHealthSummary = {
  total: number;
  active: number;
  configured: number;
  installed: number;
  suspended: number;
  blockerCount: number;
};

export function summarizeCapabilityHealth(
  platformCapabilities: ResolvedPlatformCapability[],
): CapabilityHealthSummary {
  return {
    total: platformCapabilities.length,
    active: platformCapabilities.filter((c) => c.state === "active").length,
    configured: platformCapabilities.filter((c) => c.state === "configured").length,
    installed: platformCapabilities.filter((c) => c.state === "installed").length,
    suspended: platformCapabilities.filter((c) => c.state === "suspended").length,
    blockerCount: countLaunchEssentialBlockers(platformCapabilities),
  };
}

/** Owner manually suspended — reconcile must not auto-resume. */
export function applyManualCapabilityInstanceState(
  store: CapabilityInstancesStore,
  capabilityId: string,
  action: "suspend" | "resume",
  now?: string,
): { store: CapabilityInstancesStore; transition: CapabilityStateTransition | null } {
  const ts = now ?? new Date().toISOString();
  const existing = store[capabilityId];
  const fromState = existing?.state ?? null;

  if (action === "suspend") {
    const next: StoredCapabilityInstance = {
      capabilityId,
      state: "suspended",
      installedAt: existing?.installedAt ?? ts,
      configuredAt: existing?.configuredAt,
      activeAt: existing?.activeAt,
      suspendedAt: ts,
      updatedAt: ts,
    };
    return {
      store: { ...store, [capabilityId]: next },
      transition: fromState !== "suspended" ? { capabilityId, from: fromState, to: "suspended" } : null,
    };
  }

  const next: StoredCapabilityInstance = {
    capabilityId,
    state: "installed",
    installedAt: existing?.installedAt ?? ts,
    configuredAt: existing?.configuredAt,
    activeAt: existing?.activeAt,
    suspendedAt: undefined,
    updatedAt: ts,
  };
  return {
    store: { ...store, [capabilityId]: next },
    transition: fromState === "suspended" ? { capabilityId, from: "suspended", to: "installed" } : null,
  };
}

/**
 * When capability readiness facts clear blockers, auto-complete matching onboarding acts.
 * Called from GET /capabilities — idempotent.
 */
export function deriveOnboardingAdvancesFromReadiness(args: {
  facts: CapabilityReadinessFacts;
  capabilities: ResolvedPlatformCapability[];
  state: OnboardingState | null | undefined;
}): { acts: OnboardingActId[]; checklist: Partial<OnboardingChecklist> } {
  const completed = new Set(args.state?.completedActs ?? []);
  const pendingActs: OnboardingActId[] = [];
  const checklist: Partial<OnboardingChecklist> = {};
  const cap = (id: string) => args.capabilities.find((c) => c.id === id);

  if (args.facts.serviceCount >= 1) {
    checklist.servicesConfirmed = true;
    if (!completed.has("a3_service_menu")) pendingActs.push("a3_service_menu");
  }
  if (args.facts.staffCount >= 1 && !completed.has("a4_team")) {
    pendingActs.push("a4_team");
  }
  if (args.facts.hasAvailabilityRules) {
    checklist.hoursConfirmed = true;
    if (!completed.has("a5_hours")) pendingActs.push("a5_hours");
  }

  const messaging = cap("messaging");
  if (
    args.facts.messagingConfigured &&
    messaging &&
    messaging.readinessBlockers.length === 0
  ) {
    checklist.smsOrVoiceConnected = true;
    if (!completed.has("a7_channels")) pendingActs.push("a7_channels");
  }

  const payments = cap("payments");
  if (args.facts.paymentsConnected && payments && payments.readinessBlockers.length === 0) {
    checklist.billingStarted = true;
    if (!completed.has("a9_billing")) pendingActs.push("a9_billing");
  }

  if (args.facts.hasPublicSlug && !completed.has("a8_public_link")) {
    checklist.publicLinkShared = true;
    pendingActs.push("a8_public_link");
  }

  if (args.facts.aiEnabled && !completed.has("a6_liv")) {
    checklist.livEnabled = true;
    pendingActs.push("a6_liv");
  }

  if (args.facts.staffCount >= 2 && !completed.has("a10_invite_team")) {
    checklist.teamInvited = true;
    pendingActs.push("a10_invite_team");
  }

  if (args.facts.sacredMetricMet) {
    checklist.testBooking = true;
    if (!completed.has("a12_go_live")) pendingActs.push("a12_go_live");
  }

  const bookings = cap("bookings");
  if (bookings?.readinessMet && bookings.readinessBlockers.length === 0) {
    checklist.servicesConfirmed = true;
  }

  const acts = ONBOARDING_ACT_ORDER.filter((act) => pendingActs.includes(act));
  return { acts, checklist };
}

/** Merge blocker-derived and readiness-derived act hints for setup copilot. */
export function readinessActHintsFromCapabilities(args: {
  facts: CapabilityReadinessFacts;
  capabilities: ResolvedPlatformCapability[];
  state: OnboardingState | null | undefined;
}): OnboardingActId[] {
  const blockerHints = onboardingActsFromCapabilityBlockers(
    args.capabilities.flatMap((cap) =>
      cap.readinessBlockers.map((blocker) => ({
        capabilityId: cap.id,
        blocker,
      })),
    ),
  );
  const { acts: advanceCandidates } = deriveOnboardingAdvancesFromReadiness(args);
  const completed = new Set(args.state?.completedActs ?? []);
  const hints = new Set<OnboardingActId>();
  for (const act of [...blockerHints, ...advanceCandidates]) {
    if (!completed.has(act)) hints.add(act);
  }
  return ONBOARDING_ACT_ORDER.filter((act) => hints.has(act));
}
