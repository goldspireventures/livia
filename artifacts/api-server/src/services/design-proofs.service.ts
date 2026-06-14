import { db, designProofAssetsTable, designProofGuestAccessTable } from "@workspace/db";
import { eq, and, desc, isNotNull } from "drizzle-orm";
import { generateId } from "../lib/id";
import { inngest, isInngestWorkflowsEnabled } from "../lib/inngest";
import { ensureDesignProofGuestAccess } from "./design-proof-guest-access.service";

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
      createdAt: designProofAssetsTable.createdAt,
      updatedAt: designProofAssetsTable.updatedAt,
      guestToken: designProofGuestAccessTable.token,
    })
    .from(designProofAssetsTable)
    .leftJoin(
      designProofGuestAccessTable,
      eq(designProofGuestAccessTable.proofId, designProofAssetsTable.id),
    )
    .where(and(...conditions))
    .orderBy(desc(designProofAssetsTable.createdAt));
  return rows;
}

export async function createDesignProof(
  businessId: string,
  input: {
    customerId?: string;
    bookingId?: string;
    imageUrl?: string;
    note?: string;
  },
) {
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
      status: "draft",
    })
    .returning();

  if (isInngestWorkflowsEnabled()) {
    void inngest.send({
      name: "livia/design-proof.submitted",
      data: { businessId, proofId: id, customerId: input.customerId },
    });
  }
  return row;
}

export async function updateDesignProofStatus(
  businessId: string,
  proofId: string,
  status: "draft" | "pending_review" | "approved" | "rejected",
) {
  const [row] = await db
    .update(designProofAssetsTable)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(designProofAssetsTable.id, proofId),
        eq(designProofAssetsTable.businessId, businessId),
      ),
    )
    .returning();
  if (row && status === "approved") {
    const { bindDepositAfterProofApproval } = await import("./body-art-proof-deposit.service");
    await bindDepositAfterProofApproval(businessId, row.id).catch(() => null);
    if (isInngestWorkflowsEnabled()) {
      void inngest.send({
        name: "livia/design-proof.approved",
        data: {
          businessId,
          proofId: row.id,
          customerId: row.customerId,
          bookingId: row.bookingId,
        },
      });
    }
  }
  if (row && status === "pending_review") {
    await ensureDesignProofGuestAccess(businessId, proofId);
    void import("./in-app-notifications.service").then(({ deliverInAppNotification }) =>
      deliverInAppNotification({
        kind: "liv.proposal.pending",
        businessId,
        title: "Design proof needs review",
        body: row.note?.trim() || "A new tattoo design proof is waiting for approval.",
        priority: "act",
        resourceKind: "design_proof",
        resourceId: row.id,
        dedupeKey: `design-proof:${row.id}:pending`,
        audience: "operators",
      }).catch(() => undefined),
    );
  }
  return row ?? null;
}

export type PublicDesignShowcaseItem = {
  id: string;
  imageUrl: string;
  title: string;
  note: string | null;
};

/** Approved artwork for public /b flash gallery (body-art). */
export async function listPublicDesignShowcase(
  businessId: string,
): Promise<PublicDesignShowcaseItem[]> {
  const rows = await db
    .select({
      id: designProofAssetsTable.id,
      imageUrl: designProofAssetsTable.imageUrl,
      note: designProofAssetsTable.note,
    })
    .from(designProofAssetsTable)
    .where(
      and(
        eq(designProofAssetsTable.businessId, businessId),
        eq(designProofAssetsTable.status, "approved"),
        isNotNull(designProofAssetsTable.imageUrl),
      ),
    )
    .orderBy(desc(designProofAssetsTable.updatedAt))
    .limit(12);

  return rows
    .filter((r) => r.imageUrl)
    .map((r) => ({
      id: r.id,
      imageUrl: r.imageUrl!,
      title: r.note?.split("—")[0]?.trim() || r.note?.trim() || "Custom design",
      note: r.note,
    }));
}
