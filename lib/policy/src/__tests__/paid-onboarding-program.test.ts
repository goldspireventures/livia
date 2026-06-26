import assert from "node:assert/strict";
import {
  appendBillingBlockingAct,
  initialPlanIdForNewBusiness,
  publicPaidOnboardingEnabled,
  subscriptionGrantsPaidAccess,
} from "../paid-onboarding-program";
import { lookupComplimentaryPromo, parseComplimentaryPromoCodes } from "../promo-code-program";

assert.equal(publicPaidOnboardingEnabled({ LIVIA_PUBLIC_PAID_ONBOARDING: "true" }), true);
assert.equal(publicPaidOnboardingEnabled({}), false);
assert.equal(initialPlanIdForNewBusiness({ LIVIA_PUBLIC_PAID_ONBOARDING: "true" }), "trial");
assert.equal(initialPlanIdForNewBusiness({}), null);

assert.ok(subscriptionGrantsPaidAccess("active", null));
assert.ok(subscriptionGrantsPaidAccess("complimentary", null));
assert.ok(!subscriptionGrantsPaidAccess(null, null));

const acts = appendBillingBlockingAct(["a2_shop_profile", "a5_hours"], {
  LIVIA_PUBLIC_PAID_ONBOARDING: "true",
});
assert.ok(acts.includes("a9_billing"));

const promos = parseComplimentaryPromoCodes("LIVIA-FRIEND=solo,PARTNER=studio:90");
assert.equal(lookupComplimentaryPromo("LIVIA-FRIEND=solo,PARTNER=studio:90", "livia-friend")?.planId, "solo");
assert.equal(lookupComplimentaryPromo("LIVIA-FRIEND=solo,PARTNER=studio:90", "PARTNER")?.durationDays, 90);

console.log("paid-onboarding-program.test.ts OK");
