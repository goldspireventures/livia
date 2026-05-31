/**
 * Guest waitlist accept token — fitness demo walkthrough.
 *
 *   pnpm --filter @workspace/e2e exec playwright test --project=demo-waitlist-token
 */
import { test, expect } from "@playwright/test";
import { ensureDemoProvisioned, apiBase } from "../helpers/demo-auth";

const SLUG = "peak-fitness-dublin";

test.describe("Demo guest waitlist token", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("demo API exposes waitlist offer token", async ({ request }) => {
    let res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/waitlist`);
    if (res.status() === 404) {
      await request.post(`${apiBase}/api/demo/sync-vertical-showcase`, { timeout: 120_000 });
      res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/waitlist`);
    }
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as { token?: string; path?: string };
    expect(body.token?.length).toBeGreaterThan(8);
    expect(body.path).toMatch(new RegExp(`/b/${SLUG}/waitlist/`));
  });

  test("waitlist page shows accept CTA", async ({ page, request }) => {
    const res = await request.get(`${apiBase}/api/demo/guest-surfaces/${SLUG}/waitlist`);
    expect(res.ok()).toBeTruthy();
    const { path } = (await res.json()) as { path: string };

    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await expect(page.getByTestId("guest-waitlist-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("guest-waitlist-accept")).toBeVisible();
    await expect(page.getByTestId("guest-waitlist-ttl")).toBeVisible();
  });
});
