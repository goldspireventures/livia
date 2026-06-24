/**
 * Solo / small-studio fast-track onboarding — switching vs fresh paths.
 */
import type { OnboardingActId, OnboardingChecklist } from "./onboarding-state";

export type MigrationIntent = "fresh" | "switching" | "unspecified";

export const MIGRATION_INTENT_OPTIONS: Array<{
  id: MigrationIntent;
  title: string;
  subtitle: string;
}> = [
  {
    id: "fresh",
    title: "Starting fresh",
    subtitle: "New shop or paper-and-WhatsApp — we'll seed a starter menu.",
  },
  {
    id: "switching",
    title: "Bringing my shop",
    subtitle: "Import from Phorest, Fresha, Booksy, Acuity, or a spreadsheet — Liv applies it.",
  },
];

export function resolveMigrationIntent(
  checklist?: Partial<OnboardingChecklist> | null,
): MigrationIntent {
  const intent = (checklist as { migrationIntent?: MigrationIntent } | undefined)?.migrationIntent;
  if (intent === "fresh" || intent === "switching") return intent;
  return "unspecified";
}

export function isSwitchingMigration(checklist?: Partial<OnboardingChecklist> | null): boolean {
  return resolveMigrationIntent(checklist) === "switching";
}

/** Portal visible nav — switchers see migration before hours. */
export function resolvePortalNavActs(
  checklist?: Partial<OnboardingChecklist> | null,
): readonly OnboardingActId[] {
  if (isSwitchingMigration(checklist)) {
    return [
      "a1_create_business",
      "a2_shop_profile",
      "a11_migration",
      "a5_hours",
      "a6_liv",
      "a8_public_link",
      "a12_go_live",
    ] as const;
  }
  return [
    "a1_create_business",
    "a2_shop_profile",
    "a5_hours",
    "a6_liv",
    "a8_public_link",
    "a12_go_live",
  ] as const;
}

const BASE_SKIPPED: OnboardingActId[] = [
  "a3_service_menu",
  "a4_team",
  "a7_channels",
  "a9_billing",
  "a10_invite_team",
];

export function isPortalSkippedUiAct(
  act: OnboardingActId,
  checklist?: Partial<OnboardingChecklist> | null,
): boolean {
  if (act === "a11_migration" && isSwitchingMigration(checklist)) return false;
  if (act === "a11_migration") return true;
  return BASE_SKIPPED.includes(act);
}

export function shouldSeedStarterPackOnCreate(intent: MigrationIntent): boolean {
  return intent !== "switching";
}

export function resolveFastTrackLivLine(args: {
  intent: MigrationIntent;
  sourceName?: string;
  importedCount?: number;
}): string {
  if (args.intent === "switching" && args.sourceName) {
    if ((args.importedCount ?? 0) > 0) {
      return `I've applied ${args.importedCount} records from ${args.sourceName}. Next we'll set hours and your public link — same shop, now on Livia.`;
    }
    return `Tell me you're on ${args.sourceName} and I'll walk you through the exports — then we apply everything in one go.`;
  }
  if (args.intent === "switching") {
    return "Pick where you're coming from and I'll guide the exports — menu, clients, and upcoming bookings land in minutes.";
  }
  return "We'll seed a starter menu so you're not staring at a blank screen — tweak it anytime.";
}
