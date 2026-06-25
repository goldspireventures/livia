import type { OnboardingActId } from "@/lib/onboarding-acts";
import { portalNavStepLabels } from "@workspace/policy";
import type { OnboardingChecklist } from "@workspace/policy";
import { cn } from "@/lib/utils";

type Props = {
  currentAct: OnboardingActId;
  completedActs: OnboardingActId[];
  checklist?: Partial<OnboardingChecklist> | null;
};

export function OnboardingPortalStepSpine({ currentAct, completedActs, checklist }: Props) {
  const steps = portalNavStepLabels(checklist);
  const done = new Set(completedActs);
  const currentIndex = steps.findIndex((s) => s.act === currentAct);

  return (
    <div className="space-y-2" data-testid="onboarding-portal-step-spine">
      <p className="text-xs text-muted-foreground">
        {checklist?.migrationIntent === "switching" ? "Import path" : "Fresh start"}
        {" · "}
        {steps.length} steps
      </p>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => {
          const complete = done.has(step.act);
          const active = step.act === currentAct;
          return (
            <div
              key={step.act}
              className={cn(
                "rounded-lg border px-2 py-2 text-center transition-colors",
                active
                  ? "border-primary bg-primary/10"
                  : complete
                    ? "border-primary/25 bg-primary/5"
                    : "border-border/60 bg-muted/20",
              )}
            >
              <span
                className={cn(
                  "block text-[10px] font-medium uppercase tracking-wide",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className={cn("block text-[11px] leading-tight mt-0.5", active && "font-medium")}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {currentIndex >= 0 ? (
        <p className="text-xs text-muted-foreground">
          Step {currentIndex + 1} of {steps.length}: {steps[currentIndex]!.label}
        </p>
      ) : null}
    </div>
  );
}
