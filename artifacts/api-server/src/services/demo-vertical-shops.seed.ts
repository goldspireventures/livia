import { eq } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";
import { createBusiness } from "./businesses.service";
import { seedShopCore } from "./demo-portal.service";
import { seedExpandedBookings, seedDemoInbox } from "./demo-inbox.seed";
import { ensureLiveDayForBusiness } from "./demo-live-day.service";
import { createPet } from "./pets.service";
import { ensureDemoOperationalCases } from "./demo-operational-cases.seed";
import { applyDemoPublicBranding } from "../lib/demo-public-assets";
import { backfillDemoServiceImages } from "../lib/demo-service-images";
import type { BusinessVertical } from "@workspace/policy";

/** Extra EU vertical showcase shops — proves Livia is not salon-only. */
export async function seedVerticalShowcaseShops(
  founderUserId: string,
): Promise<Array<{ slug: string; id: string; name: string; vertical: BusinessVertical }>> {
  const defs: Array<{
    vertical: BusinessVertical;
    name: string;
    slug: string;
    description: string;
    category: string;
    city: string;
    staff: Array<{ firstName: string; lastName: string; displayName: string; email: string; color: string }>;
    services: Array<{
      name: string;
      durationMinutes: number;
      priceMinor: number;
      sortOrder: number;
      category?: string;
      description?: string;
    }>;
    /** Seed a pet profile on the first demo customer (pet-grooming only). */
    seedPet?: { name: string; breed: string };
    country?: string;
    timezone?: string;
  }> = [
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
      ],
      services: [
        {
          name: "Lash fill",
          durationMinutes: 60,
          priceMinor: 5500,
          sortOrder: 1,
          category: "Lashes & brows",
        },
        {
          name: "Classic manicure",
          durationMinutes: 45,
          priceMinor: 3500,
          sortOrder: 2,
          category: "Nails",
        },
        {
          name: "Brow shape",
          durationMinutes: 30,
          priceMinor: 2500,
          sortOrder: 3,
          category: "Lashes & brows",
        },
      ],
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
      ],
      services: [
        { name: "60 min massage", durationMinutes: 60, priceMinor: 7000, sortOrder: 1 },
        { name: "90 min massage", durationMinutes: 90, priceMinor: 9500, sortOrder: 2 },
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
      ],
      services: [
        { name: "Consultation", durationMinutes: 30, priceMinor: 0, sortOrder: 1, category: "Consultations" },
        { name: "Tattoo session (2h)", durationMinutes: 120, priceMinor: 20000, sortOrder: 2, category: "Sessions" },
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
      ],
      services: [
        { name: "Full groom (medium dog)", durationMinutes: 90, priceMinor: 5500, sortOrder: 1 },
        { name: "Bath & tidy", durationMinutes: 60, priceMinor: 3500, sortOrder: 2 },
        { name: "Nail trim", durationMinutes: 20, priceMinor: 1500, sortOrder: 3 },
      ],
      seedPet: { name: "Biscuit", breed: "Cockapoo" },
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
      ],
      services: [
        { name: "Aesthetics consultation", durationMinutes: 30, priceMinor: 0, sortOrder: 1 },
        { name: "Treatment session (60 min)", durationMinutes: 60, priceMinor: 15000, sortOrder: 2 },
        { name: "Follow-up review", durationMinutes: 20, priceMinor: 0, sortOrder: 3 },
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
      ],
      services: [
        { name: "Initial assessment", durationMinutes: 45, priceMinor: 6500, sortOrder: 1 },
        { name: "Follow-up session", durationMinutes: 30, priceMinor: 4500, sortOrder: 2 },
        { name: "Sports massage (30 min)", durationMinutes: 30, priceMinor: 5000, sortOrder: 3 },
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
      ],
      services: [
        { name: "Exterior detail", durationMinutes: 120, priceMinor: 12000, sortOrder: 1 },
        { name: "Interior + exterior", durationMinutes: 180, priceMinor: 18000, sortOrder: 2 },
        { name: "Maintenance wash", durationMinutes: 45, priceMinor: 4500, sortOrder: 3 },
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
      ],
      services: [
        { name: "Intro assessment", durationMinutes: 45, priceMinor: 0, sortOrder: 1 },
        { name: "PT session (60 min)", durationMinutes: 60, priceMinor: 6000, sortOrder: 2 },
        { name: "Group class (45 min)", durationMinutes: 45, priceMinor: 2200, sortOrder: 3 },
      ],
    },
  ];

  const created: Array<{ slug: string; id: string; name: string; vertical: BusinessVertical }> = [];
  const now = new Date();

  for (const d of defs) {
    const [existing] = await db
      .select({ id: businessesTable.id, slug: businessesTable.slug, name: businessesTable.name, vertical: businessesTable.vertical })
      .from(businessesTable)
      .where(eq(businessesTable.slug, d.slug))
      .limit(1);

    if (existing) {
      await applyDemoPublicBranding(existing.id, d.vertical);
      await backfillDemoServiceImages(existing.id, d.vertical);
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
    await applyDemoPublicBranding(biz.id, d.vertical);
    if (d.seedPet && core.customers[0]) {
      await createPet(biz.id, core.customers[0].id, {
        name: d.seedPet.name,
        breed: d.seedPet.breed,
        species: "dog",
        behaviourNotes: "Friendly; nervous with dryers",
      });
    }
    const bookingKeys = await seedExpandedBookings(
      biz.id,
      core.customers,
      core.staffRows.map((s) => s.id),
      core.serviceRows.map((s) => s.id),
      now,
    );
    await seedDemoInbox(biz.id, core.customers, { vertical: d.vertical, bookingKeys });
    await ensureDemoOperationalCases(biz.id, biz.slug, bookingKeys);
    await ensureLiveDayForBusiness(biz.id, {
      force: true,
      customerSeed: core.customers,
      staffIds: core.staffRows.map((s) => s.id),
      serviceIds: core.serviceRows.map((s) => s.id),
    });
    created.push({ slug: biz.slug, id: biz.id, name: biz.name, vertical: d.vertical });
  }

  return created;
}
