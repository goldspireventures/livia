import {
  db,
  businessesTable,
  usersTable,
  bookingsTable,
  messageLogsTable,
  staffTable,
} from "@workspace/db";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { tenantHasEntitlementForBusiness } from "./billing.service";
import { getDashboardUrl } from "../lib/public-urls";

export type InternalTenantListItem = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerEmail: string | null;
  planId: string | null;
  stripeSubscriptionStatus: string | null;
  createdAt: string;
  lastBookingAt: string | null;
};

export type InternalTenantDetail = InternalTenantListItem & {
  email: string | null;
  phone: string | null;
  timezone: string;
  tier: string;
  vertical: string;
  aiEnabled: boolean;
  voiceProvisioned: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  twilioPhoneNumber: string | null;
  activeStaffCount: number;
  bookingCount: number;
  lastInboundSmsAt: string | null;
  voiceReceptionistEntitled: boolean;
  deepLinks: {
    stripeCustomer: string | null;
    clerkUser: string | null;
    tenantDashboard: string | null;
    publicBooking: string | null;
    sentry: string | null;
  };
  supportDocLinks: Array<{ label: string; path: string }>;
};

function tenantDashboardBase(): string {
  return getDashboardUrl();
}

function clerkUserDeepLink(clerkUserId: string): string | null {
  const prefix = process.env["CLERK_DASHBOARD_USER_URL"];
  if (prefix) return `${prefix.replace(/\/+$/, "")}/${encodeURIComponent(clerkUserId)}`;
  return `https://dashboard.clerk.com/users/${encodeURIComponent(clerkUserId)}`;
}

function stripeCustomerDeepLink(customerId: string): string {
  return `https://dashboard.stripe.com/customers/${encodeURIComponent(customerId)}`;
}

function sentryTenantSearchUrl(businessId: string): string | null {
  const org = process.env.SENTRY_ORG_SLUG?.trim();
  const project = process.env.SENTRY_PROJECT_SLUG?.trim();
  if (!org || !project) return null;
  return `https://sentry.io/organizations/${org}/issues/?query=tenant_id%3A${encodeURIComponent(businessId)}`;
}

export async function searchInternalTenants(opts: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: InternalTenantListItem[]; total: number }> {
  const { q, limit = 25, offset = 0 } = opts;
  const conditions = [];

  if (q?.trim()) {
    const pattern = `%${q.trim().replace(/%/g, "\\%")}%`;
    conditions.push(
      or(
        ilike(businessesTable.name, pattern),
        ilike(businessesTable.slug, pattern),
        ilike(businessesTable.email, pattern),
        ilike(businessesTable.stripeCustomerId, pattern),
        ilike(businessesTable.ownerId, pattern),
        ilike(usersTable.email, pattern),
      )!,
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const lastBookingSub = db
    .select({
      businessId: bookingsTable.businessId,
      lastAt: sql<Date>`max(${bookingsTable.startAt})`.as("last_at"),
    })
    .from(bookingsTable)
    .groupBy(bookingsTable.businessId)
    .as("lb");

  const baseQuery = db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      slug: businessesTable.slug,
      ownerId: businessesTable.ownerId,
      ownerEmail: usersTable.email,
      planId: businessesTable.planId,
      stripeSubscriptionStatus: businessesTable.stripeSubscriptionStatus,
      createdAt: businessesTable.createdAt,
      lastBookingAt: lastBookingSub.lastAt,
    })
    .from(businessesTable)
    .leftJoin(usersTable, eq(usersTable.id, businessesTable.ownerId))
    .leftJoin(lastBookingSub, eq(lastBookingSub.businessId, businessesTable.id));

  const rows = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
    .orderBy(desc(businessesTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(businessesTable)
    .leftJoin(usersTable, eq(usersTable.id, businessesTable.ownerId))
    .where(whereClause);

  return {
    total: countRow?.count ?? 0,
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      ownerId: r.ownerId,
      ownerEmail: r.ownerEmail,
      planId: r.planId,
      stripeSubscriptionStatus: r.stripeSubscriptionStatus,
      createdAt: r.createdAt.toISOString(),
      lastBookingAt: r.lastBookingAt ? new Date(r.lastBookingAt).toISOString() : null,
    })),
  };
}

export async function getInternalTenantDetail(
  businessId: string,
): Promise<InternalTenantDetail | null> {
  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  if (!biz) return null;

  const [owner] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, biz.ownerId));

  const [lastBooking] = await db
    .select({ startAt: bookingsTable.startAt })
    .from(bookingsTable)
    .where(eq(bookingsTable.businessId, businessId))
    .orderBy(desc(bookingsTable.startAt))
    .limit(1);

  const [bookingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(eq(bookingsTable.businessId, businessId));

  const [staffCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));

  const [lastSms] = await db
    .select({ createdAt: messageLogsTable.createdAt })
    .from(messageLogsTable)
    .where(
      and(
        eq(messageLogsTable.businessId, businessId),
        eq(messageLogsTable.channelType, "SMS"),
        eq(messageLogsTable.direction, "INBOUND"),
      ),
    )
    .orderBy(desc(messageLogsTable.createdAt))
    .limit(1);

  const voiceEntitled = await tenantHasEntitlementForBusiness(businessId, "voice_receptionist");

  const dashBase = tenantDashboardBase();
  const publicBase = process.env["PUBLIC_BASE_URL"]?.replace(/\/+$/, "");

  return {
    id: biz.id,
    name: biz.name,
    slug: biz.slug,
    ownerId: biz.ownerId,
    ownerEmail: owner?.email ?? null,
    planId: biz.planId,
    stripeSubscriptionStatus: biz.stripeSubscriptionStatus,
    createdAt: biz.createdAt.toISOString(),
    lastBookingAt: lastBooking?.startAt ? lastBooking.startAt.toISOString() : null,
    email: biz.email,
    phone: biz.phone,
    timezone: biz.timezone,
    tier: biz.tier,
    vertical: biz.vertical,
    aiEnabled: (biz.aiEnabled ?? "true") === "true",
    voiceProvisioned: Boolean(biz.twilioPhoneNumber),
    stripeCustomerId: biz.stripeCustomerId,
    stripeSubscriptionId: biz.stripeSubscriptionId,
    twilioPhoneNumber: biz.twilioPhoneNumber,
    activeStaffCount: staffCount?.count ?? 0,
    bookingCount: bookingCount?.count ?? 0,
    lastInboundSmsAt: lastSms?.createdAt ? lastSms.createdAt.toISOString() : null,
    voiceReceptionistEntitled: voiceEntitled,
    deepLinks: {
      stripeCustomer: biz.stripeCustomerId
        ? stripeCustomerDeepLink(biz.stripeCustomerId)
        : null,
      clerkUser: clerkUserDeepLink(biz.ownerId),
      tenantDashboard: dashBase ? `${dashBase}/dashboard` : null,
      publicBooking: publicBase ? `${publicBase}/b/${biz.slug}` : `/b/${biz.slug}`,
      sentry: sentryTenantSearchUrl(biz.id),
    },
    supportDocLinks: [
      { label: "Support runbook", path: "operations/SUPPORT-RUNBOOK.md" },
      { label: "Operator ready pack", path: "business/OPERATOR-READY-PACK.md" },
      { label: "Incident response", path: "engineering/incident-response.md" },
      { label: "Beta showcase program", path: "product/BETA-SHOWCASE-PROGRAM.md" },
      { label: "Vertical coverage", path: "product/BETA-SHOWCASE-PROGRAM.md" },
    ],
  };
}

/** @deprecated Use buildInternalSupportBundle — kept for route compat. */
export async function buildSupportContext(businessId: string) {
  const { buildInternalSupportBundle } = await import("./internal-support-bundle.service");
  const bundle = await buildInternalSupportBundle(businessId);
  if (!bundle) return null;
  return {
    businessId,
    impersonationPolicy: bundle.impersonationPolicy,
    note: bundle.suggestedReplySnippets.join(" "),
    bundle,
  };
}
