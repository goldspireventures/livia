import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { createStaff, listStaffForBusiness } from "@/services/staff/staffService";

const PostBody = z.object({
  actorUserId: z.string().min(1).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1).optional().nullable(),
  displayName: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(1).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  role: z.enum(["PROVIDER", "COORDINATOR", "OTHER"]).optional(),
  userId: z.string().min(1).optional().nullable(),
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
    const includeInactive = z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true")
      .parse(searchParams.get("includeInactive") ?? undefined);

    await assertUserCanAccessBusiness({ userId, businessId });
    const staff = await listStaffForBusiness({ businessId, includeInactive });
    return ok(staff);
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

    const staff = await createStaff({
      businessId,
      actorUserId,
      firstName: body.firstName,
      lastName: body.lastName,
      displayName: body.displayName,
      email: body.email,
      phone: body.phone,
      photoUrl: body.photoUrl,
      bio: body.bio,
      role: body.role,
      userId: body.userId,
      metadata: body.metadata,
    });

    return created(staff);
  } catch (err) {
    return handleRouteError(err);
  }
}
