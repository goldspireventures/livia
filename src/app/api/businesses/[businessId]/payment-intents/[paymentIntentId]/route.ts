import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { assertUserRole } from "@/services/business/membershipService";
import { getPaymentIntentRecordById, updatePaymentIntentRecord } from "@/services/payments/paymentIntentService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; paymentIntentId: string }> },
) {
  try {
    const { businessId, paymentIntentId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserRole({
      userId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const row = await getPaymentIntentRecordById({ businessId, paymentIntentId });
    return ok(row);
  } catch (err) {
    return handleRouteError(err);
  }
}

const PatchBody = z.object({
  actorUserId: z.string().min(1).optional(),
  data: z
    .object({
      status: z
        .enum(["CREATED", "REQUIRES_ACTION", "PROCESSING", "SUCCEEDED", "CANCELED", "FAILED"])
        .optional(),
      externalId: z.string().min(1).optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; paymentIntentId: string }> },
) {
  try {
    const { businessId, paymentIntentId } = await params;
    const body = PatchBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const row = await updatePaymentIntentRecord({
      businessId,
      paymentIntentId,
      actorUserId,
      data: body.data,
    });

    return ok(row);
  } catch (err) {
    return handleRouteError(err);
  }
}
