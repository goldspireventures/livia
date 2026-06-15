import assert from "node:assert/strict";
import { businessVerticalSchema } from "../types";
import {
  PENDING_REASON_CODES,
  livPendingAutoConfirmBlocker,
  pendingApprovalGuidance,
  pendingReasonLabel,
} from "../booking-experience-copy";

const FORBIDDEN_CROSS_VERTICAL = [
  "continuity thread",
  "photos or confirmation",
  "hasn't confirmed photos",
];

for (const vertical of businessVerticalSchema.options) {
  const continuityLabel = pendingReasonLabel(
    PENDING_REASON_CODES.AWAITING_CONTINUITY,
    vertical,
  );
  const continuityGuidance = pendingApprovalGuidance(
    PENDING_REASON_CODES.AWAITING_CONTINUITY,
    vertical,
  );
  const livBlocker =
    livPendingAutoConfirmBlocker(PENDING_REASON_CODES.AWAITING_CONTINUITY, vertical) ?? "";

  assert.ok(continuityLabel.length > 10, `${vertical} awaiting_continuity label`);
  assert.ok(continuityGuidance.length > 10, `${vertical} awaiting_continuity guidance`);
  assert.ok(livBlocker.length > 10, `${vertical} liv continuity blocker`);

  for (const bad of FORBIDDEN_CROSS_VERTICAL) {
    assert.ok(
      !continuityLabel.toLowerCase().includes(bad),
      `${vertical} label must not include "${bad}": ${continuityLabel}`,
    );
    assert.ok(
      !continuityGuidance.toLowerCase().includes(bad),
      `${vertical} guidance must not include "${bad}"`,
    );
    assert.ok(
      !livBlocker.toLowerCase().includes(bad),
      `${vertical} liv blocker must not include "${bad}"`,
    );
  }
}

assert.equal(
  pendingReasonLabel(PENDING_REASON_CODES.AWAITING_CONTINUITY, "hair"),
  "Waiting for client to confirm in messages",
);
assert.ok(
  !pendingReasonLabel(PENDING_REASON_CODES.AWAITING_CONTINUITY, "hair").toLowerCase().includes("photo"),
);
assert.ok(
  pendingReasonLabel(PENDING_REASON_CODES.AWAITING_CONTINUITY, "body-art").includes("design"),
);
assert.ok(
  pendingReasonLabel(PENDING_REASON_CODES.AWAITING_CONTINUITY, "beauty").includes("patch test"),
);
assert.ok(
  !pendingReasonLabel(PENDING_REASON_CODES.AWAITING_CONTINUITY, "wellness").toLowerCase().includes("photo"),
);

console.log("vertical-pending-copy-coverage.test.ts ok");
