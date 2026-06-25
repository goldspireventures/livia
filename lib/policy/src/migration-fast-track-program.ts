/**
 * Solo / small-studio fast-track onboarding — switching vs fresh paths.
 */
import type { OnboardingActId, OnboardingChecklist, OnboardingState } from "./onboarding-state";
import { onboardingChecklistSchema } from "./onboarding-state";
import { mergePercentWithBlocking, verticalRequiresMenuSetup } from "./onboarding-program";

export type MigrationIntent = "fresh" | "switching" | "unspecified";

export const MIGRATION_INTENT_OPTIONS: Array<{
  id: MigrationIntent;
  title: string;
  subtitle: string;
}> = [
  {
    id: "fresh",
    title: "Starting fresh",
    subtitle: "New shop or paper-and-WhatsApp.",
  },
  {
    id: "switching",
    title: "Bringing my shop",
    subtitle: "Import menu, clients, and bookings from a file or export.",
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

/** Portal visible nav — switchers import right after a minimal shell; profile comes from import. */
export function resolvePortalNavActs(
  checklist?: Partial<OnboardingChecklist> | null,
): readonly OnboardingActId[] {
  if (isSwitchingMigration(checklist)) {
    return [
      "a1_create_business",
      "a11_migration",
      "a5_hours",
      "a8_public_link",
      "a12_go_live",
    ] as const;
  }
  return [
    "a1_create_business",
    "a2_shop_profile",
    "a5_hours",
    "a8_public_link",
    "a12_go_live",
  ] as const;
}

export function portalFastTrackStepCount(intent: MigrationIntent): number {
  return 5;
}

export type OnboardingTrack = "fresh" | "import";

export function onboardingTrackFromIntent(intent: MigrationIntent): OnboardingTrack | null {
  if (intent === "fresh") return "fresh";
  if (intent === "switching") return "import";
  return null;
}

export function onboardingIntentFromTrack(track: string | null | undefined): MigrationIntent | null {
  if (track === "fresh") return "fresh";
  if (track === "import") return "switching";
  return null;
}

const PORTAL_STEP_LABELS: Partial<Record<OnboardingActId, string>> = {
  a1_create_business: "Shop",
  a2_shop_profile: "Profile",
  a11_migration: "Import",
  a5_hours: "Hours",
  a8_public_link: "Book link",
  a12_go_live: "Open",
};

/** Step-1 label differs by path — import shell is lighter than fresh create. */
export function portalFirstStepLabel(
  checklist?: Partial<OnboardingChecklist> | null,
): string {
  return isSwitchingMigration(checklist) ? "Basics" : "Shop";
}

export function portalNavStepLabels(
  checklist?: Partial<OnboardingChecklist> | null,
): { act: OnboardingActId; label: string }[] {
  return resolvePortalNavActs(checklist).map((act) => ({
    act,
    label:
      act === "a1_create_business"
        ? portalFirstStepLabel(checklist)
        : (PORTAL_STEP_LABELS[act] ?? act),
  }));
}

/** Portal create path — always profile next; keep migration intent on checklist. */
export function portalStepProgress(
  currentAct: OnboardingActId,
  checklist?: Partial<OnboardingChecklist> | null,
): { index: number; total: number; label: string } | null {
  const steps = portalNavStepLabels(checklist);
  const idx = steps.findIndex((s) => s.act === currentAct);
  if (idx < 0) return null;
  return { index: idx + 1, total: steps.length, label: steps[idx]!.label };
}

export function afterPortalBusinessCreatedState(
  checklist: Partial<OnboardingChecklist> | null | undefined,
  vertical?: string | null,
): OnboardingState {
  const switching = isSwitchingMigration(checklist);
  return mergePercentWithBlocking({
    currentAct: switching ? "a11_migration" : "a2_shop_profile",
    completedActs: ["a1_create_business"],
    percentComplete: 0,
    checklist: onboardingChecklistSchema.parse({
      ...checklist,
      servicesConfirmed: switching || !verticalRequiresMenuSetup(vertical),
    }),
    updatedAt: new Date().toISOString(),
  });
}

/** Essentials before the owner can use the app — rest is preconfigured or finished in-product. */
export function blockingOnboardingActsForSession(
  vertical?: string | null,
  checklist?: Partial<OnboardingChecklist> | null,
): OnboardingActId[] {
  if (vertical === "event-vendors") {
    return ["a2_shop_profile", "a3_service_menu", "a6_liv", "a8_public_link"];
  }
  if (isSwitchingMigration(checklist)) {
    return ["a5_hours"];
  }
  return ["a2_shop_profile", "a5_hours"];
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
  if (act === "a2_shop_profile" && isSwitchingMigration(checklist)) return true;
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
    return "Shop name and trade — then upload or connect your old system.";
  }
  return "Name your shop and trade — starter services and team go in automatically.";
}

/** Path picker only — one line, no overlap with card copy. */
export function startPathLivLine(intent: MigrationIntent): string {
  if (intent === "switching") {
    return "Import your menu and clients, then set hours.";
  }
  return "Name your shop, set hours, open the app.";
}

export function afterMigrationImportOnboardingState(state: OnboardingState): OnboardingState {
  const checklist = state.checklist;
  if (!isSwitchingMigration(checklist)) {
    return mergePercentWithBlocking({
      ...state,
      checklist: onboardingChecklistSchema.parse({
        ...checklist,
        migrationImported: true,
      }),
      updatedAt: new Date().toISOString(),
    });
  }
  const autoComplete: OnboardingActId[] = [
    "a11_migration",
    "a2_shop_profile",
    "a3_service_menu",
    "a4_team",
  ];
  const completedActs = [...new Set([...state.completedActs, ...autoComplete])];
  const nav = resolvePortalNavActs(checklist);
  const currentAct = nav.find((a) => !completedActs.includes(a)) ?? "a12_go_live";
  return mergePercentWithBlocking({
    ...state,
    currentAct,
    completedActs,
    checklist: onboardingChecklistSchema.parse({
      ...checklist,
      migrationImported: true,
      servicesConfirmed: true,
    }),
    updatedAt: new Date().toISOString(),
  });
}
