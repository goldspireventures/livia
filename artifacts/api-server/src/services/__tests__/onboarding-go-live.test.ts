import assert from "node:assert/strict";
import { validateOnboardingGoLive } from "../../lib/onboarding-go-live-gate";
import {
  mergeOnboardingState,
  afterBusinessCreatedState,
  onboardingChecklistSchema,
} from "@workspace/policy";

const base = afterBusinessCreatedState();
const checklist = onboardingChecklistSchema.parse({ ...base.checklist, testBooking: false });
const withoutTest = mergeOnboardingState(base, {
  completedActs: [...base.completedActs, "a12_go_live"],
  currentAct: "a12_go_live",
  percentComplete: 100,
  checklist,
});

assert.equal(validateOnboardingGoLive(withoutTest), null, "go-live is not blocked by test booking");

const withTest = mergeOnboardingState(withoutTest, {
  checklist: onboardingChecklistSchema.parse({ ...withoutTest.checklist, testBooking: true }),
});
assert.equal(validateOnboardingGoLive(withTest), null);

console.log("onboarding-go-live.test.ts: ok");
