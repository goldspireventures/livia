import { z } from "zod/v4";

/** Membership role v2 values that can receive automated digests. */
export const personaReportAudienceSchema = z.enum([
  "OWN",
  "ADM",
  "ADM-D",
  "STA",
  "REC",
  "OWNER_HOST",
]);
export type PersonaReportAudience = z.infer<typeof personaReportAudienceSchema>;

export const personaReportSlugSchema = z.enum([
  "owner_morning",
  "owner_weekly",
  "manager_ops",
  "staff_day_sheet",
  "reception_handoffs",
  "host_rent_roll",
  "accountant_preview",
]);
export type PersonaReportSlug = z.infer<typeof personaReportSlugSchema>;

export type PersonaReportDefinition = {
  slug: PersonaReportSlug;
  title: string;
  description: string;
  audiences: PersonaReportAudience[];
  /** Cron-friendly hint for workflows. */
  scheduleHint: "daily_06_local" | "weekly_mon_07_local" | "on_demand";
  channels: Array<"in_app" | "email" | "push">;
};

export const PERSONA_REPORT_CATALOG: PersonaReportDefinition[] = [
  {
    slug: "owner_morning",
    title: "Morning briefing",
    description: "Today's schedule, pending decisions, and Liv highlights.",
    audiences: ["OWN"],
    scheduleHint: "daily_06_local",
    channels: ["in_app", "push"],
  },
  {
    slug: "owner_weekly",
    title: "Weekly digest",
    description: "Revenue rhythm, no-shows, and inbox conversion.",
    audiences: ["OWN", "OWNER_HOST"],
    scheduleHint: "weekly_mon_07_local",
    channels: ["in_app", "email"],
  },
  {
    slug: "manager_ops",
    title: "Manager ops digest",
    description: "Approvals, rota gaps, and handed-off conversations.",
    audiences: ["ADM", "ADM-D"],
    scheduleHint: "daily_06_local",
    channels: ["in_app", "push"],
  },
  {
    slug: "staff_day_sheet",
    title: "My day sheet",
    description: "Your appointments and prep notes.",
    audiences: ["STA"],
    scheduleHint: "daily_06_local",
    channels: ["in_app", "push"],
  },
  {
    slug: "reception_handoffs",
    title: "Reception handoffs",
    description: "Threads waiting for a human and walk-ins.",
    audiences: ["REC", "ADM"],
    scheduleHint: "on_demand",
    channels: ["in_app"],
  },
  {
    slug: "host_rent_roll",
    title: "Host rent roll",
    description: "Chair renters, arrears, and collection status.",
    audiences: ["OWNER_HOST", "OWN"],
    scheduleHint: "weekly_mon_07_local",
    channels: ["in_app", "email"],
  },
  {
    slug: "accountant_preview",
    title: "Accountant preview",
    description: "Read-only revenue + payroll hours tease for your bookkeeper.",
    audiences: ["OWN", "ADM"],
    scheduleHint: "on_demand",
    channels: ["in_app", "email"],
  },
];

export function listReportsForAudience(audience: PersonaReportAudience): PersonaReportDefinition[] {
  return PERSONA_REPORT_CATALOG.filter((r) => r.audiences.includes(audience));
}

export function getReportDefinition(slug: PersonaReportSlug): PersonaReportDefinition | undefined {
  return PERSONA_REPORT_CATALOG.find((r) => r.slug === slug);
}
