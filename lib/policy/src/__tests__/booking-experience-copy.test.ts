import assert from "node:assert/strict";
import {
  PENDING_REASON_CODES,
  pendingReasonLabel,
  pendingApprovalGuidance,
  bookingExperienceCopy,
  publicAwaitingContinuityHoldLines,
  resolvePendingReasonCode,
} from "../booking-experience-copy";

assert.equal(
  resolvePendingReasonCode({
    status: "PENDING",
    pendingReason: null,
    source: "web",
    aiCanBookDirectly: false,
  }),
  PENDING_REASON_CODES.AWAITING_STAFF_CONFIRM,
);

assert.equal(
  pendingReasonLabel(PENDING_REASON_CODES.AWAITING_CONTINUITY, "wellness"),
  "Waiting for guest reply (health notes or arrival confirmation)",
);
assert.ok(
  !pendingReasonLabel(PENDING_REASON_CODES.AWAITING_CONTINUITY, "wellness").includes("photos"),
);
assert.equal(
  pendingReasonLabel(PENDING_REASON_CODES.AWAITING_CONTINUITY, "hair"),
  "Waiting for guest reply (photos or confirmation)",
);

const wellnessDetail = bookingExperienceCopy("wellness");
assert.equal(wellnessDetail.detailPageTitle, "Session detail");
assert.equal(wellnessDetail.partyCardTitle, "Guest & session");
assert.equal(wellnessDetail.statusActions.NO_SHOW, "Did not arrive");

assert.ok(
  publicAwaitingContinuityHoldLines("wellness")[1].includes("health"),
);
assert.ok(
  publicAwaitingContinuityHoldLines("hair")[2].includes("salon"),
);

assert.match(
  pendingApprovalGuidance(PENDING_REASON_CODES.AWAITING_CONTINUITY, "wellness"),
  /health notes|follow up/i,
);

console.log("booking-experience-copy.test.ts ok");
