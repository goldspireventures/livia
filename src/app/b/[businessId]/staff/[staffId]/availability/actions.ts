"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { assertUserRole } from "@/services/business/membershipService";
import {
  createAvailabilityRule,
  deleteAvailabilityRule,
  updateAvailabilityRule,
} from "@/services/availability/availabilityRuleService";
import { createTimeOff, deleteTimeOff, updateTimeOff } from "@/services/availability/timeOffService";

function timeToMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) throw new Error("Invalid time; use HH:MM (e.g. 09:00).");
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(mi) || mi < 0 || mi > 59 || h < 0 || h > 23) {
    throw new Error("Invalid time.");
  }
  return h * 60 + mi;
}

export async function createAvailabilityRuleAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const staffId = z.string().min(1).parse(formData.get("staffId")?.toString());
  const weekday = z.coerce.number().int().min(0).max(6).parse(formData.get("weekday"));
  const startMinutes = timeToMinutes(z.string().min(1).parse(formData.get("startTime")?.toString()));
  const endMinutes = timeToMinutes(z.string().min(1).parse(formData.get("endTime")?.toString()));
  const timezone = z.string().min(1).parse(formData.get("timezone")?.toString().trim() || "UTC");

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await createAvailabilityRule({
    businessId,
    staffId,
    actorUserId: userId,
    weekday,
    startMinutes,
    endMinutes,
    timezone,
    effectiveFrom: null,
    effectiveTo: null,
    active: true,
    metadata: null,
  });

  revalidatePath(`/b/${businessId}/staff/${staffId}/availability`);
  redirect(`/b/${businessId}/staff/${staffId}/availability`);
}

export async function toggleAvailabilityRuleAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const staffId = z.string().min(1).parse(formData.get("staffId")?.toString());
  const ruleId = z.string().min(1).parse(formData.get("ruleId")?.toString());
  const active = formData.get("nextActive")?.toString() === "true";

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await updateAvailabilityRule({
    businessId,
    staffId,
    ruleId,
    actorUserId: userId,
    data: { active },
  });

  revalidatePath(`/b/${businessId}/staff/${staffId}/availability`);
  redirect(`/b/${businessId}/staff/${staffId}/availability`);
}

export async function deleteAvailabilityRuleAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const staffId = z.string().min(1).parse(formData.get("staffId")?.toString());
  const ruleId = z.string().min(1).parse(formData.get("ruleId")?.toString());

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await deleteAvailabilityRule({ businessId, staffId, ruleId, actorUserId: userId });

  revalidatePath(`/b/${businessId}/staff/${staffId}/availability`);
  redirect(`/b/${businessId}/staff/${staffId}/availability`);
}

export async function createTimeOffAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const staffId = z.string().min(1).parse(formData.get("staffId")?.toString());
  const startsAt = z.coerce.date().parse(formData.get("startsAt")?.toString());
  const endsAt = z.coerce.date().parse(formData.get("endsAt")?.toString());
  const reasonRaw = formData.get("reason")?.toString() ?? "";
  const reason = reasonRaw.trim() === "" ? null : reasonRaw.trim();

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await createTimeOff({
    businessId,
    staffId,
    actorUserId: userId,
    startsAt,
    endsAt,
    reason,
    metadata: null,
  });

  revalidatePath(`/b/${businessId}/staff/${staffId}/availability`);
  redirect(`/b/${businessId}/staff/${staffId}/availability`);
}

export async function updateTimeOffAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const staffId = z.string().min(1).parse(formData.get("staffId")?.toString());
  const timeOffId = z.string().min(1).parse(formData.get("timeOffId")?.toString());
  const startsAt = z.coerce.date().parse(formData.get("startsAt")?.toString());
  const endsAt = z.coerce.date().parse(formData.get("endsAt")?.toString());
  const reasonRaw = formData.get("reason")?.toString() ?? "";
  const reason = reasonRaw.trim() === "" ? null : reasonRaw.trim();

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await updateTimeOff({
    businessId,
    staffId,
    timeOffId,
    actorUserId: userId,
    data: { startsAt, endsAt, reason },
  });

  revalidatePath(`/b/${businessId}/staff/${staffId}/availability`);
  redirect(`/b/${businessId}/staff/${staffId}/availability`);
}

export async function deleteTimeOffAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const staffId = z.string().min(1).parse(formData.get("staffId")?.toString());
  const timeOffId = z.string().min(1).parse(formData.get("timeOffId")?.toString());

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await deleteTimeOff({ businessId, staffId, timeOffId, actorUserId: userId });

  revalidatePath(`/b/${businessId}/staff/${staffId}/availability`);
  redirect(`/b/${businessId}/staff/${staffId}/availability`);
}
