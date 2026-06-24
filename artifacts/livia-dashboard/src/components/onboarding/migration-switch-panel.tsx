import { useMemo, useState, useEffect } from "react";
import { Sparkles, ChevronRight, Clock, Link2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMigrationSource,
  listMigrationSourcesForVertical,
  resolveMigrationLivWalkthrough,
  type MigrationSourceId,
} from "@workspace/policy";
import { MagicSetupPanel } from "@/components/settings/magic-setup-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";

type Props = {
  businessId: string;
  businessVertical?: string | null;
  migrationSource?: string | null;
  compact?: boolean;
  onSourceChange?: (sourceId: MigrationSourceId) => void;
  onImported?: (totalImported: number) => void;
  onSkip?: () => void;
};

export function MigrationSwitchPanel({
  businessId,
  businessVertical,
  migrationSource,
  compact = false,
  onSourceChange,
  onImported,
  onSkip,
}: Props) {
  const sources = useMemo(
    () => listMigrationSourcesForVertical(businessVertical),
    [businessVertical],
  );
  const [selected, setSelected] = useState<string>(
    migrationSource && sources.some((s) => s.id === migrationSource)
      ? migrationSource
      : sources[0]?.id ?? "spreadsheet",
  );
  const [guideOpen, setGuideOpen] = useState(true);
  const [oauthBusy, setOauthBusy] = useState<"connect" | "pull" | null>(null);
  const [oauthCaps, setOauthCaps] = useState<
    Array<{ brokerId: string; live: boolean; connected: boolean; incumbentIds: string[] }>
  >([]);
  const { toast } = useToast();

  const source = getMigrationSource(selected);
  const walkthrough = resolveMigrationLivWalkthrough(selected);
  const oauthBrokerId = source?.oauthBrokerId;
  const oauthCap = oauthCaps.find((c) => c.brokerId === oauthBrokerId);

  useEffect(() => {
    if (!businessId) return;
    void customFetch<
      Array<{ brokerId: string; live: boolean; connected: boolean; incumbentIds: string[] }>
    >(`/api/businesses/${businessId}/migration/oauth-capabilities`)
      .then(setOauthCaps)
      .catch(() => setOauthCaps([]));
  }, [businessId]);

  async function connectOAuth() {
    if (!oauthBrokerId || !businessId) return;
    setOauthBusy("connect");
    try {
      const res = await customFetch<{
        status: string;
        message: string;
        authorizeUrl?: string | null;
      }>(`/api/businesses/${businessId}/import/oauth/start`, {
        method: "POST",
        body: JSON.stringify({ brokerId: oauthBrokerId }),
      });
      if (res.authorizeUrl) {
        window.location.href = res.authorizeUrl;
        return;
      }
      toast({ title: source?.displayName ?? "Connect", description: res.message });
    } catch {
      toast({
        title: "Connect failed",
        description: "Use CSV import meanwhile.",
        variant: "destructive",
      });
    } finally {
      setOauthBusy(null);
    }
  }

  async function pullOAuth() {
    if (!businessId) return;
    setOauthBusy("pull");
    try {
      const res = await customFetch<{
        ok: boolean;
        message: string;
        totalImported: number;
      }>(`/api/businesses/${businessId}/import/oauth/pull`, {
        method: "POST",
        body: JSON.stringify({ incumbentId: selected, brokerId: oauthBrokerId }),
      });
      toast({
        title: res.ok ? "Import complete" : "Pull finished",
        description: res.message,
      });
      if (res.totalImported > 0) onImported?.(res.totalImported);
    } catch {
      toast({
        title: "Pull failed",
        description: "Try CSV import or reconnect.",
        variant: "destructive",
      });
    } finally {
      setOauthBusy(null);
    }
  }

  function pick(id: string) {
    setSelected(id);
    onSourceChange?.(id as MigrationSourceId);
    setGuideOpen(true);
  }

  return (
    <div className="space-y-5" data-testid="migration-switch-panel">
      <div className="space-y-2">
        <p className="text-sm font-medium">Where are you coming from?</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((s) => {
            const active = s.id === selected;
            return (
              <button
                key={s.id}
                type="button"
                data-testid={`migration-source-${s.id}`}
                onClick={() => pick(s.id)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/80 bg-card/60 hover:border-border",
                )}
              >
                <p className="text-sm font-medium leading-snug">{s.displayName}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {s.pickerSubtitle}
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                    <Clock className="h-3 w-3 mr-0.5" />
                    {s.selfServeMinutesEstimate.min}–{s.selfServeMinutesEstimate.max} min
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {source ? (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium text-foreground">Liv · {source.displayName}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{walkthrough.intro}</p>
            </div>
          </div>
          {guideOpen ? (
            <ol className="space-y-2 pl-1">
              {walkthrough.steps.map((step, i) => (
                <li key={`${step.entity ?? "step"}-${i}`} className="flex gap-2 text-xs">
                  <span className="font-mono text-[10px] text-muted-foreground w-4 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-muted-foreground leading-relaxed">{step.detail}</span>
                </li>
              ))}
            </ol>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setGuideOpen((v) => !v)}
          >
            {guideOpen ? "Hide steps" : "Show export steps"}
            <ChevronRight className={cn("h-3 w-3 ml-1 transition-transform", guideOpen && "rotate-90")} />
          </Button>
        </div>
      ) : null}

      {oauthBrokerId && oauthCap?.live ? (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">
            Live connect — Liv can pull your data directly
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {oauthCap.connected
              ? "Connected. Pull clients, services, and upcoming bookings into Livia."
              : "Connect once — then Liv imports from your previous tool automatically."}
          </p>
          <div className="flex flex-wrap gap-2">
            {!oauthCap.connected ? (
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-8 text-xs"
                disabled={oauthBusy !== null}
                onClick={() => void connectOAuth()}
              >
                <Link2 className="h-3.5 w-3.5 mr-1" />
                {oauthBusy === "connect" ? "Connecting…" : "Connect & authorize"}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-8 text-xs"
                disabled={oauthBusy !== null}
                onClick={() => void pullOAuth()}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                {oauthBusy === "pull" ? "Pulling…" : "Pull into Livia"}
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <MagicSetupPanel
        businessId={businessId}
        compact={compact}
        onImported={onImported}
      />

      {onSkip ? (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          onClick={onSkip}
        >
          Skip for now — I'll import later from Settings
        </button>
      ) : null}
    </div>
  );
}
