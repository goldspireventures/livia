import { db, servicesTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import type { BusinessVertical } from "@workspace/policy";
import { inferDemoServiceImageUrl } from "./experience-skin";

/** Backfill demo service card images on re-provision (idempotent). */
export async function backfillDemoServiceImages(
  businessId: string,
  vertical?: BusinessVertical | null,
) {
  const rows = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.businessId, businessId), isNull(servicesTable.imageUrl)));

  for (const row of rows) {
    const url = inferDemoServiceImageUrl(row.name, vertical ?? undefined);
    if (!url) continue;
    await db
      .update(servicesTable)
      .set({ imageUrl: url, updatedAt: new Date() })
      .where(eq(servicesTable.id, row.id));
  }
}
