import { useGetCustomerRelationship } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STAGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  trusted: "default",
  active: "default",
  new: "secondary",
  prospect: "outline",
  at_risk: "destructive",
  lapsed: "destructive",
};

type Props = {
  businessId: string;
  customerId: string;
  /** Tighter single-line layout for thread header. */
  compact?: boolean;
  className?: string;
};

export function InboxRelationshipChip({ businessId, customerId, compact, className }: Props) {
  const { data, isLoading } = useGetCustomerRelationship(businessId, customerId, {
    query: { enabled: !!businessId && !!customerId } as never,
  });

  if (isLoading) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)} data-testid="inbox-relationship-chip">
        Loading relationship…
      </p>
    );
  }

  if (!data) return null;

  const rel = data as {
    stage?: string;
    stageLabel?: string;
    headline?: string;
    nextBookingAt?: string | null;
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        compact ? "text-xs" : "text-sm",
        className,
      )}
      data-testid="inbox-relationship-chip"
    >
      {rel.stageLabel ? (
        <Badge variant={STAGE_VARIANT[rel.stage ?? ""] ?? "outline"} className="text-[10px] shrink-0">
          {rel.stageLabel}
        </Badge>
      ) : null}
      {rel.headline ? (
        <span className="text-muted-foreground truncate min-w-0">{rel.headline}</span>
      ) : null}
      {!compact && rel.nextBookingAt ? (
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          Next · {new Date(rel.nextBookingAt).toLocaleDateString([], { month: "short", day: "numeric" })}
        </span>
      ) : null}
    </div>
  );
}
