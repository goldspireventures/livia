import { Prisma } from "@prisma/client";
import { z } from "zod";

import { LiviaEventTypes, logEvent } from "@/lib/events";
import { badRequest, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getStaffById } from "@/services/staff/staffService";

function assertTimeOrder(startsAt: Date, endsAt: Date) {
  if (!(startsAt < endsAt)) {
    throw badRequest("endsAt must be after startsAt.");
  }
}

const CreateTimeOffInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  actorUserId: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  reason: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function createTimeOff(input: z.infer<typeof CreateTimeOffInput>) {
  const { businessId, staffId, actorUserId, startsAt, endsAt, reason, metadata } =
    CreateTimeOffInput.parse(input);

  await getStaffById({ businessId, staffId });
  assertTimeOrder(startsAt, endsAt);

  const row = await prisma.timeOff.create({
    data: {
      businessId,
      staffId,
      startsAt,
      endsAt,
      reason: reason?.trim() ?? null,
      metadata: metadata ?? undefined,
    },
  });

  await logEvent({
    type: LiviaEventTypes.TIME_OFF_CREATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "TimeOff",
    subjectId: row.id,
    payload: { staffId, startsAt: row.startsAt.toISOString(), endsAt: row.endsAt.toISOString() },
  });

  return row;
}

const ListTimeOffsInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function listTimeOffsForStaff(input: z.infer<typeof ListTimeOffsInput>) {
  const { businessId, staffId, from, to } = ListTimeOffsInput.parse(input);
  await getStaffById({ businessId, staffId });

  const range =
    from && to
      ? { AND: [{ startsAt: { lt: to } }, { endsAt: { gt: from } }] }
      : from
        ? { endsAt: { gt: from } }
        : to
          ? { startsAt: { lt: to } }
          : {};

  return prisma.timeOff.findMany({
    where: { businessId, staffId, ...range },
    orderBy: { startsAt: "asc" },
  });
}

const GetTimeOffInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  timeOffId: z.string().min(1),
});

export async function getTimeOffById(input: z.infer<typeof GetTimeOffInput>) {
  const { businessId, staffId, timeOffId } = GetTimeOffInput.parse(input);
  await getStaffById({ businessId, staffId });

  const row = await prisma.timeOff.findFirst({
    where: { id: timeOffId, businessId, staffId },
  });
  if (!row) throw notFound("Time off not found.");
  return row;
}

const UpdateTimeOffInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  timeOffId: z.string().min(1),
  actorUserId: z.string().min(1),
  data: z
    .object({
      startsAt: z.coerce.date().optional(),
      endsAt: z.coerce.date().optional(),
      reason: z.string().optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function updateTimeOff(input: z.infer<typeof UpdateTimeOffInput>) {
  const { businessId, staffId, timeOffId, actorUserId, data } = UpdateTimeOffInput.parse(input);
  const existing = await getTimeOffById({ businessId, staffId, timeOffId });

  const nextStart = data.startsAt ?? existing.startsAt;
  const nextEnd = data.endsAt ?? existing.endsAt;
  assertTimeOrder(nextStart, nextEnd);

  const updated = await prisma.timeOff.update({
    where: { id: timeOffId },
    data: {
      startsAt: nextStart,
      endsAt: nextEnd,
      ...(data.reason !== undefined ? { reason: data.reason === null ? null : data.reason.trim() } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata === null ? Prisma.JsonNull : data.metadata } : {}),
    },
  });

  await logEvent({
    type: LiviaEventTypes.TIME_OFF_UPDATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "TimeOff",
    subjectId: timeOffId,
    payload: { staffId, updatedFields: Object.keys(data) },
  });

  return updated;
}

const DeleteTimeOffInput = z.object({
  businessId: z.string().min(1),
  staffId: z.string().min(1),
  timeOffId: z.string().min(1),
  actorUserId: z.string().min(1),
});

export async function deleteTimeOff(input: z.infer<typeof DeleteTimeOffInput>) {
  const { businessId, staffId, timeOffId, actorUserId } = DeleteTimeOffInput.parse(input);
  await getTimeOffById({ businessId, staffId, timeOffId });

  await prisma.timeOff.delete({ where: { id: timeOffId } });

  await logEvent({
    type: LiviaEventTypes.TIME_OFF_DELETED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "TimeOff",
    subjectId: timeOffId,
    payload: { staffId },
  });

  return { ok: true as const, id: timeOffId };
}
