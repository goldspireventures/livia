/**
 * Resource follow-up SLA registry — policy defines rules; API adapters execute per table.
 * Any vertical/resource adds a rule here + an adapter in resource-follow-up.service.ts.
 */
import type { InAppNotificationKind } from "./notification-policy";
import type { PlatformResourceKind } from "./resource-transition-program";

export type ResourceFollowUpRule = {
  id: string;
  resourceKind: PlatformResourceKind;
  /** Status to watch for client/operator inaction */
  watchStatus: string;
  /** Nudge operators after N days in watchStatus */
  nudgeAfterDays?: number;
  nudgeKind?: InAppNotificationKind;
  /** Auto-close to this status after N days (optional) */
  autoCloseAfterDays?: number;
  autoCloseToStatus?: string;
  autoCloseNoteSuffix?: string;
  /** Second watch lane — e.g. studio revision after client rejected */
  secondaryWatchStatus?: string;
  secondaryNudgeAfterDays?: number;
  secondaryNudgeKind?: InAppNotificationKind;
};

export const RESOURCE_FOLLOW_UP_RULES: ResourceFollowUpRule[] = [
  {
    id: "design_proof_client_review",
    resourceKind: "design_proof",
    watchStatus: "pending_review",
    nudgeAfterDays: 2,
    nudgeKind: "design-proof.awaiting_client",
    autoCloseAfterDays: 3,
    autoCloseToStatus: "draft",
    autoCloseNoteSuffix:
      "— System: Auto-closed after {days} days with no client response.",
    secondaryWatchStatus: "rejected",
    secondaryNudgeAfterDays: 2,
    secondaryNudgeKind: "design-proof.changes_requested",
  },
  // Future: quote awaiting deposit, medspa consent pending, intake forms, etc.
];

export function resolveFollowUpRule(resourceKind: PlatformResourceKind): ResourceFollowUpRule | undefined {
  return RESOURCE_FOLLOW_UP_RULES.find((r) => r.resourceKind === resourceKind);
}
