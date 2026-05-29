import { ONBOARDING_ACT_IDS, type OnboardingActId } from "@/lib/onboarding-acts";

/** Three portal chapters — UI only; policy still stores A1–A12. */
export const PORTAL_CHAPTER_IDS = ["shop", "liv_link", "launch"] as const;
export type PortalChapterId = (typeof PORTAL_CHAPTER_IDS)[number];

export type PortalChapter = {
  id: PortalChapterId;
  title: string;
  subtitle: string;
  /** All acts in this chapter (including auto-skipped). */
  acts: readonly OnboardingActId[];
};

export const PORTAL_ONBOARDING_CHAPTERS: readonly PortalChapter[] = [
  {
    id: "shop",
    title: "Your shop",
    subtitle: "Name, profile, and hours",
    acts: ["a1_create_business", "a2_shop_profile", "a3_service_menu", "a4_team", "a5_hours"],
  },
  {
    id: "liv_link",
    title: "Liv & your link",
    subtitle: "Voice and public booking page",
    acts: ["a6_liv", "a7_channels", "a8_public_link"],
  },
  {
    id: "launch",
    title: "Go live",
    subtitle: "Checklist and cockpit",
    acts: ["a9_billing", "a10_invite_team", "a11_migration", "a12_go_live"],
  },
] as const;

/** Screens the owner actually sees in portal mode (in order). */
export const PORTAL_NAV_ACTS: readonly OnboardingActId[] = [
  "a1_create_business",
  "a2_shop_profile",
  "a5_hours",
  "a6_liv",
  "a8_public_link",
  "a12_go_live",
] as const;

/** Auto-marked complete when leaving the previous visible step (seeded / optional). */
export const PORTAL_AUTO_COMPLETE_AFTER: Partial<Record<OnboardingActId, readonly OnboardingActId[]>> = {
  a2_shop_profile: ["a3_service_menu", "a4_team"],
  a6_liv: ["a7_channels"],
  a8_public_link: ["a9_billing", "a10_invite_team", "a11_migration"],
};

export const PORTAL_SKIPPED_UI_ACTS = new Set<OnboardingActId>([
  "a3_service_menu",
  "a4_team",
  "a7_channels",
  "a9_billing",
  "a10_invite_team",
  "a11_migration",
]);

function actIndex(act: OnboardingActId): number {
  return ONBOARDING_ACT_IDS.indexOf(act);
}

export function portalChapterForAct(act: OnboardingActId): PortalChapter {
  const found = PORTAL_ONBOARDING_CHAPTERS.find((c) => c.acts.includes(act));
  return found ?? PORTAL_ONBOARDING_CHAPTERS[0]!;
}

export function portalChapterIndex(chapterId: PortalChapterId): number {
  return PORTAL_CHAPTER_IDS.indexOf(chapterId);
}

export function portalChapterLabel(act: OnboardingActId): string {
  const ch = portalChapterForAct(act);
  const idx = portalChapterIndex(ch.id);
  return `Chapter ${idx + 1} of ${PORTAL_CHAPTER_IDS.length} · ${ch.title}`;
}

export function isPortalSkippedUiAct(act: OnboardingActId): boolean {
  return PORTAL_SKIPPED_UI_ACTS.has(act);
}

/** Snap saved state to a visible step when resuming mid–auto-skip act. */
export function resolvePortalCurrentAct(act: OnboardingActId): OnboardingActId {
  if (!isPortalSkippedUiAct(act)) return act;
  const start = actIndex(act);
  for (const id of ONBOARDING_ACT_IDS) {
    if (actIndex(id) >= start && !isPortalSkippedUiAct(id)) return id;
  }
  return "a12_go_live";
}

export function portalAutoCompleteActs(leavingAct: OnboardingActId): OnboardingActId[] {
  return [...(PORTAL_AUTO_COMPLETE_AFTER[leavingAct] ?? [])];
}

export function nextPortalNavAct(act: OnboardingActId): OnboardingActId | null {
  const idx = PORTAL_NAV_ACTS.indexOf(act);
  if (idx < 0) {
    const orderIdx = actIndex(act);
    for (const nav of PORTAL_NAV_ACTS) {
      if (actIndex(nav) > orderIdx) return nav;
    }
    return null;
  }
  return idx < PORTAL_NAV_ACTS.length - 1 ? PORTAL_NAV_ACTS[idx + 1]! : null;
}

export function prevPortalNavAct(act: OnboardingActId, hasBusiness: boolean): OnboardingActId | null {
  const idx = PORTAL_NAV_ACTS.indexOf(act);
  if (idx <= 0) return null;
  const prev = PORTAL_NAV_ACTS[idx - 1]!;
  if (hasBusiness && prev === "a1_create_business") return null;
  return prev;
}

export function firstIncompleteActInChapter(
  chapterId: PortalChapterId,
  completedActs: OnboardingActId[],
): OnboardingActId {
  const chapter = PORTAL_ONBOARDING_CHAPTERS.find((c) => c.id === chapterId)!;
  const done = new Set(completedActs);
  for (const act of chapter.acts) {
    if (!done.has(act)) return resolvePortalCurrentAct(act);
  }
  const last = chapter.acts[chapter.acts.length - 1]!;
  return resolvePortalCurrentAct(last);
}

export function isPortalChapterComplete(
  chapterId: PortalChapterId,
  completedActs: OnboardingActId[],
): boolean {
  const chapter = PORTAL_ONBOARDING_CHAPTERS.find((c) => c.id === chapterId)!;
  const done = new Set(completedActs);
  return chapter.acts.every((a) => done.has(a));
}

export function portalVisibleStepInChapter(
  act: OnboardingActId,
): { label: string; index: number; total: number } | null {
  const chapter = portalChapterForAct(act);
  const visible = chapter.acts.filter((a) => !isPortalSkippedUiAct(a));
  const resolved = resolvePortalCurrentAct(act);
  const idx = visible.indexOf(resolved);
  if (idx < 0) return null;
  const labels: Partial<Record<OnboardingActId, string>> = {
    a1_create_business: "Open your shop",
    a2_shop_profile: "Shop profile",
    a5_hours: "Opening hours",
    a6_liv: "Meet Liv",
    a8_public_link: "Booking link",
    a12_go_live: "Final checks",
  };
  return {
    label: labels[resolved] ?? resolved,
    index: idx + 1,
    total: visible.length,
  };
}
