import { Sparkles } from "lucide-react";
import {
  resolveLivWaitlistNudgeCopy,
  shouldShowLivWaitlistNudge,
} from "@workspace/policy";
import { cn } from "@/lib/utils";

/** Subtle Liv nudge when the slot waitlist reaches threshold — no queue page. */
export function LivWaitlistNudge({
  activeCount,
  loading = false,
  className,
}: {
  activeCount: number;
  loading?: boolean;
  className?: string;
}) {
  const visible = loading || shouldShowLivWaitlistNudge(activeCount);
  if (!visible) return null;

  const copy = resolveLivWaitlistNudgeCopy(activeCount);

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/30 px-3 py-2 flex gap-2 items-start text-sm",
        className,
      )}
      data-testid="liv-waitlist-nudge"
    >
      <Sparkles className="h-3.5 w-3.5 text-violet-500/80 shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs text-foreground/90 leading-snug">
          <span className="font-medium">Liv</span>
          {loading ? " · …" : <> · {copy.line}</>}
        </p>
        {!loading ? (
          <p className="text-[11px] text-muted-foreground leading-snug">{copy.subline}</p>
        ) : null}
      </div>
    </div>
  );
}
