import assert from "node:assert/strict";
import {
  PENDING_REASON_CODES,
  pendingReasonLabel,
  pendingApprovalGuidance,
  livPendingAutoConfirmBlocker,
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
  resolvePendingReasonCode({
    status: "PENDING",
    source: "web",
    depositRequired: true,
    depositPaidEurCents: 0,
    bookingContinuityEnabled: true,
    customerHasPhone: true,
  }),
  PENDING_REASON_CODES.AWAITING_DEPOSIT,
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
  "Waiting for client to confirm in messages",
);

const wellnessDetail = bookingExperienceCopy("wellness");
assert.equal(wellnessDetail.detailPageTitle, "Session detail");
assert.equal(wellnessDetail.partyCardTitle, "Guest & session");
assert.equal(wellnessDetail.statusActions.NO_SHOW, "Did not arrive");

const hairDetail = bookingExperienceCopy("hair");
assert.equal(hairDetail.detailPageTitle, "Appointment detail");
assert.equal(hairDetail.continuityPanelTitle, "Client messages");

assert.ok(
  publicAwaitingContinuityHoldLines("wellness")[1].includes("health"),
);
assert.ok(
  publicAwaitingContinuityHoldLines("hair")[1].includes("style notes"),
);
assert.ok(
  !publicAwaitingContinuityHoldLines("hair")[1].toLowerCase().includes("photo"),
);

assert.match(
  pendingApprovalGuidance(PENDING_REASON_CODES.AWAITING_CONTINUITY, "wellness"),
  /health notes|follow up/i,
);

assert.match(
  livPendingAutoConfirmBlocker(PENDING_REASON_CODES.AWAITING_DEPOSIT, "beauty") ?? "",
  /deposit/i,
);
assert.ok(
  !(
    livPendingAutoConfirmBlocker(PENDING_REASON_CODES.AWAITING_CONTINUITY, "hair") ?? ""
  ).includes("continuity thread"),
);

console.log("booking-experience-copy.test.ts ok");
