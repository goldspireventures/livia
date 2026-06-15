import { z } from "zod/v4";

export const jurisdictionCodeSchema = z.enum([
  "IE", "GB", "DE", "FR", "ES", "IT", "NL", "PL", "SE", "DK", "NO", "FI",
]);
export type JurisdictionCode = z.infer<typeof jurisdictionCodeSchema>;

export const businessVerticalSchema = z.enum([
  "hair",
  "beauty",
  "body-art",
  "wellness",
  "fitness",
  "medspa",
  "allied-health",
  "pet-grooming",
  "automotive-detailing",
  "event-vendors",
]);
export type BusinessVertical = z.infer<typeof businessVerticalSchema>;

export const businessTierSchema = z.enum([
  "solo",
  "studio",
  "chain",
  "mid-chain",
  "franchise",
  "chair-host",
  "white-label",
]);
export type BusinessTier = z.infer<typeof businessTierSchema>;

export type EuRegion = "fra" | "dub";

export interface JurisdictionPack {
  code: JurisdictionCode;
  label: string;
  currency: string;
  defaultLocale: string;
  defaultTimezone: string;
  euRegion: EuRegion;
  /** ISO 3166-1 alpha-2 stored on business.country */
  countryIso: string;
  smsMarketingRequiresOptIn: boolean;
  depositPolicySummary: string;
  bookingTermsIntro: string;
  cancellationHours: number;
  aiDisclosure: {
    chatFirstMessage: (businessName: string) => string;
    chatFooterLine: string;
    smsPrefix: (businessName: string) => string;
    emailBlock: (businessName: string) => string;
  };
}

export interface VerticalServiceTemplate {
  name: string;
  description?: string;
  durationMinutes: number;
  priceMinor: number;
  category?: string;
}

export interface VerticalStaffTemplate {
  firstName: string;
  lastName?: string;
  displayName: string;
  color: string;
}

export interface VerticalPack {
  vertical: BusinessVertical;
  label: string;
  categoryAliases: string[];
  defaultServices: VerticalServiceTemplate[];
  defaultStaff: VerticalStaffTemplate[];
  livVocabularyHint: string;
}

export interface ChannelPack {
  sms: boolean;
  webChat: boolean;
  whatsapp: boolean;
  instagram: boolean;
  messenger: boolean;
  voice: boolean;
}

export interface BusinessPolicyInput {
  id: string;
  name: string;
  country: string;
  currency: string;
  locale: string;
  timezone: string;
  vertical: BusinessVertical;
  tier: BusinessTier;
  euRegion: EuRegion;
}

export interface OperationalPolicySnapshot {
  depositRequired: boolean;
  depositPercent: number;
  serviceBufferMinutes: number;
  cancelWindowHours: number;
  lateGraceMinutes: number;
  autoConfirmWhenNoDeposit: boolean;
  bookingContinuityEnabled: boolean;
  bookingContinuityMode:
    | "sms_thread"
    | "whatsapp_thread"
    | "email_only"
    | "instagram_deep_link";
}

export interface ResolvedBusinessPolicies {
  jurisdiction: JurisdictionPack;
  vertical: VerticalPack;
  channels: ChannelPack;
  currency: string;
  locale: string;
  timezone: string;
  bookingTermsBlock: string;
  /** Jurisdiction-computed terms before owner override — for reset/preview in settings. */
  bookingTermsTemplate: string;
  privacyNoticeBlock: string;
  houseRulesBlock: string;
  depositPolicySummary: string;
  aiDisclosure: JurisdictionPack["aiDisclosure"];
  operational: OperationalPolicySnapshot;
}

export interface OnboardingCatalogEntry {
  jurisdiction: JurisdictionCode;
  label: string;
  currency: string;
  defaultTimezone: string;
}

export interface OnboardingDefaults {
  country: string;
  currency: string;
  locale: string;
  timezone: string;
  euRegion: EuRegion;
  vertical: BusinessVertical;
  tier: BusinessTier;
  category: string;
  aiGreeting: string;
  services: VerticalServiceTemplate[];
  staff: VerticalStaffTemplate[];
}
