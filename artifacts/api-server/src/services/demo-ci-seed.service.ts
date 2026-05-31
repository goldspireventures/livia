/**
 * CI-only demo seed — full vertical showcase in Postgres without Clerk.
 * Satisfies getDemoPortalStatus().provisioned for guest-token API tests.
 */
import { eq } from "drizzle-orm";
import { db, usersTable, businessesTable } from "@workspace/db";
import { createBusiness } from "./businesses.service";
import { seedShopCore } from "./demo-portal.service";
import { seedVerticalShowcaseShops } from "./demo-vertical-shops.seed";
import { seedVerticalDemoExtras } from "./demo-vertical-extras.seed";
import { seedMarketShowcaseShops } from "./demo-market-shops.seed";
import { seedRealWorldScenarios } from "./demo-real-world-scenarios.seed";
import { getDemoPortalStatus } from "./demo-portal.service";

export const CI_DEMO_FOUNDER_ID = process.env.SEED_DEMO_OWNER_ID ?? "ci-demo-founder";

export async function seedCiDemoWorld(): Promise<Awaited<ReturnType<typeof getDemoPortalStatus>>> {
  await db
    .insert(usersTable)
    .values({
      id: CI_DEMO_FOUNDER_ID,
      email: "ci-demo@livia.local",
      fullName: "CI Demo Founder",
      role: "OWNER",
    })
    .onConflictDoNothing();

  const [aurora] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, "aurora-studio"))
    .limit(1);

  let auroraStudioId = aurora?.id;
  if (!auroraStudioId) {
    const biz = await createBusiness(CI_DEMO_FOUNDER_ID, {
      name: "Aurora Studio",
      slug: "aurora-studio",
      description: "CI demo flagship",
      category: "hair_salon",
      vertical: "hair",
      email: "hello@aurora-studio.ie",
      phone: "+353 1 555 0100",
      timezone: "Europe/Dublin",
      city: "Dublin",
      country: "IE",
      tier: "studio",
    });
    auroraStudioId = biz.id;
    await seedShopCore(
      biz.id,
      [{ firstName: "Lara", lastName: "Byrne", displayName: "Lara Byrne", email: "lara@aurora.ie", color: "#6366f1" }],
      [
        { name: "Cut & Finish", durationMinutes: 60, priceMinor: 6500, sortOrder: 1 },
        { name: "Colour", durationMinutes: 90, priceMinor: 9500, sortOrder: 2 },
      ],
      "hair",
    );
  }

  for (const spec of [
    { slug: "aurora-mews", name: "Aurora Mews", parentBusinessId: auroraStudioId },
    { slug: "aurora-galway", name: "Aurora Galway", parentBusinessId: auroraStudioId },
  ] as const) {
    const [row] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.slug, spec.slug))
      .limit(1);
    if (!row) {
      await createBusiness(CI_DEMO_FOUNDER_ID, {
        name: spec.name,
        slug: spec.slug,
        description: "CI demo location",
        category: "hair_salon",
        vertical: "hair",
        email: `hello@${spec.slug.replace(/-/g, "")}.ie`,
        timezone: "Europe/Dublin",
        city: "Dublin",
        country: "IE",
        tier: "studio",
        parentBusinessId: spec.parentBusinessId,
        structureKind: "location",
      });
    }
  }

  const [conors] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, "conors-cut-co"))
    .limit(1);
  if (!conors) {
    const biz = await createBusiness(CI_DEMO_FOUNDER_ID, {
      name: "Conor's Cut Co.",
      slug: "conors-cut-co",
      description: "CI barbershop",
      category: "barbershop",
      vertical: "hair",
      email: "book@conorscut.ie",
      timezone: "Europe/Dublin",
      city: "Cork",
      country: "IE",
      tier: "solo",
    });
    await seedShopCore(
      biz.id,
      [{ firstName: "Mo", lastName: "Healy", displayName: "Mo Healy", email: "mo@conorscut.ie", color: "#22c55e" }],
      [{ name: "Cut", durationMinutes: 30, priceMinor: 2800, sortOrder: 1 }],
      "hair",
    );
  }

  await seedVerticalShowcaseShops(CI_DEMO_FOUNDER_ID);
  await seedVerticalDemoExtras();
  await seedMarketShowcaseShops(CI_DEMO_FOUNDER_ID);
  try {
    await seedRealWorldScenarios(CI_DEMO_FOUNDER_ID);
  } catch {
    // Optional depth — provisioned gate already satisfied by vertical + market seeds.
  }

  try {
    const { ensureDemoGuestWaitlistOffer } = await import("./demo-showcase-depth");
    for (const slug of ["peak-fitness-dublin"]) {
      const [biz] = await db
        .select({ id: businessesTable.id })
        .from(businessesTable)
        .where(eq(businessesTable.slug, slug))
        .limit(1);
      if (biz) await ensureDemoGuestWaitlistOffer(biz.id);
    }
  } catch {
    // Guest-token E2E can sync showcase; do not fail entire CI seed.
  }

  return getDemoPortalStatus();
}
