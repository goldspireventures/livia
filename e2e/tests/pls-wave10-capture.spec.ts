/**
 * PLS Wave 10 — Pack M/N/O: unhappy matrix, internal execute, Liv learning UI, sacred onboarding.
 *
 *   pnpm pls:wave10
 */
import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PlsCaptureRun, mergeManifest, plsOutRoot, slugifyRoute } from "../helpers/pls-capture";
import { advancePublicBookingToDetails } from "../helpers/pls-depth-helpers";
import { INTERNAL_SURFACE_PATTERNS } from "../../scripts/pls-forbidden-copy.mjs";
import {
  ensureDemoProvisioned,
  resetDemoBrowserSession,
  signInBusiness,
  signInDemoPersona,
  demoCanSignIn,
  demoHasBusiness,
} from "../helpers/demo-auth";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const internalBase = process.env.E2E_INTERNAL_BASE ?? "http://127.0.0.1:5175";
const secret = process.env.INTERNAL_OPS_SECRET ?? process.env.INTERNAL_CRON_SECRET ?? "";
const { date: runDate, dir: OUT_ROOT } = plsOutRoot(10);
let run: PlsCaptureRun;

const internalHeaders = () => ({
  "X-Internal-Ops-Secret": secret,
  "X-Internal-Ops-Operator": "pls-wave10@livia.io",
  "X-Internal-Ops-Role": "engineer",
  Accept: "application/json",
});

async function loginInternal(page: import("@playwright/test").Page) {
  const res = await page.goto(internalBase, { waitUntil: "domcontentloaded", timeout: 20_000 });
  if (!res?.ok()) throw new Error("Internal console not reachable — start pnpm dev:internal");
  await page.locator('input[name="secret"]').fill(secret);
  await page.locator('input[name="operator"]').fill("pls-wave10@livia.io");
  const roleSelect = page.locator('select[name="role"]');
  if (await roleSelect.isVisible().catch(() => false)) {
    await roleSelect.selectOption("engineer");
  }
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForTimeout(1200);
}

test.describe("PLS Wave 10 — unhappy + internal + sacred (Pack M/N/O)", () => {
  test.describe.configure({ mode: "serial", timeout: 1_200_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    run = new PlsCaptureRun(10, OUT_ROOT, runDate);
    await request.post(`${apiBase}/api/dev/pls/fast-forward`, {
      data: { slug: "bloom-beauty-dublin", months: 12, triggerLearning: true },
      timeout: 60_000,
    }).catch(() => undefined);
  });

  test.afterAll(() => {
    run.flush();
    mergeManifest(10, runDate);
  });

  test("N — unhappy guest tokens + OTP fail", async ({ page }) => {
    for (const route of [
      "/b/luxe-salon-spa/pay/not-a-real-token",
      "/b/luxe-salon-spa/visit/not-a-real-token",
      "/b/clarity-medspa-dublin/intake/not-a-real-token",
    ]) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `N-unhappy-${slugifyRoute(route)}`,
        persona: "guest",
        surface: "public-book",
        route,
      });
    }

    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await page.getByTestId("guest-hub-phone").fill("+353000000000");
    await page.getByRole("button", { name: /send verification code/i }).click();
    await page.waitForTimeout(1200);
    await run.capture(page, {
      scenarioId: "N-unhappy-otp-request",
      persona: "guest",
      surface: "guest-hub",
      route: "/my#otp-request",
    });
  });

  test("N — session cleared mid-booking", async ({ page, request, context }) => {
    const slug = "luxe-salon-spa";
    if (!(await demoHasBusiness(request, slug))) test.skip(true, slug);
    const ok = await advancePublicBookingToDetails(page, request, slug);
    if (!ok) test.skip(true, "no slot");
    await context.clearCookies();
    await page.reload({ waitUntil: "domcontentloaded" });
    await run.capture(page, {
      scenarioId: "N-unhappy-mid-book-reload",
      persona: "guest",
      surface: "public-book",
      route: `/b/${slug}#mid-book-reload`,
    });
  });

  test("N — protected routes without session (recheck)", async ({ page }) => {
    await resetDemoBrowserSession(page);
    for (const route of ["/bookings/new", "/lifecycle", "/legal-acceptance"]) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `N-unhappy-anon-${slugifyRoute(route)}`,
        persona: "anonymous",
        surface: "gateway",
        route,
      });
    }
  });

  test("M — onboarding fresh path + Liv learning evidence", async ({ page, request }) => {
    await resetDemoBrowserSession(page);
    await signInDemoPersona(page, "org_admin");
    await page.goto("/onboarding", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await run.capture(page, {
      scenarioId: "M-onboarding-fresh-entry",
      persona: "founder",
      surface: "dashboard",
      route: "/onboarding",
    });
    const fresh = page.getByTestId("migration-intent-fresh");
    if (await fresh.isVisible().catch(() => false)) {
      await fresh.click();
      await page.waitForTimeout(400);
      await run.capture(page, {
        scenarioId: "M-onboarding-fresh-intent",
        persona: "founder",
        surface: "dashboard",
        route: "/onboarding#fresh",
      });
    }

    const slug = "bloom-beauty-dublin";
    if (await demoHasBusiness(request, slug) && (await demoCanSignIn(request, slug))) {
      await resetDemoBrowserSession(page);
      await signInBusiness(page, slug, { resetSession: true });
      await page.goto("/settings?tab=liv", { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: "M-liv-learning-evidence",
        persona: "owner",
        surface: "dashboard",
        route: "/settings?tab=liv#post-simulate",
      });
    }
  });

  test("O — internal voice + impersonation + monitoring drill", async ({ page, request }) => {
    test.skip(!secret, "Set INTERNAL_OPS_SECRET in .env");

    const tenantRes = await request.get(`${apiBase}/api/internal/ops/tenants?limit=1`, {
      headers: internalHeaders(),
    });
    const tenantBody = tenantRes.ok()
      ? ((await tenantRes.json()) as { data?: Array<{ id: string; name?: string }> })
      : { data: [] };
    const businessId = tenantBody.data?.[0]?.id ?? "";

    const ticketsRes = await request.get(
      `${apiBase}/api/internal/ops/support-tickets?status=open,triaged&limit=1`,
      { headers: internalHeaders() },
    );
    const ticketsBody = ticketsRes.ok()
      ? ((await ticketsRes.json()) as { data?: Array<{ id: string }> })
      : { data: [] };
    const ticketId = ticketsBody.data?.[0]?.id ?? "";

    await loginInternal(page);

    await page.goto(`${internalBase}/voice`, { waitUntil: "domcontentloaded" });
    await run.capture(
      page,
      { scenarioId: "O-internal-voice", persona: "ops-engineer", surface: "internal", route: "/voice" },
      { patterns: INTERNAL_SURFACE_PATTERNS },
    );

    await page.goto(`${internalBase}/access`, { waitUntil: "domcontentloaded" });
    if (businessId && ticketId) {
      await page.getByPlaceholder(/support ticket/i).fill(ticketId);
      await page.getByPlaceholder(/business uuid/i).fill(businessId);
      await page.locator("textarea").first().fill("PLS wave 10 impersonation intent drill");
      await run.capture(
        page,
        {
          scenarioId: "O-internal-impersonation-form",
          persona: "ops-engineer",
          surface: "internal",
          route: "/access#form-filled",
        },
        { patterns: INTERNAL_SURFACE_PATTERNS },
      );
    } else {
      await run.capture(
        page,
        { scenarioId: "O-internal-access", persona: "ops-engineer", surface: "internal", route: "/access" },
        { patterns: INTERNAL_SURFACE_PATTERNS },
      );
    }

    await page.goto(`${internalBase}/monitoring`, { waitUntil: "domcontentloaded" });
    const search = page.getByPlaceholder(/search|filter|query/i).first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill("booking");
      await page.waitForTimeout(500);
    }
    await run.capture(
      page,
      {
        scenarioId: "O-internal-monitoring-search",
        persona: "ops-engineer",
        surface: "internal",
        route: "/monitoring#search",
      },
      { patterns: INTERNAL_SURFACE_PATTERNS },
    );

    if (ticketId) {
      await page.goto(`${internalBase}/support/${encodeURIComponent(ticketId)}`, {
        waitUntil: "domcontentloaded",
      });
      const statusSelect = page.locator("select").first();
      if (await statusSelect.isVisible().catch(() => false)) {
        await statusSelect.selectOption({ index: 0 }).catch(() => undefined);
      }
      await run.capture(
        page,
        {
          scenarioId: "O-internal-ticket-thread",
          persona: "ops-engineer",
          surface: "internal",
          route: `/support/${ticketId}`,
        },
        { patterns: INTERNAL_SURFACE_PATTERNS },
      );
    }
  });

  test("O — workflow API unhappy probes", async ({ request }) => {
    const otpRes = await request.post(`${apiBase}/api/public/guest-hub/otp/verify`, {
      data: { phone: "+353871234567", code: "999999", country: "IE" },
    });
    expect([400, 401, 403, 404, 422, 503]).toContain(otpRes.status());

    const badBook = await request.post(`${apiBase}/api/public/b/not-a-slug/book`, {
      data: { serviceId: "x", startAt: new Date().toISOString() },
    });
    expect(badBook.status()).toBeGreaterThanOrEqual(400);
  });

  test("W10 — aggregate manifest closeout (waves 1–10)", async () => {
    const failed = run.contentFailures();
    expect(failed, `Wave 10 content hits: ${failed.map((f) => f.scenarioId).join(", ")}`).toHaveLength(0);

    const plsRoot = join(process.cwd(), "..", "artifacts", "pls");
    let total = run.records.length;
    let allFailures = failed.length;

    for (const w of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const p = join(plsRoot, `wave${w}-${runDate}`, "manifest.json");
      const legacy = w === 1 ? join(plsRoot, runDate, "manifest.json") : null;
      const path = existsSync(p) ? p : legacy && existsSync(legacy) ? legacy : null;
      if (!path) continue;
      try {
        const rows = JSON.parse(readFileSync(path, "utf8")) as Array<{ contentHits?: string[] }>;
        total += rows.length;
        allFailures += rows.filter((r) => (r.contentHits ?? []).length > 0).length;
      } catch {
        /* skip */
      }
    }

    console.log(`PLS gap closeout — ${total} total steps across waves 1–10, ${allFailures} content failures`);
    expect(allFailures, "PLS program must have zero content failures across all waves").toBe(0);
    expect(total, "expected combined PLS steps ≥ 150 after gap closure").toBeGreaterThanOrEqual(150);
  });
});
