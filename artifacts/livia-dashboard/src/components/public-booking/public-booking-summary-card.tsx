import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";

import { GuestMoneyBreakdown } from "@/components/public-booking/guest-money-breakdown";

export function PublicBookingSummaryCard({
  serviceName,
  startAt,
  durationMinutes,
  priceMinor,
  currency,
  serviceNoun = "Service",
  depositDueMinor = 0,
  depositPercent,
  depositPolicySummary,
  className,
}: {
  serviceName: string;
  startAt: string;
  durationMinutes: number;
  priceMinor: number;
  currency: string;
  serviceNoun?: string;
  depositDueMinor?: number;
  depositPercent?: number;
  depositPolicySummary?: string | null;
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
        <GuestMoneyBreakdown
          priceMinor={priceMinor}
          currency={currency}
          depositPercent={depositPercent ?? 0}
          depositDueMinor={depositDueMinor}
          depositRequired={depositDueMinor > 0}
          dueLabel={
            depositPolicySummary?.trim() ||
            `${depositPercent ?? 0}% deposit holds your slot — pay by card after you confirm.`
          }
        />
      </CardContent>
    </Card>
  );
}
