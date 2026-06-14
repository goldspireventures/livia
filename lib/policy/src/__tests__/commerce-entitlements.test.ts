import assert from "node:assert/strict";
import {
  apiFeatureEntitlementKey,
  featureUnlockCopy,
  formatEventOperatorPackPrice,
  formatRetailPackPrice,
  commerceFeatureForPath,
} from "../commerce-entitlements-program";

assert.equal(apiFeatureEntitlementKey("quotes"), "quote_generator");
assert.equal(apiFeatureEntitlementKey("enquiries"), "consult_first_inbox");
assert.equal(apiFeatureEntitlementKey("retail"), "retail_pack");
assert.equal(apiFeatureEntitlementKey("bookings"), null);

assert.match(featureUnlockCopy("quote_generator").title, /quote/i);
assert.match(featureUnlockCopy("take_home_retail").title, /Take-Home Retail/i);
assert.equal(formatEventOperatorPackPrice(), "€49");
assert.equal(formatRetailPackPrice(), "€29");
assert.equal(commerceFeatureForPath("/store"), "take_home_retail");

console.log("commerce-entitlements.test.ts: ok");
