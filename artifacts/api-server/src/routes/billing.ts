import { Router, type IRouter } from "express";

import { requireAuth, requireRole, getUserId, resolveMembership } from "../lib/auth";

import {

  resolveBillingState,

  setBusinessPlanForDev,

  syncBusinessPlanFromStripe,

} from "../services/billing.service";

import { getBusinessById, updateBusiness } from "../services/businesses.service";
import { getDashboardUrl } from "../lib/public-urls";

import { getOrCreateUser } from "../services/users.service";

import {

  getStripe,

  isStripeConfigured,

  logStripeSkip,

  priceIdForPlan,

  stripePriceEnvKeyForPlan,

  billingMayGrantWithoutStripe,

  billingLocalGrantMode,

  stripeCheckoutAllowPromotionCodes,

} from "../lib/stripe";

import { CHECKOUT_PLAN_IDS } from "@workspace/entitlements";
import { sendError, logRouteError, safeClientMessage } from "../lib/http-errors";
import { replyDomainError } from "../lib/domain-errors";
import { DEMO_WORLD_SLUGS, isDemoPortalEnabled } from "../lib/demo-portal-config";
import {
  redeemComplimentaryPromoCode,
  validatePromoCodeForBusiness,
} from "../services/promo-code.service";
import { publicPaidOnboardingEnabled } from "@workspace/policy";



const router: IRouter = Router();

const getBizId = (param: string | string[]) =>

  Array.isArray(param) ? param[0] : param;



router.get(

  "/businesses/:businessId/billing",

  requireAuth,

  requireRole("ADMIN"),

  async (req, res): Promise<void> => {

    const businessId = getBizId(req.params.businessId);

    try {

      const state = await resolveBillingState(businessId);

      res.json(state);

    } catch (err: unknown) {
      if (replyDomainError(req, res, err)) return;
      throw err;
    }

  },

);



router.post(

  "/businesses/:businessId/billing/checkout-session",

  requireAuth,

  requireRole("ADMIN"),

  async (req, res): Promise<void> => {

    const userId = getUserId(req);

    const businessId = getBizId(req.params.businessId);

    const planId = (req.body?.planId as string | undefined)?.trim() ?? "solo";

    const shopCount = Math.max(2, Number(req.body?.shopCount) || 2);

    const renterCount = Math.max(1, Number(req.body?.renterCount) || 1);

    const returnPath =
      typeof req.body?.returnPath === "string" && req.body.returnPath.startsWith("/")
        ? req.body.returnPath
        : publicPaidOnboardingEnabled()
          ? "/onboarding"
          : "/settings?tab=billing";



    if (!CHECKOUT_PLAN_IDS.includes(planId as (typeof CHECKOUT_PLAN_IDS)[number])) {

      sendError(res, req, 400, "planId must be one of: solo, studio, chain, chair-host",);

      return;

    }



    const role = await resolveMembership(userId, businessId);

    if (!role || role === "STAFF") {

      sendError(res, req, 404, "Business not found");

      return;

    }



    const biz = await getBusinessById(businessId);

    if (!biz) {

      sendError(res, req, 404, "Business not found");

      return;

    }



    const stripe = getStripe();

    const priceId = priceIdForPlan(planId);

    if (!stripe || !priceId) {

      logStripeSkip("checkout-session");

      const mayGrantLocally =
        billingMayGrantWithoutStripe() ||
        (isDemoPortalEnabled() &&
          biz.slug &&
          (DEMO_WORLD_SLUGS as readonly string[]).includes(biz.slug));

      if (mayGrantLocally) {

        await setBusinessPlanForDev(businessId, planId);

        const state = await resolveBillingState(businessId);

        const mode = billingLocalGrantMode() ?? "demo-override";

        res.json({

          mode,

          message:
            mode === "staging-demo"
              ? "Plan applied for staging demo."
              : "Stripe not configured — plan applied locally for development.",

          billing: state,

        });

        return;

      }

      const priceEnv = stripePriceEnvKeyForPlan(planId);

      if (stripe && !priceId && priceEnv) {

        sendError(

          res,

          req,

          503,

          `Billing price is not configured. Set ${priceEnv} in the API environment.`,

          { code: "STRIPE_PRICE_NOT_CONFIGURED", planId, priceEnv },

        );

        return;

      }

      sendError(res, req, 503, "Billing is not configured in this environment.", { code: "STRIPE_NOT_CONFIGURED", });

      return;

    }



    try {

      const user = await getOrCreateUser(userId);

      let customerId = biz.stripeCustomerId;

      if (!customerId) {

        const customer = await stripe.customers.create({

          email: user.email ?? undefined,

          name: biz.name,

          metadata: { businessId, ownerId: biz.ownerId },

        });

        customerId = customer.id;

        await updateBusiness(businessId, { stripeCustomerId: customerId });

      }



      const baseUrl = getDashboardUrl();



      const quantity =

        planId === "chain" ? shopCount : planId === "chair-host" ? renterCount : 1;



      const session = await stripe.checkout.sessions.create({

        mode: "subscription",

        customer: customerId,

        line_items: [{ price: priceId, quantity }],

        success_url: `${baseUrl}${returnPath}${returnPath.includes("?") ? "&" : "?"}billing=success`,

        cancel_url: `${baseUrl}${returnPath}${returnPath.includes("?") ? "&" : "?"}billing=cancel`,

        allow_promotion_codes: stripeCheckoutAllowPromotionCodes(),

        metadata: { businessId, planId, shopCount: String(shopCount), renterCount: String(renterCount) },

        subscription_data: {

          metadata: { businessId, planId },

        },

      });



      res.json({ url: session.url, sessionId: session.id });

    } catch (err: unknown) {

      logRouteError(req, err, "billing checkout-session failed", { businessId, planId });

      sendError(res, req, 502, safeClientMessage(err, "Could not start Stripe checkout."), {

        code: "STRIPE_CHECKOUT_FAILED",

      });

    }

  },

);



router.post(
  "/businesses/:businessId/billing/validate-promo",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const code = (req.body?.code as string | undefined)?.trim() ?? "";
    if (!code) {
      sendError(res, req, 400, "code is required");
      return;
    }
    res.json(validatePromoCodeForBusiness(code));
  },
);

router.post(
  "/businesses/:businessId/billing/redeem-promo",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const code = (req.body?.code as string | undefined)?.trim() ?? "";
    if (!code) {
      sendError(res, req, 400, "code is required");
      return;
    }
    try {
      const redeemed = await redeemComplimentaryPromoCode(businessId, code);
      const billing = await resolveBillingState(businessId);
      res.json({
        mode: "complimentary",
        message: "Partner code applied — your plan is active at no charge for this period.",
        ...redeemed,
        billing,
      });
    } catch (err: unknown) {
      const e = err as Error & { code?: string };
      if (e.code === "PROMO_INVALID") {
        sendError(res, req, 400, e.message, { code: e.code });
        return;
      }
      if (e.code === "PROMO_ALREADY_SUBSCRIBED") {
        sendError(res, req, 409, e.message, { code: e.code });
        return;
      }
      logRouteError(req, err, "redeem-promo failed", { businessId });
      sendError(res, req, 502, safeClientMessage(err, "Could not apply promo code."));
    }
  },
);



/** Dev-only: set plan without Stripe (e.g. trial without voice). */

router.post(

  "/businesses/:businessId/billing/dev-plan",

  requireAuth,

  requireRole("OWNER"),

  async (req, res): Promise<void> => {

    if (process.env.NODE_ENV === "production") {

      sendError(res, req, 403, "Not available in production");

      return;

    }

    const businessId = getBizId(req.params.businessId);

    const planId = (req.body?.planId as string) ?? "trial";

    const denylist = Array.isArray(req.body?.entitlementDenylist)

      ? (req.body.entitlementDenylist as string[])

      : planId === "trial"

        ? ["voice_receptionist"]

        : [];

    await setBusinessPlanForDev(businessId, planId, denylist);

    res.json(await resolveBillingState(businessId));

  },

);



export default router;

