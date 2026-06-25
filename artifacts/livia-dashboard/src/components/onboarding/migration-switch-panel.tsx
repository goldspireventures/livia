import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Link2, Loader2, Search, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listFeaturedMigrationSources,
  migrationIngestCapabilityLine,
  searchMigrationSources,
  type MigrationAutomationTruth,
  type MigrationConnectionFieldId,
  type MigrationIngestProfile,
  type MigrationSourceId,
} from "@workspace/policy";
import { MigrationFileImportPanel } from "@/components/onboarding/migration-file-import-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";

type RuntimeProfile = {
  profile: MigrationIngestProfile;
  automation: MigrationAutomationTruth | null;
  oauth: {
    brokerId: string;
    live: boolean;
    connected: boolean;
  } | null;
  partner: {
    brokerId: string;
    live: boolean;
  } | null;
};

type Props = {
  businessId: string;
  businessVertical?: string | null;
  migrationSource?: string | null;
  migrationBookingUrl?: string | null;
  migrationExternalId?: string | null;
  onSourceChange?: (sourceId: MigrationSourceId) => void;
  onConnectionChange?: (fields: {
    migrationBookingUrl?: string;
    migrationExternalId?: string;
  }) => void;
  onImported?: (totalImported: number) => void;
  onSkip?: () => void;
};

export function MigrationSwitchPanel({
  businessId,
  businessVertical,
  migrationSource,
  migrationBookingUrl,
  migrationExternalId,
  onSourceChange,
  onConnectionChange,
  onImported,
  onSkip,
}: Props) {
  const featured = useMemo(
    () => listFeaturedMigrationSources(businessVertical, 5),
    [businessVertical],
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>(
    migrationSource ?? featured[0]?.id ?? "fresha",
  );
  const [runtime, setRuntime] = useState<RuntimeProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [connectionDraft, setConnectionDraft] = useState<Record<MigrationConnectionFieldId, string>>({
    booking_url: migrationBookingUrl ?? "",
    business_slug: "",
    salon_id: migrationExternalId ?? "",
    account_email: "",
  });
  const [fileOpen, setFileOpen] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [jobPolling, setJobPolling] = useState(false);
  const { toast } = useToast();

  const searchHits = useMemo(
    () => (query.trim() ? searchMigrationSources(query, businessVertical) : []),
    [query, businessVertical],
  );

  useEffect(() => {
    if (!businessId || !selected) return;
    setLoadingProfile(true);
    void customFetch<RuntimeProfile>(
      `/api/businesses/${businessId}/migration/source/${selected}/profile`,
    )
      .then(setRuntime)
      .catch(() => setRuntime(null))
      .finally(() => setLoadingProfile(false));
  }, [businessId, selected]);

  const automation = runtime?.automation;
  const profile = runtime?.profile;
  const oauth = runtime?.oauth;
  const partner = runtime?.partner;

  async function pollImportJob(jobId: string): Promise<number> {
    setJobPolling(true);
    try {
      for (let i = 0; i < 60; i++) {
        const job = await customFetch<{
          status: string;
          totalImported: number;
          message: string;
        }>(`/api/businesses/${businessId}/migration/jobs/${jobId}`);
        if (job.status === "succeeded" || job.status === "partial") {
          return job.totalImported;
        }
        if (job.status === "failed") {
          throw new Error(job.message);
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      throw new Error("Import timed out — check Settings later.");
    } finally {
      setJobPolling(false);
    }
  }

  async function runUnifiedIngest(body: Record<string, unknown>) {
    const res = await customFetch<{
      jobId: string;
      async: boolean;
      status: string;
      message: string;
      totalImported?: number;
    }>(`/api/businesses/${businessId}/migration/ingest`, {
      method: "POST",
      body: JSON.stringify({ sourceId: selected, ...body }),
    });
    if (res.async) {
      toast({ title: "Import queued", description: res.message });
      const imported = await pollImportJob(res.jobId);
      return imported;
    }
    return res.totalImported ?? 0;
  }

  function pick(id: string) {
    setSelected(id);
    setQuery("");
    onSourceChange?.(id as MigrationSourceId);
  }

  async function saveConnection(field: MigrationConnectionFieldId, value: string) {
    setConnectionDraft((d) => ({ ...d, [field]: value }));
    const payload: {
      migrationSource: string;
      migrationBookingUrl?: string;
      migrationExternalId?: string;
    } = { migrationSource: selected };
    if (field === "booking_url") payload.migrationBookingUrl = value || undefined;
    if (field === "salon_id") payload.migrationExternalId = value || undefined;
    onConnectionChange?.({
      migrationBookingUrl: payload.migrationBookingUrl,
      migrationExternalId: payload.migrationExternalId,
    });
    try {
      const res = await customFetch<{ ok: boolean; message: string }>(
        `/api/businesses/${businessId}/migration/connection`,
        { method: "POST", body: JSON.stringify(payload) },
      );
      if (res.message) toast({ title: "Saved", description: res.message });
    } catch {
      /* checklist still updated locally */
    }
  }

  async function connectAndImport() {
    if (automation?.tier === "partner_live" && partner?.live) {
      setOauthBusy(true);
      try {
        const imported = await runUnifiedIngest({
          mode: "partner_pull",
          brokerId: partner.brokerId,
          incumbentId: selected,
          externalId: connectionDraft.salon_id || migrationExternalId || undefined,
        });
        toast({
          title: imported > 0 ? "Import complete" : "Import finished",
          description:
            imported > 0
              ? `Imported ${imported} record(s) from partner API.`
              : "No rows imported — check your identifier or upload files.",
        });
        if (imported > 0) onImported?.(imported);
      } catch {
        toast({
          title: "Partner import failed",
          description: "Try file upload below.",
          variant: "destructive",
        });
      } finally {
        setOauthBusy(false);
      }
      return;
    }

    if (!oauth?.brokerId) return;
    setOauthBusy(true);
    try {
      if (!oauth.connected) {
        const res = await customFetch<{
          status: string;
          authorizeUrl?: string | null;
          message: string;
        }>(`/api/businesses/${businessId}/import/oauth/start`, {
          method: "POST",
          body: JSON.stringify({ brokerId: oauth.brokerId }),
        });
        if (res.authorizeUrl) {
          window.location.href = res.authorizeUrl;
          return;
        }
        toast({ title: "Connect", description: res.message });
        return;
      }
      const pull = await customFetch<{
        ok: boolean;
        message: string;
        totalImported: number;
      }>(`/api/businesses/${businessId}/import/oauth/pull`, {
        method: "POST",
        body: JSON.stringify({ incumbentId: selected, brokerId: oauth.brokerId }),
      });
      toast({ title: pull.ok ? "Import complete" : "Import finished", description: pull.message });
      if (pull.totalImported > 0) onImported?.(pull.totalImported);
    } catch {
      toast({
        title: "Import failed",
        description: "Try file upload below.",
        variant: "destructive",
      });
    } finally {
      setOauthBusy(false);
    }
  }

  const showFileSection =
    automation?.showFileUpload !== false &&
    (automation?.tier !== "oauth_live" || fileOpen);

  return (
    <div className="space-y-5" data-testid="migration-switch-panel">
      <div className="space-y-2">
        <Label htmlFor="migration-search" className="text-sm font-medium">
          Where are you coming from?
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="migration-search"
            data-testid="migration-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search other tools…"
            className="pl-9"
          />
        </div>
        {searchHits.length > 0 ? (
          <ul className="rounded-lg border border-border/70 bg-card/80 divide-y divide-border/50 max-h-48 overflow-y-auto">
            {searchHits.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/40"
                  onClick={() => pick(s.id)}
                >
                  {s.displayName}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {featured.map((s) => {
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
                  {migrationIngestCapabilityLine(s.id)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {loadingProfile ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking what we can import…
        </div>
      ) : null}

      {profile && automation ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{profile.displayName}</p>
                <Badge variant="outline" className="text-[10px]">
                  {automation.statusLine}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.entities.map((e) => {
                  if (e.unavailable) {
                    return (
                      <Badge key={e.kind} variant="outline" className="text-[10px] opacity-60">
                        {e.label}: not in export
                      </Badge>
                    );
                  }
                  if (
                    (automation.tier === "oauth_live" || automation.tier === "partner_live") &&
                    e.automated
                  ) {
                    return (
                      <Badge key={e.kind} variant="default" className="text-[10px]">
                        <Zap className="h-3 w-3 mr-0.5" />
                        {e.label}
                      </Badge>
                    );
                  }
                  if (e.file) {
                    return (
                      <Badge key={e.kind} variant="secondary" className="text-[10px]">
                        {e.label}: file
                      </Badge>
                    );
                  }
                  return (
                    <Badge key={e.kind} variant="outline" className="text-[10px]">
                      {e.label}: in-app
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground"
            data-testid="migration-honest-limit"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{automation.honestLimit}</span>
          </div>

          {(automation.showConnectButton && oauth?.live) ||
          (automation.tier === "partner_live" && partner?.live) ? (
            <Button
              type="button"
              className="w-full"
              disabled={oauthBusy || jobPolling}
              onClick={() => void connectAndImport()}
            >
              {oauthBusy || jobPolling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Working…
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  {automation.primaryCta}
                </>
              )}
            </Button>
          ) : null}

          {connectionDraft.booking_url?.trim() ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={oauthBusy || jobPolling}
              onClick={() => {
                void (async () => {
                  setOauthBusy(true);
                  try {
                    const imported = await runUnifiedIngest({
                      mode: "booking_url_mirror",
                      bookingUrl: connectionDraft.booking_url,
                    });
                    toast({
                      title: imported > 0 ? "Menu mirrored" : "Mirror finished",
                      description:
                        imported > 0
                          ? `Imported ${imported} service name(s) from booking page.`
                          : "No services detected — upload an export or set menu in Livia.",
                    });
                    if (imported > 0) onImported?.(imported);
                  } catch {
                    toast({
                      title: "Mirror failed",
                      description: "Upload a service export instead.",
                      variant: "destructive",
                    });
                  } finally {
                    setOauthBusy(false);
                  }
                })();
              }}
            >
              Mirror menu from booking link
            </Button>
          ) : null}

          {profile.connectionFields.length > 0 ? (
            <div className="space-y-3">
              {profile.connectionFields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={field.id} className="text-xs">
                    {field.label}
                  </Label>
                  <Input
                    id={field.id}
                    value={connectionDraft[field.id]}
                    onChange={(e) => setConnectionDraft((d) => ({ ...d, [field.id]: e.target.value }))}
                    onBlur={(e) => void saveConnection(field.id, e.target.value)}
                    placeholder={field.placeholder}
                  />
                  <p className="text-[11px] text-muted-foreground">{field.help}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {automation?.showFileUpload ? (
        <div className="space-y-2">
          {automation.tier === "oauth_live" ? (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              onClick={() => setFileOpen((v) => !v)}
            >
              {fileOpen ? "Hide file upload" : "Or upload export files instead"}
            </button>
          ) : (
            <p className="text-xs font-medium text-foreground">Upload exports</p>
          )}
          {showFileSection ? (
            <MigrationFileImportPanel businessId={businessId} onImported={onImported} />
          ) : null}
        </div>
      ) : null}

      {onSkip ? (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          onClick={onSkip}
        >
          Skip for now — finish in Settings
        </button>
      ) : null}
    </div>
  );
}
