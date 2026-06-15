import {
  db,
  bookingsTable,
  businessesTable,
  customersTable,
  servicesTable,
  staffTable,
} from "@workspace/db";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  inferFillRecommendation,
  isPatchTestValid,
  publicServiceFillHint,
  serviceRequiresPatchTest,
  normalizePhoneE164,
  type BeautyServiceKind,
} from "@workspace/policy";
import { getAvailableSlots } from "./slots.service";
import { listServices } from "./services.service";
import { resolveGuestManageVisitUrl } from "../lib/guest-public-urls";

function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000);
}

export async function proposeBeautyWalkIn(
  businessId: string,
  input: { serviceId: string; staffId?: string; preferredStart?: string },
) {
  const [biz] = await db
    .select({ timezone: businessesTable.timezone, slug: businessesTable.slug })
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
    return { ok: false as const, message: "No walk-in slots today — try tomorrow or add to waitlist." };
  }
  return {
    ok: true as const,
    startAt: first.startAt,
    endAt: first.endAt,
    message: `Next chair ${new Date(first.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — tap to book walk-in.`,
    bookUrl: biz?.slug ? `/bookings?create=1&serviceId=${input.serviceId}` : undefined,
  };
}

export async function getBeautyStationCompass(businessId: string) {
  const [biz] = await db
    .select({ timezone: businessesTable.timezone })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  const tz = biz?.timezone ?? "Europe/Dublin";
  const day = new Date().toISOString().slice(0, 10);

  const staff = await db
    .select({ id: staffTable.id, displayName: staffTable.displayName })
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));

  const services = await listServices(businessId, true);
  const defaultService = services.find((s) => s.isActive) ?? services[0];
  if (!defaultService) {
    return { rows: [] as Array<{ staffId: string; name: string; nextSlot: string | null; label: string }> };
  }

  const rows: Array<{ staffId: string; name: string; nextSlot: string | null; label: string }> = [];
  for (const member of staff) {
    const slots = await getAvailableSlots({
      businessId,
      serviceId: defaultService.id,
      date: day,
      staffId: member.id,
      timezone: tz,
    });
    const next = slots.find((s) => s.available);
    rows.push({
      staffId: member.id,
      name: member.displayName ?? "Tech",
      nextSlot: next?.startAt ?? null,
      label: next
        ? new Date(next.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Fully booked",
    });
  }
  return { rows, serviceName: defaultService.name, date: day };
}

export type FillCycleRow = {
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  lastVisitAt: string;
  daysSince: number;
  rebookIntervalDays: number;
  daysOverdue: number;
};

export async function getBeautyFillCycleRadar(businessId: string): Promise<{
  dueCount: number;
  rows: FillCycleRow[];
}> {
  const completed = await db
    .select({
      customerId: bookingsTable.customerId,
      serviceId: bookingsTable.serviceId,
      endAt: bookingsTable.endAt,
      customerName: customersTable.displayName,
      serviceName: servicesTable.name,
      rebookIntervalDays: servicesTable.rebookIntervalDays,
      serviceKind: servicesTable.serviceKind,
    })
    .from(bookingsTable)
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.status, "COMPLETED"),
        sql`${servicesTable.rebookIntervalDays} IS NOT NULL`,
      ),
    )
    .orderBy(desc(bookingsTable.endAt));

  const latestByCustomerService = new Map<string, (typeof completed)[0]>();
  for (const row of completed) {
    const key = `${row.customerId}:${row.serviceId}`;
    if (!latestByCustomerService.has(key)) latestByCustomerService.set(key, row);
  }

  const now = new Date();
  const rows: FillCycleRow[] = [];
  for (const row of latestByCustomerService.values()) {
    const interval = row.rebookIntervalDays ?? 14;
    const last = row.endAt ?? new Date(0);
    const daysSince = Math.floor((now.getTime() - last.getTime()) / 86_400_000);
    if (daysSince < interval) continue;
    const rec = inferFillRecommendation({
      serviceKind: (row.serviceKind as BeautyServiceKind | null) ?? "fill",
      rebookIntervalDays: interval,
      lastVisitAt: last,
      now,
    });
    if (!rec.dueForFill) continue;
    rows.push({
      customerId: row.customerId,
      customerName: row.customerName ?? "Guest",
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      lastVisitAt: last.toISOString(),
      daysSince,
      rebookIntervalDays: interval,
      daysOverdue: daysSince - interval,
    });
  }

  rows.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return { dueCount: rows.length, rows: rows.slice(0, 50) };
}

export async function getBeautyTvQueue(businessId: string) {
  const now = new Date();
  const end = addMinutes(now, 120);
  const rows = await db
    .select({
      id: bookingsTable.id,
      startAt: bookingsTable.startAt,
      status: bookingsTable.status,
      firstName: customersTable.firstName,
      displayName: customersTable.displayName,
      serviceName: servicesTable.name,
    })
    .from(bookingsTable)
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, now),
        lte(bookingsTable.startAt, end),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
      ),
    )
    .orderBy(bookingsTable.startAt)
    .limit(12);

  return {
    rows: rows.map((r) => {
      const raw = r.firstName ?? r.displayName?.split(" ")[0] ?? "Guest";
      const anon = raw.length > 1 ? `${raw[0]}.` : raw;
      return {
        bookingId: r.id,
        guest: anon,
        service: r.serviceName,
        time: new Date(r.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: r.status,
      };
    }),
  };
}

export async function getBeautyWalletPassMeta(
  businessId: string,
  bookingId: string,
  baseUrl: string,
) {
  const [row] = await db
    .select({
      slug: businessesTable.slug,
      startAt: bookingsTable.startAt,
      serviceName: servicesTable.name,
    })
    .from(bookingsTable)
    .innerJoin(businessesTable, eq(bookingsTable.businessId, businessesTable.id))
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.businessId, businessId)))
    .limit(1);

  if (!row) return null;

  const visitUrl = resolveGuestManageVisitUrl(row.slug, bookingId);
  return {
    visitUrl,
    serviceName: row.serviceName,
    startAt: row.startAt,
    appleWalletUrl: null as string | null,
    googleWalletUrl: null as string | null,
    message:
      "Add to calendar from your visit page — Apple/Google Wallet passes ship in a future release.",
  };
}

export async function resolvePublicBeautyGuestContext(
  businessId: string,
  phoneRaw: string,
) {
  const phone = normalizePhoneE164(phoneRaw.trim()) ?? phoneRaw.trim();
  if (!phone) return { recognized: false as const };

  const [customer] = await db
    .select({
      id: customersTable.id,
      patchTestCompletedAt: customersTable.patchTestCompletedAt,
    })
    .from(customersTable)
    .where(and(eq(customersTable.businessId, businessId), eq(customersTable.phone, phone)))
    .limit(1);

  if (!customer) return { recognized: false as const };

  const hints = await getPublicBeautyGuestHints(businessId, customer.id);
  const services = await listServices(businessId, true);
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const lastVisits = hints.lastVisits.map((v) => {
    const svc = serviceById.get(v.serviceId);
    const fillHint = svc
      ? publicServiceFillHint(
          {
            serviceKind: (svc.serviceKind as BeautyServiceKind | null) ?? null,
            rebookIntervalDays: svc.rebookIntervalDays,
            category: svc.category,
            requiresPatchTest: svc.requiresPatchTest,
            name: svc.name,
          },
          v.at,
        )
      : null;
    return { ...v, fillHint };
  });

  return {
    recognized: true as const,
    patchTestValid: isPatchTestValid(customer.patchTestCompletedAt),
    patchTestCompletedAt: customer.patchTestCompletedAt
      ? new Date(customer.patchTestCompletedAt).toISOString()
      : null,
    lastVisits,
  };
}

export async function getPublicBeautyGuestHints(
  businessId: string,
  customerId?: string | null,
) {
  if (!customerId) return { lastVisits: [] as Array<{ serviceId: string; at: string }> };
  const rows = await db
    .select({
      serviceId: bookingsTable.serviceId,
      endAt: bookingsTable.endAt,
    })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.customerId, customerId),
        eq(bookingsTable.status, "COMPLETED"),
      ),
    )
    .orderBy(desc(bookingsTable.endAt))
    .limit(20);

  const seen = new Set<string>();
  const lastVisits: Array<{ serviceId: string; at: string }> = [];
  for (const r of rows) {
    if (seen.has(r.serviceId)) continue;
    seen.add(r.serviceId);
    lastVisits.push({ serviceId: r.serviceId, at: (r.endAt ?? new Date()).toISOString() });
  }
  return { lastVisits };
}

export function patchTestBlockedForService(service: {
  requiresPatchTest?: boolean | null;
  serviceKind?: string | null;
  category?: string | null;
}) {
  return serviceRequiresPatchTest({
    requiresPatchTest: service.requiresPatchTest ?? undefined,
    serviceKind: (service.serviceKind as BeautyServiceKind | null) ?? null,
    category: service.category,
  });
}

export { isPatchTestValid };
