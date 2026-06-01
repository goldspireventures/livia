/**
 * Pre-auth sign-in skin preview — maps work email → tenant preset tokens (no secrets).
 */
import { db, usersTable, businessMembershipsTable, businessesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { resolvePresentationPreset, type BusinessVertical } from "@workspace/policy";

export type SignInAppearanceHint = {
  businessName: string;
  cssPreset: string;
  presetLabel: string;
  brandAccentHex: string | null;
  logoUrl: string | null;
  colorMode: "light" | "dark" | "system";
};

export async function getSignInAppearanceHintForEmail(
  email: string,
): Promise<SignInAppearanceHint | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return null;

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalized))
    .limit(1);
  if (!user) return null;

  const [row] = await db
    .select({
      name: businessesTable.name,
      vertical: businessesTable.vertical,
      presentationPresetId: businessesTable.presentationPresetId,
      brandAccentHex: businessesTable.brandAccentHex,
      logoUrl: businessesTable.logoUrl,
    })
    .from(businessMembershipsTable)
    .innerJoin(businessesTable, eq(businessesTable.id, businessMembershipsTable.businessId))
    .where(
      and(eq(businessMembershipsTable.userId, user.id), eq(businessMembershipsTable.role, "OWNER")),
    )
    .orderBy(desc(businessesTable.updatedAt))
    .limit(1);

  if (!row) return null;

  const vertical = row.vertical as BusinessVertical;
  const preset = resolvePresentationPreset(vertical, row.presentationPresetId);
  const colorMode = preset.tokens.colorMode;

  return {
    businessName: row.name,
    cssPreset: preset.cssPreset,
    presetLabel: preset.label,
    brandAccentHex: row.brandAccentHex ?? null,
    logoUrl: row.logoUrl ?? null,
    colorMode: colorMode === "system" ? "light" : colorMode,
  };
}
