import { type NextRequest, NextResponse } from "next/server";

import {
  applyStripeWebhookEvent,
  verifyStripeWebhookEvent,
} from "@/services/payments/stripeWebhookService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Global Stripe webhook endpoint (not tenant-prefixed). Configure this URL in Stripe Dashboard
 * or forward with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  try {
    const event = verifyStripeWebhookEvent(rawBody, signature);
    await applyStripeWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook rejected", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "invalid_webhook" },
      { status: 400 },
    );
  }
}
