import { db, availabilityRulesTable, timeOffTable, bookingsTable, servicesTable } from "@workspace/db";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { dayOfWeekInTz, dayBoundsInTz, zonedDateTimeToUtc } from "../lib/tz";

type Slot = {
  startAt: string;
  endAt: string;
  staffId: string | null;
  staffDisplayName: string | null;
  available: boolean;
};

export async function getAvailableSlots(opts: {
  businessId: string;
  serviceId: string;
  date: string;
  staffId?: string;
  timezone: string;
}): Promise<Slot[]> {
  const { businessId, serviceId, date, staffId, timezone } = opts;

  const [service] = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.id, serviceId), eq(servicesTable.businessId, businessId)));

  if (!service) return [];

  const durationMs = (service.durationMinutes + service.bufferAfterMinutes) * 60_000;
  const bufferBeforeMs = service.bufferBeforeMinutes * 60_000;

  const { start: dayStart, end: dayEnd } = dayBoundsInTz(date, timezone);
  const dayOfWeek = dayOfWeekInTz(date, timezone);

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
        or(
          eq(bookingsTable.status, "CONFIRMED"),
          eq(bookingsTable.status, "PENDING"),
        ),
      ),
    );

  const slots: Slot[] = [];
  const [Y, M, D] = date.split("-").map(Number);
  const now = new Date();

  for (const rule of dayRules) {
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
        (to) => slotEnd > to.startsAt && slotStartWithBuffer < to.endsAt,
      );

      const blockedByBooking = existingBookings.some((b) => {
        return slotEnd > b.startAt && slotStartWithBuffer < b.endAt;
      });

      const available = !blockedByTimeOff && !blockedByBooking;

      if (slotStart > now) {
        slots.push({
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
          staffId: staffId ?? null,
          staffDisplayName: null,
          available,
        });
      }

      cursorMs += 30 * 60_000;
    }
  }

  return slots;
}
