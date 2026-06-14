import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  guestRetailFulfillmentOptions,
  normalizeGuestRetailFulfillmentMode,
} from "../guest-retail-fulfillment";

describe("guestRetailFulfillmentOptions", () => {
  it("includes at_appointment when booking is linked", () => {
    const opts = guestRetailFulfillmentOptions({
      vertical: "hair",
      hasLinkedBooking: true,
    });
    assert.ok(opts.some((o) => o.mode === "at_appointment"));
    assert.ok(opts.some((o) => o.mode === "ship"));
  });

  it("omits at_appointment without a linked booking", () => {
    const opts = guestRetailFulfillmentOptions({ vertical: "hair" });
    assert.ok(!opts.some((o) => o.mode === "at_appointment"));
  });
});

describe("normalizeGuestRetailFulfillmentMode", () => {
  it("falls back to first allowed mode", () => {
    const opts = guestRetailFulfillmentOptions({ vertical: "hair" });
    assert.equal(normalizeGuestRetailFulfillmentMode("at_appointment", opts), "collect_in_store");
  });
});
