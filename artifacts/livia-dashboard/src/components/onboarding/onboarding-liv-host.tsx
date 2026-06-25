import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOTION } from "@/lib/motion";
import type { OnboardingActId } from "@/lib/onboarding-acts";
import { onboardingPortalChapterLabel } from "@/lib/onboarding-portal-copy";

type Props = {
  act: OnboardingActId;
  message: string;
};

export function OnboardingLivHost({ act, message }: Props) {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 700);
    return () => window.clearTimeout(t);
  }, [act, message]);

  return (
    <div
      key={act}
      className={cn("flex gap-4 items-start", MOTION.enterPanel)}
      data-testid="onboarding-liv-host"
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary",
          pulse && "animate-pulse",
        )}
      >
        <Sparkles className="h-5 w-5" aria-hidden />
      </div>
      <div className="space-y-1 pt-0.5 min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-aurum-champagne/90">
          {onboardingPortalChapterLabel(act)}
        </p>
        <p className="text-base md:text-lg leading-snug text-foreground font-serif">{message}</p>
      </div>
    </div>
  );
}
