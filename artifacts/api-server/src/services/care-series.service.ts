import { db, careSeriesTable, careSeriesSessionsTable, bookingsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { generateId } from "../lib/id";
import { createBooking } from "./bookings.service";

export async function listCareSeries(businessId: string, customerId?: string) {
  const conditions = [eq(careSeriesTable.businessId, businessId)];
  if (customerId) conditions.push(eq(careSeriesTable.customerId, customerId));
  const series = await db
    .select()
    .from(careSeriesTable)
    .where(and(...conditions))
    .orderBy(careSeriesTable.createdAt);

  const out = [];
  for (const s of series) {
    const sessions = await db
      .select()
      .from(careSeriesSessionsTable)
      .where(eq(careSeriesSessionsTable.seriesId, s.id))
      .orderBy(asc(careSeriesSessionsTable.sessionNumber));
    out.push({ ...s, sessions });
  }
  return out;
}

export async function createCareSeries(
  businessId: string,
  input: {
    customerId: string;
    name: string;
    serviceId: string;
    sessionsTotal: number;
    preferredStaffId?: string;
    cadenceDays?: number;
    expiresAt?: string;
    bookFirstSessionAt?: string;
  },
) {
  const seriesId = generateId();
  const [row] = await db
    .insert(careSeriesTable)
    .values({
      id: seriesId,
      businessId,
      customerId: input.customerId,
      name: input.name.trim(),
      serviceId: input.serviceId,
      preferredStaffId: input.preferredStaffId ?? null,
      sessionsTotal: input.sessionsTotal,
      cadenceDays: input.cadenceDays ?? 14,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning();

  for (let n = 1; n <= input.sessionsTotal; n++) {
    await db.insert(careSeriesSessionsTable).values({
      id: generateId(),
      seriesId,
      sessionNumber: n,
      status: n === 1 && input.bookFirstSessionAt ? "scheduled" : "pending",
    });
  }

  if (input.bookFirstSessionAt) {
    await bookCareSeriesSession(businessId, seriesId, {
      sessionNumber: 1,
      startAt: input.bookFirstSessionAt,
    });
  }

  return listCareSeries(businessId, input.customerId).then((rows) =>
    rows.find((r) => r.id === seriesId),
  );
}

export async function bookCareSeriesSession(
  businessId: string,
  seriesId: string,
  input: { sessionNumber: number; startAt: string },
) {
  const [series] = await db
    .select()
    .from(careSeriesTable)
    .where(and(eq(careSeriesTable.id, seriesId), eq(careSeriesTable.businessId, businessId)));
  if (!series || series.status !== "active") throw new Error("SERIES_NOT_FOUND");

  const [session] = await db
    .select()
    .from(careSeriesSessionsTable)
    .where(
      and(
        eq(careSeriesSessionsTable.seriesId, seriesId),
        eq(careSeriesSessionsTable.sessionNumber, input.sessionNumber),
      ),
    );
  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.bookingId) throw new Error("SESSION_ALREADY_BOOKED");

  const booking = await createBooking(businessId, {
    serviceId: series.serviceId,
    customerId: series.customerId,
    staffId: series.preferredStaffId ?? undefined,
    startAt: input.startAt,
    channelType: "WEB",
    source: "owner-manual",
    notes: `[Care series: ${series.name}] Session ${input.sessionNumber} of ${series.sessionsTotal}`,
  });

  await db
    .update(careSeriesSessionsTable)
    .set({ bookingId: booking.id, status: "booked" })
    .where(eq(careSeriesSessionsTable.id, session.id));

  const completed = series.sessionsCompleted + 1;
  const status = completed >= series.sessionsTotal ? "completed" : "active";
  await db
    .update(careSeriesTable)
    .set({
      sessionsCompleted: completed,
      status,
      updatedAt: new Date(),
    })
    .where(eq(careSeriesTable.id, seriesId));

  return { seriesId, sessionNumber: input.sessionNumber, booking };
}

export function suggestNextSessionStart(series: {
  cadenceDays: number;
  sessions: Array<{ sessionNumber: number; bookingId: string | null }>;
}): Date | null {
  const booked = series.sessions.filter((s) => s.bookingId);
  if (booked.length === 0) return new Date();
  return new Date(Date.now() + series.cadenceDays * 24 * 60 * 60 * 1000);
}
