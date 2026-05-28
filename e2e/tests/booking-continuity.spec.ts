import { test, expect } from "@playwright/test";
import { bookPublicSlot } from "../helpers/public-book.js";

/**
 * Booking continuity — public book returns next steps when API is up.
 * Requires dashboard dev server + API + seeded demo slug.
 */
test.describe("Booking continuity", () => {
  test("public book response includes nextSteps array", async ({ request }) => {
    const slug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";
    const suffix = Date.now().toString().slice(-6);

    const bookRes = await bookPublicSlot(
      request,
      slug,
      {
        customerFirstName: "E2E",
        customerLastName: "Continuity",
        customerPhone: `+35387${suffix}`,
        customerEmail: `e2e-continuity-${suffix}@test.livia.local`,
      },
      { workerIndex: test.info().workerIndex },
    );
    if (!bookRes) {
      test.skip(true, "No bookable slot in the next 4 weeks");
      return;
    }
    if (!bookRes.ok() && bookRes.status() === 404) {
      test.skip(true, "API or demo business unavailable");
      return;
    }

    expect(bookRes.ok()).toBeTruthy();
    const body = await bookRes.json();
    expect(body.bookingId).toBeTruthy();
    expect(Array.isArray(body.nextSteps)).toBe(true);
    expect(body.nextSteps.length).toBeGreaterThan(0);
  });
});
