import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import {
  assignServiceToStaff,
  listServicesForStaff,
} from "@/services/catalog/staffServiceAssignmentService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> },
) {
  try {
    const { businessId, staffId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const rows = await listServicesForStaff({ businessId, staffId });
    return ok(rows);
  } catch (err) {
    return handleRouteError(err);
  }
}

const PostBody = z.object({
  actorUserId: z.string().min(1).optional(),
  serviceId: z.string().min(1),
});

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

    const row = await assignServiceToStaff({
      businessId,
      staffId,
      serviceId: body.serviceId,
      actorUserId,
    });

    return created(row);
  } catch (err) {
    return handleRouteError(err);
  }
}
