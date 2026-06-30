/**
 * Short-TTL cache + rate-limit backoff for Clerk `users.getUser`.
 *
 * Several hot paths (resolveClerkProfile on /me and business creation,
 * acceptPendingInvitations on first authenticated load) fetch the Clerk user
 * for its email / publicMetadata. Without caching, routine page loads call the
 * Clerk Backend API repeatedly, and a transient Clerk slowdown (or a burst of
 * activity) trips Clerk's per-instance rate limit (HTTP 429), which then
 * degrades the whole authenticated app.
 *
 * This wrapper:
 *  - caches each user for a short TTL (profile/metadata staleness is harmless),
 *  - on a 429, opens a brief global backoff window during which callers get the
 *    last cached value (if any) instead of hammering Clerk further.
 */

const TTL_MS = 30_000;

type CacheEntry = { user: unknown; expires: number };
const cache = new Map<string, CacheEntry>();
let backoffUntil = 0;

/** Record a Clerk rate-limit so subsequent calls serve cache during the window. */
export function noteClerkRateLimit(retryAfterSeconds = 10): void {
  backoffUntil = Date.now() + Math.max(1, retryAfterSeconds) * 1000;
}

/** True while we are intentionally backing off Clerk after a 429. */
export function isClerkBackingOff(): boolean {
  return Date.now() < backoffUntil;
}

/**
 * Fetch a Clerk user through the cache. `fetcher` should call
 * `clerk.users.getUser(userId)`. Returns the cached value during a backoff
 * window (or when fresh); otherwise fetches and caches.
 */
export async function cachedClerkGetUser<T>(
  userId: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(userId);
  if (hit && hit.expires > now) return hit.user as T;
  if (now < backoffUntil && hit) return hit.user as T;

  const user = await fetcher();
  cache.set(userId, { user, expires: now + TTL_MS });
  return user;
}

/** Test/maintenance helper — clear the in-memory cache. */
export function clearClerkUserCache(): void {
  cache.clear();
  backoffUntil = 0;
}
