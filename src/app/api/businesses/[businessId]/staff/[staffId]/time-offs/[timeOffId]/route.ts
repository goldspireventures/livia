import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { deleteTimeOff, getTimeOffById, updateTimeOff } from "@/services/availability/timeOffService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string; timeOffId: string }> },
) {
  try {
    const { businessId, staffId, timeOffId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const row = await getTimeOffById({ businessId, staffId, timeOffId });
    return ok(row);
  } catch (err) {
    return handleRouteError(err);
  }
}

const PatchBody = z.object({
  actorUserId: z.string().min(1).optional(),
  data: z
    .object({
      startsAt: z.coerce.date().optional(),
      endsAt: z.coerce.date().optional(),
      reason: z.string().optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string; timeOffId: string }> },
) {
  try {
    const { businessId, staffId, timeOffId } = await params;
    const body = PatchBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const row = await updateTimeOff({
      businessId,
      staffId,
      timeOffId,
      actorUserId,
      data: body.data,
    });

    return ok(row);
  } catch (err) {
    return handleRouteError(err);
  }
}

const DeleteBody = z.object({
  actorUserId: z.string().min(1).optional(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string; timeOffId: string }> },
) {
  try {
    const { businessId, staffId, timeOffId } = await params;
    const body = DeleteBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const result = await deleteTimeOff({
      businessId,
      staffId,
      timeOffId,
      actorUserId,
    });
    return ok(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
