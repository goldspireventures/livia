import { getJurisdictionPack } from "./jurisdictions";
import { getVerticalPack, resolveVerticalFromCategory } from "./verticals";
import { parseOperationalPolicy, type OperationalPolicy } from "./operational-policy";
import type { BusinessVertical } from "./types";

export type GuestPolicyDocuments = {
  bookingTermsCustom?: string;
  privacyNoticeCustom?: string;
  houseRulesCustom?: string;
};

/** Computed booking terms before owner overrides. */
export function computeBookingTermsBlock(args: {
  country?: string | null;
  operational?: unknown;
}): string {
  const jurisdiction = getJurisdictionPack(args.country);
  const op = parseOperationalPolicy(args.operational);
  const cancelHours = op.cancelWindowHours ?? jurisdiction.cancellationHours;
  const depositSummary = op.depositRequired
    ? `Deposit: ${op.depositPercent}% required to confirm online bookings.`
    : jurisdiction.depositPolicySummary;

  return [
    jurisdiction.bookingTermsIntro,
    depositSummary,
    `Free cancellation up to ${cancelHours} hours before your appointment unless otherwise stated.`,
    `Repeated no-shows are tracked on your client profile.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function resolveBookingTermsBlock(args: {
  country?: string | null;
  operational?: unknown;
}): string {
  const op = parseOperationalPolicy(args.operational);
  const custom = op.bookingTermsCustom?.trim();
  if (custom) return custom;
  return computeBookingTermsBlock(args);
}

export function resolvePrivacyNoticeBlock(args: {
  businessName: string;
  country?: string | null;
  operational?: unknown;
}): string {
  const op = parseOperationalPolicy(args.operational);
  const custom = op.privacyNoticeCustom?.trim();
  if (custom) return custom;
  return buildGuestPolicyTemplates(args).privacyNotice;
}

export function resolveHouseRulesBlock(args: { operational?: unknown }): string {
  const op = parseOperationalPolicy(args.operational);
  return op.houseRulesCustom?.trim() ?? "";
}

/** Starter copy owners can adapt — seeded from jurisdiction + vertical. */
export function buildGuestPolicyTemplates(args: {
  businessName: string;
  country?: string | null;
  vertical?: BusinessVertical | string | null;
  operational?: unknown;
}): { bookingTerms: string; privacyNotice: string; houseRules: string } {
  const jurisdiction = getJurisdictionPack(args.country);
  const verticalKey =
    (args.vertical as BusinessVertical | null | undefined) ??
    resolveVerticalFromCategory(null);
  const vertical = getVerticalPack(verticalKey);
  const bookingTerms = computeBookingTermsBlock({
    country: args.country,
    operational: args.operational,
  });

  const privacyNotice = [
    `${args.businessName} collects contact details you provide when booking or messaging us.`,
    `We use them to confirm appointments, send reminders, and reply to your questions.`,
    jurisdiction.smsMarketingRequiresOptIn
      ? `Promotional messages are only sent with your separate opt-in.`
      : "",
    `You can ask us to update or delete your details by contacting the studio directly.`,
    `Our platform provider (Livia) processes data on our behalf under a data processing agreement.`,
  ]
    .filter(Boolean)
    .join(" ");

  const houseRules = [
    `Arrive a few minutes early so we can start on time.`,
    `Let us know as soon as possible if you need to reschedule.`,
    vertical.vertical === "medspa"
      ? `Some treatments require a consultation or patch test before your first visit.`
      : "",
    vertical.vertical === "pet-grooming"
      ? `Bring vaccination records for grooming visits when requested.`
      : "",
    `Walk-ins are welcome only when we have availability — booking ahead is best.`,
  ]
    .filter(Boolean)
    .join(" ");

  return { bookingTerms, privacyNotice, houseRules };
}

export function guestPolicyCustomFields(
  operational: OperationalPolicy,
): GuestPolicyDocuments {
  return {
    bookingTermsCustom: operational.bookingTermsCustom,
    privacyNoticeCustom: operational.privacyNoticeCustom,
    houseRulesCustom: operational.houseRulesCustom,
  };
}
