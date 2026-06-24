import { Link } from "wouter";
import { Sparkles, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  operatingPulsePanelCopy,
  type OperatingAttentionBucket,
  type OperatingPulseView,
} from "@workspace/policy";

function PulseStat({
  bucket,
  count,
  active,
  href,
}: {
  bucket: OperatingAttentionBucket;
  count: number;
  active?: boolean;
  href?: string;
}) {
  const copy = operatingPulsePanelCopy(bucket);
  const Icon =
    bucket === "needs_you" ? UserRound : bucket === "guest_action" ? Users : Sparkles;
  const body = (
    <>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {copy.label}
      </div>
      <p className="text-2xl font-semibold tabular-nums mt-0.5">{count}</p>
      <p className="text-[11px] text-muted-foreground leading-snug mt-1">{copy.description}</p>
    </>
  );
  if (href && count > 0) {
    return (
      <Link
        href={href}
        className={cn(
          "rounded-lg border px-3 py-2 min-w-0 flex-1 block hover:border-primary/50 transition-colors",
          active ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card/50",
        )}
      >
        {body}
      </Link>
    );
  }
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 min-w-0 flex-1",
        active ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card/50",
      )}
    >
      {body}
    </div>
  );
}

export function OwnerOperatingPulse({
  pulse,
  loading,
  className,
  showPrimaryAction = true,
}: {
  pulse?: OperatingPulseView | null;
  loading?: boolean;
  className?: string;
  showPrimaryAction?: boolean;
}) {
  if (loading) {
    return (
      <section
        className={cn("rounded-xl border border-border/80 bg-card p-4 animate-pulse h-28", className)}
        data-testid="owner-operating-pulse-loading"
      />
    );
  }
  if (!pulse) return null;

  const guestCount = pulse.guestAction;
  const needsCount = pulse.needsYou;
  const livCount = Math.max(0, pulse.livHandling);

  return (
    <section
      className={cn("rounded-xl border border-border/80 bg-card overflow-hidden", className)}
      data-testid="owner-operating-pulse"
    >
      <div className="px-4 py-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{pulse.headline}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{pulse.subline}</p>
        </div>
        {showPrimaryAction ? (
          <Button size="sm" variant="outline" asChild className="shrink-0">
            <Link href={pulse.primaryHref}>{pulse.primaryLabel}</Link>
          </Button>
        ) : null}
      </div>
      <div className="p-3 flex flex-col sm:flex-row gap-2">
        <PulseStat bucket="liv_handling" count={livCount} active={needsCount === 0} />
        <PulseStat
          bucket="guest_action"
          count={guestCount}
          href="/bookings?status=PENDING&lens=guest_action"
        />
        <PulseStat
          bucket="needs_you"
          count={needsCount}
          active={needsCount > 0}
          href="/bookings?status=PENDING&lens=needs_you"
        />
      </div>
    </section>
  );
}
