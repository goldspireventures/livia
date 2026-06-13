import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import type { NotificationPrefs } from "@workspace/policy";

type Payload = {
  preferences: NotificationPrefs;
  pushConfigured?: boolean;
};

const TOGGLES: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  {
    key: "pushBookingCreated",
    label: "New bookings",
    hint: "When a client books (web, WhatsApp, Instagram, SMS, or Liv).",
  },
  {
    key: "pushBookingCancelled",
    label: "Cancellations",
    hint: "When an appointment is cancelled.",
  },
  {
    key: "pushBookingPending",
    label: "Pending approvals",
    hint: "When a booking needs your confirmation.",
  },
  {
    key: "pushInboxInbound",
    label: "Inbox messages",
    hint: "WhatsApp / Instagram / SMS — includes when Liv is replying.",
  },
  {
    key: "pushInboxHandoff",
    label: "Human handoff",
    hint: "Threads assigned to you after Liv hands off.",
  },
  {
    key: "pushLivBookingViaChannel",
    label: "Liv booked via chat",
    hint: "Highlight when Liv closes a booking from a DM thread.",
  },
  {
    key: "pushTwinRisk",
    label: "Twin risks",
    hint: "When Liv detects a business risk from your shop facts.",
  },
  {
    key: "pushTwinOpportunity",
    label: "Twin opportunities",
    hint: "When Liv spots upside in revenue, trust, or operations.",
  },
];

export function NotificationPreferencesControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    if (!bid) return;
    setLoading(true);
    apiFetch<Payload>(`/businesses/${bid}/notification-preferences`)
      .then((d) => setPrefs(d.preferences))
      .catch(() => setPrefs(null))
      .finally(() => setLoading(false));
  }, [bid]);

  async function save(next: NotificationPrefs) {
    if (!bid) return;
    setSaving(true);
    try {
      const d = await apiFetch<Payload>(`/businesses/${bid}/notification-preferences`, {
        method: "PATCH",
        body: JSON.stringify({ preferences: next }),
      });
      setPrefs(d.preferences);
      toast({ title: "Notification preferences saved" });
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!prefs) return null;

  return (
    <Card data-testid="notification-preferences-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Push & alerts
        </CardTitle>
        <CardDescription>
          Mobile: Expo push on sign-in. Web: allow notifications in the browser for background alerts (needs
          VAPID keys on the API). The amber strip always shows pending bookings and inbox handoffs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor={t.key}>{t.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t.hint}</p>
            </div>
            <Switch
              id={t.key}
              checked={prefs[t.key]}
              disabled={saving}
              onCheckedChange={(v) => {
                const next = { ...prefs, [t.key]: v };
                setPrefs(next);
                void save(next);
              }}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Copy uses your vertical (client / treatment / session labels). Staff on mobile must allow notifications
          when prompted.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={() => void save(prefs)}
        >
          Save again
        </Button>
      </CardContent>
    </Card>
  );
}
