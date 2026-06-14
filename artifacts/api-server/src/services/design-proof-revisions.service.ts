import {
  db,
  designProofAssetsTable,
  designProofRevisionsTable,
} from "@workspace/db";
import { designProofThreadKey, stripDesignProofGuestFeedback } from "@workspace/policy";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { generateId } from "../lib/id";

export type DesignProofRevisionRow = {
  version: number;
  imageUrl: string | null;
  note: string | null;
  createdAt: Date;
};

export async function listDesignProofRevisions(proofId: string): Promise<DesignProofRevisionRow[]> {
  const rows = await db
    .select({
      version: designProofRevisionsTable.version,
      imageUrl: designProofRevisionsTable.imageUrl,
      note: designProofRevisionsTable.note,
      createdAt: designProofRevisionsTable.createdAt,
    })
    .from(designProofRevisionsTable)
    .where(eq(designProofRevisionsTable.proofId, proofId))
    .orderBy(asc(designProofRevisionsTable.version));
  return rows;
}

export async function recordDesignProofRevision(args: {
  proofId: string;
  version: number;
  imageUrl?: string | null;
  note?: string | null;
}): Promise<void> {
  const [existing] = await db
    .select({ id: designProofRevisionsTable.id })
    .from(designProofRevisionsTable)
    .where(
      and(
        eq(designProofRevisionsTable.proofId, args.proofId),
        eq(designProofRevisionsTable.version, args.version),
      ),
    )
    .limit(1);
  if (existing) return;

  await db.insert(designProofRevisionsTable).values({
    id: generateId(),
    proofId: args.proofId,
    version: args.version,
    imageUrl: args.imageUrl ?? null,
    note: args.note ?? null,
  });
}

/** Backfill revision v1+ from the live proof row when history table is empty. */
export async function ensureDesignProofRevisionsSeeded(proofId: string): Promise<DesignProofRevisionRow[]> {
  const existing = await listDesignProofRevisions(proofId);
  if (existing.length > 0) return existing;

  const [proof] = await db
    .select({
      version: designProofAssetsTable.version,
      imageUrl: designProofAssetsTable.imageUrl,
      note: designProofAssetsTable.note,
      createdAt: designProofAssetsTable.createdAt,
    })
    .from(designProofAssetsTable)
    .where(eq(designProofAssetsTable.id, proofId))
    .limit(1);
  if (!proof) return [];

  await recordDesignProofRevision({
    proofId,
    version: proof.version ?? 1,
    imageUrl: proof.imageUrl,
    note: proof.note,
  });
  return listDesignProofRevisions(proofId);
}

/** Merge duplicate proof rows (same design title) into one thread with revision history. */
export async function consolidateDesignProofThreadsForCustomer(
  businessId: string,
  customerId: string,
): Promise<void> {
  const rows = await db
    .select({
      id: designProofAssetsTable.id,
      note: designProofAssetsTable.note,
      imageUrl: designProofAssetsTable.imageUrl,
      version: designProofAssetsTable.version,
      updatedAt: designProofAssetsTable.updatedAt,
      createdAt: designProofAssetsTable.createdAt,
    })
    .from(designProofAssetsTable)
    .where(
      and(
        eq(designProofAssetsTable.businessId, businessId),
        eq(designProofAssetsTable.customerId, customerId),
        inArray(designProofAssetsTable.status, ["pending_review", "rejected"]),
      ),
    )
    .orderBy(desc(designProofAssetsTable.updatedAt));

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = designProofThreadKey(row.note);
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  for (const group of groups.values()) {
    if (group.length <= 1) continue;

    const sorted = [...group].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const canonical = sorted[sorted.length - 1]!;
    const olderIds = sorted.slice(0, -1).map((r) => r.id);

    for (let i = 0; i < sorted.length; i++) {
      const row = sorted[i]!;
      await recordDesignProofRevision({
        proofId: canonical.id,
        version: i + 1,
        imageUrl: row.imageUrl,
        note: stripDesignProofGuestFeedback(row.note),
      });
    }

    await db
      .update(designProofAssetsTable)
      .set({
        imageUrl: canonical.imageUrl,
        note: stripDesignProofGuestFeedback(canonical.note),
        version: sorted.length,
        updatedAt: new Date(),
      })
      .where(eq(designProofAssetsTable.id, canonical.id));

    for (const dupId of olderIds) {
      await db.delete(designProofAssetsTable).where(eq(designProofAssetsTable.id, dupId));
    }
  }
}

export function revisionsToGuestVersions(
  revisions: DesignProofRevisionRow[],
  fallback: { version: number; imageUrl: string | null },
) {
  if (revisions.length === 0) {
    return [
      {
        version: fallback.version,
        imageUrl: fallback.imageUrl,
        createdAt: new Date().toISOString(),
      },
    ];
  }
  return revisions.map((r) => ({
    version: r.version,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt.toISOString(),
  }));
}
