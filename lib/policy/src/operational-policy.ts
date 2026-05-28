import { z } from "zod/v4";
import type { BusinessVertical } from "./types";
import { getCountryOverlay } from "./country-overlays";

/** Tenant-editable operational rules (stored on business.operational_policy jsonb). */
export const operationalPolicySchema = z.object({
  depositRequired: z.boolean().default(false),
  depositPercent: z.number().int().min(0).max(100).default(0),
  serviceBufferMinutes: z.number().int().min(0).max(120).default(0),
  cancelWindowHours: z.number().int().min(0).max(168).optional(),
  noShowStrikeThreshold: z.number().int().min(1).max(20).default(2),
  requireDepositAfterStrikes: z.boolean().default(true),
  lateGraceMinutes: z.number().int().min(0).max(60).default(10),
  autoConfirmWhenNoDeposit: z.boolean().default(true),
  /** After web booking, open SMS/WA thread for pics and confirm (v3 continuity). */
  bookingContinuityEnabled: z.boolean().default(true),
  bookingContinuityMode: z
    .enum(["sms_thread", "whatsapp_thread", "email_only", "instagram_deep_link"])
    .default("sms_thread"),
});

export type OperationalPolicy = z.infer<typeof operationalPolicySchema>;

export const DEFAULT_OPERATIONAL_POLICY: OperationalPolicy = operationalPolicySchema.parse({});

export function parseOperationalPolicy(raw: unknown): OperationalPolicy {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_OPERATIONAL_POLICY };
  const parsed = operationalPolicySchema.safeParse(raw);
  return parsed.success ? parsed.data : { ...DEFAULT_OPERATIONAL_POLICY };
}

export function mergeOperationalPolicy(
  partial: Partial<OperationalPolicy> | undefined,
  current: OperationalPolicy,
): OperationalPolicy {
  return operationalPolicySchema.parse({ ...current, ...partial });
}

/**
 * Recommended initial operational policy defaults for a newly created tenant.
 * This does not override explicit tenant choices; it’s used for seeding only.
 */
export function recommendedOperationalPolicyDefaults(args: {
  countryIso: string | null | undefined;
  vertical: BusinessVertical;
}): Partial<OperationalPolicy> {
  const overlay = getCountryOverlay({ countryIso: args.countryIso, vertical: args.vertical });
  return {
    bookingContinuityMode: overlay.continuityMode,
    lateGraceMinutes: overlay.defaultLateGraceMinutes,
  };
}
