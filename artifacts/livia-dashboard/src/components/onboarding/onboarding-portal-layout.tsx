import type { ReactNode } from "react";
import { LiviaLogoLink } from "@/components/brand/livia-logo-link";
import { OnboardingPortalStepSpine } from "@/components/onboarding/onboarding-portal-step-spine";
import { OnboardingLivHost } from "@/components/onboarding/onboarding-liv-host";
import { OnboardingPortalAmbient } from "@/components/onboarding/onboarding-portal-ambient";
import type { OnboardingActId } from "@/lib/onboarding-acts";
import type { OnboardingChecklist } from "@workspace/policy";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  livMessage: string;
  currentAct: OnboardingActId;
  completedActs: OnboardingActId[];
  checklist?: Partial<OnboardingChecklist> | null;
  chapterStepHint?: string | null;
  showProgressSpine?: boolean;
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
  checklist,
  chapterStepHint,
  showProgressSpine = false,
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
        <LiviaLogoLink size="md" home="marketing" />
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

        {showProgressSpine ? (
          <OnboardingPortalStepSpine
            currentAct={currentAct}
            completedActs={completedActs}
            checklist={checklist}
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
