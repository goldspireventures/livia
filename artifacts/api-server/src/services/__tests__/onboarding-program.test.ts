/**
 * Blocking onboarding gates — App Store path unlocks after essentials, not 12-click tour.
 */
import assert from "node:assert/strict";
import {
  afterBusinessCreatedStateWithSeed,
  blockingOnboardingPercent,
  isOnboardingAppUnlocked,
} from "@workspace/policy";

const seeded = afterBusinessCreatedStateWithSeed();
assert.ok(seeded.completedActs.includes("a3_service_menu"));
assert.ok(seeded.completedActs.includes("a4_team"));
assert.equal(seeded.currentAct, "a2_shop_profile");

const partial = {
  ...seeded,
  completedActs: [...seeded.completedActs, "a2_shop_profile", "a5_hours", "a6_liv", "a8_public_link"],
};
assert.equal(blockingOnboardingPercent(partial.completedActs), 100);
assert.equal(isOnboardingAppUnlocked(partial), true);

const locked = { ...seeded, completedActs: seeded.completedActs };
assert.equal(isOnboardingAppUnlocked(locked), false);

console.log("onboarding-program.test.ts: ok");
