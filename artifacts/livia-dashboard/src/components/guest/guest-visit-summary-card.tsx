import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { GuestMoneyBreakdown } from "@/components/public-booking/guest-money-breakdown";

/** One home for visit facts + money on /my visit manage. */
export function GuestVisitSummaryCard({
  serviceName,
  startAt,
  staffDisplayName,
  status,
  currency,
  priceMinor,
  depositPercent,
  depositDueMinor,
  depositPaidMinor,
  depositRequired,
  depositLineLabel,
  depositPayUrl,
  timezone,
}: {
  serviceName: string;
  startAt: string;
  staffDisplayName?: string | null;
  status: string;
  currency: string;
  priceMinor?: number;
  depositPercent?: number;
  depositDueMinor?: number;
  depositPaidMinor?: number;
  depositRequired?: boolean;
  depositLineLabel?: string | null;
  depositPayUrl?: string | null;
  timezone?: string;
}) {
  const showMoney =
    typeof priceMinor === "number" &&
    priceMinor > 0 &&
    (depositRequired || (depositDueMinor ?? 0) > 0 || (depositPaidMinor ?? 0) > 0);

  return (
    <Card className="bg-muted/40" data-testid="guest-visit-summary-card">
      <CardContent className="pt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Treatment</span>
          <span className="font-medium text-right">{serviceName}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Date & time</span>
          <span className="font-medium text-right tabular-nums">
            {formatDate(startAt, timezone ? { timeZone: timezone } : undefined)}{" "}
            {formatTime(startAt, timezone ? { timeZone: timezone } : undefined)}
          </span>
        </div>
        {staffDisplayName ? (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">With</span>
            <span className="font-medium text-right">{staffDisplayName}</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span>Status</span>
          <span>{status}</span>
        </div>
        {showMoney ? (
          <GuestMoneyBreakdown
            priceMinor={priceMinor!}
            currency={currency}
            depositPercent={depositPercent ?? 0}
            depositDueMinor={depositDueMinor ?? 0}
            depositPaidMinor={depositPaidMinor ?? 0}
            depositRequired={depositRequired ?? false}
            dueLabel={depositLineLabel ?? undefined}
          />
        ) : depositLineLabel ? (
          <p className="text-sm text-muted-foreground pt-2 border-t border-border">
            {depositLineLabel}
          </p>
        ) : null}
        {depositPayUrl && (depositDueMinor ?? 0) > 0 ? (
          <Button asChild className="w-full mt-2" data-testid="guest-hub-visit-pay-deposit">
            <a href={depositPayUrl}>Pay deposit</a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
