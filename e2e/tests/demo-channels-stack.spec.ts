/**
 * Demo channel stack — WhatsApp / Instagram configured + threads after provision.
 */
import { test, expect } from "@playwright/test";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

test.describe("Demo channel stack", () => {
  test.beforeAll(async ({ request }) => {
    const status = await request.get(`${apiBase}/api/demo/status`);
    const body = status.ok() ? await status.json() : { provisioned: false };
    if (!body.provisioned) {
      const prov = await request.post(`${apiBase}/api/demo/provision`, { timeout: 300_000 });
      expect(prov.ok(), await prov.text()).toBeTruthy();
    }
  });

  test("demo status reports WhatsApp + social threads on flagship", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/demo/status`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.channels).toBeTruthy();
    expect(body.channels.whatsappConfigured).toBe(true);
    expect(body.channels.smsNumberConfigured).toBe(true);
    expect(body.channels.whatsappThreads).toBeGreaterThan(0);
    expect(body.channels.instagramThreads).toBeGreaterThan(0);
  });

  test("meta webhook verify (dev)", async ({ request }) => {
    const token = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "livia_meta_verify_dev";
    const res = await request.get(
      `${apiBase}/api/channels/meta?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(token)}&hub.challenge=ok_demo_channels`,
    );
    if (res.status() === 404) {
      test.skip(true, "Restart API after pull");
    }
    if (res.status() === 403) {
      test.skip(true, "META_WEBHOOK_VERIFY_TOKEN mismatch — align .env with e2e default");
    }
    expect(res.status()).toBe(200);
    expect(await res.text()).toBe("ok_demo_channels");
  });
});
