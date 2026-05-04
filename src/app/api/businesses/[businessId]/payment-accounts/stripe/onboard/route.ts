import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError } from "@/lib/http";
import { assertUserRole } from "@/services/business/membershipService";
import {
  createStripeOnboardingLink,
  getOrCreateStripePaymentAccount,
} from "@/services/payments/paymentAccountService";

const Body = z.object({
  actorUserId: z.string().min(1).optional(),
});

/**
 * Stripe Connect onboarding (scaffold). Creates (or reuses) a Stripe connected account and returns an onboarding URL.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const body = Body.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({ userId: actorUserId, businessId, allowedRoles: ["OWNER", "ADMIN"] });

    const pa = await getOrCreateStripePaymentAccount({ businessId });
    const link = await createStripeOnboardingLink({ businessId, accountId: pa.externalAccountId });

    return created({ paymentAccountId: pa.id, url: link.url });
  } catch (err) {
    return handleRouteError(err);
  }
}

