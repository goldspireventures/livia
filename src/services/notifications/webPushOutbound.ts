import "server-only";

import * as webPush from "web-push";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function vapidConfigured(): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}

export async function sendWebPushToUser(input: {
  userId: string;
  payload: { title: string; body: string; url?: string };
}): Promise<{ attempted: number; delivered: number; errors: string[] }> {
  if (!vapidConfigured()) {
    return { attempted: 0, delivered: 0, errors: ["vapid_not_configured"] };
  }

  webPush.setVapidDetails(env.VAPID_SUBJECT!, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);

  const subs = await prisma.webPushSubscription.findMany({ where: { userId: input.userId } });
  const body = JSON.stringify(input.payload);
  const errors: string[] = [];
  let delivered = 0;

  for (const s of subs) {
    try {
      await webPush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
        { TTL: 60 * 60 },
      );
      delivered += 1;
    } catch (e: unknown) {
      const statusCode = typeof e === "object" && e && "statusCode" in e ? (e as { statusCode?: number }).statusCode : undefined;
      const msg = statusCode === 410 || statusCode === 404 ? "subscription_gone" : String(e);
      errors.push(msg);
      if (statusCode === 410 || statusCode === 404) {
        await prisma.webPushSubscription.delete({ where: { id: s.id } }).catch(() => undefined);
      }
    }
  }

  return { attempted: subs.length, delivered, errors };
}
