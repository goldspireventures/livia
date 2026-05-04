import "server-only";

import type { ChannelType, MessageDirection, MessageLogStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

function previewBody(body: string, max = 500): string {
  const t = body.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function normalizeFromValue(channel: ChannelType, raw: string): string {
  const v = raw.trim();
  if (channel === "PHONE" || channel === "SMS") {
    return v.replace(/\D/g, "") || v;
  }
  if (channel === "EMAIL") {
    return v.toLowerCase();
  }
  return v;
}

const IngestInboundInput = z.object({
  businessId: z.string().min(1),
  provider: z.string().min(1).max(64).optional(),
  channel: z.enum(["EMAIL", "PHONE", "SMS", "EXTERNAL", "OTHER"]),
  fromValue: z.string().min(1).max(512),
  body: z.string().min(1).max(16_000),
  payload: z.any().optional().nullable(),
});

/**
 * Persist inbound message and attempt to link an existing `ChannelIdentity` (same business + channel + value).
 */
export async function ingestInboundMessageLog(input: z.infer<typeof IngestInboundInput>) {
  const parsed = IngestInboundInput.parse(input);
  const rawTrim = parsed.fromValue.trim();
  const normalized = normalizeFromValue(parsed.channel as ChannelType, parsed.fromValue);

  const valueVariants = [...new Set([normalized, rawTrim, rawTrim.toLowerCase(), rawTrim.replace(/\D/g, "")])].filter(
    (v) => v.length > 0,
  );

  const identity = await prisma.channelIdentity.findFirst({
    where: {
      businessId: parsed.businessId,
      channel: parsed.channel as ChannelType,
      value: { in: valueVariants },
    },
    select: { id: true, customerId: true },
  });

  const status: MessageLogStatus = identity ? "LINKED" : "UNMATCHED";

  return prisma.messageLog.create({
    data: {
      businessId: parsed.businessId,
      provider: parsed.provider ?? "unknown",
      direction: "INBOUND" as MessageDirection,
      channel: parsed.channel as ChannelType,
      fromValue: normalized,
      bodyPreview: previewBody(parsed.body),
      payload: parsed.payload ?? undefined,
      customerId: identity?.customerId ?? undefined,
      channelIdentityId: identity?.id ?? undefined,
      status,
    },
  });
}

export async function listMessageLogsForBusiness(input: { businessId: string; limit?: number }) {
  const { businessId, limit = 80 } = input;
  return prisma.messageLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      provider: true,
      channel: true,
      fromValue: true,
      bodyPreview: true,
      status: true,
      createdAt: true,
      customerId: true,
    },
  });
}
