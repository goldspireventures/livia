import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import type { OperatorExperiencePack, OperatorQuickAction } from "@workspace/policy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SoloOperatorCopilot({
  pack,
  className,
}: {
  pack: OperatorExperiencePack | null | undefined;
  className?: string;
}) {
  if (!pack?.soloMode || pack.showSoloCopilotCard === false) return null;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 via-card to-[hsl(var(--chart-1))]/6 p-4 motion-liv-pulse",
        className,
      )}
      data-testid="solo-operator-copilot"
    >
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl pointer-events-none" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden />
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-medium">
              {pack.segmentLabel ?? "Today"}
            </p>
          </div>
          <p className="text-sm font-medium leading-snug text-foreground">{pack.livPitch}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{pack.livSubline}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {pack.quickActions.slice(0, 4).map((action) => (
            <QuickChip key={action.id} action={action} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickChip({ action }: { action: OperatorQuickAction }) {
  return (
    <Link href={action.href}>
      <Button
        variant="secondary"
        size="sm"
        className="h-8 rounded-full text-xs font-medium border border-primary/20 bg-background/80 hover:bg-primary/10"
      >
        {action.label}
      </Button>
    </Link>
  );
}
