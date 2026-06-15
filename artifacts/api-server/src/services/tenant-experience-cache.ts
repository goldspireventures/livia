/**
 * Tenant experience bundle cache — resolve-clock performance.
 * Invalidated on tenant mutation (vertical / preset change).
 */

type CacheEntry = {
  value: unknown;
  expiresAt: number;
  cacheKey: string;
};

const TTL_MS = 45_000;
const cache = new Map<string, CacheEntry>();

function cacheKey(businessId: string, fingerprint: string): string {
  return `${businessId}:${fingerprint}`;
}

export function buildTenantExperienceFingerprint(biz: {
  vertical?: string | null;
  category?: string | null;
  presentationPresetId?: string | null;
  onboardingState?: unknown;
  updatedAt?: Date | string | null;
}): string {
  const updated =
    biz.updatedAt instanceof Date
      ? biz.updatedAt.toISOString()
      : String(biz.updatedAt ?? "");
  return [
    biz.vertical ?? "",
    biz.category ?? "",
    biz.presentationPresetId ?? "",
    updated,
    JSON.stringify(biz.onboardingState ?? null),
  ].join("|");
}

export function getCachedTenantExperience<T>(
  businessId: string,
  fingerprint: string,
): T | undefined {
  const key = cacheKey(businessId, fingerprint);
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function setCachedTenantExperience(
  businessId: string,
  fingerprint: string,
  value: unknown,
): void {
  const key = cacheKey(businessId, fingerprint);
  cache.set(key, {
    value,
    cacheKey: key,
    expiresAt: Date.now() + TTL_MS,
  });
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

export function invalidateTenantExperienceCache(businessId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${businessId}:`)) cache.delete(key);
  }
}

export function clearTenantExperienceCache(): void {
  cache.clear();
}
