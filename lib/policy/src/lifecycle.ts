/**
 * Configuration graduations (G1–G8) — shared product vocabulary.
 * @see docs/journeys/configuration-graduation.md
 */

export const GRADUATION_IDS = [
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
] as const;

export type GraduationId = (typeof GRADUATION_IDS)[number];

export type GraduationStatus = "suggested" | "in_progress" | "completed" | "dismissed";

export type GraduationSuggestion = {
  id: GraduationId;
  title: string;
  summary: string;
  whyNow: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  status: GraduationStatus;
  priority: number;
};

export const TIER_LABELS: Record<string, { label: string; description: string }> = {
  solo: {
    label: "Solo practitioner",
    description: "Just you — or you and an apprentice. Liv runs ops while you work the chair.",
  },
  studio: {
    label: "Small studio",
    description: "A team with roles — managers, seniors, front desk. Studio plan + per-seat pricing.",
  },
  chain: {
    label: "Multi-location",
    description: "Two or more shops under your ownership. Chain rollup and per-shop billing.",
  },
  "chair-host": {
    label: "Chair-rental host",
    description: "You host independent stylists. Rent automation and scoped renter data.",
  },
  "white-label": {
    label: "Multi-brand portfolio",
    description: "Distinct brands, strict isolation. Portfolio rollup for founders.",
  },
};

export const DESK_ROLE_LABELS = {
  manager: {
    label: "Manager",
    description: "Runs the floor — inbox, approvals, rota, cap-bound refunds.",
  },
  reception: {
    label: "Front desk",
    description: "Bookings and walk-ins — calendar-first, not owner settings.",
  },
} as const;

export type DeskRole = keyof typeof DESK_ROLE_LABELS;
