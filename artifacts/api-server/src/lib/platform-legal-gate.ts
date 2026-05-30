import {
  hasCurrentPlatformLegal,
  PLATFORM_PRIVACY_VERSION,
  PLATFORM_TOS_VERSION,
  platformLegalSchema,
  tenantAttestationSchema,
  type PlatformLegal,
  type TenantAttestation,
} from "@workspace/policy";
import { getStagingRelaxations } from "./staging-relaxations.js";

export {
  PLATFORM_TOS_VERSION,
  PLATFORM_PRIVACY_VERSION,
  hasCurrentPlatformLegal,
  platformLegalSchema,
  tenantAttestationSchema,
};

export function buildPlatformLegalAcceptance(sessionId?: string): PlatformLegal {
  return platformLegalSchema.parse({
    tosVersion: PLATFORM_TOS_VERSION,
    privacyVersion: PLATFORM_PRIVACY_VERSION,
    acceptedAt: new Date().toISOString(),
    sessionId,
  });
}

export function parseTenantAttestation(
  raw: unknown,
  userId: string,
): TenantAttestation | null {
  const parsed = tenantAttestationSchema.safeParse(raw);
  if (!parsed.success) return null;
  if (parsed.data.attestedByUserId !== userId) return null;
  return parsed.data;
}

/** Local/dev escape hatch — staging via LIVIA_STAGING_RELAX_LEGAL_GATE; never prod. */
export function isLegalGateSkipped(): boolean {
  return getStagingRelaxations().legalGateSkipped;
}
