/**
 * Inbox channel routing — authenticated owner (requires founder-auth-setup).
 */
import { test, expect } from "@playwright/test";
import { dismissLegalAcceptance, dismissPlatformTour } from "../helpers/demo-auth";

async function openInboxReady(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("livia.platformTour.dismissed.v1", "1");
  });
  const res = await page.goto("/inbox", { waitUntil: "domcontentloaded" });
  await dismissLegalAcceptance(page);
  await dismissPlatformTour(page);
  const tour = page.getByTestId("platform-tour-dialog");
  if (await tour.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: /skip tour/i }).click({ force: true });
    await tour.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
  }
  await expect(page.getByTestId("inbox-three-pane")).toBeVisible({ timeout: 30_000 });
  return res;
}

test.describe("Inbox channel routing", () => {
  test("thread detail shows reply channel hint", async ({ page }) => {
    const res = await openInboxReady(page);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/sign in to your command center/i);

    const firstThread = page.locator("button[data-testid^='conversation-']").first();
    await expect(firstThread).toBeVisible({ timeout: 15_000 });
    await firstThread.click();
    await expect(page.getByTestId("inbox-thread-channel-hint")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("inbox-thread-channel-hint")).toContainText(/Replies send on/i);
  });

  test("cross-channel guest shows unified thread view", async ({ page }) => {
    await openInboxReady(page);

    const multiChannelRow = page
      .locator("button[data-testid^='conversation-']")
      .filter({ has: page.getByTestId("inbox-multi-channel-hint") })
      .first();
    await expect(multiChannelRow).toBeVisible({ timeout: 15_000 });
    await multiChannelRow.click();

    await expect(page.getByTestId("inbox-unified-channels")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("inbox-unified-channels")).toContainText(/Liv active on/i);
    await expect(page.getByTestId("inbox-sibling-threads-banner")).toHaveCount(0);
  });
});
