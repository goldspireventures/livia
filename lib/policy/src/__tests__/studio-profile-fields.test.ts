import { describe, expect, it } from "vitest";
import { studioProfileFieldsForVertical } from "../studio-profile-fields";

describe("studioProfileFieldsForVertical", () => {
  it("beauty keeps Instagram in contact section", () => {
    const fields = studioProfileFieldsForVertical("beauty");
    expect(fields.some((f) => f.id === "instagramHandle")).toBe(true);
    expect(fields.find((f) => f.id === "description")?.label).toMatch(/tagline/i);
  });

  it("medspa omits Instagram", () => {
    const fields = studioProfileFieldsForVertical("medspa");
    expect(fields.some((f) => f.id === "instagramHandle")).toBe(false);
    expect(fields.find((f) => f.id === "name")?.label).toMatch(/clinic/i);
  });

  it("wellness omits Instagram", () => {
    const fields = studioProfileFieldsForVertical("wellness");
    expect(fields.some((f) => f.id === "instagramHandle")).toBe(false);
  });
});
