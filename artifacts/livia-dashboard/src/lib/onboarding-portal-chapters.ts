import { ONBOARDING_ACT_IDS, type OnboardingActId } from "@/lib/onboarding-acts";
import {
  isPortalSkippedUiAct as policyIsPortalSkippedUiAct,
  isSwitchingMigration,
  resolvePortalNavActs,
  type OnboardingChecklist,
} from "@workspace/policy";

/** Three portal chapters — UI only; policy still stores A1–A12. */
export const PORTAL_CHAPTER_IDS = ["shop", "liv_link", "launch"] as const;
export type PortalChapterId = (typeof PORTAL_CHAPTER_IDS)[number];

export type PortalChapter = {
  id: PortalChapterId;
  title: string;
  subtitle: string;
  acts: readonly OnboardingActId[];
};

export const PORTAL_ONBOARDING_CHAPTERS: readonly PortalChapter[] = [
  {
    id: "shop",
    title: "Your shop",
    subtitle: "Name, profile, and hours",
    acts: ["a1_create_business", "a2_shop_profile", "a3_service_menu", "a4_team", "a11_migration", "a5_hours"],
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

/** Default nav for fresh shops — use `resolvePortalNavActs(checklist)` when checklist is known. */
export const PORTAL_NAV_ACTS: readonly OnboardingActId[] = [
  "a1_create_business",
  "a2_shop_profile",
  "a5_hours",
  "a6_liv",
  "a8_public_link",
  "a12_go_live",
] as const;

export { resolvePortalNavActs };

const PORTAL_AUTO_COMPLETE_AFTER: Partial<Record<OnboardingActId, readonly OnboardingActId[]>> = {
  a2_shop_profile: ["a3_service_menu", "a4_team"],
  a5_hours: ["a6_liv", "a7_channels", "a8_public_link", "a9_billing", "a10_invite_team"],
};

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

export function isPortalSkippedUiAct(
  act: OnboardingActId,
  checklist?: Partial<OnboardingChecklist> | null,
): boolean {
  return policyIsPortalSkippedUiAct(act, checklist);
}

export function resolvePortalCurrentAct(
  act: OnboardingActId,
  checklist?: Partial<OnboardingChecklist> | null,
): OnboardingActId {
  if (!isPortalSkippedUiAct(act, checklist)) return act;
  const nav = resolvePortalNavActs(checklist);
  const start = actIndex(act);
  for (const id of ONBOARDING_ACT_IDS) {
    if (actIndex(id) >= start && nav.includes(id)) return id;
  }
  return "a12_go_live";
}

export function portalAutoCompleteActs(
  leavingAct: OnboardingActId,
  checklist?: Partial<OnboardingChecklist> | null,
): OnboardingActId[] {
  const base = [...(PORTAL_AUTO_COMPLETE_AFTER[leavingAct] ?? [])];
  if (leavingAct === "a11_migration" && isSwitchingMigration(checklist)) {
    base.push("a2_shop_profile", "a3_service_menu", "a4_team");
  }
  if (leavingAct === "a5_hours" && !isSwitchingMigration(checklist)) {
    base.push("a11_migration");
  }
  if (leavingAct === "a8_public_link") {
    base.push("a9_billing", "a10_invite_team");
    if (!isSwitchingMigration(checklist)) base.push("a11_migration");
  }
  return base;
}

export function nextPortalNavAct(
  act: OnboardingActId,
  checklist?: Partial<OnboardingChecklist> | null,
): OnboardingActId | null {
  const nav = resolvePortalNavActs(checklist);
  const idx = nav.indexOf(act);
  if (idx < 0) {
    const orderIdx = actIndex(act);
    for (const step of nav) {
      if (actIndex(step) > orderIdx) return step;
    }
    return null;
  }
  return idx < nav.length - 1 ? nav[idx + 1]! : null;
}

export function prevPortalNavAct(
  act: OnboardingActId,
  hasBusiness: boolean,
  checklist?: Partial<OnboardingChecklist> | null,
): OnboardingActId | null {
  const nav = resolvePortalNavActs(checklist);
  const idx = nav.indexOf(act);
  if (idx <= 0) return null;
  const prev = nav[idx - 1]!;
  if (hasBusiness && prev === "a1_create_business") return null;
  return prev;
}

export function firstIncompleteActInChapter(
  chapterId: PortalChapterId,
  completedActs: OnboardingActId[],
  checklist?: Partial<OnboardingChecklist> | null,
): OnboardingActId {
  const chapter = PORTAL_ONBOARDING_CHAPTERS.find((c) => c.id === chapterId)!;
  const done = new Set(completedActs);
  for (const step of chapter.acts) {
    if (!done.has(step)) return resolvePortalCurrentAct(step, checklist);
  }
  const last = chapter.acts[chapter.acts.length - 1]!;
  return resolvePortalCurrentAct(last, checklist);
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
  checklist?: Partial<OnboardingChecklist> | null,
): { label: string; index: number; total: number } | null {
  const chapter = portalChapterForAct(act);
  const visible = chapter.acts.filter((a) => !isPortalSkippedUiAct(a, checklist));
  const resolved = resolvePortalCurrentAct(act, checklist);
  const idx = visible.indexOf(resolved);
  if (idx < 0) return null;
  const labels: Partial<Record<OnboardingActId, string>> = {
    a1_create_business: "Open your shop",
    a2_shop_profile: "Shop profile",
    a11_migration: "Bring your data",
    a5_hours: "Opening hours",
    a12_go_live: "You're in",
  };
  return {
    label: labels[resolved] ?? resolved,
    index: idx + 1,
    total: visible.length,
  };
}
