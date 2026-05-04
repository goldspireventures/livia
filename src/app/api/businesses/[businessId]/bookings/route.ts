import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { createBooking, listBookingsForBusiness } from "@/services/booking/bookingService";

const PostBody = z.object({
  actorUserId: z.string().min(1).optional(),
  customerId: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().min(1).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  status: z.enum(["DRAFT", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
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

    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const staffId = searchParams.get("staffId");

    await assertUserCanAccessBusiness({ userId, businessId });

    const bookings = await listBookingsForBusiness({
      businessId,
      ...(fromRaw ? { from: z.coerce.date().parse(fromRaw) } : {}),
      ...(toRaw ? { to: z.coerce.date().parse(toRaw) } : {}),
      ...(status
        ? {
            status: z
              .enum(["DRAFT", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
              .parse(status),
          }
        : {}),
      ...(customerId ? { customerId: z.string().min(1).parse(customerId) } : {}),
      ...(staffId ? { staffId: z.string().min(1).parse(staffId) } : {}),
    });

    return ok(bookings);
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
      allowedRoles: ["OWNER", "ADMIN", "STAFF"],
    });

    const booking = await createBooking({
      businessId,
      actorUserId,
      customerId: body.customerId,
      serviceId: body.serviceId,
      staffId: body.staffId,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      status: body.status,
      notes: body.notes,
      internalNotes: body.internalNotes,
      metadata: body.metadata,
    });

    return created(booking);
  } catch (err) {
    return handleRouteError(err);
  }
}
