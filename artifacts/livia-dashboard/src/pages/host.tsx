import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { Armchair, Check, Link2 } from "lucide-react";

type HostDashboard = {
  activeChairs: number;
  totalChairs: number;
  rentDueCount: number;
  rentDueTotalMinor: number;
  renters: Array<{
    id: string;
    chairLabel: string;
    weeklyRentMinor: number;
    currency: string;
    rentStatus: string;
    isActive: boolean;
    renter: { id: string; name: string; slug: string };
  }>;
};

export default function HostPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [data, setData] = useState<HostDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [renterId, setRenterId] = useState("");
  const [chairLabel, setChairLabel] = useState("");
  const [weeklyRent, setWeeklyRent] = useState("");
  const [linking, setLinking] = useState(false);

  async function load() {
    if (!bid) return;
    setLoading(true);
    try {
      const res = await customFetch<HostDashboard>(`/api/businesses/${bid}/host/dashboard`);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  async function linkRenter() {
    if (!bid || !renterId.trim() || !chairLabel.trim()) return;
    setLinking(true);
    try {
      await customFetch(`/api/businesses/${bid}/host/renters`, {
        method: "POST",
        body: JSON.stringify({
          renterBusinessId: renterId.trim(),
          chairLabel: chairLabel.trim(),
          weeklyRentMinor: weeklyRent ? Math.round(parseFloat(weeklyRent) * 100) : 0,
        }),
      });
      toast({ title: "Renter linked" });
      setRenterId("");
      setChairLabel("");
      setWeeklyRent("");
      void load();
    } catch (e) {
      toast({
        title: "Could not link",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  }

  async function markPaid(linkId: string) {
    if (!bid) return;
    try {
      await customFetch(`/api/businesses/${bid}/host/renters/${linkId}`, {
        method: "PATCH",
        body: JSON.stringify({ rentStatus: "paid" }),
      });
      void load();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  const formatMoney = (minor: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);

  return (
    <div className="space-y-6 max-w-3xl">
      <PersonaRitualHeader
        variant="page"
        title="Host floor"
        subtitle="Chair occupancy and rent — renter client lists stay private to each stylist."
      />

      {loading && !data ? (
        <Skeleton className="h-48" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active chairs</CardDescription>
                <CardTitle className="text-3xl">{data?.activeChairs ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rent due</CardDescription>
                <CardTitle className="text-3xl">{data?.rentDueCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Due this week</CardDescription>
                <CardTitle className="text-2xl">
                  {formatMoney(data?.rentDueTotalMinor ?? 0, business?.currency ?? "EUR")}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Link a renter business
              </CardTitle>
              <CardDescription>
                Each renter is their own Livia business. Paste their business id after they sign up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Renter business id</Label>
                <Input value={renterId} onChange={(e) => setRenterId(e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Chair label</Label>
                  <Input
                    placeholder="Chair 3 — window"
                    value={chairLabel}
                    onChange={(e) => setChairLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weekly rent ({business?.currency ?? "EUR"})</Label>
                  <Input
                    type="number"
                    placeholder="175"
                    value={weeklyRent}
                    onChange={(e) => setWeeklyRent(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={() => void linkRenter()} disabled={linking}>
                Link renter
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {data?.renters.map((r) => (
              <Card key={r.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Armchair className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{r.chairLabel}</p>
                      <p className="text-sm text-muted-foreground">{r.renter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(r.weeklyRentMinor, r.currency)} / week · {r.rentStatus}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {r.rentStatus === "due" ? (
                      <Button size="sm" variant="outline" onClick={() => void markPaid(r.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        Mark paid
                      </Button>
                    ) : null}
                    {r.isActive ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (!bid) return;
                          if (
                            !confirm(
                              "End this chair rental? The renter receives a full customer export — their CRM stays theirs.",
                            )
                          ) {
                            return;
                          }
                          try {
                            const result = await customFetch<{
                              portability: { customerCount: number };
                            }>(`/api/businesses/${bid}/host/renters/${r.id}/end`, {
                              method: "POST",
                            });
                            toast({
                              title: "Renter ended",
                              description: `${result.portability.customerCount} clients exported to renter.`,
                            });
                            void load();
                          } catch {
                            toast({ title: "End failed", variant: "destructive" });
                          }
                        }}
                      >
                        End rental
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(data?.renters.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No renters linked yet. Each stylist onboarded as their own business, then link here.
              </p>
            ) : null}
          </div>
        </>
      )}

      <Link href="/settings">
        <Button variant="ghost">Back to settings</Button>
      </Link>
    </div>
  );
}
