import "server-only";

import { NextResponse } from "next/server";

const WINDOW_MS = 60_000;

type Bucket = { windowStart: number; count: number };
const buckets = new Map<string, Bucket>();

function limitPerWindow(): number {
  const raw = process.env.PUBLIC_API_RATE_LIMIT_PER_IP_PER_MINUTE;
  if (raw === "0" || raw === "") return 0;
  const n = parseInt(raw ?? "120", 10);
  return Number.isFinite(n) && n > 0 ? n : 120;
}

function pruneBuckets(now: number) {
  const cutoff = now - WINDOW_MS * 5;
  for (const [ip, b] of buckets) {
    if (b.windowStart < cutoff) buckets.delete(ip);
  }
}

export function getPublicClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 128);
  return "unknown";
}

/**
 * Fixed-window per-IP limit for unauthenticated public APIs.
 * Set `PUBLIC_API_RATE_LIMIT_PER_IP_PER_MINUTE=0` to disable (e.g. some tests).
 * In multi-instance serverless, each instance has its own counters (so limits are soft).
 */
export function publicRateLimitExceeded(req: Request): NextResponse | null {
  const limit = limitPerWindow();
  if (limit <= 0) return null;

  if (Math.random() < 0.02) {
    pruneBuckets(Date.now());
  }

  const ip = getPublicClientIp(req);
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || now - b.windowStart >= WINDOW_MS) {
    b = { windowStart: now, count: 0 };
  }
  b.count += 1;
  buckets.set(ip, b);

  if (b.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((b.windowStart + WINDOW_MS - now) / 1000));
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests from this network. Please try again shortly.",
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      },
    );
  }

  return null;
}
