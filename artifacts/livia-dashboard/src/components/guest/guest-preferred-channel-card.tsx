import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  GUEST_PREFERRED_MODALITY_LABELS,
  type GuestPreferredModality,
} from "@workspace/policy";

const MODALITIES = Object.keys(GUEST_PREFERRED_MODALITY_LABELS) as GuestPreferredModality[];

export function GuestPreferredChannelCard({
  hubToken,
  preferredModality,
  onUpdated,
}: {
  hubToken: string;
  preferredModality: GuestPreferredModality;
  onUpdated: (next: GuestPreferredModality) => void;
}) {
  const [value, setValue] = useState(preferredModality);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch("/api/public/guest-hub/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Hub-Token": hubToken,
        },
        body: JSON.stringify({ preferredModality: value }),
      });
      if (!r.ok) throw new Error("save");
      onUpdated(value);
    } catch {
      setErr("Could not save preference");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card data-testid="guest-preferred-channel-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">How Liv reaches you</CardTitle>
        <CardDescription>
          Aftercare and follow-ups use this channel when possible — thread first when you&apos;ve
          messaged the studio in-app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2">
          <Label>Primary channel</Label>
          <Select value={value} onValueChange={(v) => setValue(v as GuestPreferredModality)}>
            <SelectTrigger data-testid="guest-channel-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODALITIES.map((m) => (
                <SelectItem key={m} value={m}>
                  {GUEST_PREFERRED_MODALITY_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {err ? <p className="text-xs text-destructive">{err}</p> : null}
        <Button
          size="sm"
          disabled={saving || value === preferredModality}
          onClick={() => void save()}
          data-testid="guest-channel-save"
        >
          {saving ? "Saving…" : "Save preference"}
        </Button>
      </CardContent>
    </Card>
  );
}
