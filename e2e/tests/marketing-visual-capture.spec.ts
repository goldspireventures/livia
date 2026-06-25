/**
 * livia.io marketing screenshots for UX audit.
 *
 *   pnpm exec playwright test marketing-visual-capture --project=marketing-visual
 */
import { test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "visual-captures", "marketing");
const marketingBase = process.env.E2E_MARKETING_URL ?? "http://127.0.0.1:5174";

const ROUTES = [
  "/",
  "/pricing",
  "/how-it-works",
  "/verticals",
  "/for/chair-rental",
  "/verticals/hair",
  "/verticals/beauty",
  "/verticals/allied-health",
  "/verticals/medspa",
  "/verticals/fitness",
  "/verticals/body-art",
  "/verticals/pet-grooming",
  "/verticals/wellness",
  "/verticals/automotive-detailing",
  "/europe",
  "/de",
  "/eu-ai",
  "/contact",
  "/get-started",
  "/changelog",
  "/status",
];

for (const route of ROUTES) {
  test(`capture ${route}`, async ({ page }) => {
    const res = await page.goto(`${marketingBase}${route}`, { waitUntil: "networkidle", timeout: 15_000 });
    if (!res?.ok()) test.skip(true, "Marketing dev server not running");
    await page.waitForTimeout(800);
    const safe = route.replace(/\//g, "_").replace(/^_/, "") || "home";
    await page.screenshot({
      path: path.join(OUT_DIR, `${safe}.png`),
      fullPage: true,
    });
  });
}
