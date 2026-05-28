/**
 * Unified Liv presence — one API for ritual headers on web, mobile, and future surfaces.
 * Liv speaks from tenant facts; morning briefing is the primary "liv" source when available.
 */
import { db, businessesTable, conversationsTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { getMorningBriefing, type MorningBriefingContent } from "./morning-briefing.service";
import { getDashboardSummary } from "./dashboard.service";
import { getMyDay } from "./my-day.service";
import { getChainRollupForOwner } from "./chain-rollup.service";
import { listActiveLivMoments, type LivMoment } from "./liv-signals.service";
import type { LivSignalPriority } from "@workspace/liv-runtime";

export type LivPresenceContext =
  | "owner_today"
  | "manager_today"
  | "staff_today"
  | "reception_today"
  | "org_admin_portfolio";

export type LivPresenceSource = "liv" | "stats" | "chain" | "ritual";

export type LivPresencePayload = {
  context: LivPresenceContext;
  line: string;
  source: LivPresenceSource;
  businessId?: string;
  businessName?: string;
  briefing?: {
    briefingDate: string;
    summary: string;
    highlights: string[];
    source: MorningBriefingContent["source"];
    verticalLabel?: string;
  };
  signals?: {
    todayBookings: number;
    pendingBookings: number;
    openConversations: number;
  };
  /** Reactive Liv moments (last 48h). */
  moments?: LivMoment[];
  /** Derived urgency for UI chrome. */
  pulse?: LivSignalPriority;
  generatedAt: string;
};

function derivePulse(
  moments: LivMoment[],
  pending: number,
  open: number,
): LivSignalPriority {
  if (moments.some((m) => m.priority === "act")) return "act";
  if (pending > 0 || open > 2 || moments.some((m) => m.priority === "watch")) return "watch";
  return "info";
}

async function countOpenConversations(businessId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.status, "OPEN"),
      ),
    );
  return row?.count ?? 0;
}

function shopPrefix(name: string | undefined): string {
  return name ? `${name}: ` : "";
}

function buildStatsLine(args: {
  context: LivPresenceContext;
  businessName?: string;
  today: number;
  pending: number;
  open: number;
  myDayNext?: { startAt: string; customerName: string | null } | null;
  myDayTodayCount?: number;
}): string {
  const shop = shopPrefix(args.businessName);

  if (args.context === "manager_today" && args.open > 0) {
    return `${shop}${args.open} conversation${args.open === 1 ? "" : "s"} need${args.open === 1 ? "s" : ""} you — ${args.today} on the books today.`;
  }

  if (args.pending > 0) {
    return `${shop}${args.today} today · ${args.pending} pending confirmation${args.pending === 1 ? "" : "s"}.${
      args.open > 0 ? ` ${args.open} inbox thread${args.open === 1 ? "" : "s"} open.` : ""
    }`;
  }

  if (args.context === "staff_today" && args.myDayNext) {
    const name = args.myDayNext.customerName ?? "your next client";
    const mins = Math.max(
      0,
      Math.round((new Date(args.myDayNext.startAt).getTime() - Date.now()) / 60000),
    );
    if (mins <= 15) return `${name} is due in ${mins} minutes.`;
    const count = args.myDayTodayCount ?? 0;
    return count > 0
      ? `${count} today — next up ${name} in ${mins}m.`
      : "Chair's open. Walk-ins can be added from the floor calendar.";
  }

  if (args.context === "staff_today" && (args.myDayTodayCount ?? 0) === 0) {
    return "Chair's open. Walk-ins can be added from the floor calendar.";
  }

  if (args.context === "reception_today") {
    if (args.open > 0 && args.today > 0) {
      return `${shop}${args.today} on the floor · phone's active (${args.open} thread${args.open === 1 ? "" : "s"}).`;
    }
    if (args.today > 0) return `${shop}${args.today} bookings today — calendar's the source of truth.`;
  }

  if (args.today > 0) {
    return `${shop}${args.today} appointment${args.today === 1 ? "" : "s"} today — you're on track.`;
  }

  return `${shop}Quiet morning — inbox and calendar are clear.`;
}

export async function getLivPresenceForBusiness(args: {
  businessId: string;
  context: LivPresenceContext;
  staffId?: string | null;
}): Promise<LivPresencePayload | null> {
  const { businessId, context, staffId } = args;

  const [biz] = await db
    .select({ name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  if (!biz) return null;

  const generatedAt = new Date().toISOString();

  if (context === "org_admin_portfolio") {
    return null;
  }

  const [briefing, summary, openConversations, moments] = await Promise.all([
    ["owner_today", "manager_today", "reception_today"].includes(context)
      ? getMorningBriefing(businessId)
      : Promise.resolve(null),
    ["owner_today", "manager_today", "reception_today"].includes(context)
      ? getDashboardSummary(businessId)
      : Promise.resolve(null),
    ["owner_today", "manager_today", "reception_today"].includes(context)
      ? countOpenConversations(businessId)
      : Promise.resolve(0),
    listActiveLivMoments(businessId, 6),
  ]);

  if (context === "staff_today") {
    const myDay = await getMyDay(businessId, staffId ?? null);
    const next = myDay.next
      ? {
          startAt: new Date(myDay.next.startAt).toISOString(),
          customerName: myDay.next.customer?.displayName ?? null,
        }
      : null;

    const line = buildStatsLine({
      context,
      businessName: biz.name,
      today: myDay.todayCount,
      pending: 0,
      open: 0,
      myDayNext: next,
      myDayTodayCount: myDay.todayCount,
    });

    return {
      context,
      line,
      source: "stats",
      businessId,
      businessName: biz.name,
      signals: {
        todayBookings: myDay.todayCount,
        pendingBookings: 0,
        openConversations: 0,
      },
      generatedAt,
    };
  }

  const today = summary?.todayBookings ?? 0;
  const pending = summary?.pendingCount ?? 0;
  const open = openConversations;

  const content = briefing?.content as MorningBriefingContent | undefined;
  const livSummary = content?.summary?.trim();

  const pulse = derivePulse(moments, pending, open);

  if (livSummary) {
    return {
      context,
      line: livSummary,
      source: content?.source === "liv" ? "liv" : "stats",
      businessId,
      businessName: biz.name,
      briefing: briefing
        ? {
            briefingDate: briefing.briefingDate,
            summary: livSummary,
            highlights: content?.highlights ?? [],
            source: content?.source ?? "stats_fallback",
            verticalLabel: content?.verticalLabel,
          }
        : undefined,
      signals: { todayBookings: today, pendingBookings: pending, openConversations: open },
      moments,
      pulse,
      generatedAt,
    };
  }

  const line = buildStatsLine({
    context,
    businessName: biz.name,
    today,
    pending,
    open,
  });

  return {
    context,
    line,
    source: "stats",
    businessId,
    businessName: biz.name,
    signals: { todayBookings: today, pendingBookings: pending, openConversations: open },
    moments,
    pulse,
    generatedAt,
  };
}

export async function getLivPresenceForOrgAdmin(ownerId: string): Promise<LivPresencePayload> {
  const chain = await getChainRollupForOwner(ownerId);
  const line =
    chain.orgAdminBriefingLine?.trim() ||
    (chain.shopCount > 1
      ? `${chain.shopCount} locations · ${chain.bookingsThisWeek} bookings this week.`
      : "Your portfolio is connected in Livia.");

  const pending = chain.shops.reduce((n, s) => n + s.pendingBookings, 0);
  const open = chain.shops.reduce((n, s) => n + s.openConversations, 0);
  const actShops = chain.shops.filter((s) => s.pulseStatus === "act").length;

  return {
    context: "org_admin_portfolio",
    line,
    source: chain.orgAdminBriefingLine ? "chain" : "ritual",
    signals: {
      todayBookings: chain.shops.reduce((n, s) => n + s.todayBookings, 0),
      pendingBookings: pending,
      openConversations: open,
    },
    pulse: actShops > 0 ? "act" : chain.shopsNeedingAttention > 0 ? "watch" : "info",
    generatedAt: new Date().toISOString(),
  };
}
