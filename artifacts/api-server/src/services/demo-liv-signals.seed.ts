import { upsertLivSignal } from "./liv-signals.service";
import { db, bookingsTable, businessesTable, conversationsTable } from "@workspace/db";
import { and, eq, gte, desc, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";

const VERTICAL_PULSE_COPY: Record<
  string,
  { title: string; body: string }
> = {
  hair: {
    title: "Chair day is forming",
    body: "Cuts and colour on the books — Liv is holding confirmations before clients wait.",
  },
  beauty: {
    title: "Beauty floor synced",
    body: "Lash, nail, and brow slots — inbox threads route through Liv until you take over.",
  },
  wellness: {
    title: "Treatment rooms on rhythm",
    body: "Massage and holistic sessions — packages and room time respected in policy.",
  },
  "body-art": {
    title: "Studio queue steady",
    body: "Consult-first for long sessions — design proofs when art is in play.",
  },
  medspa: {
    title: "Clinical queue steady",
    body: "Consultation-led aesthetics — consent paths before treatment confirmations.",
  },
  "allied-health": {
    title: "Clinic day in motion",
    body: "Assessments and follow-ups — patient-appropriate language in every thread.",
  },
  "pet-grooming": {
    title: "Grooming day lined up",
    body: "Temperament-first handling — pet profiles inform Liv's replies.",
  },
  fitness: {
    title: "Sessions on the board",
    body: "PT and classes — coach assignment when clients ask who is free.",
  },
  "automotive-detailing": {
    title: "Bay schedule locked",
    body: "Detail blocks and maintenance washes — vehicle context in every booking.",
  },
  generic: {
    title: "Liv is watching today",
    body: "Briefing is ready — inbox and floor are synced for this shop.",
  },
  "event-vendors": {
    title: "Enquiry pipeline active",
    body: "New leads and quotes — follow up before dates slip.",
  },
};

function pulseCopyForVertical(vertical: string | null | undefined) {
  const key = vertical?.trim().toLowerCase() ?? "generic";
  return VERTICAL_PULSE_COPY[key] ?? VERTICAL_PULSE_COPY.generic;
}

/**
 * Seed Liv moments so dashboard/mobile feel reactive on first login.
 */
export async function seedDemoLivSignalsForBusinesses(
  businessIds: string[],
): Promise<number> {
  let count = 0;
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const metaRows =
    businessIds.length > 0
      ? await db
          .select({
            id: businessesTable.id,
            vertical: businessesTable.vertical,
            slug: businessesTable.slug,
          })
          .from(businessesTable)
          .where(inArray(businessesTable.id, businessIds))
      : [];
  const metaById = new Map(metaRows.map((r) => [r.id, r]));

  for (const businessId of businessIds) {
    const meta = metaById.get(businessId);
    const vertical = meta?.vertical ?? null;

    const [pending] = await db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, businessId),
          eq(bookingsTable.status, "PENDING"),
          gte(bookingsTable.startAt, since),
        ),
      )
      .orderBy(desc(bookingsTable.startAt))
      .limit(1);

    if (pending && vertical !== "event-vendors") {
      const pendingTitle =
        vertical === "medspa"
          ? "Treatment needs confirmation"
          : vertical === "pet-grooming"
            ? "Groom needs you"
            : "Booking needs you";
      const ok = await upsertLivSignal({
        businessId,
        kind: "booking_pending",
        priority: "act",
        title: pendingTitle,
        body: "Liv held a slot — confirm or release before the client waits too long.",
        dedupeKey: `demo:pending:${businessId}:${pending.id}`,
        entityType: "booking",
        entityId: pending.id,
        eventName: "booking.pending",
        ttlHours: 48,
      });
      if (ok) count += 1;
    }

    const [handoff] = await db
      .select({ id: conversationsTable.id })
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.businessId, businessId),
          eq(conversationsTable.status, "HANDED_OFF"),
        ),
      )
      .orderBy(desc(conversationsTable.lastMessageAt))
      .limit(1);

    if (handoff) {
      const ok = await upsertLivSignal({
        businessId,
        kind: "handoff",
        priority: "watch",
        title: "Thread handed to your team",
        body: "A client asked for a human — reply when you have a beat.",
        dedupeKey: `demo:handoff:${businessId}:${handoff.id}`,
        entityType: "conversation",
        entityId: handoff.id,
        eventName: "conversation.handed_off",
        ttlHours: 48,
      });
      if (ok) count += 1;
    } else {
      const pulse = pulseCopyForVertical(vertical);
      const ok = await upsertLivSignal({
        businessId,
        kind: "morning_pulse",
        priority: "watch",
        title: pulse.title,
        body: pulse.body,
        dedupeKey: `demo:pulse:${businessId}`,
        eventName: "liv.morning_pulse",
        ttlHours: 24,
      });
      if (ok) count += 1;
    }
  }

  logger.info({ count, shops: businessIds.length }, "demo.liv_signals.seeded");
  return count;
}
