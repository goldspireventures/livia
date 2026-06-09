/**
 * Public fitness class catalog + guest enroll (Innovation P0).
 */
import {
  db,
  classEnrollmentsTable,
  classSessionsTable,
  staffTable,
} from "@workspace/db";
import { and, eq, gte, sql } from "drizzle-orm";
import { enrollInClass, listClassSessions } from "./class-sessions.service";

export async function listPublicFitnessClasses(businessId: string) {
  const now = new Date();
  const sessions = await listClassSessions(businessId, {
    from: now.toISOString(),
  });

  const enriched = await Promise.all(
    sessions
      .filter((s) => s.status === "scheduled")
      .slice(0, 30)
      .map(async (s) => {
        const [{ enrolled }] = await db
          .select({ enrolled: sql<number>`count(*)::int` })
          .from(classEnrollmentsTable)
          .where(
            and(
              eq(classEnrollmentsTable.sessionId, s.id),
              eq(classEnrollmentsTable.status, "enrolled"),
            ),
          );
        let coachName: string | null = null;
        if (s.staffId) {
          const [coach] = await db
            .select({ displayName: staffTable.displayName })
            .from(staffTable)
            .where(eq(staffTable.id, s.staffId))
            .limit(1);
          coachName = coach?.displayName ?? null;
        }
        const spotsLeft = Math.max(0, s.capacity - (enrolled ?? 0));
        const waitlistOpen =
          spotsLeft === 0 && enrolled < s.capacity + s.waitlistCapacity;
        return {
          id: s.id,
          title: s.title,
          startsAt: s.startsAt.toISOString(),
          endsAt: s.endsAt.toISOString(),
          capacity: s.capacity,
          enrolled: enrolled ?? 0,
          spotsLeft,
          waitlistOpen,
          coachName,
        };
      }),
  );

  return enriched;
}

export async function publicEnrollInClass(
  businessId: string,
  sessionId: string,
  customerId: string,
) {
  return enrollInClass(businessId, sessionId, customerId);
}

export async function listGuestFitnessEnrollments(businessId: string, customerId: string) {
  const rows = await db
    .select({
      enrollmentId: classEnrollmentsTable.id,
      status: classEnrollmentsTable.status,
      waitlistPosition: classEnrollmentsTable.waitlistPosition,
      title: classSessionsTable.title,
      startsAt: classSessionsTable.startsAt,
    })
    .from(classEnrollmentsTable)
    .innerJoin(classSessionsTable, eq(classEnrollmentsTable.sessionId, classSessionsTable.id))
    .where(
      and(
        eq(classEnrollmentsTable.customerId, customerId),
        eq(classSessionsTable.businessId, businessId),
        gte(classSessionsTable.startsAt, new Date()),
      ),
    )
    .orderBy(classSessionsTable.startsAt)
    .limit(5);

  return rows.map((r) => ({
    enrollmentId: r.enrollmentId,
    status: r.status,
    waitlistPosition: r.waitlistPosition,
    title: r.title,
    startsAt: r.startsAt.toISOString(),
  }));
}
