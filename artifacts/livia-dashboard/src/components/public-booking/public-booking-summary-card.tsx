import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";

export function PublicBookingSummaryCard({
  serviceName,
  startAt,
  durationMinutes,
  priceMinor,
  currency,
  serviceNoun = "Service",
  className,
}: {
  serviceName: string;
  startAt: string;
  durationMinutes: number;
  priceMinor: number;
  currency: string;
  serviceNoun?: string;
  className?: string;
}) {
  return (
    <Card className={className ?? "bg-muted/50"} data-testid="public-booking-summary-card">
      <CardContent className="pt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">{serviceNoun}</span>
          <span className="font-medium text-right">{serviceName}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Date & time</span>
          <span className="font-medium text-right">
            {formatDate(startAt)} {formatTime(startAt)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium">{durationMinutes} min</span>
        </div>
        <div className="flex justify-between font-semibold pt-2 border-t border-border">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(priceMinor, currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
