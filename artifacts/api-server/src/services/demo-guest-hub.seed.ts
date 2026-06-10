import { and, eq, gte, inArray, like, or } from "drizzle-orm";
import {
  db,
  bookingsTable,
  businessesTable,
  customersTable,
  guestIdentitiesTable,
  packageCreditLedgerTable,
  servicesTable,
  staffTable,
} from "@workspace/db";
import {
  DEMO_END_CLIENTS,
  guestHubDemoBookingNote,
  normalizePhoneE164,
  type DemoEndClient,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { createCustomer } from "./customers.service";
import { linkGuestToShop } from "./guest-hub.service";
import { grantPackageCredits } from "./package-credits.service";

/** @deprecated use DEMO_END_CLIENTS[0].phoneE164 */
export const DEMO_GUEST_PHONE_E164 = DEMO_END_CLIENTS[0]!.phoneE164;

/** @deprecated use DEMO_END_CLIENTS[0].linkedSlugs */
export const DEMO_GUEST_SHOWCASE_SLUGS = DEMO_END_CLIENTS[0]!.linkedSlugs;

async function ensureDemoGuestIdentity(phoneE164: string): Promise<string> {
  const [existing] = await db
    .select({ id: guestIdentitiesTable.id })
    .from(guestIdentitiesTable)
    .where(eq(guestIdentitiesTable.phoneE164, phoneE164))
    .limit(1);
  if (existing) return existing.id;
  const guestId = generateId();
  await db.insert(guestIdentitiesTable).values({
    id: guestId,
    phoneE164,
    verifiedAt: new Date(),
  });
  return guestId;
}

async function ensureGuestCustomer(businessId: string, client: DemoEndClient): Promise<string> {
  const rows = await db
    .select({
      id: customersTable.id,
      phone: customersTable.phone,
      firstName: customersTable.firstName,
      lastName: customersTable.lastName,
    })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId));

  const byPhone = rows.find((r) => normalizePhoneE164(r.phone) === client.phoneE164);
  if (byPhone) {
    if (byPhone.phone !== client.phoneE164) {
      await db
        .update(customersTable)
        .set({ phone: client.phoneE164 })
        .where(eq(customersTable.id, byPhone.id));
    }
    return byPhone.id;
  }

  const byName = rows.find(
    (r) =>
      r.firstName?.toLowerCase() === client.firstName.toLowerCase() &&
      r.lastName?.toLowerCase() === client.lastName.toLowerCase(),
  );
  if (byName) {
    await db
      .update(customersTable)
      .set({
        phone: client.phoneE164,
        firstName: client.firstName,
        lastName: client.lastName,
        displayName: client.displayName,
        email: client.email,
      })
      .where(eq(customersTable.id, byName.id));
    return byName.id;
  }

  const created = await createCustomer(businessId, {
    firstName: client.firstName,
    lastName: client.lastName,
    displayName: client.displayName,
    email: client.email,
    phone: client.phoneE164,
  });
  return created.id;
}

function bookingWindow(daysAhead: number): { startAt: Date; endAt: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + daysAhead);
  start.setHours(10 + (daysAhead % 3), 30, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 60);
  return { startAt: start, endAt: end };
}

async function cancelGuestFutureBookings(
  businessId: string,
  customerId: string,
  noteMarker: string,
  keepId?: string,
): Promise<number> {
  const now = new Date();
  const rows = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.customerId, customerId),
        gte(bookingsTable.startAt, now),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
      ),
    );

  let cancelled = 0;
  for (const row of rows) {
    if (keepId && row.id === keepId) continue;
    await db
      .update(bookingsTable)
      .set({
        status: "CANCELLED",
        cancellationReason: "demo-guest-hub-reconcile",
      })
      .where(eq(bookingsTable.id, row.id));
    cancelled += 1;
  }
  return cancelled;
}

async function upsertGuestHubBooking(
  businessId: string,
  customerId: string,
  daysAhead: number,
  note: string,
): Promise<string | null> {
  const [staff] = await db
    .select({ id: staffTable.id })
    .from(staffTable)
    .where(eq(staffTable.businessId, businessId))
    .limit(1);
  const [service] = await db
    .select({ id: servicesTable.id })
    .from(servicesTable)
    .where(eq(servicesTable.businessId, businessId))
    .limit(1);
  if (!staff || !service) return null;

  const { startAt, endAt } = bookingWindow(daysAhead);
  const now = new Date();

  const [seeded] = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.customerId, customerId),
        or(
          like(bookingsTable.notes, `%Demo guest hub%`),
          eq(bookingsTable.notes, note),
        ),
        gte(bookingsTable.startAt, now),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
      ),
    )
    .limit(1);

  if (seeded) {
    await db
      .update(bookingsTable)
      .set({
        startAt,
        endAt,
        status: "CONFIRMED",
        notes: note,
        cancellationReason: null,
      })
      .where(eq(bookingsTable.id, seeded.id));
    await cancelGuestFutureBookings(businessId, customerId, note, seeded.id);
    return seeded.id;
  }

  await cancelGuestFutureBookings(businessId, customerId, note);
  const id = generateId();
  await db.insert(bookingsTable).values({
    id,
    businessId,
    customerId,
    staffId: staff.id,
    serviceId: service.id,
    status: "CONFIRMED",
    startAt,
    endAt,
    notes: note,
  });
  return id;
}

async function ensureGuestPackageCredit(
  businessId: string,
  customerId: string,
  client: DemoEndClient,
): Promise<void> {
  const { listPackageCredits } = await import("./package-credits.service");
  const existing = await listPackageCredits(businessId, customerId);
  if (existing.some((r) => r.creditsRemaining > 0)) return;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 6);
  const code = `${client.id.toUpperCase()}-DEMO6`;
  const row = await grantPackageCredits(businessId, {
    customerId,
    packageName:
      client.id === "orla" ? "Serenity Series — 6 sessions" : "Calm Series — 6 sessions",
    creditsTotal: 6,
    expiresAt: expires.toISOString(),
    redemptionCode: code,
  });
  if (row) {
    await db
      .update(packageCreditLedgerTable)
      .set({ creditsRemaining: 4 })
      .where(eq(packageCreditLedgerTable.id, row.id));
  }
}

async function seedEndClient(client: DemoEndClient): Promise<{
  guestId: string;
  shopsLinked: number;
  upcomingEnsured: number;
}> {
  const guestId = await ensureDemoGuestIdentity(client.phoneE164);
  let shopsLinked = 0;
  let upcomingEnsured = 0;
  const linkedAt = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const note = guestHubDemoBookingNote(client.displayName);

  for (const slug of client.linkedSlugs) {
    const [biz] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.slug, slug))
      .limit(1);
    if (!biz) continue;

    await linkGuestToShop(guestId, biz.id, linkedAt);
    shopsLinked += 1;

    const customerId = await ensureGuestCustomer(biz.id, client);

    if (client.packageCreditSlugs?.includes(slug)) {
      await ensureGuestPackageCredit(biz.id, customerId, client);
    }

    const daysAhead = client.upcomingDaysBySlug[slug];
    if (daysAhead != null) {
      const id = await upsertGuestHubBooking(biz.id, customerId, daysAhead, note);
      if (id) upcomingEnsured += 1;
    } else {
      await cancelGuestFutureBookings(biz.id, customerId, note);
    }
  }

  return { guestId, shopsLinked, upcomingEnsured };
}

/**
 * Link three demo end clients to their real-life shop graph + curated upcoming visits.
 * Idempotent — reconciles operator live-day noise so `/my` stays realistic.
 */
export async function seedDemoGuestHub(): Promise<{
  clients: Array<{
    id: string;
    guestId: string;
    shopsLinked: number;
    upcomingEnsured: number;
  }>;
}> {
  const clients = [];
  for (const client of DEMO_END_CLIENTS) {
    const row = await seedEndClient(client);
    clients.push({ id: client.id, ...row });
  }
  return { clients };
}
