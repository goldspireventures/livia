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

/** Gateway legal acceptance — shared copy for web + mobile. */
export const PLATFORM_LEGAL_ACCEPTANCE = {
  title: "Platform terms",
  description:
    "Read the documents below. You need to accept them before you set up your shop.",
  bullets: [
    "This is a business account, not a personal one.",
    "You confirm you can agree to these terms for the business you are registering.",
    "You are responsible for your own client policies and trade rules.",
  ],
  checkboxLabel:
    "I agree to the Terms of Service and Privacy Policy for the business I am registering.",
  continueCta: "Continue",
  footnote: "Next: how you are starting.",
} as const;

export function platformLegalAcceptanceTitle(): string {
  return PLATFORM_LEGAL_ACCEPTANCE.title;
}

export function platformLegalAcceptanceDescription(): string {
  return PLATFORM_LEGAL_ACCEPTANCE.description;
}

export function platformLegalAcceptanceBullets(): readonly string[] {
  return PLATFORM_LEGAL_ACCEPTANCE.bullets;
}

export function platformLegalAcceptanceCheckboxLabel(): string {
  return PLATFORM_LEGAL_ACCEPTANCE.checkboxLabel;
}

export function platformLegalAcceptanceContinueCta(): string {
  return PLATFORM_LEGAL_ACCEPTANCE.continueCta;
}

export function platformLegalAcceptanceFootnote(): string {
  return PLATFORM_LEGAL_ACCEPTANCE.footnote;
}
