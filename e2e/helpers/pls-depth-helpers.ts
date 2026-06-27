import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { findAvailablePublicSlot, bookPublicSlot } from "./public-book";
import { apiBase } from "./demo-auth";

export type GuestSurfaceKind =
  | "proof"
  | "intake"
  | "pay"
  | "balance"
  | "waitlist"
  | "quote";

export async function resolveGuestSurfacePath(
  request: APIRequestContext,
  slug: string,
  kind: GuestSurfaceKind,
  base = apiBase,
): Promise<string | null> {
  let res = await request.get(`${base}/api/demo/guest-surfaces/${slug}/${kind}`);
  if (res.status() === 404) {
    await request.post(`${base}/api/demo/sync-vertical-showcase`, { timeout: 120_000 }).catch(() => undefined);
    res = await request.get(`${base}/api/demo/guest-surfaces/${slug}/${kind}`);
  }
  if (!res.ok()) return null;
  const body = (await res.json()) as { path: string };
  return body.path ?? null;
}

/** Advance public book wizard to customer-details step (service + slot selected). */
export async function advancePublicBookingToDetails(
  page: Page,
  request: APIRequestContext,
  slug: string,
): Promise<boolean> {
  const slot = await findAvailablePublicSlot(request, slug);
  if (!slot) return false;

  await page.goto(`/b/${slug}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await expect(page.getByTestId("text-business-name")).toBeVisible({ timeout: 45_000 });

  const serviceBtn = page.locator("[data-testid^='button-service-']").first();
  if (!(await serviceBtn.isVisible().catch(() => false))) {
    const catalog = page.getByTestId("public-service-catalog");
    if (await catalog.isVisible().catch(() => false)) {
      await catalog.locator("[data-testid^='button-service-']").first().click();
    } else {
      return false;
    }
  } else {
    await serviceBtn.click();
  }

  await page.waitForTimeout(400);

  const dateInput = page.getByTestId("input-date");
  const onDetails = page.getByTestId("input-first-name");
  if (await onDetails.isVisible().catch(() => false)) {
    return true;
  }
  if (!(await dateInput.isVisible().catch(() => false))) {
    return false;
  }
  await dateInput.fill(slot.date);
  const slotBtn = page.locator(`[data-testid='button-slot-${slot.startAt}']`).first();
  await expect(slotBtn).toBeVisible({ timeout: 20_000 });
  await slotBtn.click();
  await expect(page.getByTestId("input-first-name")).toBeVisible({ timeout: 15_000 });
  return true;
}

/** Fill details and capture confirm/success step when available. */
export async function completePublicBookingWizard(
  page: Page,
  request: APIRequestContext,
  slug: string,
  customer: { first: string; last: string; email: string; phone?: string },
): Promise<"confirmed" | "details" | "failed"> {
  const ok = await advancePublicBookingToDetails(page, request, slug);
  if (!ok) return "failed";

  await page.getByTestId("input-first-name").fill(customer.first);
  await page.getByTestId("input-last-name").fill(customer.last);
  await page.getByTestId("input-email").fill(customer.email);
  if (customer.phone) {
    const phone = page.getByTestId("input-phone");
    if (await phone.isVisible().catch(() => false)) {
      await phone.fill(customer.phone);
    }
  }

  const sticky = page.getByTestId("button-sticky-continue");
  const desktop = page.getByTestId("button-continue-booking");
  if (await sticky.isVisible().catch(() => false)) {
    await sticky.click();
  } else if (await desktop.isVisible().catch(() => false)) {
    await desktop.click();
  }

  const medspaSelect = page.getByTestId("select-medspa-procedure");
  if (await medspaSelect.isVisible().catch(() => false)) {
    await medspaSelect.selectOption({ index: 1 }).catch(() => undefined);
    const sticky2 = page.getByTestId("button-sticky-continue");
    if (await sticky2.isVisible().catch(() => false)) await sticky2.click();
  }

  const confirm = page.getByTestId("button-confirm-booking");
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
    await page.waitForTimeout(1200);
    const success = page.getByTestId("public-booking-success");
    if (await success.isVisible({ timeout: 15_000 }).catch(() => false)) {
      return "confirmed";
    }
  }

  if (await page.getByTestId("input-first-name").isVisible().catch(() => false)) {
    return "details";
  }
  return "failed";
}

export async function bookVisitTokenPath(
  request: APIRequestContext,
  slug: string,
  workerIndex = 0,
): Promise<string | null> {
  const suffix = `${slug.slice(0, 6)}-${Date.now().toString().slice(-5)}`;
  const bookRes = await bookPublicSlot(
    request,
    slug,
    {
      customerFirstName: "PLS",
      customerLastName: "Visit",
      customerEmail: `pls-visit-${suffix}@test.livia.local`,
      customerPhone: `+35387${suffix.replace(/\D/g, "").slice(-7)}`,
    },
    { workerIndex },
  );
  if (!bookRes?.ok()) return null;
  const body = (await bookRes.json()) as { visitPath?: string; guestToken?: string };
  if (body.visitPath?.includes("/visit/") || body.visitPath?.includes("/b/")) {
    return body.visitPath;
  }
  if (body.guestToken) {
    return `/b/${slug}/visit/${encodeURIComponent(body.guestToken)}`;
  }
  return null;
}

export async function tryGuestHubOtpSignIn(page: Page, phone = "+353871234567", code = "000000") {
  await page.goto("/my", { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.getByTestId("guest-hub-phone").fill(phone);
  await page.getByRole("button", { name: /send verification code/i }).click();
  const otp = page.getByTestId("guest-hub-otp");
  const visible = await otp.isVisible({ timeout: 20_000 }).catch(() => false);
  if (!visible) return false;
  await otp.fill(code);
  await page.getByRole("button", { name: /verify|sign in/i }).click();
  await page.waitForTimeout(1500);
  const signedIn =
    (await page.getByTestId("guest-hub-welcome").isVisible().catch(() => false)) ||
    (await page.getByTestId("guest-hub-upcoming-hero").isVisible().catch(() => false)) ||
    (await page.getByTestId("guest-hub-account-settings").isVisible().catch(() => false));
  return signedIn;
}

export const VERTICAL_OWNER_HUBS: Array<{
  vertical: string;
  slug: string;
  routes: string[];
}> = [
  {
    vertical: "hair",
    slug: "luxe-salon-spa",
    routes: ["/dashboard", "/host", "/brands", "/rota", "/toolkit", "/settings?tab=shop"],
  },
  {
    vertical: "beauty",
    slug: "bloom-beauty-dublin",
    routes: ["/dashboard", "/beauty-store", "/beauty-reception", "/beauty-tv", "/settings?tab=shop"],
  },
  {
    vertical: "wellness",
    slug: "harbour-wellness-cork",
    routes: [
      "/dashboard",
      "/wellness-reception",
      "/wellness-tv",
      "/wellness-retail",
      "/wellness-reports",
      "/wellness-chain",
      "/wellness-audit-diary",
      "/wellness-guest-vault",
      "/wellness-corporate",
      "/settings?tab=shop",
    ],
  },
  {
    vertical: "body-art",
    slug: "ink-anchor-galway",
    routes: ["/dashboard", "/design-proofs", "/settings?tab=shop"],
  },
  {
    vertical: "fitness",
    slug: "peak-fitness-dublin",
    routes: ["/dashboard", "/classes", "/studio-setup", "/settings?tab=shop"],
  },
  {
    vertical: "medspa",
    slug: "clarity-medspa-dublin",
    routes: ["/dashboard", "/medspa", "/settings?tab=shop"],
  },
  {
    vertical: "allied-health",
    slug: "motion-physio-cork",
    routes: ["/dashboard", "/day-packages", "/my-day", "/settings?tab=shop"],
  },
  {
    vertical: "pet-grooming",
    slug: "paws-parlour-dublin",
    routes: ["/dashboard", "/settings?tab=shop"],
  },
  {
    vertical: "automotive-detailing",
    slug: "shine-studio-belfast",
    routes: ["/dashboard", "/settings?tab=shop"],
  },
  {
    vertical: "event-vendors",
    slug: "atelier-decor-dublin",
    routes: ["/dashboard", "/enquiries", "/quotes", "/event-site", "/settings?tab=shop"],
  },
  {
    vertical: "wellness-dk",
    slug: "copenhagen-havn-wellness",
    routes: ["/dashboard", "/wellness-reception", "/settings?tab=shop"],
  },
];

export const MARKETING_ROUTES = [
  "/",
  "/pricing",
  "/how-it-works",
  "/verticals",
  "/get-started",
  "/contact",
  "/demo",
  "/book-demo",
  "/for/chair-rental",
  "/europe",
  "/de",
  "/eu-ai",
  "/changelog",
  "/status",
  "/legal/privacy",
  "/legal/tos",
  "/legal/dpa",
  "/verticals/hair",
  "/verticals/beauty",
  "/verticals/wellness",
  "/verticals/medspa",
  "/verticals/fitness",
  "/verticals/body-art",
  "/verticals/pet-grooming",
  "/verticals/allied-health",
  "/verticals/automotive-detailing",
  "/verticals/event-vendors",
] as const;

export const GUEST_TOKEN_MATRIX: Array<{ kind: GuestSurfaceKind; slug: string }> = [
  { kind: "proof", slug: "ink-anchor-galway" },
  { kind: "intake", slug: "clarity-medspa-dublin" },
  { kind: "pay", slug: "luxe-salon-spa" },
  { kind: "balance", slug: "luxe-salon-spa" },
  { kind: "waitlist", slug: "peak-fitness-dublin" },
  { kind: "quote", slug: "atelier-decor-dublin" },
];

export const BOOK_WIZARD_SLUGS = [
  "luxe-salon-spa",
  "bloom-beauty-dublin",
  "clarity-medspa-dublin",
  "paws-parlour-dublin",
  "ink-anchor-galway",
  "peak-fitness-dublin",
] as const;
