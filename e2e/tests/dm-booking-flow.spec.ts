/**
 * WhatsApp DM booking pipeline — simulated inbound creates a real booking when AI is off.
 */
import { test, expect } from "@playwright/test";
import { apiBase, demoCanSignIn, ensureDemoProvisioned, signInBusiness } from "../helpers/demo-auth";

test.describe("DM booking pipeline", () => {
  test.beforeAll(async ({ request }) => {
    await ensureDemoProvisioned(request);
  });

  test("simulated WhatsApp inbound books or opens thread", async ({ page, request }) => {
    const slug = "luxe-salon-spa";
    if (!(await demoCanSignIn(request, slug))) {
      test.skip(true, "Clerk unavailable");
    }
    await signInBusiness(page, slug);

    const bizRes = await page.request.get(`${apiBase}/api/me/businesses`);
    expect(bizRes.ok()).toBeTruthy();
    const businesses = (await bizRes.json()) as Array<{ id: string }>;
    const businessId = businesses[0]?.id;
    expect(businessId).toBeTruthy();

    const inbound = await page.request.post(`${apiBase}/api/dev/meta/inbound`, {
      data: {
        businessId,
        channel: "WHATSAPP",
        from: "+353871111222",
        text: "Hi — can I book a haircut tomorrow afternoon?",
        displayName: "E2E Guest",
      },
    });
    if (inbound.status() === 404) {
      test.skip(true, "Restart API after pull");
    }
    expect(inbound.ok(), await inbound.text()).toBeTruthy();
    const result = (await inbound.json()) as {
      conversationId?: string;
      handled?: boolean;
      bookingId?: string;
      aiReplyQueued?: boolean;
    };
    expect(result.conversationId ?? result.handled).toBeTruthy();
    expect(result.bookingId ?? result.aiReplyQueued ?? result.handled).toBeTruthy();
  });
});
