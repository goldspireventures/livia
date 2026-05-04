import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { assertUserRole } from "@/services/business/membershipService";
import {
  createPaymentIntentRecord,
  listPaymentIntentRecords,
} from "@/services/payments/paymentIntentService";

const PostBody = z.object({
  actorUserId: z.string().min(1).optional(),
  bookingId: z.string().min(1).optional().nullable(),
  amountMinorUnits: z.number().int().positive(),
  currency: z.string().length(3),
  provider: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = await requireReaderUserId(req);
    const bookingId = searchParams.get("bookingId");

    await assertUserRole({
      userId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const rows = await listPaymentIntentRecords({
      businessId,
      ...(bookingId ? { bookingId: z.string().min(1).parse(bookingId) } : {}),
    });
    return ok(rows);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const body = PostBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const row = await createPaymentIntentRecord({
      businessId,
      actorUserId,
      bookingId: body.bookingId,
      amountMinorUnits: body.amountMinorUnits,
      currency: body.currency,
      provider: body.provider,
      metadata: body.metadata,
    });

    return created(row);
  } catch (err) {
    return handleRouteError(err);
  }
}
