import { formatCurrency } from "@/lib/format";

/** Inline deposit / total rows — embed inside any guest summary card. */
export function GuestMoneyBreakdown({
  priceMinor,
  currency,
  depositPercent = 0,
  depositDueMinor = 0,
  depositPaidMinor = 0,
  depositRequired = false,
  dueLabel = "Due now",
}: {
  priceMinor: number;
  currency: string;
  depositPercent?: number;
  depositDueMinor?: number;
  depositPaidMinor?: number;
  depositRequired?: boolean;
  dueLabel?: string;
}) {
  const depositTargetMinor =
    depositRequired && depositPercent > 0
      ? Math.round((priceMinor * depositPercent) / 100)
      : 0;
  const hasDeposit = depositRequired && depositTargetMinor > 0;
  const balanceMinor = hasDeposit ? Math.max(0, priceMinor - depositTargetMinor) : 0;

  return (
    <div className="space-y-1.5 pt-2 border-t border-border" data-testid="guest-money-breakdown">
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span className="text-primary tabular-nums">{formatCurrency(priceMinor, currency)}</span>
      </div>
      {hasDeposit ? (
        <>
          {depositPaidMinor > 0 ? (
            <div className="flex justify-between text-sm text-primary">
              <span>Paid</span>
              <span className="tabular-nums">{formatCurrency(depositPaidMinor, currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deposit due now</span>
            <span className="font-medium text-primary tabular-nums" data-testid="guest-pay-due">
              {formatCurrency(depositDueMinor, currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance at visit</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(balanceMinor, currency)}
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">No deposit required.</p>
      )}
      {hasDeposit && depositDueMinor > 0 ? (
        <p className="text-xs text-muted-foreground leading-snug pt-0.5">
          {dueLabel}
        </p>
      ) : null}
    </div>
  );
}
