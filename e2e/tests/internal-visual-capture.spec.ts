/**
 * Livia internal ops portal — visual capture (requires INTERNAL_OPS_SECRET in .env).
 */
import { test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "visual-captures", "internal");
const base = process.env.E2E_INTERNAL_BASE ?? "http://127.0.0.1:5175";
const secret = process.env.INTERNAL_OPS_SECRET ?? process.env.INTERNAL_CRON_SECRET ?? "";

/** Sidebar NavLinks + platform deep routes (internal-nav.ts + PlatformHubPage). */
const CAPTURES: { name: string; href?: string; linkName?: RegExp }[] = [
  { name: "home", linkName: /^Home\b/i },
  { name: "support", linkName: /^Support\b/i },
  { name: "tenants", linkName: /^Tenants\b/i },
  { name: "knowledge", linkName: /^Docs\b/i },
  { name: "platform-hub", linkName: /^Platform\b/i },
  { name: "team", linkName: /^Team\b/i },
  { name: "access", linkName: /^Tenant access\b/i },
  { name: "monitoring", href: "/monitoring" },
  { name: "continuity", href: "/continuity" },
  { name: "flags", href: "/flags" },
  { name: "reports", href: "/reports" },
  { name: "voice", href: "/voice" },
];

test.describe("Internal portal visual capture", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(() => {
    test.skip(!secret, "Set INTERNAL_OPS_SECRET in .env");
  });

  test("all ops tabs", async ({ page }) => {
    const res = await page.goto(base, { waitUntil: "networkidle", timeout: 15_000 });
    if (!res?.ok()) test.skip(true, "Start pnpm dev:internal (:5175)");

    await page.locator('input[name="secret"]').fill(secret);
    await page.locator('input[name="operator"]').fill("visual-audit@livia.io");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForTimeout(1000);

    for (const cap of CAPTURES) {
      if (cap.linkName) {
        await page.getByRole("link", { name: cap.linkName }).first().click();
      } else if (cap.href) {
        await page.goto(`${base}${cap.href}`, { waitUntil: "networkidle" });
      }
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT_DIR, `tab-${cap.name}.png`), fullPage: true });
    }
  });
});
