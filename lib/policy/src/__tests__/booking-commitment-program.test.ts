import assert from "node:assert/strict";
import {
  VERTICAL_COMMITMENT_PROFILES,
  depositAppliesForBookingContext,
  recommendedDepositPolicyForVertical,
  serviceWaivesPercentDeposit,
  verticalSupportsPackageCreditCommitment,
} from "../booking-commitment-program";

assert.equal(recommendedDepositPolicyForVertical("wellness").depositPercent, 50);
assert.equal(recommendedDepositPolicyForVertical("fitness").depositPercent, 100);
assert.equal(recommendedDepositPolicyForVertical("allied-health").depositRequired, false);
assert.equal(VERTICAL_COMMITMENT_PROFILES["event-vendors"].rail, "milestone_quote");

assert.equal(
  serviceWaivesPercentDeposit({ priceMinor: 0, serviceKind: null, category: "Consult" }),
  true,
);
assert.equal(
  serviceWaivesPercentDeposit({ priceMinor: 5000, serviceKind: "consult", category: null }),
  true,
);

assert.equal(
  depositAppliesForBookingContext({
    operational: { depositRequired: true, depositPercent: 20 },
    service: { priceMinor: 0, serviceKind: "consult", category: "Consult" },
  }),
  false,
  "free consult SKUs skip deposit gate",
);

assert.equal(
  depositAppliesForBookingContext({
    operational: { depositRequired: true, depositPercent: 20 },
    service: { priceMinor: 8000, serviceKind: "fill", category: "Lashes" },
    packageCreditApplied: true,
  }),
  false,
  "prepaid package credit satisfies commitment",
);

assert.equal(verticalSupportsPackageCreditCommitment("wellness"), true);
assert.equal(verticalSupportsPackageCreditCommitment("fitness"), true);
assert.equal(verticalSupportsPackageCreditCommitment("hair"), false);

assert.equal(
  depositAppliesForBookingContext({
    operational: {
      depositRequired: true,
      depositPercent: 20,
      emergentTrustProgram: { enabled: true },
    },
    service: { priceMinor: 8000, serviceKind: "cut", category: "Hair" },
    customerTrusted: true,
  }),
  false,
  "trusted client waives deposit",
);

console.log("booking-commitment-program.test.ts: ok");
