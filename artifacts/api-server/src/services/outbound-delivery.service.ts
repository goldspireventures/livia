/**
 * Outbound channel delivery — queued after thread persist (notification_logs outbox).
 * Mirrors platform-notification hub: Inngest when available, sync fallback, cron retry.
 */
import { and, eq, inArray, lt } from "drizzle-orm";
import { db, notificationLogsTable } from "@workspace/db";
import type { OutboundDeliveryJob } from "@workspace/policy";
import {
  isSubsystemEnabled,
  OUTBOUND_DELIVERY_DEFAULTS,
  resolveSideEffectMode,
} from "@workspace/policy";
import { inngest, isInngestWorkflowsEnabled } from "../lib/inngest";
import { logger } from "../lib/logger";
import {
  isSubsystemCircuitOpen,
  recordSubsystemFailure,
  recordSubsystemSuccess,
} from "../lib/subsystem-circuit";
import { runOutboundChannelTransport } from "./ai-outbound.service";

export async function executeOutboundDelivery(job: OutboundDeliveryJob): Promise<"SENT" | "FAILED"> {
  if (!isSubsystemEnabled("messaging_outbound", resolveSideEffectMode())) {
    return "FAILED";
  }
  if (isSubsystemCircuitOpen("messaging_outbound")) {
    logger.warn(
      { notifLogId: job.notifLogId, channel: job.channel },
      "messaging_outbound circuit open — skipping transport",
    );
    return "FAILED";
  }

  try {
    const transport = await runOutboundChannelTransport(job);
    await db
      .update(notificationLogsTable)
      .set({
        status: "SENT",
        sentAt: new Date(),
        payload: {
          to: job.to,
          body: job.body,
          subject: job.subject,
          conversationId: job.conversationId ?? null,
          externalMessageId: transport.externalMessageId ?? null,
        },
      })
      .where(eq(notificationLogsTable.id, job.notifLogId));
    recordSubsystemSuccess("messaging_outbound");
    return "SENT";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(notificationLogsTable)
      .set({
        status: "FAILED",
        payload: {
          to: job.to,
          body: job.body,
          subject: job.subject,
          conversationId: job.conversationId ?? null,
          error: message,
        },
      })
      .where(eq(notificationLogsTable.id, job.notifLogId));
    recordSubsystemFailure("messaging_outbound", err);
    logger.warn(
      { err, notifLogId: job.notifLogId, channel: job.channel },
      "outbound channel delivery failed",
    );
    return "FAILED";
  }
}

/** Enqueue transport — never throws. Returns QUEUED when handed to Inngest. */
export async function scheduleOutboundDelivery(
  job: OutboundDeliveryJob,
): Promise<"QUEUED" | "SENT" | "FAILED"> {
  if (!isSubsystemEnabled("messaging_outbound", resolveSideEffectMode())) return "FAILED";
  if (isSubsystemCircuitOpen("messaging_outbound")) return "FAILED";

  if (isInngestWorkflowsEnabled()) {
    try {
      await inngest.send({
        name: "livia/platform.outbound.deliver",
        data: { job },
      });
      return "QUEUED";
    } catch (err) {
      logger.warn({ err, notifLogId: job.notifLogId }, "outbound Inngest enqueue failed — sync fallback");
    }
  }

  return executeOutboundDelivery(job);
}

function deliveryAttempts(payload: unknown): number {
  if (!payload || typeof payload !== "object") return 0;
  const n = (payload as { deliveryAttempts?: unknown }).deliveryAttempts;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

const OUTBOX_CHANNELS = ["SMS", "EMAIL", "WHATSAPP"] as const;

export function jobFromNotificationLog(row: {
  id: string;
  businessId: string | null;
  channel: string;
  payload: unknown;
}): OutboundDeliveryJob | null {
  if (!OUTBOX_CHANNELS.includes(row.channel as (typeof OUTBOX_CHANNELS)[number])) return null;

  const p = (row.payload ?? {}) as Record<string, unknown>;
  const to = typeof p.to === "string" ? p.to : "";
  const body = typeof p.body === "string" ? p.body : "";
  if (!to || !body) return null;

  const platformChannel = typeof p.platformChannel === "string" ? p.platformChannel : row.channel;
  const deliveryChannel =
    platformChannel === "INSTAGRAM" || platformChannel === "MESSENGER"
      ? platformChannel
      : platformChannel === "WHATSAPP"
        ? "WHATSAPP"
        : row.channel === "SMS"
          ? "SMS"
          : row.channel === "EMAIL"
            ? "EMAIL"
            : null;
  if (!deliveryChannel) return null;

  return {
    channel: deliveryChannel,
    businessId: row.businessId,
    notifLogId: row.id,
    conversationId: typeof p.conversationId === "string" ? p.conversationId : null,
    to,
    body,
    subject: typeof p.subject === "string" ? p.subject : undefined,
    html: typeof p.html === "string" ? p.html : undefined,
    from: typeof p.from === "string" ? p.from : null,
    replyTo: typeof p.replyTo === "string" ? p.replyTo : undefined,
    senderId: typeof p.senderId === "string" ? p.senderId : null,
    recipientId: typeof p.recipientId === "string" ? p.recipientId : null,
  };
}

/** Manual replay from internal ops — resets row to PENDING and re-queues. */
export async function replayOutboundDelivery(notifLogId: string): Promise<{
  ok: boolean;
  status?: "QUEUED" | "SENT" | "FAILED";
  reason?: string;
}> {
  const [row] = await db
    .select({
      id: notificationLogsTable.id,
      businessId: notificationLogsTable.businessId,
      channel: notificationLogsTable.channel,
      status: notificationLogsTable.status,
      payload: notificationLogsTable.payload,
    })
    .from(notificationLogsTable)
    .where(eq(notificationLogsTable.id, notifLogId))
    .limit(1);

  if (!row) return { ok: false, reason: "NOT_FOUND" };
  if (row.status === "SENT") return { ok: false, reason: "ALREADY_SENT" };

  const job = jobFromNotificationLog(row);
  if (!job) return { ok: false, reason: "INVALID_PAYLOAD" };

  const attempts = deliveryAttempts(row.payload);
  await db
    .update(notificationLogsTable)
    .set({
      status: "PENDING",
      payload: {
        ...(typeof row.payload === "object" && row.payload ? row.payload : {}),
        deliveryAttempts: attempts + 1,
        replayedAt: new Date().toISOString(),
      },
    })
    .where(eq(notificationLogsTable.id, notifLogId));

  const status = await scheduleOutboundDelivery(job);
  return { ok: status !== "FAILED", status };
}

function jobFromLog(row: {
  id: string;
  businessId: string | null;
  channel: string;
  payload: unknown;
}): OutboundDeliveryJob | null {
  return jobFromNotificationLog(row);
}

/** Retry PENDING/FAILED SMS+email rows — safe to call from cron. */
export async function sweepStuckOutboundDeliveries(): Promise<{
  scanned: number;
  retried: number;
  abandoned: number;
}> {
  const retryBefore = new Date(Date.now() - OUTBOUND_DELIVERY_DEFAULTS.retryAfterMs);
  const abandonBefore = new Date(Date.now() - OUTBOUND_DELIVERY_DEFAULTS.abandonAfterMs);

  const rows = await db
    .select({
      id: notificationLogsTable.id,
      businessId: notificationLogsTable.businessId,
      channel: notificationLogsTable.channel,
      status: notificationLogsTable.status,
      payload: notificationLogsTable.payload,
      createdAt: notificationLogsTable.createdAt,
    })
    .from(notificationLogsTable)
    .where(
      and(
        inArray(notificationLogsTable.status, ["PENDING", "FAILED"]),
        inArray(notificationLogsTable.channel, [...OUTBOX_CHANNELS]),
        lt(notificationLogsTable.createdAt, retryBefore),
      ),
    )
    .limit(50);

  let retried = 0;
  let abandoned = 0;

  for (const row of rows) {
    const attempts = deliveryAttempts(row.payload);
    if (
      attempts >= OUTBOUND_DELIVERY_DEFAULTS.maxRetryAttempts ||
      row.createdAt < abandonBefore
    ) {
      abandoned += 1;
      continue;
    }

    const job = jobFromLog(row);
    if (!job) {
      abandoned += 1;
      continue;
    }

    const nextAttempts = attempts + 1;
    await db
      .update(notificationLogsTable)
      .set({
        status: "PENDING",
        payload: {
          ...(typeof row.payload === "object" && row.payload ? row.payload : {}),
          deliveryAttempts: nextAttempts,
        },
      })
      .where(eq(notificationLogsTable.id, row.id));

    await scheduleOutboundDelivery(job);
    retried += 1;
  }

  return { scanned: rows.length, retried, abandoned };
}
