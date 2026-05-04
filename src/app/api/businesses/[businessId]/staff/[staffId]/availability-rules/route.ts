import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId, requireWriterActorId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness, assertUserRole } from "@/services/business/membershipService";
import {
  createAvailabilityRule,
  listAvailabilityRulesForStaff,
} from "@/services/availability/availabilityRuleService";

const PostBody = z.object({
  actorUserId: z.string().min(1).optional(),
  weekday: z.number().int(),
  startMinutes: z.number().int(),
  endMinutes: z.number().int(),
  timezone: z.string().min(1).optional(),
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveTo: z.coerce.date().optional().nullable(),
  active: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> },
) {
  try {
    const { businessId, staffId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = await requireReaderUserId(req);
    const includeInactive = z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true")
      .parse(searchParams.get("includeInactive") ?? undefined);

    await assertUserCanAccessBusiness({ userId, businessId });
    const rules = await listAvailabilityRulesForStaff({ businessId, staffId, includeInactive });
    return ok(rules);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; staffId: string }> },
) {
  try {
    const { businessId, staffId } = await params;
    const body = PostBody.parse(await req.json());
    const actorUserId = await requireWriterActorId(body);

    await assertUserRole({
      userId: actorUserId,
      businessId,
      allowedRoles: ["OWNER", "ADMIN"],
    });

    const rule = await createAvailabilityRule({
      businessId,
      staffId,
      actorUserId,
      weekday: body.weekday,
      startMinutes: body.startMinutes,
      endMinutes: body.endMinutes,
      timezone: body.timezone,
      effectiveFrom: body.effectiveFrom,
      effectiveTo: body.effectiveTo,
      active: body.active,
      metadata: body.metadata,
    });

    return created(rule);
  } catch (err) {
    return handleRouteError(err);
  }
}
