import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

const KeysSchema = z.object({
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

const SubscribeInput = z.object({
  userId: z.string().min(1),
  endpoint: z.string().url(),
  keys: KeysSchema,
});

export async function upsertWebPushSubscription(input: z.infer<typeof SubscribeInput>) {
  const { userId, endpoint, keys } = SubscribeInput.parse(input);

  return prisma.webPushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth },
  });
}

export async function deleteWebPushSubscription(input: { userId: string; endpoint: string }) {
  const { userId, endpoint } = z.object({ userId: z.string().min(1), endpoint: z.string().min(1) }).parse(input);

  const existing = await prisma.webPushSubscription.findFirst({
    where: { userId, endpoint },
    select: { id: true },
  });
  if (!existing) return { ok: false as const };

  await prisma.webPushSubscription.delete({ where: { id: existing.id } });
  return { ok: true as const };
}

export async function listWebPushSubscriptionsForUser(userId: string) {
  return prisma.webPushSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, endpoint: true, createdAt: true },
  });
}
