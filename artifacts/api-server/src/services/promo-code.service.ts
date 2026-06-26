import {
  lookupComplimentaryPromo,
  subscriptionGrantsPaidAccess,
} from "@workspace/policy";
import { getBusinessById } from "./businesses.service";
import { grantComplimentaryPlan } from "./billing.service";
import { logger } from "../lib/logger";

export type PromoValidation =
  | { valid: true; complimentary: true; planId: string; code: string }
  | { valid: true; complimentary: false; message: string }
  | { valid: false; message: string };

export function validatePromoCodeForBusiness(code: string): PromoValidation {
  const def = lookupComplimentaryPromo(process.env.LIVIA_COMPLIMENTARY_PROMO_CODES, code);
  if (def) {
    return { valid: true, complimentary: true, planId: def.planId, code: def.code };
  }
  if (process.env.STRIPE_ALLOW_PROMOTION_CODES === "true") {
    return {
      valid: true,
      complimentary: false,
      message: "Apply this code on the Stripe checkout screen.",
    };
  }
  return { valid: false, message: "That code is not recognized. Check spelling or contact support." };
}

export async function redeemComplimentaryPromoCode(
  businessId: string,
  code: string,
): Promise<{ planId: string; code: string }> {
  const def = lookupComplimentaryPromo(process.env.LIVIA_COMPLIMENTARY_PROMO_CODES, code);
  if (!def) {
    throw Object.assign(new Error("Invalid or expired promo code."), { code: "PROMO_INVALID" });
  }

  const biz = await getBusinessById(businessId);
  if (!biz) throw new Error("BUSINESS_NOT_FOUND");

  if (
    subscriptionGrantsPaidAccess(biz.stripeSubscriptionStatus, biz.designPartnerEndsAt) &&
    biz.stripeSubscriptionStatus !== "complimentary" &&
    biz.stripeSubscriptionStatus !== "trialing"
  ) {
    throw Object.assign(new Error("This shop already has an active subscription."), {
      code: "PROMO_ALREADY_SUBSCRIBED",
    });
  }

  const endsAt =
    def.durationDays == null
      ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + def.durationDays * 24 * 60 * 60 * 1000);

  await grantComplimentaryPlan({
    businessId,
    planId: def.planId,
    endsAt,
    promoCode: def.code,
  });

  logger.info({ businessId, code: def.code, planId: def.planId }, "Complimentary promo redeemed");

  return { planId: def.planId, code: def.code };
}
