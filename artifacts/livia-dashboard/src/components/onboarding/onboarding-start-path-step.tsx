import { useState } from "react";
import { ArrowRight, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingPortalLayout } from "@/components/onboarding/onboarding-portal-layout";
import {
  MIGRATION_INTENT_OPTIONS,
  portalFastTrackStepCount,
  startPathLivLine,
  type MigrationIntent,
} from "@workspace/policy";
import { cn } from "@/lib/utils";

const INTENT_ICONS = {
  fresh: Sparkles,
  switching: Upload,
} as const;

type Props = {
  onContinue: (intent: MigrationIntent) => void;
};

export function OnboardingStartPathStep({ onContinue }: Props) {
  const [intent, setIntent] = useState<MigrationIntent>("fresh");

  const LivLine = startPathLivLine(intent);
  const stepCount = portalFastTrackStepCount(intent);

  return (
    <OnboardingPortalLayout
      livMessage={LivLine}
      currentAct="a1_create_business"
      completedActs={[]}
      showProgressSpine={false}
      chapterStepHint={`About ${stepCount} steps · a few minutes`}
      footer={
        <Button type="button" className="w-full" onClick={() => onContinue(intent)}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-5" data-testid="onboarding-start-path">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl tracking-tight">How are you starting?</h2>
          <p className="text-sm text-muted-foreground">
            We only ask for what we need now. Liv handles the rest after you are in.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {MIGRATION_INTENT_OPTIONS.map((opt) => {
            const active = intent === opt.id;
            const Icon = INTENT_ICONS[opt.id as "fresh" | "switching"];
            const stepCount = portalFastTrackStepCount(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={`migration-intent-${opt.id}`}
                onClick={() => setIntent(opt.id)}
                className={cn(
                  "group rounded-xl border px-4 py-4 text-left transition-all",
                  "hover:border-primary/40 hover:bg-primary/[0.03]",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary/25 shadow-sm"
                    : "border-border/70 bg-background/40",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                      active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/60 bg-muted/30 text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="space-y-1">
                    <span className="block text-sm font-medium">{opt.title}</span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      {opt.subtitle}
                    </span>
                    <span className="block text-[11px] text-muted-foreground/80 mt-1">
                      {stepCount} steps
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingPortalLayout>
  );
}
