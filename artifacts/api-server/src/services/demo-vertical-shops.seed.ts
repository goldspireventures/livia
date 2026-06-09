import { eq } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";
import { createBusiness } from "./businesses.service";
import { seedShopCore } from "./demo-portal.service";
import { seedExpandedBookings, seedDemoInbox } from "./demo-inbox.seed";
import { ensureLiveDayForBusiness } from "./demo-live-day.service";
import { ensureDemoOperationalCases } from "./demo-operational-cases.seed";
import {
  ensureShowcaseCustomers,
  ensureShowcasePets,
  refreshVerticalShowcaseShop,
} from "./demo-showcase-depth";
import {
  PLATFORM_DEFAULT_PRESET_ID,
  demoShowcasePresentationPresetId,
  type BusinessVertical,
} from "@workspace/policy";
import { inferDemoServiceImageUrl } from "../lib/experience-skin";
import { ensureWellnessShowcaseDepth } from "./wellness-demo-depth";

/** Showcase demo shops ship vertical-native skin so Appearance + `/b` match the wedge on first walk-in. */
export async function ensureVerticalDemoPresentationPreset(
  businessId: string,
  vertical: BusinessVertical,
): Promise<boolean> {
  const [row] = await db
    .select({ presentationPresetId: businessesTable.presentationPresetId })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  const id = row?.presentationPresetId;
  const target = demoShowcasePresentationPresetId(vertical);
  if (!id || id === PLATFORM_DEFAULT_PRESET_ID) {
    await db
      .update(businessesTable)
      .set({ presentationPresetId: target })
      .where(eq(businessesTable.id, businessId));
    return true;
  }
  return false;
}

/** @deprecated Use ensureVerticalDemoPresentationPreset */
export async function ensureWellnessDemoPresentationPreset(businessId: string): Promise<void> {
  await ensureVerticalDemoPresentationPreset(businessId, "wellness");
}

/** @deprecated Use ensureVerticalDemoPresentationPreset */
export async function ensureBeautyDemoPresentationPreset(businessId: string): Promise<void> {
  await ensureVerticalDemoPresentationPreset(businessId, "beauty");
}

type ShowcaseServiceDef = {
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
};

/** Stable Unsplash card art per service name — written on seed and repair. */
function withDemoServiceImages(
  vertical: BusinessVertical,
  services: Omit<ShowcaseServiceDef, "imageUrl">[],
): ShowcaseServiceDef[] {
  return services.map((s) => ({
    ...s,
    imageUrl: inferDemoServiceImageUrl(s.name, vertical),
  }));
}

type ShowcaseDef = {
  vertical: BusinessVertical;
  name: string;
  slug: string;
  description: string;
  category: string;
  city: string;
  staff: Array<{ firstName: string; lastName: string; displayName: string; email: string; color: string }>;
  services: ShowcaseServiceDef[];
  seedPets?: Array<{ name: string; breed: string; species?: "dog" | "cat"; customerIndex?: number }>;
  country?: string;
  timezone?: string;
};

/** Extra EU vertical showcase shops — proves Livia is not salon-only. */
export async function seedVerticalShowcaseShops(
  founderUserId: string,
): Promise<Array<{ slug: string; id: string; name: string; vertical: BusinessVertical }>> {
  const defs: ShowcaseDef[] = [
    {
      vertical: "hair",
      name: "Luxe Salon & Spa",
      slug: "luxe-salon-spa",
      description: "Premium hair and colour — canonical E2E hair tenant (Dublin).",
      category: "hair_salon",
      city: "Dublin",
      staff: [
        {
          firstName: "Elena",
          lastName: "Vasquez",
          displayName: "Elena Vasquez",
          email: "elena@luxesalon.ie",
          color: "#D4A574",
        },
        {
          firstName: "James",
          lastName: "O'Brien",
          displayName: "James O'Brien",
          email: "james@luxesalon.ie",
          color: "#78716C",
        },
        {
          firstName: "Marie",
          lastName: "Dubois",
          displayName: "Marie Dubois",
          email: "marie@luxesalon.ie",
          color: "#A78BFA",
        },
      ],
      services: [
        {
          name: "Cut & blow dry",
          durationMinutes: 60,
          priceMinor: 6500,
          sortOrder: 1,
          category: "Cuts & styling",
          description: "Includes wash and finish.",
        },
        {
          name: "Full colour",
          durationMinutes: 120,
          priceMinor: 12000,
          sortOrder: 2,
          category: "Colour",
        },
        {
          name: "Balayage",
          durationMinutes: 150,
          priceMinor: 18000,
          sortOrder: 3,
          category: "Colour",
        },
        { name: "Blow dry", durationMinutes: 45, priceMinor: 4000, sortOrder: 4, category: "Cuts & styling" },
        { name: "Children's cut", durationMinutes: 30, priceMinor: 3500, sortOrder: 5, category: "Cuts & styling" },
      ],
    },
    {
      vertical: "beauty",
      name: "Bloom Beauty Dublin",
      slug: "bloom-beauty-dublin",
      description: "Lashes, nails, and brows — South King Street.",
      category: "beauty",
      city: "Dublin",
      staff: [
        { firstName: "Zara", lastName: "Keane", displayName: "Zara Keane", email: "zara@bloom.ie", color: "#EC4899" },
        { firstName: "Mia", lastName: "Walsh", displayName: "Mia Walsh", email: "mia@bloom.ie", color: "#F472B6" },
        { firstName: "Leah", lastName: "Nguyen", displayName: "Leah Nguyen", email: "leah@bloom.ie", color: "#DB2777" },
      ],
      services: withDemoServiceImages("beauty", [
        {
          name: "Lash fill",
          durationMinutes: 60,
          priceMinor: 5500,
          sortOrder: 1,
          category: "Lashes",
          description: "Maintenance fill — 2–3 week cycle.",
          serviceKind: "fill",
          rebookIntervalDays: 14,
          requiresPatchTest: true,
        },
        {
          name: "Classic manicure",
          durationMinutes: 45,
          priceMinor: 3500,
          sortOrder: 2,
          category: "Nails",
          serviceKind: "other",
        },
        {
          name: "Brow shape & tint",
          durationMinutes: 30,
          priceMinor: 2500,
          sortOrder: 3,
          category: "Brows",
          serviceKind: "maintenance",
          rebookIntervalDays: 28,
          requiresPatchTest: true,
        },
        {
          name: "Gel nails",
          durationMinutes: 60,
          priceMinor: 4500,
          sortOrder: 4,
          category: "Nails",
          serviceKind: "maintenance",
          rebookIntervalDays: 21,
        },
        {
          name: "Classic lash full set",
          durationMinutes: 120,
          priceMinor: 8500,
          sortOrder: 5,
          category: "Lashes",
          serviceKind: "full_set",
          rebookIntervalDays: 21,
          requiresPatchTest: true,
        },
      ]),
    },
    {
      vertical: "wellness",
      name: "Harbour Wellness Cork",
      slug: "harbour-wellness-cork",
      description: "Massage and holistic therapy — Victorian Quarter.",
      category: "wellness",
      city: "Cork",
      staff: [
        {
          firstName: "Orla",
          lastName: "Fitzgerald",
          displayName: "Orla Fitzgerald",
          email: "orla@harbour.ie",
          color: "#14B8A6",
        },
        {
          firstName: "Niamh",
          lastName: "Costello",
          displayName: "Niamh Costello",
          email: "niamh@harbour.ie",
          color: "#0D9488",
        },
        {
          firstName: "Tom",
          lastName: "Reid",
          displayName: "Tom Reid",
          email: "tom@harbour.ie",
          color: "#2DD4BF",
        },
      ],
      services: [
        { name: "60 min massage", durationMinutes: 60, priceMinor: 7000, sortOrder: 1 },
        { name: "90 min massage", durationMinutes: 90, priceMinor: 9500, sortOrder: 2 },
        { name: "Hot stone therapy", durationMinutes: 75, priceMinor: 8500, sortOrder: 3 },
        { name: "Reflexology", durationMinutes: 50, priceMinor: 6000, sortOrder: 4 },
        { name: "Couples massage", durationMinutes: 60, priceMinor: 14000, sortOrder: 5 },
      ],
    },
    {
      vertical: "body-art",
      name: "Ink & Anchor Galway",
      slug: "ink-anchor-galway",
      description: "Tattoo studio — consult-first, long sessions.",
      category: "tattoo",
      city: "Galway",
      staff: [
        { firstName: "Rory", lastName: "Mannion", displayName: "Rory Mannion", email: "rory@ink.ie", color: "#F97316" },
        { firstName: "Siobhan", lastName: "Kelly", displayName: "Siobhan Kelly", email: "siobhan@ink.ie", color: "#FB923C" },
        { firstName: "Dylan", lastName: "Hayes", displayName: "Dylan Hayes", email: "dylan@ink.ie", color: "#EA580C" },
      ],
      services: [
        { name: "Consultation", durationMinutes: 30, priceMinor: 0, sortOrder: 1, category: "Consultations" },
        { name: "Tattoo session (2h)", durationMinutes: 120, priceMinor: 20000, sortOrder: 2, category: "Sessions" },
        { name: "Tattoo session (4h)", durationMinutes: 240, priceMinor: 38000, sortOrder: 3, category: "Sessions" },
        { name: "Touch-up", durationMinutes: 60, priceMinor: 8000, sortOrder: 4, category: "Sessions" },
        { name: "Cover-up consult", durationMinutes: 45, priceMinor: 0, sortOrder: 5, category: "Consultations" },
      ],
    },
    {
      vertical: "pet-grooming",
      name: "Paws Parlour Dublin",
      slug: "paws-parlour-dublin",
      description: "Dog & cat grooming — Rathmines. Temperament-first handling.",
      category: "pet-grooming",
      city: "Dublin",
      staff: [
        {
          firstName: "Jade",
          lastName: "Murphy",
          displayName: "Jade Murphy",
          email: "jade@pawsparlor.ie",
          color: "#A855F7",
        },
        {
          firstName: "Rory",
          lastName: "Chen",
          displayName: "Rory Chen",
          email: "rory@pawsparlor.ie",
          color: "#9333EA",
        },
        {
          firstName: "Amy",
          lastName: "Walsh",
          displayName: "Amy Walsh",
          email: "amy@pawsparlor.ie",
          color: "#C084FC",
        },
      ],
      services: [
        { name: "Full groom (medium dog)", durationMinutes: 90, priceMinor: 5500, sortOrder: 1 },
        { name: "Bath & tidy", durationMinutes: 60, priceMinor: 3500, sortOrder: 2 },
        { name: "Nail trim", durationMinutes: 20, priceMinor: 1500, sortOrder: 3 },
        { name: "Full groom (large dog)", durationMinutes: 120, priceMinor: 7000, sortOrder: 4 },
        { name: "Cat groom", durationMinutes: 75, priceMinor: 6000, sortOrder: 5 },
      ],
      seedPets: [
        { name: "Biscuit", breed: "Cockapoo", customerIndex: 0 },
        { name: "Mochi", breed: "Shih Tzu", customerIndex: 1 },
      ],
    },
    {
      vertical: "medspa",
      name: "Clarity Medspa Dublin",
      slug: "clarity-medspa-dublin",
      description: "Medical aesthetics — consultation-led treatments on St Stephen's Green.",
      category: "medspa",
      city: "Dublin",
      staff: [
        {
          firstName: "Dr",
          lastName: "Ní Cheallaigh",
          displayName: "Dr Ní Cheallaigh",
          email: "clinical@claritymedspa.ie",
          color: "#8B5CF6",
        },
        {
          firstName: "Sinead",
          lastName: "Moran",
          displayName: "Sinead Moran",
          email: "sinead@claritymedspa.ie",
          color: "#7C3AED",
        },
        {
          firstName: "Aoife",
          lastName: "Daly",
          displayName: "Aoife Daly",
          email: "aoife@claritymedspa.ie",
          color: "#A78BFA",
        },
      ],
      services: [
        { name: "Aesthetics consultation", durationMinutes: 30, priceMinor: 0, sortOrder: 1 },
        { name: "Treatment session (60 min)", durationMinutes: 60, priceMinor: 15000, sortOrder: 2 },
        { name: "Follow-up review", durationMinutes: 20, priceMinor: 0, sortOrder: 3 },
        { name: "Skin peel", durationMinutes: 45, priceMinor: 12000, sortOrder: 4 },
        { name: "LED therapy", durationMinutes: 30, priceMinor: 8000, sortOrder: 5 },
      ],
    },
    {
      vertical: "allied-health",
      name: "Motion Physio Cork",
      slug: "motion-physio-cork",
      description: "Physiotherapy & rehab — Douglas Street.",
      category: "physio",
      city: "Cork",
      staff: [
        {
          firstName: "Eoin",
          lastName: "Barrett",
          displayName: "Eoin Barrett",
          email: "eoin@motionphysio.ie",
          color: "#0EA5E9",
        },
        {
          firstName: "Sarah",
          lastName: "Lynch",
          displayName: "Sarah Lynch",
          email: "sarah@motionphysio.ie",
          color: "#0284C7",
        },
        {
          firstName: "Mark",
          lastName: "O'Donnell",
          displayName: "Mark O'Donnell",
          email: "mark@motionphysio.ie",
          color: "#38BDF8",
        },
      ],
      services: [
        { name: "Initial assessment", durationMinutes: 45, priceMinor: 6500, sortOrder: 1 },
        { name: "Follow-up session", durationMinutes: 30, priceMinor: 4500, sortOrder: 2 },
        { name: "Sports massage (30 min)", durationMinutes: 30, priceMinor: 5000, sortOrder: 3 },
        { name: "Rehab block (45 min)", durationMinutes: 45, priceMinor: 5500, sortOrder: 4 },
        { name: "Dry needling", durationMinutes: 30, priceMinor: 4800, sortOrder: 5 },
      ],
    },
    {
      vertical: "automotive-detailing",
      name: "Shine Studio Belfast",
      slug: "shine-studio-belfast",
      description: "Premium detailing & valeting — Titanic Quarter.",
      category: "detailing",
      city: "Belfast",
      country: "GB",
      timezone: "Europe/London",
      staff: [
        {
          firstName: "Marc",
          lastName: "Dalton",
          displayName: "Marc Dalton",
          email: "marc@shinestudio.co.uk",
          color: "#64748B",
        },
        {
          firstName: "Chris",
          lastName: "Bell",
          displayName: "Chris Bell",
          email: "chris@shinestudio.co.uk",
          color: "#475569",
        },
        {
          firstName: "Jamie",
          lastName: "Reid",
          displayName: "Jamie Reid",
          email: "jamie@shinestudio.co.uk",
          color: "#334155",
        },
      ],
      services: [
        { name: "Exterior detail", durationMinutes: 120, priceMinor: 12000, sortOrder: 1 },
        { name: "Interior + exterior", durationMinutes: 180, priceMinor: 18000, sortOrder: 2 },
        { name: "Maintenance wash", durationMinutes: 45, priceMinor: 4500, sortOrder: 3 },
        { name: "Ceramic coating", durationMinutes: 240, priceMinor: 45000, sortOrder: 4 },
        { name: "Paint correction", durationMinutes: 300, priceMinor: 55000, sortOrder: 5 },
      ],
    },
    {
      vertical: "fitness",
      name: "Peak Fitness Dublin",
      slug: "peak-fitness-dublin",
      description: "PT and small-group classes — Docklands.",
      category: "fitness",
      city: "Dublin",
      staff: [
        {
          firstName: "Sam",
          lastName: "Okafor",
          displayName: "Sam Okafor",
          email: "sam@peakfitness.ie",
          color: "#22C55E",
        },
        {
          firstName: "Lisa",
          lastName: "Grant",
          displayName: "Lisa Grant",
          email: "lisa@peakfitness.ie",
          color: "#16A34A",
        },
        {
          firstName: "Conor",
          lastName: "Flynn",
          displayName: "Conor Flynn",
          email: "conor@peakfitness.ie",
          color: "#4ADE80",
        },
      ],
      services: [
        { name: "Intro assessment", durationMinutes: 45, priceMinor: 0, sortOrder: 1 },
        { name: "PT session (60 min)", durationMinutes: 60, priceMinor: 6000, sortOrder: 2 },
        { name: "Group class (45 min)", durationMinutes: 45, priceMinor: 2200, sortOrder: 3 },
        { name: "HIIT class", durationMinutes: 45, priceMinor: 2200, sortOrder: 4 },
        { name: "Nutrition check-in", durationMinutes: 30, priceMinor: 3500, sortOrder: 5 },
      ],
    },
  ];

  const created: Array<{ slug: string; id: string; name: string; vertical: BusinessVertical }> = [];
  const now = new Date();

  for (const raw of defs) {
    const d: ShowcaseDef = {
      ...raw,
      services: raw.services.some((s) => s.imageUrl)
        ? raw.services
        : withDemoServiceImages(raw.vertical, raw.services),
    };
    const [existing] = await db
      .select({ id: businessesTable.id, slug: businessesTable.slug, name: businessesTable.name, vertical: businessesTable.vertical })
      .from(businessesTable)
      .where(eq(businessesTable.slug, d.slug))
      .limit(1);

    if (existing) {
      await refreshVerticalShowcaseShop(existing.id, d);
      await ensureVerticalDemoPresentationPreset(existing.id, d.vertical);
      if (d.vertical === "wellness") {
        await ensureWellnessShowcaseDepth(existing.id);
      }
      created.push({
        slug: existing.slug,
        id: existing.id,
        name: existing.name,
        vertical: existing.vertical as BusinessVertical,
      });
      continue;
    }

    const biz = await createBusiness(founderUserId, {
      name: d.name,
      slug: d.slug,
      description: d.description,
      category: d.category,
      vertical: d.vertical,
      email: `hello@${d.slug.replace(/-/g, "")}.${d.country === "GB" ? "co.uk" : "ie"}`,
      timezone: d.timezone ?? "Europe/Dublin",
      city: d.city,
      country: d.country ?? "IE",
      tier: "solo",
    });

    const core = await seedShopCore(biz.id, d.staff, d.services, d.vertical);
    if (d.vertical === "beauty") {
      const { seedBeautyRetailTemplates } = await import("./beauty-retail.service");
      await seedBeautyRetailTemplates(biz.id);
    }
    if (d.vertical === "wellness") {
      const { seedWellnessRetailTemplates } = await import("./beauty-retail.service");
      await seedWellnessRetailTemplates(biz.id);
    }
    const customers = await ensureShowcaseCustomers(biz.id, 20);
    if (d.seedPets?.length) {
      await ensureShowcasePets(
        biz.id,
        customers.map((c) => c.id),
        d.seedPets,
      );
    }
    const bookingKeys = await seedExpandedBookings(
      biz.id,
      customers,
      core.staffRows.map((s) => s.id),
      core.serviceRows.map((s) => s.id),
      now,
    );
    await seedDemoInbox(biz.id, customers, { vertical: d.vertical, bookingKeys });
    await ensureDemoOperationalCases(biz.id, biz.slug, bookingKeys);
    await ensureLiveDayForBusiness(biz.id, {
      force: true,
      customerSeed: customers,
      staffIds: core.staffRows.map((s) => s.id),
      serviceIds: core.serviceRows.map((s) => s.id),
    });
    await ensureVerticalDemoPresentationPreset(biz.id, d.vertical);
    if (d.vertical === "wellness") {
      await ensureWellnessShowcaseDepth(biz.id);
    }
    created.push({ slug: biz.slug, id: biz.id, name: biz.name, vertical: d.vertical });
  }

  return created;
}
