/**
 * Generic demo seed for subvertical roster slugs not covered by bespoke vertical/market seeds.
 */
import { eq } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";
import {
  consultFirstDemoCustomerCap,
  getSubverticalProfile,
  getVerticalStarterPackServicesForProfile,
  isConsultFirstVertical,
  listDemoSubverticalRoster,
  resolveDemoShowcaseBusinessSpec,
  verticalSupportsRetail,
  type BusinessVertical,
  type DemoSubverticalRosterEntry,
} from "@workspace/policy";
import { inferDemoServiceImageUrl } from "../lib/experience-skin";
import { applyDemoPublicBranding } from "../lib/demo-public-assets";
import { backfillDemoServiceImages } from "../lib/demo-service-images";
import { createBusiness } from "./businesses.service";
import { seedExpandedBookings, seedDemoInbox } from "./demo-inbox.seed";
import { ensureLiveDayForBusiness } from "./demo-live-day.service";
import { ensureDemoOperationalCases } from "./demo-operational-cases.seed";
import {
  ensureShowcaseCustomers,
  ensureShowcasePets,
  refreshVerticalShowcaseShop,
} from "./demo-showcase-depth";
import { seedShopCore } from "./demo-portal.service";
import { ensureVerticalDemoPresentationPreset } from "./demo-vertical-shops.seed";
import { ensureEventVendorsShowcaseDepth } from "./event-vendors-demo-depth";
import { ensureWellnessShowcaseDepth } from "./wellness-demo-depth";
import { logger } from "../lib/logger";

const ALREADY_BESPOKE_SEEDED = new Set([
  "luxe-salon-spa",
  "bloom-beauty-dublin",
  "harbour-wellness-cork",
  "ink-anchor-galway",
  "paws-parlour-dublin",
  "clarity-medspa-dublin",
  "motion-physio-cork",
  "shine-studio-belfast",
  "peak-fitness-dublin",
  "atelier-decor-dublin",
  "copenhagen-havn-wellness",
  "conors-cut-co",
  "aurora-studio",
  "aurora-mews",
  "aurora-galway",
]);

const STAFF_COLORS = ["#8B5CF6", "#06B6D4", "#EC4899", "#14B8A6", "#F97316", "#64748B"];

function slugEmailDomain(slug: string, country?: string): string {
  const tld = country === "GB" ? "co.uk" : country === "DK" ? "dk" : "ie";
  return `${slug.replace(/-/g, "")}.${tld}`;
}

function defaultStaffForSlug(
  slug: string,
  displayName: string,
  count: number,
): Array<{ firstName: string; lastName: string; displayName: string; email: string; color: string }> {
  const domain = slugEmailDomain(slug);
  const names = [
    ["Alex", "Murphy"],
    ["Jordan", "Kelly"],
    ["Sam", "Walsh"],
  ] as const;
  return Array.from({ length: count }, (_, i) => {
    const [firstName, lastName] = names[i] ?? names[0];
    return {
      firstName,
      lastName,
      displayName: i === 0 ? `${firstName} ${lastName}` : `${firstName} ${lastName} · ${displayName}`,
      email: `${firstName.toLowerCase()}@${domain}`,
      color: STAFF_COLORS[i % STAFF_COLORS.length] ?? "#8B5CF6",
    };
  });
}

function categoryForVertical(vertical: BusinessVertical): string {
  switch (vertical) {
    case "hair":
      return "hair_salon";
    case "beauty":
      return "beauty";
    case "wellness":
      return "wellness";
    case "body-art":
      return "tattoo";
    case "medspa":
      return "medspa";
    case "allied-health":
      return "physio";
    case "fitness":
      return "fitness";
    case "pet-grooming":
      return "pet-grooming";
    case "automotive-detailing":
      return "detailing";
    case "event-vendors":
      return "event_decor";
    default:
      return vertical;
  }
}

async function ensureRetailDemoDepth(businessId: string, slug: string, vertical: BusinessVertical) {
  if (!verticalSupportsRetail(vertical)) return;
  try {
    const { grantAddonBundle } = await import("./billing.service");
    await grantAddonBundle(businessId, "retail_pack");
    const { ensureDemoRetailShowcaseDepth } = await import("./demo-showcase-sync.service");
    await ensureDemoRetailShowcaseDepth(businessId, slug);
  } catch (err) {
    logger.error({ err, businessId, slug, vertical }, "[demo] subvertical retail depth failed");
    if (process.env.CI !== "true") throw err;
  }
}

async function seedOneShowcaseShop(
  founderUserId: string,
  row: DemoSubverticalRosterEntry,
): Promise<{ slug: string; id: string; name: string; vertical: BusinessVertical } | null> {
  if (ALREADY_BESPOKE_SEEDED.has(row.slug)) return null;

  const profile = getSubverticalProfile(row.subverticalProfileId);
  if (!profile) return null;

  const vertical = profile.vertical;
  const showcaseSpec = resolveDemoShowcaseBusinessSpec(row.slug);
  const starter = getVerticalStarterPackServicesForProfile(vertical, row.subverticalProfileId);
  const services = starter.slice(0, 6).map((s, i) => ({
    name: s.name,
    durationMinutes: s.durationMinutes,
    priceMinor: s.priceMinor,
    sortOrder: i + 1,
    category: s.category,
    description: s.description,
    imageUrl: inferDemoServiceImageUrl(s.name, vertical),
    serviceKind: s.serviceKind ?? undefined,
    rebookIntervalDays: s.rebookIntervalDays ?? undefined,
    requiresPatchTest: s.requiresPatchTest,
  }));

  const staffCount = profile.defaultOrgShape === "solo" ? 1 : 3;
  const staff = defaultStaffForSlug(row.slug, row.name, staffCount);
  const country = row.country ?? "IE";
  const timezone = row.timezone ?? "Europe/Dublin";

  const [existing] = await db
    .select({
      id: businessesTable.id,
      slug: businessesTable.slug,
      name: businessesTable.name,
      vertical: businessesTable.vertical,
    })
    .from(businessesTable)
    .where(eq(businessesTable.slug, row.slug))
    .limit(1);

  if (existing) {
    const { syncDemoBusinessShowcaseMeta } = await import("./demo-showcase-sync.service");
    await syncDemoBusinessShowcaseMeta(existing.id, row.slug);
    await refreshVerticalShowcaseShop(existing.id, {
      vertical,
      slug: row.slug,
      staff,
      services,
    });
    await ensureVerticalDemoPresentationPreset(existing.id, vertical);
    if (vertical === "wellness") await ensureWellnessShowcaseDepth(existing.id);
    if (vertical === "event-vendors") {
      await ensureEventVendorsShowcaseDepth(existing.id);
      const { grantAddonBundle } = await import("./billing.service");
      await grantAddonBundle(existing.id, "event_operator_pack");
    }
    await ensureRetailDemoDepth(existing.id, row.slug, vertical);
    await applyDemoPublicBranding(existing.id, vertical);
    await backfillDemoServiceImages(existing.id, vertical, { force: true });
    return {
      slug: existing.slug,
      id: existing.id,
      name: existing.name,
      vertical: existing.vertical as BusinessVertical,
    };
  }

  const biz = await createBusiness(founderUserId, {
    name: row.name,
    slug: row.slug,
    description: `${profile.label} demo — ${profile.description}`,
    category: categoryForVertical(vertical),
    vertical,
    email: `hello@${slugEmailDomain(row.slug, country)}`,
    timezone,
    city: row.city,
    country,
    tier: showcaseSpec?.tier ?? row.tier ?? "studio",
    subverticalProfileId: row.subverticalProfileId,
  });

  const core = await seedShopCore(biz.id, staff, services, vertical);
  const customerMin = isConsultFirstVertical(vertical) ? consultFirstDemoCustomerCap() : 20;
  const customers = await ensureShowcaseCustomers(biz.id, customerMin);
  if (vertical === "pet-grooming" && row.subverticalProfileId === "pet.mobile") {
    await ensureShowcasePets(
      biz.id,
      customers.map((c) => c.id),
      [{ name: "Buddy", breed: "Cockapoo", species: "dog", customerIndex: 0 }],
    );
  }

  const consultFirst = isConsultFirstVertical(vertical);
  const now = new Date();
  const bookingKeys = consultFirst
    ? {}
    : await seedExpandedBookings(
        biz.id,
        customers,
        core.staffRows.map((s) => s.id),
        core.serviceRows.map((s) => s.id),
        now,
        vertical,
      );
  if (!consultFirst) {
    await seedDemoInbox(biz.id, customers, { vertical, bookingKeys });
  }

  await ensureVerticalDemoPresentationPreset(biz.id, vertical);
  if (vertical === "wellness") await ensureWellnessShowcaseDepth(biz.id);
  if (vertical === "event-vendors") {
    await ensureEventVendorsShowcaseDepth(biz.id);
    const { grantAddonBundle } = await import("./billing.service");
    await grantAddonBundle(biz.id, "event_operator_pack");
  }
  await ensureRetailDemoDepth(biz.id, row.slug, vertical);
  await ensureDemoOperationalCases(biz.id, row.slug, {});
  await applyDemoPublicBranding(biz.id, vertical, {
    instagramHandle: row.slug.replace(/-dublin|-cork|-galway|-belfast/g, "").slice(0, 28),
  });
  await backfillDemoServiceImages(biz.id, vertical);
  const { syncDemoBusinessShowcaseMeta } = await import("./demo-showcase-sync.service");
  await syncDemoBusinessShowcaseMeta(biz.id, row.slug);

  return { slug: row.slug, id: biz.id, name: row.name, vertical };
}

async function seedMultiSiteChild(
  founderUserId: string,
  parentId: string,
  row: NonNullable<DemoSubverticalRosterEntry["childLocation"]>,
  profileId: string,
  tier: DemoSubverticalRosterEntry["tier"],
): Promise<{ slug: string; id: string } | null> {
  const profile = getSubverticalProfile(profileId);
  if (!profile) return null;

  const [existing] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, row.slug))
    .limit(1);

  if (existing) {
    await db
      .update(businessesTable)
      .set({
        parentBusinessId: parentId,
        structureKind: "location",
        subverticalProfileId: profileId,
        tier: tier ?? "studio",
      })
      .where(eq(businessesTable.id, existing.id));
    return { slug: row.slug, id: existing.id };
  }

  const vertical = profile.vertical;
  const starter = getVerticalStarterPackServicesForProfile(vertical, profileId);
  const services = starter.slice(0, 4).map((s, i) => ({
    name: s.name,
    durationMinutes: s.durationMinutes,
    priceMinor: s.priceMinor,
    sortOrder: i + 1,
    category: s.category,
    imageUrl: inferDemoServiceImageUrl(s.name, vertical),
  }));
  const staff = defaultStaffForSlug(row.slug, row.name, 2);

  const biz = await createBusiness(founderUserId, {
    name: row.name,
    slug: row.slug,
    description: `${row.name} — location under ${profile.label} group demo.`,
    category: categoryForVertical(vertical),
    vertical,
    email: `hello@${slugEmailDomain(row.slug, row.country)}`,
    timezone: "Europe/Dublin",
    city: row.city,
    country: row.country ?? "IE",
    tier: tier ?? "studio",
    subverticalProfileId: profileId,
    parentBusinessId: parentId,
    structureKind: "location",
  });

  await seedShopCore(biz.id, staff, services, vertical);
  await ensureShowcaseCustomers(biz.id, 12);
  await ensureVerticalDemoPresentationPreset(biz.id, vertical);
  if (vertical === "wellness") await ensureWellnessShowcaseDepth(biz.id);

  return { slug: row.slug, id: biz.id };
}

/** Seed roster slugs missing from bespoke vertical/market seeds. Idempotent. */
export async function seedSubverticalShowcaseShops(
  founderUserId: string,
): Promise<Array<{ slug: string; id: string; name: string; vertical: BusinessVertical }>> {
  const created: Array<{ slug: string; id: string; name: string; vertical: BusinessVertical }> = [];

  for (const row of listDemoSubverticalRoster()) {
    const shop = await seedOneShowcaseShop(founderUserId, row);
    if (shop) {
      created.push(shop);
      if (row.childLocation) {
        const child = await seedMultiSiteChild(
          founderUserId,
          shop.id,
          row.childLocation,
          row.subverticalProfileId,
          row.tier,
        );
        if (child) {
          await ensureLiveDayForBusiness(child.id, { force: true });
        }
      }
    }
  }

  logger.info({ count: created.length }, "[demo] subvertical showcase shops seeded");
  return created;
}
