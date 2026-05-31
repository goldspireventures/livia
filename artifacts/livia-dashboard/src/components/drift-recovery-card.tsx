import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRoundSearch } from "lucide-react";

type DriftRow = {
  customerId: string;
  customerName: string;
  lastServiceName: string | null;
  lastVisitAt: string;
  daysSinceVisit: number;
};

export function DriftRecoveryCard() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const [rows, setRows] = useState<DriftRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bid) return;
    setLoading(true);
    apiFetch<{ candidates: DriftRow[] }>(`/businesses/${bid}/bookings/drift-candidates?limit=5`)
      .then((d) => setRows(d.candidates ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [bid]);

  if (!bid || (!loading && rows.length === 0)) return null;

  return (
    <Card className="border-primary/20 bg-primary/5" data-testid="drift-recovery-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UserRoundSearch className="h-4 w-4 text-primary" />
          Clients to win back
        </CardTitle>
        <CardDescription>
          Lapsed regulars (90+ days since last visit, no upcoming booking). Ask Liv to draft a
          re-engagement message in inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Scanning visit history…</p>
        ) : (
          rows.map((r) => (
            <div
              key={r.customerId}
              className="flex items-center justify-between gap-2 text-sm border rounded-md px-3 py-2"
            >
              <div>
                <p className="font-medium">{r.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {r.lastServiceName ?? "Last visit"} · {r.daysSinceVisit}d ago
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/inbox">Ask Liv</Link>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
