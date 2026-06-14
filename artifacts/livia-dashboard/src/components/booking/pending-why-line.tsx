import { pendingApprovalGuidance, pendingReasonLabel } from "@/lib/booking-pending";
import { livPendingAutoConfirmBlocker } from "@workspace/policy";
import { cn } from "@/lib/utils";

type Props = {
  reason?: string | null;
  vertical?: string | null;
  category?: string | null;
  /** Show owner next-step guidance (Today / room board). */
  showGuidance?: boolean;
  /** Show why Liv did not auto-confirm (policy-driven). */
  showLivBlocker?: boolean;
  className?: string;
};

/** Why a session is PENDING — label + optional Liv/policy guidance. */
export function PendingWhyLine({
  reason,
  vertical,
  category,
  showGuidance = true,
  showLivBlocker = true,
  className,
}: Props) {
  const label = pendingReasonLabel(reason, vertical, category);
  const guidance = showGuidance
    ? pendingApprovalGuidance(reason, vertical, category)
    : null;
  const livBlocker = showLivBlocker
    ? livPendingAutoConfirmBlocker(reason, vertical, category)
    : null;

  return (
    <div className={cn("space-y-0.5 min-w-0", className)} data-testid="pending-why-line">
      <p className="text-[10px] font-medium leading-snug text-[hsl(var(--wellness-pending-fg,38_92%_35%))] dark:text-amber-300">
        {label}
      </p>
      {livBlocker ? (
        <p className="text-[10px] text-primary/90 leading-snug line-clamp-2">{livBlocker}</p>
      ) : null}
      {guidance ? (
        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{guidance}</p>
      ) : null}
    </div>
  );
}
