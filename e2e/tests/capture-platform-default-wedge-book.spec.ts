/**
 * One-off asset capture — not part of CI gate.
 *
 *   pnpm capture:platform-default-book
 */
import { test } from "@playwright/test";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const slug = "bloom-beauty-dublin";
const base = process.env.E2E_DASHBOARD_BASE ?? "http://127.0.0.1:5173";

const outPublic = resolve(
  root,
  "artifacts/livia-dashboard/public/w2-gateway/platform-default/book-mobile.png",
);
const outTarget = resolve(
  root,
  "docs/design/assets/w5-public/platform-default/mobile/book-mobile.target.png",
);

test.describe.configure({ mode: "serial", timeout: 120_000 });

test("capture platform-default /b for beauty wedge", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    `${base}/b/${slug}?preview=1&preset=platform-default&vertical=beauty`,
    { waitUntil: "domcontentloaded", timeout: 60_000 },
  );
  await page.waitForSelector('[data-testid="text-business-name"]', { timeout: 90_000 });
  await page.waitForTimeout(800);
  const shell = page.getByTestId("public-book-storefront").first();
  await shell.waitFor({ state: "visible", timeout: 30_000 });
  const box = await shell.boundingBox();
  if (!box) throw new Error("public-book-storefront not visible");
  mkdirSync(dirname(outPublic), { recursive: true });
  mkdirSync(dirname(outTarget), { recursive: true });
  await page.screenshot({
    path: outPublic,
    clip: {
      x: Math.max(0, box.x - 8),
      y: Math.max(0, box.y - 8),
      width: Math.min(390, box.width + 16),
      height: Math.min(844, box.height + 16),
    },
  });
  copyFileSync(outPublic, outTarget);
});
