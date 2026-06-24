import assert from "node:assert/strict";
import { buildSetupGuidedFlow } from "../setup-guided-flow";
import { mergeOnboardingState } from "../onboarding-state";

function stateWithActs(...acts: string[]) {
  return mergeOnboardingState(null, {
    completedActs: acts as never[],
    checklist: {},
  });
}

assert.equal(
  buildSetupGuidedFlow({
    onboardingState: stateWithActs("a1_create_business"),
    slug: "bloom",
    sacredMetricMet: false,
  }).currentPhaseId,
  "setup",
);

const publishReady = buildSetupGuidedFlow({
  onboardingState: stateWithActs(
    "a2_shop_profile",
    "a5_hours",
    "a6_liv",
    "a3_service_menu",
  ),
  slug: "bloom",
  sacredMetricMet: false,
});
assert.equal(publishReady.currentPhaseId, "publish");
assert.equal(publishReady.publicPath, "/book/bloom");

const awaitFirstBook = buildSetupGuidedFlow({
  onboardingState: stateWithActs(
    "a2_shop_profile",
    "a5_hours",
    "a6_liv",
    "a3_service_menu",
    "a8_public_link",
  ),
  slug: "bloom",
  sacredMetricMet: false,
});
assert.equal(awaitFirstBook.currentPhaseId, "first_booking");

const activated = buildSetupGuidedFlow({
  onboardingState: stateWithActs(
    "a2_shop_profile",
    "a5_hours",
    "a6_liv",
    "a8_public_link",
    "a9_billing",
  ),
  slug: "bloom",
  sacredMetricMet: true,
});
assert.equal(activated.complete, true);
assert.ok(activated.phases.every((p) => p.done));

console.log("setup-guided-flow.test.ts OK");
