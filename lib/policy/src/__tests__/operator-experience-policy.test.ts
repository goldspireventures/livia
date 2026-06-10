import assert from "node:assert/strict";
import {
  isSoloOperator,
  resolveOperatorExperience,
  resolveSoloOwnerHomeFallback,
} from "../operator-experience-policy";

const solo = { tier: "solo", activeStaffCount: 1 };
const team = { tier: "studio", activeStaffCount: 4 };

assert.equal(isSoloOperator(solo), true);
assert.equal(isSoloOperator(team), false);
assert.equal(isSoloOperator({ tier: "solo", activeStaffCount: 2 }), false);

const lashSolo = resolveOperatorExperience({
  signals: solo,
  vertical: "beauty",
  subverticalProfileId: "beauty.lash",
  businessName: "Lash Loft",
});

assert.equal(lashSolo.soloMode, true);
assert.equal(lashSolo.segmentLabel, "Lash studio");
assert.ok(lashSolo.livPitch.includes("lash") || lashSolo.livPitch.includes("Liv"));
assert.equal(lashSolo.firstRunSteps[0]?.href, "/services");
assert.ok(lashSolo.firstRunSteps.every((s) => s.href !== "/staff"));
assert.ok(lashSolo.livOpsStarters.length >= 2);

const studio = resolveOperatorExperience({
  signals: team,
  vertical: "hair",
  subverticalProfileId: "hair.salon",
});

assert.equal(studio.soloMode, false);
assert.equal(studio.firstRunSteps[0]?.href, "/staff");

const quietSolo = resolveSoloOwnerHomeFallback(solo, {
  pendingCount: 0,
  handedOffCount: 0,
  todayBookings: 0,
  weekBookings: 0,
});
assert.equal(quietSolo?.href, "/my-livia");

const busySolo = resolveSoloOwnerHomeFallback(solo, {
  pendingCount: 1,
  handedOffCount: 0,
  todayBookings: 0,
  weekBookings: 0,
});
assert.equal(busySolo, null);

console.log("operator-experience-policy.test.ts OK");
