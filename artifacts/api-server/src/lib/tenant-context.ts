import type { Request, Response, NextFunction } from "express";
import {
  db,
  businessesTable,
  businessMembershipsTable,
} from "@workspace/db";
import type { TenantRegion } from "@workspace/tenant-context";
import { and, eq } from "drizzle-orm";
import {
  tenantContextSchema,
  tenantContextStore,
  type TenantContext,
} from "@workspace/tenant-context";
import type { Role, RoleContext } from "./auth";
import { getUserId } from "./auth";

/** Operational fields resolved per request (extends the portable TenantContext). */
export type ResolvedTenantContext = TenantContext & {
  userId: string;
  membershipRole: Role;
  effectiveRole: Role;
  actingStaffId: string | null;
  planTier: string;
  timezone: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      resolvedTenant?: ResolvedTenantContext;
    }
  }
}

async function loadMembershipId(userId: string, businessId: string): Promise<string | null> {
  const [mem] = await db
    .select({ id: businessMembershipsTable.id })
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, userId),
      ),
    );
  return mem?.id ?? null;
}

async function loadBusinessTenantFields(businessId: string) {
  const [biz] = await db
    .select({
      locale: businessesTable.locale,
      timezone: businessesTable.timezone,
      tier: businessesTable.tier,
      euRegion: businessesTable.euRegion,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  return biz ?? null;
}

export async function resolveTenantContext(
  userId: string,
  businessId: string,
  roleCtx: RoleContext,
): Promise<ResolvedTenantContext | null> {
  const membershipId = await loadMembershipId(userId, businessId);
  if (!membershipId) return null;

  const biz = await loadBusinessTenantFields(businessId);
  if (!biz) return null;

  const region = (biz.euRegion ?? "fra") as TenantRegion;
  const base = tenantContextSchema.parse({
    businessId,
    membershipId,
    capabilityToken: `mem:${membershipId}`,
    region,
    locale: biz.locale ?? "en-IE",
  });

  return {
    ...base,
    userId,
    membershipRole: roleCtx.role,
    effectiveRole: roleCtx.effectiveRole,
    actingStaffId: roleCtx.actingStaffId,
    planTier: biz.tier ?? "solo",
    timezone: biz.timezone ?? "Europe/Dublin",
  };
}

/**
 * Binds tenant context on the request and in AsyncLocalStorage for the
 * remainder of the handler chain. Must run after requireRole.
 */
export function bindTenantContext(): (
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  return (req, res, next) => {
    const roleCtx = (req as Request & { roleContext?: RoleContext }).roleContext;
    const raw = req.params.businessId;
    const businessId = Array.isArray(raw) ? raw[0] : raw;
    if (!roleCtx || !businessId) {
      next();
      return;
    }

    const userId = getUserId(req);
    void resolveTenantContext(userId, businessId, roleCtx)
      .then((resolved) => {
        if (!resolved) {
          res.status(404).json({ error: "Business not found" });
          return;
        }
        req.resolvedTenant = resolved;
        tenantContextStore.run(
          {
            businessId: resolved.businessId,
            membershipId: resolved.membershipId,
            capabilityToken: resolved.capabilityToken,
            region: resolved.region,
            locale: resolved.locale,
          },
          () => next(),
        );
      })
      .catch(next);
  };
}

export function getResolvedTenant(req: Request): ResolvedTenantContext {
  const ctx = req.resolvedTenant;
  if (!ctx) {
    throw new Error("getResolvedTenant called before bindTenantContext");
  }
  return ctx;
}
