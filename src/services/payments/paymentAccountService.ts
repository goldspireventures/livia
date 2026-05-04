import "server-only";

import { Prisma, type PaymentAccount, type PaymentAccountStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getStripeClient, isStripeSecretConfigured } from "./stripeAdapter";

const ProviderSchema = z.literal("stripe");

function assertStripeConfigured() {
  if (!isStripeSecretConfigured()) {
    throw new Error("Stripe is not configured (set STRIPE_SECRET_KEY).");
  }
}

function appUrlBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

/**
 * Create (or fetch) a Stripe connected account for a business.
 *
 * Uses Accounts v2 API per Stripe Connect guidance.
 */
export async function getOrCreateStripePaymentAccount(input: {
  businessId: string;
}): Promise<PaymentAccount> {
  const { businessId } = input;

  const existing = await prisma.paymentAccount.findFirst({
    where: { businessId, provider: "stripe" },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  assertStripeConfigured();
  const stripe = getStripeClient();

  // Accounts v2 endpoint is not always typed in stripe-node; use raw request.
  const res = await stripe.rawRequest("POST", "/v2/core/accounts", {
    // Platform starts with destination charges; configure responsibilities explicitly.
    controller: {
      fees: { payer: "application" },
      losses: { payments: "application" },
      stripe_dashboard: { type: "express" },
      requirement_collection: "application",
    },
    // Keep capabilities minimal for now; expand when product requires it.
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      bliqBusinessId: businessId,
    },
  });

  const externalAccountId = (res as { id?: string }).id;
  if (!externalAccountId) {
    throw new Error("Stripe connected account create failed (missing id).");
  }

  return prisma.paymentAccount.create({
    data: {
      businessId,
      provider: "stripe",
      externalAccountId,
      status: "PENDING",
      capabilities: Prisma.JsonNull,
      metadata: { createdVia: "accounts_v2" },
    },
  });
}

export async function createStripeOnboardingLink(input: {
  businessId: string;
  accountId: string;
}): Promise<{ url: string }> {
  ProviderSchema.parse("stripe");
  assertStripeConfigured();

  const stripe = getStripeClient();
  const base = appUrlBase();
  const refreshUrl = base ? `${base}/b/${input.businessId}/notifications` : "https://example.invalid/refresh";
  const returnUrl = base ? `${base}/b/${input.businessId}/notifications` : "https://example.invalid/return";

  const link = await stripe.accountLinks.create({
    account: input.accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return { url: link.url };
}

export async function updatePaymentAccountStatus(input: {
  paymentAccountId: string;
  status: PaymentAccountStatus;
  capabilities?: unknown;
}): Promise<PaymentAccount> {
  return prisma.paymentAccount.update({
    where: { id: input.paymentAccountId },
    data: {
      status: input.status,
      capabilities:
        input.capabilities === undefined
          ? undefined
          : (input.capabilities as Prisma.InputJsonValue),
    },
  });
}

