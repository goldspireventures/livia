import {
  db,
  auditLogTable,
  businessesTable,
  businessMembershipsTable,
  staffTable,
  usersTable,
} from "@workspace/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
export type GraduationSuggestion = {
  id: string;
  title: string;
  summary: string;
  whyNow: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  status: string;
  priority: number;
};
import { getBusinessesForUser } from "./businesses.service";
import { getBusinessById } from "./businesses.service";

type LifecycleContext = {
  businessId: string;
  tier: string;
  planId: string | null;
  staffCount: number;
  adminCount: number;
  ownerBusinessCount: number;
  role: "OWNER" | "ADMIN" | "STAFF" | null;
};

export async function getLifecycleForBusiness(
  userId: string,
  businessId: string,
): Promise<{ context: LifecycleContext; suggestions: GraduationSuggestion[] }> {
  const biz = await getBusinessById(businessId);
  if (!biz) {
    throw new Error("Business not found");
  }

  const role = await resolveRoleForUser(userId, businessId);
  const staffRows = await db
    .select({ id: staffTable.id })
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));
  const memberships = await db
    .select({ role: businessMembershipsTable.role })
    .from(businessMembershipsTable)
    .where(eq(businessMembershipsTable.businessId, businessId));

  const adminCount = memberships.filter((m) => m.role === "ADMIN").length;
  const owned = await getBusinessesForUser(userId);
  const ownerBusinessCount = owned.filter((b) => b.ownerId === userId).length;

  const context: LifecycleContext = {
    businessId,
    tier: biz.tier,
    planId: biz.planId,
    staffCount: staffRows.length,
    adminCount,
    ownerBusinessCount,
    role,
  };

  const suggestions = buildGraduationSuggestions(context);
  return { context, suggestions };
}

export type PendingRitual = {
  type: "keys_changed";
  businessId: string;
  transferredAt: string;
};

export async function getPendingRitualsForUser(userId: string): Promise<PendingRitual[]> {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const rows = await db
    .select({
      businessId: auditLogTable.businessId,
      occurredAt: auditLogTable.occurredAt,
      payload: auditLogTable.payload,
    })
    .from(auditLogTable)
    .where(
      and(
        eq(auditLogTable.actionClass, "tenant.ownership_transferred"),
        gte(auditLogTable.occurredAt, since),
        sql`${auditLogTable.payload}->>'newOwnerId' = ${userId}`,
      ),
    )
    .orderBy(desc(auditLogTable.occurredAt))
    .limit(3);

  return rows.map((r) => ({
    type: "keys_changed" as const,
    businessId: r.businessId,
    transferredAt: r.occurredAt.toISOString(),
  }));
}

export async function getLifecycleForUser(userId: string): Promise<{
  ownerBusinessCount: number;
  suggestions: GraduationSuggestion[];
  pendingRituals: PendingRitual[];
}> {
  const owned = await getBusinessesForUser(userId);
  const ownerShops = owned.filter((b) => b.ownerId === userId);
  const ownerBusinessCount = ownerShops.length;

  const allSuggestions: GraduationSuggestion[] = [];

  if (ownerBusinessCount >= 2) {
    allSuggestions.push({
      id: "G3",
      title: "Multi-location founder",
      summary: "You run more than one shop — use the chain glance and per-shop billing.",
      whyNow: `${ownerBusinessCount} locations under your ownership.`,
      primaryCta: { label: "Open chain glance", href: "/chain" },
      secondaryCta: { label: "Chain checklist", href: "/lifecycle#chain" },
      status: "in_progress",
      priority: 90,
    });
  }

  for (const shop of ownerShops.slice(0, 3)) {
    const { suggestions } = await getLifecycleForBusiness(userId, shop.id);
    for (const s of suggestions) {
      if (!allSuggestions.some((x) => x.id === s.id && x.primaryCta.href === s.primaryCta.href)) {
        allSuggestions.push(s);
      }
    }
  }

  allSuggestions.sort((a, b) => b.priority - a.priority);
  const pendingRituals = await getPendingRitualsForUser(userId);
  return { ownerBusinessCount, suggestions: allSuggestions, pendingRituals };
}

async function resolveRoleForUser(
  userId: string,
  businessId: string,
): Promise<"OWNER" | "ADMIN" | "STAFF" | null> {
  const [biz] = await db
    .select({ ownerId: businessesTable.ownerId })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  if (!biz) return null;
  if (biz.ownerId === userId) return "OWNER";
  const [mem] = await db
    .select({ role: businessMembershipsTable.role })
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, userId),
      ),
    );
  return (mem?.role as "OWNER" | "ADMIN" | "STAFF" | undefined) ?? null;
}

function buildGraduationSuggestions(ctx: LifecycleContext): GraduationSuggestion[] {
  const out: GraduationSuggestion[] = [];
  if (ctx.role !== "OWNER") return out;

  if (ctx.staffCount >= 1 && ctx.tier === "solo") {
    out.push({
      id: "G1",
      title: "First hire on board",
      summary: "You have team members — Studio tier unlocks manager workflows and per-seat Liv.",
      whyNow: `${ctx.staffCount} active staff on a Solo configuration.`,
      primaryCta: { label: "Review billing", href: "/settings?tab=billing" },
      secondaryCta: { label: "Invite team", href: "/staff" },
      status: "suggested",
      priority: 70,
    });
  }

  if (ctx.adminCount >= 1 && ctx.tier === "solo") {
    out.push({
      id: "G2",
      title: "Manager in the building",
      summary: "A manager can run the inbox and cap ladder — you ratify what only you should.",
      whyNow: `${ctx.adminCount} admin seat(s) — consider Studio plan and cap-ladder setup.`,
      primaryCta: { label: "Open inbox", href: "/inbox" },
      secondaryCta: { label: "Settings", href: "/settings" },
      status: "suggested",
      priority: 75,
    });
  }

  if (ctx.ownerBusinessCount === 1 && (ctx.tier === "studio" || ctx.tier === "solo")) {
    out.push({
      id: "G3",
      title: "Ready for shop two?",
      summary: "Add another location — chain glance, per-shop billing, staged onboarding.",
      whyNow: "Single location today; chain tools activate when you own a second shop.",
      primaryCta: {
        label: "Add a location",
        href: "/onboarding?intent=second-shop",
      },
      secondaryCta: { label: "Chain checklist", href: "/lifecycle#chain" },
      status: "suggested",
      priority: 60,
    });
  }

  if (ctx.tier === "chair-host") {
    out.push({
      id: "G5",
      title: "Chair-rental host",
      summary: "Walk renters through data ownership — mandatory trust step.",
      whyNow: "Host configuration detected.",
      primaryCta: { label: "Team & renters", href: "/staff" },
      status: "suggested",
      priority: 55,
    });
  }

  out.push({
    id: "G8",
    title: "Ownership & succession",
    summary: "Selling the business or handing keys to your manager? Transfer ownership with a full audit trail.",
    whyNow: "Documented in Settings — never share accounts.",
    primaryCta: { label: "Transfer ownership", href: "/settings?tab=ownership" },
    status: "suggested",
    priority: 40,
  });

  return out.sort((a, b) => b.priority - a.priority);
}

/** Members eligible to receive ownership (ADMIN or STAFF with user link). */
export async function listOwnershipCandidates(businessId: string, ownerId: string) {
  const rows = await db
    .select({
      userId: businessMembershipsTable.userId,
      role: businessMembershipsTable.role,
      scope: businessMembershipsTable.scope,
      email: usersTable.email,
      fullName: usersTable.fullName,
    })
    .from(businessMembershipsTable)
    .innerJoin(usersTable, eq(usersTable.id, businessMembershipsTable.userId))
    .where(eq(businessMembershipsTable.businessId, businessId));

  return rows
    .filter((r) => r.userId !== ownerId && (r.role === "ADMIN" || r.role === "STAFF"))
    .map((r) => ({
      userId: r.userId,
      role: r.role,
      email: r.email,
      fullName: r.fullName,
      deskRole:
        (r.scope as { deskRole?: string } | null)?.deskRole === "reception"
          ? ("reception" as const)
          : ("manager" as const),
    }));
}
