import { useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Loader2 } from "lucide-react";

type Props = {
  /** When set, default mode is single appointment */
  bookingId?: string;
  customerName?: string;
  trigger?: React.ReactNode;
  defaultMinutes?: number;
};

export function RunningLateSheet({
  bookingId,
  customerName,
  trigger,
  defaultMinutes = 15,
}: Props) {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(String(defaultMinutes));
  const [loading, setLoading] = useState(false);

  async function notifyOne() {
    const bid = business?.id;
    if (!bid || !bookingId) return;
    setLoading(true);
    try {
      await apiFetch(`/businesses/${bid}/bookings/${bookingId}/running-late`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutesLate: Number(minutes) || 15 }),
      });
      toast({
        title: "Customer notified",
        description: customerName ? `${customerName} will get an SMS if channels are live.` : undefined,
      });
      setOpen(false);
    } catch {
      toast({ title: "Could not send", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function notifyToday() {
    const bid = business?.id;
    if (!bid) return;
    setLoading(true);
    try {
      await apiFetch(`/businesses/${bid}/bookings/running-late-broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutesLate: Number(minutes) || 15 }),
      });
      toast({ title: "Running-late messages queued for today's clients" });
      setOpen(false);
    } catch {
      toast({ title: "Could not queue broadcast", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" data-testid="running-late-trigger">
            <Clock className="h-4 w-4 mr-2" />
            Running late
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Running late</SheetTitle>
          <SheetDescription>
            Notify customers by SMS when you have Twilio configured. Liv logs every send.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Minutes late</Label>
            <Input
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              data-testid="running-late-minutes"
            />
          </div>
          {bookingId ? (
            <Button
              className="w-full"
              onClick={() => void notifyOne()}
              disabled={loading}
              data-testid="running-late-this-appointment"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              This appointment{customerName ? ` · ${customerName}` : ""}
            </Button>
          ) : null}
          <Button
            variant={bookingId ? "outline" : "default"}
            className="w-full"
            onClick={() => void notifyToday()}
            disabled={loading}
            data-testid="running-late-today"
          >
            All confirmed appointments today
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
