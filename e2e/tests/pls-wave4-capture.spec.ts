/**
 * PLS Wave 4 — internal ops, migration import, workflow matrix, owner support reporting.
 *
 *   pnpm pls:wave4
 *
 * Requires INTERNAL_OPS_SECRET in .env for Pack G.
 */
import { test, expect } from "@playwright/test";
import { PlsCaptureRun, mergeManifest, plsOutRoot } from "../helpers/pls-capture";
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
const { date: runDate, dir: OUT_ROOT } = plsOutRoot(4);
let run: PlsCaptureRun;

const internalHeaders = () => ({
  "X-Internal-Ops-Secret": secret,
  "X-Internal-Ops-Operator": "pls-wave4@livia.io",
  "X-Internal-Ops-Role": "engineer",
  Accept: "application/json",
});

async function loginInternal(page: import("@playwright/test").Page) {
  const res = await page.goto(internalBase, { waitUntil: "domcontentloaded", timeout: 20_000 });
  if (!res?.ok()) throw new Error("Internal console not reachable — start pnpm dev:internal");
  await page.locator('input[name="secret"]').fill(secret);
  await page.locator('input[name="operator"]').fill("pls-wave4@livia.io");
  const roleSelect = page.locator('select[name="role"]');
  if (await roleSelect.isVisible().catch(() => false)) {
    await roleSelect.selectOption("engineer");
  }
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForTimeout(1200);
}

const INTERNAL_ROUTES: Array<{ path: string; id: string; link?: RegExp }> = [
  { path: "/home", id: "home", link: /^Home\b/i },
  { path: "/support", id: "support-inbox", link: /^Support\b/i },
  { path: "/support/radar", id: "support-radar" },
  { path: "/support/board", id: "support-board" },
  { path: "/support/investigate", id: "support-investigate" },
  { path: "/tenants", id: "tenants", link: /^Tenants\b/i },
  { path: "/monitoring", id: "monitoring" },
  { path: "/continuity", id: "continuity" },
  { path: "/access", id: "tenant-access", link: /^Tenant access\b/i },
  { path: "/flags", id: "flags" },
  { path: "/reports", id: "reports" },
  { path: "/platform", id: "platform-hub", link: /^Platform\b/i },
];

test.describe("PLS Wave 4 — internal ops + migration + workflows", () => {
  test.describe.configure({ mode: "serial", timeout: 900_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    run = new PlsCaptureRun(4, OUT_ROOT, runDate);
    if (secret) {
      await request.post(`${apiBase}/api/internal/ops/monitoring/seed-defaults`, {
        headers: internalHeaders(),
      }).catch(() => undefined);
    }
  });

  test.afterAll(() => {
    run.flush();
    mergeManifest(4, runDate);
  });

  test("Pack G — internal ops surfaces", async ({ page, request }) => {
    test.skip(!secret, "Set INTERNAL_OPS_SECRET in .env");

    const ticketsRes = await request.get(
      `${apiBase}/api/internal/ops/support-tickets?status=open,triaged&limit=5`,
      { headers: internalHeaders() },
    );
    expect(ticketsRes.ok()).toBeTruthy();
    const ticketsBody = (await ticketsRes.json()) as { total?: number; data?: Array<{ id: string; category?: string }> };
    expect((ticketsBody.total ?? 0) >= 0).toBeTruthy();

    await loginInternal(page);

    for (const route of INTERNAL_ROUTES) {
      if (route.link) {
        await page.getByRole("link", { name: route.link }).first().click();
      } else {
        await page.goto(`${internalBase}${route.path}`, { waitUntil: "domcontentloaded" });
      }
      await page.waitForTimeout(700);
      await run.capture(
        page,
        {
          scenarioId: `G-internal-${route.id}`,
          persona: "ops-engineer",
          surface: "internal",
          route: route.path,
        },
        { patterns: INTERNAL_SURFACE_PATTERNS },
      );
    }

    const livTicket = ticketsBody.data?.find((t) => t.category === "liv_error") ?? ticketsBody.data?.[0];
    if (livTicket?.id) {
      await page.goto(`${internalBase}/support/${encodeURIComponent(livTicket.id)}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(900);
      await run.capture(
        page,
        {
          scenarioId: "G-internal-liv-error-ticket",
          persona: "ops-engineer",
          surface: "internal",
          route: `/support/${livTicket.id}`,
        },
        { patterns: INTERNAL_SURFACE_PATTERNS },
      );

      const incident = await request.get(
        `${apiBase}/api/internal/ops/support-tickets/${livTicket.id}/liv-incident`,
        { headers: internalHeaders() },
      );
      expect(incident.status()).toBeLessThan(500);
    }

    const tenantRes = await request.get(`${apiBase}/api/internal/ops/tenants?limit=1`, {
      headers: internalHeaders(),
    });
    if (tenantRes.ok()) {
      const tenantBody = (await tenantRes.json()) as { data?: Array<{ id: string }> };
      const tid = tenantBody.data?.[0]?.id;
      if (tid) {
        await page.goto(`${internalBase}/tenants/${tid}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(700);
        await run.capture(
          page,
          {
            scenarioId: "G-internal-tenant-detail",
            persona: "ops-engineer",
            surface: "internal",
            route: `/tenants/${tid}`,
          },
          { patterns: INTERNAL_SURFACE_PATTERNS },
        );
      }
    }
  });

  test("Pack G — monitoring + workflow API matrix", async ({ request }) => {
    test.skip(!secret, "Set INTERNAL_OPS_SECRET in .env");

    const endpoints = [
      { id: "monitoring-overview", path: "/internal/ops/monitoring/overview" },
      { id: "monitoring-flows", path: "/internal/ops/monitoring/flows" },
      { id: "monitoring-cascade", path: "/internal/ops/monitoring/cascade" },
      { id: "platform-health", path: "/internal/ops/platform-health" },
      { id: "continuity-traces", path: "/internal/ops/continuity-traces" },
    ] as const;

    for (const ep of endpoints) {
      const res = await request.get(`${apiBase}/api${ep.path}`, { headers: internalHeaders() });
      expect(res.status(), ep.id).toBe(200);
    }

    const otpRes = await request.post(`${apiBase}/api/public/guest-hub/otp/request`, {
      data: { phone: "+353871000001", country: "IE" },
    });
    expect([201, 503, 400]).toContain(otpRes.status());
  });

  test("Pack G — migration import (onboarding + settings)", async ({ page, request }) => {
    await resetDemoBrowserSession(page);
    await signInDemoPersona(page, "org_admin");
    await page.goto("/onboarding?intent=switching", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await run.capture(page, {
      scenarioId: "G-migration-onboarding-switching",
      persona: "founder",
      surface: "dashboard",
      route: "/onboarding?intent=switching",
    });

    const slug = "bloom-beauty-dublin";
    if (await demoHasBusiness(request, slug) && (await demoCanSignIn(request, slug))) {
      await resetDemoBrowserSession(page);
      await signInBusiness(page, slug, { resetSession: true });
      await page.goto("/settings?tab=integrations", { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: "G-migration-settings-integrations",
        persona: "owner",
        surface: "dashboard",
        route: "/settings?tab=integrations",
      });
      const fileImport = page.getByTestId("migration-file-import");
      if (await fileImport.isVisible().catch(() => false)) {
        await run.capture(page, {
          scenarioId: "G-migration-file-import-visible",
          persona: "owner",
          surface: "dashboard",
          route: "/settings?tab=integrations#file-import",
        });
      }
    }
  });

  test("Pack G — owner report issue (help dialog)", async ({ page, request }) => {
    const slug = "clarity-medspa-dublin";
    if (!(await demoHasBusiness(request, slug)) || !(await demoCanSignIn(request, slug))) {
      test.skip(true, "medspa owner unavailable");
    }
    await resetDemoBrowserSession(page);
    await signInBusiness(page, slug, { resetSession: true });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 45_000 });
    const help = page.getByTestId("help-support-trigger").first();
    if (await help.isVisible().catch(() => false)) {
      await help.click();
      await page.waitForTimeout(400);
      await expect(page.getByTestId("help-support-dialog")).toBeVisible({ timeout: 10_000 });
      await run.capture(page, {
        scenarioId: "G-owner-help-support-dialog",
        persona: "owner",
        surface: "dashboard",
        route: "/dashboard#help-support",
      });
    }
  });

  test("Pack G — comms honest limits (workflow unhappy)", async ({ page, request }) => {
    const slug = "bloom-beauty-dublin";
    if (!(await demoHasBusiness(request, slug)) || !(await demoCanSignIn(request, slug))) {
      test.skip(true, "owner unavailable");
    }
    await resetDemoBrowserSession(page);
    await signInBusiness(page, slug, { resetSession: true });
    await page.goto("/settings?tab=comms", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await run.capture(page, {
      scenarioId: "G-unhappy-comms-setup-limits",
      persona: "owner",
      surface: "dashboard",
      route: "/settings?tab=comms",
    });
    await page.goto("/settings?tab=integrations", { waitUntil: "domcontentloaded" });
    const parallel = page.getByText(/parallel run|previous bookings/i).first();
    if (await parallel.isVisible().catch(() => false)) {
      await run.capture(page, {
        scenarioId: "G-parallel-run-panel",
        persona: "owner",
        surface: "dashboard",
        route: "/settings?tab=integrations#parallel-run",
      });
    }
  });

  test("content audit summary", async () => {
    const failed = run.contentFailures();
    if (failed.length > 0) {
      console.log("\nPLS Wave 4 content failures:");
      for (const f of failed) {
        console.log(`  ${f.scenarioId}: ${f.contentHits.join(", ")}`);
      }
    }
    expect(failed, `Leaked copy on ${failed.length} screen(s)`).toHaveLength(0);
  });
});
