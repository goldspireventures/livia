import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import { createFeatureFlag, listFeatureFlagsForBusiness } from "@/services/featureFlags/featureFlagService";

const PostBody = z.object({
  actorUserId: z.string().min(1).optional(),
  key: z.string().min(1),
  enabled: z.boolean().optional(),
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
    const rows = await listFeatureFlagsForBusiness({ businessId });
    return ok(rows);
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

    const row = await createFeatureFlag({
      businessId,
      actorUserId,
      key: body.key,
      enabled: body.enabled,
      metadata: body.metadata,
    });

    return created(row);
  } catch (err) {
    return handleRouteError(err);
  }
}
