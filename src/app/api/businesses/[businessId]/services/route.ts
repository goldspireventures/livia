import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { createService, listServicesForBusiness } from "@/services/catalog/serviceCatalogService";

const PostBody = z.object({
  actorUserId: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().min(1).optional().nullable(),
  durationMinutes: z.number().int().positive(),
  basePriceMinorUnits: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().length(3).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().optional(),
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
    const services = await listServicesForBusiness({ businessId, includeInactive });
    return ok(services);
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

    const service = await createService({
      businessId,
      actorUserId,
      name: body.name,
      description: body.description,
      category: body.category,
      durationMinutes: body.durationMinutes,
      basePriceMinorUnits: body.basePriceMinorUnits,
      currency: body.currency,
      imageUrl: body.imageUrl,
      sortOrder: body.sortOrder,
      metadata: body.metadata,
    });

    return created(service);
  } catch (err) {
    return handleRouteError(err);
  }
}
