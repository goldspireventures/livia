import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireWriterActorId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { assertUserRole } from "@/services/business/membershipService";
import { unassignServiceFromStaff } from "@/services/catalog/staffServiceAssignmentService";

const DeleteBody = z.object({
  actorUserId: z.string().min(1).optional(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string; serviceId: string }> },
) {
  try {
    const { businessId, staffId, serviceId } = await params;
    const body = DeleteBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const result = await unassignServiceFromStaff({
      businessId,
      staffId,
      serviceId,
      actorUserId,
    });
    return ok(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
