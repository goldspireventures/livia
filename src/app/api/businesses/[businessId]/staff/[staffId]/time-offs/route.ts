import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { createTimeOff, listTimeOffsForStaff } from "@/services/availability/timeOffService";

const PostBody = z.object({
  actorUserId: z.string().min(1).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  reason: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> },
) {
  try {
    const { businessId, staffId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = await requireReaderUserId(req);
    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");

    await assertUserCanAccessBusiness({ userId, businessId });
    const rows = await listTimeOffsForStaff({
      businessId,
      staffId,
      ...(fromRaw ? { from: z.coerce.date().parse(fromRaw) } : {}),
      ...(toRaw ? { to: z.coerce.date().parse(toRaw) } : {}),
    });
    return ok(rows);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> },
) {
  try {
    const { businessId, staffId } = await params;
    const body = PostBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const row = await createTimeOff({
      businessId,
      staffId,
      actorUserId,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      reason: body.reason,
      metadata: body.metadata,
    });

    return created(row);
  } catch (err) {
    return handleRouteError(err);
  }
}
