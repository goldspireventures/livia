import { describe, expect, it } from "vitest";
import { showBookingResourcesSettings } from "../wedge-gate";

describe("showBookingResourcesSettings", () => {
  it("allows spa and clinic verticals", () => {
    expect(showBookingResourcesSettings("wellness")).toBe(true);
    expect(showBookingResourcesSettings("medspa")).toBe(true);
    expect(showBookingResourcesSettings("allied-health")).toBe(true);
  });

  it("hides chair-based and wedge verticals", () => {
    expect(showBookingResourcesSettings("beauty")).toBe(false);
    expect(showBookingResourcesSettings("hair")).toBe(false);
    expect(showBookingResourcesSettings("body-art")).toBe(false);
  });
});
