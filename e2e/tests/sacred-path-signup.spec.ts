/**
 * Sacred path — sign-up founder (not demo) → onboarding → first public booking.
 *
 *   pnpm sacred-path:signup
 */
import { test, expect, type Page } from "@playwright/test";
import { clerkTicketSignIn } from "../helpers/demo-auth";
import { bookPublicSlot } from "../helpers/public-book";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

type FreshFounder = {
  email: string;
  password: string;
  token: string;
  userId: string;
  landingPath: string;
};

export async function provisionFreshSignupFounder(
  request: import("@playwright/test").APIRequestContext,
  suffix = `pw-${Date.now()}`,
): Promise<FreshFounder> {
  const res = await request.post(`${apiBase}/api/dev/e2e/fresh-founder`, {
    data: { suffix },
  });
  expect(res.ok(), `fresh-founder: ${await res.text()}`).toBeTruthy();
  return (await res.json()) as FreshFounder;
}

async function dismissOnboardingIntro(page: Page) {
  const overlay = page.getByTestId("onboarding-arrival-overlay");
  if (await overlay.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await page.getByRole("button", { name: /enter setup/i }).click();
  }
}

async function createShop(page: Page): Promise<string> {
  await dismissOnboardingIntro(page);
  const freshIntent = page.getByTestId("migration-intent-fresh");
  if (await freshIntent.isVisible().catch(() => false)) {
    await freshIntent.click();
  }
  const unique = Date.now().toString(36);
  await page.getByLabel("Business name").fill(`Sacred Path ${unique}`);
  await page.waitForTimeout(500);
  const slugInput = page.getByPlaceholder("acme-studio");
  let slug = (await slugInput.inputValue()).trim();
  if (!slug) {
    slug = `sacred-path-${unique}`;
    await slugInput.fill(slug);
  }
  const starterPack = page.getByTestId("vertical-starter-pack-opt-in");
  if (await starterPack.isVisible().catch(() => false)) {
    await starterPack.check();
  }
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /create shop/i }).click();
  await expect(page.getByTestId("onboarding-track-fresh")).toBeVisible({ timeout: 90_000 });
  return slug;
}

async function advanceOnboardingToGoLive(page: Page, slug: string) {
  await dismissOnboardingIntro(page);

  for (let i = 0; i < 25; i++) {
    const onGoLive =
      (await page.getByTestId("onboarding-go-live-checklist").isVisible().catch(() => false)) ||
      (await page.locator("#testBooking").isVisible().catch(() => false));
    if (onGoLive) {
      const href = await page.locator('a[href*="/book/"]').first().getAttribute("href");
      const fromLink = href?.match(/\/book\/([^/?#]+)/)?.[1];
      return fromLink ?? slug;
    }

    if (await page.getByRole("button", { name: /create shop/i }).isVisible().catch(() => false)) {
      continue;
    }

    const continueBtn = page.getByRole("button", { name: /^continue$/i });
    if (await continueBtn.isEnabled().catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(800);
      continue;
    }

    await page.waitForTimeout(400);
  }

  await expect(page.locator("#testBooking")).toBeVisible({ timeout: 20_000 });
  return slug;
}

async function bookActivation(
  page: Page,
  request: import("@playwright/test").APIRequestContext,
  slug: string,
) {
  await expect
    .poll(
      async () => {
        const r = await request.get(`${apiBase}/api/public/b/${slug}`);
        if (!r.ok()) return 0;
        const j = (await r.json()) as { services?: unknown[] };
        return j.services?.length ?? 0;
      },
      { timeout: 90_000 },
    )
    .toBeGreaterThan(0);

  const suffix = Date.now().toString().slice(-6);
  const bookRes = await bookPublicSlot(
    request,
    slug,
    {
      customerFirstName: "Sacred",
      customerLastName: "Founder",
      customerPhone: `+35387${suffix}`,
      customerEmail: `sacred-${suffix}@signup-test.livia-hq.com`,
    },
    { workerIndex: 2 },
  );
  expect(bookRes?.ok(), `public book: ${bookRes ? await bookRes.text() : "no response"}`).toBeTruthy();
}

test.describe("Sacred path — sign-up founder (not demo)", () => {
  test("fresh founder → onboarding → public book → testBooking activation", async ({
    page,
    request,
  }) => {
    test.setTimeout(300_000);

    const founder = await provisionFreshSignupFounder(request);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await clerkTicketSignIn(page, founder.token, {
      landingPath: "/onboarding?fresh=1&path=1",
      fallbackEmail: founder.email,
    });

    await dismissOnboardingIntro(page);

    const startPath = page.getByTestId("onboarding-start-path");
    if (await startPath.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await page.getByTestId("migration-intent-fresh").click();
      await page.getByRole("button", { name: /^continue$/i }).click();
      await dismissOnboardingIntro(page);
    }

    await expect(page.getByRole("button", { name: /create shop/i })).toBeVisible({ timeout: 60_000 });
    await page.evaluate(() => sessionStorage.setItem("livia.onboarding.migrationIntent", "fresh"));
    let slug = await createShop(page);
    slug = await advanceOnboardingToGoLive(page, slug);
    if (!slug) {
      const href = await page.locator('a[href*="/book/"]').first().getAttribute("href");
      slug = href?.match(/\/book\/([^/?#]+)/)?.[1] ?? "";
    }
    expect(slug.length).toBeGreaterThan(2);

    await request.post(`${apiBase}/api/dev/e2e/ensure-bookable`, { data: { slug } });
    await bookActivation(page, request, slug);

    await expect
      .poll(
        async () => {
          const businessesRes = await page.request.get(`${apiBase}/api/me/businesses`);
          if (!businessesRes.ok()) return false;
          const list = (await businessesRes.json()) as {
            slug?: string;
            onboardingState?: { checklist?: { testBooking?: boolean } };
          }[];
          const biz = list.find((b) => b.slug === slug) ?? list[0];
          return biz?.onboardingState?.checklist?.testBooking === true;
        },
        { timeout: 45_000 },
      )
      .toBe(true);

    const businessesRes = await page.request.get(`${apiBase}/api/me/businesses`);
    expect(businessesRes.ok()).toBeTruthy();
    const list = (await businessesRes.json()) as {
      id: string;
      slug?: string;
      onboardingState?: { checklist?: { testBooking?: boolean } };
    }[];
    const biz = list.find((b) => b.slug === slug) ?? list[0];
    expect(biz?.onboardingState?.checklist?.testBooking).toBe(true);
  });
});
