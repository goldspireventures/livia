import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/api-fetch";
import { useBusiness } from "@/lib/business-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  parseOperationalPolicy,
  parseGuestCareAutomation,
  resolveGuestCareAutomation,
  AFTERCARE_MODE_OWNER_COPY,
  OWNER_LIV_TAGLINE,
  type GuestCareAutomation,
  type BusinessVertical,
} from "@workspace/policy";

export function GuestCarePolicyControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const businessId = business?.id ?? "";
  const vertical = ((business as { vertical?: string } | null)?.vertical ?? "beauty") as BusinessVertical;
  const [saving, setSaving] = useState(false);
  const [care, setCare] = useState<GuestCareAutomation>(() =>
    resolveGuestCareAutomation({ vertical, operationalPolicy: {} }),
  );

  useEffect(() => {
    if (!businessId) return;
    void apiFetch<{ operationalPolicy?: unknown }>(`/businesses/${businessId}`).then((b) => {
      setCare(
        resolveGuestCareAutomation({
          vertical,
          operationalPolicy: parseOperationalPolicy(b.operationalPolicy),
        }),
      );
    });
  }, [businessId, vertical]);

  async function save() {
    if (!businessId) return;
    setSaving(true);
    try {
      await apiFetch(`/businesses/${businessId}/operational-policy`, {
        method: "PATCH",
        body: JSON.stringify({
          guestCare: care,
        }),
      });
      toast({ title: "Guest care settings saved" });
    } catch {
      toast({ title: "Could not save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const modeCopy = AFTERCARE_MODE_OWNER_COPY[care.aftercareMode];

  return (
    <Card data-testid="guest-care-policy-card">
      <CardHeader>
        <CardTitle className="text-base">Aftercare & follow-up</CardTitle>
        <CardDescription>{OWNER_LIV_TAGLINE}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
          <span className="font-medium text-foreground">You configure:</span> on/off, auto-send vs
          draft, timing, retail mention gate.{" "}
          <span className="font-medium text-foreground">Liv handles:</span> treatment-aware copy,
          product match, channel, and memory — staff only sends when you choose draft mode.
        </p>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Post-session follow-up</Label>
            <p className="text-xs text-muted-foreground">Master gate for aftercare messages</p>
          </div>
          <Switch
            checked={care.aftercareEnabled}
            onCheckedChange={(v) => setCare({ ...care, aftercareEnabled: v })}
            data-testid="guest-care-aftercare-enabled"
          />
        </div>

        <div className="grid gap-2">
          <Label>Send mode</Label>
          <Select
            value={care.aftercareMode}
            disabled={!care.aftercareEnabled}
            onValueChange={(v) =>
              setCare({ ...care, aftercareMode: v as GuestCareAutomation["aftercareMode"] })
            }
          >
            <SelectTrigger data-testid="aftercare-mode-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(AFTERCARE_MODE_OWNER_COPY) as GuestCareAutomation["aftercareMode"][]).map(
                (mode) => (
                  <SelectItem key={mode} value={mode}>
                    {AFTERCARE_MODE_OWNER_COPY[mode].label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{modeCopy.description}</p>
          <p className="text-[11px] text-muted-foreground/90">{modeCopy.livRole}</p>
        </div>

        <div className="grid gap-2">
          <Label>Timing</Label>
          <Select
            value={care.aftercareDelay}
            disabled={!care.aftercareEnabled || care.aftercareMode === "manual_only"}
            onValueChange={(v) =>
              setCare({ ...care, aftercareDelay: v as GuestCareAutomation["aftercareDelay"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2h">~2 hours after complete</SelectItem>
              <SelectItem value="same_evening">Same evening</SelectItem>
              <SelectItem value="next_morning">Next morning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Retail mention in aftercare</Label>
            <p className="text-xs text-muted-foreground">
              Liv may quietly suggest one relevant mini-store SKU — never invents products
            </p>
          </div>
          <Switch
            checked={care.retailAftercareEnabled}
            disabled={!care.aftercareEnabled}
            onCheckedChange={(v) => setCare({ ...care, retailAftercareEnabled: v })}
            data-testid="guest-care-retail-aftercare"
          />
        </div>

        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save guest care"}
        </Button>
      </CardContent>
    </Card>
  );
}
