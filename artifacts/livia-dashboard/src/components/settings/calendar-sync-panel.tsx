import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type SyncStatus = {
  connected: boolean;
  lastSyncAt: string | null;
  lastImportedBusy: number;
  lastPushedBookings: number;
  note: string;
};

type Props = {
  businessId: string;
  calendarConnected: boolean;
};

export function CalendarSyncPanel({ businessId, calendarConnected }: Props) {
  const { toast } = useToast();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const row = await customFetch<SyncStatus>(`/api/businesses/${businessId}/calendar/sync-status`);
      setStatus(row);
    } catch {
      setStatus(null);
    }
  }

  useEffect(() => {
    if (!businessId) return;
    void refresh();
  }, [businessId, calendarConnected]);

  async function syncNow() {
    setBusy(true);
    try {
      const result = await customFetch<{
        ok: boolean;
        message: string;
        importedBusy: number;
        pushedBookings: number;
      }>(`/api/businesses/${businessId}/calendar/sync`, { method: "POST" });
      toast({ title: result.ok ? "Calendar synced" : "Sync skipped", description: result.message });
      await refresh();
    } catch {
      toast({ title: "Sync failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  const connected = calendarConnected || status?.connected;

  return (
    <SettingsDisclosure
      title="Google Calendar"
      description={
        connected
          ? status?.lastSyncAt
            ? `Last sync ${new Date(status.lastSyncAt).toLocaleString()} · Liv works in the background`
            : "Connected — sync once and Liv keeps calendars aligned"
          : "Two-way sync — beats juggling Acuity and a personal calendar"
      }
      defaultOpen={connected}
      data-testid="calendar-sync-panel"
    >
      <div className="space-y-3 pt-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {status?.note ??
            "External busy time blocks Livia slots automatically. New bookings appear on your Google Calendar — no duplicate entry."}
        </p>
        {connected ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">Connected</Badge>
            {typeof status?.lastImportedBusy === "number" ? (
              <Badge variant="secondary">{status.lastImportedBusy} external blocks</Badge>
            ) : null}
            {typeof status?.lastPushedBookings === "number" ? (
              <Badge variant="secondary">{status.lastPushedBookings} pushed bookings</Badge>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Use <strong>Connect calendar</strong> in the migration panel above, then sync here.
          </p>
        )}
        <Button
          type="button"
          size="sm"
          variant={connected ? "default" : "outline"}
          disabled={busy || !connected}
          onClick={() => void syncNow()}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {busy ? "Syncing…" : "Sync now"}
        </Button>
      </div>
    </SettingsDisclosure>
  );
}
