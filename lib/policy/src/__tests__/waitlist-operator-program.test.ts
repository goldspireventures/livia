import assert from "node:assert/strict";
import {
  LIV_WAITLIST_NUDGE_THRESHOLD,
  resolveLivWaitlistNudgeCopy,
  shouldShowLivWaitlistNudge,
} from "../waitlist-operator-program";

assert.equal(LIV_WAITLIST_NUDGE_THRESHOLD, 3);
assert.equal(shouldShowLivWaitlistNudge(0), false);
assert.equal(shouldShowLivWaitlistNudge(2), false);
assert.equal(shouldShowLivWaitlistNudge(3), true);
assert.equal(shouldShowLivWaitlistNudge(5), true);

const copy = resolveLivWaitlistNudgeCopy(3);
assert.match(copy.line, /3 guests waiting/);
assert.match(copy.subline, /Liv will text them/);

const one = resolveLivWaitlistNudgeCopy(1);
assert.match(one.line, /1 guest waiting/);

console.log("waitlist-operator-program.test.ts ok");
