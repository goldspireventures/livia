import type { ConsultLeadActionId, ConsultLeadDecision } from "@workspace/policy";
import { Button } from "@/components/ui/button";
import { ArrowRight, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  decision: ConsultLeadDecision;
  busy?: boolean;
  onAction: (action: ConsultLeadActionId) => void;
  className?: string;
};

export function ConsultLeadDecisionPanel({ decision, busy, onAction, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/25 bg-gradient-to-b from-primary/8 to-transparent p-4 space-y-3",
        className,
      )}
      data-testid="consult-lead-decision"
    >
      <div>
        <p className="text-sm font-semibold">{decision.headline}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{decision.guidance}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          size="sm"
          className="sm:flex-1"
          disabled={busy}
          onClick={() => onAction(decision.primary.action)}
          data-testid="consult-lead-primary"
        >
          {decision.primary.label}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
        {decision.secondary ? (
          <Button
            type="button"
            size="sm"
            variant={decision.secondary.destructive ? "outline" : "secondary"}
            className={cn(
              "sm:flex-1",
              decision.secondary.destructive &&
                "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
            )}
            disabled={busy}
            onClick={() => onAction(decision.secondary!.action)}
            data-testid="consult-lead-secondary"
          >
            {decision.secondary.destructive ? (
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
            ) : null}
            {decision.secondary.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
