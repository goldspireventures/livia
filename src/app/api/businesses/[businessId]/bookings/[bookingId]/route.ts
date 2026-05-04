import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { getBookingById, updateBooking } from "@/services/booking/bookingService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; bookingId: string }> },
) {
  try {
    const { businessId, bookingId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const booking = await getBookingById({ businessId, bookingId });
    return ok(booking);
  } catch (err) {
    return handleRouteError(err);
  }
}

const PatchBody = z.object({
  actorUserId: z.string().min(1).optional(),
  data: z
    .object({
      customerId: z.string().min(1).optional(),
      serviceId: z.string().min(1).optional(),
      staffId: z.string().min(1).optional().nullable(),
      startsAt: z.coerce.date().optional(),
      endsAt: z.union([z.coerce.date(), z.null()]).optional(),
      status: z.enum(["DRAFT", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
      notes: z.string().optional().nullable(),
      internalNotes: z.string().optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; bookingId: string }> },
) {
  try {
    const { businessId, bookingId } = await params;
    const body = PatchBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN", "STAFF"],
    });

    const booking = await updateBooking({
      businessId,
      bookingId,
      actorUserId,
      data: body.data,
    });

    return ok(booking);
  } catch (err) {
    return handleRouteError(err);
  }
}
