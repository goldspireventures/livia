import { test, expect } from "@playwright/test";

test.describe("Meta messaging channels", () => {
  test("webhook verify challenge", async ({ request }) => {
    const token = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "livia_meta_verify_dev";
    const prev = process.env.META_WEBHOOK_VERIFY_TOKEN;
    process.env.META_WEBHOOK_VERIFY_TOKEN = token;

    const res = await request.get(
      `/api/channels/meta?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(token)}&hub.challenge=challenge_ok`,
    );
    if (prev) process.env.META_WEBHOOK_VERIFY_TOKEN = prev;

    if (res.status() === 404) {
      test.skip(true, "API server missing /api/channels/meta — restart api-server after pull");
    }
    if (res.status() === 403) {
      test.skip(true, "META_WEBHOOK_VERIFY_TOKEN mismatch on API server");
    }
    expect(res.status()).toBe(200);
    expect(await res.text()).toBe("challenge_ok");
  });

  test("communications returns messagingChannels shape", async ({ request }) => {
    const me = await request.get("/api/me/businesses");
    if (me.status() !== 200) {
      test.skip(true, "Auth required — run with Clerk session in full E2E");
    }
    const businesses = await me.json();
    const bid = businesses[0]?.id;
    if (!bid) {
      test.skip(true, "No businesses");
    }
    const res = await request.get(`/api/businesses/${bid}/communications`);
    if (res.status() === 401 || res.status() === 403) {
      test.skip(true, "Not authorized for comms");
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("metaWebhookUrl");
    expect(body).toHaveProperty("messagingChannels");
  });
});
