/**
 * Internal ops portal — API proxy + support queue JSON (not HTML).
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=internal-ops-smoke
 */
import { test, expect } from "@playwright/test";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const opsSecret = process.env.INTERNAL_OPS_SECRET ?? process.env.INTERNAL_CRON_SECRET ?? "";

test.describe("Internal ops smoke", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${apiBase}/api/healthz`);
    const text = await health.text();
    if (text.trim().startsWith("<")) {
      throw new Error(
        "Port 3000 returned HTML — not Livia api-server. Stop other apps on :3000 and run pnpm dev:api.",
      );
    }
    const data = JSON.parse(text) as { status?: string };
    expect(data.status).toBe("ok");
  });

  test("support-tickets returns JSON via API", async ({ request }) => {
    test.skip(!opsSecret, "Set INTERNAL_OPS_SECRET in repo-root .env");
    const res = await request.get(`${apiBase}/api/internal/ops/support-tickets?status=open,triaged`, {
      headers: {
        Accept: "application/json",
        "X-Internal-Ops-Secret": opsSecret,
        "X-Internal-Ops-Operator": "e2e@livia.io",
        "X-Internal-Ops-Role": "engineer",
      },
    });
    const text = await res.text();
    expect(text.trim().startsWith("<"), "expected JSON, got HTML").toBe(false);
    expect(res.ok()).toBeTruthy();
    const body = JSON.parse(text) as { data?: unknown[]; total?: number };
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("internal UI loads support queue without HTML parse error", async ({ page, request }) => {
    test.skip(!opsSecret, "Set INTERNAL_OPS_SECRET in repo-root .env");
    const internalBase = process.env.E2E_INTERNAL_BASE ?? "http://127.0.0.1:5175";
    await page.goto(internalBase, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("X-Internal-Ops-Secret").fill(opsSecret);
    await page.getByPlaceholder("you@livia.io").fill("e2e@livia.io");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("button", { name: "Support", exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("api-connection-error")).not.toBeVisible({ timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText(/Unexpected token '<'/);
  });
});
