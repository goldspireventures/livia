/**
 * Capture real Livia platform screenshots for livia.io marketing.
 *
 *   pnpm start:platform:test
 *   pnpm --filter @workspace/e2e run test:marketing-showcase
 */
import { test } from "@playwright/test";
import path from "node:path";
import {
  VERTICAL_CAPTURES,
  SHOWCASE_DIR,
  captureHomeBooking,
  captureHomeInboxThread,
  captureHomeTodayMobile,
  captureMobileOwner,
  captureWebOwner,
  verticalShowcaseDir,
} from "../helpers/marketing-showcase-capture";
import { demoCanSignIn, ensureDemoProvisioned } from "../helpers/demo-auth";

test.describe("Marketing product showcase — live captures", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("home — inbox-web.png (Mary thread open)", async ({ page, request }) => {
    if (!(await demoCanSignIn(request, "luxe-salon-spa"))) {
      test.skip(true, "Clerk demo sign-in unavailable");
    }
    await captureHomeInboxThread(page, path.join(SHOWCASE_DIR, "inbox-web.png"));
  });

  test("home — today-mobile.png", async ({ page, request }) => {
    if (!(await demoCanSignIn(request, "luxe-salon-spa"))) {
      test.skip(true, "Clerk demo sign-in unavailable");
    }
    await captureHomeTodayMobile(page, path.join(SHOWCASE_DIR, "today-mobile.png"));
  });

  test("home — booking-page.png (full scroll)", async ({ page, request }) => {
    const res = await request.get("http://127.0.0.1:3000/api/public/b/luxe-salon-spa");
    if (!res.ok()) test.skip(true, "luxe-salon-spa not seeded");
    await captureHomeBooking(page, path.join(SHOWCASE_DIR, "booking-page.png"));
  });

  for (const spec of VERTICAL_CAPTURES) {
    test(`vertical — ${spec.folder} web`, async ({ page, request }) => {
      if (!(await demoCanSignIn(request, spec.demoSlug))) {
        test.skip(true, `sign-in unavailable for ${spec.demoSlug}`);
      }
      const dir = verticalShowcaseDir(spec.folder);
      await captureWebOwner(page, spec, path.join(dir, "web.png"));
    });

    test(`vertical — ${spec.folder} mobile`, async ({ page, request }) => {
      if (!(await demoCanSignIn(request, spec.demoSlug))) {
        test.skip(true, `sign-in unavailable for ${spec.demoSlug}`);
      }
      const dir = verticalShowcaseDir(spec.folder);
      await captureMobileOwner(page, spec, path.join(dir, "mobile.png"));
    });
  }
});
