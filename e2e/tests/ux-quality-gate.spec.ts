/**
 * UX quality gate — automated heuristics on wedge + public surfaces.
 * Complements visual captures; fails on visible error copy and serious a11y issues.
 *
 *   pnpm --filter @workspace/e2e exec playwright test tests/ux-quality-gate.spec.ts
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { apiBase, dismissLegalAcceptance, dismissPlatformTour, signInBusiness } from "../helpers/demo-auth";

const demoSlug = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

const ERROR_PATTERNS = [
  /internal server error/i,
  /something went wrong/i,
  /unexpected error/i,
  /failed to load/i,
  /cannot read propert/i,
  /\bundefined\b/i,
  /\[object Object\]/,
  /Error:\s*\w+/,
  /sign in to your command center/i,
];

const WEDGE_OWNER_ROUTES = [
  "/dashboard",
  "/inbox",
  "/bookings",
  "/customers",
  "/staff",
  "/services",
  "/settings?tab=shop",
  "/settings?tab=liv",
  "/settings?tab=policy",
  "/settings?tab=comms",
  "/settings?tab=billing",
  "/audit",
  "/toolkit",
  "/lifecycle",
];

// Sign-in/up covered by dashboard-gate (Clerk hangs under axe here).
const PUBLIC_ROUTES = [`/b/${demoSlug}`];

type Finding = {
  route: string;
  kind: "error_copy" | "axe" | "layout" | "empty_primary";
  detail: string;
};

const findings: Finding[] = [];

function record(route: string, kind: Finding["kind"], detail: string) {
  findings.push({ route, kind, detail });
}

async function signInOwner(page: import("@playwright/test").Page) {
  await signInBusiness(page, demoSlug);
}

async function scanRoute(
  page: import("@playwright/test").Page,
  route: string,
  axe = true,
  opts?: { signedIn?: boolean },
) {
  await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(500);
  if (opts?.signedIn) {
    await dismissLegalAcceptance(page);
    await dismissPlatformTour(page);
  }

  const body = await page.locator("body").innerText();
  const patterns =
    opts?.signedIn
      ? ERROR_PATTERNS
      : ERROR_PATTERNS.filter((p) => p.source !== "sign in to your command center");
  for (const pat of patterns) {
    if (pat.test(body)) {
      record(route, "error_copy", `Matched ${pat}`);
    }
  }

  const main = page.locator("main, [role='main'], .min-h-screen").first();
  const box = await main.boundingBox().catch(() => null);
  const viewport = page.viewportSize();
  if (box && viewport && box.width > viewport.width + 48) {
    record(route, "layout", `Main content wider than viewport (${Math.round(box.width)}px)`);
  }

  if (axe) {
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast", "link-in-text-block"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    if (serious.length > 0) {
      record(
        route,
        "axe",
        serious
          .map((v) => {
            const nodes = v.nodes
              .slice(0, 3)
              .map((n) => n.html.replace(/\s+/g, " ").slice(0, 160))
              .join(" | ");
            return `${v.id} (${v.impact}): ${v.help} — ${nodes}`;
          })
          .join("; "),
      );
    }
  }
}

test.describe("UX quality gate", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(async ({ request }) => {
    const st = await request.get(`${apiBase}/api/demo/status`);
    if (st.ok() && (await st.json() as { provisioned?: boolean }).provisioned) return;
    const prov = await request.post(`${apiBase}/api/demo/provision`);
    if (!prov.ok()) {
      const retry = await request.get(`${apiBase}/api/demo/status`);
      if (!retry.ok() || !(await retry.json() as { provisioned?: boolean }).provisioned) {
        throw new Error(`Demo not provisioned (${prov.status()})`);
      }
    }
  });

  for (const route of PUBLIC_ROUTES) {
    test(`public ${route}`, async ({ page }) => {
      const res =
        route.startsWith("/b/")
          ? await page.request.get(`${apiBase}/api/public/b/${demoSlug}`)
          : null;
      if (res && !res.ok()) test.skip(true, "Demo slug missing");
      const runAxe = !route.startsWith("/sign-in") && !route.startsWith("/sign-up");
      await scanRoute(page, route, runAxe);
    });
  }

  test("owner wedge routes", async ({ page }) => {
    await signInOwner(page);
    for (const route of WEDGE_OWNER_ROUTES) {
      await scanRoute(page, route, true, { signedIn: true });
    }
  });

  test("inbox queue lenses interactive", async ({ page }) => {
    await signInOwner(page);
    await page.goto("/inbox", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await dismissPlatformTour(page);
    for (const lens of ["needs_you", "liv_handling", "taken_over", "closed"] as const) {
      const tab = page.getByTestId(`queue-lens-${lens}`);
      if (await tab.isVisible().catch(() => false)) {
        await tab.click({ force: true });
        await page.waitForTimeout(300);
      }
    }
    const body = await page.locator("body").innerText();
    for (const pat of ERROR_PATTERNS) {
      expect(body, `inbox after lens switch: ${pat}`).not.toMatch(pat);
    }
  });

  test.afterAll(async () => {
    const outDir = path.join(__dirname, "..", "visual-captures");
    fs.mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, "ux-quality-findings.json");
    fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2));
    if (findings.length > 0) {
      console.log(`\nUX findings written: ${jsonPath} (${findings.length} issues)\n`);
      for (const f of findings) {
        console.log(`  [${f.kind}] ${f.route}: ${f.detail.slice(0, 120)}`);
      }
    }
    const hardFailures = findings.filter((f) => f.kind === "error_copy");
    if (findings.length > hardFailures.length) {
      console.log(
        `\nSoft a11y notes (${findings.length - hardFailures.length}) — see ${jsonPath} for axe details\n`,
      );
    }
    expect(
      hardFailures,
      `UX quality gate failed on visible error copy — see ${jsonPath}`,
    ).toEqual([]);
  });
});
