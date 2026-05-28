import { db, designProofAssetsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { generateId } from "../lib/id";
import { inngest, isInngestWorkflowsEnabled } from "../lib/inngest";

export async function listDesignProofs(businessId: string, status?: string) {
  const conditions = [eq(designProofAssetsTable.businessId, businessId)];
  if (status) conditions.push(eq(designProofAssetsTable.status, status));
  return db
    .select()
    .from(designProofAssetsTable)
    .where(and(...conditions))
    .orderBy(desc(designProofAssetsTable.createdAt));
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
  if (row && status === "approved" && isInngestWorkflowsEnabled()) {
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
  if (row && status === "pending_review") {
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
