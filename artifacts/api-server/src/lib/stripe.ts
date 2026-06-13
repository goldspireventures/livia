import Stripe from "stripe";

import { logger } from "./logger";



let client: Stripe | null = null;



export function getStripe(): Stripe | null {

  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) return null;

  if (!client) {

    client = new Stripe(key);

  }

  return client;

}



export function stripeWebhookSecret(): string | null {

  return process.env.STRIPE_WEBHOOK_SECRET ?? null;

}



export function priceIdForPlan(planId: string): string | null {

  if (planId === "solo") return process.env.STRIPE_PRICE_SOLO ?? null;

  if (planId === "studio") return process.env.STRIPE_PRICE_STUDIO ?? null;

  if (planId === "chain") return process.env.STRIPE_PRICE_CHAIN ?? null;

  if (planId === "chair-host") return process.env.STRIPE_PRICE_CHAIR_HOST ?? null;

  return null;

}

/** Env var name for a checkout plan — used in billing error messages. */
export function stripePriceEnvKeyForPlan(planId: string): string | null {
  if (planId === "solo") return "STRIPE_PRICE_SOLO";
  if (planId === "studio") return "STRIPE_PRICE_STUDIO";
  if (planId === "chain") return "STRIPE_PRICE_CHAIN";
  if (planId === "chair-host") return "STRIPE_PRICE_CHAIR_HOST";
  return null;
}



export function priceIdForPeerInsightsAddon(): string | null {

  return process.env.STRIPE_PRICE_PEER_INSIGHTS ?? null;

}

export function priceIdForEventOperatorAddon(): string | null {
  return process.env.STRIPE_PRICE_EVENT_OPERATOR ?? null;
}

export function priceIdForAddon(addonId: string): string | null {
  if (addonId === "peer_set_insights") return priceIdForPeerInsightsAddon();
  if (addonId === "event_operator_pack") return priceIdForEventOperatorAddon();
  return null;
}

export function stripePriceEnvKeyForAddon(addonId: string): string | null {
  if (addonId === "peer_set_insights") return "STRIPE_PRICE_PEER_INSIGHTS";
  if (addonId === "event_operator_pack") return "STRIPE_PRICE_EVENT_OPERATOR";
  return null;
}



export function planIdFromPriceId(priceId: string): string | null {

  if (priceId === process.env.STRIPE_PRICE_SOLO) return "solo";

  if (priceId === process.env.STRIPE_PRICE_STUDIO) return "studio";

  if (priceId === process.env.STRIPE_PRICE_CHAIN) return "chain";

  if (priceId === process.env.STRIPE_PRICE_CHAIR_HOST) return "chair-host";

  return null;

}



export function isStripeConfigured(): boolean {

  return !!process.env.STRIPE_SECRET_KEY;

}



export function logStripeSkip(reason: string): void {

  logger.info({ reason }, "Stripe action skipped");

}

