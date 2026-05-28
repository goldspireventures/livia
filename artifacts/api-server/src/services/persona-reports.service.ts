import {
  listReportsForAudience,
  getReportDefinition,
  type PersonaReportSlug,
  type PersonaReportAudience,
  businessVocabulary,
} from "@workspace/policy";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  db,
  bookingsTable,
  conversationsTable,
  businessMembershipsTable,
} from "@workspace/db";
import { getBusinessById } from "./businesses.service";
import { gatherMorningBriefingFacts } from "./morning-briefing.service";
import { listPendingLivProposals } from "./liv-mandate.service";

export function listPersonaReportsForRole(roleV2: string | null | undefined) {
  const audience = (roleV2 ?? "OWN") as PersonaReportAudience;
  const allowed = new Set<PersonaReportAudience>(["OWN", "ADM", "ADM-D", "STA", "REC", "OWNER_HOST"]);
  const key = allowed.has(audience) ? audience : "OWN";
  return listReportsForAudience(key);
}

export async function generatePersonaReport(
  businessId: string,
  slug: PersonaReportSlug,
  userId: string,
) {
  const def = getReportDefinition(slug);
  if (!def) return null;
  const biz = await getBusinessById(businessId);
  if (!biz) return null;

  const [membership] = await db
    .select({ roleV2: businessMembershipsTable.roleV2 })
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, userId),
      ),
    )
    .limit(1);
  const role = membership?.roleV2 ?? "OWN";
  if (!def.audiences.includes(role as PersonaReportAudience)) {
    return { forbidden: true as const, slug, role };
  }

  const vocab = businessVocabulary(biz.vertical, biz.category);
  const timezone = biz.timezone ?? "Europe/Dublin";
  const generatedAt = new Date().toISOString();

  if (slug === "owner_morning") {
    const briefing = await gatherMorningBriefingFacts(businessId, timezone);
    const proposals = await listPendingLivProposals(businessId, 5);
    return {
      slug,
      title: def.title,
      generatedAt,
      sections: [
        { heading: "Summary", body: briefing.summary },
        {
          heading: "Today",
          bullets: briefing.todayBookings.map(
            (b) => `${b.startAt.slice(11, 16)} — ${b.customerName} (${b.serviceName})`,
          ),
        },
        {
          heading: "Liv needs you",
          bullets:
            proposals.length > 0
              ? proposals.map((p) => p.outcomePreview ?? p.action)
              : ["No pending Liv proposals."],
        },
      ],
      stats: briefing.stats,
    };
  }

  if (slug === "manager_ops") {
    const pending = await listPendingLivProposals(businessId, 20);
    const [handedOff] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.businessId, businessId),
          eq(conversationsTable.status, "HANDED_OFF"),
        ),
      );
    return {
      slug,
      title: def.title,
      generatedAt,
      sections: [
        {
          heading: "Approvals",
          bullets:
            pending.length > 0
              ? pending.map((p) => `${p.action}: ${p.outcomePreview ?? p.reason}`)
              : ["Queue clear."],
        },
        {
          heading: "Handed-off inbox",
          body: `${handedOff?.count ?? 0} conversations need a human.`,
        },
      ],
    };
  }

  if (slug === "staff_day_sheet") {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const rows = await db
      .select({
        startAt: bookingsTable.startAt,
        status: bookingsTable.status,
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, businessId),
          gte(bookingsTable.startAt, start),
          lte(bookingsTable.startAt, end),
        ),
      )
      .orderBy(bookingsTable.startAt);
    return {
      slug,
      title: def.title,
      generatedAt,
      sections: [
        {
          heading: `Your ${vocab.serviceNoun}s today`,
          bullets:
            rows.length > 0
              ? rows.map((r) => `${r.startAt.toISOString().slice(11, 16)} — ${r.status}`)
              : ["Nothing on the books yet."],
        },
      ],
    };
  }

  if (slug === "owner_weekly") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        noShows: sql<number>`count(*) filter (where ${bookingsTable.status} = 'no_show')::int`,
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.businessId, businessId),
          gte(bookingsTable.startAt, weekAgo),
        ),
      );
    return {
      slug,
      title: def.title,
      generatedAt,
      sections: [
        {
          heading: "Last 7 days",
          body: `${stats?.total ?? 0} bookings · ${stats?.noShows ?? 0} no-shows`,
        },
        {
          heading: "Tip",
          body: `Review ${vocab.clientNoun} follow-ups in Inbox before Monday.`,
        },
      ],
    };
  }

  if (slug === "reception_handoffs") {
    const rows = await db
      .select({ id: conversationsTable.id, updatedAt: conversationsTable.updatedAt })
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.businessId, businessId),
          eq(conversationsTable.status, "HANDED_OFF"),
        ),
      )
      .limit(15);
    return {
      slug,
      title: def.title,
      generatedAt,
      sections: [
        {
          heading: "Waiting for you",
          bullets:
            rows.length > 0
              ? rows.map((r) => `Thread ${r.id.slice(0, 8)}…`)
              : ["Inbox clear."],
        },
      ],
    };
  }

  if (slug === "host_rent_roll") {
    const { getHostDashboardSummary } = await import("./chair-rental.service");
    const host = await getHostDashboardSummary(businessId);
    return {
      slug,
      title: def.title,
      generatedAt,
      sections: [
        {
          heading: "Rent roll",
          body: `${host.rentDueCount} due · €${(host.rentDueTotalMinor / 100).toFixed(2)} outstanding · ${host.activeChairs}/${host.totalChairs} chairs active`,
        },
        {
          heading: "Renters",
          bullets:
            host.renters.length > 0
              ? host.renters.map(
                  (r) =>
                    `${r.renter.name} (${r.chairLabel}) — ${r.rentStatus} · ${(r.weeklyRentMinor / 100).toFixed(2)} ${r.currency}/wk`,
                )
              : ["No active renters linked."],
        },
      ],
    };
  }

  if (slug === "accountant_preview") {
    const { buildAccountantPreview } = await import("./accountant-export.service");
    const preview = await buildAccountantPreview(businessId, 7);
    if (!preview) {
      return { slug, title: def.title, generatedAt, sections: [{ heading: "Error", body: "No data." }] };
    }
    return {
      slug,
      title: def.title,
      generatedAt,
      sections: [
        {
          heading: "Revenue (7 days)",
          body: `${preview.revenue.completedBookings} completed · ${(preview.revenue.grossMinor / 100).toFixed(2)} ${preview.revenue.currency} at list prices`,
        },
        {
          heading: "Payroll preflight",
          body: preview.payroll.preflightOk
            ? "Shifts look clean for export."
            : `${preview.payroll.issueCount} issue(s) — resolve before payroll export.`,
        },
        {
          heading: "Preview",
          bullets: preview.payroll.csvPreviewLines,
        },
        { heading: "Note", body: preview.disclaimer },
      ],
    };
  }

  return {
    slug,
    title: def.title,
    generatedAt,
    sections: [{ heading: "Report", body: "No data." }],
  };
}

export { listVerticalCoverage as listVerticalCoverageForOps } from "@workspace/policy";
