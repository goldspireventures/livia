import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { deactivateStaff, getStaffById, updateStaff } from "@/services/staff/staffService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> },
) {
  try {
    const { businessId, staffId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const staff = await getStaffById({ businessId, staffId });
    return ok(staff);
  } catch (err) {
    return handleRouteError(err);
  }
}

const PatchBody = z.object({
  actorUserId: z.string().min(1).optional(),
  data: z
    .object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional().nullable(),
      displayName: z.string().min(1).optional().nullable(),
      email: z.string().email().optional().nullable(),
      phone: z.string().min(1).optional().nullable(),
      photoUrl: z.string().url().optional().nullable(),
      bio: z.string().optional().nullable(),
      role: z.enum(["PROVIDER", "COORDINATOR", "OTHER"]).optional(),
      userId: z.string().min(1).optional().nullable(),
      active: z.boolean().optional(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> },
) {
  try {
    const { businessId, staffId } = await params;
    const body = PatchBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const staff = await updateStaff({
      businessId,
      staffId,
      actorUserId,
      data: body.data,
    });

    return ok(staff);
  } catch (err) {
    return handleRouteError(err);
  }
}

const DeleteBody = z.object({
  actorUserId: z.string().min(1).optional(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> },
) {
  try {
    const { businessId, staffId } = await params;
    const body = DeleteBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const staff = await deactivateStaff({ businessId, staffId, actorUserId });
    return ok(staff);
  } catch (err) {
    return handleRouteError(err);
  }
}
