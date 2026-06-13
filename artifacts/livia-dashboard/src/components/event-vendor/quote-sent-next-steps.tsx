import { quoteOperatorFlowPanelLabel, quoteOperatorFlowSteps } from "@workspace/policy";
import { useState } from "react";
import { CheckCircle2, Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  status: string;
  depositPaidMinor: number;
  depositAmountMinor: number;
  clientLink?: string | null;
  /** inline = icon only in headers; block = legacy (unused) */
  variant?: "inline" | "block";
};

function FlowStepsList({
  status,
  depositPaidMinor,
  depositAmountMinor,
}: Pick<Props, "status" | "depositPaidMinor" | "depositAmountMinor">) {
  const steps = quoteOperatorFlowSteps({ status, depositPaidMinor, depositAmountMinor });
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={step.id} className="flex gap-2 text-xs">
          <span className="shrink-0 tabular-nums text-muted-foreground w-4">{i + 1}.</span>
          <p
            className={
              step.state === "current"
                ? "font-medium text-foreground"
                : step.state === "done"
                  ? "text-muted-foreground line-through decoration-muted-foreground/50"
                  : "text-muted-foreground"
            }
          >
            {step.label}
          </p>
        </li>
      ))}
    </ol>
  );
}

function FlowStepsTrail({
  status,
  depositPaidMinor,
  depositAmountMinor,
}: Pick<Props, "status" | "depositPaidMinor" | "depositAmountMinor">) {
  const steps = quoteOperatorFlowSteps({ status, depositPaidMinor, depositAmountMinor });
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] leading-snug" role="list">
      {steps.map((step, i) => (
        <span key={step.id} className="inline-flex items-center gap-1" role="listitem">
          {i > 0 ? <span className="text-muted-foreground/40 px-0.5" aria-hidden>&gt;</span> : null}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1 py-0.5",
              step.state === "current" && "bg-primary/10 font-medium text-foreground",
              step.state === "done" && "text-muted-foreground",
              step.state === "upcoming" && "text-muted-foreground/70",
            )}
          >
            {step.state === "done" ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" aria-hidden />
            ) : (
              <span className="tabular-nums font-medium shrink-0">{i + 1}</span>
            )}
            <span className={step.state === "done" ? "line-through decoration-muted-foreground/40" : undefined}>
              {step.label}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}

/** Policy-driven quote flow — toggle panel under the info icon. */
export function QuoteSentNextSteps({
  status,
  depositPaidMinor,
  depositAmountMinor,
  clientLink,
  variant = "inline",
}: Props) {
  const [open, setOpen] = useState(false);

  if (status === "draft" || status === "declined") return null;

  if (variant === "block") {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 space-y-2" data-testid="quote-sent-next-steps">
        <FlowStepsList
          status={status}
          depositPaidMinor={depositPaidMinor}
          depositAmountMinor={depositAmountMinor}
        />
      </div>
    );
  }

  return (
    <div className="relative inline-flex shrink-0 self-start">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 text-muted-foreground hover:text-foreground",
          open && "bg-muted text-foreground",
        )}
        aria-expanded={open}
        aria-label={quoteOperatorFlowPanelLabel()}
        data-testid="quote-flow-info-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <Info className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-max max-w-[min(20rem,calc(100vw-2rem))] rounded-md border bg-popover p-2.5 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-1"
          data-testid="quote-flow-info-panel"
          role="region"
          aria-label={quoteOperatorFlowPanelLabel()}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            {quoteOperatorFlowPanelLabel()}
          </p>
          <FlowStepsTrail
            status={status}
            depositPaidMinor={depositPaidMinor}
            depositAmountMinor={depositAmountMinor}
          />
          {clientLink && status === "sent" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 w-full mt-2 text-xs"
              onClick={() => void navigator.clipboard.writeText(clientLink)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy client link
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
