import assert from "node:assert/strict";
import {
  isPortalSkippedUiAct,
  isSwitchingMigration,
  onboardingIntentFromTrack,
  onboardingTrackFromIntent,
  portalStepProgress,
  portalTrackLabel,
  resolvePortalNavActs,
  shouldSeedStarterPackOnCreate,
} from "../migration-fast-track-program";

assert.equal(shouldSeedStarterPackOnCreate("fresh"), true);
assert.equal(shouldSeedStarterPackOnCreate("switching"), false);

assert.equal(isSwitchingMigration({ migrationIntent: "switching" }), true);
assert.equal(isSwitchingMigration({ migrationIntent: "fresh" }), false);

const switchingNav = resolvePortalNavActs({ migrationIntent: "switching" });
assert.equal(switchingNav.length, 5);
assert.ok(switchingNav.includes("a11_migration"));
assert.ok(switchingNav.includes("a8_public_link"));
assert.ok(!switchingNav.includes("a2_shop_profile"));
assert.equal(isPortalSkippedUiAct("a2_shop_profile", { migrationIntent: "switching" }), true);
assert.equal(isPortalSkippedUiAct("a11_migration", { migrationIntent: "switching" }), false);
assert.equal(isPortalSkippedUiAct("a11_migration", { migrationIntent: "fresh" }), true);

const freshNav = resolvePortalNavActs({ migrationIntent: "fresh" });
assert.equal(freshNav.length, 5);
assert.ok(freshNav.includes("a8_public_link"));
assert.ok(!freshNav.includes("a6_liv"));

assert.equal(onboardingIntentFromTrack("import"), "switching");
assert.equal(onboardingTrackFromIntent("switching"), "import");
const progress = portalStepProgress("a11_migration", { migrationIntent: "switching" });
assert.equal(progress?.index, 2);
assert.equal(progress?.total, 5);

assert.equal(portalTrackLabel({ migrationIntent: "switching" }), "Bring your data");
assert.equal(portalTrackLabel({ migrationIntent: "fresh" }), "New shop");

console.log("migration-fast-track.test.ts ok");
