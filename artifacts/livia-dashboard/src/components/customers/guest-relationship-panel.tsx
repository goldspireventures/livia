import { Link } from "wouter";
import { useGetCustomerRelationship } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle } from "lucide-react";
import { formatDateTime } from "@/lib/format";

const STAGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  trusted: "default",
  active: "default",
  new: "secondary",
  prospect: "outline",
  at_risk: "destructive",
  lapsed: "destructive",
};

/** Bilateral relationship card — what the business sees; mirrors guest `/my` depth. */
export function GuestRelationshipPanel({
  businessId,
  customerId,
  customerPhone,
}: {
  businessId: string;
  customerId: string;
  customerPhone?: string | null;
}) {
  const { data, isLoading } = useGetCustomerRelationship(businessId, customerId, {
    query: { enabled: !!businessId && !!customerId } as never,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4 text-xs text-muted-foreground">Loading relationship…</CardContent>
      </Card>
    );
  }
  if (!data) return null;

  const rel = data as {
    stage?: string;
    stageLabel?: string;
    headline?: string;
    memoryHighlight?: string | null;
    completedVisits?: number;
    totalBookings?: number;
    conversationCount?: number;
    nextBookingAt?: string | null;
    signals?: string[];
    trajectory?: string;
  };

  return (
    <Card data-testid="guest-relationship-panel">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Guest relationship</h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {rel.stageLabel ? (
            <Badge variant={STAGE_VARIANT[rel.stage ?? ""] ?? "outline"} className="text-[10px]">
              {rel.stageLabel}
            </Badge>
          ) : null}
          {rel.trajectory && rel.trajectory !== "unknown" ? (
            <Badge variant="outline" className="text-[10px] capitalize">
              {rel.trajectory}
            </Badge>
          ) : null}
          {(rel.conversationCount ?? 0) > 0 ? (
            <Link
              href="/inbox"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
            >
              <MessageCircle className="h-3 w-3" />
              {rel.conversationCount} thread{rel.conversationCount === 1 ? "" : "s"}
            </Link>
          ) : null}
        </div>

        {rel.headline ? (
          <p className="text-sm text-muted-foreground leading-snug">{rel.headline}</p>
        ) : null}

        {rel.memoryHighlight ? (
          <p className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
            {rel.memoryHighlight}
          </p>
        ) : null}

        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Completed visits</dt>
            <dd className="font-medium tabular-nums">{rel.completedVisits ?? 0}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Total bookings</dt>
            <dd className="font-medium tabular-nums">{rel.totalBookings ?? 0}</dd>
          </div>
          {rel.nextBookingAt ? (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Next visit</dt>
              <dd className="font-medium">{formatDateTime(rel.nextBookingAt)}</dd>
            </div>
          ) : null}
        </dl>

        {rel.signals && rel.signals.length > 0 ? (
          <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc pl-4">
            {rel.signals.slice(0, 4).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : null}

        {customerPhone ? (
          <p className="text-[10px] text-muted-foreground border-t border-border/60 pt-3">
            On their phone, this guest sees visits and memory in{" "}
            <Link href="/my" className="text-primary hover:underline">
              My Livia
            </Link>{" "}
            when signed in with {customerPhone}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
