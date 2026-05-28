const DEFAULT_ATTEMPTS = 3;
const BASE_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Bounded retry for external provider calls — exponential backoff, no infinite loops. */
export async function withBoundedProviderRetry<T>(
  provider: string,
  operation: string,
  businessId: string | null | undefined,
  fn: () => Promise<T>,
  maxAttempts = DEFAULT_ATTEMPTS,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= maxAttempts) break;
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`${provider}.${operation} failed for business ${businessId ?? "unknown"}`);
}
