import assert from "node:assert/strict";
import { businessVerticalSchema } from "../types";
import { businessVocabulary } from "../vocabulary";
import {
  OWNER_HOME_TODAY_SCHEDULE_PREVIEW_LIMIT,
  sliceOwnerHomeSchedulePreview,
} from "../owner-home-bookings";

for (const vertical of businessVerticalSchema.options) {
  const vocab = businessVocabulary(vertical, null);
  assert.ok(vocab.ownerTodayScheduleTitle.length > 0, `${vertical} ownerTodayScheduleTitle`);
  assert.ok(vocab.ownerTodayScheduleCalendarCta.length > 0, `${vertical} ownerTodayScheduleCalendarCta`);
}

const preview = sliceOwnerHomeSchedulePreview(
  [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
  OWNER_HOME_TODAY_SCHEDULE_PREVIEW_LIMIT,
);
assert.equal(preview.visible.length, 3);
assert.equal(preview.hiddenCount, 1);
assert.equal(preview.totalCount, 4);
