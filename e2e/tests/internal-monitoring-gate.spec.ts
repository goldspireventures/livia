/**
 * Internal ops monitoring API — production-like persisted rules, logs, reports.
 */
import { test, expect } from "@playwright/test";

const apiBase = process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";
const secret = process.env.INTERNAL_OPS_SECRET ?? process.env.INTERNAL_CRON_SECRET ?? "";

const headers = () => ({
  "X-Internal-Ops-Secret": secret,
  "X-Internal-Ops-Operator": "e2e@livia.io",
  "X-Internal-Ops-Role": "engineer",
  Accept: "application/json",
});

test.describe("Internal monitoring API", () => {
  test.beforeEach(() => {
    test.skip(!secret, "Set INTERNAL_OPS_SECRET in .env");
  });

  test.beforeAll(async ({ request }) => {
    await request.post(`${apiBase}/api/internal/ops/monitoring/seed-defaults`, {
      headers: headers(),
    });
  });

  test("monitoring overview with alerts block", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/internal/ops/monitoring/overview`, {
      headers: headers(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.observability?.service).toBeTruthy();
    expect(body.logBackends).toBeTruthy();
    expect(body.alerts).toBeTruthy();
    expect(typeof body.alerts.openCount).toBe("number");
  });

  test("time series", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/internal/ops/monitoring/series?hours=24`, {
      headers: headers(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.hours).toBe(24);
    expect(Array.isArray(body.bookings)).toBe(true);
  });

  test("platform log search", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/internal/ops/monitoring/logs?hours=24&limit=10`, {
      headers: headers(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test("alert rules seeded", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/internal/ops/monitoring/alerts/rules`, {
      headers: headers(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(4);
  });

  test("saved log searches", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/internal/ops/monitoring/saved-searches`, {
      headers: headers(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  test("grafana panel registry", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/internal/ops/monitoring/grafana`, {
      headers: headers(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.panels.length).toBeGreaterThanOrEqual(1);
  });

  test("ops report snapshot", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/internal/ops/monitoring/report`, {
      headers: headers(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.uptime).toBeTruthy();
    expect(body.metrics).toBeTruthy();
  });

  test("support tickets list", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/internal/ops/support-tickets?limit=5`, {
      headers: headers(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });
});
