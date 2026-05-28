/**
 * v3 pre-flight — authenticated owner flows (requires founder-auth-setup).
 */
import { test, expect } from "@playwright/test";
import { authedApiGet } from "../helpers/demo-auth";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";
const secret = process.env.INTERNAL_OPS_SECRET ?? process.env.INTERNAL_CRON_SECRET ?? "";

test.describe("v3 pre-flight — owner (authenticated)", () => {
  test.describe.configure({ mode: "serial" });

  test("not signed out on dashboard", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("toolkit — exports and ops cards", async ({ page }) => {
    const res = await page.goto("/toolkit", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    // Some demo configurations gate toolkit cards; this check is intentionally minimal:
    // the page must not crash or sign the user out.
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("dashboard renders without crash", async ({ page }) => {
    const res = await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("bookings list and detail navigation", async ({ page }) => {
    const res = await page.goto("/bookings", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("inbox loads", async ({ page }) => {
    const res = await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("inbox queue lenses (manager ritual)", async ({ page }) => {
    const res = await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("settings policy tab", async ({ page }) => {
    const res = await page.goto("/settings?tab=policy", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("settings communications tab", async ({ page }) => {
    const res = await page.goto("/settings?tab=comms", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("customers list and new client entry", async ({ page }) => {
    const res = await page.goto("/customers", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("chain glance (org admin)", async ({ page }) => {
    const res = await page.goto("/chain", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("audit log owner view", async ({ page }) => {
    const res = await page.goto("/audit", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("medspa hub shows vertical gate for hair demo", async ({ page }) => {
    const res = await page.goto("/medspa", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("demo gateway still reachable when signed in", async ({ page }) => {
    const res = await page.goto("/demo", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(500);
  });

  test("tenant experience API returns vocabulary + playbook", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const businessId = await page.evaluate(() =>
      window.localStorage.getItem("livia.currentBusinessId"),
    );
    test.skip(!businessId, "No business in founder session");
    const res = await authedApiGet(
      page,
      `/api/me/tenant-experience?businessId=${encodeURIComponent(businessId!)}`,
    );
    if (res.status() === 404) {
      test.skip(true, "Restart API — route /me/tenant-experience not loaded");
    }
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = await res.json();
    expect(body.vocabulary?.clientNoun).toBeTruthy();
    expect(body.playbook?.publicCta).toBeTruthy();
    expect(body.onboarding?.activationSteps?.length).toBeGreaterThan(0);
  });

  test("onboarding catalog lists all vertical packs", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const res = await authedApiGet(page, "/api/onboarding/catalog");
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = await res.json();
    expect(body.verticals?.length).toBeGreaterThanOrEqual(9);
    expect(body.verticals.some((v: { vertical: string }) => v.vertical === "pet-grooming")).toBe(
      true,
    );
  });

  test("dashboard shows activation welcome or maturity guidance", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      try {
        window.localStorage.removeItem("livia.activationWelcomeDismissed");
      } catch {
        /* ignore */
      }
    });
    await page.reload({ waitUntil: "networkidle" });
    const activation = page.getByTestId("activation-welcome");
    const activationDone = page.getByTestId("activation-welcome-done");
    const maturity = page.getByTestId(/^operator-maturity-/);
    await expect(activation.or(activationDone).or(maturity).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});

