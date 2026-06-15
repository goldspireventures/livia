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
import { formatDateTime } from "@/lib/format";
import { clientGuestBookAbsoluteUrl } from "@/lib/guest-book-url";
import {
  GUEST_HUB_COPY,
  GUEST_PREFERRED_MODALITY_LABELS,
  type GuestPreferredModality,
} from "@workspace/policy";
import { useState } from "react";

const MODALITIES = Object.keys(GUEST_PREFERRED_MODALITY_LABELS) as GuestPreferredModality[];

type PackageCreditRow = {
  ledgerId: string;
  businessName: string;
  slug: string;
  packageName: string;
  creditsRemaining: number;
  creditsTotal: number;
  expiresAt: string | null;
  redemptionCode: string | null;
};

export function GuestHubAccountSettings({
  hubToken,
  phoneE164,
  preferredModality,
  packageCredits,
  onPreferredUpdated,
}: {
  hubToken: string;
  phoneE164: string;
  preferredModality: GuestPreferredModality;
  packageCredits: PackageCreditRow[];
  onPreferredUpdated: (next: GuestPreferredModality) => void;
}) {
  const [channel, setChannel] = useState(preferredModality);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function saveChannel() {
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch("/api/public/guest-hub/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Hub-Token": hubToken,
        },
        body: JSON.stringify({ preferredModality: channel }),
      });
      if (!r.ok) throw new Error("save");
      onPreferredUpdated(channel);
    } catch {
      setErr("Could not save — try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4" id="account-settings" data-testid="guest-hub-account-settings">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{GUEST_HUB_COPY.accountSection}</CardTitle>
          <CardDescription>{GUEST_HUB_COPY.accountSectionBody}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Signed in as</Label>
              <p className="text-sm font-mono mt-1 tabular-nums">{phoneE164}</p>
            </div>
            <div className="grid gap-2">
              <Label>{GUEST_HUB_COPY.commsChannelLabel}</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as GuestPreferredModality)}>
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
              {err ? <p className="text-xs text-destructive">{err}</p> : null}
              <Button
                size="sm"
                className="w-fit"
                disabled={saving || channel === preferredModality}
                onClick={() => void saveChannel()}
                data-testid="guest-channel-save"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 space-y-3">
            <p className="text-sm font-medium">{GUEST_HUB_COPY.packageCreditsSection}</p>
            {packageCredits.length > 0 ? (
              packageCredits.map((p) => (
                <div
                  key={p.ledgerId}
                  className="rounded-lg border border-border/70 px-3 py-3 text-sm"
                >
                  <p className="font-medium">{p.businessName}</p>
                  <p className="text-muted-foreground">{p.packageName}</p>
                  <p className="mt-1 tabular-nums">
                    {p.creditsRemaining} of {p.creditsTotal} sessions left
                  </p>
                  {p.expiresAt ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires {formatDateTime(p.expiresAt)}
                    </p>
                  ) : null}
                  {p.slug ? (
                    <a
                      href={clientGuestBookAbsoluteUrl(p.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs mt-2 inline-block font-medium"
                    >
                      Book a session →
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">{GUEST_HUB_COPY.packageCreditsEmpty}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
