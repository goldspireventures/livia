import { Prisma } from "@prisma/client";
import { z } from "zod";

import { BliqEventTypes, logEvent } from "@/lib/events";
import { badRequest, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getStaffById } from "@/services/staff/staffService";

function assertWeekday(weekday: number) {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw badRequest("weekday must be an integer from 0 (Sunday) through 6 (Saturday).");
  }
}

function assertMinuteSegment(startMinutes: number, endMinutes: number) {
  if (!Number.isInteger(startMinutes) || !Number.isInteger(endMinutes)) {
    throw badRequest("startMinutes and endMinutes must be integers.");
  }
  if (startMinutes < 0 || startMinutes >= 1440) {
    throw badRequest("startMinutes must be in [0, 1440) (minutes from local midnight).");
  }
  if (endMinutes <= 0 || endMinutes > 1440) {
    throw badRequest("endMinutes must be in (0, 1440] (exclusive end at next midnight is 1440).");
  }
  if (!(startMinutes < endMinutes)) {
    throw badRequest("startMinutes must be less than endMinutes (same-day segment; no overnight in this phase).");
  }
}

function assertEffectiveWindow(effectiveFrom?: Date | null, effectiveTo?: Date | null) {
  if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
    throw badRequest("effectiveFrom must be on or before effectiveTo.");
  }
}

const CreateAvailabilityRuleInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  actorUserId: z.string().min(1),
  weekday: z.number().int(),
  startMinutes: z.number().int(),
  endMinutes: z.number().int(),
  timezone: z.string().min(1).optional(),
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveTo: z.coerce.date().optional().nullable(),
  active: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function createAvailabilityRule(input: z.infer<typeof CreateAvailabilityRuleInput>) {
  const parsed = CreateAvailabilityRuleInput.parse(input);
  const {
    businessId,
    staffId,
    actorUserId,
    weekday,
    startMinutes,
    endMinutes,
    timezone,
    effectiveFrom,
    effectiveTo,
    active,
    metadata,
  } = parsed;

  await getStaffById({ businessId, staffId });
  assertWeekday(weekday);
  assertMinuteSegment(startMinutes, endMinutes);
  assertEffectiveWindow(effectiveFrom ?? undefined, effectiveTo ?? undefined);

  const rule = await prisma.availabilityRule.create({
    data: {
      businessId,
      staffId,
      weekday,
      startMinutes,
      endMinutes,
      timezone: timezone?.trim() || "UTC",
      effectiveFrom: effectiveFrom ?? undefined,
      effectiveTo: effectiveTo ?? undefined,
      active: active ?? true,
      metadata: metadata ?? undefined,
    },
  });

  await logEvent({
    type: BliqEventTypes.AVAILABILITY_RULE_CREATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "AvailabilityRule",
    subjectId: rule.id,
    payload: { staffId, weekday, startMinutes, endMinutes },
  });

  return rule;
}

const ListAvailabilityRulesInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  includeInactive: z.boolean().optional(),
});

export async function listAvailabilityRulesForStaff(input: z.infer<typeof ListAvailabilityRulesInput>) {
  const { businessId, staffId, includeInactive } = ListAvailabilityRulesInput.parse(input);
  await getStaffById({ businessId, staffId });

  return prisma.availabilityRule.findMany({
    where: {
      businessId,
      staffId,
      ...(includeInactive ? {} : { active: true }),
    },
    orderBy: [{ weekday: "asc" }, { startMinutes: "asc" }],
  });
}

const GetAvailabilityRuleInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  ruleId: z.string().min(1),
});

export async function getAvailabilityRuleById(input: z.infer<typeof GetAvailabilityRuleInput>) {
  const { businessId, staffId, ruleId } = GetAvailabilityRuleInput.parse(input);
  await getStaffById({ businessId, staffId });

  const rule = await prisma.availabilityRule.findFirst({
    where: { id: ruleId, businessId, staffId },
  });
  if (!rule) throw notFound("Availability rule not found.");
  return rule;
}

const UpdateAvailabilityRuleInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  ruleId: z.string().min(1),
  actorUserId: z.string().min(1),
  data: z
    .object({
      weekday: z.number().int().optional(),
      startMinutes: z.number().int().optional(),
      endMinutes: z.number().int().optional(),
      timezone: z.string().min(1).optional(),
      effectiveFrom: z.coerce.date().optional().nullable(),
      effectiveTo: z.coerce.date().optional().nullable(),
      active: z.boolean().optional(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function updateAvailabilityRule(input: z.infer<typeof UpdateAvailabilityRuleInput>) {
  const { businessId, staffId, ruleId, actorUserId, data } = UpdateAvailabilityRuleInput.parse(input);
  const existing = await getAvailabilityRuleById({ businessId, staffId, ruleId });

  const nextWeekday = data.weekday ?? existing.weekday;
  const nextStart = data.startMinutes ?? existing.startMinutes;
  const nextEnd = data.endMinutes ?? existing.endMinutes;
  assertWeekday(nextWeekday);
  assertMinuteSegment(nextStart, nextEnd);

  const nextEffectiveFrom = data.effectiveFrom !== undefined ? data.effectiveFrom : existing.effectiveFrom;
  const nextEffectiveTo = data.effectiveTo !== undefined ? data.effectiveTo : existing.effectiveTo;
  assertEffectiveWindow(nextEffectiveFrom ?? undefined, nextEffectiveTo ?? undefined);

  const updated = await prisma.availabilityRule.update({
    where: { id: ruleId },
    data: {
      ...(data.weekday !== undefined ? { weekday: data.weekday } : {}),
      ...(data.startMinutes !== undefined ? { startMinutes: data.startMinutes } : {}),
      ...(data.endMinutes !== undefined ? { endMinutes: data.endMinutes } : {}),
      ...(data.timezone !== undefined ? { timezone: data.timezone.trim() } : {}),
      ...(data.effectiveFrom !== undefined ? { effectiveFrom: data.effectiveFrom } : {}),
      ...(data.effectiveTo !== undefined ? { effectiveTo: data.effectiveTo } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata === null ? Prisma.JsonNull : data.metadata } : {}),
    },
  });

  await logEvent({
    type: BliqEventTypes.AVAILABILITY_RULE_UPDATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "AvailabilityRule",
    subjectId: ruleId,
    payload: { staffId, updatedFields: Object.keys(data) },
  });

  return updated;
}

const DeleteAvailabilityRuleInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  ruleId: z.string().min(1),
  actorUserId: z.string().min(1),
});

export async function deleteAvailabilityRule(input: z.infer<typeof DeleteAvailabilityRuleInput>) {
  const { businessId, staffId, ruleId, actorUserId } = DeleteAvailabilityRuleInput.parse(input);
  await getAvailabilityRuleById({ businessId, staffId, ruleId });

  await prisma.availabilityRule.delete({ where: { id: ruleId } });

  await logEvent({
    type: BliqEventTypes.AVAILABILITY_RULE_DELETED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "AvailabilityRule",
    subjectId: ruleId,
    payload: { staffId },
  });

  return { ok: true as const, id: ruleId };
}
