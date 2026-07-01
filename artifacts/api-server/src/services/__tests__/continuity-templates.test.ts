import {
  CONTINUITY_TEMPLATES,
  getContinuityTemplate,
  type BusinessVertical,
} from "@workspace/policy";
import assert from "node:assert/strict";

const VERTICALS = Object.keys(CONTINUITY_TEMPLATES) as BusinessVertical[];

const sampleArgs = {
  businessName: "Aurora Studio",
  serviceName: "Cut & colour",
  staffDisplayName: "Lara",
  startAtLocal: "Tue 11 Jun, 10:30",
  bookingRef: "ABC123",
  instagramHandle: "aurorastudio",
};

for (const vertical of VERTICALS) {
  const tpl = CONTINUITY_TEMPLATES[vertical];
  assert.ok(tpl, `missing template for ${vertical}`);
  const sms = tpl.smsBody(sampleArgs);
  assert.ok(sms.length > 20, `${vertical} smsBody too short`);
  assert.ok(tpl.publicNextSteps(sampleArgs).length >= 1, `${vertical} publicNextSteps`);
}

for (const vertical of VERTICALS) {
  const de = getContinuityTemplate(vertical, "de-DE");
  assert.ok(de.smsBody(sampleArgs).length > 10, `${vertical} de locale`);
}

const alliedPending = getContinuityTemplate("allied-health").smsBody({
  ...sampleArgs,
  bookingStatus: "PENDING",
});
assert.ok(alliedPending.includes("requested"), "allied-health pending uses request copy");
assert.ok(!alliedPending.match(/You're booked/i), "allied-health pending must not say booked");

const alliedConfirmed = getContinuityTemplate("allied-health").smsBody({
  ...sampleArgs,
  bookingStatus: "CONFIRMED",
});
assert.ok(alliedConfirmed.includes("You're booked"), "allied-health confirmed uses booked copy");

console.log("continuity-templates.test.ts: ok");
