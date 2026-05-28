import { and, eq } from "drizzle-orm";
import { db, publicChatRateLimitsTable } from "@workspace/db";

const LIMIT_5M = 30;
const LIMIT_1H = 120;
const WINDOW_5M_MS = 5 * 60_000;
const WINDOW_1H_MS = 60 * 60_000;

type WindowKey = "5m" | "1h";

async function bumpWindow(
  ipKey: string,
  window: WindowKey,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfter?: number }> {
  const now = new Date();
  const [existing] = await db
    .select()
    .from(publicChatRateLimitsTable)
    .where(
      and(
        eq(publicChatRateLimitsTable.ipKey, ipKey),
        eq(publicChatRateLimitsTable.window, window),
      ),
    )
    .limit(1);

  let count = 1;
  let resetAt = new Date(now.getTime() + windowMs);

  if (existing) {
    if (existing.resetAt <= now) {
      count = 1;
      resetAt = new Date(now.getTime() + windowMs);
    } else {
      count = existing.count + 1;
      resetAt = existing.resetAt;
    }
    await db
      .update(publicChatRateLimitsTable)
      .set({ count, resetAt })
      .where(
        and(
          eq(publicChatRateLimitsTable.ipKey, ipKey),
          eq(publicChatRateLimitsTable.window, window),
        ),
      );
  } else {
    await db.insert(publicChatRateLimitsTable).values({ ipKey, window, count: 1, resetAt });
  }

  if (count > limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000)),
    };
  }
  return { ok: true };
}

/** Per-IP limits for unauthenticated public chat (30 / 5m, 120 / 1h). */
export async function publicChatRateLimitOk(
  ip: string,
): Promise<{ ok: boolean; retryAfter?: number }> {
  const ipKey = ip.slice(0, 128) || "unknown";
  const w5 = await bumpWindow(ipKey, "5m", LIMIT_5M, WINDOW_5M_MS);
  if (!w5.ok) return w5;
  return bumpWindow(ipKey, "1h", LIMIT_1H, WINDOW_1H_MS);
}
