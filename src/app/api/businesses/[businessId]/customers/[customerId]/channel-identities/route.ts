import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import {
  createChannelIdentityForCustomer,
  listChannelIdentitiesForCustomer,
} from "@/services/customer/channelIdentityService";

const PostBody = z.object({
  actorUserId: z.string().min(1).optional(),
  channel: z.enum(["EMAIL", "PHONE", "SMS", "EXTERNAL", "OTHER"]),
  value: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> },
) {
  try {
    const { businessId, customerId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const rows = await listChannelIdentitiesForCustomer({ businessId, customerId });
    return ok(rows);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> },
) {
  try {
    const { businessId, customerId } = await params;
    const body = PostBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const row = await createChannelIdentityForCustomer({
      businessId,
      customerId,
      actorUserId,
      channel: body.channel,
      value: body.value,
      metadata: body.metadata,
    });

    return created(row);
  } catch (err) {
    return handleRouteError(err);
  }
}
