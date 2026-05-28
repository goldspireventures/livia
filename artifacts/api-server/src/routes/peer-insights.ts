import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import { getPeerInsightsForBusiness } from "../services/peer-insights.service";
import {
  grantEntitlementAddon,
  tenantHasEntitlementForBusiness,
} from "../services/billing.service";
import {
  getStripe,
  isStripeConfigured,
  logStripeSkip,
  priceIdForPeerInsightsAddon,
} from "../lib/stripe";
import { getBusinessById, updateBusiness } from "../services/businesses.service";
import { getOrCreateUser } from "../services/users.service";
import type { EntitlementKey } from "@workspace/entitlements";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/peer-insights",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    try {
      res.json(await getPeerInsightsForBusiness(businessId));
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "BUSINESS_NOT_FOUND") {
        sendError(res, req, 404, "Business not found");
        return;
      }
      throw err;
    }
  },
);

router.post(
  "/businesses/:businessId/peer-insights/opt-in",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const userId = getUserId(req);
    const biz = await getBusinessById(businessId);
    if (!biz || biz.ownerId !== userId) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    await grantEntitlementAddon(businessId, "cross_tenant_intelligence_opt_in");
    res.json({ optedIn: true });
  },
);

router.post(
  "/businesses/:businessId/billing/checkout-peer-insights",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const biz = await getBusinessById(businessId);
    if (!biz || biz.ownerId !== userId) {
      sendError(res, req, 404, "Business not found");
      return;
    }

    const already = await tenantHasEntitlementForBusiness(businessId, "peer_set_insights");
    if (already) {
      res.json({ message: "Peer insights already active." });
      return;
    }

    const stripe = getStripe();
    const priceId = priceIdForPeerInsightsAddon();
    if (!stripe || !priceId) {
      logStripeSkip("checkout-peer-insights");
      if (process.env.NODE_ENV !== "production") {
        await grantEntitlementAddon(businessId, "peer_set_insights" as EntitlementKey);
        res.json({
          mode: "dev",
          message: "Peer insights add-on granted locally for development.",
        });
        return;
      }
      res.status(503).json({ code: "STRIPE_NOT_CONFIGURED" });
      return;
    }

    const user = await getOrCreateUser(userId);
    let customerId = biz.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: biz.name,
        metadata: { businessId, ownerId: userId },
      });
      customerId = customer.id;
      await updateBusiness(businessId, { stripeCustomerId: customerId });
    }

    const baseUrl =
      process.env.DASHBOARD_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings?peer_insights=success`,
      cancel_url: `${baseUrl}/settings?peer_insights=cancel`,
      metadata: { businessId, addon: "peer_set_insights" },
    });

    res.json({ url: session.url, sessionId: session.id });
  },
);

export default router;
