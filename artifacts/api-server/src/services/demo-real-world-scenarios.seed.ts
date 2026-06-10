/**
 * Real-life scenario seed — complements Aurora chain + vertical showcase.
 */
import { eq } from "drizzle-orm";
import { db, businessesTable, customersTable } from "@workspace/db";
import { createBusiness } from "./businesses.service";
import { seedShopCore } from "./demo-portal.service";
import { seedExpandedBookings, seedDemoInbox } from "./demo-inbox.seed";
import { ensureLiveDayForBusiness } from "./demo-live-day.service";
import { createPremises, provisionCoTenantAtPremises, getPremisesBySlug } from "./premises.service";
import { createDayPackage, listDayPackages } from "./day-packages.service";
import { createCareSeries, listCareSeries } from "./care-series.service";
import { createBookingResource, listBookingResources } from "./booking-resources.service";
import { listServices } from "./services.service";
import { logger } from "../lib/logger";

export const REAL_WORLD_SLUGS = [
  "stoneybatter-cuts",
  "dublin-barber-collective",
  "dundrum-hair-studio",
  "dundrum-serenity-spa",
] as const;

export const REAL_WORLD_PREMISES_SLUG = "dundrum-house";

type ShopDef = {
  name: string;
  slug: string;
  description: string;
  vertical: "hair" | "beauty" | "wellness";
  tier: "solo" | "studio";
  subverticalProfileId?: string;
  city: string;
  staff: Parameters<typeof seedShopCore>[1];
  services: Parameters<typeof seedShopCore>[2];
};

async function ensureShop(
  ownerId: string,
  def: ShopDef,
  now: Date,
): Promise<{ slug: string; id: string; name: string }> {
  const [existing] = await db
    .select({ id: businessesTable.id, slug: businessesTable.slug, name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.slug, def.slug))
    .limit(1);
  if (existing) {
    return existing;
  }

  const biz = await createBusiness(ownerId, {
    name: def.name,
    slug: def.slug,
    description: def.description,
    category: def.vertical === "hair" ? "barbershop" : def.vertical,
    vertical: def.vertical,
    email: `hello@${def.slug.replace(/-/g, "")}.ie`,
    phone: "+353 1 555 0199",
    timezone: "Europe/Dublin",
    city: def.city,
    country: "IE",
    tier: def.tier,
    subverticalProfileId: def.subverticalProfileId,
    addressLine1: "14 Main Street",
  });
  const core = await seedShopCore(biz.id, def.staff, def.services);
  await seedExpandedBookings(
    biz.id,
    core.customers,
    core.staffRows.map((s) => s.id),
    core.serviceRows.map((s) => s.id),
    now,
  );
  await seedDemoInbox(biz.id, core.customers);
  await ensureLiveDayForBusiness(biz.id, {
    force: true,
    customerSeed: core.customers,
    staffIds: core.staffRows.map((s) => s.id),
    serviceIds: core.serviceRows.map((s) => s.id),
  });
  return { slug: biz.slug, id: biz.id, name: biz.name };
}

export async function seedRealWorldScenarios(
  founderUserId: string,
): Promise<{
  businesses: Array<{ slug: string; id: string; name: string }>;
  premisesSlug: string;
}> {
  const now = new Date();
  const created: Array<{ slug: string; id: string; name: string }> = [];

  created.push(
    await ensureShop(founderUserId, {
      name: "Stoneybatter Cuts",
      slug: "stoneybatter-cuts",
      description: "Single-chair barber — owner runs the floor and the books.",
      vertical: "hair",
      tier: "solo",
      subverticalProfileId: "hair.barber",
      city: "Dublin",
      staff: [
        {
          firstName: "Conor",
          lastName: "McGee",
          displayName: "Conor McGee",
          email: "conor@stoneybatter.ie",
          color: "#3B82F6",
        },
      ],
      services: [
        { name: "Skin fade", durationMinutes: 40, priceMinor: 3200, sortOrder: 1 },
        { name: "Beard trim", durationMinutes: 20, priceMinor: 1500, sortOrder: 2 },
      ],
    }, now),
  );

  created.push(
    await ensureShop(founderUserId, {
      name: "Dublin Barber Collective",
      slug: "dublin-barber-collective",
      description: "Six-chair shop — South William Street.",
      vertical: "hair",
      tier: "studio",
      subverticalProfileId: "hair.barber",
      city: "Dublin",
      staff: [
        { firstName: "Liam", lastName: "O'Brien", displayName: "Liam O'Brien", email: "liam@dbc.ie", color: "#0EA5E9" },
        { firstName: "Sean", lastName: "Kelly", displayName: "Sean Kelly", email: "sean@dbc.ie", color: "#6366F1" },
        { firstName: "James", lastName: "Murphy", displayName: "James Murphy", email: "james@dbc.ie", color: "#8B5CF6" },
        { firstName: "Oisin", lastName: "Ryan", displayName: "Oisin Ryan", email: "oisin@dbc.ie", color: "#10B981" },
        { firstName: "Niall", lastName: "Burke", displayName: "Niall Burke", email: "niall@dbc.ie", color: "#F59E0B" },
        { firstName: "Roisin", lastName: "Founder", displayName: "Roisin Doherty", email: "roisin@dbc.ie", color: "#EC4899" },
      ],
      services: [
        { name: "Cut & style", durationMinutes: 45, priceMinor: 3800, sortOrder: 1 },
        { name: "Hot towel shave", durationMinutes: 30, priceMinor: 2500, sortOrder: 2 },
      ],
    }, now),
  );

  const hairAtDundrum = await ensureShop(founderUserId, {
    name: "Dundrum Hair Studio",
    slug: "dundrum-hair-studio",
    description: "Hair colour and cut — upstairs in Dundrum House.",
    vertical: "hair",
    tier: "studio",
    subverticalProfileId: "hair.salon",
    city: "Dundrum",
    staff: [
      { firstName: "Kate", lastName: "Flynn", displayName: "Kate Flynn", email: "kate@dundrumhair.ie", color: "#A855F7" },
      { firstName: "Amy", lastName: "Lo", displayName: "Amy Lo", email: "amy@dundrumhair.ie", color: "#D946EF" },
    ],
    services: [
      { name: "Cut & blowdry", durationMinutes: 60, priceMinor: 5500, sortOrder: 1 },
      { name: "Full colour", durationMinutes: 120, priceMinor: 11000, sortOrder: 2 },
    ],
  }, now);
  created.push(hairAtDundrum);

  let premises = await getPremisesBySlug(REAL_WORLD_PREMISES_SLUG);
  if (!premises) {
    await createPremises(founderUserId, {
      displayName: "Dundrum House — Hair & Spa",
      slug: REAL_WORLD_PREMISES_SLUG,
      addressLine1: "Dundrum House, Sandyford Rd",
      city: "Dundrum",
      sharedPhone: "+35315550200",
      anchorBusinessId: hairAtDundrum.id,
      anchorPublicLabel: "Dundrum Hair Studio",
    });
    premises = await getPremisesBySlug(REAL_WORLD_PREMISES_SLUG);
  }

  if (premises && !premises.tenants.some((t) => t.slug === "dundrum-serenity-spa")) {
    const { business: spa } = await provisionCoTenantAtPremises(founderUserId, premises.id, {
      name: "Serenity Spa Dundrum",
      slug: "dundrum-serenity-spa",
      publicLabel: "Serenity Spa (nails & massage)",
      vertical: "wellness",
      tier: "solo",
    });
    const core = await seedShopCore(
      spa.id,
      [
        {
          firstName: "Maeve",
          lastName: "Collins",
          displayName: "Maeve Collins",
          email: "maeve@serenityspa.ie",
          color: "#14B8A6",
        },
      ],
      [
        { name: "Swedish massage 60", durationMinutes: 60, priceMinor: 7500, sortOrder: 1 },
        { name: "Express facial", durationMinutes: 45, priceMinor: 6500, sortOrder: 2 },
      ],
    );
    await ensureLiveDayForBusiness(spa.id, {
      force: true,
      customerSeed: core.customers,
      staffIds: core.staffRows.map((s) => s.id),
      serviceIds: core.serviceRows.map((s) => s.id),
    });
    created.push({ slug: spa.slug, id: spa.id, name: spa.name });
  }

  const [harbour] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, "harbour-wellness-cork"))
    .limit(1);
  if (harbour) {
    const services = await listServices(harbour.id, true);
    const massage = services.find((s) => s.name.toLowerCase().includes("60 min"));
    const existingPkgs = await listDayPackages(harbour.id, false);
    if (massage && !existingPkgs.some((p) => p.name === "Harbour Day Escape")) {
      const resources = await listBookingResources(harbour.id, false);
      let thermal = resources.find((r) => r.name === "Thermal suite");
      if (!thermal) {
        thermal = await createBookingResource(harbour.id, {
          name: "Thermal suite",
          resourceType: "thermal",
          capacity: 4,
        });
      }
      await createDayPackage(harbour.id, {
        name: "Harbour Day Escape",
        description: "Massage + thermal recovery — half-day ritual.",
        priceMinor: 14900,
        steps: [
          {
            serviceId: massage.id,
            durationMinutes: 60,
            bufferAfterMinutes: 20,
            label: "Massage",
            resourceId: thermal?.id,
          },
          {
            serviceId: massage.id,
            durationMinutes: 30,
            bufferAfterMinutes: 15,
            label: "Thermal lounge",
            resourceId: thermal?.id,
          },
        ],
      });
    }
  }

  const [physio] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, "motion-physio-cork"))
    .limit(1);
  if (physio) {
    const services = await listServices(physio.id, true);
    const followUp = services.find((s) => s.name.toLowerCase().includes("follow-up"));
    const [customer] = await db
      .select({ id: customersTable.id })
      .from(customersTable)
      .where(eq(customersTable.businessId, physio.id))
      .limit(1);
    const existingSeries = await listCareSeries(physio.id);
    if (followUp && customer && !existingSeries.some((s) => s.name.includes("ACL rehab"))) {
      await createCareSeries(physio.id, {
        customerId: customer.id,
        name: "ACL rehab — 6 sessions",
        serviceId: followUp.id,
        sessionsTotal: 6,
        cadenceDays: 14,
      });
    }
  }

  const { seedOperatorLivWorld } = await import("./demo-operator-liv-world.seed");
  const operatorLiv = await seedOperatorLivWorld();

  logger.info(
    {
      event: "demo.seed.real_world.ok",
      business_slugs: created.map((b) => b.slug),
      premises_slug: REAL_WORLD_PREMISES_SLUG,
      operatorLiv,
    },
    "Real-world demo scenarios seeded",
  );

  return { businesses: created, premisesSlug: REAL_WORLD_PREMISES_SLUG };
}
