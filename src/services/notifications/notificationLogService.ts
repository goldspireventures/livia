import "server-only";

import type { NotificationChannel, NotificationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createNotificationLog(input: {
  businessId?: string | null;
  recipientUserId?: string | null;
  channel: NotificationChannel;
  templateKey: string;
  payload?: Prisma.InputJsonValue;
  target?: string | null;
  status?: NotificationStatus;
}) {
  return prisma.notificationLog.create({
    data: {
      businessId: input.businessId ?? undefined,
      recipientUserId: input.recipientUserId ?? undefined,
      channel: input.channel,
      templateKey: input.templateKey,
      payload: input.payload,
      target: input.target ?? undefined,
      status: input.status ?? "PENDING",
    },
  });
}

export async function finalizeNotificationLog(
  id: string,
  patch: {
    status: NotificationStatus;
    providerMessageId?: string | null;
    lastError?: string | null;
    sentAt?: Date | null;
  },
) {
  return prisma.notificationLog.update({
    where: { id },
    data: {
      status: patch.status,
      providerMessageId: patch.providerMessageId,
      lastError: patch.lastError,
      sentAt: patch.sentAt ?? (patch.status === "SENT" ? new Date() : undefined),
    },
  });
}

export async function listNotificationLogsForBusiness(input: { businessId: string; limit?: number }) {
  const limit = Math.min(Math.max(input.limit ?? 40, 1), 100);
  return prisma.notificationLog.findMany({
    where: { businessId: input.businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      channel: true,
      status: true,
      templateKey: true,
      target: true,
      lastError: true,
      createdAt: true,
      sentAt: true,
    },
  });
}

export async function listNotificationLogsForBooking(input: {
  businessId: string;
  bookingId: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  return prisma.notificationLog.findMany({
    where: {
      businessId: input.businessId,
      payload: {
        path: ["bookingId"],
        equals: input.bookingId,
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      channel: true,
      status: true,
      templateKey: true,
      target: true,
      lastError: true,
      createdAt: true,
      sentAt: true,
    },
  });
}
