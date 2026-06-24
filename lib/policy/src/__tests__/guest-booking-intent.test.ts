import assert from "node:assert/strict";
import {
  guestTimeOfDayLabel,
  parseGuestTimeOfDayPreference,
  pickSlotForGuestPreference,
  resolveGuestBookingDateHint,
  slotMatchesTimeOfDay,
} from "../guest-booking-intent";

assert.equal(parseGuestTimeOfDayPreference("Hi, can I book tomorrow afternoon?"), "afternoon");
assert.equal(parseGuestTimeOfDayPreference("morning slot please"), "morning");
assert.equal(parseGuestTimeOfDayPreference("evening appointment"), "evening");
assert.equal(parseGuestTimeOfDayPreference("book a haircut"), null);

const tz = "Europe/Dublin";
const morning = "2026-06-24T08:00:00.000Z";
const afternoon = "2026-06-24T13:00:00.000Z";
assert.equal(slotMatchesTimeOfDay(morning, tz, "morning"), true);
assert.equal(slotMatchesTimeOfDay(morning, tz, "afternoon"), false);
assert.equal(slotMatchesTimeOfDay(afternoon, tz, "afternoon"), true);

const slots = [{ startAt: morning }, { startAt: afternoon }];
assert.equal(
  pickSlotForGuestPreference(slots, "afternoon", tz)?.startAt,
  afternoon,
);
assert.equal(pickSlotForGuestPreference(slots, null, tz)?.startAt, morning);
assert.equal(guestTimeOfDayLabel("afternoon"), "afternoon");

const date = resolveGuestBookingDateHint("tomorrow afternoon", {
  now: new Date("2026-06-23T12:00:00.000Z"),
  timezone: tz,
});
assert.equal(date, "2026-06-24");

console.log("guest-booking-intent.test.ts OK");
