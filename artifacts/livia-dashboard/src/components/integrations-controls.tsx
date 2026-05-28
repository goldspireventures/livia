import { useEffect, useState } from "react";
import { Plug, Webhook, Key, Trash2 } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";

function brokerStatusLabel(b: BrokerStatus): string {
  if (b.mode === "csv_only") {
    return b.connected ? "CSV export ready" : "CSV export only — no live OAuth";
  }
  if (b.mode === "oauth_stub") {
    return b.connected ? "OAuth configured — sync job pending" : "Not connected";
  }
  return b.connected ? "API key configured" : "Not connected";
}

type BrokerStatus = {
  id: string;
  label: string;
  mode: string;
  connected: boolean;
  note: string;
};

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
  const [booksyCsv, setBooksyCsv] = useState("");
  const [booksyResult, setBooksyResult] = useState<{
    imported: number;
    skipped: number;
    errors?: string[];
  } | null>(null);

  async function importBooksy() {
    if (!bid || !booksyCsv.trim()) return;
    setBusy(true);
    try {
      const res = await customFetch<{ imported: number; skipped: number; errors?: string[] }>(
        `/api/businesses/${bid}/import/booksy-csv`,
        { method: "POST", body: JSON.stringify({ csv: booksyCsv }) },
      );
      setBooksyResult(res);
      toast({ title: `Imported ${res.imported} clients` });
      invalidateOperationalState(qc, bid);
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4" />
            Outbound webhooks
          </CardTitle>
          <CardDescription>
            Livia POSTs signed events to your URL (HMAC-SHA256, header{" "}
            <code className="text-xs">X-Livia-Signature</code>). At-least-once delivery with retries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => testWebhook(wh.id)}>
                  Test ping
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            API keys (Partner plane)
          </CardTitle>
          <CardDescription>
            Scoped read keys for ERP, data warehouse, or migration tools. Use header{" "}
            <code className="text-xs">X-Partner-Api-Key</code> on{" "}
            <code className="text-xs">/api/partner/v1/...</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Migration brokers</CardTitle>
          <CardDescription>Fresha, Square, Google Calendar, and accounting exports (v1.5 scaffolds).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {brokers.length === 0 ? (
            <p className="text-muted-foreground">Loading broker status…</p>
          ) : (
            brokers.map((b) => (
              <div key={b.id} className="flex justify-between border-b py-2 last:border-0 gap-4">
                <span className="font-medium">{b.label}</span>
                <span className="text-muted-foreground text-right">
                  {brokerStatusLabel(b)} — {b.note}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booksy CSV import</CardTitle>
          <CardDescription>
            Paste a CSV with columns: firstName, lastName, email, phone. Clients are created in your roster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="w-full min-h-[120px] rounded-md border bg-muted/30 p-3 text-sm font-mono"
            placeholder="firstName,lastName,email,phone&#10;Jane,Doe,jane@example.com,+353..."
            value={booksyCsv}
            onChange={(e) => setBooksyCsv(e.target.value)}
          />
          <Button disabled={busy || !booksyCsv.trim()} onClick={() => void importBooksy()}>
            Import clients
          </Button>
          {booksyResult ? (
            <p className="text-sm text-muted-foreground">
              Imported {booksyResult.imported}, skipped {booksyResult.skipped}
              {booksyResult.errors?.length ? ` — ${booksyResult.errors.join("; ")}` : ""}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4" />
            Recent deliveries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(state?.recentDeliveries ?? []).length === 0 ? (
            <p className="text-muted-foreground">No deliveries yet.</p>
          ) : (
            state?.recentDeliveries.map((d) => (
              <div key={d.id} className="flex justify-between border-b py-2 last:border-0">
                <span>
                  {d.eventName} · {d.status}
                </span>
                <span className="text-muted-foreground">
                  {d.attempts} attempt{d.attempts === 1 ? "" : "s"}
                  {d.lastError ? ` — ${d.lastError}` : ""}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
