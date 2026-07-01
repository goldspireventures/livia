import assert from "node:assert/strict";
import { resolveTenantCapabilityGraph } from "../capability-resolution";
import {
  countLaunchEssentialBlockers,
  flattenLaunchEssentialCapabilityBlockers,
  verticalStoreSetupEssentials,
  buildSettingsEnhancementRows,
} from "../store-setup-essentials";

const graph = resolveTenantCapabilityGraph({
  vertical: "allied-health",
  facts: {
    serviceCount: 2,
    staffCount: 1,
    hasPublicSlug: true,
    hasAvailabilityRules: true,
    paymentsConnected: false,
    messagingConfigured: false,
  },
});

assert.equal(countLaunchEssentialBlockers(graph.platformCapabilities), 0);
assert.equal(flattenLaunchEssentialCapabilityBlockers(graph.platformCapabilities).length, 0);

const essentials = verticalStoreSetupEssentials("allied-health");
assert.ok(essentials.some((s) => s.id === "hours"));
assert.ok(essentials.some((s) => s.id === "first-booking"));

const vendorEssentials = verticalStoreSetupEssentials("event-vendors");
assert.ok(vendorEssentials.some((s) => s.id === "first-quote"));

const enhancements = buildSettingsEnhancementRows({
  vertical: "allied-health",
  checklist: {},
  messagingConfigured: false,
  paymentsConnected: false,
  operatorSignals: { tier: "solo", activeStaffCount: 1 },
});
assert.ok(enhancements.some((r) => r.id === "enhance-channels"));
assert.ok(enhancements.some((r) => r.id === "enhance-billing"));
assert.equal(enhancements.some((r) => r.id === "enhance-team"), false);

const enhancementsDone = buildSettingsEnhancementRows({
  checklist: { smsOrVoiceConnected: true, billingStarted: true },
  messagingConfigured: true,
  paymentsConnected: true,
});
assert.equal(enhancementsDone.length, 0);

console.log("store-setup-essentials.test.ts OK");
