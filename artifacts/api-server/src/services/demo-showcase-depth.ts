import { and, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import {
  db,
  businessesTable,
  bookingsTable,
  customersTable,
  staffTable,
  servicesTable,
  staffServicesTable,
  conversationsTable,
  enquiriesTable,
  quotesTable,
  petsTable,
  medicalIntakeRecordsTable,
  slotWaitlistEntriesTable,
} from "@workspace/db";
import { createStaff } from "./staff.service";
import { createService } from "./services.service";
import { createCustomer } from "./customers.service";
import { createPet } from "./pets.service";
import { resyncConsultFirstDemoInbox, seedExpandedBookings, seedDemoInbox } from "./demo-inbox.seed";
import { ensureLiveDayForBusiness } from "./demo-live-day.service";
import { ensureWellnessShowcaseDepth } from "./wellness-demo-depth";
import { ensureDemoOperationalCases } from "./demo-operational-cases.seed";
import { applyDemoPublicBranding } from "../lib/demo-public-assets";
import { backfillDemoServiceImages } from "../lib/demo-service-images";
import { inferDemoServiceImageUrl } from "../lib/experience-skin";
import { consultFirstDemoCustomerCap, isConsultFirstVertical, type BusinessVertical } from "@workspace/policy";
import { ensureDefaultLivOutboundOverrides } from "./liv-outbound.service";

type StaffDef = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  color: string;
};

type ServiceDef = {
  name: string;
  durationMinutes: number;
  priceMinor: number;
  sortOrder: number;
  category?: string;
  description?: string;
  imageUrl?: string;
};

type CustomerSeed = { id: string; displayName: string; email: string; phone: string };

const EXTRA_CUSTOMER_NAMES: Array<{ first: string; last: string }> = [
  { first: "Kate", last: "Ryan" },
  { first: "Liam", last: "O'Sullivan" },
  { first: "Aoife", last: "Doyle" },
  { first: "Niamh", last: "Brennan" },
  { first: "Cian", last: "Walsh" },
  { first: "Emma", last: "Byrne" },
  { first: "Jack", last: "Foley" },
  { first: "Saoirse", last: "Dunne" },
  { first: "Darragh", last: "Healy" },
  { first: "Claire", last: "Moran" },
  { first: "Tom", last: "Quinn" },
  { first: "Grace", last: "Power" },
  { first: "Ben", last: "Hayes" },
  { first: "Laura", last: "Keane" },
  { first: "Paul", last: "Flynn" },
  { first: "Sarah", last: "Maher" },
];

export async function ensureShowcaseStaff(businessId: string, staffDefs: StaffDef[]) {
  const existing = await db
    .select()
    .from(staffTable)
    .where(eq(staffTable.businessId, businessId));
  const byEmail = new Map(existing.map((s) => [s.email?.toLowerCase(), s]));
  const rows = [...existing];
  for (const def of staffDefs) {
    const hit = byEmail.get(def.email.toLowerCase());
    if (hit) continue;
    const created = await createStaff(businessId, {
      firstName: def.firstName,
      lastName: def.lastName,
      displayName: def.displayName,
      email: def.email,
      color: def.color,
    });
    rows.push(created);
    byEmail.set(def.email.toLowerCase(), created);
  }
  return rows;
}

export async function ensureShowcaseServices(
  businessId: string,
  serviceDefs: ServiceDef[],
  vertical?: BusinessVertical,
) {
  const existing = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.businessId, businessId));
  const byName = new Map(existing.map((s) => [s.name.toLowerCase(), s]));
  const rows = [...existing];
  for (const def of serviceDefs) {
    const hit = byName.get(def.name.toLowerCase());
    if (hit) continue;
    const created = await createService(businessId, {
      name: def.name,
      description: def.description,
      category: def.category,
      durationMinutes: def.durationMinutes,
      priceMinor: def.priceMinor,
      currency: "EUR",
      sortOrder: def.sortOrder,
      imageUrl:
        def.imageUrl ?? inferDemoServiceImageUrl(def.name, vertical ?? undefined),
    });
    rows.push(created);
    byName.set(def.name.toLowerCase(), created);
  }
  await backfillDemoServiceImages(businessId, vertical);
  return rows;
}

async function linkStaffToAllServices(businessId: string, staffIds: string[], serviceIds: string[]) {
  if (!staffIds.length || !serviceIds.length) return;
  const existing = await db
    .select({ staffId: staffServicesTable.staffId, serviceId: staffServicesTable.serviceId })
    .from(staffServicesTable)
    .innerJoin(staffTable, eq(staffServicesTable.staffId, staffTable.id))
    .where(eq(staffTable.businessId, businessId));
  const linked = new Set(existing.map((r) => `${r.staffId}:${r.serviceId}`));
  const toInsert = staffIds.flatMap((staffId) =>
    serviceIds
      .filter((serviceId) => !linked.has(`${staffId}:${serviceId}`))
      .map((serviceId) => ({ staffId, serviceId })),
  );
  if (toInsert.length) {
    await db.insert(staffServicesTable).values(toInsert);
  }
}

export async function ensureShowcaseCustomers(businessId: string, minimum = 20): Promise<CustomerSeed[]> {
  const existing = await db
    .select({
      id: customersTable.id,
      displayName: customersTable.displayName,
      firstName: customersTable.firstName,
      lastName: customersTable.lastName,
      email: customersTable.email,
      phone: customersTable.phone,
    })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId));

  const rows: CustomerSeed[] = existing.map((c) => ({
    id: c.id,
    displayName: c.displayName ?? (`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Guest"),
    email: c.email ?? "",
    phone: c.phone ?? "",
  }));

  let idx = 0;
  while (rows.length < minimum && idx < EXTRA_CUSTOMER_NAMES.length) {
    const { first, last } = EXTRA_CUSTOMER_NAMES[idx]!;
    idx += 1;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@demo.livia.io`;
    if (rows.some((r) => r.email === email)) continue;
    const created = await createCustomer(businessId, {
      firstName: first,
      lastName: last,
      displayName: `${first} ${last}`,
      email,
      phone: `+353 87 200 ${String(1000 + rows.length).slice(-4)}`,
    });
    rows.push({
      id: created.id,
      displayName: created.displayName ?? `${first} ${last}`,
      email: created.email ?? email,
      phone: created.phone ?? "",
    });
  }
  return rows;
}

/** Consult-first demos keep enquirers tied to pipeline — not 20+ salon-style guests. */
export async function pruneConsultFirstDemoCustomers(businessId: string): Promise<number> {
  const keep = new Set<string>();
  const enquiryRows = await db
    .select({ customerId: enquiriesTable.customerId })
    .from(enquiriesTable)
    .where(eq(enquiriesTable.businessId, businessId));
  const quoteRows = await db
    .select({ customerId: quotesTable.customerId })
    .from(quotesTable)
    .where(eq(quotesTable.businessId, businessId));
  const convoRows = await db
    .select({ customerId: conversationsTable.customerId })
    .from(conversationsTable)
    .where(eq(conversationsTable.businessId, businessId));
  for (const row of [...enquiryRows, ...quoteRows, ...convoRows]) {
    if (row.customerId) keep.add(row.customerId);
  }

  const all = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId));
  const toDelete = all.filter((c) => !keep.has(c.id)).map((c) => c.id);
  if (!toDelete.length) return 0;
  await db
    .delete(customersTable)
    .where(and(eq(customersTable.businessId, businessId), inArray(customersTable.id, toDelete)));
  return toDelete.length;
}

export async function ensureShowcasePets(
  businessId: string,
  customerIds: string[],
  pets: Array<{ name: string; breed: string; species?: "dog" | "cat"; customerIndex?: number }>,
) {
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(petsTable)
    .where(eq(petsTable.businessId, businessId));
  if ((countRow?.count ?? 0) >= pets.length) return;

  for (let i = 0; i < pets.length; i += 1) {
    const pet = pets[i]!;
    const customerId = customerIds[pet.customerIndex ?? i] ?? customerIds[0];
    if (!customerId) continue;
    const [existing] = await db
      .select({ id: petsTable.id })
      .from(petsTable)
      .where(and(eq(petsTable.businessId, businessId), eq(petsTable.name, pet.name)))
      .limit(1);
    if (existing) continue;
    await createPet(businessId, customerId, {
      name: pet.name,
      breed: pet.breed,
      species: pet.species ?? "dog",
      behaviourNotes: "Demo pet profile",
    });
  }
}

/** Idempotent refresh for existing showcase shops — live day, depth, inbox only when empty. */
export async function refreshVerticalShowcaseShop(
  businessId: string,
  d: {
    vertical: BusinessVertical;
    slug: string;
    staff: StaffDef[];
    services: ServiceDef[];
    seedPets?: Array<{ name: string; breed: string; species?: "dog" | "cat"; customerIndex?: number }>;
  },
): Promise<void> {
  await applyDemoPublicBranding(businessId, d.vertical);
  await ensureDefaultLivOutboundOverrides(businessId, d.vertical);
  await backfillDemoServiceImages(businessId, d.vertical, { force: true });

  const staffRows = await ensureShowcaseStaff(businessId, d.staff);
  const serviceRows = await ensureShowcaseServices(businessId, d.services, d.vertical);
  const customerMinimum = isConsultFirstVertical(d.vertical)
    ? consultFirstDemoCustomerCap()
    : 20;
  const customers = await ensureShowcaseCustomers(businessId, customerMinimum);
  await linkStaffToAllServices(
    businessId,
    staffRows.map((s) => s.id),
    serviceRows.map((s) => s.id),
  );

  if (d.seedPets?.length) {
    await ensureShowcasePets(
      businessId,
      customers.map((c) => c.id),
      d.seedPets,
    );
  }

  const [inboxCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversationsTable)
    .where(eq(conversationsTable.businessId, businessId));

  const staffIds = staffRows.map((s) => s.id);
  const serviceIds = serviceRows.map((s) => s.id);
  const now = new Date();

  const consultFirst = isConsultFirstVertical(d.vertical);
  let bookingKeys: Record<string, string> = {};
  if ((inboxCount?.count ?? 0) === 0) {
    if (!consultFirst) {
      bookingKeys = await seedExpandedBookings(
        businessId,
        customers,
        staffIds,
        serviceIds,
        now,
        d.vertical,
      );
    }
    await seedDemoInbox(businessId, customers, {
      vertical: d.vertical,
      bookingKeys,
      ...(consultFirst ? {} : { pendingBookingNotes: "Liv created — confirm when ready" }),
    });
    if (!consultFirst) {
      await ensureDemoOperationalCases(businessId, d.slug, bookingKeys);
    }
  }

  await ensureLiveDayForBusiness(businessId, {
    force: false,
    customerSeed: customers,
    staffIds,
    serviceIds,
    seedInbox: false,
    vertical: d.vertical,
  });

  if (d.vertical === "wellness") {
    await ensureWellnessShowcaseDepth(businessId);
  }

  if (d.vertical === "event-vendors") {
    await pruneConsultFirstDemoCustomers(businessId);
    const slimCustomers = await db
      .select({
        id: customersTable.id,
        displayName: customersTable.displayName,
        firstName: customersTable.firstName,
        lastName: customersTable.lastName,
        email: customersTable.email,
        phone: customersTable.phone,
      })
      .from(customersTable)
      .where(eq(customersTable.businessId, businessId));
    await resyncConsultFirstDemoInbox(
      businessId,
      slimCustomers.map((c) => ({
        id: c.id,
        displayName: c.displayName ?? (`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Guest"),
        email: c.email ?? "",
        phone: c.phone ?? "",
      })),
      d.vertical,
    );
  }
}

export async function getDemoGuestProofToken(slug: string): Promise<string | null> {
  const [biz] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz) return null;

  const { listDesignProofs } = await import("./design-proofs.service");
  const { ensureDesignProofGuestAccess } = await import("./design-proof-guest-access.service");
  const pending = await listDesignProofs(biz.id, "pending_review");
  const proof = pending[0];
  if (!proof) return null;
  return ensureDesignProofGuestAccess(biz.id, proof.id);
}

export async function getDemoGuestIntakeToken(slug: string): Promise<string | null> {
  const [biz] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz) return null;

  const [draft] = await db
    .select({ id: medicalIntakeRecordsTable.id })
    .from(medicalIntakeRecordsTable)
    .where(
      and(
        eq(medicalIntakeRecordsTable.businessId, biz.id),
        eq(medicalIntakeRecordsTable.status, "draft"),
      ),
    )
    .limit(1);
  if (!draft) return null;

  const { ensureMedicalIntakeGuestAccess } = await import("./medical-intake-guest-access.service");
  return ensureMedicalIntakeGuestAccess(biz.id, draft.id);
}

/** Pending booking with deposit due — for guest pay E2E. */
export async function getDemoGuestPayToken(slug: string): Promise<string | null> {
  const [biz] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz) return null;

  const [booking] = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, biz.id),
        eq(bookingsTable.status, "PENDING"),
        sql`${bookingsTable.depositPaidEurCents} = 0`,
      ),
    )
    .orderBy(desc(bookingsTable.createdAt))
    .limit(1);
  if (!booking) return null;

  const { ensureBookingGuestAccess } = await import("./booking-guest-access.service");
  return ensureBookingGuestAccess(biz.id, booking.id);
}

/** Offered slot waitlist entry — fitness / medspa guest accept E2E. */
export async function ensureDemoGuestWaitlistOffer(businessId: string): Promise<string | null> {
  const now = new Date();
  const [existing] = await db
    .select({ offerToken: slotWaitlistEntriesTable.offerToken })
    .from(slotWaitlistEntriesTable)
    .where(
      and(
        eq(slotWaitlistEntriesTable.businessId, businessId),
        eq(slotWaitlistEntriesTable.status, "offered"),
        sql`${slotWaitlistEntriesTable.offerToken} IS NOT NULL`,
        or(
          isNull(slotWaitlistEntriesTable.expiresAt),
          gt(slotWaitlistEntriesTable.expiresAt, now),
        ),
      ),
    )
    .limit(1);
  if (existing?.offerToken) return existing.offerToken;

  const [customer] = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId))
    .limit(1);
  const [service] = await db
    .select({ id: servicesTable.id })
    .from(servicesTable)
    .where(eq(servicesTable.businessId, businessId))
    .limit(1);
  if (!customer || !service) return null;

  const [staff] = await db
    .select({ id: staffTable.id })
    .from(staffTable)
    .where(eq(staffTable.businessId, businessId))
    .limit(1);

  const start = new Date();
  start.setDate(start.getDate() + 3);
  start.setHours(10, 0, 0, 0);

  const { createBooking, cancelBookingWithReason } = await import("./bookings.service");
  const { joinSlotWaitlist, markWaitlistOffered } = await import("./waitlist.service");

  const booking = await createBooking(businessId, {
    serviceId: service.id,
    customerId: customer.id,
    staffId: staff?.id,
    startAt: start.toISOString(),
    channelType: "WEB",
    source: "web",
    notes: "Demo slot opened for waitlist accept",
  });
  await cancelBookingWithReason(businessId, booking.id, "Demo — slot offered to waitlist");

  const [activeEntry] = await db
    .select({ id: slotWaitlistEntriesTable.id })
    .from(slotWaitlistEntriesTable)
    .where(
      and(
        eq(slotWaitlistEntriesTable.businessId, businessId),
        eq(slotWaitlistEntriesTable.status, "active"),
        eq(slotWaitlistEntriesTable.customerId, customer.id),
      ),
    )
    .limit(1);

  const entryId =
    activeEntry?.id ??
    (
      await joinSlotWaitlist({
        businessId,
        serviceId: service.id,
        customerId: customer.id,
        notes: "Demo waitlist — guest accept link",
      })
    ).id;

  const offered = await markWaitlistOffered(entryId, booking.id);
  return offered?.offerToken ?? null;
}

export async function getDemoGuestWaitlistToken(slug: string): Promise<string | null> {
  const [biz] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);
  if (!biz) return null;
  return ensureDemoGuestWaitlistOffer(biz.id);
}
