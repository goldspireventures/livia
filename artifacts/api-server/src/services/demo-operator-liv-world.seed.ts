/**
 * Operator-shape Liv depth — solo barber, studio barber, solo wellness.
 * Idempotent inbox + briefing refresh for real-world demo slugs.
 */
import { and, eq, gte, inArray, like, lte, sql } from "drizzle-orm";
import {
  db,
  businessesTable,
  bookingsTable,
  conversationsTable,
  conversationMessagesTable,
  customersTable,
  morningBriefingsTable,
} from "@workspace/db";
import {
  DEMO_OPERATOR_EXPERIENCE,
  DEMO_OPERATOR_SLUGS,
  normalizePhoneE164,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { generateMorningBriefingForBusiness } from "./morning-briefing.service";
import { seedDemoLivMemoryForBusinesses } from "./demo-liv-memory.seed";
import { seedDemoLivSignalsForBusinesses } from "./demo-liv-signals.seed";
import { logger } from "../lib/logger";

const OPERATOR_INBOX_MARKER = "Demo operator liv —";

function ago(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

type ThreadDef = {
  customerPhone: string;
  channel: "WEB" | "SMS" | "EMAIL" | "VOICE";
  status: "OPEN" | "HANDED_OFF" | "CLOSED";
  aiHandled: boolean;
  summary: string;
  caseIntent?: string;
  messages: Array<{ role: "USER" | "ASSISTANT"; content: string; minsAgo: number }>;
};

const SOLO_BARBER_THREADS: ThreadDef[] = [
  {
    customerPhone: "+353871000002",
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    summary: `${OPERATOR_INBOX_MARKER} Sean running 10 late — Liv acknowledged and shifted buffer.`,
    caseIntent: "running_late",
    messages: [
      { role: "USER", content: "Running 10 late for my fade — still ok?", minsAgo: 18 },
      {
        role: "ASSISTANT",
        content:
          "No problem Sean — Conor sees you at 11:30. I've noted it so the next walk-in waits.",
        minsAgo: 16,
      },
    ],
  },
  {
    customerPhone: "+353871000001",
    channel: "WEB",
    status: "OPEN",
    aiHandled: true,
    summary: `${OPERATOR_INBOX_MARKER} Mary asked for Saturday skin fade — Liv held slot.`,
    messages: [
      { role: "USER", content: "Any Saturday morning skin fade slots?", minsAgo: 35 },
      {
        role: "ASSISTANT",
        content: "Saturday 9:40 is open with Conor — reply YES and I'll confirm.",
        minsAgo: 33,
      },
    ],
  },
];

const STUDIO_BARBER_THREADS: ThreadDef[] = [
  {
    customerPhone: "+353871000002",
    channel: "SMS",
    status: "HANDED_OFF",
    aiHandled: false,
    summary: `${OPERATOR_INBOX_MARKER} Sean deposit refund — manager queue (late cancel).`,
    caseIntent: "refund_request",
    messages: [
      { role: "USER", content: "Work called me in — can I move deposit to next week?", minsAgo: 95 },
      {
        role: "ASSISTANT",
        content:
          "I've flagged this for the manager — refunds over €50 need a human yes. You'll hear back today.",
        minsAgo: 90,
      },
    ],
  },
  {
    customerPhone: "+353871000001",
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    summary: `${OPERATOR_INBOX_MARKER} Mary reschedule hot-towel shave — Liv proposed Thursday.`,
    caseIntent: "reschedule",
    messages: [
      { role: "USER", content: "Can I move my hot towel to Thursday evening?", minsAgo: 44 },
      {
        role: "ASSISTANT",
        content: "Thursday 6:15 with Liam works — reply YES to lock it.",
        minsAgo: 42,
      },
    ],
  },
];

const SOLO_WELLNESS_THREADS: ThreadDef[] = [
  {
    customerPhone: "+353871000003",
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    summary: `${OPERATOR_INBOX_MARKER} Orla redeeming session pack — Liv confirmed credit.`,
    caseIntent: "package_redeem",
    messages: [
      { role: "USER", content: "Use one of my massage credits for next Friday?", minsAgo: 28 },
      {
        role: "ASSISTANT",
        content:
          "Done — Friday 11:00 Swedish 60 is booked on your Serenity pack (4 credits left).",
        minsAgo: 26,
      },
    ],
  },
  {
    customerPhone: "+353871000001",
    channel: "EMAIL",
    status: "CLOSED",
    aiHandled: true,
    summary: `${OPERATOR_INBOX_MARKER} Mary couples room question — Liv sent intake link.`,
    messages: [
      { role: "USER", content: "Do you do couples massage same room?", minsAgo: 720 },
      {
        role: "ASSISTANT",
        content: "We do — I've sent the couples intake form. Maeve will confirm room pairing.",
        minsAgo: 700,
      },
    ],
  },
];

const THREADS_BY_SLUG: Record<string, ThreadDef[]> = {
  [DEMO_OPERATOR_EXPERIENCE.soloBarber.slug]: SOLO_BARBER_THREADS,
  [DEMO_OPERATOR_EXPERIENCE.studioBarber.slug]: STUDIO_BARBER_THREADS,
  [DEMO_OPERATOR_EXPERIENCE.soloWellness.slug]: SOLO_WELLNESS_THREADS,
};

async function clearOperatorInbox(businessId: string): Promise<void> {
  const rows = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        like(conversationsTable.summary, `${OPERATOR_INBOX_MARKER}%`),
      ),
    );
  for (const row of rows) {
    await db
      .delete(conversationMessagesTable)
      .where(eq(conversationMessagesTable.conversationId, row.id));
    await db.delete(conversationsTable).where(eq(conversationsTable.id, row.id));
  }
}

async function seedOperatorInbox(businessId: string, threads: ThreadDef[]): Promise<number> {
  await clearOperatorInbox(businessId);
  const customers = await db
    .select({
      id: customersTable.id,
      phone: customersTable.phone,
      displayName: customersTable.displayName,
      email: customersTable.email,
    })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId));

  let inserted = 0;
  for (const t of threads) {
    const cust = customers.find((c) => normalizePhoneE164(c.phone) === t.customerPhone);
    const convId = generateId();
    const lastAt = ago(Math.min(...t.messages.map((m) => m.minsAgo)));
    await db.insert(conversationsTable).values({
      id: convId,
      businessId,
      customerId: cust?.id ?? null,
      channel: t.channel,
      status: t.status,
      customerName: cust?.displayName ?? "Guest",
      customerEmail: cust?.email ?? "",
      customerPhone: t.customerPhone,
      aiHandled: t.aiHandled,
      summary: t.summary,
      caseIntent: t.caseIntent ?? null,
      lastMessageAt: lastAt,
    });
    for (const m of t.messages) {
      await db.insert(conversationMessagesTable).values({
        id: generateId(),
        conversationId: convId,
        role: m.role,
        content: m.content,
        createdAt: ago(m.minsAgo),
      });
    }
    inserted += 1;
  }
  return inserted;
}

async function patchOperatorBusinessMeta(): Promise<number> {
  let updated = 0;
  for (const spec of Object.values(DEMO_OPERATOR_EXPERIENCE)) {
    const [row] = await db
      .select({ id: businessesTable.id, subverticalProfileId: businessesTable.subverticalProfileId })
      .from(businessesTable)
      .where(eq(businessesTable.slug, spec.slug))
      .limit(1);
    if (!row) continue;
    if (row.subverticalProfileId === spec.subverticalProfileId) continue;
    await db
      .update(businessesTable)
      .set({ subverticalProfileId: spec.subverticalProfileId, tier: spec.tier, updatedAt: new Date() })
      .where(eq(businessesTable.id, row.id));
    updated += 1;
  }
  return updated;
}

export async function seedOperatorLivWorld(): Promise<{
  businessesPatched: number;
  inboxThreads: number;
  briefingsRefreshed: number;
  livMemory: number;
  livSignals: number;
}> {
  const businessesPatched = await patchOperatorBusinessMeta();

  const bizRows = await db
    .select({ id: businessesTable.id, slug: businessesTable.slug, vertical: businessesTable.vertical })
    .from(businessesTable)
    .where(inArray(businessesTable.slug, [...DEMO_OPERATOR_SLUGS]));

  let inboxThreads = 0;
  let briefingsRefreshed = 0;
  for (const biz of bizRows) {
    const threads = THREADS_BY_SLUG[biz.slug] ?? [];
    inboxThreads += await seedOperatorInbox(biz.id, threads);
    await generateMorningBriefingForBusiness(biz.id);
    briefingsRefreshed += 1;
  }

  const livMemory = await seedDemoLivMemoryForBusinesses(
    bizRows.map((b) => ({ id: b.id, slug: b.slug, vertical: b.vertical ?? undefined })),
  );
  const livSignals = await seedDemoLivSignalsForBusinesses(bizRows.map((b) => b.id));

  logger.info(
    {
      event: "demo.operator_liv_world.ok",
      businessesPatched,
      inboxThreads,
      briefingsRefreshed,
      livMemory,
      livSignals,
    },
    "Operator Liv demo world seeded",
  );

  return { businessesPatched, inboxThreads, briefingsRefreshed, livMemory, livSignals };
}

export async function verifyOperatorLivWorld(): Promise<
  Array<{
    slug: string;
    tier: string | null;
    subverticalProfileId: string | null;
    openInbox: number;
    handedOffInbox: number;
    todayBookings: number;
    pendingToday: number;
    briefingToday: boolean;
  }>
> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const today = start.toISOString().slice(0, 10);

  const out = [];
  for (const spec of Object.values(DEMO_OPERATOR_EXPERIENCE)) {
    const [biz] = await db
      .select({
        id: businessesTable.id,
        tier: businessesTable.tier,
        subverticalProfileId: businessesTable.subverticalProfileId,
      })
      .from(businessesTable)
      .where(eq(businessesTable.slug, spec.slug))
      .limit(1);
    if (!biz) {
      out.push({
        slug: spec.slug,
        tier: null,
        subverticalProfileId: null,
        openInbox: 0,
        handedOffInbox: 0,
        todayBookings: 0,
        pendingToday: 0,
        briefingToday: false,
      });
      continue;
    }

    const [inbox] = await db
      .select({
        open: sql<number>`count(*) filter (where ${conversationsTable.status} = 'OPEN')::int`,
        handed: sql<number>`count(*) filter (where ${conversationsTable.status} = 'HANDED_OFF')::int`,
      })
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.businessId, biz.id),
          like(conversationsTable.summary, `${OPERATOR_INBOX_MARKER}%`),
        ),
      );

    const [bookings] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${bookingsTable.status} = 'PENDING')::int`,
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, biz.id),
          gte(bookingsTable.startAt, start),
          lte(bookingsTable.startAt, end),
        ),
      );

    const [briefing] = await db
      .select({ id: morningBriefingsTable.id })
      .from(morningBriefingsTable)
      .where(
        and(eq(morningBriefingsTable.businessId, biz.id), eq(morningBriefingsTable.briefingDate, today)),
      )
      .limit(1);

    out.push({
      slug: spec.slug,
      tier: biz.tier,
      subverticalProfileId: biz.subverticalProfileId,
      openInbox: inbox?.open ?? 0,
      handedOffInbox: inbox?.handed ?? 0,
      todayBookings: bookings?.total ?? 0,
      pendingToday: bookings?.pending ?? 0,
      briefingToday: !!briefing,
    });
  }
  return out;
}
