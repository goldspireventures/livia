/**
 * @workspace/tenant-context
 *
 * The tenant context primitive (per ADR 0018, pattern #3).
 *
 * Every privileged operation in Livia runs inside a TenantContext. The same
 * shape is used by dashboard, mobile, voice-bridge, and (future) partner API.
 *
 * Region-pinning, schema-per-tenant graduation, and BYO-tenant partner mode
 * are all migrations on this primitive — not rewrites.
 */
import { z } from "zod";

export const tenantRegionSchema = z.enum(["fra", "dub"]);
export type TenantRegion = z.infer<typeof tenantRegionSchema>;

export const tenantContextSchema = z.object({
  businessId: z.string().min(1),
  membershipId: z.string().min(1),
  /** EdDSA-signed capability token (see @workspace/capability-tokens). */
  capabilityToken: z.string().min(1),
  /** Primary region; replicas inherit residency policy. */
  region: tenantRegionSchema.default("fra"),
  /** Locale at the time of the request (e.g., "en-IE"). */
  locale: z.string().min(2).default("en-IE"),
});

export type TenantContext = z.infer<typeof tenantContextSchema>;

/**
 * Async-local storage helper for tenant context propagation across an async
 * call tree. Wired into Express middleware in api-server; into Inngest
 * function context in event-bus consumers.
 *
 * Implementation deferred to the surface (api-server) — this package
 * defines the shape and the contract.
 */
export interface TenantContextProvider {
  current(): TenantContext | undefined;
  run<T>(ctx: TenantContext, fn: () => T | Promise<T>): T | Promise<T>;
}

export function requireTenantContext(provider: TenantContextProvider): TenantContext {
  const ctx = provider.current();
  if (!ctx) {
    throw new Error("No tenant context bound on this async path");
  }
  return ctx;
}
