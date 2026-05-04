import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { getBusinessById, updateBusiness } from "@/services/business/businessService";
import {
  assertUserCanAccessBusiness,
  assertUserRole,
  requireBusinessExists,
} from "@/services/business/membershipService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const business = await getBusinessById({ businessId });
    if (!business) {
      // keep error shape consistent
      await requireBusinessExists({ businessId });
    }
    return ok(business);
  } catch (err) {
    return handleRouteError(err);
  }
}

const PatchBody = z.object({
  actorUserId: z.string().min(1).optional(),
  data: z
    .object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      timezone: z.string().min(1).optional(),
    })
    .strict(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const body = PatchBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const updated = await updateBusiness({
      businessId,
      actorUserId,
      data: body.data,
    });

    return ok(updated);
  } catch (err) {
    return handleRouteError(err);
  }
}

