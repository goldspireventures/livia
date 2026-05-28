import type { Request, Response, NextFunction, RequestHandler } from "express";
import {
  entitlementKeySchema,
  type EntitlementKey,
} from "@workspace/entitlements";
import { resolveBillingState, tenantHasEntitlementForBusiness } from "../services/billing.service";

export function requireEntitlement(key: EntitlementKey): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = entitlementKeySchema.safeParse(key);
    if (!parsed.success) {
      res.status(500).json({ error: "Invalid entitlement key" });
      return;
    }

    const businessId = req.resolvedTenant?.businessId;
    if (!businessId) {
      res.status(500).json({ error: "Tenant context required before entitlement check" });
      return;
    }

    try {
      const allowed = await tenantHasEntitlementForBusiness(businessId, parsed.data);
      if (!allowed) {
        const state = await resolveBillingState(businessId);
        res.status(403).json({
          error: `This plan does not include ${parsed.data.replace(/_/g, " ")}. Upgrade to unlock.`,
          code: "ENTITLEMENT_REQUIRED",
          entitlement: parsed.data,
          planId: state.planId,
          planName: state.planName,
        });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
