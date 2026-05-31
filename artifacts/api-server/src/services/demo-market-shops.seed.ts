/**
 * EU market showcase — GB / DE / FR / DK shops (locale, currency, timezone diversity).
 * Depth per DEMO-WORLD-LIVE-SPEC via demo-showcase-depth helpers.
 */
import { eq } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";
import { createBusiness } from "./businesses.service";
import { seedShopCore } from "./demo-portal.service";
import { seedExpandedBookings, seedDemoInbox } from "./demo-inbox.seed";
import { ensureLiveDayForBusiness } from "./demo-live-day.service";
import {
  ensureShowcaseCustomers,
  refreshVerticalShowcaseShop,
} from "./demo-showcase-depth";
import { applyDemoPublicBranding } from "../lib/demo-public-assets";
import type { BusinessVertical } from "@workspace/policy";

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
  vertical: BusinessVertical;
  category: string;
  email: string;
  staff: Array<{ firstName: string; lastName: string; displayName: string; email: string; color: string }>;
  services: Array<{
    name: string;
    durationMinutes: number;
    priceMinor: number;
    sortOrder: number;
    category?: string;
  }>;
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
    vertical: "hair",
    category: "hair_salon",
    email: "hello@rosespalondon.co.uk",
    staff: [
      {
        firstName: "Amelia",
        lastName: "Hart",
        displayName: "Amelia Hart",
        email: "amelia@rosespalondon.co.uk",
        color: "#DB2777",
      },
      {
        firstName: "Priya",
        lastName: "Shah",
        displayName: "Priya Shah",
        email: "priya@rosespalondon.co.uk",
        color: "#EC4899",
      },
      {
        firstName: "Tom",
        lastName: "Ellis",
        displayName: "Tom Ellis",
        email: "tom@rosespalondon.co.uk",
        color: "#BE185D",
      },
    ],
    services: [
      { name: "Cut & blow-dry", durationMinutes: 60, priceMinor: 7200, sortOrder: 1, category: "Cuts" },
      { name: "Balayage consult", durationMinutes: 30, priceMinor: 0, sortOrder: 2, category: "Colour" },
      { name: "Full colour", durationMinutes: 120, priceMinor: 14500, sortOrder: 3, category: "Colour" },
      { name: "Blow-dry", durationMinutes: 45, priceMinor: 4800, sortOrder: 4, category: "Styling" },
      { name: "Children's cut", durationMinutes: 30, priceMinor: 3500, sortOrder: 5, category: "Cuts" },
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
    vertical: "hair",
    category: "barbershop",
    email: "hallo@studioneun.de",
    staff: [
      {
        firstName: "Jonas",
        lastName: "Weber",
        displayName: "Jonas Weber",
        email: "jonas@studioneun.de",
        color: "#2563EB",
      },
      {
        firstName: "Leo",
        lastName: "Krüger",
        displayName: "Leo Krüger",
        email: "leo@studioneun.de",
        color: "#1D4ED8",
      },
      {
        firstName: "Maya",
        lastName: "Schmidt",
        displayName: "Maya Schmidt",
        email: "maya@studioneun.de",
        color: "#3B82F6",
      },
    ],
    services: [
      { name: "Herrenschnitt", durationMinutes: 45, priceMinor: 3800, sortOrder: 1 },
      { name: "Bartpflege", durationMinutes: 25, priceMinor: 2200, sortOrder: 2 },
      { name: "Fade & Finish", durationMinutes: 50, priceMinor: 4200, sortOrder: 3 },
      { name: "Kopfmassage", durationMinutes: 15, priceMinor: 1200, sortOrder: 4 },
      { name: "Father & Son", durationMinutes: 75, priceMinor: 6500, sortOrder: 5 },
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
    vertical: "beauty",
    category: "beauty",
    email: "bonjour@bellevueparis.fr",
    staff: [
      {
        firstName: "Camille",
        lastName: "Dupont",
        displayName: "Camille Dupont",
        email: "camille@bellevueparis.fr",
        color: "#7C3AED",
      },
      {
        firstName: "Inès",
        lastName: "Martin",
        displayName: "Inès Martin",
        email: "ines@bellevueparis.fr",
        color: "#8B5CF6",
      },
      {
        firstName: "Julie",
        lastName: "Bernard",
        displayName: "Julie Bernard",
        email: "julie@bellevueparis.fr",
        color: "#A78BFA",
      },
    ],
    services: [
      { name: "Manucure classique", durationMinutes: 45, priceMinor: 4200, sortOrder: 1 },
      { name: "Sourcils", durationMinutes: 30, priceMinor: 2800, sortOrder: 2 },
      { name: "Pose gel", durationMinutes: 60, priceMinor: 5500, sortOrder: 3 },
      { name: "Rehaussement cils", durationMinutes: 75, priceMinor: 6800, sortOrder: 4 },
      { name: "Soin mains express", durationMinutes: 25, priceMinor: 2200, sortOrder: 5 },
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
    vertical: "wellness",
    category: "wellness",
    email: "hej@havnwellness.dk",
    staff: [
      {
        firstName: "Freja",
        lastName: "Nielsen",
        displayName: "Freja Nielsen",
        email: "freja@havnwellness.dk",
        color: "#0D9488",
      },
      {
        firstName: "Mads",
        lastName: "Jensen",
        displayName: "Mads Jensen",
        email: "mads@havnwellness.dk",
        color: "#14B8A6",
      },
      {
        firstName: "Sofie",
        lastName: "Larsen",
        displayName: "Sofie Larsen",
        email: "sofie@havnwellness.dk",
        color: "#2DD4BF",
      },
    ],
    services: [
      { name: "60 min massage", durationMinutes: 60, priceMinor: 65000, sortOrder: 1 },
      { name: "Sauna & rest", durationMinutes: 45, priceMinor: 32000, sortOrder: 2 },
      { name: "90 min massage", durationMinutes: 90, priceMinor: 89000, sortOrder: 3 },
      { name: "Parmassage", durationMinutes: 60, priceMinor: 120000, sortOrder: 4 },
      { name: "Gavekort konsultation", durationMinutes: 20, priceMinor: 0, sortOrder: 5 },
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
      await refreshVerticalShowcaseShop(existing.id, {
        vertical: m.vertical,
        slug: m.slug,
        staff: m.staff,
        services: m.services,
      });
      created.push({
        slug: existing.slug,
        id: existing.id,
        name: existing.name,
        country: existing.country ?? m.country,
        locale: existing.locale ?? m.locale,
      });
      continue;
    }

    const biz = await createBusiness(founderUserId, {
      name: m.name,
      slug: m.slug,
      description: m.description,
      category: m.category,
      vertical: m.vertical,
      email: m.email,
      timezone: m.timezone,
      city: m.city,
      country: m.country,
      locale: m.locale,
      currency: m.currency,
      tier: "solo",
    });

    const core = await seedShopCore(biz.id, m.staff, m.services, m.vertical);
    await applyDemoPublicBranding(biz.id, m.vertical);
    const customers = await ensureShowcaseCustomers(biz.id, 20);
    const bookingKeys = await seedExpandedBookings(
      biz.id,
      customers,
      core.staffRows.map((s) => s.id),
      core.serviceRows.map((s) => s.id),
      now,
    );
    await seedDemoInbox(biz.id, customers, {
      vertical: m.vertical,
      bookingKeys,
      pendingBookingNotes: "Pending — Liv awaiting confirmation",
    });
    await ensureLiveDayForBusiness(biz.id, {
      force: true,
      customerSeed: customers,
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
