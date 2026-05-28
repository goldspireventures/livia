import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircleWarning } from "lucide-react";

type StuckRow = {
  bookingId: string;
  startAt: string;
  customerName: string;
  serviceName: string;
  continuitySentAt: string | null;
};

export function StuckContinuityCard() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const [rows, setRows] = useState<StuckRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bid) return;
    setLoading(true);
    apiFetch<{ stuck: StuckRow[] }>(`/businesses/${bid}/bookings/stuck-continuity`)
      .then((d) => setRows(d.stuck ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [bid]);

  if (!bid || (!loading && rows.length === 0)) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5" data-testid="stuck-continuity-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircleWarning className="h-4 w-4 text-amber-600" />
          Bookings waiting on reply
        </CardTitle>
        <CardDescription>
          Web bookings where the client has not replied in the continuity thread (24h+).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Checking threads…</p>
        ) : (
          rows.slice(0, 5).map((r) => (
            <div
              key={r.bookingId}
              className="flex items-center justify-between gap-2 text-sm border rounded-md px-3 py-2"
            >
              <div>
                <p className="font-medium">{r.customerName || "Guest"}</p>
                <p className="text-xs text-muted-foreground">
                  {r.serviceName} · {new Date(r.startAt).toLocaleString()}
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/bookings/${r.bookingId}`}>Open</Link>
              </Button>
            </div>
          ))
        )}
        {rows.length > 5 ? (
          <p className="text-xs text-muted-foreground">+{rows.length - 5} more in bookings</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
