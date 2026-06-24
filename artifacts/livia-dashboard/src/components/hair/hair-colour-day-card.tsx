import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, Loader2 } from "lucide-react";
import { PendingWhyLine } from "@/components/booking/pending-why-line";

type ColourRow = {
  bookingId: string;
  startAt: string;
  endAt: string;
  status: string;
  pendingReason: string | null;
  serviceName: string;
  durationMinutes: number;
  customerName: string;
  staffDisplayName: string | null;
  needsDeposit: boolean;
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function HairColourDayCard() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const [rows, setRows] = useState<ColourRow[]>([]);
  const [blockCount, setBlockCount] = useState(0);
  const [pendingDepositCount, setPendingDepositCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!bid || vertical !== "hair") return;
    setLoading(true);
    apiFetch<{ blockCount: number; pendingDepositCount: number; rows: ColourRow[] }>(
      `/businesses/${bid}/hair/colour-day`,
    )
      .then((d) => {
        setBlockCount(d.blockCount ?? 0);
        setPendingDepositCount(d.pendingDepositCount ?? 0);
        setRows(d.rows ?? []);
      })
      .catch(() => {
        setBlockCount(0);
        setPendingDepositCount(0);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [bid, vertical]);

  useEffect(() => {
    load();
  }, [load]);

  if (vertical !== "hair" || !bid) return null;
  if (!loading && blockCount === 0 && rows.length === 0) return null;

  return (
    <Card data-testid="hair-colour-day-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
          Colour-day flight plan
        </CardTitle>
        <CardDescription>
          {loading
            ? "Loading today's colour blocks…"
            : blockCount === 0
              ? "No long colour blocks on today's board."
              : `${blockCount} block${blockCount === 1 ? "" : "s"} today${
                  pendingDepositCount > 0
                    ? ` · ${pendingDepositCount} awaiting deposit`
                    : ""
                }`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? null : (
          <ul className="space-y-2">
            {rows.slice(0, 6).map((row) => (
              <li
                key={row.bookingId}
                className="rounded-lg border border-border/70 px-3 py-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{row.customerName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {row.serviceName}
                      {row.staffDisplayName ? ` · ${row.staffDisplayName}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums shrink-0">
                    {formatTime(row.startAt)}
                  </span>
                </div>
                {row.needsDeposit ? (
                  <PendingWhyLine reason={row.pendingReason} vertical="hair" className="mt-1" />
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {blockCount > 0 ? (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/bookings">Open calendar</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
