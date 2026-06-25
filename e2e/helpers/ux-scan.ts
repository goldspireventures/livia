import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export type UxFinding = {
  route: string;
  kind: "error_copy" | "axe" | "layout" | "empty_primary";
  detail: string;
};

export const ERROR_PATTERNS = [
  /internal server error/i,
  /something went wrong/i,
  /unexpected error/i,
  /failed to load/i,
  /cannot read propert/i,
  /\bundefined\b/i,
  /\[object Object\]/,
  /Error:\s*\w+/,
  /sign in to your command center/i,
  /restart api on port 3000/i,
  /META_ACCESS_TOKEN/i,
  /HTTP \d{3}/i,
];

export async function scanCurrentPage(
  page: Page,
  route: string,
  findings: UxFinding[],
  opts?: { axe?: boolean; signedIn?: boolean; skipSignInCheck?: boolean },
) {
  await page.waitForTimeout(400);
  const axe = opts?.axe !== false;
  const body = await page.locator("body").innerText();
  const patterns =
    opts?.signedIn || opts?.skipSignInCheck
      ? ERROR_PATTERNS
      : ERROR_PATTERNS.filter((p) => !/sign in to your command center/i.test(p.source));
  for (const pat of patterns) {
    if (pat.test(body)) {
      findings.push({ route, kind: "error_copy", detail: `Matched ${pat}` });
    }
  }

  const main = page.locator("main, [role='main'], .min-h-screen").first();
  const box = await main.boundingBox().catch(() => null);
  const viewport = page.viewportSize();
  if (box && viewport && box.width > viewport.width + 48) {
    findings.push({
      route,
      kind: "layout",
      detail: `Main content wider than viewport (${Math.round(box.width)}px)`,
    });
  }

  if (axe) {
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast", "link-in-text-block"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    if (serious.length > 0) {
      findings.push({
        route,
        kind: "axe",
        detail: serious
          .map((v) => `${v.id} (${v.impact}): ${v.help}`)
          .join("; "),
      });
    }
  }
}

export async function scanRoute(
  page: Page,
  route: string,
  findings: UxFinding[],
  opts?: { axe?: boolean; signedIn?: boolean; skipSignInCheck?: boolean },
) {
  await page.goto(route.split("#")[0]!, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await scanCurrentPage(page, route, findings, opts);
}

export function writeFindings(outPath: string, findings: UxFinding[]) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2));
}
