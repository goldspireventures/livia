/**
 * v3 pre-flight — API-only (no browser).
 */
import { test, expect } from "@playwright/test";
import { bookPublicSlot } from "../helpers/public-book.js";

const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";
const secret = process.env.INTERNAL_OPS_SECRET ?? process.env.INTERNAL_CRON_SECRET ?? "";

test.describe("v3 pre-flight — API", () => {
  test("public business includes services and v3 fields", async ({ request }) => {
    const res = await request.get(`/api/public/b/${demoSlug}`);
    if (res.status() === 404) test.skip(true, "Seed demo: pnpm run db:seed");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.slug).toBe(demoSlug);
    expect(body.services?.length).toBeGreaterThan(0);
    expect(body.vertical).toBeTruthy();
    if (body.regulatoryFooter) {
      expect(Array.isArray(body.regulatoryFooter)).toBe(true);
    }
  });

  test("public book returns nextSteps", async ({ request }) => {
    const bizRes = await request.get(`/api/public/b/${demoSlug}`);
    if (!bizRes.ok()) test.skip(true, "Demo not seeded");
    const suffix = Date.now().toString().slice(-6);
    const bookRes = await bookPublicSlot(
      request,
      demoSlug,
      {
        customerFirstName: "Preflight",
        customerLastName: "Test",
        customerPhone: `+35387${suffix}`,
        customerEmail: `preflight-${suffix}@test.livia.local`,
      },
      { workerIndex: test.info().workerIndex },
    );
    if (!bookRes) test.skip(true, "No bookable slot in the next 4 weeks");
    expect(bookRes.ok(), `book failed: ${await bookRes.text()}`).toBeTruthy();
    const body = await bookRes.json();
    expect(body.bookingId).toBeTruthy();
    expect(body.nextSteps?.length).toBeGreaterThan(0);
  });

  test("internal platform health v3 block", async ({ request }) => {
    test.skip(!secret, "INTERNAL_OPS_SECRET required");
    const res = await request.get("/api/internal/ops/platform-health", {
      headers: { "X-Internal-Ops-Secret": secret },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.v3).toBeTruthy();
    expect(body.v3.migrations).toContain("011-v3-pet-grooming-continuity");
  });

  test("internal continuity traces", async ({ request }) => {
    test.skip(!secret, "INTERNAL_OPS_SECRET required");
    const res = await request.get("/api/internal/ops/continuity-traces", {
      headers: { "X-Internal-Ops-Secret": secret },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("partner API rejects missing key", async ({ request }) => {
    const res = await request.get(`/api/partner/v1/businesses/${demoSlug}`);
    expect([401, 403]).toContain(res.status());
  });

  test("demo world ready (provision or sign-in)", async ({ request }) => {
    let signIn = await request.post("/api/demo/sign-in", {
      data: { persona: "org_admin" },
    });
    if (signIn.status() === 503) test.skip(true, "CLERK_SECRET_KEY missing");
    if (signIn.ok()) return;

    const prov = await request.post("/api/demo/provision");
    if (prov.status() === 503) test.skip(true, "CLERK_SECRET_KEY missing");

    signIn = await request.post("/api/demo/sign-in", { data: { persona: "org_admin" } });
    expect(
      signIn.ok(),
      `demo not ready after provision: ${await signIn.text()}`,
    ).toBeTruthy();
  });
});
