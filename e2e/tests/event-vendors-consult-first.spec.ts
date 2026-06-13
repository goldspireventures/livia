/**
 * Event vendors consult-first — public enquire + quote API smoke.
 *
 *   pnpm --filter @workspace/e2e exec playwright test tests/event-vendors-consult-first.spec.ts --project=api
 */
import { test, expect } from "@playwright/test";
import { ensureDemoProvisioned, apiBase } from "../helpers/demo-auth";

const SLUG = "atelier-decor-dublin";

test.describe("Event vendors consult-first", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 }).catch(() => undefined);
  });

  test("public site exposes blocked dates and gallery", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/public/${SLUG}/site`);
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { site: { blockedDates: string[]; gallery: unknown[] } };
    expect(Array.isArray(body.site.blockedDates)).toBe(true);
    expect(body.site.gallery.length).toBeGreaterThan(0);
  });

  test("public enquire rejects blocked event date", async ({ request }) => {
    const siteRes = await request.get(`${apiBase}/api/public/${SLUG}/site`);
    const site = (await siteRes.json()) as { site: { blockedDates: string[] } };
    const blocked = site.site.blockedDates[0];
    if (!blocked) {
      test.skip(true, "No blocked dates in demo seed");
    }
    const res = await request.post(`${apiBase}/api/public/${SLUG}/enquire`, {
      data: {
        contactName: "Blocked Test",
        contactEmail: "blocked@test.example",
        eventDate: blocked,
        eventType: "birthday",
      },
    });
    expect(res.status()).toBe(404);
  });

  test("public quote returns similar work when token exists", async ({ request }) => {
    const quotesRes = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/quote`);
    if (!quotesRes.ok()) {
      test.skip(true, "No quote token in demo — run demo:repair");
    }
    const { token } = (await quotesRes.json()) as { token: string };
    const res = await request.get(`${apiBase}/api/public/${SLUG}/q/${token}`);
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      similarWork?: unknown[];
      quote: { lines: unknown[] };
    };
    expect(body.quote.lines.length).toBeGreaterThan(0);
    expect(Array.isArray(body.similarWork)).toBe(true);
  });
});
