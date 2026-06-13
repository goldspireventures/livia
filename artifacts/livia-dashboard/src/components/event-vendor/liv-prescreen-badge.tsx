import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EnquiryPrescreenTier } from "@workspace/policy";

export type LivPrescreenView = {
  tier: EnquiryPrescreenTier;
  headline: string;
  guidance: string;
  reasons: string[];
  score?: number;
};

const TIER_STYLES: Record<EnquiryPrescreenTier, string> = {
  high: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  medium: "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  low: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
};

export function LivPrescreenBadge({ prescreen }: { prescreen: LivPrescreenView }) {
  return (
    <div
      className={cn("rounded-lg border p-3 space-y-1.5 text-sm", TIER_STYLES[prescreen.tier])}
      data-testid="liv-prescreen-badge"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          {prescreen.headline}
        </Badge>
        {prescreen.score != null ? (
          <span className="text-[10px] opacity-70">Score {prescreen.score}</span>
        ) : null}
      </div>
      <p className="text-sm leading-snug">{prescreen.guidance}</p>
      {prescreen.reasons[0] ? (
        <p className="text-xs opacity-80 leading-snug">{prescreen.reasons[0]}</p>
      ) : null}
    </div>
  );
}
