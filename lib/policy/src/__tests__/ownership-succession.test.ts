import assert from "node:assert/strict";
import {
  OWNERSHIP_SUCCESSION,
  countOwnershipEligibleSuccessors,
  formatLifecycleRosterVsSignIn,
  isOwnershipIncomingRole,
  shouldSuggestOwnershipSuccession,
  sortOwnershipCandidates,
} from "../ownership-succession";

assert.ok(OWNERSHIP_SUCCESSION.panelTitle.length > 0);
assert.ok(OWNERSHIP_SUCCESSION.errors.INCOMING_NOT_MEMBER.includes("sign-in"));
assert.equal(isOwnershipIncomingRole("ADMIN"), true);
assert.equal(isOwnershipIncomingRole("STAFF"), true);
assert.equal(isOwnershipIncomingRole("OWNER"), false);

assert.equal(
  countOwnershipEligibleSuccessors(
    [
      { userId: "owner", role: "OWNER" },
      { userId: "a", role: "ADMIN" },
      { userId: "b", role: "STAFF" },
    ],
    "owner",
  ),
  2,
);

assert.equal(shouldSuggestOwnershipSuccession(0), false);
assert.equal(shouldSuggestOwnershipSuccession(1), true);

const sorted = sortOwnershipCandidates([
  { role: "STAFF", id: 1 },
  { role: "ADMIN", id: 2 },
]);
assert.equal(sorted[0]?.role, "ADMIN");

assert.ok(formatLifecycleRosterVsSignIn(3, 0).includes("calendar"));
assert.ok(formatLifecycleRosterVsSignIn(3, 2).includes("signed in"));
