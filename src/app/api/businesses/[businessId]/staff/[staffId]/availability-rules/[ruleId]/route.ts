import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import {
  deleteAvailabilityRule,
  getAvailabilityRuleById,
  updateAvailabilityRule,
} from "@/services/availability/availabilityRuleService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string; ruleId: string }> },
) {
  try {
    const { businessId, staffId, ruleId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const rule = await getAvailabilityRuleById({ businessId, staffId, ruleId });
    return ok(rule);
  } catch (err) {
    return handleRouteError(err);
  }
}

const PatchBody = z.object({
  actorUserId: z.string().min(1).optional(),
  data: z
    .object({
      weekday: z.number().int().optional(),
      startMinutes: z.number().int().optional(),
      endMinutes: z.number().int().optional(),
      timezone: z.string().min(1).optional(),
      effectiveFrom: z.union([z.coerce.date(), z.null()]).optional(),
      effectiveTo: z.union([z.coerce.date(), z.null()]).optional(),
      active: z.boolean().optional(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string; ruleId: string }> },
) {
  try {
    const { businessId, staffId, ruleId } = await params;
    const body = PatchBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const rule = await updateAvailabilityRule({
      businessId,
      staffId,
      ruleId,
      actorUserId,
      data: body.data,
    });

    return ok(rule);
  } catch (err) {
    return handleRouteError(err);
  }
}

const DeleteBody = z.object({
  actorUserId: z.string().min(1).optional(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string; ruleId: string }> },
) {
  try {
    const { businessId, staffId, ruleId } = await params;
    const body = DeleteBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const result = await deleteAvailabilityRule({
      businessId,
      staffId,
      ruleId,
      actorUserId,
    });
    return ok(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
