import {
  db,
  morningBriefingsTable,
  bookingsTable,
  conversationsTable,
  businessesTable,
} from "@workspace/db";
import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { generateId } from "../lib/id";
import { todayInTimezone } from "@workspace/liv-runtime";
import { businessVocabulary } from "@workspace/policy";
import { isAnthropicConfigured } from "@workspace/integrations-anthropic-ai";
import { enrichBookingsBatch } from "./bookings.service";
import {
  synthesizeOrgAdminPortfolioLine,
  synthesizeLivMorningNarrative,
} from "./liv-morning-narrative";
import { logger } from "../lib/logger";

export type MorningBriefingSource = "liv" | "stats_fallback";

export type MorningBriefingContent = {
  businessName: string;
  verticalLabel: string;
  summary: string;
  highlights: string[];
  source: MorningBriefingSource;
  model?: string | null;
  stats: {
    todayCount: number;
    pendingCount: number;
    handedOffConversations: number;
    weekAheadCount: number;
  };
  todayBookings: Array<{
    id: string;
    startAt: string;
    status: string;
    customerName: string;
    serviceName: string;
  }>;
  generatedAt: string;
};

export function isMorningBriefingHour(timezone: string, targetHour = 6): boolean {
  const hour = Number.parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10,
  );
  return hour === targetHour;
}

function aiEnabledForBusiness(row: { aiEnabled: string } | undefined): boolean {
  return row?.aiEnabled !== "false" && row?.aiEnabled !== "0";
}

export async function gatherMorningBriefingFacts(
  businessId: string,
  timezone: string,
): Promise<MorningBriefingContent> {
  const [biz] = await db
    .select({
      name: businessesTable.name,
      vertical: businessesTable.vertical,
      category: businessesTable.category,
      aiEnabled: businessesTable.aiEnabled,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));

  const businessName = biz?.name ?? "Your shop";
  const vocab = businessVocabulary(biz?.vertical, biz?.category);
  const serviceWord = vocab.serviceNoun.toLowerCase();
  const clientWord = vocab.clientNoun.toLowerCase();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const todayRows = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, todayStart),
        lte(bookingsTable.startAt, todayEnd),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED", "COMPLETED"]),
      ),
    )
    .orderBy(bookingsTable.startAt);

  const enriched = await enrichBookingsBatch(todayRows);

  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.businessId, businessId), eq(bookingsTable.status, "PENDING")));

  const [handedOff] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.status, "HANDED_OFF"),
      ),
    );

  const [weekAhead] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, todayEnd),
        lte(bookingsTable.startAt, weekEnd),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
      ),
    );

  const todayBookings = enriched.map((b) => {
    const cust = b.customer as { firstName?: string; lastName?: string; displayName?: string } | null;
    const name =
      cust?.displayName ||
      [cust?.firstName, cust?.lastName].filter(Boolean).join(" ").trim() ||
      "Guest";
    const svc = (b.service as { name?: string } | null)?.name ?? vocab.serviceNoun;
    return {
      id: b.id,
      startAt: b.startAt.toISOString(),
      status: b.status,
      customerName: name,
      serviceName: svc,
    };
  });

  const pending = pendingCount?.count ?? 0;
  const handed = handedOff?.count ?? 0;
  const todayCount = todayBookings.length;

  const highlights: string[] = [];
  if (pending > 0) {
    highlights.push(
      `${pending} ${serviceWord}${pending === 1 ? "" : "s"} at ${businessName} need confirmation`,
    );
  }
  if (handed > 0) {
    highlights.push(`${handed} ${clientWord} thread${handed === 1 ? "" : "s"} waiting for your team`);
  }
  if (todayCount === 0) {
    highlights.push(`No ${serviceWord}s on the calendar at ${businessName} yet today`);
  } else {
    const first = todayBookings[0];
    highlights.push(
      first != null
        ? `First up: ${first.customerName} (${first.serviceName}) at ${businessName}`
        : `${todayCount} ${serviceWord}${todayCount === 1 ? "" : "s"} scheduled at ${businessName}`,
    );
  }

  const summary =
    todayCount === 0
      ? `${businessName} · Quiet ${vocab.locationNoun.toLowerCase()} morning — ${pending} pending, ${handed} inbox handoff${handed === 1 ? "" : "s"}.`
      : `${businessName} · ${todayCount} ${serviceWord}${todayCount === 1 ? "" : "s"} today; ${pending} pending; ${handed} inbox handoff${handed === 1 ? "" : "s"}.`;

  return {
    businessName,
    verticalLabel: vocab.label,
    summary,
    highlights,
    source: "stats_fallback",
    model: null,
    stats: {
      todayCount,
      pendingCount: pending,
      handedOffConversations: handed,
      weekAheadCount: weekAhead?.count ?? 0,
    },
    todayBookings: todayBookings.slice(0, 12),
    generatedAt: new Date().toISOString(),
  };
}

/** @deprecated alias */
export async function buildMorningBriefingContent(
  businessId: string,
  timezone: string,
): Promise<MorningBriefingContent> {
  return gatherMorningBriefingFacts(businessId, timezone);
}

async function composeBriefingContent(
  businessId: string,
  timezone: string,
  briefingDate: string,
): Promise<MorningBriefingContent> {
  const [biz] = await db
    .select({
      name: businessesTable.name,
      vertical: businessesTable.vertical,
      category: businessesTable.category,
      aiEnabled: businessesTable.aiEnabled,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));

  const facts = await gatherMorningBriefingFacts(businessId, timezone);

  if (!biz || !aiEnabledForBusiness(biz) || !isAnthropicConfigured()) {
    return facts;
  }

  const liv = await synthesizeLivMorningNarrative({
    businessName: facts.businessName,
    vertical: biz.vertical,
    category: biz.category,
    timezone,
    briefingDate,
    facts,
  });

  if (!liv) return facts;

  return {
    ...facts,
    summary: liv.summary,
    highlights: liv.highlights.length > 0 ? liv.highlights : facts.highlights,
    source: "liv",
    model: liv.model,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateMorningBriefingForBusiness(businessId: string) {
  const [biz] = await db
    .select({ timezone: businessesTable.timezone })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  if (!biz) return null;

  const briefingDate = todayInTimezone(biz.timezone);
  const content = await composeBriefingContent(businessId, biz.timezone, briefingDate);

  const [existing] = await db
    .select()
    .from(morningBriefingsTable)
    .where(
      and(
        eq(morningBriefingsTable.businessId, businessId),
        eq(morningBriefingsTable.briefingDate, briefingDate),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(morningBriefingsTable)
      .set({ content, generatedAt: new Date() })
      .where(eq(morningBriefingsTable.id, existing.id))
      .returning();
    return updated;
  }

  const [row] = await db
    .insert(morningBriefingsTable)
    .values({
      id: generateId(),
      businessId,
      briefingDate,
      content,
    })
    .returning();

  return row;
}

export async function getMorningBriefing(businessId: string) {
  const [biz] = await db
    .select({
      timezone: businessesTable.timezone,
      aiEnabled: businessesTable.aiEnabled,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  if (!biz) return null;

  const briefingDate = todayInTimezone(biz.timezone);
  const [row] = await db
    .select()
    .from(morningBriefingsTable)
    .where(
      and(
        eq(morningBriefingsTable.businessId, businessId),
        eq(morningBriefingsTable.briefingDate, briefingDate),
      ),
    );

  const stored = row?.content as MorningBriefingContent | undefined;
  const needsLiv =
    aiEnabledForBusiness(biz) &&
    isAnthropicConfigured() &&
    (!stored || stored.source !== "liv");

  if (needsLiv) {
    const generated = await generateMorningBriefingForBusiness(businessId);
    if (generated) {
      return {
        briefingDate,
        content: generated.content as MorningBriefingContent,
        generatedAt: generated.generatedAt,
      };
    }
  }

  if (row) {
    return {
      briefingDate,
      content: row.content as MorningBriefingContent,
      generatedAt: row.generatedAt,
    };
  }

  const content = await composeBriefingContent(businessId, biz.timezone, briefingDate);
  return {
    briefingDate,
    content,
    generatedAt: null,
    live: true as const,
  };
}

/** Regenerate Liv briefings for all businesses (demo provision, ops). */
export async function regenerateLivBriefingsForBusinessIds(businessIds: string[]): Promise<number> {
  let ok = 0;
  await Promise.all(
    businessIds.map(async (id) => {
      try {
        const row = await generateMorningBriefingForBusiness(id);
        if (row && (row.content as MorningBriefingContent).source === "liv") ok += 1;
      } catch (err) {
        logger.warn({ err, businessId: id }, "regenerateLivBriefings failed for shop");
      }
    }),
  );
  return ok;
}
