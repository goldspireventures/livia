import { useMemo } from "react";
import { useGetOwnerIntelligence } from "@workspace/api-client-react";
import { buildSettingsAttentionRows } from "@workspace/policy";
import { useBusiness } from "@/lib/business-context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { CommerceSettingsLink } from "@/components/billing/commerce-settings-link";
import { parseSettingsHref } from "@/lib/commerce-fix-navigation";

export function useSettingsAttentionRows() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const { data, isLoading } = useGetOwnerIntelligence(bid, {
    query: { enabled: !!bid, staleTime: 60_000 } as never,
  });
  const rows = useMemo(
    () =>
      buildSettingsAttentionRows(data ?? null).filter((r) => r.href.includes("/settings")),
    [data],
  );
  const tabsWithAttention = useMemo(() => {
    const tabs = new Set<string>();
    for (const row of rows) {
      const { tab } = parseSettingsHref(row.href);
      if (tab) tabs.add(tab);
    }
    return tabs;
  }, [rows]);
  return { rows, tabsWithAttention, isLoading, bid };
}

/** Matches Settings nav badge — shows every act/watch item with a fix link. */
export function SettingsAttentionStrip() {
  const { rows, isLoading, bid } = useSettingsAttentionRows();

  if (!bid) return null;
  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-lg" data-testid="settings-attention-skeleton" />;
  }
  if (rows.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-amber-500/40 bg-amber-500/8 p-4 space-y-3"
      data-testid="settings-attention-strip"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span>
          {rows.length} item{rows.length === 1 ? "" : "s"} need attention in Settings
        </span>
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-start justify-between gap-3 text-sm rounded-md border border-border/60 bg-background/60 px-3 py-2"
        >
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={row.severity === "act" ? "destructive" : "secondary"}>
                {row.severity}
              </Badge>
              <span className="font-medium">{row.title}</span>
            </div>
            <p className="text-muted-foreground text-xs leading-snug">{row.body}</p>
          </div>
          <CommerceSettingsLink href={row.href} label="Open" className="shrink-0" />
        </div>
      ))}
    </div>
  );
}
