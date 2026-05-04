import "server-only";

import { z } from "zod";

import { notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const CreateInput = z.object({
  userId: z.string().min(1),
  businessId: z.string().min(1).optional().nullable(),
  kind: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  href: z.string().min(1).optional().nullable(),
  payload: z.any().optional().nullable(),
});

export async function createInAppNotification(input: z.infer<typeof CreateInput>) {
  const parsed = CreateInput.parse(input);
  return prisma.inAppNotification.create({
    data: {
      userId: parsed.userId,
      businessId: parsed.businessId ?? undefined,
      kind: parsed.kind,
      title: parsed.title,
      body: parsed.body,
      href: parsed.href ?? undefined,
      payload: parsed.payload ?? undefined,
    },
  });
}

const ListInput = z.object({
  userId: z.string().min(1),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function listInAppNotificationsForUser(input: z.infer<typeof ListInput>) {
  const { userId, limit = 40 } = ListInput.parse(input);
  const rows = await prisma.inAppNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return [...rows].sort((a, b) => {
    const au = a.readAt === null ? 0 : 1;
    const bu = b.readAt === null ? 0 : 1;
    if (au !== bu) return au - bu;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function countUnreadInAppNotifications(userId: string) {
  return prisma.inAppNotification.count({
    where: { userId, readAt: null },
  });
}

export async function countUnreadInAppNotificationsForBusiness(userId: string, businessId: string) {
  return prisma.inAppNotification.count({
    where: { userId, businessId, readAt: null },
  });
}

const ListForBusinessInput = z.object({
  userId: z.string().min(1),
  businessId: z.string().min(1),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function listInAppNotificationsForUserInBusiness(input: z.infer<typeof ListForBusinessInput>) {
  const { userId, businessId, limit = 40 } = ListForBusinessInput.parse(input);
  const rows = await prisma.inAppNotification.findMany({
    where: { userId, businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return [...rows].sort((a, b) => {
    const au = a.readAt === null ? 0 : 1;
    const bu = b.readAt === null ? 0 : 1;
    if (au !== bu) return au - bu;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

const MarkReadInput = z.object({
  userId: z.string().min(1),
  id: z.string().min(1),
  /// When set, ensures the row belongs to this tenant (defense in depth for `/b/.../notifications`).
  businessId: z.string().min(1).optional(),
});

export async function markInAppNotificationRead(input: z.infer<typeof MarkReadInput>) {
  const { userId, id, businessId } = MarkReadInput.parse(input);
  const row = await prisma.inAppNotification.findFirst({
    where: { id, userId, ...(businessId ? { businessId } : {}) },
    select: { id: true },
  });
  if (!row) throw notFound("Notification not found.");

  await prisma.inAppNotification.update({
    where: { id },
    data: { readAt: new Date() },
  });
}
