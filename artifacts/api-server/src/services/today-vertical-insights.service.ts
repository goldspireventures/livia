import {
  db,
  designProofAssetsTable,
  classSessionsTable,
  classEnrollmentsTable,
  petsTable,
  bookingsTable,
} from "@workspace/db";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { BusinessVertical } from "@workspace/policy";
import { getBusinessById } from "./businesses.service";

export type TodayVerticalInsight = {
  id: string;
  title: string;
  body: string;
  tone: "info" | "warn" | "action";
  href?: string;
  mobileHref?: string;
};

export async function getTodayVerticalInsights(
  businessId: string,
): Promise<{ vertical: BusinessVertical; insights: TodayVerticalInsight[] } | null> {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const vertical = biz.vertical as BusinessVertical;
  const insights: TodayVerticalInsight[] = [];
  const tz = biz.timezone ?? "Europe/Dublin";
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  if (vertical === "body-art") {
    const pending = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(designProofAssetsTable)
      .where(
        and(
          eq(designProofAssetsTable.businessId, businessId),
          eq(designProofAssetsTable.status, "pending_review"),
        ),
      );
    const n = pending[0]?.count ?? 0;
    if (n > 0) {
      insights.push({
        id: "design-proofs",
        title: "Design proofs awaiting sign-off",
        body: `${n} proof${n === 1 ? "" : "s"} need your yes before the session is locked in.`,
        tone: "warn",
        href: "/design-proofs",
        mobileHref: "/design-proofs",
      });
    } else {
      insights.push({
        id: "design-proofs-clear",
        title: "Proof queue clear",
        body: "No designs waiting — new client submissions appear here for sign-off.",
        tone: "info",
      });
    }
  }

  if (vertical === "fitness") {
    const sessions = await db
      .select({
        id: classSessionsTable.id,
        title: classSessionsTable.title,
        startsAt: classSessionsTable.startsAt,
        capacity: classSessionsTable.capacity,
      })
      .from(classSessionsTable)
      .where(
        and(
          eq(classSessionsTable.businessId, businessId),
          gte(classSessionsTable.startsAt, dayStart),
          lte(classSessionsTable.startsAt, dayEnd),
        ),
      )
      .orderBy(classSessionsTable.startsAt)
      .limit(3);

    if (sessions.length === 0) {
      insights.push({
        id: "classes-none",
        title: "No classes scheduled today",
        body: "Add a group session from Classes when you are ready to fill mats.",
        tone: "info",
        href: "/class-sessions",
      });
    } else {
      for (const s of sessions) {
        const [{ enrolled }] = await db
          .select({ enrolled: sql<number>`count(*)::int` })
          .from(classEnrollmentsTable)
          .where(
            and(
              eq(classEnrollmentsTable.sessionId, s.id),
              eq(classEnrollmentsTable.status, "enrolled"),
            ),
          );
        const cap = s.capacity ?? 10;
        const spots = Math.max(0, cap - (enrolled ?? 0));
        const time = s.startsAt.toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: tz,
        });
        insights.push({
          id: `class-${s.id}`,
          title: s.title,
          body:
            spots === 0
              ? `${time} · full — waitlist or add capacity`
              : `${time} · ${spots} spot${spots === 1 ? "" : "s"} left (${enrolled}/${cap})`,
          tone: spots <= 2 ? "warn" : "info",
          href: "/class-sessions",
          mobileHref: "/class-sessions",
        });
      }
    }
  }

  if (vertical === "pet-grooming") {
    const [{ petBookings }] = await db
      .select({ petBookings: sql<number>`count(distinct ${bookingsTable.id})::int` })
      .from(bookingsTable)
      .innerJoin(
        petsTable,
        and(
          eq(petsTable.customerId, bookingsTable.customerId),
          eq(petsTable.businessId, businessId),
        ),
      )
      .where(
        and(
          eq(bookingsTable.businessId, businessId),
          gte(bookingsTable.startAt, dayStart),
          lte(bookingsTable.startAt, dayEnd),
        ),
      );
    const n = petBookings ?? 0;
    insights.push({
      id: "pet-day",
      title: n > 0 ? `${n} groom${n === 1 ? "" : "s"} with pet profiles` : "No grooms on the book yet",
      body:
        n > 0
          ? "Check temperament and vaccination notes before each handoff."
          : "Pet parents book faster when profiles are on file.",
      tone: n > 0 ? "action" : "info",
      href: "/customers",
      mobileHref: "/customers",
    });
  }

  if (vertical === "medspa" || vertical === "allied-health") {
    insights.push({
      id: "clinical-calm",
      title: vertical === "medspa" ? "Consent-first day" : "Clinical session rhythm",
      body:
        vertical === "medspa"
          ? "Liv stays in propose mode for treatments — you sign off anything clinical."
          : "Treatment plans and follow-ups stay in your lane; Liv handles scheduling language.",
      tone: "info",
    });
  }

  if (vertical === "automotive-detailing") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, businessId),
          gte(bookingsTable.startAt, dayStart),
          lte(bookingsTable.startAt, dayEnd),
        ),
      );
    insights.push({
      id: "vehicles-today",
      title: `${count ?? 0} detail${(count ?? 0) === 1 ? "" : "s"} today`,
      body: "Confirm make/model and bay access in each thread before Liv locks the slot.",
      tone: "info",
    });
  }

  if (vertical === "wellness") {
    insights.push({
      id: "wellness-gift",
      title: "Gift vouchers & packages",
      body: "Day packages and series show under Packages — mention them when clients ask about treats.",
      tone: "info",
      href: "/day-packages",
    });
  }

  return { vertical, insights };
}
