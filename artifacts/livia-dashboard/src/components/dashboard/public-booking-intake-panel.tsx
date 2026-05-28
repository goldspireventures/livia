import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Globe, ChevronRight, Zap } from "lucide-react";
import { formatDate, formatTime } from "@/lib/format";
import { BookingSourceBadge } from "@/components/booking/booking-source-badge";
import { pendingReasonLabel } from "@/lib/booking-pending";

type IntakeFeed = {
  publicUrl: string | null;
  businessName: string | null;
  todayCount: number;
  weekCount: number;
  pendingCount: number;
  recent: Array<{
    id: string;
    status: string;
    pendingReason?: string | null;
    startAt: string;
    createdAt: string;
    serviceName: string | null;
    customerName: string;
    staffDisplayName: string | null;
    source: string;
  }>;
  automationSteps: Array<{ id: string; label: string }>;
};

export function PublicBookingIntakePanel({ businessId }: { businessId: string }) {
  const [feed, setFeed] = useState<IntakeFeed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<IntakeFeed>(`/businesses/${businessId}/public-intake`)
      .then((d) => {
        if (!cancelled) setFeed(d);
      })
      .catch(() => {
        if (!cancelled) setFeed(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (loading) {
    return (
      <Card data-testid="public-intake-panel">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!feed) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" data-testid="public-intake-panel">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" aria-hidden />
              From your public link
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-lg">
              Customers who book via the URL you share on socials and your site — not a Livia marketplace.
            </p>
          </div>
          {feed.publicUrl ? (
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <a href={feed.publicUrl} target="_blank" rel="noreferrer">
                Open page
                <ExternalLink className="h-3.5 w-3.5 ml-1" aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary" className="font-mono text-[10px]">
            {feed.todayCount} today
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px]">
            {feed.weekCount} this week
          </Badge>
          {feed.pendingCount > 0 ? (
            <Badge className="font-mono text-[10px]">{feed.pendingCount} need confirm</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {feed.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No public bookings yet — share{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{feed.publicUrl ?? "your link"}</code>{" "}
            on Instagram or your website.
          </p>
        ) : (
          <ul className="space-y-2">
            {feed.recent.map((b) => (
              <li key={b.id}>
                <Link href={`/bookings/${b.id}`}>
                  <div className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {b.serviceName ?? "Service"} · {formatDate(b.startAt)} {formatTime(b.startAt)}
                        {b.staffDisplayName ? ` · ${b.staffDisplayName}` : ""}
                      </p>
                      {b.pendingReason ? (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                          {pendingReasonLabel(b.pendingReason)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <BookingSourceBadge source={b.source} />
                      <Badge variant="outline" className="text-[10px]">
                        {b.status}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <p className="text-xs font-medium flex items-center gap-1.5 mb-2">
            <Zap className="h-3.5 w-3.5 text-primary" aria-hidden />
            What happens automatically
          </p>
          <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal pl-4">
            {feed.automationSteps.map((s) => (
              <li key={s.id}>{s.label}</li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
