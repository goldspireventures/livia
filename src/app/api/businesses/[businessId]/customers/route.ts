import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { createCustomer, listCustomersForBusiness } from "@/services/customer/customerService";

const PostBody = z.object({
  actorUserId: z.string().min(1).optional(),
  displayName: z.string().min(1),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const customers = await listCustomersForBusiness({ businessId });
    return ok(customers);
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

    const customer = await createCustomer({
      businessId,
      actorUserId,
      displayName: body.displayName,
      notes: body.notes,
      metadata: body.metadata,
    });

    return created(customer);
  } catch (err) {
    return handleRouteError(err);
  }
}
