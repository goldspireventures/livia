import { getJurisdictionPack, resolveJurisdictionCode } from "./jurisdictions";
import { guardChannelPackForProduction, resolveChannelPack } from "./channels";
import {
  getVerticalPack,
  resolveVerticalFromCategory,
  VERTICAL_PACKS,
} from "./verticals";
import { parseOperationalPolicy } from "./operational-policy";
import {
  computeBookingTermsBlock,
  resolveBookingTermsBlock,
  resolveHouseRulesBlock,
  resolvePrivacyNoticeBlock,
} from "./guest-policies";
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

  const bookingTermsBlock = resolveBookingTermsBlock({
    country: input.country,
    operational: op,
  });
  const privacyNoticeBlock = resolvePrivacyNoticeBlock({
    businessName: input.name,
    country: input.country,
    operational: op,
  });
  const houseRulesBlock = resolveHouseRulesBlock({ operational: op });

  return {
    jurisdiction,
    vertical,
    channels,
    currency: input.currency || jurisdiction.currency,
    locale: input.locale || jurisdiction.defaultLocale,
    timezone: input.timezone || jurisdiction.defaultTimezone,
    bookingTermsBlock,
    bookingTermsTemplate: computeBookingTermsBlock({
      country: input.country,
      operational: { ...op, bookingTermsCustom: undefined },
    }),
    privacyNoticeBlock,
    houseRulesBlock,
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

  const aiGreeting =
    verticalKey === "event-vendors"
      ? `Hi! I'm Liv, the assistant for ${args.name}. Tell me about your event — I'll guide you to our enquire form or answer decor questions.`
      : `Hi! I'm Liv, the AI assistant for ${args.name}. I can help you book an appointment — what are you looking for today?`;

  return {
    country: jurisdiction.countryIso,
    currency: jurisdiction.currency,
    locale: jurisdiction.defaultLocale,
    timezone: jurisdiction.defaultTimezone,
    euRegion: jurisdiction.euRegion,
    vertical: vertical.vertical,
    tier,
    category: args.category ?? vertical.vertical,
    aiGreeting,
    services: vertical.defaultServices,
    staff: vertical.defaultStaff,
  };
}

export { listJurisdictionCatalog } from "./jurisdictions";
export { listVerticalCatalog } from "./verticals";
