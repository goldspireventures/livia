/**
 * EU market showcase — GB / DE / FR shops so founders see locale, timezone, and currency diversity.
 */
import { eq } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";
import { createBusiness } from "./businesses.service";
import { seedShopCore } from "./demo-portal.service";
import { seedExpandedBookings, seedDemoInbox } from "./demo-inbox.seed";
import { ensureLiveDayForBusiness } from "./demo-live-day.service";

export const MARKET_SHOWCASE_SLUGS = [
  "london-rose-spa",
  "berlin-studio-neun",
  "paris-belle-vue",
  "copenhagen-havn-wellness",
] as const;

type MarketDef = {
  name: string;
  slug: (typeof MARKET_SHOWCASE_SLUGS)[number];
  description: string;
  city: string;
  country: string;
  locale: string;
  timezone: string;
  currency: string;
  email: string;
  staff: Parameters<typeof seedShopCore>[1];
  services: Parameters<typeof seedShopCore>[2];
};

const MARKETS: MarketDef[] = [
  {
    name: "Rose Spa London",
    slug: "london-rose-spa",
    description: "Hair & beauty — Marylebone. UK pricing and quiet-hour defaults.",
    city: "London",
    country: "GB",
    locale: "en-GB",
    timezone: "Europe/London",
    currency: "GBP",
    email: "hello@rosespalondon.co.uk",
    staff: [
      {
        firstName: "Amelia",
        lastName: "Hart",
        displayName: "Amelia Hart",
        email: "amelia@rosespalondon.co.uk",
        color: "#DB2777",
      },
    ],
    services: [
      { name: "Cut & blow-dry", durationMinutes: 60, priceMinor: 7200, sortOrder: 1 },
      { name: "Balayage consult", durationMinutes: 30, priceMinor: 0, sortOrder: 2 },
    ],
  },
  {
    name: "Studio Neun Berlin",
    slug: "berlin-studio-neun",
    description: "Barbershop — Kreuzberg. Formal Sie register in DE continuity templates.",
    city: "Berlin",
    country: "DE",
    locale: "de-DE",
    timezone: "Europe/Berlin",
    currency: "EUR",
    email: "hallo@studioneun.de",
    staff: [
      {
        firstName: "Jonas",
        lastName: "Weber",
        displayName: "Jonas Weber",
        email: "jonas@studioneun.de",
        color: "#2563EB",
      },
    ],
    services: [
      { name: "Herrenschnitt", durationMinutes: 45, priceMinor: 3800, sortOrder: 1 },
      { name: "Bartpflege", durationMinutes: 25, priceMinor: 2200, sortOrder: 2 },
    ],
  },
  {
    name: "Belle Vue Paris",
    slug: "paris-belle-vue",
    description: "Nails & brows — Le Marais. Text-first FR pack (voice gated).",
    city: "Paris",
    country: "FR",
    locale: "fr-FR",
    timezone: "Europe/Paris",
    currency: "EUR",
    email: "bonjour@bellevueparis.fr",
    staff: [
      {
        firstName: "Camille",
        lastName: "Dupont",
        displayName: "Camille Dupont",
        email: "camille@bellevueparis.fr",
        color: "#7C3AED",
      },
    ],
    services: [
      { name: "Manucure classique", durationMinutes: 45, priceMinor: 4200, sortOrder: 1 },
      { name: "Sourcils", durationMinutes: 30, priceMinor: 2800, sortOrder: 2 },
    ],
  },
  {
    name: "Havn Wellness København",
    slug: "copenhagen-havn-wellness",
    description: "Massage & sauna — Nørrebro. Danish quiet hours and DKK pricing.",
    city: "Copenhagen",
    country: "DK",
    locale: "da-DK",
    timezone: "Europe/Copenhagen",
    currency: "DKK",
    email: "hej@havnwellness.dk",
    staff: [
      {
        firstName: "Freja",
        lastName: "Nielsen",
        displayName: "Freja Nielsen",
        email: "freja@havnwellness.dk",
        color: "#0D9488",
      },
    ],
    services: [
      { name: "60 min massage", durationMinutes: 60, priceMinor: 65000, sortOrder: 1 },
      { name: "Sauna & rest", durationMinutes: 45, priceMinor: 32000, sortOrder: 2 },
    ],
  },
];

export async function seedMarketShowcaseShops(
  founderUserId: string,
): Promise<Array<{ slug: string; id: string; name: string; country: string; locale: string }>> {
  const now = new Date();
  const created: Array<{ slug: string; id: string; name: string; country: string; locale: string }> = [];

  for (const m of MARKETS) {
    const [existing] = await db
      .select({
        id: businessesTable.id,
        slug: businessesTable.slug,
        name: businessesTable.name,
        country: businessesTable.country,
        locale: businessesTable.locale,
      })
      .from(businessesTable)
      .where(eq(businessesTable.slug, m.slug))
      .limit(1);

    if (existing) {
      created.push({
        slug: existing.slug,
        id: existing.id,
        name: existing.name,
        country: existing.country ?? m.country,
        locale: existing.locale ?? m.locale,
      });
      await ensureLiveDayForBusiness(existing.id, { force: true });
      continue;
    }

    const biz = await createBusiness(founderUserId, {
      name: m.name,
      slug: m.slug,
      description: m.description,
      category: "beauty",
      vertical: "beauty",
      email: m.email,
      timezone: m.timezone,
      city: m.city,
      country: m.country,
      locale: m.locale,
      tier: "solo",
    });

    const core = await seedShopCore(biz.id, m.staff, m.services);
    await seedExpandedBookings(
      biz.id,
      core.customers,
      core.staffRows.map((s) => s.id),
      core.serviceRows.map((s) => s.id),
      now,
    );
    await seedDemoInbox(biz.id, core.customers, {
      pendingBookingNotes: "Pending — Liv awaiting confirmation",
    });
    await ensureLiveDayForBusiness(biz.id, {
      force: true,
      customerSeed: core.customers,
      staffIds: core.staffRows.map((s) => s.id),
      serviceIds: core.serviceRows.map((s) => s.id),
    });

    created.push({
      slug: biz.slug,
      id: biz.id,
      name: biz.name,
      country: m.country,
      locale: m.locale,
    });
  }

  return created;
}
