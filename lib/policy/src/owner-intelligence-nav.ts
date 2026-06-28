/**
 * Owner-intelligence → nav badge hints (web + mobile).
 */

import { ownerIntelligenceActSignalCount, type OwnerIntelHomeInput, buildSettingsAttentionRows } from "./owner-intelligence-home";

export type OwnerIntelNavInput = OwnerIntelHomeInput & {
  ops?: { pendingCount?: number; handedOffCount?: number };
};

export type OwnerIntelNavBadges = {
  billingActCount: number;
  toolkitActCount: number;
  settingsActCount: number;
  homeActCount: number;
  livActCount: number;
};

/** Settings nav badge — only items with a fix link inside Settings. */
export function settingsNavAttentionCount(intel: unknown): number {
  return buildSettingsAttentionRows(intel).filter((r) => r.href.includes("/settings")).length;
}

export function ownerIntelligenceNavBadges(
  intel: OwnerIntelNavInput | null | undefined,
): OwnerIntelNavBadges {
  if (!intel) {
    return {
      billingActCount: 0,
      toolkitActCount: 0,
      settingsActCount: 0,
      homeActCount: 0,
      livActCount: 0,
    };
  }
  const commerceAct =
    (intel.remediationTasks?.filter((t) => t.severity === "act").length ?? 0) +
    (intel.commerce?.topSignal?.severity === "act" ? 1 : 0);
  const setupAct = intel.commerceCapabilityBlockers?.length ?? 0;
  const billingActCount = ownerIntelligenceActSignalCount(intel);
  const toolkitActCount = commerceAct;
  const settingsActCount = settingsNavAttentionCount(intel);
  const livActCount = (intel.livPrompts?.length ?? 0) > 0 ? 1 : 0;
  const homeActCount = billingActCount + livActCount;
  return { billingActCount, toolkitActCount, settingsActCount, homeActCount, livActCount };
}

/** Map policy badge counts to dashboard href keys. */
export function ownerIntelBadgesForNav(
  intel: OwnerIntelNavInput | null | undefined,
): Record<string, number> {
  const b = ownerIntelligenceNavBadges(intel);
  const out: Record<string, number> = {};
  if (b.settingsActCount > 0) {
    out["/settings"] = b.settingsActCount;
  }
  if (b.billingActCount > 0) {
    out["/toolkit"] = Math.max(out["/toolkit"] ?? 0, b.toolkitActCount);
  }
  if (b.homeActCount > 0) {
    out["/"] = b.homeActCount;
  }
  if (b.livActCount > 0) {
    out["/my-livia"] = b.livActCount;
  }
  return out;
}

/** Mobile tab keys → badge counts (Today, More, etc.). */
export function ownerIntelBadgesForMobileTabs(
  intel: OwnerIntelNavInput | null | undefined,
): Partial<Record<"index" | "more" | "inbox", number>> {
  const b = ownerIntelligenceNavBadges(intel);
  const out: Partial<Record<"index" | "more" | "inbox", number>> = {};
  // Today: Liv + handed-off only — billing/setup act items belong on More → Settings.
  const todayCount = b.livActCount + (intel?.ops?.handedOffCount ?? 0);
  if (todayCount > 0) out.index = todayCount;
  if (b.settingsActCount > 0) out.more = b.settingsActCount;
  const inboxHandedOff = intel?.ops?.handedOffCount ?? 0;
  if (inboxHandedOff > 0) out.inbox = inboxHandedOff;
  return out;
}
