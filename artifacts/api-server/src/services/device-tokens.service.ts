import { and, eq, inArray } from "drizzle-orm";
import { db, deviceTokensTable } from "@workspace/db";
import { generateId } from "../lib/id";

export async function registerDeviceToken(args: {
  userId: string;
  token: string;
  platform: "IOS" | "ANDROID" | "WEB";
}) {
  const [existing] = await db
    .select()
    .from(deviceTokensTable)
    .where(
      and(eq(deviceTokensTable.userId, args.userId), eq(deviceTokensTable.token, args.token)),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(deviceTokensTable)
      .set({ isActive: true, platform: args.platform, updatedAt: new Date() })
      .where(eq(deviceTokensTable.id, existing.id))
      .returning();
    return updated!;
  }

  const [row] = await db
    .insert(deviceTokensTable)
    .values({
      id: generateId(),
      userId: args.userId,
      platform: args.platform,
      token: args.token,
      isActive: true,
    })
    .returning();

  return row!;
}

export async function listActiveTokensForUserIds(userIds: string[]): Promise<string[]> {
  if (!userIds.length) return [];
  const rows = await db
    .select({ token: deviceTokensTable.token })
    .from(deviceTokensTable)
    .where(
      and(eq(deviceTokensTable.isActive, true), inArray(deviceTokensTable.userId, userIds)),
    );
  return rows.map((r) => r.token);
}
