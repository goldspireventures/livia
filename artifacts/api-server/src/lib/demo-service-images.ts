import { db, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { BusinessVertical } from "@workspace/policy";
import { inferDemoServiceImageUrl } from "./experience-skin";

const STALE_UNSplash = /photo-1598371839696|photo-1611501275019|photo-1570172619644-dfd03ed5d881/;

function inferDemoServiceCategory(name: string, vertical?: BusinessVertical | null): string | undefined {
  const n = name.toLowerCase();
  if (vertical === "body-art") {
    if (n.includes("consult")) return "Consultations";
    return "Sessions";
  }
  if (vertical === "medspa" || vertical === "allied-health") {
    if (n.includes("consult")) return "Consultations";
    return "Treatments";
  }
  if (vertical === "hair") {
    if (n.includes("consult")) return "Consultations";
    return "Hair";
  }
  return undefined;
}

/** Backfill demo service card images on re-provision (idempotent). */
export async function backfillDemoServiceImages(
  businessId: string,
  vertical?: BusinessVertical | null,
  opts?: { force?: boolean },
): Promise<number> {
  const rows = await db.select().from(servicesTable).where(eq(servicesTable.businessId, businessId));

  let updated = 0;
  for (const row of rows) {
    const stale = row.imageUrl && STALE_UNSplash.test(row.imageUrl);
    const category = !row.category?.trim() ? inferDemoServiceCategory(row.name, vertical ?? undefined) : null;

    const url = !opts?.force && row.imageUrl && !stale ? row.imageUrl : inferDemoServiceImageUrl(row.name, vertical ?? undefined);
    const nextUrl = opts?.force || stale || !row.imageUrl ? url : row.imageUrl;
    const patch: { imageUrl?: string; category?: string; updatedAt: Date } = { updatedAt: new Date() };

    if (category) patch.category = category;
    if (nextUrl && nextUrl !== row.imageUrl && (opts?.force || stale || !row.imageUrl)) {
      patch.imageUrl = nextUrl;
    }

    if (patch.imageUrl || patch.category) {
      await db.update(servicesTable).set(patch).where(eq(servicesTable.id, row.id));
      updated += 1;
    }
  }
  return updated;
}

/** Legacy export — only rows missing imageUrl. */
export async function backfillMissingDemoServiceImages(
  businessId: string,
  vertical?: BusinessVertical | null,
) {
  return backfillDemoServiceImages(businessId, vertical, { force: false });
}
