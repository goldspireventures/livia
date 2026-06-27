import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import {
  demoShowcasePresentationPresetId,
  resolvePresentationPreset,
  type BusinessVertical,
} from "@workspace/policy";
import { apiBase, dismissPlatformTour, signInBusiness } from "./demo-auth";

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
  /** Policy vertical — drives showcase preset for this capture */
  vertical: BusinessVertical;
  demoSlug: string;
  webPath: string;
  /** Click a thread name before web capture (inbox only). */
  openThread?: string;
  webReadySelector?: string;
  mobilePath: string;
  mobileIsPublic?: boolean;
  mobileReadySelector?: string;
  /** One native skin per vertical (DEMO_SHOWCASE_PRESENTATION_PRESET_ID) */
  presentationPresetId: string;
  presentationCssPreset: string;
};

function showcaseCaptureSpec(
  folder: string,
  vertical: BusinessVertical,
  rest: Omit<VerticalCaptureSpec, "folder" | "vertical" | "presentationPresetId" | "presentationCssPreset">,
): VerticalCaptureSpec {
  const presetId = demoShowcasePresentationPresetId(vertical);
  const preset = resolvePresentationPreset(vertical, presetId);
  return {
    folder,
    vertical,
    presentationPresetId: presetId,
    presentationCssPreset: preset.cssPreset,
    ...rest,
  };
}

export const VERTICAL_CAPTURES: VerticalCaptureSpec[] = [
  showcaseCaptureSpec("hair", "hair", {
    demoSlug: "luxe-salon-spa",
    webPath: "/inbox",
    openThread: "Mary McNamara",
    webReadySelector: '[data-testid="inbox-three-pane"]',
    mobilePath: "/b/luxe-salon-spa",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  }),
  showcaseCaptureSpec("beauty", "beauty", {
    demoSlug: "bloom-beauty-dublin",
    webPath: "/bookings",
    webReadySelector: '[data-testid="bookings-page"]',
    mobilePath: "/b/bloom-beauty-dublin",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  }),
  showcaseCaptureSpec("wellness", "wellness", {
    demoSlug: "harbour-wellness-cork",
    webPath: "/bookings",
    webReadySelector: '[data-testid="bookings-page"]',
    mobilePath: "/b/harbour-wellness-cork",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  }),
  showcaseCaptureSpec("body-art", "body-art", {
    demoSlug: "ink-anchor-galway",
    webPath: "/design-proofs",
    webReadySelector: "main",
    mobilePath: "/b/ink-anchor-galway",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  }),
  showcaseCaptureSpec("medspa", "medspa", {
    demoSlug: "clarity-medspa-dublin",
    webPath: "/medspa",
    webReadySelector: "main",
    mobilePath: "/b/clarity-medspa-dublin",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  }),
  showcaseCaptureSpec("fitness", "fitness", {
    demoSlug: "peak-fitness-dublin",
    webPath: "/classes",
    webReadySelector: "main",
    mobilePath: "/b/peak-fitness-dublin",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  }),
  showcaseCaptureSpec("allied-health", "allied-health", {
    demoSlug: "motion-physio-cork",
    webPath: "/customers",
    webReadySelector: "main",
    mobilePath: "/b/motion-physio-cork",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  }),
  showcaseCaptureSpec("pet-grooming", "pet-grooming", {
    demoSlug: "paws-parlour-dublin",
    webPath: "/bookings",
    webReadySelector: '[data-testid="bookings-page"]',
    mobilePath: "/b/paws-parlour-dublin",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  }),
  showcaseCaptureSpec("automotive-detailing", "automotive-detailing", {
    demoSlug: "shine-studio-belfast",
    webPath: "/bookings",
    webReadySelector: '[data-testid="bookings-page"]',
    mobilePath: "/b/shine-studio-belfast",
    mobileIsPublic: true,
    mobileReadySelector: '[data-testid="public-book-storefront"]',
  }),
];

export function verticalShowcaseDir(folder: string) {
  const dir = path.join(SHOWCASE_DIR, "verticals", folder);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export const HOME_DEMO_SLUG = process.env.E2E_DEMO_SLUG ?? "luxe-salon-spa";

/** Marketing Today mobile — fixed greeting + Liv briefing time-of-day aligned. */
export const SHOWCASE_TODAY_GREETING = "Good afternoon, Aoife";

async function maskOwnerTodayShowcase(page: Page) {
  await page.evaluate((greetingText) => {
    const el = document.querySelector('[data-testid="owner-dashboard-greeting"]');
    if (el) el.textContent = greetingText;

    const period = greetingText.startsWith("Good evening")
      ? "evening"
      : greetingText.startsWith("Good afternoon")
        ? "afternoon"
        : "morning";
    const briefing = document.querySelector('[data-testid="owner-dashboard-briefing"]');
    if (!briefing) return;

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        node.textContent = node.textContent
          .replace(/\bGood morning\b/gi, `Good ${period}`)
          .replace(/\bthis morning\b/gi, `this ${period}`)
          .replace(/\bYour top priority this morning\b/gi, `Your top priority this ${period}`);
      } else {
        node.childNodes.forEach(walk);
      }
    };
    walk(briefing);
  }, SHOWCASE_TODAY_GREETING);
}

async function patchBusinessPresentationPreset(page: Page, presetId: string) {
  const businessId = await page.evaluate(() => localStorage.getItem("livia.currentBusinessId"));
  if (!businessId) throw new Error("missing livia.currentBusinessId");
  const res = await page.request.patch(`${apiBase}/api/businesses/${businessId}/presentation`, {
    data: { presentationPresetId: presetId },
  });
  if (!res.ok()) {
    throw new Error(`presentation patch ${res.status()}: ${(await res.text()).slice(0, 200)}`);
  }
}

async function waitForPresentationSkin(page: Page, cssPreset: string) {
  const matched = await page
    .waitForFunction(
      (expected) => document.documentElement.getAttribute("data-presentation") === expected,
      cssPreset,
      { timeout: 30_000 },
    )
    .then(() => true)
    .catch(() => false);
  if (!matched) {
    await page.reload({ waitUntil: "networkidle", timeout: 60_000 });
    await page
      .waitForFunction(
        (expected) => document.documentElement.getAttribute("data-presentation") === expected,
        cssPreset,
        { timeout: 15_000 },
      )
      .catch(() => undefined);
  }
  await page.waitForTimeout(400);
}

async function applyShowcasePreset(page: Page, spec: Pick<VerticalCaptureSpec, "presentationPresetId">) {
  await page
    .waitForFunction(() => localStorage.getItem("livia.currentBusinessId") != null, null, { timeout: 30_000 })
    .catch(() => undefined);
  const businessId = await page.evaluate(() => localStorage.getItem("livia.currentBusinessId"));
  if (!businessId) return;
  await patchBusinessPresentationPreset(page, spec.presentationPresetId);
}

function ownerPathWithPreview(spec: VerticalCaptureSpec): string {
  const qs = new URLSearchParams({
    preview: "1",
    preset: spec.presentationCssPreset,
    vertical: spec.vertical,
  });
  return `${spec.webPath}?${qs}`;
}

async function waitForWebShowcaseContent(page: Page, spec: VerticalCaptureSpec) {
  switch (spec.webPath) {
    case "/inbox":
      await page.locator('[data-testid="inbox-three-pane"]').waitFor({ state: "visible", timeout: 60_000 });
      await page
        .locator('[data-testid="inbox-thread-list"] button, [data-testid="inbox-thread-row"]')
        .first()
        .waitFor({ state: "visible", timeout: 60_000 });
      break;
    case "/bookings":
      await waitForBookingsLoaded(page);
      await page
        .getByRole("heading", { name: /Confirm|Schedule|Bookings|Today's rooms|Sessions|Grooms|Bay/i })
        .first()
        .waitFor({ state: "visible", timeout: 60_000 });
      await page
        .locator(
          '[data-testid="wellness-atrium-schedule"], [data-testid="wellness-ledger-schedule"], [data-testid="bookings-morph-constellation"], [data-testid^="row-booking-"], a[href^="/bookings/"]',
        )
        .first()
        .waitFor({ state: "visible", timeout: 90_000 });
      break;
    case "/design-proofs":
      await page.locator('[data-testid="design-proof-desk"]').waitFor({ state: "visible", timeout: 60_000 });
      await page.locator('[data-testid^="design-proof-card-"]').first().waitFor({ state: "visible", timeout: 60_000 });
      break;
    case "/medspa":
      await page.locator('[data-testid="medspa-hub-page"]').waitFor({ state: "visible", timeout: 60_000 });
      await page
        .locator('[data-testid="medspa-hub-page"] .rounded-lg.border')
        .first()
        .waitFor({ state: "visible", timeout: 60_000 });
      break;
    case "/classes":
      await page.locator('[data-testid="classes-page"]').waitFor({ state: "visible", timeout: 60_000 });
      await page
        .locator('[data-testid="classes-page"] ul li, [data-testid="classes-page"] .rounded-lg.border')
        .first()
        .waitFor({ state: "visible", timeout: 60_000 });
      break;
    case "/customers":
      await page.locator('[data-testid="customers-page"]').waitFor({ state: "visible", timeout: 60_000 });
      await page.locator('[data-testid^="row-customer-"]').first().waitFor({ state: "visible", timeout: 60_000 });
      break;
    default:
      if (spec.webReadySelector) {
        await page.locator(spec.webReadySelector).first().waitFor({ state: "visible", timeout: 60_000 });
      }
  }
  await page.waitForTimeout(800);
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

export async function captureWebOwner(page: Page, spec: VerticalCaptureSpec, dest: string) {
  await signInBusiness(page, spec.demoSlug);
  await dismissPlatformTour(page);
  await applyShowcasePreset(page, spec);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(ownerPathWithPreview(spec), { waitUntil: "networkidle", timeout: 60_000 });
  await dismissPlatformTour(page);
  await waitForPresentationSkin(page, spec.presentationCssPreset);
  await waitForWebShowcaseContent(page, spec);

  await page.waitForFunction(
    (expected) => document.documentElement.getAttribute("data-presentation") === expected,
    spec.presentationCssPreset,
    { timeout: 15_000 },
  );
  await page.waitForTimeout(600);

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
  await page.setViewportSize({ width: 390, height: 844 });

  if (spec.mobileIsPublic) {
    const bookPath = spec.mobilePath.replace(/^\/b\//, "/book/");
    const previewQs = new URLSearchParams({
      preview: "1",
      preset: spec.presentationCssPreset,
      vertical: spec.vertical,
    });
    await page.goto(`${bookPath}?${previewQs}`, { waitUntil: "networkidle", timeout: 60_000 });
    await waitForPresentationSkin(page, spec.presentationCssPreset);
    await page.locator(spec.mobileReadySelector ?? "main").first().waitFor({ state: "visible", timeout: 60_000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: dest, fullPage: false, animations: "disabled" });
    return;
  }

  await signInBusiness(page, spec.demoSlug);
  await dismissPlatformTour(page);
  await applyShowcasePreset(page, spec);
  await page.goto(spec.mobilePath, { waitUntil: "networkidle", timeout: 60_000 });
  await dismissPlatformTour(page);
  await waitForPresentationSkin(page, spec.presentationCssPreset);
  if (spec.mobilePath === "/dashboard") {
    await waitForTodayLoaded(page);
    await page
      .locator('[data-testid="owner-dashboard-briefing"] p.text-sm')
      .first()
      .waitFor({ state: "visible", timeout: 60_000 })
      .catch(() => undefined);
    await maskOwnerTodayShowcase(page);
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
  await page
    .locator('[data-testid="owner-dashboard-briefing"] p.text-sm')
    .first()
    .waitFor({ state: "visible", timeout: 60_000 })
    .catch(() => undefined);
  await maskOwnerTodayShowcase(page);
  await page.locator('[data-testid="mobile-bottom-nav"]').waitFor({ state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: dest, fullPage: false, animations: "disabled" });
}

export async function captureHomeBooking(page: Page, dest: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/b/${HOME_DEMO_SLUG}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.locator('[data-testid="public-book-storefront"]').waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, fullPage: false, animations: "disabled" });
}
