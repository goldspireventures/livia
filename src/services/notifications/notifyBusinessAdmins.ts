import "server-only";

import type { Prisma } from "@prisma/client";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

import { createInAppNotification } from "./inAppNotificationService";
import { createNotificationLog, finalizeNotificationLog } from "./notificationLogService";
import { sendWebPushToUser } from "./webPushOutbound";

export async function listAdminUserIdsForBusiness(businessId: string): Promise<string[]> {
  const rows = await prisma.businessMembership.findMany({
    where: { businessId, role: { in: ["OWNER", "ADMIN"] } },
    select: { userId: true },
  });
  return [...new Set(rows.map((r) => r.userId))];
}

function absoluteUrlForHref(href: string | null | undefined): string | undefined {
  if (!href) return undefined;
  const base = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  if (!base) return undefined;
  if (href.startsWith("http")) return href;
  return `${base}${href.startsWith("/") ? href : `/${href}`}`;
}

/**
 * In-app row per admin + best-effort web push. Excludes `excludeUserId` when set (e.g. actor who made the change).
 * Never throws — callers should `void` this with `.catch(console.error)` if needed.
 */
export async function fanOutInAppAndPushToBusinessAdmins(input: {
  businessId: string;
  excludeUserId?: string | null;
  kind: string;
  title: string;
  body: string;
  href?: string | null;
  payload?: Record<string, unknown> | null;
  push?: { title: string; body: string; url?: string } | null;
  /** When set, each web push attempt is written to `NotificationLog` (SENT / FAILED / SKIPPED). */
  auditWebPush?: { templateKey: string; payload?: Prisma.InputJsonValue };
}): Promise<void> {
  const adminIds = await listAdminUserIdsForBusiness(input.businessId);
  const targets = input.excludeUserId
    ? adminIds.filter((id) => id !== input.excludeUserId)
    : adminIds;

  const defaultPushUrl = absoluteUrlForHref(input.href ?? undefined);
  const pushPayload =
    input.push === null
      ? null
      : input.push
        ? {
            title: input.push.title,
            body: input.push.body,
            url: input.push.url ?? defaultPushUrl,
          }
        : {
            title: input.title,
            body: input.body,
            url: defaultPushUrl,
          };

  for (const userId of targets) {
    try {
      await createInAppNotification({
        userId,
        businessId: input.businessId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        href: input.href ?? undefined,
        payload: input.payload ?? undefined,
      });
    } catch (e) {
      console.error("[fanOutInAppAndPush] in_app", e);
    }
  }

  if (!pushPayload) return;

  for (const userId of targets) {
    if (input.auditWebPush) {
      let logId: string | null = null;
      try {
        const log = await createNotificationLog({
          businessId: input.businessId,
          recipientUserId: userId,
          channel: "WEB_PUSH",
          templateKey: input.auditWebPush.templateKey,
          payload: input.auditWebPush.payload ?? undefined,
          target: "web_push",
        });
        logId = log.id;

        if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
          await finalizeNotificationLog(logId, { status: "SKIPPED", lastError: "vapid_not_configured" });
          continue;
        }

        const result = await sendWebPushToUser({
          userId,
          payload: {
            title: pushPayload.title,
            body: pushPayload.body,
            url: pushPayload.url,
          },
        });

        if (result.attempted === 0) {
          await finalizeNotificationLog(logId, {
            status: "SKIPPED",
            lastError: result.errors[0] ?? "no_subscriptions",
          });
        } else if (result.delivered > 0) {
          await finalizeNotificationLog(logId, { status: "SENT" });
        } else {
          await finalizeNotificationLog(logId, {
            status: "FAILED",
            lastError: result.errors.join("; ").slice(0, 500),
          });
        }
      } catch (e) {
        console.error("[fanOutInAppAndPush] push audit", e);
        if (logId) {
          await finalizeNotificationLog(logId, {
            status: "FAILED",
            lastError: String(e).slice(0, 500),
          }).catch(() => undefined);
        }
      }
      continue;
    }

    try {
      await sendWebPushToUser({
        userId,
        payload: {
          title: pushPayload.title,
          body: pushPayload.body,
          url: pushPayload.url,
        },
      });
    } catch (e) {
      console.error("[fanOutInAppAndPush] push", e);
    }
  }
}
