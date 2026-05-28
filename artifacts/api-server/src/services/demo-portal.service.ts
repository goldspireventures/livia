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
import { logger } from "../lib/logger";
import { appendHumanAudit } from "../lib/audit";
import { getOrCreateUser, updateUser } from "./users.service";
import {
  buildPlatformLegalAcceptance,
  hasCurrentPlatformLegal,
} from "../lib/platform-legal-gate";
import { createBusiness } from "./businesses.service";
import { applyDemoPublicBranding } from "../lib/demo-public-assets";
import { backfillDemoServiceImages } from "../lib/demo-service-images";
import { inferDemoServiceImageUrl } from "../lib/experience-skin";
import { createStaff, updateStaff } from "./staff.service";
import { createService } from "./services.service";
import {
  DEMO_PERSONAS,
  DEMO_WORLD_SLUGS,
  buildBusinessOwnerDef,
  demoOwnerEmailForSlug,
  getDemoPersona,
  isDemoEmail,
  slugFromOwnerDemoEmail,
  type DemoPersonaDef,
  type DemoPersonaId,
  demoResponsesMayIncludeSecrets,
} from "../lib/demo-portal-config";
import { DEMO_SCENARIO_ACCOUNTS } from "../lib/demo-scenario-config";
import { syncDemoClerkUser } from "../lib/demo-clerk-sync";
import { seedDemoInbox, seedExpandedBookings } from "./demo-inbox.seed";
import { seedDemoAuditTrail } from "./demo-audit.seed";
import { seedRealWorldScenarios, REAL_WORLD_PREMISES_SLUG } from "./demo-real-world-scenarios.seed";
import { seedVerticalShowcaseShops } from "./demo-vertical-shops.seed";
import { seedMarketShowcaseShops } from "./demo-market-shops.seed";
import { seedDemoLivSignalsForBusinesses } from "./demo-liv-signals.seed";
import { ensureLiveDayForBusiness } from "./demo-live-day.service";
import { seedDemoSupportTickets } from "./demo-support-tickets.seed";
import { ensureDemoOperationalCases } from "./demo-operational-cases.seed";
import { seedVerticalDemoExtras } from "./demo-vertical-extras.seed";
import { seedCountryDepthOnMarketShops } from "./demo-country-depth.seed";
import { seedDemoHierarchyLinks } from "./demo-hierarchy.seed";

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

async function ensureClerkUser(def: DemoPersonaDef): Promise<string | null> {
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
  let userId = await ensureClerkUser(def);
  if (!userId) {
    throw Object.assign(new Error("Could not create demo Clerk user"), { status: 500 });
  }
  await ensureDemoPlatformLegal(userId, def.email, def.displayName);
  await wireDemoAccountMemberships(def, userId, def.membershipRole ?? "OWNER");
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

function isFounderChainTenant(
  row: { slug: string; parentBusinessId: string | null },
  parentSlugById: Map<string, string>,
  founderSlugs: ReadonlySet<string>,
): boolean {
  if (founderSlugs.has(row.slug)) return true;
  if (!row.parentBusinessId) return false;
  const parentSlug = parentSlugById.get(row.parentBusinessId);
  return parentSlug ? founderSlugs.has(parentSlug) : false;
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
      customerDefs.map((c) => ({
        id: generateId(),
        businessId,
        firstName: c.first,
        lastName: c.last,
        displayName: `${c.first} ${c.last}`,
        email: c.email,
        phone: c.phone,
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

export async function provisionDemoWorld(): Promise<{
  personas: Array<{ id: DemoPersonaId; email: string; clerkUserId: string | null }>;
  businesses: Array<{ slug: string; id: string; name: string }>;
  passwordHint: string;
}> {
  await wipeDemoWorld();

  const clerkIds: Record<string, string> = {};
  const clerkIdsByEmail: Record<string, string> = {};
  const allAccounts = [...DEMO_PERSONAS, ...DEMO_SCENARIO_ACCOUNTS];
  for (const def of allAccounts) {
    if (!def.requiresClerk) continue;
    const id = await ensureClerkUser(def);
    if (id) {
      clerkIdsByEmail[def.email] = id;
      if (DEMO_PERSONAS.some((p) => p.email === def.email)) {
        clerkIds[def.id] = id;
      }
      await ensureDemoPlatformLegal(id, def.email, def.displayName);
    }
  }

  const orgAdminId = clerkIds.org_admin;
  const ownerId = clerkIds.owner;
  if (!orgAdminId || !ownerId) {
    throw new Error("Failed to provision org-admin/owner Clerk users");
  }

  const auroraStudio = await createBusiness(orgAdminId, {
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
  });
  const auroraMews = await createBusiness(orgAdminId, {
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
  });
  const auroraGalway = await createBusiness(orgAdminId, {
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
  });
  const conorsCut = await createBusiness(ownerId, {
    name: "Conor's Cut Co.",
    slug: "conors-cut-co",
    description: "Two-chair barbershop — Cork.",
    category: "barbershop",
    email: "book@conorscut.ie",
    timezone: "Europe/Dublin",
    city: "Cork",
    country: "IE",
    tier: "solo",
  });

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
  await applyDemoPublicBranding(auroraMews.id, "hair");
  await applyDemoPublicBranding(auroraGalway.id, "hair");
  await applyDemoPublicBranding(conorsCut.id, "hair", { instagramHandle: "conorscutco" });
  await backfillDemoServiceImages(auroraStudio.id, "hair");
  await backfillDemoServiceImages(conorsCut.id, "hair");

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

  let businessOwners = 0;
  for (const b of businesses) {
    const def = buildBusinessOwnerDef(b.slug, b.name);
    const ownerId = await ensureClerkUser(def);
    if (!ownerId) continue;
    await ensureDemoPlatformLegal(ownerId, def.email, def.displayName);
    await wireDemoAccountMemberships(def, ownerId, "OWNER");
    businessOwners += 1;
  }
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
  };
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
  const orgAdminDef = DEMO_PERSONAS.find((p) => p.id === "org_admin");
  const founderSlugs = new Set(orgAdminDef?.businessSlugs ?? []);
  const orgAdminEmail = orgAdminDef?.email ?? "org-admin@livia.io";
  const parentSlugById = new Map(rows.map((r) => [r.id, r.slug]));
  const dashboardBase =
    process.env.DASHBOARD_PUBLIC_URL?.replace(/\/$/, "") || "http://localhost:5173";
  const internalBase =
    process.env.INTERNAL_PUBLIC_URL?.replace(/\/$/, "") || "http://localhost:5175";
  const marketingBase =
    process.env.MARKETING_PUBLIC_URL?.replace(/\/$/, "") || "http://localhost:5174";
  return {
    provisioned:
      rows.some((r) => r.slug === "aurora-studio") &&
      rows.length >= DEMO_WORLD_SLUGS.length - 2,
    businesses: rows
      .map((r) => {
        const chainFounder = isFounderChainTenant(r, parentSlugById, founderSlugs);
        return {
          slug: r.slug,
          id: r.id,
          name: r.name,
          vertical: r.vertical,
          country: r.country,
          ownerEmail: chainFounder ? orgAdminEmail : demoOwnerEmailForSlug(r.slug),
          ownerPersonaId: chainFounder ? ("org_admin" as const) : null,
          publicBookingUrl: `${dashboardBase}/b/${r.slug}`,
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
          ? `${process.env.DASHBOARD_PUBLIC_URL?.replace(/\/$/, "") || "http://localhost:5173"}/b/aurora-studio`
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
    /** Only returned in non-production for local E2E — never log in prod. */
    devPassword: process.env.NODE_ENV === "production" ? undefined : getDemoPassword(),
  };
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
  for (const b of businesses) {
    if (!before.has(b.slug)) {
      await ensureLiveDayForBusiness(b.id, { force: true });
    }
    if (b.slug === "luxe-salon-spa") {
      const { ensureDemoOperationalCases } = await import("./demo-operational-cases.seed");
      await ensureDemoOperationalCases(b.id, b.slug, {});
    }
  }
  await syncAllDemoClerkUsers();
  return {
    businesses: businesses.map((b) => ({
      slug: b.slug,
      id: b.id,
      name: b.name,
      vertical: b.vertical,
    })),
  };
}

/** Re-sync Clerk state for all demo emails (password, verified email, MFA off). */
export async function syncAllDemoClerkUsers(): Promise<{ synced: number }> {
  const clerk = getClerk();
  if (!clerk) {
    throw Object.assign(new Error("Clerk not configured"), { code: "CLERK_NOT_CONFIGURED" });
  }
  const password = getDemoPassword();
  let synced = 0;
  const status = await getDemoPortalStatus();
  const ownerDefs = status.businesses.map((b) => buildBusinessOwnerDef(b.slug, b.name));
  for (const def of [...DEMO_PERSONAS, ...DEMO_SCENARIO_ACCOUNTS, ...ownerDefs]) {
    if (!def.requiresClerk) continue;
    const list = await clerk.users.getUserList({ emailAddress: [def.email], limit: 1 });
    const user = list.data[0];
    if (!user) continue;
    await syncDemoClerkUser(clerk, user.id, { email: def.email, password });
    synced += 1;
  }
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
  await syncDemoClerkUser(clerk, userId, { email: def.email, password });

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
  await syncDemoClerkUser(clerk, userId, { email: def.email, password: expected });

  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, def.primaryBusinessSlug));

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
    const { seedDemoInAppNotifications } = await import("./in-app-notifications.service");
    await seedDemoInAppNotifications(userId, biz.id, personaHint).catch(() => undefined);
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
  await syncDemoClerkUser(clerk, userId, { email: def.email, password: getDemoPassword() });

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
