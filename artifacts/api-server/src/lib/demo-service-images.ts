import { db, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { BusinessVertical } from "@workspace/policy";
import { STALE_PUBLIC_SERVICE_IMAGE } from "@workspace/policy";
import { inferDemoServiceImageUrl } from "./experience-skin";

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

  const nameKeywords = [
    "manicure",
    "brow",
    "shape",
    "lash",
    "lift",
    "fill",
    "gel",
    "nail",
    "colour",
    "color",
    "massage",
    "tattoo",
    "consult",
  ] as const;

  let updated = 0;
  for (const row of rows) {
    const stale = row.imageUrl && STALE_PUBLIC_SERVICE_IMAGE.test(row.imageUrl);
    const category = !row.category?.trim() ? inferDemoServiceCategory(row.name, vertical ?? undefined) : null;
    const inferred = inferDemoServiceImageUrl(row.name, vertical ?? undefined);
    const n = row.name.toLowerCase();
    const keywordMatch = nameKeywords.some((k) => n.includes(k));
    const wrongDemoImage =
      keywordMatch && inferred && row.imageUrl && row.imageUrl !== inferred;

    const url =
      !opts?.force && row.imageUrl && !stale && !wrongDemoImage
        ? row.imageUrl
        : inferred;
    const nextUrl = opts?.force || stale || !row.imageUrl || wrongDemoImage ? url : row.imageUrl;
    const patch: { imageUrl?: string; category?: string; updatedAt: Date } = { updatedAt: new Date() };

    if (category) patch.category = category;
    if (nextUrl && nextUrl !== row.imageUrl && (opts?.force || stale || !row.imageUrl || wrongDemoImage)) {
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
