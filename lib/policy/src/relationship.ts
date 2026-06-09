import { z } from "zod/v4";

/** Lifecycle stage for business ↔ customer relationship (Era 1 Q2 aggregate). */
export const relationshipLifecycleStageSchema = z.enum([
  "prospect",
  "new",
  "active",
  "at_risk",
  "lapsed",
  "trusted",
]);

export type RelationshipLifecycleStage = z.infer<typeof relationshipLifecycleStageSchema>;

export const relationshipTrajectorySchema = z.enum([
  "strengthening",
  "stable",
  "weakening",
  "unknown",
]);

export type RelationshipTrajectory = z.infer<typeof relationshipTrajectorySchema>;

export type RelationshipSignalInput = {
  totalBookings: number;
  completedVisits: number;
  daysSinceLastVisit: number | null;
  hasUpcomingBooking: boolean;
  trustedClient: boolean;
  noShowCount: number;
  conversationCount: number;
  daysSinceLastMessage: number | null;
};

export type RelationshipDerived = {
  stage: RelationshipLifecycleStage;
  trajectory: RelationshipTrajectory;
  headline: string;
  signals: string[];
};

const STAGE_LABELS: Record<RelationshipLifecycleStage, string> = {
  prospect: "Prospect",
  new: "New guest",
  active: "Active",
  at_risk: "At risk",
  lapsed: "Lapsed",
  trusted: "Trusted regular",
};

export function relationshipStageLabel(stage: RelationshipLifecycleStage): string {
  return STAGE_LABELS[stage];
}

export function deriveRelationshipSignals(input: RelationshipSignalInput): RelationshipDerived {
  const signals: string[] = [];

  if (input.trustedClient) {
    signals.push("Marked as trusted client");
  }
  if (input.completedVisits > 0) {
    signals.push(`${input.completedVisits} completed visit${input.completedVisits === 1 ? "" : "s"}`);
  }
  if (input.hasUpcomingBooking) {
    signals.push("Upcoming booking on the books");
  }
  if (input.daysSinceLastVisit != null) {
    signals.push(`Last visit ${input.daysSinceLastVisit} day${input.daysSinceLastVisit === 1 ? "" : "s"} ago`);
  }
  if (input.conversationCount > 0) {
    signals.push(`${input.conversationCount} conversation thread${input.conversationCount === 1 ? "" : "s"}`);
  }
  if (input.noShowCount > 0) {
    signals.push(`${input.noShowCount} no-show${input.noShowCount === 1 ? "" : "s"}`);
  }

  let stage: RelationshipLifecycleStage = "prospect";

  if (input.trustedClient || (input.completedVisits >= 5 && input.noShowCount === 0)) {
    stage = "trusted";
  } else if (input.completedVisits === 0 && input.totalBookings === 0) {
    stage = "prospect";
  } else if (input.completedVisits <= 1 && !input.hasUpcomingBooking) {
    stage = input.completedVisits === 0 ? "prospect" : "new";
  } else if (input.hasUpcomingBooking) {
    stage = input.completedVisits <= 1 ? "new" : "active";
  } else if (input.daysSinceLastVisit != null) {
    if (input.daysSinceLastVisit <= 60) {
      stage = input.completedVisits <= 1 ? "new" : "active";
    } else if (input.daysSinceLastVisit <= 90) {
      stage = "at_risk";
    } else {
      stage = "lapsed";
    }
  } else {
    stage = input.completedVisits > 0 ? "active" : "prospect";
  }

  let trajectory: RelationshipTrajectory = "unknown";
  if (stage === "at_risk" || stage === "lapsed") {
    trajectory = "weakening";
  } else if (
    input.hasUpcomingBooking ||
    (input.daysSinceLastVisit != null && input.daysSinceLastVisit <= 30 && input.completedVisits >= 2)
  ) {
    trajectory = "strengthening";
  } else if (stage === "active" || stage === "trusted" || stage === "new") {
    trajectory = "stable";
  }

  const headline =
    stage === "prospect"
      ? "No visits yet — relationship starts at first booking."
      : stage === "new"
        ? "Early relationship — nurture the second visit."
        : stage === "at_risk"
          ? "Guest may be drifting — a personal nudge could help."
          : stage === "lapsed"
            ? "Long gap since last visit — win-back may be worth it."
            : stage === "trusted"
              ? "Strong, repeat guest — protect the rhythm."
              : "Engaged guest with recent or upcoming activity.";

  return { stage, trajectory, headline, signals };
}

export const relationshipSummarySchema = z.object({
  customerId: z.string(),
  stage: relationshipLifecycleStageSchema,
  stageLabel: z.string(),
  trajectory: relationshipTrajectorySchema,
  headline: z.string(),
  signals: z.array(z.string()),
  completedVisits: z.number().int().min(0),
  totalBookings: z.number().int().min(0),
  daysSinceLastVisit: z.number().int().nullable(),
  nextBookingAt: z.string().datetime().nullable(),
  conversationCount: z.number().int().min(0),
  lastMessageAt: z.string().datetime().nullable(),
  memoryHighlight: z.string().nullable(),
});

export type RelationshipSummary = z.infer<typeof relationshipSummarySchema>;

/** Lightweight row for owner home / dashboard (no full aggregate fetch). */
export const atRiskGuestPreviewSchema = z.object({
  customerId: z.string(),
  displayName: z.string(),
  stage: z.enum(["at_risk", "lapsed"]),
  daysSinceLastVisit: z.number().int().min(0),
  headline: z.string(),
});

export type AtRiskGuestPreview = z.infer<typeof atRiskGuestPreviewSchema>;

export function atRiskStageFromDays(daysSinceLastVisit: number): "at_risk" | "lapsed" {
  return daysSinceLastVisit > 90 ? "lapsed" : "at_risk";
}

export function atRiskGuestHeadline(stage: "at_risk" | "lapsed", displayName: string): string {
  const first = displayName.split(/\s+/)[0] || displayName;
  return stage === "lapsed"
    ? `${first} hasn't visited in 3+ months — worth a win-back nudge.`
    : `${first} may be drifting — a personal check-in could help.`;
}
