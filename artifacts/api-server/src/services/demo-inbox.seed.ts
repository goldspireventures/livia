import {
  db,
  bookingsTable,
  conversationsTable,
  conversationMessagesTable,
  customersTable,
  staffTable,
  servicesTable,
} from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
import { generateId } from "../lib/id";
import {
  demoPendingBookingInboxThread,
  DEMO_INBOX_ANCHOR_CUSTOMERS,
  demoInboxThreadVertical,
  expectedMaryOpenInboxChannels,
  getDemoInboxThreadsForVertical,
  type DemoInboxThreadSpec,
} from "@workspace/policy";
import { createCustomer } from "./customers.service";

type CustomerRow = { id: string; displayName: string; email: string; phone: string };

function ago(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

type InboxThread = DemoInboxThreadSpec;


function threadsForVertical(vertical?: string): InboxThread[] {
  return getDemoInboxThreadsForVertical(demoInboxThreadVertical(vertical));
}

/** Policy anchor guests (Mary, Sean, …) — required for customerIdx + email linking. */
export async function ensureDemoInboxAnchorCustomers(
  businessId: string,
): Promise<CustomerRow[]> {
  const existing = await db
    .select({
      id: customersTable.id,
      displayName: customersTable.displayName,
      email: customersTable.email,
      phone: customersTable.phone,
    })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId));

  const byEmail = new Map(
    existing.map((c) => [
      (c.email ?? "").toLowerCase(),
      {
        id: c.id,
        displayName: c.displayName ?? "Guest",
        email: c.email ?? "",
        phone: c.phone ?? "",
      },
    ]),
  );

  for (const anchor of DEMO_INBOX_ANCHOR_CUSTOMERS) {
    const key = anchor.email.toLowerCase();
    if (byEmail.has(key)) continue;
    const created = await createCustomer(businessId, {
      firstName: anchor.firstName,
      lastName: anchor.lastName,
      displayName: `${anchor.firstName} ${anchor.lastName}`,
      email: anchor.email,
      phone: anchor.phone,
    });
    byEmail.set(key, {
      id: created.id,
      displayName: created.displayName ?? `${anchor.firstName} ${anchor.lastName}`,
      email: created.email ?? anchor.email,
      phone: created.phone ?? anchor.phone,
    });
  }

  const anchorOrder = DEMO_INBOX_ANCHOR_CUSTOMERS.map((a) => a.email.toLowerCase());
  return [...byEmail.values()].sort((a, b) => {
    const ai = anchorOrder.indexOf(a.email.toLowerCase());
    const bi = anchorOrder.indexOf(b.email.toLowerCase());
    if (ai === -1 && bi === -1) return a.displayName.localeCompare(b.displayName);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export async function demoInboxPolicySatisfied(
  businessId: string,
  vertical?: string,
): Promise<boolean> {
  const expectedMary = expectedMaryOpenInboxChannels(vertical);
  if (expectedMary < 2) return true;

  const maryOpen = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.customerName, "Mary McNamara"),
        sql`${conversationsTable.status} IN ('OPEN', 'HANDED_OFF')`,
      ),
    );

  return maryOpen.length >= expectedMary;
}

/** Idempotent — re-seed when policy Mary threads are missing or mis-linked. */
export async function ensureMessagingInboxFromPolicy(
  businessId: string,
  vertical?: string,
): Promise<boolean> {
  const customers = await ensureDemoInboxAnchorCustomers(businessId);
  if (await demoInboxPolicySatisfied(businessId, vertical)) {
    await ensureDemoAnchorGuestDepth(businessId);
    return false;
  }
  await resyncMessagingDemoInbox(businessId, customers, vertical);
  await ensureDemoAnchorGuestDepth(businessId);
  return true;
}

/** Consult-first demos — replace salon inbox/bookings with enquiry-appropriate threads. */
export async function resyncConsultFirstDemoInbox(
  businessId: string,
  customers: CustomerRow[],
  vertical?: string,
) {
  if (vertical !== "event-vendors") return;

  const convRows = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(eq(conversationsTable.businessId, businessId));
  const convIds = convRows.map((c) => c.id);
  if (convIds.length > 0) {
    await db
      .delete(conversationMessagesTable)
      .where(inArray(conversationMessagesTable.conversationId, convIds));
  }
  await db.delete(conversationsTable).where(eq(conversationsTable.businessId, businessId));
  await db.delete(bookingsTable).where(eq(bookingsTable.businessId, businessId));
  await seedDemoInbox(businessId, customers, { vertical, bookingKeys: {} });
}

async function resolveDemoInboxBookingKeys(businessId: string): Promise<Record<string, string>> {
  const rows = await db
    .select({
      id: bookingsTable.id,
      notes: bookingsTable.notes,
      status: bookingsTable.status,
    })
    .from(bookingsTable)
    .where(eq(bookingsTable.businessId, businessId));

  const pickKey = (row: { id: string; status: string }, current?: string) => {
    if (!current) return row.id;
    const active = row.status === "CONFIRMED" || row.status === "PENDING";
    return active ? row.id : current;
  };

  const keys: Record<string, string> = {};
  for (const row of rows) {
    const notes = row.notes ?? "";
    if (notes.includes("Balayage — rescheduled")) {
      keys.mary_balayage = pickKey(row, keys.mary_balayage);
    }
    if (notes.includes("Deposit €60")) {
      keys.sean_today = pickKey(row, keys.sean_today);
    }
    if (notes.includes("Balance due at visit")) {
      keys.balance_due = pickKey(row, keys.balance_due);
    }
  }
  return keys;
}

function customerForAnchorIdx(customers: CustomerRow[], ci: number): CustomerRow {
  const anchor = DEMO_INBOX_ANCHOR_CUSTOMERS[ci];
  if (anchor) {
    const hit = customers.find((c) => c.email.toLowerCase() === anchor.email.toLowerCase());
    if (hit) return hit;
  }
  return customers[Math.min(ci, Math.max(0, customers.length - 1))]!;
}

/** Refresh inbox threads from policy — keeps bookings, replaces conversations. */
export async function resyncMessagingDemoInbox(
  businessId: string,
  customers: CustomerRow[],
  vertical?: string,
) {
  if (vertical === "event-vendors") {
    await resyncConsultFirstDemoInbox(businessId, customers, vertical);
    return;
  }

  const linkedCustomers = await ensureDemoInboxAnchorCustomers(businessId);
  const customerByEmail = new Map(
    linkedCustomers.map((c) => [(c.email ?? "").toLowerCase(), c] as const),
  );
  for (const c of customers) {
    const key = (c.email ?? "").toLowerCase();
    if (key && !customerByEmail.has(key)) customerByEmail.set(key, c);
  }
  const mergedCustomers = [...customerByEmail.values()];

  const bookingKeys = await resolveDemoInboxBookingKeys(businessId);
  const convRows = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(eq(conversationsTable.businessId, businessId));
  const convIds = convRows.map((c) => c.id);
  if (convIds.length > 0) {
    await db
      .delete(conversationMessagesTable)
      .where(inArray(conversationMessagesTable.conversationId, convIds));
  }
  await db.delete(conversationsTable).where(eq(conversationsTable.businessId, businessId));
  await seedDemoInbox(businessId, mergedCustomers, {
    vertical: demoInboxThreadVertical(vertical),
    bookingKeys,
  });
}

/** Manager queue always has threads — copy matches business vertical when provided. */
export async function seedDemoInbox(
  businessId: string,
  customers: CustomerRow[],
  opts?: { pendingBookingNotes?: string; vertical?: string; bookingKeys?: Record<string, string> },
) {
  const linkedCustomers = await ensureDemoInboxAnchorCustomers(businessId);
  const customerByEmail = new Map(
    linkedCustomers.map((c) => [(c.email ?? "").toLowerCase(), c] as const),
  );
  for (const c of customers) {
    const key = (c.email ?? "").toLowerCase();
    if (key && !customerByEmail.has(key)) customerByEmail.set(key, c);
  }
  const mergedCustomers = [...customerByEmail.values()].sort((a, b) => {
    const anchorOrder = DEMO_INBOX_ANCHOR_CUSTOMERS.map((x) => x.email.toLowerCase());
    const ai = anchorOrder.indexOf(a.email.toLowerCase());
    const bi = anchorOrder.indexOf(b.email.toLowerCase());
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const threads: InboxThread[] = threadsForVertical(opts?.vertical).map((t) => ({
    ...t,
    phone: t.customerIdx != null ? (mergedCustomers[t.customerIdx]?.phone ?? t.phone) : t.phone,
    email: t.customerIdx != null ? (mergedCustomers[t.customerIdx]?.email ?? t.email) : t.email,
  }));

  if (opts?.pendingBookingNotes) {
    const pending = demoPendingBookingInboxThread(opts.pendingBookingNotes);
    threads.push({
      ...pending,
      phone: mergedCustomers[2]?.phone ?? "",
      email: mergedCustomers[2]?.email ?? "",
    });
  }

  for (const t of threads) {
    const cid = t.anonymous
      ? null
      : (mergedCustomers.find((c) => c.email && t.email && c.email.toLowerCase() === t.email.toLowerCase())?.id ??
        mergedCustomers[t.customerIdx ?? 0]?.id ??
        mergedCustomers[0]?.id);
    const linkedBookingId =
      t.linkedBookingKey && opts?.bookingKeys?.[t.linkedBookingKey]
        ? opts.bookingKeys[t.linkedBookingKey]
        : null;
    const guest =
      cid != null ? mergedCustomers.find((c) => c.id === cid) ?? null : null;
    const convId = generateId();
    const lastAt = ago(Math.min(...t.messages.map((m) => m.minsAgo)));
    await db.insert(conversationsTable).values({
      id: convId,
      businessId,
      customerId: cid,
      channel: t.channel,
      status: t.status,
      customerName: guest?.displayName ?? t.name,
      customerEmail: guest?.email ?? t.email,
      customerPhone: guest?.phone ?? t.phone,
      aiHandled: t.aiHandled,
      summary: t.summary,
      linkedBookingId,
      caseIntent: t.caseIntent ?? null,
      lastMessageAt: lastAt,
    });
    for (const m of t.messages) {
      await db.insert(conversationMessagesTable).values({
        id: generateId(),
        conversationId: convId,
        role: m.role,
        content: m.content,
        bookingId: linkedBookingId,
        createdAt: ago(m.minsAgo),
      });
    }
  }
}

function nextWeekdayAt(base: Date, weekday: number, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  let delta = (weekday - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() <= base.getTime()) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

export async function seedExpandedBookings(
  businessId: string,
  _customers: CustomerRow[],
  staffIds: string[],
  serviceIds: string[],
  base: Date,
  vertical?: string,
): Promise<Record<string, string>> {
  if (vertical === "event-vendors") return {};
  const customers = await ensureDemoInboxAnchorCustomers(businessId);
  const keys: Record<string, string> = {};
  const makeDt = (daysOffset: number, hour: number) => {
    const t = new Date(base);
    t.setDate(t.getDate() + daysOffset);
    t.setHours(hour, 0, 0, 0);
    return t;
  };
  const maryTuesday = nextWeekdayAt(base, 2, 14);
  const maryTuesdayEnd = new Date(maryTuesday.getTime() + 150 * 60_000);
  const defs: Array<{
    key?: string;
    ci: number;
    si: number;
    vi: number;
    status: BookingStatus;
    start: Date;
    end: Date;
    notes?: string;
  }> = [
    {
      key: "mary_pending",
      ci: 0,
      si: 0,
      vi: 0,
      status: "PENDING",
      start: makeDt(0, 16),
      end: new Date(makeDt(0, 16).getTime() + 60 * 60_000),
      notes: "Colour consult — manager to confirm",
    },
    {
      key: "sean_today",
      ci: 1,
      si: 1,
      vi: 1,
      status: "CONFIRMED",
      start: makeDt(0, 11),
      end: new Date(makeDt(0, 11).getTime() + 60 * 60_000),
      notes: "Deposit €60 — Sean requested late cancel",
    },
    {
      key: "balance_due",
      ci: 1,
      si: 1,
      vi: 2,
      status: "CONFIRMED",
      start: makeDt(0, 14),
      end: new Date(makeDt(0, 14).getTime() + 120 * 60_000),
      notes: "Balance due at visit — demo E2E",
    },
    {
      key: "mary_balayage",
      ci: 0,
      si: 0,
      vi: 2,
      status: "CONFIRMED",
      start: maryTuesday,
      end: maryTuesdayEnd,
      notes: "Balayage — rescheduled to Tuesday 2pm via Liv",
    },
    { ci: 2, si: 0, vi: 0, status: "CONFIRMED", start: makeDt(1, 9), end: new Date(makeDt(1, 9).getTime() + 60 * 60_000) },
    { ci: 3, si: 1, vi: 0, status: "PENDING", start: makeDt(1, 15), end: new Date(makeDt(1, 15).getTime() + 60 * 60_000) },
    { ci: 0, si: 0, vi: 1, status: "CONFIRMED", start: makeDt(2, 10), end: new Date(makeDt(2, 10).getTime() + 60 * 60_000) },
    { ci: 1, si: 0, vi: 0, status: "COMPLETED", start: makeDt(-1, 14), end: new Date(makeDt(-1, 14).getTime() + 60 * 60_000) },
    {
      ci: 0,
      si: 0,
      vi: 2,
      status: "COMPLETED",
      start: makeDt(-21, 10),
      end: new Date(makeDt(-21, 10).getTime() + 150 * 60_000),
      notes: "Balayage — previous visit",
    },
    { ci: 2, si: 1, vi: 0, status: "COMPLETED", start: makeDt(-2, 11), end: new Date(makeDt(-2, 11).getTime() + 60 * 60_000) },
  ];
  await db.insert(bookingsTable).values(
    defs.map((b) => {
      const id = generateId();
      if (b.key) keys[b.key] = id;
      const serviceId =
        serviceIds[Math.min(b.vi, Math.max(0, serviceIds.length - 1))] ??
        serviceIds[0];
      const customer = customerForAnchorIdx(customers, b.ci);
      const staffId = staffIds[Math.min(b.si, Math.max(0, staffIds.length - 1))];
      if (!customer?.id || !staffId || !serviceId) {
        throw new Error(
          `seedExpandedBookings missing refs (ci=${b.ci}, customers=${customers.length}, staff=${staffIds.length})`,
        );
      }
      return {
        id,
        businessId,
        customerId: customer.id,
        staffId,
        serviceId,
        status: b.status,
        startAt: b.start,
        endAt: b.end,
        notes: b.notes ?? null,
        channelType: "WEB" as const,
        depositPaidEurCents:
          b.key === "sean_today" || b.key === "balance_due" ? 6000 : 0,
        totalPaidEurCents:
          b.key === "sean_today" || b.key === "balance_due" ? 6000 : 0,
      };
    }),
  );
  const { ensureBookingGuestAccess } = await import("./booking-guest-access.service");
  for (const id of Object.values(keys)) {
    await ensureBookingGuestAccess(businessId, id);
  }
  return keys;
}

/** Repair Mary anchor depth — visit history, confirmed balayage link, customer ids on threads. */
export async function ensureDemoAnchorGuestDepth(businessId: string): Promise<void> {
  const anchors = await ensureDemoInboxAnchorCustomers(businessId);
  const mary = anchors.find((c) => c.email.toLowerCase() === "mary.m@email.ie");
  if (!mary) return;

  await db
    .update(conversationsTable)
    .set({
      customerId: mary.id,
      customerName: mary.displayName,
      customerEmail: mary.email,
      customerPhone: mary.phone,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.customerName, "Mary McNamara"),
      ),
    );

  const now = new Date();
  const [maryCompleted] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.customerId, mary.id),
        eq(bookingsTable.status, "COMPLETED"),
      ),
    );

  if ((maryCompleted?.count ?? 0) === 0) {
    const staffRows = await db
      .select({ id: staffTable.id })
      .from(staffTable)
      .where(eq(staffTable.businessId, businessId))
      .limit(1);
    const serviceRows = await db
      .select({ id: servicesTable.id })
      .from(servicesTable)
      .where(eq(servicesTable.businessId, businessId))
      .limit(3);
    const staffId = staffRows[0]?.id;
    const serviceId = serviceRows[2]?.id ?? serviceRows[0]?.id;
    if (staffId && serviceId) {
      const start = new Date(now);
      start.setDate(start.getDate() - 21);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start.getTime() + 150 * 60_000);
      await db.insert(bookingsTable).values({
        id: generateId(),
        businessId,
        customerId: mary.id,
        staffId,
        serviceId,
        status: "COMPLETED",
        startAt: start,
        endAt: end,
        notes: "Balayage — previous visit",
        channelType: "WEB",
      });
    }
  }

  const bookingKeys = await resolveDemoInboxBookingKeys(businessId);
  const balayageId = bookingKeys.mary_balayage;
  if (balayageId) {
    const [balayage] = await db
      .select({
        id: bookingsTable.id,
        status: bookingsTable.status,
        startAt: bookingsTable.startAt,
      })
      .from(bookingsTable)
      .where(eq(bookingsTable.id, balayageId))
      .limit(1);
    if (balayage?.status === "CANCELLED" || balayage?.status === "NO_SHOW") {
      const start = nextWeekdayAt(now, 2, 14);
      const end = new Date(start.getTime() + 150 * 60_000);
      await db
        .update(bookingsTable)
        .set({
          status: "CONFIRMED",
          customerId: mary.id,
          startAt: start,
          endAt: end,
          updatedAt: new Date(),
        })
        .where(eq(bookingsTable.id, balayageId));
    } else if (balayage && balayage.startAt < now) {
      const start = nextWeekdayAt(now, 2, 14);
      const end = new Date(start.getTime() + 150 * 60_000);
      await db
        .update(bookingsTable)
        .set({ startAt: start, endAt: end, updatedAt: new Date() })
        .where(eq(bookingsTable.id, balayageId));
    }

    await db
      .update(conversationsTable)
      .set({ linkedBookingId: balayageId, updatedAt: new Date() })
      .where(
        and(
          eq(conversationsTable.businessId, businessId),
          eq(conversationsTable.customerId, mary.id),
          eq(conversationsTable.channel, "SMS"),
        ),
      );
  }

  try {
    const { appendLivMemory } = await import("./liv-memory.service");
    await appendLivMemory({
      businessId,
      entityType: "customer",
      entityId: mary.id,
      kind: "preference",
      content: "Mary — prefers senior stylist Lara for colour; sulphate-free aftercare noted.",
      createdBy: "liv",
      ttlDays: 365,
    });
  } catch {
    /* idempotent — memory may already exist */
  }

  const { ensureDemoGuestBalanceSurface } = await import("./demo-showcase-depth");
  await ensureDemoGuestBalanceSurface(businessId);
}
