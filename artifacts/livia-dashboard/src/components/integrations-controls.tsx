import { useEffect, useState } from "react";
import { Trash2, FileUp } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { MigrationBrokersPanel } from "@/components/settings/migration-brokers-panel";
import { CompetitiveParityPanel } from "@/components/settings/competitive-parity-panel";
import { ParallelRunPanel } from "@/components/settings/parallel-run-panel";
import { CalendarSyncPanel } from "@/components/settings/calendar-sync-panel";
import { IntakeQueuePanel } from "@/components/settings/intake-queue-panel";
import { UniversalImportPanel } from "@/components/settings/universal-import-panel";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";
import type { BrokerStatus } from "@/lib/migration-brokers-ui";

type IntegrationsState = {
  webhookableEvents: string[];
  availableScopes: string[];
  webhooks: Array<{
    id: string;
    url: string;
    subscribedEvents: string[];
    enabled: boolean;
    description: string | null;
  }>;
  apiKeys: Array<{
    id: string;
    label: string;
    keyPrefix: string;
    scopes: string[];
    lastUsedAt: string | null;
  }>;
  recentDeliveries: Array<{
    id: string;
    eventName: string;
    status: string;
    attempts: number;
    lastError: string | null;
  }>;
};

export default function IntegrationsControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bid = business?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<IntegrationsState | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("https://");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["booking.confirmed"]);
  const [keyLabel, setKeyLabel] = useState("Zapier / ERP");
  const [keyScopes, setKeyScopes] = useState<string[]>(["bookings:read", "services:read"]);
  const [busy, setBusy] = useState(false);
  const [brokers, setBrokers] = useState<BrokerStatus[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get("oauth");
    if (oauth === "connected") {
      toast({ title: "Integration connected", description: "Your shop is linked — sync runs from Integrations." });
      params.delete("oauth");
      params.delete("broker");
      const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
      window.history.replaceState({}, "", next);
    } else if (oauth === "error" || oauth === "exchange_failed" || oauth === "invalid_state") {
      toast({
        title: "Connect incomplete",
        description: "Try again or use CSV import meanwhile.",
        variant: "destructive",
      });
      params.delete("oauth");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  async function load() {
    if (!bid) return;
    setLoading(true);
    try {
      const [integ, brokerList] = await Promise.all([
        customFetch<IntegrationsState>(`/api/businesses/${bid}/integrations`),
        customFetch<BrokerStatus[]>(`/api/businesses/${bid}/integration-brokers`).catch(() => []),
      ]);
      setState(integ);
      setBrokers(brokerList);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  function toggleEvent(ev: string) {
    setWebhookEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev],
    );
  }

  function toggleScope(scope: string) {
    setKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  async function createWebhook() {
    setBusy(true);
    try {
      const res = await customFetch<{ secret: string; message: string }>(
        `/api/businesses/${bid}/integrations/webhooks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: webhookUrl,
            subscribedEvents: webhookEvents,
          }),
        },
      );
      await navigator.clipboard.writeText(res.secret);
      toast({ title: "Webhook created", description: "Signing secret copied to clipboard." });
      await load();
    } catch {
      toast({ title: "Failed to create webhook", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function testWebhook(endpointId: string) {
    setBusy(true);
    try {
      const res = await customFetch<{ ok: boolean; statusCode?: number; error?: string }>(
        `/api/businesses/${bid}/integrations/webhooks/${endpointId}/test`,
        { method: "POST" },
      );
      toast({
        title: res.ok ? "Test delivered" : "Test failed",
        description: res.ok
          ? `HTTP ${res.statusCode ?? 200}`
          : (res.error ?? "Check URL and signing handler"),
        variant: res.ok ? "default" : "destructive",
      });
      await load();
    } catch {
      toast({ title: "Test ping failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function createApiKey() {
    setBusy(true);
    try {
      const res = await customFetch<{ rawKey: string; message: string }>(
        `/api/businesses/${bid}/integrations/api-keys`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: keyLabel, scopes: keyScopes }),
        },
      );
      await navigator.clipboard.writeText(res.rawKey);
      toast({ title: "API key created", description: "Key copied — store it securely." });
      await load();
    } catch {
      toast({ title: "Failed to create API key", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  if (!bid) return null;
  if (loading && !state) return <Skeleton className="h-64 w-full" />;

  const events = state?.webhookableEvents ?? [];
  const scopes = state?.availableScopes ?? [];
  const deliveryCount = state?.recentDeliveries.length ?? 0;

  return (
    <div className="space-y-4">
      <Card id="universal-import-panel" className="scroll-mt-24 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileUp className="h-4 w-4" />
            Import from your previous tool
          </CardTitle>
          <CardDescription>
            Paste CSV exports — clients, service menu, team, or upcoming appointments. Liv auto-detects
            columns and completes setup steps for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UniversalImportPanel businessId={bid} />
        </CardContent>
      </Card>

      <MigrationBrokersPanel brokers={brokers} />
      <IntakeQueuePanel businessId={bid} vertical={(business as { vertical?: string })?.vertical} />
      <CalendarSyncPanel
        businessId={bid}
        calendarConnected={brokers.some((b) => b.id === "calendar_google" && b.connected)}
      />
      <CompetitiveParityPanel businessId={bid} />
      <ParallelRunPanel businessId={bid} />

      <SettingsDisclosure
        title="Outbound webhooks"
        description="POST signed booking events to Zapier, your ERP, or a custom endpoint."
        defaultOpen={false}
      >
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label>Endpoint URL</Label>
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-3">
            {events.map((ev) => (
              <label key={ev} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={webhookEvents.includes(ev)}
                  onCheckedChange={() => toggleEvent(ev)}
                />
                {ev}
              </label>
            ))}
          </div>
          <Button disabled={busy} onClick={() => createWebhook()}>
            Add webhook
          </Button>

          {state?.webhooks.map((wh) => (
            <div
              key={wh.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium truncate max-w-md">{wh.url}</p>
                <p className="text-muted-foreground text-xs">
                  {wh.subscribedEvents.join(", ")} · {wh.enabled ? "enabled" : "disabled"}
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => testWebhook(wh.id)}>
                Test ping
              </Button>
            </div>
          ))}
        </div>
      </SettingsDisclosure>

      <SettingsDisclosure
        title="API keys"
        description="Scoped read keys for partner tools and data warehouse exports."
        defaultOpen={false}
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-muted-foreground">
            Use header <code className="text-[11px]">X-Partner-Api-Key</code> on{" "}
            <code className="text-[11px]">/api/partner/v1/...</code>
          </p>
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-3">
            {scopes.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={keyScopes.includes(s)}
                  onCheckedChange={() => toggleScope(s)}
                />
                {s}
              </label>
            ))}
          </div>
          <Button disabled={busy} onClick={() => createApiKey()}>
            Create API key
          </Button>

          {state?.apiKeys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{k.label}</p>
                <p className="text-muted-foreground text-xs">
                  {k.keyPrefix}… · {k.scopes.join(", ")}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Revoke API key ${k.label}`}
                disabled={busy}
                onClick={async () => {
                  await customFetch(`/api/businesses/${bid}/integrations/api-keys/${k.id}`, {
                    method: "DELETE",
                  });
                  await load();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </SettingsDisclosure>

      <SettingsDisclosure
        title="Recent webhook deliveries"
        description={
          deliveryCount > 0
            ? `${deliveryCount} recent deliver${deliveryCount === 1 ? "y" : "ies"} — troubleshooting only.`
            : "No deliveries yet."
        }
        defaultOpen={false}
      >
        <div className="space-y-2 text-sm pt-1">
          {(state?.recentDeliveries ?? []).length === 0 ? (
            <p className="text-muted-foreground">No deliveries yet.</p>
          ) : (
            state?.recentDeliveries.map((d) => (
              <div key={d.id} className="flex justify-between border-b py-2 last:border-0 gap-3">
                <span>
                  {d.eventName} · {d.status}
                </span>
                <span className="text-muted-foreground text-right">
                  {d.attempts} attempt{d.attempts === 1 ? "" : "s"}
                  {d.lastError ? ` — ${d.lastError}` : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </SettingsDisclosure>
    </div>
  );
}
