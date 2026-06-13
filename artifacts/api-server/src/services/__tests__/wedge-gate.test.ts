import assert from "node:assert/strict";
import {
  isDashboardRouteAllowedForTenant,
  isWedgeHairTenant,
  showEnterpriseToolkitExports,
  showPayrollToolkitExport,
  showPeerInsightsForTenant,
} from "@workspace/policy";

assert.equal(isWedgeHairTenant("hair"), true);
assert.equal(isWedgeHairTenant("medspa"), false);
assert.equal(showPeerInsightsForTenant("hair"), false);
assert.equal(showPeerInsightsForTenant("medspa"), true);
assert.equal(showEnterpriseToolkitExports("hair", "solo"), false);
assert.equal(showEnterpriseToolkitExports("hair", "franchise"), true);
assert.equal(showEnterpriseToolkitExports("event-vendors", "solo"), false);
assert.equal(showEnterpriseToolkitExports("medspa", "solo"), false);
assert.equal(showPayrollToolkitExport("event-vendors", "solo"), false);
assert.equal(showPayrollToolkitExport("medspa", "solo"), false);
assert.equal(showPayrollToolkitExport("medspa", "studio"), true);

assert.equal(isDashboardRouteAllowedForTenant("/medspa", "hair"), false);
assert.equal(isDashboardRouteAllowedForTenant("/medspa", "medspa"), true);
assert.equal(isDashboardRouteAllowedForTenant("/franchise", "hair", "solo"), false);
assert.equal(isDashboardRouteAllowedForTenant("/franchise", "hair", "franchise"), true);
assert.equal(isDashboardRouteAllowedForTenant("/inbox", "hair"), true);

console.log("wedge-gate.test.ts: ok");
