import type { QualityRegistryEntry } from "@workspace/policy";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  strong: "default",
  watch: "secondary",
  unknown: "outline",
};

export function QualityRegistryPanel({
  entries,
  className,
}: {
  entries?: QualityRegistryEntry[];
  className?: string;
}) {
  if (!entries?.length) return null;

  return (
    <div className={className} data-testid="quality-registry-panel">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
        <Activity className="h-3.5 w-3.5" />
        Quality signals
      </p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {entries.map((entry) => (
          <li
            key={entry.signalId}
            className="rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-medium">{entry.label}</span>
              <Badge variant={STATUS_VARIANT[entry.status] ?? "outline"} className="text-[10px]">
                {entry.status}
              </Badge>
            </div>
            <p className="text-lg font-semibold tabular-nums">
              {entry.value == null
                ? "—"
                : entry.unit === "percent"
                  ? `${entry.value}%`
                  : entry.value.toFixed(1)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
              {entry.benchmarkLabel}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
