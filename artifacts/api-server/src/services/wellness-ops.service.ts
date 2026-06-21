import {
  db,
  bookingsTable,
  bookingResourcesTable,
  businessesTable,
  servicesTable,
  staffTable,
  customersTable,
} from "@workspace/db";
import { and, eq, gte, lte, inArray, desc, sql } from "drizzle-orm";
import { WELLNESS_ROOM_TURNOVER_MINUTES } from "@workspace/policy";
import { getAvailableSlots } from "./slots.service";
import { getCachedTenantRuntime } from "../lib/tenant-runtime-pool";
import { derivePendingReason } from "../lib/booking-pending";
import { depositAppliesForBookingContext } from "@workspace/policy";
import { policiesFromBusiness } from "./policies.service";

function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000);
}

export async function proposeWalkInSlot(
  businessId: string,
  input: { serviceId: string; staffId?: string; preferredStart?: string },
) {
  const [biz] = await db
    .select({ timezone: businessesTable.timezone })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  const tz = biz?.timezone ?? "Europe/Dublin";
  const day = input.preferredStart
    ? input.preferredStart.slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const slots = await getAvailableSlots({
    businessId,
    serviceId: input.serviceId,
    date: day,
    staffId: input.staffId,
    timezone: tz,
  });
  const first = slots.find((s) => s.available);
  if (!first) {
    return { ok: false as const, message: "No walk-in slots with turnover buffer today." };
  }
  return {
    ok: true as const,
    startAt: first.startAt,
    endAt: first.endAt,
    turnoverMinutes: WELLNESS_ROOM_TURNOVER_MINUTES,
    message: `Next slot ${new Date(first.startAt).toLocaleTimeString()} (${WELLNESS_ROOM_TURNOVER_MINUTES}m turnover after prior session).`,
  };
}

export async function proposeDutySolver(
  businessId: string,
  input: {
    resourceName?: string;
    hour?: number;
    therapistGender?: "female" | "male" | "any";
  },
) {
  const resources = await db
    .select()
    .from(bookingResourcesTable)
    .where(eq(bookingResourcesTable.businessId, businessId));
  const room =
    input.resourceName != null
      ? resources.find((r) =>
          r.name.toLowerCase().includes(input.resourceName!.toLowerCase()),
        )
      : resources[0];
  if (!room) return { matches: [], message: "No rooms configured." };

  const now = new Date();
  const start = new Date(now);
  start.setHours(input.hour ?? 14, 0, 0, 0);
  const end = addMinutes(start, 90 + WELLNESS_ROOM_TURNOVER_MINUTES);

  const staff = await db
    .select()
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, start),
        lte(bookingsTable.startAt, end),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
      ),
    );

  const freeStaff = staff.filter((s) => {
    const busy = bookings.some((b) => b.staffId === s.id);
    return !busy;
  });

  const matches = freeStaff.slice(0, 3).map((s) => ({
    staffId: s.id,
    displayName: s.displayName,
    roomId: room.id,
    roomName: room.name,
    suggestedStart: start.toISOString(),
  }));

  return {
    roomName: room.name,
    matches,
    message:
      matches.length > 0
        ? `${matches.length} therapist(s) free in ${room.name} around ${input.hour ?? 14}:00.`
        : "No free therapists — try another room or time.",
    constraintNote:
      input.therapistGender && input.therapistGender !== "any"
        ? `Filter ${input.therapistGender} therapist in Liv memory before auto-assign.`
        : undefined,
  };
}

export async function getEodCloseNarrative(businessId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const today = await db
    .select({
      status: bookingsTable.status,
      startAt: bookingsTable.startAt,
    })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, start),
        lte(bookingsTable.startAt, end),
      ),
    );

  const noShows = today.filter((b) => b.status === "NO_SHOW").length;
  const pending = today.filter((b) => b.status === "PENDING").length;
  const completed = today.filter((b) => b.status === "COMPLETED").length;

  const tomorrowStart = new Date(start);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const tomorrow = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, tomorrowStart),
        lte(bookingsTable.startAt, tomorrowEnd),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
      ),
    );

  const { getPackageCreditSummary } = await import("./package-credits.service");
  const packs = await getPackageCreditSummary(businessId);

  const lines = [
    `Today: ${completed} completed · ${noShows} no-show · ${pending} still pending.`,
    `Tomorrow: ${tomorrow.length} sessions on the books.`,
    `Packages: ${packs.creditsRemaining} sessions unearned on ledger.`,
  ];
  if (pending > 0) lines.push("Close pending approvals in Inbox before you leave.");

  return { lines, stats: { noShows, pending, completed, tomorrowCount: tomorrow.length } };
}

export async function getTodayRunSheet(businessId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const rows = await db
    .select({
      id: bookingsTable.id,
      startAt: bookingsTable.startAt,
      status: bookingsTable.status,
      serviceName: servicesTable.name,
      staffName: staffTable.displayName,
      resourceName: bookingResourcesTable.name,
      customerFirst: customersTable.firstName,
      customerLast: customersTable.lastName,
    })
    .from(bookingsTable)
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(staffTable, eq(bookingsTable.staffId, staffTable.id))
    .leftJoin(bookingResourcesTable, eq(bookingsTable.resourceId, bookingResourcesTable.id))
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, start),
        lte(bookingsTable.startAt, end),
      ),
    )
    .orderBy(bookingsTable.startAt);

  return rows.map((r) => ({
    bookingId: r.id,
    time: r.startAt.toISOString(),
    guest: [r.customerFirst, r.customerLast].filter(Boolean).join(" ").trim() || "Guest",
    service: r.serviceName,
    therapist: r.staffName ?? "—",
    room: r.resourceName ?? "Unassigned",
    status: r.status,
  }));
}

export async function getCalendarPoisonAlerts(businessId: string) {
  const { detectCalendarConflicts } = await import("./google-calendar-sync.service");
  const alerts = await detectCalendarConflicts(businessId);
  return {
    alerts,
    note: alerts.length === 0 ? "Calendar in sync — no conflicts detected." : undefined,
  };
}

export async function proposeRerooming(businessId: string) {
  const since = addMinutes(new Date(), -24 * 60);
  const cancelled = await db
    .select({ resourceId: bookingsTable.resourceId })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "CANCELLED"),
        gte(bookingsTable.updatedAt, since),
      ),
    );

  if (cancelled.length < 2) {
    return { proposals: [], message: "No mass cancellation pattern in the last 24h." };
  }

  const pending = await db
    .select({ id: bookingsTable.id, resourceId: bookingsTable.resourceId })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "PENDING"),
        gte(bookingsTable.startAt, new Date()),
      ),
    )
    .limit(5);

  return {
    proposals: pending.map((p) => ({
      bookingId: p.id,
      suggestion: "Review room assignment — capacity opened after cancellations.",
    })),
    message: `${cancelled.length} cancellations — ${pending.length} pending sessions may fit freed rooms.`,
  };
}

export async function confirmBookingAfterStripePayment(businessId: string, bookingId: string) {
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)))
    .limit(1);
  if (!booking || booking.status !== "PENDING") return { updated: false };

  const cached = await getCachedTenantRuntime(businessId);
  const policies = policiesFromBusiness(cached.business);
  const op = policies.operational;
  const [cust] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, booking.customerId))
    .limit(1);

  const [service] = await db
    .select({
      priceMinor: servicesTable.priceMinor,
      serviceKind: servicesTable.serviceKind,
      category: servicesTable.category,
    })
    .from(servicesTable)
    .where(and(eq(servicesTable.id, booking.serviceId), eq(servicesTable.businessId, businessId)))
    .limit(1);

  const depositApplies = depositAppliesForBookingContext({
    operational: op,
    service: service ?? null,
  });

  const pendingReason = derivePendingReason({
    source: booking.source ?? "web",
    aiCanBookDirectly: (cached.business.aiCanBookDirectly ?? "true") === "true",
    depositRequired: depositApplies,
    depositPaidEurCents: booking.depositPaidEurCents ?? 0,
    bookingContinuityEnabled: op.bookingContinuityEnabled,
    customerHasPhone: !!cust?.phone?.trim(),
    customerHasEmail: !!cust?.email?.trim(),
  });

  if (pendingReason !== null) {
    return { updated: false };
  }

  await db
    .update(bookingsTable)
    .set({ status: "CONFIRMED", pendingReason: null, updatedAt: new Date() })
    .where(eq(bookingsTable.id, bookingId));

  return { updated: true };
}
