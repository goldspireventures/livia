import assert from "node:assert/strict";
import {
  liviaSlugFromBookingUrl,
  resolveBookingMirrorCapability,
} from "../booking-url-mirror-program";

const livia = resolveBookingMirrorCapability("https://app.livia-hq.com/book/demo-salon");
assert.equal(livia.platform, "livia");
assert.equal(livia.services, true);
assert.equal(livia.clients, false);

assert.equal(liviaSlugFromBookingUrl("https://x.com/book/demo-salon"), "demo-salon");
assert.equal(liviaSlugFromBookingUrl("https://x.com/b/demo-salon"), "demo-salon");

const booksy = resolveBookingMirrorCapability("https://booksy.com/en-us/s/foo");
assert.equal(booksy.platform, "booksy");
assert.ok(booksy.honestLimit.includes("CSV"));

console.log("booking-url-mirror-program.test.ts ok");
