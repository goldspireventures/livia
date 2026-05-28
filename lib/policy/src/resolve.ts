import { getJurisdictionPack, resolveJurisdictionCode } from "./jurisdictions";
import { guardChannelPackForProduction, resolveChannelPack } from "./channels";
import {
  getVerticalPack,
  resolveVerticalFromCategory,
  VERTICAL_PACKS,
} from "./verticals";
import { parseOperationalPolicy, type OperationalPolicy } from "./operational-policy";
import type {
  BusinessPolicyInput,
  BusinessTier,
  BusinessVertical,
  OnboardingDefaults,
  ResolvedBusinessPolicies,
} from "./types";

export function resolveBusinessPolicies(
  input: BusinessPolicyInput,
  operationalRaw?: unknown,
): ResolvedBusinessPolicies {
  const jurisdiction = getJurisdictionPack(input.country);
  const vertical = getVerticalPack(input.vertical);
  const channels = guardChannelPackForProduction(resolveChannelPack(jurisdiction.code));
  const op = parseOperationalPolicy(operationalRaw);
  const cancelHours = op.cancelWindowHours ?? jurisdiction.cancellationHours;

  const depositSummary = op.depositRequired
    ? `Deposit: ${op.depositPercent}% required to confirm online bookings.`
    : jurisdiction.depositPolicySummary;

  const bookingTermsBlock = [
    jurisdiction.bookingTermsIntro,
    depositSummary,
    `Free cancellation up to ${cancelHours} hours before your appointment unless otherwise stated.`,
    op.noShowStrikeThreshold > 0
      ? `Repeated no-shows may require a deposit for future bookings.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    jurisdiction,
    vertical,
    channels,
    currency: input.currency || jurisdiction.currency,
    locale: input.locale || jurisdiction.defaultLocale,
    timezone: input.timezone || jurisdiction.defaultTimezone,
    bookingTermsBlock,
    depositPolicySummary: depositSummary,
    aiDisclosure: jurisdiction.aiDisclosure,
    operational: {
      depositRequired: op.depositRequired,
      depositPercent: op.depositPercent,
      serviceBufferMinutes: op.serviceBufferMinutes,
      cancelWindowHours: cancelHours,
      noShowStrikeThreshold: op.noShowStrikeThreshold,
      requireDepositAfterStrikes: op.requireDepositAfterStrikes,
      lateGraceMinutes: op.lateGraceMinutes,
      autoConfirmWhenNoDeposit: op.autoConfirmWhenNoDeposit,
      bookingContinuityEnabled: op.bookingContinuityEnabled,
      bookingContinuityMode: op.bookingContinuityMode,
    },
  };
}


export function resolveOnboardingDefaults(args: {
  name: string;
  country?: string | null;
  category?: string | null;
  vertical?: BusinessVertical | null;
  tier?: BusinessTier | null;
}): OnboardingDefaults {
  const jurisdiction = getJurisdictionPack(args.country);
  const verticalKey =
    args.vertical ?? resolveVerticalFromCategory(args.category);
  const vertical = getVerticalPack(verticalKey);
  const tier = args.tier ?? "solo";

  return {
    country: jurisdiction.countryIso,
    currency: jurisdiction.currency,
    locale: jurisdiction.defaultLocale,
    timezone: jurisdiction.defaultTimezone,
    euRegion: jurisdiction.euRegion,
    vertical: vertical.vertical,
    tier,
    category: args.category ?? vertical.vertical,
    aiGreeting: `Hi! I'm Liv, the AI assistant for ${args.name}. I can help you book an appointment — what are you looking for today?`,
    services: vertical.defaultServices,
    staff: vertical.defaultStaff,
  };
}

export { listJurisdictionCatalog } from "./jurisdictions";
export { listVerticalCatalog } from "./verticals";
