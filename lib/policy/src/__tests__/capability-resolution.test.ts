import assert from "node:assert/strict";
import {
  resolveTenantCapabilityGraph,
  VERTICAL_PLATFORM_CAPABILITY_MAP,
} from "../capability-resolution";

const graph = resolveTenantCapabilityGraph({
  vertical: "beauty",
  facts: {
    serviceCount: 2,
    staffCount: 1,
    hasPublicSlug: true,
    hasAvailabilityRules: true,
    paymentsConnected: false,
    messagingConfigured: false,
  },
});

assert.equal(graph.vertical, "beauty");
assert.ok(graph.platformCapabilities.length >= 3);
assert.ok(graph.platformCapabilities.some((c) => c.id === "bookings"));
assert.ok(graph.verticalCapabilities.length >= 1);

const blocked = resolveTenantCapabilityGraph({
  vertical: "wellness",
  facts: {
    serviceCount: 0,
    staffCount: 0,
    hasPublicSlug: false,
    hasAvailabilityRules: false,
    paymentsConnected: false,
    messagingConfigured: false,
  },
});
const bookings = blocked.platformCapabilities.find((c) => c.id === "bookings");
assert.ok(bookings?.readinessBlockers.length >= 2);

const allied = resolveTenantCapabilityGraph({
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
const messaging = allied.platformCapabilities.find((c) => c.id === "messaging");
assert.equal(messaging?.readinessBlockers.length ?? 0, 0, "messaging must not block launch");

assert.ok(VERTICAL_PLATFORM_CAPABILITY_MAP.hair.includes("bookings"));

console.log("capability-resolution.test.ts OK");
