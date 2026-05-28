import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";

type PeerInsights = {
  available: boolean;
  peerCount?: number;
  required?: number;
  message?: string;
  disclaimer?: string;
  benchmarks?: {
    avgBookingsPerWeek: number;
    noShowRatePct: number;
    voiceBookingSharePct: number;
  };
};

export default function PeerInsightsControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PeerInsights | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!bid) return;
    setLoading(true);
    try {
      setData(await customFetch<PeerInsights>(`/api/businesses/${bid}/peer-insights`));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  async function checkoutAddon() {
    setBusy(true);
    try {
      const res = await customFetch<{ url?: string; mode?: string; message?: string }>(
        `/api/businesses/${bid}/billing/checkout-peer-insights`,
        { method: "POST" },
      );
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      toast({ title: res.message ?? "Add-on activated" });
      await load();
    } catch {
      toast({ title: "Checkout failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function optIn() {
    setBusy(true);
    try {
      await customFetch(`/api/businesses/${bid}/peer-insights/opt-in`, { method: "POST" });
      toast({ title: "Opted in to anonymized peer benchmarks" });
      await load();
    } catch {
      toast({ title: "Opt-in failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  if (!bid) return null;
  if (loading && !data) return <Skeleton className="h-40 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Peer insights
        </CardTitle>
        <CardDescription>
          Anonymized benchmarks for your vertical (€49/mo add-on, k≥10 shops).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.available && data.benchmarks ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Avg bookings / week</dt>
              <dd className="text-lg font-semibold">{data.benchmarks.avgBookingsPerWeek}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">No-show rate</dt>
              <dd className="text-lg font-semibold">{data.benchmarks.noShowRatePct}%</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Voice share</dt>
              <dd className="text-lg font-semibold">{data.benchmarks.voiceBookingSharePct}%</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{data?.message ?? "Unavailable."}</p>
        )}
        {data?.disclaimer ? (
          <p className="text-xs text-muted-foreground">{data.disclaimer}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => checkoutAddon()}>
            Add-on (€49/mo)
          </Button>
          <Button disabled={busy} onClick={() => optIn()}>
            Opt in to benchmarks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
