import { test, expect } from "@playwright/test";

const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";
const marketingBase = process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174";

test.describe("EU platform — automated smoke (Phases 1–8)", () => {
  test.describe("Phase 1 — livia.io", () => {
    test.beforeAll(async ({ request }) => {
      try {
        const res = await request.get(`${marketingBase}/pricing`, { timeout: 5000 });
        if (!res.ok()) {
          test.skip(true, "Marketing server not running — pnpm dev:marketing");
        }
      } catch {
        test.skip(true, "Marketing server not running — pnpm dev:marketing");
      }
    });

    test("pricing page loads", async ({ page }) => {
      await page.goto(`${marketingBase}/pricing`);
      await expect(page.getByRole("heading", { name: /pricing/i })).toBeVisible();
      await expect(page.getByText(/€79/)).toBeVisible();
      await expect(page.getByText(/dental/i)).toHaveCount(0);
    });

    test("how-it-works loads", async ({ page }) => {
      await page.goto(`${marketingBase}/how-it-works`);
      await expect(page.getByRole("heading", { name: /how livia works/i })).toBeVisible();
    });

    test("vertical hair loads", async ({ page }) => {
      await page.goto(`${marketingBase}/verticals/hair`);
      await expect(page.getByText(/hair/i).first()).toBeVisible();
    });
  });

  test.describe("Tenant surfaces (dashboard)", () => {
    test("sign-in shell", async ({ page }) => {
      await page.goto("/sign-in");
      await expect(page.locator("body")).toContainText(/sign in|livia/i);
    });

    test("onboarding route shell", async ({ page }) => {
      await page.goto("/onboarding");
      await expect(page.locator("body")).toContainText(/welcome|set up|livia/i);
    });

    test("public booking — customer journey start", async ({ page }) => {
      await page.goto(`/b/${demoSlug}`);
      const notFound = page.getByText(/not found|404/i);
      if (await notFound.isVisible().catch(() => false)) {
        test.skip(true, "Demo business not seeded");
      }
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(/service|book|appointment/i).first()).toBeVisible({
        timeout: 15_000,
      });
    });

    test("demo gateway", async ({ page }) => {
      await page.goto("/demo");
      await expect(page.locator("body")).toContainText(/demo/i);
    });
  });
});

test.describe("API contracts (Phase 0–6)", () => {
  test("healthz", async ({ request }) => {
    const res = await request.get("/api/healthz");
    expect(res.ok()).toBeTruthy();
  });

  test("support tickets require auth", async ({ request }) => {
    const res = await request.post("/api/businesses/00000000-0000-4000-8000-000000000001/support/tickets", {
      data: { category: "bug", description: "test ticket enough chars" },
    });
    if (res.status() === 404) {
      test.skip(true, "support routes not on running API — restart pnpm dev:api after rebuild");
    }
    expect(res.status()).toBe(401);
  });

  test("public business by slug", async ({ request }) => {
    const res = await request.get(`/api/public/b/${demoSlug}`);
    if (res.status() === 404) {
      test.skip(true, "Demo slug not seeded");
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.slug).toBe(demoSlug);
    expect(body.name).toBeTruthy();
  });
});
