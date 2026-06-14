import { db, customersTable, designProofAssetsTable, designProofGuestAccessTable } from "@workspace/db";
import {
  type DesignProofKind,
  type DesignProofPublishRight,
  canShowOnPublicGallery,
  defaultPublishRightForKind,
  inferProofKindFromNote,
  isValidPublishRightForKind,
  normalizeDesignProofKind,
  normalizeDesignProofPublishRight,
  parseDesignProofGuestFeedback,
  stripDesignProofGuestFeedback,
} from "@workspace/policy";
import { eq, and, desc, isNotNull, inArray } from "drizzle-orm";
import { generateId } from "../lib/id";
import { fanOutSideEffect } from "../lib/side-effect-emitter";
import { ensureDesignProofGuestAccess } from "./design-proof-guest-access.service";

const PROOF_STATUSES = ["draft", "pending_review", "approved", "rejected"] as const;
export type DesignProofStatus = (typeof PROOF_STATUSES)[number];

type ProofNotifyRow = {
  id: string;
  businessId: string;
  status: string;
  note: string | null;
  version: number | null;
  customerId: string | null;
  bookingId: string | null;
};

function scheduleDesignProofTransition(
  prevStatus: string,
  row: ProofNotifyRow,
  actor: "studio" | "guest",
) {
  if (row.status === prevStatus) return;
  fanOutSideEffect(
    "design_proof.status_transition",
    async () => {
      const { emitResourceStatusTransition } = await import("./resource-transition.service");
      await emitResourceStatusTransition({
        resourceKind: "design_proof",
        fromStatus: prevStatus,
        toStatus: row.status,
        actor,
        context: {
          resourceId: row.id,
          businessId: row.businessId,
          displayLabel: row.note,
          guestFeedback: parseDesignProofGuestFeedback(row.note),
          version: row.version ?? 1,
        },
      });
    },
    { proofId: row.id, businessId: row.businessId, toStatus: row.status },
  );
}

export async function listDesignProofs(businessId: string, status?: string) {
  const conditions = [eq(designProofAssetsTable.businessId, businessId)];
  if (status) conditions.push(eq(designProofAssetsTable.status, status));
  const rows = await db
    .select({
      id: designProofAssetsTable.id,
      businessId: designProofAssetsTable.businessId,
      customerId: designProofAssetsTable.customerId,
      bookingId: designProofAssetsTable.bookingId,
      status: designProofAssetsTable.status,
      imageUrl: designProofAssetsTable.imageUrl,
      note: designProofAssetsTable.note,
      proofKind: designProofAssetsTable.proofKind,
      publishRight: designProofAssetsTable.publishRight,
      version: designProofAssetsTable.version,
      parentProofId: designProofAssetsTable.parentProofId,
      createdAt: designProofAssetsTable.createdAt,
      updatedAt: designProofAssetsTable.updatedAt,
      guestToken: designProofGuestAccessTable.token,
      customerName: customersTable.displayName,
    })
    .from(designProofAssetsTable)
    .leftJoin(
      designProofGuestAccessTable,
      eq(designProofGuestAccessTable.proofId, designProofAssetsTable.id),
    )
    .leftJoin(customersTable, eq(customersTable.id, designProofAssetsTable.customerId))
    .where(and(...conditions))
    .orderBy(desc(designProofAssetsTable.createdAt));
  return rows.map((r) => ({
    ...r,
    proofKind: normalizeDesignProofKind(r.proofKind),
    publishRight: normalizeDesignProofPublishRight(r.publishRight),
    guestFeedback: parseDesignProofGuestFeedback(r.note),
    studioNote: stripDesignProofGuestFeedback(r.note),
  }));
}

export async function createDesignProof(
  businessId: string,
  input: {
    customerId?: string;
    bookingId?: string;
    imageUrl?: string;
    note?: string;
    proofKind?: DesignProofKind;
    publishRight?: DesignProofPublishRight;
  },
) {
  const proofKind = normalizeDesignProofKind(input.proofKind ?? inferProofKindFromNote(input.note));
  const publishRight = input.publishRight
    ? normalizeDesignProofPublishRight(input.publishRight)
    : defaultPublishRightForKind(proofKind);
  const safePublish = isValidPublishRightForKind(proofKind, publishRight)
    ? publishRight
    : defaultPublishRightForKind(proofKind);

  const id = generateId();
  const [row] = await db
    .insert(designProofAssetsTable)
    .values({
      id,
      businessId,
      customerId: input.customerId,
      bookingId: input.bookingId,
      imageUrl: input.imageUrl,
      note: input.note,
      proofKind,
      publishRight: safePublish,
      status: "draft",
      version: 1,
    })
    .returning();

  if (row) {
    const { recordDesignProofRevision } = await import("./design-proof-revisions.service");
    await recordDesignProofRevision({
      proofId: id,
      version: 1,
      imageUrl: row.imageUrl,
      note: row.note,
    });
  }

  return row;
}

export type UpdateDesignProofPatch = {
  status?: DesignProofStatus;
  imageUrl?: string;
  note?: string;
  proofKind?: DesignProofKind;
  publishRight?: DesignProofPublishRight;
  /** When replacing artwork, bump version and optionally reset workflow. */
  replaceArtwork?: boolean;
  resendAfterReplace?: boolean;
  /** Restore artwork from a prior revision — creates a new version number. */
  revertToVersion?: number;
  resendAfterRevert?: boolean;
};

export async function updateDesignProof(
  businessId: string,
  proofId: string,
  patch: UpdateDesignProofPatch,
) {
  const [existing] = await db
    .select()
    .from(designProofAssetsTable)
    .where(
      and(
        eq(designProofAssetsTable.id, proofId),
        eq(designProofAssetsTable.businessId, businessId),
      ),
    )
    .limit(1);
  if (!existing) return null;

  const {
    recordDesignProofRevision,
    ensureDesignProofRevisionsSeeded,
    listDesignProofRevisions,
  } = await import("./design-proof-revisions.service");

  const proofKind = patch.proofKind
    ? normalizeDesignProofKind(patch.proofKind)
    : normalizeDesignProofKind(existing.proofKind);
  let publishRight = patch.publishRight
    ? normalizeDesignProofPublishRight(patch.publishRight)
    : normalizeDesignProofPublishRight(existing.publishRight);
  if (!isValidPublishRightForKind(proofKind, publishRight)) {
    publishRight = defaultPublishRightForKind(proofKind);
  }

  const updates: Partial<typeof designProofAssetsTable.$inferInsert> = {
    updatedAt: new Date(),
    proofKind,
    publishRight,
  };

  if (patch.note !== undefined) updates.note = patch.note;
  if (patch.imageUrl !== undefined) updates.imageUrl = patch.imageUrl;

  if (typeof patch.revertToVersion === "number") {
    await ensureDesignProofRevisionsSeeded(proofId);
    const revisions = await listDesignProofRevisions(proofId);
    const target = revisions.find((r) => r.version === patch.revertToVersion);
    if (!target) return null;

    const nextVersion = (existing.version ?? 1) + 1;
    updates.version = nextVersion;
    updates.imageUrl = target.imageUrl ?? existing.imageUrl;
    if (patch.note === undefined && target.note) updates.note = target.note;
    if (patch.resendAfterRevert) {
      updates.status = "pending_review";
    } else if (existing.status !== "draft") {
      updates.status = "draft";
    }
  } else if (patch.replaceArtwork && patch.imageUrl) {
    await recordDesignProofRevision({
      proofId,
      version: existing.version ?? 1,
      imageUrl: existing.imageUrl,
      note: existing.note,
    });
    updates.version = (existing.version ?? 1) + 1;
    if (patch.resendAfterReplace) {
      updates.status = "pending_review";
    } else if (existing.status !== "draft") {
      updates.status = "draft";
    }
  }

  if (patch.status && PROOF_STATUSES.includes(patch.status)) {
    updates.status = patch.status;
  }

  const [row] = await db
    .update(designProofAssetsTable)
    .set(updates)
    .where(eq(designProofAssetsTable.id, proofId))
    .returning();

  if (!row) return null;

  if (patch.replaceArtwork || typeof patch.revertToVersion === "number") {
    await recordDesignProofRevision({
      proofId,
      version: row.version ?? 1,
      imageUrl: row.imageUrl,
      note: row.note,
    });
  }

  const prevStatus = existing.status;
  const finalStatus = row.status as DesignProofStatus;

  if (finalStatus === "approved") {
    const { bindDepositAfterProofApproval } = await import("./body-art-proof-deposit.service");
    await bindDepositAfterProofApproval(businessId, row.id).catch(() => null);
  }

  scheduleDesignProofTransition(prevStatus, row, "studio");

  let guestToken: string | null = null;
  if (finalStatus === "pending_review") {
    guestToken = await ensureDesignProofGuestAccess(businessId, proofId);
  }

  return { ...row, guestToken };
}

/** @deprecated Use updateDesignProof — kept for guest decision path. */
export async function updateDesignProofStatus(
  businessId: string,
  proofId: string,
  status: DesignProofStatus,
  source: "studio" | "guest" = "studio",
) {
  const [existing] = await db
    .select()
    .from(designProofAssetsTable)
    .where(
      and(
        eq(designProofAssetsTable.id, proofId),
        eq(designProofAssetsTable.businessId, businessId),
      ),
    )
    .limit(1);
  if (!existing) return null;

  const [row] = await db
    .update(designProofAssetsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(designProofAssetsTable.id, proofId))
    .returning();
  if (!row) return null;

  if (status === "approved") {
    const { bindDepositAfterProofApproval } = await import("./body-art-proof-deposit.service");
    await bindDepositAfterProofApproval(businessId, row.id).catch(() => null);
  }

  scheduleDesignProofTransition(existing.status, row, source);

  return { ...row, guestToken: undefined };
}

export type PublicDesignShowcaseItem = {
  id: string;
  imageUrl: string;
  title: string;
  note: string | null;
  proofKind: DesignProofKind;
};

/** Approved + publishable studio artwork for public /b gallery (body-art). */
export async function listPublicDesignShowcase(
  businessId: string,
): Promise<PublicDesignShowcaseItem[]> {
  const rows = await db
    .select({
      id: designProofAssetsTable.id,
      imageUrl: designProofAssetsTable.imageUrl,
      note: designProofAssetsTable.note,
      publishRight: designProofAssetsTable.publishRight,
      proofKind: designProofAssetsTable.proofKind,
    })
    .from(designProofAssetsTable)
    .where(
      and(
        eq(designProofAssetsTable.businessId, businessId),
        eq(designProofAssetsTable.status, "approved"),
        isNotNull(designProofAssetsTable.imageUrl),
        inArray(designProofAssetsTable.publishRight, ["portfolio_ok", "flash_resell_ok"]),
      ),
    )
    .orderBy(desc(designProofAssetsTable.updatedAt))
    .limit(12);

  return rows
    .filter((r) => r.imageUrl && canShowOnPublicGallery(normalizeDesignProofPublishRight(r.publishRight)))
    .map((r) => ({
      id: r.id,
      imageUrl: r.imageUrl!,
      title: r.note?.split("—")[0]?.trim() || r.note?.trim() || "Studio design",
      note: r.note,
      proofKind: normalizeDesignProofKind(r.proofKind),
    }));
}
