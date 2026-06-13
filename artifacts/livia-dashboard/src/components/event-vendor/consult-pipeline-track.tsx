import { cn } from "@/lib/utils";

type Step = { id: string; label: string; hint?: string };

type Props = {
  steps: readonly Step[];
  current: string;
  className?: string;
};

export function ConsultPipelineTrack({ steps, current, className }: Props) {
  const idx = steps.findIndex((s) => s.id === current);

  return (
    <div className={cn("w-full min-w-0", className)} data-testid="consult-pipeline-track">
      <ol
        className="grid w-full gap-1"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => {
          const done = idx > i;
          const active = step.id === current;
          return (
            <li key={step.id} className="flex flex-col items-center min-w-0 px-0.5">
              <div className="flex w-full items-center">
                {i > 0 ? (
                  <div
                    className={cn("h-px flex-1", done ? "bg-primary/40" : "bg-border")}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold uppercase tracking-wide",
                    active && "border-primary bg-primary text-primary-foreground",
                    done && !active && "border-primary/50 bg-primary/15 text-primary",
                    !done && !active && "border-border bg-muted/40 text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {i + 1}
                </span>
                {i < steps.length - 1 ? (
                  <div
                    className={cn("h-px flex-1", done ? "bg-primary/40" : "bg-border")}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 w-full text-center text-[10px] font-medium leading-tight truncate px-0.5",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
                title={step.label}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      {idx >= 0 && steps[idx]?.hint ? (
        <p className="mt-2 text-xs text-muted-foreground">{steps[idx].hint}</p>
      ) : null}
    </div>
  );
}
