import { useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RunningLateCard() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [minutes, setMinutes] = useState("15");
  const [loading, setLoading] = useState(false);

  async function broadcast() {
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
    } catch {
      toast({ title: "Could not queue broadcast", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Running late
        </CardTitle>
        <CardDescription>SMS today's confirmed bookings (Scenario 07).</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3 items-end">
        <div className="space-y-1">
          <Label>Minutes late</Label>
          <Input type="number" min={1} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>
        <Button onClick={() => void broadcast()} disabled={loading}>
          Notify clients
        </Button>
      </CardContent>
    </Card>
  );
}
