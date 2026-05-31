import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function FounderChainBriefing({
  line,
  loading,
  shopsNeedingAttention,
}: {
  line?: string | null;
  loading?: boolean;
  shopsNeedingAttention?: number;
}) {
  if (loading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  const text =
    line?.trim() ||
    "Liv is watching every location — open a shop when something needs a human.";

  return (
    <section
      className={cn(
        "rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/80 to-violet-500/5",
        "p-5 flex flex-col sm:flex-row sm:items-center gap-4 platform-default-liv-glass",
      )}
      data-testid="founder-chain-briefing"
    >
      <div className="flex gap-3 min-w-0 flex-1">
        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
          {(shopsNeedingAttention ?? 0) > 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-medium">
              {shopsNeedingAttention} shop{shopsNeedingAttention === 1 ? "" : "s"} flagged below.
            </p>
          ) : null}
        </div>
      </div>
      <Button size="sm" variant="outline" className="shrink-0" asChild>
        <Link href="/inbox">Open inbox</Link>
      </Button>
    </section>
  );
}
