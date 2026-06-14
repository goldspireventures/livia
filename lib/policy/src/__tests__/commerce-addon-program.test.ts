import assert from "node:assert/strict";
import {
  addonIdForEntitlement,
  addonUnlockMessage,
  commerceAddonsForVertical,
  onboardingCommerceBlocksForVertical,
  validateCommerceAddonVerticalCoverage,
} from "../commerce-addon-program";
import { apiFeatureEntitlementKey } from "../commerce-entitlements-program";
import { PUBLIC_RETAIL_VERTICALS } from "../tenant-retail-program";

assert.equal(validateCommerceAddonVerticalCoverage().length, 0);

assert.equal(apiFeatureEntitlementKey("retail"), "retail_pack");
assert.equal(addonIdForEntitlement("retail_pack"), "retail_pack");
assert.equal(addonIdForEntitlement("quote_generator"), "event_operator_pack");
assert.match(addonUnlockMessage("retail_pack"), /Take-Home Retail/i);

const beautyBlocks = onboardingCommerceBlocksForVertical("beauty");
assert.ok(beautyBlocks.some((b) => b.addonId === "retail_pack"));
assert.equal(onboardingCommerceBlocksForVertical("event-vendors").length, 1);

for (const v of PUBLIC_RETAIL_VERTICALS) {
  const addons = commerceAddonsForVertical(v);
  assert.ok(addons.some((a) => a.id === "retail_pack"), `retail_pack missing for ${v}`);
}

console.log("commerce-addon-program.test.ts: ok");
