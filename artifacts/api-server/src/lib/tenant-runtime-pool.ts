import type { Business } from "@workspace/db";
import { TenantRuntimePool, type LivPackConfigOverride } from "@workspace/liv-runtime";
import { getBusinessById } from "../services/businesses.service";

export type CachedTenantRuntime = {
  business: Business;
  packConfig: LivPackConfigOverride | null;
  loadedAt: number;
};

const pool = new TenantRuntimePool<CachedTenantRuntime>({
  maxSlots: Number(process.env.LIV_RUNTIME_POOL_MAX ?? 64),
  idleTtlMs: Number(process.env.LIV_RUNTIME_POOL_TTL_MS ?? 900_000),
});

export async function getCachedTenantRuntime(businessId: string): Promise<CachedTenantRuntime> {
  const hit = pool.get(businessId);
  if (hit) return hit;

  const business = await getBusinessById(businessId);
  if (!business) throw new Error("BUSINESS_NOT_FOUND");

  const packConfig = (business.livPackConfig ?? null) as LivPackConfigOverride | null;
  const entry: CachedTenantRuntime = {
    business,
    packConfig,
    loadedAt: Date.now(),
  };
  pool.set(businessId, entry);
  return entry;
}

export function invalidateTenantRuntime(businessId: string): void {
  pool.delete(businessId);
}

export function tenantRuntimePoolSize(): number {
  return pool.size();
}
