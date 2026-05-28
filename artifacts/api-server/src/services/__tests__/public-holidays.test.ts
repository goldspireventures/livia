import assert from "node:assert/strict";
import { isPublicHolidayClosed, upcomingPublicHolidays } from "@workspace/policy";

const stPatricks = isPublicHolidayClosed("IE", "2026-03-17");
assert.ok(stPatricks);
assert.equal(stPatricks?.closed, true);

assert.equal(isPublicHolidayClosed("IE", "2026-03-18"), null);

const dk = upcomingPublicHolidays("DK", "2026-01-01", 3);
assert.ok(dk.length > 0);
assert.ok(dk.every((h) => h.date >= "2026-01-01"));

const de = isPublicHolidayClosed("DE", "2026-12-25");
assert.ok(de);

console.log("public-holidays.test.ts: ok");
