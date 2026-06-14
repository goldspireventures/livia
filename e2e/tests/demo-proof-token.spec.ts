/**
 * Guest design proof token — body-art demo walkthrough.
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=demo-proof-token
 */
import { test, expect } from "@playwright/test";
import { ensureDemoProvisioned, apiBase } from "../helpers/demo-auth";

const SLUG = "ink-anchor-galway";

test.describe("Demo guest proof token", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("demo API exposes pending proof token", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/proof`);
    if (res.status() === 404) {
      await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
    }
    const retry = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/proof`);
    expect(retry.ok(), await retry.text()).toBeTruthy();
    const body = (await retry.json()) as { token?: string; path?: string };
    expect(body.token?.length).toBeGreaterThan(8);
    expect(body.path).toMatch(new RegExp(`/book/${SLUG}/proof/`));
  });

  test("guest proof page renders approve/reject", async ({ page, request }) => {
    const res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/proof`);
    expect(res.ok()).toBeTruthy();
    const { path } = (await res.json()) as { path: string };

    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await expect(page.getByTestId("guest-proof-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("guest-proof-version-nav")).toBeVisible();
    await expect(page.getByTestId("guest-proof-approve")).toBeVisible();
    await expect(page.getByTestId("guest-proof-reject")).toBeVisible();
  });
});
