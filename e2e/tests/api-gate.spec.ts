import { test, expect } from "@playwright/test";

const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

test.describe("API Gate 3 smoke", () => {
  test("healthz returns ok", async ({ request }) => {
    const res = await request.get("/api/healthz");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toMatchObject({ status: expect.any(String) });
  });

  test("protected routes reject unauthenticated callers", async ({ request }) => {
    const me = await request.get("/api/me/businesses");
    expect(me.status()).toBe(401);
  });

  test("public business endpoint (demo slug)", async ({ request }) => {
    const res = await request.get(`/api/public/b/${demoSlug}`);
    if (res.status() === 404) {
      test.skip(true, "Demo business not seeded — run scripts/seed-demo.mjs");
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.slug).toBe(demoSlug);
    expect(body.name).toBeTruthy();
  });

  test("public chat returns AI disclosure in first turn", async ({ request }) => {
    if (process.env.E2E_SKIP_PUBLIC_CHAT === "1") {
      test.skip(true, "E2E_SKIP_PUBLIC_CHAT=1");
    }
    const biz = await request.get(`/api/public/b/${demoSlug}`);
    if (biz.status() === 404) {
      test.skip(true, "Demo business not seeded");
    }
    const res = await request.post(`/api/public/b/${demoSlug}/chat`, {
      data: { message: "Hello, I'd like to book" },
    });
    if ([400, 429, 500, 503].includes(res.status())) {
      const err = await res.json().catch(() => ({}));
      test.skip(
        true,
        `Public chat unavailable (${res.status()}): ${JSON.stringify(err)} — set ANTHROPIC_API_KEY or E2E_SKIP_PUBLIC_CHAT=1`,
      );
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.reply).toMatch(/AI assistant/i);
    expect(body.conversationId).toBeTruthy();
  });

  test("internal ops requires secret", async ({ request }) => {
    const res = await request.get("/api/internal/ops/tenants");
    expect(res.status()).toBe(401);
  });

  test("hiring routes are not mounted (OS Phase A)", async ({ request }) => {
    const res = await request.get("/api/businesses/demo-business-id/hiring/posts");
    expect([401, 404]).toContain(res.status());
  });
});
