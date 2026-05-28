import {
  db,
  classSessionsTable,
  classEnrollmentsTable,
} from "@workspace/db";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function listClassSessions(
  businessId: string,
  opts?: { from?: string; to?: string },
) {
  const conditions = [eq(classSessionsTable.businessId, businessId)];
  if (opts?.from) {
    conditions.push(gte(classSessionsTable.startsAt, new Date(opts.from)));
  }
  if (opts?.to) {
    conditions.push(lte(classSessionsTable.startsAt, new Date(opts.to)));
  }
  return db
    .select()
    .from(classSessionsTable)
    .where(and(...conditions))
    .orderBy(classSessionsTable.startsAt);
}

export async function createClassSession(
  businessId: string,
  input: {
    title: string;
    startsAt: string;
    endsAt: string;
    capacity?: number;
    waitlistCapacity?: number;
    serviceId?: string;
    staffId?: string;
  },
) {
  const id = generateId();
  const [row] = await db
    .insert(classSessionsTable)
    .values({
      id,
      businessId,
      title: input.title.trim(),
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      capacity: input.capacity ?? 10,
      waitlistCapacity: input.waitlistCapacity ?? 5,
      serviceId: input.serviceId,
      staffId: input.staffId,
      status: "scheduled",
    })
    .returning();
  return row;
}

export async function enrollInClass(
  businessId: string,
  sessionId: string,
  customerId: string,
) {
  const [session] = await db
    .select()
    .from(classSessionsTable)
    .where(
      and(
        eq(classSessionsTable.id, sessionId),
        eq(classSessionsTable.businessId, businessId),
      ),
    );
  if (!session) return { error: "session_not_found" as const };

  const [{ enrolled }] = await db
    .select({ enrolled: sql<number>`count(*)::int` })
    .from(classEnrollmentsTable)
    .where(
      and(
        eq(classEnrollmentsTable.sessionId, sessionId),
        eq(classEnrollmentsTable.status, "enrolled"),
      ),
    );

  const status =
    enrolled < session.capacity
      ? "enrolled"
      : enrolled < session.capacity + session.waitlistCapacity
        ? "waitlisted"
        : null;

  if (!status) return { error: "full" as const };

  const waitlistPosition =
    status === "waitlisted"
      ? enrolled - session.capacity + 1
      : null;

  const id = generateId();
  const [row] = await db
    .insert(classEnrollmentsTable)
    .values({
      id,
      sessionId,
      customerId,
      status,
      waitlistPosition,
    })
    .returning();

  return { enrollment: row };
}

export async function listSessionRoster(businessId: string, sessionId: string) {
  const [session] = await db
    .select()
    .from(classSessionsTable)
    .where(
      and(
        eq(classSessionsTable.id, sessionId),
        eq(classSessionsTable.businessId, businessId),
      ),
    );
  if (!session) return null;

  const enrollments = await db
    .select()
    .from(classEnrollmentsTable)
    .where(eq(classEnrollmentsTable.sessionId, sessionId));

  return { session, enrollments };
}
