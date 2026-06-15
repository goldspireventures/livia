import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";

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
  const hasDeposit = depositDueMinor > 0 && depositDueMinor < priceMinor;
  const balanceMinor = hasDeposit ? priceMinor - depositDueMinor : 0;

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
        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary tabular-nums">{formatCurrency(priceMinor, currency)}</span>
          </div>
          {hasDeposit ? (
            <>
              <div
                className="flex justify-between text-sm"
                data-testid="public-book-deposit-line"
              >
                <span className="text-muted-foreground">Deposit due now</span>
                <span className="font-medium text-primary tabular-nums">
                  {formatCurrency(depositDueMinor, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance at visit</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(balanceMinor, currency)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug pt-0.5">
                {depositPolicySummary?.trim() ||
                  `${depositPercent ?? 0}% deposit holds your slot — pay by card after you confirm.`}
              </p>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
