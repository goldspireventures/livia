import { useCallback, useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wrench, RefreshCw } from "lucide-react";
import { livToolHintsForVertical } from "@/lib/vertical-features";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ToolRow = {
  toolId: string;
  profile: string;
  risk: string;
  description: string;
  catalogEnabled: boolean;
  effectiveEnabled: boolean;
  hasOverride: boolean;
};

export function LivToolCatalogControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const vertical = (business as { vertical?: string } | undefined)?.vertical;
  const recommended = livToolHintsForVertical(vertical, business?.category);
  const [profile, setProfile] = useState<"tenant_staff" | "tenant_public">("tenant_staff");
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ tools: ToolRow[] }>(
        `/api/businesses/${bid}/liv-tools?profile=${profile}`,
      );
      setTools(res.tools ?? []);
    } catch {
      setTools([]);
      toast({ title: "Could not load Liv tools", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [bid, profile, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(tool: ToolRow, enabled: boolean) {
    if (!bid) return;
    try {
      await apiFetch(`/businesses/${bid}/liv-tools/${tool.toolId}`, {
        method: "PATCH",
        body: JSON.stringify({ profile, enabled }),
      });
      await load();
      toast({
        title: enabled ? `${tool.toolId} enabled` : `${tool.toolId} disabled`,
        description: "Applies to this shop only.",
      });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  async function syncCatalog() {
    if (!bid) return;
    setSyncing(true);
    try {
      await apiFetch(`/businesses/${bid}/liv-tools/sync-catalog`, { method: "POST" });
      await load();
      toast({ title: "Tool catalog synced from registry" });
    } catch {
      toast({ title: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card data-testid="liv-tool-catalog-controls">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Liv tool catalog
        </CardTitle>
        <CardDescription>
          Enable or disable agent tools for this shop. Customer-facing vs staff-assist profiles are
          separate.
          {recommended.length > 0 ? (
            <span className="block mt-2 text-xs">
              Recommended for your vertical:{" "}
              {recommended.map((t) => (
                <Badge key={t} variant="outline" className="mr-1 mt-1 font-mono text-[10px]">
                  {t}
                </Badge>
              ))}
            </span>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            value={profile}
            onValueChange={(v) => setProfile(v as "tenant_staff" | "tenant_public")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tenant_staff">Staff & inbox</SelectItem>
              <SelectItem value="tenant_public">Customer channels</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            Reload
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void syncCatalog()} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? "animate-spin" : ""}`} />
            Sync registry
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading tools…</p>
        ) : (
          <ul className="space-y-3">
            {tools.map((t) => (
              <li
                key={`${t.toolId}-${t.profile}`}
                className="flex items-start justify-between gap-4 border rounded-lg px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm">{t.toolId}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {t.risk}
                    </Badge>
                    {t.hasOverride ? (
                      <Badge variant="secondary" className="text-[10px]">
                        custom
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                </div>
                <Switch
                  checked={t.effectiveEnabled}
                  onCheckedChange={(on) => void toggle(t, on)}
                  aria-label={`Toggle ${t.toolId}`}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
