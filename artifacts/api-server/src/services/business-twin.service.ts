/**
 * Business Twin — read-only understanding layer (Volume D).
 * References facts from DB/services; never duplicates domain data.
 */
import { db, visitFeedbackTable } from "@workspace/db";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDashboardSummary } from "./dashboard.service";
import { getBusinessActivationSnapshot } from "./activation-metrics.service";
import { getTenantCapabilities } from "./capability-resolution.service";
import { listActiveLivMoments } from "./liv-signals.service";
import {
  capabilityBlockerHref,
  enrichTwinDomainsWithTrajectory,
  summarizeCapabilityHealth,
  topCommerceSignal,
  type TwinDomainTrajectory,
} from "@workspace/policy";
import {
  formatCommerceMinor,
  getCommerceSnapshot,
} from "./commerce-intelligence.service";
import { getCommerceSignalsBundle } from "./commerce-signals.service";

export type TwinDomainId =
  | "operational"
  | "revenue"
  | "relationship"
  | "trust"
  | "growth"
  | "capability";

export type TwinFact = {
  key: string;
  label: string;
  value: string | number;
  domain: TwinDomainId;
};

type TwinDomainScoreBase = {
  domain: TwinDomainId;
  score: number;
  label: string;
  summary: string;
};

export type TwinDomainScore = TwinDomainScoreBase & {
  trajectory: TwinDomainTrajectory;
};

export type TwinRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  href?: string;
  domain: TwinDomainId;
  evidence: string[];
};

export type BusinessTwinSummary = {
  businessId: string;
  generatedAt: string;
  headline: string;
  subline: string;
  facts: TwinFact[];
  activationStatus: string;
  sacredMetricMet: boolean;
  commerce?: {
    capturedMinor30d: number;
    captureRatePercent: number | null;
    paymentCount30d: number;
    currency: string;
    capturedLabel: string;
  };
};

export type BusinessTwinHealth = {
  businessId: string;
  generatedAt: string;
  overallScore: number;
  domains: TwinDomainScore[];
};

export type BusinessTwinRecommendations = {
  businessId: string;
  generatedAt: string;
  recommendations: TwinRecommendation[];
};

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreOperational(args: {
  todayBookings: number;
  pendingCount: number;
  weekBookings: number;
}): TwinDomainScoreBase {
  let score = 55;
  if (args.todayBookings > 0) score += 20;
  if (args.weekBookings >= 5) score += 15;
  if (args.pendingCount === 0) score += 10;
  else if (args.pendingCount > 3) score -= 15;

  const summary =
    args.pendingCount > 0
      ? `${args.pendingCount} booking${args.pendingCount === 1 ? "" : "s"} need confirmation.`
      : args.todayBookings > 0
        ? `${args.todayBookings} on the books today — schedule looks healthy.`
        : "Quiet day — calendar is clear.";

  return {
    domain: "operational",
    score: clampScore(score),
    label: "Operational health",
    summary,
  };
}

function scoreRevenue(args: {
  weekBookings: number;
  voiceRecoveredValueEurCents: number;
  paymentsConnected: boolean;
  capturedMinor30d: number;
  captureRatePercent: number | null;
  paymentCount30d: number;
  currency: string;
}): TwinDomainScoreBase {
  let score = 40;
  if (args.weekBookings >= 3) score += 25;
  if (args.weekBookings >= 10) score += 15;
  if (args.voiceRecoveredValueEurCents > 0) score += 10;
  if (args.paymentsConnected) score += 10;
  if (args.capturedMinor30d > 0) score += 15;
  if (args.paymentCount30d >= 5) score += 10;
  if (args.captureRatePercent != null && args.captureRatePercent < 70) score -= 12;

  let summary: string;
  if (args.capturedMinor30d > 0) {
    summary = `${formatCommerceMinor(args.capturedMinor30d, args.currency)} captured (30d) · ${args.paymentCount30d} payment${args.paymentCount30d === 1 ? "" : "s"}.`;
  } else if (args.weekBookings > 0) {
    summary = `${args.weekBookings} upcoming booking${args.weekBookings === 1 ? "" : "s"} this week — no captured payments yet.`;
  } else {
    summary = "No forward bookings yet — focus on activation and public link.";
  }

  return {
    domain: "revenue",
    score: clampScore(score),
    label: "Revenue health",
    summary,
  };
}

function scoreRelationship(args: {
  totalCustomers: number;
  openThreads: number;
  atRiskCount?: number;
}): TwinDomainScoreBase {
  let score = 35;
  if (args.totalCustomers >= 10) score += 25;
  if (args.totalCustomers >= 50) score += 15;
  if (args.openThreads > 0 && args.openThreads <= 5) score += 10;
  if (args.openThreads > 8) score -= 10;
  const atRisk = Math.max(0, args.atRiskCount ?? 0);
  if (atRisk > 0) score -= Math.min(25, atRisk * 8);

  const summary =
    atRisk > 0
      ? `${atRisk} guest${atRisk === 1 ? "" : "s"} drifting — no visit in 60+ days.`
      : args.totalCustomers > 0
        ? `${args.totalCustomers} guest${args.totalCustomers === 1 ? "" : "s"} on file.`
        : "Guest book is empty — first bookings will seed relationships.";

  return {
    domain: "relationship",
    score: clampScore(score),
    label: "Relationship health",
    summary,
  };
}

function scoreTrust(args: { reviewCount: number; avgRating: number | null }): TwinDomainScoreBase {
  let score = 45;
  if (args.reviewCount >= 1) score += 20;
  if (args.reviewCount >= 5) score += 15;
  if (args.avgRating != null && args.avgRating >= 4.5) score += 15;
  else if (args.avgRating != null && args.avgRating < 3.5) score -= 15;

  return {
    domain: "trust",
    score: clampScore(score),
    label: "Trust health",
    summary:
      args.reviewCount > 0
        ? `${args.reviewCount} review${args.reviewCount === 1 ? "" : "s"}${args.avgRating != null ? ` · ${args.avgRating.toFixed(1)} avg` : ""}.`
        : "No visit feedback yet — request after completed visits.",
  };
}

function scoreGrowth(args: {
  sacredMetricMet: boolean;
  activationStepsComplete: number;
  activationStepsTotal: number;
}): TwinDomainScoreBase {
  let score = 30;
  if (args.activationStepsComplete >= 2) score += 20;
  if (args.sacredMetricMet) score += 40;
  else if (args.activationStepsComplete >= args.activationStepsTotal - 1) score += 15;

  return {
    domain: "growth",
    score: clampScore(score),
    label: "Growth health",
    summary: args.sacredMetricMet
      ? "Activated — first booking received."
      : `Setup ${args.activationStepsComplete}/${args.activationStepsTotal} — sacred metric is first real booking.`,
  };
}

function scoreCapability(args: {
  active: number;
  configured: number;
  installed: number;
  suspended: number;
  total: number;
  blockers: number;
}): TwinDomainScoreBase {
  if (args.total === 0) {
    return {
      domain: "capability",
      score: 50,
      label: "Capability health",
      summary: "Capability graph not resolved.",
    };
  }
  const ratio = (args.active * 1 + args.configured * 0.7 + args.installed * 0.4) / args.total;
  let score = clampScore(ratio * 100);
  if (args.blockers > 2) score -= 10;
  if (args.suspended > 0) score -= Math.min(20, args.suspended * 10);

  let summary: string;
  if (args.suspended > 0) {
    summary = `${args.suspended} capability${args.suspended === 1 ? "" : "ies"} paused by you.`;
  } else if (args.blockers > 0) {
    summary = `${args.blockers} capability blocker${args.blockers === 1 ? "" : "s"} — finish setup to go live.`;
  } else {
    summary = `${args.active} active · ${args.configured} configured of ${args.total} platform capabilities.`;
  }

  return {
    domain: "capability",
    score: clampScore(score),
    label: "Capability health",
    summary,
  };
}

async function feedbackStats(
  businessId: string,
): Promise<{ count: number; avgRating: number | null }> {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      avg: sql<number | null>`avg(${visitFeedbackTable.score})::float`,
    })
    .from(visitFeedbackTable)
    .where(
      and(
        eq(visitFeedbackTable.businessId, businessId),
        gte(visitFeedbackTable.createdAt, since),
      ),
    );
  return { count: row?.count ?? 0, avgRating: row?.avg ?? null };
}

export type BusinessTwinLoadContext = Awaited<ReturnType<typeof loadBusinessTwinContext>>;

export async function loadBusinessTwinContext(businessId: string) {
  const [summary, activation, capabilities, moments, reviews, commerceBundle] = await Promise.all([
    getDashboardSummary(businessId),
    getBusinessActivationSnapshot(businessId),
    getTenantCapabilities(businessId),
    listActiveLivMoments(businessId, 4),
    feedbackStats(businessId),
    getCommerceSignalsBundle(businessId),
  ]);

  const commerce = commerceBundle.snapshot;
  const commerceSignals = commerceBundle.signals;

  const openThreads = summary.handedOffCount ?? 0;

  const platformCaps = capabilities?.platformCapabilities ?? [];
  const capHealth = summarizeCapabilityHealth(platformCaps);

  return {
    summary,
    activation,
    capabilities,
    moments,
    reviews,
    commerce,
    commerceSignals,
    openThreads,
    capHealth,
    totalCaps: platformCaps.length,
  };
}

export function buildTwinSummaryFromContext(
  businessId: string,
  ctx: BusinessTwinLoadContext,
): BusinessTwinSummary | null {
  if (!ctx.capabilities) return null;

  const { summary, activation, moments } = ctx;
  const sacredMetricMet = activation?.sacredMetricMet ?? false;

  const facts: TwinFact[] = [
    {
      key: "today_bookings",
      label: "Today",
      value: summary.todayBookings,
      domain: "operational",
    },
    {
      key: "week_bookings",
      label: "This week",
      value: summary.weekBookings,
      domain: "operational",
    },
    {
      key: "pending",
      label: "Pending",
      value: summary.pendingCount,
      domain: "operational",
    },
    {
      key: "customers",
      label: "Guests",
      value: summary.totalCustomers,
      domain: "relationship",
    },
    {
      key: "visit_feedback",
      label: "Visit feedback (90d)",
      value: ctx.reviews.count,
      domain: "trust",
    },
    {
      key: "capability_active",
      label: "Active capabilities",
      value: ctx.capHealth.active,
      domain: "capability",
    },
    {
      key: "revenue_30d",
      label: "Captured (30d)",
      value: formatCommerceMinor(ctx.commerce.capturedMinor30d, ctx.commerce.currency),
      domain: "revenue",
    },
  ];

  let headline = "Your shop is taking shape.";
  let subline = "Liv is watching calendar, inbox, and setup progress.";

  if (ctx.capHealth.suspended > 0 && !sacredMetricMet) {
    headline = `${ctx.capHealth.suspended} capability${ctx.capHealth.suspended === 1 ? "" : "ies"} paused.`;
    subline = "Resume when ready — Liv won't auto-enable paused capabilities.";
  } else if (ctx.capHealth.blockerCount > 0 && !sacredMetricMet) {
    headline = `${ctx.capHealth.blockerCount} setup blocker${ctx.capHealth.blockerCount === 1 ? "" : "s"} on your capability graph.`;
    subline =
      ctx.capabilities?.platformCapabilities.find((c) => c.readinessBlockers[0])
        ?.readinessBlockers[0] ?? "Finish capability readiness to go fully live.";
  } else if (sacredMetricMet) {
    headline = "You're live — bookings are flowing.";
    subline = activation?.timeToFirstBookingLabel
      ? `Activated in ${activation.timeToFirstBookingLabel}.`
      : "Live with your first booking.";
  } else if ((activation?.status ?? "") === "in_progress") {
    headline = "Almost live — finish setup for your first booking.";
    subline = `${activation?.activationStepsTotal! - activation?.activationStepsComplete!} step(s) left on the activation path.`;
  } else if (summary.pendingCount > 0) {
    headline = `${summary.pendingCount} booking${summary.pendingCount === 1 ? "" : "s"} need you.`;
    subline = "Confirm or adjust before guests arrive.";
  } else if ((summary.lowFeedbackCount ?? 0) > 0) {
    headline = `${summary.lowFeedbackCount} low visit score${summary.lowFeedbackCount === 1 ? "" : "s"} need follow-up.`;
    subline = "Reach out while the visit is still fresh.";
  } else if ((summary.atRiskGuests?.length ?? 0) > 0) {
    const n = summary.atRiskGuests!.length;
    headline = `${n} guest${n === 1 ? "" : "s"} drifting — time to reconnect.`;
    subline = summary.atRiskGuests![0]?.headline ?? "No upcoming booking on file.";
  } else if (moments.some((m) => m.priority === "act")) {
    headline = "Liv flagged something that needs attention.";
    subline = moments.find((m) => m.priority === "act")?.title ?? "Check today's queue.";
  } else if (
    summary.pendingCount === 0 &&
    (summary.handedOffCount ?? 0) === 0
  ) {
    const top = topCommerceSignal(ctx.commerceSignals);
    if (top && top.severity !== "info") {
      headline = top.title;
      subline = top.body;
    }
  }

  return {
    businessId,
    generatedAt: new Date().toISOString(),
    headline,
    subline,
    facts,
    activationStatus: activation?.status ?? "not_started",
    sacredMetricMet,
    commerce: {
      capturedMinor30d: ctx.commerce.capturedMinor30d,
      captureRatePercent: ctx.commerce.captureRatePercent,
      paymentCount30d: ctx.commerce.paymentCount30d,
      currency: ctx.commerce.currency,
      capturedLabel: formatCommerceMinor(ctx.commerce.capturedMinor30d, ctx.commerce.currency),
    },
  };
}

export async function getBusinessTwinSummary(
  businessId: string,
): Promise<BusinessTwinSummary | null> {
  const ctx = await loadBusinessTwinContext(businessId);
  return buildTwinSummaryFromContext(businessId, ctx);
}

export function buildTwinRecommendationsFromContext(
  businessId: string,
  ctx: BusinessTwinLoadContext,
): BusinessTwinRecommendations | null {
  if (!ctx.capabilities) return null;

  const recs: TwinRecommendation[] = [];

  const commerceSignals = ctx.commerceSignals;
  for (const signal of commerceSignals.filter((s) => s.severity !== "info")) {
    recs.push({
      id: `commerce-${signal.id}`,
      priority: signal.severity === "act" ? "high" : "medium",
      title: signal.title,
      reason: signal.body,
      href: signal.href,
      domain: "revenue",
      evidence: [signal.id],
    });
  }

  if (!ctx.activation?.sacredMetricMet) {
    recs.push({
      id: "sacred-metric",
      priority: "high",
      title: "Get your first real booking",
      reason: "V1 activation — this is the sacred metric.",
      href: "/bookings/new",
      domain: "growth",
      evidence: ["Activation not complete"],
    });
  }

  for (const cap of ctx.capabilities.platformCapabilities) {
    if (cap.state === "suspended") {
      recs.push({
        id: `cap-suspended-${cap.id}`,
        priority: "medium",
        title: `Resume ${cap.name}`,
        reason: "You paused this capability — resume when ready to use it again.",
        href: "/settings",
        domain: "capability",
        evidence: [cap.id, "suspended"],
      });
      continue;
    }
    for (const blocker of cap.readinessBlockers.slice(0, 1)) {
      recs.push({
        id: `cap-${cap.id}`,
        priority: cap.v1 ? "high" : "medium",
        title: blocker,
        reason: `${cap.name} is ${cap.state}${cap.readinessMet ? "" : " — readiness not met"}.`,
        href: capabilityBlockerHref(cap.id, blocker),
        domain: "capability",
        evidence: [cap.id, cap.state, ...(cap.readinessBlockers ?? [])],
      });
    }
    if (
      cap.readinessBlockers.length === 0 &&
      cap.state === "installed" &&
      cap.v1
    ) {
      recs.push({
        id: `cap-ready-${cap.id}`,
        priority: "low",
        title: `Finish configuring ${cap.name}`,
        reason: "Installed but not yet active on your graph.",
        href: capabilityBlockerHref(cap.id, cap.name),
        domain: "capability",
        evidence: [cap.id, cap.state],
      });
    }
  }

  if (ctx.summary.pendingCount > 0) {
    recs.push({
      id: "pending-bookings",
      priority: "high",
      title: `Confirm ${ctx.summary.pendingCount} pending booking${ctx.summary.pendingCount === 1 ? "" : "s"}`,
      reason: "Guests may be waiting on confirmation.",
      href: "/bookings?status=PENDING",
      domain: "operational",
      evidence: [`pending:${ctx.summary.pendingCount}`],
    });
  }

  const lowFeedback = ctx.summary.lowFeedbackCount ?? 0;
  if (lowFeedback > 0) {
    recs.push({
      id: "low-visit-feedback",
      priority: "high",
      title: `Follow up on ${lowFeedback} low score${lowFeedback === 1 ? "" : "s"}`,
      reason: "Post-visit scores ≤3 often need a personal touch.",
      href: "/dashboard",
      domain: "trust",
      evidence: [`lowFeedback:${lowFeedback}`],
    });
  }

  const atRisk = ctx.summary.atRiskGuests ?? [];
  if (atRisk.length > 0) {
    recs.push({
      id: "at-risk-guests",
      priority: "medium",
      title: `Reconnect with ${atRisk.length} guest${atRisk.length === 1 ? "" : "s"}`,
      reason: atRisk[0]?.headline ?? "Guests with no visit in 60+ days and no upcoming booking.",
      href: "/customers",
      domain: "relationship",
      evidence: atRisk.map((g) => g.customerId),
    });
  }

  if (ctx.reviews.count === 0 && ctx.activation?.sacredMetricMet) {
    recs.push({
      id: "request-reviews",
      priority: "low",
      title: "Collect visit feedback after completions",
      reason: "Trust signals improve retention and public proof.",
      href: "/customers",
      domain: "trust",
      evidence: ["reviews:0"],
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    businessId,
    generatedAt: new Date().toISOString(),
    recommendations: recs.slice(0, 8),
  };
}

export function buildTwinHealthFromContext(
  businessId: string,
  ctx: BusinessTwinLoadContext,
  opts?: {
    risks?: Array<{ domain: TwinDomainId }>;
    opportunities?: Array<{ domain: TwinDomainId }>;
  },
): BusinessTwinHealth | null {
  if (!ctx.capabilities) return null;

  const { summary, activation, reviews } = ctx;

  const baseDomains = [
    scoreOperational({
      todayBookings: summary.todayBookings,
      pendingCount: summary.pendingCount,
      weekBookings: summary.weekBookings,
    }),
    scoreRevenue({
      weekBookings: summary.weekBookings,
      voiceRecoveredValueEurCents: summary.voiceRecoveredValueEurCents ?? 0,
      paymentsConnected: activation?.paymentsConnected ?? false,
      capturedMinor30d: ctx.commerce.capturedMinor30d,
      captureRatePercent: ctx.commerce.captureRatePercent,
      paymentCount30d: ctx.commerce.paymentCount30d,
      currency: ctx.commerce.currency,
    }),
    scoreRelationship({
      totalCustomers: summary.totalCustomers,
      openThreads: ctx.openThreads,
      atRiskCount: summary.atRiskGuests?.length ?? 0,
    }),
    scoreTrust({
      reviewCount: reviews.count,
      avgRating: reviews.avgRating,
    }),
    scoreGrowth({
      sacredMetricMet: activation?.sacredMetricMet ?? false,
      activationStepsComplete: activation?.activationStepsComplete ?? 0,
      activationStepsTotal: activation?.activationStepsTotal ?? 5,
    }),
    scoreCapability({
      active: ctx.capHealth.active,
      configured: ctx.capHealth.configured,
      installed: ctx.capHealth.installed,
      suspended: ctx.capHealth.suspended,
      total: ctx.capHealth.total,
      blockers: ctx.capHealth.blockerCount,
    }),
  ];

  const domains = enrichTwinDomainsWithTrajectory({
    domains: baseDomains,
    risks: opts?.risks,
    opportunities: opts?.opportunities,
  }).map((d) => ({
    domain: d.domain,
    score: d.score,
    label: baseDomains.find((b) => b.domain === d.domain)?.label ?? d.domain,
    summary: baseDomains.find((b) => b.domain === d.domain)?.summary ?? "",
    trajectory: d.trajectory,
  }));

  const overallScore = clampScore(
    domains.reduce((sum, d) => sum + d.score, 0) / domains.length,
  );

  return {
    businessId,
    generatedAt: new Date().toISOString(),
    overallScore,
    domains,
  };
}

export async function getBusinessTwinHealth(
  businessId: string,
): Promise<BusinessTwinHealth | null> {
  const ctx = await loadBusinessTwinContext(businessId);
  return buildTwinHealthFromContext(businessId, ctx);
}

export async function getBusinessTwinRecommendations(
  businessId: string,
): Promise<BusinessTwinRecommendations | null> {
  const ctx = await loadBusinessTwinContext(businessId);
  return buildTwinRecommendationsFromContext(businessId, ctx);
}

/** Compact twin context for Liv system prompts — advisor mode v1. */
export async function buildBusinessTwinPromptBlock(businessId: string): Promise<string> {
  const ctx = await loadBusinessTwinContext(businessId);
  const summary = buildTwinSummaryFromContext(businessId, ctx);
  const health = buildTwinHealthFromContext(businessId, ctx);
  const recs = buildTwinRecommendationsFromContext(businessId, ctx);
  if (!summary) return "";

  const lines: string[] = [
    "BUSINESS TWIN (read-only understanding — cite when advising owner):",
    `Headline: ${summary.headline}`,
    `Subline: ${summary.subline}`,
    `Activation: ${summary.activationStatus}${summary.sacredMetricMet ? " · sacred metric met" : ""}`,
  ];

  if (health?.domains?.length) {
    const domainLine = health.domains
      .map((d) => `${d.label} ${d.score}/100 — ${d.summary}`)
      .join("; ");
    lines.push(`Domain scores: ${domainLine}`);
  }

  const topRecs = recs?.recommendations?.slice(0, 4) ?? [];
  if (topRecs.length > 0) {
    lines.push(
      "Top recommendations:",
      ...topRecs.map((r) => `- [${r.priority}] ${r.title}: ${r.reason}`),
    );
  }

  lines.push("Use get_business_twin tool to refresh if the owner asks for an updated read.");
  return `\n\n${lines.join("\n")}\n`;
}
