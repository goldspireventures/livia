/**
 * Dual-entry UAT — guest (My Livia) + operator (Clerk) paths.
 * Simulates what native mobile and web must both support.
 *
 *   pnpm test:e2e:uat-dual-entry
 */
import { test, expect, devices } from "@playwright/test";
import {
  apiBase,
  assertHealthyPage,
  demoCanSignIn,
  demoHasBusiness,
  dismissPlatformTour,
  ensureDemoProvisioned,
  signInBusiness,
} from "../helpers/demo-auth";
import {
  DEMO_GUEST_PHONE,
  guestHubMe,
  guestHubToken,
  guestShopRelationship,
  patchGuestPreferredChannel,
} from "../helpers/guest-hub-auth";

test.describe("Dual entry — guest API (mobile + web spine)", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("Mary OTP → hub token → /me shops", async ({ request }) => {
    const hubToken = await guestHubToken(request);
    const view = await guestHubMe(request, hubToken);
    expect(view.phoneE164.replace(/\s/g, "")).toContain("353871000001");
    expect(view.shops.length).toBeGreaterThan(5);
  });

  test("guest preferred channel persists", async ({ request }) => {
    const hubToken = await guestHubToken(request);
    await patchGuestPreferredChannel(request, hubToken, "SMS");
    const view = await guestHubMe(request, hubToken);
    expect(view.preferredModality).toBe("SMS");
    await patchGuestPreferredChannel(request, hubToken, "ANY");
    const reset = await guestHubMe(request, hubToken);
    expect(reset.preferredModality).toBe("ANY");
  });

  test("body-art shop exposes proof artifacts for Mary", async ({ request }) => {
    const hubToken = await guestHubToken(request);
    const rel = await guestShopRelationship(request, hubToken, "ink-anchor-galway");
    const proofs = rel.verticalArtifacts?.proofs;
    expect(Array.isArray(proofs) ? proofs.length : 0).toBeGreaterThan(0);
  });

  test("tenant-experience is agnostic — guest hub has no Clerk", async ({ request }) => {
    const hubToken = await guestHubToken(request);
    const res = await request.get(`${apiBase}/api/me/tenant-experience`, {
      headers: { "X-Guest-Hub-Token": hubToken },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("Dual entry — guest web /my", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("hub home shows channel picker after OTP session", async ({ page, request }) => {
    const hubToken = await guestHubToken(request);
    await page.goto("/my", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.evaluate((t) => localStorage.setItem("livia_guest_hub_token", t), hubToken);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("guest-hub-home")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("guest-hub-account-settings")).toBeVisible();
    await expect(page.getByTestId("guest-channel-select")).toBeVisible();
    await page.getByTestId("guest-channel-select").click();
    await page.getByRole("option", { name: /text message/i }).click();
    await page.getByTestId("guest-channel-save").click();
    await page.waitForTimeout(500);
    const me = await request.get(`${apiBase}/api/public/guest-hub/me`, {
      headers: { "X-Guest-Hub-Token": hubToken },
    });
    expect(me.ok()).toBeTruthy();
    const body = (await me.json()) as { preferredModality?: string };
    expect(body.preferredModality).toBe("SMS");
  });

  test("visit manage + message studio (interactive guest surface)", async ({ page, request }) => {
    const hubToken = await guestHubToken(request);
    const view = await guestHubMe(request, hubToken);
    const upcoming = view.upcomingBookings[0];
    if (!upcoming) {
      test.skip(true, "no upcoming — re-run demo:provision");
    }
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await page.evaluate((t) => localStorage.setItem("livia_guest_hub_token", t), hubToken);
    await page.goto(upcoming!.visitUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await expect(page.getByTestId("guest-hub-visit-manage")).toBeVisible({ timeout: 20_000 });
    const msg = page.getByPlaceholder(/running late|question/i);
    if (await msg.isVisible().catch(() => false)) {
      await msg.fill("E2E — on my way, thanks!");
      const send = page.getByRole("button", { name: /send/i }).first();
      if (await send.isVisible().catch(() => false)) {
        await send.click();
      }
    }
  });

  test("mobile viewport /my loads vault (guest on-the-go)", async ({ browser, request }) => {
    const hubToken = await guestHubToken(request);
    const ctx = await browser.newContext({
      ...devices["iPhone 13"],
      baseURL: process.env.E2E_DASHBOARD_BASE ?? "http://127.0.0.1:5173",
    });
    const page = await ctx.newPage();
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await page.evaluate((t) => localStorage.setItem("livia_guest_hub_token", t), hubToken);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("guest-hub-home")).toBeVisible({ timeout: 20_000 });
    await ctx.close();
  });
});

test.describe("Dual entry — operator Clerk path", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("wellness owner — dashboard skin + tenant vocabulary", async ({ page, request }) => {
    const slug = "harbour-wellness-cork";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    if (!(await demoCanSignIn(request, slug))) test.skip(true, "Clerk unavailable");
    await signInBusiness(page, slug);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await dismissPlatformTour(page);
    await assertHealthyPage(page, "/dashboard");
    const wellnessSurface = page.locator(
      "[data-testid='wellness-morph-today-atrium'], [data-testid='wellness-morph-today-timeline'], [data-testid='wellness-morph-today-ledger'], [data-testid='owner-home-ritual']",
    );
    await expect(wellnessSurface.first()).toBeVisible({ timeout: 25_000 });
    const body = await page.locator("body").innerText();
    expect(body.toLowerCase()).not.toMatch(/\bsalon\b/);
    expect(body.toLowerCase()).toMatch(/wellness|spa|treatment|session|harbour/i);
  });

  test("owner inbox loads — Liv continuity surface", async ({ page, request }) => {
    const slug = "bloom-beauty-dublin";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    if (!(await demoCanSignIn(request, slug))) test.skip(true, "Clerk unavailable");
    await signInBusiness(page, slug);
    await page.goto("/inbox", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await dismissPlatformTour(page);
    await assertHealthyPage(page, "/inbox");
    await expect(page.locator("body")).toBeVisible();
  });

  test("notification bell visible for signed-in owner", async ({ page, request }) => {
    const slug = "luxe-salon-spa";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    if (!(await demoCanSignIn(request, slug))) test.skip(true, "Clerk unavailable");
    await signInBusiness(page, slug);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await dismissPlatformTour(page);
    const bell = page.getByRole("button", { name: "Notifications" }).last();
    await expect(bell).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("Dual entry — public book without either login", () => {
  test("guest books path loads for Mary phone context", async ({ page, request }) => {
    await ensureDemoProvisioned(request);
    const slug = "bloom-beauty-dublin";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    const phone = encodeURIComponent(DEMO_GUEST_PHONE);
    const ctx = await request.get(`${apiBase}/api/public/b/${slug}/guest-context?phone=${phone}`);
    expect(ctx.ok()).toBeTruthy();
    await page.goto(`/book/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await assertHealthyPage(page, `/book/${slug}`);
  });
});
