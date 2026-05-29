import type { ReactNode } from "react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { OnboardingPortalChapterSpine } from "@/components/onboarding/onboarding-portal-chapter-spine";
import type { PortalChapterId } from "@/lib/onboarding-portal-chapters";
import { OnboardingLivHost } from "@/components/onboarding/onboarding-liv-host";
import { OnboardingPortalAmbient } from "@/components/onboarding/onboarding-portal-ambient";
import type { OnboardingActId } from "@/lib/onboarding-acts";
import { cn } from "@/lib/utils";
import { MOTION } from "@/lib/motion";

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  /** Liv's line for this chapter */
  livMessage: string;
  currentAct: OnboardingActId;
  completedActs: OnboardingActId[];
  onJumpChapter?: (chapterId: PortalChapterId, targetAct: OnboardingActId) => void;
  chapterStepHint?: string | null;
  showChapterSpine: boolean;
  packLabel?: string | null;
  topSlot?: ReactNode;
  wide?: boolean;
  celebrate?: boolean;
};

export function OnboardingPortalLayout({
  children,
  footer,
  livMessage,
  currentAct,
  completedActs,
  onJumpChapter,
  chapterStepHint,
  showChapterSpine,
  packLabel,
  topSlot,
  wide = false,
  celebrate = false,
}: Props) {
  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground"
      data-testid="onboarding-portal"
    >
      <OnboardingPortalAmbient />

      <header className="relative z-10 flex items-center justify-between gap-4 px-4 pt-6 md:px-8">
        <LiviaWordmark size="md" />
        {packLabel ? (
          <span className="text-xs text-muted-foreground border border-border/60 rounded-full px-3 py-1 bg-background/50 backdrop-blur-sm">
            {packLabel}
          </span>
        ) : null}
      </header>

      <div
        className={cn(
          "relative z-10 flex-1 flex flex-col gap-6 px-4 pb-10 md:px-8 mx-auto w-full",
          wide ? "max-w-5xl" : "max-w-3xl",
        )}
      >
        {topSlot}

        {showChapterSpine ? (
          <OnboardingPortalChapterSpine
            currentAct={currentAct}
            completedActs={completedActs}
            onJumpChapter={onJumpChapter}
          />
        ) : null}
        {chapterStepHint ? (
          <p className="text-xs text-muted-foreground -mt-2">{chapterStepHint}</p>
        ) : null}

        <div key={`host-${currentAct}`} className="onboarding-chapter-enter">
          <OnboardingLivHost act={currentAct} message={livMessage} />
        </div>

        <main
          key={currentAct}
          className={cn(
            "rounded-2xl border border-border/60 bg-background/75 backdrop-blur-md shadow-lg onboarding-chapter-enter",
            celebrate && "celebrate-shimmer",
          )}
        >
          <div className="p-5 md:p-8 space-y-6">{children}</div>
          {footer ? (
            <div className="border-t border-border/50 px-5 py-4 md:px-8 bg-muted/20 rounded-b-2xl">
              {footer}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
