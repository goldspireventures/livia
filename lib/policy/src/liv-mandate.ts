import { z } from "zod/v4";
import type { BusinessVertical } from "./types";

/** Autonomy rung — how much Liv may do without a human tap. */
export const livAutonomyRungSchema = z.enum(["R0", "R1", "R2", "R3", "R4"]);
export type LivAutonomyRung = z.infer<typeof livAutonomyRungSchema>;

export const livMandateActionSchema = z.enum([
  "reply_inbox",
  "book_slot",
  "reschedule",
  "cancel_booking",
  "collect_deposit",
  "waive_deposit",
  "apply_no_show_fee",
  "send_reminder",
  "approve_time_off",
  "broadcast_running_late",
  "release_waitlist_offer",
  "approve_design_proof",
  "process_refund",
]);
export type LivMandateAction = z.infer<typeof livMandateActionSchema>;

export const livMandateSchema = z.object({
  /** Current autonomy rung. */
  rung: livAutonomyRungSchema.default("R1"),
  /** Explicit allowlist; empty = use rung defaults. */
  allowedActions: z.array(livMandateActionSchema).default([]),
  /** Hard deny even if rung would allow. */
  deniedActions: z.array(livMandateActionSchema).default([]),
  /** Max auto-commit value in minor units (cents). */
  maxAutoValueMinor: z.number().int().min(0).max(500_000).default(0),
  /** Trust score 0–100 (Liv earns higher rungs over time). */
  trustScore: z.number().int().min(0).max(100).default(40),
  /** Owner-facing note shown in settings. */
  ownerNote: z.string().max(500).optional(),
  /** When owner last acknowledged mandate. */
  acknowledgedAt: z.string().datetime().optional(),
});

export type LivMandate = z.infer<typeof livMandateSchema>;

export const DEFAULT_LIV_MANDATE: LivMandate = livMandateSchema.parse({});

export type LivDecisionOutcome = "auto" | "propose" | "refuse";

export type LivDecision = {
  outcome: LivDecisionOutcome;
  rung: LivAutonomyRung;
  action: LivMandateAction;
  reason: string;
  /** Human-readable preview for Approvals queue. */
  preview?: string;
};

const RUNG_AUTO_ACTIONS: Record<LivAutonomyRung, LivMandateAction[]> = {
  R0: [],
  R1: [],
  R2: ["reply_inbox", "send_reminder"],
  R3: [
    "reply_inbox",
    "send_reminder",
    "book_slot",
    "reschedule",
    "release_waitlist_offer",
  ],
  R4: [
    "reply_inbox",
    "send_reminder",
    "book_slot",
    "reschedule",
    "cancel_booking",
    "collect_deposit",
    "release_waitlist_offer",
    "broadcast_running_late",
  ],
};

/** Conservative defaults per vertical for new businesses. */
export const VERTICAL_MANDATE_DEFAULTS: Record<BusinessVertical, Partial<LivMandate>> = {
  hair: { rung: "R2", trustScore: 45 },
  beauty: { rung: "R2", trustScore: 45 },
  wellness: { rung: "R2", trustScore: 42 },
  fitness: { rung: "R2", trustScore: 42 },
  "body-art": { rung: "R1", trustScore: 35, deniedActions: ["approve_design_proof"] },
  medspa: { rung: "R1", trustScore: 30, maxAutoValueMinor: 0 },
  "allied-health": { rung: "R1", trustScore: 32, maxAutoValueMinor: 0 },
  "pet-grooming": { rung: "R2", trustScore: 44 },
  "automotive-detailing": { rung: "R2", trustScore: 42 },
  "event-vendors": { rung: "R1", trustScore: 35 },
};

export function parseLivMandate(raw: unknown): LivMandate {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LIV_MANDATE };
  const parsed = livMandateSchema.safeParse(raw);
  return parsed.success ? parsed.data : { ...DEFAULT_LIV_MANDATE };
}

export function mergeLivMandate(partial: Partial<LivMandate> | undefined, current: LivMandate): LivMandate {
  return livMandateSchema.parse({ ...current, ...partial });
}

export function mandateDefaultsForVertical(vertical: BusinessVertical): LivMandate {
  const partial = VERTICAL_MANDATE_DEFAULTS[vertical] ?? {};
  return livMandateSchema.parse({ ...DEFAULT_LIV_MANDATE, ...partial });
}

function isActionAllowedByRung(rung: LivAutonomyRung, action: LivMandateAction): boolean {
  return RUNG_AUTO_ACTIONS[rung].includes(action);
}

export function resolveLivDecision(args: {
  mandate: LivMandate;
  action: LivMandateAction;
  /** Proposed monetary impact in minor units. */
  valueMinor?: number;
}): LivDecision {
  const { mandate, action } = args;
  const valueMinor = args.valueMinor ?? 0;

  if (mandate.deniedActions.includes(action)) {
    return {
      outcome: "refuse",
      rung: mandate.rung,
      action,
      reason: "Owner blocked this action in Liv Mandate.",
    };
  }

  if (mandate.allowedActions.length > 0 && !mandate.allowedActions.includes(action)) {
    return {
      outcome: mandate.rung === "R0" ? "refuse" : "propose",
      rung: mandate.rung,
      action,
      reason: "Action not on your explicit allowlist.",
    };
  }

  if (mandate.rung === "R0") {
    return {
      outcome: "propose",
      rung: mandate.rung,
      action,
      reason: "Liv is in observe mode — review every action.",
      preview: `Liv would: ${action.replace(/_/g, " ")}`,
    };
  }

  if (mandate.rung === "R1") {
    return {
      outcome: "propose",
      rung: mandate.rung,
      action,
      reason: "Propose-first mode — tap approve in Approvals.",
      preview: `Liv would: ${action.replace(/_/g, " ")}`,
    };
  }

  if (valueMinor > 0 && mandate.maxAutoValueMinor > 0 && valueMinor > mandate.maxAutoValueMinor) {
    return {
      outcome: "propose",
      rung: mandate.rung,
      action,
      reason: `Above your auto cap (€${(mandate.maxAutoValueMinor / 100).toFixed(0)}).`,
      preview: `Liv would: ${action.replace(/_/g, " ")}`,
    };
  }

  if (!isActionAllowedByRung(mandate.rung, action)) {
    const needsHuman = mandate.rung === "R2" || mandate.rung === "R3";
    return {
      outcome: needsHuman ? "propose" : "refuse",
      rung: mandate.rung,
      action,
      reason: needsHuman
        ? "This action needs your approval at your current trust level."
        : "Not permitted at current autonomy level.",
      preview: `Liv would: ${action.replace(/_/g, " ")}`,
    };
  }

  if (mandate.trustScore < 25 && mandate.rung !== "R4") {
    return {
      outcome: "propose",
      rung: mandate.rung,
      action,
      reason: "Trust score is still building — confirming with you.",
      preview: `Liv would: ${action.replace(/_/g, " ")}`,
    };
  }

  return {
    outcome: "auto",
    rung: mandate.rung,
    action,
    reason: "Within mandate — Liv can proceed.",
  };
}

/** Owner-facing copy for mandate rungs (G6 guardrails UX). */
export const LIV_MANDATE_RUNG_LABELS: Record<
  LivAutonomyRung,
  { short: string; description: string }
> = {
  R0: {
    short: "Observe",
    description: "Liv only suggests — nothing runs without you.",
  },
  R1: {
    short: "Approve all",
    description: "Every customer-facing action needs your tap first.",
  },
  R2: {
    short: "Bounded",
    description: "Liv handles small routine replies; bigger moves wait for you.",
  },
  R3: {
    short: "Routine",
    description: "Liv books and reschedules within your rules; money stays gated.",
  },
  R4: {
    short: "Full allowlist",
    description: "Liv runs your allowlist — still blocked by anything you denied.",
  },
};

export function simulateMandateScenarios(
  mandate: LivMandate,
  vertical?: string,
): Array<LivDecision & { label: string }> {
  const samples: Array<{ label: string; action: LivMandateAction; valueMinor?: number }> = [
    { label: "Reply to new inbox thread", action: "reply_inbox" },
    { label: "Book an open slot", action: "book_slot" },
    { label: "Collect €50 deposit", action: "collect_deposit", valueMinor: 5000 },
    { label: "Process €60 refund", action: "process_refund", valueMinor: 6000 },
  ];
  if (vertical === "body-art") {
    samples.push({ label: "Approve tattoo design proof", action: "approve_design_proof" });
  }
  return samples.map((s) => ({
    label: s.label,
    ...resolveLivDecision({ mandate, action: s.action, valueMinor: s.valueMinor }),
  }));
}
