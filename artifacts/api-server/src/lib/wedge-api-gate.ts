import { db, businessesTable } from "@workspace/db";
import { isBusinessApiFeatureAllowed, apiFeatureEntitlementKey } from "@workspace/policy";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import { getUserId, requireAuth, requireRole, type Role } from "./auth.js";
import { sendError } from "./http-errors.js";
import { tenantHasEntitlementForBusiness } from "../services/billing.service.js";
import type { EntitlementKey } from "@workspace/entitlements";

function businessIdFromParams(req: Parameters<RequestHandler>[0]): string | null {
  const raw = req.params.businessId;
  const id = Array.isArray(raw) ? raw[0] : raw;
  return id?.trim() || null;
}

/**
 * Enforce wedge vertical scope on business-scoped API features.
 * Mount after requireAuth (+ requireRole when membership is required).
 */
export function requireBusinessApiFeature(featureKey: string): RequestHandler {
  return async (req, res, next) => {
    try {
      const businessId = businessIdFromParams(req);
      if (!businessId) {
        sendError(res, req, 400, "businessId is required");
        return;
      }

      const [biz] = await db
        .select({ vertical: businessesTable.vertical })
        .from(businessesTable)
        .where(eq(businessesTable.id, businessId))
        .limit(1);

      if (!biz) {
        sendError(res, req, 404, "Business not found");
        return;
      }

      if (!isBusinessApiFeatureAllowed(featureKey, biz.vertical)) {
        sendError(res, req, 403, "This feature is not available for your business type yet.", {
          code: "WEDGE_SCOPE",
          feature: featureKey,
        });
        return;
      }

      const entKey = apiFeatureEntitlementKey(featureKey);
      if (entKey) {
        const entitled = await tenantHasEntitlementForBusiness(
          businessId,
          entKey as EntitlementKey,
        );
        if (!entitled) {
          sendError(
            res,
            req,
            403,
            "Upgrade to Event Operator to unlock this feature.",
            {
              code: "ENTITLEMENT_REQUIRED",
              entitlement: entKey,
              addon: "event_operator_pack",
              feature: featureKey,
            },
          );
          return;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export { requireAuth, getUserId };

/** Auth + RBAC + wedge vertical scope for business API features. */
export function withBusinessFeature(
  featureKey: string,
  minRole: Role,
  ...handlers: RequestHandler[]
): RequestHandler[] {
  return [requireAuth, requireRole(minRole), requireBusinessApiFeature(featureKey), ...handlers];
}
