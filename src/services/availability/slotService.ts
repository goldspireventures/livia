import "server-only";

import { addMinutes, max, min } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";

import { badRequest, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getBusinessBySlug } from "@/services/business/businessService";
import { getServiceById } from "@/services/catalog/serviceCatalogService";
import { getTimezoneFromBusinessSettings } from "@/lib/businessSettings";
import type { PublicSlot } from "./slotUtils";
import { isWindowInPublicSlotList } from "./slotUtils";

const SLOT_STEP_MINUTES = 15;
const MAX_DAYS_AHEAD = 180;

export type { PublicSlot } from "./slotUtils";

function isoWeekdayToSchemaWeekday(isoDay: number): number {
  return isoDay === 7 ? 0 : isoDay;
}

/** Weekday 0=Sun .. 6=Sat in `timeZone` for calendar `dateStr` (YYYY-MM-DD). */
function weekdayInTimeZone(dateStr: string, timeZone: string): number {
  const anchor = toDate(`${dateStr}T12:00:00`, { timeZone });
  const isoDay = Number(formatInTimeZone(anchor, timeZone, "i"));
  if (!Number.isFinite(isoDay) || isoDay < 1 || isoDay > 7) {
    throw badRequest("Invalid date.");
  }
  return isoWeekdayToSchemaWeekday(isoDay);
}

function assertReasonablePublicDate(dateStr: string, timeZone: string) {
  const targetMid = toDate(`${dateStr}T12:00:00`, { timeZone });
  const now = new Date();
  const todayMid = toDate(formatInTimeZone(now, timeZone, "yyyy-MM-dd") + "T12:00:00", { timeZone });
  const diffDays = Math.floor((targetMid.getTime() - todayMid.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < -1) throw badRequest("Date is in the past.");
  if (diffDays > MAX_DAYS_AHEAD) throw badRequest("Date is too far in the future.");
}

function rangesOverlap(a0: Date, a1: Date, b0: Date, b1: Date): boolean {
  return a0 < b1 && a1 > b0;
}

function subtractIntervals(
  baseStart: Date,
  baseEnd: Date,
  blocks: { start: Date; end: Date }[],
): { start: Date; end: Date }[] {
  let intervals = [{ start: baseStart, end: baseEnd }];
  for (const block of blocks) {
    const next: { start: Date; end: Date }[] = [];
    for (const iv of intervals) {
      if (!rangesOverlap(iv.start, iv.end, block.start, block.end)) {
        next.push(iv);
        continue;
      }
      if (block.start > iv.start) {
        next.push({ start: iv.start, end: min([block.start, iv.end]) });
      }
      if (block.end < iv.end) {
        next.push({ start: max([block.end, iv.start]), end: iv.end });
      }
    }
    intervals = next.filter((x) => x.start < x.end);
  }
  return intervals;
}

/**
 * Bookable slots for a service on a calendar day (`dateStr` = YYYY-MM-DD in business timezone).
 */
export async function listPublicSlotsForDay(input: {
  businessSlug: string;
  serviceId: string;
  dateStr: string;
}): Promise<PublicSlot[]> {
  const { businessSlug, serviceId, dateStr } = input;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw badRequest("date must be YYYY-MM-DD.");
  }

  const business = await getBusinessBySlug({ slug: businessSlug });
  if (!business) throw notFound("Business not found.");

  const businessTz = getTimezoneFromBusinessSettings(business.settings);
  assertReasonablePublicDate(dateStr, businessTz);
  const service = await getServiceById({ businessId: business.id, serviceId });
  if (!service.active) {
    throw badRequest("Service is not active.");
  }

  const duration = service.durationMinutes;
  if (duration <= 0) {
    throw badRequest("Invalid service duration.");
  }

  const assignments = await prisma.staffServiceAssignment.findMany({
    where: { businessId: business.id, serviceId },
    select: { staffId: true },
  });
  const staffIds = [...new Set(assignments.map((a) => a.staffId))];
  if (staffIds.length === 0) return [];

  const activeStaffRows = await prisma.staff.findMany({
    where: { businessId: business.id, id: { in: staffIds }, active: true },
    select: { id: true },
  });
  const activeStaffIdSet = new Set(activeStaffRows.map((s) => s.id));
  const staffIdsActive = staffIds.filter((id) => activeStaffIdSet.has(id));
  if (staffIdsActive.length === 0) return [];

  const dayStartBiz = toDate(`${dateStr}T00:00:00`, { timeZone: businessTz });
  const dayEndBiz = addMinutes(toDate(`${dateStr}T23:59:59`, { timeZone: businessTz }), 1);

  const bookings = await prisma.booking.findMany({
    where: {
      businessId: business.id,
      staffId: { in: staffIdsActive },
      status: { not: "CANCELLED" },
      AND: [{ startsAt: { lt: dayEndBiz } }, { endsAt: { gt: dayStartBiz } }],
    },
    select: { staffId: true, startsAt: true, endsAt: true },
  });

  const timeOffs = await prisma.timeOff.findMany({
    where: {
      businessId: business.id,
      staffId: { in: staffIdsActive },
      AND: [{ startsAt: { lt: dayEndBiz } }, { endsAt: { gt: dayStartBiz } }],
    },
    select: { staffId: true, startsAt: true, endsAt: true },
  });

  const allRules = await prisma.availabilityRule.findMany({
    where: { businessId: business.id, staffId: { in: staffIdsActive }, active: true },
  });
  const rulesByStaff = new Map<string, typeof allRules>();
  for (const r of allRules) {
    const sid = r.staffId;
    const cur = rulesByStaff.get(sid);
    if (cur) cur.push(r);
    else rulesByStaff.set(sid, [r]);
  }

  const slots: PublicSlot[] = [];

  for (const staffId of staffIdsActive) {
    const rules = rulesByStaff.get(staffId) ?? [];

    for (const rule of rules) {
      const ruleTz = rule.timezone?.trim() || businessTz;
      const w = weekdayInTimeZone(dateStr, ruleTz);
      if (w !== rule.weekday) continue;

      const dayMidRule = toDate(`${dateStr}T12:00:00`, { timeZone: ruleTz });
      if (rule.effectiveFrom && dayMidRule < rule.effectiveFrom) continue;
      if (rule.effectiveTo && dayMidRule > rule.effectiveTo) continue;

      const dayStartRule = toDate(`${dateStr}T00:00:00`, { timeZone: ruleTz });
      const winStart = addMinutes(dayStartRule, rule.startMinutes);
      const winEnd = addMinutes(dayStartRule, rule.endMinutes);
      if (!(winStart < winEnd)) continue;

      const staffBookings = bookings
        .filter((b) => b.staffId === staffId)
        .map((b) => ({ start: b.startsAt, end: b.endsAt }));
      const staffOff = timeOffs
        .filter((t) => t.staffId === staffId)
        .map((t) => ({ start: t.startsAt, end: t.endsAt }));

      const free = subtractIntervals(winStart, winEnd, [...staffBookings, ...staffOff]);

      for (const iv of free) {
        let t = iv.start;
        while (addMinutes(t, duration) <= iv.end) {
          slots.push({
            startsAt: t.toISOString(),
            endsAt: addMinutes(t, duration).toISOString(),
            staffId,
          });
          t = addMinutes(t, SLOT_STEP_MINUTES);
        }
      }
    }
  }

  slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.staffId.localeCompare(b.staffId));
  return slots;
}

/**
 * Owner/internal slot list. Same logic as public slots but addressed by `businessId` (not slug).
 * Intended for UI previews in the owner workspace (Milestone A).
 */
export async function listOwnerSlotsForDay(input: {
  businessId: string;
  serviceId: string;
  dateStr: string;
  /** When set, returns only slots for this staff member. */
  staffId?: string | null;
}): Promise<PublicSlot[]> {
  const { businessId, serviceId, dateStr } = input;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw badRequest("date must be YYYY-MM-DD.");
  }

  const business = await prisma.business.findFirst({ where: { id: businessId } });
  if (!business) throw notFound("Business not found.");

  const businessTz = getTimezoneFromBusinessSettings(business.settings);
  assertReasonablePublicDate(dateStr, businessTz);

  const service = await getServiceById({ businessId: business.id, serviceId });
  if (!service.active) throw badRequest("Service is not active.");
  const duration = service.durationMinutes;
  if (duration <= 0) throw badRequest("Invalid service duration.");

  const assignments = await prisma.staffServiceAssignment.findMany({
    where: {
      businessId: business.id,
      serviceId,
      ...(input.staffId ? { staffId: input.staffId } : {}),
    },
    select: { staffId: true },
  });
  const staffIds = [...new Set(assignments.map((a) => a.staffId))];
  if (staffIds.length === 0) return [];

  const activeStaffRows = await prisma.staff.findMany({
    where: { businessId: business.id, id: { in: staffIds }, active: true },
    select: { id: true },
  });
  const activeStaffIdSet = new Set(activeStaffRows.map((s) => s.id));
  const staffIdsActive = staffIds.filter((id) => activeStaffIdSet.has(id));
  if (staffIdsActive.length === 0) return [];

  const dayStartBiz = toDate(`${dateStr}T00:00:00`, { timeZone: businessTz });
  const dayEndBiz = addMinutes(toDate(`${dateStr}T23:59:59`, { timeZone: businessTz }), 1);

  const bookings = await prisma.booking.findMany({
    where: {
      businessId: business.id,
      staffId: { in: staffIdsActive },
      status: { not: "CANCELLED" },
      AND: [{ startsAt: { lt: dayEndBiz } }, { endsAt: { gt: dayStartBiz } }],
    },
    select: { staffId: true, startsAt: true, endsAt: true },
  });

  const timeOffs = await prisma.timeOff.findMany({
    where: {
      businessId: business.id,
      staffId: { in: staffIdsActive },
      AND: [{ startsAt: { lt: dayEndBiz } }, { endsAt: { gt: dayStartBiz } }],
    },
    select: { staffId: true, startsAt: true, endsAt: true },
  });

  const allRules = await prisma.availabilityRule.findMany({
    where: { businessId: business.id, staffId: { in: staffIdsActive }, active: true },
  });
  const rulesByStaff = new Map<string, typeof allRules>();
  for (const r of allRules) {
    const sid = r.staffId;
    const cur = rulesByStaff.get(sid);
    if (cur) cur.push(r);
    else rulesByStaff.set(sid, [r]);
  }

  const slots: PublicSlot[] = [];

  for (const staffId of staffIdsActive) {
    const rules = rulesByStaff.get(staffId) ?? [];

    for (const rule of rules) {
      const ruleTz = rule.timezone?.trim() || businessTz;
      const w = weekdayInTimeZone(dateStr, ruleTz);
      if (w !== rule.weekday) continue;

      const dayMidRule = toDate(`${dateStr}T12:00:00`, { timeZone: ruleTz });
      if (rule.effectiveFrom && dayMidRule < rule.effectiveFrom) continue;
      if (rule.effectiveTo && dayMidRule > rule.effectiveTo) continue;

      const dayStartRule = toDate(`${dateStr}T00:00:00`, { timeZone: ruleTz });
      const winStart = addMinutes(dayStartRule, rule.startMinutes);
      const winEnd = addMinutes(dayStartRule, rule.endMinutes);
      if (!(winStart < winEnd)) continue;

      const staffBookings = bookings
        .filter((b) => b.staffId === staffId)
        .map((b) => ({ start: b.startsAt, end: b.endsAt }));
      const staffOff = timeOffs
        .filter((t) => t.staffId === staffId)
        .map((t) => ({ start: t.startsAt, end: t.endsAt }));

      const free = subtractIntervals(winStart, winEnd, [...staffBookings, ...staffOff]);

      for (const iv of free) {
        let t = iv.start;
        while (addMinutes(t, duration) <= iv.end) {
          slots.push({
            startsAt: t.toISOString(),
            endsAt: addMinutes(t, duration).toISOString(),
            staffId,
          });
          t = addMinutes(t, SLOT_STEP_MINUTES);
        }
      }
    }
  }

  slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.staffId.localeCompare(b.staffId));
  return slots;
}

/**
 * True if the exact window is one of the offered public slots for that day.
 */
export async function isPublicSlotOffered(input: {
  businessSlug: string;
  serviceId: string;
  dateStr: string;
  staffId: string;
  startsAt: Date;
  endsAt: Date;
}): Promise<boolean> {
  const offered = await listPublicSlotsForDay({
    businessSlug: input.businessSlug,
    serviceId: input.serviceId,
    dateStr: input.dateStr,
  });
  return isWindowInPublicSlotList(offered, input.staffId, input.startsAt, input.endsAt);
}
