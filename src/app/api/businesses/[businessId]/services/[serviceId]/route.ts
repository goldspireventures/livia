import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { deactivateService, getServiceById, updateService } from "@/services/catalog/serviceCatalogService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; serviceId: string }> },
) {
  try {
    const { businessId, serviceId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const service = await getServiceById({ businessId, serviceId });
    return ok(service);
  } catch (err) {
    return handleRouteError(err);
  }
}

const PatchBody = z.object({
  actorUserId: z.string().min(1).optional(),
  data: z
    .object({
      name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      category: z.string().min(1).optional().nullable(),
      durationMinutes: z.number().int().positive().optional(),
      basePriceMinorUnits: z.number().int().nonnegative().optional().nullable(),
      currency: z.string().length(3).optional().nullable(),
      imageUrl: z.string().url().optional().nullable(),
      sortOrder: z.number().int().optional(),
      active: z.boolean().optional(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; serviceId: string }> },
) {
  try {
    const { businessId, serviceId } = await params;
    const body = PatchBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const service = await updateService({
      businessId,
      serviceId,
      actorUserId,
      data: body.data,
    });

    return ok(service);
  } catch (err) {
    return handleRouteError(err);
  }
}

const DeleteBody = z.object({
  actorUserId: z.string().min(1).optional(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; serviceId: string }> },
) {
  try {
    const { businessId, serviceId } = await params;
    const body = DeleteBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const service = await deactivateService({
      businessId,
      serviceId,
      actorUserId,
    });
    return ok(service);
  } catch (err) {
    return handleRouteError(err);
  }
}
