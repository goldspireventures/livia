import { useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAvailableSlots, getGetBookingQueryKey } from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { apiFetch } from "@/lib/api-fetch";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  serviceId: string;
  staffId?: string | null;
  customerLabel: string;
  serviceName: string;
  currentStartAt: string;
};

function formatSlot(iso: string): string {
  try {
    return format(new Date(iso), "EEE d MMM · HH:mm");
  } catch {
    return iso;
  }
}

export function BookingRescheduleDialog({
  open,
  onOpenChange,
  bookingId,
  serviceId,
  staffId,
  customerLabel,
  serviceName,
  currentStartAt,
}: Props) {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bid = business?.id ?? "";
  const [date, setDate] = useState(() => format(new Date(currentStartAt), "yyyy-MM-dd"));
  const [selectedSlot, setSelectedSlot] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlots(
    bid,
    { serviceId, date, staffId: staffId || undefined },
    { query: { enabled: open && !!bid && !!serviceId && !!date } as never },
  );

  const slots = useMemo(() => {
    const raw =
      (slotsData as { slots?: { startAt: string; available: boolean }[] })?.slots ?? [];
    return raw.filter((s) => s.available);
  }, [slotsData]);

  async function save() {
    if (!bid || !selectedSlot) return;
    setSaving(true);
    try {
      await apiFetch(`/businesses/${bid}/bookings/${bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: selectedSlot }),
      });
      invalidateOperationalState(qc, bid);
      qc.invalidateQueries({ queryKey: getGetBookingQueryKey(bid, bookingId) });
      toast({
        title: "Appointment rescheduled",
        description: `${customerLabel} · ${formatSlot(selectedSlot)}. Tell them if channels are not live yet.`,
      });
      onOpenChange(false);
      setSelectedSlot("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not reschedule";
      toast({
        title: msg.includes("available") ? "Time not available" : "Could not reschedule",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="booking-reschedule-dialog">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>
            {customerLabel} · {serviceName}. Currently {formatSlot(currentStartAt)}. Pick a new
            time — the booking stays pending until you confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reschedule-date">Date</Label>
            <Input
              id="reschedule-date"
              type="date"
              value={date}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), 90), "yyyy-MM-dd")}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot("");
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Available times</Label>
            {slotsLoading ? (
              <p className="text-sm text-muted-foreground">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open slots this day — try another date or check rota and services.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {slots.map((slot) => (
                  <button
                    key={slot.startAt}
                    type="button"
                    data-testid={`reschedule-slot-${slot.startAt}`}
                    onClick={() => setSelectedSlot(slot.startAt)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm font-mono transition-colors",
                      selectedSlot === slot.startAt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    {format(new Date(slot.startAt), "HH:mm")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={!selectedSlot || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save new time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
