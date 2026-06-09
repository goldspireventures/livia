import { createClerkClient } from "@clerk/express";
import {
  db,
  businessesTable,
  businessMembershipsTable,
  usersTable,
  staffTable,
  customersTable,
  bookingsTable,
  availabilityRulesTable,
  staffServicesTable,
  premisesTable,
  dayPackagesTable,
  dayPackageStepsTable,
  careSeriesTable,
  careSeriesSessionsTable,
} from "@workspace/db";
import { ONBOARDING_ACT_IDS, onboardingChecklistSchema } from "@workspace/policy";
import { and, eq, inArray } from "drizzle-orm";
import { generateId } from "../lib/id";
import { mapWithConcurrency, withClerkRetry } from "../lib/async-pool";
import { logger } from "../lib/logger";
import { appendHumanAudit } from "../lib/audit";
import { getOrCreateUser, updateUser } from "./users.service";
import {
  buildPlatformLegalAcceptance,
  hasCurrentPlatformLegal,
} from "../lib/platform-legal-gate";
import { createBusiness, getBusinessBySlug } from "./businesses.service";
import { resolveGuestBookUrl } from "../lib/guest-public-urls";
import { applyDemoPublicBranding, backfillAllDemoPublicBranding } from "../lib/demo-public-assets";
import { backfillDemoServiceImages } from "../lib/demo-service-images";
import { inferDemoServiceImageUrl } from "../lib/experience-skin";
import { createStaff, updateStaff } from "./staff.service";
import { createService } from "./services.service";
import {
  DEMO_PERSONAS,
  DEMO_WORLD_SLUGS,
  buildBusinessOwnerDef,
  buildDemoRoleDef,
  demoOwnerEmailForSlug,
  getDemoPersona,
  resolveClerkProvisioningDef,
  isDemoEmail,
  parseDemoTenantEmail,
  slugFromOwnerDemoEmail,
  type DemoPersonaDef,
  type DemoPersonaId,
  demoResponsesMayIncludeSecrets,
  type DemoTenantRole,
} from "../lib/demo-portal-config";
import { DEMO_SCENARIO_ACCOUNTS } from "../lib/demo-scenario-config";
import { syncDemoClerkUser, syncDemoClerkUserIfStale } from "../lib/demo-clerk-sync";
import { seedDemoInbox, seedExpandedBookings } from "./demo-inbox.seed";
import { seedDemoAuditTrail } from "./demo-audit.seed";
import { seedRealWorldScenarios, REAL_WORLD_PREMISES_SLUG } from "./demo-real-world-scenarios.seed";
import { seedVerticalShowcaseShops } from "./demo-vertical-shops.seed";
import { seedMarketShowcaseShops } from "./demo-market-shops.seed";
import { seedDemoLivSignalsForBusinesses } from "./demo-liv-signals.seed";
import { ensureLiveDayForBusiness, refreshDemoLiveDaysForSlugs } from "./demo-live-day.service";
import { seedDemoSupportTickets } from "./demo-support-tickets.seed";
import { ensureDemoOperationalCases } from "./demo-operational-cases.seed";
import { seedVerticalDemoExtras } from "./demo-vertical-extras.seed";
import { seedCountryDepthOnMarketShops } from "./demo-country-depth.seed";
import { seedDemoHierarchyLinks } from "./demo-hierarchy.seed";
import {
  demoScenarioSpotlights,
  resolveRosterOwnerEmail,
  isDemoChainHqSlug,
  rosterEntriesForSlug,
  seedDemoBusinessRosters,
} from "./demo-business-roster.seed";
import { getDashboardUrl, getInternalUrl, getMarketingUrl } from "../lib/public-urls";

function getClerk() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  return createClerkClient({ secretKey });
}

function getDemoPassword(): string {
  return process.env.LIVIA_DEMO_PASSWORD?.trim() || "LiviaDemo2026!";
}

function publicDemoPasswordHint(): string {
  if (demoResponsesMayIncludeSecrets()) {
    return "Use shared demo password from LIVIA_DEMO_PASSWORD (see docs)";
  }
  return "Demo credentials are not exposed via API in production.";
}

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

function makeDt(base: Date, daysOffset: number, hour: number, minute = 0) {
  const t = new Date(base);
  t.setDate(t.getDate() + daysOffset);
  t.setHours(hour, minute, 0, 0);
  return t;
}

type ClerkLikeError = {
  status?: number;
  message?: string;
  errors?: Array<{ code?: string; longMessage?: string; message?: string }>;
};

export function formatClerkDemoError(err: unknown): Error {
  const e = err as ClerkLikeError;
  const quota = e.errors?.find((x) => x.code === "user_quota_exceeded");
  if (quota) {
    return Object.assign(
      new Error(
        "Clerk dev user limit reached (100 users). Delete unused users in Clerk Dashboard → Users, then retry — or POST /api/demo/repair-db to seed shops using existing demo logins only.",
      ),
      { code: "CLERK_USER_QUOTA", status: 503 },
    );
  }
  if (e.status === 403 && /forbidden/i.test(e.message ?? "")) {
    return Object.assign(
      new Error(
        "Clerk rejected user creation (403). Often the dev instance user quota — try POST /api/demo/repair-db or free space in Clerk Dashboard → Users.",
      ),
      { code: "CLERK_FORBIDDEN", status: 503 },
    );
  }
  return err instanceof Error ? err : new Error(String(err));
}

async function ensureClerkUser(
  def: DemoPersonaDef,
  opts?: { create?: boolean },
): Promise<string | null> {
  if (!def.requiresClerk) return null;
  const clerk = getClerk();
  if (!clerk) {
    throw Object.assign(new Error("CLERK_SECRET_KEY required to provision demo users"), {
      code: "CLERK_NOT_CONFIGURED",
    });
  }
  const password = getDemoPassword();
  const existing = await clerk.users.getUserList({ emailAddress: [def.email], limit: 1 });
  if (existing.data[0]) {
    const id = existing.data[0].id;
    await syncDemoClerkUser(clerk, id, { email: def.email, password });
    return id;
  }
  if (opts?.create === false) {
    logger.warn({ email: def.email }, "demo.clerk.user_missing_skip_create");
    return null;
  }
  try {
    const created = await clerk.users.createUser({
      emailAddress: [def.email],
      firstName: def.firstName,
      lastName: def.lastName,
      password,
      skipPasswordChecks: true,
      skipPasswordRequirement: true,
    });
    await syncDemoClerkUser(clerk, created.id, { email: def.email, password });
    return created.id;
  } catch (err) {
    throw formatClerkDemoError(err);
  }
}

function getDemoAccountByEmail(email: string): DemoPersonaDef | undefined {
  const lower = email.toLowerCase();
  const staticDef =
    DEMO_PERSONAS.find((p) => p.email.toLowerCase() === lower) ??
    DEMO_SCENARIO_ACCOUNTS.find((p) => p.email.toLowerCase() === lower);
  if (staticDef) return staticDef;

  // Per-business demo owners are generated during provision (21 businesses).
  // Mobile sign-in uses the ticket flow for any `demo-*` email, so we must
  // resolve these dynamically as well.
  const slug = slugFromOwnerDemoEmail(lower);
  if (slug) {
    return buildBusinessOwnerDef(slug, `Demo ${slug}`);
  }

  const parsed = parseDemoTenantEmail(lower);
  if (parsed) {
    return buildDemoRoleDef(parsed.slug, parsed.role);
  }
  return undefined;
}

async function wireDemoAccountMemberships(
  def: DemoPersonaDef,
  userId: string,
  role: "OWNER" | "ADMIN" | "STAFF" = "OWNER",
): Promise<void> {
  for (const slug of def.businessSlugs) {
    const [biz] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.slug, slug))
      .limit(1);
    if (biz) await upsertMembership(biz.id, userId, def.membershipRole ?? role);
  }
}

async function wireScenarioMemberships(clerkIdsByEmail: Record<string, string>): Promise<void> {
  for (const def of DEMO_SCENARIO_ACCOUNTS) {
    const userId = clerkIdsByEmail[def.email];
    if (!userId) continue;
    await wireDemoAccountMemberships(def, userId, "OWNER");
  }
}

/** Ensure Clerk user + DB memberships exist (e.g. scenario added after last provision). */
async function ensureDemoAccountReady(def: DemoPersonaDef): Promise<string> {
  const clerkDef = resolveClerkProvisioningDef(def);
  let userId = await ensureClerkUser(clerkDef);
  if (!userId) {
    throw Object.assign(
      new Error(
        "Could not resolve demo Clerk user. Run Sync logins on /demo or POST /api/demo/repair-db.",
      ),
      { status: 500 },
    );
  }
  await ensureDemoPlatformLegal(userId, def.email, def.displayName);
  await wireDemoAccountMemberships(def, userId, def.membershipRole ?? "OWNER");
  if (def.membershipRole === "STAFF" || def.id === "staff-senior" || def.id === "staff-junior") {
    for (const slug of def.businessSlugs) {
      const [biz] = await db
        .select({ id: businessesTable.id })
        .from(businessesTable)
        .where(eq(businessesTable.slug, slug))
        .limit(1);
      if (!biz) continue;
      const staffQuery = def.staffDisplayName
        ? db
            .select({ id: staffTable.id })
            .from(staffTable)
            .where(
              and(eq(staffTable.businessId, biz.id), eq(staffTable.displayName, def.staffDisplayName)),
            )
            .limit(1)
        : db
            .select({ id: staffTable.id })
            .from(staffTable)
            .where(eq(staffTable.businessId, biz.id))
            .limit(1);
      const [staffRow] = await staffQuery;
      if (staffRow) {
        await updateStaff(biz.id, staffRow.id, { userId });
      }
    }
  }
  return userId;
}

/** Demo accounts skip the legal-acceptance screen — acceptance is recorded at provision/sign-in. */
async function ensureDemoPlatformLegal(
  userId: string,
  email?: string,
  fullName?: string,
) {
  await getOrCreateUser(userId, email, fullName);
  const [row] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (row && hasCurrentPlatformLegal(row.platformLegal)) return;
  await updateUser(userId, {
    platformLegal: buildPlatformLegalAcceptance("demo-provision"),
  });
}

/** Idempotent: wire Aurora child locations to HQ via parentBusinessId (chain graph). */
export async function linkDemoChainHierarchy(): Promise<number> {
  const [studio] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, "aurora-studio"))
    .limit(1);
  if (!studio) return 0;
  let updated = 0;
  for (const slug of ["aurora-mews", "aurora-galway"] as const) {
    const [row] = await db
      .select({ id: businessesTable.id, parentBusinessId: businessesTable.parentBusinessId })
      .from(businessesTable)
      .where(eq(businessesTable.slug, slug))
      .limit(1);
    if (!row) continue;
    if (row.parentBusinessId === studio.id) continue;
    await db
      .update(businessesTable)
      .set({
        parentBusinessId: studio.id,
        structureKind: "location",
        updatedAt: new Date(),
      })
      .where(eq(businessesTable.id, row.id));
    updated += 1;
  }
  return updated;
}

/** Demo tenants skip the onboarding wizard — owners land on dashboard/Liv. */
function buildDemoOnboardingCompleteState() {
  return {
    currentAct: "a12_go_live" as const,
    completedActs: [...ONBOARDING_ACT_IDS],
    percentComplete: 100,
    checklist: onboardingChecklistSchema.parse({
      testBooking: true,
      livEnabled: true,
      publicLinkShared: true,
      smsOrVoiceConnected: true,
      teamInvited: true,
      billingStarted: true,
      servicesConfirmed: true,
      hoursConfirmed: true,
      socialChannelsStarted: true,
    }),
    updatedAt: new Date().toISOString(),
  };
}

export async function markDemoBusinessesOnboardingComplete(
  slugs: readonly string[] = DEMO_WORLD_SLUGS,
): Promise<number> {
  const state = buildDemoOnboardingCompleteState();
  const rows = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(inArray(businessesTable.slug, [...slugs]));
  for (const row of rows) {
    await db
      .update(businessesTable)
      .set({
        onboardingState: state as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(businessesTable.id, row.id));
  }
  return rows.length;
}

async function upsertMembership(
  businessId: string,
  userId: string,
  role: "OWNER" | "ADMIN" | "STAFF",
) {
  const [existing] = await db
    .select()
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.userId, userId),
      ),
    );
  if (existing) {
    if (existing.role !== role) {
      await db
        .update(businessMembershipsTable)
        .set({ role, updatedAt: new Date() })
        .where(eq(businessMembershipsTable.id, existing.id));
    }
    return;
  }
  await db.insert(businessMembershipsTable).values({
    id: generateId(),
    businessId,
    userId,
    role,
  });
}

export async function seedShopCore(
  businessId: string,
  staffDefs: Array<{ firstName: string; lastName: string; displayName: string; email: string; color: string }>,
  serviceDefs: Array<{
    name: string;
    durationMinutes: number;
    priceMinor: number;
    sortOrder: number;
    category?: string;
    description?: string;
    imageUrl?: string;
    serviceKind?: string | null;
    rebookIntervalDays?: number | null;
    requiresPatchTest?: boolean;
  }>,
  vertical?: import("@workspace/policy").BusinessVertical,
) {
  const staffRows = await Promise.all(
    staffDefs.map((s) =>
      createStaff(businessId, {
        firstName: s.firstName,
        lastName: s.lastName,
        displayName: s.displayName,
        email: s.email,
        color: s.color,
      }),
    ),
  );
  const serviceRows = await Promise.all(
    serviceDefs.map((s) =>
      createService(businessId, {
        name: s.name,
        description: s.description,
        category: s.category,
        durationMinutes: s.durationMinutes,
        priceMinor: s.priceMinor,
        currency: "EUR",
        sortOrder: s.sortOrder,
        imageUrl:
          s.imageUrl ??
          inferDemoServiceImageUrl(s.name, vertical ?? undefined),
        serviceKind: s.serviceKind ?? null,
        rebookIntervalDays: s.rebookIntervalDays ?? null,
        requiresPatchTest: s.requiresPatchTest ?? false,
      }),
    ),
  );
  await db.insert(staffServicesTable).values(
    staffRows.flatMap((st) =>
      serviceRows.map((sv) => ({ staffId: st.id, serviceId: sv.id })),
    ),
  );
  const days = [1, 2, 3, 4, 5, 6];
  await db.insert(availabilityRulesTable).values(
    staffRows.flatMap((st) =>
      days.map((d) => ({
        id: generateId(),
        businessId,
        staffId: st.id,
        dayOfWeek: d,
        startTime: "09:00",
        endTime: "18:00",
      })),
    ),
  );
  const customerDefs =
    staffDefs.length >= 3
      ? [
          { first: "Mary", last: "McNamara", email: "mary.m@email.ie", phone: "+353 87 100 0001" },
          { first: "Sean", last: "Kelly", email: "sean.k@email.ie", phone: "+353 87 100 0002" },
          { first: "Orla", last: "Murphy", email: "orla.m@email.ie", phone: "+353 87 100 0003" },
          { first: "Cian", last: "Walsh", email: "cian.w@email.ie", phone: "+353 87 100 0004" },
          { first: "Niamh", last: "Brennan", email: "niamh.b@email.ie", phone: "+353 87 100 0005" },
          { first: "Liam", last: "O'Sullivan", email: "liam.o@email.ie", phone: "+353 87 100 0006" },
          { first: "Aoife", last: "Doyle", email: "aoife.d@email.ie", phone: "+353 87 100 0007" },
          { first: "Kate", last: "Ryan", email: "kate.r@email.ie", phone: "+353 87 100 0008" },
        ]
      : [
          { first: "Mary", last: "McNamara", email: "mary.m@email.ie", phone: "+353 87 100 0001" },
          { first: "Sean", last: "Kelly", email: "sean.k@email.ie", phone: "+353 87 100 0002" },
          { first: "Orla", last: "Murphy", email: "orla.m@email.ie", phone: "+353 87 100 0003" },
          { first: "Cian", last: "Walsh", email: "cian.w@email.ie", phone: "+353 87 100 0004" },
        ];

  const customers = await db
    .insert(customersTable)
    .values(
      customerDefs.map((c, idx) => ({
        id: generateId(),
        businessId,
        firstName: c.first,
        lastName: c.last,
        displayName: `${c.first} ${c.last}`,
        email: c.email,
        phone: c.phone,
        ...(vertical === "beauty" && idx === 0
          ? { patchTestCompletedAt: new Date(Date.now() - 3 * 24 * 60 * 60_000) }
          : {}),
      })),
    )
    .returning();
  const now = new Date();
  const s0 = staffRows[0]!;
  const s1 = staffRows[1] ?? s0;
  const v0 = serviceRows[0]!;
  const v1 = serviceRows[1] ?? v0;
  const bookingRows = [
    { ci: 0, staffId: s0.id, serviceId: v0.id, status: "CONFIRMED" as BookingStatus, daysOffset: 0, hour: 10 },
    { ci: 1, staffId: s1.id, serviceId: v1.id, status: "PENDING" as BookingStatus, daysOffset: 0, hour: 14 },
    { ci: 2, staffId: s0.id, serviceId: v0.id, status: "CONFIRMED" as BookingStatus, daysOffset: 1, hour: 11 },
    { ci: 0, staffId: s1.id, serviceId: v1.id, status: "COMPLETED" as BookingStatus, daysOffset: -1, hour: 15 },
    ...(vertical === "beauty"
      ? [
          {
            ci: 2,
            staffId: s0.id,
            serviceId: v0.id,
            status: "COMPLETED" as BookingStatus,
            daysOffset: -18,
            hour: 11,
          },
        ]
      : []),
  ];
  await db.insert(bookingsTable).values(
    bookingRows.map((b) => {
      const start = makeDt(now, b.daysOffset, b.hour);
      const dur = serviceRows.find((s) => s.id === b.serviceId)?.durationMinutes ?? 60;
      const end = new Date(start.getTime() + dur * 60_000);
      return {
        id: generateId(),
        businessId,
        customerId: customers[b.ci].id,
        staffId: b.staffId,
        serviceId: b.serviceId,
        status: b.status,
        startAt: start,
        endAt: end,
        channelType: "WEB" as const,
      };
    }),
  );
  return {
    staffRows,
    serviceRows,
    customers: customers.map((c) => ({
      id: c.id,
      displayName: c.displayName ?? `${c.firstName} ${c.lastName}`,
      email: c.email ?? "",
      phone: c.phone ?? "",
    })),
  };
}

export async function wipeDemoWorld(): Promise<void> {
  await db.delete(premisesTable).where(eq(premisesTable.slug, REAL_WORLD_PREMISES_SLUG));

  const demoBiz = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(inArray(businessesTable.slug, [...DEMO_WORLD_SLUGS]));
  const bizIds = demoBiz.map((b) => b.id);

  if (bizIds.length > 0) {
    const packages = await db
      .select({ id: dayPackagesTable.id })
      .from(dayPackagesTable)
      .where(inArray(dayPackagesTable.businessId, bizIds));
    const packageIds = packages.map((p) => p.id);
    if (packageIds.length > 0) {
      await db.delete(dayPackageStepsTable).where(inArray(dayPackageStepsTable.packageId, packageIds));
    }
    await db.delete(dayPackagesTable).where(inArray(dayPackagesTable.businessId, bizIds));

    const series = await db
      .select({ id: careSeriesTable.id })
      .from(careSeriesTable)
      .where(inArray(careSeriesTable.businessId, bizIds));
    const seriesIds = series.map((s) => s.id);
    if (seriesIds.length > 0) {
      await db
        .delete(careSeriesSessionsTable)
        .where(inArray(careSeriesSessionsTable.seriesId, seriesIds));
    }
    await db.delete(careSeriesTable).where(inArray(careSeriesTable.businessId, bizIds));
  }

  await db.delete(businessesTable).where(inArray(businessesTable.slug, [...DEMO_WORLD_SLUGS]));
}

async function ensureDemoBusiness(
  ownerId: string,
  data: Parameters<typeof createBusiness>[1],
  repair: boolean,
) {
  if (repair && data.slug) {
    const existing = await getBusinessBySlug(data.slug);
    if (existing) return existing;
  }
  return createBusiness(ownerId, data);
}

/** Repair on an already-provisioned demo world — refresh branding/data, no wipe, no new Clerk users. */
async function repairProvisionedDemoWorld(): Promise<{
  personas: Array<{ id: DemoPersonaId; email: string; clerkUserId: string | null }>;
  businesses: Array<{ slug: string; id: string; name: string }>;
  passwordHint: string;
  mode: "repair";
}> {
  const synced = await syncDemoWorld();
  const { seedDemoGuestHub } = await import("./demo-guest-hub.seed");
  const guestHub = await seedDemoGuestHub();
  logger.info(guestHub, "demo.guest_hub.seeded");

  const personas = await Promise.all(
    DEMO_PERSONAS.filter((p) => p.requiresClerk).map(async (p) => ({
      id: p.id,
      email: p.email,
      clerkUserId: (await ensureClerkUser(p, { create: false })) ?? null,
    })),
  );

  return {
    personas,
    businesses: synced.businesses,
    passwordHint: synced.passwordHint,
    mode: "repair",
  };
}

export async function provisionDemoWorld(opts?: {
  /** Seed DB + wire existing Clerk users — no wipe, no new Clerk users. */
  repair?: boolean;
}): Promise<{
  personas: Array<{ id: DemoPersonaId; email: string; clerkUserId: string | null }>;
  businesses: Array<{ slug: string; id: string; name: string }>;
  passwordHint: string;
  mode?: "full" | "repair";
}> {
  if (opts?.repair) {
    const status = await getDemoPortalStatus();
    if (status.provisioned) {
      return repairProvisionedDemoWorld();
    }
  }

  if (!opts?.repair) {
    await wipeDemoWorld();
  }

  const clerkIds: Record<string, string> = {};
  const clerkIdsByEmail: Record<string, string> = {};
  const allAccounts = [...DEMO_PERSONAS, ...DEMO_SCENARIO_ACCOUNTS];
  const clerkResults = await Promise.all(
    allAccounts
      .filter((def) => def.requiresClerk)
      .map(async (def) => {
        const id = await ensureClerkUser(def, { create: opts?.repair ? false : true });
        if (id) {
          await ensureDemoPlatformLegal(id, def.email, def.displayName);
        }
        return { def, id };
      }),
  );
  for (const { def, id } of clerkResults) {
    if (!id) continue;
    clerkIdsByEmail[def.email] = id;
    if (DEMO_PERSONAS.some((p) => p.email === def.email)) {
      clerkIds[def.id] = id;
    }
  }

  const orgAdminId = clerkIds.org_admin;
  const ownerId = clerkIds.owner;
  if (!orgAdminId || !ownerId) {
    throw new Error("Failed to provision org-admin/owner Clerk users");
  }

  const repair = !!opts?.repair;
  const auroraStudio = await ensureDemoBusiness(orgAdminId, {
    name: "Aurora Studio",
    slug: "aurora-studio",
    description: "Flagship colour and cut studio — Dublin city centre.",
    category: "hair_salon",
    email: "hello@aurora-studio.ie",
    phone: "+353 1 555 0100",
    timezone: "Europe/Dublin",
    city: "Dublin",
    country: "IE",
    tier: "studio",
  }, repair);
  const auroraMews = await ensureDemoBusiness(orgAdminId, {
    name: "Aurora Mews",
    slug: "aurora-mews",
    description: "Neighbourhood salon — Dublin south.",
    category: "hair_salon",
    email: "hello@aurora-mews.ie",
    timezone: "Europe/Dublin",
    city: "Dublin",
    country: "IE",
    tier: "studio",
    parentBusinessId: auroraStudio.id,
    structureKind: "location",
  }, repair);
  const auroraGalway = await ensureDemoBusiness(orgAdminId, {
    name: "Aurora Galway",
    slug: "aurora-galway",
    description: "West coast flagship.",
    category: "hair_salon",
    email: "hello@aurora-galway.ie",
    timezone: "Europe/Dublin",
    city: "Galway",
    country: "IE",
    tier: "studio",
    parentBusinessId: auroraStudio.id,
    structureKind: "location",
  }, repair);
  const conorsCut = await ensureDemoBusiness(ownerId, {
    name: "Conor's Cut Co.",
    slug: "conors-cut-co",
    description: "Two-chair barbershop — Cork.",
    category: "barbershop",
    email: "book@conorscut.ie",
    timezone: "Europe/Dublin",
    city: "Cork",
    country: "IE",
    tier: "solo",
  }, repair);

  const studioSeed = await seedShopCore(
    auroraStudio.id,
    [
      { firstName: "Lara", lastName: "Byrne", displayName: "Lara Byrne", email: "lara@aurora.ie", color: "#8B5CF6" },
      { firstName: "Niamh", lastName: "Doyle", displayName: "Niamh Doyle", email: "niamh@aurora.ie", color: "#06B6D4" },
      {
        firstName: "Síobhan",
        lastName: "Brady",
        displayName: "Síobhan Brady — Front Desk",
        email: "frontdesk@aurora.ie",
        color: "#F59E0B",
      },
    ],
    [
      {
        name: "Cut & Finish",
        durationMinutes: 60,
        priceMinor: 6500,
        sortOrder: 1,
        category: "Cuts & styling",
        description: "Wash, cut, and blow-dry finish.",
      },
      {
        name: "Full Colour",
        durationMinutes: 120,
        priceMinor: 12000,
        sortOrder: 2,
        category: "Colour",
        description: "Root-to-tip colour with consultation.",
      },
    ],
    "hair",
  );

  const conorsSeed = await seedShopCore(
    conorsCut.id,
    [
      { firstName: "Mo", lastName: "Healy", displayName: "Mo Healy", email: "mo@conorscut.ie", color: "#10B981" },
      { firstName: "Conor", lastName: "Walsh", displayName: "Conor Walsh", email: "conor@conorscut.ie", color: "#3B82F6" },
    ],
    [
      {
        name: "Skin Fade",
        durationMinutes: 45,
        priceMinor: 3500,
        sortOrder: 1,
        category: "Cuts",
        description: "Precision fade with hot towel finish.",
      },
      {
        name: "Beard Trim",
        durationMinutes: 20,
        priceMinor: 1500,
        sortOrder: 2,
        category: "Grooming",
        description: "Shape and line-up.",
      },
    ],
    "hair",
  );

  await applyDemoPublicBranding(auroraStudio.id, "hair", { instagramHandle: "aurorastudio.dublin" });
  await Promise.all([
    applyDemoPublicBranding(auroraMews.id, "hair"),
    applyDemoPublicBranding(auroraGalway.id, "hair"),
    applyDemoPublicBranding(conorsCut.id, "hair", { instagramHandle: "conorscutco" }),
    backfillDemoServiceImages(auroraStudio.id, "hair"),
    backfillDemoServiceImages(conorsCut.id, "hair"),
  ]);

  await seedShopCore(auroraMews.id, [
    { firstName: "Ava", lastName: "Reid", displayName: "Ava Reid", email: "ava@aurora.ie", color: "#EC4899" },
    { firstName: "James", lastName: "Kavanagh", displayName: "James Kavanagh", email: "james@aurora.ie", color: "#22C55E" },
  ], [
    { name: "Blow-dry", durationMinutes: 45, priceMinor: 4500, sortOrder: 1 },
    { name: "Cut & Finish", durationMinutes: 60, priceMinor: 6500, sortOrder: 2 },
  ], "hair");

  await seedShopCore(auroraGalway.id, [
    { firstName: "Eimear", lastName: "Costello", displayName: "Eimear Costello", email: "eimear@aurora.ie", color: "#6366F1" },
    { firstName: "Róisín", lastName: "Doherty", displayName: "Róisín Doherty", email: "roisin@aurora.ie", color: "#06B6D4" },
  ], [
    { name: "Consultation", durationMinutes: 30, priceMinor: 0, sortOrder: 1 },
    { name: "Full Colour", durationMinutes: 120, priceMinor: 11000, sortOrder: 2 },
  ], "hair");

  const lara = studioSeed.staffRows.find((s) => s.displayName === "Lara Byrne");
  const mo = (await db.select().from(staffTable).where(eq(staffTable.businessId, conorsCut.id))).find(
    (s) => s.displayName === "Mo Healy",
  );

  const managerId = clerkIds.manager;
  const seniorId = clerkIds["staff-senior"];
  const juniorId = clerkIds["staff-junior"];
  const frontdeskId = clerkIds.receptionist;

  if (managerId) await upsertMembership(auroraStudio.id, managerId, "ADMIN");
  if (frontdeskId) await upsertMembership(auroraStudio.id, frontdeskId, "ADMIN");
  if (seniorId) {
    await upsertMembership(auroraStudio.id, seniorId, "STAFF");
    if (lara) await updateStaff(auroraStudio.id, lara.id, { userId: seniorId });
  }
  if (juniorId && mo) {
    await upsertMembership(conorsCut.id, juniorId, "STAFF");
    await updateStaff(conorsCut.id, mo.id, { userId: juniorId });
  }

  const now = new Date();
  await seedExpandedBookings(
    auroraStudio.id,
    studioSeed.customers,
    studioSeed.staffRows.map((s) => s.id),
    studioSeed.serviceRows.map((s) => s.id),
    now,
  );
  await seedDemoInbox(auroraStudio.id, studioSeed.customers, {
    pendingBookingNotes: "Pending colour + blow-dry combo — awaiting manager OK",
  });

  await seedDemoAuditTrail({
    auroraStudioId: auroraStudio.id,
    conorsCutId: conorsCut.id,
    founderUserId: orgAdminId,
    ownerUserId: ownerId,
    managerUserId: managerId,
  });

  const verticalShowcase = await seedVerticalShowcaseShops(orgAdminId);
  await ensureDemoOperationalCases(auroraStudio.id, auroraStudio.slug, {});
  await seedVerticalDemoExtras();
  const marketShowcase = await seedMarketShowcaseShops(orgAdminId);
  await seedCountryDepthOnMarketShops();
  await seedDemoHierarchyLinks();
  await seedDemoBusinessRosters();
  const realWorld = await seedRealWorldScenarios(orgAdminId);

  for (const shop of [
    { id: auroraStudio.id, core: studioSeed },
    { id: conorsCut.id, core: conorsSeed },
    ...verticalShowcase.map((v) => ({ id: v.id, core: null as typeof studioSeed | null })),
  ]) {
    if (!shop.core) {
      await ensureLiveDayForBusiness(shop.id, { force: true });
      continue;
    }
    await ensureLiveDayForBusiness(shop.id, {
      force: true,
      customerSeed: shop.core.customers,
      staffIds: shop.core.staffRows.map((s) => s.id),
      serviceIds: shop.core.serviceRows.map((s) => s.id),
    });
  }

  const allShopIds = [
    auroraStudio.id,
    auroraMews.id,
    auroraGalway.id,
    conorsCut.id,
    ...verticalShowcase.map((v) => v.id),
    ...marketShowcase.map((m) => m.id),
    ...realWorld.businesses.map((b) => b.id),
  ];
  const { regenerateLivBriefingsForBusinessIds } = await import("./morning-briefing.service");
  const livBriefings = await regenerateLivBriefingsForBusinessIds(allShopIds);
  logger.info({ livBriefings, total: allShopIds.length }, "demo.liv_briefings.generated");

  const memoryShops = [
    auroraStudio,
    auroraMews,
    auroraGalway,
    conorsCut,
    ...verticalShowcase,
    ...marketShowcase.map((m) => ({ id: m.id, slug: m.slug, vertical: "beauty" as const })),
    ...realWorld.businesses.map((b) => ({ id: b.id, slug: b.slug, vertical: undefined })),
  ];
  const { seedDemoLivMemoryForBusinesses } = await import("./demo-liv-memory.seed");
  const memorySeeded = await seedDemoLivMemoryForBusinesses(
    memoryShops.map((b) => ({
      id: b.id,
      slug: b.slug,
      vertical: (b as { vertical?: string }).vertical,
    })),
  );
  logger.info({ memorySeeded }, "demo.liv_memory.seeded");

  const livSignals = await seedDemoLivSignalsForBusinesses(allShopIds);
  logger.info({ livSignals }, "demo.liv_signals.seeded");

  await wireScenarioMemberships(clerkIdsByEmail);
  logger.info({ scenarios: DEMO_SCENARIO_ACCOUNTS.length }, "demo.scenario_memberships.wired");

  const { syncLivToolCatalogFromRegistry } = await import("./liv-tool-catalog.service");
  await syncLivToolCatalogFromRegistry();

  const businesses = [auroraStudio, auroraMews, auroraGalway, conorsCut, ...verticalShowcase.map((v) => ({
    slug: v.slug,
    id: v.id,
    name: v.name,
  })), ...marketShowcase.map((m) => ({
    slug: m.slug,
    id: m.id,
    name: m.name,
  })), ...realWorld.businesses].map((b) => ({
    slug: b.slug,
    id: b.id,
    name: b.name,
  }));

  const ownerResults = await Promise.all(
    businesses.map(async (b) => {
      const def = buildBusinessOwnerDef(b.slug, b.name);
      const ownerId = await ensureClerkUser(def, { create: opts?.repair ? false : true });
      if (!ownerId) return false;
      await ensureDemoPlatformLegal(ownerId, def.email, def.displayName);
      await wireDemoAccountMemberships(def, ownerId, "OWNER");
      return true;
    }),
  );
  const businessOwners = ownerResults.filter(Boolean).length;
  logger.info({ businessOwners, slugs: businesses.length }, "demo.per_business_owners.provisioned");

  const onboardingMarked = await markDemoBusinessesOnboardingComplete(DEMO_WORLD_SLUGS);
  logger.info({ onboardingMarked }, "demo.onboarding_marked_complete");

  const supportTicketsSeeded = orgAdminId
    ? await seedDemoSupportTickets(orgAdminId)
    : 0;
  logger.info({ supportTicketsSeeded }, "demo.support_tickets.seeded");

  const { seedInternalOpsMonitoringDefaults } = await import("./internal-ops-alerts.service");
  await seedInternalOpsMonitoringDefaults();

  const { seedDemoChannelStack } = await import("./demo-channels.seed");
  const channelStack = await seedDemoChannelStack([
    { id: auroraStudio.id, slug: auroraStudio.slug, customers: studioSeed.customers },
    { id: auroraMews.id, slug: auroraMews.slug },
    { id: auroraGalway.id, slug: auroraGalway.slug },
    { id: conorsCut.id, slug: conorsCut.slug, customers: conorsSeed.customers },
    ...verticalShowcase.map((v) => ({ id: v.id, slug: v.slug })),
    ...marketShowcase.map((m) => ({ id: m.id, slug: m.slug })),
    ...realWorld.businesses.map((b) => ({ id: b.id, slug: b.slug })),
  ]);
  logger.info(channelStack, "demo.channel_stack.seeded");

  const { seedDemoGuestHub } = await import("./demo-guest-hub.seed");
  const guestHub = await seedDemoGuestHub();
  logger.info(guestHub, "demo.guest_hub.seeded");

  const chainLinks = await linkDemoChainHierarchy();
  if (chainLinks > 0) {
    logger.info({ chainLinks }, "demo.chain_hierarchy.linked");
  }

  logger.info({ businesses: businesses.map((b) => b.slug) }, "Demo world provisioned");

  return {
    personas: DEMO_PERSONAS.filter((p) => p.requiresClerk).map((p) => ({
      id: p.id,
      email: p.email,
      clerkUserId: clerkIds[p.id] ?? null,
    })),
    businesses,
    passwordHint: publicDemoPasswordHint(),
    mode: opts?.repair ? "repair" : "full",
  };
}

/** Fast idempotent sync — no wipe. Full provision only when demo world is missing. */
export async function syncDemoWorld(): Promise<{
  mode: "sync" | "full";
  provisioned: boolean;
  rosterAccounts: number;
  clerkSynced: number;
  brandingUpdated?: number;
  servicesUpdated?: number;
  liveDaysRefreshed?: number;
  bookingsAdded?: number;
  warnings?: string[];
  passwordHint: string;
  businesses: Array<{ slug: string; id: string; name: string }>;
}> {
  const status = await getDemoPortalStatus();
  if (!status.provisioned) {
    let full: Awaited<ReturnType<typeof provisionDemoWorld>>;
    try {
      full = await provisionDemoWorld();
    } catch (e) {
      const err = formatClerkDemoError(e) as Error & { code?: string };
      if (err.code === "CLERK_USER_QUOTA" || err.code === "CLERK_FORBIDDEN") {
        throw Object.assign(
          new Error(
            `${err.message} Or POST /api/demo/repair-db from the demo launcher (seeds DB without new Clerk users).`,
          ),
          { code: err.code, status: 503 },
        );
      }
      throw err;
    }
    return {
      mode: "full",
      provisioned: true,
      rosterAccounts: status.businesses.length > 0 ? 0 : full.businesses.length * 4,
      clerkSynced: full.personas.filter((p) => p.clerkUserId).length,
      passwordHint: full.passwordHint,
      businesses: full.businesses,
    };
  }

  const started = Date.now();
  let brandingUpdated = 0;
  let servicesUpdated = 0;
  let liveDaysRefreshed = 0;
  let bookingsAdded = 0;

  try {
    brandingUpdated = await backfillAllDemoPublicBranding(DEMO_WORLD_SLUGS);
    for (const b of status.businesses) {
      servicesUpdated += await backfillDemoServiceImages(
        b.id,
        (b.vertical ?? undefined) as import("@workspace/policy").BusinessVertical | undefined,
        { force: true },
      );
    }
    const live = await refreshDemoLiveDaysForSlugs(DEMO_WORLD_SLUGS);
    liveDaysRefreshed = live.businesses;
    bookingsAdded = live.bookingsAdded;
  } catch (err) {
    logger.warn({ err }, "demo.sync.assets_failed");
    throw err;
  }

  logger.info(
    {
      duration_ms: Date.now() - started,
      brandingUpdated,
      servicesUpdated,
      liveDaysRefreshed,
      bookingsAdded,
    },
    "demo.sync.completed",
  );

  const refreshed = await getDemoPortalStatus();
  return {
    mode: "sync",
    provisioned: refreshed.provisioned,
    rosterAccounts: 0,
    clerkSynced: 0,
    brandingUpdated,
    servicesUpdated,
    liveDaysRefreshed,
    bookingsAdded,
    passwordHint: publicDemoPasswordHint(),
    businesses: refreshed.businesses.map((b) => ({
      slug: b.slug,
      id: b.id,
      name: b.name,
    })),
  };
}

/** Heavy path — Clerk passwords + roster memberships. Sequential to avoid Clerk 429. */
export async function syncDemoLogins(opts?: {
  slug?: string;
}): Promise<{ clerkSynced: number; rosterAccounts: number }> {
  const slugs = opts?.slug?.trim() ? [opts.slug.trim().toLowerCase()] : undefined;
  const rosterResult = await seedDemoBusinessRosters(slugs ? { slugs } : undefined);
  const clerkResult = await syncAllDemoClerkUsers(slugs ? { slugs } : undefined);
  return { clerkSynced: clerkResult.synced, rosterAccounts: rosterResult.accounts };
}

/**
 * Recreate demo Clerk users after prune (personas, per-shop owners, pooled roster globals).
 * Does not wipe or re-seed the demo DB.
 */
export async function rebuildDemoClerkUsers(): Promise<{
  personas: number;
  owners: number;
  rosterAccounts: number;
}> {
  const clerkIdsByEmail: Record<string, string> = {};
  let personas = 0;
  for (const def of [...DEMO_PERSONAS, ...DEMO_SCENARIO_ACCOUNTS]) {
    if (!def.requiresClerk) continue;
    const id = await ensureClerkUser(def);
    if (!id) continue;
    await ensureDemoPlatformLegal(id, def.email, def.displayName);
    clerkIdsByEmail[def.email] = id;
    personas++;
  }
  await wireScenarioMemberships(clerkIdsByEmail);

  const status = await getDemoPortalStatus();
  let owners = 0;
  for (const b of status.businesses) {
    const def = buildBusinessOwnerDef(b.slug, b.name);
    const id = await ensureClerkUser(def);
    if (!id) continue;
    await ensureDemoPlatformLegal(id, def.email, def.displayName);
    await wireDemoAccountMemberships(def, id, "OWNER");
    owners++;
  }

  const roster = await seedDemoBusinessRosters();
  return { personas, owners, rosterAccounts: roster.accounts };
}

export type DemoBusinessTenant = {
  slug: string;
  id: string;
  name: string;
  vertical?: string | null;
  country?: string | null;
  ownerEmail: string;
  /** If set, UI should sign in as this persona (e.g. chain owner) rather than per-tenant owner. */
  ownerPersonaId?: "org_admin" | null;
  publicBookingUrl: string;
  roster: Array<{
    role: string;
    label: string;
    email: string;
    landingPath: string;
    personaId: string;
  }>;
};

export async function getDemoPortalStatus(): Promise<{
  provisioned: boolean;
  businesses: DemoBusinessTenant[];
  passwordHint: string;
  dashboardBase: string;
  internalBase: string;
  marketingBase: string;
  demoPasswordConfigured: boolean;
  channels: Awaited<ReturnType<typeof import("./demo-channels.seed").getDemoChannelReadiness>>;
}> {
  const rows = await db
    .select({
      id: businessesTable.id,
      slug: businessesTable.slug,
      name: businessesTable.name,
      vertical: businessesTable.vertical,
      country: businessesTable.country,
      parentBusinessId: businessesTable.parentBusinessId,
    })
    .from(businessesTable)
    .where(inArray(businessesTable.slug, [...DEMO_WORLD_SLUGS]));
  const dashboardBase = getDashboardUrl();
  const internalBase = getInternalUrl();
  const marketingBase = getMarketingUrl();
  return {
    provisioned:
      rows.some((r) => r.slug === "aurora-studio") &&
      rows.length >= DEMO_WORLD_SLUGS.length - 2,
    businesses: rows
      .map((r) => {
        const chainHq = isDemoChainHqSlug(r.slug);
        return {
          slug: r.slug,
          id: r.id,
          name: r.name,
          vertical: r.vertical,
          country: r.country,
          ownerEmail: resolveRosterOwnerEmail(r.slug, chainHq),
          ownerPersonaId: chainHq ? ("org_admin" as const) : null,
          publicBookingUrl: resolveGuestBookUrl(r.slug),
          roster: rosterEntriesForSlug(r.slug, r.name).map((entry) => ({
            ...entry,
            email:
              entry.role === "owner" && chainHq
                ? resolveRosterOwnerEmail(r.slug, true)
                : entry.email,
          })),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    passwordHint: publicDemoPasswordHint(),
    dashboardBase,
    internalBase,
    marketingBase,
    demoPasswordConfigured: !!process.env.LIVIA_DEMO_PASSWORD?.trim(),
    channels: await (await import("./demo-channels.seed")).getDemoChannelReadiness("aurora-studio"),
  };
}

export function getDemoCatalog() {
  return {
    passwordHint: publicDemoPasswordHint(),
    sharedPassword: demoResponsesMayIncludeSecrets() ? getDemoPassword() : undefined,
    scenarios: demoScenarioSpotlights(),
    personas: DEMO_PERSONAS.map((p) => ({
      id: p.id,
      email: p.email,
      displayName: p.displayName,
      roleLabel: p.roleLabel,
      landingPath: p.landingPath,
      primaryBusinessSlug: p.primaryBusinessSlug,
      requiresClerk: p.requiresClerk,
      publicBookingUrl:
        p.id === "customer"
          ? `${getDashboardUrl()}/b/aurora-studio`
          : null,
    })),
    scenarioAccounts: DEMO_SCENARIO_ACCOUNTS.map((p) => ({
      email: p.email,
      displayName: p.displayName,
      roleLabel: p.roleLabel,
      landingPath: p.landingPath,
      primaryBusinessSlug: p.primaryBusinessSlug,
      businessSlugs: p.businessSlugs,
    })),
    /** @deprecated use sharedPassword */
    devPassword: demoResponsesMayIncludeSecrets() ? getDemoPassword() : undefined,
  };
}

/** One-click staging login — server applies shared demo password. */
export async function quickDemoSignIn(email: string) {
  return signInAsDemoEmail({ email, password: getDemoPassword() });
}

/** Idempotent: seed any missing vertical showcase shops without wiping the demo world. */
export async function syncVerticalShowcaseForDemo(): Promise<{
  businesses: Array<{ slug: string; id: string; name: string; vertical: string }>;
}> {
  const orgAdminDef = DEMO_PERSONAS.find((p) => p.id === "org_admin");
  if (!orgAdminDef) {
    throw new Error("Org-admin persona missing from demo config");
  }
  const orgAdminId = await ensureClerkUser(orgAdminDef);
  if (!orgAdminId) {
    throw Object.assign(new Error("Org-admin Clerk user missing — run POST /api/demo/provision first"), {
      code: "CLERK_NOT_CONFIGURED",
    });
  }
  const status = await getDemoPortalStatus();
  if (!status.provisioned) {
    throw Object.assign(new Error("Demo not provisioned"), { status: 409 });
  }
  const before = new Set(status.businesses.map((b) => b.slug));
  const businesses = await seedVerticalShowcaseShops(orgAdminId);
  await seedVerticalDemoExtras();
  await seedMarketShowcaseShops(orgAdminId);
  for (const b of businesses) {
    if (!before.has(b.slug)) {
      await ensureLiveDayForBusiness(b.id, { force: true });
    }
    if (b.slug === "luxe-salon-spa") {
      const { ensureDemoOperationalCases } = await import("./demo-operational-cases.seed");
      await ensureDemoOperationalCases(b.id, b.slug, {});
    }
    const { runTwinIntelligenceDaily } = await import("./twin-intelligence-daily.service");
    await runTwinIntelligenceDaily(b.id).catch(() => undefined);
  }
  const addedNew = businesses.some((b) => !before.has(b.slug));
  if (addedNew) {
    try {
      await syncAllDemoClerkUsers();
    } catch (e) {
      logger.warn({ err: e }, "Clerk sync skipped after vertical showcase sync (rate limit or offline)");
    }
  }
  return {
    businesses: businesses.map((b) => ({
      slug: b.slug,
      id: b.id,
      name: b.name,
      vertical: b.vertical,
    })),
  };
}

/** Founder UAT + org-admin shops — avoid full-roster twin sync in preflight. */
const DEMO_TWIN_INTEL_SLUGS = new Set([
  "luxe-salon-spa",
  "clarity-medspa-dublin",
  "bloom-beauty-dublin",
  "aurora-studio",
]);

/** Materialize Twin observations for demo tenants (UAT / founder walkthrough). */
export async function syncDemoTwinIntelligence(opts?: {
  slugs?: string[];
}): Promise<{
  processed: number;
  observationsCreated: number;
}> {
  const status = await getDemoPortalStatus();
  if (!status.provisioned) {
    throw Object.assign(new Error("Demo not provisioned"), { status: 409 });
  }
  const { runTwinIntelligenceDaily } = await import("./twin-intelligence-daily.service");
  const targets = opts?.slugs?.length
    ? status.businesses.filter((b) => opts.slugs!.includes(b.slug))
    : status.businesses.filter((b) => DEMO_TWIN_INTEL_SLUGS.has(b.slug));
  const shops =
    targets.length > 0
      ? targets
      : status.businesses.filter((b) => b.slug === "luxe-salon-spa");
  let observationsCreated = 0;
  for (const b of shops) {
    const result = await runTwinIntelligenceDaily(b.id);
    observationsCreated += result.observationsCreated;
  }
  return { processed: shops.length, observationsCreated };
}

/** Re-sync Clerk state for all demo emails (password, verified email, MFA off). */
export async function syncAllDemoClerkUsers(opts?: {
  slugs?: string[];
}): Promise<{ synced: number }> {
  const clerk = getClerk();
  if (!clerk) {
    throw Object.assign(new Error("Clerk not configured"), { code: "CLERK_NOT_CONFIGURED" });
  }
  const password = getDemoPassword();
  const status = await getDemoPortalStatus();
  const slugSet = opts?.slugs?.length ? new Set(opts.slugs) : null;
  const tenantRows = slugSet
    ? status.businesses.filter((b) => slugSet.has(b.slug))
    : status.businesses;
  const ownerDefs = tenantRows.flatMap((b) =>
    rosterEntriesForSlug(b.slug, b.name).map((entry) => buildDemoRoleDef(b.slug, entry.role as DemoTenantRole, b.name)),
  );
  const uniqueByEmail = new Map<string, DemoPersonaDef>();
  const staticPersonas = slugSet
    ? DEMO_PERSONAS.filter((p) => {
        if (p.id === "org_admin" && slugSet.has("aurora-studio")) return true;
        return p.businessSlugs.some((s) => slugSet.has(s));
      })
    : [...DEMO_PERSONAS, ...DEMO_SCENARIO_ACCOUNTS];
  for (const def of [...staticPersonas, ...ownerDefs]) {
    if (!def.requiresClerk) continue;
    uniqueByEmail.set(def.email.toLowerCase(), def);
  }

  const syncedResults = await mapWithConcurrency([...uniqueByEmail.values()], 1, async (def) => {
    const list = await withClerkRetry(() =>
      clerk.users.getUserList({ emailAddress: [def.email], limit: 1 }),
    );
    const user = list.data[0];
    if (!user) return 0;
    await syncDemoClerkUser(clerk, user.id, { email: def.email, password });
    await new Promise((r) => setTimeout(r, 150));
    return 1;
  });
  const synced = syncedResults.reduce((sum, n) => sum + n, 0);
  return { synced };
}

/** Sign in as the dedicated owner of one business (one tenant, full Liv activity). */
export async function signInAsDemoBusiness(slug: string): Promise<{
  token: string;
  landingPath: string;
  businessId: string;
  email: string;
  displayName: string;
  persona: DemoPersonaId;
  primaryBusinessSlug: string;
  businessSlugs: string[];
  signInStrategy: "ticket";
}> {
  const normalized = slug.trim().toLowerCase();
  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, normalized));
  if (!biz) {
    throw Object.assign(new Error(`Business not found: ${slug}`), { status: 404 });
  }

  const def = buildBusinessOwnerDef(biz.slug, biz.name);
  const clerk = getClerk();
  if (!clerk) {
    throw Object.assign(new Error("Clerk not configured"), { code: "CLERK_NOT_CONFIGURED" });
  }

  const userId = await ensureDemoAccountReady(def);
  const password = getDemoPassword();
  await syncDemoClerkUserIfStale(clerk, userId, { email: def.email, password });

  const { token } = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 300,
  });

  return {
    token,
    landingPath: "/dashboard",
    businessId: biz.id,
    email: def.email,
    displayName: def.displayName,
    persona: "owner",
    primaryBusinessSlug: biz.slug,
    businessSlugs: [biz.slug],
    signInStrategy: "ticket",
  };
}

export async function signInAsDemoEmail(opts: {
  email: string;
  password: string;
}): Promise<{
  token: string;
  landingPath: string;
  businessId?: string;
  email: string;
  displayName: string;
  persona: DemoPersonaId;
  primaryBusinessSlug: string;
  businessSlugs: string[];
  signInStrategy: "ticket";
}> {
  const normalized = opts.email.trim().toLowerCase();
  if (!isDemoEmail(normalized)) {
    throw Object.assign(new Error("Not a demo account"), { status: 403 });
  }
  const expected = getDemoPassword();
  if (opts.password !== expected) {
    throw Object.assign(new Error("Invalid demo password"), { status: 401 });
  }

  const def = getDemoAccountByEmail(normalized);
  if (!def || !def.requiresClerk) {
    throw Object.assign(new Error("Demo world not provisioned for this email"), { status: 409 });
  }

  const clerk = getClerk();
  if (!clerk) {
    throw Object.assign(new Error("Clerk not configured"), { code: "CLERK_NOT_CONFIGURED" });
  }

  const userId = await ensureDemoAccountReady(def);
  await syncDemoClerkUserIfStale(clerk, userId, { email: def.email, password: expected });

  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, def.primaryBusinessSlug));

  if (!biz) {
    throw Object.assign(
      new Error(
        `Demo tenant "${def.primaryBusinessSlug}" is not provisioned — run Sync logins on /demo first.`,
      ),
      { status: 409 },
    );
  }

  const { token } = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 300,
  });

  if (biz?.id) {
    const personaHint =
      def.id === "staff-senior" || def.id === "staff-junior"
        ? "staff"
        : def.receptionPreset
          ? "receptionist"
          : def.membershipRole === "ADMIN"
            ? "manager"
            : "owner";
    void import("./in-app-notifications.service")
      .then(({ seedDemoInAppNotifications }) =>
        seedDemoInAppNotifications(userId, biz.id, personaHint),
      )
      .catch(() => undefined);
  }

  return {
    token,
    landingPath: def.landingPath,
    businessId: biz?.id,
    email: def.email,
    displayName: def.displayName,
    persona: def.id,
    primaryBusinessSlug: def.primaryBusinessSlug,
    businessSlugs: def.businessSlugs,
    signInStrategy: "ticket",
  };
}

export async function signInAsDemoPersona(opts: {
  personaId: string;
  businessSlugOverride?: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
}): Promise<{
  token?: string;
  landingPath: string;
  businessId?: string;
  email: string;
  displayName: string;
  persona: DemoPersonaId;
  primaryBusinessSlug?: string;
  businessSlugs?: string[];
  signInStrategy: "ticket" | "public";
}> {
  const def = getDemoPersona(opts.personaId);
  if (!def) {
    throw Object.assign(new Error("Unknown persona"), { status: 404 });
  }

  if (def.id === "customer") {
    return {
      landingPath: def.landingPath,
      email: def.email,
      displayName: def.displayName,
      persona: def.id,
      signInStrategy: "public",
    };
  }

  const clerk = getClerk();
  if (!clerk) {
    throw Object.assign(new Error("Clerk not configured"), { code: "CLERK_NOT_CONFIGURED" });
  }

  const userId = await ensureDemoAccountReady(def);
  await syncDemoClerkUserIfStale(clerk, userId, {
    email: def.email,
    password: getDemoPassword(),
  });

  const targetSlug = opts.businessSlugOverride?.trim() || def.primaryBusinessSlug;
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.slug, targetSlug));
  if (!biz) {
    throw Object.assign(new Error(`Business not found: ${targetSlug}`), { status: 404 });
  }

  // Allow testing manager/staff/receptionist flows against any demo tenant by
  // temporarily wiring the persona into that business.
  if (opts.businessSlugOverride?.trim() && def.membershipRole) {
    await upsertMembership(biz.id, userId, def.membershipRole);
  }
  if (biz && opts.actorUserId) {
    await appendHumanAudit(
      biz.id,
      opts.actorUserId,
      "demo.portal.sign_in",
      "persona",
      def.id,
      { targetEmail: def.email, actorEmail: opts.actorEmail ?? null },
    );
  }

  const { token } = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 300,
  });

  return {
    token,
    landingPath: def.landingPath === "/chain" && opts.businessSlugOverride ? "/dashboard" : def.landingPath,
    businessId: biz.id,
    email: def.email,
    displayName: def.displayName,
    persona: def.id,
    primaryBusinessSlug: targetSlug,
    businessSlugs: [targetSlug],
    signInStrategy: "ticket",
  };
}

/** Every demo email gets a Clerk user + DB row + legal + memberships (idempotent). */
export async function ensureDemoIdentitiesForAllAccounts(): Promise<{
  clerkCreated: number;
  legalUpdated: number;
  accounts: number;
}> {
  const status = await getDemoPortalStatus();
  const defs = [
    ...DEMO_PERSONAS,
    ...DEMO_SCENARIO_ACCOUNTS,
    ...status.businesses.map((b) => buildBusinessOwnerDef(b.slug, b.name)),
  ];
  let clerkCreated = 0;
  let legalUpdated = 0;
  let accounts = 0;

  for (const def of defs) {
    if (!def.requiresClerk) continue;
    const clerk = getClerk();
    if (!clerk) continue;

    const existing = await clerk.users.getUserList({ emailAddress: [def.email], limit: 1 });
    const hadClerk = Boolean(existing.data[0]);

    const userId = await ensureClerkUser(def);
    if (!userId) continue;
    if (!hadClerk) clerkCreated += 1;

    const [row] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    const hadLegal = row ? hasCurrentPlatformLegal(row.platformLegal) : false;
    await ensureDemoPlatformLegal(userId, def.email, def.displayName);
    if (!hadLegal) legalUpdated += 1;

    await wireDemoAccountMemberships(def, userId, def.membershipRole ?? "OWNER");
    accounts += 1;
  }

  return { clerkCreated, legalUpdated, accounts };
}

export function assertDemoSignInAllowed(actorEmail: string | null | undefined): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.LIVIA_DEMO_ENABLED !== "true") {
    throw Object.assign(new Error("Not found"), { status: 404 });
  }
  if (!isDemoEmail(actorEmail)) {
    throw Object.assign(new Error("Not found"), { status: 404 });
  }
}
