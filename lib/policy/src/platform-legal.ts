import { z } from "zod/v4";

/** Bump when published ToS / Privacy change materially (beta scaffold versions). */
export const PLATFORM_TOS_VERSION = "2026-05-07-beta";
export const PLATFORM_PRIVACY_VERSION = "2026-05-07-beta";

export const platformLegalSchema = z.object({
  tosVersion: z.string(),
  privacyVersion: z.string(),
  acceptedAt: z.string().datetime(),
  /** Clerk session id when available — audit trail for counsel. */
  sessionId: z.string().optional(),
});

export type PlatformLegal = z.infer<typeof platformLegalSchema>;

export function hasCurrentPlatformLegal(raw: unknown): boolean {
  const parsed = platformLegalSchema.safeParse(raw);
  if (!parsed.success) return false;
  return (
    parsed.data.tosVersion === PLATFORM_TOS_VERSION &&
    parsed.data.privacyVersion === PLATFORM_PRIVACY_VERSION
  );
}

export const tenantEntityKindSchema = z.enum([
  "sole_trader",
  "partnership",
  "limited_company",
  "other",
]);

export const tenantAttestationSchema = z.object({
  entityKind: tenantEntityKindSchema,
  /** Self-declared trading name (may match business.name). Not KYB-verified. */
  tradingName: z.string().min(2).optional(),
  /** Optional VAT — stored for invoicing prep; not validated against VIES in beta. */
  vatNumber: z.string().max(32).optional(),
  attestedAt: z.string().datetime(),
  attestedByUserId: z.string(),
});

export type TenantAttestation = z.infer<typeof tenantAttestationSchema>;
