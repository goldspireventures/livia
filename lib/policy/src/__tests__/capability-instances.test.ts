import assert from "node:assert/strict";
import {
  parseCapabilityInstancesStore,
  reconcileCapabilityInstances,
  onboardingActsFromCapabilityBlockers,
  capabilityBlockerHref,
  SETTINGS_CHANNELS_SETUP_HREF,
  applyManualCapabilityInstanceState,
  summarizeCapabilityHealth,
  deriveOnboardingAdvancesFromReadiness,
} from "../capability-instances";
import { resolveTenantCapabilityGraph } from "../capability-resolution";
import { nextRecommendedActWithReadiness } from "../onboarding-program";

const computed = resolveTenantCapabilityGraph({
  vertical: "beauty",
  facts: {
    serviceCount: 2,
    staffCount: 1,
    hasPublicSlug: true,
    hasAvailabilityRules: true,
    paymentsConnected: false,
    messagingConfigured: false,
  },
  activeCapabilityIds: ["bookings"],
});

const first = reconcileCapabilityInstances({ computed: computed.platformCapabilities, stored: {} });
assert.ok(Object.keys(first.store).length >= 3);
assert.ok(first.transitions.length >= 3);
const bookings = first.mergedCapabilities.find((c) => c.id === "bookings");
assert.equal(bookings?.state, "active");

const second = reconcileCapabilityInstances({
  computed: computed.platformCapabilities,
  stored: first.store,
});
assert.equal(second.transitions.length, 0);

const suspended = reconcileCapabilityInstances({
  computed: computed.platformCapabilities,
  stored: {
    messaging: {
      capabilityId: "messaging",
      state: "suspended",
      installedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      suspendedAt: "2026-01-02T00:00:00.000Z",
    },
  },
});
const msg = suspended.mergedCapabilities.find((c) => c.id === "messaging");
assert.equal(msg?.state, "suspended");

assert.deepEqual(parseCapabilityInstancesStore(null), {});
assert.deepEqual(parseCapabilityInstancesStore({ bad: 1 }), {});

const acts = onboardingActsFromCapabilityBlockers([
  { capabilityId: "bookings", blocker: "Add at least one service" },
  { capabilityId: "messaging", blocker: "Configure SMS or channels" },
]);
assert.ok(acts.includes("a3_service_menu"));
assert.ok(acts.includes("a7_channels"));
assert.equal(acts[0], "a3_service_menu");

assert.equal(
  capabilityBlockerHref("messaging", "Configure SMS or channels"),
  SETTINGS_CHANNELS_SETUP_HREF,
);

const health = summarizeCapabilityHealth(first.mergedCapabilities);
assert.ok(health.total >= 3);
assert.ok(health.blockerCount >= 0);

const manual = applyManualCapabilityInstanceState(first.store, "messaging", "suspend");
assert.equal(manual.store.messaging?.state, "suspended");

const act = nextRecommendedActWithReadiness(
  { currentAct: "a2_shop_profile", completedActs: ["a1_create_business"], percentComplete: 10, updatedAt: "" },
  ["a3_service_menu", "a7_channels"],
);
assert.equal(act, "a3_service_menu");

const advances = deriveOnboardingAdvancesFromReadiness({
  facts: {
    serviceCount: 2,
    staffCount: 1,
    hasPublicSlug: true,
    hasAvailabilityRules: true,
    paymentsConnected: false,
    messagingConfigured: true,
  },
  capabilities: first.mergedCapabilities,
  state: { currentAct: "a2_shop_profile", completedActs: ["a1_create_business"], percentComplete: 10, updatedAt: "" },
});
assert.ok(advances.acts.includes("a3_service_menu"));
assert.ok(advances.acts.includes("a5_hours"));
assert.equal(advances.checklist.hoursConfirmed, true);

const slugAdvance = deriveOnboardingAdvancesFromReadiness({
  facts: {
    serviceCount: 1,
    staffCount: 1,
    hasPublicSlug: true,
    hasAvailabilityRules: true,
    paymentsConnected: false,
    messagingConfigured: false,
    aiEnabled: true,
  },
  capabilities: first.mergedCapabilities,
  state: { currentAct: "a2_shop_profile", completedActs: ["a1_create_business"], percentComplete: 10, updatedAt: "" },
});
assert.ok(slugAdvance.acts.includes("a8_public_link"));
assert.ok(slugAdvance.acts.includes("a6_liv"));

console.log("capability-instances.test.ts OK");
