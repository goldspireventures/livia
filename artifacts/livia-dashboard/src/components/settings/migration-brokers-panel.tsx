import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ChevronDown } from "lucide-react";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { navigateSettingsHref } from "@/lib/commerce-fix-navigation";
import {
  type BrokerStatus,
  type MigrationBrokerCategory,
  MIGRATION_BROKER_CATEGORY_LABELS,
  migrationBrokerMeta,
  migrationBrokerModeLabel,
  migrationBrokersForOwner,
} from "@/lib/migration-brokers-ui";

type Props = {
  brokers: BrokerStatus[];
};

function scrollToElement(elementId: string): void {
  const el = document.getElementById(elementId);
  if (!el) return;
  let node: HTMLElement | null = el;
  while (node) {
    if (node instanceof HTMLDetailsElement && !node.open) node.open = true;
    node = node.parentElement;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function BrokerRow({
  broker,
  onAction,
  oauthBusy,
}: {
  broker: BrokerStatus;
  onAction: (broker: BrokerStatus) => void;
  oauthBusy: string | null;
}) {
  const meta = migrationBrokerMeta(broker);
  const action = meta.action;

  return (
    <div className="rounded-lg border border-border/70 bg-muted/10 px-3 py-2.5 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{broker.label}</span>
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              {migrationBrokerModeLabel(broker.mode)}
            </Badge>
            {broker.connected ? (
              <Badge
                variant="outline"
                className="text-[10px] font-normal border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              >
                Ready on workspace
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{meta.ownerSummary}</p>
        </div>
        {action.type === "none" ? (
          <Button size="sm" variant="ghost" className="shrink-0 text-muted-foreground" disabled>
            {action.label}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={oauthBusy === broker.id}
            onClick={() => onAction(broker)}
          >
            {oauthBusy === broker.id ? "Connecting…" : action.label}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {action.type === "none" ? (
        <p className="text-[11px] text-muted-foreground/90 leading-relaxed">{action.hint}</p>
      ) : null}
    </div>
  );
}

export function MigrationBrokersPanel({ brokers }: Props) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { business } = useBusiness();
  const businessId = business?.id ?? "";
  const [showAll, setShowAll] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<string | null>(null);

  const ownerBrokers = useMemo(() => migrationBrokersForOwner(brokers), [brokers]);
  const connectedCount = brokers.filter((b) => b.connected).length;
  const visibleBrokers = showAll ? brokers : ownerBrokers;

  const grouped = useMemo(() => {
    const map = new Map<MigrationBrokerCategory, BrokerStatus[]>();
    for (const broker of visibleBrokers) {
      const category = migrationBrokerMeta(broker).category;
      const list = map.get(category) ?? [];
      list.push(broker);
      map.set(category, list);
    }
    return [...map.entries()];
  }, [visibleBrokers]);

  function onBrokerAction(broker: BrokerStatus): void {
    const action = migrationBrokerMeta(broker).action;
    if (action.type === "scroll") {
      scrollToElement(action.elementId);
      return;
    }
    if (action.type === "link") {
      navigateSettingsHref(action.href, navigate);
      return;
    }
    if (action.type === "oauth" && businessId) {
      void startOAuth(action.brokerId, action.label);
    }
  }

  async function startOAuth(brokerId: string, label: string) {
    setOauthBusy(brokerId);
    try {
      const res = await customFetch<{
        status: string;
        message: string;
        authorizeUrl?: string | null;
      }>(`/api/businesses/${businessId}/import/oauth/start`, {
        method: "POST",
        body: JSON.stringify({ brokerId }),
      });
      if (res.status === "redirect" && res.authorizeUrl) {
        window.location.href = res.authorizeUrl;
        return;
      }
      if (res.authorizeUrl) {
        window.location.href = res.authorizeUrl;
        return;
      }
      toast({
        title: label,
        description: res.message,
      });
    } catch {
      toast({ title: "Connect failed", description: "Try CSV import meanwhile.", variant: "destructive" });
    } finally {
      setOauthBusy(null);
    }
  }

  if (brokers.length === 0) {
    return (
      <SettingsDisclosure
        title="Switching from another tool?"
        description="Loading supported import paths…"
        defaultOpen={false}
      >
        <p className="text-sm text-muted-foreground">Loading…</p>
      </SettingsDisclosure>
    );
  }

  const summary =
    connectedCount > 0
      ? `${connectedCount} integration${connectedCount === 1 ? "" : "s"} connected · spreadsheet import ready`
      : "Spreadsheet import ready today · direct connect rolls out during beta";

  return (
    <SettingsDisclosure
      title="Switching from another tool?"
      description={summary}
      defaultOpen={false}
      data-testid="migration-brokers-panel"
    >
      <div className="space-y-4 pt-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Paste exports from your previous booking tool. Liv detects columns and imports clients,
          services, team, and upcoming appointments — then checks off setup steps automatically.
        </p>

        <div className="space-y-4">
          {grouped.map(([category, items]) => (
            <div key={category} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {MIGRATION_BROKER_CATEGORY_LABELS[category]}
              </p>
              <div className="grid gap-2">
                {items.map((broker) => (
                  <BrokerRow
                    key={broker.id}
                    broker={broker}
                    onAction={onBrokerAction}
                    oauthBusy={oauthBusy}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {brokers.length > ownerBrokers.length ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setShowAll((v) => !v)}
          >
            <ChevronDown className={cn("mr-1 h-4 w-4 transition-transform", showAll && "rotate-180")} />
            {showAll
              ? "Show only what you can use today"
              : `Show all supported tools (${brokers.length})`}
          </Button>
        ) : null}
      </div>
    </SettingsDisclosure>
  );
}
