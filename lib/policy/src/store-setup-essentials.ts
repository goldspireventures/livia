/**
 * V1 store setup — what owners must complete to take bookings on Livia.
 * Channels, billing, and team growth are enhancements; explore via Settings or ask Liv.
 * @see docs/product/V1-PRODUCT-DEFINITION.md (sacred metric: first booking)
 */
import type { BusinessVertical } from "./types";
import type { ResolvedPlatformCapability } from "./capability-resolution";
import { COMMERCE_BILLING_FIX_HREF } from "./commerce-signals";
import { SETTINGS_CHANNELS_SETUP_HREF } from "./capability-instances";
import {
  operatorNeedsWorkforceNav,
  type OperatorNavSignals,
} from "./operator-nav-policy";
import type { OnboardingChecklist } from "./onboarding-state";

/** Capabilities that must be ready before web booking + Liv chat work. */
export const LAUNCH_ESSENTIAL_CAPABILITY_IDS = new Set([
  "bookings",
  "availability",
]);

/** Installed per vertical but never block launch or settings attention. */
export const OPTIONAL_ENHANCEMENT_CAPABILITY_IDS = new Set([
  "messaging",
  "payments",
  "deposits",
  "reviews",
  "portfolio",
  "memberships",
]);

export function isLaunchEssentialCapability(capabilityId: string): boolean {
  return LAUNCH_ESSENTIAL_CAPABILITY_IDS.has(capabilityId);
}

export function isOptionalEnhancementCapability(capabilityId: string): boolean {
  return OPTIONAL_ENHANCEMENT_CAPABILITY_IDS.has(capabilityId);
}

export type LaunchCapabilityBlocker = {
  capabilityId: string;
  capabilityName: string;
  blocker: string;
};

export function flattenLaunchEssentialCapabilityBlockers(
  capabilities: ResolvedPlatformCapability[],
): LaunchCapabilityBlocker[] {
  return capabilities
    .filter((c) => isLaunchEssentialCapability(c.id))
    .flatMap((c) =>
      c.readinessBlockers.map((blocker) => ({
        capabilityId: c.id,
        capabilityName: c.name,
        blocker,
      })),
    );
}

export function countLaunchEssentialBlockers(
  capabilities: ResolvedPlatformCapability[],
): number {
  return flattenLaunchEssentialCapabilityBlockers(capabilities).length;
}

/** Human-readable launch path — onboarding and Liv arrival should mirror this. */
export function verticalStoreSetupEssentials(vertical?: BusinessVertical | string | null): {
  id: string;
  label: string;
}[] {
  if (vertical === "event-vendors") {
    return [
      { id: "profile", label: "Studio profile" },
      { id: "menu", label: "Service catalogue" },
      { id: "liv", label: "Liv for enquiries" },
      { id: "publish", label: "Public site link" },
      { id: "first-quote", label: "First booking or quote" },
    ];
  }
  return [
    { id: "profile", label: "Location profile" },
    { id: "menu", label: "Services on your menu" },
    { id: "hours", label: "Opening hours" },
    { id: "liv", label: "Liv on your booking page" },
    { id: "publish", label: "Public booking link" },
    { id: "first-booking", label: "First test booking" },
  ];
}

export const STORE_SETUP_ENHANCEMENT_COPY = {
  channels:
    "SMS and WhatsApp — reply from one inbox when you are ready. Web chat and email work without them.",
  billing: "Deposits and plan — turn on when you want to charge guests.",
  team: "Extra practitioners — invite when you grow beyond solo.",
} as const;

/** Activation checklist ids that are enhancements, not launch gates. */
export const OPTIONAL_ACTIVATION_STEP_IDS = new Set([
  "channels",
  "team",
  "billing",
]);

export type SettingsEnhancementRow = {
  id: string;
  title: string;
  body: string;
  href: string;
};

/** Optional setup cards — shown in Settings when launch essentials are done or in parallel. */
export function buildSettingsEnhancementRows(input: {
  vertical?: BusinessVertical | string | null;
  checklist?: Partial<OnboardingChecklist> | null;
  messagingConfigured?: boolean;
  paymentsConnected?: boolean;
  operatorSignals?: OperatorNavSignals | null;
  canViewComms?: boolean;
  canViewBilling?: boolean;
}): SettingsEnhancementRow[] {
  const checklist = input.checklist ?? {};
  const rows: SettingsEnhancementRow[] = [];

  const channelsDone =
    checklist.smsOrVoiceConnected === true || input.messagingConfigured === true;
  if (input.canViewComms !== false && !channelsDone) {
    rows.push({
      id: "enhance-channels",
      title: "SMS & WhatsApp",
      body: STORE_SETUP_ENHANCEMENT_COPY.channels,
      href: SETTINGS_CHANNELS_SETUP_HREF,
    });
  }

  const billingDone =
    checklist.billingStarted === true || input.paymentsConnected === true;
  if (input.canViewBilling !== false && !billingDone) {
    rows.push({
      id: "enhance-billing",
      title: input.vertical === "event-vendors" ? "Quote deposits" : "Deposits & plan",
      body:
        input.vertical === "event-vendors"
          ? "Collect deposits on quotes when you are ready — not required to take enquiries."
          : STORE_SETUP_ENHANCEMENT_COPY.billing,
      href: COMMERCE_BILLING_FIX_HREF,
    });
  }

  if (
    input.operatorSignals &&
    operatorNeedsWorkforceNav(input.operatorSignals) &&
    checklist.teamInvited !== true
  ) {
    rows.push({
      id: "enhance-team",
      title: "Invite your team",
      body: STORE_SETUP_ENHANCEMENT_COPY.team,
      href: "/staff",
    });
  }

  return rows;
}
