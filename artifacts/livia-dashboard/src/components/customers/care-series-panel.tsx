import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type CareSeriesRow = {
  id: string;
  name: string;
  sessionsTotal: number;
  sessionsCompleted: number;
  cadenceDays: number;
  status: string;
  sessions: Array<{ sessionNumber: number; status: string; bookingId: string | null }>;
};

export function CareSeriesPanel({
  customerId,
  canEdit,
}: {
  customerId: string;
  canEdit: boolean;
}) {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [series, setSeries] = useState<CareSeriesRow[]>([]);
  const [name, setName] = useState("Treatment plan");
  const [sessionsTotal, setSessionsTotal] = useState("6");
  const [serviceId, setServiceId] = useState("");

  async function reload() {
    if (!business?.id) return;
    try {
      const rows = await customFetch<CareSeriesRow[]>(
        `/api/businesses/${business.id}/care-series?customerId=${customerId}`,
      );
      setSeries(rows);
    } catch {
      setSeries([]);
    }
  }

  useEffect(() => {
    void reload();
  }, [business?.id, customerId]);

  async function createSeries() {
    if (!business?.id || !serviceId.trim()) return;
    try {
      await customFetch(`/api/businesses/${business.id}/care-series`, {
        method: "POST",
        body: JSON.stringify({
          customerId,
          name: name.trim(),
          serviceId: serviceId.trim(),
          sessionsTotal: Number.parseInt(sessionsTotal, 10) || 6,
          cadenceDays: 14,
        }),
      });
      toast({ title: "Care series created" });
      void reload();
    } catch {
      toast({ title: "Failed to create series", variant: "destructive" });
    }
  }

  async function bookNext(s: CareSeriesRow) {
    if (!business?.id) return;
    const nextNum = s.sessionsCompleted + 1;
    if (nextNum > s.sessionsTotal) return;
    try {
      const sug = await customFetch<{ suggestedStartAt: string | null }>(
        `/api/businesses/${business.id}/care-series/${s.id}/next-suggestion`,
      );
      const startAt = sug.suggestedStartAt ?? new Date().toISOString();
      await customFetch(`/api/businesses/${business.id}/care-series/${s.id}/book-session`, {
        method: "POST",
        body: JSON.stringify({ sessionNumber: nextNum, startAt }),
      });
      toast({ title: `Session ${nextNum} booked` });
      void reload();
    } catch {
      toast({ title: "Booking failed", variant: "destructive" });
    }
  }

  if (!business) return null;
  if (series.length === 0 && !canEdit) return null;

  return (
    <Card data-testid="customer-care-series-panel">
      <CardHeader>
        <CardTitle className="text-base">Care series</CardTitle>
        <CardDescription>Multi-session plans (physio, allied health, packages).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {series.map((s) => (
          <div key={s.id} className="border rounded-md p-3 space-y-2">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.sessionsCompleted}/{s.sessionsTotal} sessions · every {s.cadenceDays} days ·{" "}
                  {s.status}
                </p>
              </div>
              {canEdit && s.sessionsCompleted < s.sessionsTotal ? (
                <Button size="sm" variant="outline" onClick={() => void bookNext(s)}>
                  Book next
                </Button>
              ) : null}
            </div>
          </div>
        ))}
        {canEdit ? (
          <SettingsDisclosure
            title="Start a care series"
            description="Multi-session plans for physio and allied health."
            defaultOpen={series.length === 0}
          >
            <div className="space-y-3 pt-1">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Plan name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sessions</Label>
                  <Input value={sessionsTotal} onChange={(e) => setSessionsTotal(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Service ID</Label>
                  <Input value={serviceId} onChange={(e) => setServiceId(e.target.value)} />
                </div>
              </div>
              <Button size="sm" onClick={() => void createSeries()}>
                Start series
              </Button>
            </div>
          </SettingsDisclosure>
        ) : null}
      </CardContent>
    </Card>
  );
}
