import { randomBytes } from "node:crypto";
import {
  db,
  designProofAssetsTable,
  designProofGuestAccessTable,
  businessesTable,
  customersTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";

export async function ensureDesignProofGuestAccess(
  businessId: string,
  proofId: string,
): Promise<string> {
  const [existing] = await db
    .select({ token: designProofGuestAccessTable.token })
    .from(designProofGuestAccessTable)
    .where(eq(designProofGuestAccessTable.proofId, proofId))
    .limit(1);
  if (existing?.token) return existing.token;

  const token = randomBytes(18).toString("base64url");
  await db.insert(designProofGuestAccessTable).values({
    proofId,
    businessId,
    token,
  });
  return token;
}

export type GuestProofView = {
  proofId: string;
  businessId: string;
  businessName: string;
  slug: string;
  vertical: string | null;
  status: string;
  imageUrl: string | null;
  note: string | null;
  customerFirstName: string | null;
  logoUrl: string | null;
  presentationPresetId: string | null;
  brandAccentHex: string | null;
  country: string | null;
  createdAt: Date;
};

export async function getGuestProofByToken(
  slug: string,
  token: string,
): Promise<GuestProofView | null> {
  const [row] = await db
    .select({
      proofId: designProofAssetsTable.id,
      businessId: designProofAssetsTable.businessId,
      status: designProofAssetsTable.status,
      imageUrl: designProofAssetsTable.imageUrl,
      note: designProofAssetsTable.note,
      createdAt: designProofAssetsTable.createdAt,
      businessName: businessesTable.name,
      slug: businessesTable.slug,
      vertical: businessesTable.vertical,
      logoUrl: businessesTable.logoUrl,
      presentationPresetId: businessesTable.presentationPresetId,
      brandAccentHex: businessesTable.brandAccentHex,
      country: businessesTable.country,
      customerFirstName: customersTable.firstName,
      token: designProofGuestAccessTable.token,
    })
    .from(designProofGuestAccessTable)
    .innerJoin(
      designProofAssetsTable,
      eq(designProofGuestAccessTable.proofId, designProofAssetsTable.id),
    )
    .innerJoin(businessesTable, eq(designProofAssetsTable.businessId, businessesTable.id))
    .leftJoin(customersTable, eq(designProofAssetsTable.customerId, customersTable.id))
    .where(
      and(eq(designProofGuestAccessTable.token, token), eq(businessesTable.slug, slug)),
    )
    .limit(1);

  if (!row) return null;
  return {
    proofId: row.proofId,
    businessId: row.businessId,
    businessName: row.businessName,
    slug: row.slug,
    vertical: row.vertical,
    status: row.status,
    imageUrl: row.imageUrl,
    note: row.note,
    customerFirstName: row.customerFirstName,
    logoUrl: row.logoUrl,
    presentationPresetId: row.presentationPresetId,
    brandAccentHex: row.brandAccentHex,
    country: row.country,
    createdAt: row.createdAt,
  };
}

export async function submitGuestProofDecision(
  slug: string,
  token: string,
  decision: "approved" | "rejected",
  comment?: string,
) {
  const view = await getGuestProofByToken(slug, token);
  if (!view) return { ok: false as const, reason: "not_found" as const };
  if (view.status !== "pending_review") {
    return { ok: false as const, reason: "not_pending" as const, status: view.status };
  }

  if (comment?.trim()) {
    const suffix = `\n\n— Guest: ${comment.trim()}`;
    await db
      .update(designProofAssetsTable)
      .set({
        note: view.note ? `${view.note}${suffix}` : comment.trim(),
        updatedAt: new Date(),
      })
      .where(eq(designProofAssetsTable.id, view.proofId));
  }

  const { updateDesignProofStatus } = await import("./design-proofs.service");
  const row = await updateDesignProofStatus(view.businessId, view.proofId, decision);
  let depositBind: Awaited<
    ReturnType<(typeof import("./body-art-proof-deposit.service"))["bindDepositAfterProofApproval"]>
  > | null = null;
  if (decision === "approved") {
    const { bindDepositAfterProofApproval } = await import("./body-art-proof-deposit.service");
    depositBind = await bindDepositAfterProofApproval(view.businessId, view.proofId);
  }
  return { ok: true as const, row, depositBind };
}
