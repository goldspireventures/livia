import { and, eq, gte, inArray } from "drizzle-orm";
import {
  db,
  bookingsTable,
  businessesTable,
  customersTable,
  guestIdentitiesTable,
  guestShopLinksTable,
} from "@workspace/db";
import {
  DEMO_END_CLIENTS,
  curateGuestHubUpcoming,
  guestHubDemoBookingNote,
} from "@workspace/policy";
import { verifyOperatorLivWorld } from "./demo-operator-liv-world.seed";

export type DemoGuestWorldCheck = {
  ok: boolean;
  clients: Array<{
    id: string;
    phoneE164: string;
    shopsLinked: number;
    upcomingCurated: number;
    minShops: number;
    minUpcoming: number;
    ok: boolean;
    issues: string[];
  }>;
  operators: Awaited<ReturnType<typeof verifyOperatorLivWorld>>;
  operatorOk: boolean;
};

function minShopsForClient(id: string): number {
  if (id === "mary") return 7;
  if (id === "sean") return 3;
  return 3;
}

function minUpcomingForClient(id: string): number {
  if (id === "mary") return 4;
  return 2;
}

export async function verifyDemoGuestWorld(): Promise<DemoGuestWorldCheck> {
  const clients = [];

  for (const client of DEMO_END_CLIENTS) {
    const issues: string[] = [];
    const [guest] = await db
      .select({ id: guestIdentitiesTable.id })
      .from(guestIdentitiesTable)
      .where(eq(guestIdentitiesTable.phoneE164, client.phoneE164))
      .limit(1);

    if (!guest) {
      issues.push("guest identity missing — run seedDemoGuestHub");
      clients.push({
        id: client.id,
        phoneE164: client.phoneE164,
        shopsLinked: 0,
        upcomingCurated: 0,
        minShops: minShopsForClient(client.id),
        minUpcoming: minUpcomingForClient(client.id),
        ok: false,
        issues,
      });
      continue;
    }

    const links = await db
      .select({ businessId: guestShopLinksTable.businessId })
      .from(guestShopLinksTable)
      .where(eq(guestShopLinksTable.guestId, guest.id));
    const shopsLinked = links.length;

    const note = guestHubDemoBookingNote(client.displayName);
    const now = new Date();
    const upcomingAll = [];

    for (const link of links) {
      const customers = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(
          and(
            eq(customersTable.businessId, link.businessId),
            eq(customersTable.phone, client.phoneE164),
          ),
        );
      const customerId = customers[0]?.id;
      if (!customerId) continue;

      const rows = await db
        .select({
          bookingId: bookingsTable.id,
          businessId: bookingsTable.businessId,
          startAt: bookingsTable.startAt,
          status: bookingsTable.status,
          notes: bookingsTable.notes,
        })
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.businessId, link.businessId),
            eq(bookingsTable.customerId, customerId),
            gte(bookingsTable.startAt, now),
            inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
          ),
        );
      for (const r of rows) {
        if ((r.notes ?? "").includes("Demo guest hub") || r.notes === note) {
          upcomingAll.push(r);
        }
      }
    }

    const curated = curateGuestHubUpcoming(upcomingAll);
    const minShops = minShopsForClient(client.id);
    const minUpcoming = minUpcomingForClient(client.id);

    if (shopsLinked < minShops) {
      issues.push(`shopsLinked ${shopsLinked} < ${minShops}`);
    }
    if (curated.length < minUpcoming) {
      issues.push(`upcoming ${curated.length} < ${minUpcoming}`);
    }
    if (curated.length > 8) {
      issues.push(`upcoming ${curated.length} > 8 (curation broken)`);
    }

    clients.push({
      id: client.id,
      phoneE164: client.phoneE164,
      shopsLinked,
      upcomingCurated: curated.length,
      minShops,
      minUpcoming,
      ok: issues.length === 0,
      issues,
    });
  }

  const operators = await verifyOperatorLivWorld();
  const operatorOk = operators.every(
    (o) =>
      o.tier != null &&
      o.subverticalProfileId != null &&
      o.briefingToday &&
      o.openInbox + o.handedOffInbox >= 1 &&
      o.todayBookings >= 1,
  );

  const ok = clients.every((c) => c.ok) && operatorOk;

  return { ok, clients, operators, operatorOk };
}
