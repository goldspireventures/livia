import { and, eq, inArray } from "drizzle-orm";
import { businessMembershipsTable, db, deviceTokensTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { sendWebPushToSubscription, isWebPushConfigured } from "./web-push.service";

type MembershipRole = "OWNER" | "ADMIN" | "STAFF";

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
  priority?: "default" | "high";
};

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  if (!messages.length) return;

  const accessToken = process.env["EXPO_ACCESS_TOKEN"];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.warn({ status: res.status, text }, "Expo push send failed");
    }
  } catch (err) {
    logger.error({ err }, "Expo push transport error");
  }
}

export async function notifyBusinessMembersPush(args: {
  businessId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: "default" | "high";
}): Promise<{ sent: number }> {
  return notifyBusinessMembersPushForRoles({
    ...args,
    roles: ["OWNER", "ADMIN", "STAFF"],
  });
}

export async function notifyBusinessMembersPushForRoles(args: {
  businessId: string;
  roles: MembershipRole[];
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: "default" | "high";
}): Promise<{ sent: number }> {
  const memberships = await db
    .select({ userId: businessMembershipsTable.userId })
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, args.businessId),
        eq(businessMembershipsTable.status, "ACTIVE"),
        inArray(businessMembershipsTable.role, args.roles),
      ),
    );

  const userIds = [...new Set(memberships.map((m) => m.userId))];
  if (!userIds.length) return { sent: 0 };

  const tokens = await db
    .select({ token: deviceTokensTable.token, platform: deviceTokensTable.platform })
    .from(deviceTokensTable)
    .where(
      and(eq(deviceTokensTable.isActive, true), inArray(deviceTokensTable.userId, userIds)),
    );

  const expoTokens = tokens
    .filter((t) => t.platform !== "WEB" && t.token.startsWith("ExponentPushToken"))
    .map((t) => t.token);

  const webSubs = tokens.filter((t) => t.platform === "WEB").map((t) => t.token);

  let sent = 0;

  if (expoTokens.length) {
    await sendExpoPush(
      expoTokens.map((to) => ({
        to,
        title: args.title,
        body: args.body,
        data: args.data,
        sound: "default",
        priority: args.priority ?? "high",
      })),
    );
    sent += expoTokens.length;
  }

  if (webSubs.length && isWebPushConfigured()) {
    for (const sub of webSubs) {
      const ok = await sendWebPushToSubscription(sub, {
        title: args.title,
        body: args.body,
        data: args.data,
      });
      if (ok) sent += 1;
    }
  }

  if (!sent) {
    logger.debug({ businessId: args.businessId, roles: args.roles }, "No push targets for roles");
  }

  return { sent };
}
