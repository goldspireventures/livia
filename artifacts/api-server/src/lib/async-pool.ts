/** Run async work with a fixed concurrency cap (avoids Clerk 429 storms). */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Math.min(Math.max(1, limit), items.length);

  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!, i);
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

const CLERK_RATE_LIMIT = /too many requests|rate limit|429/i;

export async function withClerkRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!CLERK_RATE_LIMIT.test(msg) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 400 * (i + 1) ** 2));
    }
  }
  throw lastErr;
}
