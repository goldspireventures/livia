import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { Network } from "lucide-react";

type FranchiseRollup = {
  franchiseeCount: number;
  franchisees: Array<{
    businessId: string;
    name: string;
    slug: string;
    city: string | null;
    royaltyBps: number;
    bookingsThisWeek: number;
    revenueMinor: number;
  }>;
};

export default function FranchisePage() {
  const [rollup, setRollup] = useState<FranchiseRollup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await customFetch<FranchiseRollup>("/api/me/franchise-rollup");
        if (!cancelled) setRollup(data);
      } catch {
        if (!cancelled) setRollup(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Skeleton className="h-64 m-6" />;

  return (
    <div className="space-y-6 max-w-4xl" data-testid="franchise-page">
      <PersonaRitualHeader
        variant="page"
        title="Franchise network"
        subtitle="Aggregated signal across franchisees — no customer PII crosses the franchisor wall."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Franchisees</CardDescription>
            <CardTitle className="text-3xl">{rollup?.franchiseeCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Royalty (default)</CardDescription>
            <CardTitle className="text-3xl">5%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Per-link bps on franchise agreement.</p>
          </CardContent>
        </Card>
      </div>

      {rollup?.franchisees.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="h-4 w-4" />
              No franchise links yet
            </CardTitle>
            <CardDescription>
              Link franchisee businesses from ops or onboarding — rollup appears here with bookings
              and revenue aggregates only.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {(rollup?.franchisees ?? []).map((f) => (
            <Card key={f.businessId}>
              <CardContent className="flex justify-between items-center py-4">
                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.slug}
                    {f.city ? ` · ${f.city}` : ""} · royalty {(f.royaltyBps / 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{f.bookingsThisWeek} bookings (7d)</p>
                  <p className="text-muted-foreground">€{(f.revenueMinor / 100).toFixed(0)} rollup</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
