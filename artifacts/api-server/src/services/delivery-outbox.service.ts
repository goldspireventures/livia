/**
 * Delivery outbox — ops list / replay for notification_logs (SMS, email, Meta).
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, notificationLogsTable, businessesTable } from "@workspace/db";
import { OUTBOUND_DELIVERY_DEFAULTS } from "@workspace/policy";
import { getSubsystemCircuitHealth } from "../lib/subsystem-circuit";
import { resolveSideEffectMode } from "@workspace/policy";
import {
  jobFromNotificationLog,
  replayOutboundDelivery,
  sweepStuckOutboundDeliveries,
} from "./outbound-delivery.service";

export type DeliveryOutboxRow = {
  id: string;
  businessId: string | null;
  businessName: string | null;
  channel: string;
  status: string;
  templateKey: string | null;
  createdAt: string;
  sentAt: string | null;
  preview: string;
  error: string | null;
  deliveryAttempts: number;
  conversationId: string | null;
};

export async function getDeliveryOutboxSummary(): Promise<{
  pending: number;
  failed: number;
  sent24h: number;
  sideEffectsMode: ReturnType<typeof resolveSideEffectMode>;
  circuits: ReturnType<typeof getSubsystemCircuitHealth>;
}> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const channels = ["SMS", "EMAIL", "WHATSAPP"] as const;

  const [counts] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${notificationLogsTable.status} = 'PENDING' and ${notificationLogsTable.channel} in ('SMS','EMAIL','WHATSAPP'))::int`,
      failed: sql<number>`count(*) filter (where ${notificationLogsTable.status} = 'FAILED' and ${notificationLogsTable.channel} in ('SMS','EMAIL','WHATSAPP'))::int`,
      sent24h: sql<number>`count(*) filter (where ${notificationLogsTable.status} = 'SENT' and ${notificationLogsTable.channel} in ('SMS','EMAIL','WHATSAPP') and ${notificationLogsTable.createdAt} >= ${dayAgo})::int`,
    })
    .from(notificationLogsTable);

  return {
    pending: counts?.pending ?? 0,
    failed: counts?.failed ?? 0,
    sent24h: counts?.sent24h ?? 0,
    sideEffectsMode: resolveSideEffectMode(),
    circuits: getSubsystemCircuitHealth(),
  };
}

export async function listDeliveryOutbox(args: {
  status?: "PENDING" | "FAILED";
  businessId?: string;
  limit?: number;
}): Promise<DeliveryOutboxRow[]> {
  const limit = Math.min(Math.max(args.limit ?? 40, 1), 100);
  const channels = ["SMS", "EMAIL", "WHATSAPP"] as const;

  const conditions = [inArray(notificationLogsTable.channel, [...channels])];
  if (args.status) {
    conditions.push(eq(notificationLogsTable.status, args.status));
  }
  if (args.businessId?.trim()) {
    conditions.push(eq(notificationLogsTable.businessId, args.businessId.trim()));
  }

  const rows = await db
    .select({
      id: notificationLogsTable.id,
      businessId: notificationLogsTable.businessId,
      businessName: businessesTable.name,
      channel: notificationLogsTable.channel,
      status: notificationLogsTable.status,
      templateKey: notificationLogsTable.templateKey,
      payload: notificationLogsTable.payload,
      createdAt: notificationLogsTable.createdAt,
      sentAt: notificationLogsTable.sentAt,
    })
    .from(notificationLogsTable)
    .leftJoin(businessesTable, eq(notificationLogsTable.businessId, businessesTable.id))
    .where(and(...conditions))
    .orderBy(desc(notificationLogsTable.createdAt))
    .limit(limit);

  return rows.map((row) => {
    const p = (row.payload ?? {}) as Record<string, unknown>;
    const attempts =
      typeof p.deliveryAttempts === "number" && Number.isFinite(p.deliveryAttempts)
        ? p.deliveryAttempts
        : 0;
    const body = typeof p.body === "string" ? p.body : "";
    const platformChannel =
      typeof p.platformChannel === "string" ? p.platformChannel : row.channel;
    return {
      id: row.id,
      businessId: row.businessId,
      businessName: row.businessName,
      channel: platformChannel,
      status: row.status,
      templateKey: row.templateKey,
      createdAt: row.createdAt?.toISOString?.() ?? String(row.createdAt),
      sentAt: row.sentAt?.toISOString?.() ?? null,
      preview: body.slice(0, 120),
      error: typeof p.error === "string" ? p.error : null,
      deliveryAttempts: attempts,
      conversationId: typeof p.conversationId === "string" ? p.conversationId : null,
    };
  });
}

export async function replayDeliveryOutboxRow(notifLogId: string): Promise<{
  ok: boolean;
  status?: "QUEUED" | "SENT" | "FAILED";
  reason?: string;
}> {
  return replayOutboundDelivery(notifLogId);
}

export { sweepStuckOutboundDeliveries, OUTBOUND_DELIVERY_DEFAULTS };
