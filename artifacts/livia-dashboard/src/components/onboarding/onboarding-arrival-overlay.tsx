import { Button } from "@/components/ui/button";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { OnboardingPortalAmbient } from "@/components/onboarding/onboarding-portal-ambient";
import { OnboardingWelcomePanel } from "@/components/onboarding-welcome-panel";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const ONBOARDING_ARRIVAL_STORAGE_KEY = "livia.onboarding.portal.entered.v1";

type Props = {
  onEnter: () => void;
};

export function OnboardingArrivalOverlay({ onEnter }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground"
      data-testid="onboarding-arrival-overlay"
    >
      <OnboardingPortalAmbient />
      <div
        className={cn(
          "relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12",
          MOTION.enterPage,
        )}
      >
        <LiviaWordmark size="md" />
        <div className="max-w-md text-center space-y-2">
          <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-tight leading-[1.1]">
            Your day,
            <span className="block italic text-muted-foreground/90">already handled.</span>
          </h1>
          <p className="text-sm text-aurum-champagne/90 font-serif italic">Her name is Liv.</p>
        </div>
        <div className="w-full max-w-md">
          <OnboardingWelcomePanel compact />
        </div>
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <Button type="button" size="lg" className="w-full" onClick={onEnter}>
            Enter setup
          </Button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            onClick={onEnter}
          >
            Skip intro
          </button>
        </div>
      </div>
    </div>
  );
}
