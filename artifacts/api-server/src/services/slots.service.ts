import {
  db,
  availabilityRulesTable,
  timeOffTable,
  bookingsTable,
  servicesTable,
  staffTable,
  staffShiftsTable,
} from "@workspace/db";
import { eq, and, gte, lte, or, inArray } from "drizzle-orm";
import { dayOfWeekInTz, dayBoundsInTz, zonedDateTimeToUtc } from "../lib/tz";
import { resolveResourceForService, resourceCapacityAvailable } from "./booking-resources.service";
import { isDateClosedForBusiness } from "./country-pack.service";
import { getBusinessById } from "./businesses.service";

type Slot = {
  startAt: string;
  endAt: string;
  staffId: string | null;
  staffDisplayName: string | null;
  resourceId: string | null;
  available: boolean;
};

export async function getAvailableSlots(opts: {
  businessId: string;
  serviceId: string;
  date: string;
  staffId?: string;
  resourceId?: string;
  timezone: string;
}): Promise<Slot[]> {
  const { businessId, serviceId, date, staffId, timezone } = opts;

  const [service] = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.id, serviceId), eq(servicesTable.businessId, businessId)));

  if (!service) return [];

  const biz = await getBusinessById(businessId);
  const closed = isDateClosedForBusiness(biz?.country, date);
  if (closed) return [];

  const resolvedResourceId = await resolveResourceForService(
    businessId,
    serviceId,
    opts.resourceId,
  );

  const durationMs = (service.durationMinutes + service.bufferAfterMinutes) * 60_000;
  const bufferBeforeMs = service.bufferBeforeMinutes * 60_000;

  const { start: dayStart, end: dayEnd } = dayBoundsInTz(date, timezone);
  const dayOfWeek = dayOfWeekInTz(date, timezone);

  const staffFilter = staffId
    ? [staffId]
    : (
        await db
          .select({ id: staffTable.id, displayName: staffTable.displayName })
          .from(staffTable)
          .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)))
      ).map((s) => s.id);

  const staffNameMap = new Map(
    (
      await db
        .select({ id: staffTable.id, displayName: staffTable.displayName })
        .from(staffTable)
        .where(
          staffFilter.length
            ? inArray(staffTable.id, staffFilter)
            : eq(staffTable.businessId, businessId),
        )
    ).map((s) => [s.id, s.displayName]),
  );

  const rules = await db
    .select()
    .from(availabilityRulesTable)
    .where(
      and(
        staffId
          ? eq(availabilityRulesTable.staffId, staffId)
          : eq(availabilityRulesTable.businessId, businessId),
        eq(availabilityRulesTable.isActive, true),
      ),
    );

  const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);
  if (dayRules.length === 0) return [];

  const timeOffs = await db
    .select()
    .from(timeOffTable)
    .where(
      and(
        staffId
          ? eq(timeOffTable.staffId, staffId)
          : eq(timeOffTable.businessId, businessId),
        lte(timeOffTable.startsAt, dayEnd),
        gte(timeOffTable.endsAt, dayStart),
      ),
    );

  const existingBookings = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        staffId ? eq(bookingsTable.staffId, staffId) : undefined,
        gte(bookingsTable.startAt, dayStart),
        lte(bookingsTable.startAt, dayEnd),
        or(eq(bookingsTable.status, "CONFIRMED"), eq(bookingsTable.status, "PENDING")),
      ),
    );

  const publishedShifts = await db
    .select()
    .from(staffShiftsTable)
    .where(
      and(
        eq(staffShiftsTable.businessId, businessId),
        lte(staffShiftsTable.startsAt, dayEnd),
        gte(staffShiftsTable.endsAt, dayStart),
      ),
    );

  const slots: Slot[] = [];
  const [Y, M, D] = date.split("-").map(Number);
  const now = new Date();

  for (const rule of dayRules) {
    const ruleStaffId = rule.staffId;
    if (!ruleStaffId) continue;
    if (staffFilter.length && !staffFilter.includes(ruleStaffId)) continue;

    const [startH, startM] = rule.startTime.split(":").map(Number);
    const [endH, endM] = rule.endTime.split(":").map(Number);

    const ruleStartUtc = zonedDateTimeToUtc(Y, M, D, startH, startM, timezone);
    const ruleEndUtc = zonedDateTimeToUtc(Y, M, D, endH, endM, timezone);

    let cursorMs = ruleStartUtc.getTime();
    const ruleEndMs = ruleEndUtc.getTime();

    while (cursorMs + durationMs <= ruleEndMs) {
      const slotStart = new Date(cursorMs);
      const slotEnd = new Date(cursorMs + durationMs);
      const slotStartWithBuffer = new Date(cursorMs - bufferBeforeMs);

      const blockedByTimeOff = timeOffs.some(
        (to) =>
          (!to.staffId || to.staffId === ruleStaffId) &&
          slotEnd > to.startsAt &&
          slotStartWithBuffer < to.endsAt,
      );

      const blockedByBooking = existingBookings.some((b) => {
        if (b.staffId && b.staffId !== ruleStaffId) return false;
        return slotEnd > b.startAt && slotStartWithBuffer < b.endAt;
      });

      const shiftsForStaff = publishedShifts.filter((s) => s.staffId === ruleStaffId);
      const shiftGated = shiftsForStaff.length > 0;
      const inShift = shiftsForStaff.some(
        (s) => slotEnd > s.startsAt && slotStartWithBuffer < s.endsAt,
      );
      const blockedByShift = shiftGated && !inShift;

      let resourceAvailable = true;
      if (resolvedResourceId) {
        resourceAvailable = await resourceCapacityAvailable({
          businessId,
          resourceId: resolvedResourceId,
          startAt: slotStart,
          endAt: slotEnd,
        });
      }

      const available = !blockedByTimeOff && !blockedByBooking && !blockedByShift && resourceAvailable;

      if (slotStart > now) {
        slots.push({
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
          staffId: ruleStaffId,
          staffDisplayName: staffNameMap.get(ruleStaffId) ?? null,
          resourceId: resolvedResourceId,
          available,
        });
      }

      cursorMs += 30 * 60_000;
    }
  }

  return slots;
}
