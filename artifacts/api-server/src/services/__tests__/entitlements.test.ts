/**
 * Plan composition + denylist semantics (no DB).
 */
import assert from "node:assert/strict";
import {
  lookupPlan,
  tenantHasEntitlement,
  PLAN_CATALOGUE,
  voiceOutcomeCapLabel,
  hasEffectiveEntitlement,
} from "@workspace/entitlements";

const solo = lookupPlan("solo")!;
const trial = lookupPlan("trial")!;

assert.ok(tenantHasEntitlement(solo, "voice_receptionist"), "solo includes voice");
assert.ok(
  !tenantHasEntitlement(trial, "voice_receptionist"),
  "trial excludes voice",
);
assert.ok(
  !tenantHasEntitlement(solo, "voice_receptionist", new Set(["voice_receptionist"])),
  "denylist strips voice from solo",
);

assert.equal(PLAN_CATALOGUE.solo.baseEurCentsPerMonth, 7900);
assert.equal(PLAN_CATALOGUE.studio.seatEurCentsPerMonth, 1500);
assert.match(voiceOutcomeCapLabel(solo)!, /€50\/mo/);

assert.ok(
  hasEffectiveEntitlement(["event_operator_pack"], "quote_generator"),
  "event pack implies quote_generator",
);
assert.ok(
  !hasEffectiveEntitlement(["voice_receptionist"], "quote_generator"),
  "solo voice does not imply quotes",
);

console.log("entitlements.test.ts: ok");
