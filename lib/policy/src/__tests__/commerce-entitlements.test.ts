import assert from "node:assert/strict";
import {
  apiFeatureEntitlementKey,
  featureUnlockCopy,
  formatEventOperatorPackPrice,
} from "../commerce-entitlements-program";

assert.equal(apiFeatureEntitlementKey("quotes"), "quote_generator");
assert.equal(apiFeatureEntitlementKey("enquiries"), "consult_first_inbox");
assert.equal(apiFeatureEntitlementKey("bookings"), null);

assert.match(featureUnlockCopy("quote_generator").title, /quote/i);
assert.equal(formatEventOperatorPackPrice(), "€49");
