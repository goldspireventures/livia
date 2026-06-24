import assert from "node:assert/strict";
import {
  isPortalSkippedUiAct,
  isSwitchingMigration,
  resolvePortalNavActs,
  shouldSeedStarterPackOnCreate,
} from "../migration-fast-track-program";

assert.equal(shouldSeedStarterPackOnCreate("fresh"), true);
assert.equal(shouldSeedStarterPackOnCreate("switching"), false);

assert.equal(isSwitchingMigration({ migrationIntent: "switching" }), true);
assert.equal(isSwitchingMigration({ migrationIntent: "fresh" }), false);

const switchingNav = resolvePortalNavActs({ migrationIntent: "switching" });
assert.ok(switchingNav.includes("a11_migration"));
assert.equal(isPortalSkippedUiAct("a11_migration", { migrationIntent: "switching" }), false);
assert.equal(isPortalSkippedUiAct("a11_migration", { migrationIntent: "fresh" }), true);

console.log("migration-fast-track.test.ts ok");
