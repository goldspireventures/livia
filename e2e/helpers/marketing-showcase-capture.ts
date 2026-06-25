import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { dismissPlatformTour, signInBusiness } from "./demo-auth";

export const SHOWCASE_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "artifacts",
  "livia-marketing",
  "public",
  "showcase",
);

export type VerticalCaptureSpec = {
  /** Folder under showcase/verticals/ */
  folder: string;
  demoSlug: string;
  webPath: string;
  /** Click a thread name before web capture (inbox only). */
  openThread?: string;
  webReadySelector?: string;
  mobilePath: string;
  mobileIsPublic?: boolean;
  mobileReadySelector?: string;
};

export const HOME_DEMO_SLUG = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

export const VERTICAL_CAPTURES: VerticalCaptureSpec[] = [
  {
    folder: "hair",
    demoSlug: "luxe-salon-spa",
    webPath: "/inbox",
    openThread: "Mary McNamara",
    webReadySelector: '[data-testid="inbox-three-pane"]',
    mobilePath: "/dashboard",
    mobileReadySelector: '[data-testid="owner-home-ritual"]',
  },
  {
    folder: "beauty",
    demoSlug: "bloom-beauty-dublin",
    webPath: "/bookings",
    webReadySelector: '[data-testid="bookings-page"]',
    mobilePath: "/b/bloom-beauty-dublin",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  },
  {
    folder: "wellness",
    demoSlug: "harbour-wellness-cork",
    webPath: "/bookings",
    webReadySelector: '[data-testid="bookings-page"]',
    mobilePath: "/b/harbour-wellness-cork",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  },
  {
    folder: "body-art",
    demoSlug: "ink-anchor-galway",
    webPath: "/design-proofs",
    webReadySelector: "main",
    mobilePath: "/b/ink-anchor-galway",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  },
  {
    folder: "medspa",
    demoSlug: "clarity-medspa-dublin",
    webPath: "/medspa",
    webReadySelector: "main",
    mobilePath: "/b/clarity-medspa-dublin",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  },
  {
    folder: "fitness",
    demoSlug: "peak-fitness-dublin",
    webPath: "/classes",
    webReadySelector: "main",
    mobilePath: "/b/peak-fitness-dublin",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  },
  {
    folder: "allied-health",
    demoSlug: "motion-physio-cork",
    webPath: "/customers",
    webReadySelector: "main",
    mobilePath: "/b/motion-physio-cork",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  },
  {
    folder: "pet-grooming",
    demoSlug: "paws-parlour-dublin",
    webPath: "/bookings",
    webReadySelector: '[data-testid="bookings-page"]',
    mobilePath: "/b/paws-parlour-dublin",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  },
  {
    folder: "automotive-detailing",
    demoSlug: "shine-studio-belfast",
    webPath: "/bookings",
    webReadySelector: '[data-testid="bookings-page"]',
    mobilePath: "/b/shine-studio-belfast",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  },
];

export function verticalShowcaseDir(folder: string) {
  const dir = path.join(SHOWCASE_DIR, "verticals", folder);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function waitForBookingsLoaded(page: Page) {
  await page.locator('[data-testid="bookings-page"]').waitFor({ state: "visible", timeout: 60_000 });
  const skeleton = page.locator('[data-testid="bookings-page"] .animate-pulse').first();
  if (await skeleton.isVisible().catch(() => false)) {
    await skeleton.waitFor({ state: "hidden", timeout: 90_000 });
  }
  await page.waitForTimeout(600);
}

export async function waitForTodayLoaded(page: Page) {
  await page.locator('[data-testid="owner-home-ritual"]').waitFor({ state: "visible", timeout: 60_000 });
  await page
    .locator('[data-testid="owner-dashboard-greeting"], [data-testid="owner-kpi-row"]')
    .first()
    .waitFor({ state: "visible", timeout: 90_000 });
  await page.waitForTimeout(600);
}

export async function captureWebOwner(
  page: Page,
  spec: Pick<VerticalCaptureSpec, "demoSlug" | "webPath" | "openThread" | "webReadySelector">,
  dest: string,
) {
  await signInBusiness(page, spec.demoSlug);
  await dismissPlatformTour(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(spec.webPath, { waitUntil: "networkidle", timeout: 60_000 });
  await dismissPlatformTour(page);

  if (spec.webPath === "/bookings") {
    await waitForBookingsLoaded(page);
  } else if (spec.webReadySelector) {
    await page.locator(spec.webReadySelector).first().waitFor({ state: "visible", timeout: 60_000 });
    await page.waitForTimeout(800);
  }

  if (spec.openThread) {
    const row = page.getByRole("button", { name: new RegExp(spec.openThread, "i") }).first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
    } else {
      await page.getByText(spec.openThread, { exact: false }).first().click();
    }
    await page
      .locator('[data-testid="inbox-messages-scroll"], [data-testid="thread-msg-user"]')
      .first()
      .waitFor({ state: "visible", timeout: 30_000 })
      .catch(() => undefined);
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: dest, fullPage: false, animations: "disabled" });
}

export async function captureMobileOwner(page: Page, spec: VerticalCaptureSpec, dest: string) {
  if (!spec.mobileIsPublic) {
    await signInBusiness(page, spec.demoSlug);
    await dismissPlatformTour(page);
  }

  await page.setViewportSize({ width: 390, height: 844 });

  if (spec.mobileIsPublic) {
    await page.goto(spec.mobilePath, { waitUntil: "networkidle", timeout: 60_000 });
    await page.locator(spec.mobileReadySelector ?? "main").first().waitFor({ state: "visible", timeout: 60_000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: dest, fullPage: true, animations: "disabled" });
    return;
  }

  await page.goto(spec.mobilePath, { waitUntil: "networkidle", timeout: 60_000 });
  await dismissPlatformTour(page);
  if (spec.mobilePath === "/dashboard") {
    await waitForTodayLoaded(page);
  }
  await page.locator('[data-testid="mobile-bottom-nav"]').waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: dest, fullPage: false, animations: "disabled" });
}

export async function captureHomeInboxThread(page: Page, dest: string) {
  await signInBusiness(page, HOME_DEMO_SLUG);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/inbox", { waitUntil: "networkidle", timeout: 60_000 });
  await dismissPlatformTour(page);
  await page.locator('[data-testid="inbox-three-pane"]').waitFor({ state: "visible", timeout: 60_000 });

  const mary = page.getByRole("button", { name: /Mary McNamara/i }).first();
  if (await mary.isVisible().catch(() => false)) {
    await mary.click();
  } else {
    await page.getByText("Mary McNamara").first().click();
  }
  await page
    .locator('[data-testid="inbox-messages-scroll"]')
    .waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, fullPage: false, animations: "disabled" });
}

export async function captureHomeTodayMobile(page: Page, dest: string) {
  await signInBusiness(page, HOME_DEMO_SLUG);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard", { waitUntil: "networkidle", timeout: 60_000 });
  await dismissPlatformTour(page);
  await waitForTodayLoaded(page);
  await page.locator('[data-testid="mobile-bottom-nav"]').waitFor({ state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: dest, fullPage: false, animations: "disabled" });
}

export async function captureHomeBooking(page: Page, dest: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/b/${HOME_DEMO_SLUG}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.locator('[data-testid="public-book-storefront"]').waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, fullPage: true, animations: "disabled" });
}
