import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import {
  deleteChannelIdentityForCustomer,
  getChannelIdentityForCustomer,
  updateChannelIdentityForCustomer,
} from "@/services/customer/channelIdentityService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string; channelIdentityId: string }> },
) {
  try {
    const { businessId, customerId, channelIdentityId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const row = await getChannelIdentityForCustomer({
      businessId,
      customerId,
      channelIdentityId,
    });
    return ok(row);
  } catch (err) {
    return handleRouteError(err);
  }
}

const PatchBody = z.object({
  actorUserId: z.string().min(1).optional(),
  data: z
    .object({
      value: z.string().min(1).optional(),
      verifiedAt: z.union([z.coerce.date(), z.null()]).optional(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string; channelIdentityId: string }> },
) {
  try {
    const { businessId, customerId, channelIdentityId } = await params;
    const body = PatchBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const row = await updateChannelIdentityForCustomer({
      businessId,
      customerId,
      channelIdentityId,
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
  { params }: { params: Promise<{ businessId: string; customerId: string; channelIdentityId: string }> },
) {
  try {
    const { businessId, customerId, channelIdentityId } = await params;
    const body = DeleteBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const result = await deleteChannelIdentityForCustomer({
      businessId,
      customerId,
      channelIdentityId,
      actorUserId,
    });
    return ok(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
