/**
 * Blocking onboarding gates — App Store path unlocks after essentials, not 12-click tour.
 */
import assert from "node:assert/strict";
import {
  afterBusinessCreatedStateForVertical,
  afterBusinessCreatedStateWithSeed,
  blockingOnboardingPercent,
  isOnboardingAppUnlocked,
} from "@workspace/policy";

const seeded = afterBusinessCreatedStateWithSeed();
assert.ok(seeded.completedActs.includes("a3_service_menu"));
assert.ok(seeded.completedActs.includes("a4_team"));
// a2_shop_profile is completed on create; with the starter-pack seeding the
// next outstanding blocking act is hours.
assert.equal(seeded.currentAct, "a5_hours");

const bloom = afterBusinessCreatedStateForVertical("beauty");
assert.equal(bloom.currentAct, "a3_service_menu");
assert.ok(!bloom.completedActs.includes("a3_service_menu"));
assert.ok(!bloom.completedActs.includes("a4_team"));
assert.equal(bloom.checklist.servicesConfirmed, false);

const emptyHair = afterBusinessCreatedStateForVertical("hair");
// Create captures the shop profile, so a2_shop_profile is completed on create
// (it is a blocking act; without it a fresh owner can never unlock the app).
assert.deepEqual(emptyHair.completedActs, ["a1_create_business", "a2_shop_profile"]);

const partial = {
  ...seeded,
  completedActs: [...seeded.completedActs, "a2_shop_profile", "a5_hours", "a6_liv", "a8_public_link"],
};
assert.equal(blockingOnboardingPercent(partial.completedActs), 100);
assert.equal(isOnboardingAppUnlocked(partial), true);

const locked = { ...seeded, completedActs: seeded.completedActs };
assert.equal(isOnboardingAppUnlocked(locked), false);

console.log("onboarding-program.test.ts: ok");
