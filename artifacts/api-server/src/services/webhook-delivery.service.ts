import { createHmac } from "node:crypto";
import { db, webhookEndpointsTable, webhookDeliveriesTable } from "@workspace/db";
import { and, eq, lte } from "drizzle-orm";
import type { EventName, EventPayload } from "@workspace/event-bus";
import { generateId } from "../lib/id";
import { isWebhookEvent, type WebhookEventName } from "../lib/partner-scopes";
import { logger } from "../lib/logger";

const RETRY_DELAYS_MS = [0, 60_000, 300_000, 1_800_000, 7_200_000, 43_200_000, 86_400_000];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length;

function businessIdFromPayload(name: EventName, payload: unknown): string | null {
  const p = payload as { businessId?: string };
  if (!isWebhookEvent(name)) return null;
  return p.businessId ?? null;
}

function signPayload(secret: string, timestamp: number, body: string): string {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

export async function fanOutDomainEventToWebhooks<K extends EventName>(
  name: K,
  payload: EventPayload<K>,
  eventId: string,
): Promise<void> {
  if (!isWebhookEvent(name)) return;
  const businessId = businessIdFromPayload(name, payload);
  if (!businessId) return;

  const endpoints = await db
    .select()
    .from(webhookEndpointsTable)
    .where(
      and(
        eq(webhookEndpointsTable.businessId, businessId),
        eq(webhookEndpointsTable.enabled, true),
      ),
    );

  for (const ep of endpoints) {
    const subscribed = ep.subscribedEvents ?? [];
    if (!subscribed.includes(name)) continue;

    const deliveryId = generateId();
    const envelope = {
      id: eventId,
      type: name,
      created_at: new Date().toISOString(),
      data: payload,
    };

    await db.insert(webhookDeliveriesTable).values({
      id: deliveryId,
      endpointId: ep.id,
      businessId,
      eventId,
      eventName: name,
      payload: envelope as Record<string, unknown>,
      status: "pending",
      attempts: 0,
      nextRetryAt: new Date(),
    });

    void processWebhookDelivery(deliveryId).catch((err) => {
      logger.warn({ err, deliveryId }, "webhook delivery failed to start");
    });
  }
}

export async function sendTestWebhook(
  businessId: string,
  endpointId: string,
): Promise<{ deliveryId: string; ok: boolean; statusCode?: number; error?: string }> {
  const [ep] = await db
    .select()
    .from(webhookEndpointsTable)
    .where(
      and(
        eq(webhookEndpointsTable.id, endpointId),
        eq(webhookEndpointsTable.businessId, businessId),
      ),
    );
  if (!ep) throw new Error("ENDPOINT_NOT_FOUND");

  const eventId = `test_${generateId()}`;
  const envelope = {
    id: eventId,
    type: "booking.confirmed" as WebhookEventName,
    created_at: new Date().toISOString(),
    data: {
      businessId,
      bookingId: "test_booking",
      test: true,
    },
  };

  const deliveryId = generateId();
  await db.insert(webhookDeliveriesTable).values({
    id: deliveryId,
    endpointId: ep.id,
    businessId,
    eventId,
    eventName: "booking.confirmed",
    payload: envelope,
    status: "pending",
    attempts: 0,
    nextRetryAt: new Date(),
  });

  const result = await processWebhookDelivery(deliveryId);
  return { deliveryId, ...result };
}

export async function processWebhookDelivery(
  deliveryId: string,
): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
  const [row] = await db
    .select()
    .from(webhookDeliveriesTable)
    .where(eq(webhookDeliveriesTable.id, deliveryId));

  if (!row || row.status === "delivered") {
    return { ok: true };
  }

  const [ep] = await db
    .select()
    .from(webhookEndpointsTable)
    .where(eq(webhookEndpointsTable.id, row.endpointId));

  if (!ep || !ep.enabled) {
    await db
      .update(webhookDeliveriesTable)
      .set({ status: "failed", lastError: "endpoint disabled or missing" })
      .where(eq(webhookDeliveriesTable.id, deliveryId));
    return { ok: false, error: "endpoint disabled" };
  }

  const attempt = row.attempts + 1;
  const body = JSON.stringify(row.payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(ep.secret, timestamp, body);

  try {
    const res = await fetch(ep.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Livia-Event": row.eventName,
        "X-Livia-Delivery-Id": deliveryId,
        "X-Livia-Signature": signature,
        "User-Agent": "Livia-Webhooks/1.0",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      await db
        .update(webhookDeliveriesTable)
        .set({
          status: "delivered",
          attempts: attempt,
          deliveredAt: new Date(),
          lastError: null,
          nextRetryAt: null,
        })
        .where(eq(webhookDeliveriesTable.id, deliveryId));
      return { ok: true, statusCode: res.status };
    }

    const errText = `HTTP ${res.status}`;
    return await scheduleRetry(deliveryId, attempt, errText);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return await scheduleRetry(deliveryId, attempt, msg);
  }
}

async function scheduleRetry(
  deliveryId: string,
  attempt: number,
  error: string,
): Promise<{ ok: boolean; error: string }> {
  if (attempt >= MAX_ATTEMPTS) {
    await db
      .update(webhookDeliveriesTable)
      .set({
        status: "failed",
        attempts: attempt,
        lastError: error,
        nextRetryAt: null,
      })
      .where(eq(webhookDeliveriesTable.id, deliveryId));
    return { ok: false, error };
  }

  const delay = RETRY_DELAYS_MS[attempt] ?? 86_400_000;
  await db
    .update(webhookDeliveriesTable)
    .set({
      status: "pending",
      attempts: attempt,
      lastError: error,
      nextRetryAt: new Date(Date.now() + delay),
    })
    .where(eq(webhookDeliveriesTable.id, deliveryId));

  return { ok: false, error };
}

export async function sweepPendingWebhookDeliveries(limit = 50): Promise<{
  processed: number;
  delivered: number;
  failed: number;
}> {
  const now = new Date();
  const pending = await db
    .select({ id: webhookDeliveriesTable.id })
    .from(webhookDeliveriesTable)
    .where(
      and(
        eq(webhookDeliveriesTable.status, "pending"),
        lte(webhookDeliveriesTable.nextRetryAt, now),
      ),
    )
    .limit(limit);

  let delivered = 0;
  let failed = 0;
  for (const { id } of pending) {
    const r = await processWebhookDelivery(id);
    if (r.ok) delivered += 1;
    else failed += 1;
  }
  return { processed: pending.length, delivered, failed };
}
