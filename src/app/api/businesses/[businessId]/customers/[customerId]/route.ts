import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { deleteCustomer, getCustomerById, updateCustomer } from "@/services/customer/customerService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> },
) {
  try {
    const { businessId, customerId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const customer = await getCustomerById({ businessId, customerId });
    return ok(customer);
  } catch (err) {
    return handleRouteError(err);
  }
}

const PatchBody = z.object({
  actorUserId: z.string().min(1).optional(),
  data: z
    .object({
      displayName: z.string().min(1).optional(),
      notes: z.string().optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> },
) {
  try {
    const { businessId, customerId } = await params;
    const body = PatchBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const customer = await updateCustomer({
      businessId,
      customerId,
      actorUserId,
      data: body.data,
    });

    return ok(customer);
  } catch (err) {
    return handleRouteError(err);
  }
}

const DeleteBody = z.object({
  actorUserId: z.string().min(1).optional(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> },
) {
  try {
    const { businessId, customerId } = await params;
    const body = DeleteBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const result = await deleteCustomer({
      businessId,
      customerId,
      actorUserId,
    });
    return ok(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
