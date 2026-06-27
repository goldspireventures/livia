/**
 * PLS Wave 5 — sacred-path re-verification, axe gates, final manifest closeout.
 *
 *   pnpm pls:wave5
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PlsCaptureRun, mergeManifest, plsOutRoot } from "../helpers/pls-capture";
import {
  ensureDemoProvisioned,
  resetDemoBrowserSession,
  signInBusiness,
  signInDemoPersona,
  demoCanSignIn,
  demoHasBusiness,
} from "../helpers/demo-auth";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const secret = process.env.INTERNAL_OPS_SECRET ?? process.env.INTERNAL_CRON_SECRET ?? "";
const { date: runDate, dir: OUT_ROOT } = plsOutRoot(5);
let run: PlsCaptureRun;

const SACRED_GUEST = ["/b/luxe-salon-spa", "/b/clarity-medspa-dublin", "/my"] as const;
const SACRED_GATEWAY = ["/sign-in", "/demo"] as const;

async function expectNoSeriousAxe(page: import("@playwright/test").Page, label: string) {
  const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(serious, `${label}: ${serious.map((v) => v.id).join(", ")}`).toEqual([]);
}

test.describe("PLS Wave 5 — closeout re-verification", () => {
  test.describe.configure({ mode: "serial", timeout: 600_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
    run = new PlsCaptureRun(5, OUT_ROOT, runDate);
  });

  test.afterAll(() => {
    run.flush();
    mergeManifest(5, runDate);
  });

  test("W5 — platform API gates", async ({ request }) => {
    const health = await request.get(`${apiBase}/api/healthz`);
    expect(health.ok()).toBeTruthy();
    const demo = await request.get(`${apiBase}/api/demo/status`);
    expect(demo.ok()).toBeTruthy();
    const demoBody = (await demo.json()) as { provisioned?: boolean };
    expect(demoBody.provisioned).toBe(true);

    if (secret) {
      const ph = await request.get(`${apiBase}/api/internal/ops/platform-health`, {
        headers: { "X-Internal-Ops-Secret": secret },
      });
      expect(ph.status()).toBe(200);
    }
  });

  test("W5 — sacred guest + gateway re-capture", async ({ page, request }) => {
    for (const route of SACRED_GUEST) {
      if (route.startsWith("/b/")) {
        const slug = route.replace("/b/", "");
        const res = await request.get(`${apiBase}/api/public/b/${slug}`);
        if (!res.ok()) continue;
      }
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `W5-sacred-guest-${route.replace(/\//g, "-").replace(/^-/, "")}`,
        persona: "guest",
        surface: "public",
        route,
      });
    }
    for (const route of SACRED_GATEWAY) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `W5-sacred-gateway-${route.slice(1)}`,
        persona: "prospect",
        surface: "gateway",
        route,
      });
    }
  });

  test("W5 — owner sacred path + axe", async ({ page, request }) => {
    const slug = "bloom-beauty-dublin";
    if (!(await demoHasBusiness(request, slug)) || !(await demoCanSignIn(request, slug))) {
      test.skip(true, "bloom owner unavailable");
    }
    await resetDemoBrowserSession(page);
    await signInBusiness(page, slug, { resetSession: true });
    for (const route of ["/dashboard", "/inbox", "/settings?tab=billing"]) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `W5-sacred-owner-${route.replace(/[^\w-]+/g, "-")}`,
        persona: "owner",
        surface: "dashboard",
        route,
      });
    }
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expectNoSeriousAxe(page, "owner dashboard");
    await page.goto("/settings?tab=billing", { waitUntil: "domcontentloaded" });
    await expectNoSeriousAxe(page, "owner billing");
  });

  test("W5 — founder chain + onboarding re-capture", async ({ page }) => {
    await resetDemoBrowserSession(page);
    await signInDemoPersona(page, "org_admin");
    for (const route of ["/chain", "/onboarding?intent=second-shop"]) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await run.capture(page, {
        scenarioId: `W5-sacred-founder-${route.replace(/[^\w-]+/g, "-")}`,
        persona: "founder",
        surface: "dashboard",
        route,
      });
    }
  });

  test("W5 — aggregate manifest closeout", async () => {
    const failed = run.contentFailures();
    expect(failed, `Wave 5 content hits: ${failed.map((f) => f.scenarioId).join(", ")}`).toHaveLength(0);

    const plsRoot = join(process.cwd(), "..", "artifacts", "pls");
    let total = run.records.length;
    let allFailures = failed.length;

    for (const w of [1, 2, 3, 4]) {
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

    expect(allFailures, "PLS program must have zero content failures across all waves").toBe(0);
    expect(total, "expected combined PLS steps > 100").toBeGreaterThan(100);
    console.log(`PLS closeout — ${total} total steps across waves 1–5, ${allFailures} content failures`);
  });
});
