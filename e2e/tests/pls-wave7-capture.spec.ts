/**
 * PLS Wave 7 — Pack I: owner ops depth (detail routes, lifecycle, settings tabs, inbox thread).
 *
 *   pnpm pls:wave7
 */
import { test, expect } from "@playwright/test";
import { PlsCaptureRun, mergeManifest, plsOutRoot, slugifyRoute } from "../helpers/pls-capture";
import {
  dismissPlatformTour,
  ensureDemoProvisioned,
  resetDemoBrowserSession,
  signInBusiness,
  signInDemoPersona,
  demoCanSignIn,
  demoHasBusiness,
} from "../helpers/demo-auth";

const { date: runDate, dir: OUT_ROOT } = plsOutRoot(7);
let run: PlsCaptureRun;

const OWNER_SLUG = "bloom-beauty-dublin";
const OWNER_ROUTES = [
  "/dashboard",
  "/inbox",
  "/bookings",
  "/bookings/new",
  "/customers",
  "/staff",
  "/services",
  "/lifecycle",
  "/audit",
  "/toolkit",
  "/settings",
] as const;

const OWNER_SETTINGS_TABS = ["account", "shop", "appearance", "liv", "comms", "billing", "legal"] as const;

const FOUNDER_ROUTES = [
  "/chain",
  "/dashboard",
  "/bookings?create=1",
  "/lifecycle",
  "/audit",
  "/onboarding",
] as const;

test.describe("PLS Wave 7 — owner ops depth (Pack I)", () => {
  test.describe.configure({ mode: "serial", timeout: 1_200_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    run = new PlsCaptureRun(7, OUT_ROOT, runDate);
  });

  test.afterAll(() => {
    run.flush();
    mergeManifest(7, runDate);
  });

  test("I — owner core routes", async ({ page, request }) => {
    if (!(await demoHasBusiness(request, OWNER_SLUG)) || !(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "bloom owner unavailable");
    }
    await resetDemoBrowserSession(page);
    await signInBusiness(page, OWNER_SLUG, { resetSession: true });
    await dismissPlatformTour(page);

    for (const route of OWNER_ROUTES) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `I-owner-${slugifyRoute(route)}`,
        persona: "owner",
        surface: "dashboard",
        route,
      });
    }
  });

  test("I — owner settings all tabs", async ({ page, request }) => {
    if (!(await demoHasBusiness(request, OWNER_SLUG)) || !(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "bloom owner unavailable");
    }
    await resetDemoBrowserSession(page);
    await signInBusiness(page, OWNER_SLUG, { resetSession: true });

    for (const tab of OWNER_SETTINGS_TABS) {
      await page.goto(`/settings?tab=${tab}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `I-owner-settings-${tab}`,
        persona: "owner",
        surface: "dashboard",
        route: `/settings?tab=${tab}`,
      });
    }
  });

  test("I — owner detail surfaces", async ({ page, request }) => {
    if (!(await demoHasBusiness(request, OWNER_SLUG)) || !(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "bloom owner unavailable");
    }
    await resetDemoBrowserSession(page);
    await signInBusiness(page, OWNER_SLUG, { resetSession: true });

    await page.goto("/bookings", { waitUntil: "domcontentloaded", timeout: 45_000 });
    const bookingRow = page.locator('[data-testid^="row-booking-"]').first();
    if (await bookingRow.isVisible().catch(() => false)) {
      await bookingRow.click();
      await page.waitForURL(/\/bookings\//, { timeout: 15_000 }).catch(() => undefined);
      await run.capture(page, {
        scenarioId: "I-owner-booking-detail",
        persona: "owner",
        surface: "dashboard",
        route: "/bookings/:id",
      });
    }

    await page.goto("/customers", { waitUntil: "domcontentloaded", timeout: 45_000 });
    const customerLink = page.locator('a[href^="/customers/"]').first();
    if (await customerLink.isVisible().catch(() => false)) {
      await customerLink.click();
      await run.capture(page, {
        scenarioId: "I-owner-customer-detail",
        persona: "owner",
        surface: "dashboard",
        route: "/customers/:id",
      });
    }

    await page.goto("/staff", { waitUntil: "domcontentloaded", timeout: 45_000 });
    const staffLink = page.locator('a[href^="/staff/"]').first();
    if (await staffLink.isVisible().catch(() => false)) {
      await staffLink.click();
      await run.capture(page, {
        scenarioId: "I-owner-staff-detail",
        persona: "owner",
        surface: "dashboard",
        route: "/staff/:id",
      });
    }
  });

  test("I — inbox thread open", async ({ page, request }) => {
    if (!(await demoHasBusiness(request, OWNER_SLUG)) || !(await demoCanSignIn(request, OWNER_SLUG))) {
      test.skip(true, "bloom owner unavailable");
    }
    await resetDemoBrowserSession(page);
    await signInBusiness(page, OWNER_SLUG, { resetSession: true });
    await page.goto("/inbox", { waitUntil: "domcontentloaded", timeout: 45_000 });
    const thread = page.locator('[data-testid^="inbox-thread-"]').first();
    if (await thread.isVisible().catch(() => false)) {
      await thread.click();
      await page.waitForTimeout(700);
      await run.capture(page, {
        scenarioId: "I-owner-inbox-thread",
        persona: "owner",
        surface: "dashboard",
        route: "/inbox#thread",
      });
    } else {
      await run.capture(page, {
        scenarioId: "I-owner-inbox-empty",
        persona: "owner",
        surface: "dashboard",
        route: "/inbox",
      });
    }
  });

  test("I — founder ops depth", async ({ page }) => {
    await resetDemoBrowserSession(page);
    await signInDemoPersona(page, "org_admin");

    for (const route of FOUNDER_ROUTES) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `I-founder-${slugifyRoute(route)}`,
        persona: "founder",
        surface: "dashboard",
        route,
      });
    }

    await page.goto("/chain", { waitUntil: "domcontentloaded" });
    const borrowInput = page.getByPlaceholder("Staff member ID from roster");
    if (await borrowInput.isVisible().catch(() => false)) {
      await borrowInput.fill("demo-staff-id");
      await run.capture(page, {
        scenarioId: "I-founder-chain-borrow-form",
        persona: "founder",
        surface: "dashboard",
        route: "/chain#staff-borrow",
      });
    }
  });

  test("I — help support ticket submit", async ({ page, request }) => {
    const slug = "bloom-beauty-dublin";
    if (!(await demoHasBusiness(request, slug)) || !(await demoCanSignIn(request, slug))) {
      test.skip(true, "bloom owner unavailable");
    }
    await resetDemoBrowserSession(page);
    await signInBusiness(page, slug, { resetSession: true });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 45_000 });
    const help = page.getByTestId("help-support-trigger").first();
    if (!(await help.isVisible().catch(() => false))) {
      await page.goto("/inbox", { waitUntil: "domcontentloaded" });
    }
    const helpRetry = page.getByTestId("help-support-trigger").first();
    await expect(helpRetry).toBeVisible({ timeout: 15_000 });
    await helpRetry.click();
    await expect(page.getByTestId("help-support-dialog")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("help-description").fill("PLS wave 7 — automated support ticket exercise for ops depth.");
    await page.locator("#consent").check();
    await page.getByRole("button", { name: /send message/i }).click();
    await page.waitForTimeout(2000);
    await run.capture(page, {
      scenarioId: "I-owner-help-submitted",
      persona: "owner",
      surface: "dashboard",
      route: "/dashboard#help-submitted",
    });
  });

  test("content audit summary", async () => {
    const failed = run.contentFailures();
    if (failed.length > 0) {
      console.log("\nPLS Wave 7 content failures:");
      for (const f of failed) console.log(`  ${f.scenarioId}: ${f.contentHits.join(", ")}`);
    }
    expect(failed, `Leaked copy on ${failed.length} screen(s)`).toHaveLength(0);
  });
});
