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

const OTP_REQUEST_5M = 8;
const OTP_REQUEST_1H = 24;
const OTP_VERIFY_10M = 8;
const OTP_VERIFY_WINDOW_MS = 10 * 60_000;

/** Guest hub OTP request — stricter than public chat (8 / 5m, 24 / 1h per IP). */
export async function guestHubOtpRequestRateLimitOk(
  ip: string,
): Promise<{ ok: boolean; retryAfter?: number }> {
  const ipKey = `otp-req:${(ip.slice(0, 120) || "unknown")}`;
  const w5 = await bumpWindow(ipKey, "5m", OTP_REQUEST_5M, WINDOW_5M_MS);
  if (!w5.ok) return w5;
  return bumpWindow(ipKey, "1h", OTP_REQUEST_1H, WINDOW_1H_MS);
}

/** Per OTP session token — limit verify brute-force (8 / 10m). */
export async function guestHubOtpVerifyRateLimitOk(
  sessionToken: string,
): Promise<{ ok: boolean; retryAfter?: number }> {
  const key = `otp-ver:${sessionToken.slice(0, 96)}`;
  return bumpWindow(key, "5m", OTP_VERIFY_10M, OTP_VERIFY_WINDOW_MS);
}
