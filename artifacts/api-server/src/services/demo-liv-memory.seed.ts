import { db, customersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { appendLivMemory } from "./liv-memory.service";
import { logger } from "../lib/logger";

/** Per-vertical demo memory so Liv threads feel distinct in walkthroughs. */
export async function seedDemoLivMemoryForBusinesses(
  shops: Array<{ id: string; vertical?: string | null; slug: string }>,
): Promise<number> {
  let count = 0;
  for (const shop of shops) {
    const prefs =
      shop.vertical === "hair_beauty" || shop.slug.includes("luxe")
        ? "Prefers senior stylist for colour · allergic to ammonia — patch test on file."
        : shop.vertical === "physio" || shop.slug.includes("peak")
          ? "Insurance ref on file · prefers morning slots before 11:00."
          : shop.vertical === "tattoo" || shop.slug.includes("iron")
            ? "Design proof approved for sleeve session · deposit paid."
            : "VIP regular — quiet chair near window.";

    try {
      await appendLivMemory({
        businessId: shop.id,
        entityType: "business",
        entityId: shop.id,
        kind: "ritual",
        content: `Demo shop ritual: ${shop.slug} uses Liv for continuity and morning briefings.`,
        createdBy: "liv",
        ttlDays: 365,
      });
      count += 1;
    } catch (err) {
      logger.warn({ err, shopId: shop.id }, "demo liv memory business seed failed");
    }
  }
  for (const shop of shops) {
    const customers = await db
      .select({ id: customersTable.id, firstName: customersTable.firstName })
      .from(customersTable)
      .where(eq(customersTable.businessId, shop.id))
      .limit(3);

    for (const c of customers) {
      try {
        await appendLivMemory({
          businessId: shop.id,
          entityType: "customer",
          entityId: c.id,
          kind: "preference",
          content: `${c.firstName ?? "Client"} — demo memory: usual slot Tuesday AM, trusts Liv for rebooks.`,
          createdBy: "liv",
          ttlDays: 365,
        });
        count += 1;
      } catch (err) {
        logger.warn({ err, customerId: c.id }, "demo customer memory seed failed");
      }
    }
  }

  return count;
}
