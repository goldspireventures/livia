import { ONBOARDING_ACT_IDS, ONBOARDING_ACT_LABELS, type OnboardingActId } from "@/lib/onboarding-acts";
import { cn } from "@/lib/utils";

type Props = {
  currentAct: OnboardingActId;
  completedActs: OnboardingActId[];
  onJump?: (act: OnboardingActId) => void;
};

export function OnboardingChapterSpine({ currentAct, completedActs, onJump }: Props) {
  const currentIdx = ONBOARDING_ACT_IDS.indexOf(currentAct);

  return (
    <div className="space-y-2" data-testid="onboarding-chapter-spine">
      <p className="text-xs text-muted-foreground">
        Chapter {Math.max(1, currentIdx + 1)} of {ONBOARDING_ACT_IDS.length}
      </p>
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {ONBOARDING_ACT_IDS.map((act, i) => {
          const done = completedActs.includes(act);
          const active = act === currentAct;
          const canJump = onJump && (done || i <= currentIdx);
          return (
            <button
              key={act}
              type="button"
              disabled={!canJump}
              title={ONBOARDING_ACT_LABELS[act]}
              onClick={() => canJump && onJump(act)}
              className={cn(
                "flex-shrink-0 rounded-md border transition-all duration-300 min-w-[2.25rem] px-1",
                active
                  ? "h-12 border-primary bg-primary/15 text-primary font-semibold"
                  : done
                    ? "h-7 border-primary/30 bg-primary/10 text-foreground"
                    : "h-5 border-transparent bg-muted text-muted-foreground",
                canJump && !active && "hover:border-primary/40 cursor-pointer",
                !canJump && "cursor-default opacity-60",
              )}
            >
              <span className="text-[10px] leading-none block py-1">{`A${i + 1}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
