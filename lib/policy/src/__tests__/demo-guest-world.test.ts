import assert from "node:assert/strict";
import {
  DEMO_END_CLIENTS,
  DEMO_OPERATOR_EXPERIENCE,
  guestHubDemoBookingNote,
} from "../demo-guest-world";

assert.equal(DEMO_END_CLIENTS.length, 3);
assert.equal(DEMO_END_CLIENTS[0]?.id, "mary");
assert.equal(DEMO_END_CLIENTS[1]?.phoneE164, "+353871000002");
assert.ok(DEMO_END_CLIENTS[0]!.linkedSlugs.length >= 9);
assert.ok(DEMO_END_CLIENTS[1]!.linkedSlugs.includes("stoneybatter-cuts"));
assert.ok(DEMO_END_CLIENTS[2]!.packageCreditSlugs?.includes("dundrum-serenity-spa"));

assert.equal(DEMO_OPERATOR_EXPERIENCE.soloBarber.tier, "solo");
assert.equal(DEMO_OPERATOR_EXPERIENCE.studioBarber.slug, "dublin-barber-collective");

assert.equal(guestHubDemoBookingNote("Sean Kelly"), "Demo guest hub — Sean Kelly");

console.log("demo-guest-world.test.ts OK");
