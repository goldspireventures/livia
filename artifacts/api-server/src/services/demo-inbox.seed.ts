import {
  db,
  bookingsTable,
  conversationsTable,
  conversationMessagesTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
import { generateId } from "../lib/id";
import {
  demoPendingBookingInboxThread,
  getDemoInboxThreadsForVertical,
  type DemoInboxThreadSpec,
} from "@workspace/policy";

type CustomerRow = { id: string; displayName: string; email: string; phone: string };

function ago(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

type InboxThread = DemoInboxThreadSpec;


function threadsForVertical(vertical?: string): InboxThread[] {
  return getDemoInboxThreadsForVertical(vertical);
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

/** Manager queue always has threads — copy matches business vertical when provided. */
export async function seedDemoInbox(
  businessId: string,
  customers: CustomerRow[],
  opts?: { pendingBookingNotes?: string; vertical?: string; bookingKeys?: Record<string, string> },
) {
  const threads: InboxThread[] = threadsForVertical(opts?.vertical).map((t) => ({
    ...t,
    phone: t.customerIdx != null ? (customers[t.customerIdx]?.phone ?? t.phone) : t.phone,
    email: t.customerIdx != null ? (customers[t.customerIdx]?.email ?? t.email) : t.email,
  }));

  if (opts?.pendingBookingNotes) {
    const pending = demoPendingBookingInboxThread(opts.pendingBookingNotes);
    threads.push({
      ...pending,
      phone: customers[2]?.phone ?? "",
      email: customers[2]?.email ?? "",
    });
  }

  for (const t of threads) {
    const cid = t.anonymous
      ? null
      : (customers.find((c) => c.email && t.email && c.email.toLowerCase() === t.email.toLowerCase())?.id ??
        customers[t.customerIdx ?? 0]?.id ??
        customers[0]?.id);
    const linkedBookingId =
      t.linkedBookingKey && opts?.bookingKeys?.[t.linkedBookingKey]
        ? opts.bookingKeys[t.linkedBookingKey]
        : null;
    const convId = generateId();
    const lastAt = ago(Math.min(...t.messages.map((m) => m.minsAgo)));
    await db.insert(conversationsTable).values({
      id: convId,
      businessId,
      customerId: cid,
      channel: t.channel,
      status: t.status,
      customerName: t.name,
      customerEmail: t.email,
      customerPhone: t.phone,
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
  customers: CustomerRow[],
  staffIds: string[],
  serviceIds: string[],
  base: Date,
  vertical?: string,
): Promise<Record<string, string>> {
  if (vertical === "event-vendors") return {};
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
    { ci: 2, si: 1, vi: 0, status: "COMPLETED", start: makeDt(-2, 11), end: new Date(makeDt(-2, 11).getTime() + 60 * 60_000) },
  ];
  await db.insert(bookingsTable).values(
    defs.map((b) => {
      const id = generateId();
      if (b.key) keys[b.key] = id;
      const serviceId =
        serviceIds[Math.min(b.vi, Math.max(0, serviceIds.length - 1))] ??
        serviceIds[0];
      return {
        id,
        businessId,
        customerId: customers[b.ci].id,
        staffId: staffIds[b.si],
        serviceId,
        status: b.status,
        startAt: b.start,
        endAt: b.end,
        notes: b.notes ?? null,
        channelType: "WEB" as const,
        depositPaidEurCents: b.key === "sean_today" ? 6000 : 0,
      };
    }),
  );
  return keys;
}
