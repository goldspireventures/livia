import {
  PORTAL_ONBOARDING_CHAPTERS,
  type PortalChapterId,
  firstIncompleteActInChapter,
  isPortalChapterComplete,
  portalChapterForAct,
  portalChapterIndex,
} from "@/lib/onboarding-portal-chapters";
import type { OnboardingActId } from "@/lib/onboarding-acts";
import { cn } from "@/lib/utils";

type Props = {
  currentAct: OnboardingActId;
  completedActs: OnboardingActId[];
  onJumpChapter?: (chapterId: PortalChapterId, targetAct: OnboardingActId) => void;
};

export function OnboardingPortalChapterSpine({
  currentAct,
  completedActs,
  onJumpChapter,
}: Props) {
  const activeChapter = portalChapterForAct(currentAct);
  const activeIdx = portalChapterIndex(activeChapter.id);

  return (
    <div className="space-y-3" data-testid="onboarding-portal-chapter-spine">
      <p className="text-xs text-muted-foreground">
        Chapter {activeIdx + 1} of {PORTAL_ONBOARDING_CHAPTERS.length} · {activeChapter.title}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {PORTAL_ONBOARDING_CHAPTERS.map((chapter, i) => {
          const done = isPortalChapterComplete(chapter.id, completedActs);
          const active = chapter.id === activeChapter.id;
          const canJump =
            onJumpChapter && (done || i <= activeIdx);
          const targetAct = firstIncompleteActInChapter(chapter.id, completedActs);

          return (
            <button
              key={chapter.id}
              type="button"
              disabled={!canJump}
              title={chapter.subtitle}
              onClick={() => canJump && onJumpChapter?.(chapter.id, targetAct)}
              className={cn(
                "rounded-xl border text-left px-3 py-3 transition-all duration-300",
                active
                  ? "col-span-1 border-primary bg-primary/15 shadow-sm"
                  : done
                    ? "border-primary/30 bg-primary/8"
                    : "border-border/60 bg-muted/30",
                canJump && !active && "hover:border-primary/40 cursor-pointer",
                !canJump && "cursor-default opacity-70",
              )}
            >
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "block text-sm font-medium leading-tight mt-0.5",
                  active && "text-primary",
                )}
              >
                {chapter.title}
              </span>
              <span className="block text-[10px] text-muted-foreground mt-1 leading-snug">
                {chapter.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
