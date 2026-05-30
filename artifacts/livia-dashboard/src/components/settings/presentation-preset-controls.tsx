import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette } from "lucide-react";
import { applyPresentationTheme } from "@/lib/experience-theme";

type PresentationPreset = {
  id: string;
  label: string;
  description: string;
  cssPreset: string;
};

type PresentationPayload = {
  presetId: string;
  preset: PresentationPreset;
  brandAccentHex: string | null;
  presetsEnabled: boolean;
  availablePresets: PresentationPreset[];
};

export function presentationPresetsUiEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_PRESENTATION_PRESETS === "true") return true;
  if (typeof window !== "undefined" && window.location.hostname.includes("staging")) return true;
  return false;
}

export function PresentationPresetControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [data, setData] = useState<PresentationPayload | null>(null);
  const [presetId, setPresetId] = useState("");
  const [accent, setAccent] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!bid || !presentationPresetsUiEnabled()) return;
    void customFetch<PresentationPayload>(`/api/businesses/${bid}/presentation`)
      .then((d) => {
        setData(d);
        setPresetId(d.presetId);
        setAccent(d.brandAccentHex ?? "");
        applyPresentationTheme({ cssPreset: d.preset.cssPreset, brandAccentHex: d.brandAccentHex });
      })
      .catch(() => setData(null));
  }, [bid]);

  if (!presentationPresetsUiEnabled() || !data?.presetsEnabled) return null;

  async function save() {
    if (!bid) return;
    setBusy(true);
    try {
      const updated = await customFetch<PresentationPayload>(`/api/businesses/${bid}/presentation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationPresetId: presetId,
          brandAccentHex: accent.trim() || null,
        }),
      });
      setData(updated);
      applyPresentationTheme({
        cssPreset: updated.preset.cssPreset,
        brandAccentHex: updated.brandAccentHex,
      });
      toast({ title: "Appearance updated" });
    } catch {
      toast({ title: "Could not save appearance", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card data-testid="presentation-preset-panel">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Appearance (staging)
        </CardTitle>
        <CardDescription>
          Platform Default is the signup skin. Preset picker is staging-only until prod promotion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Preset</Label>
          <Select value={presetId} onValueChange={setPresetId}>
            <SelectTrigger data-testid="presentation-preset-select">
              <SelectValue placeholder="Choose preset" />
            </SelectTrigger>
            <SelectContent>
              {data.availablePresets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {data.availablePresets.find((p) => p.id === presetId)?.description}
          </p>
        </div>
        <div className="space-y-2">
          <Label>Brand accent (optional)</Label>
          <Input
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            placeholder="#D4A72C"
            data-testid="presentation-accent-input"
          />
        </div>
        <Button onClick={() => void save()} disabled={busy} data-testid="presentation-save">
          {busy ? "Saving…" : "Save appearance"}
        </Button>
      </CardContent>
    </Card>
  );
}
