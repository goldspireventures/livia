/**
 * Livia internal ops portal — tab visual capture (requires INTERNAL_OPS_SECRET in .env).
 */
import { test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "visual-captures", "internal");
const base = process.env.E2E_INTERNAL_BASE ?? "http://127.0.0.1:5175";
const secret = process.env.INTERNAL_OPS_SECRET ?? process.env.INTERNAL_CRON_SECRET ?? "";

const TABS: { name: string; label: RegExp }[] = [
  { name: "support", label: /^Support/i },
  { name: "tenants", label: /^Tenants$/i },
  { name: "platform", label: /^Platform$/i },
  { name: "monitoring", label: /^Monitoring$/i },
  { name: "continuity", label: /^Continuity$/i },
  { name: "voice", label: /Voice/i },
  { name: "knowledge", label: /^Knowledge$/i },
  { name: "flags", label: /^Flags$/i },
  { name: "reports", label: /^Reports$/i },
  { name: "access", label: /^Access$/i },
];

test.describe("Internal portal visual capture", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

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

    for (const tab of TABS) {
      await page.getByRole("button", { name: tab.label }).click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT_DIR, `tab-${tab.name}.png`), fullPage: true });
    }
  });
});
